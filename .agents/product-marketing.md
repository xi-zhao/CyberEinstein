# Product Marketing Context

**Document version:** v2
**Last updated:** 2026-09-03

## Product Overview

**One-liner:**
CyberEinstein is an open-by-design, evidence-native AI scientist built on the Executable History of Science. It inherits how a field reached today's frontier, then helps scientists conduct verifiable new research.

中文：CyberEinstein 是一个建立在“可执行科学史”之上的开放、证据原生 AI 科学家系统。它继承一个学科如何走到今天，再与科学家共同开展可验证的新研究。

**What it does:**
CyberEinstein reconstructs scientific history as connected Claims, methods, code, parameters, runs, evidence, counterevidence, reviews, and failed attempts—not as a folder of papers. It uses that executable history to model the current state of a field, identify high-value frontier opportunities, generate historically grounded hypotheses, execute computational or experimental studies, challenge the results, and add every success or failure back to the shared history.

**Product category:**
AI scientist / evidence-native scientific discovery infrastructure / research operating system.

**Product type:**
Publicly developed research software and an intended open-source scientific ecosystem. The repository is public, but an explicit open-source license has not yet been selected; do not claim formal open-source status until that is resolved.

**Business model:**
Not yet decided. Plausible future paths include a self-hosted community edition plus hosted, private-deployment, collaboration, compute, or integration services, but none is an announced offer.

**Product relationship:**

| Project | Role in the system | Message |
| --- | --- | --- |
| RunThePaper | Public evidence and validation ground | Shows what was run, what worked, what failed, and where evidence stops |
| PRAgent | Historical evidence production engine | Turns papers and Claims into runnable, checkable, extendable `ReproductionCase` objects |
| CyberEinstein | Scientific discovery system | Inherits the evidence history of a field, identifies the next worthwhile question, and conducts new research |

**Current stage:**
The repository contains the runtime foundation, bounded paper-source adapters, a deep literature research Skill, and a persistent `ReproductionCase` domain service. The Executable History of Science, field-state model, opportunity engine, and complete original-discovery loop remain the product direction and are not yet a finished end-to-end experience.

## Target Audience

**Target organizations:**

- Academic labs and research groups conducting computational or theory-led science
- Research institutes building AI for Science infrastructure
- R&D teams that need auditable, private, model-independent scientific workflows
- Initial vertical: quantum computing, quantum information, many-body physics, non-Hermitian physics, and adjacent computational physics

**Decision-makers:**
Principal investigators, research directors, heads of AI for Science, research platform leads, and R&D leaders.

**Primary users:**
PIs, postdoctoral researchers, doctoral researchers, research scientists, and scientific software engineers who own a real open problem and can judge the scientific validity of results.

**Primary use case:**
Start from an open scientific question, anomaly, dataset, or hypothesis; understand how the field reached its current frontier; identify the most valuable next research action; execute and challenge it; and produce a traceable candidate new Claim.

**Jobs to be done:**

- “Show me what this field has genuinely established, where it failed, and what remains unresolved.”
- “Help me choose the next experiment or calculation that is both valuable and capable of distinguishing competing explanations.”
- “Let me inherit correct code, failed attempts, parameters, and evidence instead of restarting from the latest papers.”
- “Turn this open question into a verifiable research program whose state survives across people, agents, and runs.”

**Use cases:**

- Reopen an old problem whose historical blocker has disappeared because compute, data, algorithms, or instruments improved
- Find contradictions between otherwise credible Claims and design a discriminating study
- Extend a validated method into an unexplored parameter region or neighboring domain
- Investigate an anomaly that prior work treated as noise or an implementation artifact
- Maintain a long-running research program with explicit evidence, negative results, and independent reviews
- Connect private laboratory history to public scientific history without surrendering data control

## Personas

