# Debug Review: claim evidence replay provenance
Date: 2026-05-03

## Problem

Fresh-eye review found that `.cautilus/claims/evidence-remaining-deterministic-claims-2026-05-03.json` mixed current dirty-tree evidence with stale replay metadata.
The evidence bundle named a `repoCommit` before the two new tests existed, and one listed Go command used old test names that no longer exist.

## Correct Behavior

Given a claim evidence bundle records checked-in evidence hashes and commands, when a reviewer replays the bundle from `repoCommit`, then the referenced files and listed tests should exist at that commit.
Given evidence depends on uncommitted tests, then either the tests should be committed first and the evidence bundle should point at that commit, or the bundle should explicitly record dirty-tree provenance.

## Observed Facts

- `repoCommit` was `0bf17afc16d2d736f7e76b5852e3701c59c9257c`.
- `scripts/agent-runtime/build-canonical-claim-map.test.mjs` and `scripts/agent-runtime/optimize-flow.test.mjs` had hashes from the dirty working tree, not that commit.
- The evidence command listed test names such as `TestBuildEvaluationProofUsesAssessedProductRunner` and `TestBuildEvaluationProofDowngradesFixtureRuntime`.
- `go test ./internal/runtime -list 'Test(Evaluation|BuildEvaluation|ReportPacket|RunnerReadiness|DoctorRunner|AgentStatus)'` showed the current names are `TestEvaluationSummaryPreservesRunnerProof`, `TestEvaluationProofDowngradesFixtureRuntimeProofClass`, `TestEvaluationProofPromotesCodexDevRunnerDeclaredProof`, and related tests.
- The affected satisfied claims were replayability-sensitive evidence for runner proof classes, scenario-history absorption, and optimize bounded revision behavior.

## Reproduction

Run:

```bash
go test ./internal/runtime -list 'Test(Evaluation|BuildEvaluation|ReportPacket|RunnerReadiness|DoctorRunner|AgentStatus)'
```

The old test names in the evidence bundle are absent from the list.
Also compare the evidence bundle's `repoCommit` with the commit containing the two new test files.

## Candidate Causes

- The evidence bundle was drafted before the test-only commit existed, so `repoCommit` pointed at the previous claim-artifact commit.
- Test names were copied from an earlier planning summary instead of being replayed from `go test -list`.
- Evidence bundle authoring currently allows free-form command text, so stale command names are only caught by reviewer replay instead of packet validation.

## Hypothesis

If the two tests are committed first, `repoCommit` is updated to that commit, and the runtime command is replaced with current test names discovered by `go test -list`, then the evidence bundle becomes replayable without changing the claim-satisfaction decision.

## Verification

- Committed the two test files in `f51749956997b942eeb09b68fc74929ee6cc7ebf`.
- Updated the evidence bundle `repoCommit` to `f51749956997b942eeb09b68fc74929ee6cc7ebf`.
- Replaced the runtime command with current test names.
- Re-ran the listed evidence commands:

```bash
go test ./internal/runtime -run 'TestEvaluationSummaryPreservesRunnerProof|TestEvaluationProofIgnoresSelfCertifiedProductProofReady|TestEvaluationProofDowngradesFixtureRuntimeProofClass|TestEvaluationProofPromotesCodexDevRunnerDeclaredProof|TestEvaluationProofDoesNotPromoteDevRunnerWithoutObservedRuntime|TestEvaluationProofDoesNotPromoteAppProductRunnerFromSmokeAssessment|TestEvaluationProofRequiresReadyAssessmentRecommendation|TestEvaluationProofBlocksAssessmentSurfaceMismatch|TestEvaluationProofPreservesBlockersThroughSummary|TestReportPacketSummarizesBlockedProductRunnerProof|TestDoctorRunnerReadinessKeepsAdapterReadyWithMissingAssessment|TestRunnerReadinessReportsAssessedSmokeOnlyAndStaleStates|TestRunnerReadinessBlocksProductProofWithoutVerificationCapabilities|TestRunnerReadinessBranchesExposeStableActionShape|TestRunnerReadinessSupportsTypedMultiRunnerAdapters' -count=1
go test ./internal/app -run 'TestCLIOptimizePrepareInputProposeAndBuildArtifact|TestCLIOptimizeProposePrioritizesResidualReportHotspotsBeforeImprovedFallback|TestCLIScenarioProposePreservesFullRankedOutputAndDerivesAttentionView|TestFixtureExamplesValidateAgainstPublishedSchemas' -count=1
node --test scripts/agent-runtime/audit-cautilus-review-prepare-flow-log.test.mjs scripts/agent-runtime/audit-cautilus-reviewer-launch-flow-log.test.mjs scripts/agent-runtime/audit-cautilus-review-to-eval-flow-log.test.mjs scripts/agent-runtime/build-canonical-claim-map.test.mjs scripts/agent-runtime/optimize-flow.test.mjs scripts/agent-runtime/optimization-contract-schemas.test.mjs scripts/agent-runtime/scenario-proposals.test.mjs scripts/agent-runtime/scenario-proposal-schemas.test.mjs
node scripts/check-cautilus-skill-disclosure.mjs
```

All commands passed after the repair.

## Root Cause

The evidence bundle was created in the same uncommitted slice as its supporting tests.
That made it easy to record the previous `HEAD` as `repoCommit` while also recording content hashes from the dirty tree.
The stale test-name copy made the replay gap visible before commit.

## Seam Risk

- Interrupt ID: claim-evidence-replay-provenance
- Risk Class: contract-freeze-risk
- Seam: checked-in evidence bundle provenance versus dirty working tree proof
- Disproving Observation: two evidence file hashes did not exist at the bundle's original `repoCommit`, and one command named tests that `go test -list` did not expose
- What Local Reasoning Cannot Prove: whether future hand-written evidence bundles always use committed replay bases before applying review results
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

For evidence bundles that depend on newly added tests, commit the tests first, then record that commit as `repoCommit` before applying the review result to the claim packet.
When command evidence uses focused test names, verify the names with `go test -list` or by replaying the exact command before attaching the bundle hash.
