# Quality Review
Date: 2026-07-08

## Scope

Target boundary: repo-wide quality and test-speed economics for Cautilus as an installable CLI plus Cautilus Agent surface, focused on collapsing checked-in evidence source hashing from per-commit batches into one bounded Git batch.

Ambient repo findings: post-change runtime medians, pre-push runtime sampling, checked-in evidence warning debt, and Cautilus Agent ergonomics remain separate slices.

## Current Gates

- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/audit-claim-evidence-hashes.test.mjs`
- `npm run claims:audit-evidence`
- `npm run claims:audit-evidence:full`
- `npm run verify:runtime`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/check_runtime_budget.py --repo-root .`

## Runtime Signals

- runtime source: structured metrics from `.charness/quality/runtime-signals.json` rendered by `render_runtime_summary.py`; profile `local-verify`.
- runtime hot spots: `lint · specs` 16.2s latest / 20.6s median, budget 35.0s; `security · secret scan` 6.6s latest / 6.8s median, budget 12.0s; `test · coverage` 3.8s latest / 4.9s median, budget 10.0s; `lint · eslint` 3.4s latest / 3.4s median, budget 8.0s; `lint · promise ledger` 2.4s latest / 2.4s median, budget 4.0s.
- coverage gate: `npm run verify:runtime` ran the standing `test · coverage` phase, including Go coverage and the c8-wrapped Node test run.
- claim audit before/after signal: active standing audit now resolves 521 unique checked-in evidence lookups through one `git cat-file --batch` process and reports 382ms in `verify:runtime`; the prior per-commit batch shape reported about 1.10s, and the earlier per-entry `git show` shape reported about 4.2s.
- evaluator depth: deterministic local gates only; this slice changed Git lookup execution shape and tests, not agent behavior.

## Healthy

- `audit-claim-evidence-hashes.mjs` now batches mixed-commit `repoCommit:path` specs in one `git cat-file --batch` call.
- The batch call has an explicit 128MiB stdout buffer; current active output measured about 21.5MB and full output about 31.3MB.
- Unsafe newline-delimited `repoCommit` or `path` values are excluded from batch input and handled through the existing `git show` fallback.
- Active mode still scans 2 current-state reference files, skips 172 historical reference files, and reports the same 48 warning-only checked-in evidence findings.
- Full mode still scans all 174 reference files and reports the same 118 warning-only historical findings.
- `npm run verify:runtime` passed with `lint · claim evidence hashes` at 382ms latest, under the 9.0s local budget.

## Weak

- The runtime median for `lint · claim evidence hashes` is still 6.34s because the recent sample window includes pre-batch and pre-active-only samples.
- The 128MiB buffer is a bounded local choice, not a streaming parser; future evidence growth could require streaming or chunked batches.
- Active standing audit still reports 48 warning-only checked-in evidence findings; the optimization reduced process overhead, not evidence warning debt.
- Full historical audit still reports 118 warnings, including 30 historical evidence reference mismatches, so it remains useful but noisy.
- `lint · specs` remains the largest standing hotspot by recent median.

## Missing

- No post-change median window exists yet with global-batched active-only claim audit in every recent runtime sample.
- No policy decision exists yet for whether active checked-in evidence warnings should be reduced, tolerated, or moved behind a slower full audit.
- No CI or slower-machine runtime profile exists to decide whether the local claim audit budget should be portable.

## Deferred

- Tightening the `lint · claim evidence hashes` budget is deferred until more post-change `verify:runtime` samples replace older measurements.
- Replacing the bounded batch buffer with a streaming parser is deferred because current full output is about 31.3MB against a 128MiB bound and the standing phase is now sub-second.
- Reducing the 48 active checked-in evidence warnings is deferred because this slice changed lookup execution shape, not evidence bundle storage or source availability.
- Cautilus Agent progressive-disclosure cleanup remains a separate skill-surface quality slice.

## Advisory

