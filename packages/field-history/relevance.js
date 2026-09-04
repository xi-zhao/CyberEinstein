import {
  clamp,
  intersectionSize,
  reconstructAbstract,
  referenceIds,
  roundScore,
  topicEntries,
  workId,
  workTitle,
} from './model.js';

const STOPWORDS = new Set(
  `a an and are as at be been between by can for from has have in into is it its may of on or our that the their these this through to towards using via was we were which with within without study studies result results paper approach based new`.split(' '),
);

export const DEFAULT_RELEVANCE_WEIGHTS = Object.freeze({
  text: 0.55,
  topic: 0.2,
  citation: 0.15,
  graph: 0.1,
});

const SIGNALS = Object.keys(DEFAULT_RELEVANCE_WEIGHTS);

function enabledSignals(features = {}) {
  return Object.fromEntries(
    SIGNALS.map((signal) => [signal, features[signal] !== false]),
  );
}

function normalizedWeights(weights, features) {
  const active = enabledSignals(features);
  const selected = Object.fromEntries(
    SIGNALS.map((signal) => [signal, Math.max(0, Number(weights[signal] ?? 0))]),
  );
  const total = Object.values(selected).reduce((sum, value) => sum + value, 0);
  if (total === 0) throw new TypeError('at least one relevance signal must be enabled');
  return Object.fromEntries(
    SIGNALS.map((signal) => [
      signal,
      active[signal] ? selected[signal] / total : 0,
    ]),
  );
}

function tokens(value) {
  const raw = String(value ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u2010-\u2015-]/g, ' ')
    .match(/[\p{L}\p{N}]+/gu)
    ?.filter((token) => token.length > 2 && !STOPWORDS.has(token)) ?? [];
  return raw.map((token) => {
    if (/^comput(?:e|er|ing|ation|ational)$/.test(token)) return 'compute';
    if (/^toleran(?:t|ce)$/.test(token)) return 'tolerance';
    if (/^correct(?:ion|ing|ed)$/.test(token)) return 'correct';
    if (/^scal(?:e|ed|ing|able)$/.test(token)) return 'scale';
    if (/^superconduct(?:ing|or|ors)$/.test(token)) return 'superconduct';
    if (/^topolog(?:y|ies|ical|ically)$/.test(token)) return 'topolog';
    if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
    return token.length > 4 && token.endsWith('s') && !/(?:ss|us|is)$/.test(token)
      ? token.slice(0, -1)
      : token;
  });
}

function titleTerms(work) {
  return tokens(workTitle(work));
}

export function workTitleTokens(work) {
  return tokens(workTitle(work));
}

function abstractTerms(work) {
  const abstract = tokens(reconstructAbstract(work?.abstract_inverted_index));
  const keywords = (work?.keywords ?? []).flatMap((keyword) =>
    tokens(keyword?.display_name ?? keyword?.keyword),
  );
  return [...abstract, ...keywords];
}

function documentTerms(work) {
  const title = titleTerms(work);
  return [...title, ...title, ...title, ...abstractTerms(work)];
}

function vectorize(termList, inverseDocumentFrequency) {
  const counts = new Map();
  for (const term of termList) counts.set(term, (counts.get(term) ?? 0) + 1);
  const vector = new Map();
  for (const [term, count] of counts) {
    const weight = (1 + Math.log(count)) * (inverseDocumentFrequency.get(term) ?? 1);
    vector.set(term, weight);
  }
  return vector;
}

function cosine(left, right) {
  if (left.size === 0 || right.size === 0) return 0;
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (const value of left.values()) leftNorm += value * value;
  for (const value of right.values()) rightNorm += value * value;
  for (const [term, value] of left) dot += value * (right.get(term) ?? 0);
  if (leftNorm === 0 || rightNorm === 0) return 0;
  return dot / Math.sqrt(leftNorm * rightNorm);
}

function vectorsFor(works, termsForWork) {
  const termsById = new Map(
    works.map((work) => [workId(work), termsForWork(work)]),
  );
  const documentFrequency = new Map();
  for (const terms of termsById.values()) {
    for (const term of new Set(terms)) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }
  const inverseDocumentFrequency = new Map(
    [...documentFrequency].map(([term, count]) => [
      term,
      Math.log((works.length + 1) / (count + 1)) + 1,
    ]),
  );
  return new Map(
    [...termsById].map(([id, terms]) => [
      id,
      vectorize(terms, inverseDocumentFrequency),
    ]),
  );
}

