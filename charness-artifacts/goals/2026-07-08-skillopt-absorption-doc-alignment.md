# Achieve Goal: Align Cautilus Docs And Design SkillOpt Absorption

Status: draft
Created: 2026-07-08
Activation: `/goal @charness-artifacts/goals/2026-07-08-skillopt-absorption-doc-alignment.md`

This file is the living goal scratchpad. It becomes active only when the user
runs the activation command.

## Active Operating Frame

- Current slice: draft/backlog awaiting activation.
- Current disposition: shaped draft; safe to pursue via `/goal` when the operator wants implementation to begin.
- Current slice intent: align stale living docs with the current proof state, then design the Cautilus-native way to absorb useful SkillOpt and SkillOpt-Sleep patterns.
- Next action: activate with `/goal @charness-artifacts/goals/2026-07-08-skillopt-absorption-doc-alignment.md` after confirming the draft is still intended.
- Verification cadence: cheap deterministic checks at commit boundaries;
  higher-cost or fresh-eye proof at slice boundaries; final broad/live proof at
  closeout.
- Gate cadence: use focused doc/spec/CLI tests while editing contracts; run `npm run lint:specs` when claim/spec source state changes; run `npm run verify` plus `npm run hooks:check` before final closeout unless explicitly waived with evidence.
- Slice review packet: before fresh-eye slice critique, provide intent, changed
  files and owning/generated surfaces, expected invariants, tests/proof,
  non-claims, out-of-scope lines, and reviewer questions.
- History boundary: keep this frame current; move completed detail to
  `## Slice Log`, `## Operator Decision Queue`, `## Final Verification`,
  and `## Auto-Retro`.

## Goal

Align Cautilus's living docs after the current proof-state drift, then design a bounded Cautilus-native absorption plan for the useful SkillOpt and SkillOpt-Sleep patterns without importing raw transcript readers, host-specific plugin shells, or an unbounded nightly optimizer.

## Non-Goals

- Do not port SkillOpt's optimizer, benchmark runners, Python package, WebUI, or plugin shells into Cautilus.
- Do not make Cautilus own raw Claude/Codex transcript readers, private session harvesting, credentialed host storage, or host-specific task mining.
- Do not introduce an always-on nightly self-evolution product surface.
- Do not make consumer prompt, memory, skill, or adapter edits auto-apply.
- Do not expand `improve search` beyond its current one target-file prompt surface in this goal unless a later explicit design decision changes the scope.

## Boundaries

- Product boundary: Cautilus owns generic packets, contracts, normalization helpers, evaluation commands, and agent-facing routing.
- Host boundary: host repos own raw logs, transcript exporters, adapters, prompts, fixtures, storage readers, and acceptance policy.
- SkillOpt absorption boundary: absorb only concepts that strengthen Cautilus's existing `claim` / `eval` / `improve` jobs: session-derived scenario proposal inputs, rejected-candidate evidence, staged adoption evidence, and explicit contamination / held-out safety language.
- Current doc conflict to resolve first: `README.md` still says readiness and claim discovery are proven while behavior evaluation, bounded improvement, reviewable artifacts, host ownership, and a testable agent are not all proven; `docs/specs/index.spec.md` says all seven promises are proven, and `docs/master-plan.md` says Bounded Improvement is proven.
- Directional rule: before changing public product claims, reconcile README, master-plan, apex spec, user spec index, maintainer contract index, and generated proof-state surfaces in the same slice or explicitly record why a surface is left stale.
- External side-effect scope: name which phase or bundle any approved
  publish / push / remote-CI / apply applies to. That approval is phase-scoped
  and does not carry forward — after an approved publish/CI/apply lane
  completes, done-early test-only quality continuation is local by default
  (batch remote proof, run CI once over the final bundled state). Per-slice
  remote publication is assumed only when the operator explicitly asks or a
  runtime-affecting slice requires earlier publication.

## User Acceptance

- Read the updated README/master-plan/spec surfaces and see one consistent proof-state story for Cautilus.
- Read one new or updated contract/design section that says exactly which SkillOpt-derived patterns Cautilus should absorb, which it should reject, and where each accepted pattern lands in the existing command families.
- Inspect tests or executable checks showing that any new or changed packet/schema/normalizer behavior is covered.
- Confirm that the plan stays Cautilus-native: packet-first, agent-first, host-owned raw data, no auto-apply.

