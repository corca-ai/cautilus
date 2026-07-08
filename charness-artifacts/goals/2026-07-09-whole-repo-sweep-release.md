# Achieve Goal: Whole repo sweep and release

Status: complete
Created: 2026-07-09
Activation: `/goal @charness-artifacts/goals/2026-07-09-whole-repo-sweep-release.md`

This file is the living goal scratchpad.
It is active because the user explicitly requested an autonomous sweep plus release push in this session.

## Active Operating Frame

- Current slice: Completed release closeout.
- Current slice intent: Record final public proof and close the sweep goal without moving the published tag.
- Next action: none — final public release proof and install readback are complete.
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

Sweep the Cautilus repo for high-value bugs and autonomous code quality improvements.
Prioritize speed-sensitive fixes and release-readiness issues over speculative refactors.
Verify the resulting release candidate and carry it through the repo-owned release path when the local evidence supports it.

## Non-Goals

- Do not start a dormant roadmap track merely because it is listed in handoff or master-plan.
- Do not rewrite broad docs or product direction unless a discovered bug or release blocker requires it.
- Do not import consumer-specific adapters, prompts, paths, or audit UI into the generic Cautilus product surface.
- Do not claim public release verification until the repo-owned release workflow and distinct-channel readback prove it.
- Do not hand-edit generated release manifests or package copies when a sync helper owns them.

## Boundaries

- Work only from repo-owned evidence: quality planner packets, deterministic gates, release planner output, checked-in docs, and local git history.
- Preserve existing unpushed commits; this branch is already ahead of `origin/main` and those commits are part of the release candidate unless a later check proves otherwise.
- External side-effect scope: the user requested push release after completion, so release push/tag publication is in scope only after final local verification and release-planner checks.
- If final release tooling needs a version choice, credential action, or distinct-channel proof unavailable locally, record the operator decision instead of fabricating completion.

## User Acceptance

The user can inspect the goal artifact, quality/release artifacts, commits, and final git state.
For a completed release, the user can open the published release/tag URL and compare it with the final commit reported here.

## Agent Verification Plan

### Low-Cost Checks

- `git status --short --branch`
- `rg --files .`
- `npm run lint` or narrower lint commands while iterating.
- Focused unit tests for any edited runtime or script surface.

### High-Confidence Checks

- `npm run verify`
- `npm run hooks:check`
- Repo-owned release planner or release smoke checks before mutation.
- Quality artifact validation when the quality workflow records findings.

### External Or Live Proof

- Git push, tag push, remote CI, and public release URL readback only after local verification.
- If a public release is cut, record the release artifact and distinct-channel verification.

## Slice Plan

| Slice | Objective | Why Now | Expected Evidence | Status |
| --- | --- | --- | --- | --- |
| 1 | Inventory current repo state, quality plan, and existing gates | Avoid guessing where bugs are and respect speed | quality planner output, gate list, initial status | completed |
| 2 | Investigate concrete failures or high-signal advisories | Repo rule requires debug before bug fixes | debug artifact or explicit no-bug classification | completed |
| 3 | Implement smallest high-value fixes | Keep release candidate tight | focused diffs, targeted tests | completed |
| 4 | Run final verification and release planner | Prove the candidate before remote mutation | `npm run verify`, `npm run hooks:check`, release artifact | completed |
| 5 | Push release through repo-owned path | User requested release push after completion | tag/branch push, CI/release readback, public URL when available | completed |

## Operator Decision Queue

none — the user explicitly authorized autonomous fixes and release push, and repo-owned release tooling provided the remaining external proof boundaries.

## Coordination Cues

- `Routing: find-skills -> achieve + quality + debug/impl/release as needed — broad autonomous sweep requires a goal artifact, quality planner evidence, disciplined bug investigation before fixes, and repo-owned release handling`
Gather: n/a — no external source has been introduced for this sweep.

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

