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

- Current slice: install overwrite stale-tree integrity.
- Current slice intent: make complete prior-tree removal a checked precondition for reporting the Cautilus Agent as reinstalled.
- Next action: run full owner tests, debug/boundary checks, install/Agent progressive-disclosure probes, and delegated fresh-eye review.
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

### 2026-07-11T21:00+09:00 — deployment-evidence test feedback

- Before changing test layout, measured the exact deployment-evidence test glob seven times: 0.89, 0.81, 0.85, 0.81, 0.81, 0.83, and 0.77 seconds; median 0.81s.
- Moved builder CLI process tests and preparer CLI process tests into executable-owned files while leaving pure transformation and schema tests in their original owners.
- Preserved both valid controls, all eleven malformed subprocess cases, seeded-input reachability, full file snapshots, unique temp directories, and `try/finally` cleanup.
- After the split, the same glob passed 10/10 and measured 0.52, 0.53, 0.61, 0.53, 0.58, 0.51, and 0.54 seconds; median 0.53s, a 0.28s (34.6%) focused feedback reduction.
- Focused eslint passes; no total `npm run test:node` or `npm run verify` speed claim is made.
- Full Node suite passed in 2.07s; this is a post-change health observation, not a before/after total-suite claim.
- Boundary escalation was false.
- Delegated fresh-eye review confirmed literal case/oracle/cleanup parity, test discovery and c8 exclusion, parallel safety, and that the small duplicated snapshot helper is cheaper than a shared test abstraction at this boundary.
- `bash .githooks/pre-push` passed the complete 34-second verify and generated-drift sequence; coverage was 4.52s and `Lint Gate: ran-pass bash .githooks/pre-push`.
- Boundary Ownership: single-surface — only test ownership/layout changed; production behavior and docs/spec surfaces did not move.
- Critique: short parent-delegated fresh-eye PASS with no blocking, actionable, or advisory findings.

### 2026-07-11T21:07+09:00 — malformed JSON diagnostics

- Reproduced both wrappers with existing empty `/dev/null` input: each exited 1 with raw `SyntaxError`, `JSON.parse`, wrapper, module-loader, and async entrypoint frames; neither wrote output.
- Archived the completed preparer-parser debug record and opened a fresh syntax-diagnostic investigation.
- Added one malformed-file real-process test per executable owner, requiring nonzero exit, a resolved input path, no `SyntaxError` or stack frame, and absent output.
- Confirmed both tests failed against old code, then translated only local `JSON.parse` errors through each wrapper's existing concise `fail` boundary.
- Focused process tests pass 6/6 and focused eslint passes.
- Initial fresh-eye review failed the proposed diagnostic because forwarding `error.message` can echo malformed input content and embedded newlines.
- Removed parser reason text from operator stderr and strengthened both owner tests with a newline-bearing secret sentinel plus exact one-line equality.
- Non-claims: filesystem read errors, schema/domain validation errors, and unrelated JSON consumers retain their existing contracts.
- Debug validation and boundary checks passed; boundary escalation was false.
- Delegated fresh-eye re-review passed after the disclosure fix with no remaining findings.
- `bash .githooks/pre-push` passed the complete 34-second verify and generated-drift sequence; coverage was 4.49s.
- Broad coverage raised the already-floored builder from 73.33% to 75.00%, so its policy-buffered floor was promoted from 73.08% to 74.75%; the newly visible preparer remains an unfloored 81.48% advisory until stable.
- `Lint Gate: ran-pass bash .githooks/pre-push`.
- Boundary Ownership: owned-correctly — each source-checkout CLI translates only its local parse failure; no shared schema, binary, Agent, or docs contract moved.
- Critique: short parent-delegated fresh-eye PASS after one security fail/fix cycle; no remaining blocking, actionable, or advisory findings.

### 2026-07-11T21:12+09:00 — artifact prune truthfulness

