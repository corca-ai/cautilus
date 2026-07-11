# Debug Review
Date: 2026-07-11

## Problem

The release orchestrator ran the adapter-declared install readback immediately after confirming the new GitHub release page, before the tag workflow had attached binary assets, so the first `v0.19.2` installer download returned HTTP 404.

## Correct Behavior

Given a tag workflow that creates the release record before uploading assets, post-publish install readback must run only after the expected binary asset is publicly downloadable or must retry the bounded eventual-consistency window.

## Observed Facts

- The ordered publisher confirmed the release URL with HTTP 200 and immediately invoked `npm run release:smoke-install:current -- --skip-update`.
- The command failed after 0.82s because the `v0.19.2` Linux archive URL returned HTTP 404.
- `gh release view v0.19.2` at that moment reported a published, non-draft release with an empty assets list.
- GitHub Actions run `29150460445` was still executing `npm run verify` and had not reached artifact build or upload.
- After the workflow completed successfully, the same install readback installed and reported `0.19.2`, and the public verifier found all seven expected assets with valid checksums.

## Reproduction

- Publish a tag through the current ordered helper while the workflow creates the GitHub release record before binary upload.
- Observe URL-level distinct-channel confirmation followed by an immediate install smoke against an asset URL that does not exist yet.

## Candidate Causes

- The release page was treated as sufficient readiness for asset-dependent proof.
- The install smoke was expected to retry 404 responses internally.
- The workflow was expected to upload assets before making the release record visible.

## Hypothesis

- Falsifiable claim: the failure is an eventual-consistency ordering gap rather than a broken archive or installer; waiting for workflow asset publication makes the unchanged install command pass | disconfirmer: rerun the same command after workflow success and observe another 404 or an integrity/version failure.

## Verification

- confirmed — the unchanged install command passed after workflow success, installed the Linux archive, and returned `0.19.2` from both version readbacks.

## Root Cause

The release orchestration readiness signal covered release-page visibility but not the asset dependency required by the adapter's post-publish command.
The release workflow intentionally publishes the record before its binary upload step finishes, leaving a bounded window where page verification is true and install readiness is false.

## Invariant Proof

- Invariant: install readback is complete only after the target archive is publicly downloadable and its installed binary reports the target version.
- Producer Proof: GitHub Actions run `29150460445` completed artifact build, attestation, release upload, and public verification.
- Final-Consumer Proof: the unchanged install-sh smoke downloaded `cautilus_0.19.2_linux_x64.tar.gz` and both `--version` and `version --verbose` reported `0.19.2`.
- Interface-Shape Sibling Scan: release-page verification and asset-dependent install verification are distinct channels with different readiness requirements.
- Non-Claims: the retry does not prove native macOS installation or update behavior because this readback used Linux and `--skip-update`.

## Detection Gap

- Charness release orchestration plus `.agents/release-adapter.yaml` | URL confirmation did not check the adapter command's asset dependency | gate post-publish install refresh on the workflow/public asset verifier or add bounded 404 retry to the owning install-readback seam.

## Sibling Search

- Mental model: a published release page implies every attached asset is immediately ready.
- same layer axis: distinct URL confirmation versus public asset verifier | decision: different readiness contracts, factor later | proof: URL 200 and empty assets coexisted.
- abstraction up axis: installed Charness release sequencing | decision: upstream-owned follow-up | proof: the orchestrator schedules the adapter command immediately after URL confirmation.
- specialization down axis: Cautilus install smoke | decision: retry closed this release, monitor before repo-local retry policy | proof: unchanged command passed after workflow success.
- cross-file: `.github/workflows/release-artifacts.yml` owns asset timing; `.agents/release-adapter.yaml` declares the asset-dependent post-publish command.

## Seam Risk

- Interrupt ID: release-page-before-asset-readiness
- Risk Class: none
- Seam: public release visibility to asset-dependent install refresh
- Disproving Observation: the orchestrator waits for the public asset verifier or the install command retries 404 until the configured deadline.
- What Local Reasoning Cannot Prove: whether the Charness publisher should own workflow waiting generically or the Cautilus adapter command should own download retry.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep release-page and asset-readiness states distinct, retain the first failure in the release ledger, and carry the ownership decision as an explicit follow-up rather than calling URL visibility install readiness.
