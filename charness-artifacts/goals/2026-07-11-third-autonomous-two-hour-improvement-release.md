# Achieve Goal: Two-hour autonomous Cautilus improvement and release

Status: complete
Created: 2026-07-11
Activation: `/goal @charness-artifacts/goals/2026-07-11-third-autonomous-two-hour-improvement-release.md`

This file is the living goal scratchpad.
The user's explicit two-hour implementation, push, and release request activates pursuit after the shaped-goal gate passes.

Timebox: 2h
Activation time: 2026-07-11T19:03:45+09:00
Closeout reserve: 20m
Done-early policy: continue_next_improvement

## Active Operating Frame

- Current slice: closeout-only after verified `v0.19.2` publication.
- Current slice intent: synchronize final proof, retro dispositions, handoff, and goal state without changing the released runtime.
- Next action: incorporate the final disposition review, validate all closeout artifacts, commit the audit-doc-only closeout, and push `main`.
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
| 4 | Continue with the next safe evidence-backed improvement until the closeout reserve | Honor the two-hour done-early policy | candidate ledger, slice proof, scoped commits | completed |
| 5 | Final quality review, release preparation, push, publication, and public verification | Ship one coherent verified bundle | broad gates, release artifact, tag/release/install readback | completed |

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
- Release: `charness-artifacts/release/latest.md` — published `v0.19.2`, successful workflow/public asset/attestation proof, and final install/update readback ledger.
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

### Slice 4: Node standing-test isolation experiment

- Objective: Determine whether shared-process Node tests can reduce standing runtime without proof loss.
- Why this approach: The economics inventory flagged unknown isolation cost, so measurement was required before any runner change.
- Commits: none — evidence rejected the change.
- What changed: No repository files changed for the experiment; the standing isolated runner remains authoritative.
- Alternatives rejected: Explicit shared-process mode was rejected because it ran about three to nine times slower and executed CLI main guards inside the test process while still exiting zero.
- Targeted verification: Alternating isolated/shared full-glob runs passed isolated in 4.87s cold and 1.67s warm; shared took 15.42s and 15.34s and emitted an unrequested missing-input stack trace.
- Test duplication pressure: No tests added and no standing command changed.
- Critique: Quality reviewer had already rejected speculative isolation/parallelism without proof; measurement confirmed that decision.
- Off-goal findings: Shared-process contamination is not a shipped-mode bug because the standing suite intentionally uses process isolation.
- Lessons carried forward: Test isolation is buying real module-main containment in this repo; do not optimize it away from timing alone.
- Metrics: isolated 4.87s/1.67s versus shared 15.42s/15.34s on this machine.

### Slice 5: Normalize Node active-run optional paths

- Objective: Treat all-whitespace output and active-run paths as absent while preserving existing non-empty Node path identity.
- Why this approach: Node created a space-only output directory where Go followed auto-materialization, violating shared precedence semantics.
- Commits: the scoped parity commit containing this slice.
- What changed: A small optionalPath helper now normalizes absence in all three Node branches; tests cover spaces, tab/newline, auto fallback, filesystem non-creation, and valid paths with spaces.
- Alternatives rejected: Rejected trimming every non-empty path, changing Go surrounding-space identity, and rejecting internal spaces.
- Targeted verification: Old focused cases failed; all 18 active-run tests, eslint, debug validation, and diff checks passed after repair.
- Test duplication pressure: Two focused test blocks extend the owning active-run test file; no new runner or fixture layer.
- Critique: Two clean parent-delegated reviews narrowed parity and expanded whitespace/preservation proof; final code/test verdict ready after updating the artifact test count; both fingerprints were clean.
- Off-goal findings: none.
- Lessons carried forward: Cross-language parity must name which semantic is shared; absence detection can align even when surrounding-space path identity does not.
- Metrics: 18 focused tests complete in about 0.10s.

### Slice 6: Direct Go active-run contract proof

- Objective: Make Go active-run precedence and invalid-target behavior reachable through a small in-process test seam.
- Why this approach: The Go helper had no direct tests, while Node sibling proof could not protect Go-specific filesystem and precedence behavior.
- Commits: the testability commit containing this slice.
- What changed: Added a focused Go test file covering explicit, active, whitespace-to-active, whitespace-to-auto, manifest creation, missing target, and non-directory behavior.
- Alternatives rejected: Rejected percentage-only expansion and duplication of every helper error through CLI smoke.
- Targeted verification: Focused tests passed in 0.01s; focused coverage reached 88.9% ReadActiveRunDir and 77.8% ResolveRunDir; structural inventory remained zero.
- Test duplication pressure: One 119-line test file keeps behavior assertions visible and uses standard t.TempDir fixtures; no production branch or runner added.
- Critique: Parent-delegated review required the middle whitespace-explicit to active-env precedence case; after addition final verdict READY and fingerprint verify clean.
- Off-goal findings: none.
- Lessons carried forward: Sibling-language tests inform contract intent but do not replace language-local proof at filesystem boundaries.
- Metrics: Focused tests about 0.01s; no subprocess or provider cost.

