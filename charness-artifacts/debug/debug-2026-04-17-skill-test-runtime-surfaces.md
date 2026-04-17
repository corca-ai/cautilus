# Problem

`cautilus skill test --adapter-name self-dogfood-skill-test` did not behave
consistently across Claude and Codex after the token-efficiency changes.

## Correct Behavior

Given the checked-in `self-dogfood-skill-test` adapter, both `--runtime codex`
and `--runtime claude` should execute the intended runtime-specific backend.
The backend-specific tuning should reduce prompt cost or nondeterminism without
silently breaking trigger or execution evaluation.

## Observed Facts

- Before this investigation, the adapter hardcoded `--backend codex_exec`, so
  `--runtime claude` never exercised the Claude backend at all.
- After removing shared `--model gpt-5.4-mini --reasoning-effort low` to make
  Claude runnable, Codex trigger repeats regressed to 90s timeouts.
- Claude execution failed in `-p` mode because Bash calls were denied in
  non-interactive permission handling.
- Official Claude Code headless docs confirm that `-p` accepts
  `--permission-mode` and `--allowedTools`, and that `dontAsk` denies every
  non-preapproved tool call.
- `codex debug prompt-input` showed that `project_doc_max_bytes=0` removed the
  project doc block and reduced visible prompt size in this repo from `25671`
  chars to `20794` chars.

## Reproduction

1. Run `./bin/cautilus skill test --repo-root . --adapter-name self-dogfood-skill-test --runtime claude`.
2. Observe that execution blocks on Bash when no Claude permission rule is
   passed to the child CLI.
3. Run `./bin/cautilus skill test --repo-root . --adapter-name self-dogfood-skill-test --runtime codex`.
4. Observe that shared runtime-neutral settings are not sufficient for Codex
   trigger stability on this repo unless Codex-specific tuning is restored.

## Candidate Causes

1. The adapter command template did not actually use the runtime-resolved
   `{backend}` placeholder.
2. Codex and Claude were sharing the same model/tuning knobs even though those
   knobs are provider-specific.
3. Claude headless runs had no explicit permission surface, so non-read Bash
   commands aborted.
4. Codex was paying unnecessary prompt cost from the project doc block during
   self-dogfood trigger evaluation.

## Hypothesis

If the runner accepts runtime-specific options and the self-dogfood adapter
passes provider-specific tuning, then Codex trigger timeouts should disappear
and Claude execution permission failures should stop.

## Verification

- Added runtime-specific runner options for:
  `--codex-model`, `--codex-reasoning-effort`, `--codex-config`,
  `--claude-model`, `--claude-permission-mode`, and
  `--claude-allowed-tools`.
- Updated the self-dogfood adapter to use `{backend}` and to pass:
  Codex `gpt-5.4-mini`, low effort, `project_doc_max_bytes=0`;
  Claude `dontAsk` plus `Bash(cautilus *)`.
- Re-ran self-dogfood:
  Codex passed trigger `2/2` plus execution `passed`.
- Re-ran self-dogfood:
  Claude execution passed once permission rules were present.

## Root Cause

Two separate root causes were mixed together.

The first was adapter wiring:
the self-dogfood adapter ignored `--runtime` because it hardcoded
`codex_exec`, and it also treated Codex tuning as if it were backend-neutral.

The second was Claude headless permission policy:
non-interactive `-p` runs were not given any allow rules for the repo-local
`cautilus` command surface, so execution blocked before the skill could finish.

## Prevention

- Keep runtime-specific tuning explicit in the runner surface instead of
  sharing one generic `--model` assumption across providers.
- Keep provider-specific self-dogfood knobs in the adapter, not in generic
  product defaults.
- Use `codex debug prompt-input` for repo-local prompt-size experiments before
  promoting a Codex config change.
- Keep Claude headless permission handling documented and tested for any
  adapter that expects nested repo-local CLI invocation.

## Related Prior Incidents

None recorded.
