# Debug Review
Date: 2026-07-11

## Problem

Claim-review `excerptChars` truncation uses Go byte length and slicing, so a multilingual source excerpt can be cut inside a UTF-8 code point and enter the review packet as invalid text.

## Correct Behavior

Given a source excerpt with multilingual text and a positive `ExcerptChars` limit, when Cautilus builds a claim-review input, then the emitted excerpt must contain at most that many Unicode code points, remain valid UTF-8, and preserve the exact source prefix.

## Observed Facts

- `truncateReviewSourceRefs` compares `len(excerpt)` and slices `excerpt[:excerptChars]`.
- The CLI flag and packet budget both call the unit `chars` rather than bytes.
- The existing cluster test uses ASCII text only and does not inspect the truncated excerpt.
- The earlier review-output incident proved the same byte/code-point mismatch can become `U+FFFD` after JSON processing.

## Reproduction

- Add a focused package test with excerpt `"a가나"` and `excerptChars=2`; the current function returns the bytes `a` plus the first byte of `가`, so `utf8.ValidString` is false instead of returning `"a가"`.

## Candidate Causes

- The `chars` field was implemented as a byte budget intentionally but the public name is imprecise.
- The code inherited ASCII-only assumptions from claim source fixtures.
- Go string slicing was used without recognizing that source documents can contain non-ASCII text.
- A downstream JSON encoder might sanitize invalid UTF-8 and make the defect invisible in existing packet comparisons.

## Hypothesis

- Falsifiable claim: `truncateReviewSourceRefs` measures bytes while the contract exposes characters; a focused multilingual boundary test will fail validity and exact-prefix assertions, and rune-based truncation will make both pass without changing ASCII output | disconfirmer: run that focused test against the current implementation before repair.

## Verification

- confirmed — the focused test failed on the old implementation with `expected valid UTF-8 excerpt, got "a\\xea"` and passes after rune-based truncation.

## Root Cause

The claim-review producer interpreted the operator-facing `chars` budget as bytes by using Go string length and byte slicing.
ASCII-only fixtures concealed the mismatch, and JSON sanitization could replace the split code point rather than preserve the intended prefix.

## Invariant Proof

- Invariant: every claim-review source excerpt is a valid UTF-8 prefix bounded by Unicode code points.
- Producer Proof: `TestTruncateReviewSourceRefsPreservesUnicodePrefix` asserts valid UTF-8 and the exact `"a가"` prefix at a two-code-point boundary.
- Final-Consumer Proof: the same test marshals and unmarshals the rendered source refs and asserts the exact prefix survives the JSON packet boundary.
- Interface-Shape Sibling Scan: output-under-test and scenario-conversation truncation already use rune/code-point-safe helpers; claim-review source refs are the divergent sibling.
- Non-Claims: code-point safety does not promise grapheme preservation, token budgeting, or a fixed byte budget.

## Detection Gap

- `internal/runtime/claim_discovery_test.go` | ASCII-only budget fixtures did not fire on a byte/code-point mismatch | add one multilingual exact-prefix and validity case at the owning helper or packet boundary.

## Sibling Search

- Mental model: a Go string length named `chars` measures user-visible characters.
- same layer axis: `internal/runtime/claim_discovery.go` source-ref excerpt truncation | decision: same bug, fix now | proof: the focused test failed against the old byte slice and passes after repair.
- abstraction up axis: bounded prompt/review excerpts across runtime producers | decision: same class, diagnostic-only for this slice | proof: review output and scenario-conversation helpers already convert to runes; no-action reason: those siblings already carry code-point-safe implementations and tests.
- specialization down axis: claim-review packet JSON serialization | decision: same bug, fix now | proof: invalid Go strings are sanitized by JSON and can lose the intended source prefix.
- mental-model axis: grapheme/token/byte budgets | decision: intentional plain-text or non-rendering boundary | proof: current contract names chars and no stronger unit.
- cross-file: `internal/runtime/review.go` and `internal/runtime/scenario_conversation_review.go` are safe sibling implementations of the same bounded-text pattern.

## Seam Risk

- Interrupt ID: claim-review-excerpt-unicode-boundary
- Risk Class: none
- Seam: source document text to claim-review JSON packet
- Disproving Observation: the current implementation passes exact multilingual prefix and UTF-8 validity tests.
- What Local Reasoning Cannot Prove: grapheme rendering or downstream model token cost.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Make the owning producer code-point-safe, add exact boundary regression proof, and retain the bounded-text sibling scan in this artifact.
