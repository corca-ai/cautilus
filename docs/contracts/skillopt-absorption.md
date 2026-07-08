# SkillOpt Absorption Boundary

Status: Boundary contract with one implemented runtime absorption route.
The implemented route is limited to scenario proposal evidence provenance in `cautilus.scenario_proposal_inputs.v1`.

`Cautilus` should absorb only the SkillOpt and SkillOpt-Sleep patterns that strengthen its existing `claim`, `eval`, and `improve` command families while preserving host-owned raw data, packet-first proof, held-out safety, and no auto-apply.

## Problem

SkillOpt and SkillOpt-Sleep package useful evaluation discipline:
session-derived task mining, recurring-task replay, rejected-candidate memory, staged adoption, and validation gates.
Those patterns overlap with `Cautilus`'s direction, but importing the whole product would blur boundaries `Cautilus` has already made explicit.

The raw inputs are host-specific.
Claude, Codex, Copilot, Devin, product chat logs, and repo-local audit trails expose different transcript shapes, storage paths, privacy constraints, and credentials.
If `Cautilus` reads those stores directly, the product becomes a host transcript harvester instead of a generic intentful behavior evaluation workflow.

The optimizer loop is also not a drop-in fit.
`Cautilus` already owns bounded prompt search, held-out evaluation, acceptance reads, and reviewable revision artifacts.
Absorption should strengthen those seams, not add an always-on nightly optimizer or a second mutation engine.

## Capability Contract

Design target: a host repo should be able to hand `Cautilus` normalized evidence from recent agent activity, rejected candidates, replay results, and staged adoption decisions once the relevant packet seam exists.
`Cautilus` should then turn that evidence into scenario proposals, evaluation packets, improvement inputs, acceptance/readiness checks, and reviewable artifacts without reading raw transcripts or applying edits by itself.

Implemented first route: host-owned scenario candidate miners can now attach `origin` and `activityProvenance` to each proposal evidence item.
The existing `discover scenarios prepare-input` path preserves those fields from normalized input, and `discover scenarios propose` preserves them on the top-ranked evidence entries it emits for review.
The implemented `origin` labels are `real`, `synthetic`, `replayed`, and `operator_authored`.
The implemented `activityProvenance` fields are `activityId`, `taskKey`, `recurrenceKey`, `replayId`, `split`, and `score`.
This is not a raw transcript reader, miner, replay runner, scheduler, optimizer, or adoption engine.

## Accepted Patterns

### Session-Derived Scenario Proposal Inputs

Accepted concept: SkillOpt-Sleep's `SessionDigest` and `TaskRecord` split between raw session harvesting and normalized recurring tasks.

`Cautilus` landing zone: `discover scenarios prepare-input` and `discover scenarios propose`.
Host repos may mine transcripts, product logs, audit trails, or local session archives into normalized `proposalCandidates`.
`Cautilus` owns the downstream merge, ranking, packet validation, proposal output, and reviewable attention view.

Required boundary:

- raw transcript readers stay host-owned
- source-specific grouping and privacy redaction stay host-owned
- normalized candidates must carry operator-reviewable evidence, not opaque storage IDs only
- session-derived, replayed, synthetic, and operator-authored evidence can be labeled with `origin`
- replay and activity identity can be carried in `activityProvenance`
- generated proposals remain draft scenarios until a maintainer adopts them

### Rejected-Candidate Evidence

Accepted concept: keeping rejected edits and failed candidate lessons as negative evidence instead of discarding them.

`Cautilus` landing zone: `improve search` candidate lineage, frontier-promotion review feedback, selection-cap reason codes, acceptance reports, and revision artifacts.
Rejected candidates may inform later reflection only when the evidence comes from allowed train/review channels.
They must not leak held-out or acceptance answers into mutation.

Required boundary:

- rejected evidence is source-bound to the scenario split and proof route that produced it
- acceptance-set outcomes never feed mutation, search, or candidate shaping
- held-out feedback remains protected by the existing bounded exposure and no-training rules
- candidate rejection reasons remain inspectable in durable packets

### Staged Adoption Evidence

Accepted concept: SkillOpt-Sleep stages proposed changes for human review before adoption.

`Cautilus` landing zone: `cautilus.revision_artifact.v1`, `cautilus.improve_proposal.v1`, `cautilus.acceptance_report.v1`, and the operator acceptance checklist.
The product may make staged adoption easier to audit, but it does not apply consumer prompt, memory, skill, adapter, or policy edits automatically.

Required boundary:

- every proposed edit points at a consumer-owned target
- every adoption decision remains human or host-policy owned
- `Cautilus` records the evidence packet and candidate artifact, not a hidden write
- risk-tier acceptance policy stays adapter-owned

### Experience Replay And Recall As Inputs

Accepted concept: replaying recurring tasks and recalling similar past tasks when the task family has a checkable correctness signal.

`Cautilus` landing zone: scenario history, proposal inputs, review packets, and improve-search evidence references.
Replay and recall may help hosts decide which scenarios to propose or which train examples to include.
They are inputs to explicit packets, not a background product daemon.

Required boundary:

- hosts own any recall index, archive, or raw session store
- `Cautilus` consumes bounded source references or normalized packets
- replay evidence records task identity, split, score, and provenance
- synthetic or dream-derived tasks may enter train/proposal evidence only when labeled as synthetic and excluded from held-out and acceptance sets

## Rejected Imports

`Cautilus` should not import:

