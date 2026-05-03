# Debug Review
Date: 2026-05-04

## Problem

`npm run verify` failed after the skill/agent behavior heuristic started routing an operating-rule claim to `cautilus-eval/dev/skill`.

The failing claim was:

```text
Before changing repo operating contracts, prompt or skill surfaces, exports, or artifact policy, read recent lessons; it owns repeat traps that should change the next move.
```

## Correct Behavior

Given a claim is an operating rule about what to read before changing repo contracts or instruction surfaces, when claim discovery classifies it, then it should remain `human-auditable` and `blocked` instead of becoming an eval target.

Given a claim says a skill or agent should perform observable workflow behavior such as showing a review plan, merging review results, or citing a packet-first artifact, when it is not an operating rule or ownership boundary, then it may route to `cautilus-eval/dev/skill`.

Given a claim mixes skill-controlled workflow selection with a deterministic packet obligation, when claim discovery classifies it, then it should stay `human-auditable` and `needs-alignment` until the claim is split.

Given a claim says the skill or binary should own, must own, or must not own a behavior surface, when claim discovery classifies it, then it should stay `human-auditable` and `needs-alignment`.

## Observed Facts

- `npm run verify` failed in `go test -race ./cmd/... ./internal/...`.
- The failing test was `TestDiscoverClaimProofPlanClassifiesLinkedDocAudienceAndOperatingRules`.
- The claim was classified as `recommendedProof=cautilus-eval`, `recommendedEvalSurface=dev/skill`, and `verificationReadiness=ready-to-verify`.
- The intended test expectation was that operating-rule convention claims stay out of eval planning.
- Fresh-eye review found two related edge cases before commit: a mixed refresh-plan sentence could be moved into eval, and `should own` / `must not own` ownership sentences could miss the ownership-boundary classifier.

## Reproduction

Run:

```bash
go test ./internal/runtime -run 'TestDiscoverClaimProofPlanClassifiesLinkedDocAudienceAndOperatingRules|TestDiscoverClaimProofPlanAvoidsExampleAndBroadRouting'
```

Before the repair, the command failed on the operating-rule convention claim.

## Candidate Causes

- The new `skillOrAgentBehaviorClaim` helper treated any sentence with `skill`, `should`, and `read` as skill behavior.
- The existing `operatorPolicyClaim` rule ran later or was not consulted by the new helper.
- The test fixture used `prompt or skill surfaces`, so a repo operating rule looked syntactically similar to a skill-behavior claim.
- The ownership helper recognized `skill owns` and `binary owns`, but not modal ownership forms such as `should own` and `must not own`.
- The mixed workflow helper ran too late and did not recognize `skill may select refresh, but deterministic refresh-plan output must record ...` as a split-needed boundary.

## Hypothesis

If `skillOrAgentBehaviorClaim` explicitly defers to `operatorPolicyClaim`, then operating rules that mention skill surfaces will stay blocked while actual skill workflow behavior claims still route to `dev/skill`.

If mixed workflow-boundary classification runs before generic deterministic and eval routing, then packet obligations embedded in skill-selection prose will not be hidden in eval buckets.

If ownership classification includes modal ownership forms, then boundary promises will not be mislabeled as deterministic install or prompt behavior.

## Verification

- `go test ./internal/runtime -run 'TestDiscoverClaimProofPlanClassifiesLinkedDocAudienceAndOperatingRules|TestDiscoverClaimProofPlanAvoidsExampleAndBroadRouting'` passes.
- `go test ./internal/runtime -run TestDiscoverClaimProofPlanAvoidsExampleAndBroadRouting` passes after adding mixed refresh-plan and modal ownership regression cases.

## Root Cause

The skill/agent behavior heuristic did not exclude already-known operator policy rules.
It matched the word `skill` inside a repo operating-rule sentence and treated `read recent lessons` as skill behavior instead of operator guidance.
The same lexical broadening also needed explicit boundary guards for mixed packet obligations and modal ownership language.

## Seam Risk

- Interrupt ID: skill-behavior-operator-policy-overlap
- Risk Class: none
- Seam: deterministic claim-discovery heuristic ordering
- Disproving Observation: focused classifier tests caught the operating-rule claim moving into eval planning.
- What Local Reasoning Cannot Prove: whether all remaining policy-like sentences are excluded without broader review.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

When adding a broad lexical claim-routing helper, make it explicitly defer to narrower policy, ownership, and future-work classifiers before generic behavior routing.
Keep focused tests that pair the new positive examples with at least one nearby negative example.
