# Codex Cache Read Telemetry Collapse Debug
Date: 2026-05-16

## Problem

Subagent critique found that the cache telemetry fix still collapsed Codex `cache_read_input_tokens` into `cached_input_tokens`.

## Correct Behavior

Given a runtime emits explicit `cache_read_input_tokens`, when Cautilus normalizes Codex skill-test telemetry, then the normalized packet should preserve `cache_read_input_tokens` under that exact field name instead of renaming it to `cached_input_tokens`.

## Observed Facts

- The fresh-eye diagnostic reviewer reported `scripts/agent-runtime/skill-test-telemetry.mjs` read both `cached_input_tokens` and `cache_read_input_tokens`.
- The same function used `Math.max(...)` and emitted only `cached_input_tokens`.
- `scripts/agent-runtime/telemetry-fields.mjs` declares both `cache_read_input_tokens` and `cached_input_tokens` as first-class numeric telemetry fields.
- `docs/internal/research/token-efficiency.md` also had a stale lower section that still described the older telemetry field set and said Codex `cost_usd` remained absent.
- Counterweight triage classified the field collapse and stale research doc as `Act Before Ship`.

## Reproduction

Before the repair, a Codex JSON event with only `cache_read_input_tokens` in `total_token_usage` normalized to telemetry with `cached_input_tokens` and no `cache_read_input_tokens`.

## Candidate Causes

- Codex totals used a single internal `cached` value for both pricing and output telemetry.
- The initial fix treated `cache_read_input_tokens` as a provider synonym for `cached_input_tokens` instead of preserving the emitted field.
- Tests covered `cached_input_tokens` and Claude `cache_read_input_tokens`, but not the Codex-only `cache_read_input_tokens` path.

## Hypothesis

If Codex totals retain `cachedInput` and `cacheReadInput` separately while keeping an internal aggregate only for pricing, then normalized telemetry can preserve the emitted field name and existing cost math can remain stable.

## Verification

- Passed after repair: `node --test scripts/agent-runtime/run-local-skill-test.test.mjs`.
- Passed after repair: `go test ./internal/app ./internal/runtime`.
- The first full `npm run verify` after repair stopped at stale claim evidence state because the slice touched claim-source contract docs.
- Passed after repair: `npm run claims:refresh:all`.
- Passed after repair: `npm run verify`.
- Passed after repair: `npm run hooks:check`.

## Root Cause

The prior implementation conflated two concepts: provider-emitted telemetry shape and internal pricing input.
`cached_input_tokens` and `cache_read_input_tokens` can both contribute to cache-cost math, but they are not interchangeable as machine-readable evidence because downstream reports promise to preserve explicit telemetry rather than infer or rename it.

## Detection Gap

- Codex telemetry tests | covered `cached_input_tokens` but not Codex-emitted `cache_read_input_tokens` | add a Codex regression with `cache_read_input_tokens` and no `cached_input_tokens`.
- Go CLI smoke tests | covered aggregate token fields but not the new cache-token fields | assert cache-token aggregation in the review variants smoke path.
- Research doc review | updated the top token-efficiency section but not the lower telemetry-surface section | search the touched doc for stale duplicate field inventories.

## Sibling Search

- Mental model: cache token fields are pricing-equivalent but evidence-distinct.
- Codex extraction axis: `skill-test-telemetry.mjs` needed separate retained fields plus an internal pricing aggregate.
- Go projection axis: review variant aggregation needed one focused cache-token assertion.
- Documentation axis: `docs/internal/research/token-efficiency.md` had a second stale telemetry inventory.

## Seam Risk

- Interrupt ID: codex-cache-read-telemetry-collapse
- Risk Class: none
- Seam: runtime telemetry normalization
- Disproving Observation: subagent critique found the field-name loss before the follow-up fix was shipped.
- What Local Reasoning Cannot Prove: whether future providers will introduce additional cache field names that should be preserved separately.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

When a field is declared first-class telemetry, add at least one regression where the runtime emits that exact field without its closest synonym.
Keep pricing aggregates internal unless they are also explicitly emitted telemetry fields.

## Related Prior Incidents

- `debug-2026-05-16-deployment-evidence-cache-telemetry-complexity.md`: the previous cache telemetry slice also needed field-list centralization and projection-specific tests.
