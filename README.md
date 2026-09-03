<h1 align="center">CyberEinstein</h1>

<p align="center"><strong>Let AI inherit the path science has taken—then explore what comes next.</strong></p>

<p align="center">
  An open, evidence-native AI scientist built on the <strong>Executable History of Science</strong>.<br />
  It learns how a field reached today's frontier from papers, code, successful evidence, and failed attempts, then works with scientists on verifiable new research.
</p>

<p align="center">
  <strong>English</strong> ·
  <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="#the-executable-history-of-science">Understand the idea</a> ·
  <a href="#from-history-to-discovery">See how it researches</a> ·
  <a href="#100-papers-are-a-starting-point-not-a-trophy-wall">Inspect the evidence</a> ·
  <a href="#developer-quick-start">Run it locally</a>
</p>

> **Scientific discovery should not start from a blank prompt.**

## New ideas are abundant. The next justified step is not.

AI can already read recent papers, generate hypotheses, write code, and produce a complete-looking research report. But science is not a jump from a few abstracts to a new idea, and an Agent declaring success does not make a scientific result valid.

Every worthwhile question has a history: what prior researchers established, which code actually ran, which experiments failed, which hypotheses were refuted, which anomalies remain unexplained, and whether an old blocker has now disappeared.

If AI does not inherit that history, its ideas are rootless. It repeats old questions, falls into known failure modes, and can mistake an implementation artifact for a discovery.

CyberEinstein does not begin with an empty prompt. It begins with the evidence history of a field.

## The Executable History of Science

The **Executable History of Science** is not a paper database or a conventional knowledge graph. It preserves how scientific knowledge was produced, challenged, corrected, and extended:

```text
Historical questions
→ Claims and competing hypotheses
→ Methods, code, parameters, and environments
→ Computations, experiments, and observations
→ Supporting evidence, counterevidence, and failed attempts
→ Reviews, disputes, and corrections
→ Current consensus, unknown boundaries, and frontier opportunities
```

| Conventional literature context | Executable History of Science |
| --- | --- |
| What papers say | How conclusions were established and corrected |
| Citations and summaries | Claims, evidence, counterevidence, and dependencies |
| Final code snapshots | Correct code, parameters, environments, and real runs |
| Successful outcomes | Successes, blockers, invalid results, and failed attempts |
| Context for one answer | Scientific memory that grows across people, Agents, and projects |

This means CyberEinstein aims to understand not only what humanity currently knows, but why we believe it, where we failed, how the field arrived here, and which next step is worth taking.

## From history to discovery

Scientific discovery is not a single generation. It is a process continually corrected by observation. CyberEinstein's intended research loop is:

### 1. Reconstruct the history

Connect papers, Claims, code, parameters, runs, evidence, counterevidence, reviews, and failure lessons into an inspectable, executable scientific lineage.

### 2. Understand the state of the field

Distinguish stable consensus, competing explanations, popular but weakly supported Claims, historical blockers, anomalies, exhausted paths, and emerging topics.

### 3. Select a frontier opportunity

Do not rush to generate ideas. First judge which question combines scientific value, novelty, discriminating power, executability, and potential impact, with explicit cost, risk, and validation conditions.

### 4. Conduct original research

Use historically validated code and methods to form competing hypotheses, design computations or experiments that distinguish them, invoke real tools, and let observations change the next action.

### 5. Search for counterevidence

The discovery process advances a hypothesis; an independent validation process searches for counterexamples, alternative explanations, and implementation errors. Agent completion is not scientific validity.

### 6. Write the result back into history

Whether the outcome is a candidate new Claim, a negative result, or an objective blocker, preserve the full basis so the next researcher and the next Agent do not start over.

CyberEinstein's ultimate output is not a chat transcript or an automatically generated paper. It is a piece of research that can be inspected, challenged, reproduced, and continued.

## Our compounding moat

The Executable History of Science is the core, but it is not the whole moat. CyberEinstein combines seven mutually reinforcing layers:

