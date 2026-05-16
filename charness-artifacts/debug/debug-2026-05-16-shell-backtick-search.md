# Shell Backtick Search Debug
Date: 2026-05-16

## Problem

While selecting the next claim proof candidate, an exploratory `rg` command failed because the search text included Markdown backticks inside a double-quoted shell string.

## Correct Behavior

Given the search text contains literal backticks, when running `rg` from a shell, then the pattern should be single-quoted or passed in a way that prevents command substitution.

## Observed Facts

- The failing command searched for text including ``Use `cautilus discover claims` before writing eval fixtures`` inside a double-quoted shell string.
- The exact error was `zsh:1: argument list too long: rg`.
- The shell tried to evaluate the backtick-delimited `cautilus discover claims` text as command substitution before `rg` received the intended literal pattern.
- No repo files had been modified by the failed command.

## Reproduction

```bash
rg -n "Use `cautilus discover claims` before writing eval fixtures" .cautilus/claims docs internal scripts
```

In zsh this attempts command substitution for the backtick span before running `rg`.

## Candidate Causes

- The command used double quotes around a Markdown phrase that contained literal backticks.
- The search should have used single quotes around the pattern.
- A very large shell-expanded argument could also produce `argument list too long`, but the backtick command substitution explains why the error happened before a normal literal `rg` search.

## Hypothesis

If shell command substitution is the cause, then quoting the pattern with single quotes or searching for a backtick-free substring should avoid the error without changing repo state.

## Verification

- Subsequent `jq` and `nl` reads located `claim-docs-guides-cli-md-122` and `docs/guides/cli.md:122` without touching repo files.
- Existing evidence refresh commits and claim projections remained clean before the failed exploratory search.
- The failure mode is consistent with zsh command substitution syntax, not with a Cautilus binary or claim-state bug.

## Root Cause

The exploratory search used shell double quotes around a Markdown phrase containing backticks, so zsh treated the backtick span as command substitution.
This was an operator command construction error.

## Detection Gap

- exploratory shell search | no guard checked for command-substitution metacharacters in the pattern | use single quotes for literal Markdown phrases and avoid backticks in shell search strings when a shorter substring will do.

## Sibling Search

- Mental model: Markdown phrases can be pasted into shell double quotes safely.
- Search axis: future literal Markdown searches should use single quotes or `rg -F` with a safely quoted pattern.
- Workflow axis: incidental shell quoting errors should be debug-recorded only when they interrupt an implementation slice.
- Evidence axis: do not let operator command errors contaminate product evidence bundles.

## Seam Risk

- Interrupt ID: shell-backtick-search
- Risk Class: none
- Seam: local operator shell quoting
- Disproving Observation: the failure occurred before `rg` could run the intended literal search.
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Use single quotes or backtick-free substrings for shell searches over Markdown text.

## Related Prior Incidents

- `debug-2026-05-16-rg-search-target.md`: earlier operator-side `rg` command construction error during claim workflow exploration.
