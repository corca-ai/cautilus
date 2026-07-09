# Debug Review
Date: 2026-07-09

## Problem

Fresh-eye release critique found that `discover claims status --json`, `evaluate claims plan --json`, and `discover claims validate --json` were advertised but failed with `unknown argument: --json`.

## Correct Behavior

`--json` remains a compatibility alias for JSON stdout on structured commands.
Command-local parsers should not reject it after the global output-format parser has selected JSON.

## Observed Facts

- `internal/cli/command-registry.json` advertised `[--json]` for parser-facing claim commands.
- `parseOutputFormat` selected JSON when `--json` was present but still forwarded the flag to command-local parsers.
- The claim status, claim eval plan, and claim validate parsers did not accept `--json`.
- Wrapping stdout before `detectInteractiveSession` also made interactive update checks see a non-`*os.File` stdout.

## Reproduction

- `./bin/cautilus discover claims status --input .cautilus/claims/latest.json --sample-claims 1 --json`
- `./bin/cautilus evaluate claims plan --claims .cautilus/claims/evidenced-typed-runners.json --max-claims 1 --allow-stale-claims --json`
- `./bin/cautilus discover claims validate --claims .cautilus/claims/evidenced-typed-runners.json --json`

## Candidate Causes

- The global parser treated `--json` as a format selector but not as a consumed global option.
- The command registry over-advertised `--json` on commands whose local parsers did not accept it.
- The interactivity warning could be caused by checking the wrapper instead of the original stdout writer.

## Hypothesis

The advertised `--json` compatibility bug is caused by the global format parser leaking the alias into command-local parsers.
The update-notice risk is caused by detecting interactivity after wrapping stdout.

## Verification

- Result: confirmed and fixed.
- `go test ./internal/app` passed.
- `./bin/cautilus discover claims status --input .cautilus/claims/latest.json --sample-claims 1 --json` produced parseable JSON.
- `./bin/cautilus evaluate claims plan --claims .cautilus/claims/evidenced-typed-runners.json --max-claims 1 --allow-stale-claims --json` produced parseable JSON.
- `./bin/cautilus discover claims validate --claims .cautilus/claims/evidenced-typed-runners.json --json` produced parseable JSON.

## Root Cause

The implementation split stdout format selection from command-local parsing but only stripped `--format`, not the compatibility alias `--json`.
That left a global presentation flag visible to parsers that had no local reason to accept it.
The same wrapper placement also hid interactive stdout from the update-notice detector.

## Invariant Proof

- Invariant: every command registry entry advertising `[--json]` must accept it as JSON stdout compatibility.
- Producer Proof: `parseOutputFormat` now consumes `--json` while setting explicit JSON output format.
- Final-Consumer Proof: targeted strict JSON tests cover the claim status, claim eval plan, and claim validate alias paths.
- Non-Claims: `--json` remains compatibility spelling; parser-facing docs still prefer `--format json`.

## Detection Gap

- command-registry compatibility | registry advertised `[--json]` without strict alias tests on all advertised parser paths | smallest change to fire it: add strict JSON alias tests whenever a registry entry includes `[--json]`.
- interactive notice behavior | wrapping stdout changed type identity before interactivity checks | smallest change to fire it: keep update-notice interactivity tests around writer wrappers.

## Sibling Search

- same layer: `doctor commands --json`, `discover scenarios --json`, and `doctor binary --json` already had strict JSON tests | decision: covered before this fix | proof: app tests.
- parser-facing claim commands: `discover claims status`, `evaluate claims plan`, and `discover claims validate` lacked alias tests | decision: fixed now | proof: new app tests and smoke commands.
- structured-output toggle commands: `init run` and `improve search prepare-input` need explicit-format awareness after global alias consumption | decision: fixed by consulting the formatted writer explicit flag.

## Seam Risk

- Interrupt ID: cli-json-alias-parser-leak-2026-07-09
- Risk Class: contract-freeze-risk
- Seam: global CLI output-format parsing versus command-local argument parsing.
- Disproving Observation: advertised `--json` commands produce strict JSON without unknown-argument failures.
- What Local Reasoning Cannot Prove: whether third-party scripts parse default stdout without explicit JSON; release notes must tell them to use `--format json`.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: already provided by release fresh-eye subagent `019f442a-343b-7182-b86a-7829fae91d40`
- Next Step: quality
- Handoff Artifact: `charness-artifacts/critique/2026-07-09-v0-19-0-cli-format-release-critique.md`

## Prevention

Keep strict JSON alias tests on every command whose registry advertises `[--json]`.
