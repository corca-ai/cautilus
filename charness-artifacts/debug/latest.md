# Debug Review: install overwrite false success on stale-tree removal failure
Date: 2026-07-11

## Problem

`cautilus init --overwrite` ignores failure to remove the existing Cautilus Agent skill tree, reinstalls bundled files over the partial tree, and reports `status: reinstalled`.
Stale or untrusted files can therefore survive an operation whose explicit contract is replacement.

## Correct Behavior

When overwrite cannot remove the existing Cautilus Agent destination tree completely, installation must stop with a path-bearing nonzero error and no install-summary success packet.
A successful overwrite must begin from an absent destination so the installed tree contains only current bundled content.

## Observed Facts

- `installBundledSkill` assigns `_ = os.RemoveAll(destinationDir)` whenever overwrite is true, then recreates the same directory and installs bundled files.
- A normal disposable install was augmented with `stale-locked/old.txt`; the stale directory was changed to mode `0555`.
- `cautilus init --overwrite --json` exited 0, reported `status: reinstalled` and `overwrote: true`, while `stale-locked/old.txt` remained.
- The reproduced stale file is outside the bundled manifest, so its survival is not a packaged-source parity issue; it is destination replacement failure.
- Existing install smoke covers initial install, overwrite, legacy migration, update, and packaged content, but not removal failure.

## Reproduction

- Run `cautilus init --repo-root <temp> --json`.
- Add `.agents/skills/cautilus-agent/stale-locked/old.txt` and set its parent mode to `0555`.
- Run `cautilus init --repo-root <temp> --overwrite --json`.
- Observe exit 0 with `reinstalled` plus the stale file still present.

## Candidate Causes

- Overwrite was intended to refresh known files without promising removal of unknown files.
- Existing skill trees were assumed writable because they were previously installed by Cautilus.
- Bundled installation was expected to reconcile or reject unknown destination files.
- Removal failure was treated as best-effort cleanup rather than a replacement precondition.

## Hypothesis

- Falsifiable claim: the ignored destination `RemoveAll` error is the only false-success gap; a permission-bound overwrite test fails on old code because it returns success with the stale file, and propagating a path-wrapped removal error before recreation will make the CLI fail without a summary while preserving normal overwrite and install parity | disconfirmer: run the failure fixture and observe bundled installation already removes or rejects the stale file downstream.

## Verification

- confirmed — the old-code non-root Unix reproduction exited 0, reported `reinstalled`, and retained the stale file; after repair, the adjacent CLI fixture returns nonzero path-bearing stderr with no summary and retains the locked stale file for operator repair, while normal install, overwrite, and legacy migration controls pass.

## Root Cause

The installer treats overwrite deletion as optional cleanup even though subsequent status and operator language describe complete replacement.
Because bundled installation only writes known files, it cannot detect unknown files left behind by a failed tree removal.

## Invariant Proof

- Invariant: `init --overwrite` reports `reinstalled` only after the prior Cautilus Agent destination tree is completely removed and current bundled content is installed.
- Producer Proof: permission-bound non-root Unix fixture forces removal failure inside an unknown stale subtree.
- Final-Consumer Proof: the CLI must return nonzero path-bearing stderr, no install-summary stdout, and retain the stale target for operator repair; existing install and packaged parity probes must still pass.
- Interface-Shape Sibling Scan: artifact prune now propagates the same filesystem authority; worktree replacement has ignored cleanup calls but no reproduced false-success in this install slice.
- Non-Claims: this does not make overwrite atomic after deletion, roll back a partially removed tree, change legacy migration, or alter Cautilus Agent content.

## Detection Gap

- install CLI smoke and packaged-skill parity | valid writable overwrite paths passed, but destination-removal failure was not sampled | add a permission-bound overwrite failure test plus existing install/Agent parity quality probes.

## Sibling Search

- Mental model: a tree previously created by Cautilus remains fully removable.
- same layer axis: destination tree removal before bundled installation | decision: same bug, fix now | proof: real stale-file survival with success status.
- abstraction up axis: destructive replacement commands | decision: same class, diagnostic-only for this slice | proof: no action needed beyond install because worktree replacement ownership and Git metadata recovery require independent reproduction.
- specialization down axis: partial deletion before failure | decision: intentional plain-text or non-rendering boundary | proof: fail closed without rollback; operators retain the path-bearing cause and may repair permissions before retry.
- mental-model axis: artifact prune ignored removal | decision: already handled | proof: the immediately preceding slice now fails before reporting `pruned`.
- cross-file: `internal/app/remaining_commands.go` owns both resolved removal seams; `internal/app/cli_smoke_test.go` carries their process-boundary proof.

## Seam Risk

- Interrupt ID: install-overwrite-false-success-stale-tree
- Risk Class: none
- Seam: existing Agent destination removal to bundled reinstall summary
- Disproving Observation: failure fixture returns nonzero/no summary and normal install, overwrite, skill parity, and agent-surface probes pass.
- What Local Reasoning Cannot Prove: atomic recovery after partial removal or unreproduced worktree cleanup failures.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Make complete destination removal a checked overwrite precondition and retain both failure proof and packaged Agent/install parity in the quality gate.
