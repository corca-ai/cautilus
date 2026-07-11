# Achieve Goal: Fourth autonomous two-hour Cautilus improvement

Status: active
Created: 2026-07-11
Activation: `/goal @charness-artifacts/goals/2026-07-11-fourth-autonomous-two-hour-improvement.md`
Timebox: 2h
Activation time: 2026-07-11T20:35:47+09:00
Closeout reserve: 20m
Done-early policy: continue_next_improvement

This file is the living goal scratchpad.
The user's explicit two-hour autonomous implementation request activates pursuit after the shaped-goal gate passes.

## Active Operating Frame

- Current slice: reproduced mutation in the adjacent deployment-evidence input preparer.
- Current slice intent: preserve the completed builder fix as a scoped commit, then diagnose the sibling independently before deciding its full option surface.
- Next action: commit the reviewed builder slice, archive its debug record, and open a new debug investigation for `prepare-deployment-evidence-input`.
- Verification cadence: cheap deterministic checks at commit boundaries; higher-cost or fresh-eye proof at slice boundaries; final broad proof at closeout.
- Gate cadence: pre-lock slices use focused owner tests and structural pressure checks; final proof uses `npm run verify` and `npm run hooks:check`.
- Slice review packet: before fresh-eye slice critique, provide intent, changed files and owning/generated surfaces, expected invariants, tests/proof, non-claims, out-of-scope lines, and reviewer questions.
- History boundary: keep this frame current; move completed detail to `## Slice Log`, `## Operator Decision Queue`, `## Final Verification`, and `## Auto-Retro`.

## Goal

Use the two-hour budget to land multiple current-evidence improvements across correctness, test/runtime economics, and code quality, with scoped local commits and honest verification.

## Non-Goals

- Do not push, tag, publish, open issues, or mutate external systems without a separate user instruction.
- Do not reopen dormant roadmap capabilities, claim-warning policy, public release-note redesign, or dominant specdown optimization without new current evidence.
- Do not weaken isolation, deterministic proof, coverage, security, or release gates to make timings look better.
- Do not add coverage-only tests, speculative abstractions, or generic parser frameworks without a reproduced consumer boundary.

## Boundaries

- Work stays local to the Cautilus repository; meaningful slices are committed but not pushed.
- Bug fixes require a falsifiable reproduction and `charness:debug` before repair.
- Test-speed changes require before/after measurements and proof that cases, isolation, and failure oracles remain intact.
- Directional changes remain aligned with AGENTS.md, README, master-plan, and CLAUDE.md; a conflict stops for user confirmation.
- Provider/live evaluator behavior is outside this deterministic quality pass unless a selected defect actually crosses that boundary.

## User Acceptance

The user can inspect multiple scoped local commits, rerun focused owner tests and broad gates, and see explicit Weak/Missing/Deferred findings without any unrequested remote publication.

## Agent Verification Plan

### Low-Cost Checks

- Run the quality planner, runtime summary, structural/test-economics inventories, and focused candidate reproductions.
- Use owner-package Go tests, Node process tests, eslint, artifact validators, and duplicate-pressure checks at slice boundaries.

### High-Confidence Checks

- Run bounded fresh-eye review for selected implementation slices and final disposition.
- Run `npm run verify`, `npm run hooks:check`, and applicable on-demand checks over the final local bundle.

### External Or Live Proof

- None planned; push, release, remote CI, provider, and native multi-host proof are explicit non-claims for this local run.

## Slice Plan

| Slice | Objective | Why Now | Expected Evidence | Status |
| --- | --- | --- | --- | --- |
| 1 | Inventory correctness, runtime-economics, maintainability, and confidence candidates | Avoid memory-anchored churn after the prior release | quality plan, inventories, delegated triage | complete |
| 2 | Land the highest-value reproduced bounded improvement | Convert current evidence into user-visible correctness or safety | debug artifact when applicable, owner tests, scoped commit | complete |
| 3 | Continue with the next safe evidence-backed slice until closeout reserve | Honor the timebox and diversify quality dimensions | measurements, pressure checks, reviewed commits | in progress |
| 4 | Final broad quality, retro, disposition, and local closeout | Prove the bundle without remote overclaim | verify/hooks, artifacts, clean local history | pending |

