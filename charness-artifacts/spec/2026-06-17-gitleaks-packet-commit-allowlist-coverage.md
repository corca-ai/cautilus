# Spec — gitleaks packet-commit allowlist coverage

## Problem

The `security · secret scan` gate (gitleaks) has now failed twice on the same seam:
Cautilus packets store their source commit as a bare 40-hex git SHA, the default `sourcegraph-access-token` rule matches any bare 40-hex token, and the `.gitleaks.toml` allowlist is the only thing exempting these metadata lines.
On 2026-06-11 the allowlist was generalized over the file *path* but kept the literal field name `gitCommit`; on 2026-06-17 the gold-set v2 schema introduced `packetGitCommit` (and siblings `currentGitCommit`, `claimsPacketGitCommit`), none of which the field-name-literal allowlist matched, so the gate went red again.
See `charness-artifacts/debug/debug-2026-06-17-gitleaks-packet-commit-field-name.md` (and its 2026-06-11 predecessor) for the root-cause record.

## Current Slice

The immediate gate is already fixed: the `.gitleaks.toml` line regex was generalized from `"gitCommit"` to `"[A-Za-z]*[Gg]it[Cc]ommit"`, which covers all four current field-name variants and any future `*GitCommit` field under the scoped packet paths.
This spec covers only the durable prevention so the class does not reopen a third time: a deterministic test that fails the instant a tracked packet introduces a commit-metadata field the allowlist does not cover.

## Fixed Decisions

- The allowlist stays narrowly scoped: a 40-hex git SHA, on a `*[Gg]it[Cc]ommit` field, under a packet path (`.cautilus/claims/`, `charness-artifacts/`, `charness-artifacts/debug/*.md`). The fix must not broaden gitleaks to ignore bare 40-hex tokens generally.
- Prevention is a deterministic unit test, not a new standing CI service or a pre-commit hook rewrite.

## Probe Questions

- Should the test assert allowlist coverage by re-running gitleaks over the working tree, or by statically enumerating tracked `*[Gg]it[Cc]ommit` 40-hex fields and checking each against the parsed `.gitleaks.toml` paths+regexes?
  Static enumeration is cheaper and does not depend on gitleaks being installed in the test environment; prefer it unless it proves too brittle against the TOML regex semantics.
- Does any tracked packet already store a commit SHA under a field whose name does not end in `gitCommit`/`GitCommit` (e.g. `sourceCommit`, `revision`, `sha`)?
  Today's enumeration found none; if one appears, the field-name generalization alone will not cover it and the test should fail loudly rather than the scan discovering it sessions later.

## Deferred Decisions

- Whether to additionally move the secret scan into the pre-commit hook (not just pre-push / verify) so a packet that introduces an uncovered field fails in the same commit that creates it.
  The coverage test fires earlier and more cheaply, so the hook change is deferred unless the test proves insufficient.

## Non-Goals

- Rewriting the gitleaks rule set or disabling the `sourcegraph-access-token` rule.
- Editing git history to remove the already-committed metadata blobs (they are not secrets).

## Success Criteria

- A deterministic test fails when a tracked packet field matching a 40-hex `*[Gg]it[Cc]ommit` shape has no covering `.gitleaks.toml` allowlist entry.
- The test passes on the current tree (all four field-name variants covered).
- `npm run security:secrets` stays `no leaks found` and the test runs without requiring gitleaks to be installed.

## Acceptance Checks

- Add a fixture/unit test under the node test surface that enumerates tracked `*[Gg]it[Cc]ommit` 40-hex fields and asserts each is covered by a parsed allowlist (path + line regex). Negative case: a synthetic uncovered field name makes the test fail.
- `npm run security:secrets` → `no leaks found`.

## Critique

Recorded against the debug closeout (`debug-2026-06-17-gitleaks-packet-commit-field-name.md`) and the same slice's delegated fresh-eye review.
Repeated-symptom interrupt consumed here: the durable prevention is moved out of one-off allowlist edits into a coverage test, which is the smallest change that would have fired the 2026-06-17 recurrence in the slice that introduced `packetGitCommit`.

## Canonical Artifact

This file. The root-cause record is the debug artifact above.

## First Implementation Slice

Author the allowlist-coverage test (static enumeration of tracked `*[Gg]it[Cc]ommit` 40-hex fields vs parsed `.gitleaks.toml`), wire it into the node test suite, and confirm it passes on the current tree and fails on a synthetic uncovered field.
This is a small, isolated slice and does not block the item-3 README/docs rewrite that surfaced the recurrence.
