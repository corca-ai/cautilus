# Quality Review
Date: 2026-07-08

## Scope

Target boundary: repo-wide quality and test-speed economics for Cautilus as installable CLI plus Cautilus Agent surface, focused on closing a missing repo-owned quality evidence entrypoint.

Ambient repo findings: runtime hotspot pruning, claim-audit narrowing, and Cautilus Agent ergonomics remain separate slices.

## Current Gates

- `./scripts/run-quality.sh --read-only`
- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/run-quality.test.mjs`
- `npm run hooks:check`
- `npm run verify`

## Runtime Signals

- runtime source: structured metrics from `.charness/quality/runtime-signals.json` rendered by `render_runtime_summary.py`; profile `local-verify`.
- runtime hot spots: `lint · specs` 16.1s latest / 25.4s median, budget 35.0s; `security · secret scan` 6.8s latest / 6.8s median, budget 12.0s; `lint · claim evidence hashes` 6.4s latest / 6.4s median, budget 9.0s.
- coverage gate: `./scripts/run-quality.sh --read-only` ran full `npm run verify`; coverage and floor checks passed inside that packet.
- evaluator depth: deterministic local gates only; this slice changed a repo quality runner, not agent behavior.

## Healthy

- `scripts/run-quality.sh` now exists as the repo-owned quality evidence entrypoint expected by the Charness quality planner.
- `--read-only` runs the non-durable `verify` gate and explicitly skips artifact-writing `dogfood:self`.
- Default mode still runs the adapter-declared quality pair: `verify` followed by `dogfood:self`.
- Focused tests cover read-only behavior, default command ordering, and unknown-argument failure.
- `./scripts/run-quality.sh --read-only` passed against the real repo and produced phase-level wrapper output around `verify`.
- `npm run verify` remains the canonical final gate and passed after this slice.

## Weak

- The read-only quality packet currently delegates to `npm run verify`, so it does not add a fresh runtime-signal sample by itself.
- `lint · specs` remains the largest measured standing hotspot by recent median even though it is within budget.
- `test:node` and `test:node:coverage` still execute the same Node test glob during full `verify`.
- `claims:audit-evidence` still spends about 6.4s on a standing evidence-hash audit with many warning-only historical references.
- Cautilus Agent skill ergonomics inventory still reports long core, host-surface references, and reference-discoverability pressure for both source and packaged skill copies.

## Missing

- There was no `./scripts/run-quality.sh --read-only` command before this slice, even though the planner emitted it as the standing deterministic evidence packet.
- No explicit quality-runner contract is documented outside the script and tests yet.
- No active-only standing mode exists for `claims:audit-evidence`.

## Deferred

- Removing the standalone `test:node` phase from `verify` is deferred until the coverage phase is accepted as the sole Node test executor for standing verification.
- Adding an active-only claim evidence audit is deferred until current-vs-historical reference semantics are reviewed.
- Making pre-push use `verify:runtime` is deferred because this slice focused on the missing quality packet entrypoint.
- Cautilus Agent progressive-disclosure cleanup remains a separate skill-surface quality slice.

## Advisory

- structural review result: command: `plan_quality_run.py --repo-root . --json` showed `./scripts/run-quality.sh --read-only` as the expected packet, so the weak capability was repo-owned quality closeout operability.
- prose review result: command: `node --test ... scripts/run-quality.test.mjs` proves the wrapper owns sequencing and read-only policy while leaving gate semantics in existing npm scripts.
- runtime interpretation: command: `render_runtime_summary.py --repo-root . --json` shows real standing hot spots, but this slice improved evidence operability rather than reducing the dominant runtime.
- skill ergonomics interpretation: command: `inventory_skill_ergonomics.py --repo-root . --summary` reports ambient pressure, not proof of broken behavior, so it remains a later skill-surface slice.
- test economics interpretation: command: `inventory_standing_test_economics.py --repo-root . --summary` shows shared Node runner snippets, making duplicated Node execution a credible next optimization candidate.

## Delegated Review

- Delegated Review: executed by subagent `Einstein`; status `completed`; scope `read-only scout for deterministic quality/test-speed improvements`.
- Reviewer candidates: remove duplicate Node test execution from `verify`, add active-only claim evidence audit, clean `coverage/tmp`, and route pre-push through `verify:runtime`.
- Action taken now: implemented the missing quality evidence runner first because it closes the planner's own missing command and gives later quality runs a stable entrypoint.

## Commands Run

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/resolve_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/bootstrap_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/resolve_quality_artifact.py --repo-root . --intent current`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/plan_quality_run.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/render_runtime_summary.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/inventory_skill_ergonomics.py --repo-root . --summary`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/inventory_standing_test_economics.py --repo-root . --summary`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/inventory_standing_gate_verbosity.py --repo-root . --summary`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/inventory_structural_waste.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/inventory_lint_ignores.py --repo-root . --summary`
- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/run-quality.test.mjs`
- `./scripts/run-quality.sh --read-only`
- delegated scout review by subagent `Einstein`

## Recommended Next Quality Moves

- active remove duplicate Node test execution from `verify` after proving `test:node:coverage` is an honest standing Node test executor — capability_needed=faster standing gate; next_center=`scripts/run-verify.mjs`; transformation=drop the separate `test · node` phase or make it non-duplicative; proof_boundary=focused runner tests, `npm run test:node:coverage`, and `npm run verify:runtime`; enforcement_posture=advisory.
- active add a standing active-only mode for `claims:audit-evidence` after reviewing current-vs-historical reference semantics — capability_needed=faster standing claim audit; next_center=`scripts/agent-runtime/audit-claim-evidence-hashes.mjs`; transformation=keep full audit on demand and use active refs in standing verify; proof_boundary=focused tests plus before/after timed verify; enforcement_posture=advisory.
- passive consider routing pre-push through `verify:runtime` because runtime samples are useful but this changes local hook behavior — capability_needed=runtime trend visibility; next_center `.githooks/pre-push`; transformation=write ignored runtime samples during maintainer push; proof_boundary=hook tests plus `hooks:check`; enforcement_posture=no-gate until maintainer policy is accepted.
- passive clean Cautilus Agent ergonomics in a separate skill-surface slice because this run did not edit skill packages — capability_needed=progressive disclosure; next_center=Cautilus Agent `SKILL.md` and references; transformation=reduce core pressure and improve reference discoverability; proof_boundary=skill ergonomics inventory plus prose review; enforcement_posture=existing advisory.

## History

- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
