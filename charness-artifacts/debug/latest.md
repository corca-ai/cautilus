# Debug Review
Date: 2026-07-08

## Problem

The post-commit SkillOpt provenance critique found that the scenario proposal runtime still accepted malformed or absent evidence at the product-owned proposal boundary.
Go accepted numeric optional enum fields such as `origin: 12` and `activityProvenance.split: 12`, initially accepted explicit `null` optional enum fields as absent, and both Go and Node accepted candidates with `evidence: []`.

## Correct Behavior

Given a host provides a `cautilus.scenario_proposal_inputs.v1` packet, when `discover scenarios propose` validates a proposal candidate, then every candidate must carry at least one evidence item and every present optional provenance enum must be a non-empty string from the allowed enum.
The same behavior should hold in the Go CLI runtime and the Node helper runtime.

## Observed Facts

- `docs/contracts/scenario-proposal-inputs.md` requires an `evidence` array with at least one operator-reviewable signal.
- `fixtures/scenario-proposals/input.schema.json` has `evidence.minItems: 1`.
- Go validation only checked that `evidence` was an array.
- Node validation only checked that `evidence` was an array.
- Go read optional `origin` and `activityProvenance.split` through `stringOrEmpty`, so non-string values became empty strings and bypassed enum validation.
- A counterweight review found a second Go gap after the first repair: explicit JSON `null` for `origin` or `activityProvenance.split` was still treated as absent.
- Node used `Set.has` directly and rejected numeric enum values.
- Focused reproductions confirmed the critique findings before repair.

## Reproduction

- Node empty evidence: call `generateScenarioProposals({ proposalCandidates: [candidateWithEvidenceEmptyArray] })`.
  Before repair, it emitted a proposal with `rationale: "0 recent log match(es) suggested this pattern."`.
- Go malformed enum: run `discover scenarios propose` with an input packet whose first evidence item has `"origin": 12`, `"origin": null`, `"activityProvenance": {"split": 12}`, or `"activityProvenance": {"split": null}`.
  Before repair, Go emitted those malformed values unchanged.

## Candidate Causes

- The original implementation treated optional enum absence and optional enum wrong-type as the same case.
- The runtime validators relied on schema tests for `minItems` instead of enforcing the minimum at the runtime boundary.
- The first follow-up critique focused on provenance preservation and did not include malformed type or empty-evidence negative samples.

## Hypothesis

- Falsifiable claim: the runtime bug is caused by missing candidate-level minimum evidence validation plus Go's `stringOrEmpty` use for optional enum validation.
- Disconfirmer: if explicit Go type checks and evidence length checks still allow the malformed inputs, the cause is later merge/proposal construction rather than validation.

## Verification

- Result: confirmed.
- Added Go validation that rejects empty evidence arrays before proposal construction.
- Added Node validation that rejects empty evidence arrays before proposal construction.
- Added Go optional enum validation that distinguishes absent from wrong-type, null, or empty present values.
- Focused Go runtime, Node helper/schema, and Go CLI smoke tests pass after the repair.

## Root Cause

The root cause was incomplete runtime validation at the scenario proposal boundary.
The schema documented the shape, but the runtimes did not enforce the evidence cardinality invariant, and the Go validator used a lossy helper that erased wrong-type optional enum values.

## Invariant Proof

- Invariant: when a host input packet crosses into `discover scenarios propose`, malformed provenance and evidence-free candidates must be rejected before any reviewable proposal packet is emitted.
- Producer Proof: focused Go and Node unit tests now exercise malformed provenance, null optional provenance, and empty evidence before proposal construction.
- Final-Consumer Proof: Go CLI smoke tests now send malformed numeric and null provenance through `discover scenarios propose` and observe non-zero exits with the expected validation errors.
- Interface-Shape Sibling Scan: checked the matching Node helper, Go runtime, schema fixture, schema test, and CLI smoke boundary.
- Non-Claims: this does not prove future v2 semantic rules such as `origin: replayed` requiring `replayId`, nor does it prove rendered HTML provenance detail.

## Detection Gap

- surface: Go runtime provenance tests | what did not fire: no test supplied non-string or null optional enum values | smallest change to fire it: add invalid-type, null, and empty origin and split cases to `TestGenerateScenarioProposalsValidatesOptionalEvidenceProvenance`.
- surface: Node scenario proposal tests | what did not fire: no test supplied `evidence: []` | smallest change to fire it: add an empty-evidence negative case.
- surface: CLI smoke tests | what did not fire: happy-path provenance preservation did not prove public-boundary rejection | smallest change to fire it: add malformed-provenance CLI negative smoke cases for numeric origin, null origin, and null split.
- surface: schema tests | what did not fire: schema validated fixtures only, not runtime rejection behavior | smallest change to fire it: keep schema as shape proof and put runtime rejection in Go/Node tests.

## Sibling Search

- Mental model: schema-bounded optional fields are safe if the happy path preserves them.
- same layer: `scripts/agent-runtime/scenario-proposals.mjs` | decision: same bug, fix now | proof: local unit test now rejects empty evidence.
- same layer: `internal/runtime/proposals.go` | decision: same bug, fix now | proof: local unit test now rejects empty evidence and wrong-type, null, or empty optional enums.
- specialization down: optional provenance identity strings | decision: same class, diagnostic-only for this slice | proof: schema now records `minLength: 1`, runtime already rejects empty strings.
- abstraction up: public CLI boundary | decision: same bug, fix now | proof: CLI negative smoke now rejects numeric and null malformed provenance.
- mental-model sibling: docs wording overclaiming optional provenance as universal provenance | decision: same class, diagnostic-only for this slice | proof: contract wording narrowed to optional v1 validation when present.
- cross-file: `internal/runtime/proposals.go`, `scripts/agent-runtime/scenario-proposals.mjs`, `fixtures/scenario-proposals/input.schema.json`, and `internal/app/cli_smoke_test.go` share the proposal input validation boundary.

## Seam Risk

- Interrupt ID: scenario-provenance-runtime-validation-parity-2026-07-08
- Risk Class: none
- Seam: host-normalized scenario proposal input to product-owned proposal packet generation
- Disproving Observation: focused runtime and CLI tests now exercise the malformed inputs at the boundary that previously accepted them
- What Local Reasoning Cannot Prove: future semantic provenance requirements and rendered HTML review details
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep scenario proposal validation parity checks in both runtimes whenever the packet schema adds a field.
For optional fields, test absent, valid, invalid value, invalid type, and explicit null separately.
For operator-reviewable evidence, pair schema `minItems` with runtime rejection and public CLI smoke when the field crosses a command boundary.
