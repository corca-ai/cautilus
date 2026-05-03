# Debug Review
Date: 2026-05-03

## Problem

The checked-in claim status report said the claim packet was fresh even after the generated claim artifacts had been committed on top of the source commit.

## Correct Behavior

Given a claim packet generated from the latest source commit, when generated claim artifacts are committed afterward, then human-readable reports should not claim that their stored git state is live checkout truth.
They should present git state as a generation-time snapshot, make historical refresh plans visibly historical, and keep current review queues usable without requiring the maintainer to inspect raw JSON first.

## Observed Facts

- Fresh-eye review found `.cautilus/claims/claim-status-report.md` reported `fresh; stale=no` and said the claim packet matched the current checkout.
- The same checked-in report also showed an older refresh plan telling the operator to update the saved claim map before review or eval planning.
- Live `./bin/cautilus claim show --input .cautilus/claims/evidenced-typed-runners.json` reported `fresh-with-head-drift`, `headDrift=true`, and `changedSourceCount=0` after the artifact commit.
- The canonical map JSON had maintainer coverage for M1-M7, but the Markdown report only rendered the user-facing U table.

## Reproduction

```bash
git rev-parse HEAD
./bin/cautilus claim show --input .cautilus/claims/evidenced-typed-runners.json | jq '.gitCommit, .gitState'
sed -n '1,80p' .cautilus/claims/claim-status-report.md
```

## Candidate Causes

- Generated status packets record git state at generation time, but the Markdown report worded that state as current truth.
- Generated claim artifacts are normally committed after the source commit that their packet records, producing expected HEAD drift.
- The status report renderer included the newest refresh-plan artifact by file mtime even when its target commit no longer matched the current claim packet.
- Maintainer canonical coverage existed in JSON but was not rendered into the Markdown report.

## Hypothesis

If the report labels git state as a snapshot, hides current-action guidance from refresh plans whose target commit does not match the selected packet/status, and renders maintainer canonical coverage plus semantic-sampling samples, then the checked-in report will stay operationally honest even after artifact-only commits.

## Verification

- `node --test scripts/agent-runtime/render-claim-status-report.test.mjs`
- `npm run lint:eslint`
- `npm run lint:specs`
- `go test ./internal/runtime ./internal/app`

The public user spec now also proves the hard `specdown` prerequisite through a `doctor --repo-root .` specdown row that checks for `specdown_available`.

## Root Cause

The packet freshness model was already hash-aware enough to distinguish source drift from artifact-only HEAD drift.
The bug was in the persisted review surface:
it presented a generation-time JSON snapshot as live checkout truth and mixed in historical refresh-plan next actions.

## Seam Risk

- Interrupt ID: claim-status-report-snapshot-freshness
- Risk Class: none
- Seam: checked-in generated artifacts versus live checkout state
- Disproving Observation: live `claim show` reported `fresh-with-head-drift` while the checked-in Markdown report said `fresh`
- What Local Reasoning Cannot Prove: whether every future consumer treats checked-in status JSON as a snapshot rather than live state
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Render generated status reports as snapshots, not live state.
When a report includes historical helper packets such as refresh plans, suppress their next-action guidance unless they target the current selected claim packet.
Keep maintainer-facing canonical coverage visible in Markdown so review does not depend on opening large JSON files.

## Related Prior Incidents

- `charness-artifacts/debug/debug-2026-05-01-claim-source-commit-stale.md`: established that claim freshness must use content hashes first and treat source-plus-artifact commits differently from real source drift.