### Slice 7: Reject unsafe workspace-start required values

- Objective: Prevent option-like or whitespace-only required values from being interpreted as paths or labels before a mutating CLI command runs.
- Why this approach: A direct Node entrypoint bypassed the Go parser and created a --json directory when --root lacked a value, while whitespace-only roots also mutated the filesystem.
- Commits: the scoped CLI-safety commit containing this slice.
- What changed: The Node required-value parser now rejects missing, whitespace-only, and option-like values; a subprocess table proves all invalid root and label cases fail before creating files.
- Alternatives rejected: Rejected relying on the Go front door, generic parser replacement, and post-parse cleanup because the Node entrypoint is a supported runtime surface and mutation must be prevented before dispatch.
- Targeted verification: Old-code reproduction exited zero and created --json/<run>; the four-case regression table, full 16-test workspace-start suite, eslint, debug validation, structural inventory, and clean reviewer-boundary verification passed after repair.
- Test duplication pressure: One table-driven subprocess test extends the owning test file and asserts the empty working directory as the side-effect oracle; no new fixture framework or runner was added.
- Critique: The first parent-delegated review found a whitespace-only sibling gap; after adding root and label whitespace probes, the clean follow-up verdict was READY with no blocker or should-fix.
- Off-goal findings: The generic CLI side-effect contract remains unconfigured; the concrete supported entrypoint now has checked-in pre-mutation proof without inventing a repo-wide fixture surface.
- Lessons carried forward: Every independently executable mutating parser must reject option tokens and semantic emptiness locally, even when a higher-level wrapper already validates them.
- Metrics: Four invalid-value subprocess probes; 16 focused tests complete in about 0.53s; zero files created in each failure case.

### Slice 8: Guard compare-worktree mutation inputs

- Objective: Reject malformed required values before creating output directories or changing Git worktree metadata.
- Why this approach: The direct helper consumed --force as --output-dir, exited zero, and registered baseline and candidate worktrees under a literal --force directory.
- Commits: the scoped worktree-safety commit containing this slice.
- What changed: The shared required-value parser now rejects semantic emptiness and option tokens; a five-case subprocess table covers all four value options and output whitespace while watching cwd and git worktree state.
- Alternatives rejected: Rejected wrapper-only validation, post-mutation cleanup, and a repository-wide parser abstraction because the independent entrypoint owns this concrete side-effect boundary.
- Targeted verification: Old-code disposable reproduction created both worktrees; after repair the full 12-assertion suite, eslint, debug validation, diff checks, delegated fresh-eye review, and clean fingerprint verification passed.
- Test duplication pressure: One table-driven subprocess test extends the existing owning file; it reuses a small repository fixture and adds no runner or abstraction.
- Critique: Parent-delegated reviewer returned READY with no blocker or should-fix and confirmed the splice construction, diagnostic oracle, cwd oracle, worktree-list oracle, and compatibility non-claim.
- Off-goal findings: The destructive prune parser sibling is separately reproduced and queued next rather than hidden inside this commit.
- Lessons carried forward: For Git helpers, pre-mutation proof must watch repository metadata as well as output directories; a failed command can otherwise leave a partial worktree registration.
- Metrics: Five malformed probes; 12 focused assertions in 1.74s; zero post-fix cwd or worktree-list drift.

### Slice 9: Keep malformed prune commands from deleting artifacts

- Objective: Reject malformed required values before recursive workspace-artifact deletion while preserving numeric validation diagnostics.
- Why this approach: The parser consumed --dry-run as --root, disabled the intended safety mode, exited zero, and deleted a recognized artifact sentinel.
- Commits: the scoped deletion-safety commit containing this slice.
- What changed: The required-value helper rejects whitespace, help, and long-option tokens before dispatch while leaving negative numbers to owning validators; six subprocess probes pin deletion-sentinel preservation and diagnostics.
- Alternatives rejected: Rejected relying on root existence checks, post-deletion reporting, blanket leading-dash rejection that changed negative-number diagnostics, and a broad shared parser refactor.
- Targeted verification: Old-code disposable reproduction removed the sentinel; after repair the full nine-test suite, eslint, debug validation, diff checks, two-round delegated review, and clean final fingerprint verification passed.
- Test duplication pressure: One table-driven process test extends the two existing owning tests; six small disposable fixtures cover the destructive boundary without a new framework.
- Critique: First review found two artifact overclaims and a diagnostic compatibility nit; wording was narrowed, negative-number routing was preserved and pinned, and the clean follow-up returned READY.
- Off-goal findings: No repo-wide argument parser was introduced; other non-mutating helper parsers remain outside this reproduced destructive family.
- Lessons carried forward: A dry-run flag consumed as data can invert safety; destructive CLI tests need a sentinel at the exact old-code victim path, and parser hardening should preserve owning type diagnostics.
- Metrics: One old-code sentinel deletion reproduced; six invalid-value probes; nine focused tests in 0.48s; zero sentinel deletions after repair.

### Slice 10: Reuse the compare-parser Git fixture