## Operator Decision Queue

none — no operator-only decision blocks the initial local inventory and implementation slices.

## Coordination Cues

- Routing: find-skills -> achieve + quality + impl + debug when triggered + critique + retro — this run needs timeboxed lifecycle, evidence-ranked quality selection, bounded implementation, disciplined diagnosis, fresh-eye review, and closeout reflection.
- Gather: n/a — no external source is required for the initial local quality selection.
- Release: n/a — this goal does not change version or install-manifest surfaces and has no publication lane.
- Issue closeout: n/a — no tracked issue is the source or closeout carrier for this goal.

## Discuss Before Activation

- Discuss before activation: resolved — the user explicitly requested a broad two-hour local improvement pass; remote publication, live/provider proof, gate weakening, and speculative roadmap expansion remain excluded.

## Slice Log

### 2026-07-11T20:43+09:00 — current quality inventory

- Ran the read-only repo quality adapter in 33.41s; deterministic gates passed and self-dogfood was correctly skipped in read-only mode.
- Current runtime signals remain within budget: lint specs about 16s, coverage about 4s, and eslint about 3.6s; shared-process Node execution remains rejected because prior measurement was slower and contaminated isolation.
- Structural waste, dual implementation, brittle source guards, and lint-ignore inventories reported zero actionable findings.
- The standing economics helper is Python-centric and cannot honestly recommend a Node runner change; a clone heuristic also targeted absent generic skill paths, so neither became product work.
- Delegated triage selected one fix-now defect: the deployment-evidence builder can consume `--help` as an output path and write a literal file; it rejected a coverage-only Go test, a generic side-effect framework, and speculative runner changes.
- Advisory only: 47 historical claim-evidence warnings remain (26 hash mismatches and 21 unreadable sources); this goal does not reopen their existing policy boundary.

### 2026-07-11T20:47+09:00 — deployment-evidence parser safety

- Reproduced from a disposable cwd: valid fixture input plus `--output --help` exited 0 and created a literal `--help` JSON file.
- Added four real-process malformed-value probes spanning both `--input` and `--output`, option-looking values, whitespace-only values, option-specific diagnostics, and unchanged cwd assertions.
- Confirmed the new test failed against the old parser, then changed the owning required-value guard to reject semantic emptiness and leading-dash option tokens before filesystem access.
- Focused Node tests and eslint pass; debug artifact validation passed after correcting the canonical heading shape.
- Non-claims: no generic parser abstraction, no intentional raw leading-dash path support, and no assertion that untested copied parsers share the reproduced mutation.
- Fresh-eye review initially failed the proof shape: malformed-only cases could not detect a parser that rejected every value, and empty-cwd input cases did not prove the read branch was blocked.
- Added a valid real-process input/output control and pre-seeded malformed input filenames with valid fixture content; final review rerun is pending.
- The full pre-push gate then exposed the newly executed CLI as an unfloored 73.33% file; diagnosed this as expected coverage-onboarding policy and registered only its 73.08% buffered floor without adding coverage-only tests or rewriting unrelated baselines.
- Delegated re-review passed the corrected runtime/test proof with no remaining findings.
- Delegated coverage disposition also passed: 73.08% is exactly the policy writer's 0.25-point buffer, exemption and coverage-only tests are inappropriate, and full floor regeneration would rewrite unrelated advisory baselines.
- `bash .githooks/pre-push` passed the complete 33-second verify and generated-drift sequence; `Lint Gate: ran-pass bash .githooks/pre-push`.
- Boundary Ownership: single-surface — the independently executable source-checkout helper owns its argv parser and output side effect; no binary, schema, docs, or Cautilus Agent surface moved.
- Critique: short parent-delegated fresh-eye PASS after one fail/fix cycle; final rerun found no blocking, actionable, or advisory findings.

### 2026-07-11T20:55+09:00 — deployment-evidence input preparer safety

