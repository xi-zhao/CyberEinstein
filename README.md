# CyberEinstein

English | [Chinese](README.zh-CN.md)

**An AI Scientist Workbench for discovering, verifying, and advancing knowledge that matters.**

CyberEinstein is an AI scientist product built for real research. It is not a general-purpose chat interface, and its goal is not merely to generate papers. It begins with an audit of available research capabilities and a structured understanding of a field, then continuously organizes hypotheses, experiments, evidence, lessons from failure, and peer review to produce trustworthy, traceable, and reproducible knowledge.

> **Mission:** We want everyone to have the opportunity to become an Einstein in the research field they care about and fulfill their dream of becoming a scientist.

> **Architecture principle:** CyberEinstein is the product and scientific research system; DeepSeek Harness is a replaceable agent runtime.

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
- **Scientific logic remains independent of the agent runtime:** Domain objects and research rules must not depend on a particular model or harness.
- **Capabilities extend through plugins:** Scientific tools, models, storage, and workflows connect through explicit interfaces instead of modifications to the DeepSeek Harness core.

## System Boundary

```text
CyberEinstein Workbench
  -> Research Domain
  -> Harness Adapter
  -> DeepSeek Harness
  -> Models / Papers / Code / Data / Simulators / Lab Tools
```

CyberEinstein owns research programs, scientific capabilities, project state, evidence relationships, experience promotion, approval rules, and the user experience. DeepSeek Harness owns task threads, the agent loop, tool execution, runtime traces, and plugin orchestration. An adapter separates the two so other runtimes can be substituted or connected in parallel later.

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

CyberEinstein is currently in the product-definition and architectural-foundation stage. There is no runnable release yet. The next milestone is to implement the minimum `ResearchProgram`, capability graph, and experience-feedback model, then connect a pinned version of DeepSeek Harness through an adapter.

The detailed [development vision](docs/development-vision.md) and [architecture principles](docs/architecture.md) are currently maintained in Chinese.
