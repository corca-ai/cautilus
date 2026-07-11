# Achieve Goal: Second autonomous Cautilus improvement sweep

Status: active
Created: 2026-07-11
Activation: `/goal @charness-artifacts/goals/2026-07-11-second-autonomous-repo-improvement.md`

This file is the living goal scratchpad.
The user's explicit request to improve the repository again authorizes local implementation after shaping.

## Active Operating Frame

- Current slice: Unicode review-boundary slice ready to commit.
- Current slice intent: preserve code-point-safe Go/Node producers, focused scenario-to-render proof, and the completed review dispositions.
- Next action: run focused lint/test gates and commit the implementation slice.
- Verification cadence: focused checks at commit boundaries, broader quality proof at slice boundaries, and `npm run verify` plus `npm run hooks:check` at closeout.
- Gate cadence: reuse existing gates; add no heuristic floor without a low-noise invariant and structural response.
- Slice review packet: each substantial change gets intent, changed files, invariants, proof, non-claims, and out-of-scope lines.
- History boundary: keep this frame current and archive completed work in the Slice Log.

## Goal

Improve Cautilus again through multiple evidence-backed local slices spanning at least two of bug correctness, test/runtime economics, and code/test quality.
Prefer structural simplification, focused failure-path proof, and existing-gate reuse over speculative features or metric chasing.

## Non-Goals

- Do not start dormant roadmap features without consumer or dogfood demand.
- Do not refactor solely to reduce line count, clone count, or raise aggregate coverage.
- Do not weaken deterministic, held-out, comparison, or review proof to gain speed.
- Do not change public schemas or CLI behavior unless a reproduced bug requires it.
- Do not push, publish, release, or claim live/provider proof.

## Boundaries

- Bug fixes require a falsifiable reproduction and `charness:debug` before repair.
- Test-speed changes require current measured evidence and an explicit coverage tradeoff.
- Code-quality changes must name the user/operator capability they strengthen and use the smallest owning surface.
- Preserve Cautilus as a generic CLI plus Cautilus Agent product; no host-specific runtime or fixture knowledge enters the product boundary.
- External side-effect scope: none; all work, review, and proof stay local.

## User Acceptance

The user can inspect small scoped commits from distinct improvement dimensions, rerun focused tests for each seam, and run the standing verification commands with no push required.

## Agent Verification Plan

### Low-Cost Checks

- Run the quality planner and advisory inventories before selecting changes.
- Reproduce suspected bugs with the smallest focused command or fixture.
- Use focused Node or Go tests and runtime measurements during implementation.
- Sample structural/test duplication pressure when tests are added.

### High-Confidence Checks

- Run `npm run verify`.
- Run `npm run hooks:check`.
- Validate goal, quality, debug, critique, and retro artifacts through scaffold-emitted commands.

### External Or Live Proof

- Not planned because this goal selects local deterministic and operator-workflow seams.
- If a selected finding needs evaluator or live proof, defer it honestly instead of downgrading the proof claim.

## Slice Plan

| Slice | Objective | Why Now | Expected Evidence | Status |
| --- | --- | --- | --- | --- |
| 1 | Inventory bug, speed, and quality candidates | Select from current evidence instead of prior-memory ranking | quality plan, runtime summary, focused advisories, fresh-eye recommendation | completed |
| 2 | Fix Unicode review excerpt correctness and strengthen scenario-to-render confidence | Correctness and observable behavior proof share one packet boundary | debug artifact, focused Go/Node regression tests, scoped commit | completed |
| 3 | Fold cross-language parity review and prove exact boundaries | Prevent a local fix from leaving sibling semantic drift | lone-surrogate, exact-limit, and prefix-selection tests | completed |
| 4 | Run final verification, review, retro, and atomic handoff closeout | Make the result auditable and resumable | broad gates, artifact validators, clean commits | pending |

## Operator Decision Queue

none — the user authorized autonomous local improvement and no external side effect is required.

## Coordination Cues

- Routing: find-skills -> achieve + quality + impl + debug when triggered + retro — the run needs goal lifecycle, evidence selection, implementation, disciplined bug diagnosis, and closeout reflection.
- Gather: n/a — no external source is currently in scope.
- Release: n/a — no release surface is in scope.
- Issue closeout: n/a — no tracked issue is being resolved.

## Discuss Before Activation

- Discuss before activation: resolved — the user requested another broad autonomous local improvement pass; implementation is limited to bounded evidence-backed slices, while push, release, dormant product tracks, and live/provider proof remain out of scope.

## Slice Log

### Slice 1: Inventory bug, speed, and quality candidates

