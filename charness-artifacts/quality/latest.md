# Quality Review
Date: 2026-07-08

## Scope

Target boundary: repo-wide quality and test-speed economics for Cautilus as an installable CLI plus Cautilus Agent surface, focused on narrowing the standing claim evidence hash audit without losing the full historical audit path.

Ambient repo findings: post-change runtime medians, pre-push runtime sampling, checked-in evidence warning debt, and Cautilus Agent ergonomics remain separate slices.

## Current Gates

- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/audit-claim-evidence-hashes.test.mjs scripts/github-actions.test.mjs`
- `npm run claims:audit-evidence`
- `npm run claims:audit-evidence:full`
- `npm run verify:runtime`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/check_runtime_budget.py --repo-root .`

## Runtime Signals

- runtime source: structured metrics from `.charness/quality/runtime-signals.json` rendered by `render_runtime_summary.py`; profile `local-verify`.
- runtime hot spots: `lint · specs` 16.1s latest / 25.1s median, budget 35.0s; `test · coverage` 8.0s latest / 5.9s median, budget 10.0s; `test · go race` 7.6s latest / 670ms median; `security · secret scan` 6.7s latest / 6.8s median, budget 12.0s; `lint · claim evidence hashes` 4.2s latest / 6.4s median, budget 9.0s.
- coverage gate: `npm run verify:runtime` ran the standing `test · coverage` phase, including Go coverage and the c8-wrapped Node test run.
- claim audit before/after signal: prior full standing audit scanned 174 reference files and 120 evidence bundles in about 6.1-6.5s; the new standing active audit scans 2 current-state reference files and 74 referenced evidence bundles in about 4.2s.
- evaluator depth: deterministic local gates only; this slice changed claim evidence audit scope and tests, not agent behavior.

## Healthy

- `claims:audit-evidence` now runs with `--reference-scope active`, so standing verification checks the current state packets instead of every historical review input and eval plan.
- `claims:audit-evidence:full` preserves the former full historical audit semantics on demand.
- Active mode reports `mode`, `referenceScope`, `skippedReferenceFileCount`, and `checkedInEvidenceBundleCount`, making the narrowed proof boundary visible in machine-readable output.
- Active mode still fails stale evidence references in current state packets; historical stale review results are skipped only in active mode and remain visible in full mode.
- Full mode still scans 174 reference files, 120 evidence bundles, and preserves warning-only historical reference drift.
- `npm run verify:runtime` passed with `lint · claim evidence hashes` at 4.23s latest, under the 9.0s local budget.

## Weak

- The active standing audit still spends about 4.2s because it validates 68 checked-in evidence bundles and still reports 48 warning-only checked-in evidence findings.
- The runtime median for `lint · claim evidence hashes` is still 6.4s because the recent sample window includes the pre-change full-audit shape.
- The full historical audit still reports 118 warnings, including 30 historical evidence reference mismatches, so it remains useful but noisy.
- `lint · specs` remains the largest standing hotspot by recent median.
- Cautilus Agent skill ergonomics inventory still reports long core, host-surface references, and reference-discoverability pressure for both source and packaged skill copies.

## Missing

- No policy decision exists yet for whether active checked-in evidence warnings should be reduced, tolerated, or moved behind a slower full audit.
- No post-change median window exists yet with active-only claim audit in every recent runtime sample.
- No CI or slower-machine runtime profile exists to decide whether the local claim audit budget should be portable.

## Deferred

- Tightening the `lint · claim evidence hashes` budget is deferred until more post-change `verify:runtime` samples replace older full-audit measurements.
- Reducing the 48 active checked-in evidence warnings is deferred because this slice changed standing scope, not evidence bundle storage or source availability.
- Making pre-push use `verify:runtime` is deferred because this slice changed the audit command contract, not hook policy.
- Cautilus Agent progressive-disclosure cleanup remains a separate skill-surface quality slice.

## Advisory

- structural review result: command: `npm run claims:audit-evidence` now reports `referenceScope: active`, scans 2 reference files, skips 172 historical reference files, checks 74 active evidence bundles, and exits 0.
- preservation result: command: `npm run claims:audit-evidence:full` still reports `referenceScope: full`, scans 174 reference files and 120 evidence bundles, and exits 0.
- prose review result: command: `node --test ... scripts/agent-runtime/audit-claim-evidence-hashes.test.mjs scripts/github-actions.test.mjs` proves current-state stale refs still fail active mode and stale historical review results remain full-audit-only.
- runtime interpretation: command: `render_runtime_summary.py --repo-root . --json` shows `lint · claim evidence hashes` latest 4.2s / median 6.4s, so the latest sample improved while the median still contains old full-audit samples.
- budget interpretation: command: `check_runtime_budget.py --repo-root .` reports all configured `local-verify` budgets OK, including `lint · claim evidence hashes` under its 9.0s budget.
- delegated review result: subagent `Copernicus` recommended explicit `--reference-scope active|full`, current-state-only standing refs, active checked-in evidence limited to active referenced bundles, and a preserved full audit script.

## Delegated Review

- Delegated Review: executed by subagent `Copernicus`; status `completed`; scope `read-only safety review for active-only claim evidence audit`.
- Slow-gate lenses applied: fixture-economics, parallel-critical-path, duplicated-proof.
- Reviewer verdict: safe if the default program behavior remains full, package standing script opts into active, and full audit stays available on demand.
- Reviewer-requested guard: tests should prove active mode checks current state, active mode skips stale historical review results, full mode still sees them, and package scripts pin active/full scope; implemented.

## Commands Run

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/resolve_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/bootstrap_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/resolve_quality_artifact.py --repo-root . --intent current`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/plan_quality_run.py --repo-root . --json`
- `npx eslint scripts/agent-runtime/audit-claim-evidence-hashes.mjs scripts/agent-runtime/audit-claim-evidence-hashes.test.mjs scripts/github-actions.test.mjs`
- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/audit-claim-evidence-hashes.test.mjs scripts/github-actions.test.mjs`
- `/usr/bin/time -p npm run --silent claims:audit-evidence`
- `/usr/bin/time -p npm run --silent claims:audit-evidence:full`
- `npm run verify:runtime`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/render_runtime_summary.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/check_runtime_budget.py --repo-root .`
- delegated safety review by subagent `Copernicus`

## Recommended Next Quality Moves

- active collect several post-change `verify:runtime` samples before tightening the `lint · claim evidence hashes` budget — capability_needed=runtime budget discipline; next_center=.agents quality runtime profile; transformation=lower budgets only after the recent median reflects active-only audit; proof_boundary=budgeted runtime summary; enforcement_posture=advisory.
- active reduce checked-in evidence warning debt in the active bundle set — capability_needed=cleaner standing audit signal; next_center=.cautilus/claims evidence bundles; transformation=classify unreadable and mismatched checked-in evidence references; proof_boundary=active audit warning-count reduction plus full audit non-regression; enforcement_posture=advisory.
- passive consider routing pre-push through `verify:runtime` because runtime samples are useful but this changes local hook behavior — capability_needed=runtime trend visibility; next_center `.githooks/pre-push`; transformation=write ignored runtime samples during maintainer push; proof_boundary=hook tests plus `hooks:check`; enforcement_posture=no-gate until maintainer policy is accepted.
- passive clean Cautilus Agent ergonomics in a separate skill-surface slice because this run did not edit skill packages — capability_needed=progressive disclosure; next_center=Cautilus Agent `SKILL.md` and references; transformation=reduce core pressure and improve reference discoverability; proof_boundary=skill ergonomics inventory plus prose review; enforcement_posture=existing advisory.

## History

- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
