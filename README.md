# CyberEinstein

English | [Chinese](README.zh-CN.md)

**An AI for Science (AI4S) workbench for discovering, verifying, and advancing knowledge that matters.**

CyberEinstein is an AI for Science (AI4S) product built for real scientific work. It uses AI to help people understand research fields, reproduce known results, design and execute studies, evaluate evidence, and develop new knowledge. It is not a general-purpose chat interface, and its goal is not merely to generate papers. It organizes research as interconnected scientific objects and exposes bounded capabilities that can be used independently or composed as needed. A paper, question, hypothesis, dataset, anomaly, instrument, or failed run can all be valid starting points.

> **Mission:** We want everyone to have the opportunity to become an Einstein in the research field they care about and fulfill their dream of becoming a scientist.

> **Architecture principle:** CyberEinstein is the AI4S product and scientific research system; DeepSeek Harness and Cordis provide the complete runtime foundation, and research capabilities are added as upper-layer plugins.

## Vision

CyberEinstein models research as a continuously evolving graph of scientific objects:

```text
Paper --contains--> Claim
Hypothesis --competes with / extends--> Claim
Claim --tested by--> Experiment
Experiment --produces--> Evidence
Evidence --supports / refutes--> Claim
Review --challenges / validates--> Evidence
FailureLesson --constrains--> Capability / Experiment
```

This is not a mandatory execution pipeline. Every object preserves useful research state, and every capability can contribute without requiring the entire process to run. Literature review, reproduction, optimization, discovery, validation, and experience feedback are reusable compositions over the same research graph.

The long-term goal is to enable AI and human scientists to work together on original, verifiable research that has a meaningful impact.

## Atomic Research Capabilities

Each CyberEinstein plugin contributes one or more bounded scientific capabilities instead of owning an end-to-end workflow.

| Capability | Typical input | Persistent contribution |
| --- | --- | --- |
| Discover literature | Question, topic, or claim | Source candidates and field relationships |
| Acquire and parse a source | DOI, URL, or document | Normalized artifact with provenance |
| Structure claims | Paper, artifact, or evidence | Typed claims and explicit relationships |
| Design or run an experiment | Hypothesis and available infrastructure | Plan, run record, artifacts, and evidence |
| Validate or challenge | Claim, evidence, or run | Checks, counterevidence, and review state |
| Record a failure lesson | Expected and observed outcomes | Versioned lesson with scope and confidence |
| Assess impact | Question, project, or result | Benefits, risks, and approval constraints |

Every capability must declare what it reads, what it produces, its preconditions, side effects, validation method, and permissions. A blocked or negative result is still a first-class contribution when its reason and evidence are preserved. Common research loops are optional recipes assembled from these capabilities, not hard-coded stages.

## PRAgent: Paper Reproduction Agent

PRAgent, the Paper Reproduction Agent, is CyberEinstein's first and most important product capability. It is the first product entry point into AI4S, not the full boundary of CyberEinstein. It turns an identifiable paper or scientific claim into a runnable, checkable, and extendable reproduction case.

PRAgent is not a paper summarizer and does not treat reproduction as a binary success label. It is a family of atomic capabilities with a unified product entry point:

- establish paper identity and acquire permitted sources while preserving rights and provenance;
- decompose the paper into explicit target claims, methods, assumptions, evidence, limitations, and unresolved details;
- reconstruct formulas, parameters, data requirements, software environments, experimental conditions, and tacit implementation choices;
- classify each target as theoretical, computational, physical, or mixed, together with the infrastructure and permissions it requires;
- build and execute computational reproductions when the required infrastructure is available;
- prepare protocols and evidence handoffs for physical claims without marking them reproduced before real observations return;
- compare generated results with paper targets using machine checks, baselines, robustness tests, and independent review;
- preserve negative results, failure lessons, review state, provenance, and an explicit remaining boundary.

Its primary output is a versioned `ReproductionCase` connected to claim targets, experiments, runs, evidence, reviews, failure lessons, and a precise reproduction boundary. Each capability can be invoked independently when its required inputs already exist, and every output remains reusable by later research capabilities. Search MCPs, document parsers, scientific runtimes, simulators, and laboratory interfaces are replaceable adapters behind PRAgent; they are not the product itself.

