# Debug Review
Date: 2026-05-06

## Problem

`npm run docs:preview:changed` could not provide a readable CLI-rendered snapshot for the executable spec index.
The first failure was `markdown preview path not found: install.md`.
After fixing that stale scope entry, the command reported success but wrote 2-byte snapshots containing only blank lines.

## Correct Behavior

Given a checked-in markdown preview scope, when a changed markdown file matches that scope, then `npm run docs:preview:changed` should render non-empty width-specific artifacts without failing on stale configured paths or silently accepting empty renderer output.

## Observed Facts

`.agents/markdown-preview.yaml` included `install.md`.
`git ls-files install.md` returned no tracked file.
The repo has `install.sh`, but markdown preview only accepts markdown targets.
The preview script intentionally errors for missing explicit configured paths.
The support capability exists and repo scripts are wired as `docs:preview`, `docs:preview:changed`, and `docs:preview:specs`.
After removing `install.md`, the preview command reported success and wrote two snapshots, but each snapshot was only 2 bytes.
Running `glow -w 80 docs/specs/index.spec.md > /tmp/cautilus-glow-preview.txt` produced a readable 1349-byte render.
Running the same command through Node `spawnSync` with stdout as a pipe produced only `\n\n`.
Running Node `spawnSync` with stdout attached to a regular file produced the readable render.
The Charness Python support helper rendered the same changed file as a readable 1349-byte snapshot in this environment.

## Reproduction

`npm run docs:preview:changed` reproduced the stale-scope failure with `markdown preview path not found: install.md`.
After the scope fix, `npm run docs:preview:changed` reproduced the empty-snapshot behavior.

## Candidate Causes

- The checked-in markdown preview config referenced a file that was removed or never committed.
- The preview script could be too strict about missing explicit targets.
- The current docs review workflow may be relying on advisory preview commands without a verify hook that catches stale scope entries earlier.
- `glow` can return different content when stdout is a pipe versus a regular file in this environment.
- The preview script trusted status code alone and did not reject empty rendered snapshots.

## Hypothesis

If the stale `install.md` target is removed from `.agents/markdown-preview.yaml` and the preview script retries `glow` with a regular-file stdout when pipe output is empty, then `npm run docs:preview:changed` will render readable snapshots for the changed spec index.

## Verification

Removed the stale `install.md` include from `.agents/markdown-preview.yaml`.
Added a `glow` regular-stdout fallback when pipe output is blank and a regression test for that path.
`node --test scripts/preview-markdown.test.mjs` passes.
`npm run docs:preview:changed` now renders 2 non-empty snapshots across the changed spec index into `.artifacts/markdown-preview`.
The 80-column snapshot is 1349 bytes and the 100-column snapshot is 1392 bytes.
`npm run verify` and `npm run hooks:check` pass after the repair.

## Root Cause

The repo-owned markdown preview scope still referenced `install.md`, but that markdown file is not tracked in this repo.
Because explicit missing configured paths are treated as invalid configuration, the preview command failed before rendering the changed spec file.
After that was fixed, the script still trusted `glow` pipe output even though this local `glow` invocation returned only blank lines when stdout was captured through Node.
The renderer needed to distinguish successful process exit from usable rendered text.

## Seam Risk

- Interrupt ID: markdown-preview-stale-scope
- Risk Class: none
- Seam: markdown preview support configuration
- Disproving Observation: both failures reproduce locally with checked-in config and deterministic Node/glow invocation differences, not an external host.
- What Local Reasoning Cannot Prove: whether a future docs install guide should reintroduce an `install.md` target.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep checked-in markdown preview scopes limited to tracked markdown files or globs that can be empty without blocking unrelated changed-file previews.
Renderer preview commands should reject blank rendered output for non-empty markdown and have tests for backend-specific stdout behavior.
