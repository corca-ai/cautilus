# Consumer Onboarding Recheck Critique
Date: 2026-07-09

## Execution

Parent-delegated fresh-eye critique with two angle reviewers and one counterweight reviewer.
Reviewers inspected the pending diff for the fresh external consumer onboarding smoke, the generated capture, and the critique packet.

## Fresh-Eye Satisfaction

parent-delegated

## Packet Consumed

charness-artifacts/critique/2026-07-09-015157-packet.md

## Target

code critique

## Change

The external consumer onboarding smoke now executes the same first bounded-run packet loop that `doctor.first_bounded_run` advertises: `evaluate fixture` into `.cautilus/runs/first-bounded-run`, then `evaluate observation` over the emitted observed packet.
The checked-in operator-witnessed capture now records recheck recommendation, recheck schema, and repo-relative packet paths.

## Capability at Stake

A fresh consumer should not stop at `doctor ready` or runner invocation.
It should prove one host-owned bounded evaluation packet loop without Cautilus taking over host-owned adapter, fixture, runner, or policy.

## Findings

- Act before ship: stale claim artifacts were the only material blocker found during review.
- Bundle anyway: lock `onboarding.recheckSchemaVersion` in the Host Ownership spec so the capture contract asserts the recorded schema, not only the recommendation.
- Valid but defer: future work may add packet hashes or a minimal reopened-packet invariant to the checked-in capture.
- Over-worry: extending this smoke into `evaluate review prepare-input` is scope creep for this slice and remains a documented next question.

## Counterweight Triage

- Act Before Ship: run the full claim refresh chain and commit the resulting claim state.
- Bundle Anyway: keep the critique prepare packet with this review evidence.
- Over-Worry: concerns that `evaluate observation` takes over host policy do not hold; it only scores the emitted packet.
- Valid But Defer: review-loop proof can be a later external-consumer slice.

## Next Move

Ship after deterministic gates pass, claim freshness is clean, and the critique packet plus this summary are committed with the implementation.
