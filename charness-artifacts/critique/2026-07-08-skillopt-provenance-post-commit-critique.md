# Critique: SkillOpt Scenario Provenance Absorption

Date: 2026-07-08
Target commit: `9616dd71 Implement SkillOpt scenario provenance absorption`
Fresh-Eye Satisfaction: parent-delegated
Packet Consumed: `charness-artifacts/critique/2026-07-08-015851-packet.md`
Reference: code critique

## Reviewer Tier Evidence

- Requested tier: `high-leverage`
- Requested spawn fields: `none`
- Host exposure state: `pending-parent-spawn`
- Application state: `unverified-by-packet`
- Applied evidence boundary: host did not expose separate tier-application confirmation; parent used the available default subagent spawn surface.

## Change

The committed slice adds optional `origin` and `activityProvenance` fields to scenario proposal evidence, validates the new fields in Node and Go runtimes, updates fixtures and contracts, and records goal / quality / critique closeout artifacts.

## Capability At Stake

The product claim is that Cautilus has absorbed the first minimal SkillOpt-derived runtime route by consuming host-owned normalized activity provenance through `cautilus.scenario_proposal_inputs.v1`.
The risk is overclaiming that route while malformed provenance or evidence-free candidates still pass the product-owned proposal boundary.

## Angles

- Michael Jackson problem framing: whether the change solves real absorption or only a nearby schema/documentation problem.
- Gerald Weinberg diagnostic: whether validation is located at the real runtime boundary.
- Atul Gawande operational: whether operators can trust the packet and CLI behavior without silent failure modes.
- Counterweight: which findings are true blockers versus v2 semantics or scope creep.

## Findings

### Act Before Ship

- Go validation accepts malformed optional enum fields when the keys are present but not strings.
  `origin` and `activityProvenance.split` are read through `stringOrEmpty`, so numeric values are treated as absent and can be emitted unchanged by the Go CLI.
  Node rejects the same malformed fields.
  Fix by distinguishing absent from wrong type for optional enum fields, then add Go runtime and CLI negative tests for numeric / empty `origin` and `split`.
  Evidence: `internal/runtime/proposals.go:373`, `internal/runtime/proposals.go:396`, `internal/runtime/review.go:756`, `scripts/agent-runtime/scenario-proposals.mjs:85`, `scripts/agent-runtime/scenario-proposals.mjs:101`.

- Go and Node runtimes accept proposal candidates with empty `evidence`, despite the schema and contract requiring at least one operator-reviewable signal.
  This can emit a proposal with `0 recent log match(es)` and `evidence: []`, which undercuts the actual absorption claim because there may be no absorbed evidence.
  Fix by rejecting empty evidence arrays in both runtimes and add focused tests; consider `minItems: 1` on output proposal evidence if proposals should never be evidence-free.
  Evidence: `internal/runtime/proposals.go:348`, `scripts/agent-runtime/scenario-proposals.mjs:118`, `fixtures/scenario-proposals/input.schema.json:86`, `docs/contracts/scenario-proposal-inputs.md:84`.

- The SkillOpt absorption contract still contains wording that can read as stronger than v1 implements.
  It says every normalized task or evidence item records origin, while the runtime and v1 contract deliberately keep provenance optional for backwards compatibility.
  Fix by narrowing the invariant to new SkillOpt-derived evidence when a host claims this route, or by explicitly stating that v1 validates optional provenance only when present.
  Evidence: `docs/contracts/skillopt-absorption.md:123`, `docs/contracts/skillopt-absorption.md:139`, `docs/contracts/scenario-proposal-inputs.md:91`.

### Bundle Anyway

- Add `minLength: 1` to `activityId`, `taskKey`, `recurrenceKey`, and `replayId` in the input and output schemas, or document that runtime validation is stricter than schema validation.
  Evidence: `fixtures/scenario-proposals/input.schema.json:125`, `fixtures/scenario-proposals/proposals.schema.json:188`.

- Rename or tighten the schema test named “without host storage fields.”
  It proves that host storage fields are not required and that `activityProvenance` rejects extra keys, but it does not prove top-level evidence rejects host storage fields.
  Evidence: `scripts/agent-runtime/scenario-proposal-schemas.test.mjs:121`.

