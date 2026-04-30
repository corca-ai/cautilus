# Runner Readiness Contract

`Cautilus` has three product command families: `claim`, `eval`, and `optimize`.
Those families only produce honest app-behavior evidence when the host repo exposes an appropriate headless runner.
This contract defines runner readiness as the setup substrate below the three product jobs, not as a fourth product job.

## Problem

The current `eval` surface can run checked-in fixtures through adapter-owned commands.
That is enough for development-agent behavior and cheap app-surface smoke tests.
It is not enough to claim that an app's real behavior is protected unless the host runner reuses the product's real behavior path.

For app repos, a prompt-only fixture can accidentally test a copied prompt instead of the product.
A live log replay can accidentally test old traffic rather than the current app.
A direct API call can accidentally bypass route policy, tool wiring, state, or middleware.

The product needs a clearer setup/readiness layer that answers a smaller question first:

Does this repo have a headless runner that can execute the selected behavior surface without a GUI while staying close enough to the real product path to support the intended proof?

## Current Slice

Define the contract and vocabulary for runner readiness.
Do not implement a new public command family in this slice.
Do not make `claim discover` judge whether a runner is honest.
Do not make `doctor` infer semantic honesty from source code alone.

The immediate design change is conceptual and packet-shaped.
The first implementation slice should be read-only readiness visibility through `doctor` and `agent status`, plus a minimal runner assessment schema and example.
`claim`, `eval`, and `optimize` behavior changes consume this readiness data in later slices or only when the data already exists.

The durable product model is:

- `claim` records proof requirements.
- `doctor` and `agent status` report runner readiness evidence.
- `eval` executes adapter-declared runners and records the observed behavior packet.
- `optimize` requires runner-backed proof before changing behavior.

## Concept Model

### Product Jobs

`claim` discovers and organizes declared behavior claims into proof requirements.
`eval` runs bounded behavior evaluations through adapter-declared runners.
`optimize` improves behavior only after the proof surface is honest.

### Setup Substrate

Runner readiness is a setup/readiness substrate under those product jobs.
It is a cross-cutting precondition, not a fourth product job.
The user should still learn the three command families first.

### Runner

A runner is a bounded headless command that takes product-readable input and writes a Cautilus-readable observed packet.
For `dev` surfaces, the runner is usually a coding-agent CLI such as Codex or Claude Code plus a repo-owned wrapper that records transcripts or audit packets.
For `app` surfaces, the runner is a host-owned product CLI that reuses the real app behavior path without requiring a GUI.

### Headless Product Runner

A headless product runner is an app runner that can execute product behavior from a CLI or local command while reusing production-adjacent prompt composition, tool registry, state policy, and response logic.
It may run in-process by importing route or service code.
It may run through a local server or selected live instance.
Both forms are valid if the packet says what path was used and what was observed.

### Runner Assessment

A runner assessment is an evidence packet or durable review note that records whether a runner is fit for a selected surface.
It is produced by an agent, maintainer, or future bounded review workflow.
The binary may validate its shape, freshness, and referenced hashes.
The binary should not pretend it can prove semantic honesty from adapter existence alone.

## Fixed Decisions

### Claim Records Requirements, Not Readiness Verdicts

`claim discover`, claim review, and `claim plan-evals` may classify a behavior claim as evaluator-dependent.
They may also record the runner capability required to prove it.
They must not decide that the current repo runner is honest enough.

Example requirement shape:

```json
{
  "proofMechanism": "cautilus-eval",
  "recommendedEvalSurface": "app/chat",
  "requiredRunnerCapability": "headless-product-chat-runner",
  "requiredObservability": [
    "transcript",
    "finalText",
    "runtimeFingerprint"
  ]
}
```

If tools, retrieval, durable state, or side effects are part of the claim, the required observability should name those needs explicitly.

### Doctor Reports Evidence, Not Semantic Certainty

`doctor` can check mechanical readiness:

- adapter validity
- declared runner command templates
- placeholder resolvability
- runner script existence
- smoke command success when the adapter declares a cheap smoke
- output packet schema validity
- assessment packet existence
- assessment freshness against the current commit, adapter hash, and runner file hashes

`doctor` should not infer that a runner shares production behavior by reading arbitrary app code.
That judgment belongs in a runner assessment.

### Agent Status Orients The Next Step

`agent status` should remain a read-only orientation packet.
It should combine binary health, skill surface readiness, adapter state, claim state, and runner readiness status.
It should present next branches such as initialize adapter, refresh claim state, create runner assessment, run runner smoke, inspect existing claim map, or run eval.

