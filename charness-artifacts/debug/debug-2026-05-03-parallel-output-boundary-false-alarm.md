# Debug Review
Date: 2026-05-03

## Problem

While selecting the next deterministic claim proof slice, a parallel tool output appeared to show adapter placeholder prose embedded inside `docs/contracts/claim-discovery-workflow.md`.

## Correct Behavior

Given two file reads are issued in parallel, when their outputs are reviewed, then each command output should be interpreted separately before treating adjacent prose as one file's content.
Given `docs/contracts/claim-discovery-workflow.md` owns claim-discovery workflow prose, then it should not contain adapter placeholder sections from `docs/contracts/adapter-contract.md`.

## Observed Facts

- A parallel command read `docs/contracts/claim-discovery-workflow.md` and `docs/contracts/adapter-contract.md`.
- The combined conversational view made the two outputs appear adjacent without a human-readable separator.
- A direct read of `docs/contracts/claim-discovery-workflow.md` lines 80-180 showed coherent claim-discovery prose followed by its scan-scope YAML example.
- `git blame -L 80,135 -- docs/contracts/claim-discovery-workflow.md` showed the active canonical-claim-spec section as intentional recent edits.
- No product file needed repair.

## Reproduction

```bash
sed -n '80,180p' docs/contracts/claim-discovery-workflow.md
sed -n '490,525p' docs/contracts/adapter-contract.md
```

Reading the outputs separately reproduces the intended file boundaries and removes the apparent corruption.

## Candidate Causes

- Parallel command output was mentally concatenated without accounting for command boundaries.
- The contract documents both discuss adapter and claim workflow concepts, making adjacent excerpts look semantically plausible as one file.
- The earlier search for deterministic proof candidates displayed several long prose excerpts, increasing the chance of over-reading a combined output.

## Hypothesis

If the suspected contamination is only a parallel-output interpretation error, then direct single-file reads and blame should show no misplaced adapter placeholder block in `docs/contracts/claim-discovery-workflow.md`.

## Verification

Direct reads confirmed `docs/contracts/claim-discovery-workflow.md` does not contain the suspected adapter placeholder block at the inspected location.
The adapter placeholder prose came from the separate `docs/contracts/adapter-contract.md` command output.

## Root Cause

The incident was a same-session operator reading error caused by parallel tool output adjacency, not a repository defect.

## Seam Risk

- Interrupt ID: parallel-output-boundary-false-alarm
- Risk Class: none
- Seam: local tool-output interpretation
- Disproving Observation: single-file reads showed the suspected prose belongs to separate files
- What Local Reasoning Cannot Prove: whether future parallel reads will always be visually easy to distinguish
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When a suspected file corruption is found in parallel output, re-read the suspected file alone before treating the observation as a repo bug.
Prefer separate targeted reads when checking prose adjacency across contract documents.
