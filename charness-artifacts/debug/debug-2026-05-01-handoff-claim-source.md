# Handoff Claim Source Debug
Date: 2026-05-01

## Problem

Editing `docs/internal/handoff.md` made saved claim packets appear stale because handoff was included in claim discovery source inventory.
The same source-boundary mistake also let source-specific research notes under `docs/internal/research/` become Cautilus proof-plan claims.
A related orientation mistake made `agent status` point only at the raw discovery baseline, hiding reviewed and evidenced claim packets from the first status view.

## Correct Behavior

Given `docs/internal/handoff.md` is next-session volatile state, when claim discovery scans repo truth surfaces, then handoff should be excluded from source inventory and should not affect claim freshness.
Given `docs/internal/research/**` files are source-specific reference notes, they should not become Cautilus claims unless their portable conclusions are copied into a contract, spec, README, guide, or other truth surface.
Given reviewed and evidenced packets are maintained claim-state projections, `agent status` should summarize them as read-only related states while keeping `state_path` as the writable discovery baseline.

## Observed Facts

- `AGENTS.md` links `docs/internal/handoff.md` as repo memory.
- `.agents/cautilus-adapter.yaml` classified `docs/internal/**` as developer-facing.
- Claim discovery follows repo-local Markdown links by default.
- A handoff edit changed claim-source freshness even though handoff is not a product or developer contract surface.
- `docs/internal/research/craken-agent-runtime-verification.md` explicitly says it is a source-specific research note, not a Cautilus adapter scaffold.
- That research note produced multiple claim candidates, including `cautilus-eval` proof targets about the Craken runtime implementation.
- `.agents/cautilus-adapter.yaml` had only one `claim_discovery.state_path`, so `agent status` could summarize `.cautilus/claims/latest.json` while omitting reviewed and evidenced packets.
- The related-state test initially failed because the new fixture used stale enum values (`deterministic-ready`, `deterministic-test`, and `active`), confirming that checked test packets should exercise the actual validator vocabulary.

## Reproduction

1. Edit `docs/internal/handoff.md`.
2. Run claim status or eval planning against a saved packet whose source inventory includes the handoff.
3. Observe stale-source behavior even though only volatile handoff state changed.
4. Inspect `.cautilus/claims/latest.json` and observe claims sourced from `docs/internal/research/craken-agent-runtime-verification.md`.
5. Run `./bin/cautilus agent status --repo-root . --json` and observe that reviewed/evidenced state is not visible unless the operator already knows the derived packet paths.

## Candidate Causes

- The adapter did not exclude volatile handoff state from claim discovery.
- The adapter did not exclude source-specific internal research notes from claim discovery.
- The linked-Markdown traversal treated repo-memory links the same as contract links.
- The audience hint for `docs/internal/**` was too broad for a directory that contains both durable internal patterns and volatile handoff.
- The adapter schema had no read-only related-state list, forcing a single writable path to carry both discovery and reviewed/evidenced orientation meaning.

## Hypothesis

If `.agents/cautilus-adapter.yaml` excludes `docs/internal/handoff.md` and `docs/internal/research/**`, then handoff edits and source-specific research notes will no longer enter new claim packets or affect future claim freshness.
If the adapter declares read-only `related_state_paths`, then `agent status` can show reviewed and evidenced projections without turning them into discovery inputs or overwrite targets.

## Verification

Regenerate claim packets and confirm `docs/internal/handoff.md` and `docs/internal/research/**` are absent from `sourceInventory`.
Run `agent status` and confirm `.claimState.relatedStates[]` includes reviewed and evidenced packets with their own summaries.

## Root Cause

Claim discovery had a repo-specific boundary error: it treated next-session handoff memory and source-specific research notes as durable claim sources.
Claim orientation had a projection error: it exposed only the raw discovery baseline even though the repo also had reviewed/evidenced packets that operators should see before deciding whether more proof work is needed.

## Seam Risk

- Interrupt ID: handoff-claim-source
- Risk Class: source-boundary
- Seam: repo memory and research docs to claim discovery truth surface
- Disproving Observation: a handoff-only edit affected claim packet freshness, and Craken-specific implementation notes appeared as Cautilus claims
- What Local Reasoning Cannot Prove: whether other consumer repos use different volatile memory paths that need adapter excludes
- Generalization Pressure: low; host adapters own repo-specific volatile paths

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep volatile session state paths and source-specific research notes out of `claim_discovery` source inventory through adapter-owned excludes.
Keep writable claim discovery state separate from read-only reviewed/evidenced projections through adapter-owned `related_state_paths`.
When adding packet fixtures to tests, use current validator enums rather than invented readability aliases.
