import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import { runRelevanceAblation } from './ablation.js';
import { BackboneExtractor } from './backbone.js';
import { TopicFrontierDiscovery } from './frontier.js';
import {
  DEFAULT_OPENALEX_BASE_URL,
  FIELD_HISTORY_SCHEMA_VERSION,
  FieldHistoryError,
  canonicalDoi,
  canonicalOpenAlexId,
  clamp,
  clone,
  dedupeStrings,
  integerOption,
  intersectionSize,
  normalizeTitle,
  reconstructAbstract,
  referenceIds,
  resolveExecutableHistory,
  roundScore,
  topicEntries,
  workId,
  workTitle,
} from './model.js';
import { OpenAlexClient } from './openalex.js';
import { RelevanceRanker, workTitleTokens } from './relevance.js';
import { ResearchRelationClassifier } from './relation-classifier.js';
import { CitationTraversal } from './traversal.js';

export {
  BackboneExtractor,
  CitationTraversal,
  FIELD_HISTORY_SCHEMA_VERSION,
  FieldHistoryError,
  OpenAlexClient,
  RelevanceRanker,
  ResearchRelationClassifier,
  TopicFrontierDiscovery,
  runRelevanceAblation,
};

const schema = JSON.parse(
  readFileSync(new URL('./field-history.schema.json', import.meta.url), 'utf8'),
);
const validateSchema = new Ajv2020({
  allErrors: true,
  strict: true,
  formats: { 'date-time': true, uri: true },
}).compile(schema);

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
const RELATION_KINDS = [
  'theoretical_extension',
  'method_improvement',
  'experimental_validation',
  'engineering_application',
  'review_citation',
  'contradiction_or_debate',
  'unclassified',
];
const GENERIC_FIELD_TERMS = new Set([
  'quantum',
  'compute',
  'computation',
  'computing',
  'computer',
  'algorithm',
  'circuit',
  'control',
  'hardware',
  'information',
  'system',
  'phase',
  'qubit',
  'state',
  'model',
  'method',
  'approach',
  'physics',
  'theory',
  'study',
  'application',
  'practical',
  'large',
  'scale',
]);

function signalAgreement(relevance) {
  return [
    relevance.textSimilarity >= 0.08,
    relevance.topicOverlap >= 0.35,
    relevance.citationProximity >= 0.4,
    relevance.graphConnectivity >= 0.12,
  ].filter(Boolean).length;
}

function retainBalancedCandidates(input) {
  const retained = new Set([input.seedId]);
  const balanced = new Set();
  const maximumCitations = Math.max(
    1,
    ...[...input.works.values()].map((work) => Number(work.cited_by_count ?? 0)),
  );
  const selectionScore = (id) => {
    const relevance = input.relevanceById.get(id).total;
    const citations = Number(input.works.get(id)?.cited_by_count ?? 0);
    const citationImpact = Math.log1p(citations) / Math.log1p(maximumCitations);
    return 0.78 * relevance + 0.22 * citationImpact;
  };
  const fieldTerms = new Set();
  const seed = input.works.get(input.seedId);
  const anchors = workTitleTokens({
    title: [workTitle(seed), reconstructAbstract(seed?.abstract_inverted_index)]
      .filter(Boolean)
      .join(' '),
  });
  for (const term of anchors) {
    if (!GENERIC_FIELD_TERMS.has(term)) fieldTerms.add(term);
  }
  const domainTermMatches = (id) =>
    workTitleTokens(input.works.get(id)).filter((term) => fieldTerms.has(term)).length;
  const eligible = (id) => {
    const relevance = input.relevanceById.get(id);
    const historical = (input.depths.get(id)?.backward ?? 0) > 0;
    const forward = (input.depths.get(id)?.forward ?? 0) > 0;
    const discoverySources = input.sources.get(id) ?? new Set();
    const topicOnly =
      discoverySources.has('topic_frontier') &&
      !historical &&
      !forward &&
      !discoverySources.has('related');
    const domainMatches = domainTermMatches(id);
    if (historical) {
      return (
        relevance.total >= Math.min(input.retentionFloor, 0.13) &&
        relevance.citationProximity >= 0.5 &&
        signalAgreement(relevance) >= 2 &&
        relevance.textSimilarity >= 0.04 &&
        (domainMatches >= 2 || relevance.textSimilarity >= 0.14)
      );
    }
    if (topicOnly) {
      return (
        relevance.total >= input.retentionFloor &&
        signalAgreement(relevance) >= 2 &&
        relevance.textSimilarity >= 0.075 &&
        (domainMatches >= 2 || relevance.textSimilarity >= 0.14)
      );
    }
    return (
      id !== input.seedId &&
      relevance.total >= input.retentionFloor &&
      signalAgreement(relevance) >= 2 &&
      relevance.textSimilarity >= 0.06 &&
      (domainMatches >= 2 || relevance.textSimilarity >= 0.1)
    );
  };
  const choose = (predicate, limit) => {
    [...input.works.keys()]
      .filter((id) => eligible(id) && predicate(id))
      .sort(
        (left, right) =>
          selectionScore(right) - selectionScore(left) || left.localeCompare(right),
      )
      .slice(0, limit)
      .forEach((id) => {
        retained.add(id);
        if (!input.relevanceById.get(id).included) balanced.add(id);
      });
  };
  choose((id) => (input.depths.get(id)?.backward ?? 0) > 0, input.foundationLimit);
  choose((id) => input.sources.get(id)?.has('related'), input.branchLimit);
  choose((id) => (input.depths.get(id)?.forward ?? 0) > 0, input.derivativeLimit);
  choose(
    (id) => {
      const year = input.works.get(id)?.publication_year;
      return (
        Number.isInteger(year) &&
        year >= input.frontierCutoff &&
        input.sources.get(id)?.has('topic_frontier')
      );
    },
    input.frontierLimit,
  );
  return { retained, balanced };
}

