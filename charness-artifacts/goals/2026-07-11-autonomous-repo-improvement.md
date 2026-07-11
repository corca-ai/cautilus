# Achieve Goal: Autonomously improve Cautilus through one evidence-backed slice

Status: complete
Created: 2026-07-11
Activation: `/goal @charness-artifacts/goals/2026-07-11-autonomous-repo-improvement.md`

This file is the living goal scratchpad.
The user's explicit request to plan and proceed authorizes local implementation after this goal is shaped.

## Active Operating Frame

- Current slice: completed local closeout.
- Current slice intent: preserve the final evidence and keep the completed goal synchronized with the next-session baton.
- Next action: none — commit the already-verified closeout bundle without push.
- Verification cadence: focused Node tests during iteration, then `npm run verify` and `npm run hooks:check` at closeout.
- Gate cadence: one narrow local slice followed by the final broad verification lock.
- Slice review packet: the delegated quality reviewer receives the current intent, selected boundary, existing gate evidence, non-claims, and out-of-scope product tracks.
- History boundary: keep this frame current and move completed detail to the Slice Log and Final Verification sections.

## Goal

Improve Cautilus's operator diagnosability by keeping its existing quality runtime signal and next-session baton current through the normal durable workflow.
Reuse shipped measurement and source-of-truth surfaces instead of adding another gate or history copy.

## Non-Goals

- Do not open a dormant roadmap track or add speculative review features.
- Do not change the public packet schema or CLI contract.
- Do not add a new quality gate when the existing Go test and coverage surfaces can own the proof.
- Do not push, publish, tag, or run remote CI.
- Do not claim live evaluator or provider proof from local deterministic checks.

## Boundaries

- The implementation target is `scripts/run-quality.sh`, its focused test, and the volatile `docs/internal/handoff.md` baton.
- Preserve `--read-only` as a non-durable path; only the normal durable quality run should refresh ignored runtime signals.
- Preserve the generic product boundary and avoid host-specific fixtures, prompts, paths, or policy.
- External side-effect scope: none; all work and verification remain local.

## User Acceptance

The user can inspect scoped commits that make a normal quality run refresh runtime evidence and make the handoff point at current canonical state.

## Agent Verification Plan

### Low-Cost Checks

- Run `node --test scripts/run-quality.test.mjs` while iterating.
- Use the fake npm log fixture to prove `--read-only` still calls `verify` and the durable default calls `verify:runtime` before dogfood.
- Compare handoff release/status references with `package.json`, `charness-artifacts/release/latest.md`, and the active goal.

### High-Confidence Checks

- Run `npm run verify`.
- Run `npm run hooks:check`.
- Validate the completed goal and quality artifacts with their owning helpers.

### External Or Live Proof

- Skipped by design because this slice changes deterministic quality orchestration and operator state, not provider behavior.

## Slice Plan

| Slice | Objective | Why Now | Expected Evidence | Status |
| --- | --- | --- | --- | --- |
| 1 | Inventory current quality signals and select one bounded seam | Avoid speculative roadmap work | quality planner, standing gate, runtime and coverage evidence | completed |
| 2 | Connect durable quality runs to existing runtime measurement | Current runtime signals are stale even though `verify:runtime` already exists | focused runner test and refreshed runtime packet | completed |
| 3 | Refresh the next-session handoff against canonical current state | The handoff still narrates v0.18.0 while v0.19.1 is publicly proven | compact current baton with canonical pointers | completed |
| 4 | Run broad verification, record review, retro, and commit | Close with auditable proof and no uncommitted meaningful work | verify, hooks, artifact validation, scoped commits | completed |

## Operator Decision Queue

none — the user authorized autonomous local improvement and explicitly excluded push as a requirement.

## Coordination Cues

- Routing: find-skills -> achieve + quality + impl + debug + handoff + retro — the run needs an auditable goal, evidence-based seam selection, focused implementation, validator-path diagnosis, baton refresh, and closeout reflection.
- Gather: n/a — no external source is used.
- Release: n/a — no release surface is changed.
- Issue closeout: n/a — this goal does not resolve a tracked issue.

## Discuss Before Activation

- Discuss before activation: resolved — the user's request authorizes local planning and implementation; push, release, remote CI, and live/provider proof remain explicitly out of scope.

## Slice Log

### Slice 1: Refresh durable quality timing

- Objective: Route normal durable quality runs through the existing runtime-signal target while preserving read-only semantics
- Why this approach:
- Commits:
- What changed:
- Alternatives rejected:
- Targeted verification: node --test scripts/run-quality.test.mjs passed; npm run verify:runtime passed all phases in 33.25s and updated runtime-signals.json at 2026-07-11T09:25:53.078Z
- Test duplication pressure: one existing runner fixture assertion changed and no new test body was added; structural-waste inventory reported zero findings
- Critique:
- Off-goal findings:
- Lessons carried forward:
- Metrics:

### Slice 2: Refresh the next-session baton

- Objective: Replace stale v0.18.0 history with current canonical release, goal, quality-runner, and no-auto-track pointers
- Why this approach:
- Commits:
- What changed:
- Alternatives rejected:
- Targeted verification: handoff planner classified the old artifact as shape_issue; material fresh-eye review found no blocker and required atomic synchronization with goal completion
- Test duplication pressure:
- Critique:
- Off-goal findings:
- Lessons carried forward:
- Metrics:

