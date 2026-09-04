import {
  canonicalTopicId,
  jaccard,
  reconstructAbstract,
  referenceIds,
  topicEntries,
  workId,
} from './model.js';
import { RelevanceRanker, workTitleTokens } from './relevance.js';

const GENERIC_QUERY_TERMS = new Set(
  `analysis application approach computation compute computing large method model
   physics practical quantum result scale state study system theory towards`.split(/\s+/),
);

function distinctiveTerms(values) {
  return [
    ...new Set(
      values
        .flatMap((value) => workTitleTokens({ title: value }))
        .filter((term) => !GENERIC_QUERY_TERMS.has(term)),
    ),
  ];
}

function divide(numerator, denominator) {
  return denominator === 0 ? 0 : numerator / denominator;
}

function rounded(value) {
  return Number((Number.isFinite(value) ? value : 0).toFixed(4));
}

function dcg(ids, weights, k) {
  return ids.slice(0, k).reduce(
    (total, id, index) =>
      total + (weights.get(id) ?? 0) / Math.log2(index + 2),
    0,
  );
}

export function evaluateRankedIds(rankedIds, goldWeights, options = {}) {
  const k = options.k ?? 20;
  const ranked = [...new Set(rankedIds)].slice(0, k);
  const gold = new Map(
    [...goldWeights].filter(([, weight]) => Number(weight) > 0),
  );
  const hits = ranked.filter((id) => gold.has(id)).length;
  const ideal = [...gold]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([id]) => id);
  const idealDcg = dcg(ideal, gold, k);
  return {
    k,
    retrieved: ranked.length,
    gold: gold.size,
    hits,
    rankedIds: ranked,
    relevantRankedIds: ranked.filter((id) => gold.has(id)),
    idealIds: ideal.slice(0, k),
    precisionAtK: rounded(divide(hits, Math.min(k, Math.max(1, ranked.length)))),
    recallAtK: rounded(divide(hits, gold.size)),
    ndcgAtK: rounded(divide(dcg(ranked, gold, k), idealDcg)),
  };
}

export function evaluateBackboneAgainstReviewConsensus(input) {
  const minimumReviews = input.minimumReviews ?? 2;
  const minimumGold = input.minimumGold ?? 5;
  const reviews = input.reviews ?? [];
  if (reviews.length < minimumReviews) {
    return {
      status: 'inconclusive',
      reason: `At least ${minimumReviews} relevant reviews are required.`,
      reviewCount: reviews.length,
    };
  }
  const counts = new Map();
  for (const review of reviews) {
    for (const id of referenceIds(review)) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  const seedYear = input.map.seed.year;
  const referenceWorks = new Map(
    (input.referenceWorks ?? []).map((work) => [workId(work), work]),
  );
  const weightedGold = [];
  const maximumCitations = Math.max(
    1,
    ...[...referenceWorks.values()].map((work) => Number(work.cited_by_count ?? 0)),
  );
  for (const [id, count] of counts) {
    const work = referenceWorks.get(id);
    if (!work || count < minimumReviews || id === input.map.seed.workId) continue;
    if (
      Number.isInteger(seedYear) &&
      Number.isInteger(work.publication_year) &&
      work.publication_year > seedYear
    ) continue;
    const consensus = count / reviews.length;
    const citationImpact =
      Math.log1p(Number(work.cited_by_count ?? 0)) / Math.log1p(maximumCitations);
    weightedGold.push([id, 0.85 * consensus + 0.15 * citationImpact]);
  }
  const goldLimit = input.goldLimit ?? Math.max(20, (input.k ?? 20) * 2);
  const gold = new Map(
    weightedGold
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, goldLimit),
  );
  if (gold.size < minimumGold) {
    return {
      status: 'inconclusive',
      reason: `Review consensus produced ${gold.size} historical references; ${minimumGold} are required.`,
      reviewCount: reviews.length,
      reviewIds: reviews.map(workId),
      consensusReferenceCount: gold.size,
    };
  }
  const foundationNodes = input.map.nodes.filter((node) =>
    node.roles.includes('foundation'),
  );
  const predicted = input.map.views.foundations;
  const citationBaseline = [...foundationNodes]
    .sort(
      (left, right) =>
        right.citationCount - left.citationCount || left.id.localeCompare(right.id),
    )
    .map((node) => node.id);
  return {
    status: 'complete',
    reviewCount: reviews.length,
    reviewIds: reviews.map(workId),
    consensusReferenceCount: gold.size,
    system: evaluateRankedIds(predicted, gold, input),
    citationOnlyBaseline: evaluateRankedIds(citationBaseline, gold, input),
  };
}

