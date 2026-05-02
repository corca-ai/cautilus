# Debug Review: review result line id collision
Date: 2026-05-03

## Problem

After removing an overfit Cautilus skill policy block, line-based skill claim IDs shifted.
Fresh-eye review found that HITL state could read as though an old decision for a removed numbered-branch policy still applied to the new `claim-skills-cautilus-skill-md-68` claim.

## Correct Behavior

Given a historical review-result update names a claim ID that still exists after prose insertion or deletion, when that update also declares the expected claim fingerprint, then replay should apply it only if the current claim fingerprint matches.
Given HITL state references a reused line-based ID, then the state should explain the current claim meaning instead of mixing it with the removed claim's old meaning.

## Observed Facts

- `claim-skills-cautilus-skill-md-68` currently refers to the "Use this path when..." skill-routing claim.
- The removed numbered-branch policy previously occupied nearby line-based IDs.
- `npm run claims:apply-review-results` filtered by claim ID presence only, so a reused ID could receive a stale historical decision if no stronger guard existed.
- `charness-artifacts/hitl/latest.md` said current `md-68` was accepted while also saying the old `md-67/md-68` card was no longer a proof target.

## Reproduction

1. Remove several lines before an accepted skill claim.
2. Rediscover claims so a different sentence receives a previously used `claim-skills-cautilus-skill-md-*` ID.
3. Replay historical review-result packets with `npm run claims:apply-review-results`.
4. Inspect whether the update was applied based on ID alone.

## Candidate Causes

- Claim IDs are line-based and can collide semantically after prose insertions or deletions.
- Historical review-result packets did not carry expected claim fingerprints.
- The replay helper intentionally filtered stale IDs but did not detect reused IDs with changed meaning.
- The HITL latest artifact compressed old and current line IDs in one sentence, making the collision visible to reviewers.

## Hypothesis

If review-result replay checks optional `claimFingerprint` fields against the current claim packet, and current skill-line HITL review-result updates carry fingerprints, then reused line IDs with mismatched meaning will be dropped instead of silently applied.

## Verification

- Added replay-helper coverage for reused claim IDs with mismatched fingerprints.
- Reran `npm run claims:apply-review-results`; it kept the current `claim-skills-cautilus-skill-md-68` update only because the fingerprint matched the current skill-routing claim.
- Regenerated claim validation, status, eval plan, review queues, worksheet, and status report.
- `claim validate` reported `valid=true`, `errorCount=0`, and `warningCount=0`.

## Root Cause

The replay helper treated claim ID existence as sufficient continuity.
That is not safe for line-based IDs when prose edits can assign the same ID to a different sentence.

## Seam Risk

- Interrupt ID: review-result-line-id-collision
- Risk Class: none
- Seam: historical review-result replay over line-based claim IDs
- Disproving Observation: replay now drops updates with mismatched `claimFingerprint`, and the current HITL artifact distinguishes the current `md-68` skill-routing claim from the removed numbered-branch policy.
- What Local Reasoning Cannot Prove: whether all future review-result packets should be required to include source packet fingerprints or claim fingerprints at the schema level.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

When review-result packets are meant to survive source edits, include an expected claim fingerprint for any line-based claim ID whose source file is likely to churn.
