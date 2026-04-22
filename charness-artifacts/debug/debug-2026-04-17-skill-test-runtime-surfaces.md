# Debug Review: skill test runtime surfaces
Date: 2026-04-17

## Problem

`cautilus skill test --adapter-name self-dogfood-skill-test` did not behave consistently across Claude and Codex after the token-efficiency changes.

## Correct Behavior

Given the checked-in `self-dogfood-skill-test` adapter,
when the operator selects `--runtime codex` or `--runtime claude`,
then the runner should invoke the intended backend with provider-specific tuning instead of silently forcing one provider path.

## Observed Facts

- The adapter hardcoded `--backend codex_exec`, so `--runtime claude` never exercised Claude at all.
- Removing shared `--model gpt-5.4-mini --reasoning-effort low` made Claude runnable but regressed Codex trigger stability.
- Claude execution blocked in headless `-p` mode because no Bash permission rule was supplied.
- Codex prompt-size experiments showed `project_doc_max_bytes=0`, `include_apps_instructions=false`, and `include_environment_context=false` reduced prompt cost without changing observed pass/fail behavior.
- Raising the Claude timeout to `180000ms` removed repeated timeout instability on the current machine.

## Reproduction

1. Run `./bin/cautilus skill test --repo-root . --adapter-name self-dogfood-skill-test --runtime claude`.
2. Observe execution block when no Claude permission rule is passed to the child CLI.
3. Run `./bin/cautilus skill test --repo-root . --adapter-name self-dogfood-skill-test --runtime codex`.
4. Observe shared runtime-neutral settings are not sufficient for stable Codex trigger runs in this repo.

## Candidate Causes

- The adapter command template did not use the runtime-resolved `{backend}` placeholder.
- Codex and Claude were sharing one tuning surface even though the knobs were provider-specific.
- Claude headless runs had no explicit permission rule for repo-local Bash usage.
- The original Claude timeout budget was too small for repeated self-dogfood runs on this repo.

## Hypothesis

If the runner and adapter both expose runtime-specific options,
then Codex trigger timeouts and Claude permission failures should disappear without forcing one provider's settings onto the other.

## Verification

- Added runtime-specific runner options for Codex and Claude tuning.
- Updated the self-dogfood adapter to use `{backend}` and pass provider-specific settings.
- Re-ran self-dogfood and confirmed Codex and Claude both completed the checked-in suite once the provider-specific wiring and timeout settings were restored.
- Verified machine-readable skill-evaluation artifacts now preserve explicit runtime telemetry fields.

## Root Cause

Two causes were mixed together:
the adapter ignored `--runtime` because it hardcoded `codex_exec`,
and the Claude headless path had neither the required permission rule nor a realistic timeout budget for this repo.

## Prevention

- Keep runtime-specific tuning explicit in the runner surface instead of assuming one generic provider-neutral model config.
- Keep provider-specific self-dogfood knobs in the adapter, not in product defaults.
- Use prompt-size experiments before promoting Codex config changes.
- Keep Claude headless permission handling documented and regression-tested for adapters that invoke repo-local CLI surfaces.
