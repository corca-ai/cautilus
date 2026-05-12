# Latest Selected Evidence

Some Cautilus evidence is expensive, host-specific, or evaluator-backed.
The standing spec report should show selected durable evidence and name stale or missing proof instead of pretending every expensive loop reran.

## Current Selection Policy

- Deterministic CLI and packet checks may run in the standing Specdown report.
- Expensive eval and improve loops should be represented by durable artifacts with enough provenance to reopen them.
- Missing durable artifacts belong in [Proof Gaps](gaps.spec.md), usually as expected-failing checks when the missing artifact is concrete.
- Human or LLM judgment gaps should be table rows with owner, trigger, and close condition unless they can be reduced to a concrete artifact check.

## Evidence Status Legend

| status word | reader meaning |
| --- | --- |
| current | standing checks or selected artifacts support the claim now |
| selected | durable evidence is shown in this report without rerunning the expensive workflow |
| prepared | the fixture, adapter, or review route exists, and the live proof run remains open |
| stale | an artifact exists but should be refreshed before it supports a fresh claim |
| open gap | the proof condition is visible and unresolved |

```run:shell
# Verify the selected-evidence policy has a gap page to point to.
test -f docs/specs/evidence/gaps.spec.md
```
