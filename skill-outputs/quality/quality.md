# Quality Review

Date: 2026-04-10

## Scope

Reduce duplicated end-of-work execution and make `docs/specs` the real
source-of-truth for source-level guards instead of a parallel hard-coded list.

## Commands Run

- `npm run verify`
- `/usr/bin/time -p npm run verify`

## Runtime Signals

- `npm run lint:specs` now validates linked spec docs directly and passed with
  `3 specs, 250 guard rows`.
- `npm run verify` passed after the spec runner change and test addition.
- Measured wall-clock for `npm run verify`: `real 7.72`.

## Healthy

- Final local gate now has one canonical command: `npm run verify`.
- `AGENTS.md`, `README.md`, `docs/handoff.md`, and
  `.agents/quality-adapter.yaml` now agree on that final gate.
- `scripts/check-specs.mjs` now reads `docs/specs/*.spec.md` directly, validates
  index coverage, checks relative links, and enforces `check:source_guard`
  tables instead of maintaining a duplicate file list in code.
- A repo-owned executable test now covers the spec runner, including the
  failure mode where an active spec is missing from the index.
- `docs/specs/index.spec.md` is back to being an index plus guardrail note,
  not a second copy of the source inventory.

## Weak

- `current-product.spec.md` still carries a broad `source_guard` table. It is
  now executable, but some rows are still closer to inventory than acceptance
  boundary.

## Missing

- No lightweight way exists yet to classify or budget slow boundary tests by
  seam; timing still relies on ad-hoc measurement.

## Recommended Next Gates

- `AUTO_EXISTING`: keep `npm run verify` as the only stop-before-finish gate.
- `AUTO_CANDIDATE`: trim `current-product.spec.md` guard rows further so specs
  stay boundary-focused and cheaper to maintain.
- `AUTO_CANDIDATE`: add a small timing reporter or threshold check for the
  heaviest CLI-bound test files if test latency becomes a recurring issue.
