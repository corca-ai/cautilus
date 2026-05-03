# Debug Review
Date: 2026-05-03

## Problem

After claim discovery heuristics reclassified two unchanged claims from deterministic to human-auditable, `claim discover --previous` preserved their old deterministic `nextAction`.

## Correct Behavior

Given a claim has the same fingerprint but only heuristic labels from a previous packet, when current discovery changes its proof classification, then generated routing fields such as `nextAction` should follow the current classification.
Given a claim has an explicit human-reviewed or agent-reviewed next action, when the claim fingerprint is unchanged, then carry-forward may preserve that reviewed operator decision.

## Observed Facts

- `claim-docs-contracts-adapter-contract-md-405` changed to `recommendedProof=human-auditable` and `verificationReadiness=needs-alignment`, but kept `nextAction="Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim."`
- `claim-docs-contracts-adapter-contract-md-533` changed to `recommendedProof=human-auditable` and `verificationReadiness=blocked`, but kept the same deterministic proof action.
- `applyPreviousClaimState` copied `reviewStatus`, `evidenceStatus`, `lifecycle`, `nextAction`, and `evidenceStatusReason` from the previous packet whenever the claim fingerprint matched.
- The previous claims had `reviewStatus=heuristic`, so the stale `nextAction` was not a human or agent decision.

## Reproduction

```bash
./bin/cautilus claim discover --repo-root . --previous .cautilus/claims/evidenced-typed-runners.json --output .cautilus/claims/latest.json
npm run claims:apply-review-results
jq '[.claimCandidates[] | select(.summary=="This keeps prompt benchmarking, code-quality benchmarking, and workflow smoke tests from collapsing into one overloaded adapter file." or (.summary|startswith("Past runs showed some CLIs can reject schemas"))) | {summary,recommendedProof,verificationReadiness,nextAction}]' .cautilus/claims/evidenced-typed-runners.json
```

The output showed current human-auditable proof labels with stale deterministic `nextAction` text.

## Candidate Causes

- Carry-forward copied `nextAction` too broadly for heuristic entries.
- Review-result application may have later overwritten the newly generated `nextAction`.
- Claim fingerprints may not include routing classification fields, so classification changes do not make old heuristic metadata ineligible for carry-forward.

## Hypothesis

If `applyPreviousClaimState` carries `nextAction` only when the previous entry was explicitly reviewed, then heuristic routing refreshes will keep current generated actions while reviewed operator decisions remain stable.

## Verification

Add a regression test where a previous heuristic packet has the same claim fingerprint and a stale deterministic `nextAction`, then run focused claim discovery tests and refresh the self claim packet.

## Root Cause

The carry-forward policy treated `nextAction` as durable state, but heuristic `nextAction` is derived routing metadata.
When the derivation changes, preserving heuristic `nextAction` creates internally inconsistent claim packets.

## Seam Risk

- Interrupt ID: heuristic-next-action-carry-forward
- Risk Class: none
- Seam: claim discovery refresh semantics
- Disproving Observation: unchanged claim fingerprints can still need regenerated heuristic routing fields
- What Local Reasoning Cannot Prove: whether every existing reviewed claim's nextAction should be preserved forever
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Carry forward reviewed decisions separately from derived heuristic routing, and keep a regression test for stale heuristic `nextAction`.
