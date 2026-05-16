# Parallel Observation Output Race Debug
Date: 2026-05-16

## Problem

While building evidence for `claim-readme-md-152`, a parallel command group made it look like `./bin/cautilus evaluate observation --output ...` exited 0 without writing the requested summary file.

## Correct Behavior

Given an existing `cautilus.evaluation_observed.v1` packet, when `cautilus evaluate observation --input <observed> --output <summary>` runs, then it should write a `cautilus.evaluation_summary.v1` packet to the requested output path or fail non-zero.

## Observed Facts

- `./bin/cautilus evaluate fixture --repo-root . --adapter-name self-dogfood-eval --fixture ./fixtures/eval/dev/repo/checked-in-agents-routing.fixture.json --output-dir /tmp/cautilus-readme-reviewable-artifacts-proof-codex` succeeded and wrote `eval-cases.json`, `eval-observed.json`, and `eval-summary.json`.
- I then launched `evaluate observation --output`, `jq`, and `sha256sum` over the same intended output path in one parallel tool group.
- The reader commands reported `/tmp/cautilus-readme-reviewable-artifacts-proof-codex/eval-summary-rerun.json` missing.
- A later serial reproduction with `--output /tmp/cautilus-readme-reviewable-artifacts-proof-codex/eval-summary-output-test.json` exited 0 and wrote the file.
- Redirecting stdout also produced a valid `cautilus.evaluation_summary.v1` packet.

## Reproduction

The misleading failure shape is a writer/reader scheduling race:

```bash
./bin/cautilus evaluate observation --input /tmp/cautilus-readme-reviewable-artifacts-proof-codex/eval-observed.json --output /tmp/cautilus-readme-reviewable-artifacts-proof-codex/eval-summary-rerun.json
jq '{schemaVersion, recommendation, evaluationCounts}' /tmp/cautilus-readme-reviewable-artifacts-proof-codex/eval-summary-rerun.json
```

Those commands are safe when run serially but unsafe when launched concurrently.

## Candidate Causes

- The command might ignore `--output` and write only to stdout.
- The input observed packet might be invalid or incomplete.
- The parallel reader might have opened the target path before the writer created it.

## Hypothesis

If this is a tool orchestration race rather than a product bug, then running `evaluate observation --output` serially before reading the file should create a valid summary packet.

## Verification

Serial verification passed:

```bash
rm -f /tmp/cautilus-readme-reviewable-artifacts-proof-codex/eval-summary-output-test.json
./bin/cautilus evaluate observation --input /tmp/cautilus-readme-reviewable-artifacts-proof-codex/eval-observed.json --output /tmp/cautilus-readme-reviewable-artifacts-proof-codex/eval-summary-output-test.json
ls -l /tmp/cautilus-readme-reviewable-artifacts-proof-codex/eval-summary-output-test.json
```

The file existed after the command and `jq` reported `schemaVersion: cautilus.evaluation_summary.v1`, `recommendation: accept-now`, and one passed evaluation.

## Root Cause

The apparent missing output was caused by launching a writer and its reader in the same parallel tool group.
The reader checked the target file before the writer had created it.

## Detection Gap

- command evidence collection | no local guard prevented parallelizing dependent writer and reader commands | keep dependent evidence commands serial, especially when one command creates a file the next command reads.

## Sibling Search

- Mental model: independent command probes can be parallelized even when they share an output path.
- Evidence axis: run packet-producing commands before packet-inspection or hashing commands.
- Shell axis: avoid naming zsh variables `status`; it is read-only and produced a separate self-inflicted shell error during reproduction.
- Prior-memory axis: this repeats the writer/reader warning in `docs/internal/working-patterns.md`.

## Seam Risk

- Interrupt ID: parallel-observation-output-race
- Risk Class: none
- Seam: local tool orchestration
- Disproving Observation: serial `evaluate observation --output` wrote the requested packet successfully.
- What Local Reasoning Cannot Prove: whether every existing evidence bundle was collected without similar orchestration races.
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Do not parallelize commands when one command creates the exact file another command reads, hashes, validates, or summarizes.
Run the writer first, then inspect the artifact.

## Related Prior Incidents

- `docs/internal/working-patterns.md`: already records that sharing a writer and reader path across concurrent commands creates false bug signals.
