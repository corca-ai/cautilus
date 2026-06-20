# Release Record
Date: 2026-06-20

## Summary

Released Cautilus `v0.16.2`.

## Release Scope

Patch release. The shipping change is a set of behavior repairs in the binary's improvement-search engine, carried alongside the apex proof milestones that landed since `v0.16.1`.
This release keeps the public product shape stable: installable Cautilus CLI, bundled Cautilus Agent, checked-in claim/spec reports, and GitHub binary release artifacts.
The bundled Cautilus Agent surface (`skills/cautilus-agent`, `plugins/cautilus`) is byte-identical to `v0.16.1`; the behavior change ships in the Go binary (`internal/runtime`).

The main shipped changes are:

- improve-search no longer runs mutations blind: per-scenario reflection-batch buckets and feedback now reach the mutation prompt (`stringSliceOrEmptyRuntime` reads back the in-memory string slices the signal map writes);
- improve-search held-out scoring reads the scenario id from `evaluationId`, so a recovered candidate reaches the Pareto frontier and passes the full-gate checkpoint instead of the search wrongly staying blocked;
- the dev/skill eval runner's Claude backend applies the same deterministic command/summary fragment matchers as the Codex backend instead of trusting the agent's self-graded outcome (`scripts/agent-runtime/skill-test-claude-backend.mjs`).

Proof milestones since `v0.16.1` (docs, specs, and checked-in evidence):

- the apex `Bounded Improvement` badge is now proven on the dev/skill surface: a live `cautilus improve` loop (`npm run proof:improve:live`) rewrites a degraded orientation prompt until a mutated candidate it was never tuned on recovers a held-out scenario (seed scores 0, the winner scores 100);
- the apex `Behavior Evaluation` badge milestone (proven on the dev coding-agent surfaces, with anonymized external app/chat replay and an app/prompt backend probe) is also carried in this release.

This release does not claim a new runtime contract, a breaking command change, npm publication, or public Claude/Codex marketplace publication.
The GitHub binary/install surface remains the public release boundary.

## Commits

This release includes the commits after `v0.16.1` up to the release commit. Representative commits:

- Flip apex Bounded Improvement badge to proven (dev/skill live held-out loop)
- Fix improve-search held-out scenario id mismatch (frontier always picked seed)
- Fix improve-search dropping per-scenario mutation feedback (blind mutations)
- Apply deterministic expectation matchers on the claude eval backend
- Add proof:improve:live harness for the live Bounded Improvement loop
- Add dev/skill held-out orientation improve surface for live Bounded Improvement proof
- Mark Behavior Evaluation proven on the dev coding-agent surfaces
- Anonymize external chat proof surface; record app/chat external-data replay evidence
- Add app/prompt backend probe and intent-judge proof

## Review

- Critique: short release-hygiene scope — a patch bump is justified because the shipping change is a behavior repair to the improve-search engine (previously blind mutations and an always-blocked search), not a new stable runtime contract, a breaking invocation change, or a CLI/skill-surface change. `internal/runtime` is not in the adapter's `cli_skill_surface_change_globs`; the bundled Cautilus Agent is byte-identical, so no progressive-disclosure CLI/Agent pass was triggered.
- Critique: full — the underlying substance (the Bounded Improvement badge flip plus the three load-bearing improve-search/runner bug fixes) was reviewed by a bounded Sonnet fresh-eye subagent before this release; verdict READY-WITH-EDITS, the one stale spec reference was folded in. Recorded in `charness-artifacts/eval-trust/2026-06-20-bounded-improvement-badge-proven.md`.

## Debug Notes

- `charness-artifacts/debug/2026-06-20-improve-live-case-prompt-spoonfeeds-orientation.md` records the root-cause chain (case-prompt spoon-feeding, claude-backend matcher gap, reflection-batch drop, held-out scenario-id mismatch) and the fixes shipped here.

## Verification

Local release-close gates (green):

- `node scripts/release/prepare-release.mjs 0.16.2`: green (skills sync no-op, version surfaces aligned at 0.16.2, claim freshness fresh).
- `npm run generated:drift:check`: clean.
- `npm run lint:specs`: 42 specs ok (includes the new live improve check).
- `node --test scripts/on-demand/improve-live-proof.test.mjs`: 7/7 (deterministic replay of the live improve capture).
- `npm run verify`: all phases passed.
- `npm run hooks:check`: ready.
- `npm run claims:evidence-state:check`: ok.
- `check_real_host_proof`: no release-time real-host proof required for this slice.
- `check_requested_review_gate`: ok (advisory-only; no `requested_review_commands` configured).

## Public Release

Pending. The actual branch push, tag, and GitHub release are the maintainer's step (push is reserved to the maintainer in this repo).
After the maintainer publishes, this section should be filled with the released tag `v0.16.2`, release commit, URL, published-at timestamp, asset list, and the public-verification + install-smoke results.

Suggested publish command (maintainer runs):

```bash
npm run release:publish -- --version 0.16.2 --dry-run --json   # preview
npm run release:publish -- --version 0.16.2                     # branch push + tag
node scripts/release/verify-public-release.mjs --version v0.16.2 --repo corca-ai/cautilus --json
npm run release:smoke-install -- --channel install_sh --version v0.16.2 --repo corca-ai/cautilus --json
```

## Operator Update Steps

1. Refresh the binary via the install-sh channel:
   `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`.
2. Claude Code and Codex plugin consumers pick up the bundled Cautilus Agent via `charness update` or by re-running `cautilus init` in the host repo (the bundled agent is unchanged from `v0.16.1`).
3. The behavior change is in the binary's `improve` surface; host repos using `cautilus improve` get a working bounded loop where mutations now receive feedback and a recovered candidate is selected instead of the search staying blocked.

## Open Risks

- This record is written BEFORE the public push/tag/publish, which the maintainer performs. The Public Release and public-verification sections are pending and must be completed after publish.
- Requested-review enforcement is advisory-only because `.agents/release-adapter.yaml` has no `requested_review_commands`.
- The live improve proof currently covers the dev/skill orientation prompt target; extending it to additional improvement targets stays open (improvement-loop contract Evidence Gaps).
