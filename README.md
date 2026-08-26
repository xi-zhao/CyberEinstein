# CyberEinstein

English | [Chinese](README.zh-CN.md)

**An AI Scientist Workbench for discovering, verifying, and advancing knowledge that matters.**

CyberEinstein is an AI scientist product built for real research. It is not a general-purpose chat interface, and its goal is not merely to generate papers. It begins with an audit of available research capabilities and a structured understanding of a field, then continuously organizes hypotheses, experiments, evidence, lessons from failure, and peer review to produce trustworthy, traceable, and reproducible knowledge.

> **Mission:** We want everyone to have the opportunity to become an Einstein in the research field they care about and fulfill their dream of becoming a scientist.

> **Architecture principle:** CyberEinstein is the product and scientific research system; DeepSeek Harness and Cordis provide the complete runtime foundation, and research capabilities are added as upper-layer plugins.

## Vision

CyberEinstein models research as a continuously evolving research program:

```text
Research Capabilities -> Field Understanding -> Paper Reproduction
                      -> Opportunity Discovery -> Testable Hypotheses
                      -> Experiments or Computation -> Evidence and Counterevidence
                      -> Independent Review -> Experience Feedback
                      -> Reproducible Results
```

The long-term goal is to enable AI and human scientists to work together on original, verifiable research that has a meaningful impact.

## Core Principles

- **Evidence first:** Every scientific claim must be connected to supporting evidence, counterevidence, and explicit uncertainty.
- **Research for everyone:** Give more people the ability to understand problems, design research, and test ideas without lowering scientific standards.
- **Science and technology for good:** Evaluate expected benefits, potential harms, dual-use risks, and broader social impact.
- **Infrastructure before execution:** Confirm available compute, data, software, instruments, and human capabilities before producing an executable research plan.
- **Traceable process:** Literature, prompts, tool calls, code, parameters, data, and results all become part of the research record.
- **Reproducible outcomes:** Experiments and computations must preserve the environment, inputs, and methods needed for reproduction.
- **Learn from failure:** Every research loop retrieves prior experience, diagnoses errors, and feeds validated lessons back into the system.
- **Humans retain consequential decisions:** Publication, external writes, expensive computation, and physical equipment control require explicit authorization.
- **Scientific logic stays in CyberEinstein plugins:** Domain objects and research rules belong to CyberEinstein packages, not patches to the DeepSeek Harness core.
- **Capabilities extend through Cordis plugins:** Scientific tools, models, storage, policies, and workflows are mounted through the native plugin system.

## System Boundary

```text
CyberEinstein Workbench
  -> CyberEinstein Research Plugins
  -> DeepSeek Harness / Cordis
  -> Models / Papers / Code / Data / Simulators / Lab Tools
```

CyberEinstein owns research programs, scientific capabilities, project state, evidence relationships, experience promotion, approval rules, and the user experience. DeepSeek Harness provides profiles, sessions, the agent loop, tool execution, runtime traces, permissions, and Cordis plugin orchestration. The first stage reuses that complete stack without forking or modifying its core.

## First Phase

The first runnable version will validate one complete scientific workflow:

1. Audit the research capabilities that are genuinely available and build a capability graph.
2. Select a narrow research direction and map its history and claims.
3. Reproduce a set of anchor papers and capture tacit experimental details.
4. Identify research opportunities from anomalies, contradictions, and bottlenecks found during reproduction.
5. Run a computational experiment loop with RSI-based experience feedback.
6. Produce a reproducible research report after independent review.

The first validation scenario may begin with quantum computing, but the core model is not tied to a single discipline.

## Project Status

CyberEinstein is currently in the product-definition and architectural-foundation stage. The repository now pins and directly runs the complete official `@deepseek-ai/dsh@0.1.1-rc.2` stack. No upstream core or profile has been modified. The next milestone is the first CyberEinstein research plugin.

## Developer Quick Start

Node.js 24 or newer is recommended.

```bash
corepack pnpm install
corepack pnpm dsh:check
corepack pnpm dsh:web
```

`dsh:check` composes the full official headless profile without sending a model request, so it does not require an API key. `dsh:web` starts the official workbench at `http://127.0.0.1:3080`. Real model requests require `DEEPSEEK_API_KEY`. See the [DeepSeek Harness baseline](docs/harness-integration.md).

The detailed [development vision](docs/development-vision.md) and [architecture principles](docs/architecture.md) are currently maintained in Chinese.
