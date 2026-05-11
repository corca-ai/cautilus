# Debug Review
Date: 2026-05-11

## Problem

After `git push origin main` succeeded, the checkout still had uncommitted generated claim Evidence State files.

## Correct Behavior

Given a push attempt refreshes or depends on checked-in generated claim evidence artifacts, when those artifacts have uncommitted drift, then the push closeout should fail before reporting success.

Given unrelated operator work may be dirty, when pre-push checks run, then the guard should only block the generated artifacts that this repo requires to be committed with the slice.

## Observed Facts

- `git push origin main` first failed because `.cautilus/claims/status-summary.json is stale; run npm run claims:evidence-state`.
- `npm run claims:evidence-state` updated `.cautilus/claims/evidence-state.json`, `.cautilus/claims/status-summary.json`, and `docs/specs/proof/claim-evidence-state.md`.
- The second `git push origin main` passed `npm run verify` and pushed `main` to `origin`.
- A post-push `git status --short --branch` still showed the three generated files as modified.
- The checked-in `.githooks/pre-push` only ran `npm run verify`; it did not check whether generated artifact changes remained uncommitted after verify passed.
- `claims:evidence-state:check` compared the generated status snapshot byte-for-byte against a freshly rendered checkout snapshot, so committing the generated projection would also move HEAD and risk making the checked-in snapshot appear stale again.

## Reproduction

```bash
npm run claims:evidence-state
git push origin main
git status --short -- .cautilus/claims/evidence-state.json .cautilus/claims/status-summary.json docs/specs/proof/claim-evidence-state.md
```

Before this fix, the push could succeed while those generated files remained modified.

## Candidate Causes

- The pre-push hook verified artifact freshness but not commit cleanliness for generated artifacts.
- The Evidence State freshness check treated harmless generated-artifact commit drift as byte drift even when claim sources did not change.
- The closeout workflow treated remote push success as sufficient and did not apply commit discipline to generated files created during the push repair.
- `hooks:check` only verified hook installation and executability, not whether the checked-in hook enforced generated artifact drift.

## Hypothesis

If the Evidence State check tolerates generated-artifact-only commit drift, then the generated projection can be committed without becoming stale only because HEAD changed.

If the pre-push hook also runs a generated-artifact drift check after `npm run verify`, then a push with uncommitted Evidence State projection changes will fail even when the projection content is fresh.

## Verification

Added generated-artifact commit-drift tolerance to `scripts/agent-runtime/render-claim-evidence-state.mjs` and a fixture test that passes when only generated artifact commit drift changes `currentGitCommit`.

The existing stale source snapshot test still fails when `gitState.isStale=true`.

Added `scripts/check-generated-artifact-drift.mjs` and tests covering clean generated artifacts, dirty generated artifacts, and unrelated dirty files.

Updated `.githooks/pre-push` to run `npm run generated:drift:check` after `npm run verify`, and updated `hooks:check` to verify that the hook includes this guard.

## Root Cause

The workflow had a freshness gate but not a commit gate for repo-owned generated claim artifacts.

That left a gap where fixing a stale generated projection before push could create new uncommitted generated state, then `npm run verify` could pass because the state was fresh.

The freshness gate also used byte equality for a snapshot that includes `currentGitCommit`, which made checked-in generated artifacts difficult to commit without immediately creating harmless HEAD drift.

## Seam Risk

- Interrupt ID: pre-push-generated-artifact-drift
- Risk Class: closeout-discipline-risk
- Seam: operator push workflow to repo-owned generated claim artifacts
- Disproving Observation: pre-push passed after `npm run claims:evidence-state` even though generated artifacts remained modified in the working tree.
- What Local Reasoning Cannot Prove: whether other generated artifacts should join the guarded path set.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep generated artifact freshness checks and generated artifact commit checks separate.

Freshness checks prove the files match their source packet.

The Evidence State check tolerates generated-artifact-only commit drift but still fails stale claim-source drift.

The pre-push generated drift check proves the repo-owned generated artifacts were committed before pushing.
