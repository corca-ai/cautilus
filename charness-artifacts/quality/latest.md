# Quality Review
Date: 2026-07-11

## Scope

Target boundary: repo-wide operator diagnosability, with a focused slice on durable quality runtime evidence and next-session state.

Ambient repo findings: all standing deterministic gates passed; the Cautilus Agent ergonomics packet remains advisory and no product behavior or public skill change was made.

## Current Gates

- `node --test scripts/run-quality.test.mjs`
- `npm run verify:runtime`
- `npm run hooks:check`
- `./scripts/run-quality.sh --read-only`

## Runtime Signals

- runtime source: structured metrics from `.charness/quality/runtime-signals.json` rendered by `render_runtime_summary.py`; profile `local-verify`.
- runtime hot spots: before the slice, `lint · specs` was 16.0s latest / 16.0s median against a 35.0s budget; `test · coverage` was 3.9s / 3.9s against 10.0s; `lint · eslint` was 3.5s / 3.5s against 8.0s.
- coverage gate: `npm run verify:runtime` passed all phases in 33.25s and refreshed the signal timestamp to `2026-07-11T09:25:53.078Z`.
- evaluator depth: deterministic gates only because the changed seam selects an existing code-owned verification target and does not steer agent or provider behavior.

## Healthy

- The canonical final gate is enforced locally through the checked-in `.githooks/pre-push`, repo-owned hook installer/checker, and GitHub verify workflow.
- `scripts/run-quality.sh --read-only` remains non-durable and skips self-dogfood.
- The normal quality path now reuses `verify:runtime`, so the existing measurement producer stays owned by `scripts/run-verify.mjs` rather than being duplicated in the wrapper.
- Security checks passed: govulncheck reported no vulnerabilities and gitleaks reported no leaks in 1,825 tracked files.

## Weak

- Claim evidence hash audit remains warning-only with 47 warnings: 26 content-hash mismatches and 21 unreadable checked-in evidence references.
- The coverage floor reports 38 files above their drift-lock and 25 unfloored files in the warn band; these are advisory promotion candidates, not current failures.
- `internal/runtime/review.go` remains at 8.47% statement coverage, with review prompt assembly and rendering helpers at 0% in this coverage channel.

## Missing

- No product-critical deterministic gate was found missing for the selected quality runner seam.
- Live provider proof was not run and is not required for this deterministic orchestration change.

## Deferred

- Review prompt boundary tests are deferred as the next test-confidence candidate; they should pin observable packet and error behavior rather than chase a coverage percentage.
- Coverage-floor promotion is deferred until candidate stability is reviewed instead of rebaselining all 38 entries from one run.
- Claim evidence warning cleanup is deferred because it is broader than this operator-state slice and the current policy explicitly classifies it as warning-only.

## Advisory

- structural review result: evidence: capability needed was current operator evidence and orientation; the existing centers were `verify:runtime`, runtime signals, release proof, and handoff; the bounded transformation connected the durable quality wrapper and refreshed the baton with existing-gate reuse and no new gate.
- sequencing applicability: evidence: measurement had to be connected and proven before the handoff could honestly describe it, and the goal must close before the handoff claims no active implementation track.
- prose review result: command: `inventory_skill_ergonomics.py --summary` reported two 185-line cores, 50 host-surface references, and 44 reference-discoverability hits across source and packaged copies; these are ambient because parity is already gated and this slice did not carry the behavior proof required for a skill edit.
- standing-gate verbosity result: command: `inventory_standing_gate_verbosity.py --summary` labeled pre-push phase signal `minimal`, but direct inspection found labeled start/pass timing already implemented and deterministically checked, so no additive gate is warranted.

## Delegated Review

- Delegated Review: executed — parent-delegated high-leverage reviewer returned `concern` with no blocker and one should-fix: synchronize goal completion and handoff atomically before commit.
- Reviewer integrity: the final shared-tree boundary fingerprint verified with no drift; requested `reasoning_effort=high` was sent but provider application is not claimed.
- Slow-gate lenses: fixture-economics found no test-fixture growth in this slice; parallel-critical-path found no new serial phase; duplicated-proof found that the existing `verify:runtime` producer should be reused rather than copied.

## Commands Run

- `./scripts/run-quality.sh --read-only`
- `python3 .../render_runtime_summary.py --repo-root . --json`
- `python3 .../inventory_skill_ergonomics.py --repo-root . --summary`
- `python3 .../inventory_structural_waste.py --repo-root . --json`
- `python3 .../inventory_standing_gate_verbosity.py --repo-root . --summary`
- `node --test scripts/run-quality.test.mjs`
- `npm run verify:runtime`
- delegated read-only review plus reviewer-boundary snapshot/verify

## Recommended Next Quality Moves

- passive review prompt boundary tests because capability_needed=deterministic review packet confidence; next_center=`internal/runtime/review.go`; transformation=cover selection, extraction, rendering, and failure paths without changing the schema; proof_boundary=focused Go tests plus standing coverage; enforcement_posture=existing-gate-reuse until this becomes the selected slice.
- passive claim evidence warning triage because capability_needed=trustworthy checked-in proof references; next_center=`claims:audit-evidence` warning samples; transformation=separate stale local evidence from intentionally unavailable artifacts before changing policy; proof_boundary=current warning-only audit; enforcement_posture=advisory until the warning classes are dispositioned.

## History

- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
