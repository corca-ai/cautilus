# Achieve Goal: Sixth autonomous Cautilus improvement and breaking-rename release

Status: active
Created: 2026-07-16
Activation: `/goal @charness-artifacts/goals/2026-07-16-sixth-autonomous-improvement-release.md`

This file is the living goal scratchpad. It becomes active only when the user
runs the activation command.

## Active Operating Frame

- Current slice: slice 3 — fix the SemVer prerelease lexical compare in `version.go`.
- Current slice intent: land evidence-backed non-breaking correctness/gate/doc fixes (slices 1–4), then the one user-licensed breaking schema rename (slice 5), then cut and verify the lightest honest minor release containing all accumulated commits.
- Next action: reproduce `CompareVersions("1.0.0-rc.10","1.0.0-rc.2")` returning the wrong sign red-first, then implement identifier-wise numeric compare.
- Verification cadence: cheap deterministic checks at commit boundaries; higher-cost or fresh-eye proof at slice boundaries; final broad/live proof at closeout.
- Gate cadence: focused owner checks (`go test`, `node --test`, `npm run lint`) at commit boundaries; `npm run verify`, `npm run hooks:check`, release surface packet, and public proof at the final bundle boundary.
- Slice review packet: before fresh-eye slice critique, provide intent, changed files and owning/generated surfaces, expected invariants, tests/proof, non-claims, out-of-scope lines, and reviewer questions.
- History boundary: keep this frame current; move completed detail to `## Slice Log`, `## Operator Decision Queue`, `## Final Verification`, and `## Auto-Retro`.

## Goal

Land a bundle of evidence-backed improvements across gate integrity, correctness, dead-code removal, and doc/spec self-consistency, plus one high-value user-licensed breaking schema rename that aligns consumer-facing vocabulary with the shipped command surface, then publish and distinctly verify the lightest honest release (provisional minor `0.20.0`) containing all accumulated local commits.

## Non-Goals

- Do not run `npm run claims:refresh:all` autonomously: re-pinning content hashes at HEAD would bless the 26 drifted plus 21 unreadable bindings, converting a visible warn signal into false `proven` state — uniquely corrosive for a "Proven On Itself" product. This needs human triage, not an unattended mass re-pin.
- Do not add a fixture-replay "judge" that hardcodes one known verdict to admit the documented `behave`/`behavior` case; that is fake generalization, and an honest semantic judge is the external app/judge-lane decision.
- Do not add speculative hardening for input shapes that do not occur: YAML `!!int`/`!!float` overflow coercion and `sync-packaged-skill` symlink/binary/internal-upward-link handling are latent-only (no such asset or link exists) — YAGNI against the repo's anti-speculation discipline.
- Do not do low-value breaking renames (the `workflow_conversation` alias, the `discover claims` vs `evaluate claims plan` verb split) — near-zero-cost shims or defensible boundaries, so removing them is churn.
- Do not add coverage-only tests with no behavior change or found defect, and do not add `-coverpkg` re-baselining, resolve the find-skills judge-fixture residue, or scope an app runner — each needs a separate decision.
- Do not weaken isolation, proof depth, coverage, security, or release checks to improve timings.
- Do not claim provider/live evaluator or native macOS execution proof unless a selected change crosses that boundary and the configured proof can exhibit it.

## Boundaries

- External side-effect scope: the user explicitly authorized (session `AskUserQuestion`) one final push of the bundled commits, one minor tag (provisional `v0.20.0`), a GitHub release, the configured workflow/public verification, and the adapter-owned post-publish install refresh — all scoped to the completed bundle only.
- Intermediate slices stay local: no per-slice push, tag, or remote CI run is authorized. That approval does not carry forward past the final bundle.
- Breaking-change scope: the `cautilus.workbench_instance_catalog.v1` → `cautilus.live_target_catalog.v1` schema rename is explicitly authorized; the retired schemaVersion must reject with an actionable rename error, and every golden test string and doc reference moves in the same slice.
- Bug fixes require a falsifiable reproduction before repair. The coverage-floor fail-open and SemVer-prerelease bugs both have confirmed repros from discovery; each lands red-first. Route any newly-surfaced unexpected behavior through `charness:debug` before further fixes.
- Release mutation waits for deterministic surface packet checks (`npm run critique:surface-packet:check`), a standalone delegated release critique, and a publish dry-run.
- If public release verification fails after irreversible publication, record the exact public state and continue safe recovery rather than claiming completion.

