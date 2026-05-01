# Debug Review: release smoke required channel
Date: 2026-05-01

## Problem

While collecting deterministic claim evidence, a bare `npm run release:smoke-install` command failed immediately with `--channel must be install_sh`.

## Correct Behavior

Given release install smoke is used as evidence, when the script is invoked through npm, then the invocation must include `-- --channel install_sh` plus the intended installer-source/version policy.
Given a maintainer follows the documented release checklist, then the documented form should run the install.sh smoke in an isolated temp root and verify version, verbose version state, and update behavior.

## Observed Facts

- The failed command was `npm run release:smoke-install`.
- The stderr was exactly `--channel must be install_sh`.
- `docs/maintainers/releasing.md` documents `npm run release:smoke-install -- --channel install_sh --version v<next-version>`.
- `docs/maintainers/operator-acceptance.md` also includes the required `--channel install_sh` argument.
- The corrected local evidence command `npm run release:smoke-install -- --channel install_sh --installer-source local --json` passed.

## Reproduction

```bash
npm run release:smoke-install
```

This exits non-zero because the script intentionally requires an explicit supported channel.

## Candidate Causes

- Operator invocation error: the npm script is a thin wrapper and still requires the release-channel argument.
- Package-script ergonomics gap: the shorthand name looks runnable without extra arguments even though the release contract is intentionally explicit.
- Documentation drift: the package script list alone does not encode the documented required arguments.

## Hypothesis

If the command is rerun with `--channel install_sh`, then the failure should disappear and the script should proceed into the install smoke.

## Verification

`npm run release:smoke-install -- --channel install_sh --installer-source local --json` completed with exit 0 and wrote a JSON summary showing install, `--version`, `version --verbose`, and `update` all passed in an isolated temp install root.

## Root Cause

This was not a release-smoke implementation bug.
The evidence-gathering invocation omitted the script's required `--channel install_sh` argument.

## Seam Risk

- Interrupt ID: release-smoke-required-channel
- Risk Class: none
- Seam: npm script convenience wrapper versus explicit release-channel contract
- Disproving Observation: documented invocations include the channel, and the corrected invocation passed.
- What Local Reasoning Cannot Prove: whether a future operator will infer the required channel from `package.json` alone.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Use `npm run release:smoke-install -- --channel install_sh ...` when release smoke is evidence.
Do not treat the bare npm script as a complete release-smoke command.
