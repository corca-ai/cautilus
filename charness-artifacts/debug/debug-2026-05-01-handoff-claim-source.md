# Handoff Claim Source Debug
Date: 2026-05-01

## Problem

Editing `docs/internal/handoff.md` made saved claim packets appear stale because handoff was included in claim discovery source inventory.

## Correct Behavior

Given `docs/internal/handoff.md` is next-session volatile state, when claim discovery scans repo truth surfaces, then handoff should be excluded from source inventory and should not affect claim freshness.

## Observed Facts

- `AGENTS.md` links `docs/internal/handoff.md` as repo memory.
- `.agents/cautilus-adapter.yaml` classified `docs/internal/**` as developer-facing.
- Claim discovery follows repo-local Markdown links by default.
- A handoff edit changed claim-source freshness even though handoff is not a product or developer contract surface.

## Reproduction

1. Edit `docs/internal/handoff.md`.
2. Run claim status or eval planning against a saved packet whose source inventory includes the handoff.
3. Observe stale-source behavior even though only volatile handoff state changed.

## Candidate Causes

- The adapter did not exclude volatile handoff state from claim discovery.
- The linked-Markdown traversal treated repo-memory links the same as contract links.
- The audience hint for `docs/internal/**` was too broad for a directory that contains both durable internal patterns and volatile handoff.

## Hypothesis

If `.agents/cautilus-adapter.yaml` excludes `docs/internal/handoff.md`, then handoff edits will no longer enter new claim packets or affect future claim freshness.

## Verification

Regenerate claim packets and confirm `docs/internal/handoff.md` is absent from `sourceInventory`.

## Root Cause

Claim discovery had a repo-specific boundary error: it treated next-session handoff memory as a durable claim source.

## Seam Risk

- Interrupt ID: handoff-claim-source
- Risk Class: source-boundary
- Seam: repo memory docs to claim discovery truth surface
- Disproving Observation: a handoff-only edit affected claim packet freshness
- What Local Reasoning Cannot Prove: whether other consumer repos use different volatile memory paths that need adapter excludes
- Generalization Pressure: low; host adapters own repo-specific volatile paths

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep volatile session state paths out of `claim_discovery` source inventory through adapter-owned excludes.