export function evaluateBackboneStability(maps, options = {}) {
  const k = options.k ?? 20;
  if ((maps ?? []).length < 2) {
    return {
      status: 'inconclusive',
      reason: 'At least two seeds from the same topic are required.',
    };
  }
  const seedIds = new Set(maps.map((map) => map.seed.workId));
  const sets = maps.map(
    (map) =>
      new Set(
        (map.views.foundations ?? map.views.backbone)
          .filter((id) => !seedIds.has(id))
          .slice(0, k),
      ),
  );
  const pairs = [];
  for (let left = 0; left < maps.length; left += 1) {
    for (let right = left + 1; right < maps.length; right += 1) {
      pairs.push({
        left: maps[left].seed.workId,
        right: maps[right].seed.workId,
        jaccard: rounded(jaccard(sets[left], sets[right])),
        overlapCoefficient: rounded(
          divide(
            [...sets[left]].filter((id) => sets[right].has(id)).length,
            Math.min(sets[left].size, sets[right].size),
          ),
        ),
      });
    }
  }
  return {
    status: 'complete',
    k,
    meanJaccard: rounded(
      divide(
        pairs.reduce((sum, pair) => sum + pair.jaccard, 0),
        pairs.length,
      ),
    ),
    meanOverlapCoefficient: rounded(
      divide(
        pairs.reduce((sum, pair) => sum + pair.overlapCoefficient, 0),
        pairs.length,
      ),
    ),
    pairs,
  };
}

export function citationCountThroughYear(work, year) {
  if (!Array.isArray(work?.counts_by_year)) return null;
  return work.counts_by_year.reduce(
    (total, item) =>
      Number.isInteger(item?.year) && item.year <= year
        ? total + Math.max(0, Number(item.cited_by_count ?? 0))
        : total,
    0,
  );
}

function citationGain(work, fromYear, toYear) {
  const before = citationCountThroughYear(work, fromYear);
  const after = citationCountThroughYear(work, toYear);
  return before === null || after === null ? null : Math.max(0, after - before);
}

function percentile(values, fraction) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))];
}

