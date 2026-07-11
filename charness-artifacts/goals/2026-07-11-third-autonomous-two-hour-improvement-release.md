# Achieve Goal: Two-hour autonomous Cautilus improvement and release

Status: active
Created: 2026-07-11
Activation: `/goal @charness-artifacts/goals/2026-07-11-third-autonomous-two-hour-improvement-release.md`

This file is the living goal scratchpad.
The user's explicit two-hour implementation, push, and release request activates pursuit after the shaped-goal gate passes.

Timebox: 2h
Activation time: 2026-07-11T19:03:45+09:00
Closeout reserve: 20m
Done-early policy: continue_next_improvement

## Active Operating Frame

- Current slice: measured Node standing-test isolation economics and the next structural quality seam.
- Current slice intent: compare the current per-file isolation cost with an explicit shared-process experiment without weakening the standing bar or changing it unless the full suite remains deterministic.
- Next action: commit the reviewed fail-closed prompt slice, read the testability guidance, and run repeated current-versus-shared-process measurements before deciding.
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

Use the two-hour budget to land multiple evidence-backed Cautilus improvements across correctness, test/runtime economics, and code quality, then verify the bundled state, prepare the next compatible release, push it, and verify the public release surfaces.

## Non-Goals

- Do not start dormant roadmap work without current dogfood or consumer evidence.
- Do not weaken deterministic, held-out, comparison, review, security, or release proof to reduce runtime.
- Do not add coverage-only tests, speculative abstractions, or host-specific behavior to the generic product boundary.
- Do not publish intermediate slices; use local commits and one final release lane unless remote proof is required earlier.

## Boundaries

- External side-effect scope: name which phase or bundle any approved
  publish / push / remote-CI / apply applies to. That approval is phase-scoped
  and does not carry forward — after an approved publish/CI/apply lane
  completes, done-early test-only quality continuation is local by default
  (batch remote proof, run CI once over the final bundled state). Per-slice
  remote publication is assumed only when the operator explicitly asks or a
  runtime-affecting slice requires earlier publication.
- The user approved final-bundle commit, push, tag, GitHub release, and public release verification for this goal.
- Release version selection follows the checked-in release contract and semantic compatibility; no manual version is assumed before inventory.
- Bug fixes require a falsifiable reproduction and `charness:debug` before repair.
- Test-speed changes require measured current evidence and an explicit proof-preservation argument.
- Directional product changes must remain aligned with AGENTS.md, README, master-plan, and CLAUDE.md; conflicting direction stops for user confirmation.

## User Acceptance

The user can inspect scoped commits spanning more than one quality dimension, rerun focused and broad gates, observe a clean pushed branch, and install or inspect the verified release through the repository-owned release surfaces.

## Agent Verification Plan

### Low-Cost Checks

- Run the quality planner and focused inventories before selecting slices.
- Reproduce bugs with minimal fixtures or commands before repair.
- Use focused Go/Node tests, lint, and runtime subphase measurements at commit boundaries.
- Sample duplicate and structural pressure whenever tests expand.

### High-Confidence Checks

- Run `npm run verify`, `npm run hooks:check`, and applicable on-demand or release-preflight gates over the final bundle.
- Run bounded fresh-eye review over selected implementation slices and the release bundle.
- Validate goal, debug, quality, critique, retro, handoff, and release artifacts with their emitted validators.

### External Or Live Proof

- Push the final bundled branch, prepare and publish the next repository-owned release, and verify GitHub/tag/install/readback surfaces through `charness:release`.
- Remote CI and release verification prove only the published bundle and declared install surface; they do not imply live evaluator/provider behavior unless such proof is separately run.

## Slice Plan

