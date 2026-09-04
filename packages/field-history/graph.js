import {
  canonicalDoi,
  clamp,
  dedupeStrings,
  intersectionSize,
  reconstructAbstract,
  referenceIds,
  resolveExecutableHistory,
  roundScore,
  topicEntries,
  workId,
  workTitle,
} from './model.js';

export const RELATION_KINDS = [
  'theoretical_extension',
  'method_improvement',
  'experimental_validation',
  'engineering_application',
  'review_citation',
  'contradiction_or_debate',
  'unclassified',
];

function edgeId(type, source, target) {
  return `${type}:${source}:${target}`;
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

export class FieldGraphAssembler {
  constructor(options = {}) {
    this.relationClassifier = options.relationClassifier;
    if (!this.relationClassifier?.classify) {
      throw new TypeError('FieldGraphAssembler requires a relationClassifier with classify()');
    }
  }

  async assemble(input) {
    const seedReferences = referenceIds(input.seed);
    const supportById = new Map();
    for (const work of input.includedWorks.values()) {
      for (const target of referenceIds(work)) {
        if (input.includedWorks.has(target)) {
          supportById.set(target, (supportById.get(target) ?? 0) + 1);
        }
      }
    }
    const maximumSupport = Math.max(1, ...supportById.values());
    const maximumCitations = Math.max(
      1,
      ...[...input.includedWorks.values()].map((work) =>
        Number(work.cited_by_count ?? 0),
      ),
    );
    const nodes = [];
    for (const work of input.includedWorks.values()) {
      const id = workId(work);
      const depth = input.depths.get(id) ?? { backward: null, forward: null };
      const discoverySources = input.sources.get(id) ?? new Set();
      const roles = [];
      const why = [];
      if (id === input.seedId) {
        roles.push('seed');
        why.push(`Resolved from the input by ${input.resolution}.`);
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
          work.publication_year >= input.frontierCutoff &&
          (discoverySources.has('topic_frontier') || depth.forward > 0)
        ) {
          roles.push('frontier');
          why.push(
            discoverySources.has('topic_frontier')
              ? 'Discovered from the seed topic across the field, independent of direct citation.'
              : `Published within the ${input.frontierYears}-year frontier window.`,
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
        ? Math.max(0, 1 - Math.max(0, input.currentYear - work.publication_year) / 10)
        : 0;
      const relevance = input.relevanceById.get(id);
      if (input.balanced.has(id)) {
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
          executableHistoryLinks: input.executableHistoryLinks,
        }),
      );
    }
    nodes.sort((left, right) => {
      if (left.id === input.seedId) return -1;
      if (right.id === input.seedId) return 1;
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
    for (const [source, work] of input.includedWorks) {
      for (const target of referenceIds(work)) {
        if (!nodeIds.has(target)) continue;
        const researchRelation = await this.relationClassifier.classify({
          source: work,
          target: input.includedWorks.get(target),
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
    for (const [id, work] of input.includedWorks) {
      if (id === input.seedId) continue;
      if (input.sources.get(id)?.has('related')) {
        addEdge({
          id: edgeId('semantic_similarity', input.seedId, id),
          source: input.seedId,
          target: id,
          type: 'semantic_similarity',
          directed: false,
          score: input.relevanceById.get(id).topicOverlap,
          basis: ['OpenAlex related_works metadata.'],
          researchRelation: unclassifiedRelation(
            'Semantic similarity alone does not establish scientific inheritance.',
          ),
          sourceAccess: 'metadata_only',
          scientificEvidence: false,
        });
      }
      if (input.depths.get(id)?.backward > 0) continue;
      const shared = [...referenceIds(work)].filter((target) =>
        seedReferences.has(target),
      );
      if (shared.length === 0) continue;
      addEdge({
        id: edgeId('bibliographic_coupling', input.seedId, id),
        source: input.seedId,
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

    const relationSummary = Object.fromEntries(
      RELATION_KINDS.map((kind) => [kind, 0]),
    );
    for (const edge of edges.filter((edge) => edge.type === 'cites')) {
      relationSummary[edge.researchRelation.kind] += 1;
    }
    return { nodes, edges, relationSummary };
  }
}
