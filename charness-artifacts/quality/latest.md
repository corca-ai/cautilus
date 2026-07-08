# Quality Review
Date: 2026-07-08

## Scope

Target boundary: test code quality and speed for local Node runner tests, especially real-boundary tests that were paying unnecessary Go, binary, and full-repo worktree costs.

Ambient repo findings: quality planner and skill ergonomics inventory were read as repo context, but Cautilus Agent skill ergonomics were not changed in this slice.

## Current Gates

- `node --test --test-reporter=spec bin/cautilus.test.mjs`
- `node --test --test-reporter=spec scripts/run-self-dogfood-eval.test.mjs scripts/run-self-dogfood-skill-refresh-flow-eval.test.mjs`
- `node --test --test-reporter=spec --test-reporter-destination=stdout bin/*.test.mjs scripts/*.test.mjs scripts/agent-runtime/*.test.mjs scripts/release/*.test.mjs`
- `npm exec -- eslint bin/cautilus.test.mjs scripts/run-self-dogfood-eval.mjs scripts/run-self-dogfood-skill-refresh-flow-eval.mjs scripts/run-self-dogfood-eval.test.mjs scripts/run-self-dogfood-skill-refresh-flow-eval.test.mjs scripts/test-support/*.mjs`

## Runtime Signals

- runtime source: command output captured this turn; adapter structured timing capture is missing.
- runtime hot spots: manual profile observations are listed below, but the adapter still lacks structured runtime samples for budgeted trend review.
- before edits, `bin/cautilus.test.mjs` took 9093ms, with `repo shim uses tmp-backed Go caches` taking 8396ms.
- runtime hot spots after edits: `bin/cautilus.test.mjs` took 705ms, with the cache test taking 13ms.
- dogfood eval runner tests after first minimization took 1288ms; after fake-binary boundary injection they took 561ms.
- broad Node spec suite after fresh-eye fixes and support-coverage tests took 1476ms and had no individual test at or above 500ms.
- coverage gate: `npm run test:coverage && npm run coverage:floor:check` passed; `scripts/agent-runtime/instruction-surface-support.mjs` recovered from 77.63% to 93.90% against its 80.77% floor.
- evaluator depth: deterministic local Node tests only; no live-provider proof was needed because fixture-backed runner behavior was under review.

## Healthy

- The repo shim cache test now proves the exported `GOCACHE`, `GOTMPDIR`, `TMPDIR`, and `go -C <repo> run ./cmd/cautilus` arguments directly instead of relying on a real Go compile as an indirect signal.
- The real `bin/cautilus --version` and consumer `init` smokes remain in `bin/cautilus.test.mjs`, so the shipped boundary still has thin real-process coverage.
- Dogfood eval runner tests now use a representative source git repo, reducing unrelated full-repo mirroring while proving disposable candidate workspace creation, included untracked file mirroring, deleted file removal, and host-local artifact exclusion.
- The runner scripts accept an explicit `--cautilus-bin` seam and keep the default real binary path for operator use.
- The fake Cautilus binary rejects missing `--overwrite` and missing `--scope agent-surface`, so wrapper argument drift remains visible in fast tests.
- Shared test helpers under `scripts/test-support/` remove repeated git setup and fake-binary scaffolding without hiding the behavior assertions from the test files.
- `instruction-surface-support` now has direct tests for malformed routing records, blocked backend observations, source-file instruction materialization, escaping path rejection, directory rejection, and default symlink capture.

## Weak

- The local quality adapter still lacks structured runtime samples and effective budgets, so runtime drift is visible only when a reviewer profiles manually.
- Cautilus Agent skill ergonomics inventory still reports heuristic findings for long cores, host-surface references, and reference discoverability; this slice did not address that ambient skill-surface debt.
- The dogfood runner tests now trust a fake `cautilus` binary for orchestration speed, so real binary lifecycle coverage depends on the separate bin and distribution tests staying in the suite.

