import { runRelevanceAblation } from './ablation.js';
import { BackboneExtractor } from './backbone.js';
import { BalancedCandidateSelector, WorkDeduplicator } from './candidates.js';
import { TopicFrontierDiscovery } from './frontier.js';
import { FieldGraphAssembler } from './graph.js';
import {
  DEFAULT_OPENALEX_BASE_URL,
  FIELD_HISTORY_SCHEMA_VERSION,
  FieldHistoryError,
  clone,
  dedupeStrings,
  integerOption,
  roundScore,
  workId,
  workTitle,
} from './model.js';
import { OpenAlexClient } from './openalex.js';
import { RelevanceRanker } from './relevance.js';
import { ResearchRelationClassifier } from './relation-classifier.js';
import { CitationTraversal } from './traversal.js';
import { FieldHistoryMapValidator } from './validator.js';

export {
  BackboneExtractor,
  BalancedCandidateSelector,
  CitationTraversal,
  FIELD_HISTORY_SCHEMA_VERSION,
  FieldGraphAssembler,
  FieldHistoryError,
  FieldHistoryMapValidator,
  OpenAlexClient,
  RelevanceRanker,
  ResearchRelationClassifier,
  TopicFrontierDiscovery,
  WorkDeduplicator,
  runRelevanceAblation,
};

const DEFAULT_LIMITS = Object.freeze({
  referencesPerHop: 30,
  influentialPerHop: 15,
  recentPerHop: 15,
  related: 20,
  frontierCandidates: 40,
  maxWorks: 180,
  foundations: 25,
  branches: 25,
  derivatives: 35,
  frontier: 25,
  backbone: 30,
});

function compareRank(left, right) {
  return (
    right.backbone.total - left.backbone.total ||
    right.scores.total - left.scores.total ||
    right.relevance.total - left.relevance.total ||
    (right.year ?? 0) - (left.year ?? 0) ||
    right.citationCount - left.citationCount ||
    left.id.localeCompare(right.id)
  );
}

function limitView(nodes, role, limit) {
  return nodes
    .filter((node) => node.roles.includes(role))
    .sort(compareRank)
    .slice(0, limit)
    .map((node) => node.id);
}

function isCriticalProviderLimitation(message) {
  return /\bunavailable\b/i.test(message);
}

export class FieldHistoryService {
  constructor(options = {}) {
    this.client = options.client;
    this.resolver = options.resolver ?? this.client;
    if (!this.resolver?.resolveWork) {
      throw new FieldHistoryError(
        'CONFIGURATION_ERROR',
        'FieldHistoryService requires a resolver with resolveWork()',
      );
    }
    if (!this.client && !(options.traversal && options.frontierDiscovery)) {
      throw new FieldHistoryError(
        'CONFIGURATION_ERROR',
        'FieldHistoryService requires an OpenAlex-compatible client or both discovery components',
      );
    }
    this.traversal =
      options.traversal ?? new CitationTraversal({ client: this.client });
    this.relevanceRanker = options.relevanceRanker ?? new RelevanceRanker();
    this.relationClassifier =
      options.relationClassifier ?? new ResearchRelationClassifier();
    this.frontierDiscovery =
      options.frontierDiscovery ?? new TopicFrontierDiscovery({ client: this.client });
    this.workDeduplicator = options.workDeduplicator ?? new WorkDeduplicator();
    this.candidateSelector =
      options.candidateSelector ?? new BalancedCandidateSelector();
    this.graphAssembler =
      options.graphAssembler ??
      new FieldGraphAssembler({ relationClassifier: this.relationClassifier });
    this.backboneExtractor = options.backboneExtractor ?? new BackboneExtractor();
    this.mapValidator = options.mapValidator ?? new FieldHistoryMapValidator();
    this.now = options.now ?? (() => new Date().toISOString());
    const contracts = [
      ['traversal', this.traversal, 'expand'],
      ['relevanceRanker', this.relevanceRanker, 'rank'],
      ['frontierDiscovery', this.frontierDiscovery, 'discover'],
      ['workDeduplicator', this.workDeduplicator, 'deduplicate'],
      ['candidateSelector', this.candidateSelector, 'select'],
      ['graphAssembler', this.graphAssembler, 'assemble'],
      ['backboneExtractor', this.backboneExtractor, 'extract'],
      ['mapValidator', this.mapValidator, 'validate'],
    ];
    for (const [name, component, method] of contracts) {
      if (typeof component?.[method] !== 'function') {
        throw new FieldHistoryError(
          'CONFIGURATION_ERROR',
          `FieldHistoryService ${name} must implement ${method}()`,
        );
      }
    }
  }