- structural review result: command: direct active/full `git cat-file --batch` reproduction showed default Node `execFileSync` failed with `ENOBUFS`, while explicit 64MiB/128MiB buffers succeeded.
- runtime result: command: `/usr/bin/time -p npm run --silent claims:audit-evidence` reported 521 lookups, 1 batch, 0 fallbacks, and about 0.38s wall time.
- preservation result: command: `/usr/bin/time -p npm run --silent claims:audit-evidence:full` reported 816 lookups, 1 batch, 0 fallbacks, and about 0.42s wall time while preserving the full audit warning profile.
- prose review result: command: `node --test ... scripts/agent-runtime/audit-claim-evidence-hashes.test.mjs` proves mixed-commit specs share one batch and newline commit/path specs fall back without entering batch input.
- runtime interpretation: command: `render_runtime_summary.py --repo-root . --json` no longer lists `lint · claim evidence hashes` in the top runtime hot spots because the latest sample is 382ms; the separate budget checker still shows its median at 6.34s until older samples age out.
- delegated review result: subagent `Bernoulli` confirmed mixed-commit batch is behavior-preserving if output is consumed in input order, logical NUL lookup keys are retained, newline injection is tested, and summary semantics are explicit.

## Delegated Review

- Delegated Review: executed by subagent `Bernoulli`; status `completed`; scope `read-only safety review for mixed-commit checked-in evidence batching`.
- Slow-gate lenses applied: fixture-economics, parallel-critical-path, duplicated-proof.
- Reviewer verdict: safe if mixed-commit batch preserves input order mapping, keeps logical `repoCommit + NUL + path` lookup keys, and tests newline injection/fallback boundaries.
- Reviewer-requested guard: mixed commit/path specs should batch in one process, newline path should fallback, and newline commit should fallback; implemented.

## Commands Run

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/resolve_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/bootstrap_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/resolve_quality_artifact.py --repo-root . --intent current`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/plan_quality_run.py --repo-root . --json`
- direct Node reproduction for mixed-spec `git cat-file --batch` output size and `ENOBUFS`
- `npx eslint scripts/agent-runtime/audit-claim-evidence-hashes.mjs scripts/agent-runtime/audit-claim-evidence-hashes.test.mjs`
- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/audit-claim-evidence-hashes.test.mjs`
- `/usr/bin/time -p npm run --silent claims:audit-evidence`
- `/usr/bin/time -p npm run --silent claims:audit-evidence:full`
- `npm run verify:runtime`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/render_runtime_summary.py --repo-root . --json`
- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/check_runtime_budget.py --repo-root .`
- delegated safety review by subagent `Bernoulli`

## Recommended Next Quality Moves

- active collect several post-change `verify:runtime` samples before tightening the `lint · claim evidence hashes` budget — capability_needed=runtime budget discipline; next_center=.agents quality runtime profile; transformation=lower budgets only after the recent median reflects global-batched active-only audit; proof_boundary=budgeted runtime summary; enforcement_posture=advisory.
- active reduce checked-in evidence warning debt in the active bundle set — capability_needed=cleaner standing audit signal; next_center=.cautilus/claims evidence bundles; transformation=classify unreadable and mismatched checked-in evidence references; proof_boundary=active audit warning-count reduction plus full audit non-regression; enforcement_posture=advisory.
- passive consider streaming `git cat-file --batch` output if evidence output grows near the 128MiB buffer — capability_needed=scale-safe audit runtime; next_center=checked-in evidence batch reader; transformation=replace bounded sync buffer with streaming parser; proof_boundary=large-fixture batch test plus active/full timing; enforcement_posture=no-gate until growth pressure exists.
- passive clean Cautilus Agent ergonomics in a separate skill-surface slice because this run did not edit skill packages — capability_needed=progressive disclosure; next_center=Cautilus Agent `SKILL.md` and references; transformation=reduce core pressure and improve reference discoverability; proof_boundary=skill ergonomics inventory plus prose review; enforcement_posture=existing advisory.

## History

- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
