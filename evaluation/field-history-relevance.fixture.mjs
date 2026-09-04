const topic = (id, name, score = 0.9) => ({
  id: `https://openalex.org/${id}`,
  display_name: name,
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

function work(id, title, options = {}) {
  return {
    id: `https://openalex.org/${id}`,
    title,
    publication_year: options.year ?? 2024,
    publication_date: `${options.year ?? 2024}-01-01`,
    cited_by_count: options.citations ?? 0,
    referenced_works: (options.references ?? []).map(
      (reference) => `https://openalex.org/${reference}`,
    ),
    related_works: [],
    topics: options.topics ?? [],
    abstract_inverted_index: options.abstract
      ? invertedAbstract(options.abstract)
      : undefined,
  };
}

const seed = work('W100', 'Non-Bloch Band Theory', {
  year: 2018,
  references: ['W1', 'W2'],
  topics: [
    topic('T1', 'Non-Hermitian physics'),
    topic('T2', 'Topological phases'),
  ],
  abstract: 'non Hermitian topology generalized Brillouin zone skin effect bulk boundary theory',
});

const candidates = [
  work('W1', 'Topological Foundation', {
    year: 2011,
    topics: [topic('T1', 'Non-Hermitian physics')],
    abstract: 'topological phases and bulk boundary theory',
  }),
  work('W2', 'Non-Hermitian Foundation', {
    year: 2014,
    references: ['W1'],
    topics: [topic('T1', 'Non-Hermitian physics')],
    abstract: 'non Hermitian band topology foundation',
  }),
  work('W5', 'Bulk Boundary Follow-up', {
    year: 2020,
    references: ['W100', 'W1'],
    topics: [topic('T1', 'Non-Hermitian physics')],
    abstract: 'theoretical extension of non Bloch bulk boundary correspondence',
  }),
  work('W7', 'Latest Experimental Test', {
    year: 2026,
    references: ['W100', 'W2'],
    topics: [topic('T1', 'Non-Hermitian physics')],
    abstract: 'experimental observation of the non Hermitian skin effect',
  }),
  work('W91', 'Non-Bloch Topological Spectral Winding', {
    year: 2025,
    topics: [
      topic('T1', 'Non-Hermitian physics'),
      topic('T2', 'Topological phases'),
    ],
    abstract: 'non Hermitian topological spectral winding transition',
  }),
  work('W92', 'Non-Hermitian Spectral Response Network', {
    year: 2025,
    references: ['W1', 'W2', 'W5', 'W7', 'W90', 'W94'],
    topics: [topic('T1', 'Non-Hermitian physics')],
    abstract: 'non Hermitian skin network effect response',
  }),
  work('W93', 'Non-Bloch Band Theory in a Generalized Brillouin Zone', {
    year: 2023,
    topics: [topic('T8', 'Dynamical systems')],
    abstract: 'non Bloch band theory generalized Brillouin zone skin effect',
  }),
  work('W90', 'Quantum Chemistry Energy Estimation', {
    year: 2024,
    citations: 50_000,
    references: ['W100'],
    topics: [topic('T9', 'Quantum chemistry')],
    abstract: 'molecular energy estimation chemistry electrons orbitals',
  }),
  work('W94', 'Topological Photonics Applications', {
    year: 2025,
    topics: [topic('T3', 'Topological photonics')],
    abstract: 'photonic device applications waveguide engineering',
  }),
];

const works = new Map([[seed.id.split('/').at(-1), seed]]);
for (const candidate of candidates) works.set(candidate.id.split('/').at(-1), candidate);

const depths = new Map(
  [...works.keys()].map((id) => [id, { backward: null, forward: null }]),
);
depths.set('W100', { backward: 0, forward: 0 });
depths.set('W1', { backward: 1, forward: null });
depths.set('W2', { backward: 1, forward: null });
depths.set('W5', { backward: null, forward: 1 });
depths.set('W7', { backward: null, forward: 1 });
depths.set('W90', { backward: null, forward: 1 });

const sources = new Map([...works.keys()].map((id) => [id, new Set()]));
sources.get('W91').add('topic_frontier');
sources.get('W92').add('related');
sources.get('W93').add('related');
sources.get('W94').add('related');

export const fieldHistoryRelevanceFixture = {
  seed,
  works,
  depths,
  sources,
  threshold: 0.3,
  goldRelevantIds: new Set(['W1', 'W2', 'W5', 'W7', 'W91', 'W92', 'W93']),
};