`agent status` may say a runner assessment is missing or stale.
It should not silently downgrade app proof to prompt-only smoke when the selected claim requires a headless product runner.
It must not create assessments, run smoke commands, refresh claim state, or mark semantic readiness by itself.

Runner-readiness branches should be ordered by the blocker that prevents honest evaluation:

1. adapter missing or invalid
2. runner template missing or invalid
3. runner smoke unavailable or failing
4. runner assessment missing
5. runner assessment stale
6. runner assessment present but not ready
7. runner ready for the selected requirement

Each branch should expose a stable id, human label, blocking reason, required command or artifact, owning product family or setup helper, and whether the branch writes files.

### Eval Executes The Runner

`eval test` remains the execution surface.
It should run the selected adapter-declared runner and write the observed packet.
The observed packet should distinguish fixture-backed smoke, coding-agent messaging, in-process product runner, and live/server product runner.

The evaluation summary should preserve that proof class so downstream reports do not overread a cheap smoke as app E2E evidence.

### Optimize Requires Runner-Backed Evidence

`optimize` should not start from a claim whose proof requirement needs an app runner that is absent, stale, or only smoke-backed.
When only fixture smoke exists, optimize may prepare or explain missing proof, but it should not claim behavior improvement.
Default rule: `app/chat` and `app/prompt` claims that require product behavior proof require `in-process-product-runner` or `live-product-runner` plus a `ready-for-selected-surface` assessment before `optimize` may claim behavior improvement.
`fixture-smoke` and `coding-agent-messaging` may support setup validation, scenario shaping, or explanation-only optimize output.
They must be marked non-actionable for app behavior improvement unless the claim explicitly targets that proof class.

## Runner Proof Classes

The product should keep a small vocabulary for how strong the runner evidence is.

`fixture-smoke` means the product path and command routing can be exercised cheaply, but the result does not prove model or app behavior.
`coding-agent-messaging` means a coding-agent CLI in messaging mode ran a prompt-like app fixture.
`in-process-product-runner` means the host runner imported product code and reused product behavior components without GUI or network server routing.
`live-product-runner` means the host runner invoked a local server, selected live instance, or deployment-like runtime.

These are proof classes, not surface presets.
The surface presets remain `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt`.
`app/chat` and `app/prompt` describe fixture and turn shape, not proof strength.
A direct API or coding-agent messaging run of the same prompt is `coding-agent-messaging` unless an assessment shows product-path reuse.
App claims that depend on route policy, tools, retrieval, state, middleware, or side effects require `in-process-product-runner` or `live-product-runner` evidence before downstream reports may describe the result as runner-backed product-path evidence.

## Runner Assessment Packet

The first implementation should define a minimal `cautilus.runner_assessment.v1` packet.
The packet should be checkable by `doctor` and readable by `agent status`.

Minimum fields:

- `schemaVersion`
- `runnerId`
- `surface`
- `proofClass`
- `assessedBy`
- `assessedAt`
- `repoCommit`
- `adapterPath`
- `adapterHash`
- `runnerFiles`
- `claims`
- `assessedRequirement`
- `productionPathReuse`
- `observability`
- `knownGaps`
- `recommendation`

`runnerFiles[]` is an array of `{path, sha256}` records with repo-relative paths.
`adapterHash` is a `sha256:<hex>` hash of the adapter file.
An assessment is stale when the current git commit differs from `repoCommit`, the current adapter hash differs from `adapterHash`, any listed runner file is missing, or any listed runner file hash differs.
`runnerFiles` must include every host-owned file the assessment relies on for production path reuse, not only the wrapper script.
If the host cannot enumerate transitive files, `knownGaps` must say so.
A claim that depends on untracked production-path components cannot receive `ready-for-selected-surface`.

`assessedRequirement` scopes the assessment to a specific proof requirement.
It should name the claim id or claim group, surface, required runner capability, and required observability.
`ready-for-selected-surface` does not mean the repo or app is generally ready.
It means the assessed runner is fit for the listed requirement with the listed known gaps.

`productionPathReuse` should name the reused modules, route handlers, services, prompt builders, tool registries, state stores, or policy modules.
`observability` should state which artifacts the runner emits, such as normalized messages, transcript, final text, tool calls, tool results, runtime fingerprint, side-effect summary, and diagnostics.
`knownGaps` should be explicit so a runner can be useful without pretending to be full E2E.

