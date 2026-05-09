# HITL Scratchpad Link Check Debug
Date: 2026-05-09

## Problem

`npm run verify` failed during the v0.14.0 release preflight because the checked-in HITL scratchpad contained display-only Markdown links copied from `docs/specs/index.spec.md`.

## Correct Behavior

Given HITL runtime files are checked in as repo state, when Markdown link lint runs, then display-only excerpts in `.charness/hitl/runtime/**` should not contain relative links that are valid only from the original target file.

## Observed Facts

- `npm run verify` failed in `npm run lint:links`.
- `check-markdown-links.mjs` reported five broken links in `.charness/hitl/runtime/hitl-20260509-053911/hitl-scratchpad.md` lines 33-37.
- The broken targets were `user/index.spec.md`, `maintainer/index.spec.md`, `model/index.spec.md`, `concerns/index.spec.md`, and `proof/index.spec.md`.
- Those links are valid from `docs/specs/index.spec.md`, but not from `.charness/hitl/runtime/hitl-20260509-053911/`.

## Reproduction

Run:

```bash
npm run lint:links
```

## Candidate Causes

- The HITL working excerpt preserved target-file relative links after moving the text into a runtime artifact.
- The link checker strips fenced code blocks but does not treat pseudo-tags such as `<md>` as code or inert display text.
- The scratchpad is checked in, so runtime review state participates in repository Markdown lint.

## Hypothesis

If the display-only excerpt replaces Markdown links with plain labels plus repo-relative code paths, then `npm run lint:links` should stop reporting these runtime scratchpad entries while preserving the reviewer-facing text.

## Verification

- Replaced the five copied Markdown links with plain labels and `docs/specs/...` code paths in `.charness/hitl/runtime/hitl-20260509-053911/hitl-scratchpad.md`.
- Synced `charness-artifacts/hitl/latest.md` from the updated HITL runtime.
- Pending: rerun `npm run lint:links` through `npm run verify`.

## Root Cause

The HITL rewrite-review excerpt was copied from `docs/specs/index.spec.md` into `.charness/hitl/runtime/.../hitl-scratchpad.md` without translating target-relative links for the new artifact location.
Because pseudo-tag display blocks are not fenced code blocks, the repo markdown link checker treated those links as ordinary checked-in links.

## Seam Risk

- Interrupt ID: hitl-scratchpad-display-link-relocation
- Risk Class: contract-freeze-risk
- Seam: HITL display excerpt storage versus repo-wide Markdown link lint
- Disproving Observation: Runtime excerpts that use plain repo-relative code paths or fenced code blocks do not produce broken Markdown links.
- What Local Reasoning Cannot Prove: Whether future HITL runtime artifacts should be globally excluded from Markdown link lint or normalized by HITL sync helpers.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: `.charness/hitl/runtime/hitl-20260509-053911/hitl-scratchpad.md`

## Prevention

When recording a display-only excerpt from another Markdown file into HITL runtime state, convert target-relative links to plain text or repo-relative code paths unless the excerpt is inside a fenced code block ignored by the link checker.
