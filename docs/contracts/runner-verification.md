# Runner Verification Contract

`Cautilus` runner readiness says whether a repo has a declared, fresh, assessed runner for a selected surface.
Runner verification says whether that assessment explains the capabilities that make the runner honest enough for product-behavior evidence.
This contract keeps that judgment packet-shaped and repo-owned instead of teaching the binary to reverse-engineer arbitrary app code.

## Boundary

The binary validates and reports verification capability evidence.
The binary does not infer semantic honesty from framework files, prompt builders, route handlers, or adapter prose.
The host repo owns the runner, the production-path reuse argument, and the assessment judgment.
The bundled skill may help create or review the assessment, but durable truth must land in a `cautilus.runner_assessment.v1` packet.

Runner verification is not a fourth product command family.
It is setup evidence consumed by `doctor`, `agent status`, `eval`, and later `optimize`.

## Reference Pattern

The internal research note [craken-agent-runtime-verification.md](../internal/research/craken-agent-runtime-verification.md) records one concrete agent-runtime verification structure.
That repo is intentionally more specific than Cautilus should be.
The portable lesson is the four-leg runner proof pattern:

- input simulation: the test can inject a realistic user or system input without bypassing identity, policy, or normal ingress semantics
- external substitution: nondeterministic or costly external dependencies can be replaced with deterministic substitutes at the same boundary the product uses
- trigger control: asynchronous or event-driven execution can be forced or awaited without depending on timing luck
- external observation: behavior can be observed from outside the unit under test through artifacts the runner or agent cannot forge or silently erase

Those legs are capability questions, not implementation prescriptions.
A web app may satisfy them with an HTTP runner, a local service, deterministic model provider, and append-only transcript sink.
A CLI agent may satisfy them with a subprocess wrapper, fake API endpoint, explicit wake command, and externally written audit packet.
An in-process product runner may mark a leg `not-required` only when the assessment explains why the selected surface does not need that capability.

## Assessment Capability Shape

`cautilus.runner_assessment.v1` may include a `verificationCapabilities` object.
The first implementation treats this field as required for product proof classes and optional for smoke proof classes.

Each capability leg is an object with:

- `state`: one of `present`, `missing`, `not-required`, or `unknown`
- `summary`: short human-readable explanation when the leg is `present`
- `reason`: required when the leg is `not-required`
- `evidenceRefs`: optional artifact paths, command ids, docs, packet names, or checked files that support the leg
- `knownGaps`: optional list of explicit limitations

The four product-proof legs are:

- `inputSimulation`
- `externalSubstitution`
- `triggerControl`
- `externalObservation`

Supporting legs may also be reported:

- `reset`
- `fingerprint`
- `stateReusePolicy`

The supporting legs improve repeatability and auditability, but the first implementation does not block readiness on them.

## Product Proof Requirement

For `in-process-product-runner` and `live-product-runner`, a `ready-for-selected-surface` recommendation requires the four product-proof legs to be present or explicitly not required.
If the packet claims readiness but omits those legs, `doctor` and `agent status` must not report a clean ready branch.
They should surface `upgrade_runner_assessment` with missing capability diagnostics.

For `fixture-smoke`, `coding-agent-messaging`, and plain `declared-eval-runner`, the same object is useful but not mandatory.
Those proof classes can support setup checks, fixture shaping, and deterministic smoke confidence without claiming app product-path proof.

## Reporting Rules

`doctor` and `agent status` should summarize capability state without overexplaining the host's implementation.
The stable output should include:

- capability state summary
- per-leg state
- missing required legs for product proof classes
- whether the assessment is blocked by missing verification capability evidence

They should keep top-level adapter readiness separate from runner verification.
A repo can be adapter-ready while its runner assessment is missing, stale, smoke-only, or missing product-proof capability evidence.

## Non-Goals

Do not bake Craken, systemd, SSE, OpenAI, Vercel AI SDK, or any specific framework into the generic contract.
Do not require live user-log replay as the primary repeatable proof.
Do not make the binary run arbitrary smoke commands just because a capability is declared.
Do not turn `claim discover` into the readiness judge.

## Acceptance Checks

- A product-proof assessment with all four required legs can be reported as assessed when freshness checks pass.
- A product-proof assessment that claims `ready-for-selected-surface` but omits required legs is blocked with `upgrade_runner_assessment`.
- A smoke-only assessment can omit `verificationCapabilities` and still report `smoke-only`.
- Invalid leg states are reported as assessment-shape errors.
- The capability summary is visible in the read-only readiness object returned by `doctor` and `agent status`.
