export const FIELD_HISTORY_SCHEMA_VERSION = '0.2.0';
export const DEFAULT_OPENALEX_BASE_URL = 'https://api.openalex.org';

export class FieldHistoryError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.name = 'FieldHistoryError';
    this.code = code;
    this.details = details;
  }
}

export function clone(value) {
  return structuredClone(value);
}

export function requireText(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new FieldHistoryError(
      'INVALID_ARGUMENT',
      `${field} must be a non-empty string`,
    );
  }
  return value.trim();
}

export function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function roundScore(value) {
  return Number(clamp(Number.isFinite(value) ? value : 0).toFixed(6));
}

export function integerOption(value, fallback, options = {}) {
  if (value === undefined) return fallback;
  const minimum = options.minimum ?? 0;
  const maximum = options.maximum ?? 100;
  if (!Number.isInteger(value) || value < minimum) {
    throw new FieldHistoryError(
      'INVALID_ARGUMENT',
      `${options.name ?? 'option'} must be an integer of at least ${minimum}`,
    );
  }
  return Math.min(value, maximum);
}

export function canonicalOpenAlexId(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/(?:https?:\/\/openalex\.org\/)?(W[0-9]+)$/i);
  return match ? match[1].toUpperCase() : null;
}

export function canonicalTopicId(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/(?:https?:\/\/openalex\.org\/)?(T[0-9]+)$/i);
  return match ? match[1].toUpperCase() : null;
}

export function canonicalDoi(value) {
  if (typeof value !== 'string') return null;
  const candidate = value
    .trim()
    .replace(/^doi:\s*/i, '')
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '');
  return /^10\.[0-9]{4,9}\/.+/i.test(candidate)
    ? `https://doi.org/${candidate.toLowerCase()}`
    : null;
}

export function normalizeTitle(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function workTitle(work) {
  return work?.title ?? work?.display_name ?? '';
}

export function workId(work) {
  return canonicalOpenAlexId(work?.id);
}

export function referenceIds(work) {
  return new Set(
    (work?.referenced_works ?? [])
      .map(canonicalOpenAlexId)
      .filter(Boolean),
  );
}

export function topicEntries(work) {
  return (work?.topics ?? [])
    .map((topic) => ({
      id: canonicalTopicId(topic?.id),
      name: topic?.display_name ?? '',
      score: roundScore(Number(topic?.score ?? 0)),
    }))
    .filter((topic) => topic.id && topic.name);
}

export function topicIds(work) {
  return new Set(topicEntries(work).map((topic) => topic.id));
}

export function reconstructAbstract(index) {
  if (!index || typeof index !== 'object') return null;
  const positioned = [];
  for (const [word, positions] of Object.entries(index)) {
    if (!Array.isArray(positions)) continue;
    for (const position of positions) {
      if (Number.isInteger(position) && position >= 0) positioned.push([position, word]);
    }
  }
  if (positioned.length === 0) return null;
  positioned.sort((left, right) => left[0] - right[0]);
  return positioned.map(([, word]) => word).join(' ');
}

export function intersectionSize(left, right) {
  let count = 0;
  const [small, large] = left.size <= right.size ? [left, right] : [right, left];
  for (const value of small) {
    if (large.has(value)) count += 1;
  }
  return count;
}

export function jaccard(left, right) {
  if (left.size === 0 || right.size === 0) return 0;
  const shared = intersectionSize(left, right);
  return shared / (left.size + right.size - shared);
}

export function dedupeStrings(values) {
  return [
    ...new Set(
      (values ?? []).filter(
        (value) => typeof value === 'string' && value.trim() !== '',
      ),
    ),
  ];
}

export function safeMessage(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function emptyExecutableHistory() {
  return {
    reproductionCaseIds: [],
    claimIds: [],
    runIds: [],
    failureLessonIds: [],
  };
}

export function resolveExecutableHistory(work, links = {}) {
  const id = workId(work);
  const doi = canonicalDoi(work?.doi);
  const shortDoi = doi?.replace('https://doi.org/', '');
  const value = links[id] ?? links[doi] ?? links[shortDoi] ?? {};
  return {
    reproductionCaseIds: dedupeStrings(value.reproductionCaseIds),
    claimIds: dedupeStrings(value.claimIds),
    runIds: dedupeStrings(value.runIds),
    failureLessonIds: dedupeStrings(value.failureLessonIds),
  };
}
