# Debug Review
Date: 2026-05-17

## Problem

While refreshing CLI decision packet claim evidence, the command registry probe used `./bin/cautilus commands --json`.
The CLI exited 1 and printed top-level usage instead of returning JSON.

## Correct Behavior

Given the evidence slice needs to confirm command registry entries, when probing the Cautilus command registry, then the probe should use the actual supported command surface `./bin/cautilus doctor commands --json`.

## Observed Facts

`./bin/cautilus commands --json` exited 1 and printed usage.
The usage output lists `cautilus doctor commands [--json]`.
`./bin/cautilus doctor commands --json` exits 0 and emits a JSON object whose `commands` field is an array of command records with `path` arrays.
Filtering by path confirms the current surfaces `evaluate evidence prepare-input`, `evaluate evidence bundle`, `evaluate review variants`, `doctor artifacts render-self-dogfood-html`, and `doctor artifacts render-self-dogfood-experiments-html`.

## Reproduction

Run `./bin/cautilus commands --json`.
It exits 1 with usage text.
Run `./bin/cautilus doctor commands --json`.
It exits 0 and can be filtered with `jq '.commands[] | .path | join(" ")'`.

## Candidate Causes

- Operator command-memory drift from the older evidence bundle text that referenced a generic commands surface.
- CLI command registry intentionally lives under the `doctor` namespace.
- The JSON shape was misremembered as records with a `name` field instead of records with a `path` array.

## Hypothesis

If the evidence refresh uses `doctor commands --json` and filters `.commands[].path`, then command-registry proof can be collected without changing product code.

## Verification

`./bin/cautilus doctor commands --json` returned JSON.
The jq filter found all five target command paths needed for the stale CLI decision packet evidence refresh.

## Root Cause

This was an operator probe error, not a Cautilus runtime regression.
The actual command discovery surface is `doctor commands --json`, and the command registry records command paths as arrays.

## Detection Gap

- Evidence refresh command memory | no local shell alias or scripted helper prevented the wrong probe | use `doctor commands --json` directly in refreshed evidence bundles.
- Registry JSON shape | the ad hoc jq filter assumed `.name` | filter `.commands[].path`.
- Old evidence wording | prior bundle used a stale command probe string | replace with current command surface in the new bundle.

## Sibling Search

- Mental model: command discovery was remembered as a top-level command rather than a doctor subcommand.
- CLI guide examples: current docs already show `cautilus doctor commands --json`; decision: no doc change; proof: usage output and docs search.
- Evidence bundle refresh: old bundle may keep historical command strings; decision: create a new current bundle instead of mutating historical evidence; proof: new command probe passes.
- Claim status projection: no product state changed from the failed probe; decision: continue impl after recording debug; proof: worktree only has intended evidence-refresh edits.

## Seam Risk

- Interrupt ID: cli-command-registry-probe-path
- Risk Class: none
- Seam: local evidence refresh command invocation
- Disproving Observation: `./bin/cautilus commands --json` exits 1 while `./bin/cautilus doctor commands --json` exits 0.
- What Local Reasoning Cannot Prove: none; this is a local command surface lookup.
- Generalization Pressure: low

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Future claim evidence bundles should use the checked command path from current `doctor commands --json` output and describe command records by `path`, not by an invented `name` field.
