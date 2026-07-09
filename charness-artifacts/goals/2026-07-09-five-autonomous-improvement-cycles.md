# Achieve Goal: Five Autonomous Improvement Cycles

Status: active
Created: 2026-07-09
Activation: `/goal @charness-artifacts/goals/2026-07-09-five-autonomous-improvement-cycles.md`

This file is the living goal scratchpad for the user-requested autonomous run.
The current host goal is already active for this artifact.

## Active Operating Frame

- Current slice: Cycle 4 — contract/report synchronization hardening.
- Current slice intent: use the accumulated claim proof-chain context to tighten
  a user-facing or maintainer-facing projection without broad refactor.
- Next action: inspect remaining scout candidates and pick a narrow Cycle 4 target.
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

Run five autonomous Cautilus improvement cycles.
Each cycle should be locally decidable, scoped to the product boundary, verified with the strongest reasonable local checks, reviewed with bounded fresh-eye critique when it completes repo work, and committed before moving to the next cycle.

## Non-Goals

- Do not publish, push, run remote CI, or change release versions.
- Do not introduce host-specific adapter behavior into generic Cautilus contracts.
- Do not open a broad roadmap branch when a smaller guard, packet, validator, or fixture improvement will deliver clearer value.
- Do not claim live/product-runner proof from local deterministic checks.
- Do not change `skills/cautilus-agent/` or packaged plugin surfaces unless a cycle explicitly freezes consumer intent and runs the required quality path.

## Boundaries

- External side-effect scope: name which phase or bundle any approved
  publish / push / remote-CI / apply applies to. That approval is phase-scoped
  and does not carry forward — after an approved publish/CI/apply lane
  completes, done-early test-only quality continuation is local by default
  (batch remote proof, run CI once over the final bundled state). Per-slice
  remote publication is assumed only when the operator explicitly asks or a
  runtime-affecting slice requires earlier publication.
- Local-only scope: all five cycles should complete through checked-in code, tests, docs, generated packets, and Charness artifacts.
- Commit scope: each successful cycle gets its own commit before the next cycle starts.
- Critique scope: task-completing code/config/doc cycles get bounded fresh-eye critique scaled to the slice.

## User Acceptance

- `git log --oneline -5` shows five new scoped improvement commits from this run, unless a cycle is explicitly closed as no-op/defer with a committed artifact explaining why.
- `npm run verify` and `npm run hooks:check` pass at final closeout.
- The goal artifact records the five slices, their verification evidence, critique status, and residual non-claims.

## Agent Verification Plan

### Low-Cost Checks

- Per-cycle focused unit/spec tests for touched surfaces.
- `npm run lint:eslint` when Node scripts change.
- `npm run claims:review-drops:check`, `npm run claims:source-freshness:check`, or related narrow generated-artifact checks when claim packets move.
- `git diff --check` before each commit.

### High-Confidence Checks

- `npm run verify` at the final bundle boundary and earlier when a cycle changes shared gates or generated artifacts.
- `npm run hooks:check` at final closeout.
- Critique artifact validation whenever standalone `critique` produces a durable record.

### External Or Live Proof

- skipped: local-only run — user asked for autonomous local improvement cycles, not publish/push/live product proof.

## Slice Plan

| Slice | Objective | Why Now | Expected Evidence | Status |
| --- | --- | --- | --- | --- |
| 1 | Validate review-drop source sample policy shape. | Start with a low-risk proof-integrity slice. | Focused tests, generated artifacts, critique record, commit. | complete |
| 2 | Expand generated drift coverage for claim refresh outputs. | Candidate scouts found a check gap while Cycle 1 regenerated claim packets. | Focused tests, drift check proof, commit. | complete |
| 3 | Add canonical claim map check mode and verify phase. | Mid-run cycle should strengthen repeatable checks rather than prose alone. | Focused tests, validator output, commit. | complete |
| 4 | Improve documentation/contract synchronization where code and packet behavior can prove it. | Use accumulated context to tighten source-of-truth alignment. | Contract/doc diff plus check, critique/defer record, commit. | in-progress |
| 5 | Final small hardening slice and bundle verification. | Close the run with a useful improvement and broad proof. | Focused checks, `npm run verify`, `npm run hooks:check`, goal closeout, commit. | pending |

