# Achieve Goal: Clear the apex Proof Debt: declared -> live-proven on confirmed scenarios

Status: draft
Created: 2026-06-09
Activation: `/goal @charness-artifacts/goals/2026-06-09-clear-proof-debt-live-proven.md`

This file is the living goal scratchpad. It becomes active only when the user
runs the activation command.

## Active Operating Frame

- Current slice: before activation.
- Next action: activate with `/goal @charness-artifacts/goals/2026-06-09-clear-proof-debt-live-proven.md`.
- Timebox: open-ended (no host timebox set); the operator may set one at activation.
- Activation time: set at `/goal` activation.
- Closeout reserve: reserve the final slice for honest badge updates in the apex plus one full `specdown run` + `npm run verify`.
- Done-early policy: continue_next_improvement
- Verification cadence: cheap deterministic checks at commit boundaries;
  live single-spec runs at slice boundaries; final broad/live proof at closeout.
- Slice review packet: before fresh-eye slice critique, provide intent, changed
  files and owning/generated surfaces, expected invariants, tests/proof,
  non-claims, out-of-scope lines, and reviewer questions.
- History boundary: keep this frame current; move completed detail to
  `## Slice Log`, `## Final Verification`, and `## Auto-Retro`.

## Discuss before activation

- **Owner-confirmed scenarios (hard constraint).** Behavior Evaluation and Bounded Improvement can only reach `proven` on scenarios/fixtures the maintainer has explicitly confirmed. Before those slices run, the operator must name the confirmed scenario/fixture per surface (`dev/repo`, `dev/skill`, `app/chat`, `app/prompt`) and per improve target. Do not fabricate one or fall back to the retired 2026-05-03 self-declaring bundles.
- **Live proof cost.** Live `cautilus evaluate` / `cautilus improve` runs build the binary and drive agents (codex/claude); confirm the proof-cost budget and which surfaces are in scope this run.
- **Honesty regression.** If a live run shows a behavior does NOT actually pass, the badge stays `declared`/`promised` and the failure routes to `charness:debug`; never flip a badge to hide a real gap.

## Goal

Move each promise in the apex `docs/specs/index.spec.md` from its current honest-but-weak badge to a live `proven` badge, where `proven` means a checked-in executable spec runs the behavior end-to-end and asserts on the produced packet/file — not a projection of a saved/declared bundle. This is the real dogfood: prove Cautilus's own eval/improve claims with Cautilus, on confirmed scenarios. Each promise that reaches live proof gets its badge updated honestly and its row removed from the apex Proof Debt table.

## Non-Goals

- Building the generator (cautilus-agent generating this apex from `cautilus discover` JSON for any consumer repo). Track separately; not this goal.
- Forcing specdown onto consumer repos. The generic contract stays claim+evidence; specdown is Cautilus-repo's own prover.
- Re-litigating the apex voice/structure (settled this session) or the canonicalization-precision finding (separate backlog).
- Resolving corca-ai/charness#340 (specdown support-skill discoverability) — already filed, out of scope.
- Reaching `proven` on a surface that has no owner-confirmed scenario — stop and report instead.

## Boundaries

- External side-effect scope: name which phase or bundle any approved
  publish / push / remote-CI / apply applies to. That approval is phase-scoped
  and does not carry forward — after an approved publish/CI/apply lane
  completes, done-early test-only quality continuation is local by default
  (batch remote proof, run CI once over the final bundled state). Per-slice
  remote publication is assumed only when the operator explicitly asks or a
  runtime-affecting slice requires earlier publication.
- Proof must be LIVE per the apex "How Proof Works Here" law: run the scenario and assert on the produced packet/file, or stop. Projection of a saved bundle is not an acceptable closing state for a `proven` badge.
- Touch only the named spec pages and the apex badge/Proof-Debt rows; do not restructure the spec tree.
- Push is out of scope for `achieve` itself; the operator pushes.

## User Acceptance

Open `docs/specs/index.spec.md`. Each promise that this goal closed shows `proven`, and following its proof link lands on a spec that, when run with `specdown`, executes the real behavior (a live `cautilus` invocation, not a `jq` over a checked-in `evidence-*.json`). The Proof Debt table contains only items the operator explicitly chose to defer. `npm run lint:specs`, `npm run lint:links`, and a full `specdown run` are green.

## Agent Verification Plan

### Low-Cost Checks

- `npm run lint:specs` and `npm run lint:links` at commit boundaries.
- Per-spec live-vs-projection grep: confirm the touched spec now runs `./bin/cautilus` / `$bin` rather than only `jq`-ing a checked-in `evidence-*.json`.

