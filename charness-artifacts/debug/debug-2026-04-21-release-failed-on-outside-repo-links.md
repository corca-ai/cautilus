# Problem

`release-artifacts` for tag `v0.8.1` failed during `npm run verify`.
The concrete symptom was `lint:links` reporting broken links in `docs/internal/handoff.md` for `../../../ceal/...` targets.

## Correct Behavior

Given a checked-in markdown file in this repo,
when it contains a relative link,
then that link should resolve to another checked-in path inside this repo rather than depending on a maintainer's sibling checkout.

## Observed Facts

- GitHub Actions run `release-artifacts #28` for commit `4969c69` failed in step `Run npm run verify`.
- Job log showed:
  - `docs/internal/handoff.md:6 -> ../../../ceal/docs/implementation/24-simulation-stack-thinning.md`
  - `docs/internal/handoff.md:6 -> ../../../ceal/scripts/agent-runtime/run-ceal-single-turn.ts`
  - `docs/internal/handoff.md:66/67/68 -> ../../../ceal/...`
- The local checker `scripts/check-markdown-links.mjs` only checked whether the resolved target existed on the current filesystem.
- On the maintainer machine, sibling repo `../ceal` existed, so the invalid boundary escaped local detection.
- On GitHub Actions, only the tagged `cautilus` checkout existed, so the same links failed.

## Reproduction

1. Run the released workflow logs for `release-artifacts #28`.
2. Observe `lint:links` fail on `docs/internal/handoff.md` with `../../../ceal/...` targets.
3. Inspect `scripts/check-markdown-links.mjs` and confirm it resolved local links against the live filesystem without enforcing repo-root boundaries.

## Candidate Causes

- Handoff introduced markdown links to sibling repo paths outside the product repo root.
- The markdown link checker treated any filesystem-visible path as valid, even when it escaped the repo.
- Release verification ran in a clean single-repo checkout, unlike the maintainer workstation.

## Hypothesis

If the checker rejects relative links that escape the repo root,
then sibling-checkout links such as `../../../ceal/...` will fail locally before release,
and replacing those links with plain text references will make release verification pass again.

## Verification

- Release job logs explicitly showed `lint:links` failing on the sibling-repo paths.
- The checker implementation confirmed there was no repo-root boundary check.

## Root Cause

The repo accepted markdown links that pointed outside the repo root because the checker validated against the maintainer's current filesystem rather than the checked-in repo boundary.
`docs/internal/handoff.md` then depended on a local sibling checkout that does not exist in CI or for downstream consumers.

## Prevention

- Reject markdown links whose resolved target escapes the repo root.
- Keep sibling-repo references in prose or code spans, not markdown links.
- Treat checked-in docs as repo-self-contained unless a web URL is used.