function minimumHop(left, right) {
  const values = [left, right].filter((value) => Number.isInteger(value));
  return values.length > 0 ? Math.min(...values) : null;
}

function authorKeys(work) {
  const keys = new Set();
  for (const authorship of work?.authorships ?? []) {
    const author = authorship?.author;
    if (author?.id) keys.add(`id:${String(author.id).toLowerCase()}`);
    const name = normalizeTitle(author?.display_name);
    if (name) keys.add(`name:${name}`);
  }
  return keys;
}

function authorFamilyKeys(work) {
  const families = new Set();
  for (const authorship of work?.authorships ?? []) {
    const displayName = String(authorship?.author?.display_name ?? '').trim();
    if (!displayName) continue;
    const family = displayName.includes(',')
      ? displayName.split(',')[0]
      : displayName.split(/\s+/).at(-1);
    const normalized = normalizeTitle(family);
    if (normalized) families.add(normalized);
  }
  return families;
}

function likelySameTitledWork(left, right) {
  const leftAuthors = authorKeys(left);
  const rightAuthors = authorKeys(right);
  const leftFamilies = authorFamilyKeys(left);
  const rightFamilies = authorFamilyKeys(right);
  const familyAgreement = intersectionSize(leftFamilies, rightFamilies);
  const requiredFamilyAgreement = Math.min(2, leftFamilies.size, rightFamilies.size);
  if (
    intersectionSize(leftAuthors, rightAuthors) === 0 &&
    (requiredFamilyAgreement === 0 || familyAgreement < requiredFamilyAgreement)
  ) {
    return false;
  }
  const leftYear = left?.publication_year;
  const rightYear = right?.publication_year;
  return (
    !Number.isInteger(leftYear) ||
    !Number.isInteger(rightYear) ||
    Math.abs(leftYear - rightYear) <= 3
  );
}

