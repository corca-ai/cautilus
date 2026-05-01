# Debug Review: claim status report refresh-plan ordering
Date: 2026-05-02

## Problem

The generated claim status report listed the correct refresh-plan table but described the wrong packet as the latest refresh plan.

## Correct Behavior

Given multiple checked-in `refresh-plan*.json` artifacts exist, when `npm run claims:status-report` renders the "Latest refresh summary" section, then it should summarize the most recently generated refresh-plan artifact, not the lexicographically last filename.

## Observed Facts

- `.cautilus/claims/refresh-plan-claim-status-report.json` was generated after the skill/status-report change.
- Its `refreshSummary` reported `changedSourceCount=1`, `changedClaimCount=10`, and `changedClaimSources=[skills/cautilus/SKILL.md]`.
- The report table included that row correctly.
- The "Latest refresh summary" detail instead came from `.cautilus/claims/refresh-plan.json`, because `refresh-plan.json` sorts after `refresh-plan-claim-status-report.json` by filename.

## Reproduction

```bash
./bin/cautilus claim discover --repo-root . --previous .cautilus/claims/evidenced-typed-runners.json --refresh-plan --output .cautilus/claims/refresh-plan-claim-status-report.json
npm run claims:status-report
sed -n '/## Refresh Plans/,$p' .cautilus/claims/claim-status-report.md
```

Before repair, the latest detail named the old multi-source refresh summary even though the newly generated packet was present in the table.

## Candidate Causes

- The script used filename order as a proxy for recency.
- Refresh-plan filenames are semantic labels, not timestamps.
- The report had a table-level check but no assertion that the detail section chose the current artifact.

## Hypothesis

If recency selection is the root cause, then selecting the detail packet by file modification time should make the latest detail describe `refresh-plan-claim-status-report.json` while preserving the deterministic table order.

## Verification

After repair, rerunning `npm run claims:status-report` produced a "Latest changed claim sources" line of `skills/cautilus/SKILL.md: 10`, matching `.cautilus/claims/refresh-plan-claim-status-report.json`.
The focused renderer test passed.

## Root Cause

The first refresh-plan integration conflated inventory order with recency.
That is wrong for Cautilus claim artifacts because filenames are workflow labels and older canonical names such as `refresh-plan.json` can sort after newer focused artifacts.

## Seam Risk

- Interrupt ID: claim-status-report-refresh-plan-ordering
- Risk Class: output-trust
- Seam: human-readable projection over multiple generated claim artifacts
- Disproving Observation: the underlying refresh-plan JSON was correct; only the projection selected the wrong detail packet.
- What Local Reasoning Cannot Prove: whether modification time is the long-term best ordering signal after checkout or artifact restore.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Do not use lexicographic artifact names as recency unless the filenames are intentionally timestamped.
When a report has both an inventory table and a "latest" detail block, test or inspect the detail-selection rule separately.
