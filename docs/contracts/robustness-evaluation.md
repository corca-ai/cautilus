# Robustness Evaluation

`Cautilus` should expose a bounded robustness-evaluation contract for behavior surfaces that need pressure from mutated inputs, interaction sequences, or implementation perturbations.

The goal is not to turn `Cautilus` into a generic monkey-test runner.
The goal is to give operators one packet-first way to say which behavior is being stressed, which mutation cases are being exercised, what relationship each case is expected to preserve or break, and which weakness was found.

## Problem

Code mutation testing asks whether tests catch meaningful code changes.
Behavior robustness asks a nearby but different question:

`When user behavior, input shape, context, or an evaluated prompt/skill instruction is perturbed, does the behavior contract still hold or fail in the expected way?`

The first useful Cautilus slice is:

`behavior intent + explicit mutation cases + existing evaluator evidence -> robustness report`

This keeps raw generation, replay, UI automation, runner invocation, prompts, and product policy outside the generic contract while making the robustness evidence durable and consumable by evaluation and improvement workflows.

## Ownership

Cautilus owns:

- the request, plan, and report packet contracts
- the expected-relation vocabulary
- relation-status interpretation
- provenance, limitations, reason-code, and next-action fields
- the bridge that lets robustness reports act as improvement evidence

Host repos or adapters own:

- raw logs, traces, screenshots, transcripts, and UI state
- mutation-case generation or selection
- action replay and backend invocation
- prompt, skill, product, and safety policy
- any product-specific oracle beyond the packet-level expected relation

`cautilus.robustness_plan.v1` describes host-provided or adapter-selected cases.
It does not imply that Cautilus can automatically generate, shrink, replay, or fuzz arbitrary user actions.

## Mutation Kinds

Robustness evaluation uses `mutationKind` for test mechanics, not as a new behavior ontology.

`stimulus` mutations perturb what the system receives or how the user acts.
Examples include malformed input, missing context, interruption turns, action-order changes, and semi-invalid values.

`implementation` mutations perturb the evaluated behavior implementation under test.
Examples include prompt variants, skill-instruction variants, weakened guardrail clauses, or intentionally removed source-coverage requirements.

Implementation mutations in this contract are evaluated behavior-mutant cases.
They are not the same thing as `improve search` reflective prompt mutation, which generates candidate improvements from evidence.

## Behavior Intent

Robustness packets compose with `cautilus.behavior_intent.v1`.

The request should include `intentProfile` when the caller already knows the behavior intent.
If the caller does not know a narrower profile yet, it may provide an `intent` string and use the existing `operator_behavior` fallback with existing product-owned dimensions.
Plans and reports should materialize a normalized `intentProfile` so downstream evaluation, review, and improvement consumers do not need to re-run fallback derivation.

Mutation categories such as `invalid_input` or `action_sequence` are mechanics.
They must not become parallel behavior surfaces or dimension catalogs.

## Request Packet

Use `cautilus.robustness_request.v1`.

Minimum shape:

- `schemaVersion`
- `generatedAt`
- `subjectRef`
  - what is being evaluated, such as a prompt file, skill id, app surface, workflow, or adapter target
- `intent` or `intentProfile`
- `riskFocus`
- `sourceEvidenceRefs`
- `requestedMutationKinds`
- optional `baselineRef`
- optional `variantRef`
- optional `limitations`

The request records why robustness pressure is needed.
It does not choose exact cases.

## Plan Packet

Use `cautilus.robustness_plan.v1`.

Minimum shape:

- `schemaVersion`
- `generatedAt`
- `requestRef`
- `subjectRef`
- `intentProfile`
- `caseSource`
  - `declared_case`
  - `adapter_selected`
  - `host_generator`
  - `manual_exploration`
  - `historical_trace`
