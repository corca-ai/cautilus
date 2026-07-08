# Achieve Goal: Implement Minimal SkillOpt Absorption Slice

Status: draft
Created: 2026-07-08
Activation: `/goal @charness-artifacts/goals/2026-07-08-skillopt-runtime-absorption.md`

This file is the living goal scratchpad. It becomes active only when the user
runs the activation command.

## Active Operating Frame

- Current slice: draft/backlog awaiting activation.
- Current disposition: draft is shaped and activation-ready; no implementation has started.
- Current slice intent: implement the first minimal Cautilus-native SkillOpt absorption runtime seam by extending scenario proposal input handling with explicit normalized activity-origin / replay provenance evidence, without importing raw readers or optimizer loops.
- Next action: activate with `/goal @charness-artifacts/goals/2026-07-08-skillopt-runtime-absorption.md` after confirming the draft is
  still intended.
- Verification cadence: cheap deterministic checks at commit boundaries;
  higher-cost or fresh-eye proof at slice boundaries; final broad/live proof at
  closeout.
- Gate cadence: use focused schema/helper/CLI tests while shaping the runtime seam; run `npm run lint:specs`, `npm run lint:scenario-normalizers`, and focused Node/Go tests before broad `npm run verify`.
- Slice review packet: before fresh-eye slice critique, provide intent, changed
  files and owning/generated surfaces, expected invariants, tests/proof,
  non-claims, out-of-scope lines, and reviewer questions.
- History boundary: keep this frame current; move completed detail to
  `## Slice Log`, `## Operator Decision Queue`, `## Final Verification`,
  and `## Auto-Retro`.

## Goal

Implement the smallest real SkillOpt absorption slice in Cautilus: a tested runtime packet/schema/normalizer path that lets host-owned miners hand session-derived, replayed, synthetic, or operator-authored activity evidence into the existing scenario proposal flow.
The slice should preserve the current product boundary: Cautilus consumes normalized evidence and emits reviewable packets; host repos still own raw transcript mining, recall indexes, privacy filtering, and adoption decisions.

The expected first landing zone is `cautilus.scenario_proposal_inputs.v1` plus `discover scenarios prepare-input` / `discover scenarios propose`.
If activation-time code inspection proves that this exact packet already carries every required absorption field, implement the smallest missing proof, validation, fixture, or docs update instead of inventing a duplicate field.

## Non-Goals

- Do not port SkillOpt's optimizer, package, benchmark runners, WebUI, or training CLI.
- Do not port SkillOpt-Sleep's scheduler, raw transcript harvesters, long-term-memory store, plugin shells, or sleep daemon.
- Do not read Claude, Codex, Slack, product logs, browser logs, filesystem transcripts, or private host archives directly from the Cautilus binary.
- Do not auto-apply prompt, memory, skill, adapter, policy, or plugin edits.
- Do not expand this goal into multi-target prompt/skill/memory optimization.
- Do not use held-out or acceptance evidence as mutation/training material.
- Do not push, release, or run remote CI unless the operator explicitly approves that lane after local proof is ready.

## Boundaries

- Product boundary: Cautilus owns versioned packet shape, validation, explicit normalized fields, CLI assembly/proposal behavior, examples, and tests.
- Host boundary: host repos own raw mining, grouping, redaction, recurring-task detection, replay execution, recall indexes, credentials, and policy.
- First absorption target: formalize the minimal activity-origin / replay-provenance evidence needed for scenario proposal input, including `real`, `synthetic`, `replayed`, and `operator_authored` distinctions when the existing schema lacks them.
- Split-safety boundary: train/proposal evidence may carry session-derived or replay-derived context; held-out and acceptance outputs must remain excluded from mutation and candidate shaping.
- Backwards compatibility boundary: existing `cautilus.scenario_proposal_inputs.v1` fixtures and callers should continue to work unless a deliberate version bump is justified and documented.
- Documentation boundary: update `docs/contracts/skillopt-absorption.md`, `docs/contracts/scenario-proposal-inputs.md`, and any affected spec index only to match implemented behavior, not to imply broader absorption.

