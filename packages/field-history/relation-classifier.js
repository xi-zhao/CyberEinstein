import {
  reconstructAbstract,
  roundScore,
  workTitle,
} from './model.js';

const CUES = {
  review_citation: [
    /\breview\b/i,
    /\bsurvey\b/i,
    /\bperspective\b/i,
    /\broadmap\b/i,
    /\btutorial\b/i,
    /\boverview\b/i,
  ],
  contradiction_or_debate: [
    /\bcounterexample\b/i,
    /\bno[- ]go\b/i,
    /\bbreakdown\b/i,
    /\bchallenge(?:s|d|ing)?\b/i,
    /\bcontradict(?:s|ion|ory)?\b/i,
    /\babsence of\b/i,
    /\bfails? to\b/i,
    /\blimitations? of\b/i,
  ],
  experimental_validation: [
    /\bexperiment(?:al|ally)?\b/i,
    /\bobserv(?:e|ed|ation|ing)\b/i,
    /\bmeasurement\b/i,
    /\brealization\b/i,
    /\bdemonstration\b/i,
    /\bhardware\b/i,
    /\bfabricat(?:e|ed|ion)\b/i,
  ],
  engineering_application: [
    /\bapplication(?:s)?\b/i,
    /\bapplied to\b/i,
    /\bdevice\b/i,
    /\bsensor(?:s|ing)?\b/i,
    /\bengineering\b/i,
    /\bpractical implementation\b/i,
  ],
  method_improvement: [
    /\bimprov(?:e|ed|ement|ing)\b/i,
    /\befficient\b/i,
    /\balgorithm\b/i,
    /\bprotocol\b/i,
    /\bdecoder\b/i,
    /\boptimization\b/i,
    /\bmethod\b/i,
    /\bscheme\b/i,
  ],
  theoretical_extension: [
    /\btheor(?:y|etical|em)\b/i,
    /\bmodel\b/i,
    /\bframework\b/i,
    /\bgeneraliz(?:e|ed|ation)\b/i,
    /\bextension\b/i,
    /\banalytical\b/i,
    /\bnumerical\b/i,
  ],
};

function matches(text, patterns) {
  return patterns
    .map((pattern) => text.match(pattern)?.[0]?.toLowerCase())
    .filter(Boolean);
}

export class ResearchRelationClassifier {
  classify(input) {
    if (input.edgeType !== 'cites') {
      return {
        kind: 'unclassified',
        confidence: 0,
        basis: ['A derived graph relation is not a scientific inheritance claim.'],
        accessLevel: 'metadata_only',
        needsFullTextReview: true,
      };
    }
    const title = workTitle(input.source);
    const abstract = reconstructAbstract(input.source?.abstract_inverted_index);
    const titleText = title.toLowerCase();
    const combined = `${title}\n${abstract ?? ''}`;
    const candidates = [];
    for (const [kind, patterns] of Object.entries(CUES)) {
      const titleMatches = matches(titleText, patterns);
      const abstractMatches = matches(combined, patterns);
      const typeBoost = kind === 'review_citation' && input.source?.type === 'review' ? 3 : 0;
      const weight = typeBoost + titleMatches.length * 2 + abstractMatches.length;
      if (weight > 0) candidates.push({ kind, titleMatches, abstractMatches, weight, typeBoost });
    }
    candidates.sort((left, right) => {
      const priority = [
        'contradiction_or_debate',
        'review_citation',
        'experimental_validation',
        'engineering_application',
        'method_improvement',
        'theoretical_extension',
      ];
      return right.weight - left.weight || priority.indexOf(left.kind) - priority.indexOf(right.kind);
    });
    if (candidates.length === 0) {
      return {
        kind: 'unclassified',
        confidence: 0.2,
        basis: ['No reliable title or abstract cue identified the citation function.'],
        accessLevel: abstract ? 'abstract' : 'metadata_only',
        needsFullTextReview: true,
      };
    }
    const best = candidates[0];
    const cueWords = [...new Set([...best.titleMatches, ...best.abstractMatches])];
    const confidence = Math.min(
      0.9,
      0.42 + best.titleMatches.length * 0.14 + best.abstractMatches.length * 0.05 + best.typeBoost * 0.08,
    );
    const basis = [];
    if (best.typeBoost) basis.push('OpenAlex work type is review.');
    if (cueWords.length) basis.push(`Matched ${best.kind} cue(s): ${cueWords.slice(0, 6).join(', ')}.`);
    basis.push('Relationship label is a discovery hypothesis pending full-text verification.');
    return {
      kind: best.kind,
      confidence: roundScore(confidence),
      basis,
      accessLevel: abstract ? 'abstract' : 'metadata_only',
      needsFullTextReview: true,
    };
  }
}