export function evaluateTemporalFrontier(input) {
  const ranker = input.ranker ?? new RelevanceRanker();
  const seedId = workId(input.seed);
  const cutoffYear = input.cutoffYear;
  const horizonYears = input.horizonYears ?? 3;
  const k = input.k ?? 20;
  const works = new Map([[seedId, input.seed]]);
  const depths = new Map([[seedId, { backward: 0, forward: 0 }]]);
  const sources = new Map([[seedId, new Set(['seed'])]]);
  for (const work of input.candidates ?? []) {
    const id = workId(work);
    if (!id || id === seedId || citationCountThroughYear(work, cutoffYear + horizonYears) === null) {
      continue;
    }
    works.set(id, work);
    depths.set(id, { backward: null, forward: null });
    sources.set(id, new Set(['topic_frontier']));
  }
  if (works.size < Math.max(10, k)) {
    return {
      status: 'inconclusive',
      reason: 'Too few topic candidates include year-by-year citation history.',
      candidateCount: Math.max(0, works.size - 1),
    };
  }
  const relevance = ranker.rank({
    seed: input.seed,
    works,
    depths,
    sources,
    threshold: 0,
  });
  const candidates = [...works.values()]
    .filter((work) => workId(work) !== seedId)
    .map((work) => ({
      id: workId(work),
      work,
      relevance: relevance.get(workId(work)).total,
      citationsAtCutoff: citationCountThroughYear(work, cutoffYear),
      futureGain: citationGain(work, cutoffYear, cutoffYear + horizonYears),
    }))
    .filter((item) => item.relevance >= (input.minimumRelevance ?? 0.12));
  if (candidates.length < 10) {
    return {
      status: 'inconclusive',
      reason: 'Too few candidates passed the automatic topic-relevance floor.',
      candidateCount: candidates.length,
    };
  }
  const maximumCitations = Math.max(1, ...candidates.map((item) => item.citationsAtCutoff));
  for (const item of candidates) {
    const citationStrength = Math.log1p(item.citationsAtCutoff) / Math.log1p(maximumCitations);
    item.score = 0.75 * item.relevance + 0.25 * citationStrength;
  }
  const system = [...candidates]
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
  const citationBaseline = [...candidates]
    .sort(
      (left, right) =>
        right.citationsAtCutoff - left.citationsAtCutoff || left.id.localeCompare(right.id),
    );
  const futureWeights = new Map(
    candidates.map((item) => [item.id, Math.log1p(item.futureGain)]),
  );
  const successThreshold = percentile(candidates.map((item) => item.futureGain), 0.75);
  const successRate = (ranked) =>
    divide(
      ranked.slice(0, k).filter((item) => item.futureGain > 0 && item.futureGain >= successThreshold).length,
      Math.min(k, ranked.length),
    );
  const candidateSuccessRate = divide(
    candidates.filter(
      (item) => item.futureGain > 0 && item.futureGain >= successThreshold,
    ).length,
    candidates.length,
  );
  const systemSuccessRate = successRate(system);
  return {
    status: 'complete',
    cutoffYear,
    horizonYears,
    candidateCount: candidates.length,
    futureSuccessThreshold: successThreshold,
    system: {
      ...evaluateRankedIds(system.map((item) => item.id), futureWeights, { k }),
      topQuartileSuccessRate: rounded(systemSuccessRate),
      liftOverCandidateRate: rounded(divide(systemSuccessRate, candidateSuccessRate)),
    },
    citationOnlyBaseline: {
      ...evaluateRankedIds(
        citationBaseline.map((item) => item.id),
        futureWeights,
        { k },
      ),
      topQuartileSuccessRate: rounded(successRate(citationBaseline)),
    },
  };
}

function relevantReviewRank(seed, reviews, ranker) {
  const seedId = workId(seed);
  const works = new Map([[seedId, seed]]);
  const depths = new Map([[seedId, { backward: 0, forward: 0 }]]);
  const sources = new Map([[seedId, new Set(['seed'])]]);
  for (const review of reviews) {
    const id = workId(review);
    if (!id || id === seedId) continue;
    works.set(id, review);
    depths.set(id, { backward: null, forward: null });
    sources.set(id, new Set(['topic_frontier']));
  }
  const scores = ranker.rank({ seed, works, depths, sources, threshold: 0 });
  const seedAnchors = new Set(
    distinctiveTerms([
      seed.title ?? seed.display_name ?? '',
      ...(seed.keywords ?? [])
        .filter((keyword) => Number(keyword?.score ?? 0) >= 0.25)
        .slice(0, 5)
        .map((keyword) => keyword.display_name ?? keyword.keyword ?? ''),
    ]),
  );
  const maximumCitations = Math.max(
    1,
    ...reviews.map((review) => Number(review.cited_by_count ?? 0)),
  );
  return reviews
    .map((review) => ({
      review,
      relevance: scores.get(workId(review))?.total ?? 0,
      textSimilarity: scores.get(workId(review))?.textSimilarity ?? 0,
      titleAnchorCount: workTitleTokens(review).filter((term) => seedAnchors.has(term)).length,
      impact:
        Math.log1p(Number(review.cited_by_count ?? 0)) /
        Math.log1p(maximumCitations),
      reviewEvidence:
        review.type === 'review' ||
        /\b(review|survey|perspective|roadmap|overview|progress|prospects|introduction|tutorial|lectures?|primer|handbook|colloquium)\b/i.test(
          review.title ?? review.display_name ?? '',
        ) ||
        /^(reviews of modern physics|reports on progress in physics|physics reports|nature reviews .+|annual review .+|advances in physics)$/i.test(
          review.primary_location?.source?.display_name ?? '',
        ),
    }))
    .filter(
      (item) =>
        item.reviewEvidence &&
        item.relevance >= 0.18 &&
        (item.titleAnchorCount >= 1 || item.textSimilarity >= 0.16) &&
        (item.textSimilarity >= 0.08 || item.titleAnchorCount >= 2),
    )
    .sort(
      (left, right) =>
        0.8 * right.relevance + 0.2 * right.impact -
          (0.8 * left.relevance + 0.2 * left.impact) ||
        workId(left.review).localeCompare(workId(right.review)),
    )
    .map((item) => item.review);
}

