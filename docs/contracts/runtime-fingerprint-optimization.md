# Runtime Fingerprint And Optimization

`Cautilus` should make model and provider changes visible without turning every evaluation into a pinned-model benchmark.

## Problem

Skill tests and instruction-surface tests are meant to exercise the same local CLI environment a real user or agent would use.
By default, those tests should not force a model choice just to make evaluation evidence easier to compare.

That creates two product responsibilities:

- preserve enough runtime identity to explain when evidence was gathered under a different model or provider
- use model-runtime changes as optimization context without inventing a separate refresh workflow or hidden auto-edit path

## Current Slice

This contract defines the first runtime-fingerprint implementation for skill, instruction-surface, report, and optimize flows.
The current implementation covers explicit prior-evidence comparison, adapter-owned pinned runtime policy, and optimize proposal context.

The current slice should:

- preserve observed runtime identity in evaluation telemetry when the runner exposes it
- compare the current observed runtime identity against prior evidence when that prior evidence is available
- surface model-runtime changes as evidence context, not as default test failure
- let `optimize` consume the runtime-change context as one revision reason
- keep prompt compression as a general selection preference instead of a new optimizer kind

The explicit CLI comparison path is `cautilus report build --prior-evidence-file <path>`.
Runtime wrappers and adapter flows may also pass `priorEvidence` and `runtimePolicy` directly in packet input JSON.

## Fixed Decisions

- Skill and instruction-surface tests do not pin a model by default.
  Adapter command templates may still pin a model when the evaluated product explicitly requires one.
- Runtime identity is evidence context unless a consumer or adapter declares a pinned-runtime policy.
  Under the default policy, a model or provider change should produce a context warning, not a failing result.
- The canonical write path for runtime identity is `telemetry.runtimeFingerprint`.
  Existing flat `telemetry.provider`, `telemetry.model`, and `telemetry.session_mode` fields remain valid compatibility inputs and should be normalized into that fingerprint when possible.
- The first comparison path requires an explicit prior-evidence input.
  Automatic selection from active runs, scenario history, or deployment evidence is deferred until the explicit path is proven.
- `Cautilus` should not infer hidden model identity from human-oriented logs.
  Runtime identity must come from explicit machine-readable runner output, adapter-provided metadata, or a checked-in wrapper.
- Runtime drift reason codes belong under a runtime or evidence context, not the primary behavior-outcome `reasonCodes`.
  Reports may summarize the context, but downstream accept/reject decisions should not treat `model_runtime_changed` like `behavior_regression`.
- Pinned runtime policy is adapter-owned and should be declared through a top-level `runtime_policy` block.
  A pinned mismatch blocks the workflow packet because the run did not evaluate the declared runtime, including skill and instruction-surface summaries.
- Optimization should prefer the shortest, least specialized target that preserves or improves the evaluated behavior.
  This is a common selection objective, not a separate optimizer kind.
- A model-runtime change may unlock a passing simplification pass when the existing tests still pass.
  It should not directly auto-edit consumer-owned prompts, skills, or instruction files.
- `optimizer.kind` has been removed from the user-facing optimize surface.
  The previous `repair`, `reflection`, and `history_followup` presets resolved to identical evidence priority in practice and added no behavioral distinction.
  `revisionReasons` and `evidenceFocus` are now derived from the evidence shape itself and surfaced in the proposal packet.

## Runtime Fingerprint Shape

The first fingerprint should be small and explicit:

- `runtime`: CLI or runner family such as `codex`, `claude`, or a consumer-owned runtime id
- `provider`: provider id such as `openai` or `anthropic`
- `model`: observed model id
- optional `resolved_model`: provider-resolved model id when the runtime exposes it separately from the requested alias
- optional `model_revision`: provider-exposed model revision when available
- optional `session_mode`: existing session mode signal such as `ephemeral` or `persistent`
- optional `pricing_version`: pricing catalog version when cost is derived rather than exact
- optional `source`: `runtime_output`, `adapter_metadata`, or `checked_in_wrapper`

The fingerprint should be normalized from existing telemetry fields first.
If only `provider` and `model` are available, that is still useful.
Missing fields are not drift by themselves.
Compare only fields that are present on both current and prior fingerprints.