## User Acceptance

What the user can do to verify completion directly.

- Inspect multiple scoped commits, each with before/after evidence and a reproduced failure path where a defect was fixed.
- Open the public release (provisional `v0.20.0`), verify the tag, seven assets, checksums, and one binary attestation.
- Confirm the retired `cautilus.workbench_instance_catalog.v1` now rejects with an actionable rename error and `cautilus.live_target_catalog.v1` validates on `discover live-targets`.
- Re-run the install script and confirm `cautilus --version` returns the new version; roll back with `CAUTILUS_VERSION=v0.19.4`.

## Agent Verification Plan

### Low-Cost Checks

- Focused owner tests: `go test ./internal/...` for touched Go packages, `node --test` for touched mjs, `npm run lint` (eslint + go vet + links + skill-disclosure + packaged-sync), and `npm run generated:drift:check`.
- Coverage-floor enforcement on every touched file; red-first negative test for each reproduced defect.
- `npm run docs:preview:changed` rendered-snapshot read for any changed public doc/spec prose (not just exit 0).

### High-Confidence Checks

- `npm run verify` (all phases) and `npm run hooks:check` on the bundled tree.
- Parent-delegated `charness:bounded-reviewer` fresh-eye critique for the breaking-rename slice and for the final release bundle disposition.
- `npm run critique:surface-packet:check` (release + cli-agent sections), secret-history scan via `bash .githooks/pre-push`, and `npm run release:prepare` dry-run.
- `npm run test:on-demand` if any release-prep or self-dogfood flow surface changes.

### External Or Live Proof

- Push the final branch and the minor tag only after local proof and both delegated critiques pass.
- Verify GitHub Actions workflow completion, public release visibility, seven assets + checksums + attestation, fresh-checkout install smoke (latest and pinned), distinct-channel HTTPS readback, `cautilus --version`, and `cautilus update`.

## Slice Plan

| Slice | Objective | Why Now | Expected Evidence | Status |
| --- | --- | --- | --- | --- |
| 1 | Fix `check-coverage-floor.mjs` fail-open (floored-but-absent file silently unenforced) | MUST-FIX gate integrity: a floor gate that hides regressions defeats its own purpose | red→green fixture test, `npm run verify` clean | complete (f06f32d2) |
| 2 | Delete dead `internal/runtime/git_hooks.go` and its 0% floor entry | Orphaned exported code with real side effects and no caller; node scripts own the hook surface | build + `verify` green, floor entry gone, grep confirms no caller | complete (8c25e161) |
| 3 | Fix SemVer prerelease lexical compare in `version.go` (`rc.10 < rc.2`) | Genuine correctness bug on an exported fn driving update/self-install; tiny, red-first | `version_test.go` red→green with identifier-wise cases | pending |
| 4 | Doc/spec self-consistency: README `skill-experiment` token + `evaluation.spec.md` current-tense | Front-door invocation drift + a user-facing promise violating the repo's own current-tense prose rule | `npm run lint` links/specs, `docs:preview:changed` snapshot | pending |
| 5 | Breaking rename `workbench_instance_catalog.v1` → `live_target_catalog.v1` with actionable rejecting error | User-licensed vocab-leak fix aligning schema with `discover live-targets`; frees `workbench` for the reserved GUI name | rename tests, golden-string updates, delegated critique, `verify` | pending |
| 6 | Prepare and critique minor release `0.20.0` | Accumulated bundle includes a breaking consumer schema rename (pre-1.0 breaking = minor) | synced surfaces, surface packet, delegated critique, dry-run | pending |
| 7 | Push, publish, and distinctly verify the release | User explicitly requested remote completion for the bundle | branch/tag, workflow, public assets, install/readback evidence | pending |
| 8 | Final quality, retro, handoff, and goal closeout | Preserve honest proof and remaining risks | broad gates, durable artifacts, clean synchronized state | pending |

## Operator Decision Queue