export class FieldHistoryBenchmark {
  constructor(options = {}) {
    if (!options.client) throw new TypeError('FieldHistoryBenchmark requires a client');
    this.client = options.client;
    this.service = options.service;
    this.ranker = options.ranker ?? new RelevanceRanker();
    this.now = options.now ?? (() => new Date().toISOString());
  }

  async discoverReviews(seed, options = {}) {
    const primaryTopic = topicEntries(seed)[0];
    if (!primaryTopic) return [];
    const abstract = reconstructAbstract(seed.abstract_inverted_index);
    const semanticQuery = [
      `Authoritative review of ${seed.title ?? seed.display_name ?? primaryTopic.name}.`,
      abstract,
    ].filter(Boolean).join(' ').slice(0, 2_000);
    const filters = [];
    if (Number.isInteger(seed.publication_year)) {
      filters.push(`publication_year:>${seed.publication_year}`);
    }
    const baseParameters = {
      filter: filters.length > 0 ? filters.join(',') : undefined,
      per_page: options.reviewCandidates ?? 30,
    };
    const responses = await Promise.allSettled([
      this.client.listWorks({
        ...baseParameters,
        'search.semantic': semanticQuery,
      }, { maxRetries: 0, timeoutMs: 12_000 }),
      this.client.listWorks({
        ...baseParameters,
        search: `${seed.title ?? seed.display_name ?? primaryTopic.name} review`,
        sort: 'relevance_score:desc',
      }),
    ]);
    const candidates = new Map();
    for (const response of responses) {
      if (response.status !== 'fulfilled') continue;
      for (const work of response.value.results ?? []) candidates.set(workId(work), work);
    }
    return relevantReviewRank(seed, [...candidates.values()], this.ranker).slice(
      0,
      options.reviewCount ?? 3,
    );
  }

  async evaluateMap(map, seed, options = {}) {
    const reviews = await this.discoverReviews(seed, options);
    const referenceCounts = new Map();
    for (const review of reviews) {
      for (const id of referenceIds(review)) {
        referenceCounts.set(id, (referenceCounts.get(id) ?? 0) + 1);
      }
    }
    const minimumReviews = options.minimumReviews ?? 2;
    const consensusIds = [...referenceCounts]
      .filter(([, count]) => count >= minimumReviews)
      .map(([id]) => id);
    const referenceWorks = consensusIds.length > 0
      ? await this.client.getWorksByIds(consensusIds)
      : [];
    return evaluateBackboneAgainstReviewConsensus({
      map,
      reviews,
      referenceWorks,
      minimumReviews,
      minimumGold: options.minimumGold,
      k: options.k,
    });
  }

  async temporalFrontierBacktest(seed, options = {}) {
    const currentYear = Number(this.now().slice(0, 4));
    const cutoffYear = options.cutoffYear ?? currentYear - 4;
    const lookbackYears = options.lookbackYears ?? 3;
    const topicIds = topicEntries(seed)
      .slice(0, options.topicCount ?? 2)
      .map((topic) => canonicalTopicId(topic.id))
      .filter(Boolean);
    if (topicIds.length === 0) {
      return { status: 'inconclusive', reason: 'The seed has no OpenAlex topics.' };
    }
    const query = {
      fromDate: `${cutoffYear - lookbackYears + 1}-01-01`,
      toDate: `${cutoffYear}-12-31`,
      limit: Math.ceil((options.candidateLimit ?? 100) / 2),
    };
    const settled = await Promise.allSettled([
      this.client.getTopicWorks(topicIds, { ...query, sort: 'publication_date:asc' }),
      this.client.getTopicWorks(topicIds, { ...query, sort: 'publication_date:desc' }),
    ]);
    const candidates = new Map();
    for (const result of settled) {
      if (result.status !== 'fulfilled') continue;
      for (const work of result.value) candidates.set(workId(work), work);
    }
    if (settled.every((result) => result.status === 'rejected')) {
      return {
        status: 'inconclusive',
        reason: 'Both time-bounded OpenAlex frontier queries failed.',
      };
    }
    return evaluateTemporalFrontier({
      seed,
      candidates: [...candidates.values()],
      cutoffYear,
      horizonYears: options.horizonYears,
      minimumRelevance: options.minimumRelevance,
      k: options.k,
      ranker: this.ranker,
    });
  }