function deduplicateWorks(input) {
  const ids = [...input.works.keys()];
  const parent = new Map(ids.map((id) => [id, id]));
  const find = (id) => {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root);
    while (parent.get(id) !== id) {
      const next = parent.get(id);
      parent.set(id, root);
      id = next;
    }
    return root;
  };
  const union = (left, right) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent.set(rightRoot, leftRoot);
  };
  const byDoi = new Map();
  const byTitle = new Map();
  for (const [id, work] of input.works) {
    const doi = canonicalDoi(work.doi);
    const title = normalizeTitle(workTitle(work));
    if (doi) {
      if (byDoi.has(doi)) union(id, byDoi.get(doi));
      else byDoi.set(doi, id);
    }
    if (title.length >= 16) {
      const matches = byTitle.get(title) ?? [];
      const duplicate = matches.find((candidateId) =>
        likelySameTitledWork(work, input.works.get(candidateId)),
      );
      if (duplicate) union(id, duplicate);
      matches.push(id);
      byTitle.set(title, matches);
    }
  }
  const groups = new Map();
  for (const id of ids) {
    const root = find(id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(id);
  }
  const aliases = new Map();
  const representativeByRoot = new Map();
  for (const [root, group] of groups) {
    const representative = [...group].sort((left, right) => {
      if (left === input.seedId) return -1;
      if (right === input.seedId) return 1;
      const leftWork = input.works.get(left);
      const rightWork = input.works.get(right);
      const leftQuality =
        (canonicalDoi(leftWork.doi) ? 10 : 0) +
        (leftWork.abstract_inverted_index ? 2 : 0) +
        Math.log1p(Number(leftWork.cited_by_count ?? 0));
      const rightQuality =
        (canonicalDoi(rightWork.doi) ? 10 : 0) +
        (rightWork.abstract_inverted_index ? 2 : 0) +
        Math.log1p(Number(rightWork.cited_by_count ?? 0));
      return rightQuality - leftQuality || left.localeCompare(right);
    })[0];
    representativeByRoot.set(root, representative);
    for (const id of group) aliases.set(id, representative);
  }
  const works = new Map();
  const depths = new Map();
  const sources = new Map();
  for (const [root, group] of groups) {
    const representative = representativeByRoot.get(root);
    const selected = structuredClone(input.works.get(representative));
    selected.referenced_works = [
      ...new Set(
        group.flatMap((id) =>
          [...referenceIds(input.works.get(id))]
            .map((target) => aliases.get(target) ?? target)
            .filter((target) => target !== representative)
            .map((target) => `https://openalex.org/${target}`),
        ),
      ),
    ];
    selected.related_works = [
      ...new Set(
        group.flatMap((id) =>
          (input.works.get(id).related_works ?? [])
            .map((target) => aliases.get(canonicalOpenAlexId(target)) ?? canonicalOpenAlexId(target))
            .filter((target) => target && target !== representative)
            .map((target) => `https://openalex.org/${target}`),
        ),
      ),
    ];
    selected.cited_by_count = Math.max(
      ...group.map((id) => Number(input.works.get(id).cited_by_count ?? 0)),
    );
    works.set(representative, selected);
    depths.set(
      representative,
      group.reduce(
        (combined, id) => ({
          backward: minimumHop(combined.backward, input.depths.get(id)?.backward),
          forward: minimumHop(combined.forward, input.depths.get(id)?.forward),
        }),
        { backward: null, forward: null },
      ),
    );
    sources.set(
      representative,
      new Set(group.flatMap((id) => [...(input.sources.get(id) ?? [])])),
    );
  }
  for (const work of works.values()) {
    work.referenced_works = [
      ...new Set(
        [...referenceIds(work)]
          .map((target) => aliases.get(target) ?? target)
          .filter((target) => target !== workId(work))
          .map((target) => `https://openalex.org/${target}`),
      ),
    ];
  }
  return {
    works,
    depths,
    sources,
    deduplicated: ids.length - works.size,
  };
}

function validateMap(value) {
  if (!validateSchema(value)) {
    throw new FieldHistoryError(
      'SCHEMA_VALIDATION_FAILED',
      'FieldHistoryMap does not satisfy its JSON Schema',
      clone(validateSchema.errors),
    );
  }
  const nodeIds = new Set();
  for (const node of value.nodes) {
    if (nodeIds.has(node.id)) {
      throw new FieldHistoryError(
        'DOMAIN_VALIDATION_FAILED',
        `duplicate field-history node: ${node.id}`,
      );
    }
    nodeIds.add(node.id);
  }
  if (!nodeIds.has(value.seed.workId)) {
    throw new FieldHistoryError(
      'DOMAIN_VALIDATION_FAILED',
      'the resolved seed must exist in nodes',
    );
  }
  const edgeIds = new Set();
  for (const edge of value.edges) {
    if (edgeIds.has(edge.id)) {
      throw new FieldHistoryError(
        'DOMAIN_VALIDATION_FAILED',
        `duplicate field-history edge: ${edge.id}`,
      );
    }
    edgeIds.add(edge.id);
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new FieldHistoryError(
        'DOMAIN_VALIDATION_FAILED',
        `edge ${edge.id} references a missing node`,
      );
    }
  }
  for (const [view, ids] of Object.entries(value.views)) {
    const index = view === 'backboneEdges' ? edgeIds : nodeIds;
    for (const id of ids) {
      if (!index.has(id)) {
        throw new FieldHistoryError(
          'DOMAIN_VALIDATION_FAILED',
          `${view} references a missing ${view === 'backboneEdges' ? 'edge' : 'node'}: ${id}`,
        );
      }
    }
  }
  return value;
}

function edgeId(type, source, target) {
  return `${type}:${source}:${target}`;
}

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

