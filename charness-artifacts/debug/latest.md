# Debug Review
Date: 2026-07-09

## Problem

The quality slice hit three gate failures while adding per-spec profiling, current-tree secret scanning, and isolated coverage output.
`npm run --silent lint:eslint` failed on `scripts/profile-specdown.mjs`, the first current-tree secret scan failed with gitleaks findings, and an isolated coverage-floor check failed after the first coverage-dir implementation.

## Correct Behavior

Given the repo adds advisory runtime tooling and splits secret scanning, helper code should stay within ESLint complexity limits, the standing secret scan should check commit-relevant current content without tripping known packet metadata false positives, and coverage output isolation should still satisfy the existing coverage floor.

## Observed Facts

- ESLint reported `profile-specdown.mjs` had an unused `dirname` import and `parseArgs` cognitive complexity 13 over the limit 12.
- `gitleaks dir .` scanned ignored generated artifact trees and reported 40 `sourcegraph-access-token` findings, all on packet commit metadata.
- A tracked-file temp-tree wrapper reduced the surface, but `gitleaks dir <absolute-temp-path>` still reported 15 findings because `.gitleaks.toml` path allowlists are relative.
- Running `gitleaks` with cwd set to the temp tree and target `.` left one finding: `.cautilus/claims/claim-status-report.md` line `Packet source commit: <40-hex>`.
- `npm run --silent security:secrets:history` passed with the existing full-history scan.
- `COVERAGE_DIR=/tmp/cautilus-coverage-isolated npm run --silent coverage:floor:check` failed because the modified `scripts/check-coverage-floor.mjs` was newly unfloored at 58.82% statement coverage.

## Reproduction

- Run `npm run --silent lint:eslint` after the first `profile-specdown` implementation.
- Run `gitleaks dir . --no-banner --redact` after changing the standing scan from history to current tree.
- Run the tracked temp-tree wrapper with an absolute target path to reproduce allowlist path mismatch.
- Run `COVERAGE_DIR=/tmp/cautilus-coverage-isolated npm run --silent test:coverage` followed by `COVERAGE_DIR=/tmp/cautilus-coverage-isolated npm run --silent coverage:floor:check` after adding only the happy-path coverage-dir test.

## Candidate Causes

- The profiler argument parser combined option dispatch, pending-value handling, target collection, and error handling in one function.
- Current-tree scanning should scan tracked files only, not ignored artifact output.
- Copying tracked files to a temp tree broke `.gitleaks.toml` relative path allowlists because the wrapper passed an absolute target path.
- The claim status markdown report had a legitimate packet source commit line shape not covered by the existing JSON/debug-record allowlists.
- The first `coverage-dir` test only proved `check-coverage-floor.mjs` could read `COVERAGE_DIR`; it did not exercise warn-band, unfloored-fail, declared-floor-regression, or promotion-candidate paths.

## Hypothesis

- Falsifiable claim: if option dispatch is split from `parseArgs`, ESLint will pass without changing profiler behavior.
- disconfirmer: `npm run --silent lint:eslint` still reports `scripts/profile-specdown.mjs` after the parser split.
- Falsifiable claim: if the gitleaks wrapper runs from the temp tree with target `.`, existing relative allowlists will apply.
- disconfirmer: `npm run --silent security:secrets` still reports findings already covered by existing path-scoped allowlists.
- Falsifiable claim: if `.gitleaks.toml` narrowly allows the claim-status markdown `Packet source commit` line, both current tracked and history scans will pass without disabling the default rule.
- disconfirmer: `npm run --silent security:secrets` or `npm run --silent security:secrets:history` still reports `.cautilus/claims/claim-status-report.md` packet source commit metadata after the narrow allowlist.
- Falsifiable claim: if `coverage-dir` tests exercise the main floor-check branches, the modified `check-coverage-floor.mjs` will clear the repo coverage floor.
- disconfirmer: isolated `test:coverage` followed by isolated `coverage:floor:check` still fails on `scripts/check-coverage-floor.mjs`.

## Verification