- Decision: whether the release planner/critique confirms minor `0.20.0` versus a different bump.
  Owner: agent may decide within the planner's rules; escalate to operator only if the planner disputes minor.
  Why deferred: does not block local slices 1–5; resolved at slice 6.
  Unblock action: run `npm run release:prepare` dry-run and the delegated release critique.
  Revisit trigger: slice 6 start.

## Coordination Cues

Phase-appropriate routing for this run, chosen from installed skill metadata and
model judgment — never a hard-coded phase-to-skill list here.

- Routing: achieve owns the goal lifecycle; impl carries the fix/rename slices; debug fronts the two reproduced bug fixes; quality sets verification cadence; critique + `charness:bounded-reviewer` carry the breaking-rename and final-release fresh-eye passes; release owns the minor bump and publish — this run needs disciplined repair, an auditable lifecycle, and irreversible-boundary proof.
- Gather: n/a — no external source is needed; discovery ran over local repo state only.

## Discuss Before Activation

- Discuss before activation: resolved — the user explicitly approved, via this session's `AskUserQuestion`, both a final push + minor release and inclusion of the `workbench`→`live_target` breaking schema rename; external side-effects apply only to the final bundled tree, and the claim-evidence refresh / fixture-judge / YAGNI-hardening items are excluded in Non-Goals.

## Slice Log

### Slice 1: check-coverage-floor fail-open fixed (slice 1)

- Objective: Make the coverage-floor gate fail-closed when a floored path is absent from the coverage report.
- Why this approach: Iterate floor keys (not just coverage.files) so an unmeasurable floor fails instead of being counted OK; the contradiction check already excludes floored+exempt paths.
- Commits: f06f32d2
- What changed: scripts/check-coverage-floor.mjs (missingFloored detection + FAIL block + exit condition); scripts/coverage-dir.test.mjs (red-first absent-floored fixture test).
- Alternatives rejected: WARN-only (rejected: keeps the fail-open hole); auto-drop absent floors (rejected: would silently erase a real regression signal).
- Targeted verification: Red-first test exit 0 -> after fix exit 1 with FAIL message; full coverage-dir suite 6/6; live gate still OK 144 floored; eslint clean.
- Test duplication pressure: One in-process fixture test reusing the existing floorEnv/writeAggregate harness; no new file, no subprocess beyond the existing spawn pattern.
- Critique: n/a — small deterministic gate fix, delegated critique reserved for the breaking-rename slice and final bundle.
- Off-goal findings:
- Lessons carried forward:
- Metrics:

### Slice 2: Remove dead git_hooks.go (slice 2)

- Objective: Delete orphaned exported Go dead code and its 0% coverage floor.
- Why this approach: CheckGitHooks/InstallGitHooks had no non-test caller; node scripts own the hook surface. fileExists lives in helpers.go so the file's deletion is self-contained.
- Commits: 8c25e161
- What changed: Deleted internal/runtime/git_hooks.go; removed its scripts/coverage-floor.json entry (144 -> 143).
- Alternatives rejected: Wire it into doctor/init instead (rejected: no evidence anyone wants that surface; a separate larger decision, not a ready slice).
- Targeted verification: grep confirms callerless; go build ./... + go vet ./internal/{runtime,app}/... green; regenerated coverage.json no longer lists the file; floor gate OK 143 floored.
- Test duplication pressure: None added — pure dead-code removal, no behavior to test.
- Critique: n/a — verified callerless in-repo; delegated critique reserved for slice 5 + final bundle.
- Off-goal findings:
- Lessons carried forward:
- Metrics:

## Context Sources

Durable references this goal was shaped from. A fresh session can reconstruct
the originating context by following them in order.

- `AGENTS.md`, `README.md`, `docs/master-plan.md`, `CLAUDE.md` — product and operating boundaries.
- `docs/internal/handoff.md`, `charness-artifacts/quality/latest.md`, `charness-artifacts/release/latest.md` — current quality and public-release state.
- `charness-artifacts/goals/2026-07-11-fifth-autonomous-two-hour-improvement-release.md` — the immediately preceding autonomous improvement-release bundle and its repeat-trap controls.
- Discovery workflow `wf_a739e366-382` (this session): six read-only scouts + synthesis + counterweight produced the ranked backlog and the false-proof/YAGNI exclusions this goal is scoped from.

## Interview Decisions

