# Debug Review: release failed on outside-repo links
Date: 2026-04-21

## Problem

`release-artifacts` for tag `v0.8.1` failed during `npm run verify` because `lint:links` reported broken links in `docs/internal/handoff.md` that pointed to `../../../ceal/...`.

## Correct Behavior

Given a checked-in markdown file in this repo,
when it contains a relative link,
then that link should resolve to another checked-in path inside this repo rather than depend on a maintainer's sibling checkout.

## Observed Facts

- GitHub Actions `release-artifacts #28` failed in the `npm run verify` step.
- The job log showed broken relative links in `docs/internal/handoff.md` pointing into a sibling `ceal` checkout.
- The local checker only verified whether the resolved path existed on the current filesystem.
- The maintainer workstation had a sibling `../ceal` checkout, so the invalid boundary escaped local detection.
- GitHub Actions ran in a clean single-repo checkout, so the same links failed there.

## Reproduction

1. Inspect the released workflow logs for `release-artifacts #28`.
2. Observe `lint:links` fail on `docs/internal/handoff.md` with `../../../ceal/...` targets.
3. Inspect `scripts/check-markdown-links.mjs` and confirm it resolved local links against the live filesystem without enforcing repo-root boundaries.

## Candidate Causes

- Handoff introduced markdown links to sibling repo paths outside the product repo root.
- The markdown link checker treated any filesystem-visible path as valid even when it escaped the repo.
- Release verification ran in a clean single-repo checkout unlike the maintainer workstation.

## Hypothesis

If the checker rejects relative links that escape the repo root,
then sibling-checkout links will fail locally before release,
and replacing those links with plain text references will make release verification pass again.

## Verification

- Release job logs explicitly showed `lint:links` failing on the sibling-repo paths.
- Checker inspection confirmed there was no repo-root boundary check in the current implementation.

## Root Cause

The repo accepted markdown links that pointed outside the repo root because the checker validated against the maintainer's live filesystem rather than the checked-in repo boundary.

## Prevention

- Reject markdown links whose resolved target escapes the repo root.
- Keep sibling-repo references in prose or code spans, not markdown links.
- Treat checked-in docs as repo-self-contained unless they intentionally use a web URL.