| Slice | Objective | Why Now | Expected Evidence | Status |
| --- | --- | --- | --- | --- |
| 1 | Inventory current correctness, runtime, maintainability, and release-readiness candidates | Avoid memory-anchored churn and select from current evidence | quality plan, runtime/gate packets, fresh-eye triage | completed |
| 2 | Preserve multilingual claim-review excerpt fidelity | A byte/code-point mismatch was reproducible at a packet boundary | debug artifact, focused regression tests, scoped commit | completed |
| 3 | Fail closed when a declared consumer prompt cannot be read | A reviewer reproduced silent loss of behavior-steering input in both renderers | cross-language failure tests, parity review, scoped commit | completed |
| 4 | Continue with the next safe evidence-backed improvement until the closeout reserve | Honor the two-hour done-early policy | candidate ledger, slice proof, scoped commits | pending |
| 5 | Final quality review, release preparation, push, publication, and public verification | Ship one coherent verified bundle | broad gates, release artifact, tag/release/install readback | pending |

## Operator Decision Queue

none — the user approved the final push and release lane, and no credential or product-direction decision is currently unresolved.

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

- Routing: find-skills -> achieve + quality + impl + debug when triggered + critique + retro + release — the run needs timeboxed lifecycle, evidence selection, bounded implementation, disciplined diagnosis, fresh-eye review, reflection, and publication proof.
- Gather: n/a — no external source is required to select or implement the initial local slices.
- Issue closeout: n/a — no tracked GitHub issue is currently the source of this goal.

## Discuss Before Activation

A Before-phase summary of any consequential activation decision — surfaced from
the Non-Goals / Boundaries / Verification / Interview / Critique sections — that
must be resolved before `/goal`. Required only when a trigger fires (live/prod
proof, issue close/split, broad scope, irreversible side effect, or a
proof-level non-claim); replace the `fill` line below, or delete it when none
applies.

- Discuss before activation: resolved — the user explicitly approved a broad two-hour local improvement bundle followed by final push and release; intermediate publication, proof weakening, speculative roadmap expansion, and unproven live-evaluator claims remain excluded.

## Slice Log

### Slice 1: Inventory and triage lock

- Objective: Measure current correctness, runtime-economics, maintainability, and release-readiness signals before selecting changes.
- Why this approach: The user requested several dimensions, so current evidence needed to outrank prior-memory candidates.
- Commits: none — evidence selection only.
- What changed: Activated the timeboxed goal and refreshed debug/quality evidence; no product code in this inventory slice.
- Alternatives rejected: Rejected speculative specdown optimization, percentage-driven report-input tests, skill-heuristic churn, and unclassified claim-warning policy changes.
- Targeted verification: Read-only quality passed in 32.95s; runtime, structural, dual-implementation, lint-ignore, dead-code, CLI, and skill inventories ran; delegated quality review produced a fix-now/defer/reject triage lock.
- Test duplication pressure: No tests added in the inventory slice; structural inventory reported zero findings.
- Critique: Parent-delegated high-leverage reviewer identified fail-open consumer prompt reads as P0 and confirmed no proof-preserving specdown optimization seam.
- Off-goal findings: Installed Charness fingerprint reference used an authoring-repo path; Cautilus uses the installed helper workaround and records the upstream-owned defect in a dated debug artifact.
- Lessons carried forward: Treat runtime budgets and heuristic inventories as selection evidence, not automatic implementation mandates.
- Metrics: lint/specs 16.08s latest and 15.98s median; final read-only quality 32.95s; claim evidence audit retains 47 warnings.

### Slice 2: Unicode-safe claim review excerpts

- Objective: Preserve multilingual source excerpts at the exact code-point boundary in claim-review packets.
- Why this approach: The chars budget used byte slicing and a focused reproduction returned invalid UTF-8.
- Commits: the scoped correctness commit containing this slice.
- What changed: Claim source-ref excerpts now truncate by Go runes; a regression test pins valid UTF-8, exact prefix selection, and JSON roundtrip fidelity.
- Alternatives rejected: Rejected byte relabeling and grapheme/token/byte contract expansion as incompatible or out of scope.
- Targeted verification: Focused test failed on old code with a\\xea, then focused and full internal/runtime tests passed after repair; debug validator and structural inventory were exercised.
- Test duplication pressure: One focused test added to the owning existing test file; structural inventory reported zero findings and no new runner surface.
- Critique: Clean parent-delegated follow-up review found code/test ready; two artifact wording concerns were corrected; reviewer boundary verify returned ok with no drift.
- Off-goal findings: none.
- Lessons carried forward: Every field named chars at a packet boundary must be checked against Go byte slicing, even when nearby text paths were already repaired.
- Metrics: One production branch changed and one focused regression test added; package test completed in 1.40s.