For each Before-phase question: family of options considered, chosen value, and
rejected-alternatives reason.

- Mode: artifact-only vs implementation-continuation. Chosen: implementation-continuation — the user said "계획하고 실행" and licensed breaking changes. single-point: mode is a shaping-time intent, not a system axis.
- External side-effect scope: local-only / push / push+release. Chosen: push+release (user-selected). axis: phase-scoped external-side-effect axis; approval binds only the final bundle.
- Breaking-change inclusion: include the `workbench` rename / non-breaking only. Chosen: include (user-selected). single-point: the user opened the deliberate breaking-rename moment explicitly.
- Version family: patch / minor / major. Chosen provisional: minor `0.20.0` because a breaking consumer-facing schema rename lands (pre-1.0 breaking = minor); the release planner and critique reconfirm before mutation. Rejected: patch understates the break, major is unwarranted pre-1.0.
- Backlog selection: full ranked backlog vs counterweight-pruned. Chosen: counterweight-pruned to must-fix + cheap-ride-along + the one user-licensed breaking rename. Rejected: the false-proof refresh, the fake-generalization judge, the latent-only YAGNI hardening, low-value breaking churn, and decision-needed items — all recorded in Non-Goals.

## Plan Critique Findings

Blockers folded into Boundaries/Verification/Slice Plan, over-worry raised but
not folded, and reviewer provenance.

- Folded (from the discovery counterweight): excluded `claims:refresh:all` (false-proof), the fixture-replay judge (fake generalization), and YAML/sync-skill hardening (latent-only YAGNI) — now Non-Goals; these were the counterweight's "manufacturing green proof" and "tidiness reflex" bins.
- Reclassified: the backlog marked `git_hooks.go` removal `breakingChange:true`, but `internal/` is unimportable by hosts and nothing references it — it is plain dead-code removal, not a breaking change (folded into slice 2 framing).
- Over-worry raised but not folded: the SemVer fix is fully dormant (every shipped tag is plain). Kept anyway because it is a genuine correctness bug on an exported function, tiny, and lands with an honest dormancy non-claim rather than an overstated live-exposure claim.
- Standing hazard folded: the breaking rename is a multi-file cascade touching golden test strings — it gets a dedicated parent-delegated slice critique plus the final release critique, and all golden/doc references move in the same slice (per the "move the asserting gate with the doc" pattern).
- Reviewer provenance: discovery workflow `wf_a739e366-382` — six `general-purpose` read-only scouts, one synthesis lens, one counterweight lens; the counterweight's evidence claims (dormant tags, no symlinks/binaries in the skill tree, `git_hooks.go` callerless) will be re-verified in-repo at each slice before acting.

## Off-Goal Findings

Issues or deferred findings discovered during the run.

- none yet.

## Final Verification

Closeout evidence — replace each `TODO` with a bound `<path>` (a checked-in
retro / host-log probe / disposition-review artifact) or an explicit
`skipped: <allowed-reason>: <detail>`. The complete gate rejects a literal
`TODO` / `<path>` / `TBD` until you do.

Retro: TODO — create or explicitly skip with an allowed reason before complete
Host log probe: TODO — create or explicitly skip with an allowed reason before complete
Disposition review: TODO — create or explicitly skip only when policy allows before complete

## User Verification Instructions

- Open the release tag `v0.20.0` on GitHub and confirm the seven assets and checksums.
- Re-run the standard install script and check `cautilus --version` returns `0.20.0`.
- Emit a `discover live-targets` command_template packet with the old `cautilus.workbench_instance_catalog.v1` schema and confirm it is rejected with an actionable rename error; re-emit with `cautilus.live_target_catalog.v1` and confirm it validates.
- For rollback, run the installer with `CAUTILUS_VERSION=v0.19.4` and verify the resulting version.

## Auto-Retro

Retro dispositions: TODO — disposition every surfaced improvement, or record the explicit no-improvement opt-out
Structural follow-up: TODO — when the retro names a transferable waste item (a `## Sibling Search` trigger), classify its structural destination (`applied: <gate/hook/validator/test/contract change>` / `issue #N (recurs:|novel: <reason>)` / `repo-local guard: <path>` / `none — <reason>`); delete this line when no transferable waste was named
