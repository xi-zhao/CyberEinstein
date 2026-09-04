import {
  canonicalDoi,
  canonicalOpenAlexId,
  intersectionSize,
  normalizeTitle,
  reconstructAbstract,
  referenceIds,
  workId,
  workTitle,
} from './model.js';
import { workTitleTokens } from './relevance.js';

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

export class BalancedCandidateSelector {
  select(input) {
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

export class WorkDeduplicator {
  deduplicate(input) {
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
              .map(
                (target) =>
                  aliases.get(canonicalOpenAlexId(target)) ?? canonicalOpenAlexId(target),
              )
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
}
