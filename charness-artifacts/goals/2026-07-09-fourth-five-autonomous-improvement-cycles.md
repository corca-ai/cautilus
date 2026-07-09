# Achieve Goal: Fourth Five Autonomous Improvement Cycles

Status: active
Created: 2026-07-09
Activation: `/goal @charness-artifacts/goals/2026-07-09-fourth-five-autonomous-improvement-cycles.md`

This file is the living goal scratchpad for the fourth user-requested autonomous run.
The current host goal is already active for this artifact.

## Active Operating Frame

- Current slice: Cycle 3 — claim review input summary schema validation.
- Current slice intent: make review-input summary rendering fail fast on non-review-input packets after Cycle 2 hardened generated-artifact drift path parsing.
- Next action: commit Cycle 2, then implement Cycle 3.
- Verification cadence: cheap deterministic checks at commit boundaries; higher-cost or fresh-eye proof at slice boundaries; final broad/live proof at closeout.
- Gate cadence: pre-lock slices use `run_slice_closeout.py --skip-broad-pytest`; final/bundle proof records the verification lock and uses `--verification-lock`.
- Slice review packet: before fresh-eye slice critique, provide intent, changed files and owning/generated surfaces, expected invariants, tests/proof, non-claims, out-of-scope lines, and reviewer questions.
- History boundary: keep this frame current; move completed detail to `## Slice Log`, `## Operator Decision Queue`, `## Final Verification`, and `## Auto-Retro`.

## Goal

Run a fourth set of five autonomous Cautilus improvement cycles.
Each cycle should improve the standalone Cautilus product boundary or Cautilus Agent proof surface, stay locally decidable, include focused verification, receive bounded fresh-eye review when it changes repo behavior, and land as a scoped commit before the next cycle begins.

## Non-Goals

- Do not publish, push, run remote CI, cut releases, or change release versions.
- Do not introduce host-specific adapter behavior into generic Cautilus contracts.
- Do not claim live/product-runner proof from local deterministic checks.
- Do not change `skills/cautilus-agent/` or packaged plugin surfaces unless a cycle explicitly freezes consumer intent and runs the required quality path.
- Do not reopen broad roadmap architecture when a smaller validator, fixture, packet, or test improvement can move the product safely.

## Boundaries

- External side-effect scope: name which phase or bundle any approved publish / push / remote-CI / apply applies to.
  That approval is phase-scoped and does not carry forward — after an approved publish/CI/apply lane completes, done-early test-only quality continuation is local by default (batch remote proof, run CI once over the final bundled state).
  Per-slice remote publication is assumed only when the operator explicitly asks or a runtime-affecting slice requires earlier publication.
- Local-only scope: all five cycles should complete through checked-in code, tests, docs, generated packets, and Charness artifacts.
- Commit scope: each successful cycle gets its own scoped commit before the next cycle starts.
- Critique scope: task-completing code/config/doc cycles get bounded fresh-eye critique scaled to the slice.
- Direction scope: prefer claim/eval/report/packet quality, CLI ergonomics, generated proof honesty, and local operator checks.

## User Acceptance

- `git log --oneline -5` shows five new scoped improvement commits from this fourth run, unless a cycle is explicitly closed as no-op/defer with a committed artifact explaining why.
- `npm run verify`, `npm run hooks:check`, and `npm run generated:drift:check` pass at final closeout.
- The goal artifact records the five slices, their verification evidence, critique status, and residual non-claims.

## Agent Verification Plan

### Low-Cost Checks

- Per-cycle focused unit/spec tests for touched surfaces.
- `npm run lint:eslint` when Node scripts change.
- Narrow check-mode commands for generated packets when claim or status artifacts move.
- `go test` package or focused test selection when Go runtime surfaces change.
- `git diff --check` before each commit.

### High-Confidence Checks

- `npm run verify` at final bundle boundary and earlier when a cycle changes shared gates or generated artifacts.
- `npm run hooks:check` at final closeout.
- `npm run generated:drift:check` after generated-packet or report changes.
- Goal and retro validators before completing the run.

### External Or Live Proof

- skipped: local-only run — user asked for autonomous improvement cycles, not publish/push/live product proof.

## Slice Plan

