# Debug Review: refresh plan internal language
Date: 2026-04-27

## Problem

A fresh `$cautilus` session correctly selected the stale claim refresh branch, but its response used internal terms such as `refresh_claims_from_diff`, `stale claim packet`, `claimPlan`, and raw `jq` field exploration instead of explaining the result as a coordinator-facing choice.

## Correct Behavior

Given a saved claim map was produced from an older checkout, when an agent runs the refresh-plan branch, then Cautilus should make the stale state explicit, record a deterministic comparison, explain what did and did not change, and present the next choices in user-facing language before any review or eval planning begins.

## Observed Facts

- Session `019dccff-2fbc-7071-ab92-cd3cecd342b3` ran `cautilus agent status --repo-root . --json`.
- `agent status` offered `refresh_claims_from_diff` first, which was the correct branch because `.cautilus/claims/latest.json` points at an older commit.
- The session ran `cautilus claim discover --repo-root . --previous .cautilus/claims/latest.json --refresh-plan --output .cautilus/claims/refresh-plan.json`.
- The session did not launch reviewers, plan evals, edit product code, or update `.cautilus/claims/latest.json`.
- It committed `.cautilus/claims/refresh-plan.json` as `7439e87 Record claim refresh plan`, which is consistent with this repo's artifact commit policy.
- The agent guessed non-existent refresh-plan fields with `jq`, then inspected raw keys and rebuilt a summary from internal `claimPlan` lifecycle counts.
- The resulting user response was mechanically accurate but too product-internal for a human coordinator.
- Follow-up session `019dcd4c-56c8-7382-9068-e231aa52f9f1` improved materially: it read `refreshSummary`, explained that the saved claim map was not updated, avoided review and eval planning, and committed only the refresh-plan artifact.
- That follow-up still used the internal branch id as the numbered option title and said it would rerun `agent status` before executing the selected branch, but the command log shows only the initial `agent status` call.

## Reproduction

Run from this checkout while `.cautilus/claims/latest.json` records an older `gitCommit`:

```bash
./bin/cautilus agent status --repo-root . --json
./bin/cautilus claim discover --repo-root . --previous .cautilus/claims/latest.json --refresh-plan --output /tmp/cautilus-refresh-plan.json
```

Before this fix, `/tmp/cautilus-refresh-plan.json` had raw `changedSources` and `claimPlan`, but no official coordinator-facing summary.

## Candidate Causes

- The binary emitted the deterministic data needed for refresh planning but did not include a product-owned summary for agents to read first.
- The bundled skill told agents to prefer product-owned summaries but did not name a refresh-plan summary because none existed.
- The branch labels exposed implementation IDs and packet terms before user-facing labels.
- Session log review used `jq` heavily, making the same weak pattern look acceptable inside the workflow being tested.

## Hypothesis

If the refresh-plan packet includes `refreshSummary` with plain status, counts, source hotspots, and next actions, and if the skill tells agents to report that summary before raw packet fields, then future `$cautilus` sessions can explain the refresh branch as "compare and prepare the saved claim map" rather than as internal packet manipulation.

## Verification

Added unit test coverage for `refreshSummary` in `cautilus.claim_refresh_plan.v1`.
Confirmed a local refresh-plan command now emits `refreshSummary` with `changedSourceCount`, `changedClaimCount`, `carriedForwardClaimCount`, changed claim source hotspots, and plain next actions.
Ran `go test ./internal/runtime ./internal/app`.
Ran `npm run lint:specs` and `npm run lint:skill-disclosure`.
Ran `./bin/cautilus doctor --repo-root . --scope agent-surface`.
Ran `npm run dogfood:self`, which returned `recommendation=accept-now` with one passed case.
Ran `npm run verify`.
Ran `npm run hooks:check`.
After the follow-up session review, tightened the bundled skill so no-input branch menus present labels before internal ids and branch execution confirmation must be backed by a fresh observed status or state-path check.
Added `dogfood:cautilus-refresh-flow` to run a real two-turn Codex session over a disposable candidate worktree.
The first live run proved the new audit path works and isolated the remaining failure to a missing branch recheck after the user selected `1`.
Tightened the skill again so the next shell command after a numbered branch selection should be `agent status`.
The next live run isolated two more automation defects: `codex exec resume` was launched from the source repo instead of the candidate worktree, and the agent said it would read `refreshSummary` but rebuilt counts from raw `changedSources` and `claimPlan`.
The runner now resumes from the candidate worktree, and the skill explicitly requires direct `.refreshSummary` inspection instead of raw-field reconstruction.
After another live run, the only remaining failure was the audit's overstrict second-status requirement.
For refresh-plan-only work, proceeding from the immediately preceding orientation is acceptable because it writes a separate plan and does not update the saved claim map.
The audit now records that as a warning instead of a failure, while the skill still requires a fresh status before branches that overwrite saved state, launch review, plan evals, edit files, or commit.

## Root Cause

Refresh planning had a deterministic packet but no agent-facing view model.
That forced each agent to infer coordinator language from internal fields, which produced correct mechanics but weak product communication.

## Seam Risk

- Interrupt ID: refresh-plan-internal-language
- Risk Class: none
- Seam: binary packet output to bundled-skill coordinator response
- Disproving Observation: a fresh session performed the right branch but still explained it through internal field names and ad hoc JSON inspection
- What Local Reasoning Cannot Prove: whether every future agent will choose good language without a product-owned summary field
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Put coordinator-facing summaries into packets for workflow decision points.
Use skill text to route agents to those summaries before raw packet inspection, keep internal branch ids as references rather than the first thing a user sees, and require branch execution claims to match actual observed commands.
Automate the repeated `$cautilus` plus `1` dogfood loop so a maintainer does not have to act as the regression runner.