- Reproduced with a Cautilus-created disposable run under a mode-`0555` artifact root: `doctor artifacts prune --keep-last 0` exited 0 and returned one `pruned` entry while the selected directory remained.
- Root cause is the owning loop's discarded `os.RemoveAll` error followed by unconditional append to the structured `pruned` result.
- Added an adjacent CLI failure regression that restores permissions in cleanup, requires nonzero status, path-bearing stderr, no success payload, and a remaining target directory; confirmed it failed against old code.
- Propagated a path-wrapped removal error before the append; both the new failure case and existing successful removal case pass.
- The first post-fix oracle incorrectly required a child marker file to remain; corrected it because `RemoveAll` may delete children before parent unlink fails and this slice makes no rollback claim.
- Fresh-eye review found the permission oracle would fail under Unix euid 0; the CLI regression now explicitly skips Windows and root while retaining real OS-semantic proof for permission-respecting non-root Unix.
- Non-claims: no atomic pruning, partial-success packet, retry, or rollback semantics.
- Debug validation and boundary checks passed; boundary escalation was false.
- Full `internal/app` tests and the focused race test passed.
- Delegated fresh-eye re-review passed after the root/Windows portability correction with no remaining findings.
- `bash .githooks/pre-push` passed the complete 48-second verify and generated-drift sequence; coverage was 9.75s against its 10-second budget and `Lint Gate: ran-pass bash .githooks/pre-push`.
- Boundary Ownership: owned-correctly — the pruning loop owns deletion truth and the existing handler owns nonzero stderr; docs already promise pruning, not best-effort selection.
- Critique: short parent-delegated fresh-eye PASS after one platform-oracle fail/fix cycle; no remaining blocking, actionable, or advisory findings.

### 2026-07-11T21:18+09:00 — install overwrite stale-tree integrity

- Reproduced after a normal disposable install: a mode-`0555` `stale-locked/old.txt` subtree caused destination removal to fail, but `init --overwrite --json` exited 0, reported `reinstalled`/`overwrote: true`, and retained the unknown stale file.
- Archived the completed prune incident and opened an install-specific debug record because this seam requires packaged Agent and install quality proof.
- Added an adjacent non-root Unix CLI regression requiring nonzero status, destination-path stderr, no install summary, and a retained locked stale file; Windows/root explicitly skip the permission semantic.
- Confirmed the test failed against old code, then made full destination removal a checked precondition before directory recreation and bundled installation.
- Focused initial install, overwrite failure, and legacy migration controls pass.
- Non-claims: no transactional rollback after partial removal, no Agent content change, and no generic destructive-command refactor.
- Full `internal/app` and focused install race tests passed; debug validation and boundary checks passed with no escalation.
- Skill disclosure/source-package parity, release surface packet, temporary install plus `doctor --scope agent-surface`, command discovery, and scenario discovery passed, proving the Agent/binary progressive-disclosure surfaces remain aligned.
- `npm run test:on-demand` passed.
- Delegated fresh-eye review passed partial-deletion/retry semantics, diagnostic ownership, permission-test portability, install contract, and Agent parity with no findings.
- `bash .githooks/pre-push` passed the complete 48-second verify and generated-drift sequence; coverage was 9.71s against its 10-second budget and `Lint Gate: ran-pass bash .githooks/pre-push`.
- Boundary Ownership: owned-correctly — binary install owns destination replacement truth; Agent source/package content and discovery behavior remain unchanged.
- Critique: short parent-delegated fresh-eye PASS with no blocking, actionable, or advisory findings.

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

- Deferred scenario proposal panic boundary: malformed registry data can panic inside runtime validation but the CLI currently recovers cleanly; library error-contract work needs a separate design slice.
- Deferred review capture-write failures: ignored stdout/stderr capture write errors can leave packet paths without files; multiple callers and packet status semantics need a dedicated causal review.

## Final Verification

Retro: TODO — create or explicitly skip with an allowed reason before complete
Host log probe: TODO — create or explicitly skip with an allowed reason before complete
Disposition review: TODO — create or explicitly skip only when policy allows before complete

## User Verification Instructions

Pending final local bundle.

## Auto-Retro

Retro dispositions: TODO — disposition every surfaced improvement, or record the explicit no-improvement opt-out
Structural follow-up: TODO — classify transferable waste after the final retro, or delete this line when none is named
