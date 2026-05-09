# Review Feedback Errcheck Debug
Date: 2026-05-09

## Problem

`npm run verify` failed during `lint:go` after adding `cautilus review feedback build`.

## Correct Behavior

Given a new Go CLI handler, when `npm run lint:go` runs, then all CLI stdout and stderr writes should satisfy the repo's errcheck policy or be explicitly ignored like adjacent handlers.

## Observed Facts

- `npm run verify` reached `lint:go` and failed on `internal/app/review_feedback_command.go`.
- The exact errors were:
  - `internal/app/review_feedback_command.go:51:14: Error return value of fmt.Fprintf is not checked`
  - `internal/app/review_feedback_command.go:56:14: Error return value of fmt.Fprintf is not checked`
  - `internal/app/review_feedback_command.go:60:14: Error return value of fmt.Fprintf is not checked`
- Adjacent CLI handlers either use `_, _ = fmt.Fprintf(...)` or carry a scoped `//nolint:errcheck` comment.
- The new handler used plain `fmt.Fprintf(...)`.

## Reproduction

Run:

```bash
npm run verify
```

The failure appears during the `npm run lint:go` phase.

## Candidate Causes

- The new handler did not follow the repo's explicit ignored-write pattern for CLI output.
- The new file lacked the broader scoped `//nolint:errcheck` comment used by some older handlers.
- The lint configuration changed after the file was written.

## Hypothesis

If the three CLI output writes in `handleReviewFeedbackBuild` are changed to `_, _ = fmt.Fprintf(...)`, then `lint:go` should stop reporting errcheck failures without changing runtime behavior.

## Verification

- Changed the three `fmt.Fprintf` calls in `handleReviewFeedbackBuild` to `_, _ = fmt.Fprintf(...)`.
- `npm run lint:go` passed with `0 issues`.
- `validate_debug_artifact.py --repo-root .` passed for `charness-artifacts/debug/latest.md`.

## Root Cause

The new handler copied the common CLI output shape but missed the repo's explicit errcheck-ignore convention.

## Seam Risk

- Interrupt ID: review-feedback-errcheck
- Risk Class: none
- Seam: local Go lint policy
- Disproving Observation: Adjacent handlers already demonstrate the accepted ignored-write pattern.
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Use `_, _ = fmt.Fprintf(...)` for best-effort CLI output writes in new handlers, or add a scoped `//nolint:errcheck` only when many adjacent writes make that clearer.
