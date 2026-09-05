<p align="center">
  <img src="assets/brand/einstein-pixel-logo.png" width="200" alt="CyberEinstein pixel-art logo" />
</p>

<h1 align="center">CyberEinstein</h1>

<p align="center"><strong>Give everyone a chance to discover something humanity does not yet know.</strong></p>

<p align="center">
  <strong>English</strong> · <a href="README.zh-CN.md">简体中文</a>
</p>

CyberEinstein is an open-source AI scientist in development, built toward a goal: asking questions, conducting original research, and discovering and testing new knowledge alongside people.

Our approach starts with the history of science. We want AI to inherit earlier methods, evidence, failures, and corrections, then find questions that remain unanswered or deserve another attempt. We call this the **Executable History of Science**.

[Why we are building it](#story) · [Our approach](#approach) · [Progress](#today) · [Get involved](#start)

<a id="story"></a>

## A childhood dream

I have loved physics since childhood, and I dreamed of becoming a scientist who could stand alongside Einstein: asking my own questions, discovering something humanity did not yet know, and adding a new possibility to the way we understand the world.

From university through my PhD, I continued working in physics. I know how difficult research is: asking a good question is hard; finding a reliable answer is harder still.

Honestly, on my own, I will never reach Einstein's stature. But seeing what AI can do brought that dream back. If we combine human curiosity and scientific judgment with AI's capabilities, could we make real progress on profoundly important questions—even take a step toward a grand unified theory?

I do not know how far this path can take us. But I want to give it a serious try. That is where CyberEinstein began.

And I hope that dream can belong to more people. A student, a teacher, or an independent researcher should have the opportunity to ask their own questions, find support for investigating them, and put their findings to the test.

**To me, equitable access to science means giving more people the opportunity to explore the unknown and contribute new knowledge.**

<a id="approach"></a>

## New discoveries can begin with the paths science has already taken

A paper leaves a conclusion. To take the work further, a researcher also needs to understand why it holds, which conditions it depends on, what did not work, and what remains unresolved.

CyberEinstein aims to connect those research processes so AI can inspect evidence, rerun computations, understand failures, and use that experience to propose worthwhile next steps.

That is what we mean by an Executable History of Science: **earlier investigations become experience that the next study can actually use.**

Consider an idea once set aside because the computation was too expensive. When new tools become available, does it deserve another attempt? Does the old constraint still apply? What result would demonstrate progress?

We want CyberEinstein to follow such leads: identify a question, propose hypotheses, conduct computations or experiments, seek counterevidence, and submit the results to independent scrutiny. New findings and unsuccessful attempts should both remain available for others to build on.

**Reproduction establishes a trusted starting point. Original discovery gives us a direction.** The accumulation of experience between scientific history and new research is the core we have chosen to build.

<a id="today"></a>

## Where we are today

CyberEinstein is a **developer preview**, starting with quantum and computational physics. Three foundations are available to try:

| What you want to do | What is available today |
| --- | --- |
| Understand how a field reached its current frontier | Generate an interactive map from a paper to explore related work and recent developments. |
| Investigate the literature around a question | Organize searches and reading, and record evidence, contradictions, and unresolved questions. |
| Preserve a study so work can continue | Record targets, methods, runs, evidence, and failures with version history. |

These foundations are implemented. The complete process of generating new hypotheses, sustaining a study, and validating a discovery is still being built. Automatically inferred paper relationships require verification, and an accessible experience for nontechnical users is not yet complete.

This path already has a starting point: [RunThePaper](https://github.com/xi-zhao/RunThePaper) has accumulated reproduction cases for more than 100 physics papers, preserving successful, blocked, and unsuccessful attempts, with new cases continuing to be added. These [open research records](https://github.com/xi-zhao/RunThePaper) provide a foundation for asking further questions, testing ideas, and exploring new knowledge.

[PRAgent](https://github.com/xi-zhao/PRAgent) focuses on paper reproduction. CyberEinstein will build on this accumulated work to pursue original research; the complete cross-project integration remains under development.

**Our next step is a research process around a real unanswered question that can be independently inspected.** It may produce a new result or rule out an explanation. Either way, we will preserve the evidence and limitations so the next attempt has a better starting point.

<a id="start"></a>

## Bring your question

You may have a phenomenon you have always wanted to understand, an idea you have not yet tested, or research experience that could save someone else a failed attempt.

[Bring it to CyberEinstein](https://github.com/xi-zhao/CyberEinstein/issues/new). You can also start by reading the [public cases](https://github.com/xi-zhao/RunThePaper), running the current tools, or improving the documentation and validation methods.

We want open source to make research experience available for more people to build on. New knowledge should help people understand the world and address real problems. The opportunity to contribute to its discovery should reach more people too.

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