### Slice 3: Close quality and debug evidence

- Objective: Persist quality judgment, validator-path RCA, delegated review, and session retro before final verification
- Why this approach:
- Commits:
- What changed:
- Alternatives rejected:
- Targeted verification: quality, debug, and retro artifact validators passed; final reviewer-boundary fingerprint reported no drift
- Test duplication pressure:
- Critique:
- Off-goal findings:
- Lessons carried forward:
- Metrics:

## Context Sources

- User request: autonomously plan and improve this repository; push is not required.
- `AGENTS.md`
- `README.md`
- `docs/master-plan.md`
- `CLAUDE.md`
- `docs/internal/handoff.md`
- `charness-artifacts/find-skills/latest.md`
- `/tmp/cautilus-quality-readonly.log`
- `/tmp/cautilus-runtime-summary.json`

## Interview Decisions

- Mode family: artifact-only planning vs implementation continuation.
Chosen: implementation continuation because the user explicitly asked to plan and proceed.
Rejected alternative: stopping after a plan would not satisfy the execution request.
- Scope family: dormant roadmap track vs broad speculative sweep vs one evidence-backed local slice.
Chosen: one evidence-backed local slice because the handoff forbids automatic dormant-track activation and current operator evidence was stale.
Rejected alternatives: dormant tracks need product demand, while a broad sweep would create low-yield churn after recent autonomous cycles.
- Proof family: local deterministic checks vs evaluator/live/provider proof.
Chosen: local deterministic checks because the selected quality orchestration and handoff seams are code-owned and testable without an external provider.
Rejected alternative: evaluator proof would add cost without being able to improve confidence in this deterministic boundary.
- Axis probe: repository and runtime are single-point for this slice because the code path is the generic Cautilus runtime; host/provider/environment values are deliberately not embedded in the tests.

## Plan Critique Findings

- Same-agent preflight: the quality gate is green, so this slice must improve evidence freshness and operator orientation rather than claim to repair a product regression.
- Delegated fresh-eye quality review found the stale handoff as the highest-priority low-risk fix and the unconnected `verify:runtime` path as the next operator-diagnosability seam.
- The first reviewer-boundary fingerprint was inconclusive because the parent modified this goal artifact while the reviewer was running; a clean bounded review will be repeated after implementation before closeout.
- Over-worry not folded: the Cautilus Agent ergonomic inventory reports long-core and reference-discoverability heuristics, but the source and packaged copies are parity-gated and changing behavior-steering prose would require separate dogfood intent proof.

## Off-Goal Findings

- The initially selected `internal/runtime/review.go` coverage seam remains a valid later test-confidence candidate, but it is lower priority than correcting current operator state.
- The installed `find-skills` inventory refresh produced timestamp and reference-order churn; this is a Charness producer concern, not a Cautilus product-code fix for this slice.

## Final Verification

Retro: charness-artifacts/retro/2026-07-11-session-retro.md
Host log probe: skipped: host-log-not-exposed: this host did not expose a scoped immutable session log, and no token or provider-efficiency claim depends on one.
Disposition review: charness-artifacts/critique/2026-07-11-autonomous-repo-improvement-disposition-review.md

- Self-verification: the default durable quality runner calls `verify:runtime` before self-dogfood, while `--read-only` still calls plain `verify` and skips durable dogfood.
- Runtime proof: `npm run verify:runtime` passed all phases in 33.25s and refreshed the structured signal at `2026-07-11T09:25:53.078Z`.
- Focused proof: `node --test scripts/run-quality.test.mjs` passed all three runner-contract cases after the review nit was folded into the test name.
- Final broad proof: `npm run verify` passed all phases in 32.93s with the complete staged artifact set, and `npm run hooks:check` returned `ready`.
- Artifact proof: quality, debug, and retro validators passed through their scaffold-emitted commands.
- Delegated proof: the final reviewer reported no blocker, one should-fix folded into closeout, and `owned-correctly` boundary ownership; the reviewer-boundary fingerprint verified no drift.
- Closeout state: `impl-local`; no push, remote CI, release, instance sync, live provider proof, or issue closeout was run or claimed.
- Residual risk: claim evidence warnings and low review-runtime coverage remain advisory follow-up candidates recorded in the quality artifact.
- Non-claim: this slice improves evidence freshness and operator orientation; it does not change Cautilus evaluation behavior, packet schemas, or public CLI capability.

## User Verification Instructions

- Run `node --test scripts/run-quality.test.mjs` to inspect the read-only and durable routing contract.
- Run `npm run verify:runtime`, then inspect `.charness/quality/runtime-signals.json` for a current `updated_at` value.
- Read `docs/internal/handoff.md` and confirm it points to canonical release, goal, roadmap, and quality-runner owners without replaying v0.18.0 history.
- Inspect commits `d73f75c9` and the final closeout commit; no push or release is required.

## Auto-Retro

Retro dispositions: applied: connected durable quality runs to `verify:runtime`; applied: refreshed the handoff against canonical owners; applied: consumed scaffold-emitted validator commands and preserved the invariant in the validated debug artifact.
Structural follow-up: repo-local guard: charness-artifacts/debug/latest.md
