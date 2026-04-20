# Debug: workbench discover stderr JSON corruption

## Problem

`cautilus workbench discover --repo-root .` fails with `failed to parse JSON object: invalid character 'd' looking for beginning of value` when a command-backed `instance_discovery` probe writes a warning to stderr before printing the catalog JSON to stdout.

## Correct Behavior

Given an adapter `instance_discovery.kind: command` probe that writes warnings to stderr and `cautilus.workbench_instance_catalog.v1` JSON to stdout,
when `cautilus workbench discover` runs the probe,
then the product should parse only stdout as the catalog payload and should not corrupt JSON decoding with stderr text.

## Observed Facts

- `docs/contracts/workbench-instance-discovery.md` says command-backed discovery should print only catalog JSON to stdout and put human-facing warnings on stderr.
- `internal/app/workbench_commands.go` currently uses `CombinedOutput()` in `executeWorkbenchCommand`.
- `resolveWorkbenchCatalog` decodes the returned string as JSON without separating stdout from stderr.
- Existing CLI smoke coverage proves command-backed discovery only for the happy path where the probe writes JSON and no stderr warning.

## Reproduction

1. Create a command-backed adapter probe that prints one warning line to stderr before the catalog JSON.
2. Run `cautilus workbench discover --repo-root <repo>`.
3. Observe JSON decoding fail because the merged stream starts with the stderr line instead of `{`.

## Candidate Causes

1. `executeWorkbenchCommand` merges stdout and stderr with `CombinedOutput()`, so stderr can prefix stdout.
2. The JSON decoder is too strict about leading non-JSON bytes and rejects warning text before the object.
3. The command-backed discovery contract incorrectly assumes stderr ordering will not matter once streams are merged.

## Hypothesis

If `executeWorkbenchCommand` captures stdout and stderr separately and returns only trimmed stdout on success, then `workbench discover` will continue to parse the catalog JSON even when the probe writes warnings to stderr first.

## Verification

- Code inspection shows the failing path is `resolveWorkbenchCatalog -> executeWorkbenchCommand -> decodeJSONObjectFromString`.
- The fix should be confirmed by a CLI smoke test where the probe writes to stderr before stdout and `workbench discover` still returns a valid catalog packet.

## Root Cause

The runtime violated its own command-backed discovery contract by merging stderr into the payload that was later parsed as JSON.

## Prevention

- Keep stdout/stderr separated in `executeWorkbenchCommand`.
- Add regression coverage for stderr-before-stdout command-backed discovery.
- Preserve stderr text in command failure errors instead of treating merged output as the success payload.
