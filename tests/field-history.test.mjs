import assert from 'node:assert/strict';
import test from 'node:test';
import { fieldHistoryRelevanceFixture } from '../evaluation/field-history-relevance.fixture.mjs';
import {
  CitationTraversal,
  FieldHistoryBenchmark,
  FieldHistoryError,
  FieldHistoryService,
  MemoryResponseCache,
  OpenAlexClient,
  RelevanceRanker,
  ResearchRelationClassifier,
  TopicFrontierDiscovery,
  apply,
  evaluateBackboneAgainstReviewConsensus,
  evaluateBackboneStability,
  evaluateTemporalFrontier,
  renderFieldHistoryHtml,
  runRelevanceAblation,
} from '../packages/field-history/index.js';

const topic = (id, displayName, score = 0.9) => ({
  id: `https://openalex.org/${id}`,
  display_name: displayName,
  score,
});

function invertedAbstract(text) {
  const result = {};
  text.split(/\s+/).forEach((token, position) => {
    if (!result[token]) result[token] = [];
    result[token].push(position);
  });
  return result;
}

const work = (id, title, year, options = {}) => ({
  id: `https://openalex.org/${id}`,
  title,
  publication_year: year,
  publication_date: `${year}-01-01`,
  doi: options.doi ?? null,
  cited_by_count: options.citations ?? 0,
  referenced_works: (options.references ?? []).map(
    (reference) => `https://openalex.org/${reference}`,
  ),
  related_works: (options.related ?? []).map(
    (related) => `https://openalex.org/${related}`,
  ),
  abstract_inverted_index: options.abstract
    ? invertedAbstract(options.abstract)
    : undefined,
  type: options.type ?? 'article',
  topics: options.topics ?? [topic('T1', 'Non-Hermitian physics')],
  authorships: [
    {
      author: {
        id: `https://openalex.org/A${id.slice(1)}`,
        display_name: `Author ${id}`,
      },
    },
  ],
  primary_location: {
    source: { display_name: options.venue ?? 'Journal of Test Physics' },
  },
});

const seed = work('W100', 'Non-Bloch Band Theory', 2018, {
  doi: 'https://doi.org/10.1103/physrevlett.121.086803',
  citations: 900,
  references: ['W1', 'W2'],
  related: ['W3', 'W4'],
  topics: [
    topic('T1', 'Non-Hermitian physics'),
    topic('T2', 'Topological phases'),
  ],
  abstract: 'non Hermitian topology generalized Brillouin zone bulk boundary and skin effect theory',
});
const referenceOne = work('W1', 'Topological Foundation', 2011, {
  citations: 1200,
  abstract: 'topological phases and bulk boundary theory',
});
const referenceTwo = work('W2', 'Non-Hermitian Foundation', 2014, {
  citations: 700,
  references: ['W1'],
  topics: [topic('T1', 'Non-Hermitian physics')],
  abstract: 'non Hermitian band topology foundation',
});
const relatedOne = work('W3', 'Parallel Non-Bloch Theory', 2019, {
  citations: 400,
  references: ['W1', 'W2'],
  topics: [topic('T1', 'Non-Hermitian physics')],
  abstract: 'parallel non Bloch theory for non Hermitian systems',
});
const relatedFrontier = work('W4', 'New Non-Hermitian Direction', 2025, {
  citations: 20,
  references: ['W1'],
  topics: [topic('T1', 'Non-Hermitian physics'), topic('T3', 'Photonics')],
  abstract: 'new non Hermitian photonic direction with skin modes',
});
const influentialCiter = work('W5', 'Bulk Boundary Follow-up', 2020, {
  citations: 600,
  references: ['W100', 'W1'],
  topics: [topic('T1', 'Non-Hermitian physics')],
  abstract: 'theoretical extension of non Bloch bulk boundary correspondence',
});
const frontierCiter = work('W6', 'Frontier Generalization', 2025, {
  citations: 80,
  references: ['W100', 'W1', 'W2'],
  topics: [topic('T1', 'Non-Hermitian physics'), topic('T2', 'Topological phases')],
  abstract: 'generalization of non Hermitian topological band theory',
});
const newestCiter = work('W7', 'Latest Experimental Test of the Non-Hermitian Skin Effect', 2026, {
  citations: 5,
  references: ['W100', 'W2'],
  topics: [topic('T1', 'Non-Hermitian physics')],
  abstract: 'experimental observation of the non Hermitian skin effect',
});