- `Routing: find-skills -> <skill> — <why this phase needs it>`
- Routing: find-skills -> achieve + impl + quality + debug + release + retro — the sweep needed goal lifecycle control, implementation edits, quality inventory, disciplined bug investigation, repo-owned release handling, and final session closeout.
- Release: charness-artifacts/release/latest.md — v0.18.3 prepared, published, publicly verified, and install-read back.

## Discuss Before Activation

A Before-phase summary of any consequential activation decision — surfaced from
the Non-Goals / Boundaries / Verification / Interview / Critique sections — that
must be resolved before `/goal`. Required only when a trigger fires (live/prod
proof, issue close/split, broad scope, irreversible side effect, or a
proof-level non-claim); replace the `fill` line below, or delete it when none
applies.

- Discuss before activation: resolved — the user explicitly requested autonomous local fixes and release push; release push still depends on repo-owned release checks and honest public proof.

## Slice Log

### Slice 1: Fix release-readiness startup probes

- Objective: Repair stale quality startup probes and Cautilus Agent command-discovery guidance discovered by the whole-repo quality sweep.
- Why this approach: the sweep found a concrete release-readiness failure rather than a speculative refactor target.
- Commits: `b490f88f` Repair release readiness probes.
- What changed: `.agents/quality-adapter.yaml` now probes `doctor binary`, `doctor commands`, and `discover scenarios`; repo-local, source, and packaged Cautilus Agent guidance now points at `doctor commands`.
- Alternatives rejected: keeping compatibility with removed top-level aliases would preserve stale guidance and weaken the startup probe.
- Targeted verification: measure_startup_probes.py --repo-root . --json passed; npm run lint:skill-disclosure passed; validate_debug_artifact.py passed; npm run verify passed; npm run hooks:check passed.
- Test duplication pressure: no new duplicate fixture was needed because the existing startup probe gate owns this behavior.
- Critique: subagent quality review found stale startup probes and stale release proof; the probe finding was fixed before release.
- Off-goal findings: quality inventory showed `lint · specs` as the largest current runtime, but it remained inside budget.
- Lessons carried forward: stale command guidance belongs in deterministic startup probes and release publisher checks, not release prose.
- Metrics: post-fix `npm run verify` passed in 43.80s before the version bump.

### Slice 2: Prepare and publish v0.18.3

- Objective: Prepare and publish the smallest release carrying the release-readiness fix.
- Why this approach: the user requested a release push after the sweep, and local proof supported a patch release.
- Commits: `97042dd9` Prepare v0.18.3 release.
- What changed: version surfaces moved to `0.18.3`, claim state was refreshed, release critique proof was recorded, and the release narrative was rewritten for the patch scope.
- Alternatives rejected: using the generic Charness publisher was rejected because this repo's handoff records that path as incompatible; moving forward without claim refresh was rejected because release preparation caught stale claim state.
- Targeted verification: `npm run verify`, `npm run hooks:check`, `npm run security:secrets:history`, `npm run release:publisher-policy:check`, `npm run test:on-demand`, `npm run generated:drift:check`, and release publish dry-run passed.
- Test duplication pressure: no additional runtime test was needed because the changed surfaces are release metadata and generated claim proof.
- Critique: release subagent blocked until the release was prepared, worktree clean, and narrative aligned; all three were resolved before publish.
- Off-goal findings: none that required a new issue.
- Lessons carried forward: release public proof should stay pending until the tag workflow and install readback prove it.
- Metrics: post-bump `npm run verify` passed in 49.36s.

### Slice 3: Close public release proof

