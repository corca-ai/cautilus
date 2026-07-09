# Claim Review Drop Summary

This is a readable projection of aggregate claim review replay drops.
Use the JSON packet as the audit source; this document does not recover stale updates or infer identity.

## Packet

- Source claim packet: .cautilus/claims/evidenced-typed-runners.json
- Source claim packet commit: f1f9bad762f5e86ed221196b159e901e1522e458
- Source claim count: 567
- Applied review results: 90
- Skipped review results: 50
- Kept updates: 223
- Rewritten updates: 152
- Dropped updates: 305
- Drop reasons: missing-fingerprint: 165, missing-live-fingerprint: 140
- Recorded samples: 20
- Sample policy: bounded-reason-representation
- Sample cap: 20
- Source recorded samples: 20
- Selected samples: 20
- Proportional sampling: no
- Source replay sample policy: bounded-reason-representation

## Action Classes

- missing-fingerprint: 165 update(s)
  - Class: unrecoverable
  - Sample coverage: 19/165; represented
  - Action: Do not infer-match this update; regenerate or re-review against the current claim packet so the update carries claimFingerprint.
  - Queue hint: Prepare fresh review-input for the currently live claims instead of carrying the stale update forward.
- missing-live-fingerprint: 140 update(s)
  - Class: stale-fingerprint
  - Sample coverage: 1/140; represented
  - Action: Treat this as stale review debt; inspect whether the source claim was removed, rewritten, or should be reviewed again in the current packet.
  - Queue hint: Use the reviewResultPath and claimFingerprint to decide whether a focused review-input queue is warranted.

## Sample Coverage

- missing-fingerprint: 19/165 recorded sample(s); represented
- missing-live-fingerprint: 1/140 recorded sample(s); represented

## Review Result Samples

- .cautilus/claims/review-result-loop1-lane-a.json
  - Recorded sample drops: 8
  - Reasons: missing-fingerprint: 8
  - Sample claim ids: claim-readme-md-13, claim-readme-md-149, claim-readme-md-7, claim-readme-md-137, claim-readme-md-91
- .cautilus/claims/review-result-loop2-lane-a.json
  - Recorded sample drops: 6
  - Reasons: missing-fingerprint: 6
  - Sample claim ids: claim-readme-md-13, claim-readme-md-149, claim-readme-md-7, claim-readme-md-3, claim-readme-md-153
- .cautilus/claims/review-result-loop1-lane-b.json
  - Recorded sample drops: 5
  - Reasons: missing-fingerprint: 5
  - Sample claim ids: claim-readme-md-148, claim-readme-md-232, claim-readme-md-171, claim-readme-md-159, claim-readme-md-211
- .cautilus/claims/review-result-hitl-audience-2026-05-02.json
  - Recorded sample drops: 1
  - Reasons: missing-live-fingerprint: 1
  - Sample claim ids: claim-skills-cautilus-skill-md-112

## Bounded Samples

- claim-readme-md-13
  - Review result: .cautilus/claims/review-result-loop1-lane-a.json
  - Reason: missing-fingerprint
  - Action class: unrecoverable
- claim-readme-md-149
  - Review result: .cautilus/claims/review-result-loop1-lane-a.json
  - Reason: missing-fingerprint
  - Action class: unrecoverable
- claim-readme-md-7
  - Review result: .cautilus/claims/review-result-loop1-lane-a.json
  - Reason: missing-fingerprint
  - Action class: unrecoverable
- claim-readme-md-137
  - Review result: .cautilus/claims/review-result-loop1-lane-a.json
  - Reason: missing-fingerprint
  - Action class: unrecoverable
- claim-readme-md-91
  - Review result: .cautilus/claims/review-result-loop1-lane-a.json
  - Reason: missing-fingerprint
  - Action class: unrecoverable
- claim-readme-md-95
  - Review result: .cautilus/claims/review-result-loop1-lane-a.json
  - Reason: missing-fingerprint
  - Action class: unrecoverable
- claim-readme-md-148
  - Review result: .cautilus/claims/review-result-loop1-lane-a.json
  - Reason: missing-fingerprint
  - Action class: unrecoverable
- claim-readme-md-232
  - Review result: .cautilus/claims/review-result-loop1-lane-a.json
  - Reason: missing-fingerprint
  - Action class: unrecoverable
- claim-readme-md-148
  - Review result: .cautilus/claims/review-result-loop1-lane-b.json
  - Reason: missing-fingerprint
  - Action class: unrecoverable
- claim-readme-md-232
  - Review result: .cautilus/claims/review-result-loop1-lane-b.json
  - Reason: missing-fingerprint
  - Action class: unrecoverable
- claim-readme-md-171
  - Review result: .cautilus/claims/review-result-loop1-lane-b.json
  - Reason: missing-fingerprint
  - Action class: unrecoverable
- claim-readme-md-159
  - Review result: .cautilus/claims/review-result-loop1-lane-b.json
  - Reason: missing-fingerprint
  - Action class: unrecoverable
- claim-readme-md-211
  - Review result: .cautilus/claims/review-result-loop1-lane-b.json
  - Reason: missing-fingerprint
  - Action class: unrecoverable
- claim-readme-md-13
  - Review result: .cautilus/claims/review-result-loop2-lane-a.json
  - Reason: missing-fingerprint
  - Action class: unrecoverable
- claim-readme-md-149
  - Review result: .cautilus/claims/review-result-loop2-lane-a.json
  - Reason: missing-fingerprint
  - Action class: unrecoverable
- claim-readme-md-7
  - Review result: .cautilus/claims/review-result-loop2-lane-a.json
  - Reason: missing-fingerprint
  - Action class: unrecoverable
- claim-readme-md-3
  - Review result: .cautilus/claims/review-result-loop2-lane-a.json
  - Reason: missing-fingerprint
  - Action class: unrecoverable
- claim-readme-md-153
  - Review result: .cautilus/claims/review-result-loop2-lane-a.json
  - Reason: missing-fingerprint
  - Action class: unrecoverable
- claim-readme-md-231
  - Review result: .cautilus/claims/review-result-loop2-lane-a.json
  - Reason: missing-fingerprint
  - Action class: unrecoverable
- claim-skills-cautilus-skill-md-112 @ sha256:ebff670a7be2ce628a7746f3a30e31c98d21eb103137e70a4ff70fa52b2bfdba
  - Review result: .cautilus/claims/review-result-hitl-audience-2026-05-02.json
  - Reason: missing-live-fingerprint
  - Action class: stale-fingerprint

## Next Action

- missing-fingerprint: Regenerate or re-review current live claims so new updates carry claimFingerprint; do not infer-match fingerprintless drops.
- missing-live-fingerprint: Inspect represented samples' reviewResultPath and claimFingerprint before deciding whether a focused current-packet re-review is warranted.

