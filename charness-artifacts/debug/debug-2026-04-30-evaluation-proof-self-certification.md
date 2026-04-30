# Debug Review: evaluation proof self certification
Date: 2026-04-30

## Problem

Implementation premortem found that external `proof.productProofReady` could be preserved into evaluation summaries and report proof summaries.

## Correct Behavior

Given an observed packet or report input carries proof metadata, when Cautilus summarizes proof readiness, then product proof readiness must be recomputed from product-owned fields and runner-readiness constraints rather than trusting a caller-provided boolean.

Given a runner assessment is scoped to one target surface, when `eval test` runs a different surface, then the resulting proof must be blocked instead of relabeling the assessment.

## Observed Facts

- `EvaluationProofFromInput` preserved `productProofReady` when present.
- `SummarizeReportProof` used `productProofReady` from normalized proof metadata.
- `evaluationProofProductReady` accepted product proof classes with `runnerAssessmentState=assessed` even when `runnerAssessmentRecommendation` was not `ready-for-selected-surface`.
- `BuildEvaluationProofFromRunnerReadiness` attached the current fixture target surface but did not block assessment surface mismatches.
- `EvaluationProofFromInput` did not preserve `proofBlockers`, so a blocker generated before summary normalization could be lost.

## Reproduction

Construct proof metadata with `targetSurface=app/chat`, `proofClass=live-product-runner`, and `productProofReady=true`, then feed it through `eval evaluate` or `report build`.
Before repair, downstream proof summary could treat that product proof as ready without checking assessment recommendation or verification capability state.

## Candidate Causes

- Proof normalization treated `productProofReady` as a carried packet field instead of a derived field.
- Product proof readiness checked runner state but not the assessment recommendation.
- The first implementation did not bind runner assessment surface to the fixture surface.
- Summary normalization used an incomplete whitelist for derived proof fields.

## Hypothesis

If `productProofReady` is always recomputed, product proof readiness requires `ready-for-selected-surface` plus `runnerVerification.capabilityState=ready`, and assessment surface mismatches become proof blockers, then self-certifying proof metadata and cross-surface relabeling cannot pass the optimize gate.

## Verification

Add targeted unit tests for self-certified proof, not-ready assessment recommendations, surface mismatches, and blocker preservation through summary normalization.
Then run:

```bash
go test ./internal/runtime ./internal/app -run 'EvaluationProof|EvalTestRunsAppChat|ReportPacketSummarizesBlocked|OptimizeInputRejectsBlocked'
npm run verify
```

## Root Cause

The first proof propagation slice preserved caller-supplied readiness fields too eagerly.
Proof class can be carried as evidence metadata, but product-proof readiness is a derived Cautilus verdict.

## Seam Risk

- Interrupt ID: evaluation-proof-self-certification
- Risk Class: contract-freeze-risk
- Seam: proof metadata normalization and optimize preflight
- Disproving Observation: a forged `productProofReady=true` can be represented in input packets
- What Local Reasoning Cannot Prove: whether all external consumers will avoid hand-authoring proof metadata
- Generalization Pressure: factor-now

## Interrupt Decision

- Premortem Required: yes
- Next Step: spec
- Handoff Artifact: charness-artifacts/spec/evaluation-proof-derived-readiness.md

## Prevention

Keep readiness booleans derived in product code.
Allow packets to carry proof facts, but treat product-proof readiness as a computed summary over proof class, recommendation, verification capability state, and surface binding.
