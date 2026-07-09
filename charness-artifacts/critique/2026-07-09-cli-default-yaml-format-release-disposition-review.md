# Disposition Review: CLI Default YAML Format Release

Date: 2026-07-09

## Scope

This review closes the `cli-default-yaml-format-release` goal after implementation, release preparation, tag publication, public release verification, and install readback.

## Required Dispositions

- Fresh-eye `BLOCK`: advertised `--json` compatibility failed for claim parser commands.
  Disposition: fixed by consuming `--json` in the global output-format parser and adding strict JSON alias tests for `discover claims status`, `evaluate claims plan`, and `discover claims validate`.
- Fresh-eye `WARN`: formatted stdout wrapping suppressed interactive update detection.
  Disposition: fixed by detecting interactivity before wrapping stdout.
- Contract risk: `--output` and packet files could accidentally follow stdout format.
  Disposition: kept JSON file writes in `writeOutputResolved`; docs and tests preserve the stdout-only format contract.
- Contract risk: default `init run` shell export could be broken.
  Disposition: preserved shell export by default; explicit `--format yaml`, `--format json`, and `--json` produce structured output.
- Release proof risk: public release state must not be claimed from tag push alone.
  Disposition: verified GitHub Actions run `28984676895`, local public verifier, GitHub release readback, and install-sh smoke readback.

## Final Verdict

PASS.
All release-blocking findings for `cli-default-yaml-format-release` were fixed or explicitly dispositioned before closeout.
