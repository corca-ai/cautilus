# Debug Review
Date: 2026-05-17

## Problem

`npm run lint:links` failed after gathering the Slack mutation-testing thread.

## Correct Behavior

Given a gathered Slack thread with downloaded attachments, when `npm run lint:links` checks Markdown links, then every attachment link in the dated gather record and current pointer should resolve to an existing repo file.

## Observed Facts

The exact failure was:

```text
check-markdown-links: 2 broken link(s) across 405 file(s)
  charness-artifacts/gather/2026-05-17-slack-mutation-testing-thread.md:79 -> <attachments/image.png>
  charness-artifacts/gather/latest.md:79 -> <attachments/image.png>
```

The downloaded attachment exists at `charness-artifacts/gather/2026-05-17-slack-mutation-testing-thread.attachments/image.png`.

The gathered Markdown first linked `attachments/image.png`.
After correcting the directory, `scripts/check-markdown-links.mjs` still treated `<2026-05-17-slack-mutation-testing-thread.attachments/image.png>` as a literal target including angle brackets.

## Reproduction

Run `npm run lint:links` after exporting the Slack thread through `support/gather-slack/scripts/export-thread.sh`.

## Candidate Causes

- The Slack export helper wrote the wrong relative link prefix for attachment paths.
- The attachment file was not committed or was written to a different directory than the Markdown expected.
- The link checker treats angle-bracket image links as literal paths instead of unwrapping angle brackets.

## Hypothesis

The export helper stored attachments under `<record-stem>.attachments/` but rendered links under `attachments/`, and the repo link checker does not unwrap angle-bracket targets.
Changing the link to a plain Markdown target in the actual sibling attachment directory should make `lint:links` stop reporting this record.

## Verification

Confirmed the exported file exists at `charness-artifacts/gather/2026-05-17-slack-mutation-testing-thread.attachments/image.png`.
Confirmed the Markdown link pointed to `<attachments/image.png>`, then to an angle-bracket-wrapped corrected path that the checker still rejected.
The repair updates the dated record link, then refreshes `charness-artifacts/gather/latest.md` from that dated record.

## Root Cause

`support/gather-slack/scripts/export-thread.sh` sets `ATTACHMENTS_DIR` to `$OUTPUT_DIR/${OUTPUT_STEM}.attachments`, while the vendored `slack-to-md.sh` renders attachment links as `attachments/$local_path` wrapped in angle brackets.
That mismatch, plus the repo link checker's literal handling of angle brackets, produces broken relative links for repo-local Markdown link checking.

## Detection Gap

- `lint:links` | fired only after the gather artifact had already been committed in the prior slice | run link checking before committing gathered Slack artifacts with attachments.

## Sibling Search

- Mental model: exporter output paths and Markdown relative links were assumed to share the same attachment directory convention.
- Gather Slack support surface: inspect `support/gather-slack/scripts/export-thread.sh` and `support/gather-slack/vendor/slack-to-md.sh` before the next support-skill release.
- Existing gathered Slack artifacts: search for `<attachments/` under `charness-artifacts/gather` when link checking fails.

## Seam Risk

- Interrupt ID: gather-slack-attachment-link
- Risk Class: none
- Seam: Slack gather support wrapper to repo Markdown link checker
- Disproving Observation: downloaded file existed, but rendered relative link targeted a different directory.
- What Local Reasoning Cannot Prove: whether the installed Charness support wrapper should change its attachment directory or renderer convention globally.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

For this repo slice, repair the gathered dated record and refresh the current pointer.
For the portable support wrapper, defer a separate Charness fix so generated Slack Markdown links match the attachment directory convention.
