# Debug Review: Node --experimental-test-coverage non-determinism
Date: 2026-04-24

## Problem

`npm run test:coverage` produces different per-file `percent_covered` values across consecutive runs on the same commit, with no code or test changes. CI's `coverage:floor:check` consequently fails intermittently on the regenerated floor even when nothing has changed since the floor was written.

## Correct Behavior

Given no code, test, configuration, or environment change,
when `npm run test:coverage` is invoked repeatedly,
then per-file `percent_covered` in `coverage/coverage.json` should be stable (delta < 0.01 pp) across runs.

## Observed Facts

- Node version: v22.22.2. Coverage command: `node --test --experimental-test-coverage --test-coverage-exclude='**/*.test.mjs' --test-reporter=lcov --test-reporter-destination=coverage/node.lcov ...`.
- Three consecutive parallel runs (default `--test-concurrency`) on the same commit showed drift in three files:
  - `scripts/agent-runtime/build-optimize-input.mjs`: 85.56 / 86.97 / 86.97 (spread 1.41 pp)
  - `scripts/agent-runtime/build-evidence-input.mjs`: 85.12 / 85.12 / 86.51 (spread 1.39 pp)
  - `scripts/agent-runtime/behavior-intent.mjs`: 93.29 / 93.96 / 93.96 (spread 0.67 pp)
- Four consecutive serial runs (`--test-concurrency=1`) still drifted: `build-optimize-input.mjs` 85.56/85.56/86.97/86.97, `behavior-intent.mjs` 93.29/93.96/93.96/93.96.
- Drift is deterministic between two discrete states per file, not random noise.
- Go coverage (`go test -coverprofile`) did not drift across the same experiment.
- CI failure message: `FAIL: floored files regressed below declared floor: scripts/agent-runtime/build-evidence-input.mjs stmts=289 cov=85.12% floor=86.51%`.
- Community reports cluster around Node test runner's V8→LCOV coverage pipeline: nodejs/node#51251 (Jest in Node 20.10.0 order-dependent flakiness, classified as Node bug), #57435 (inaccurate branch coverage for assignment patterns with `--experimental-test-coverage` + `NODE_V8_COVERAGE`), #46378 (`NODE_V8_COVERAGE` inconsistent with workers), and vitest-dev/vitest#9725 (Vitest v4 `@vitest/coverage-v8` producing NaN branch entries; workaround is Istanbul provider).
- Node official docs list test-runner coverage as experimental.

## Reproduction

```bash
for i in 1 2 3; do
  node --test --experimental-test-coverage \
    --test-coverage-exclude='**/*.test.mjs' \
    --test-reporter=lcov --test-reporter-destination=/tmp/cov-$i.lcov \
    bin/*.test.mjs scripts/*.test.mjs \
    scripts/agent-runtime/*.test.mjs scripts/release/*.test.mjs
done
# Parse each lcov, compute per-file pct, compare.
# build-optimize-input.mjs, build-evidence-input.mjs, behavior-intent.mjs drift.
```

## Candidate Causes

- (a) V8 raw coverage → LCOV conversion layer in Node's test runner has known non-determinism when aggregating counts across test files (community consensus; see sources above).
- (b) ESM module-load ordering: shared modules imported indirectly by multiple test files may record different branch paths depending on which test file imports them first, even at `--test-concurrency=1` if the glob order varies.
- (c) Hidden external state read at top-level of the suspect modules (e.g. `Date.now()`, `process.env`, filesystem state) causing different branches to run on different invocations.
- (d) Coverage flush race at process exit: if any worker/child process terminates before V8 writes its coverage buffer, merged counts can miss lines.
- (e) Node `--experimental-test-coverage` itself being pre-GA and known-unstable; Istanbul-based tools (c8, nyc) have a more mature aggregation path.

## Hypothesis

Replacing Node's built-in `--experimental-test-coverage` with `c8` (the standard Istanbul-remap wrapper over V8 coverage) will produce stable per-file `percent_covered` values across consecutive runs on the same commit, because c8 owns the aggregation/remap path that Node builtin ships as experimental.

Falsifier: if c8 also drifts on the same three files across three consecutive runs, the root cause lives in the modules themselves (cause b or c), not in Node's aggregation layer, and this fix will not help.

## Verification

- Installed `c8` 11.0.0 as a dev dependency.
- Ran `npx c8 --reporter=lcov --reports-dir=/tmp/c8-N node --test ...` four consecutive times on the same commit.
- Result: per-file drift count = 0/66 files. The three files that previously drifted (`build-optimize-input.mjs`, `build-evidence-input.mjs`, `behavior-intent.mjs`) were stable across all four c8 runs.
- After wiring c8 into `npm run test:node:coverage`, re-ran `npm run test:coverage` three times and confirmed per-file drift count = 0 on the aggregated `coverage/coverage.json`.

## Root Cause

Node's `--experimental-test-coverage` ships with a non-deterministic V8→LCOV aggregation layer for a subset of source shapes. The community has reported the same class of issue on this pipeline (Jest under Node 20.10.0 #51251, Vitest `ast-v8-to-istanbul` branch remap producing NaN #9725, NYC #537 from 2017) and the feature is explicitly labeled experimental in Node 22/25 docs. Switching the coverage driver to c8 — which owns its own V8→Istanbul remap path and is the mature tool Node itself recommends for coverage outside the test runner — makes the measurement reproducible without changing any test or source.

Contributing factor: our coverage-floor gate was promoted to CI enforcement on top of an experimental measurement layer without first checking repeatability, which turned measurement noise into a release blocker.

## Seam Risk

- Interrupt ID: debug-2026-04-24-node-coverage-nondeterminism
- Risk Class: external_dependency
- Seam: `node --test --experimental-test-coverage` → LCOV reporter → `summarize-node-coverage.mjs`
- Disproving Observation: same commit + same environment + same command yields different per-file `percent_covered` across runs.
- What Local Reasoning Cannot Prove: internal determinism of Node's V8 coverage aggregation; local source inspection of the scored modules shows no obvious non-determinism source, yet the numbers still move.
- Generalization Pressure: any Node experimental feature wired into a standing gate inherits the feature's pre-GA stability. Do not promote experimental flags to hard CI gates without first proving repeatability.

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: this debug artifact

## Prevention

- Do not rely on `--experimental-test-coverage` for gating. Use a mature Istanbul-remap tool (c8) that owns the V8 aggregation path.
- When introducing a new measurement-based gate, run N ≥ 3 repeat measurements on the same commit as an "is this even deterministic" sanity check before writing the floor.
- Document the measurement-determinism expectation in the gate's own script so future readers see why the tool choice matters.

## Related Prior Incidents

None — no prior `charness-artifacts/debug/*.md` on coverage measurement.
