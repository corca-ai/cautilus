# Debug Review: dev-skill branch dogfood drift
Date: 2026-05-03

## Problem

The current Codex dogfood for `self-dogfood-refresh-flow` failed after the deterministic proof closure even though the historical evidence bundle said the flow had passed.
The first current run produced `recommendation=reject` with audit errors for missing `claim discover --previous --refresh-plan`, missing `refreshSummary` read, missing saved-claim-map language, and missing not-updated boundary.

## Correct Behavior

Given a dev/skill refresh-flow fixture selects the saved-claim-map refresh branch, when the bundled `cautilus` skill runs, then it should create a refresh-plan packet with `claim discover --previous ... --refresh-plan`, read `refreshSummary`, explain that the saved claim map was not updated, and stop before review, eval planning, product edits, or commits.

Given a review-prepare fixture runs a first claim scan and prepares review input, when `claim discover` and `claim show` are executed in one ordered shell command, then the audit should accept the flow if the order is still status, discover, show, prepare-input and the agent states that reviewer lanes were not launched.

## Observed Facts

- `./bin/cautilus eval test --repo-root . --adapter-name self-dogfood-refresh-flow --runtime codex --output-dir ./artifacts/self-dogfood/cautilus-refresh-flow-eval-codex/latest` initially returned `recommendation=reject`.
- The failed refresh transcript ran `agent status` and `claim show`, but did not run `claim discover --previous ... --refresh-plan`.
- The refresh fixture second turn was the numeric input `1`.
- Current `agent status` no longer made refresh branch `1`; the agent had legitimately selected a status/inspection branch from the labels it had just presented.
- The source, plugin copy, and installed copy of `skills/cautilus/SKILL.md` did not explicitly say that numbered branch selections must resolve against the labels just shown.
- After changing the refresh fixture second turn to `Compare the saved claim map with recent repo changes.`, the refresh-flow eval returned `recommendation=accept-now`.
- The current review-prepare eval then failed because the audit required `claim discover` and `claim show` to appear as separate command records and did not accept the wording `I did not launch any reviewer lane`.
- The review-prepare transcript had the right behavioral boundary: it ran status, a first scan plus `claim show`, `claim review prepare-input`, inspected the packet budget, and said it did not launch reviewer lanes, apply review results, plan eval fixtures, or edit files.

## Reproduction

The stale refresh fixture failure was reproduced with:

```bash
./bin/cautilus eval test --repo-root . --adapter-name self-dogfood-refresh-flow --runtime codex --output-dir ./artifacts/self-dogfood/cautilus-refresh-flow-eval-codex/latest
```

The audit brittleness was reproduced with:

```bash
./bin/cautilus eval test --repo-root . --adapter-name self-dogfood-review-prepare-flow --runtime codex --output-dir ./artifacts/self-dogfood/cautilus-review-prepare-flow-eval-codex/latest
node scripts/agent-runtime/audit-cautilus-review-prepare-flow-log.mjs --input artifacts/self-dogfood/cautilus-review-prepare-flow-eval-codex/latest/review-prepare-flow/episode-cautilus-review-prepare-flow/combined.jsonl --output /tmp/review-prepare-audit.json
```

## Candidate Causes

- The refresh fixture overfit to a numeric branch order that changed as `agent status` and claim-state orientation improved.
- The skill did not make branch-number resolution explicit enough, so a future numeric choice could still drift when labels move.
- The review-prepare audit checked command-record boundaries instead of semantic command order and was too narrow about reviewer-lane boundary wording.

## Hypothesis

If the refresh fixture selects the refresh branch by explicit label intent, the skill documents numbered-branch resolution, and the review-prepare audit accepts ordered combined discover/show commands plus natural reviewer-lane wording, then current Codex dogfood should pass without weakening the core branch boundaries.

## Verification

- Updated the bundled skill source, plugin copy, and installed copy to resolve numbered branch replies against the labels just shown and to bind saved-claim-map comparison to the refresh-plan command.
- Updated `fixtures/eval/dev/skill/cautilus-refresh-flow.fixture.json` so the second turn explicitly asks to compare the saved claim map with recent repo changes instead of sending a stale numeric `1`.
- Updated `scripts/agent-runtime/audit-cautilus-review-prepare-flow-log.mjs` to compare semantic command token positions, so `claim discover && claim show` is accepted only when discover appears before show.
- Updated the review-prepare audit wording check to accept `did not launch any reviewer lane`.
- Added a focused test for combined discover/show command order.
- `node --test scripts/agent-runtime/audit-cautilus-review-prepare-flow-log.test.mjs` passes.
- Re-running the refresh-flow Codex dogfood returned `recommendation=accept-now`.
- Re-running the review-prepare Codex dogfood returned `recommendation=accept-now`.

## Root Cause

The dogfood fixtures and audit encoded incidental interaction shape.
The refresh fixture assumed branch number stability after `agent status`, while the product now gives a richer orientation where the first branch can legitimately differ.
The review-prepare audit assumed each step would be a separate command record and missed equivalent no-reviewer-launch wording.

## Seam Risk

- Interrupt ID: dev-skill-branch-dogfood-drift
- Risk Class: contract-freeze-risk
- Seam: bundled skill branch selection, Codex conversational runtime, and transcript audit scripts
- Disproving Observation: current Codex dogfood rejected both a stale numeric branch fixture and an audit-strict but behaviorally valid review-prepare transcript.
- What Local Reasoning Cannot Prove: that all future conversational agents will map every numbered branch correctly under arbitrary wording.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Prefer explicit branch intent in fixtures when the claim is about a named branch rather than numeric menu stability.
When audit scripts check command order, compare semantic command positions instead of requiring one shell command per workflow step.
Keep natural-language boundary checks broad enough to recognize equivalent reviewer-lane wording while still requiring an explicit no-launch/no-apply/no-eval boundary.
