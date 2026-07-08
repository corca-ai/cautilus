# Quality Review
Date: 2026-07-09

## Scope

Target boundary: repo-wide quality and test-speed economics for Cautilus as an installable CLI plus Cautilus Agent surface.
This slice acted on the three recommended next moves from the previous quality pass: per-spec `specdown` profiling, current-tree versus history secret scan separation, and coverage output isolation for concurrent broad gates.

## Current Gates

- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/profile-specdown.test.mjs scripts/coverage-dir.test.mjs scripts/run-gitleaks-tracked.test.mjs scripts/release/check-release-publisher-policy.test.mjs scripts/release/distribution-surface.test.mjs`
- `npm run --silent specdown:profile -- --top 10`
- `npm run --silent security:secrets`
- `npm run --silent security:secrets:history`
- `COVERAGE_DIR=/tmp/cautilus-coverage-isolated npm run --silent test:coverage && COVERAGE_DIR=/tmp/cautilus-coverage-isolated npm run --silent coverage:floor:check`
- `npm run --silent release:publisher-policy:check`
- `npm run --silent lint:eslint`
- `npm run --silent lint:specs`
- `npm run --silent test:node`
- `npm run verify`
- `npm run verify:runtime`
- `npm run hooks:check`

## Runtime Signals

- prior runtime source: structured metrics from `.charness/quality/runtime-signals.json` rendered by `render_runtime_summary.py`; profile `local-verify`.
- prior hot spot: `lint · specs` 15.9s latest / 16.0s median, budget 35.0s; its `specdown` subphase dominates the phase.
- new profiling signal: `npm run --silent specdown:profile -- --top 10` ran 39 focused `specdown` entries in 111.50s.
- slowest focused specs in that run: `docs/specs/index.spec.md` 13.26s; `docs/specs/promises/reviewable-artifacts.spec.md` 5.82s; `docs/specs/promises/claim-discovery.spec.md` 5.24s; `docs/specs/promises/doctor-readiness.spec.md` 4.17s; `docs/specs/promises/a-testable-agent.spec.md` 3.44s.
- secret-scan signal: standing `security:secrets` now scans 1746 tracked files in about 0.9s locally; `security:secrets:history` scanned 1459 commits and passed as an explicit heavier proof.
- coverage-isolation signal: `COVERAGE_DIR=/tmp/cautilus-coverage-isolated` produced isolated `go.json`, `node.json`, and `coverage.json`, then passed the coverage floor.
- broad gate status: `npm run verify` passed in 43.44s, and serial `npm run verify:runtime` passed in 32.26s.

## Healthy

- `scripts/profile-specdown.mjs` gives maintainers an advisory per-spec timing view without reducing `lint:specs` proof depth.
- The profiler defaults to all active specs under `docs/specs`, excludes `old` and `archive`, validates explicit targets with `checkSpecs`, supports `--json`, `--top`, and `--limit`, and cleans temporary specdown configs.
- `security:secrets` now means tracked current tree, so standing verify avoids ignored/generated checkout artifacts while still preserving gitleaks allowlist semantics.
- `security:secrets:history` keeps the full git-history proof available and is now part of the release requested-review command set.
- Release docs and release publisher policy now require the full history scan before release branch/tag push.
- Coverage-producing commands honor `COVERAGE_DIR`, allowing broad gates to run in isolated output directories when needed.
- Focused tests cover profiler argument handling and CLI JSON, coverage output isolation, coverage-floor branch behavior, tracked gitleaks wrapper cwd/args/file selection, and release policy wiring.

## Weak

- `specdown:profile` is intentionally advisory and slower than a normal `lint:specs` run because it invokes specdown once per selected spec.
- The current profiler reports per-spec entry cost, not per-block cost inside a slow spec.
- Standing `security:secrets` no longer scans untracked working files; this is a deliberate current-tree definition, not a substitute for release or incident-response history proof.
- Full-history gitleaks remains heavier and depends on a clone with enough history to scan.
- Coverage output isolation depends on callers setting `COVERAGE_DIR`; the default remains `coverage/` for normal serial maintainer and CI operation.

## Missing

- No per-block timing exists inside the slowest specdown entries.
- No CI matrix currently proves two coverage-producing broad gates running concurrently with distinct `COVERAGE_DIR` values.
- The gitleaks allowlist still has no dedicated static allowlist-shape test for markdown claim status report packet metadata.

## Deferred

- Changing `specdown run` proof scope is deferred until the new per-spec profile identifies a specific duplicated or low-signal executable block.
- Adding per-block specdown instrumentation is deferred because the per-spec profile already identifies the next inspection targets.
- Moving full-history secret scan back into every standing `verify` run is deferred; release proof now carries the heavier history scan.
- Defaulting every coverage-producing script to a unique temp directory is deferred because stable `coverage/` remains useful for local inspection and current CI runs gates serially.

## Advisory

- implementation result: `package.json` now exposes `specdown:profile`, `security:secrets:history`, and `COVERAGE_DIR`-aware coverage commands.
- implementation result: `scripts/run-gitleaks-tracked.mjs` scans a temp copy of `git ls-files` output from cwd `.` so tracked current-tree scanning keeps relative `.gitleaks.toml` allowlists working.
- implementation result: `.gitleaks.toml` narrowly allows `.cautilus/claims/claim-status-report.md` packet source commit metadata.
- implementation result: `.agents/release-adapter.yaml`, `docs/maintainers/releasing.md`, and release publisher policy checks require `npm run security:secrets:history` for release.
- debug result: `charness-artifacts/debug/latest.md` records the ESLint complexity failure, gitleaks current-tree false positives, allowlist path mismatch, claim-status metadata allowlist, and coverage-floor test-depth gap.
- operator result: use `COVERAGE_DIR=/tmp/<unique-dir>` when intentionally running coverage-producing broad gates concurrently.

## Delegated Review

- Delegated Review: executed by explorer subagent `Averroes`; status `completed`; scope `read-only review of per-spec profiling, secret-scan split, and coverage-dir isolation diff`.
- Reviewer finding: release path did not require the new full-history secret proof because `verify` now carries only the tracked current-tree scan.
- Disposition: fixed by adding `npm run security:secrets:history` to `.agents/release-adapter.yaml` requested-review commands, maintainer release docs, and release publisher policy tests.
- Reviewer finding: gitleaks wrapper core behavior lacked direct tests.
- Disposition: fixed with `scripts/run-gitleaks-tracked.test.mjs`, using fake `git` and `gitleaks` binaries to pin tracked-file selection, cwd-relative `gitleaks dir .` execution, arg forwarding, symlink preservation, and temp cleanup.

## Commands Run

- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/profile-specdown.test.mjs scripts/coverage-dir.test.mjs`
- `npm run --silent lint:eslint`
- `npm run --silent specdown:profile -- --limit 3 --top 3`
- `npm run --silent specdown:profile -- --limit 5 --top 5`
- `npm run --silent specdown:profile -- --top 10`
- `npm run --silent security:secrets`
- `npm run --silent security:secrets:history`
- `COVERAGE_DIR=/tmp/cautilus-coverage-isolated npm run --silent test:coverage`
- `COVERAGE_DIR=/tmp/cautilus-coverage-isolated npm run --silent coverage:floor:check`
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/profile-specdown.test.mjs scripts/coverage-dir.test.mjs scripts/run-gitleaks-tracked.test.mjs scripts/release/check-release-publisher-policy.test.mjs scripts/release/distribution-surface.test.mjs`
- `npm run --silent release:publisher-policy:check`
- `npm run --silent lint:eslint`
- `npm run --silent lint:specs`
- `npm run --silent test:node`
- `git diff --check`
- `npm run verify`
- `npm run verify:runtime`
- `npm run hooks:check`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/scripts/validate_debug_artifact.py --repo-root .`
- delegated read-only review by subagent `Averroes`

## Recommended Next Quality Moves

- active inspect slowest specdown entries — capability_needed=specdown runtime economics; next_center=`docs/specs/index.spec.md`, `docs/specs/promises/reviewable-artifacts.spec.md`, and `docs/specs/promises/claim-discovery.spec.md`; transformation=identify duplicated setup, overly broad examples, or candidates for shared fixture proof; proof_boundary=full `lint:specs` remains unchanged; enforcement_posture=advisory.
- active add static gitleaks allowlist-shape coverage — capability_needed=security policy guardrail; next_center=`.gitleaks.toml` and packet metadata examples; transformation=pin path+line scoped allowlists so future packet metadata additions do not silently widen secret exemptions; proof_boundary=current tracked scan plus history scan; enforcement_posture=standing test candidate.
- passive consider concurrent coverage smoke — capability_needed=operator runtime reliability; next_center=coverage scripts and `run-verify` profiles; transformation=prove two distinct `COVERAGE_DIR` runs cannot contaminate each other; proof_boundary=focused smoke rather than full duplicate broad gates; enforcement_posture=advisory.

## History

- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
