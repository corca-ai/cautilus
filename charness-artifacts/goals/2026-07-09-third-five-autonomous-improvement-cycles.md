# Achieve Goal: Third Five Autonomous Improvement Cycles

Status: complete
Created: 2026-07-09
Activation: `/goal @charness-artifacts/goals/2026-07-09-third-five-autonomous-improvement-cycles.md`

This file is the living goal scratchpad for the third user-requested autonomous run.
The current host goal is already active for this artifact.

## Active Operating Frame

- Current slice: complete — all five improvement cycles are implemented, reviewed, committed, and locally verified.
- Current slice intent: closed after final broad local proof and closeout evidence.
- Next action: none — report the completed run.
- Verification cadence: cheap deterministic checks at commit boundaries;
  higher-cost or fresh-eye proof at slice boundaries; final broad/live proof at
  closeout.
- Gate cadence: pre-lock slices use `run_slice_closeout.py --skip-broad-pytest`;
  final/bundle proof records the verification lock and uses `--verification-lock`.
- Slice review packet: before fresh-eye slice critique, provide intent, changed
  files and owning/generated surfaces, expected invariants, tests/proof,
  non-claims, out-of-scope lines, and reviewer questions.
- History boundary: keep this frame current; move completed detail to
  `## Slice Log`, `## Operator Decision Queue`, `## Final Verification`,
  and `## Auto-Retro`.

## Goal

Run a third set of five autonomous Cautilus improvement cycles.
Each cycle should be locally decidable, scoped to the product boundary, verified with the strongest reasonable local checks, reviewed with bounded fresh-eye critique when it completes repo work, and committed before moving to the next cycle.

## Non-Goals

- Do not publish, push, run remote CI, cut releases, or change release versions.
- Do not introduce host-specific adapter behavior into generic Cautilus contracts.
- Do not claim live/product-runner proof from local deterministic checks.
- Do not change `skills/cautilus-agent/` or packaged plugin surfaces unless a cycle explicitly freezes consumer intent and runs the required quality path.
- Do not reopen broad roadmap architecture when a smaller validator, fixture, packet, or test improvement can move the product safely.

## Boundaries

- External side-effect scope: name which phase or bundle any approved
  publish / push / remote-CI / apply applies to. That approval is phase-scoped
  and does not carry forward — after an approved publish/CI/apply lane
  completes, done-early test-only quality continuation is local by default
  (batch remote proof, run CI once over the final bundled state). Per-slice
  remote publication is assumed only when the operator explicitly asks or a
  runtime-affecting slice requires earlier publication.
- Local-only scope: all five cycles should complete through checked-in code, tests, docs, generated packets, and Charness artifacts.
- Commit scope: each successful cycle gets its own scoped commit before the next cycle starts.
- Critique scope: task-completing code/config/doc cycles get bounded fresh-eye critique scaled to the slice.
- Direction scope: prefer the roadmap's below-apex hardening, packet-first proof, claim/eval/improve quality, and CLI plus Cautilus Agent product surface.

## User Acceptance

- `git log --oneline -5` shows five new scoped improvement commits from this third run, unless a cycle is explicitly closed as no-op/defer with a committed artifact explaining why.
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
| 1 | Show bounded cross-cutting signal samples in the claim status report. | Status packets already carry sample IDs, but the human report hid the next inspection targets. | Focused tests, generated status report check, critique, commit. | complete |
| 2 | Add `packet inspect` selector hints for report and scenario-results packets. | Keep the standalone binary's packet inspection surface useful for core evidence packets, not only claim workflow packets. | Focused Go tests, CLI usage regression test, critique, commit. | complete |
| 3 | Reject partial numeric CLI limits in claim status helper scripts. | Prevent `parseInt` from accepting malformed operator limits like `2abc`. | Focused Node tests, check-mode proof, critique, commit. | complete |
| 4 | Make `hooks:check` verify pre-push phase labels and order. | Existing hook checks verified commands but not the diagnostic phase contract operators see. | Focused Node tests, real hooks check, critique, commit. | complete |
| 5 | Expose `cli-agent-product` surface packet checks as npm scripts. | The packet checker already supported the surface, but operators lacked a direct package script. | Focused package tests, surface packet check, fresh-eye review, final gates, goal closeout, commit. | complete |