## Agent Verification Plan

### Low-Cost Checks

- `git diff --check`
- Focused `npm run lint:specs` when spec or claim source files change.
- Focused Node/Go tests for any changed normalizer, scenario proposal, review feedback, acceptance, or improve-search packet behavior.
- `npm run lint` or narrower package lint when code changes cross the normalizer/runtime boundary.

### High-Confidence Checks

- `npm run verify`
- `npm run hooks:check`
- `npm run claims:refresh:all` if a touched source file makes `.cautilus/claims/latest.json` stale or push/readiness gates report stale claim state.
- Bounded fresh-eye critique before locking a new public contract or changing product promise wording.

### External Or Live Proof

- Not required for the draft/design goal by default.
- Live app-agent proof, remote CI, release publication, GitHub issue closeout, and pushing commits are out of scope unless the operator explicitly activates those lanes during the run.

## Slice Plan

| Slice | Objective | Why Now | Expected Evidence | Status |
| --- | --- | --- | --- | --- |
| 1 | Align Cautilus living docs with current proof state. | The SkillOpt absorption decision should not land on top of stale public claims. | README/master-plan/spec wording agrees on proven/debt state; `npm run lint:specs` or documented substitute. | planned |
| 2 | Write the SkillOpt absorption design contract. | The useful lessons need a Cautilus-native boundary before implementation. | Contract/design doc names accepted patterns, rejected imports, command-family landing zones, packet boundaries, and contamination/safety constraints. | planned |
| 3 | Implement the smallest normalizer/evidence slice if the design chooses one. | A goal should land one executable proof when it adds a new runtime surface. | Fixture/schema/test for session-derived proposal input or rejected-candidate evidence; no raw transcript reader in product. | conditional |
| 4 | Final quality, critique, and closeout. | The user needs an auditable decision and next-step proof, not a private analysis. | `npm run verify`, `npm run hooks:check`, critique disposition, final verification, residual non-claims. | planned |

## Operator Decision Queue

- Decision: whether to allow implementation beyond docs/contracts if Slice 2 identifies a very small packet/normalizer slice.
- Owner: operator.
- Why deferred: the design may be sufficient without code, but the repo rule says a new runtime surface needs executable proof if added.
- Unblock action: answer during Slice 2 review or let the activated run apply the conservative default: implement only docs/contracts unless a minimal executable test is clearly required.
- Revisit trigger: after Slice 2 contract draft is ready.

- Decision: whether any remote publication, GitHub issue closeout, or release surface should be included.
- Owner: operator.
- Why deferred: current request only asks to create the goal; no push/release/issue instruction was given.
- Unblock action: explicit operator approval.
- Revisit trigger: final closeout or if local verification cannot prove the needed state.

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

- `Routing: find-skills -> achieve — user explicitly requested an achieve goal artifact for doc alignment and SkillOpt absorption design`

## Discuss Before Activation

- Discuss before activation: resolved — the draft intentionally does not authorize push, release, issue closeout, raw transcript ingestion, live app proof, or auto-apply; `/goal` activation starts local doc/design work first, and any external boundary must be separately approved.

## Slice Log

## Context Sources

- `AGENTS.md`: Cautilus product boundary, doc language rules, claim-source refresh rule, and the requirement to surface directional conflicts before realigning.
- `README.md`: current public product story and stale proof-state wording observed during shaping.
- `docs/master-plan.md`: current product priority order, including scenario proposal, bounded improvement, acceptance, and external-consumer boundaries.
- `docs/specs/index.spec.md`: apex proof-state source currently saying all seven promises are proven.
- `docs/specs/user/index.spec.md`: user-facing promise SOT.
- `docs/specs/contracts/index.spec.md`: maintainer contract proof route SOT.
- `docs/contracts/improvement-search.md`: current `improve search` boundary and non-goals.
- `docs/contracts/final-acceptance-set.md`: optimizer-untouchable acceptance and contamination guard boundary.
- `docs/contracts/acceptance-risk-tier.md`: adapter-owned risk-tier policy boundary.
- `skills/cautilus-agent/SKILL.md`: Cautilus Agent stable/opt-in surface distinctions.
- `/home/hwidong/codes/SkillOpt/README.md`: SkillOpt product claim and optimizer framing.
- `/home/hwidong/codes/SkillOpt/docs/sleep/README.md`: SkillOpt-Sleep cycle, staged adoption, held-out gate, replay/recall/dream knobs.
- `/home/hwidong/codes/SkillOpt/docs/sleep/RESULTS.md`: scope and limitations of sleep gains.
- `/home/hwidong/codes/SkillOpt/skillopt_sleep/cycle.py`: concrete sleep-cycle orchestration and diagnostics/staging behavior.
- `/home/hwidong/codes/SkillOpt/skillopt_sleep/types.py`: `SessionDigest`, `TaskRecord`, `SleepReport`, and edit/report data boundaries.

