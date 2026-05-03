# Debug Review
Date: 2026-05-03

## Problem

Applying the current eval-surface review-result produced an invalid evidenced claim packet.
`claim validate` reported `evidence ref must include this claimId in supportsClaimIds` at `$.claimCandidates[90].evidenceRefs[1].supportsClaimIds`.

## Correct Behavior

Given a claim is marked `evidenceStatus=satisfied`, when the review-result attaches a verified evidence ref, then each attached evidence ref must directly list that same claim id in `supportsClaimIds`.
Related supporting bundles may be cited inside the primary bundle's `relatedEvidence`, but they should not be attached as direct verified refs unless they support the current claim id.

## Observed Facts

- `.cautilus/claims/review-result-current-eval-surfaces-2026-05-03.json` attached two evidence refs to `claim-docs-specs-user-evaluation-spec-md-11`.
- The primary eval-surface bundle listed `claim-docs-specs-user-evaluation-spec-md-11` in `supportsClaimIds`.
- The secondary dev-skill bundle listed only its original bounded claim ids, `claim-readme-md-151` and `claim-readme-md-219`.
- `./bin/cautilus claim validate --input .cautilus/claims/evidenced-typed-runners.json` rejected the aggregate packet with one error.
- Package scripts include `claims:apply-review-results`, `claims:canonical-map`, `claims:review-worksheet`, and `claims:status-report`, but not `claims:status-summary` or `claims:plan-evals`; the correct commands are `claim show --output` and `claim plan-evals --output`.
- After the evidence-ref fix, the aggregate packet validated, but two newly satisfied claims still carried `verificationReadiness=needs-scenario` because the older `review-result-eval-bucket-user-b-2026-05-03.json` had a later `reviewedAt` timestamp and replayed after the new evidence application.
- Fresh-eye review then found a semantic blocker: `claim-docs-specs-user-evaluation-spec-md-12` includes service-response behavior, while the new evidence bundle only proves app/chat and app/prompt.

## Reproduction

```bash
npm run claims:apply-review-results
./bin/cautilus claim validate --input .cautilus/claims/evidenced-typed-runners.json
jq '.claimCandidates[90] | {claimId, summary, evidenceRefs}' .cautilus/claims/evidenced-typed-runners.json
```

## Candidate Causes

- The review-result attached a related bundle as direct claim evidence even though that bundle did not name the current claim id.
- The aggregate replay helper failed to normalize or drop invalid direct evidence refs.
- The evidence bundle shape allowed `relatedEvidence`, and I duplicated that relationship in the direct `evidenceRefs` path by mistake.

## Hypothesis

If the review-result keeps only the primary eval-surface evidence bundle as a direct evidence ref for `claim-docs-specs-user-evaluation-spec-md-11`, while the primary bundle retains the dev-skill bundle in `relatedEvidence`, then aggregate replay should validate with zero issues.
If the new evidence-application review-result carries an actual later `reviewedAt`, then the satisfied update should replay after the earlier no-evidence review and keep `verificationReadiness=ready-to-verify`.
If the current evidence removes `claim-docs-specs-user-evaluation-spec-md-12` from direct support, then the service-response-containing claim should remain unknown and needs-scenario while the app/chat and app/prompt proof still supports narrower evaluation claims.

## Verification

- Removed the secondary direct evidence ref from `claim-docs-specs-user-evaluation-spec-md-11`.
- `npm run claims:apply-review-results`
- `./bin/cautilus claim validate --input .cautilus/claims/evidenced-typed-runners.json`
- `./bin/cautilus claim show --input .cautilus/claims/evidenced-typed-runners.json --sample-claims 8 --output .cautilus/claims/status-summary.json`
- `./bin/cautilus claim plan-evals --claims .cautilus/claims/evidenced-typed-runners.json --output .cautilus/claims/eval-plan-reviewed-eval-claims-2026-05-03.json`
- `npm run claims:canonical-map`
- `npm run claims:status-report`
- `npm run claims:review-worksheet`

Validation now reports `valid=true` and `issueCount=0`.
The newly satisfied evaluation-spec claims now carry `verificationReadiness=ready-to-verify`.
`claim-docs-specs-user-evaluation-spec-md-12` now remains `evidenceStatus=unknown` and `verificationReadiness=needs-scenario`.

## Root Cause

I confused bundle-level related evidence with direct claim evidence.
The validator is correctly strict: a direct evidence ref for a satisfied claim must itself include that claim id in `supportsClaimIds`.
I also gave the new evidence application a placeholder `reviewedAt` that sorted before an older no-evidence eval-bucket review from the same day.
I also initially treated prompt/chat evidence as enough for a broader app-facing claim that still names service-response behavior.

## Seam Risk

- Interrupt ID: eval-surface-related-evidence-ref
- Risk Class: none
- Seam: evidence-bundle composition versus direct claim evidence refs
- Disproving Observation: validation rejected the aggregate packet until the related bundle was removed from direct evidence refs.
- What Local Reasoning Cannot Prove: whether future evidence bundle schemas should expose related evidence in status summaries without tempting authors to attach it as direct claim evidence.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

When a bundle depends on earlier proof, cite it under `relatedEvidence` in the new bundle and attach only the new bundle as the direct verified ref unless the earlier bundle explicitly lists the current claim id.
When a review-result intentionally supersedes an earlier review-result, use the real review time rather than a date placeholder so aggregate replay preserves the intended order.
When a claim includes an uncovered example such as service-response, leave the whole claim unknown or split the source claim before marking only the covered subset satisfied.

## Related Prior Incidents

- `charness-artifacts/debug/debug-2026-05-03-verified-evidence-downgrade.md`: showed that evidence replay needs strict semantics around verified evidence state.
- `charness-artifacts/debug/debug-2026-05-03-review-result-line-id-collision.md`: showed that review-result replay must preserve exact claim identity, not just nearby semantics.