## Operator Decision Queue

Record decisions, confirmations, credential actions, manual proof steps, and
external-boundary approvals discovered during the run when they do not block
safe local progress. Use `none — <reason>` when the queue is empty at closeout.

Queue item form:

- Decision: operator-only decision or confirmation needed
- Owner: operator or named human owner
- Why deferred: why the run did not stop immediately
- Unblock action: exact action or answer needed
- Revisit trigger: event, date, or proof boundary that reopens this

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

- `Routing: find-skills -> achieve/impl/critique — user requested a multi-cycle autonomous implementation run with per-slice review and goal tracking`

## Discuss Before Activation

A Before-phase summary of any consequential activation decision — surfaced from
the Non-Goals / Boundaries / Verification / Interview / Critique sections — that
must be resolved before `/goal`. Required only when a trigger fires (live/prod
proof, issue close/split, broad scope, irreversible side effect, or a
proof-level non-claim); replace the `fill` line below, or delete it when none
applies.

- Discuss before activation: resolved — the broad scope is constrained to five local, committed cycles with no external side effects or live-proof claims.

## Slice Log

### Cycle 1 — Review Drop Policy Shape

- Objective: reject malformed `droppedUpdateSamplePolicy` source provenance and document its current shape.
- Why this approach: Cycle 1 preserved existing producer-owned policy data but found that downstream consumers could still accept contradictory reason-representation claims.
- Commits: `Validate review drop policy shape` in this cycle's scoped commit.
- What changed: `buildReviewDropSummary` now validates source policy selection, integer sample cap, source and selected counts, non-proportional sampling, reason-representation guarantee, and represented reason coverage when the cap allows it; the contract doc now names the policy shape and invariants.
- Alternatives rejected: deferred a full `reviewApplication` schema migration because this cycle only needed to harden the active sampled-drop contract.
- Targeted verification: `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/summarize-claim-review-drops.test.mjs`; `npm run lint:eslint`; `npm run claims:review-drops:check`; `npm run claims:refresh:all`; `npm run claims:source-freshness:check`; `npm run claims:evidence-state:check`; `git diff --check`; critique/debug/goal artifact validators.
- Test duplication pressure: focused tests cover the new negative cases; broad duplication pressure is left to final `npm run verify` and `npm run hooks:check`.
- Critique: parent-delegated fresh-eye review recorded in `charness-artifacts/critique/2026-07-09-cycle-1-review-drop-policy-shape-critique.md`.
- Off-goal findings: scouts proposed later cycles for generated drift coverage, canonical map check mode, status-report SOT splits, and goal closeout guards.
- Lessons carried forward: policy provenance needs semantic invariant checks, not only field presence checks.
- Metrics: not measured.

### Cycle 2 — Generated Drift Coverage

- Objective: make `generated:drift:check` cover every checked-in claim refresh artifact that `claims:refresh:all` writes.
- Why this approach: pre-push already trusts `generated:drift:check`; expanding its default target list closes the smallest observed gap without adding a new gate.
- Commits: `Cover claim refresh generated drift`.
- What changed: `DEFAULT_GENERATED_ARTIFACTS` now includes `.cautilus/claims/latest.json`, `evidenced-typed-runners.json`, `canonical-claim-map.json`, `claim-status-report.md`, and `review-drops-summary.{json,md}` in addition to the existing status/evidence/audit outputs.
- Alternatives rejected: did not add historical or ignored claim artifacts because the gate should stay scoped to canonical checked-in refresh outputs.
- Targeted verification: `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/check-generated-artifact-drift.test.mjs`; `npm run generated:drift:check`; `npm run lint:eslint`; `git diff --check`.
- Test duplication pressure: the test asserts the full default path list and a non-status claim refresh dirty file; full hook execution is reserved for final `npm run hooks:check`.
- Critique: parent-delegated fresh-eye review from agent `019f46ce-1a37-7cb0-9e4e-211421549ef3`; verdict OK, no findings.
- Off-goal findings: none beyond existing Cycle 1 scout queue.
- Lessons carried forward: pre-push guard confidence depends on the default generated-artifact inventory matching the producer command chain.
- Metrics: not measured.