- Objective: Verify the published public release and record post-publish proof without moving the release tag.
- Why this approach: the tag-triggered workflow owns public release publication, while the checked-in release artifact owns durable operator evidence.
- Commits: post-release proof commit `Record v0.18.3 public release proof`.
- What changed: release and goal artifacts now record the successful workflow, public release verifier, install-sh readback, retro, and disposition review.
- Alternatives rejected: moving the release tag was rejected because `v0.18.3` already points at the prepared release commit and public assets are published from it.
- Targeted verification: GitHub Actions run `28981602710` succeeded; `verify-public-release` passed locally; `release:smoke-install:current -- --skip-update --json` passed.
- Test duplication pressure: no new duplicate test was needed because this slice records external proof.
- Critique: final disposition review is recorded at `charness-artifacts/critique/2026-07-09-whole-repo-sweep-release-disposition-review.md`.
- Off-goal findings: none.
- Lessons carried forward: post-tag artifact updates should be pushed to `main` without retagging.
- Metrics: release workflow `release-artifacts` passed in 4m13s and workflow `verify-public-release` passed in 12s.

## Context Sources

Durable references this goal was shaped from. A fresh session can reconstruct
the originating context by following them in order.

- User request: "전체 스윕하며 버그 찾고 코드 자율 개선. 속도도 언제나 신경쓸 것. 다 끝나면 푸시 릴리즈"
- `README.md`
- `docs/master-plan.md`
- `CLAUDE.md`
- `docs/internal/handoff.md`
- `charness-artifacts/find-skills/latest.md`

## Interview Decisions

For each Before-phase question: family of options considered, chosen value, and
rejected-alternatives reason. Applies the anti-anchoring lesson to the artifact
itself so a fresh session sees the design space, not only the closed point.

- Scope family: dormant roadmap track vs whole-repo bug/performance sweep vs artifact-only planning.
Chosen: whole-repo bug/performance sweep, because the user gave an explicit execution request.
Rejected alternatives: dormant roadmap track would violate handoff's "automatic track start forbidden"; artifact-only planning would not satisfy "코드 자율 개선".
- Release family: local-only prep vs push/tag/public release.
Chosen: proceed toward release push after local proof, because the user explicitly requested it.
Rejected alternatives: immediate push before checks would violate release discipline.

## Plan Critique Findings

Blockers folded into Boundaries/Verification/Slice Plan, over-worry raised but
not folded, and reviewer provenance. Preserves reasoning so a fresh session
re-verifies the folded revisions without re-running critique.

- Same-agent preflight: broad sweeps can become low-yield churn, so the slice plan limits edits to gate failures, concrete bugs, speed-sensitive improvements, and release blockers.
- Same-agent preflight: current branch is already ahead of `origin/main` by 17 commits, so release work must preserve and verify accumulated local state rather than assuming a clean baseline.

## Off-Goal Findings

Issues or deferred findings discovered during the run.

## Final Verification

Closeout evidence — replace each `TODO` with a bound `<path>` (a checked-in
retro / host-log probe / disposition-review artifact) or an explicit
`skipped: <allowed-reason>: <detail>`. The complete gate rejects a literal
`TODO` / `<path>` / `TBD` until you do.

Retro: charness-artifacts/retro/2026-07-09-session-retro.md
Host log probe: skipped: host-log-not-exposed: current host session logs are not exposed through a scoped immutable artifact for this goal, and no token or host-efficiency claim depends on them.
Disposition review: charness-artifacts/critique/2026-07-09-whole-repo-sweep-release-disposition-review.md

## User Verification Instructions

- Inspect the published release at `https://github.com/corca-ai/cautilus/releases/tag/v0.18.3`.
- Confirm `v0.18.3` points at release commit `97042dd964980898182d3c7c57f299e4de3c6dcb`.
- Confirm `origin/main` contains the post-release proof commit after this closeout is pushed.
- Re-run `node ./scripts/release/verify-public-release.mjs --version v0.18.3 --json` for public asset proof.
- Re-run `npm run release:smoke-install:current -- --skip-update --json` for install-sh readback.

## Auto-Retro

Retro dispositions: applied: repaired stale startup probes, aligned Cautilus Agent guidance, published `v0.18.3`, and recorded public release plus install readback proof.
Structural follow-up: none — the retro found no transferable sibling pattern beyond this repo's existing release publisher policy gate and handoff reminder.
