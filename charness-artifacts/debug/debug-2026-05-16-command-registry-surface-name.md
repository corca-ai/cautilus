# Command Registry Surface Name Debug
Date: 2026-05-16

## Problem

While refreshing stale eval-live evidence, I reused the old command `./bin/cautilus commands --json`, which is no longer a registered top-level command.

## Correct Behavior

Given the current CLI exposes command discovery under `doctor commands`, when checking the command registry, then the probe should use `./bin/cautilus doctor commands --json`.
The failed top-level command should not be treated as a product regression in eval-live behavior.

## Observed Facts

- `go test ./internal/app -run 'TestEveryRegisteredCommandHasAGoHandler|TestCLIEvalLiveDiscoverNormalizesExplicitInstances|TestCLILiveEvalDiscoverExecutesConsumerProbeCommand|TestCLILiveEvalDiscoverIgnoresProbeWarningsOnStderr|TestCLILiveEvalRunLiveDispatchesConsumerCommand|TestCLILiveEvalRunLiveCanExecutePersonaPromptLoop|TestCLILiveEvalRunSimulatorPersonaCanContinueFromFixture|TestCLILiveEvalRunSimulatorPersonaCanStopFromFixture|TestFixtureExamplesValidateAgainstPublishedSchemas' -count=1` passed.
- `go test ./internal/runtime -run 'TestValidateAdapterDataAcceptsExplicitInstanceDiscovery|TestValidateAdapterDataAcceptsCommandInstanceDiscovery|TestValidateAdapterDataRejectsExplicitInstanceDiscoveryWithoutLocation|TestValidateAdapterDataAcceptsLiveRunInvocation' -count=1` passed.
- `./bin/cautilus commands --json` printed usage text and exited non-zero.
- The usage output lists `cautilus doctor commands --json` as the current command-discovery surface.
- `./bin/cautilus doctor commands --json` succeeded and exposed `discover live-targets`, `evaluate live`, `evaluate live prepare-request-batch`, `evaluate live scenarios`, and `evaluate live persona`.

## Reproduction

```bash
./bin/cautilus commands --json
```

## Candidate Causes

- The old evidence bundle from 2026-05-11 used a command name that has since moved under `doctor`.
- I copied the historical command into the refresh workflow without checking current CLI usage.
- The command registry itself could have lost eval-live entries, but the usage output still shows the current command-discovery surface.

## Hypothesis

If this is only a stale operator command name, then `./bin/cautilus doctor commands --json` should succeed and expose the current eval-live command family.

## Verification

The corrected command succeeded:

```bash
./bin/cautilus doctor commands --json
```

The JSON includes `discover live-targets`, `evaluate live`, `evaluate live scenarios`, `evaluate live prepare-request-batch`, and `evaluate live persona`.
The focused app and runtime tests already passed, so the failure is isolated to the stale registry probe command.

## Root Cause

The command registry probe command moved from the old top-level `commands` surface to `doctor commands`, and I reused the historical command without checking current help output first.

## Detection Gap

- stale evidence refresh | historical command evidence was copied before checking current command usage | re-check `./bin/cautilus --help` or the command registry before replaying old command probes.

## Sibling Search

- Mental model: old evidence commands remain directly replayable even after CLI surface consolidation.
- Eval-live axis: use current `evaluate live` and `discover live-targets` command names rather than older `eval live` aliases in new evidence.
- Registry axis: prefer `doctor commands --json` for current command catalog proof.
- Evidence axis: do not let a stale operator probe invalidate focused passing tests unless the corrected current probe also fails.

## Seam Risk

- Interrupt ID: command-registry-surface-name
- Risk Class: none
- Seam: local operator command replay around historical evidence
- Disproving Observation: usage output names the current command-discovery surface, and focused eval-live app/runtime tests passed.
- What Local Reasoning Cannot Prove: whether all historical evidence bundles use only current command names.
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Before replaying historical command evidence, check the current CLI help or command catalog and translate renamed surfaces into current commands.

## Related Prior Incidents

- `debug-2026-05-16-jq-claim-summary-shape.md`: prior stale mental-model error while reading current claim packets.