- Objective: Compare current correctness, runtime-economics, and maintainability signals before selecting implementation work.
- Why this approach: The user requested multiple perspectives and the prior quality artifact was candidate memory rather than current proof.
- Commits: none — evidence-only selection slice.
- What changed: no product files; the goal and debug memory became the active audit surfaces.
- Alternatives rejected: specdown optimization lacked a repo-owned seam that preserved full run and trace proof; claim-evidence warnings were broader warning-policy debt without a bounded repair.
- Targeted verification: read-only quality passed in 32.97s; runtime summary identified stable `lint · specs` dominance; structural, brittle-source, dual-implementation, and CLI inventories found no direct cleanup candidate.
- Test duplication pressure: none — no test was added in the inventory slice.
- Critique: parent-delegated quality reviewer recommended Unicode correctness first, scenario-to-render confidence second, and runtime optimization deferral.
- Off-goal findings: claim evidence audit retains 47 warnings and remains advisory.
- Lessons carried forward: optimize only where the repo owns the duplicate work or proof-preserving seam.
- Metrics: `lint · specs` 16.08s latest / 15.98s median; specdown 13.59s and trace 2.29s.

### Slice 2: Make review excerpts Unicode-safe

- Objective: Fix cross-language review excerpt truncation and add focused scenario-to-render confidence
- Why this approach:
- Commits:
- What changed:
- Alternatives rejected:
- Targeted verification: Go focused tests and Node review-prompt-flow tests passed; Go review scenario/render paths rose from 0% to 73.3%/85.4% in focused coverage; structural-waste inventory found zero findings
- Test duplication pressure: three Go table cases, one Go scenario-to-render test, and one Node Unicode case; no broad discovery or duplicated stable-file reads reported
- Critique:
- Off-goal findings:
- Lessons carried forward:
- Metrics:

### Slice 3: Close Unicode parity review

- Objective: Normalize lone surrogates and prove exact-limit and prefix-selection behavior across Go and Node
- Why this approach:
- Commits:
- What changed:
- Alternatives rejected:
- Targeted verification: Focused Go tests and six Node review-prompt-flow tests passed after should-fix changes
- Test duplication pressure: extended existing boundary fixtures only; no new broad runner or stable-file duplication
- Critique:
- Off-goal findings:
- Lessons carried forward:
- Metrics:

## Context Sources

- User request: improve the repository autonomously again across bugs, test speed, and code quality.
- `AGENTS.md`
- `README.md`
- `docs/master-plan.md`
- `CLAUDE.md`
- `docs/internal/handoff.md`
- `charness-artifacts/quality/latest.md`
- `charness-artifacts/goals/2026-07-11-autonomous-repo-improvement.md`
- `charness-artifacts/retro/2026-07-11-session-retro.md`

## Interview Decisions

- Mode family: artifact-only vs implementation continuation.
  Chosen: implementation continuation because the user explicitly asked for another autonomous improvement run.
  Rejected: stopping after planning would not satisfy the request.
- Scope family: one preselected coverage task vs dormant roadmap work vs evidence-ranked multi-dimensional slices.
  Chosen: evidence-ranked slices across at least two dimensions because the user named bugs, speed, and quality as desired perspectives.
  Rejected: a single remembered candidate could anchor prematurely; roadmap work lacks new demand evidence.
- Proof family: deterministic local proof vs evaluator/live proof.
  Chosen: deterministic local proof by default; the selected candidates are repository code and test-economics seams.
  Rejected: live proof cannot strengthen a deterministic parser, runner, or test-selection claim.
- Axis probe: runtime and platform remain axes where measurements may vary, so performance claims must cite this machine and current samples; product contracts remain provider-neutral.

## Plan Critique Findings

- Same-agent preflight: a broad request can produce low-value churn, so every implementation slice must beat a concrete alternative using current evidence.
- Same-agent preflight: previous quality findings are candidate memory, not automatic priority; remeasure before acting.
- Required delegated quality review will use distinct correctness, runtime-economics, and maintainability lenses before recommendations lock in.
- Over-worry not folded: finishing all three dimensions is not mandatory if one lacks honest evidence; the goal requires at least two dimensions and explicit deferral of weak candidates.

## Off-Goal Findings

none at activation.

## Final Verification

Retro: TODO — create or explicitly skip with an allowed reason before complete
Host log probe: TODO — create or explicitly skip with an allowed reason before complete
Disposition review: TODO — create or explicitly skip only when policy allows before complete

## User Verification Instructions

Pending until selected slices and final proof complete.

## Auto-Retro

Retro dispositions: TODO — disposition every surfaced improvement before complete
Structural follow-up: TODO — classify transferable waste if the retro names any
