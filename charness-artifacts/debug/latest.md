# Debug Review
Date: 2026-05-06

## Problem

`npm run docs:preview:changed` fails while reviewing the executable spec index.
Exact error: `markdown preview path not found: install.md`.

## Correct Behavior

Given a checked-in markdown preview scope, when a changed markdown file matches that scope, then `npm run docs:preview:changed` should render width-specific artifacts without failing on stale configured paths.

## Observed Facts

`.agents/markdown-preview.yaml` includes `install.md`.
`git ls-files install.md` returns no tracked file.
The repo has `install.sh`, but markdown preview only accepts markdown targets.
The preview script intentionally errors for missing explicit configured paths.
The support capability exists and repo scripts are wired as `docs:preview`, `docs:preview:changed`, and `docs:preview:specs`.

## Reproduction

`npm run docs:preview:changed` reproduced the failure with `markdown preview path not found: install.md`.

## Candidate Causes

- The checked-in markdown preview config references a file that was removed or never committed.
- The preview script could be too strict about missing explicit targets.
- The current docs review workflow may be relying on advisory preview commands without a verify hook that catches stale scope entries earlier.

## Hypothesis

If the stale `install.md` target is removed from `.agents/markdown-preview.yaml`, then `npm run docs:preview:changed` will render the changed spec index instead of failing before target selection.

## Verification

Removed the stale `install.md` include from `.agents/markdown-preview.yaml`.
`npm run docs:preview:changed` now renders 2 snapshots across the changed spec index into `.artifacts/markdown-preview`.
`python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.16/scripts/validate_debug_artifact.py --repo-root .` passes.

## Root Cause

The repo-owned markdown preview scope still referenced `install.md`, but that markdown file is not tracked in this repo.
Because explicit missing configured paths are treated as invalid configuration, the preview command failed before rendering the changed spec file.

## Seam Risk

- Interrupt ID: markdown-preview-stale-scope
- Risk Class: none
- Seam: markdown preview support configuration
- Disproving Observation: the failing path is a checked-in local config entry, not a backend renderer or external host failure.
- What Local Reasoning Cannot Prove: whether a future docs install guide should reintroduce an `install.md` target.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep checked-in markdown preview scopes limited to tracked markdown files or globs that can be empty without blocking unrelated changed-file previews.