## Operator Decision Queue

- none — this run has no operator-only decisions at activation.
  External side effects are out of scope.

## Coordination Cues

Phase-appropriate routing for this run, deferred to `find-skills` (its
`--recommend-for-task` / `--recommendation-role --next-skill-id` recommendation
engine) — never a hard-coded phase-to-skill list here. `achieve` owns this slot
and the floors below; `find-skills` owns *which* skill answers a boundary. Fill
during the run:

- **Routing** — ask `find-skills` to recommend the skill for the current phase or
  boundary, and record the route it returns. At completion, recorded
  implementation / debug / quality / issue work needs this `Routing:` evidence
  or a `Routing: n/a — <reason>` opt-out.
- **Gather step** — when `## Context Sources` names an external source
  (URL / Slack / Notion / Docs / Drive), add a `Gather:` line here pointing at the
  gathered asset, or write `Gather: n/a — <reason>` when no external context
  applies.
- **Release step** — when this run touches a release surface (a version bump or
  install-manifest edit), add a `Release:` line here pointing at the release
  proof, or write `Release: n/a — <reason>`.
- **Issue closeout step** — when this goal resolves tracked GitHub issues, add
  an `Issue closeout:` line naming the close-intended issue numbers, carrier
  (`direct-commit`, PR body, release commit, or manual fallback), and
  `issue_tool.py validate-closeout-draft` / `verify-closeout` proof. If a
  tracked issue appears in `## Context Sources` as context only, use
  `Issue closeout: n/a — <reason>`.

Routing step line — record it on ONE physical line so the floor reads the whole
value (a soft-wrapped value is tolerated now, but one line is clearest). Copy the
form below and replace `<skill>` with the find-skills-recommended skill; the
placeholder is intentionally non-satisfying (the Gather / Release / Issue
closeout floors are presence-only, so no stub is seeded for them — add their line
per the bullets above when that boundary is crossed):

Routing: find-skills -> achieve, impl, quality, critique, retro — user requested another multi-cycle autonomous implementation run with per-slice review, local quality gates, and closeout retro tracking.

## Discuss Before Activation

A Before-phase summary of any consequential activation decision — surfaced from
the Non-Goals / Boundaries / Verification / Interview / Critique sections — that
must be resolved before `/goal`. Required only when a trigger fires (live/prod
proof, issue close/split, broad scope, irreversible side effect, or a
proof-level non-claim); replace the `fill` line below, or delete it when none
applies.

- Discuss before activation: resolved — the broad scope is constrained to five local, committed cycles with no external side effects or live-proof claims.

## Slice Log

### Slice 1: Cycle 1 — Claim Status Signal Samples

- Objective: Show bounded sample claim IDs for cross-cutting signals in the generated claim status report.
- Why this approach: The status packet can carry `sampleClaimIds`; hiding them forced operators back into JSON when a signal needed inspection.
- Commits:
- What changed: Added bounded `samples (n of total)` rendering for cross-cutting signal lines, added a focused action-buckets test, and regenerated `.cautilus/claims/claim-status-report.md`.
- Alternatives rejected: Rejected expanding the sample selection policy because the producer already owns sample selection; the report should surface that bounded data honestly.
- Targeted verification: `node --test scripts/agent-runtime/claim-status-action-buckets.test.mjs scripts/agent-runtime/render-claim-status-report.test.mjs`; `npm run claims:status-report:check`; `npm run lint:eslint`; `git diff --check`.
- Test duplication pressure: Added one focused helper test rather than more broad status report fixture assertions.
- Critique: Fresh-eye review 019f470c-6961-7c60-bae6-811862e9cbe3 found the initial truncation marker was misleading when producer-capped samples equaled five; fixed by using `signal.count`, re-review OK.
- Off-goal findings: none.
- Lessons carried forward: If a producer pre-caps samples, the human projection must use total count to signal boundedness instead of relying on sample array length.
- Metrics:

### Slice 2: Cycle 2 — Packet Inspect Evidence Hints