  async runCase(input) {
    if (!this.service) throw new TypeError('runCase requires a FieldHistoryService');
    const providerStart = {
      requests: this.client.requestCount ?? 0,
      retries: this.client.retryCount ?? 0,
      cacheHits: this.client.cacheHits ?? 0,
      cacheErrors: this.client.cacheErrors ?? 0,
    };
    const maps = [];
    const history = [];
    let firstSeed;
    for (const seedInput of input.seeds ?? []) {
      const resolved = await this.client.resolveWork(seedInput);
      firstSeed ??= resolved.work;
      const map = await this.service.build({
        seed: seedInput,
        ...input.buildOptions,
      });
      maps.push(map);
      history.push({
        seed: map.seed,
        evaluation: await this.evaluateMap(map, resolved.work, input.reviewOptions),
      });
    }
    if (!firstSeed) throw new TypeError('benchmark case requires at least one seed');
    const frontier = await this.temporalFrontierBacktest(
      firstSeed,
      input.frontierOptions,
    );
    const stability = evaluateBackboneStability(maps, input.stabilityOptions);
    const completeHistory = history
      .map((item) => item.evaluation)
      .filter((item) => item.status === 'complete');
    const meanHistory = (selector) => divide(
      completeHistory.reduce((sum, item) => sum + selector(item), 0),
      completeHistory.length,
    );
    const historySummary = {
      evaluatedSeeds: completeHistory.length,
      requestedSeeds: maps.length,
      coverage: rounded(divide(completeHistory.length, maps.length)),
      meanRecallAtK: rounded(meanHistory((item) => item.system.recallAtK)),
      meanNdcgAtK: rounded(meanHistory((item) => item.system.ndcgAtK)),
      meanCitationBaselineNdcgAtK: rounded(
        meanHistory((item) => item.citationOnlyBaseline.ndcgAtK),
      ),
    };
    const checks = {
      providerComplete: maps.every((map) => map.status === 'bounded_complete'),
      reviewConsensusAvailable: historySummary.coverage >= 0.5,
      historyAtLeastCitationBaseline:
        completeHistory.length > 0 &&
        historySummary.meanNdcgAtK + 0.02 >=
          historySummary.meanCitationBaselineNdcgAtK,
      historyQualityFloor:
        completeHistory.length > 0 &&
        historySummary.meanRecallAtK >= 0.15 &&
        historySummary.meanNdcgAtK >= 0.2,
      temporalBacktestAvailable: frontier.status === 'complete',
      frontierAtLeastCitationBaseline:
        frontier.status === 'complete' &&
        frontier.system.ndcgAtK + 0.02 >= frontier.citationOnlyBaseline.ndcgAtK,
      frontierQualityFloor:
        frontier.status === 'complete' &&
        frontier.system.ndcgAtK >= 0.7 &&
        frontier.system.liftOverCandidateRate >= 1,
      multiSeedStable:
        stability.status === 'complete' &&
        stability.meanOverlapCoefficient >= 0.3,
    };
    return {
      version: '1.0.0',
      generatedAt: this.now(),
      name: input.name,
      seeds: maps.map((map) => map.seed),
      maps: maps.map((map) => ({
        id: map.id,
        status: map.status,
        included: map.nodes.length,
        filtered: map.excludedCandidates.length,
        limitations: map.limitations,
      })),
      history,
      historySummary,
      frontier,
      stability,
      checks,
      passed: Object.values(checks).every(Boolean),
      providerStats: {
        requests: (this.client.requestCount ?? 0) - providerStart.requests,
        retries: (this.client.retryCount ?? 0) - providerStart.retries,
        cacheHits: (this.client.cacheHits ?? 0) - providerStart.cacheHits,
        cacheErrors: (this.client.cacheErrors ?? 0) - providerStart.cacheErrors,
      },
    };
  }
}
