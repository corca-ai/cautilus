# Quality Review
Date: 2026-07-11

## Scope

Target boundary: second repo-wide autonomous improvement pass across correctness, test/runtime economics, and review-packet confidence.

Ambient repo findings: the standing gate passed before implementation; source-hygiene, structural-waste, brittle-source, dual-implementation, and CLI inventories found no independent cleanup candidate.

## Current Gates

- `./scripts/run-quality.sh --read-only`
- focused Go runtime tests and coverage
- `node --test scripts/agent-runtime/review-prompt-flow.test.mjs`
- `npm run lint:eslint`
- `npm run verify`
- `npm run hooks:check`

## Runtime Signals

- runtime source: structured metrics from `.charness/quality/runtime-signals.json` rendered by `render_runtime_summary.py`; profile `local-verify`.
- runtime hot spots: `lint · specs` 16.08s latest / 15.98s median against 35.0s; `test · coverage` 4.13s / 3.85s against 10.0s; `lint · eslint` 3.65s / 3.51s against 8.0s.
- coverage gate: read-only quality passed all phases in 32.97s before implementation; focused Go coverage measured `BuildReviewPromptInputFromScenario` at 73.3% and `RenderReviewPrompt` at 85.4%, while the final broad verify reported 65.4% total statement coverage.
- evaluator depth: deterministic gates only because the defect is a cross-language text encoding and packet-construction invariant, not model behavior.

## Healthy

- Go and Node review excerpt producers now count and truncate Unicode code points and preserve the existing packet shape.
- Node normalizes lone surrogates to well-formed Unicode within the declared Node `>=22` runtime contract.
- Focused tests cover ASCII exact/overflow boundaries, multibyte prefix selection, emoji exact/overflow boundaries, lone-surrogate parity, and scenario-to-render output.
- Maintainer-local enforcement remains checked-in through `.githooks/pre-push`, `hooks:install`, `hooks:check`, and the GitHub verify workflow.

## Weak

- Claim evidence audit remains warning-only with 47 historical checked-in evidence warnings: 26 hash mismatches and 21 unreadable objects.
- Coverage-floor output still lists 38 promotion candidates and 25 unfloored warn-band files; these are not failures or automatic rebaseline instructions.
- The report-packet `BuildReviewPromptInput` path remains at 0% in focused Go coverage even though the scenario path and renderer now carry direct behavior proof.

## Missing

- No proof-preserving repo-owned test-speed optimization seam was established for the current dominant `specdown` runtime.
- Grapheme-cluster preservation and token/byte prompt budgets are not defined by the current code-point contract and were not tested.

## Deferred

- `lint · specs` optimization is deferred: specdown run (13.59s) and strict trace (2.29s) prove distinct contracts, and current evidence does not justify removal, cache, or parallel artifact access.
- Report-packet prompt-input behavior tests are deferred until selected as a bounded confidence slice rather than added to chase file coverage.
- Claim evidence warning cleanup remains a separate provenance-policy slice because the current audit intentionally treats historical unreadable and mismatched objects as warnings.

## Advisory

- structural review result: evidence: the weak capability was multilingual review-output fidelity; current centers were the Go and Node packet producers, and the next center was their shared code-point contract with existing-test reuse.
- sequencing applicability: evidence: reproduce invalid UTF-8 first, then repair both producers, then add scenario-to-render proof, then run parity review; a different order would have risked a one-language patch.
- prose review result: command: `inventory_skill_ergonomics.py --summary` remained ambient because no Cautilus Agent behavior-steering surface changed.
- runtime interpretation: command: `verify:lint-specs:subphases` showed a stable necessary proof cost, not a newly regressed or duplicated runner cost.

## Delegated Review

- Delegated Review: executed — parent-delegated quality review recommended Unicode correctness, scenario-to-render confidence, and explicit runtime deferral.
- Post-implementation review: executed — initial `concern` found lone-surrogate parity, prefix assertion, and goal-log mapping gaps; all were fixed, and the reviewer stated the resulting code/test verdict was ready after audit numbering alignment.
- Reviewer integrity: both final shared-tree fingerprint verifies reported no drift; requested `reasoning_effort=high` was sent but provider application is not claimed.
- Slow-gate lenses: fixture-economics found no new broad fixtures; parallel-critical-path found no safe proof-preserving change; duplicated-proof found specdown run and trace carry distinct contracts.

## Commands Run

- `./scripts/run-quality.sh --read-only`
- `python3 .../render_runtime_summary.py --repo-root . --json`
- `python3 .../inventory_standing_test_economics.py --repo-root . --summary`
- `python3 .../inventory_structural_waste.py --repo-root . --json`
- `python3 .../inventory_brittle_source_guards.py --repo-root . --json`
- `npm run verify:lint-specs:subphases`
- focused Go tests/coverage and Node review-prompt-flow tests
- delegated review plus reviewer-boundary snapshot/verify
- final `npm run verify` passed in 60.38s; the cold Go/race path accounted for the difference from the earlier read-only quality sample.
- final `npm run hooks:check` reported the hooks ready.

## Recommended Next Quality Moves

- passive report-packet prompt-input proof because capability_needed=deterministic report-review confidence; next_center=`BuildReviewPromptInput`; transformation=cover observable evidence summarization and rendered sections without snapshots; proof_boundary=focused Go tests; enforcement_posture=existing-gate-reuse until selected.
- passive claim-evidence provenance triage because capability_needed=trustworthy historical evidence references; next_center=47 warning records; transformation=classify stale bundles before changing warning policy; proof_boundary=current audit plus immutable Git objects; enforcement_posture=advisory until classifications exist.

## History

- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