- Objective: Reduce standing process-test cost without weakening malformed-input or mutation-state proof.
- Why this approach: The new five-case regression table recreated and committed an identical Git repository per case, making fixture setup a measurable share of the focused suite.
- Commits: the scoped test-economics commit containing this slice.
- What changed: The parent test now owns one committed source repository while each sequential subtest retains a unique sandbox; regression cleanup removes the sandbox and prunes stale worktree metadata before the next case.
- Alternatives rejected: Rejected shared cwd, parallel subtests, removing state assertions, and global fixture caching because each would weaken isolation or failure diagnosis.
- Targeted verification: Three before runs measured 1.88/1.85/1.79s; three after runs measured 1.57/1.56/1.59s; every run, eslint, diff checks, delegated fresh-eye review, and clean fingerprint verification passed.
- Test duplication pressure: No assertion or case was added; repeated setup was removed while per-case filesystem and Git metadata oracles remained.
- Critique: Parent-delegated reviewer returned READY and confirmed sequential execution, pre-cleanup state checks, cleanup ordering, regression containment, and proportionality.
- Off-goal findings: This is a focused-suite improvement of about 0.28s median, not a claim that total verification runtime falls by 15 percent.
- Lessons carried forward: Share immutable expensive fixtures only when mutable outputs remain case-local and a failed case has an explicit metadata cleanup path.
- Metrics: Focused median 1.85s to 1.57s, about 15.1% faster; one repository initialization instead of five; five cases unchanged.

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

Retro: charness-artifacts/retro/2026-07-11-third-autonomous-two-hour-improvement-release-retro.md
Host log probe: skipped: host-log-not-exposed: the host exposes goal elapsed time and token totals but no stable session file path for a clone-safe scoped probe artifact.
Disposition review: charness-artifacts/critique/2026-07-11-third-autonomous-two-hour-improvement-release-disposition-review.md
Early close report: charness-artifacts/goals/2026-07-11-third-autonomous-two-hour-improvement-release-early-close-report.md

- Prepared-tree `npm run verify` passed in 58.99s; `npm run hooks:check`, history secrets, publisher policy, on-demand tests, surface packets, and declared fresh-checkout probes passed.
- GitHub Actions run `29150460445` completed successfully; artifact build, attestations, release upload, and public verifier all passed.
- Local public verification found all seven expected assets, complete checksums, and matching source-archive hash; Linux attestation verification passed.
- Isolated Linux install and update smoke downloaded `v0.19.2`, reported `0.19.2` through both version surfaces, and reported update status `current`.
- Release checkpoint: tag `v0.19.2` points at `e96a8b4cac6d773e59c626a996cdda4af4dbc03c`.
- Post-checkpoint commit `a5ae672c4f25e91836db8303be03ec41c90c7219` is audit-doc-only release verification; the final closeout commit is also audit-doc-only and does not require another binary release.
- Closeout state: pushed-ci plus public asset and isolated install verification; live provider/model behavior was not required and is not claimed.

Early close rationale: the requested coherent release is already public and verified, while another implementation slice would create an unreleased delta or force an unplanned second patch release.
Next slice candidate: asset-readiness retry ownership | decision: defer | reason: generic Charness orchestration and the Cautilus adapter command are both plausible owners, so implementation needs a separate boundary decision.
Next slice candidate: public release-notes operator story | decision: defer | reason: the current asset is valid provenance and changing its role would reopen release infrastructure after this patch is complete.
Next slice candidate: historical claim-evidence warning classification | decision: out-of-scope | reason: the 47 warning records require provenance classification before any warning-policy or evidence rewrite.
Outcome sufficiency check: sufficient: seven scoped implementation commits, broad and focused proof, ordered publication, public assets, attestation, and install/update readback satisfy the user's requested improvement and release outcome.

## User Verification Instructions

- Inspect `https://github.com/corca-ai/cautilus/releases/tag/v0.19.2` and confirm the seven expected assets.
- Run `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`, then `cautilus --version` and `cautilus version --verbose`.
- For source-checkout behavior, rerun the focused Node owner suites or `npm run verify` from this repository.
- Roll back the binary with `CAUTILUS_VERSION=v0.19.1` on the installer command if needed.

## Auto-Retro

Retro dispositions: applied: `docs/maintainers/releasing.md` now separates release-page visibility from asset readiness and requires unchanged-command retry after workflow/public verification.
Retro dispositions: applied: real-process mutation sentinels protect workspace creation, Git worktree registration, and recursive artifact pruning.
Retro dispositions: applied: release, quality, debug, retro, and handoff artifacts preserve proof boundaries and remaining environment skew.
Retro dispositions: accepted-risk: bounded reviewer duration varied with judgment scope, stop reminders worked, and no deterministic repo-side gate can classify useful judgment without false positives.
Structural follow-up: applied: maintainer release contract now owns the page-before-asset readiness recovery sequence.
Structural follow-up: none — reviewer-duration variance has no stable repo-local structural destination beyond explicit coordinator timeboxing in this run.