| Persona | Cares about | Challenge | Value we promise |
| --- | --- | --- | --- |
| Research lead / PI | Scientific value, novelty, team direction, credibility | Too many possible directions; research history is fragmented across people and papers | A field-level view of evidence and the next research action worth funding |
| Research operator / postdoc or PhD | Execution speed, correctness, publishable progress | Must reconstruct methods, code, failures, and context before exploring anything new | Start from executable prior work and preserve every result for the next iteration |
| Research engineer | Stable tools, reproducibility, integration, governance | Scientific logic is trapped in notebooks, chat logs, and one-off pipelines | Typed scientific objects, replaceable tools, durable state, and explicit permissions |
| Technical champion / AI4S lead | Adoption, extensibility, model independence | Closed systems are hard to inspect, integrate, or trust | An open-by-design research substrate with inspectable rules and adapters |
| Decision maker / institute or R&D leader | Research throughput, IP control, risk, collaboration | Cannot send sensitive data to opaque hosted agents or audit their conclusions | Self-hostable foundations, evidence provenance, review gates, and human authorization |
| Scientific contributor / reviewer | Attribution, rigor, reusable contribution | Negative results and corrections rarely compound into shared infrastructure | A place where one check, correction, blocker, or review improves the field history |

## Problems & Pain Points

**Core problem:**
Scientific discovery repeatedly starts with an incomplete view of the past. Papers preserve conclusions but compress the path of code, parameters, failed attempts, tacit choices, observations, and corrections that produced them. AI can generate more ideas, but an idea produced without inheriting that history is weakly grounded and likely to repeat old mistakes.

**Why alternatives fall short:**

- Literature and Deep Research tools retrieve what was written, not the complete executable path behind it
- Generic AI scientist systems often optimize for hypotheses, reports, papers, or autonomy rather than durable evidence lineage
- Knowledge graphs describe relationships but rarely preserve runnable environments, failed runs, scientific review state, and falsification boundaries
- Lab notebooks and code repositories preserve local artifacts but do not model how they change the state of a field
- Closed systems limit inspection, local deployment, model choice, external contribution, and shared validation

**What it costs users:**
Researchers repeat historical work, choose low-value experiments, lose negative knowledge when people leave, spend weeks reconstructing baselines, and risk treating implementation artifacts or plausible prose as scientific progress.

**Emotional tension:**
Scientists do not primarily fear having too few ideas. They fear spending months on an idea that was already tried, rests on a broken baseline, cannot distinguish competing mechanisms, or produces a result nobody can trust.

## Competitive Landscape

**Direct:**

- Sakana AI Scientist — public emphasis on automating the machine-learning research lifecycle and producing scientific papers
- Google AI Co-Scientist — public emphasis on multi-agent hypothesis generation, debate, ranking, and research proposals
- FutureHouse / Edison Kosmos — public emphasis on long-horizon literature and data analysis, world models, and autonomous discovery, especially in biology and biopharma

**Secondary:**

- Deep Research and scientific search tools — strong literature retrieval and synthesis but not executable evidence history
- Scientific coding agents and AutoML/AutoResearch loops — strong bounded execution and optimization but limited field-level historical memory
- Electronic lab notebooks, repositories, and workflow platforms — preserve project artifacts but do not autonomously reason over field evolution

**Indirect:**
Manual research practice spread across PDF managers, notebooks, repositories, messaging, individual memory, and undocumented failed attempts.

**Competitive interpretation:**
Do not claim that competitors ignore literature or evidence. The defensible distinction is that CyberEinstein makes the executable and falsifiable history of a field the primary product substrate, not temporary context for one generated answer.

## Differentiation

**Key differentiators:**

1. **Executable History of Science.** Historical Claims connect to methods, correct code, parameters, runs, evidence, counterevidence, reviews, and failed attempts.
2. **Field-state understanding.** The system aims to distinguish consensus, contested Claims, anomalies, historical blockers, exhausted paths, and live frontiers—not just list recent papers.
3. **Opportunity selection before idea generation.** Research directions are judged by scientific value, novelty, discriminating power, executability, expected impact, cost, and risk.
4. **Evidence-native discovery.** A candidate discovery carries its historical baseline, novelty delta, execution trail, falsification condition, counterevidence, and review state.
5. **Negative knowledge compounds.** Failed attempts and objective blockers constrain future planning instead of disappearing from the record.
6. **Scientific trust gates.** Agent completion is not scientific validity; independent review and external reproduction can raise a Claim's status.
7. **Open-by-design ecosystem.** Inspectable code, shared scientific object protocols, replaceable models and tools, self-hosted deployment, and community validation are strategic requirements.