- Independently reproduced the adjacent wrapper from a disposable cwd: valid scenario input plus `--output --help` exited 0 and created a literal `--help` one-row packet.
- Archived the completed builder debug record and opened a fresh root-cause artifact rather than broadening the prior diagnosis by syntax alone.
- Added a valid real-process control and a seven-case malformed table covering option-looking values for all six options, whitespace output, seeded malformed input, option-specific diagnostics, and unchanged file snapshots.
- Confirmed the malformed test failed against old code at downstream domain normalization, then repaired the single owning required-value guard; focused tests pass 7/7 in about 0.72s and focused eslint passes.
- Non-claims: no generic parser abstraction, no coverage-speed claim from this sub-second focused suite, and no diagnosis of unrelated copied parsers.
- Full coverage passed and made the wrapper visible at 101 statements/80.20%; floor policy correctly leaves this first observation in the advisory warn band, so no baseline was added.
- Boundary escalation was false and no docs/spec surface moved.
- Delegated fresh-eye review passed runtime behavior, all test oracles, cleanup, sub-second focused cost, and advisory coverage disposition after correcting stale current-tense artifact wording.
- Critique: short parent-delegated fresh-eye PASS after the artifact honesty correction; no remaining code, test, boundary, or docs finding.
- `bash .githooks/pre-push` passed the complete 39-second verify and generated-drift sequence; coverage stayed below its 10-second budget at 8.86s and `Lint Gate: ran-pass bash .githooks/pre-push`.
- Boundary Ownership: single-surface — the independently executable preparer owns its argv parser; its shared data schema and public docs remain unchanged.

## Context Sources

- User request: another two-hour autonomous improvement pass across bug fixes, test speed, and code quality.
- `AGENTS.md`, `README.md`, `docs/master-plan.md`, and `CLAUDE.md` for product and operating boundaries.
- `docs/internal/handoff.md`, `charness-artifacts/quality/latest.md`, and `charness-artifacts/goals/2026-07-11-third-autonomous-two-hour-improvement-release.md` for current state and prior deferrals.
- `charness-artifacts/retro/2026-07-11-third-autonomous-two-hour-improvement-release-retro.md` for repeat-trap avoidance.

## Interview Decisions

- Mode family: artifact-only versus implementation continuation.
  Chosen: implementation continuation because the user explicitly asked to proceed autonomously for two hours.
  Rejected: planning-only would not satisfy the request.
- Publication family: local commits versus final push/release.
  Chosen: local commits only because this request omits push and release authorization.
  Rejected: carrying prior publication approval into a new goal would violate phase-scoped side-effect boundaries.
- Time family: macro completion versus fixed timebox.
  Chosen: two-hour timebox with a 20-minute closeout reserve and continue-next-improvement policy.
  Rejected: stopping after one successful slice would underuse the explicit budget.
- Axis probe: runtime and platform remain measurement axes; provider/live behavior and remote publication are separate axes and non-claims unless explicitly selected and authorized.

## Plan Critique Findings

- Same-agent preflight: repeated autonomous passes risk polishing prior interests, so current planner evidence and delegated triage must precede fixes.
- Same-agent preflight: diversity means examining multiple dimensions, not forcing a code change in every named dimension when evidence rejects a seam.
- Same-agent counterweight: small owner-local helpers and tests are preferred over shared abstractions until repeated policy, not merely repeated syntax, exists.
- Required delegated quality review will classify fix-now/defer/reject candidates before recommendations lock in.

## Off-Goal Findings

none at activation.

## Final Verification

Retro: TODO — create or explicitly skip with an allowed reason before complete
Host log probe: TODO — create or explicitly skip with an allowed reason before complete
Disposition review: TODO — create or explicitly skip only when policy allows before complete

## User Verification Instructions

Pending final local bundle.

## Auto-Retro

Retro dispositions: TODO — disposition every surfaced improvement, or record the explicit no-improvement opt-out
Structural follow-up: TODO — classify transferable waste after the final retro, or delete this line when none is named