### Slice 3: Fail closed on declared consumer prompt read errors

- Objective: Preserve declared behavior-steering consumer prompt input or surface a path-bearing failure across Go and Node renderers.
- Why this approach: Both implementations silently omitted a captured-present prompt after a file read failure, so evaluator input could shrink without diagnosis.
- Commits: the scoped correctness commit containing this slice.
- What changed: Go now returns wrapped consumer-prompt read errors; Node throws a matching path-bearing error; both retain optional omission for absent, exists-false, and readable-empty states.
- Alternatives rejected: Rejected silent fallback, CLI-specific policy, and full OS-error snapshot parity.
- Targeted verification: Old-code stale-record tests failed in both languages; focused and full runtime tests, eight Node flow tests with subtests, eslint, debug validator, structural inventory, and diff checks passed after repair.
- Test duplication pressure: One Go failure test plus one three-case omission table, and one Node failure test plus three omission subtests were added to existing files; structural inventory reported zero findings.
- Critique: Clean parent-delegated review found two state-contract proof gaps and one wording overclaim; both were fixed, final verdict READY, and reviewer-boundary verify reported no drift.
- Off-goal findings: none.
- Lessons carried forward: Optional capture state must remain distinct from a declared dependency that later becomes unreadable; renderer parity includes failure semantics, not only successful output.
- Metrics: Go package test 0.94s; Node review flow 11 assertions in 0.12s; no provider call.

## Context Sources

- User request: two hours of autonomous improvement across bugs, test speed, and code quality, followed by push and release.
- `AGENTS.md`, `README.md`, `docs/master-plan.md`, and `CLAUDE.md`.
- `docs/internal/handoff.md` and `charness-artifacts/quality/latest.md`.
- `charness-artifacts/goals/2026-07-11-second-autonomous-repo-improvement.md` and its retro.
- `charness-artifacts/release/latest.md` for the current published boundary.

## Interview Decisions

- Mode family: artifact-only versus implementation continuation.
  Chosen: implementation continuation because the user explicitly requested two hours of work and publication.
  Rejected: stopping at a plan would not satisfy the request.
- Time family: macro completion versus fixed timebox.
  Chosen: two-hour timebox with a 20-minute closeout reserve and continue-next-improvement policy.
  Rejected: closing after the first successful slice would underuse the explicit budget.
- Publication family: per-slice remote proof versus final-bundle release.
  Chosen: local scoped commits and one final release lane to reduce remote churn.
  Rejected: repeated pushes and tags would fragment proof without improving safety.
- Version family: preselected number versus contract-derived next version.
  Chosen: derive the version from actual changes and release tooling after inventory.
  Rejected: anchoring on a version before knowing compatibility risk.
- Axis probe: runtime and platform are known axes for timing and install proof; release version is a single repository sequence, while provider/live-evaluator behavior remains a separate axis and non-claim unless run.

## Plan Critique Findings

- Same-agent preflight: a two-hour mandate can invite scope drift, so every implementation slice must enter through a measured triage lock and preserve explicit non-claims.
- Same-agent preflight: publication is authorized only for the final bundled state; release readiness is not inferred from passing unit tests.
- Required delegated quality review will challenge correctness, runtime-economics, maintainability, and release-risk priorities before recommendations lock in.
- Over-worry not folded: touching all three named dimensions with code changes is not mandatory when one dimension lacks a safe seam; measured deferral counts only as analysis, not improvement.

## Off-Goal Findings

none at activation.

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
