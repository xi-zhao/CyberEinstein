import {
  DEFAULT_OPENALEX_BASE_URL,
  FieldHistoryError,
  canonicalDoi,
  canonicalOpenAlexId,
  canonicalTopicId,
  dedupeStrings,
  integerOption,
  normalizeTitle,
  requireText,
  safeMessage,
  workId,
  workTitle,
} from './model.js';
import { FileResponseCache } from './cache.js';

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const NEGATIVE_CACHE_MARKER = 'cybereinstein_openalex_not_found';

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function retryAfterMilliseconds(response) {
  const value = response.headers?.get?.('retry-after');
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.max(0, timestamp - Date.now()) : null;
}

export class OpenAlexClient {
  constructor(options = {}) {
    this.fetch = options.fetch ?? globalThis.fetch;
    if (typeof this.fetch !== 'function') {
      throw new FieldHistoryError('CONFIGURATION_ERROR', 'fetch is unavailable');
    }
    this.baseUrl = new URL(options.baseUrl ?? DEFAULT_OPENALEX_BASE_URL).toString();
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.maxRetries = integerOption(options.maxRetries, 2, {
      name: 'OpenAlex max retries',
      maximum: 6,
    });
    this.retryBaseDelayMs = options.retryBaseDelayMs ?? 1_000;
    this.sleep = options.sleep ?? wait;
    this.cache = options.cache ?? (
      options.cacheDir
        ? new FileResponseCache({
            directory: options.cacheDir,
            ttlMs: options.cacheTtlMs,
            now: options.now,
          })
        : null
    );
    this.inflight = new Map();
    this.requestCount = 0;
    this.retryCount = 0;
    this.cacheHits = 0;
    this.cacheErrors = 0;
  }

  async resolveWork(input) {
    const value =
      typeof input === 'string'
        ? requireText(input, 'seed')
        : requireText(
            input?.openalexId ?? input?.doi ?? input?.title,
            'seed.openalexId, seed.doi, or seed.title',
          );
    const openalexId = canonicalOpenAlexId(value);
    if (openalexId) {
      return {
        work: await this.getWork(openalexId),
        input: value,
        resolution: 'openalex_id',
      };
    }
    const doi = canonicalDoi(value);
    if (doi) {
      return {
        work: await this.getWork(doi),
        input: value,
        resolution: 'doi',
      };
    }
    const response = await this.listWorks({
      search: value,
      per_page: 5,
      sort: 'relevance_score:desc',
    });
    const works = response.results ?? [];
    if (works.length === 0) {
      throw new FieldHistoryError(
        'SEED_NOT_FOUND',
        `OpenAlex found no work for title or query: ${value}`,
      );
    }
    const normalized = normalizeTitle(value);
    const exact = works.find((work) => normalizeTitle(workTitle(work)) === normalized);
    return {
      work: exact ?? works[0],
      input: value,
      resolution: exact ? 'exact_title' : 'title_candidate',
    };
  }

  async getWork(identifier) {
    const id = canonicalOpenAlexId(identifier) ?? canonicalDoi(identifier);
    requireText(id, 'OpenAlex work identifier');
    return this.#request(`works/${encodeURIComponent(id)}`);
  }

  async listWorks(parameters, requestOptions = {}) {
    return this.#request('works', parameters, requestOptions);
  }

  async getWorksByIds(ids) {
    const normalized = dedupeStrings(
      (ids ?? []).map(canonicalOpenAlexId).filter(Boolean),
    );
    const results = [];
    for (let index = 0; index < normalized.length; index += 50) {
      const chunk = normalized.slice(index, index + 50);
      const response = await this.listWorks({
        filter: `openalex:${chunk.join('|')}`,
        per_page: chunk.length,
      });
      results.push(...(response.results ?? []));
      const returned = new Set((response.results ?? []).map(workId).filter(Boolean));
      const missing = chunk.filter((id) => !returned.has(id)).slice(0, 10);
      if (missing.length > 0) {
        const recovered = await Promise.allSettled(
          missing.map((id) => this.getWork(id)),
        );
        for (const item of recovered) {
          if (item.status === 'fulfilled') results.push(item.value);
        }
      }
    }
    return [...new Map(results.map((work) => [workId(work), work])).values()];
  }