  validate(value) {
    return clone(this.mapValidator.validate(clone(value)));
  }

  async build(input) {
    const requestStart = this.client?.requestCount ?? 0;
    const resolved = await this.resolver.resolveWork(input?.seed);
    const seed = resolved.work;
    const seedId = workId(seed);
    if (!seedId) {
      throw new FieldHistoryError(
        'INVALID_PROVIDER_RESPONSE',
        'the resolved OpenAlex seed has no canonical work id',
      );
    }
    const generatedAt = this.now();
    const currentYear = Number(generatedAt.slice(0, 4));
    const citationDepth = integerOption(input?.citationDepth, 2, {
      name: 'citationDepth',
      minimum: 1,
      maximum: 3,
    });
    const frontierYears = integerOption(input?.frontierYears, 3, {
      name: 'frontierYears',
      minimum: 1,
      maximum: 20,
    });
    const relevanceThreshold = input?.relevanceThreshold ?? 0.3;
    if (
      typeof relevanceThreshold !== 'number' ||
      relevanceThreshold < 0 ||
      relevanceThreshold > 1
    ) {
      throw new FieldHistoryError(
        'INVALID_ARGUMENT',
        'relevanceThreshold must be between 0 and 1',
      );
    }
    const retentionFloor = input?.retentionFloor ?? Math.min(0.17, relevanceThreshold);
    if (
      typeof retentionFloor !== 'number' ||
      retentionFloor < 0 ||
      retentionFloor > relevanceThreshold
    ) {
      throw new FieldHistoryError(
        'INVALID_ARGUMENT',
        'retentionFloor must be between 0 and relevanceThreshold',
      );
    }
    const limits = {
      referencesPerHop: integerOption(
        input?.limits?.referencesPerHop ?? input?.limits?.references,
        DEFAULT_LIMITS.referencesPerHop,
        { name: 'referencesPerHop', maximum: 100 },
      ),
      influentialPerHop: integerOption(
        input?.limits?.influentialPerHop ?? input?.limits?.influentialCitations,
        DEFAULT_LIMITS.influentialPerHop,
        { name: 'influentialPerHop', maximum: 50 },
      ),
      recentPerHop: integerOption(
        input?.limits?.recentPerHop ?? input?.limits?.recentCitations,
        DEFAULT_LIMITS.recentPerHop,
        { name: 'recentPerHop', maximum: 50 },
      ),
      related: integerOption(input?.limits?.related, DEFAULT_LIMITS.related, {
        name: 'related', maximum: 50,
      }),
      frontierCandidates: integerOption(
        input?.limits?.frontierCandidates,
        DEFAULT_LIMITS.frontierCandidates,
        { name: 'frontierCandidates', maximum: 100 },
      ),
      maxWorks: integerOption(input?.limits?.maxWorks, DEFAULT_LIMITS.maxWorks, {
        name: 'maxWorks', minimum: 20, maximum: 500,
      }),
      foundations: integerOption(
        input?.limits?.foundations,
        DEFAULT_LIMITS.foundations,
        { name: 'foundations', maximum: 100 },
      ),
      branches: integerOption(input?.limits?.branches, DEFAULT_LIMITS.branches, {
        name: 'branches', maximum: 100,
      }),
      derivatives: integerOption(
        input?.limits?.derivatives,
        DEFAULT_LIMITS.derivatives,
        { name: 'derivatives', maximum: 100 },
      ),
      frontier: integerOption(input?.limits?.frontier, DEFAULT_LIMITS.frontier, {
        name: 'frontier', maximum: 100,
      }),
      backbone: integerOption(input?.limits?.backbone, DEFAULT_LIMITS.backbone, {
        name: 'backbone', minimum: 5, maximum: 100,
      }),
    };

    const [traversal, frontier] = await Promise.all([
      this.traversal.expand(seed, {
        depth: citationDepth,
        referencesPerHop: limits.referencesPerHop,
        influentialPerHop: limits.influentialPerHop,
        recentPerHop: limits.recentPerHop,
        relatedLimit: limits.related,
        maxWorks: limits.maxWorks,
      }),
      this.frontierDiscovery.discover(seed, {
        years: frontierYears,
        limit: limits.frontierCandidates,
        currentYear,
      }),
    ]);
    let works = new Map(traversal.works);
    let depths = new Map(traversal.depths);
    let sources = new Map(traversal.sources);
    let topicFrontierRetained = 0;
    for (const work of frontier.works) {
      const id = workId(work);
      if (!id) continue;
      if (!works.has(id) && works.size >= limits.maxWorks) continue;
      if (!works.has(id)) {
        works.set(id, work);
        depths.set(id, { backward: null, forward: null });
        topicFrontierRetained += 1;
      }
      if (!sources.has(id)) sources.set(id, new Set());
      sources.get(id).add('topic_frontier');
    }
    const limitations = [...traversal.limitations, ...frontier.limitations];
    const newFrontierWorks = frontier.works.filter(
      (work) => !traversal.works.has(workId(work)),
    ).length;
    if (topicFrontierRetained < newFrontierWorks) {
      limitations.push(
        'Some topic-frontier candidates were omitted by the configured maxWorks budget.',
      );
    }

    const deduplicated = await this.workDeduplicator.deduplicate({
      works,
      depths,
      sources,
      seedId,
    });
    works = deduplicated.works;
    depths = deduplicated.depths;
    sources = deduplicated.sources;
    if (deduplicated.deduplicated > 0) {
      limitations.push(
        `Deduplicated ${deduplicated.deduplicated} OpenAlex record(s) by DOI or matching title, authors, and publication window.`,
      );
    }

    const relevanceById = await this.relevanceRanker.rank({
      seed,
      works,
      depths,
      sources,
      threshold: relevanceThreshold,
    });
    const frontierCutoff = currentYear - frontierYears + 1;
    const retention = await this.candidateSelector.select({
      seedId,
      works,
      depths,
      sources,
      relevanceById,
      retentionFloor,
      frontierCutoff,
      foundationLimit: limits.foundations,
      branchLimit: limits.branches,
      derivativeLimit: limits.derivatives,
      frontierLimit: limits.frontier,
    });
    const excludedCandidates = [...works.values()]
      .filter((work) => !retention.retained.has(workId(work)))
      .map((work) => ({
        id: workId(work),
        title: workTitle(work) || workId(work),
        year: Number.isInteger(work.publication_year) ? work.publication_year : null,
        score: relevanceById.get(workId(work)).total,
        reasons: relevanceById.get(workId(work)).reasons,
      }))
      .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
    const includedWorks = new Map(
      [...works].filter(([id]) => retention.retained.has(id)),
    );
    const { nodes, edges, relationSummary } = await this.graphAssembler.assemble({
      seed,
      seedId,
      resolution: resolved.resolution,
      includedWorks,
      depths,
      sources,
      relevanceById,
      balanced: retention.balanced,
      currentYear,
      frontierCutoff,
      frontierYears,
      executableHistoryLinks: input?.executableHistoryLinks,
    });

    const backbone = await this.backboneExtractor.extract({
      nodes,
      edges,
      seedId,
      maxNodes: limits.backbone,
    });
    for (const node of nodes) node.backbone = backbone.scores.get(node.id);

    const seedNode = nodes.find((node) => node.id === seedId);
    const dataLimitations = dedupeStrings(limitations);
    const result = {
      schemaVersion: FIELD_HISTORY_SCHEMA_VERSION,
      id: `field_history_${seedId.toLowerCase()}`,
      generatedAt,
      seed: {
        input: resolved.input,
        resolution: resolved.resolution,
        workId: seedId,
        title: seedNode.title,
        year: seedNode.year,
        doi: seedNode.doi,
      },
      scope: {
        citationDepth,
        relevanceThreshold: roundScore(relevanceThreshold),
        retentionFloor: roundScore(retentionFloor),
        frontierYears,
        frontierTopics: frontier.topicIds,
        maxWorks: limits.maxWorks,
        backboneLimit: limits.backbone,
      },
      provider: {
        name: 'OpenAlex',
        baseUrl: this.client?.baseUrl ?? DEFAULT_OPENALEX_BASE_URL,
        accessLevel: 'metadata_and_abstract',
        scientificEvidence: false,
        retrievedAt: generatedAt,
        requestCount: Math.max(
          0,
          (this.client?.requestCount ?? requestStart) - requestStart,
        ),
        coverage: {
          citationDepthRequested: citationDepth,
          backwardDepthCompleted: traversal.stats.backwardDepthCompleted,
          forwardDepthCompleted: traversal.stats.forwardDepthCompleted,
          backwardWorksRetrieved: traversal.stats.backwardWorks,
          forwardWorksRetrieved: traversal.stats.forwardWorks,
          relatedWorksRetrieved: traversal.stats.relatedWorks,
          topicFrontierRetrieved: frontier.works.length,
          candidatesDiscovered: works.size,
          worksIncluded: nodes.length,
          worksFiltered: excludedCandidates.length,
          abstractsAvailable: nodes.filter((node) => node.abstract).length,
        },
      },
      status: dataLimitations.some(isCriticalProviderLimitation)
        ? 'partial'
        : 'bounded_complete',
      nodes,
      edges,
      views: {
        foundations: limitView(nodes, 'foundation', limits.foundations),
        branches: limitView(nodes, 'branch', limits.branches),
        seed: [seedId],
        derivatives: limitView(nodes, 'derivative', limits.derivatives),
        frontier: limitView(nodes, 'frontier', limits.frontier),
        backbone: backbone.ids,
        backboneEdges: backbone.edgeIds,
      },
      relationSummary,
      excludedCandidates,
      limitations: dedupeStrings([
        ...dataLimitations,
        'This is a bounded multi-hop map, not a claim of exhaustive field coverage.',
        'OpenAlex metadata and abstracts establish discovery context, not substantive scientific evidence.',
        'Research-relation labels are hypotheses that require full-text verification.',
      ]),
    };
    return clone(this.mapValidator.validate(result));
  }