## Core Principles

- **Evidence first:** Every scientific claim must be connected to supporting evidence, counterevidence, and explicit uncertainty.
- **Atomic and composable:** Every research capability has an independent purpose, a bounded contract, and reusable outputs.
- **Research for everyone:** Give more people the ability to understand problems, design research, and test ideas without lowering scientific standards.
- **Science and technology for good:** Evaluate expected benefits, potential harms, dual-use risks, and broader social impact.
- **Capability-aware execution:** Every action declares the compute, data, software, instruments, people, cost, and permissions it requires before it runs.
- **Traceable process:** Literature, prompts, tool calls, code, parameters, data, and results all become part of the research record.
- **Reproducible outcomes:** Experiments and computations must preserve the environment, inputs, and methods needed for reproduction.
- **Learn from failure:** Every capability invocation checks applicable failure lessons before execution, then records deviations and validated lessons afterward.
- **Humans retain consequential decisions:** Publication, external writes, expensive computation, and physical equipment control require explicit authorization.
- **Scientific logic stays in CyberEinstein plugins:** Domain objects and research rules belong to CyberEinstein packages, not patches to the DeepSeek Harness core.
- **Capabilities extend through Cordis plugins:** Scientific tools, models, storage, policies, and optional recipes are mounted through the native plugin system.

## System Boundary

```text
CyberEinstein Workbench
  |-- Research Graph and Evidence Ledgers
  |-- Atomic Research Capability Plugins
  `-- Optional Loops and Research Recipes
          |
          v
DeepSeek Harness / Cordis
          |
          v
Models / Papers / Code / Data / Simulators / Lab Tools
```

CyberEinstein owns research objects, their relationships and state transitions, capability contracts, evidence rules, experience promotion, approval rules, and the user experience. DeepSeek Harness provides profiles, sessions, agent execution, runtime traces, permissions, and Cordis plugin orchestration. The first stage reuses that complete stack without forking or modifying its core.

## First Phase: PRAgent

The first runnable version will center on PRAgent. It will validate a small set of independently useful paper-reproduction capabilities and prove that they can be composed in different ways:

- Accept a paper, DOI, source artifact, or specific claim as an independent starting point.
- Build a claim-target ledger with explicit reproduction scope and success criteria.
- Reconstruct methods, parameters, data, environments, and missing implementation details.
- Classify computational and physical verification requirements without hiding unavailable infrastructure.
- Execute bounded computational targets and preserve inputs, outputs, and environment evidence.
- Compare results against paper targets and record checks, deviations, negative results, and independent review.
- Return a reusable reproduction case even when the result is partial, blocked, invalid, or still awaiting physical evidence.

Example compositions include `Paper -> Claim Targets`, `Claim -> Reproduction Requirements`, `Computational Claim -> Run -> Evidence`, `Physical Claim -> Protocol -> Pending Evidence`, and `Failed Run -> FailureLesson -> Revised Run`. A capability may start from any existing object that satisfies its input contract; unrelated work is never forced through one pipeline.

The first validation scenario may begin with quantum computing, but the core model is not tied to a single discipline.

## Project Status

CyberEinstein is currently in the AI4S product-definition and architectural-foundation stage. The repository now pins and directly runs the complete official `@deepseek-ai/dsh@0.1.1-rc.2` stack. No upstream core or profile has been modified. The next milestone is the PRAgent reproduction-case contract and its first atomic capability plugin bundle.

## Developer Quick Start

Node.js 24 or newer is recommended.

```bash
corepack pnpm install
corepack pnpm dsh:check
corepack pnpm dsh:web
```

`dsh:check` composes the full official headless profile without sending a model request, so it does not require an API key. `dsh:web` starts the official workbench at `http://127.0.0.1:3080`. Real model requests require `DEEPSEEK_API_KEY`. See the [DeepSeek Harness baseline](docs/harness-integration.md).

The detailed [development vision](docs/development-vision.md) and [architecture principles](docs/architecture.md) are currently maintained in Chinese.