If current evidence lacks any comparable runtime identity, emit `model_runtime_unobserved`.
If prior evidence lacks runtime identity, emit a non-failing context note that no prior runtime identity was available instead of pretending a change was detected.

## Pinned Runtime Policy

Adapters may declare:

```yaml
runtime_policy:
  mode: observe
```

or:

```yaml
runtime_policy:
  mode: pinned
  runtime: codex
  provider: openai
  model: gpt-5.4-mini
```

`mode: observe` is the default.
It records runtime identity and runtime changes without blocking.

`mode: pinned` means the observed fingerprint must match every declared field that is also observable in the current run.
The blocked result should preserve the declared policy, the observed fingerprint, and a remediation summary.
Alias matching is intentionally not inferred in the first slice unless the runtime emits both requested and resolved model fields.

## Drift Classification

`Cautilus` should classify runtime changes with product-readable reason codes:

- `model_runtime_changed`: observed runtime, provider, model, resolved model, or model revision changed relative to the chosen comparison evidence
- `model_runtime_unobserved`: current evidence lacks enough runtime identity to compare
- `model_runtime_pinned_mismatch`: a pinned-runtime policy was declared and the observed runtime does not match it
- `pricing_catalog_changed`: derived cost was calculated under a different pricing catalog version

Default runtime-context severity:

- `model_runtime_changed`: warning
- `model_runtime_unobserved`: context note unless the adapter requires runtime identity
- `model_runtime_pinned_mismatch`: blocked
- `pricing_catalog_changed`: context note for behavior decisions, warning for budget decisions

`warning` means the operator should notice the context before trusting the recommendation.
`context note` explains evidence provenance without changing the recommendation.

## Optimize Contract

The optimize packet separates four conceptual axes that were previously collapsed under a single `optimizer.kind` selector:

- `revisionReason`: why a revision is considered
- `evidenceFocus`: which evidence source should receive priority
- `mutation`: how candidates are created
- `selectionObjective`: how candidates are preferred after behavioral gates pass

Initial revision reasons:

- `known_regression`
- `review_concern`
- `unstable_history`
- `noisy_evidence`
- `model_runtime_changed`
- `passing_simplification`

Initial evidence focus values:

- `current_report`
- `review`
- `history`
- `balanced`

The default selection objective is:

1. preserve or improve evaluated behavior
2. preserve held-out, comparison, and structured review guardrails
3. prefer shorter and less specialized targets when behavior is equivalent, using measured target-size deltas when candidate snapshots exist
4. prefer lower cost and latency only after behavior and maintainability constraints are satisfied

`passing_simplification` is allowed only when evidence already says the current target passes the relevant behavior checks.
It should generate a candidate or revision brief, then require the same tests and review gates before the candidate is trusted.
`passing_simplification` is the reason to consider a revision.
The shorter-target preference remains the selection objective.

`model_runtime_changed` and `passing_simplification` may both appear in one proposal.
Runtime change can explain why a simplification pass was considered now, but it does not imply simplification is safe without passing evidence.

Model-change-driven optimize suggestions should preserve:

- `runtimeComparison`: old and new runtime fingerprints plus the prior-evidence source
- `passingEvidence`: the checks that still passed before simplification
- `targetSizeDelta`: measured size delta, or `unknown` when no candidate snapshot exists
- `optional: true` when the current target already passes and the proposal is maintainability improvement rather than failure repair

## Non-Goals

- no automatic prompt, skill, or AGENTS.md file edits
- no separate top-level `refresh` command in the first slice
- no provider API polling for model release notes
- no mandatory model pinning for ordinary skill or instruction-surface tests
- no hidden scraping of CLI stderr to invent model truth
- no new `simplification` optimizer kind unless later evidence proves a user-facing mode is necessary

## Constraints

- Keep runtime fingerprints additive and backward-compatible at first.
- Write canonical runtime identity under `telemetry.runtimeFingerprint`.
- Read legacy flat telemetry fields as compatibility inputs when the nested fingerprint is absent.
- Keep provider-specific interpretation below adapter or wrapper boundaries unless the runtime emits explicit normalized fields.
- Do not make historical evidence incomparable just because old packets lack fingerprints.
- Keep active-run artifacts reopenable so a later optimize pass can explain which runtime change triggered a simplification opportunity.

