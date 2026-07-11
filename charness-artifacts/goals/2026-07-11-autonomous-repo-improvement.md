# Achieve Goal: Autonomously improve Cautilus through one evidence-backed slice

Status: active
Created: 2026-07-11
Activation: `/goal @charness-artifacts/goals/2026-07-11-autonomous-repo-improvement.md`

This file is the living goal scratchpad.
The user's explicit request to plan and proceed authorizes local implementation after this goal is shaped.

## Active Operating Frame

- Current slice: make the existing quality runtime signal and next-session handoff current by default.
- Current slice intent: route durable quality runs through the existing `verify:runtime` target while preserving `--read-only` semantics, then replace the stale release-era handoff with a compact current baton.
- Next action: implement the quality-runner routing change with focused tests, then refresh the handoff through its owning workflow.
- Verification cadence: focused Go tests during iteration, then `npm run verify` and `npm run hooks:check` at closeout.
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

- Skipped by design because this slice protects deterministic packet assembly and rendering behavior, not provider behavior.

## Slice Plan

| Slice | Objective | Why Now | Expected Evidence | Status |
| --- | --- | --- | --- | --- |
| 1 | Inventory current quality signals and select one bounded seam | Avoid speculative roadmap work | quality planner, standing gate, runtime and coverage evidence | completed |
| 2 | Connect durable quality runs to existing runtime measurement | Current runtime signals are stale even though `verify:runtime` already exists | focused runner test and refreshed runtime packet | pending |
| 3 | Refresh the next-session handoff against canonical current state | The handoff still narrates v0.18.0 while v0.19.1 is publicly proven | compact current baton with canonical pointers | pending |
| 4 | Run broad verification, record review, retro, and commit | Close with auditable proof and no uncommitted meaningful work | verify, hooks, artifact validation, scoped commits | pending |

## Operator Decision Queue

none — the user authorized autonomous local improvement and explicitly excluded push as a requirement.

## Coordination Cues

- Routing: find-skills -> achieve + quality + impl + retro — the run needs an auditable goal, evidence-based seam selection, a focused implementation slice, and closeout reflection.
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
Chosen: one evidence-backed local slice because the handoff forbids automatic dormant-track activation and the current gates expose a concrete review-boundary confidence gap.
Rejected alternatives: dormant tracks need product demand, while a broad sweep would create low-yield churn after recent autonomous cycles.
- Proof family: local deterministic checks vs evaluator/live/provider proof.
Chosen: local deterministic checks because the selected packet construction and rendering seam is code-owned and testable without an external provider.
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

Retro: TODO — create or explicitly skip with an allowed reason before complete
Host log probe: TODO — create or explicitly skip with an allowed reason before complete
Disposition review: TODO — create or explicitly skip only when policy allows before complete

## User Verification Instructions

Pending until the focused test and final verification commands are complete.

## Auto-Retro

Retro dispositions: TODO — disposition every surfaced improvement, or record the explicit no-improvement opt-out
Structural follow-up: TODO — classify any transferable waste found during closeout, or delete this line when none is found
