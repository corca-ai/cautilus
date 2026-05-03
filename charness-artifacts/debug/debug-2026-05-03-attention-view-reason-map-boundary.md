# Debug Review
Date: 2026-05-03

## Problem

Fresh-eye review found that scenario proposal `attentionView.proposalKeys` was bounded, but `attentionView.reasonCodesByProposalKey` could still contain entries for matched proposals outside the selected shortlist.

## Correct Behavior

Given `attentionView` is documented as a bounded human-facing shortlist, when proposal or conversation attention selection is capped, then both the selected keys and the corresponding reason map should be bounded to the same selected keys.

## Observed Facts

- `buildScenarioProposalAttentionView` populated `reasonCodesByProposalKey` for every matched proposal before truncating `selectedKeys`.
- `buildScenarioConversationAttentionView` used the same pattern for threads.
- The focused test only checked selected key count and membership, not reason-map membership.
- The evidence wording claimed bounded selected keys and reasons drawn from that list, which was stronger than the old implementation proved.

## Reproduction

```bash
go test ./internal/app -run TestCLIScenarioProposePreservesFullRankedOutputAndDerivesAttentionView -count=1
```

The test passed while not detecting that `reasonCodesByProposalKey` could include keys outside `proposalKeys`.

## Candidate Causes

- The attention view implementation capped only the key list and not associated metadata.
- The test asserted selected key membership but not reason map membership.
- The evidence wording treated the entire attention view as bounded even though only one field was bounded.

## Hypothesis

If the attention builders filter reason maps after key selection and tests assert reason-map keys are a subset of selected keys, then the implementation and evidence will honestly support the documented bounded shortlist claim.

## Verification

Run:

```bash
go test ./internal/app -run 'TestCLIScenarioProposePreservesFullRankedOutputAndDerivesAttentionView|TestCLIScenarioReviewConversationsBuildsScenarioCentricThreadPacket' -count=1
```

## Root Cause

The selection code truncated the primary key list but forgot that reason maps are part of the same human-facing attention view.

## Seam Risk

- Interrupt ID: attention-view-reason-map-boundary
- Risk Class: none
- Seam: scenario packet semantics versus human-facing bounded review surface
- Disproving Observation: reason maps could outgrow selected keys while tests still passed
- What Local Reasoning Cannot Prove: whether external consumers expect reason maps for unselected proposals or threads
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep attention-view tests checking both selected keys and metadata maps whenever a packet claims bounded human-facing review.
