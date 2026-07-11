# Debug Review: artifact prune false success on removal failure
Date: 2026-07-11

## Problem

`cautilus doctor artifacts prune` ignores `os.RemoveAll` failures, appends the undeleted directory to `pruned`, and exits successfully.
Operators and automation can therefore discard retention evidence while the artifact remains on disk.

## Correct Behavior

When deletion of any selected recognized artifact fails, prune must stop, exit nonzero with the affected path and cause, and never return a success packet that lists the preserved path as pruned.

## Observed Facts

- `pruneWorkspaceArtifacts` assigns `_ = os.RemoveAll(entry.path)` and unconditionally appends the summary to `pruned`.
- A disposable Cautilus run under an artifact root with mode `0555` was selected by `--keep-last 0`.
- The command exited 0 and returned one `pruned` entry, while the run directory still existed.
- Restoring root permissions allowed cleanup, confirming the preserved directory was the permission-bound target rather than a stale path check.
- The existing CLI smoke proves successful removal and keep-last behavior but does not exercise deletion failure.

## Reproduction

- Create a disposable run with `cautilus init run --root <temp>/artifacts --json`.
- Remove parent write permission with `chmod 0555 <temp>/artifacts`.
- Run `cautilus doctor artifacts prune --root <temp>/artifacts --keep-last 0 --format json`.
- Observe exit 0, a `pruned` record, and the original run directory still present.

## Candidate Causes

- Artifact deletion was intentionally best-effort and structured output meant only “selected for pruning.”
- `RemoveAll` failure was assumed impossible after successful classification.
- A later existence check was expected to reconcile the reported result.
- The ignored error was copied from cleanup code where failure is non-fatal.

## Hypothesis

- Falsifiable claim: the discarded `RemoveAll` return is the sole false-success gap; a permission-bound removal failure currently returns a successful `pruned` result, while propagating a path-wrapped error before append will make the handler exit nonzero and preserve successful deletion behavior | disconfirmer: run the permission fixture and observe an existing downstream check already converts it to an error.

## Verification

- confirmed — the old-code permission reproduction exited 0, reported the selected run as pruned, and left its directory on disk; after repair, the same CLI-level fixture exits nonzero with the path, emits no success packet, and the existing successful-prune regression still passes.

## Root Cause

The pruning loop treats attempted deletion as completed deletion.
It discards the only authoritative filesystem result before constructing the structured success packet, so selection state is mislabeled as mutation state.

## Invariant Proof

- Invariant: a path appears in `pruned` only after its removal succeeds; any removal failure makes the command fail with that path.
- Producer Proof: on permission-respecting non-root Unix, the CLI fixture makes `RemoveAll` delete children but fail when unlinking the selected directory from its non-writable parent; Windows and euid 0 skip this OS-semantic proof.
- Final-Consumer Proof: the new CLI test requires nonzero status, path-bearing stderr, no success payload, and a remaining target directory; the existing CLI smoke proves successful removal.
- Interface-Shape Sibling Scan: install overwrite has a similar ignored tree-removal failure but crosses the Agent/install quality surface and remains a separate reviewed slice.
- Non-Claims: this slice does not add partial-success packets, retries, rollback of children or earlier deletions, or change dry-run selection semantics.

## Detection Gap

- `internal/app/cli_smoke_test.go` successful prune case | only successful filesystem mutation was sampled | add a permission-bound CLI failure proof and keep the existing real CLI success regression.

## Sibling Search

- Mental model: `RemoveAll` after successful classification cannot fail.
- same layer axis: each recognized entry in the prune loop | decision: same bug, fix now | proof: one ignored error path governs every selected directory.
- abstraction up axis: destructive CLI filesystem mutations | decision: same class, diagnostic-only for this slice | proof: no action needed beyond prune because other mutation contracts and rollback semantics require independent evidence.
- specialization down axis: fail-fast versus partial success after prior deletions | decision: intentional plain-text or non-rendering boundary | proof: this slice stops on the first error and makes no atomicity claim for earlier successful entries.
- mental-model axis: install overwrite ignored removal at `remaining_commands.go:1449` | decision: valid follow-up outside the slice | proof: reproduced stale-tree preservation crosses packaged Agent/install validation; follow-up: deferred `charness-artifacts/goals/2026-07-11-fourth-autonomous-two-hour-improvement.md#off-goal-findings`.
- cross-file: `internal/app/remaining_commands.go` owns both destructive seams; install overwrite is explicitly deferred to the active goal's off-goal queue.

## Seam Risk

- Interrupt ID: artifact-prune-false-success-removal-failure
- Risk Class: none
- Seam: artifact selection to filesystem deletion and structured success
- Disproving Observation: permission-bound removal failure returns a path-bearing error before any success packet, while the existing CLI success test still removes the target.
- What Local Reasoning Cannot Prove: atomic rollback after a later entry fails or install-overwrite behavior.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Treat the filesystem deletion result as authoritative, fail before recording `pruned`, and preserve the permission-bound CLI reproduction as durable proof.
