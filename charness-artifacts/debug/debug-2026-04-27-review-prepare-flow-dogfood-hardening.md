# Debug Review: review-prepare flow dogfood hardening
Date: 2026-04-27

## Problem

The first live `cautilus-review-prepare-flow` proof did the intended work, but the eval initially rejected and a parallel rerun exposed a transient Git config lock in the disposable worktree setup.

## Correct Behavior

Given the three-turn episode `$cautilus`, `1`, `1`, when Codex or Claude runs the bundled skill in a disposable candidate worktree, then the agent should complete first scan, prepare deterministic claim review input, stop before reviewer launch, and the dogfood wrapper should be safe to run for Codex and Claude without sharing writable Git config state.

## Observed Facts

- The first live Codex and Claude transcripts ran `agent status`, first `claim discover`, `claim show`, and `claim review prepare-input`.
- Neither runtime ran `claim review apply-result`, `claim plan-evals`, `eval test`, product edits, or commits.
- The audit initially rejected both transcripts because it did not recognize natural boundary language such as `Did not launch reviewers`, `LLM 호출 없음`, and `reviewer launch는 패킷 경계에서 정지`.
- A parallel rerun failed one wrapper before agent execution with `error: could not lock config file /home/hwidong/codes/cautilus/.git/config: File exists`.
- The wrapper created Git worktrees and then ran plain `git -C <candidate> config user.*`, which writes to the common repo config for linked worktrees.

## Reproduction

Before the fixes:

```bash
npm run dogfood:cautilus-review-prepare-flow:eval:codex
npm run dogfood:cautilus-review-prepare-flow:eval:claude
```

The first failure mode produced audit finding `missing_no_reviewer_launch_boundary`.
The parallel rerun failure mode stopped with the Git config lock error before the agent episode.

## Candidate Causes

- The agent may have overrun into actual reviewer launch or eval planning.
- The audit may have been too narrow for equivalent English and Korean boundary wording.
- The disposable worktree setup may have shared mutable Git config when run concurrently.

## Hypothesis

If the audit accepts equivalent reviewer-boundary wording and the wrapper stops writing `user.name` / `user.email` to linked worktree config, then the same three-turn review-prepare episode should return `accept-now` under both Codex and Claude.

## Verification

Updated `audit-cautilus-review-prepare-flow-log.mjs` to accept `Did not launch reviewers`, `reviewer launch` packet-boundary wording, and Korean `LLM 호출 없음` variants.
Removed the unnecessary `git config user.*` writes from `scripts/run-self-dogfood-skill-refresh-flow-eval.mjs`; the audited flows do not commit from the candidate worktree.
Ran:

```bash
node --test scripts/agent-runtime/audit-cautilus-review-prepare-flow-log.test.mjs
npm run dogfood:cautilus-review-prepare-flow:eval:codex
npm run dogfood:cautilus-review-prepare-flow:eval:claude
```

Both live eval runs returned `recommendation=accept-now`, `passed=1`, `failed=0`.

## Root Cause

The behavior contract was stronger than the first audit vocabulary, so valid transcripts were rejected.
Separately, the wrapper carried a leftover commit-enabling setup step from earlier dogfood flows even though these audited episodes explicitly forbid commits; linked worktrees made that shared config write unsafe under parallel runtime proof.

## Seam Risk

- Interrupt ID: review-prepare-flow-dogfood-hardening
- Risk Class: none
- Seam: audit vocabulary and disposable Git worktree setup for live multi-runtime dogfood
- Disproving Observation: correct agent behavior still rejected until the audit recognized equivalent boundary wording; parallel dogfood could fail before agent execution due shared Git config state
- What Local Reasoning Cannot Prove: whether future reviewer-boundary wording will stay understandable without more audit variants
- Generalization Pressure: monitor

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep live episode audits focused on behavior and coordinator-facing decision boundaries, but accept equivalent Korean and English phrasing when the boundary is clear.
Do not configure shared Git state inside disposable linked worktrees unless a flow actually needs commits; if a future committed candidate flow needs identity, use a worktree-local strategy and prove parallel runtime execution.