  toCytoscape(value) {
    const map = this.mapValidator.validate(clone(value));
    return {
      metadata: {
        schemaVersion: map.schemaVersion,
        fieldHistoryId: map.id,
        generatedAt: map.generatedAt,
        status: map.status,
      },
      elements: {
        nodes: map.nodes.map((node) => ({
          data: {
            id: node.id,
            label: node.title,
            title: node.title,
            year: node.year,
            doi: node.doi,
            roles: node.roles,
            relevance: node.relevance.total,
            backbone: node.backbone.total,
            backboneSelected: node.backbone.selected,
            citationCount: node.citationCount,
            scientificEvidence: node.scientificEvidence,
          },
          classes: [
            ...node.roles,
            node.backbone.selected ? 'backbone' : '',
          ].filter(Boolean).join(' '),
        })),
        edges: map.edges.map((edge) => ({
          data: {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: edge.type,
            researchRelation: edge.researchRelation.kind,
            relationConfidence: edge.researchRelation.confidence,
            directed: edge.directed,
            score: edge.score,
            backbone: map.views.backboneEdges.includes(edge.id),
            scientificEvidence: edge.scientificEvidence,
          },
          classes: [
            edge.type,
            edge.researchRelation.kind,
            map.views.backboneEdges.includes(edge.id) ? 'backbone' : '',
          ].filter(Boolean).join(' '),
        })),
      },
    };
  }
}