The default assessment path is `.cautilus/runners/<runner-id>.assessment.json`.
The first implementation must provide one operator-copyable assessment scaffold path through the existing product surface without introducing a public `runner` command family.
`agent status` and `doctor --next-action` should name the expected assessment path, runner id, selected surface, proof class, and one concrete scaffold source.
The bundled skill may help fill judgment fields, but operators should not have to author `cautilus.runner_assessment.v1` from prose alone.

Recommendation values should be narrow:

- `ready-for-selected-surface`
- `smoke-only`
- `needs-instrumentation`
- `needs-production-path-reuse`
- `blocked`

## Adapter Boundary

The adapter should declare runner commands and any cheap smoke checks.
The adapter should not carry long prose arguments for why the runner is honest.
That belongs in the runner assessment packet.

The first implementation may reuse `eval_test_command_templates` for execution, but plain templates imply only `declared-eval-runner`.
They do not imply `fixture-smoke`, `coding-agent-messaging`, `in-process-product-runner`, or `live-product-runner`.
A proof class is visible only when supplied by `cautilus.runner_assessment.v1` or an explicitly typed future adapter runner entry.

A future typed adapter section may include:

```yaml
runner_readiness:
  runners:
    - id: app-chat-local
      surfaces:
        - app/chat
      proof_class: in-process-product-runner
      command_template: node scripts/eval/run-product-chat.mjs --request-file {eval_cases_file} --output-file {eval_observed_file}
      smoke_command_template: node scripts/eval/run-product-chat.mjs --smoke --output-file {output_dir}/runner-smoke.json
      assessment_path: .cautilus/runners/app-chat-local.assessment.json
```

This is an example shape, not a locked schema.
The first implementation should reuse the existing `eval_test_command_templates` path where possible before adding a new adapter section.
If the first slice adds metadata beside existing templates, it should add only the minimum binding needed for readiness status: `runnerId`, `surfaces`, `proofClass`, optional `smokeCommandTemplate`, and `assessmentPath`.
`doctor` should report specific missing-field diagnostics for those bindings instead of collapsing them into generic adapter-not-ready output.

## Skill Design

The bundled `cautilus` skill should keep one progressive surface.
It should not split into separate discover, eval, optimize, and runner skills.

The skill should use the binary for command discovery and examples.
It should not duplicate the command catalog.
Its value is sequencing and judgment:

- orient from `agent status`
- decide whether the user is in `claim`, `eval`, `optimize`, or setup/readiness work
- explain when app proof is only smoke-backed
- help create or review a headless product runner
- help produce a runner assessment packet
- keep `claim` focused on proof requirements
- keep `eval` focused on observed behavior
- stop `optimize` when runner-backed proof is missing

For app repos, the skill should prefer creating a headless product runner over extracting prompts into a standalone mock.
Prompt-only fixtures are useful smoke tests, not the highest-confidence app proof.

## Relationship To Live Run Workbench

The existing workbench instance and live-run invocation contracts are compatible with this design.
They are one way to implement a `live-product-runner`.
They should not become the only runner model.

Simple app repos should be able to expose one in-process product runner without adopting multi-instance workbench concepts.
More complex apps can use instance discovery and live-run invocation when selected local or live targets matter.

## Probe Questions

- Should runner readiness be a new adapter section or an extension of `eval_test_command_templates`?
- Should `claim plan-evals` emit `requiredRunnerCapability` in the first slice or should that wait until runner assessment packets exist?
- How much of `cautilus.runner_assessment.v1` should be written by a binary helper versus by the bundled skill?
- How much output observability is required for tool-using app claims before the product should call an evaluation result actionable?

## Deferred Decisions

- automated source analysis that tries to infer production path reuse
- remote runner authentication and session management
- streaming transcript capture
- generic SDK-specific prompt extraction for frameworks such as Vercel AI SDK
- a public `runner` command family
- making runner assessments mandatory for all `dev` surfaces

## Non-Goals

- Do not turn Cautilus into a framework-specific app test harness.
- Do not make the binary own host product prompts, tool definitions, storage readers, or route layout.
- Do not require GUI automation for app behavior proof.
- Do not treat real user log replay as the main repeatable proof path.
- Do not let prompt-only fixtures claim full app behavior coverage.

## Deliberately Not Doing

Do not move app prompt extraction into the binary.
The host repo understands how its prompt is composed and how its tools and state are wired.

Do not make `claim discover` scan source code until it can explain the proof requirement without pretending to prove runner readiness.
Source-code prompt mining may become a future explicit source or adapter-owned probe, but it is not the default claim job.

Do not add a fourth user-facing product job called runner.
Runner readiness is a setup substrate under `claim`, `eval`, and `optimize`.