- Objective: Extend `doctor packet inspect` selector hints to report packets and scenario-results packets.
- Why this approach: These packets are core evidence surfaces; agents inspecting them should get canonical selector paths without guessing array field names.
- Commits:
- What changed: Added selector hints for `cautilus.report_packet.v2` (`.modeSummaries`, `.commandObservations`, `.humanReviewFindings`) and `cautilus.scenario_results.v1` (`.results`); added runtime tests; updated command registry usage notes and a registry test so help text tracks the supported schemas.
- Alternatives rejected: Rejected a generic recursive selector guesser because the current explicit schema map keeps the inspection packet auditable and avoids suggesting noisy arrays as action targets.
- Targeted verification: `go test ./internal/runtime ./internal/app ./internal/cli -run 'TestBuildPacketInspection|TestRunPacketInspectEmitsSchemaVersionAndArrayCounts|TestRenderPacketInspectUsageNamesCurrentSelectorHintCoverage'`; `npm run lint:eslint`; `git diff --check`.
- Test duplication pressure: Added focused runtime tests plus one help-text regression test; no broad CLI snapshot was expanded.
- Critique: Fresh-eye review 019f4710-b34e-79d3-9816-0ca923bc9e0d found stale command-registry wording; fixed, re-review OK.
- Off-goal findings: none.
- Lessons carried forward: Packet capability changes need both runtime schema tests and operator-facing command metadata tests in the same slice.
- Metrics:

### Slice 3: Cycle 3 — Strict Claim Helper Numeric Limits

- Objective: Reject partial numeric CLI limits in claim status report and review-drop helper scripts.
- Why this approach: `Number.parseInt` accepted malformed values such as `2abc`, which weakens deterministic command input validation.
- Commits:
- What changed: Made `--sample-per-bucket`, `--review-sample`, and `--sample-limit` require the full argument to be a positive decimal integer; added negative parser tests.
- Alternatives rejected: Rejected a broad parser utility refactor because only the touched claim helper scripts were in this slice and the local duplication is small.
- Targeted verification: `node --test scripts/agent-runtime/render-claim-status-report.test.mjs scripts/agent-runtime/summarize-claim-review-drops.test.mjs`; `npm run claims:status-report:check`; `npm run claims:review-drops:check`; `npm run lint:eslint`; `git diff --check`.
- Test duplication pressure: Added one parser test per helper family rather than expanding full CLI output fixtures.
- Critique: Fresh-eye review 019f4715-3010-78f0-ad63-2aabbd02e639: OK, no findings.
- Off-goal findings: none.
- Lessons carried forward: For CLI numeric options, full-string validation matters; `parseInt` alone is not an input contract.
- Metrics:

### Slice 4: Cycle 4 — Pre-Push Phase Signal Check

- Objective: Make `npm run hooks:check` verify the canonical pre-push phase labels and order.
- Why this approach: The hook already reports `verify` and `generated artifact drift` phases, but the readiness check only looked for guarded commands.
- Commits:
- What changed: Added `pre_push_phase_signal` to `scripts/check-git-hooks.mjs`; updated hook test fixtures; added a negative test for unlabeled guard calls.
- Alternatives rejected: Rejected a flexible shell parser because this repo owns the canonical checked-in hook shape and exact-string drift is useful here.
- Targeted verification: `node --test scripts/check-git-hooks.test.mjs`; `npm run hooks:check`; `npm run lint:eslint`; `git diff --check`.
- Test duplication pressure: Added one negative hook-readiness case; no broad hook execution test was added.
- Critique: Fresh-eye review 019f4717-bec7-7843-8f08-ccd32ee6c409: OK, exact-string check acceptable for the canonical hook contract.
- Off-goal findings: none.
- Lessons carried forward: When readiness output depends on diagnostic phase names, hook checks should guard those names and order, not only the underlying commands.
- Metrics:

### Slice 5: Cycle 5 — CLI Agent Surface Packet Script

