# Debug Review: claim discover wrapped Markdown
Date: 2026-04-26

## Problem

`./bin/cautilus claim discover --repo-root ../charness --output /tmp/cautilus-charness-claims.json` succeeded, but some candidates were truncated because the extractor treated physical Markdown lines as complete claims.
Example summary:

```text
Of course, you can call a skill directly when you already know the workflow you
```

## Correct Behavior

Given prose Markdown may be hard-wrapped, when `claim discover` builds a source-ref-backed candidate, then it should classify a logical paragraph or list item rather than a single physical line.

## Observed Facts

- The command emitted a valid `cautilus.claim_proof_plan.v1` packet for `../charness`.
- `sourceCount=469`, `candidateCount=120`, and `candidateLimit=120`.
- A README candidate ended mid-sentence because the source paragraph was wrapped across lines.
- Cautilus's own prose convention avoids this in most maintained docs, but consumer repos cannot be expected to follow that convention.

## Reproduction

Run:

```bash
./bin/cautilus claim discover --repo-root ../charness --output /tmp/cautilus-charness-claims.json
```

Then inspect the first few `claimCandidates[*].summary` values.

## Candidate Causes

- The extractor scans physical lines instead of logical Markdown blocks.
- The source repo hard-wraps prose, unlike Cautilus's semantic-line convention.
- The candidate-length filter happens after line splitting, so it cannot recover the missing continuation.

## Hypothesis

If the extractor first groups non-code Markdown prose into logical blocks, hard-wrapped paragraphs should produce complete candidate summaries while preserving the starting line as the source ref.

## Verification

The external dogfood packet shows the truncated summary and source path.
Added logical-block extraction that joins hard-wrapped prose but still splits semantic-line sentences at sentence punctuation.
Added `TestDiscoverClaimProofPlanJoinsWrappedMarkdownClaims`.
Reran `go test ./internal/runtime ./internal/app ./internal/cli`; it passed.
Reran `./bin/cautilus claim discover --repo-root ../charness --output /tmp/cautilus-charness-claims.json`; the first candidates now contain complete wrapped summaries.

## Root Cause

The first deterministic extractor overfit to physical source lines.
That was adequate for Cautilus's semantic-line docs but not for arbitrary consumer repos.

## Seam Risk

- Interrupt ID: claim-discover-wrapped-markdown
- Risk Class: none
- Seam: generic consumer Markdown truth surfaces
- Disproving Observation: a valid consumer README yields an incomplete candidate summary
- What Local Reasoning Cannot Prove: how many consumer docs use hard wrapping or mixed list continuations
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Treat prose blocks, not physical lines, as the minimum candidate extraction unit for Markdown truth surfaces.