**How we do it differently:**
PRAgent continuously reconstructs historical research into structured evidence objects. RunThePaper exposes and validates that history. CyberEinstein reasons over the resulting field history to select and execute new research, then writes every outcome back into the same history.

**Why that's better:**
Researchers get fewer rootless ideas, avoid already documented dead ends, reuse trusted baselines, choose more informative experiments, preserve institutional memory, and produce results that others can inspect and continue.

**Why users choose us:**
They want an AI research collaborator that already understands what their field tried, can rerun the evidence, admits what failed, and leaves a trustworthy record behind.

**Compounding moat:**

| Moat | Asset |
| --- | --- |
| Data | Executable scientific history, including correct code and failed attempts |
| Cognition | Continuously updated field-state models |
| Decision | Evidence-grounded frontier and opportunity selection |
| Execution | Domain scientific tools, simulators, compute, and future instruments |
| Trust | Claim-first rules, falsification, independent review, and external reproduction |
| Network | Researchers, labs, reviewers, tool builders, and contributed evidence |
| Open ecosystem | Inspectable protocols, integrations, self-hosting, and community governance |

## Objections

| Objection | Response |
| --- | --- |
| “Is this another agent that generates research ideas?” | No. Idea generation is downstream. CyberEinstein first reconstructs the evidence history and current state of a field, then chooses historically grounded research opportunities. |
| “Competitors also read literature and build world models.” | Correct. Our distinction is not access to literature; it is durable, executable lineage linking Claims to code, runs, failures, evidence, and reviews across projects. |
| “Does CyberEinstein make original discoveries today?” | Not yet as a finished end-to-end product. The repository currently implements runtime, source, literature-research, and `ReproductionCase` foundations. |
| “Were all 100 RunThePaper papers fully reproduced?” | No. The fixed cohort has complete terminal accounting at Claim-Check level; successful, objectively blocked, and attempted-but-not-reproduced outcomes are reported separately. |
| “Why should I trust an AI's new Claim?” | Do not trust it because the Agent says so. Inspect the baseline, run, evidence, counterevidence, falsification boundary, and independent review state. |
| “Is it open source?” | Open source is a committed product direction, but the current public repository still declares `UNLICENSED`. Formal open-source claims require an explicit license decision. |
| “Can it use private data or laboratory systems?” | The architecture is designed for bounded adapters, permissions, and self-hosting, but real instrument integration is future work and consequential actions require human approval. |

**Anti-persona:**
People looking only for paper summaries, instant idea lists, guaranteed discoveries, human-free publication, fabricated certainty, or a polished one-click product today.

## Switching Dynamics

**Push:**
Research history is fragmented; teams repeat failed work; generated ideas lack roots; baseline reconstruction consumes weeks; chat output cannot become institutional scientific memory.

**Pull:**
Inherit a field's executable history, see why the frontier exists, choose a more valuable next action, run it with evidence, and preserve the result for everyone who follows.

**Habit:**
Researchers already rely on familiar PDF managers, notebooks, code repositories, group meetings, personal memory, and ad hoc scripts. These tools are flexible and socially embedded.

**Anxiety:**
The system may misunderstand the field, leak unpublished work, overstate novelty, consume expensive compute, hide model errors, or impose rigid schemas on exploratory science.

## Customer Language

**How they describe the problem:**

- “这个想法以前是不是有人做过？”
- “这篇论文的代码到底能不能跑？”
- “这个负结果是物理上不成立，还是参数和实现有问题？”
- “组里以前有人试过，但人走了以后过程就找不到了。”
- “我不缺 Idea，我缺的是判断哪个 Idea 值得做。”

**How they describe us:**

- “让 AI 先继承科学走过的路，再探索科学的下一步。”
- “它不仅知道论文结论，还知道这些结论是怎么跑出来的。”
- “它记得正确代码，也记得错误尝试。”
- “不是从最新论文重新开始，而是从整个学科的研究历史开始。”

**Words to use:**
Executable History of Science, 可执行科学史, evidence history, evidence lineage, field state, grounded hypothesis, research opportunity, correct code, failed attempt, counterevidence, falsification, independent review, candidate discovery, open science, inspectable, self-hostable.

