# Critique: Post-release hardening review

Date: 2026-07-08

Fresh-eye satisfaction: parent-delegated

## Reviewer Tier Evidence

- **Requested tier**: `high-leverage`
- **Requested spawn fields**: `none`
- **Host exposure state**: `pending-parent-spawn`
- **Application state**: `applied`
- **Instruction**: Two parent-delegated read-only reviewers covered scenario provenance absorption and release publisher/readback gates; every returned blocking and medium finding was applied in this slice.

## Scope

Fresh-eye review covered two post-release hardening surfaces:

- scenario proposal provenance absorption across Go, Node, schemas, HTML, docs, and the packaged Cautilus Agent references
- release publisher and post-publish install readback gates across the release adapter, publish helper, npm scripts, tests, and maintainer docs

## Findings And Disposition

### Release requested review commands were advisory only

Status: fixed.

The release adapter declared `requested_review_commands`, but `publish-release.mjs` did not execute them before branch/tag push.
`publishPreparedRelease` now runs the requested review commands before pushing, records `requestedReviewCommands` in release state, and fails before branch or tag mutation when a command fails.

### Post-publish install readback had no release-state visibility

Status: fixed.

The release adapter still owns the configured readback command because the public release must exist before it can run.
`publish-release.mjs` now records `postPublishInstallReadback` as a release-state field, and maintainer docs distinguish the full install smoke from the `--skip-update` readback.

### Current-version install smoke could override version or channel

Status: fixed.

`run-install-smoke-current.mjs` now rejects `--version` and `--channel` overrides, so the wrapper always tests the checked-in package version through the install-sh channel.

### Provenance summary schema was too loose

Status: fixed.

`provenanceSummary.originCounts` and `splitCounts` now reject unknown keys and require non-negative integer counts for known origin and split values.

### Full-evidence summary versus truncated output evidence was unproven

Status: fixed.

Go and Node tests now use four evidence items to prove output `evidence` is capped at three while `provenanceSummary` still counts the full candidate evidence set.

### Scenario proposal samples were stale

Status: fixed.

The scenario proposal source docs and Cautilus Agent references now show schema-valid output with at least one evidence item, `provenanceSummary`, and a minimally valid draft scenario.

### HTML hid max score

Status: fixed.

The scenario proposal HTML summary chips now include `max score` when scored evidence exists.

## Non-Claims

This pass did not rewrite historical claim evidence hashes.
`npm run claims:audit-evidence` still reports historical warnings with `issueCount: 0`; those warnings remain an evidence-integrity record rather than a post-release hardening bug.