| Moat | What CyberEinstein accumulates | What researchers gain |
| --- | --- | --- |
| Data | Executable scientific history, correct code, evidence, and failed attempts | No restart from abstracts and empty files |
| Cognition | Continuously updated models of a field's state | A view of consensus, disputes, anomalies, and the real frontier |
| Decision | Historically grounded research-opportunity selection | Resources go to the next study worth running |
| Execution | Domain tools, scientific runtimes, simulators, and future instrument interfaces | Hypotheses become real observations |
| Trust | Claim-first rules, falsification, independent review, and external reproduction | A reason to believe a result beyond the Agent's own claim |
| Network | Researchers, labs, reviewers, and tool builders | One contribution improves the scientific memory of the field |
| Open ecosystem | Inspectable rules, shared protocols, replaceable models, and self-hosting | No lock-in to an opaque system or a single model provider |

The durable advantage is not one Agent workflow. It is a compounding loop:

```text
More historical reproductions
→ More accurate field state
→ Better frontier opportunities
→ More credible new research
→ More evidence from successes, failures, and reviews
→ A richer Executable History of Science
```

## Three projects, one scientific evidence chain

| Project | Role | Primary output |
| --- | --- | --- |
| [PRAgent](https://github.com/xi-zhao/PRAgent) | Historical evidence engine | Turns papers and Claims into runnable, checkable `ReproductionCase` objects |
| [RunThePaper](https://github.com/xi-zhao/RunThePaper) | Public validation ground and community entry point | Exposes real runs, successful evidence, failed attempts, and remaining boundaries |
| **CyberEinstein** | Scientific discovery system | Inherits field history, selects the next research step, and produces new verifiable evidence |

```text
PRAgent reconstructs historical research
→ RunThePaper exposes and validates the history
→ CyberEinstein understands the frontier and conducts new research
→ New successes and failures return to the Executable History of Science
```

PRAgent is not CyberEinstein's final positioning. It gives CyberEinstein a way to understand known science before generating unknown conclusions on top of an unverified history.

## 100 papers are a starting point, not a trophy wall

[RunThePaper](https://github.com/xi-zhao/RunThePaper) contains 100 public physics-paper reproduction cases and a frozen [Claim-first audit of the 100-paper cohort](https://github.com/xi-zhao/RunThePaper/tree/main/evaluation/claim-first-100). Together they form the beginning of CyberEinstein's first executable scientific history.

| Public evidence | Audited result |
| --- | ---: |
| Paper cases | 100 |
| Authored Claims | 1,427 |
| Claim Checks | 3,933 |
| Reproduced Checks | 2,068 |
| Objectively blocked Checks | 1,134 |
| Attempted but not reproduced | 731 |
| Pending Checks | 0 |

With equal weight per numerical Claim, successful coverage is **40.55%**. Conditional Fidelity is **92.97/100** on successful Claims with eligible scientific-region evidence, covering **23.37%** of successful Claim mass.

This does not mean that all 100 papers were completely reproduced. It means that all 3,933 Checks have a direct Claim mapping and terminal outcome; successful, objectively blocked, and genuinely unsuccessful attempts remain in the history.

For CyberEinstein, a failed attempt is not noise to delete. It is negative knowledge that can stop future research from repeating the same mistake.

## Who CyberEinstein is for

The first core users are researchers who own a real open problem and can judge the scientific validity of a result:

- PIs, postdoctoral researchers, doctoral researchers, and scientific engineers;
- labs centered on theoretical, computational, or data-driven research;
- research institutes and R&D teams building AI for Science capabilities;
- organizations that need local deployment, replaceable models, and auditable research processes.

The first vertical covers quantum computing, quantum information, many-body physics, non-Hermitian physics, and adjacent computational physics. This is not CyberEinstein's final disciplinary boundary. It is the first area where we have domain judgment, historical cases, and executable tools.

The intended user does not ask, “Give me ten new ideas.” They bring a harder question:

> Why did this problem remain unsolved? Which paths already failed? What conditions have changed? Which next computation or experiment would best distinguish the competing explanations?

## Open means more than public code

CyberEinstein is intended to open its code and the core protocols needed for scientific collaboration: `Claim`, `Evidence`, `ReproductionCase`, `FailureLesson`, field state, research opportunities, and the future `DiscoveryCase`.

Openness lets researchers inspect how conclusions were produced, connect private data and tools locally, add capabilities for new disciplines, and collectively extend the Executable History of Science through reproduction, correction, and independent review.

> The GitHub repository is currently developed in public, but it does not yet include an open-source license and `package.json` still declares `UNLICENSED`. Until a license is added, it is not formally released as open-source software.

Once the license is decided, open protocols, community contributions, domain plugins, and self-hosted deployment will become a central part of CyberEinstein's compounding moat.

## What exists today—and what comes next

We keep the implemented foundation separate from unfinished product capability.

| Status | Capability |
| --- | --- |
| Implemented | Official `@deepseek-ai/dsh@0.1.1-rc.2` Agent, Session, permissions, Web, and Cordis plugin foundation |
| Implemented | Bounded paper-discovery and permitted full-text adapters |
| Implemented | Deep Literature Research with evidence, counterevidence, contradictions, gaps, and explicit stop decisions |
| Implemented | Persistent, versioned `ReproductionCase` state with evidence, concurrency, and independent-review rules |
| Building | A cross-paper, cross-project Executable History of Science from RunThePaper and PRAgent assets |
| Building | Field state, frontier opportunities, competing hypotheses, and `DiscoveryCase` domain models |
| Long term | A scientific-discovery loop, cross-project learning, and explicitly authorized access to real observations and instruments |

CyberEinstein is not yet a finished autonomous scientist. The current repository is building the hardest-to-replace foundation: scientific history, evidence, and failure that an Agent can genuinely inherit.

## Scientific rules that do not change

- Every new Claim connects to historical grounding, execution evidence, counterevidence, and uncertainty.
- Computational and experimental results trace back to code, environment, parameters, inputs, and observations.
- Novelty describes a real delta from existing Claims; it is not established by model self-report.
- Discovery, falsification, and independent review remain separate processes.
- Blocked, negative, and invalid results remain part of scientific history.
- Publication, external writes, expensive computation, and physical equipment control require human authorization.
- Lowering the barrier to research never means lowering evidence, reproduction, or review standards.

See the detailed [development vision](docs/development-vision.md) and [architecture principles](docs/architecture.md).

## Developer quick start

### Requirements

- Node.js 24 or newer (22.19+ is also supported)
- Corepack / pnpm
- Python 3.11–3.14 and [uv](https://docs.astral.sh/uv/)

### Install and verify

```bash
git clone https://github.com/xi-zhao/CyberEinstein.git
cd CyberEinstein
corepack pnpm install
corepack pnpm setup
corepack pnpm test
```

Static checks do not require an API key. Before running a real model task:

```bash
cp .env.example .env
# Edit .env and add DEEPSEEK_API_KEY
corepack pnpm dsh:web
```

The workbench starts at `http://127.0.0.1:3080`. You can also check individual foundations:

```bash
corepack pnpm pragent:sources:check
corepack pnpm deep-research:check
corepack pnpm dsh:headless -- "Reconstruct this field's evidence history and current disputes"
```

Implementation details:

- [PRAgent source integration](docs/pragent-source-integrations.md)
- [Deep Literature Research](docs/deep-literature-research.md)
- [ReproductionCase domain service](docs/reproduction-case.md)
- [DeepSeek Harness baseline](docs/harness-integration.md)

## Start from here

If you have a question worth investigating, do not ask AI to start from a blank prompt.

- Explore [RunThePaper's 100 public cases](https://github.com/xi-zhao/RunThePaper#paper-reproduction-catalog) to see how existing evidence enters the history.
- Run CyberEinstein locally and inspect its scientific objects, evidence rules, and Agent foundation.
- Bring a research direction, a piece of correct code, a failed attempt, or a better validation method, and [start a discussion](https://github.com/xi-zhao/CyberEinstein/issues/new).

<p align="center"><strong>Inherit every step science has taken. Then take the next one.</strong></p>