## Constraints

The three command-family vocabulary stays `claim`, `eval`, and `optimize`.
The binary remains repo-agnostic.
Host repos own runners, prompts, wrappers, fixtures, and policy.
The skill may guide runner creation, but reusable deterministic behavior belongs in code, adapters, packets, and tests.
Runner assessment freshness must be checkable from concrete file paths, hashes, and commits.
Proof class must remain visible in downstream summaries and reports.

## Success Criteria

1. A maintainer can tell whether a selected app claim lacks a runner, has only fixture smoke, or has runner-backed proof.
2. `claim` output can name the runner capability required without claiming the current runner is ready.
3. `doctor` and `agent status` can show runner assessment existence and freshness without pretending to perform semantic review.
4. `eval` summaries preserve proof class so humans and agents do not overread weak runs.
5. `optimize` refuses or blocks when an app claim requires runner-backed proof and only smoke evidence exists.
6. A simple app repo can adopt Cautilus with one headless product runner without adopting the full workbench instance model.

## Acceptance Checks

The first implementation slice should include:

- doctor packet tests proving top-level `ready` semantics do not change when `runnerReadiness` is missing or stale
- doctor packet tests for `runnerReadiness.state`: `missing-assessment`, `smoke-only`, `assessed`, `stale`, and `unknown`
- agent status tests showing runner readiness next branches and branch ordering
- schema or fixture tests for one valid `cautilus.runner_assessment.v1` packet and one stale packet
- adapter fixture coverage proving plain `eval_test_command_templates` imply only `declared-eval-runner`, not a product proof class
- one fixture-backed simple app runner assessment example that does not use workbench instance discovery

Follow-up slices should include:

- claim packet tests proving `requiredRunnerCapability` is a requirement field, not a readiness verdict
- eval-summary tests preserving proof class from observed packets
- optimize preflight tests blocking app improvement when runner-backed proof is missing
- one workbench-backed live runner example showing live-run compatibility while preserving `knownGaps`, not claiming full app E2E coverage

## Premortem

Fresh-Eye Satisfaction: parent-delegated.

Act Before Ship:

- Keep the first implementation slice read-only for `doctor` and `agent status`, with a minimal runner assessment schema and example before changing `claim`, `eval`, or `optimize` behavior.
- Ensure plain `eval_test_command_templates` imply only `declared-eval-runner`, not an app proof class.
- Fix the app optimize threshold: product-behavior improvement needs `in-process-product-runner` or `live-product-runner` plus `ready-for-selected-surface`.
- Define assessment freshness with concrete repo commit, adapter hash, and runner file hash rules.
- Provide an operator-copyable assessment scaffold path and deterministic branch ordering.

Bundle Anyway:

- State explicitly that `app/chat` and `app/prompt` are fixture shapes, not proof strength.

Over-Worry:

- Treating `agent status` branch labels as a fourth product workflow is over-worry once the branch ordering keeps ownership visible and status remains read-only.
- Removing workbench compatibility from this contract is over-worry; it should stay as compatibility framing, not first-slice scope.

Valid But Defer:

- Source-code inference, remote auth, streaming transcripts, framework-specific prompt extraction, and a public `runner` command family remain deferred.

## Canonical Artifact

`docs/contracts/runner-readiness.md`.

This document is the current design contract for runner readiness.
Implementation notes should update this document before changing adapter, doctor, status, claim, eval, or optimize behavior in ways that affect the runner substrate.

## First Implementation Slice

Start with read-only packet and status visibility before broad behavior changes.

1. Add a separate `runnerReadiness` object to `doctor` and `agent status` without changing top-level adapter `ready` semantics.
2. Define `cautilus.runner_assessment.v1` and one checked example under the default assessment path shape.
3. Implement stale assessment detection for repo commit, adapter hash, and listed runner file hashes.
4. Treat plain `eval_test_command_templates` as `declared-eval-runner` only.
5. Teach `agent status` to surface missing, stale, smoke-only, not-ready, and ready runner states as read-only next branches.

Follow-up implementation slices:

1. Add `requiredRunnerCapability` and `requiredObservability` to claim eval-planning output without using those fields as readiness verdicts.
2. Add `proofClass` to `eval-observed.json` and `eval-summary.json` under a stable `proof` path once the runner or assessment can supply it.
3. Block behavior-changing `optimize` for app claims when runner-backed product-path evidence is missing.
4. Add a live-run-backed runner example that references the existing workbench contracts without making workbench mandatory for simple app repos.
