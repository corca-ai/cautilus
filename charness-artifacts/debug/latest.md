# CI Spec Link Check Debug
Date: 2026-05-09

## Problem

The first `v0.14.0` release workflow failed in GitHub Actions during `npm run verify`, even though local `npm run verify` had passed before tagging.

## Correct Behavior

Given release verification runs from a clean GitHub checkout, when `npm run lint:specs` checks spec links, then docs should not depend on ignored local artifacts that exist only in the maintainer workspace.

## Observed Facts

- GitHub Actions run `25596477876` failed in workflow `release-artifacts`, job `release-artifacts`, step `Run npm run verify`.
- The failing line was `Broken spec link in docs/specs/maintainer/evaluation-surfaces-runners.spec.md: ../../../artifacts/self-dogfood/eval/latest/eval-summary.json`.
- The file exists locally at `artifacts/self-dogfood/eval/latest/eval-summary.json`.
- `git ls-files artifacts/self-dogfood/eval/latest/eval-summary.json` returned no tracked file.
- `.gitignore` ignores `artifacts/self-dogfood/*`.

## Reproduction

Run:

```bash
git check-ignore -v artifacts/self-dogfood/eval/latest/eval-summary.json
git ls-files artifacts/self-dogfood/eval/latest/eval-summary.json
```

## Candidate Causes

- The maintainer spec linked to selected self-dogfood artifacts as if they were checked in.
- Local ignored artifacts made `npm run lint:specs` pass locally while a clean GitHub checkout failed.
- The spec wording conflated selected evidence paths with checked-in evidence links.

## Hypothesis

If the maintainer spec changes ignored self-dogfood artifact links into plain code paths and describes them as selected evidence paths rather than checked-in links, then `npm run lint:specs` should pass in a clean checkout.

## Verification

- Updated `docs/specs/maintainer/evaluation-surfaces-runners.spec.md` to use plain code paths for selected self-dogfood summary packet paths.
- Pending: rerun `npm run lint:specs`.
- Pending: rerun the release workflow on the fix-forward tag.

## Root Cause

`docs/specs/maintainer/evaluation-surfaces-runners.spec.md` used Markdown links to ignored local self-dogfood artifacts.
The local maintainer workspace had those artifacts, but the release workflow's clean checkout did not.

## Seam Risk

- Interrupt ID: ci-spec-link-local-artifact
- Risk Class: contract-freeze-risk
- Seam: selected local evidence paths versus checked-in spec link validation
- Disproving Observation: A clean checkout can pass `npm run lint:specs` after ignored artifacts are no longer Markdown links.
- What Local Reasoning Cannot Prove: Whether other selected evidence paths elsewhere in docs are silently protected by local ignored files.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: `docs/specs/maintainer/evaluation-surfaces-runners.spec.md`

## Prevention

Do not use Markdown links for ignored selected-evidence artifacts unless the artifact is intentionally checked in.
Use plain code paths for selected evidence and reserve links for tracked files.