**Words to avoid:**
Fully autonomous scientist, one-click discovery, guaranteed correctness, all 100 papers reproduced, human-free science, revolutionary, world-leading, or formal “open source” language before a license is added.

**Glossary:**

| Term | Meaning |
| --- | --- |
| Executable History of Science | A field's evolving history represented through Claims, methods, runnable artifacts, evidence, failures, and reviews—not papers alone |
| Field state | Current consensus, competing explanations, anomalies, blockers, exhausted paths, and active frontier inferred from evidence history |
| Research opportunity | A historically grounded next question or action evaluated for value, novelty, discriminating power, executability, cost, and risk |
| ReproductionCase | A versioned reconstruction of known scientific Claims, runs, evidence, reviews, failures, and remaining boundaries |
| DiscoveryCase | The intended durable record of a new research question, grounded hypotheses, studies, observations, candidate Claim, falsification boundary, and reviews |
| Blank-prompt science | The broken norm of asking AI to create scientific novelty without inheriting the executable history of the field |

## Brand Voice

**Tone:**
Ambitious, scientifically honest, serious, and inviting.

**Style:**
Lead with a clear scientific tension, explain the mechanism in plain language, then prove it with inspectable artifacts and precise boundaries. Use bold headlines sparingly; body copy remains concrete and calm.

**Personality:**
Evidence-first, historically grounded, intellectually ambitious, open, skeptical, and collaborative.

**Narrative enemy:**
The broken practice of blank-prompt science—not a named company or competitor. Scientific discovery should not begin by asking an AI to invent ideas without inheriting what the field has already established, attempted, and disproved.

## Proof Points

**Metrics:**

- RunThePaper fixed public cohort: 100 physics papers
- 1,427 authored Claims, including 1,412 numerical Claims
- 3,933 Claim Checks with direct Claim mappings and terminal outcomes
- 2,068 reproduced Checks, 1,134 objectively blocked Checks, 731 attempted but not reproduced, 0 pending
- Equal-weight numerical-Claim successful coverage: 40.55%
- Conditional Fidelity on eligible trusted scientific regions: 92.97/100, covering 23.37% of successful Claim mass

**Customers:**
No public customer claims yet.

**Testimonials:**
No public testimonials yet. Do not fabricate them.

**Value themes:**

| Theme | Proof |
| --- | --- |
| History includes failure | RunThePaper publicly separates successful, objectively blocked, and attempted-but-not-reproduced outcomes |
| Claims connect to evidence | All 3,933 audited Checks have a direct Claim mapping and terminal disposition |
| Rules live beyond prompts | CyberEinstein already includes a versioned `ReproductionCase` domain service with evidence and review invariants |
| Open inspection is part of trust | RunThePaper cases, audit artifacts, and CyberEinstein development are public; formal license remains pending |

Approved accurate language:

> RunThePaper contains a fixed public cohort of 100 paper-reproduction cases whose 3,933 Claim Checks have complete mapping and terminal accounting.

Do not say:

> All 100 papers were completely reproduced.

Primary proof links:

- https://github.com/xi-zhao/RunThePaper
- https://github.com/xi-zhao/RunThePaper/tree/main/evaluation/claim-first-100

## Goals

**Business goal:**
Establish CyberEinstein as the evidence-native, open scientific discovery system built on the Executable History of Science, then validate that this substrate helps a real research team choose and complete a worthwhile new study.

**Conversion action:**
For the current repository, ask qualified researchers and AI4S builders to inspect the evidence model, run the foundation locally, and contribute a historical reproduction, failure record, scientific rule, or domain integration. Do not invite users to start a finished original-discovery product that does not yet exist.

**Current metrics:**
RunThePaper evidence metrics are public. CyberEinstein activation, retention, contributed field histories, independently reviewed Claims, and original discoveries are not yet measured.

## Changelog

- v2 (2026-09-03) — Repositioned CyberEinstein around original research grounded in the Executable History of Science; rewrote audience, competitive landscape, seven-layer moat, open-ecosystem strategy, objections, and narrative.
- v1 (2026-09-03) — Established proof-backed positioning, RunThePaper relationship, audience, differentiation, claims guardrails, voice, and PR angles.
