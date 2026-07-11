# Debug Review
Date: 2026-07-11

## Problem

The Node active-run resolver treats whitespace-only `outputDir` and `CAUTILUS_RUN_DIR` values as real paths, while the Go implementation trims them as absent; Node can create or target a directory whose name is only spaces.

## Correct Behavior

Given a whitespace-only explicit output or active-run environment value, when Cautilus resolves a run directory, then both language implementations should treat the value as absent and continue through the documented precedence to active or auto materialization.

## Observed Facts

- Node `resolveRunDir` checks raw `outputDir` and environment string truthiness.
- Node `readActiveRunDir` also checks raw truthiness before `resolve`.
- Go checks `strings.TrimSpace` for all three branches.
- The active-run contract calls these values paths and documents explicit, active, then auto precedence; it does not describe whitespace directory names.

## Reproduction

- In a temporary cwd, call Node `resolveRunDir({outputDir:"   ", env:{}})`; current code returns `source:"explicit"` and creates a directory named three spaces.
- Focused Node tests for whitespace output and env values should fail on the old implementation and align with existing Go behavior after repair.

## Candidate Causes

- Whitespace was intentionally accepted as a legal filesystem path segment.
- Node path selection copied JavaScript truthiness while Go later added trim normalization.
- Only normal non-empty and missing values were covered by active-run tests.
- CLI parsing was expected to reject whitespace before the runtime helper.

## Hypothesis

- Falsifiable claim: the Node implementation lacks the trim normalization already present in Go; whitespace tests will select explicit/active paths on old code, and normalizing once per branch will restore auto fallback without changing non-empty precedence | disconfirmer: run focused whitespace cases against the current Node helper before repair.

## Verification

- confirmed — both focused tests failed against raw truthiness checks, then all 18 active-run tests passed after shared optional-path normalization.

## Root Cause

The reusable Node helper used JavaScript truthiness as path-presence validation in three branches, while the Go sibling used trimmed emptiness.
That divergence let all-whitespace values bypass the documented optional-path fallback and reach filesystem resolution.

## Invariant Proof

- Invariant: Node path-selection branches use trimmed emptiness consistently with Go for absence detection while preserving Node's pre-existing non-empty path text for resolution.
- Producer Proof: focused tests assert `readActiveRunDir` returns null and both resolver branches select `source:auto` for whitespace-only values.
- Final-Consumer Proof: the resolver test asserts the expected auto run directory and proves no space-only directory is created; production consumers reuse this helper.
- Interface-Shape Sibling Scan: explicit output and active env branches share the same truthiness mistake; Go is the safe contract sibling.
- Non-Claims: parity is claimed only for all-whitespace absence; Go's surrounding-space env-path identity differs, and this fix does not reject internal whitespace or change label normalization.

## Detection Gap

- `scripts/agent-runtime/active-run.test.mjs` | precedence tests covered null and ordinary paths but not whitespace-only values | add output/env whitespace cases that assert auto fallback and no space-only directory.

## Sibling Search

- Mental model: JavaScript truthiness is equivalent to normalized optional path presence.
- same layer axis: `outputDir`, `resolveRunDir` env branch, and `readActiveRunDir` env branch | decision: same bug, fix now | proof: static truthiness checks and temporary-directory reproduction.
- abstraction up axis: optional path normalization in Node runtime helpers | decision: same class, diagnostic-only for this slice | proof: search is limited to active-run precedence; no action needed because other helpers validate through their owning parsers rather than this reusable optional-path API.
- specialization down axis: space-only directory creation | decision: same bug, fix now | proof: direct filesystem observation in a disposable cwd.
- mental-model axis: valid paths containing internal or surrounding spaces | decision: intentional plain-text or non-rendering boundary | proof: only all-whitespace values are absent; non-empty path content remains unchanged.
- cross-file: `internal/runtime/active_run.go` provides the established trimmed behavior used as parity evidence.

## Seam Risk

- Interrupt ID: node-active-run-whitespace-path-presence
- Risk Class: none
- Seam: optional CLI/runtime path input to filesystem materialization
- Disproving Observation: focused Node cases already treat all-whitespace output/env values as absent.
- What Local Reasoning Cannot Prove: host shells that intentionally pass a space-only directory as a desired path.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Normalize optional path presence explicitly in the reusable Node active-run helper and pin cross-language precedence with focused filesystem tests.