## Missing

- No deterministic test-runtime budget or slow-test ratchet exists for the Node suite.
- No structured timing artifact was added to `.charness/quality/runtime-signals.json`.

## Deferred

- Adding a repo-owned slow-test budget should wait until the current runtime profile has at least one stable structured timing source.
- Cautilus Agent progressive-disclosure cleanup remains a separate quality slice.

## Advisory

- structural review result: skill ergonomics inventory is ambient, not target-scope; the reported Cautilus Agent heuristic findings are real review prompts but not regressions caused by this test-speed change.
- prose review result: test helper extraction kept assertions visible at the `.test.mjs` sites and moved only mechanical scaffolding into helpers.
- runtime visibility advisory: `render_runtime_summary.py --json` reported `runtime_visibility_missing_budgets`; this is an active quality gap but not a blocker for this bounded cleanup.

## Delegated Review

- executed: fresh-eye subagent `Planck` reviewed the uncommitted test-speed diff and returned `weak`.
- Disposition: fixed the high finding by using a representative source repo that proves include, untracked, deleted, and excluded-path behavior; fixed the hidden seam finding by replacing `CAUTILUS_BIN_PATH` with explicit `--cautilus-bin`; mitigated the fake-binary finding by making the fake reject wrapper argument drift while retaining separate real-binary smokes.
- Slow-gate lenses: fixture-economics, parallel-critical-path, and duplicated-proof were applied locally through `testability-and-selection.md` and `unit-test-quality.md`.

## Commands Run

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/plan_quality_run.py --repo-root . --json`
- `SKILL_DIR=/home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/render_runtime_summary.py --repo-root . --json`
- `SKILL_DIR=/home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/inventory_skill_ergonomics.py --repo-root . --summary`
- `node --test --test-reporter=spec bin/cautilus.test.mjs`
- `node --test --test-reporter=spec scripts/run-self-dogfood-eval.test.mjs scripts/run-self-dogfood-skill-refresh-flow-eval.test.mjs`
- `node --test --test-reporter=spec scripts/agent-runtime/run-local-eval-test.test.mjs`
- `node --test --test-reporter=spec --test-reporter-destination=stdout bin/*.test.mjs scripts/*.test.mjs scripts/agent-runtime/*.test.mjs scripts/release/*.test.mjs`
- `npm exec -- eslint bin/cautilus.test.mjs scripts/run-self-dogfood-eval.mjs scripts/run-self-dogfood-skill-refresh-flow-eval.mjs scripts/run-self-dogfood-eval.test.mjs scripts/run-self-dogfood-skill-refresh-flow-eval.test.mjs scripts/test-support/*.mjs`
- `npm exec -- eslint scripts/agent-runtime/run-local-eval-test.test.mjs scripts/agent-runtime/instruction-surface-support.mjs`
- `npm run test:coverage && npm run coverage:floor:check`
- `npm run verify`
- delegated fresh-eye review by subagent `Planck`

## Recommended Next Quality Moves

- active add structured runtime sampling — capability_needed=test runtime drift; next_center=Node and verify timing capture; transformation=write bounded machine-readable timing samples from repo-owned gates; proof_boundary=runtime summary plus focused tests; enforcement_posture=advisory until samples stabilize.
- passive add a slow-test ratchet until structured timing has a stable baseline because a hard budget without local samples would create noisy enforcement; capability_needed=slow-test guard; next_center=Node test runner reporting; transformation=fail or warn on new 500ms tests; proof_boundary=fixture suite; enforcement_posture=no-gate.
- passive address Cautilus Agent ergonomics until the next skill-surface slice because this test-speed cleanup did not change skill packages; capability_needed=progressive disclosure; next_center=Cautilus Agent `SKILL.md` and references; transformation=split or list references and reduce core pressure; proof_boundary=skill ergonomics inventory plus prose review; enforcement_posture=existing advisory.

## History

- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
