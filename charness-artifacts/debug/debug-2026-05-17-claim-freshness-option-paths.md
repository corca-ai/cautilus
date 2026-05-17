# Debug Review
Date: 2026-05-17

## Problem

Subagent critique found that release claim freshness accepted `--claims` and `--status` options but still validated only the default generated claim projection path.

## Correct Behavior

Given an operator selects a claim packet and status snapshot, when release claim freshness runs, then it should validate those selected files exist, that the selected status is fresh for the selected claim packet, and that the selected packet commit is reachable from `HEAD`.

## Observed Facts

`check-claim-freshness.mjs` ran `npm run claims:evidence-state:check` without forwarding `--claims` or `--status`.
`packetGitCommit` returned `null` when the selected status file was missing.
The CLI could report `fresh` for a missing selected claim packet or status snapshot when the default generated projection was clean.

## Reproduction

Run `node scripts/release/check-claim-freshness.mjs --claims /tmp/missing-claims.json --status .cautilus/claims/status-summary.json`.
Before the fix, the command could pass because the default package script checked the repo-default files instead of the selected claim packet.

## Candidate Causes

- The release helper was promoted from a default-path preflight but kept general `--claims` and `--status` flags.
- The default generated projection check was treated as a substitute for selected file validation.
- Missing selected status was interpreted as absence of commit metadata rather than a failed preflight.

## Hypothesis

If release claim freshness validates selected file existence, regenerates status from the selected claims packet, compares it with the selected status snapshot, and only runs the default projection check for default paths, then custom paths cannot be reported fresh by accident.

## Verification

The focused release claim freshness tests pass, including missing selected claim/status files, stale selected status snapshots, HEAD-drift-only status equivalence, and default projection failure coverage.

## Root Cause

The release freshness helper mixed two responsibilities: default generated projection freshness and selected claim/status pair freshness.
The selected pair was not checked independently.

## Detection Gap

- Option-path tests | covered CLI parsing but not selected file existence | add missing selected claims/status assertions.
- Freshness comparison | delegated to a default package script | regenerate selected status and compare it directly.
- Repair guidance | assumed default paths | render custom status-refresh guidance for custom selections.

## Sibling Search

- `render-claim-evidence-state.mjs` already supports `--claims` and `--status` and fails missing generated outputs in check mode.
- `render-claim-status-report.mjs` treats some inputs as optional because the report can render partial context; that is not release-preflight behavior.
- The pre-push and CI paths use default claim state and remain covered by `npm run verify`.

## Seam Risk

- Interrupt ID: claim-freshness-option-paths
- Risk Class: none
- Seam: release claim freshness CLI option handling
- Disproving Observation: a missing selected claim packet or selected status snapshot exits 0.
- What Local Reasoning Cannot Prove: whether external operators use custom claim/status paths in release automation.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Release preflight helpers that expose path options should validate the selected paths directly instead of relying on default-path package scripts.
