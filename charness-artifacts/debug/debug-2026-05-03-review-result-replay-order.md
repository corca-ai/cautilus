# Debug Review: review result replay order
Date: 2026-05-03

## Problem

Refreshing `.cautilus/claims/evidenced-typed-runners.json` from the current adapter scope correctly added `docs/claims/**` to the effective exclude list, but it made the `agent-add-deterministic-proof` action bucket reappear with 30 claims.
Replaying historical review results fixed 29 of them, but one older HITL decision still overrode the later final deterministic-proof synthesis decision when review-result files were applied in lexicographic filename order.

## Correct Behavior

Given a refreshed claim packet keeps the same claim fingerprints, when historical review-result packets are replayed, then older decisions should apply before newer synthesis or evidence decisions.
Given a review-result file has an explicit `reviewedAt`, then that timestamp should be preferred over filename order.
Given a review-result file has no explicit timestamp, then a `YYYY-MM-DD` filename date is a safe fallback before lexicographic tie-breaking.

## Observed Facts

- `claim discover --previous .cautilus/claims/evidenced-typed-runners.json` refreshed the packet to commit `384671a8979867f6446fa9ad1ac8708250be7e8c` and added `docs/claims/**` to `effectiveScanScope.exclude`.
- The refreshed packet had `agent-add-deterministic-proof: 30`.
- `node scripts/agent-runtime/apply-current-review-results.mjs --claims .cautilus/claims/evidenced-typed-runners.json --claims-dir .cautilus/claims --output /tmp/cautilus-review-replayed.json --cautilus-bin ./bin/cautilus` reduced that bucket to 1.
- The remaining claim was `claim-docs-contracts-adapter-contract-md-424`.
- `.cautilus/claims/review-result-final-deterministic-proof-debt-2026-05-03.json` reclassified that claim to `human-auditable` and `needs-alignment`.
- `.cautilus/claims/review-result-hitl-audience-2026-05-02.json` was older but lexicographically sorted after the `final-...` file, so it restored `deterministic` and `ready-to-verify`.
- A same-day HITL result could also tie with an explicit `reviewedAt` synthesis timestamp when the HITL file only had a filename date.
- Eight older review-result packets had real updates but no explicit timestamp or filename date, so their replay order depended on treating missing time as older than all dated packets.

## Reproduction

Run:

```bash
./bin/cautilus claim discover --repo-root . --previous .cautilus/claims/evidenced-typed-runners.json --output .cautilus/claims/evidenced-typed-runners.json
./bin/cautilus claim show --input .cautilus/claims/evidenced-typed-runners.json --output .cautilus/claims/status-summary.json
node scripts/agent-runtime/apply-current-review-results.mjs --claims .cautilus/claims/evidenced-typed-runners.json --claims-dir .cautilus/claims --output /tmp/cautilus-review-replayed.json --cautilus-bin ./bin/cautilus
./bin/cautilus claim show --input /tmp/cautilus-review-replayed.json --output /tmp/cautilus-review-replayed-status.json
```

Before the fix, `/tmp/cautilus-review-replayed-status.json` still showed one `agent-add-deterministic-proof` claim because replay order was not chronological.

## Candidate Causes

- `reviewResultPaths` sorted file paths lexicographically instead of by review time.
- Older HITL review-result packets lacked explicit timestamps, so filename dates were not available as ordering data.
- Same-day files with only date fallback could tie with explicit midnight timestamps unless explicit metadata was ranked after filename fallback.

## Hypothesis

If review-result replay sorts by explicit review timestamps first, filename dates second, and lexicographic path only as a final tie-breaker, then later synthesis packets will override older HITL decisions and the deterministic-proof debt bucket will stay closed after scope refresh.

## Verification

- Added `reviewResultTimestamp` and `compareReviewResultPaths` to `scripts/agent-runtime/apply-current-review-results.mjs`.
- Added coverage proving `review-result-hitl-audience-2026-05-02.json` replays before `review-result-final-deterministic-proof-debt-2026-05-03.json`.
- Added coverage proving same-day filename-only HITL replay comes before same-day explicit `reviewedAt` synthesis.
- Backfilled `reviewRun.createdAt` on the eight older no-date review-result packets using each file's first checked-in git commit timestamp.
- Replayed all current review results against the refreshed packet.
- Regenerated validation, status, canonical map, status report, and the deterministic-proof review input.
- Confirmed `claim validate` returned valid.
- Confirmed `.cautilus/claims/status-summary.json` has no `agent-add-deterministic-proof` primary bucket.
- Confirmed `.cautilus/claims/review-input-deterministic-proof-debt-after-final-2026-05-03.json` has zero clusters and zero claims.
- Confirmed no current review-result packet with claim updates lacks explicit timestamp metadata or a filename date.
- `node --test scripts/agent-runtime/apply-current-review-results.test.mjs` passed.
- `npm run lint -- --quiet` passed.

## Root Cause

The aggregate replay helper treated path order as temporal order.
That was stable but not semantically correct once newer synthesis files and older HITL files had different prefixes.
The helper also lacked a same-day tie rule that distinguished explicit review metadata from filename fallback dates.

## Seam Risk

- Interrupt ID: review-result-replay-order
- Risk Class: contract-freeze-risk
- Seam: historical review-result replay over refreshed claim packets
- Disproving Observation: date-aware replay keeps the deterministic-proof debt queue empty after refreshing the claim packet to the current adapter scan scope.
- What Local Reasoning Cannot Prove: whether every historical review-result packet has enough metadata to encode all intended supersession semantics beyond date and explicit timestamp.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Do not treat durable packet filename order as decision chronology.
When a replay helper combines historical human, agent, and synthesis decisions, sort by explicit packet metadata first, use filename dates only as fallback, and test any known override path from the dogfood claim packet.
Older packets that lack both metadata and filename dates should be timestamped before they are treated as canonical replay inputs.
