#!/usr/bin/env node
import {
  RelevanceRanker,
  runRelevanceAblation,
} from '../packages/field-history/index.js';
import { fieldHistoryRelevanceFixture as fixture } from '../evaluation/field-history-relevance.fixture.mjs';

const report = runRelevanceAblation({
  ranker: new RelevanceRanker(),
  rankInput: {
    seed: fixture.seed,
    works: fixture.works,
    depths: fixture.depths,
    sources: fixture.sources,
    threshold: fixture.threshold,
  },
  goldRelevantIds: fixture.goldRelevantIds,
});

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
