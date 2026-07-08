# Quality Review
Date: 2026-07-08

## Scope

Target boundary: repo-wide quality and test-speed economics for Cautilus as an installable CLI plus Cautilus Agent surface, focused on reducing checked-in evidence lookup overhead inside the standing claim evidence hash audit.

Ambient repo findings: post-change runtime medians, pre-push runtime sampling, checked-in evidence warning debt, and Cautilus Agent ergonomics remain separate slices.

## Current Gates

- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/audit-claim-evidence-hashes.test.mjs scripts/github-actions.test.mjs`
- `npm run claims:audit-evidence`
- `npm run claims:audit-evidence:full`
- `npm run verify:runtime`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/check_runtime_budget.py --repo-root .`

## Runtime Signals

- runtime source: structured metrics from `.charness/quality/runtime-signals.json` rendered by `render_runtime_summary.py`; profile `local-verify`.
- runtime hot spots: `lint · specs` 16.1s latest / 24.9s median, budget 35.0s; `security · secret scan` 6.6s latest / 6.8s median, budget 12.0s; `test · coverage` 3.7s latest / 5.9s median, budget 10.0s; `lint · eslint` 3.5s latest / 3.4s median, budget 8.0s; `lint · promise ledger` 2.4s latest / 2.4s median, budget 4.0s.
- coverage gate: `npm run verify:runtime` ran the standing `test · coverage` phase, including Go coverage and the c8-wrapped Node test run.
- claim audit before/after signal: active standing audit now batches 521 unique checked-in evidence lookups into 67 `git cat-file --batch` commands and reports 1.10s in `verify:runtime`; the previous active-only standing audit reported about 4.2s.
- evaluator depth: deterministic local gates only; this slice changed Git lookup execution shape and tests, not agent behavior.

## Healthy

- `audit-claim-evidence-hashes.mjs` now resolves checked-in evidence by unique `repoCommit:path` lookup and batches paths per commit through `git cat-file --batch`.
- Warning and issue counts are preserved because cached lookup results are reused only for content or unreadable status; each bundle entry still creates its own finding.
- Active mode still scans 2 current-state reference files, skips 172 historical reference files, and reports the same 48 warning-only checked-in evidence findings.
- Full mode still scans all 174 reference files and reports the same 118 warning-only historical findings.
- Summary output now exposes `checkedInEvidenceLookupCount`, `checkedInEvidenceBatchCount`, and `checkedInEvidenceFallbackLookupCount`, making the optimization inspectable in standing logs.
- `npm run verify:runtime` passed with `lint · claim evidence hashes` at 1.10s latest, under the 9.0s local budget.

## Weak

- The runtime median for `lint · claim evidence hashes` is still 6.35s because the recent sample window includes pre-batch and pre-active-only samples.
- Active standing audit still reports 48 warning-only checked-in evidence findings; the optimization reduced process overhead, not evidence warning debt.
- Full historical audit still reports 118 warnings, including 30 historical evidence reference mismatches, so it remains useful but noisy.
- `lint · specs` remains the largest standing hotspot by recent median.
- Cautilus Agent skill ergonomics inventory still reports long core, host-surface references, and reference-discoverability pressure for both source and packaged skill copies.

## Missing

- No post-change median window exists yet with batched active-only claim audit in every recent runtime sample.
- No policy decision exists yet for whether active checked-in evidence warnings should be reduced, tolerated, or moved behind a slower full audit.
- No CI or slower-machine runtime profile exists to decide whether the local claim audit budget should be portable.

## Deferred

- Tightening the `lint · claim evidence hashes` budget is deferred until more post-change `verify:runtime` samples replace older measurements.
- Reducing the 48 active checked-in evidence warnings is deferred because this slice changed lookup execution shape, not evidence bundle storage or source availability.
- Making pre-push use `verify:runtime` is deferred because this slice changed the audit implementation, not hook policy.
- Cautilus Agent progressive-disclosure cleanup remains a separate skill-surface quality slice.

## Advisory

