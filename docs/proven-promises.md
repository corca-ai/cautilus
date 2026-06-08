# Cautilus, Proven On Itself

Status: SKELETON v1 (DRAFT — promise voice pending owner).
This is a curated, human-legible view, not a generated dump.

Cautilus is a standalone CLI plus the Cautilus Agent for intentful behavior evaluation.
It discovers what an agent product promises, proves selected promises against auditable evidence, and improves behavior under bounded gates.

## How To Read This

This page presents Cautilus at the level of seven product promises, not at the level of the hundreds of raw discovered claims under them.
The raw claims remain the high-recall, source-ref-backed provenance; they are deliberately not the thing you review here.
Each promise below shows the promise in one sentence, its current proof status, one or two hand-picked exemplar claims anchored to a real source line, and the CLI/Agent division of labor that delivers it.
Proof status is intentionally qualitative, not a precise count, because the leaf-to-promise mapping is still being hardened (see the known limitation at the end).

Status legend:

- proven — at least one promise claim is satisfied against checked-in evidence
- thin — promised, with only partial evidence so far
- promised — declared, not yet proven; an active improvement target

## Part A — The Core Loop

### U1 · Readiness — proven

Promise: before any evaluation, `cautilus doctor` tells you deterministically what is ready and what is missing, and points at the next setup step.

Evidence:

- `docs/guides/consumer-adoption.md:25` — "`cautilus --version` must work on `PATH` before any consumer adapter or skill wiring is treated as valid."
- `docs/guides/cli.md:114` — "If repo setup is ready but runner proof is not, that next action can point at runner assessment setup before the first bounded run."

CLI ↔ Agent: the CLI runs the deterministic checks and prints the verdict; the Agent proposes which workflow to run next.

### U2 · Claim Discovery — proven

Promise: Cautilus reads a repo's own truth surfaces and turns the promises it declares into a source-ref-backed proof backlog, without calling an LLM or marking anything satisfied on its own.

Evidence:

- `docs/guides/cli.md:135` — "It emits `cautilus.claim_review_input.v1` and does not call an LLM or mark claims satisfied."
- `docs/guides/cli.md:263` — "The same packet also emits an `attentionView`, which is a bounded human-facing shortlist derived from the full ranked set."

CLI ↔ Agent: the CLI does high-recall extraction and a deterministic draft route; the Agent refines routes to high confidence, groups, and decides next actions.

### U3 · Behavior Evaluation — thin

Promise: Cautilus checks whether your agent-equipped runner behaves the way a scenario expects — chatbot reply, tool choice, skill choice — like an end-to-end test, and leaves reopenable packets.

Evidence:

- `docs/specs/user/evaluation.spec.md:36` — "A user can reopen observed behavior and summary packets after each eval."

Honest gap: only partial evidence is attached today; this is one of the two thinnest promises.

CLI ↔ Agent: the CLI runs the runner and emits packets; the Agent extracts scenarios and interprets verdicts.

### U4 · Bounded Improvement — promised

Promise: Cautilus improves a prompt that was not passing until it passes, preserving the agent's intent while raising quality or lowering cost, gated by protected checks, held-out evidence, and an explicit budget, never auto-applied.

Evidence:

- `docs/specs/user/improvement.spec.md:23` — "A user can improve behavior while preserving protected checks, held-out evidence, and explicit budget."
- `docs/specs/user/improvement.spec.md:41` — "Improvement produces a proposal and revision artifact that preserve source files, stop conditions, priorities..."

Honest gap: declared and specced, not yet proven by satisfied evidence; an active improvement target.

CLI ↔ Agent: the CLI runs gates and comparisons; the Agent proposes changes and judges whether to keep them.

## Part B — Why You Can Trust It

### U5 · Reviewable Artifacts — proven

Promise: every workflow leaves machine-readable packets and readable views that another person or agent can reopen as the audit source of truth.

Evidence:

- `docs/specs/user/reviewable-artifacts.spec.md:3` — "After an agent runs a workflow, the user needs durable packets and readable views that another person or agent can reopen."
- `docs/specs/user/reviewable-artifacts.spec.md:6` — "A user or agent can reopen JSON packets as the audit source of truth."

### U6 · Evidence Gaps — proven

Promise: Cautilus does not hide what is unproven; it keeps the candidate-not-proof boundary visible.

Evidence:

- `docs/specs/user/evidence-gaps.spec.md:8` — "The claim status summary keeps the candidate-not-proof boundary visible to users."

This is why U3 showing thin and U4 showing promised is a feature of this page, not an embarrassment.

### U7 · Host Ownership — proven

Promise: your repo owns adapters, fixtures, prompts, and policy; Cautilus owns only the generic workflow, so adopting it never means handing your repo over.

Evidence:

- `docs/specs/user/ownership.spec.md:27` — "A standalone consumer can install Cautilus, initialize adapter wiring, and reach a first bounded run without Cautilus taking over."
- `README.md:7` — "Ships as a standalone binary plus Cautilus Agent, which a host repo can install without copying another skill tree by hand."

## Provenance And Known Limitation

The exemplar claims above are hand-picked from Cautilus's own claim discovery over this repo; full provenance lives in `.cautilus/claims/`.
Known limitation: the automatic mapping from raw discovered claims to these seven promises is still low-confidence and over-inclusive, so per-promise counts are not yet trustworthy and are omitted here on purpose.
That weakness is tracked as the first internal improvement target in [charness-artifacts/findings/2026-06-08-canonicalization-precision-root-finding.md](../charness-artifacts/findings/2026-06-08-canonicalization-precision-root-finding.md).
