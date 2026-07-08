# Achieve Goal: Whole repo sweep and release

Status: active
Created: 2026-07-09
Activation: `/goal @charness-artifacts/goals/2026-07-09-whole-repo-sweep-release.md`

This file is the living goal scratchpad.
It is active because the user explicitly requested an autonomous sweep plus release push in this session.

## Active Operating Frame

- Current slice: Inventory whole-repo quality signals and release readiness.
- Current slice intent: Identify high-value bug, performance, stale-proof, and release-blocking issues without widening beyond Cautilus's standalone CLI plus Cautilus Agent product boundary.
- Next action: run the `quality` planner and repo gates, inspect failures or strong advisory signals, then route any concrete bug through `debug` before editing.
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
| 1 | Inventory current repo state, quality plan, and existing gates | Avoid guessing where bugs are and respect speed | quality planner output, gate list, initial status | active |
| 2 | Investigate concrete failures or high-signal advisories | Repo rule requires debug before bug fixes | debug artifact or explicit no-bug classification | pending |
| 3 | Implement smallest high-value fixes | Keep release candidate tight | focused diffs, targeted tests | pending |
| 4 | Run final verification and release planner | Prove the candidate before remote mutation | `npm run verify`, `npm run hooks:check`, release artifact | pending |
| 5 | Push release through repo-owned path | User requested release push after completion | tag/branch push, CI/release readback, public URL when available | pending |

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
- Why this approach:
- Commits:
- What changed:
- Alternatives rejected:
- Targeted verification: measure_startup_probes.py --repo-root . --json passed; npm run lint:skill-disclosure passed; validate_debug_artifact.py passed; npm run verify passed; npm run hooks:check passed.
- Test duplication pressure:
- Critique:
- Off-goal findings:
- Lessons carried forward:
- Metrics:

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

Retro: TODO — create or explicitly skip with an allowed reason before complete
Host log probe: TODO — create or explicitly skip with an allowed reason before complete
Disposition review: TODO — create or explicitly skip only when policy allows before complete

## User Verification Instructions

## Auto-Retro

Retro dispositions: TODO — disposition every surfaced improvement, or record the explicit no-improvement opt-out
Structural follow-up: TODO — when the retro names a transferable waste item (a `## Sibling Search` trigger), classify its structural destination (`applied: <gate/hook/validator/test/contract change>` / `issue #N (recurs:|novel: <reason>)` / `repo-local guard: <path>` / `none — <reason>`); delete this line when no transferable waste was named
