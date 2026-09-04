import {
  canonicalOpenAlexId,
  dedupeStrings,
  integerOption,
  referenceIds,
  safeMessage,
  workId,
} from './model.js';

function referenceCandidates(works, known, limit) {
  const counts = new Map();
  for (const work of works) {
    for (const id of referenceIds(work)) {
      if (!known.has(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return new Map(
    [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
  );
}

function rankReferenceWorks(works, counts, limit, depth) {
  const maximumSupport = Math.max(1, ...counts.values());
  const maximumCitations = Math.max(
    1,
    ...works.map((work) => Number(work.cited_by_count ?? 0)),
  );
  const supportWeight = depth === 1 ? 0.35 : 0.65;
  return [...works]
    .sort((left, right) => {
      const score = (work) => {
        const id = workId(work);
        const support = (counts.get(id) ?? 0) / maximumSupport;
        const citations =
          Math.log1p(Number(work.cited_by_count ?? 0)) /
          Math.log1p(maximumCitations);
        return supportWeight * support + (1 - supportWeight) * citations;
      };
      return score(right) - score(left) || workId(left).localeCompare(workId(right));
    })
    .slice(0, limit);
}

function interleave(left, right, limit) {
  const result = [];
  const seen = new Set();
  const maximum = Math.max(left.length, right.length);
  for (let index = 0; index < maximum && result.length < limit; index += 1) {
    for (const work of [left[index], right[index]]) {
      const id = workId(work);
      if (id && !seen.has(id)) {
        seen.add(id);
        result.push(work);
        if (result.length === limit) break;
      }
    }
  }
  return result;
}

function mergeDepth(current, direction, depth) {
  const value = current ?? { backward: null, forward: null };
  if (value[direction] === null || depth < value[direction]) value[direction] = depth;
  return value;
}

export class CitationTraversal {
  constructor(options = {}) {
    this.client = options.client;
  }

  async expand(seed, options = {}) {
    const depth = integerOption(options.depth, 2, {
      name: 'citation depth',
      minimum: 1,
      maximum: 3,
    });
    const referencesPerHop = integerOption(options.referencesPerHop, 30, {
      name: 'referencesPerHop',
      maximum: 100,
    });
    const influentialPerHop = integerOption(options.influentialPerHop, 15, {
      name: 'influentialPerHop',
      maximum: 50,
    });
    const recentPerHop = integerOption(options.recentPerHop, 15, {
      name: 'recentPerHop',
      maximum: 50,
    });
    const relatedLimit = integerOption(options.relatedLimit, 20, {
      name: 'relatedLimit',
      maximum: 50,
    });
    const maxWorks = integerOption(options.maxWorks, 180, {
      name: 'maxWorks',
      minimum: 20,
      maximum: 500,
    });
    const seedId = workId(seed);
    const backwardPromise = this.#expandBackward(seed, {
      depth,
      perHop: referencesPerHop,
    });
    const forwardPromise = this.#expandForward(seed, {
      depth,
      influentialPerHop,
      recentPerHop,
    });
    const relatedIds = dedupeStrings(
      (seed.related_works ?? [])
        .map(canonicalOpenAlexId)
        .filter(Boolean),
    ).slice(0, relatedLimit);
    const relatedPromise = this.#fetchRelated(relatedIds);
    const [backward, forward, related] = await Promise.all([
      backwardPromise,
      forwardPromise,
      relatedPromise,
    ]);

    const works = new Map([[seedId, seed]]);
    const depths = new Map([[seedId, { backward: 0, forward: 0 }]]);
    const sources = new Map([[seedId, new Set(['seed'])]]);
    const add = (work, source, direction = null, itemDepth = null) => {
      const id = workId(work);
      if (!id) return;
      if (!works.has(id) && works.size >= maxWorks) return;
      if (!works.has(id)) works.set(id, work);
      if (!sources.has(id)) sources.set(id, new Set());
      sources.get(id).add(source);
      if (direction) {
        depths.set(id, mergeDepth(depths.get(id), direction, itemDepth));
      } else if (!depths.has(id)) {
        depths.set(id, { backward: null, forward: null });
      }
    };
    for (const item of backward.items) add(item.work, 'citation_history', 'backward', item.depth);
    for (const item of forward.items) add(item.work, 'citation_descendant', 'forward', item.depth);
    for (const work of related.works) add(work, 'related');
    const limitations = [...backward.limitations, ...forward.limitations, ...related.limitations];
    const discoveredBeforeCap =
      1 +
      new Set([
        ...backward.items.map((item) => workId(item.work)),
        ...forward.items.map((item) => workId(item.work)),
        ...related.works.map(workId),
      ]).size;
    if (discoveredBeforeCap > maxWorks) {
      limitations.push(
        `Traversal discovered ${discoveredBeforeCap} works and retained the configured maximum of ${maxWorks}.`,
      );
    }
    return {
      works,
      depths,
      sources,
      limitations,
      stats: {
        depthRequested: depth,
        backwardDepthCompleted: backward.depthCompleted,
        forwardDepthCompleted: forward.depthCompleted,
        backwardWorks: backward.items.length,
        forwardWorks: forward.items.length,
        relatedWorks: related.works.length,
        maxWorks,
        truncated: discoveredBeforeCap > maxWorks,
      },
    };
  }

  async #expandBackward(seed, options) {
    const known = new Set([workId(seed)]);
    let frontier = [seed];
    const items = [];
    const limitations = [];
    let depthCompleted = 0;
    for (let depth = 1; depth <= options.depth; depth += 1) {
      const candidateLimit = Math.min(100, Math.max(options.perHop, options.perHop * 3));
      const candidates = referenceCandidates(frontier, known, candidateLimit);
      const candidateIds = [...candidates.keys()];
      if (candidateIds.length === 0) {
        depthCompleted = depth;
        break;
      }
      let works;
      try {
        works = await this.client.getWorksByIds(candidateIds);
      } catch (error) {
        limitations.push(`backward hop ${depth} unavailable: ${safeMessage(error)}`);
        break;
      }
      const selected = rankReferenceWorks(works, candidates, options.perHop, depth);
      for (const work of selected) {
        const id = workId(work);
        known.add(id);
        items.push({ work, depth });
      }
      if (works.length < candidateIds.length) {
        limitations.push(
          `OpenAlex returned ${works.length} of ${candidateIds.length} requested records at backward hop ${depth}.`,
        );
      }
      frontier = selected;
      depthCompleted = depth;
    }
    return { items, limitations, depthCompleted };
  }

  async #expandForward(seed, options) {
    const known = new Set([workId(seed)]);
    let frontier = [seed];
    const items = [];
    const limitations = [];
    let depthCompleted = 0;
    for (let depth = 1; depth <= options.depth; depth += 1) {
      const parentIds = frontier.map(workId).filter(Boolean).slice(0, 50);
      if (parentIds.length === 0) {
        depthCompleted = depth;
        break;
      }
      const requests = await Promise.allSettled([
        this.client.getCitingWorks(parentIds, {
          limit: options.influentialPerHop,
          sort: 'cited_by_count:desc',
        }),
        this.client.getCitingWorks(parentIds, {
          limit: options.recentPerHop,
          sort: 'publication_date:desc',
        }),
      ]);
      const labels = ['influential', 'recent'];
      const groups = requests.map((result, index) => {
        if (result.status === 'fulfilled') return result.value;
        limitations.push(
          `forward hop ${depth} ${labels[index]} citations unavailable: ${safeMessage(result.reason)}`,
        );
        return [];
      });
      if (requests.every((result) => result.status === 'rejected')) break;
      const candidates = interleave(
        groups[0],
        groups[1],
        options.influentialPerHop + options.recentPerHop,
      ).filter((work) => {
        const id = workId(work);
        return id && !known.has(id) && [...referenceIds(work)].some((parent) => parentIds.includes(parent));
      });
      for (const work of candidates) {
        const id = workId(work);
        known.add(id);
        items.push({ work, depth });
      }
      frontier = candidates;
      depthCompleted = depth;
      if (frontier.length === 0) break;
    }
    return { items, limitations, depthCompleted };
  }

  async #fetchRelated(ids) {
    if (ids.length === 0) return { works: [], limitations: [] };
    try {
      const works = await this.client.getWorksByIds(ids);
      const limitations = [];
      if (works.length < ids.length) {
        limitations.push(
          `OpenAlex returned ${works.length} of ${ids.length} requested related-work records.`,
        );
      }
      return { works, limitations };
    } catch (error) {
      return {
        works: [],
        limitations: [`related works unavailable: ${safeMessage(error)}`],
      };
    }
  }
}
