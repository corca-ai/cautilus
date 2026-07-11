# Debug Review: Review excerpt Unicode boundary
Date: 2026-07-11

## Problem

The bounded review excerpt claims a 12,000-character limit but the Go runtime truncates and counts bytes, which can create invalid UTF-8 and misreport `charCount` for multilingual output.

## Correct Behavior

Given a JSON output value containing non-ASCII text, when Cautilus extracts and truncates it for bounded review, then the excerpt remains valid Unicode, contains at most 12,000 code points, and reports the full code-point count consistently across the Go and Node helper surfaces.

## Observed Facts

- `internal/runtime/review.go` uses `len(text)` and `text[:outputUnderTestTextLimit]`, both byte-based for Go strings.
- The rendered prompt labels the value `extracted chars` and says the excerpt is truncated to 12,000 chars.
- The sibling Node helper uses JavaScript `length` and `slice`, which count UTF-16 code units and can split a surrogate pair.
- Web search was skipped because the failure is reproduced directly from the local language/runtime operations used by both implementations; no unstable external fact is needed.

## Reproduction

- `/tmp/repro-review-utf8.go` builds `"a" + strings.Repeat("가", 4000)` and applies the current 12,000-byte slice.
  It reports `sourceBytes=12001 sourceRunes=4001 excerptBytes=12000 excerptRunes=4002 validUTF8=false decodedLastRune=U+FFFD`.

## Candidate Causes

- The limit was intentionally byte-based but user-facing fields and prose were mislabeled as characters.
- The implementation assumed Go string indices and `len` count Unicode characters.
- JSON marshaling or file decoding introduced the replacement character independently of truncation.

## Hypothesis

- The defect is direct byte-boundary truncation: if the limit is applied to `[]rune` instead, the same input remains valid UTF-8, reports 4,001 characters, and does not create `U+FFFD`.
  Disconfirmer: reproduce the current slice before any JSON file or prompt renderer is involved.

## Verification

- confirmed — the smallest reproduction creates invalid UTF-8 before JSON serialization; JSON serialization only makes the corruption visible as a replacement rune.

## Root Cause

The shared contract says characters, but the Go implementation used byte-oriented string length and slicing while the Node sibling used UTF-16 code-unit semantics.
Neither implementation defined or tested a cross-language Unicode code-point boundary.

## Invariant Proof

- Invariant: every review output-text extractor counts and truncates Unicode code points, never encoded bytes or UTF-16 code units.
- Producer Proof: focused Go and Node tests will feed multibyte text through each extractor and assert the full count, bounded excerpt, and valid terminal code point.
- Final-Consumer Proof: a Go scenario-to-render test will assert the rendered review prompt carries the intact multilingual excerpt and correct count.
- Interface-Shape Sibling Scan: Go runtime and Node agent-runtime helper are both active producers of the same `outputUnderTestText` shape and must change together.
- Non-Claims: code-point safety does not guarantee grapheme-cluster preservation, Markdown-fence isolation, or a fixed byte-size prompt budget.

## Detection Gap

- review prompt tests | existing Go coverage only exercised packet collection and Node tests used ASCII fixtures, so no cross-language Unicode boundary could fail | add focused multibyte boundary tests to both existing suites.

## Sibling Search

- Mental model: string length equals user-visible character count across Go and JavaScript.
- Go axis: `internal/runtime/review.go` | decision: fix in current slice | proof: invalid UTF-8 reproduction.
- Node axis: `scripts/agent-runtime/build-review-prompt-input.mjs` | decision: fix in current slice | proof: `length`/`slice` use UTF-16 code units and share the same packet field.
- renderer axis: Go and Node renderers | decision: keep | proof: both consume the corrected count/text without additional truncation.
- cross-file: `scripts/agent-runtime/review-prompt-flow.test.mjs` is the sibling regression surface for the Node producer.

## Seam Risk

- Interrupt ID: review-excerpt-unicode-boundary
- Risk Class: none
- Seam: Go string bytes and JavaScript UTF-16 code units to a shared review packet meaning
- Disproving Observation: both implementations currently disagree with Unicode code-point semantics.
- What Local Reasoning Cannot Prove: whether downstream providers prefer a byte/token budget; this slice preserves the explicitly documented character contract.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Define bounded human-text fields in Unicode code points at cross-language packet seams and keep one non-ASCII boundary fixture in every active producer implementation.