| Slice | Objective | Why Now | Expected Evidence | Status |
| --- | --- | --- | --- | --- |
| 1 | Align claim status report review-result projection with apply-current claim identity semantics. | The report mixed current-claim field equality with review-result identity and could misclassify active/superseded updates. | Focused Node tests, generated report check, critique, commit. | complete |
| 2 | Reject missing values for explicit generated artifact drift `--path`. | Explicit path mode should fail on malformed CLI input instead of silently falling back to the default artifact set. | Focused Node tests, critique, commit. | complete |
| 3 | Reject non-review-input packets in the claim review input summary renderer. | A readable projection should not silently summarize the wrong JSON packet shape. | Focused Node tests, critique, commit. | in progress |
| 4 | Harden a locally discoverable CLI/report/packet edge found during exploration. | Keep one slot flexible for fresh repo evidence rather than forcing a stale backlog item. | Focused tests, critique, commit. | planned |
| 5 | Harden a second locally discoverable CLI/report/packet edge and close the goal. | Finish with an independent product-quality slice plus final broad gates and retro. | Focused tests, final gates, closeout artifacts, commit. | planned |

## Operator Decision Queue

- none — this run has no operator-only decisions at activation.
  External side effects are out of scope.

Record decisions, confirmations, credential actions, manual proof steps, and external-boundary approvals discovered during the run when they do not block safe local progress.
Use `none — <reason>` when the queue is empty at closeout.

Queue item form:

- Decision: operator-only decision or confirmation needed
- Owner: operator or named human owner
- Why deferred: why the run did not stop immediately
- Unblock action: exact action or answer needed
- Revisit trigger: event, date, or proof boundary that reopens this

## Coordination Cues

Phase-appropriate routing for this run is deferred to `find-skills` (its `--recommend-for-task` / `--recommendation-role --next-skill-id` recommendation engine), never a hard-coded phase-to-skill list here.
`achieve` owns this slot and the floors below; `find-skills` owns *which* skill answers a boundary.
Fill during the run:

- **Routing** — ask `find-skills` to recommend the skill for the current phase or boundary, and record the route it returns.
  At completion, recorded implementation / debug / quality / issue work needs this `Routing:` evidence or a `Routing: n/a — <reason>` opt-out.
- **Gather step** — when `## Context Sources` names an external source (URL / Slack / Notion / Docs / Drive), add a `Gather:` line here pointing at the gathered asset, or write `Gather: n/a — <reason>` when no external context applies.
- **Release step** — when this run touches a release surface (a version bump or install-manifest edit), add a `Release:` line here pointing at the release proof, or write `Release: n/a — <reason>`.
- **Issue closeout step** — when this goal resolves tracked GitHub issues, add an `Issue closeout:` line naming the close-intended issue numbers, carrier (`direct-commit`, PR body, release commit, or manual fallback), and `issue_tool.py validate-closeout-draft` / `verify-closeout` proof.
  If a tracked issue appears in `## Context Sources` as context only, use `Issue closeout: n/a — <reason>`.

Routing step line — record it on ONE physical line so the floor reads the whole value (a soft-wrapped value is tolerated now, but one line is clearest).
Copy the form below and replace `<skill>` with the find-skills-recommended skill; the placeholder is intentionally non-satisfying (the Gather / Release / Issue closeout floors are presence-only, so no stub is seeded for them — add their line per the bullets above when that boundary is crossed):

Routing: find-skills -> achieve, impl, quality, critique, retro — user requested another multi-cycle autonomous implementation run with per-slice review, local quality gates, and closeout retro tracking.

## Discuss Before Activation

A Before-phase summary of any consequential activation decision — surfaced from the Non-Goals / Boundaries / Verification / Interview / Critique sections — that must be resolved before `/goal`.
Required only when a trigger fires (live/prod proof, issue close/split, broad scope, irreversible side effect, or a proof-level non-claim); replace the `fill` line below, or delete it when none applies.

- Discuss before activation: resolved — the broad scope is constrained to five local, committed cycles with no external side effects or live-proof claims.

## Slice Log

### Slice 1: Cycle 1 — Claim Review Result Identity Projection

- Objective: Make the generated claim status report classify review-result active updates using the same current claim identity semantics as `apply-current-review-results`.
- Why this approach: `claimFingerprint` is claim identity, while claim fields in review results are proposed updates; the status report should not require proposed values to already equal the current packet.
- What changed: Added `claim-review-result-projection.mjs`, wired the report renderer through it, rewrote display-id drift and `evidenceRefs[].supportsClaimIds`, updated report wording, added regression tests for stale fingerprints, display-id drift, fingerprintless current claims, and proposed field deltas, and regenerated `.cautilus/claims/claim-status-report.md`.
- Alternatives rejected: Rejected field-equality filtering after fresh-eye review showed it diverged from `apply-current-review-results` and undercounted active review packets.
- Targeted verification: `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/render-claim-status-report.test.mjs scripts/agent-runtime/apply-current-review-results.test.mjs`; `npm run claims:status-report:check`; `npm run lint:eslint`; `git diff --check`.
- Critique: Fresh-eye reviews `019f4724-32a2-78f3-af25-ed6b498d4596` and `019f4729-b3c0-7981-ac3f-0bd50c5c2de5` found semantic mismatches; fixed by matching apply-current identity and evidence ref rewrite behavior.
  Final fresh-eye review `019f472e-e240-7ba0-affa-744b7625f4ac` found only stale wording and goal-log issues; both were fixed before commit.
