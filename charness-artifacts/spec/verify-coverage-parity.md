# Verify Coverage Parity Spec
Date: 2026-05-09

## Current Slice

`npm run verify` is the maintainer-facing required local gate for release and stop-before-closeout work.
GitHub Actions `verify` may install CI-only tools, but required repo quality gates should be owned by `npm run verify` unless they are explicitly documented as CI-only.

## Decision

Coverage generation and coverage floor checking belong inside `npm run verify`.
The GitHub Actions `verify` workflow should call `npm run verify` after setup, not append additional required quality gates that the local command and pre-push hook do not run.

## Success Criteria

- `scripts/run-verify.mjs` includes `test:coverage` and `coverage:floor:check`.
- `.github/workflows/verify.yml` does not run separate post-verify coverage gates.
- `scripts/coverage-floor.json` matches the current generated coverage packet.
- Local `npm run verify` catches coverage floor failure before push.

## Deferred Decisions

- A future workflow parity checker can assert that required GitHub Actions gates are represented in `scripts/run-verify.mjs`.
- Coverage floor increases should happen as intentional test-quality work, not during release incident recovery.
