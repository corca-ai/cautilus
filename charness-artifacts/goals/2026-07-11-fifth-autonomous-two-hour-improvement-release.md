# Achieve Goal: Fifth autonomous two-hour Cautilus improvement and release

Status: active
Created: 2026-07-11
Activation: `/goal @charness-artifacts/goals/2026-07-11-fifth-autonomous-two-hour-improvement-release.md`
Timebox: 2h
Activation time: 2026-07-11T22:01:28+09:00
Closeout reserve: 25m
Done-early policy: continue_next_improvement

This file is the living goal scratchpad.
The user's explicit request activates implementation, push, and release pursuit after the shaped-goal gate passes.

## Active Operating Frame

- Current slice: current-quality inventory and fresh-eye candidate triage.
- Current slice intent: select the next reproduced correctness, runtime-economics, or maintainability seam without reopening policy debt by inertia.
- Next action: run focused inventories and reproductions, then lock the first bounded implementation slice.
- Verification cadence: cheap deterministic checks at commit boundaries;
  higher-cost or fresh-eye proof at slice boundaries; final broad/live proof at
  closeout.
- Gate cadence: focused owner checks at commit boundaries; `npm run verify`, on-demand release checks, and public proof at the final bundle boundary.
- Slice review packet: before fresh-eye slice critique, provide intent, changed
  files and owning/generated surfaces, expected invariants, tests/proof,
  non-claims, out-of-scope lines, and reviewer questions.
- History boundary: keep this frame current; move completed detail to
  `## Slice Log`, `## Operator Decision Queue`, `## Final Verification`,
  and `## Auto-Retro`.

## Goal

Use the two-hour budget to land multiple evidence-backed improvements across bug correctness, test/runtime economics, and code quality, then publish and distinctly verify the lightest honest release containing all accumulated local commits.

## Non-Goals

- Do not weaken isolation, proof depth, coverage, security, or release checks to improve timings.
- Do not reopen the 47 historical claim-evidence warnings, dominant specdown optimization, dormant roadmap capabilities, or release-note redesign without new current evidence.
- Do not introduce speculative abstractions, broad mechanical refactors, or coverage-only tests.
- Do not claim provider/live evaluator behavior unless a selected change actually crosses that boundary and the configured proof can exhibit it.

## Boundaries

- External side-effect scope: name which phase or bundle any approved
  publish / push / remote-CI / apply applies to. That approval is phase-scoped
  and does not carry forward — after an approved publish/CI/apply lane
  completes, done-early test-only quality continuation is local by default
  (batch remote proof, run CI once over the final bundled state). Per-slice
  remote publication is assumed only when the operator explicitly asks or a
  runtime-affecting slice requires earlier publication.
- The user's request explicitly authorizes one final branch push, patch tag, GitHub release, configured workflow/public verification, and adapter-owned post-publish install refresh for the completed bundle.
- Intermediate slices stay local; no per-slice push, tag, or remote CI run is authorized.
- Bug fixes require a falsifiable reproduction and `charness:debug` diagnosis before repair.
- Release mutation waits for deterministic surface packet checks and a standalone delegated critique artifact.
- If public release verification fails after irreversible publication, record the exact public state and continue safe recovery rather than claiming completion.

## User Acceptance

The user can inspect multiple scoped commits, see before/after runtime evidence and reproduced failure paths, open the public release, verify the tag and assets, and follow evergreen update instructions.

## Agent Verification Plan

### Low-Cost Checks

- Quality planner, focused structural/test-economics inventories, owner-package tests, eslint, coverage floors, and artifact validators.
- Duplicate-pressure sampling whenever tests expand or move.

### High-Confidence Checks

- Parent-delegated fresh-eye review for candidate triage, meaningful slices, and final bundle disposition.
- `bash .githooks/pre-push`, `npm run hooks:check`, `npm run test:on-demand`, release surface packet, secret history scan, and publish dry-run.

### External Or Live Proof

- Push the final branch and patch tag only after local proof and critique pass.
- Verify workflow completion, public release visibility, assets/checksums/attestation, fresh-checkout probes, distinct-channel readback, and configured install refresh.

## Slice Plan

| Slice | Objective | Why Now | Expected Evidence | Status |
| --- | --- | --- | --- | --- |
| 1 | Inventory current correctness, runtime economics, maintainability, and release risk | Avoid anchoring on the previous pass | quality packets, current release state, delegated triage | in progress |
| 2 | Land the highest-value reproduced bounded improvements | Convert current evidence into product reliability and faster feedback | debug artifacts, focused tests, scoped commits | pending |
| 3 | Prepare and critique patch release `0.19.3` | Accumulated changes are compatible bug and validation repairs | synced surfaces, surface packet, critique artifact, dry-run | pending |
| 4 | Push, publish, and distinctly verify the release | User explicitly requested remote completion | branch/tag, workflow, public assets, install/readback evidence | pending |
| 5 | Final quality, retro, handoff, and goal closeout | Preserve honest proof and remaining risks | broad gates, durable artifacts, clean synchronized state | pending |

## Operator Decision Queue

none currently — push, tag, release, configured public verification, and maintainer install refresh are explicitly authorized for the final bundle.

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

- Routing: find-skills -> quality + achieve + debug/impl + release — this timeboxed run needs evidence-ranked selection, disciplined repair, auditable lifecycle, and irreversible-boundary proof.
- Gather: n/a — no external source is needed before the configured release backend performs public readback.
- Issue closeout: n/a — no tracked issue is the source or carrier for this goal.

