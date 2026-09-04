const VARIANTS = Object.freeze([
  ['full', {}],
  ['without_text', { text: false }],
  ['without_topic', { topic: false }],
  ['without_citation', { citation: false }],
  ['without_graph', { graph: false }],
]);

function divide(numerator, denominator) {
  return denominator === 0 ? 0 : numerator / denominator;
}

function rounded(value) {
  return Number(value.toFixed(4));
}

function metrics(result, goldRelevantIds, seedId) {
  const predicted = new Set(
    [...result]
      .filter(([id, score]) => id !== seedId && score.included)
      .map(([id]) => id),
  );
  const gold = new Set([...goldRelevantIds].filter((id) => id !== seedId));
  const truePositive = [...predicted].filter((id) => gold.has(id)).length;
  const falsePositive = [...predicted].filter((id) => !gold.has(id)).length;
  const falseNegative = [...gold].filter((id) => !predicted.has(id)).length;
  const precision = divide(truePositive, truePositive + falsePositive);
  const recall = divide(truePositive, truePositive + falseNegative);
  const f1 = divide(2 * precision * recall, precision + recall);
  return {
    precision: rounded(precision),
    recall: rounded(recall),
    f1: rounded(f1),
    truePositive,
    falsePositive,
    falseNegative,
  };
}

export function runRelevanceAblation(input) {
  const fullResult = input.ranker.rank(input.rankInput);
  const seedId = workId(input.rankInput.seed);
  const fullMetrics = metrics(fullResult, input.goldRelevantIds, seedId);
  const variants = VARIANTS.map(([name, disabled]) => {
    const result = name === 'full'
      ? fullResult
      : input.ranker.rank({
          ...input.rankInput,
          features: { ...input.rankInput.features, ...disabled },
        });
    const measured = metrics(result, input.goldRelevantIds, seedId);
    return {
      name,
      ...measured,
      f1DeltaFromFull: rounded(measured.f1 - fullMetrics.f1),
    };
  });
  return {
    threshold: input.rankInput.threshold ?? 0.3,
    candidateCount: Math.max(0, input.rankInput.works.size - 1),
    goldRelevantCount: Math.max(0, input.goldRelevantIds.size - (input.goldRelevantIds.has(seedId) ? 1 : 0)),
    variants,
  };
}
import { workId } from './model.js';
