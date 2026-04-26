# Debug Review: source shim read-only Go cache
Date: 2026-04-26

## Problem

The live `self-dogfood-eval-skill` run deferred because nested Codex could not execute `./bin/cautilus` under the read-only sandbox.
The exact symptom was `go: creating work dir: mkdir /home/hwidong/.cache/tmp/go-build2580397793: read-only file system`.

## Correct Behavior

Given the checked-in source checkout exposes `bin/cautilus` as the local product binary, when a read-only skill evaluation invokes the binary, then the launcher should avoid writing build cache or temp files inside the read-only caller filesystem.
Workspace write protection should block repo edits, not basic binary bootstrap.

## Observed Facts

- `./bin/cautilus eval test --repo-root . --adapter-name self-dogfood-eval-skill --output-dir /tmp/cautilus-skill-live` passed preflight but produced `recommendation=defer`.
- The `execution-cautilus-test-request` case reported that the launcher shells out to `go run` and could not create its Go build work directory.
- The `execution-cautilus-no-input-claim-discovery-status` case also hit the same `go: creating work dir` error before falling back to read-only inspection.
- After `/tmp`-backed cache defaults, the nested agent showed `/tmp` was also read-only in the evaluated sandbox and succeeded only after manually moving Go scratch paths to `/dev/shm`.
- A later run showed `cgo` still used the caller's `TMPDIR`, so `GOCACHE` and `GOTMPDIR` alone were not enough.
- The same live run exposed that `cautilus eval test --fixture ...` needs an explicit external `--output-dir` under read-only workspace sandboxes because the default runDir is `.cautilus/runs` under the repo.
- The adapter intentionally uses `--sandbox read-only` so the skill evaluation can detect unwanted repo writes.
- The launcher previously exported Cautilus-specific env vars, then directly executed `go -C "$REPO_ROOT" run ./cmd/cautilus "$@"`.

## Reproduction

Run:

```bash
./bin/cautilus eval test --repo-root . --adapter-name self-dogfood-eval-skill --output-dir /tmp/cautilus-skill-live
```

Before the fix, the nested read-only execution of `./bin/cautilus` could fail with:

```text
go: creating work dir: mkdir /home/hwidong/.cache/tmp/go-build2580397793: read-only file system
```

## Candidate Causes

- The source launcher used `go run`, which needs writable build cache and temp directories.
- The read-only sandbox protected the default `TMPDIR` or Go cache path used by the nested command.
- The self-dogfood adapter was too strict by using read-only instead of workspace-write.
- The nested agent selected the source checkout launcher rather than a prebuilt binary on `PATH`.

## Hypothesis

If `bin/cautilus` defaults `GOCACHE` and `GOTMPDIR` to an external writable scratch root when the caller did not provide them, then read-only skill evaluation can still execute the local source launcher while keeping workspace writes blocked.

## Verification

Added external scratch defaults for `GOCACHE`, `GOTMPDIR`, and non-writable caller `TMPDIR` in `bin/cautilus`, preferring `/dev/shm/cautilus-go` when available and falling back to `/tmp/cautilus-go`, with `CAUTILUS_GO_TMP_ROOT` as an explicit test or operator override.
Added a shim test that clears the Go cache variables, points `TMPDIR` at a read-only directory, sets `CAUTILUS_GO_TMP_ROOT` to a test directory, runs `--version`, and asserts the scratch directories are created.

Ran:

```bash
node --test --test-reporter=spec --test-reporter-destination=stdout bin/cautilus.test.mjs
TMPDIR=/tmp/cautilus-readonly-probe GOCACHE= GOTMPDIR= ./bin/cautilus --version
```

Both commands passed after the fix.

## Root Cause

The self-dogfood runner correctly prevented workspace writes, but the repo-local source launcher treated Go's default writable cache/tmp locations as available.
That made basic binary invocation depend on host write permissions outside the repo contract.

## Seam Risk

- Interrupt ID: source-shim-read-only-go-cache
- Risk Class: external-seam
- Seam: read-only agent sandbox versus source-checkout Go launcher
- Disproving Observation: the binary failed before Cautilus command routing could be evaluated
- What Local Reasoning Cannot Prove: whether every host sandbox exposes a writable `/tmp`
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep the self-dogfood skill adapter on read-only sandboxing for nested Codex runs.
Use the source shim test to prevent regressions in tmp-backed `go run` execution.
Keep bundled skill guidance explicit that read-only eval runs need a writable external `--output-dir`.