## Discuss Before Activation

A Before-phase summary of any consequential activation decision — surfaced from
the Non-Goals / Boundaries / Verification / Interview / Critique sections — that
must be resolved before `/goal`. Required only when a trigger fires (live/prod
proof, issue close/split, broad scope, irreversible side effect, or a
proof-level non-claim); replace the `fill` line below, or delete it when none
applies.

- Discuss before activation: resolved — the user explicitly approved a final push and release; patch-level publication, configured public proof, and adapter-owned install refresh apply only to the completed bundle.

## Slice Log

### 2026-07-11T22:24+09:00 — sanitize deployment semantic failures

- Delegated triage and independent real-process reproduction showed syntactically valid but contract-invalid packets emitted source excerpts, five stack frames, Node version text, and internal absolute paths from both deployment executables.
- Added one semantic-invalid process case per executable alongside existing valid, malformed-value, and syntax-invalid cases; both failed against old code.
- Wrapped the full build/read/write main body at each executable boundary and retained rich library errors while rendering only `error.message` to CLI stderr.
- Initial delegated review found path-controlled newlines could split caught write errors; final renderers now collapse CR/LF while retaining useful path text.
- Both focused process suites pass ten cases, eslint passes, and invalid runs create no output file.
- Test pressure: four cases extend executable-owned files without adding a new process file or duplicating valid fixtures.
- Non-claims: no structured stderr schema, library error redesign, or host-terminal redaction guarantee.
- Parent-delegated re-review returned PASS after newline sanitation, with a clean rail-1 boundary verify and no remaining actionable finding.
- Full coverage and floor checks passed; both materially exercised executable floors were promoted to policy-buffered observed values.
- Pending: scoped commit.

### 2026-07-11T22:13+09:00 — fail-closed scenario input parity

- Delegated quality triage reproduced Go success versus JavaScript failure for malformed scenario registry/coverage input.
- Direct old-code tables confirmed both Go final builders accepted non-array, null, non-object, empty-key, non-numeric, and negative coverage shapes; JavaScript additionally coerced numeric strings despite the documented number-only contract.
- Replaced permissive reader behavior with indexed errors, kept missing-field compatibility, rejected explicit null at scenario call sites without changing generic `assertArray`, and tightened JavaScript numeric typing.
- Focused Go tests cover both proposal and conversation-review consumers; JavaScript schema tests and eslint pass.
- Test pressure: one Go table and one JavaScript table reuse existing owner files and shared fixtures; no new process test file or broad discovery path was added.
- Non-claims: no schema expansion, provider behavior, historical packet migration, or repo-wide array coercion change.
- Parent-delegated high-leverage re-review initially found explicit-null parity, then returned PASS after the call-site fix; rail-1 boundary verification was clean.
- Full coverage and floor checks passed, and focused Go race passed; materially exercised proposal, conversation-review, and JavaScript producer floors were promoted to the policy-buffered observed values.
- Pending: scoped commit.

## Context Sources

Durable references this goal was shaped from. A fresh session can reconstruct
the originating context by following them in order.

- `AGENTS.md`, `README.md`, `docs/master-plan.md`, and `CLAUDE.md` for product and operating boundaries.
- `docs/internal/handoff.md`, `charness-artifacts/quality/latest.md`, and `charness-artifacts/release/latest.md` for current quality and public-release state.
- `charness-artifacts/goals/2026-07-11-fourth-autonomous-two-hour-improvement.md` and its retro for the immediately preceding local bundle and repeat-trap controls.
- `charness-artifacts/debug/2026-07-11-fresh-eye-fingerprint-installed-layout.md` for the installed reviewer-boundary helper workaround.

## Interview Decisions

For each Before-phase question: family of options considered, chosen value, and
rejected-alternatives reason. Applies the anti-anchoring lesson to the artifact
itself so a fresh session sees the design space, not only the closed point.

- Mode family: artifact-only versus implementation continuation.
  Chosen: implementation continuation because the user explicitly requested two hours of work and publication.
  Rejected: planning-only would strand the requested outcome.
- Version family: patch, minor, or major.
  Chosen: provisional patch `0.19.3` because the accumulated work repairs existing validation and failure semantics without adding or breaking a public surface; the release planner and critique must reconfirm before mutation.
  Rejected: minor and major would overstate compatible repairs.
- Publication family: per-slice versus final bundled publication.
  Chosen: one final bundled push/release so remote proof applies to the exact reviewed tree.
  Rejected: per-slice publication would add irreversible churn and duplicate CI without increasing confidence.
- Axis probe: native macOS/Linux and CLI/Agent remain declared product axes; provider/live evaluator and host-global PATH state remain separate proof axes unless triggered by changed surfaces.

## Plan Critique Findings

Blockers folded into Boundaries/Verification/Slice Plan, over-worry raised but
not folded, and reviewer provenance. Preserves reasoning so a fresh session
re-verifies the folded revisions without re-running critique.

- Same-agent preflight: repeated autonomous passes can polish remembered seams; current inventories and delegated triage must precede fixes.
- Same-agent preflight: release approval does not turn tag push into proof; distinct public visibility, asset, fresh-checkout, and install readbacks remain required.
- Counterweight: patch is the lightest honest provisional bump, but the release critique may raise it only if a new additive public capability actually lands.
- Required parent-delegated quality reviewer was started under a read-only shared-tree contract after the installed helper workaround produced a clean fingerprint.

## Off-Goal Findings

Issues or deferred findings discovered during the run.

none currently.

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
