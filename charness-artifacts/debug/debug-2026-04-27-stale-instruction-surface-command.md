# Debug Review: stale instruction-surface command
Date: 2026-04-27

## Problem

During skill-surface verification, the generic implementation skill suggested:

```bash
cautilus instruction-surface test --repo-root .
```

The current Cautilus binary rejected that command and printed top-level help with exit status 1.

## Correct Behavior

Given Cautilus has migrated instruction-surface evaluation into the `repo / whole-repo` preset, when this repo verifies the checked-in instruction surface, then the verification path should use `cautilus eval test` or the `npm run dogfood:self` wrapper.

## Observed Facts

- `./bin/cautilus instruction-surface test --repo-root .` exited 1 and printed the top-level command list.
- `docs/specs/evaluation-surfaces.spec.md` says prior `cautilus instruction-surface test/evaluate` commands were removed without aliases.
- `docs/cli-reference.md` says the `repo / whole-repo` preset replaces prior `cautilus instruction-surface` commands.
- `package.json` maps `npm run dogfood:self` to `./bin/cautilus eval test --repo-root . --adapter-name self-dogfood-eval`.
- `./bin/cautilus claim show --help` correctly exposes the newly added `--sample-claims` option.
- `./bin/cautilus doctor --repo-root . --scope agent-surface` returned ready.

## Reproduction

Run:

```bash
./bin/cautilus instruction-surface test --repo-root .
```

The command exits 1 because the command family no longer exists.

## Candidate Causes

- The generic implementation skill still names the pre-migration command.
- AGENTS-level local checks were interpreted through stale generic skill text instead of the repo's current evaluation-surface spec.
- The binary command registry omitted a compatibility alias that the migration explicitly decided not to keep.

## Hypothesis

If the local verification path switches to `cautilus eval test --adapter-name self-dogfood-eval` or `npm run dogfood:self`, then the current Cautilus repo can still verify the skill/instruction surface without reviving the removed command alias.

## Verification

Confirmed the replacement contract in `docs/specs/evaluation-surfaces.spec.md`, `docs/cli-reference.md`, and `package.json`.
Confirmed `doctor --scope agent-surface` is ready and `claim show --help` exposes the changed command surface.

## Root Cause

The failure was not a Cautilus binary regression.
The binary matched the current spec, while an external generic skill instruction still referenced the historical command.

## Seam Risk

- Interrupt ID: stale-instruction-surface-command
- Risk Class: none
- Seam: generic implementation skill guidance versus repo-local Cautilus command migration
- Disproving Observation: the repo-local spec and CLI reference both say the command was intentionally removed
- What Local Reasoning Cannot Prove: whether all installed charness skill copies have the same stale verification advice
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Use repo-local command specs and `package.json` scripts as the source of truth for Cautilus verification commands.
Open or update a charness follow-up if this stale `instruction-surface test` advice appears in the maintained shared skill source.