### High-Confidence Checks

- Run the single touched spec live via `specdown run -filter <heading>` at each slice boundary; confirm it executes the behavior and the assertion is on freshly produced output.

### External Or Live Proof

- Final: full `specdown run` (43+ specs) and `npm run verify` at closeout.
- Host Ownership slice: `npm run consumer:onboard:smoke` wired into the spec.
- Name any proof level not run in the final report; do not claim live proof when only projection ran.

## Slice Plan

| Slice | Objective | Why Now | Expected Evidence | Status |
| --- | --- | --- | --- | --- |
| 1 | Repro + fix the render bug (comment-led `run:` block renders collapsed) | Cheapest; makes the strongest proven promise (Readiness) render trustworthily; unblocks reading specdown output | Minimal specdown repro + fix (likely spec-authoring); render shows adapter YAML | pending |
| 2 | Host Ownership -> proven | Lowest-cost proof win: a live `consumer:onboard:smoke` already exists, just unwired | `ownership.spec.md` runs the smoke live + asserts; badge -> proven | pending |
| 3 | Behavior Evaluation -> proven | Core product claim; highest value; needs owner-confirmed scenario | `evaluation.spec.md` runs live `cautilus evaluate` on a confirmed scenario + asserts | pending (gated by Discuss) |
| 4 | Bounded Improvement -> proven | Differentiated claim; needs held-out confirmed scenario | `improvement.spec.md` runs a live improve loop + asserts | pending (gated by Discuss) |
| 5 | Reviewable Artifacts -> proven | Regenerate packets live instead of projecting | `reviewable-artifacts.spec.md` regenerates + asserts shape | pending |
| 6 | A Testable Agent: author spec | Currently promised/no spec | runner-readiness/verification-backed spec + proof link | pending |
| 7 | Closeout: honest badge + Proof Debt update; full `specdown run` + `verify` | Reserve | apex badges match reality; gates green | pending |

Generative order (Alexander): slices 1–2 are cheap and de-risk confidence; slice 3 is the highest-leverage and the one most likely to surface a real gap, so critique it; later slices follow.

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

## Slice Log

## Context Sources

Durable references this goal was shaped from. A fresh session can reconstruct
the originating context by following them in order.

- `docs/specs/index.spec.md` — the apex with the Proof Debt table this goal clears.
- `charness-artifacts/findings/2026-06-08-canonicalization-precision-root-finding.md` — why the proof felt hollow (the upstream finding).
- `charness-artifacts/debug/debug-2026-06-08-doctor-readiness-adapter-yaml-render.md` — slice 1 parked debug lead.
- `docs/specs/user/{doctor-readiness,claim-discovery,evaluation,improvement,reviewable-artifacts,evidence-gaps,ownership}.spec.md` — the per-promise specs.
- Audit facts (this session): only `doctor-readiness` (28 live markers) and `claim-discovery` (mixed) run live; `evaluation/improvement/reviewable-artifacts/evidence-gaps/ownership` project saved 2026-05-03 bundles; the eval bundle's proof is `proofClass: declared-eval-runner`.
- Issue: corca-ai/charness#340 (specdown support-skill discoverability) — context only, out of scope.

## Interview Decisions

- Scope of "proven": chose live-executable-only (run the behavior + assert) over accepting projected bundles. Rejected accepting projection because the apex's own Evidence Quality law and the session's integrity finding require it; projection of a `declared-eval-runner` bundle does not prove behavior.
- Sequencing: chose cheapest-first / de-risk-first (render bug, Host Ownership) before the hard eval/improve proofs. Rejected hardest-first because cheap wins build confidence and the apex already reads honestly in the meantime.
- Owner-confirmed scenarios: chose to gate eval/improve slices on explicit operator confirmation (Discuss-before-activation) rather than letting the agent pick scenarios. Rejected agent-picks because the maintainer's distrust of unconfirmed scenarios is the originating reason for this goal.

## Plan Critique Findings

To be folded during the run. Pre-activation note: slice 3 (Behavior Evaluation live proof) is the riskiest — converting declared->live may reveal the behavior does not actually pass; it carries a Discuss-before-activation gate and a slice-level critique requirement.

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

To be written at closeout.

## Auto-Retro

Retro dispositions: TODO — disposition every surfaced improvement, or record the explicit no-improvement opt-out
Structural follow-up: TODO — when the retro names a transferable waste item (a `## Sibling Search` trigger), classify its structural destination (`applied: <change>` / `issue #N (recurs:|novel:)` / `repo-local guard: <path>` / `none — <reason>`); delete this line when no transferable waste was named
