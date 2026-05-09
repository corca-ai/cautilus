# Claim Evidence State Projection Debug
Date: 2026-05-10

## Problem

`npm run lint:specs` failed after adding the generated claim Evidence State projection and refreshing `.cautilus/claims/status-summary.json`.

## Correct Behavior

Given the claim status packet is regenerated from the selected claims packet, when specdown runs, then specs should assert durable behavior and current categories without hard-coding stale status bucket omissions.

## Observed Facts

- `npm run lint:specs` printed `spec checks passed (43 specs)` and then `specdown: spec run failed`.
- A non-quiet `specdown run -no-report` showed failures in `docs/specs/user/claim-discovery.spec.md`.
- The expected shell output omitted `agent-add-deterministic-proof:agent`.
- The checked JSON-path rows expected `agent-plan-cautilus-eval` at `actionSummary.primaryBuckets[1].id` and `human-align-surfaces` at `actionSummary.primaryBuckets[3].id`.
- The refreshed status packet now contains `agent-add-deterministic-proof` at index 1, shifting later bucket indexes.

## Reproduction

Run:

```bash
npm run lint:specs
```

For the detailed failure output, run:

```bash
specdown run -no-report
```

## Candidate Causes

- The new Evidence State projection script generated malformed Markdown or JSON.
- The refreshed status packet changed current action bucket contents while an existing spec had copied the older bucket sequence.
- The `check:cautilus-json-file` rows asserted brittle positional indexes instead of the presence of durable bucket ids.

## Hypothesis

If `docs/specs/user/claim-discovery.spec.md` is updated to include the current `agent-add-deterministic-proof` bucket and its shifted positions, then specdown will pass with the refreshed status packet.

## Verification

- Updated `docs/specs/user/claim-discovery.spec.md` to include `agent-add-deterministic-proof`.
- Re-ran `npm run lint:specs`.
- The command passed.

## Root Cause

The claim status packet was stale before this slice.
Refreshing it exposed a real action bucket that the spec had previously omitted.
The failure is another instance of copied projection state drifting from the generated claim status source.

## Seam Risk

- Interrupt ID: claim-status-bucket-spec-drift
- Risk Class: none
- Seam: generated claim status packet to executable user spec
- Disproving Observation: `npm run lint:specs` passes after the spec expects the refreshed bucket.
- What Local Reasoning Cannot Prove: whether every sibling Markdown projection over `.cautilus/claims/status-summary.json` is currently guarded by drift checks.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Add generated-projection check scripts when a Markdown report is treated as current evidence state.
Avoid copying exact generated bucket lists into specs unless the spec owns that ordered contract.
Evidence State projection and claim status report now have check scripts in `npm run verify`; other review worksheets remain bounded human worksheets unless promoted to verified generated projections.