## Success Criteria

- A skill or instruction-surface test can pass while still reporting that the observed runtime changed from the comparison evidence.
- A pinned-runtime adapter can block when the observed runtime does not match its declared requirement.
- Report and evidence packets can carry runtime-context reason codes without treating them as behavior regressions.
- Optimize can propose a bounded simplification candidate after a runtime change without adding a new user-facing optimizer kind.
- Optimize selection records target-size or brevity deltas when candidate snapshots are available.
- The CLI can explain whether a revision was driven by known regression, review concern, unstable history, noisy evidence, runtime change, or passing simplification.

## Acceptance Checks

- Covered: current skill-test telemetry differs from explicit prior evidence and the summary includes `model_runtime_changed` while preserving a passing recommendation.
- Covered: a pinned model policy mismatches observed telemetry and the result is blocked with `model_runtime_pinned_mismatch`.
- Covered: a passing report with runtime change yields `passing_simplification` without adding a new optimizer kind.
- Covered: two optimize-search candidates tied on behavioral scores prefer the shorter target and record `targetSizeDelta`.
- Covered: prior evidence without runtime identity emits `model_runtime_unobserved` rather than failing.

## Probe Questions

- Should runtime-change notes be visible in HTML reports in the first slice, or only in JSON packets and CLI summaries?

## Deferred Decisions

- provider API integration for exact model revision discovery
- external model-release feed ingestion
- richer model capability metadata such as context window, tool-use behavior, or structured-output reliability
- multi-target simplification across coupled skill files and instruction surfaces
- automatic candidate application after tests pass
- automatic comparison evidence selection from active-run state, scenario history, or deployment evidence
## Deliberately Not Doing

- Do not add `simplification` as a fourth optimizer kind in the first design.
  The stronger concept is a common selection objective plus a `passing_simplification` revision reason.
- Do not make runtime drift a default failure.
  Ordinary user environments change, and `Cautilus` should preserve that truth instead of forcing benchmark-style pinning everywhere.
- Do not hide runtime changes inside cost telemetry.
  Behavior evidence and budget evidence both need the runtime identity to remain inspectable.

## Premortem

Fresh-eye review raised these risks before implementation:

Act before ship:

- Fix the runtime fingerprint path before coding.
  `telemetry.runtimeFingerprint` is the canonical write path, and flat telemetry fields are compatibility inputs.
- Fix the comparison source before coding.
  The first slice compares only against an explicit prior-evidence input; automatic source selection is deferred.
- Fix partial-comparison semantics before coding.
  Compare only fields present in both fingerprints, and do not treat missing prior identity as drift.
- Give pinned runtime policy a packet home.
  `runtime_policy` belongs in the adapter and blocked results must preserve both declared and observed runtime identity.
- Make brevity an optimize-search tie-breaker, not a hidden mode.
  `shorter_target` only applies after behavior and guardrails pass.
- Make model-change-driven simplification explain itself.
  Proposals should show runtime comparison, passing evidence, target-size delta, and optionality.

Bundle anyway:

- Keep runtime-context reason codes distinct from behavior-outcome reason codes.
- State that `passing_simplification` is a reason to consider a revision, while shorter-target preference is a selection objective.
- State that `model_runtime_changed` can enable a simplification pass, but does not imply simplification is safe.
- Define warning versus context note in operator terms.
- Treat pinned mismatch as a workflow block for skill and instruction-surface summaries.

## First Implementation Slice

Start with packet and reporting truth before search behavior:

1. normalize runtime fingerprints from existing telemetry
2. compare current fingerprints against one explicit prior-evidence input
3. emit runtime-context reason codes in summaries and reports
4. add pinned-runtime adapter policy only after the default warning path works
5. then wire `model_runtime_changed` and `passing_simplification` into optimize proposal inputs

This sequence keeps the evidence honest before asking optimize search to mutate prompts more aggressively.