function sourceToNode(work, context) {
  const id = workId(work);
  const abstract = reconstructAbstract(work.abstract_inverted_index);
  return {
    id,
    title: workTitle(work) || id,
    abstract,
    workType: work.type ?? null,
    year: Number.isInteger(work.publication_year) ? work.publication_year : null,
    publicationDate: work.publication_date ?? null,
    doi: canonicalDoi(work.doi),
    openAlexUrl: `https://openalex.org/${id}`,
    venue:
      work.primary_location?.source?.display_name ??
      work.best_oa_location?.source?.display_name ??
      null,
    authors: (work.authorships ?? [])
      .map((authorship) => ({
        id: authorship?.author?.id ?? null,
        name: authorship?.author?.display_name ?? '',
      }))
      .filter((author) => author.name),
    topics: topicEntries(work),
    citationCount: Math.max(0, Math.trunc(Number(work.cited_by_count ?? 0))),
    referencedWorkIds: [...referenceIds(work)].sort(),
    depth: context.depth,
    discoverySources: [...context.discoverySources].sort(),
    roles: context.roles,
    relevance: context.relevance,
    scores: context.scores,
    backbone: {
      connectivity: 0,
      bridge: 0,
      lineage: 0,
      total: 0,
      selected: false,
    },
    why: context.why,
    sourceAccess: abstract ? 'abstract' : 'metadata_only',
    scientificEvidence: false,
    executableHistory: resolveExecutableHistory(
      work,
      context.executableHistoryLinks,
    ),
  };
}