- External side-effect scope: name which phase or bundle any approved
  publish / push / remote-CI / apply applies to. That approval is phase-scoped
  and does not carry forward — after an approved publish/CI/apply lane
  completes, done-early test-only quality continuation is local by default
  (batch remote proof, run CI once over the final bundled state). Per-slice
  remote publication is assumed only when the operator explicitly asks or a
  runtime-affecting slice requires earlier publication.

## User Acceptance

- Read the runtime-facing contract changes and see exactly which SkillOpt-derived concept was actually absorbed.
- Inspect a fixture showing a host-owned normalized candidate with session-derived/replayed/synthetic/operator-authored provenance entering the scenario proposal path.
- Run or review a focused CLI/helper test proving the field is validated or preserved through `discover scenarios prepare-input` / `discover scenarios propose`.
- Confirm no raw transcript reader, scheduler, optimizer import, or auto-apply surface was added.
- Confirm the closeout distinguishes implemented runtime absorption from still-deferred rejected-candidate, staged-adoption, replay/recall, or optimizer-adjacent work.

## Agent Verification Plan

### Low-Cost Checks

- `git diff --check`
- `npm run lint:specs` after contract/spec edits.
- `npm run lint:scenario-normalizers` if scenario normalization or proposal fixtures change.
- Focused Node tests for `scripts/agent-runtime/build-scenario-proposal-input.mjs`, `generate-scenario-proposals.mjs`, or related schema/fixture behavior.
- Focused Go CLI smoke tests under `internal/app` when command behavior or CLI help changes.

### High-Confidence Checks

- `npm run test:node` or narrower Node test target covering the changed helper/schema seam.
- Focused `go test ./internal/app -run <scenario-proposal-related-tests>` if CLI behavior changes.
- `npm run hooks:check`
- `npm run verify` before closeout.
- `npm run claims:refresh:all` if claim-source files or generated claim packet sources become stale.
- Bounded fresh-eye critique before declaring the runtime absorption slice complete.

### External Or Live Proof

- Not required by default.
- No live provider, product app, remote CI, release, or GitHub issue closeout proof is claimed unless the operator explicitly activates that lane.

## Slice Plan

| Slice | Objective | Why Now | Expected Evidence | Status |
| --- | --- | --- | --- | --- |
| 1 | Confirm the exact minimal runtime seam. | The previous goal stopped at design-only; activation must choose one real absorption path before editing. | Code/schema inspection of scenario proposal input, prepare-input, propose, fixtures, and current contract deferred decisions; updated slice note naming the selected field/packet. | planned |
| 2 | Implement the packet/schema/helper fixture change. | Actual absorption requires one tested product-owned runtime boundary, not more prose. | Schema or helper change plus fixture covering normalized activity origin / replay provenance; no raw reader. | planned |
| 3 | Propagate through CLI/proposal behavior as needed. | Host-owned normalized evidence must survive the agent-facing command path. | Focused CLI/helper test proving prepare/propose validates or preserves the absorbed evidence. | planned |
| 4 | Realign docs/specs and claim surfaces. | Public docs must say what is implemented and what remains deferred. | Updated contracts/spec index/generated claim state if required; no overclaim beyond the implemented seam. | planned |
| 5 | Final critique, quality, and closeout. | The user needs proof that actual absorption happened and that product boundaries held. | `npm run verify`, `npm run hooks:check`, fresh-eye disposition, final non-claims. | planned |

## Operator Decision Queue

- Decision: whether activation should implement the scenario-proposal origin/provenance seam as the first absorption slice or choose a different minimal seam from `docs/contracts/skillopt-absorption.md`.
- Owner: operator.
- Why deferred: the user's correction establishes that a goal was wanted, not immediate implementation in this turn.
- Unblock action: activate the draft as-is, or edit the goal before activation if a different first seam is preferred.
- Revisit trigger: before running `/goal @charness-artifacts/goals/2026-07-08-skillopt-runtime-absorption.md`.

- Decision: whether any push, remote CI, release, or live proof lane should be included after local implementation proof.
- Owner: operator.
- Why deferred: implementation can be proven locally first, and no external lane was requested.
- Unblock action: explicit approval naming the lane and bundle.
- Revisit trigger: final closeout or before publication.

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