- Add one public-boundary CLI negative smoke for malformed provenance while fixing the Go validator.
  Current CLI smoke proves happy-path preservation, not public-boundary rejection.
  Evidence: `internal/app/cli_smoke_test.go:1975`, `internal/runtime/proposals_test.go:366`.

- Add a `discover scenarios propose --help` / command registry note pointing operators to `docs/contracts/scenario-proposal-inputs.md` and naming optional `origin` / `activityProvenance`.
  Evidence: `internal/cli/command-registry.json:340`.

- Make the roadmap and closeout wording consistently say “scenario proposal provenance handoff / preservation” rather than broad “SkillOpt absorption” where a reader could infer raw mined activity ingestion.
  Evidence: `docs/master-plan.md:72`.

### Over-Worry

- Do not require Cautilus to import SkillOpt raw transcript miners, schedulers, replay runners, optimizers, or auto-apply surfaces for this slice.
  The host-owned normalized packet boundary is the correct product boundary.

- Do not require every evidence item to appear in emitted proposal output.
  The contract now correctly says emitted proposal evidence is top-ranked and the input packet remains the complete audit trail.

- Do not block on release packaging or packaged Cautilus Agent parity.
  The prepared packet showed those deterministic rule families as ready, and they are not the risk center for this commit.

- Do not block on generated claim artifacts referencing the inspected pre-commit source rather than the self-referential final commit hash.
  The standing freshness gates passed, and exact self-reference is not realistic in committed generated packets.

### Valid But Defer

- Making `origin` required for every v1 evidence item is plausible hardening, but it conflicts with the explicit backwards-compatibility decision.

- Rich semantic provenance rules can wait for a later v2 slice.
  Examples: `origin: replayed` requires `replayId`, score range semantics, and split/origin compatibility.

- HTML proposal rendering should eventually expose provenance details, but JSON packets are the claimed proof surface for this slice.

- Rejected-candidate evidence, staged adoption evidence, replay/recall packets, and optimizer-adjacent routes remain separate goals.

## Counterweight Triage

The two true pre-ship defects are runtime-boundary bugs, not taste:
Go optional enum type validation is weaker than Node/schema, and empty evidence is accepted despite the packet contract.

The wording issues are also real because this slice is easy to oversell.
They should be fixed with the same follow-up because the implementation is intentionally narrower than the product phrase “SkillOpt absorption.”

The remaining concerns belong in future hardening.
Optional v1 provenance, top-ranked evidence output, and no raw SkillOpt reader are correct constraints for this slice.

## Next Move

Open a follow-up fix slice before treating `9616dd71` as shippable:

- reject non-string optional enum values in Go provenance validation.
- reject empty evidence in Go and Node proposal generation.
- add Go runtime tests, Node tests, and at least one CLI negative smoke.
- narrow the contract / roadmap wording that implies every evidence item records origin.
- preserve the current non-goals: no raw reader, scheduler, optimizer, recall index, or auto-apply.

## Structured Findings

- F1 | bin: act-before-ship | evidence: strong | ref: internal/runtime/proposals.go:373 | action: fix | note: Go accepts numeric or empty optional enum provenance where Node/schema reject it
- F2 | bin: act-before-ship | evidence: strong | ref: internal/runtime/proposals.go:348 | action: fix | note: Go and Node accept empty evidence despite minItems and operator-reviewable evidence contract
- F3 | bin: act-before-ship | evidence: moderate | ref: docs/contracts/skillopt-absorption.md:123 | action: fix | note: contract says every evidence item records origin while v1 keeps origin optional
- F4 | bin: bundle-anyway | evidence: moderate | ref: fixtures/scenario-proposals/input.schema.json:125 | action: fix | note: schema string fields lack minLength while runtime requires non-empty strings
- F5 | bin: bundle-anyway | evidence: moderate | ref: scripts/agent-runtime/scenario-proposal-schemas.test.mjs:121 | action: fix | note: schema test wording overstates top-level host storage rejection
- F6 | bin: valid-but-defer | evidence: moderate | ref: docs/contracts/scenario-proposal-inputs.md:91 | action: defer | note: requiring origin for every v1 evidence item is future hardening, not this slice