function response(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function createFixtureClient(requests) {
  return new OpenAlexClient({
    apiKey: 'test-secret',
    fetch: async (request, options) => {
      const url = new URL(request);
      requests.push({
        path: url.pathname,
        parameters: Object.fromEntries(url.searchParams),
        authorization: options.headers.authorization,
      });
      if (url.pathname === '/works/W100') return response(seed);
      const filter = url.searchParams.get('filter');
      if (filter === 'openalex:W1|W2') {
        return response({ results: [referenceOne, referenceTwo] });
      }
      if (filter === 'openalex:W3|W4') {
        return response({ results: [relatedOne, relatedFrontier] });
      }
      if (filter === 'cites:W100' && url.searchParams.get('sort') === 'cited_by_count:desc') {
        return response({ results: [influentialCiter, frontierCiter] });
      }
      if (filter === 'cites:W100' && url.searchParams.get('sort') === 'publication_date:desc') {
        return response({ results: [newestCiter, frontierCiter] });
      }
      if (filter?.startsWith('topics.id:T1|T2,from_publication_date:')) {
        return response(
          url.searchParams.get('sort') === 'publication_date:desc'
            ? { results: [newestCiter, relatedFrontier] }
            : { results: [relatedFrontier, newestCiter] },
        );
      }
      return response({ error: `unexpected request ${url}` }, 404);
    },
  });
}

test('Field History reconstructs foundations, branches, derivatives, and frontier', async () => {
  const requests = [];
  const client = createFixtureClient(requests);
  const service = new FieldHistoryService({
    client,
    now: () => '2026-09-03T12:00:00.000Z',
  });
  const map = await service.build({
    seed: 'W100',
    citationDepth: 1,
    relevanceThreshold: 0.2,
    executableHistoryLinks: {
      '10.1103/physrevlett.121.086803': {
        reproductionCaseIds: ['rc_non_bloch'],
        claimIds: ['claim_skin_effect'],
        runIds: ['run_figure_1'],
        failureLessonIds: ['failure_boundary_condition'],
      },
    },
  });

  assert.equal(map.status, 'bounded_complete');
  assert.equal(map.schemaVersion, '0.2.0');
  assert.equal(map.seed.workId, 'W100');
  assert.equal(map.provider.accessLevel, 'metadata_and_abstract');
  assert.equal(map.provider.scientificEvidence, false);
  assert.equal(map.provider.requestCount, 7);
  assert.equal(map.nodes.length, 8);
  assert.deepEqual(new Set(map.views.foundations), new Set(['W1', 'W2']));
  assert(map.views.branches.includes('W3'));
  assert(map.views.derivatives.includes('W5'));
  assert(map.views.derivatives.includes('W6'));
  assert(map.views.frontier.includes('W4'));
  assert(map.views.frontier.includes('W6'));
  assert(map.views.frontier.includes('W7'));
  assert(map.views.backbone.includes('W100'));
  assert(map.views.backbone.length < map.nodes.length);
  assert(map.views.backboneEdges.every((id) => map.edges.some((edge) => edge.id === id)));

  const seedNode = map.nodes.find((node) => node.id === 'W100');
  const influentialFoundation = map.nodes.find((node) => node.id === 'W1');
  assert.deepEqual(seedNode.executableHistory.reproductionCaseIds, ['rc_non_bloch']);
  assert.equal(influentialFoundation.scores.citationStrength, 1);
  assert.notEqual(
    influentialFoundation.scores.total,
    influentialFoundation.relevance.total,
  );
  assert(map.nodes.every((node) => node.scientificEvidence === false));
  assert(map.edges.some((edge) => edge.id === 'cites:W6:W100'));
  assert.equal(
    map.edges.find((edge) => edge.id === 'cites:W7:W100').researchRelation.kind,
    'experimental_validation',
  );
  assert(
    map.edges.some(
      (edge) =>
        edge.id === 'bibliographic_coupling:W100:W3' && edge.directed === false,
    ),
  );
  assert(requests.every((request) => request.authorization === 'Bearer test-secret'));

  const cytoscape = service.toCytoscape(map);
  assert.equal(cytoscape.elements.nodes.length, map.nodes.length);
  assert.equal(cytoscape.elements.edges.length, map.edges.length);
  assert(
    cytoscape.elements.nodes.find((node) => node.data.id === 'W7').classes.includes('frontier'),
  );
});

test('Field History preserves a partial map when one metadata expansion fails', async () => {
  const client = {
    baseUrl: 'https://api.openalex.org/',
    requestCount: 0,
    async resolveWork() {
      this.requestCount += 1;
      return { work: seed, input: 'W100', resolution: 'openalex_id' };
    },
    async getWorksByIds(ids) {
      this.requestCount += 1;
      if (ids.includes('W1')) throw new Error('reference batch timed out');
      return [relatedOne, relatedFrontier];
    },
    async getCitingWorks(_id, options) {
      this.requestCount += 1;
      return options.sort === 'cited_by_count:desc'
        ? [influentialCiter]
        : [newestCiter];
    },
    async getTopicWorks() {
      this.requestCount += 1;
      return [];
    },
  };
  const service = new FieldHistoryService({
    client,
    now: () => '2026-09-03T12:00:00.000Z',
  });
  const map = await service.build({
    seed: 'W100',
    citationDepth: 1,
    relevanceThreshold: 0.2,
  });

  assert.equal(map.status, 'partial');
  assert(map.limitations.some((item) => item.includes('reference batch timed out')));
  assert(map.views.derivatives.includes('W5'));
  assert.equal(service.validate(map).id, map.id);
});

test('Field History rejects promotion of metadata into scientific evidence', async () => {
  const service = new FieldHistoryService({
    client: createFixtureClient([]),
    now: () => '2026-09-03T12:00:00.000Z',
  });
  const map = await service.build({ seed: 'W100' });
  map.nodes[0].scientificEvidence = true;

  assert.throws(
    () => service.validate(map),
    (error) =>
      error instanceof FieldHistoryError && error.code === 'SCHEMA_VALIDATION_FAILED',
  );
});

test('Field History exposes a Cordis domain service', () => {
  let provided;
  apply(
    {
      provide(name, service) {
        provided = { name, service };
      },
    },
    { client: createFixtureClient([]) },
  );
  assert.equal(provided.name, 'fieldHistory');
  assert(provided.service instanceof FieldHistoryService);
});

test('Field History renders a self-contained interactive connection graph', async () => {
  const service = new FieldHistoryService({
    client: createFixtureClient([]),
    now: () => '2026-09-03T12:00:00.000Z',
  });
  const map = await service.build({ seed: 'W100' });
  const html = renderFieldHistoryHtml(map);
  const balancedFrontier = map.nodes.find((node) => node.id === 'W4');

  assert(balancedFrontier.relevance.total < map.scope.relevanceThreshold);
  assert(
    balancedFrontier.why.some((reason) => reason.includes('at least two independent')),
  );
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /CyberEinstein · Field History/);
  assert.match(html, /Non-Bloch Band Theory/);
  assert.match(html, /cytoscape/);
  assert.match(html, /元数据线索，不是科研证据/);
  assert.match(html, /历史主干/);
  assert.match(html, /反驳与争议/);
  assert(!html.includes('<script src='));
  assert(html.length > 100_000);
});