- `Routing: find-skills -> achieve + impl — achieve owns this draft goal lifecycle; impl owns the future runtime packet/schema/helper implementation after explicit /goal activation`

## Discuss Before Activation

- Discuss before activation: confirmed by user correction — this artifact is the requested implementation goal for actual SkillOpt absorption; it is inert until `/goal`, and activation means implementing one minimal runtime seam rather than only closing design docs.

## Slice Log

## Context Sources

- `docs/contracts/skillopt-absorption.md`: design boundary and accepted/rejected absorption patterns.
- `docs/contracts/scenario-proposal-inputs.md`: current `cautilus.scenario_proposal_inputs.v1` packet and candidate/evidence shape.
- `docs/contracts/scenario-proposal-normalization.md`: current host-owned normalized source file assembler boundary.
- `docs/master-plan.md`: immediate next move listing a minimal packet slice from SkillOpt absorption as one valid improvement seam.
- `README.md`: current product promise and command-family framing.
- `AGENTS.md` / `CLAUDE.md`: Cautilus product boundary, no raw host-reader import, and runtime-surface test expectations.
- `charness-artifacts/goals/2026-07-08-skillopt-absorption-doc-alignment.md`: previous completed design-only alignment goal, useful as context but not sufficient implementation.
- `charness-artifacts/critique/2026-07-08-skillopt-absorption-disposition-review.md`: confirms the previous goal closed design-only and left implementation as non-claim.

## Interview Decisions

- Mode decision: artifact-only draft now; implementation only after explicit `/goal` activation.
  Rejected alternative: continuing implementation immediately, because the user clarified the request was to create the goal.
- First absorption seam family: scenario proposal input origin/provenance, rejected-candidate packet, staged-adoption evidence, replay/recall packet, or optimizer import.
  Chosen: scenario proposal input origin/provenance as the conservative first seam because it already has a host-owned normalized input boundary and is named by the SkillOpt absorption contract.
  Rejected alternatives: rejected-candidate and staged-adoption evidence likely touch improve/revision/acceptance surfaces with wider blast radius; optimizer import is explicitly out of scope.
- Host axis: raw source systems vary by Claude, Codex, Slack, product logs, audit trails, and local archives.
  Chosen value: host-owned miners emit normalized evidence; Cautilus never reads raw stores.
  Anti-anchoring: axis = host/source system.
- Proof axis: local deterministic proof, remote CI, live provider proof, release, or issue closeout.
  Chosen value: local deterministic proof by default.
  Anti-anchoring: axis = proof level; external lanes require explicit operator approval.
- Compatibility axis: extend v1 packet with optional fields vs create a new packet/version.
  Chosen value: decide during Slice 1 from actual schema/code; prefer optional backwards-compatible extension unless validation shows a version bump is needed.
  Anti-anchoring: axis = packet/version compatibility.

## Plan Critique Findings

- Folded blocker: the previous goal was design-only; this goal must include at least one runtime packet/schema/helper/test change or explicitly stop as blocked before claiming absorption.
- Folded blocker: raw transcript harvesting would violate the Cautilus product boundary, so every slice starts from host-owned normalized JSON.
- Folded blocker: scenario proposal inputs already have `evidence.sourceKind`; Slice 1 must inspect whether the right move is adding origin/provenance fields, tightening validation, adding fixtures, or documenting already-supported semantics.
- Folded blocker: if a new runtime field is added, at least one executable test and matching contract update must land in the same slice.
- Over-worry not folded: implementing every accepted SkillOpt pattern at once would create broad surface risk; this goal intentionally implements only the first minimal seam.
- Reviewer provenance: same-agent Before-phase critique only; schedule bounded fresh-eye critique before final closeout or before broad public contract wording changes.

## Off-Goal Findings

none yet — draft only.

## Final Verification

Pending until activated and implemented.

## User Verification Instructions

- Review this draft goal file.
- Confirm the activation line if this is the intended first real absorption slice: `/goal @charness-artifacts/goals/2026-07-08-skillopt-runtime-absorption.md`.
- Before activation, adjust the first seam if you want rejected-candidate evidence or staged-adoption evidence instead of scenario proposal origin/provenance.

## Auto-Retro

Pending until activated and closed.
