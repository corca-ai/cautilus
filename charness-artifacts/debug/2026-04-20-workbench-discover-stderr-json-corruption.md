# Debug Review: workbench discover stderr JSON corruption
Date: 2026-04-20

## Problem

`cautilus workbench discover --repo-root .` failed with `failed to parse JSON object: invalid character 'd' looking for beginning of value` when a command-backed discovery probe wrote a warning to stderr before printing catalog JSON to stdout.

## Correct Behavior

Given an adapter with `instance_discovery.kind: command`,
when the probe writes warnings to stderr and catalog JSON to stdout,
then `cautilus workbench discover` should parse only stdout as the catalog payload.

## Observed Facts

- `docs/contracts/workbench-instance-discovery.md` says command-backed discovery should print catalog JSON to stdout and warnings to stderr.
- `internal/app/workbench_commands.go` used `CombinedOutput()` in the shared command path.
- `resolveWorkbenchCatalog` decoded the merged string as JSON without separating stdout from stderr.
- Existing smoke coverage only proved the happy path where the probe emitted no stderr warning.

## Reproduction

1. Create a command-backed adapter probe that prints one warning line to stderr before catalog JSON.
2. Run `cautilus workbench discover --repo-root <repo>`.
3. Observe JSON decoding fail because the merged stream begins with the stderr line instead of `{`.

## Candidate Causes

- The shared command helper merged stdout and stderr with `CombinedOutput()`.
- The JSON decoder rejected warning text prefixed before the object payload.
- The discovery contract assumed stderr ordering would not matter after streams were merged.

## Hypothesis

If the shared command helper captures stdout and stderr separately and returns only stdout as the success payload,
then `workbench discover` will continue to parse catalog JSON even when the probe warns on stderr first.

## Verification

- Code inspection showed the failing path was `resolveWorkbenchCatalog -> executeWorkbenchCommand -> decodeJSONObjectFromString`.
- The confirming fix should be a regression test where stderr precedes stdout and `workbench discover` still returns a valid catalog packet.

## Root Cause

The runtime violated its own command-backed discovery contract by merging stderr into the payload that it later parsed as JSON.

## Prevention

- Keep stdout and stderr separated in the shared command helper.
- Add regression coverage for stderr-before-stdout command-backed discovery.
- Preserve stderr text in command failure errors instead of treating merged output as the success payload.