- SkillOpt's Python optimizer package, benchmark runners, WebUI, or training CLI
- SkillOpt-Sleep's nightly scheduler, transcript harvesters, long-term-memory store, or per-agent plugin shells
- host-specific raw readers for Claude, Codex, Copilot, Devin, Slack, browser logs, product databases, or private filesystem archives
- a product-owned "sleep" daemon that scans user activity without an explicit host packet
- automatic prompt, memory, skill, adapter, policy, or plugin edits
- open-ended multi-file skill/memory optimization inside the current `improve search` v1 prompt-only boundary

## Command-Family Landing Zones

`claim` may consume absorption-derived evidence only as source-ref-backed proof-planning context.
It should not treat mined sessions as public product promises unless the host's source docs declare the promise or the Cautilus Agent explicitly raises it for review.

`eval` may consume normalized replay, observation, fixture, scenario, and review packets.
It may also evaluate staged candidates through existing fixture, observation, review-variant, live, and acceptance surfaces.
It must preserve split identity and proof route.

`improve` may consume train/review evidence and bounded scenario history for mutation and proposal generation.
It must keep held-out as validation/selection evidence, keep acceptance as optimizer-untouchable final read evidence, and emit staged artifacts rather than applying changes.

## Safety And Contamination Rules

Accepted absorption depends on these invariants:

- raw host data enters only through host-owned normalization or explicit source-bound packets
- every normalized task or evidence item records whether it is real, synthetic, replayed, or operator-authored
- train, held-out, full-gate, and acceptance roles stay explicit
- acceptance evidence is read-only at the human accept step and never becomes mutation evidence
- recurring-task replay claims are scoped to task families with checkable correctness signals and real headroom
- saturated or noisy tasks are reported as flat or inconclusive instead of marketed as self-improvement wins

## Fixed Decisions

- Absorption is selective and Cautilus-native.
- The first implemented runtime landing surface is the scenario-proposal evidence provenance route in `cautilus.scenario_proposal_inputs.v1` and `cautilus.scenario_proposals.v1`.
- Existing scenario proposal commands validate host-provided `origin` and `activityProvenance`; no new runtime command is required for the first route.
- Proposal output preserves provenance on emitted top-ranked evidence entries, while the input packet remains the complete evidence audit trail.
- Raw transcript harvesting remains out of product scope.
- The current `improve search` v1 target remains one consumer-owned prompt file.
- `Cautilus` may accept normalized session-derived candidate inputs, but it does not own the host miner that creates them.
- Scenario proposal evidence provenance remains optional in v1 for backwards compatibility with existing candidate callers.

## Deferred Decisions

- whether to add a generic `source_port` or `session_digest` packet that host miners can emit before scenario proposal input
- whether rejected-candidate evidence needs its own normalized packet or should stay embedded in existing search/revision artifacts
- whether a future v2 should require `origin: real | synthetic | replayed | operator_authored` for every scenario proposal evidence item
- whether a future agent workflow should help a host author its own transcript miner without shipping one in the binary
- whether richer multi-target improvement belongs in a future `improve` contract after real consumer evidence asks for it

## Non-Goals

- cloning SkillOpt or SkillOpt-Sleep
- turning `Cautilus` into a transcript ingestion product
- adding a nightly optimizer to the product surface
- replacing the existing GEPA-style improve-search runner
- making adoption automatic
- using held-out or acceptance evidence as training material

## Success Criteria

- A maintainer can identify which SkillOpt-derived patterns are accepted, rejected, and deferred without reading SkillOpt source code.
- Every accepted pattern names the `Cautilus` command family and contract surface where it belongs.
- The contract preserves host-owned raw data, packet-first artifacts, held-out discipline, acceptance contamination safety, and no auto-apply.
- The implemented scenario proposal route shows normalized activity origin and replay provenance entering the proposal packet path and leaving on emitted top-ranked evidence.
- The roadmap points here instead of re-explaining the boundary in prose.

## Acceptance Checks

- Documentation check: README proof-state prose agrees with the apex surface audit.
- Documentation check: the master plan links to this contract when mentioning SkillOpt absorption.
- Spec index check: the maintainer contract index identifies this contract as a boundary with one implemented scenario-proposal provenance route.
- Runtime check: `fixtures/scenario-proposals/candidates.json` includes `real`, `replayed`, `synthetic`, and `operator_authored` evidence, and the schema/helper tests prove runtime validation plus preservation on emitted top-ranked proposal evidence.
- Runtime check: no raw transcript reader, scheduler, optimizer import, or auto-apply surface is added.

## Source References

- [scenario-proposal-inputs.md](./scenario-proposal-inputs.md)
- [scenario-proposal-normalization.md](./scenario-proposal-normalization.md)
- [improvement-search.md](./improvement-search.md)
- [final-acceptance-set.md](./final-acceptance-set.md)

Local research context used while drafting, not public Cautilus evidence:

- SkillOpt README from the operator's local checkout: product claim and optimizer framing.
- SkillOpt-Sleep README from the operator's local checkout: sleep cycle, staged adoption, held-out gate, replay/recall/dream knobs.
- SkillOpt-Sleep results notes from the operator's local checkout: scope and limitations of sleep gains.
- SkillOpt-Sleep `types.py` from the operator's local checkout: `SessionDigest`, `TaskRecord`, `SleepReport`, and edit/report data boundaries.
- SkillOpt-Sleep `cycle.py` from the operator's local checkout: concrete sleep-cycle orchestration and diagnostics/staging behavior.
