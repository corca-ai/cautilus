# Achieve Goal: Align Cautilus Docs And Design SkillOpt Absorption

Status: complete
Created: 2026-07-08
Activation: `/goal @charness-artifacts/goals/2026-07-08-skillopt-absorption-doc-alignment.md`

This file is the living goal scratchpad.
It is active for the current `/goal` pursuit.

## Active Operating Frame

- Current slice: Slice 4 closeout complete.
- Current disposition: complete; final local verification, Auto-Retro, host probe, and disposition review evidence are bound in this artifact.
- Current slice intent: align stale living docs with the current proof state, then design the Cautilus-native way to absorb useful SkillOpt and SkillOpt-Sleep patterns.
- Next action: commit closeout artifacts and report the local-only proof boundary.
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
| 1 | Align Cautilus living docs with current proof state. | The SkillOpt absorption decision should not land on top of stale public claims. | README/master-plan/spec wording agrees on proven/debt state; `npm run lint:specs` or documented substitute. | implemented |
| 2 | Write the SkillOpt absorption design contract. | The useful lessons need a Cautilus-native boundary before implementation. | Contract/design doc names accepted patterns, rejected imports, command-family landing zones, packet boundaries, and contamination/safety constraints. | implemented |
| 3 | Implement the smallest normalizer/evidence slice if the design chooses one. | A goal should land one executable proof when it adds a new runtime surface. | Fixture/schema/test for session-derived proposal input or rejected-candidate evidence; no raw transcript reader in product. | not selected — design-only contract adds no runtime surface |
| 4 | Final quality, critique, and closeout. | The user needs an auditable decision and next-step proof, not a private analysis. | `npm run verify`, `npm run hooks:check`, critique disposition, final verification, residual non-claims. | complete |

## Operator Decision Queue

none — the conservative design-only default was applied, no runtime packet slice was selected, and no push, release, issue closeout, or live proof lane was requested.

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

Routing: find-skills -> achieve + impl + critique + quality + debug + retro - achieve owned the goal lifecycle; impl owned doc/contract edits; critique owned delegated fresh-eye review; quality owned closeout gate posture; debug classified the unavailable generic quality packet; retro owned Auto-Retro evidence.
Gather: n/a — no external URL or credentialed public source was used; SkillOpt inputs came from the operator's local checkout and are labeled local research context, not public Cautilus evidence.
Release: n/a — this run touched no version, install manifest, release packet, or publication surface.
Issue closeout: n/a — this goal resolved no tracked GitHub issue and carried no close-intended issue keyword.

## Discuss Before Activation

- Discuss before activation: resolved — the draft intentionally does not authorize push, release, issue closeout, raw transcript ingestion, live app proof, or auto-apply; `/goal` activation starts local doc/design work first, and any external boundary must be separately approved.

## Slice Log

### Slice 1: Align proof state and SkillOpt absorption boundary

- Objective: Align README/master-plan/spec-facing contract surfaces with the current 7/7 proven audit state and add a Cautilus-native SkillOpt absorption design boundary.
- Why this approach: The absorption decision needed to land on a consistent proof-state story and preserve Cautilus's host-owned raw data, packet-first, held-out, no-auto-apply boundaries.
- Commits: `bcb7cf5d` initial alignment, `03cfac60` critique remediation, `6c01c6ca` claim refresh.
- What changed: README proof-state prose now matches the apex audit; docs/contracts/skillopt-absorption.md defines accepted patterns, rejected imports, command-family landing zones, safety rules, and deferred packet questions; docs/master-plan.md and docs/specs/contracts/index.spec.md link the design boundary; claim generated surfaces were refreshed after README changed.
- Alternatives rejected: Rejected lowering apex/spec status because .cautilus/audit/surface-audit.json and docs/specs/index.spec.md prove 7/7 current badge consistency; rejected importing SkillOpt/Sleep runtime surfaces because raw transcript readers, schedulers, plugin shells, and auto-apply violate Cautilus boundaries.
- Targeted verification: git diff --check; npm run lint:specs; npm run claims:refresh:all; npm run lint:specs after refresh; npm run hooks:check; npm run verify.
- Test duplication pressure:
- Critique: parent-delegated fresh-eye review consumed `charness-artifacts/critique/2026-07-08-003218-packet.md`; angle reviewers found absolute local SkillOpt refs, stale slice log, current-HEAD claim refresh drift, and capability wording risk; counterweight triaged absolute refs, stale slice log, and claim refresh drift as Act Before Ship, capability wording and verification evidence as Bundle Anyway, and master-plan packet-slice wording as Over-Worry.
- Off-goal findings: none
- Lessons carried forward: Generated claim surfaces need a post-fix refresh commit because claim packets record the commit they inspected; local research paths in product contracts should be labeled as local context or gathered into durable artifacts before becoming public evidence.
- Metrics: not captured

### Slice 2: Remediate delegated critique findings