- Objective: Expose the `cli-agent-product` surface critique packet check through package scripts.
- Why this approach: The checker already owns packaged skill parity/content sync rules for `cli-agent-product`, but package scripts only exposed the default release-packaging surface.
- Commits:
- What changed: Added `critique:surface-packet:cli-agent` and `critique:surface-packet:cli-agent:check` scripts; extended package script tests to lock the check command.
- Alternatives rejected: Rejected changing the default `critique:surface-packet:check` to run multiple surfaces because existing release-packaging callers may depend on the default output shape and scope.
- Targeted verification: `npm run critique:surface-packet:cli-agent:check`; `node --test scripts/github-actions.test.mjs scripts/prepare-surface-critique-packet.test.mjs`; `npm run lint:eslint`; `git diff --check`.
- Test duplication pressure: Added one package-script assertion beside existing local gate assertions; no duplicated surface packet fixtures were added.
- Critique: Fresh-eye review 019f471a-2994-7d03-afa9-2132c884553f: OK, no findings; `package-lock.json` update not required because root scripts are not recorded there.
- Off-goal findings: none.
- Lessons carried forward: When a surface packet exists for a repo-owned quality boundary, expose the common check path through package scripts instead of requiring operators to remember raw flags.
- Metrics:

## Context Sources

Durable references this goal was shaped from. A fresh session can reconstruct
the originating context by following them in order.

- `AGENTS.md`
- `README.md`
- `docs/master-plan.md`
- `CLAUDE.md`
- `charness-artifacts/goals/2026-07-09-second-five-autonomous-improvement-cycles.md`

## Interview Decisions

For each Before-phase question: family of options considered, chosen value, and
rejected-alternatives reason. Applies the anti-anchoring lesson to the artifact
itself so a fresh session sees the design space, not only the closed point.

- Run shape: chosen: five more local improvement cycles; rejected: one broad refactor, because commit-scoped proof is easier to audit.
- Proof boundary: chosen: local deterministic proof plus final broad repo gates; rejected: push/release/live proof, because the user asked for autonomous local improvement.
- Surface choice: chosen: code/tests/packets under Cautilus product boundaries; rejected: host-specific adapter behavior.
- Continuation policy: chosen: proceed autonomously through slice boundaries unless a policy, external side effect, or evidence conflict blocks safe progress.

## Plan Critique Findings

Blockers folded into Boundaries/Verification/Slice Plan, over-worry raised but
not folded, and reviewer provenance. Preserves reasoning so a fresh session
re-verifies the folded revisions without re-running critique.

- Folded: each cycle must produce either a scoped commit or an explicit committed no-op/defer artifact.
- Folded: final closeout must separate local proof from skipped live/product proof.
- Over-worry: requiring a new product concept for each cycle would fight the repo's preference for small bounded runtimes and validators.

## Off-Goal Findings

Issues or deferred findings discovered during the run.

## Final Verification

Retro: charness-artifacts/retro/2026-07-09-third-five-autonomous-improvement-cycles-retro.md
Host log probe: charness-artifacts/retro/2026-07-09-third-five-autonomous-improvement-cycles-host-probe.md
Disposition review: charness-artifacts/retro/2026-07-09-third-five-autonomous-improvement-cycles-disposition-review.md

- `npm run verify`: passed.
- `npm run hooks:check`: passed.
- `npm run generated:drift:check`: passed.
- `describe_goal_closeout_shape.py --goal-path charness-artifacts/goals/2026-07-09-third-five-autonomous-improvement-cycles.md`: passed after closeout evidence was bound.
- External or live proof: skipped — local-only run, no push, release, remote CI, or live proof was requested or claimed.

## User Verification Instructions

- Inspect the five scoped commits with `git log --oneline -5`.
- Re-run final local gates with `npm run verify`, `npm run hooks:check`, and `npm run generated:drift:check`.
- Inspect the goal, retro, host-probe, and disposition artifacts named in `## Final Verification`.

## Auto-Retro

Retro dispositions: applied: completed subagent cleanup was performed before Cycle 4 review retry, packet behavior changes now carry command metadata tests, and recurring operator checks gained deterministic hook/package-script gates.
Structural follow-up: applied: hook readiness, packet inspect metadata, and CLI-agent surface packet access are now enforced by tests or package scripts; no issue-routed follow-up remains.