function weightedTopicOverlap(seed, candidate) {
  const left = new Map(topicEntries(seed).map((topic) => [topic.id, topic.score]));
  const right = new Map(topicEntries(candidate).map((topic) => [topic.id, topic.score]));
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  let union = 0;
  for (const id of new Set([...left.keys(), ...right.keys()])) {
    shared += Math.min(left.get(id) ?? 0, right.get(id) ?? 0);
    union += Math.max(left.get(id) ?? 0, right.get(id) ?? 0);
  }
  return union === 0 ? 0 : shared / union;
}

function minimumDepth(depth = {}) {
  const values = [depth.backward, depth.forward].filter(
    (value) => Number.isInteger(value) && value > 0,
  );
  return values.length ? Math.min(...values) : null;
}

export class RelevanceRanker {
  constructor(options = {}) {
    this.weights = { ...DEFAULT_RELEVANCE_WEIGHTS, ...options.weights };
  }

  rank(input) {
    const works = [...input.works.values()];
    const seedId = workId(input.seed);
    const threshold = input.threshold ?? 0.3;
    const weights = normalizedWeights(
      { ...this.weights, ...input.weights },
      input.features,
    );
    const vectors = vectorsFor(works, documentTerms);
    const seedVector = vectors.get(seedId);
    const seedReferences = referenceIds(input.seed);
    const connectivity = new Map();
    for (const work of works) {
      const source = workId(work);
      for (const target of referenceIds(work)) {
        if (!input.works.has(target)) continue;
        connectivity.set(source, (connectivity.get(source) ?? 0) + 1);
        connectivity.set(target, (connectivity.get(target) ?? 0) + 1);
      }
    }
    const maximumConnectivity = Math.max(1, ...connectivity.values());
    const result = new Map();
    for (const work of works) {
      const id = workId(work);
      if (id === seedId) {
        result.set(id, {
          included: true,
          textSimilarity: 1,
          topicOverlap: 1,
          citationProximity: 1,
          graphConnectivity: roundScore((connectivity.get(id) ?? 0) / maximumConnectivity),
          total: 1,
          reasons: ['Seed work is always retained.'],
        });
        continue;
      }
      const textSimilarity = cosine(seedVector, vectors.get(id));
      const topicOverlap = weightedTopicOverlap(input.seed, work);
      const depth = minimumDepth(input.depths.get(id));
      let citationProximity = depth ? 1 / depth : 0;
      if (seedReferences.has(id) || referenceIds(work).has(seedId)) citationProximity = 1;
      if (input.sources.get(id)?.has('related')) citationProximity = Math.max(citationProximity, 0.45);
      if (input.sources.get(id)?.has('topic_frontier')) citationProximity = Math.max(citationProximity, 0.4);
      const graphConnectivity = (connectivity.get(id) ?? 0) / maximumConnectivity;
      const total = clamp(
        weights.text * textSimilarity +
          weights.topic * topicOverlap ** 2 +
          weights.citation * citationProximity +
          weights.graph * graphConnectivity,
      );
      const reasons = [];
      if (textSimilarity >= 0.2) reasons.push(`Title/abstract TF-IDF similarity ${roundScore(textSimilarity)}.`);
      if (topicOverlap > 0) reasons.push(`Weighted OpenAlex topic overlap ${roundScore(topicOverlap)}.`);
      if (depth) reasons.push(`Connected at citation hop ${depth}.`);
      if (graphConnectivity > 0) reasons.push(`Graph connectivity ${roundScore(graphConnectivity)}.`);
      if (reconstructAbstract(work?.abstract_inverted_index) === null) {
        reasons.push('No abstract was available; relevance confidence is reduced.');
      }
      result.set(id, {
        included: total >= threshold,
        textSimilarity: roundScore(textSimilarity),
        topicOverlap: roundScore(topicOverlap),
        citationProximity: roundScore(citationProximity),
        graphConnectivity: roundScore(graphConnectivity),
        total: roundScore(total),
        reasons,
      });
    }
    return result;
  }
}