- structural review result: command: inline evidence-entry inventory found active mode had 523 checked-in evidence entries but only 521 unique `repoCommit:path` lookups, so duplicate caching alone was not the useful optimization; batching by commit was.
- runtime result: command: `/usr/bin/time -p npm run --silent claims:audit-evidence` reported 521 lookups, 67 batches, 0 fallbacks, and about 1.02s wall time.
- preservation result: command: `/usr/bin/time -p npm run --silent claims:audit-evidence:full` reported 816 lookups, 105 batches, 0 fallbacks, and about 1.52s wall time while preserving the full audit warning profile.
- prose review result: command: `node --test ... scripts/agent-runtime/audit-claim-evidence-hashes.test.mjs scripts/github-actions.test.mjs` proves duplicate unreadable checked-in evidence still emits one finding per bundle in warn and strict modes.
- runtime interpretation: command: `render_runtime_summary.py --repo-root . --json` no longer lists `lint · claim evidence hashes` in the top runtime hot spots because the latest sample is 1.10s; the separate budget checker still shows its median at 6.35s until older samples age out.
- delegated review result: subagent `Schrodinger` confirmed per-call lookup reuse is behavior-preserving only if findings are not deduplicated, strict routing is preserved, and active/full bundle selection happens before lookup reuse.

## Delegated Review

- Delegated Review: executed by subagent `Schrodinger`; status `completed`; scope `read-only safety review for checked-in evidence lookup caching and batching`.
- Slow-gate lenses applied: fixture-economics, parallel-critical-path, duplicated-proof.
- Reviewer verdict: safe if lookup reuse stays inside one audit call, keys by `repoCommit + path`, and reuses only lookup results rather than finding objects.
- Reviewer-requested guard: duplicate unreadable entries should share one lookup but still produce two warnings in warn mode and two issues in strict mode; implemented.

## Commands Run

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/resolve_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/bootstrap_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/resolve_quality_artifact.py --repo-root . --intent current`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/plan_quality_run.py --repo-root . --json`
- inline Node inventory for checked-in evidence entry and unique lookup counts
- `node --check scripts/agent-runtime/audit-claim-evidence-hashes.mjs`
- `npx eslint scripts/agent-runtime/audit-claim-evidence-hashes.mjs scripts/agent-runtime/audit-claim-evidence-hashes.test.mjs scripts/github-actions.test.mjs`
- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/audit-claim-evidence-hashes.test.mjs scripts/github-actions.test.mjs`
- `/usr/bin/time -p npm run --silent claims:audit-evidence`
- `/usr/bin/time -p npm run --silent claims:audit-evidence:full`
- `npm run verify:runtime`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/render_runtime_summary.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/check_runtime_budget.py --repo-root .`
- delegated safety review by subagent `Schrodinger`

## Recommended Next Quality Moves

- active collect several post-change `verify:runtime` samples before tightening the `lint · claim evidence hashes` budget — capability_needed=runtime budget discipline; next_center=.agents quality runtime profile; transformation=lower budgets only after the recent median reflects batched active-only audit; proof_boundary=budgeted runtime summary; enforcement_posture=advisory.
- active reduce checked-in evidence warning debt in the active bundle set — capability_needed=cleaner standing audit signal; next_center=.cautilus/claims evidence bundles; transformation=classify unreadable and mismatched checked-in evidence references; proof_boundary=active audit warning-count reduction plus full audit non-regression; enforcement_posture=advisory.
- passive consider routing pre-push through `verify:runtime` because runtime samples are useful but this changes local hook behavior — capability_needed=runtime trend visibility; next_center `.githooks/pre-push`; transformation=write ignored runtime samples during maintainer push; proof_boundary=hook tests plus `hooks:check`; enforcement_posture=no-gate until maintainer policy is accepted.
- passive clean Cautilus Agent ergonomics in a separate skill-surface slice because this run did not edit skill packages — capability_needed=progressive disclosure; next_center=Cautilus Agent `SKILL.md` and references; transformation=reduce core pressure and improve reference discoverability; proof_boundary=skill ergonomics inventory plus prose review; enforcement_posture=existing advisory.

## History

- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
