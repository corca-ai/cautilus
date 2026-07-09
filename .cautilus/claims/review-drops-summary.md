# Claim Review Drop Summary

This is a readable projection of aggregate claim review replay drops.
Use the JSON packet as the audit source; this document does not recover stale updates or infer identity.

## Packet

- Source claim packet: .cautilus/claims/evidenced-typed-runners.json
- Source claim packet commit: 935bd5126ffbda321ecdc6f84787d981c57b53c7
- Source claim count: 567
- Applied review results: 90
- Skipped review results: 50
- Kept updates: 223
- Rewritten updates: 152
- Dropped updates: 305
- Drop reasons: missing-fingerprint: 165, missing-live-fingerprint: 140
- Recorded samples: 20

## Action Classes

- missing-fingerprint: 165 update(s)
  - Class: unrecoverable
  - Sample coverage: 20/165; represented
  - Action: Do not infer-match this update; regenerate or re-review against the current claim packet so the update carries claimFingerprint.
  - Queue hint: Prepare fresh review-input for the currently live claims instead of carrying the stale update forward.
- missing-live-fingerprint: 140 update(s)
  - Class: stale-fingerprint
  - Sample coverage: 0/140; not-represented
  - Action: This packet proves 140 count-level dropped update(s) for this reason but records no samples; run a reason-targeted diagnostic or improve upstream sampling before selecting a focused re-review queue.
  - Queue hint: No bounded queue can be selected from this packet for this reason because no dropped samples were recorded.

## Sample Coverage

- missing-fingerprint: 20/165 recorded sample(s); represented
- missing-live-fingerprint: 0/140 recorded sample(s); not-represented

## Review Result Samples

- .cautilus/claims/review-result-loop1-lane-a.json
  - Recorded sample drops: 8
  - Reasons: missing-fingerprint: 8
  - Sample claim ids: claim-readme-md-13, claim-readme-md-149, claim-readme-md-7, claim-readme-md-137, claim-readme-md-91
- .cautilus/claims/review-result-loop2-lane-a.json
  - Recorded sample drops: 7
  - Reasons: missing-fingerprint: 7
  - Sample claim ids: claim-readme-md-13, claim-readme-md-149, claim-readme-md-7, claim-readme-md-3, claim-readme-md-153
- .cautilus/claims/review-result-loop1-lane-b.json
  - Recorded sample drops: 5
  - Reasons: missing-fingerprint: 5
  - Sample claim ids: claim-readme-md-148, claim-readme-md-232, claim-readme-md-171, claim-readme-md-159, claim-readme-md-211

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

## Next Action

- missing-fingerprint: Regenerate or re-review current live claims so new updates carry claimFingerprint; do not infer-match fingerprintless drops.
- missing-live-fingerprint: Treat 140 dropped update(s) as count-level review debt only; run reason-targeted diagnostics or improve replay sampling before selecting a queue.

