# Debug Review
Date: 2026-05-07

## Problem

While preparing the Claim Discovery rewrite, a local probe used `./bin/cautilus commands --json | jq -r '.commands[]?.name // empty' | rg '^eval$|^claim$|^doctor$'` and exited 1.

## Correct Behavior

Given `cautilus commands --json` is healthy, when a probe inspects command names, then it should use the actual JSON shape and not report a product failure from an invalid jq path.

## Observed Facts

- `./bin/cautilus commands --json | jq 'keys, .[0:2]?'` exited 0.
- The payload keys are `commands`, `examples`, `groups`, `schemaVersion`, and `usage`.
- The earlier jq expression assumed `.commands` was an array of objects with `.name`, which did not match the current payload shape.

## Reproduction

Run:

```bash
./bin/cautilus commands --json | jq -r '.commands[]?.name // empty' | rg '^eval$|^claim$|^doctor$'
```

The command exits 1 because the projection emits no matching names.

## Candidate Causes

- The Cautilus command catalog failed to include `claim`, `eval`, or `doctor`.
- The JSON schema changed from an array of command objects to a grouped/object shape.
- The probe was ad hoc and used the wrong jq path.

## Hypothesis

The product command catalog is present, but the probe used the wrong jq path.

## Verification

`./bin/cautilus commands --json | jq 'keys, .[0:2]?'` showed a valid object with a `commands` key and exited 0.
This falsifies a binary failure and confirms the issue is the ad hoc probe.

## Root Cause

The probe assumed an obsolete or imagined `.commands[]?.name` shape instead of inspecting the current schema first.

## Seam Risk

- Interrupt ID: commands-json-probe-shape
- Risk Class: none
- Seam: CLI JSON inspection
- Disproving Observation: the catalog command returned valid JSON with command-surface keys.
- What Local Reasoning Cannot Prove: nothing further for this slice.
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When probing command catalog fields during implementation, inspect `schemaVersion` and keys before writing narrow jq filters.
