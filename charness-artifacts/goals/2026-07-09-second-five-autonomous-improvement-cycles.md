# Achieve Goal: Second Five Autonomous Improvement Cycles

Status: active
Created: 2026-07-09
Activation: `/goal @charness-artifacts/goals/2026-07-09-second-five-autonomous-improvement-cycles.md`

This file is the living goal scratchpad for the second user-requested autonomous run.
The current host goal is already active for this artifact.

## Active Operating Frame

- Current slice: Cycle 3 — expose cross-cutting sample claim IDs in evidence-state Markdown.
- Current slice intent: make the human-readable evidence-state projection show the bounded sample IDs already preserved in JSON.
- Next action: update `render-claim-evidence-state` Markdown and focused tests, regenerate checked-in evidence-state projection if needed.
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

Run a second set of five autonomous Cautilus improvement cycles.
Each cycle should be locally decidable, scoped to the product boundary, verified with the strongest reasonable local checks, reviewed with bounded fresh-eye critique when it completes repo work, and committed before moving to the next cycle.

## Non-Goals

- Do not publish, push, run remote CI, cut releases, or change release versions.
- Do not introduce host-specific adapter behavior into generic Cautilus contracts.
- Do not claim live/product-runner proof from local deterministic checks.
- Do not change `skills/cautilus-agent/` or packaged plugin surfaces unless a cycle explicitly freezes consumer intent and runs the required quality path.
- Do not reopen broad roadmap architecture when a smaller validator, fixture, packet, or test improvement can move the product safely.

## Boundaries

- External side-effect scope: name which phase or bundle any approved
  publish / push / remote-CI / apply applies to. That approval is phase-scoped
  and does not carry forward — after an approved publish/CI/apply lane
  completes, done-early test-only quality continuation is local by default
  (batch remote proof, run CI once over the final bundled state). Per-slice
  remote publication is assumed only when the operator explicitly asks or a
  runtime-affecting slice requires earlier publication.
- Local-only scope: all five cycles should complete through checked-in code, tests, docs, generated packets, and Charness artifacts.
- Commit scope: each successful cycle gets its own scoped commit before the next cycle starts.
- Critique scope: task-completing code/config/doc cycles get bounded fresh-eye critique scaled to the slice.
- Direction scope: prefer the roadmap's below-apex hardening, packet-first proof, claim/eval/improve quality, and CLI plus Cautilus Agent product surface.

## User Acceptance

- `git log --oneline -5` shows five new scoped improvement commits from this second run, unless a cycle is explicitly closed as no-op/defer with a committed artifact explaining why.
- `npm run verify` and `npm run hooks:check` pass at final closeout.
- The goal artifact records the five slices, their verification evidence, critique status, and residual non-claims.

## Agent Verification Plan

### Low-Cost Checks

- Per-cycle focused unit/spec tests for touched surfaces.
- `npm run lint:eslint` when Node scripts change.
- Narrow check-mode commands for generated packets when claim or status artifacts move.
- `git diff --check` before each commit.

### High-Confidence Checks

- `npm run verify` at final bundle boundary and earlier when a cycle changes shared gates or generated artifacts.
- `npm run hooks:check` at final closeout.
- `npm run generated:drift:check` after generated-packet or report changes.
- Goal and retro validators before completing the run.

### External Or Live Proof

- skipped: local-only run — user asked for autonomous improvement cycles, not publish/push/live product proof.

## Slice Plan

| Slice | Objective | Why Now | Expected Evidence | Status |
| --- | --- | --- | --- | --- |
| 1 | Expand generated drift coverage for specdown projection outputs. | Start by making the pre-push guard cover generated files verify already checks. | Focused tests, critique, commit. | complete |
| 2 | Harden claim status report summary consistency. | Prevent stale status snapshots from silently shaping the status report scoreboard. | Focused tests, critique, commit. | complete |
| 3 | Show cross-cutting signal sample IDs in evidence-state Markdown. | JSON already preserves sample IDs, but the human projection omits them. | Focused tests, generated projection check, critique, commit. | in-progress |
| 4 | Improve operator/agent auditability on a narrow surface. | Keep product surfaces packet-first and human-auditable. | Focused tests/docs as needed, critique, commit. | pending |
| 5 | Close with a final small hardening slice and broad bundle verification. | Finish with useful code plus final proof. | Focused tests, fresh-eye review, `npm run verify`, `npm run hooks:check`, goal closeout, commit. | pending |

## Operator Decision Queue

- none — this run has no operator-only decisions at activation.
  External side effects are out of scope.

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

Routing: find-skills -> achieve, impl, critique, quality, retro — user requested another multi-cycle autonomous implementation run with per-slice review, quality gates, and closeout retro tracking.

