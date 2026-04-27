# Debug Review: first-scan audit kind frontdoor
Date: 2026-04-27

## Problem

The first live `dev / skill` first-scan episode runs failed before reaching the agent runtime because the skill-case normalizer rejected the new `auditKind: cautilus_first_scan_flow`.

## Correct Behavior

Given a `surface=dev, preset=skill` fixture declares `turns` with `auditKind: cautilus_first_scan_flow`, when `cautilus eval test` translates the fixture into skill test cases, then both the JavaScript and Go normalizers should accept that audit kind and route it to the first-scan audit.

## Observed Facts

- The new first-scan fixture and JavaScript runner had already been wired to `auditFirstScanFlowLogText`.
- The first live Codex and Claude eval attempts failed during fixture normalization, before any `$cautilus` episode was launched.
- The Go-side normalizer still accepted only `cautilus_refresh_flow`.
- After adding `cautilus_first_scan_flow` to `internal/runtime/skill_test_cases.go`, `go test ./internal/runtime` passed and both live evals returned `recommendation=accept-now`.

## Reproduction

Before the fix:

```bash
npm run dogfood:cautilus-first-scan-flow:eval:codex
npm run dogfood:cautilus-first-scan-flow:eval:claude
```

Both commands stopped before agent execution because `auditKind` validation rejected the fixture.

## Candidate Causes

- The fixture may have misspelled the audit kind.
- The JavaScript episode runner may have failed to dispatch the new audit kind.
- The Go runtime normalizer may have had a duplicate enum gate that was not updated with the JavaScript gate.

## Hypothesis

If the Go normalizer accepts the same audit kinds as the JavaScript suite normalizer, then `cautilus eval test` should translate the first-scan fixture and reach the configured Codex and Claude episode runners.

## Verification

Updated `internal/runtime/skill_test_cases.go` to accept `cautilus_first_scan_flow`.
Ran:

```bash
go test ./internal/runtime
npm run dogfood:cautilus-first-scan-flow:eval:codex
npm run dogfood:cautilus-first-scan-flow:eval:claude
```

Both live eval runs returned `recommendation=accept-now`, `passed=1`, `failed=0`.

## Root Cause

`auditKind` was validated in two places.
The JavaScript test-case suite had been extended for the new audit, but the Go runtime front door still had a hard-coded single-value enum from the first refresh-flow slice.

## Seam Risk

- Interrupt ID: first-scan-audit-kind-frontdoor
- Risk Class: none
- Seam: duplicated fixture enum validation across JavaScript runner code and Go runtime translation
- Disproving Observation: JavaScript unit coverage passed while the product CLI rejected the fixture before execution
- What Local Reasoning Cannot Prove: whether future audit kinds will be added in only one validator again
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep any new `auditKind` addition paired across `scripts/agent-runtime/skill-test-case-suite.mjs`, episode runner dispatch, and `internal/runtime/skill_test_cases.go`.
For future audit kinds, run at least one `cautilus eval test` path before assuming runner-level unit tests prove the CLI front door.