- Confirmed.
- `npm run --silent lint:eslint` passed after helper extraction and removing the unused import.
- `npm run --silent security:secrets` passed after the tracked-file wrapper, cwd fix, and narrow claim-status allowlist.
- `npm run --silent security:secrets:history` passed after the allowlist change.
- `COVERAGE_DIR=/tmp/cautilus-coverage-isolated npm run --silent test:coverage && COVERAGE_DIR=/tmp/cautilus-coverage-isolated npm run --silent coverage:floor:check` passed after expanding `scripts/coverage-dir.test.mjs`.

## Root Cause

The profiler failure was the recurring helper-heavy JavaScript pattern: behavior tests passed, but option parsing accumulated enough control flow to cross the lint threshold.
The secret-scan failure came from treating "current tree" as the entire checkout directory rather than the tracked commit-relevant file set, then from running gitleaks against an absolute temp path that made existing relative allowlists ineffective.
The remaining finding was a legitimate packet metadata false positive in a markdown status report with no existing allowlist line shape.
The coverage-floor failure was a test-depth miss: the new environment-variable support touched a branch-heavy CLI script, but the first test only covered the successful no-warning path.

## Invariant Proof

- Invariant: advisory operator scripts keep option dispatch helper-oriented and below the repo's lint complexity budget.
- Producer Proof: ESLint now passes on `scripts/profile-specdown.mjs`.
- Final-Consumer Proof: profiler tests cover option parsing, selected targets, archived-spec exclusion, text output, and JSON output.
- Interface-Shape Sibling Scan: `scripts/run-gitleaks-tracked.mjs` preserves the standing `security:secrets` command while `security:secrets:history` keeps full-history proof available.
- Release Proof: `.agents/release-adapter.yaml`, `docs/maintainers/releasing.md`, and `scripts/release/check-release-publisher-policy.mjs` now require full-history secret proof before release branch/tag push.
- Coverage Proof: isolated `test:coverage` plus `coverage:floor:check` passed under `COVERAGE_DIR=/tmp/cautilus-coverage-isolated`.
- Non-Claims: this does not claim current-tree scanning replaces full-history proof for release or incident response.

## Detection Gap

- surface: profiler option parsing | what did not fire: behavior tests do not enforce complexity | smallest change to fire it: existing `lint:eslint` already fires.
- surface: current-tree secret scan | what did not fire: first command choice scanned ignored checkout output and broke relative allowlists | smallest change to fire it: run `npm run security:secrets` before treating `gitleaks dir` as equivalent to history scan.
- surface: packet metadata allowlist coverage | what did not fire: no static coverage test for markdown packet source commit lines | smallest change to fire it: future allowlist-coverage test should include `.cautilus/claims/claim-status-report.md`.
- surface: coverage floor CLI | what did not fire: happy-path-only environment-variable test | smallest change to fire it: include warn, unfloored fail, declared floor fail, and promotion-candidate fixtures.

## Sibling Search

- Mental model: "current tree" means repository directory.
- scope axis: ignored artifact trees | decision: exclude from standing current scan by scanning tracked files only | proof: tracked wrapper reports 1746 copied files and passes.
- path axis: temp-tree target path | decision: run gitleaks from temp cwd against `.` | proof: existing JSON allowlists apply again.
- allowlist axis: claim-status markdown packet source commit | decision: add one path+line scoped allowlist | proof: current and history scans pass.
- release axis: current-tree scan in `verify` | decision: keep full history scan in release requested-review commands | proof: release publisher policy check now requires it.
- cross-file: `.gitleaks.toml`, `scripts/run-gitleaks-tracked.mjs`, `package.json`, `.agents/release-adapter.yaml`, and `docs/maintainers/releasing.md` jointly own the secret-scan contract.

## Seam Risk

- Interrupt ID: current-tree-gitleaks-wrapper-2026-07-09
- Risk Class: none
- Seam: gitleaks path matching versus temp-tree current-scan wrapper
- Disproving Observation: current tracked scan and history scan both pass after the cwd and allowlist fix.
- What Local Reasoning Cannot Prove: n/a
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When converting a history-aware security scanner to a current-tree mode, define the scanned file set explicitly.
For gitleaks, preserve relative path allowlist semantics by running from the scan root instead of passing an absolute source path.
Keep packet commit metadata allowlists path+line scoped, and extend the future allowlist-coverage test to markdown claim status reports.
When touching branch-heavy CLI quality gates, add focused fixtures for both success and failure paths before relying on broad coverage to catch the gap.