- Off-goal findings: none.
- Lessons carried forward: Projection code that claims parity with replay/application code should compare against the replay identity contract, not against human-readable field equality.

### Slice 2: Cycle 2 — Generated Drift Explicit Path Validation

- Objective: Make `scripts/check-generated-artifact-drift.mjs --path` require an explicit non-flag value.
- Why this approach: Missing `--path` previously pushed an empty value that was filtered away, causing explicit path mode to silently fall back to the default generated artifact list.
- What changed: Added `readOptionValue` for `--path`, made missing or flag-like values fail with `--path requires a value`, and covered parser plus CLI stderr behavior.
- Alternatives rejected: Rejected broad parser normalization across scripts because this slice only needed to close the generated drift checker edge.
- Targeted verification: `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/check-generated-artifact-drift.test.mjs`; `npm run generated:drift:check`; `npm run lint:eslint`; `git diff --check`.
- Critique: Fresh-eye review `019f4733-40dc-7343-bdaa-59f889f05b6d` returned OK and noted the dash-prefixed path compatibility tradeoff matches the explicit non-flag value contract.
- Off-goal findings: none.
- Lessons carried forward: Optional repeated path flags should reject malformed explicit mode instead of filtering bad values into default behavior.

## Context Sources

Durable references this goal was shaped from.
A fresh session can reconstruct the originating context by following them in order.

- `AGENTS.md`
- `README.md`
- `docs/master-plan.md`
- `CLAUDE.md`
- `charness-artifacts/goals/2026-07-09-third-five-autonomous-improvement-cycles.md`

## Interview Decisions

For each Before-phase question: family of options considered, chosen value, and rejected-alternatives reason.
Applies the anti-anchoring lesson to the artifact itself so a fresh session sees the design space, not only the closed point.

- Scope family: another broad exploratory pass, one large architecture change, or five small verified cycles.
  Chosen: five small verified cycles because the user asked to continue autonomous improvement and the repo has a strong commit-per-slice convention.
  Rejected: large architecture change because it would dilute proof and review boundaries.
- Proof family: local deterministic gates, remote CI, or live product proof.
  Chosen: local deterministic gates with explicit non-claims because external side effects are out of scope.
  Rejected: remote CI/live proof because the user did not authorize push, publish, or live execution.

## Plan Critique Findings

Blockers folded into Boundaries/Verification/Slice Plan, over-worry raised but not folded, and reviewer provenance.
Preserves reasoning so a fresh session re-verifies the folded revisions without re-running critique.

- Folded: preserve one flexible slot after the first three candidates so the run can use current code evidence rather than only stale backlog notes.
- Folded: keep fingerprint filtering as the first slice because it has a clear correctness invariant and narrow test surface.
- Over-worry: requiring broad gates after every small slice would waste time; focused checks plus final broad gates match the repo's cadence.

## Off-Goal Findings

Issues or deferred findings discovered during the run.

## Final Verification

Closeout evidence — replace each `TODO` with a bound `<path>` (a checked-in retro / host-log probe / disposition-review artifact) or an explicit `skipped: <allowed-reason>: <detail>`.
The complete gate rejects a literal `TODO` / `<path>` / `TBD` until you do.

Retro: TODO — create or explicitly skip with an allowed reason before complete
Host log probe: TODO — create or explicitly skip with an allowed reason before complete
Disposition review: TODO — create or explicitly skip only when policy allows before complete

## User Verification Instructions

## Auto-Retro

Retro dispositions: TODO — disposition every surfaced improvement, or record the explicit no-improvement opt-out
Structural follow-up: TODO — when the retro names a transferable waste item (a `## Sibling Search` trigger), classify its structural destination (`applied: <gate/hook/validator/test/contract change>` / `issue #N (recurs:|novel: <reason>)` / `repo-local guard: <path>` / `none — <reason>`); delete this line when no transferable waste was named
