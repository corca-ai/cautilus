# Codex Home Auth Isolation Debug
Date: 2026-05-12

## Problem

`cautilus eval test` could run a `codex_exec` runner with an isolated `CODEX_HOME`, but every live Codex case blocked before producing routing JSON because the isolated home also removed Codex auth.
The observed packet reported generic `runner_execution_failed` results instead of making the setup/auth blocker visible.

## Correct Behavior

Given a Cautilus eval runner isolates Codex state, config, plugins, and sessions, when the operator has explicitly approved an auth source, then the child `codex exec` process should use that auth source without loading the rest of the operator's Codex home.
Given no usable Codex auth source exists for the selected mode, when `cautilus eval test` starts the run, then it should block early with `runner_auth_missing` instead of spending every case on an unauthenticated runner invocation.

## Observed Facts

- GitHub issue #35 reports `5 blocked / 0 failed / 0 passed` for a `codex_exec` eval run.
- The captured stderr included `401 Unauthorized: Missing bearer or basic authentication in header`.
- `codex exec --help` states that `--ignore-user-config` does not load `$CODEX_HOME/config.toml`, but auth still uses `CODEX_HOME`.
- `scripts/agent-runtime/run-local-eval-test.mjs` classified every non-zero `codex exec` exit as `runner_execution_failed`.
- The runner had no `--codex-home-mode` or `--codex-auth-mode` arguments, so adapters could not express state/config isolation separately from auth inheritance.
- `charness-artifacts/debug/debug-2026-04-23-review-variant-unavailable-executor.md` already records the sibling rule that local executor auth failures should become machine-readable unavailable-executor blockers, not negative behavioral findings.

## Reproduction

The issue's production run is the direct observed reproduction:

```text
cautilus eval test --repo-root . --adapter .agents/cautilus-adapter.yaml --fixture evals/cautilus/whole-repo-routing.fixture.json
```

The runner-expanded command used `codex_exec` with isolated `CODEX_HOME`, and the child `codex exec` stderr showed:

```text
ERROR: unexpected status 401 Unauthorized: Missing bearer or basic authentication in header
```

Local confirmation came from `codex exec --help`, which confirmed the auth path is still tied to `CODEX_HOME`.

## Candidate Causes

- The runner isolated `CODEX_HOME` as one coarse axis, so auth state was removed together with config, plugin, and session state.
- The operator's parent Codex session worked, but the child process saw a different `CODEX_HOME`.
- The runner treated all non-zero Codex exits as generic execution failures before inspecting stderr for auth signatures.
- Adapter command templates had no portable way to request auth inheritance while keeping user config isolated.

## Hypothesis

If Codex home isolation and Codex auth source are separate runner options, then an isolated run can copy only `auth.json` into a temporary Codex home or require `OPENAI_API_KEY` explicitly.
If neither auth source is available, then the runner can return `runner_auth_missing` before spawning Codex for the case.
If Codex still exits with a 401-style auth error, then stderr classification should preserve `runner_auth_missing` in the observed evaluation.

## Verification

Added targeted Node tests for the new runner contract:

- `codexArgs` adds `--ignore-user-config` when `--codex-home-mode isolated` is selected.
- `prepareCodexRuntimeEnv` copies only `auth.json` into the isolated Codex home and does not copy `config.toml`.
- `prepareCodexRuntimeEnv` reports `runner_auth_missing` when isolated auth inheritance has no source auth and no `OPENAI_API_KEY`.
- `codexFailureBlockerKind` classifies the reported `401 Unauthorized` / missing bearer stderr as `runner_auth_missing`.

Targeted verification command:

```bash
node --test scripts/agent-runtime/run-local-eval-test.test.mjs scripts/run-self-dogfood-eval.test.mjs
```

## Root Cause

The eval runner treated `CODEX_HOME` as a single isolation boundary.
That was correct for avoiding user config, plugin, and session influence on behavior, but it was too broad for auth because current `codex exec` still resolves auth through `CODEX_HOME`.
The runner also normalized the resulting 401 exit after process failure, so the observed packet lost the distinction between a runner setup/auth blocker and ordinary runner execution failure.

## Seam Risk

- Interrupt ID: codex-home-auth-isolation
- Risk Class: contract-freeze-risk
- Seam: Codex CLI auth storage and Cautilus eval runner isolation
- Disproving Observation: a parent Codex session can work while the child eval runner fails with `401 Unauthorized` because the child `CODEX_HOME` has no auth.
- What Local Reasoning Cannot Prove: whether future Codex versions will add auth stores beyond `auth.json` or change env-based auth names.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep Codex state/config isolation and Codex auth source as explicit separate runner options.
Preserve local executor setup failures as machine-readable blockers such as `runner_auth_missing`.
When adapters choose isolated Codex homes, use `--codex-auth-mode inherit` for approved local auth inheritance or `--codex-auth-mode env` for explicit API-key based runs.

## Related Prior Incidents

- `charness-artifacts/debug/debug-2026-04-23-review-variant-unavailable-executor.md`: review variants already separated local auth/tool readiness failures from behavioral review verdicts.