function unclassifiedRelation(basis) {
  return {
    kind: 'unclassified',
    confidence: 0,
    basis: [basis],
    accessLevel: 'metadata_only',
    needsFullTextReview: true,
  };
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
    this.backboneExtractor = options.backboneExtractor ?? new BackboneExtractor();
    this.now = options.now ?? (() => new Date().toISOString());
  }

  validate(value) {
    return clone(validateMap(clone(value)));
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

    const deduplicated = deduplicateWorks({ works, depths, sources, seedId });
    works = deduplicated.works;
    depths = deduplicated.depths;
    sources = deduplicated.sources;
    if (deduplicated.deduplicated > 0) {
      limitations.push(
        `Deduplicated ${deduplicated.deduplicated} OpenAlex record(s) by DOI or matching title, authors, and publication window.`,
      );
    }

    const relevanceById = this.relevanceRanker.rank({
      seed,
      works,
      depths,
      sources,
      threshold: relevanceThreshold,
    });
    const frontierCutoff = currentYear - frontierYears + 1;
    const retention = retainBalancedCandidates({
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
    const seedReferences = referenceIds(seed);
    const supportById = new Map();
    for (const work of includedWorks.values()) {
      for (const target of referenceIds(work)) {
        if (includedWorks.has(target)) {
          supportById.set(target, (supportById.get(target) ?? 0) + 1);
        }
      }
    }
    const maximumSupport = Math.max(1, ...supportById.values());
    const maximumCitations = Math.max(
      1,
      ...[...includedWorks.values()].map((work) => Number(work.cited_by_count ?? 0)),
    );
    const nodes = [];
    for (const work of includedWorks.values()) {
      const id = workId(work);
      const depth = depths.get(id) ?? { backward: null, forward: null };
      const discoverySources = sources.get(id) ?? new Set();
      const roles = [];
      const why = [];
      if (id === seedId) {
        roles.push('seed');
        why.push(`Resolved from the input by ${resolved.resolution}.`);
      } else {
        if (depth.backward > 0) {
          roles.push('foundation');
          why.push(`Reached at backward citation hop ${depth.backward}.`);
        }
        const sharedReferences = intersectionSize(seedReferences, referenceIds(work));
        if (
          discoverySources.has('related') ||
          (sharedReferences > 0 && !(depth.backward > 0))
        ) {
          roles.push('branch');
          if (discoverySources.has('related')) {
            why.push('Listed by OpenAlex as algorithmically related.');
          }
          if (sharedReferences > 0) {
            why.push(`Shares ${sharedReferences} reference(s) with the seed work.`);
          }
        }
        if (depth.forward > 0) {
          roles.push('derivative');
          why.push(`Reached at forward citation hop ${depth.forward}.`);
        }
        if (
          Number.isInteger(work.publication_year) &&
          work.publication_year >= frontierCutoff &&
          (discoverySources.has('topic_frontier') || depth.forward > 0)
        ) {
          roles.push('frontier');
          why.push(
            discoverySources.has('topic_frontier')
              ? 'Discovered from the seed topic across the field, independent of direct citation.'
              : `Published within the ${frontierYears}-year frontier window.`,
          );
        }
        if (roles.length === 0) roles.push('branch');
      }
      const citationStrength =
        Math.log1p(Number(work.cited_by_count ?? 0)) / Math.log1p(maximumCitations);
      const historicalSupport = (supportById.get(id) ?? 0) / maximumSupport;
      const sharedReferenceScore = Math.min(
        1,
        intersectionSize(seedReferences, referenceIds(work)) /
          Math.max(1, Math.min(seedReferences.size, 10)),
      );
      const recency = Number.isInteger(work.publication_year)
        ? Math.max(0, 1 - Math.max(0, currentYear - work.publication_year) / 10)
        : 0;
      const relevance = relevanceById.get(id);
      if (retention.balanced.has(id)) {
        relevance.included = true;
        why.push(
          'Retained for role coverage because at least two independent relevance signals or a citation-linked domain anchor agree.',
        );
      }
      why.push(...relevance.reasons);
      const importance = clamp(
        0.45 * relevance.total +
          0.25 * citationStrength +
          0.15 * historicalSupport +
          0.1 * recency +
          0.05 * sharedReferenceScore,
      );
      nodes.push(
        sourceToNode(work, {
          depth,
          discoverySources,
          roles: dedupeStrings(roles),
          relevance,
          scores: {
            citationStrength: roundScore(citationStrength),
            historicalSupport: roundScore(historicalSupport),
            sharedReferences: roundScore(sharedReferenceScore),
            topicOverlap: relevance.topicOverlap,
            recency: roundScore(recency),
            total: roundScore(importance),
          },
          why: dedupeStrings(why),
          executableHistoryLinks: input?.executableHistoryLinks,
        }),
      );
    }
    nodes.sort((left, right) => {
      if (left.id === seedId) return -1;
      if (right.id === seedId) return 1;
      return (left.year ?? 0) - (right.year ?? 0) || left.id.localeCompare(right.id);
    });

    const nodeIds = new Set(nodes.map((node) => node.id));
    const edges = [];
    const seenEdges = new Set();
    const addEdge = (edge) => {
      if (seenEdges.has(edge.id)) return;
      seenEdges.add(edge.id);
      edges.push(edge);
    };
    for (const [source, work] of includedWorks) {
      for (const target of referenceIds(work)) {
        if (!nodeIds.has(target)) continue;
        const researchRelation = this.relationClassifier.classify({
          source: work,
          target: includedWorks.get(target),
          edgeType: 'cites',
        });
        addEdge({
          id: edgeId('cites', source, target),
          source,
          target,
          type: 'cites',
          directed: true,
          score: 1,
          basis: ['OpenAlex referenced_works metadata.'],
          researchRelation,
          sourceAccess: researchRelation.accessLevel,
          scientificEvidence: false,
        });
      }
    }
    for (const [id, work] of includedWorks) {
      if (id === seedId) continue;
      if (sources.get(id)?.has('related')) {
        addEdge({
          id: edgeId('semantic_similarity', seedId, id),
          source: seedId,
          target: id,
          type: 'semantic_similarity',
          directed: false,
          score: relevanceById.get(id).topicOverlap,
          basis: ['OpenAlex related_works metadata.'],
          researchRelation: unclassifiedRelation(
            'Semantic similarity alone does not establish scientific inheritance.',
          ),
          sourceAccess: 'metadata_only',
          scientificEvidence: false,
        });
      }
      if (depths.get(id)?.backward > 0) continue;
      const shared = [...referenceIds(work)].filter((target) => seedReferences.has(target));
      if (shared.length === 0) continue;
      addEdge({
        id: edgeId('bibliographic_coupling', seedId, id),
        source: seedId,
        target: id,
        type: 'bibliographic_coupling',
        directed: false,
        score: roundScore(shared.length / Math.max(1, seedReferences.size)),
        basis: [`Shared references: ${shared.sort().join(', ')}`],
        researchRelation: unclassifiedRelation(
          'Shared references suggest proximity but not a substantive relationship.',
        ),
        sourceAccess: 'metadata_only',
        scientificEvidence: false,
      });
    }
    edges.sort((left, right) => left.id.localeCompare(right.id));

    const backbone = this.backboneExtractor.extract({
      nodes,
      edges,
      seedId,
      maxNodes: limits.backbone,
    });
    for (const node of nodes) node.backbone = backbone.scores.get(node.id);
    const relationSummary = Object.fromEntries(RELATION_KINDS.map((kind) => [kind, 0]));
    for (const edge of edges.filter((edge) => edge.type === 'cites')) {
      relationSummary[edge.researchRelation.kind] += 1;
    }

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
    return clone(validateMap(result));
  }

  toCytoscape(value) {
    const map = validateMap(clone(value));
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
