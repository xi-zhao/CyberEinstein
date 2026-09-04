import { clamp, roundScore } from './model.js';

function normalizedLog(value, maximum) {
  return Math.log1p(value) / Math.log1p(Math.max(1, maximum));
}

export class BackboneExtractor {
  extract(input) {
    const maxNodes = input.maxNodes ?? 30;
    const targetSize = Math.min(
      maxNodes,
      input.nodes.length,
      Math.max(5, Math.ceil(input.nodes.length * 0.55)),
    );
    const citationEdges = input.edges.filter((edge) => edge.type === 'cites');
    const incoming = new Map();
    const outgoing = new Map();
    for (const edge of citationEdges) {
      incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
      outgoing.set(edge.source, (outgoing.get(edge.source) ?? 0) + 1);
    }
    const maximumDegree = Math.max(
      1,
      ...input.nodes.map(
        (node) => (incoming.get(node.id) ?? 0) + (outgoing.get(node.id) ?? 0),
      ),
    );
    const maximumCitations = Math.max(1, ...input.nodes.map((node) => node.citationCount));
    const scores = new Map();
    for (const node of input.nodes) {
      const inDegree = incoming.get(node.id) ?? 0;
      const outDegree = outgoing.get(node.id) ?? 0;
      const connectivity = (inDegree + outDegree) / maximumDegree;
      const bridge = inDegree > 0 && outDegree > 0
        ? (2 * Math.min(inDegree, outDegree)) / (inDegree + outDegree)
        : 0;
      const citationStrength = normalizedLog(node.citationCount, maximumCitations);
      const lineage = Math.max(node.relevance.citationProximity, node.relevance.topicOverlap * 0.5);
      const total = clamp(
        0.08 * node.relevance.total +
          0.07 * connectivity +
          0.75 * citationStrength +
          0.05 * bridge +
          0.05 * lineage,
      );
      scores.set(node.id, {
        connectivity: roundScore(connectivity),
        bridge: roundScore(bridge),
        lineage: roundScore(lineage),
        total: roundScore(node.id === input.seedId ? 1 : total),
        selected: false,
      });
    }

    const selected = new Set([input.seedId]);
    const choose = (candidates, count) => {
      candidates
        .sort(
          (left, right) =>
            scores.get(right.id).total - scores.get(left.id).total ||
            (left.year ?? 0) - (right.year ?? 0) ||
            left.id.localeCompare(right.id),
        )
        .slice(0, count)
        .forEach((node) => selected.add(node.id));
    };
    const backwardDepths = new Set(
      input.nodes.map((node) => node.depth.backward).filter((value) => value > 0),
    );
    const forwardDepths = new Set(
      input.nodes.map((node) => node.depth.forward).filter((value) => value > 0),
    );
    for (const depth of [...backwardDepths].sort()) {
      choose(input.nodes.filter((node) => node.depth.backward === depth), 5);
    }
    for (const depth of [...forwardDepths].sort()) {
      choose(input.nodes.filter((node) => node.depth.forward === depth), 5);
    }
    choose(
      input.nodes.filter((node) => !selected.has(node.id)),
      Math.max(0, targetSize - selected.size),
    );
    if (selected.size > targetSize) {
      const ranked = [...selected]
        .filter((id) => id !== input.seedId)
        .sort((left, right) => scores.get(right).total - scores.get(left).total)
        .slice(0, targetSize - 1);
      selected.clear();
      selected.add(input.seedId);
      ranked.forEach((id) => selected.add(id));
    }
    for (const id of selected) scores.get(id).selected = true;
    const ids = [...selected].sort(
      (left, right) =>
        scores.get(right).total - scores.get(left).total || left.localeCompare(right),
    );
    const edgeIds = citationEdges
      .filter((edge) => selected.has(edge.source) && selected.has(edge.target))
      .map((edge) => edge.id)
      .sort();
    return { scores, ids, edgeIds };
  }
}