- Objective: Consume parent-delegated fresh-eye critique, fix design-contract ambiguity and provenance issues, and refresh generated claim state against the committed remediation.
- Why this approach: Fresh-eye reviewers found current-HEAD claim drift, absolute local SkillOpt paths in durable product surfaces, stale goal log entries, and capability wording that could imply current runtime support.
- Commits: 03cfac60 Record SkillOpt absorption critique remediation; 6c01c6ca Refresh claims after SkillOpt critique fixes
- What changed: docs/contracts/skillopt-absorption.md now labels local SkillOpt checkout reads as local research context rather than public evidence and weakens the capability wording to a future design target; the goal artifact records parent-delegated critique evidence and updated verification; claim packets and generated claim-evidence projection now point at 03cfac60 and source freshness is clean.
- Alternatives rejected: Did not change master-plan packet-slice wording because counterweight classified it as Over-Worry: it presents one option among alternatives and does not mandate implementation.
- Targeted verification: git diff --check; npm run lint:specs; npm run hooks:check; npm run claims:source-freshness:check; npm run claims:evidence-state:check; npm run claims:status-report:check.
- Test duplication pressure:
- Critique: Fresh-Eye Satisfaction: parent-delegated; Packet Consumed: charness-artifacts/critique/2026-07-08-003218-packet.md; Reviewer Tier Evidence: requested tier high-leverage, requested spawn fields none, host exposure state parent-spawned, applied evidence four agents completed.
- Off-goal findings: none
- Lessons carried forward: When a claim-source doc and generated claim packets land together, use a follow-up generated-only refresh commit after the source commit so packetGitCommit remains auditable against HEAD.
- Metrics: not captured

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
- Local SkillOpt README from the operator's checkout: SkillOpt product claim and optimizer framing.
- Local SkillOpt-Sleep README from the operator's checkout: SkillOpt-Sleep cycle, staged adoption, held-out gate, replay/recall/dream knobs.
- Local SkillOpt-Sleep results notes from the operator's checkout: scope and limitations of sleep gains.
- Local SkillOpt-Sleep `cycle.py` from the operator's checkout: concrete sleep-cycle orchestration and diagnostics/staging behavior.
- Local SkillOpt-Sleep `types.py` from the operator's checkout: `SessionDigest`, `TaskRecord`, `SleepReport`, and edit/report data boundaries.

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

Retro: charness-artifacts/retro/2026-07-08-session-retro.md
Host log probe: charness-artifacts/probe/2026-07-08-skillopt-absorption-doc-alignment.json
Disposition review: charness-artifacts/critique/2026-07-08-skillopt-absorption-disposition-review.md

- Final self-check against the goal: satisfied locally.
  README, master-plan, contract index, and generated claim surfaces now present one proof-state story; `docs/contracts/skillopt-absorption.md` records accepted SkillOpt-derived patterns, rejected imports, command-family landing zones, and host-owned raw data boundaries.
- Runtime proof scope: no new runtime packet, schema, normalizer, CLI command, or Cautilus Agent behavior was added.
  Therefore the user-acceptance line requiring executable checks for new packet/schema/normalizer behavior is not triggered.
- Quality gate results: `git diff --check` passed; `npm run lint:specs` passed; `npm run hooks:check` passed; `npm run claims:source-freshness:check`, `npm run claims:evidence-state:check`, and `npm run claims:status-report:check` passed; `npm run verify` passed after the closeout artifact updates.
- Quality packet note: the portable `quality` planner advertised `./scripts/run-quality.sh --read-only`, but this repo does not implement that command.
  Debug artifact `charness-artifacts/debug/latest.md` records the unavailable-packet classification; the maintained broad gate remains `npm run verify`.
- High-cost / external proof not run: no remote CI, push, release publication, live provider roundtrip, app-agent smoke, or GitHub issue closeout ran because this goal is a local design/documentation slice.
- Residual risks: the absorption contract is design-only and does not yet prove a session-derived scenario proposal packet, rejected-candidate packet, staged adoption packet, or replay/recall packet in code.
  Those require a later explicit runtime slice with fixtures and tests.
- Final non-claims: no SkillOpt optimizer, SkillOpt package, WebUI, SkillOpt-Sleep scheduler, raw transcript reader, plugin shell, memory store, nightly daemon, auto-apply loop, or multi-file skill/memory optimizer was imported into Cautilus.
- Closeout state: `impl-local` only.
  Carrier, pushed-CI, instance-synced, live, and issue-closed states are not claimed.

## User Verification Instructions

- Open `charness-artifacts/goals/2026-07-08-skillopt-absorption-doc-alignment.md`.
- Open `README.md`, `docs/master-plan.md`, `docs/specs/contracts/index.spec.md`, and `docs/contracts/skillopt-absorption.md`.
- Confirm the public proof-state story says the apex promises are currently proven while the narrower SkillOpt absorption work remains design-only.
- Confirm the SkillOpt absorption contract accepts only normalized packet concepts and rejects raw transcript readers, schedulers, plugin shells, auto-apply, and optimizer imports.
- Confirm the final proof is local only: `npm run verify` and `npm run hooks:check` passed, but no push, remote CI, release, live app proof, or issue closeout is claimed.

## Auto-Retro

Retro dispositions: applied: this goal now records generated claim refresh as a separate proof step, labels local SkillOpt checkout reads as local research context rather than public evidence, and binds final verification to `npm run verify`, `npm run hooks:check`, claim freshness checks, retro evidence, host probe evidence, and disposition review.
Structural follow-up: none — the retro names a local closeout/documentation trap with no transferable sibling outside this slice; the applied contract wording and goal verification notes are sufficient.
