# Debug Review
Date: 2026-05-03

## Problem

A local helper command for summarizing scenario proposal and conversation-review proof artifacts failed with `jq: error (at /tmp/cautilus-scenario-review-proof/conversation-review.json:103): break`.

## Correct Behavior

Given two generated JSON packets, when I summarize them for evidence authoring, then the jq expression should read both files explicitly and emit a compact summary.
The summary helper should not fail after the underlying `cautilus scenario propose` and `cautilus scenario review-conversations` commands have already succeeded.

## Observed Facts

- `./bin/cautilus scenario propose --input fixtures/scenario-proposals/standalone-input.json --output /tmp/cautilus-scenario-review-proof/proposals.json` completed before the jq failure.
- `./bin/cautilus scenario review-conversations --input fixtures/scenario-conversation-review/input.json --output /tmp/cautilus-scenario-review-proof/conversation-review.json` completed before the jq failure.
- The failing jq expression used `input.schemaVersion` while jq's `input` builtin reads the next input document, which exhausted the stream and produced the `break` error.
- The failure was in the ad hoc proof-summary command, not in Cautilus runtime behavior.

## Reproduction

```bash
./bin/cautilus scenario propose --input fixtures/scenario-proposals/standalone-input.json --output /tmp/cautilus-scenario-review-proof/proposals.json
./bin/cautilus scenario review-conversations --input fixtures/scenario-conversation-review/input.json --output /tmp/cautilus-scenario-review-proof/conversation-review.json
jq '{proposals: {schemaVersion: input.schemaVersion}}' /tmp/cautilus-scenario-review-proof/proposals.json /tmp/cautilus-scenario-review-proof/conversation-review.json
```

## Candidate Causes

- Misuse of jq's `input` builtin as if it referred to the current input object.
- The command tried to summarize two files in one jq expression without binding them to variables first.
- The generated JSON packet could have been malformed, causing jq to fail while reading the second file.

## Hypothesis

If the jq command binds both files explicitly with `--slurpfile` or runs separate jq reads per file, then the summary will succeed and confirm the generated packet shapes.

## Verification

The follow-up summary command should use explicit file bindings, for example:

```bash
jq -n --slurpfile proposals /tmp/cautilus-scenario-review-proof/proposals.json --slurpfile review /tmp/cautilus-scenario-review-proof/conversation-review.json '{proposals: {schemaVersion: $proposals[0].schemaVersion}, review: {schemaVersion: $review[0].schemaVersion}}'
```

## Root Cause

The jq expression used the stream-reading `input` builtin when it needed the current document or named file bindings.
That consumed the second input unexpectedly and made jq terminate with `break`.

## Seam Risk

- Interrupt ID: jq-summary-input-misuse
- Risk Class: none
- Seam: operator-authored shell summary around generated proof packets
- Disproving Observation: the failing command was jq-only while both Cautilus commands had already written their output files
- What Local Reasoning Cannot Prove: none; this is not a product runtime seam
- Generalization Pressure: none

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Use `jq -n --slurpfile` when summarizing multiple generated packets into one evidence-authoring view.