### Cycle 3 — Canonical Claim Map Check Mode

- Objective: make stale `.cautilus/claims/canonical-claim-map.json` fail directly instead of relying on downstream readers to notice drift.
- Why this approach: `claims:refresh:all` writes the canonical map and status report links to it, so the map needs the same check-mode contract as other generated claim projections.
- Commits: `Check canonical claim map freshness`.
- What changed: `build-canonical-claim-map.mjs` now accepts `--check`, compares the regenerated stable JSON to the checked-in output without writing, and fails on missing or stale output; `claims:canonical-map:check` is wired into `npm run verify`.
- Alternatives rejected: did not normalize away claim packet hashes or commit ids because the canonical map generator does not add volatile timestamps and the input metadata should remain part of the stale-output contract.
- Targeted verification: `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/build-canonical-claim-map.test.mjs scripts/run-verify.test.mjs`; `npm run claims:canonical-map:check`; `npm run generated:drift:check`; `npm run lint:eslint`; `git diff --check`.
- Test duplication pressure: focused CLI tests cover missing, clean, and stale states; final `npm run verify` will re-run the phase through the bundled gate.
- Critique: parent-delegated fresh-eye review from agent `019f46d1-ad4c-7430-8c1e-b80b1e0fa8de`; verdict OK, no findings.
- Off-goal findings: none.
- Lessons carried forward: generated proof projections should expose check mode at the producer boundary before downstream reports consume them.
- Metrics: not measured.

## Context Sources

Durable references this goal was shaped from. A fresh session can reconstruct
the originating context by following them in order.

- User request: "자율 개선 싸이클 5회 돌아보새요"
- `AGENTS.md`
- `README.md`
- `docs/master-plan.md`
- `CLAUDE.md`

## Interview Decisions

For each Before-phase question: family of options considered, chosen value, and
rejected-alternatives reason. Applies the anti-anchoring lesson to the artifact
itself so a fresh session sees the design space, not only the closed point.

- Cycle count: chose exactly five cycles because the user requested five.
- Scope: chose local product-boundary improvements because external side effects were not requested.
- Slice size: chose small committed slices over one large branch to preserve reviewability and repo commit discipline.
- Proof level: chose focused checks per cycle plus final `verify`/`hooks:check`.
  Live proof is a non-goal for this local run.

## Plan Critique Findings

Blockers folded into Boundaries/Verification/Slice Plan, over-worry raised but
not folded, and reviewer provenance. Preserves reasoning so a fresh session
re-verifies the folded revisions without re-running critique.

- Folded: broad autonomous scope is bounded to local-only changes and exactly five cycles.
- Folded: each cycle must produce either a scoped commit or an explicit committed no-op/defer artifact.
- Over-worry: requiring live/product-runner proof for every local guard improvement would stall the requested improvement cadence.

## Off-Goal Findings

Issues or deferred findings discovered during the run.

## Final Verification

Closeout evidence — replace each `TODO` with a bound `<path>` (a checked-in
retro / host-log probe / disposition-review artifact) or an explicit
`skipped: <allowed-reason>: <detail>`. The complete gate rejects a literal
`TODO` / `<path>` / `TBD` until you do.

Retro: TODO — create or explicitly skip with an allowed reason before complete
Host log probe: TODO — create or explicitly skip with an allowed reason before complete
Disposition review: TODO — create or explicitly skip only when policy allows before complete

## User Verification Instructions

## Auto-Retro

Retro dispositions: TODO — disposition every surfaced improvement, or record the explicit no-improvement opt-out
Structural follow-up: TODO — when the retro names a transferable waste item (a `## Sibling Search` trigger), classify its structural destination (`applied: <gate/hook/validator/test/contract change>` / `issue #N (recurs:|novel: <reason>)` / `repo-local guard: <path>` / `none — <reason>`); delete this line when no transferable waste was named
