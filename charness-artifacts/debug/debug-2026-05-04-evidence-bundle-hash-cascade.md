# Debug Review
Date: 2026-05-04

## Problem

Refreshing claim IDs inside checked-in evidence bundles changed those bundle files, but only some `evidenceRefs[].contentHash` values were updated.
Fresh-eye review also found two `checkedInEvidence[].contentHash` values that did not match the files at the evidence bundle's recorded `repoCommit`.

## Correct Behavior

Given an evidence bundle file is edited, when any claim review result or derived claim packet references that bundle by `contentHash`, then every reference should carry the bundle's current SHA-256.

Given an evidence bundle records `checkedInEvidence[]` for a historical `repoCommit`, when a later agent audits the bundle, then each recorded content hash should match `git show <repoCommit>:<path> | sha256sum`.

## Observed Facts

- `.cautilus/claims/evidence-remaining-deterministic-claims-2026-05-03.json` changed after its `createdForClaimIds` moved `claim-docs-contracts-runner-readiness-md-282` to `claim-docs-contracts-runner-readiness-md-283`.
- The bundle's actual hash became `sha256:fbf26c7abbc80d917d7946e979a15648e5499d4f95c9beb92406374d45497bb3`, while several refs still carried `sha256:7eca57dd7633871a9a8106a8a0ebd91dbf3ef4ac5fdbf3aa56215374a15bc0f5`.
- `.cautilus/claims/evidence-proof-class-downstream-summary-2026-05-03.json` recorded `internal/runtime/evaluation_proof_test.go` as `sha256:86c03310105cbb0cb93e6ec7ec7f69d2dc9b80e2272b03db45058cf35a1cf674`, but `git show 815694dd634c343c89fb59f44a6be3fb924e4050:internal/runtime/evaluation_proof_test.go | sha256sum` returned `05ba47322101da7ed6a7a9590d9b290c5eb5f3fda5a2b247fdd7111cfcc91d5c`.
- `.cautilus/claims/evidence-runner-readiness-schema-fields-2026-05-03.json` recorded `internal/runtime/adapter_test.go` as `sha256:8df1d34c92ca15195c275aee9b3db0af35786d9448ef5293ac31c156ee67b464`, but `git show ffc68d8a107b10bd99e71613e81269c04accc1c3:internal/runtime/adapter_test.go | sha256sum` returned `922cbfa9176ea045979216d55413f4a98949495d625cd6eb570d79a1c5b8cb8f`.

## Reproduction

Run:

```bash
sha256sum .cautilus/claims/evidence-remaining-deterministic-claims-2026-05-03.json
jq -r '.. | objects | select(has("path") and has("contentHash")) | select(.path==".cautilus/claims/evidence-remaining-deterministic-claims-2026-05-03.json") | [.path,.contentHash,(.supportsClaimIds|join(","))] | @tsv' .cautilus/claims/review-result-*.json .cautilus/claims/evidenced-typed-runners.json .cautilus/claims/status-summary.json | sort | uniq -c
git show 815694dd634c343c89fb59f44a6be3fb924e4050:internal/runtime/evaluation_proof_test.go | sha256sum
git show ffc68d8a107b10bd99e71613e81269c04accc1c3:internal/runtime/adapter_test.go | sha256sum
```

Before the repair, the first two commands showed mixed hashes for the same evidence bundle, and the last two commands disproved the two checked-in evidence hashes.

## Candidate Causes

- The repair updated only the review result for the moved claim ID, not every review result that shared the edited evidence bundle.
- Existing evidence bundles had historical `checkedInEvidence` hashes copied from live working-tree files instead of from the recorded `repoCommit`.
- The validation path checks packet shape and referenced evidence availability, but it does not yet validate all nested checked-in evidence hashes against their recorded commits.

## Hypothesis

If the two bad `checkedInEvidence` hashes are replaced with hashes computed from their recorded commits, all review-result refs to the edited bundles are rewritten to the resulting bundle hashes, and `claims:apply-review-results` regenerates the derived packets, then the claim packet will have no mixed content hashes and no stale-evidence signal.

## Verification

- `jq` over `review-result-*.json`, `evidenced-typed-runners.json`, and `status-summary.json` shows one current hash per referenced evidence bundle.
- `git show <repoCommit>:<path> | sha256sum` matches the two repaired `checkedInEvidence[]` records.
- `cautilus agent status --repo-root . --json` reports `runnerReadiness.state=assessed`, selected claim map `gitState.comparisonStatus=fresh`, and evidence status `satisfied=121`, `unknown=204`, with no stale evidence bucket.

## Root Cause

The evidence repair treated claim ID movement as a local field update.
For shared evidence bundles, editing the bundle changes the content-address of every claim ref that points to it.
The existing validation and report regeneration commands did not force a recursive evidence-bundle hash audit, so a partial update could still produce shape-valid packets.

## Seam Risk

- Interrupt ID: evidence-bundle-hash-cascade
- Risk Class: contract-freeze-risk
- Seam: checked-in evidence bundle edits feeding review-result replay and status report generation
- Disproving Observation: packet shape validation passed while fresh-eye review found mixed content hashes and two commit-relative checked-in evidence mismatches.
- What Local Reasoning Cannot Prove: whether older historical evidence bundles have similar nested `checkedInEvidence` drift until a dedicated audit walks all bundles.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Add or use an audit that walks evidence bundles, verifies `checkedInEvidence[].contentHash` against each bundle's `repoCommit`, and verifies all `evidenceRefs[].contentHash` values match the current referenced evidence bundle file.
Until that audit exists, after editing an evidence bundle, recompute the bundle hash and rewrite every review-result ref before regenerating evidenced packets and reports.
