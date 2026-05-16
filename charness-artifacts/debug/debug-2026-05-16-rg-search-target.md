# RG Search Target Debug
Date: 2026-05-16

## Problem

While selecting the next deterministic claim proof, an exploratory `rg` command failed because it included a non-existent `test` search path.

## Correct Behavior

Given the repo has `internal/`, `scripts/`, `docs/`, `fixtures/`, and checked-in claim packets but no top-level `test/` directory, when searching for review packet coverage, then the search should only name existing paths or use `rg` from repo root with glob filters.

## Observed Facts

- The failing command included `rg -n ... scripts internal docs test tests fixtures .cautilus/claims ...`.
- The exact stderr included `rg: test: No such file or directory (os error 2)`.
- A follow-up search over existing paths found review packet coverage in `internal/app/cli_smoke_test.go`, `internal/runtime/review.go`, `internal/runtime/review_html_test.go`, `scripts/agent-runtime/build-review-packet.test.mjs`, and `scripts/agent-runtime/review-prompt-flow.test.mjs`.
- `git status` was clean before the search, so the failure did not come from generated file drift.

## Reproduction

```bash
rg -n "review_packet" scripts internal docs test tests fixtures .cautilus/claims -g '*.mjs' -g '*.go' -g '*.md' -g '*.json'
```

The command fails because `test` is not an existing top-level path in this repo.

## Candidate Causes

- The command copied a generic search-path habit from repos that have a top-level `test/` directory.
- The search should have used `rg` from repo root with globs instead of enumerating uncertain directories.
- A real checkout or generated-state problem could have removed an expected test directory.

## Hypothesis

If the failure is only a bad search target, then searching existing repo paths should return the intended review-packet coverage without changing code or generated state.

## Verification

- `rg --files charness-artifacts/debug` showed existing debug memory, including the earlier README runtime debug record.
- A follow-up `rg` over existing paths returned review packet tests and implementation files.
- No product code or claim state needed to change for the search to work.

## Root Cause

The exploratory search named a top-level `test` directory that this repo does not have.
This was an operator command construction error, not a Cautilus runtime or claim-state failure.

## Detection Gap

- exploratory search command | no preflight checked that every enumerated path existed | prefer repo-root `rg` with globs or first confirm paths with `rg --files` when using hand-written path lists.

## Sibling Search

- Mental model: common repo directory names are safe search roots.
- Search axis: future broad searches should avoid speculative directory lists.
- Workflow axis: incidental command errors should stay out of product evidence unless they affect the proof.
- Debug axis: keep this as a lightweight debug record so later sessions do not misread the failure as a repo regression.

## Seam Risk

- Interrupt ID: rg-search-target
- Risk Class: none
- Seam: local operator command construction
- Disproving Observation: the same search intent worked when limited to existing repo paths.
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Use `rg --files` or repo-root `rg` with globs before adding speculative directory names to broad searches.

## Related Prior Incidents

- `debug-2026-05-04-review-input-jq-shape-misread.md`: prior operator-side read/query mistakes during claim workflow exploration.
