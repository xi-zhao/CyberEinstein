import { FieldHistoryService, OpenAlexClient } from './service.js';

export {
  BackboneExtractor,
  BalancedCandidateSelector,
  CitationTraversal,
  FIELD_HISTORY_SCHEMA_VERSION,
  FieldGraphAssembler,
  FieldHistoryError,
  FieldHistoryMapValidator,
  FieldHistoryService,
  OpenAlexClient,
  RelevanceRanker,
  ResearchRelationClassifier,
  TopicFrontierDiscovery,
  WorkDeduplicator,
  runRelevanceAblation,
} from './service.js';
export { DEFAULT_RELEVANCE_WEIGHTS } from './relevance.js';
export { FileResponseCache, MemoryResponseCache } from './cache.js';
export {
  FieldHistoryBenchmark,
  citationCountThroughYear,
  evaluateBackboneAgainstReviewConsensus,
  evaluateBackboneStability,
  evaluateRankedIds,
  evaluateTemporalFrontier,
} from './benchmark.js';
export { renderFieldHistoryHtml } from './viewer.js';

export const name = 'cybereinstein-field-history';

export function apply(ctx, config = {}) {
  const apiKeyEnv = config.apiKeyEnv ?? 'OPENALEX_API_KEY';
  const client =
    config.client ??
    new OpenAlexClient({
      apiKey: process.env[apiKeyEnv],
      baseUrl: config.baseUrl,
      cacheDir: config.cacheDir,
    });
  const service = new FieldHistoryService({
    ...config,
    client,
  });
  ctx.provide('fieldHistory', service);
}
