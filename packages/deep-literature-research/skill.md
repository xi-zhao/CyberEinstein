# Deep Literature Research

Use this capability to investigate a scientific question through literature. The product object is a versioned `LiteratureReview`, not a long answer and not a fixed search pipeline.

## Contract

Inputs may be a research question, topic, claim, known paper, unresolved contradiction, or existing `LiteratureReview`. Establish only the missing scope needed to make the next action meaningful. Do not force the user through a complete intake when an atomic action can proceed safely.

Return a new `LiteratureReview` draft or an explicit patch to an existing one. Follow `literature-review.schema.json` when structured output is requested. Do not write files unless the user asks or an application-layer capability provides an approved persistence boundary.

The review remains useful when it is partial, blocked, contradictory, or stopped by budget. A report is only one projection of this object.

## Atomic Actions

Choose the action that addresses the current evidence gap. Any action may be used independently:

- frame or revise the question, scope, inclusion rules, and stopping conditions;
- decompose a question into answerable subquestions and rival explanations;
- generate or refine searches for one subquestion;
- discover, deduplicate, and screen candidate papers;
- resolve and read one known paper;
- extract a source-grounded evidence note with an exact locator;
- search specifically for counterevidence, failed replications, or competing methods;
- audit coverage, provenance, contradictions, and unresolved gaps;
- synthesize field history, current consensus, frontier, disputes, and opportunities;
- reopen an earlier conclusion when new evidence or a failure lesson changes the judgment.

There is no mandatory stage order. Select the next action from the review's unresolved subquestions, contradictions, and gaps.

## Evidence Loop

1. Before planning, retrieve applicable `FailureLesson` records when that capability exists. Record which lessons changed the search, screening, or interpretation. If the experience service is unavailable, state that boundary rather than pretending the check happened.
2. Define the current question and explicit scope. For ambiguous requests, ask only about choices that materially change the evidence set, cost, or interpretation.
3. Maintain multiple subquestions or rival explanations when the topic is contested. Do not reduce uncertainty by silently selecting one narrative.
4. Use `mcp__paper_search__discover_papers` for bounded paper discovery when available. Vary terminology, methods, authors, citation anchors, and time windows instead of repeating one query.
5. Use `mcp__paper_fetch__resolve_paper`, `mcp__paper_fetch__has_fulltext`, and `mcp__paper_fetch__fetch_paper` for known sources when available. Never claim to have read full text when the result is `metadata_only` or abstract-only.
6. After every useful batch, update candidates, evidence, contradictions, source errors, and negative search results. Then ask: what changed, what remains unsupported, what could falsify the current synthesis, and which next action has the highest information value?
7. When independent subquestions justify fan-out, use DSH subagents or `workflow`; give each worker a bounded question and require structured evidence with stable source identifiers. Do not delegate final scientific judgment to a vote or arithmetic average.
8. Before synthesis, run an adversarial pass that seeks contradictory results, retractions or corrections, failed replications, alternative mechanisms, dataset leakage, benchmark limitations, and field-specific publication bias.
9. At the end of the invocation, compare expected and observed progress. Record source failures, misleading queries, incorrect assumptions, and candidate lessons. A single failure is not a validated global rule.

If a named tool is disabled or unavailable, continue with authorized user-provided sources where possible and mark the missing capability. Do not substitute invented citations.

## Source Rules

- Prefer primary papers for scientific claims and use reviews for orientation and terminology.
- Preserve DOI, arXiv ID, PMID, or another stable identifier whenever available.
- Distinguish `metadata_only`, `abstract`, `full_text`, and `user_provided` access. Metadata establishes identity, not substantive evidence.
- Evidence notes must identify the source and, for full text, the section, figure, table, equation, page, or paragraph needed to inspect it.
- Paraphrase findings. Quote only short passages when exact wording is necessary.
- Separate an author's reported result from this review's inference. Label model-generated synthesis as synthesis.
- Never use Sci-Hub, bypass a paywall, disable SSRF protection, or claim access the system did not have.
- Do not treat citation count, venue, author reputation, or model confidence as proof that a claim is correct.

## Completion Gate

Do not mark a review `complete` merely because a configured depth, breadth, time, or token limit was reached. Completion requires a recorded stop decision showing:

- the original question and scope are still the questions answered;
- each material conclusion cites supporting evidence and relevant counterevidence;
- important subquestions are answered or explicitly marked unresolved;
- at least one serious contradiction search was attempted for each high-impact conclusion;
- access limitations and metadata-only sources are visible;
- material source and query failures are visible;
- the remaining gaps and next most informative actions are explicit.

If cost, time, access, tool failure, or user choice stops the work first, use `partial`, `blocked`, or `stopped`, preserve the evidence gathered, and explain the exact boundary.

## Human-Readable Projection

When the user asks for a literature review report, present:

1. research question and scope;
2. short answer with calibrated confidence;
3. historical development and method lineage;
4. current consensus and strongest evidence;
5. contradictions, limitations, and failed or negative results;
6. frontier directions and unresolved questions;
7. source table with access level and stable identifiers;
8. coverage limits, search failures, and recommended next actions.

Every substantive statement must be traceable to the `LiteratureReview` evidence ledger. Never hide uncertainty to make the report read more smoothly.
