# Release Notes Stale Record Pointer Debug
Date: 2026-05-13

## Problem

The `v0.15.4` public release notes asset initially said release scope and verification notes were recorded in `charness-artifacts/release/latest.md` at the tag.
That pointer was not audit-safe because the tag still contained the previous `v0.15.2` release record.

## Correct Behavior

Public release notes should be self-contained enough for the public release verifier to validate the published surface.
If release notes refer to checked-in source-tree release records, the verifier must either prove that record matches the release version or reject the unverifiable delegation.

## Observed Facts

- `gh release download v0.15.4 --pattern release-notes-v0.15.4.md` showed the note pointing to `charness-artifacts/release/latest.md` at the tag.
- `charness-artifacts/release/latest.md` in the release tag still documented `v0.15.2`.
- `node scripts/release/verify-public-release.mjs --version v0.15.4 --repo corca-ai/cautilus --json` passed before this issue was noticed.
- Release binaries, checksums, GitHub Release publication, and pinned installer smoke were otherwise valid.

## Reproduction

```bash
gh release download v0.15.4 --repo corca-ai/cautilus --pattern release-notes-v0.15.4.md --dir /tmp/cautilus-v0154-notes --clobber
sed -n '1,80p' /tmp/cautilus-v0154-notes/release-notes-v0.15.4.md
git show v0.15.4:charness-artifacts/release/latest.md | sed -n '1,40p'
node scripts/release/verify-public-release.mjs --version v0.15.4 --repo corca-ai/cautilus --json
```

## Candidate Causes

- The release workflow generated release notes with a generic pointer to `latest.md` instead of self-contained public release context.
- The release preparation workflow did not require `charness-artifacts/release/latest.md` to be refreshed before tagging.
- The public release verifier checked only header, asset names, and checksum manifest references, not whether the note delegated context to an unverifiable source-tree pointer.

## Hypothesis

The verifier allowed the stale pointer because release-note expectations did not include a self-contained public release line and did not reject the old `latest.md at this tag` phrase.

## Verification

- `node --test --test-reporter=spec scripts/release/verify-public-release.test.mjs`: validates the new rejection path for the stale pointer.
- `gh release upload v0.15.4 /tmp/cautilus-v0154-notes/release-notes-v0.15.4.md --repo corca-ai/cautilus --clobber`: replaced the public notes asset.
- `node scripts/release/verify-public-release.mjs --version v0.15.4 --repo corca-ai/cautilus --json`: validates the corrected public release asset after replacement.

## Root Cause

The release workflow delegated operator context to a checked-in mutable record, and the verifier did not treat that delegation as a public release claim.
The source tag was immutable after publication, so the public asset needed to stop pointing readers at stale tagged release context.

## Seam Risk

- Interrupt ID: release-notes-source-tree-pointer
- Risk Class: external-seam
- Seam: GitHub Release asset generation to checked-in release record
- Disproving Observation: Public release verification passed while the asset pointed at stale tagged release context.
- What Local Reasoning Cannot Prove: Future release notes will remain self-contained if the workflow text changes without verifier coverage.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: yes
- Next Step: spec
- Handoff Artifact: charness-artifacts/spec/evaluation-surfaces-runners-proof.md

## Prevention

Generate release notes with a self-contained public release surface line.
Reject release notes that contain the old `charness-artifacts/release/latest.md` at-tag pointer unless a future verifier proves the referenced record matches the release version.
