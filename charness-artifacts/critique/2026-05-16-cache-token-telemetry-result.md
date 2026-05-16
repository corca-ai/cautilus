# Cache Token Telemetry Critique
Date: 2026-05-16

## Execution

Subagent critique completed for commit `52b32ac6aed4573118d3ecca2b7c88749af340be`.

## Fresh-Eye Satisfaction

parent-delegated

## Packet Consumed

`charness-artifacts/critique/2026-05-16-cache-token-telemetry-packet.md`

## Target

`code-critique`

## Change

Preserve explicit cache-token breakdown fields across skill evaluation, scenario results, report packets, deployment evidence, Go runtime projections, docs, schemas, and review prompts.

## Angles

- Michael Jackson / problem framing
- Gerald Weinberg / diagnostic
- Atul Gawande / operational checklist
- Counterweight triage

## Findings

- Codex `cache_read_input_tokens` was collapsed into `cached_input_tokens`.
- The lower skill-test telemetry section in `docs/internal/research/token-efficiency.md` was stale.
- The contract needed a short note distinguishing split cache telemetry from provider aggregate cache telemetry.
- The Go review-variant aggregation path needed a focused cache-token assertion.

## Counterweight Triage

### Act Before Ship

- strong: preserve Codex-emitted `cache_read_input_tokens` under its emitted field name.
- strong: update stale `docs/internal/research/token-efficiency.md` telemetry inventory.

### Bundle Anyway

- moderate: add a contract note for provider-specific cache field shapes.
- moderate: add one focused Go assertion for cache-token aggregation.

### Over-Worry

- contested: do not expand review prompts to every output-side token field in this cache-breakdown slice.
- weak: do not update deployment examples solely to mirror functional cache tests.
- strong: do not deduplicate JS and Go telemetry field lists in this slice.

### Valid but Defer

- moderate: cost provenance projection belongs with the existing cost-attribution follow-up unless a current promise explicitly requires it here.
- moderate: strict scenario-results schema typing can be handled as a separate contract-hardening slice.

## Deliberately Not Doing

This slice does not implement live app evaluation telemetry, new cost-attribution dimensions, review-prompt output-token expansion, or JS/Go field-list deduplication.

## Next Move

Apply the two ship blockers and cheap bundled fixes, then rerun targeted tests, `npm run verify`, and `npm run hooks:check`.