- `cases`
  - `caseId`
  - `mutationKind`
  - optional `stimulusKind`
    - `user_input`
    - `action_sequence`
    - `context`
    - `invalid_value`
  - optional `implementationKind`
    - `prompt`
    - `skill`
    - `instruction`
    - `guardrail`
  - `expectedRelation`
  - optional `baselineRef`
  - optional `variantRef`
  - `sourceEvidenceRefs`
  - `evaluationSurface`
  - optional `artifactRefs`
  - optional `limitations`

The plan is allowed to point at existing fixtures, scenario ids, preserved transcripts, prompt variants, or adapter-owned replay inputs.
It should not inline large raw logs when an artifact reference can preserve provenance more clearly.
If the request used only `intent`, the plan records the derived `operator_behavior` fallback as `intentProfile`.

## Expected Relations

`expectedRelation` defines what should happen under a mutation case.

- `preserve_behavior`: a benign perturbation should keep the behavior materially equivalent.
- `surface_failure`: the evaluator should expose that a harmful implementation mutation or unsupported state broke the behavior contract.
- `recover`: the system should recover cleanly after interruption, error, or unexpected ordering.
- `clarify`: the system should ask for missing context instead of guessing.
- `refuse`: the system should refuse, block, or decline when the mutated request is unsafe, impossible, or out of scope.

The contract intentionally does not use a bare `should_fail` relation.
Failure can mean a blocked user action, a test failure, a refusal, a lost behavior invariant, or an evaluator signal.
The relation must say which kind of behavior is expected.

## Report Packet

Use `cautilus.robustness_report.v1`.

Minimum shape:

- `schemaVersion`
- `generatedAt`
- `planRef`
- `subjectRef`
- `intentProfile`
- `summary`
  - counts by `relationStatus`
- `caseResults`
  - `caseId`
  - `mutationKind`
  - `expectedRelation`
  - `observedRelation`
  - `relationStatus`
  - optional `brittleDimensions`
  - optional `reasonCodes`
  - optional `sourceEvidenceRefs`
  - optional `artifactRefs`
  - optional `limitations`
- `recommendation`
  - `accept-now`
  - `defer`
  - `reject`
- `nextActions`
  - action-oriented follow-up records such as `improve`, `add-fixture`, `accept-risk`, `investigate`, or `setup-runner`
- optional `limitations`
- optional `reasonCodes`

`relationStatus` values:

- `satisfied`: observed behavior matched the expected relation.
- `violated`: observed behavior contradicted the expected relation.
- `blocked`: the case could not run because a required runner, fixture, permission, or backend was unavailable.
- `invalid`: the mutation case or artifact was malformed, non-comparable, or outside the declared scope.
- `inconclusive`: the evaluator ran but evidence was too noisy, contaminated, or incomplete to classify.

The report avoids raw `killed` and `survived` as primary status values.
Those terms are useful in classic code mutation testing, but behavior robustness needs the expected relation and observed relation before a result can be interpreted.

## Improve Bridge

Robustness reports are weakness-finding evidence for improvement.
They are not candidate-generation authority.

`improve search` may use a robustness report as explicit evidence about brittle dimensions, violated relations, or mutation cases that deserve reflection.
That does not mean `improve search` owns fuzzing, action generation, or behavior-mutant execution.

Until a future schema bridge is implemented, robustness reports should travel through explicit report evidence, review findings, or documented provenance rather than an implied `--robustness-report` command flag.

## Non-Goals

- automatic user-action generation
- random fuzzing, shrinking, or seed management
- browser or UI runner orchestration
- raw log mining
- Charness-specific quality routing
- automatic prompt or skill patching
- a new behavior-surface or dimension taxonomy
- treating robustness evidence as a primary Pareto dimension for improve search

## Acceptance Checks

- [example-request.json](../../fixtures/robustness/example-request.json) validates against [request.schema.json](../../fixtures/robustness/request.schema.json).
- [example-plan.json](../../fixtures/robustness/example-plan.json) validates against [plan.schema.json](../../fixtures/robustness/plan.schema.json).
- [example-report.json](../../fixtures/robustness/example-report.json) validates against [report.schema.json](../../fixtures/robustness/report.schema.json).