## Discuss Before Activation

A Before-phase summary of any consequential activation decision — surfaced from
the Non-Goals / Boundaries / Verification / Interview / Critique sections — that
must be resolved before `/goal`. Required only when a trigger fires (live/prod
proof, issue close/split, broad scope, irreversible side effect, or a
proof-level non-claim); replace the `fill` line below, or delete it when none
applies.

- Discuss before activation: resolved — the broad scope is constrained to five local, committed cycles with no external side effects or live-proof claims.

## Slice Log

### Slice 1: Cycle 1 — Specdown Generated Drift Coverage

- Objective: Expand generated artifact drift guard coverage to include specdown projection outputs.
- Why this approach: Verify already checks the specdown inventory, projected claim state, and promise ledger, but the post-verify generated drift guard did not watch those tracked generated outputs.
- Commits:
- What changed: Added .cautilus/specdown/claim-inventory.json, docs/specs/generated/projected-claim-state.md, and docs/specs/generated/promise-ledger.spec.md to DEFAULT_GENERATED_ARTIFACTS; made the test fixture derive parent directories from the default list; added a dirty projected-claim-state test.
- Alternatives rejected: Rejected broad generated-file globbing because the current explicit list keeps the push guard auditable and avoids sweeping historical claim evidence packets into the default path set.
- Targeted verification: node --test scripts/check-generated-artifact-drift.test.mjs; npm run generated:drift:check; npm run lint:eslint; validate_debug_artifact.py --repo-root .
- Test duplication pressure: Added one targeted fixture test and made fixture setup list-derived; no duplicate broad test added.
- Critique: Fresh-eye review 019f46ee-d1d2-7433-a117-6c548128fb6d: OK, no findings.
- Off-goal findings: none
- Lessons carried forward: When a generated artifact list grows, fixture setup must derive directories from the same list instead of encoding a second directory checklist.
- Metrics:

### Slice 2: Cycle 2 — Claim Status Summary Consistency

- Objective: Harden the claim status report against mismatched status packet claim summaries.
- Why this approach: The status report calls itself a projection over the current claim packet and status summary; an explicit stale statusPacket.claimSummary should fail instead of silently shaping the scoreboard.
- Commits:
- What changed: Added claimSummary consistency assertion; made nested statusPacket.claimSummary take precedence over legacy top-level status counts when present; added matching, divergent, and mixed-shape focused tests.
- Alternatives rejected: Rejected removing legacy top-level count fallback because older status packet shapes remain useful compatibility input when no nested claimSummary exists.
- Targeted verification: node --test scripts/agent-runtime/render-claim-status-report.test.mjs; npm run claims:status-report:check; npm run claims:evidence-state:check; npm run lint:eslint; git diff --check
- Test duplication pressure: Added two focused tests and strengthened one mixed-shape assertion to protect precedence without broad fixture duplication.
- Critique: Fresh-eye review 019f46f2-fa86-7a42-ac3b-1d31dc60b640: SHOULD-FIX on summary precedence; fixed and re-review OK.
- Off-goal findings: none
- Lessons carried forward: When a packet field is validated as source-of-truth, rendering precedence must prefer that validated field over compatibility fallbacks.
- Metrics:

## Context Sources

Durable references this goal was shaped from. A fresh session can reconstruct
the originating context by following them in order.

- `AGENTS.md`
- `README.md`
- `docs/master-plan.md`
- `CLAUDE.md`
- `charness-artifacts/goals/2026-07-09-five-autonomous-improvement-cycles.md`

## Interview Decisions

For each Before-phase question: family of options considered, chosen value, and
rejected-alternatives reason. Applies the anti-anchoring lesson to the artifact
itself so a fresh session sees the design space, not only the closed point.

- Run shape: chosen: five more local improvement cycles; rejected: one broad refactor, because commit-scoped proof is easier to audit.
- Proof boundary: chosen: local deterministic proof plus final broad repo gates; rejected: push/release/live proof, because the user asked for autonomous local improvement.
- Surface choice: chosen: code/tests/packets under Cautilus product boundaries; rejected: host-specific adapter behavior.
- Continuation policy: chosen: proceed autonomously through slice boundaries unless a policy, external side effect, or evidence conflict blocks safe progress.

## Plan Critique Findings

Blockers folded into Boundaries/Verification/Slice Plan, over-worry raised but
not folded, and reviewer provenance. Preserves reasoning so a fresh session
re-verifies the folded revisions without re-running critique.

- Folded: each cycle must produce either a scoped commit or an explicit committed no-op/defer artifact.
- Folded: final closeout must separate local proof from skipped live/product proof.
- Over-worry: requiring a new product concept for each cycle would fight the repo's preference for small bounded runtimes and validators.

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
