<p align="center">
  <img src="assets/brand/einstein-pixel-logo.png" width="200" alt="CyberEinstein pixel-art logo" />
</p>

<h1 align="center">CyberEinstein</h1>

<p align="center">
  <strong>Inherit the path of science. Discover what comes next.</strong><br />
  Open-source AI scientist · Executable History of Science · Wider participation
</p>

<p align="center">
  <strong>English</strong> · <a href="README.zh-CN.md">简体中文</a>
</p>

**CyberEinstein is an open-source AI scientist being built to conduct original research and discover new knowledge. Its foundation is the Executable History of Science.**

Our chosen approach is to let AI inherit a field's validated methods, real runs, and failed attempts; understand how science reached its current frontier; and investigate the next step. Each new study then becomes part of the history others can inherit.

We want this kind of AI scientist to give more people the opportunity to help create knowledge.

<p align="center">
  <a href="#story">The dream behind the name</a> ·
  <a href="#discovery">Our approach</a> ·
  <a href="#mission">Wider participation</a> ·
  <a href="#today">Available today</a> ·
  <a href="#start">Get started</a> ·
  <a href="https://github.com/xi-zhao/CyberEinstein/issues">Contribute</a>
</p>

> **Current stage: developer preview.** Paper maps, literature-research workflows, and reproduction-record foundations are available. The complete original-discovery loop and an accessible experience for nontechnical users are still being built.

<a id="story"></a>

## Why CyberEinstein

I have loved physics since childhood, and I dreamed of becoming a scientist who could stand alongside Einstein: asking my own questions, discovering something humanity did not yet know, and adding a new possibility to the way we understand the world.

From university through my PhD, I continued working in physics. Doing research gave me a clearer understanding of its difficulty: asking a good question is hard; finding a reliable answer is harder still.

Honestly, on my own, I will never reach Einstein's stature. But seeing what AI can do made me think about that dream again. If we combine human curiosity and scientific judgment with AI's capabilities, could we make real progress on profoundly important questions—even take a step toward a grand unified theory?

I do not know how far this path can take us. But I want to give it a serious try.

That is why I want to build CyberEinstein: an AI scientist that explores the unknown, conducts original research, and discovers new knowledge alongside people. It should inherit the paths others have taken—their validated methods, actual research processes, failures, and corrections—and use them to find science's next step.

I also want that opportunity to reach more people. Students, teachers, independent researchers, and research teams should all have a chance to advance their own questions with AI. The childhood dream of becoming a scientist could find a new way forward.

**That dream does not have to belong to me alone.**

<a id="discovery"></a>

## Our approach: turn science's past into a foundation for discovery

CyberEinstein's goal is to discover new knowledge. Its defining choice is to build a field's research history into a foundation that AI can continually inherit, test, and use. This is the **Executable History of Science**.

Its value comes through three concrete commitments:

### Inherit the investigation, as well as the conclusion

Connect published conclusions to methods, code, run conditions, evidence, and failure records. Where resources permit, a computation can be rerun. A disputed result can be traced to its basis. A failed attempt can be understood in its original conditions and limitations.

We want AI to move beyond explaining what a paper says and judge which prior work offers a reliable starting point for a new study.

### Find questions in history that are worth reopening

Conflicting findings, unexplained anomalies, and ideas once constrained by tools or resources can all point toward new research opportunities.

Imagine a method that could not previously be tested because the necessary computation was out of reach. New tools become available. The useful questions extend beyond the latest papers: does the old constraint still apply, is this problem worth reopening, and what result would support or refute the idea?

This is the judgment we want CyberEinstein to develop: finding a next step into the unknown by understanding the path of established science.

### Let each study leave a foundation for the next discovery

New findings, useful methods, ruled-out explanations, and unresolved questions should remain available with their applicable conditions and evidence. As research proceeds, that history is expanded and corrected.

**What we want to accumulate is research experience that can support further discovery.** Executable scientific history is the core asset; original research is the purpose; open collaboration gives that accumulated work a chance to help more people.

## How it should investigate an unknown

A study can start with an open question, anomalous data, or an idea for a new method—not necessarily a paper selected for reproduction. The complete experience we are building is:

1. **Identify a worthwhile unknown.** Understand prior progress, contradictions, and limitations, then judge which question deserves attention.
2. **Propose new hypotheses and methods.** Develop possible explanations or solutions, with studies that can distinguish between them.
3. **Execute and revise the study.** Conduct computations or experiments within resources and permissions, letting observations change the next action.
4. **Test the contribution to knowledge.** Compare with prior work, seek counterexamples and alternative explanations, and undergo independent review.
5. **Write the outcome back into history.** Preserve supported new conclusions, negative results, and unresolved questions so others can inspect and continue the work.

**Reproduction asks whether an existing conclusion holds. Original research asks what else we can discover.** The former establishes a trusted starting point; the latter is CyberEinstein's central task. This complete discovery loop is still being built.

<a id="mission"></a>

## Open more paths into science

People who dream of becoming scientists do not all start with the same opportunities. Students and teachers may lack a path into frontier research. Independent researchers and small teams may lack methods, tools, or collaborators. Professional teams also need ways to inherit the experience of those who came before them.

Scientific curiosity exists far beyond a few institutions. Access to research knowledge, tools, methodological guidance, and collaboration should extend further too.

This is what widening access to science means for CyberEinstein: making AI scientist capabilities available to more people and opening more opportunities to conduct original research. We aim to lower four barriers:

