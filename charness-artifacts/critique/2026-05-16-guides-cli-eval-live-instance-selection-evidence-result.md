# Guides CLI Eval Live Instance Selection Evidence Critique

## Scope

Fresh-eye review for the claim evidence refresh that moves `claim-docs-guides-cli-md-180` from stale deterministic proof to satisfied deterministic proof.

Success means the evidence stays current-claim-id-bound to the `docs/guides/cli.md` claim that an eval live instance is one live consumer target on this host selected by stable id.

Out of scope: proving real Ceal or other consumer runtime execution, eval-live behavior quality, batch/persona/workspace adjacent claims, and product ownership of consumer launch/auth/runtime wiring.

## Fresh-Eye Satisfaction

parent-delegated.

Three bounded reviewers inspected the pending evidence bundle, review-result, generated projections, focused commands, audit status, and scanner prepare packet context.

## Act Before Ship

- Remove `charness-artifacts/critique/2026-05-16-055716-packet.{json,md}` before commit because it was a findings-free timestamped prepare packet consumed only as scanner context.

## Bundle Anyway

- The evidence bundle is coherent: `repoCommit` resolves to `01c774cc9cf983d34bbdbafc92af0482c726f83b`, checked-in content hashes match current files, and the review-result evidence ref hash matches `sha256:468f007800393a0e686336b0952de5a5e0e3487d136a55a1ad7123e9e07420e4`.
- `createdForClaimIds`, `supportsClaimIds`, and the projection update target only `claim-docs-guides-cli-md-180`.
- Focused verification passed:
  - `go test ./internal/app -run 'TestEveryRegisteredCommandHasAGoHandler|TestCLIEvalLiveDiscoverNormalizesExplicitInstances|TestCLILiveEvalDiscoverExecutesConsumerProbeCommand|TestCLILiveEvalDiscoverIgnoresProbeWarningsOnStderr|TestCLILiveEvalRunLiveDispatchesConsumerCommand|TestCLILiveEvalRunLiveCanExecutePersonaPromptLoop|TestCLILiveEvalRunSimulatorPersonaCanContinueFromFixture|TestCLILiveEvalRunSimulatorPersonaCanStopFromFixture|TestFixtureExamplesValidateAgainstPublishedSchemas' -count=1`
  - `go test ./internal/runtime -run 'TestValidateAdapterDataAcceptsExplicitInstanceDiscovery|TestValidateAdapterDataAcceptsCommandInstanceDiscovery|TestValidateAdapterDataRejectsExplicitInstanceDiscoveryWithoutLocation|TestValidateAdapterDataAcceptsLiveRunInvocation' -count=1`
  - `./bin/cautilus doctor commands --json`
- The command catalog exposes `discover live-targets`, `evaluate live`, `evaluate live prepare-request-batch`, `evaluate live scenarios`, and `evaluate live persona`.
- Projection counts are internally consistent: satisfied `53 -> 54`, stale `21 -> 20`, already-satisfied `53 -> 54`, and `agent-add-deterministic-proof` `86 -> 85`.
- The bundle's `notClaimed` list prevents overclaiming real runtime launch, app behavior quality, multi-instance requirements, consumer auth/runtime ownership, and adjacent eval-live claims.

## Over-Worry

- Requiring real Ceal or external consumer execution would exceed this claim; the claim is stable instance-id selection and packet dispatch boundary proof.
- Persona, batch, and workspace tests appearing in the focused command list do not break the slice because the decision and review-result reason stay narrowed to stable id selection.
- The command catalog JSON shape using command usage/path rather than a top-level command name is not a blocker for this evidence.

## Valid But Defer

- `canonical-claim-map.json` keeps this claim mapped to U2 with `mappingConfidence: medium`, `requiresSemanticReview: true`, and a U7 runner-up tie; reducing live/eval mapping ambiguity is useful but not required for this slice.
- The focused evidence command list could later be narrowed to reduce reading cost.
- Broader critique workflow cleanup for timestamp-only prepare packets belongs outside this claim evidence commit.