test('Citation traversal follows two-hop history and descendants independently', async () => {
  const backwardTwo = work('W0', 'Earlier Non-Hermitian Theory', 2005, {
    abstract: 'early non Hermitian spectral theory',
  });
  const forwardTwo = work('W8', 'Second Generation Skin Effect', 2024, {
    references: ['W5'],
    abstract: 'second generation non Hermitian skin effect theory',
  });
  const client = {
    async getWorksByIds(ids) {
      if (ids.includes('W1')) return [referenceOne, { ...referenceTwo, referenced_works: ['https://openalex.org/W0'] }];
      if (ids.includes('W0')) return [backwardTwo];
      return [];
    },
    async getCitingWorks(ids) {
      return ids.includes('W100') ? [influentialCiter] : [forwardTwo];
    },
  };
  const traversal = await new CitationTraversal({ client }).expand(seed, {
    depth: 2,
    relatedLimit: 0,
    maxWorks: 30,
  });

  assert.equal(traversal.depths.get('W0').backward, 2);
  assert.equal(traversal.depths.get('W8').forward, 2);
  assert.equal(traversal.stats.backwardDepthCompleted, 2);
  assert.equal(traversal.stats.forwardDepthCompleted, 2);
});

test('Backward traversal ranks reference metadata before applying the hop cap', async () => {
  const broadSeed = work('W500', 'Capped Reference Selection', 2020, {
    references: ['W11', 'W12', 'W99'],
  });
  const lowOne = work('W11', 'Low Impact Reference One', 2010, { citations: 1 });
  const lowTwo = work('W12', 'Low Impact Reference Two', 2010, { citations: 2 });
  const important = work('W99', 'Canonical High Impact Reference', 2005, {
    citations: 10_000,
  });
  const traversal = await new CitationTraversal({
    client: {
      async getWorksByIds() {
        return [lowOne, lowTwo, important];
      },
      async getCitingWorks() {
        return [];
      },
    },
  }).expand(broadSeed, {
    depth: 1,
    referencesPerHop: 2,
    relatedLimit: 0,
    maxWorks: 20,
  });

  assert(traversal.works.has('W99'));
  assert.equal(traversal.stats.backwardWorks, 2);
});

