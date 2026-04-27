# Debug Review: claim discover state parent dir
Date: 2026-04-27

## Problem

The no-input Cautilus branch suggested this first claim scan command:

```bash
./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json
```

It failed on a fresh claim-state path with:

```text
open /home/hwidong/codes/cautilus/.cautilus/claims/latest.json: no such file or directory
exit status 1
```

## Correct Behavior

Given `agent status` reports `run_first_claim_scan` with the default claim state path, when an agent runs the suggested `claim discover` command, then the command should create the output parent directory and write `cautilus.claim_proof_plan.v1`.

## Observed Facts

- `./bin/cautilus agent status --repo-root . --json` reported `claimState.status=missing` and suggested `cautilus claim discover --repo-root . --output .cautilus/claims/latest.json`.
- `.cautilus/` existed, but `.cautilus/claims/` did not.
- `./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json` failed before writing a packet.
- `./bin/cautilus claim discover --repo-root . --output /tmp/cautilus-claims-probe.json` succeeded because `/tmp` already existed.
- The app-layer `writeOutputResolved` helper wrote files directly with `os.WriteFile` and did not create parent directories.
- Other command paths already called `ensureParentDir` before writing nested output files.

## Reproduction

Run from a repo with `.cautilus/` present and `.cautilus/claims/` absent:

```bash
./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json
```

The command exits non-zero with:

```text
open /home/hwidong/codes/cautilus/.cautilus/claims/latest.json: no such file or directory
exit status 1
```

## Candidate Causes

- The default claim state directory was never created during `agent status`, and `claim discover` assumed the parent existed.
- The shared JSON output helper lacked the parent-directory behavior that nested output paths need.
- The failure was specific to the repo-local `.cautilus/claims/` state path, while other examples used existing directories such as `/tmp`.

## Hypothesis

If `writeOutputResolved` creates the parent directory before `os.WriteFile`, then `claim discover` should succeed when writing `.cautilus/claims/latest.json`, and a focused app test that writes to a nested claim path should pass.

## Verification

Changed `writeOutputResolved` to call `ensureParentDir(output)` before marshalling and writing JSON.
Updated `TestRunClaimDiscoverWritesProofPlanFromTinyRepo` to write to `.cautilus/claims/latest.json`.
`go test ./internal/app -run TestRunClaimDiscoverWritesProofPlanFromTinyRepo` passed.
After the fix, `./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json` succeeded.
`./bin/cautilus claim show --input .cautilus/claims/latest.json --output .cautilus/claims/status-summary.json` succeeded.
Follow-up verification also found that committed claim packets can trip gitleaks' Sourcegraph token rule on the `gitCommit` metadata field.
Added a narrow `.gitleaks.toml` allowlist for `gitCommit` lines under `.cautilus/claims/*.json`.

## Root Cause

The first-scan branch emitted a repo-local nested output path, but the common app-layer JSON output helper did not create parent directories.
The command worked only when the chosen output directory already existed.

## Seam Risk

- Interrupt ID: claim-discover-state-parent-dir
- Risk Class: none
- Seam: CLI JSON output path handling
- Disproving Observation: a product-suggested command failed in an initial claim-state repo state while the same command shape succeeded under `/tmp`
- What Local Reasoning Cannot Prove: whether every command should rely on shared parent-directory creation or keep explicit per-command preflight calls for clearer errors
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep parent-directory creation in shared output helpers so product-suggested nested output paths work consistently.
When a native CLI command writes a non-JSON text artifact outside `writeOutputResolved`, call `ensureParentDir` before `os.WriteFile`.
When adding a command that prints a default repo-local state path, include a test that writes to a previously missing nested directory.
Keep the secret-scan allowlist scoped to claim-packet `gitCommit` metadata only; do not broaden it to arbitrary 40-character tokens.

## Related Prior Incidents

- `debug-2026-04-27-stale-claim-packet-schema.md`: adjacent no-input claim-state routing incident, but the root cause was stale packet shape rather than missing output parents.
