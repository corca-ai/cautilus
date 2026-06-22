# Debug Review
Date: 2026-06-22

## Problem

`publish_release.py --execute` for `v0.17.1` stopped before pushing `main` or creating tag `v0.17.1` because the release helper tried to run a missing repo-local CLI/skill surface gate wrapper.

## Correct Behavior

Given the release adapter enables the CLI/skill surface gate, when the release helper executes a publish, then the gate should run through an available support-script entrypoint and the publish should proceed to the normal verification, commit, tag, push, and GitHub release steps.

## Observed Facts

The exact failing command was:

```bash
python3 /home/hwidong/.codex/plugins/cache/local/charness/0.53.0/skills/release/scripts/publish_release.py --repo-root . --publish-current --critique-artifact charness-artifacts/critique/2026-06-22-v0.17.1-release-critique.md --execute
```

The exact failure was:

```text
python3: can't open file '/home/hwidong/codes/cautilus/scripts/check_cli_skill_surface.py': [Errno 2] No such file or directory
```

After the failure, `origin/main` still pointed at `9289cf65bc81ed0c7a7ede7bbcd8006ddb3fbf9e`, local `HEAD` was `b6ba4d1c9b95667e94585b1dcad37d3aa9fbacd4`, and `git ls-remote --tags origin v0.17.1` returned no tag.
The failed helper invocation left generated release and retro artifacts dirty in the worktree.

## Reproduction

Run the publish execute command above from the prepared `v0.17.1` state before adding the wrapper.

A smaller entrypoint reproduction is:

```bash
python3 scripts/check_cli_skill_surface.py --repo-root . --adapter-path .agents/release-adapter.yaml --run-probes --json
```

Before the repair, that command could not start because `scripts/check_cli_skill_surface.py` did not exist.

## Candidate Causes

- The Charness release helper's execute path assumed the consumer repo owns `scripts/check_cli_skill_surface.py`.
- The installed Charness support script existed under `~/.codex/plugins/cache/local/charness/0.53.0/scripts/check_cli_skill_surface.py`, but the publish helper did not call that path directly.
- The publish dry-run did not execute `run_cli_skill_surface_gate`, so the missing repo-local wrapper was not detected before the mutating publish path.
- The release adapter's product surface settings made the CLI/skill gate relevant for this release path.

## Hypothesis

If the repo provides a small `scripts/check_cli_skill_surface.py` wrapper that delegates to the installed Charness support script, then the release helper's existing execute command can run the CLI/skill surface gate and continue past the previous missing-file failure.

## Verification

After adding the wrapper, the repo-local gate entrypoint exited successfully:

```bash
python3 scripts/check_cli_skill_surface.py --repo-root . --adapter-path .agents/release-adapter.yaml --run-probes --changed-path charness-artifacts/release/latest.md --json
```

The command returned:

```json
{"reason": "no CLI, skill, plugin, package, or install-surface change matched", "status": "skipped"}
```

The wrapper also compiled successfully with:

```bash
python3 -m py_compile scripts/check_cli_skill_surface.py
```

## Root Cause

The release helper and this repo disagreed about ownership of the CLI/skill surface gate entrypoint.
The helper execute path called `python3 scripts/check_cli_skill_surface.py`, but Cautilus only had the installed Charness support script and no repo-local compatibility wrapper.

## Invariant Proof

- Invariant: release publish execution can invoke every configured pre-publish gate through a path that exists in this repo or through an explicitly delegated installed support script.
- Producer Proof: `scripts/check_cli_skill_surface.py` now resolves the installed Charness support script under `~/.codex/plugins/cache/local/charness/*/scripts/` and runs it as `__main__`.
- Final-Consumer Proof: the exact repo-local gate command that publish execute uses now exits successfully in this worktree.
- Interface-Shape Sibling Scan: the wrapper preserves the support script CLI arguments by forwarding `sys.argv` through `runpy.run_path`; it adds no repo-specific schema.
- Non-Claims: this does not prove the full `v0.17.1` publish completed; it proves the previously missing release gate entrypoint is available.

## Detection Gap

- release dry-run | did not execute the CLI/skill surface gate | make dry-run verify that every execute-only helper entrypoint exists, or run the gate in non-mutating mode before publish execution
- repo support scripts | no wrapper existence check covered `scripts/check_cli_skill_surface.py` | keep the wrapper checked in and let normal release publish exercise it
- failed publish artifact state | helper wrote release/retro artifacts before the missing-file failure | re-run publish after the wrapper fix so the final release artifact reflects a completed publish instead of the interrupted attempt

## Sibling Search

- Mental model: installed Charness release helpers can call their own support scripts without repo-local compatibility entrypoints.
- same helper path: `run_cli_skill_surface_gate` in the release helper calls `scripts/check_cli_skill_surface.py` | decision: add the repo-local wrapper | proof: repo-local command exits 0
- support-script sibling: the installed Charness support script exists and is executable through the wrapper | decision: delegate instead of copying helper logic | proof: wrapper command returns a valid JSON gate result
- cross-file: release dry-run did not discover the missing execute-only entrypoint | decision: valid follow-up outside this release slice if Charness wants stronger dry-run coverage | proof: missing file only surfaced under `--execute`

## Seam Risk

- Interrupt ID: release-helper-cli-surface-wrapper
- Risk Class: none
- Seam: repo-local release wrapper to installed Charness support script
- Disproving Observation: `publish_release.py --execute` reached a repo-local path that did not exist even though plugin support code existed elsewhere
- What Local Reasoning Cannot Prove: whether future Charness versions will keep the same support-script path and CLI contract
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep a checked-in repo-local wrapper for the CLI/skill surface gate and let release publish exercise it through the same path the helper uses.
For future Charness release helper changes, make dry-run or release preflight verify execute-only helper entrypoint availability before any mutating publish artifacts are written.

## Related Prior Incidents

- `debug-2026-05-13-release-prepare-arg-forwarding.md` — release helper wrapper boundaries previously failed because arguments were not forwarded through the expected entrypoint.
- `debug-2026-05-13-release-fresh-checkout-shallow-probe.md` — release-time helper behavior previously depended on an environment shape that was not proven before the release path reached it.