test('Research relation classifier distinguishes the six requested functions', () => {
  const classifier = new ResearchRelationClassifier();
  const cases = [
    ['Generalized Theory and Analytical Model', 'theoretical_extension'],
    ['An Efficient Decoder Method', 'method_improvement'],
    ['Experimental Observation in Hardware', 'experimental_validation'],
    ['Sensor Application and Device Engineering', 'engineering_application'],
    ['A Review and Roadmap', 'review_citation'],
    ['Counterexample and Breakdown of the Theory', 'contradiction_or_debate'],
  ];
  for (const [index, [title, expected]] of cases.entries()) {
    const relation = classifier.classify({
      source: work(`W9${index}`, title, 2025, { abstract: title }),
      target: seed,
      edgeType: 'cites',
    });
    assert.equal(relation.kind, expected, title);
    assert.equal(relation.needsFullTextReview, true);
  }
});

test('Topic frontier discovery does not depend on seed citers', async () => {
  const requests = [];
  const discovery = new TopicFrontierDiscovery({
    client: createFixtureClient(requests),
  });
  const result = await discovery.discover(seed, {
    currentYear: 2026,
    years: 3,
    limit: 4,
  });

  assert.deepEqual(result.topicIds, ['T1', 'T2']);
  assert(result.works.some((candidate) => candidate.id.endsWith('/W4')));
  assert.equal(requests.length, 2);
  assert(requests.every((request) => request.parameters.filter.includes('topics.id:T1|T2')));
});

test('Field History orchestrator accepts independently injected discovery modules', async () => {
  const service = new FieldHistoryService({
    resolver: {
      async resolveWork() {
        return { work: seed, input: 'W100', resolution: 'openalex_id' };
      },
    },
    traversal: {
      async expand() {
        return {
          works: new Map([['W100', seed]]),
          depths: new Map([['W100', { backward: 0, forward: 0 }]]),
          sources: new Map([['W100', new Set(['seed'])]]),
          limitations: [],
          stats: {
            backwardDepthCompleted: 2,
            forwardDepthCompleted: 2,
            backwardWorks: 0,
            forwardWorks: 0,
            relatedWorks: 0,
          },
        };
      },
    },
    frontierDiscovery: {
      async discover() {
        return { works: [], topicIds: ['T1', 'T2'], limitations: [] };
      },
    },
    now: () => '2026-09-03T12:00:00.000Z',
  });

  const map = await service.build({ seed: 'W100' });
  assert.equal(map.nodes.length, 1);
  assert.deepEqual(map.views.backbone, ['W100']);
});