  async getCitingWorks(ids, options = {}) {
    const normalized = dedupeStrings(
      (Array.isArray(ids) ? ids : [ids])
        .map(canonicalOpenAlexId)
        .filter(Boolean),
    ).slice(0, 50);
    if (normalized.length === 0) return [];
    const limit = integerOption(options.limit, 50, {
      name: 'citation limit',
      maximum: 100,
    });
    if (limit === 0) return [];
    const response = await this.listWorks({
      filter: `cites:${normalized.join('|')}`,
      sort: options.sort ?? 'publication_date:desc',
      per_page: limit,
    });
    return response.results ?? [];
  }

  async getTopicWorks(topicIds, options = {}) {
    const normalized = dedupeStrings(
      (topicIds ?? []).map(canonicalTopicId).filter(Boolean),
    ).slice(0, 10);
    if (normalized.length === 0) return [];
    const filters = [`topics.id:${normalized.join('|')}`];
    if (options.fromDate) filters.push(`from_publication_date:${options.fromDate}`);
    if (options.toDate) filters.push(`to_publication_date:${options.toDate}`);
    if (options.type) filters.push(`type:${options.type}`);
    const limit = integerOption(options.limit, 50, {
      name: 'topic work limit',
      maximum: 100,
    });
    if (limit === 0) return [];
    const response = await this.listWorks({
      filter: filters.join(','),
      sort: options.sort ?? 'publication_date:desc',
      per_page: limit,
    });
    return response.results ?? [];
  }

  async #request(pathname, parameters = {}, requestOptions = {}) {
    const url = new URL(
      pathname,
      this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`,
    );
    for (const [key, value] of Object.entries(parameters)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
    const cacheKey = url.toString();
    if (this.cache) {
      const cached = await this.cache.get(cacheKey);
      if (cached !== undefined) {
        this.cacheHits += 1;
        if (cached?.marker === NEGATIVE_CACHE_MARKER) {
          throw new FieldHistoryError(
            'OPENALEX_ERROR',
            'OpenAlex returned HTTP 404 (cached)',
            cached.details,
          );
        }
        return cached;
      }
    }
    if (this.inflight.has(cacheKey)) {
      return structuredClone(await this.inflight.get(cacheKey));
    }
    const pending = this.#requestWithRetry(url, cacheKey, requestOptions);
    this.inflight.set(cacheKey, pending);
    try {
      return structuredClone(await pending);
    } finally {
      this.inflight.delete(cacheKey);
    }
  }

  async #requestWithRetry(url, cacheKey, requestOptions) {
    const headers = {
      accept: 'application/json',
      'user-agent': 'CyberEinstein-Field-History/0.3',
    };
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;
    let lastError;
    const maxRetries = requestOptions.maxRetries ?? this.maxRetries;
    const timeoutMs = requestOptions.timeoutMs ?? this.timeoutMs;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      this.requestCount += 1;
      let response;
      try {
        response = await this.fetch(url, {
          headers,
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch (error) {
        lastError = new FieldHistoryError(
          'OPENALEX_UNAVAILABLE',
          `OpenAlex request failed: ${safeMessage(error)}`,
        );
        if (attempt < maxRetries) {
          this.retryCount += 1;
          await this.sleep(this.retryBaseDelayMs * (2 ** attempt));
          continue;
        }
        throw lastError;
      }
      if (response.ok) {
        const body = await response.json();
        if (this.cache) {
          try {
            await this.cache.set(cacheKey, body);
          } catch {
            this.cacheErrors += 1;
          }
        }
        return body;
      }
      let details;
      try {
        details = await response.json();
      } catch {
        details = { status: response.status, statusText: response.statusText };
      }
      lastError = new FieldHistoryError(
        'OPENALEX_ERROR',
        `OpenAlex returned HTTP ${response.status}`,
        details,
      );
      if (!RETRYABLE_STATUS.has(response.status) || attempt === maxRetries) {
        if (response.status === 404 && this.cache) {
          try {
            await this.cache.set(
              cacheKey,
              { marker: NEGATIVE_CACHE_MARKER, details },
              { ttlMs: 6 * 60 * 60 * 1000 },
            );
          } catch {
            this.cacheErrors += 1;
          }
        }
        throw lastError;
      }
      this.retryCount += 1;
      await this.sleep(
        retryAfterMilliseconds(response) ?? this.retryBaseDelayMs * (2 ** attempt),
      );
    }
    throw lastError;
  }
}