- **Reaching the frontier:** Understand what a field knows and does not know, and find questions worth exploring.
- **Conducting research:** Get support for forming hypotheses, designing methods, and carrying out validation to advance an original idea.
- **Testing discoveries:** Judge whether a result is reliable, whether it adds new knowledge, and what evidence is still missing.
- **Contributing knowledge:** Make new findings, reproductions, corrections, and negative results useful to the next researcher.

We want the opportunity to do research to depend less on background, geography, or institutional resources. AI's role here is to expand human capability and enable more people to take part in creating knowledge.

**Lower barriers to participation. Uphold scientific standards.** Wider access means helping people obtain the learning, expertise, and experimental conditions they need—not bypassing them.

<a id="today"></a>

## What you can use today

We are starting with quantum and computational physics to build the capabilities needed for original research. These foundations are implemented in the current repository:

| Capability | What it provides |
| --- | --- |
| Paper maps | Start from one paper to explore related work, historical context, and recent developments in an interactive reading map. Automatically inferred relationships still need verification. |
| Literature-research workflows | Organize searches and reading around a question; record supporting and opposing evidence, contradictions, gaps, and access limitations. |
| Reproduction-record service | Preserve research targets, methods, runs, evidence, reviews, and failures with version history, providing a foundation for work to continue later. |

Next, we will connect these foundations with real research cases and test a minimal discovery loop around an unanswered question: propose hypotheses, conduct the study, seek counterevidence, and obtain independent review. Research-opportunity selection, hypothesis generation, and sustained research execution still require implementation and validation. Real instrument connections are a later direction.

### Built on work you can inspect

The related project [RunThePaper](https://github.com/xi-zhao/RunThePaper) publishes reproduction cases for 100 physics papers, including successful, blocked, and unsuccessful attempts. This does not mean all 100 papers have been fully reproduced; the [public audit](https://github.com/xi-zhao/RunThePaper/tree/main/evaluation/claim-first-100) explains the evidence and its limits.

[PRAgent](https://github.com/xi-zhao/PRAgent) focuses on paper reproduction, while RunThePaper provides public cases and validation evidence. CyberEinstein is the AI scientist intended to conduct original research. Those accumulated records are a foundation for exploring the unknown, not the endpoint of its capabilities. The complete cross-project integration is still being built.

## Technology for good shapes how we do research

We want the new knowledge discovered with AI scientists to help people understand the world and address real problems. We also want more people to have the opportunity to create that knowledge. The project is guided by four commitments:

- **Human agency.** AI helps people understand and act. Research direction, important conclusions, and high-risk actions retain human judgment and necessary authorization.
- **Honesty and inspection.** Show evidence and uncertainty; preserve counterevidence and failure. An AI's self-assessment is not a scientific conclusion.
- **Respect for contributions and rights.** Preserve sources and credit real contributors. Respect permissions for data, code, and literature; open science does not require publishing confidential or sensitive material.
- **Public benefit.** Ask not only whether a study can succeed, but who benefits, who could be harmed, and how risks can be reduced.

Our aim is to expand the opportunity to participate in science, not to guarantee a major discovery for everyone. Necessary safety conditions, expert guidance, and independent review remain essential.

<a id="start"></a>

## Get started

You do not need a major discovery to contribute.

- **Explore first:** Read [RunThePaper's public cases](https://github.com/xi-zhao/RunThePaper) to see how research records both results and limitations.
- **Bring a question or experience:** [Join the discussion](https://github.com/xi-zhao/CyberEinstein/issues/new). Bring an open question worth investigating, an idea for a new method, or experience that could help a study. Do not submit sensitive material or anything you lack permission to publish.
- **Help build it:** Run the current capabilities locally and improve documentation, case validation, or tools to make the next participant's first steps easier.

### Try it locally

The current version requires basic command-line skills. Open-source code does not make all resources free: model calls and some external services may incur charges, and real experiments require appropriate facilities and permissions.

<details>
<summary>Installation and running instructions</summary>

Requirements: Node.js 24 or newer (22.x versions from 22.19 onward are also supported), Corepack / pnpm, Python 3.11–3.14, and [uv](https://docs.astral.sh/uv/).

```bash
git clone https://github.com/xi-zhao/CyberEinstein.git
cd CyberEinstein
corepack pnpm install
corepack pnpm setup
corepack pnpm test
```

Before running model-driven research tasks:

```bash
cp .env.example .env
# Edit .env and add your DEEPSEEK_API_KEY
corepack pnpm dsh:web
```

Then open `http://127.0.0.1:3080`.

Paper maps do not require a language-model API, but they do need network access to the literature data source. Try:

```bash
corepack pnpm field-history:build -- --seed 10.1103/PhysRevLett.121.086803 --output .cybereinstein/field-history/example.json --html .cybereinstein/field-history/example.html
```

Small demos can access OpenAlex anonymously. For sustained use, data-source configuration, limitations, and validation methods, see the [Field History documentation](docs/field-history.md).

Further reading: [Development vision](docs/development-vision.md) · [Architecture and scientific rules](docs/architecture.md) · [Runtime guide](docs/harness-integration.md).

</details>

Project code is licensed under [Apache-2.0](LICENSE). Referenced papers, data, and external cases remain subject to their own terms.

---

**Inherit the path of science. Discover what comes next. Give everyone a chance to pursue their own dream of becoming a scientist.**