test('Field History merges preprint and published records before ranking', async () => {
  const published = {
    ...referenceOne,
    doi: 'https://doi.org/10.1000/topological-foundation',
  };
  const preprint = work('W10', referenceOne.title, 2010, {
    citations: 5_000,
    abstract: 'topological phases and bulk boundary theory preprint',
  });
  preprint.authorships = published.authorships;
  const distinctHomonym = work('W11', referenceOne.title, 2011, {
    citations: 300,
    abstract: 'topological phases and bulk boundary theory independently derived',
  });
  const highCitationNoise = work(
    'W90',
    'Quantum Phase Estimation with Three Control Qubits',
    2026,
    {
      citations: 50_000,
      references: ['W100'],
      topics: [topic('T1', 'Non-Hermitian physics'), topic('T2', 'Topological phases')],
      abstract: 'generic quantum algorithm for energy estimation and chemistry simulation',
    },
  );
  const service = new FieldHistoryService({
    resolver: {
      async resolveWork() {
        return { work: seed, input: 'W100', resolution: 'openalex_id' };
      },
    },
    traversal: {
      async expand() {
        return {
          works: new Map([
            ['W100', seed],
            ['W1', published],
            ['W10', preprint],
            ['W11', distinctHomonym],
            ['W90', highCitationNoise],
          ]),
          depths: new Map([
            ['W100', { backward: 0, forward: 0 }],
            ['W1', { backward: 1, forward: null }],
            ['W10', { backward: 1, forward: null }],
            ['W11', { backward: 1, forward: null }],
            ['W90', { backward: null, forward: 1 }],
          ]),
          sources: new Map([
            ['W100', new Set(['seed'])],
            ['W1', new Set(['citation_history'])],
            ['W10', new Set(['citation_history'])],
            ['W11', new Set(['citation_history'])],
            ['W90', new Set(['citation_descendant'])],
          ]),
          limitations: [],
          stats: {
            backwardDepthCompleted: 1,
            forwardDepthCompleted: 1,
            backwardWorks: 2,
            forwardWorks: 0,
            relatedWorks: 0,
          },
        };
      },
    },
    frontierDiscovery: {
      async discover() {
        return { works: [], topicIds: ['T1', 'T2'], limitations: [] };
      },
    },
    now: () => '2026-09-03T12:00:00.000Z',
  });

  const map = await service.build({ seed: 'W100', relevanceThreshold: 0.1 });
  const matches = map.nodes.filter((node) => node.title === referenceOne.title);

  assert.deepEqual(new Set(matches.map((node) => node.id)), new Set(['W1', 'W11']));
  assert.equal(matches.find((node) => node.id === 'W1').citationCount, 5_000);
  assert(!map.nodes.some((node) => node.id === 'W90'));
  assert(map.excludedCandidates.some((candidate) => candidate.id === 'W90'));
  assert(map.limitations.some((item) => item.includes('Deduplicated 1 OpenAlex record')));
});

test('Relevance ablation is reproducible across four independent signals', () => {
  const fixture = fieldHistoryRelevanceFixture;
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

  assert.equal(report.variants.length, 5);
  assert.equal(report.variants[0].name, 'full');
  assert.equal(report.candidateCount, 9);
  assert(report.variants.every((variant) => Number.isFinite(variant.f1)));
  const [full, ...ablated] = report.variants;
  assert.equal(full.f1, 1);
  assert(ablated.every((variant) => variant.f1 < full.f1), JSON.stringify(report));
  const fullRanking = new RelevanceRanker().rank({
    seed: fixture.seed,
    works: fixture.works,
    depths: fixture.depths,
    sources: fixture.sources,
    threshold: fixture.threshold,
  });
  assert.equal(fullRanking.get('W90').included, false);
});

test('OpenAlex retries transient failures and serves repeated reads from cache', async () => {
  let calls = 0;
  const sleeps = [];
  const client = new OpenAlexClient({
    cache: new MemoryResponseCache(),
    maxRetries: 2,
    retryBaseDelayMs: 1,
    sleep: async (milliseconds) => sleeps.push(milliseconds),
    fetch: async () => {
      calls += 1;
      if (calls === 1) {
        return new Response(JSON.stringify({ error: 'temporary' }), {
          status: 429,
          headers: { 'content-type': 'application/json', 'retry-after': '0' },
        });
      }
      return response({ results: [seed] });
    },
  });

  const first = await client.listWorks({ search: 'non-bloch' });
  const second = await client.listWorks({ search: 'non-bloch' });

  assert.equal(first.results[0].title, seed.title);
  assert.deepEqual(second, first);
  assert.equal(calls, 2);
  assert.equal(client.requestCount, 2);
  assert.equal(client.retryCount, 1);
  assert.equal(client.cacheHits, 1);
  assert.deepEqual(sleeps, [0]);
});

test('OpenAlex recovers records omitted from a successful batch response', async () => {
  const calls = [];
  const client = new OpenAlexClient({
    maxRetries: 0,
    fetch: async (request) => {
      const url = new URL(request);
      calls.push(url.pathname);
      if (url.pathname === '/works') return response({ results: [referenceOne] });
      if (url.pathname === '/works/W2') return response(referenceTwo);
      return response({ error: 'not found' }, 404);
    },
  });

  const works = await client.getWorksByIds(['W1', 'W2']);

  assert.deepEqual(new Set(works.map((item) => item.id.split('/').at(-1))), new Set(['W1', 'W2']));
  assert.deepEqual(calls, ['/works', '/works/W2']);
});

test('OpenAlex negatively caches missing records for bounded recovery latency', async () => {
  let calls = 0;
  const client = new OpenAlexClient({
    cache: new MemoryResponseCache(),
    maxRetries: 0,
    fetch: async () => {
      calls += 1;
      return response({ error: 'not found' }, 404);
    },
  });

  await assert.rejects(() => client.getWork('W999'));
  await assert.rejects(() => client.getWork('W999'));

  assert.equal(calls, 1);
  assert.equal(client.cacheHits, 1);
});

