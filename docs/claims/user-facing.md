# Cautilus User-Facing Claims

This page is the reader-facing claim catalog for `Cautilus`.
It is not a raw `claim discover` dump.
It groups repeated source sentences into a small set of product promises a user can understand before reading implementation contracts or proof packets.
The short orientation here is not a separate canonical claim:
every proof-bearing promise should appear again in a numbered claim below.
Across every feature, `Cautilus` should keep behavior checks repo-owned, packet-backed, agent-friendly, and human-auditable.

Each numbered claim has a plain-language promise, what it means for a user, and how Cautilus should check it.
The public spec report and checked-in claim artifacts provide evidence for these promises over time.
Source anchors point to the durable docs or specs that should stay aligned with the claim.
Raw discovery claim ids may change as prose moves, so they belong in claim packets and review artifacts rather than in this reader-facing catalog.

## U1. Claim: Discover Declared Behavior Promises

**Promise.**
`Cautilus` helps a repo list the important behavior it already promises, then shows what still needs proof.

**What this means.**
The first pass starts from the docs people are expected to read, such as README-style entry pages and their local links.
If an important feature is not written there, Cautilus may miss it.
That is useful signal: the repo's public story is incomplete.

**How Cautilus checks it.**
The saved claim packet should show which docs were scanned, which claims were found, which ones need review, and whether the packet still matches the current checkout.

**Source anchors.**
README.md, AGENTS.md, docs/contracts/claim-discovery-workflow.md.

## U2. Eval: Verify Behavior With Explicit Evidence

**Promise.**
`Cautilus` verifies selected behavior claims with explicit evidence that another person or agent can reopen.

**What this means.**
An evaluation run should leave behind the input, the observed result, and the summary.
The result should not live only in a terminal scrollback or in someone's memory.

**How Cautilus checks it.**
Executable specs, CLI tests, and evaluation fixtures should prove that these saved files are written and can be read later.

**Source anchors.**
README.md, docs/specs/evaluation-surfaces.spec.md, docs/guides/evaluation-process.md.

## U3. Optimize: Improve Only After The Proof Surface Is Clear

**Promise.**
`Cautilus` should only help improve behavior after the target claim, budget, and protected checks are clear.

**What this means.**
Improvement work should not be an open-ended retry loop.
Optimization work must preserve what was tested, what changed, and which checks still protect against regressions.

**How Cautilus checks it.**
Optimization tests and reports should prove that budgets, checkpoints, review reuse, and blocked-readiness states are recorded.

**Source anchors.**
README.md, docs/contracts/optimization.md, docs/contracts/optimization-search.md, docs/gepa.md.

## U4. Doctor: Show Setup And Runner Readiness

**Promise.**
`Cautilus` helps a repo see whether setup, agent-surface install, adapter state, runner readiness, and saved claim state are ready for the next bounded step.

**What this means.**
Setup and readiness should not depend on private operator memory.
`doctor` and agent status output should explain what is ready, what is blocked, and what the next action is.
A ready doctor result means the selected Cautilus surface can run; it does not prove the repo's behavior claims by itself.

**How Cautilus checks it.**
Doctor, adapter, runner-readiness, and agent-status tests should prove that readiness decisions are shared between the binary and agent workflow.

**Source anchors.**
README.md, docs/cli-reference.md, docs/guides/consumer-adoption.md, docs/contracts/runner-readiness.md.

## U5. Cautilus Keeps Product And Host Ownership Separate

**Promise.**
`Cautilus` provides the common evaluation workflow, while each host repo keeps control of its own app, prompts, runners, credentials, and policy.

**What this means.**
The product can standardize the shape of requests, results, and status.
It should not secretly take over a consumer repo's prompt text, model choice, runtime wiring, or acceptance rules.
This is the supporting ownership rule behind `claim`, `eval`, `optimize`, and `doctor`.

**How Cautilus checks it.**
Adapter and command tests should prove that Cautilus keeps host-owned runner commands explicit instead of hiding them inside product logic.

**Source anchors.**
README.md, docs/cli-reference.md, docs/guides/consumer-adoption.md, docs/contracts/adapter-contract.md.

## U6. Cautilus Serves Both CLI Operators And Agents

**Promise.**
`Cautilus` can be used from the command line and by an agent working inside the repo.

**What this means.**
The binary gives stable commands and files.
The bundled skill helps an agent choose the right next step, explain the decision boundary, and run review work without rebuilding the workflow from scratch.

**How Cautilus checks it.**
Install checks, command-discovery checks, skill-disclosure checks, and skill evaluation fixtures should prove that the binary and bundled skill stay consistent.

**Source anchors.**
README.md, skills/cautilus/SKILL.md, docs/specs/standalone-surface.spec.md, docs/specs/command-surfaces.spec.md.

## U7. Cautilus Produces Reviewable Human And Machine Artifacts

**Promise.**
`Cautilus` writes machine-readable files first and readable views over those files.

**What this means.**
JSON packets are the source of truth.
Markdown and HTML views should make the same state easier to review without becoming a separate truth source.
This supports the main feature jobs; it is not a separate claim that every view proves behavior by itself.

**How Cautilus checks it.**
Report, HTML, and status-server tests should prove that human views mirror the current packet and do not silently show stale or unrelated state.

**Source anchors.**
README.md, docs/contracts/reporting.md, docs/specs/html-report.spec.md.

## U8. Cautilus Supports Development And App Behavior Surfaces

**Promise.**
`Cautilus` can check both agent-development workflows and AI product behavior.

**What this means.**
Use `dev` surfaces for coding-agent work such as repo contracts, tools, and skills.
Use `app` surfaces for product prompts, chat loops, and service responses.
The same command family can handle both, as long as the fixture declares which surface it belongs to.

**How Cautilus checks it.**
Executable specs and fixture tests should prove the shipped `dev` and `app` presets without asking users to learn older category names.

**Source anchors.**
README.md, docs/specs/evaluation-surfaces.spec.md, docs/guides/evaluation-process.md.

## U9. Cautilus Makes Proof Debt Visible

**Promise.**
`Cautilus` separates "we found this promise" from "we have proven it."

**What this means.**
A claim packet is a work plan, not a certificate.
Human review can approve wording or decide how to check a claim, but a claim is not satisfied until concrete evidence supports it.

**How Cautilus checks it.**
Claim validation and evidence tests should prove that review comments alone cannot mark a claim as satisfied.

**Source anchors.**
README.md, docs/contracts/claim-discovery-workflow.md, docs/contracts/evidence-bundle.md.

## Relationship To Maintainer Claims

The maintainer-facing catalog maps these same promises to internal contracts, packet schemas, proof routes, and current known gaps.
User-facing wording should stay stable and readable; maintainer wording may use product-internal terms when that makes implementation and proof ownership clearer.
