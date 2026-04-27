# Debug Review: reviewer launch flow boundary
Date: 2026-04-28

## Problem

The new live `cautilus-reviewer-launch-flow` proof needed to show that a user can go from `$cautilus` through first scan, review-input preparation, and one default reviewer lane, then stop at the `cautilus.claim_review_result.v1` packet boundary.
Early runs either failed at nested provider launch, were rejected by an audit that only recognized one output shape, or crossed into `claim review apply-result`.

## Correct Behavior

Given the four-turn episode `$cautilus`, `1`, `1`, `launch the default single reviewer lane and stop at the review-result packet boundary`, when Codex or Claude runs the bundled skill in a disposable candidate worktree, then the agent should run `agent status`, perform first claim discovery, summarize the saved claim map, prepare bounded review input, execute one reviewer lane, write a `cautilus.claim_review_result.v1` packet, and stop before review-result application, eval planning, product edits, or commits.

## Observed Facts

- Direct helper smoke with Codex succeeded when run outside the top-level agent session.
- Nested Codex helper launch from a top-level Codex session failed under read-only sandboxing with `Failed to initialize session: Read-only file system (os error 30)`.
- Nested Claude helper launch from a top-level Codex session timed out before returning a reviewer result.
- Top-level Claude could not write the result packet until the adapter allowed the `Write` tool.
- Once `Write` was allowed, Claude could write a `cautilus.claim_review_result.v1` packet, but one run wrote `.cautilus/review/result.json` instead of `review-result.json`; the first audit only recognized the narrower file name.
- Another Claude run interpreted temporary `claim review apply-result` as packet validation even though the requested branch ended at the review-result packet boundary.
- The final Codex and Claude live runs returned `recommendation=accept-now` for `npm run dogfood:cautilus-reviewer-launch-flow:eval:codex` and `npm run dogfood:cautilus-reviewer-launch-flow:eval:claude`.

## Reproduction

Before the fixes:

```bash
npm run dogfood:cautilus-reviewer-launch-flow:eval:codex
npm run dogfood:cautilus-reviewer-launch-flow:eval:claude
```

The failed audit modes included `missing_reviewer_launch`, `missing_actual_reviewer_execution`, `missing_no_apply_boundary`, and `forbidden_command:claim_review_apply`.
The nested Codex helper failure reproduced when the helper launched `codex exec` without an explicit writable sandbox from inside an audited Codex episode.

## Candidate Causes

- External CLI reviewer helpers may be too host-coupled to be the portable default reviewer-lane mechanism.
- The audit may have been coupled to one file name instead of the `cautilus.claim_review_result.v1` packet shape.
- The bundled skill may have described the whole review-to-eval chain in a way that let agents treat temporary `apply-result` as part of reviewer launch.
- Claude adapter permissions may have allowed shell commands but not direct packet writes.
- The fixture prompt may have been too vague about the difference between producing a review-result packet and validating merge behavior.

## Hypothesis

If the portable default reviewer lane is the current agent, the external helper is explicit-only, the adapter permits packet writes, the audit recognizes result packets by schema rather than by one file name, and the skill states that reviewer launch proves packet production rather than merge behavior, then both Codex and Claude should pass the same four-turn reviewer-launch episode without applying review results.

## Verification

Implemented a reviewer-launch dogfood fixture, adapter, helper, and audit:

```bash
node --test scripts/agent-runtime/audit-cautilus-reviewer-launch-flow-log.test.mjs scripts/agent-runtime/run-claim-reviewer-smoke.test.mjs scripts/agent-runtime/run-local-skill-test.test.mjs
npm run dogfood:cautilus-reviewer-launch-flow:eval:codex
npm run dogfood:cautilus-reviewer-launch-flow:eval:claude
```

The targeted tests passed.
The final live Codex run returned `recommendation=accept-now`.
The final live Claude run returned `recommendation=accept-now`.

## Root Cause

The first design made the external CLI helper feel like the default reviewer lane, which exposed nested agent-provider behavior that is not portable across host runtimes and sandbox modes.
The skill text also mixed the reviewer-launch branch with the later review-to-eval branch, so an agent could honestly but incorrectly treat temporary `apply-result` as local packet validation.
The audit encoded incidental output naming rather than the packet schema, and the Claude adapter initially lacked the `Write` permission needed for current-agent packet output.

## Seam Risk

- Interrupt ID: reviewer-launch-flow-boundary
- Risk Class: external-seam
- Seam: nested agent CLI launches, host sandbox permissions, and audited multi-turn reviewer-lane boundaries
- Disproving Observation: direct helper smokes succeeded, but nested helper launch failed or timed out inside top-level agent runtimes; a correct current-agent result packet was initially rejected because the audit expected a narrower file name
- What Local Reasoning Cannot Prove: whether future host CLI sandbox defaults will keep nested Codex or Claude reviewer helpers reliable enough for a portable default
- Generalization Pressure: current-agent reviewer lane should remain the portable default; external CLI helpers should stay explicit and separately smoked

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep reviewer launch and review-result application as separate audited branches.
Audit current-agent reviewer lanes by packet schema and branch boundary, not by one file name or one English phrase.
Keep external reviewer helpers as explicit opt-in smokes with their own provider and sandbox diagnostics.
When changing `skills/cautilus/` branch guidance, prove the affected multi-turn `dev/skill` episode in both Codex and Claude before treating the guidance as release-ready.