test('Review consensus evaluates historical backbone without human labels', () => {
  const reviewOne = work('W80', 'Review of Non-Hermitian Topology', 2024, {
    type: 'review',
    references: ['W1', 'W2', 'W3', 'W70'],
  });
  const reviewTwo = work('W81', 'Survey of Non-Bloch Physics', 2025, {
    type: 'review',
    references: ['W1', 'W2', 'W3', 'W71'],
  });
  const map = {
    seed: { workId: 'W100', year: 2018 },
    views: { foundations: ['W1', 'W2', 'W3'] },
    nodes: [
      { id: 'W1', roles: ['foundation'], citationCount: 1200 },
      { id: 'W2', roles: ['foundation'], citationCount: 700 },
      { id: 'W3', roles: ['foundation'], citationCount: 400 },
    ],
  };
  const result = evaluateBackboneAgainstReviewConsensus({
    map,
    reviews: [reviewOne, reviewTwo],
    referenceWorks: [referenceOne, referenceTwo, { ...relatedOne, publication_year: 2017 }],
    minimumGold: 3,
    k: 3,
  });

  assert.equal(result.status, 'complete');
  assert.equal(result.consensusReferenceCount, 3);
  assert.equal(result.system.recallAtK, 1);
  assert.equal(result.system.ndcgAtK, 1);
});

test('Multi-seed stability measures overlap of independent backbone maps', () => {
  const result = evaluateBackboneStability([
    { seed: { workId: 'W100' }, views: { backbone: ['W100', 'W1', 'W2', 'W3'] } },
    { seed: { workId: 'W101' }, views: { backbone: ['W101', 'W1', 'W2', 'W4'] } },
    { seed: { workId: 'W102' }, views: { backbone: ['W102', 'W1', 'W2', 'W5'] } },
  ]);

  assert.equal(result.status, 'complete');
  assert.equal(result.pairs.length, 3);
  assert.equal(result.meanJaccard, 0.5);
  assert.equal(result.meanOverlapCoefficient, 0.6667);
});

test('Temporal frontier backtest uses only citations available at the cutoff', () => {
  const candidates = [];
  for (let index = 0; index < 12; index += 1) {
    const candidate = work(`W2${index}`, `Non-Hermitian Skin Effect Advance ${index}`, 2021, {
      citations: 101,
      topics: [topic('T1', 'Non-Hermitian physics'), topic('T2', 'Topological phases')],
      abstract: 'non Hermitian topology skin effect generalized Brillouin zone',
    });
    candidate.counts_by_year = [
      { year: 2021, cited_by_count: 1 },
      { year: 2022, cited_by_count: 2 },
      { year: 2023, cited_by_count: 20 },
      { year: 2024, cited_by_count: 35 },
      { year: 2025, cited_by_count: 43 },
    ];
    candidates.push(candidate);
  }
  for (let index = 0; index < 12; index += 1) {
    const candidate = work(`W3${index}`, `Broad Quantum Platform Report ${index}`, 2021, {
      citations: 62,
      topics: [topic('T1', 'Non-Hermitian physics')],
      abstract: 'general quantum platform system report',
    });
    candidate.counts_by_year = [
      { year: 2021, cited_by_count: 20 },
      { year: 2022, cited_by_count: 30 },
      { year: 2023, cited_by_count: 4 },
      { year: 2024, cited_by_count: 4 },
      { year: 2025, cited_by_count: 4 },
    ];
    candidates.push(candidate);
  }

  const result = evaluateTemporalFrontier({
    seed,
    candidates,
    cutoffYear: 2022,
    horizonYears: 3,
    minimumRelevance: 0.1,
    k: 10,
  });

  assert.equal(result.status, 'complete');
  assert(result.system.ndcgAtK > result.citationOnlyBaseline.ndcgAtK);
  assert(result.system.liftOverCandidateRate > 1);
});

test('Automated benchmark reports inconclusive evidence instead of inventing a pass', async () => {
  const benchmark = new FieldHistoryBenchmark({
    client: createFixtureClient([]),
    now: () => '2026-09-03T12:00:00.000Z',
  });
  const result = await benchmark.temporalFrontierBacktest(seed, {
    cutoffYear: 2022,
    candidateLimit: 10,
  });

  assert.equal(result.status, 'inconclusive');
});