## Interview Decisions

- Mode decision: artifact-only draft now, implementation only after `/goal` activation. Rejected alternative: starting edits immediately, because the user asked to make a goal and named `achieve`, whose Before phase is draft-only.
- Absorption family considered: full SkillOpt optimizer port, SkillOpt-Sleep product clone, or Cautilus-native selective absorption. Chosen: Cautilus-native selective absorption. Rejected alternatives: optimizer port conflicts with current bounded prompt-search boundary; sleep clone conflicts with host ownership and stable external-adoption posture.
- Raw data ownership axis: product-owned transcript readers vs host-owned raw readers with product-owned normalized packets. Chosen: host-owned raw readers plus Cautilus-owned normalized packets. Axis: host/runtime/storage varies by Claude, Codex, Copilot, Devin, app products, and repo-specific adapters.
- Improvement target axis: one prompt file, multi-file memory/skill, adapter search, or auto-apply. Chosen: keep existing one target-file prompt boundary unless a later explicit contract changes it. Rejected alternatives: multi-file coupled updates and auto-apply are current non-goals.
- Proof scope: local doc/design proof first, broad/live proof only by explicit lane approval. Chosen: local proof. Rejected alternative: live app proof, because this goal does not need provider spend or app-runner liveness to decide the absorption contract.

## Plan Critique Findings

- Folded blocker: public claims are currently inconsistent across README and spec/master-plan surfaces, so Slice 1 must realign proof-state wording before adding SkillOpt-inspired product language.
- Folded blocker: importing SkillOpt-Sleep raw harvesting would violate Cautilus's host ownership boundary, so the plan only admits normalized source-port packets and host-owned readers.
- Folded blocker: SkillOpt's success story depends on recurring tasks with checkable correctness signals; the plan must state this as a scope condition and avoid marketing a general self-improving agent loop.
- Folded blocker: Cautilus already has GEPA-style bounded prompt search and final acceptance guards, so the design must not duplicate optimizer mechanisms already present.
- Over-worry not folded: a future nightly Cautilus companion may eventually be useful, but that belongs behind consumer evidence and a separate concept decision, not this absorption goal.
- Reviewer provenance: same-agent Before-phase critique only; schedule bounded fresh-eye critique before locking any new public contract in Slice 2.

## Off-Goal Findings

- none yet — draft created before activation.

## Final Verification

Closeout evidence — replace each `TODO` with a bound `<path>` (a checked-in
retro / host-log probe / disposition-review artifact) or an explicit
`skipped: <allowed-reason>: <detail>`. The complete gate rejects a literal
`TODO` / `<path>` / `TBD` until you do.

Retro: TODO — create or explicitly skip with an allowed reason before complete
Host log probe: TODO — create or explicitly skip with an allowed reason before complete
Disposition review: TODO — create or explicitly skip only when policy allows before complete

## User Verification Instructions

- Open `charness-artifacts/goals/2026-07-08-skillopt-absorption-doc-alignment.md`.
- Confirm the first slice resolves the README/spec proof-state conflict before new absorption wording lands.
- Confirm the non-goals preserve Cautilus's current host-ownership and no-auto-apply boundaries.
- Activate only if the scope is right: `/goal @charness-artifacts/goals/2026-07-08-skillopt-absorption-doc-alignment.md`.

## Auto-Retro

Retro dispositions: TODO — disposition every surfaced improvement, or record the explicit no-improvement opt-out
Structural follow-up: TODO — when the retro names a transferable waste item (a `## Sibling Search` trigger), classify its structural destination (`applied: <gate/hook/validator/test/contract change>` / `issue #N (recurs:|novel: <reason>)` / `repo-local guard: <path>` / `none — <reason>`); delete this line when no transferable waste was named
