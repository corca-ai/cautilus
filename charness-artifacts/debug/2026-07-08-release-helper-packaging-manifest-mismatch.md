# Debug Review
Date: 2026-07-08

## Problem

`publish_release.py --part patch --execute` failed before release mutation while trying to bump Cautilus from `0.18.0` to `0.18.1`.
The failure came from the shared charness release helper expecting a legacy packaging manifest shape that this repo no longer uses.

## Correct Behavior

Release publication for this repo should use the repo-owned release surface to update `package.json`, `package-lock.json`, `.claude-plugin/marketplace.json`, and the packaged plugin manifests.
After the repo-owned prepare step commits a clean `0.18.1` surface, the shared helper should be used in `--publish-current` mode so it can still own gates, push/tag, GitHub release publication, and release artifact closeout.

## Observed Facts

- `python3 .../publish_release.py --repo-root . --part patch --execute` failed before changing the worktree.
- The failing command was the shared helper's `bump_version.py`.
- `bump_version.py` tried to write `data["claude"]["manifest"]["version"]` and `data["codex"]["manifest"]["version"]` inside `package.json`.
- This repo's package manifest does not have those nested keys.
- The repo-owned `npm run release:prepare -- 0.18.1` path updated the current versioned release files and passed `release:claim-freshness`.

## Reproduction

Run:

```bash
python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/release/scripts/publish_release.py --repo-root . --part patch --critique-artifact charness-artifacts/critique/2026-07-08-scenario-provenance-validation-fix-review.md --execute
```

Before the workaround, it exits with `KeyError: 'claude'` from the shared helper's `bump_version.py`.

## Candidate Causes

- The shared release helper still assumes an older combined package manifest shape.
- Cautilus has a repo-owned release prepare script that deliberately updates separate release files instead.
- The planner dry-run did not exercise the mutating bump helper deeply enough to catch this mismatch before execute.

## Hypothesis

- Falsifiable claim: the release failure is isolated to the shared helper's bump step, not to the Cautilus release surface itself.
- Disconfirmer: if `npm run release:prepare -- 0.18.1` or `publish_release.py --publish-current` fails for the same manifest-shape reason, the release surface itself is incompatible.

## Verification

- Result: confirmed for the first half.
- `npm run release:prepare -- 0.18.1` completed successfully and updated the versioned release files.
- `npm run release:prepare -- 0.18.1` also ran `release:claim-freshness` successfully.
- `publish_release.py --publish-current` still needs to be dry-run and executed after the release prepare commit.

## Root Cause

The root cause is a helper-level schema drift between the shared charness release bump script and Cautilus's current release manifest layout.
The product-owned release scripts are the correct bump authority for this repo.

## Invariant Proof

- Invariant: shared release publication can own irreversible publish boundaries, but this repo's versioned release surface must be bumped by repo-owned release scripts.
- Producer Proof: repo-owned `release:prepare` updated all declared versioned JSON files.
- Final-Consumer Proof: pending `publish_release.py --publish-current --execute` after the release prepare commit.
- Non-Claims: this does not fix the shared charness helper for other repos, and it does not prove public release visibility until the publish-current path completes.

## Detection Gap

- surface: shared release dry-run | what did not fire: dry-run did not execute the mutating bump helper | smallest change to fire it: add a preflight that checks whether the shared bump helper supports the adapter manifest shape.
- surface: Cautilus release workflow | what did not fire: no explicit note told operators to use repo-owned prepare before shared publish-current when shared bump is incompatible | smallest change to fire it: keep this debug artifact and prefer repo-owned prepare for this release.

## Sibling Search

- same layer: repo-owned `scripts/release/bump-version.mjs` | decision: use now | proof: `npm run release:prepare -- 0.18.1` succeeded.
- same layer: shared `publish_release.py --publish-current` | decision: use after release prepare commit | proof: pending dry-run and execute.
- abstraction up: release planner | decision: diagnostic-only | proof: planner correctly blocks dirty publish-current but did not catch the bump helper shape drift.

## Seam Risk

- Interrupt ID: release-helper-packaging-manifest-mismatch-2026-07-08
- Risk Class: low after repo-owned prepare
- Seam: shared charness release bump helper to Cautilus versioned release files
- Disproving Observation: publish-current fails with the same `KeyError: 'claude'`
- What Local Reasoning Cannot Prove: public GitHub release visibility
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: workaround selected
- Critique Required: no
- Next Step: release
- Handoff Artifact: none

## Prevention

Prefer `npm run release:prepare -- <version>` for Cautilus version bumps when the shared release helper's bump step assumes a nested manifest shape.
Use the shared helper for publish-current gates and irreversible publication boundaries after the repo-owned release surface is committed.
