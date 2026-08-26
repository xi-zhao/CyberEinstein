# CyberEinstein

English | [Chinese](README.zh-CN.md)

**An AI Scientist Workbench for discovering, verifying, and advancing knowledge that matters.**

CyberEinstein is an AI scientist product built for real research. It is not a general-purpose chat interface, and its goal is not merely to generate papers. It organizes research as interconnected scientific objects and exposes bounded capabilities that can be used independently or composed as needed. A paper, question, hypothesis, dataset, anomaly, instrument, or failed run can all be valid starting points.

> **Mission:** We want everyone to have the opportunity to become an Einstein in the research field they care about and fulfill their dream of becoming a scientist.

> **Architecture principle:** CyberEinstein is the product and scientific research system; DeepSeek Harness and Cordis provide the complete runtime foundation, and research capabilities are added as upper-layer plugins.

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

## PRAgent: The First Core Capability

PRAgent is CyberEinstein's first and most important product capability. It is the research-context engine that turns disconnected papers, evidence, reproduction work, and open questions into a durable understanding of a research field.

PRAgent is not a paper summarizer or a monolithic agent that owns the whole research process. It is a family of atomic capabilities with a unified product entry point:

- discover and continuously update relevant literature from a question, topic, paper, or claim;
- acquire and normalize sources while preserving identity, rights, and provenance;
- decompose papers into typed claims, methods, assumptions, evidence, limitations, and unresolved details;
- connect historical development, method lineages, competing explanations, disputes, and key contributors;
- identify whether a claim needs theoretical, computational, physical, or mixed verification and what capabilities that verification requires;
- connect reproduction scope, run evidence, negative results, tacit details, and missing inputs back to the original claims;
- expose contradictions, knowledge gaps, and questions that deserve further investigation.

Its primary outputs are continuously updated `FieldMap`, `ClaimGraph`, `ReproductionPortfolio`, and `OpportunityMap` records, not a one-off narrative report. Each PRAgent capability can be invoked independently, and its outputs remain available to later hypothesis, experiment, review, and discovery capabilities. Search MCPs, scholarly databases, document parsers, and reproduction repositories are replaceable adapters behind PRAgent; they are not the product itself.

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

The first runnable version will center on PRAgent. It will validate a small set of independently useful research-context capabilities and prove that they can be composed in different ways:

- Accept a research direction, question, paper, or claim as an independent starting point.
- Discover, acquire, parse, and connect scientific sources with explicit provenance.
- Build and update field history, method lineages, claims, evidence, counterevidence, and uncertainty.
- Classify the verification requirements and infrastructure dependencies of individual claims.
- Import and connect reproduction scope, results, hidden details, failures, and unresolved inputs.
- Surface contradictions and knowledge gaps without presenting them as discoveries by default.
- Expose every resulting object for reuse by later scientific capabilities.

Example compositions include `Research Direction -> FieldMap`, `Paper -> Claims`, `Claim -> Verification Requirements`, `Reproduction Result -> Evidence`, and `Contradictory Evidence -> Open Question`. None of these paths is required to precede another.

The first validation scenario may begin with quantum computing, but the core model is not tied to a single discipline.

## Project Status

CyberEinstein is currently in the product-definition and architectural-foundation stage. The repository now pins and directly runs the complete official `@deepseek-ai/dsh@0.1.1-rc.2` stack. No upstream core or profile has been modified. The next milestone is the PRAgent research-object contract and its first atomic capability plugin bundle.

## Developer Quick Start

Node.js 24 or newer is recommended.

```bash
corepack pnpm install
corepack pnpm dsh:check
corepack pnpm dsh:web
```

`dsh:check` composes the full official headless profile without sending a model request, so it does not require an API key. `dsh:web` starts the official workbench at `http://127.0.0.1:3080`. Real model requests require `DEEPSEEK_API_KEY`. See the [DeepSeek Harness baseline](docs/harness-integration.md).

The detailed [development vision](docs/development-vision.md) and [architecture principles](docs/architecture.md) are currently maintained in Chinese.
