# Cautilus Handoff

## Workflow Trigger

다음 세션은 `charness:hitl`로 [docs/specs/index.spec.md](../specs/index.spec.md)부터 다시 시작하세요.
먼저 `git status --short`와 `charness:find-skills` bootstrap을 확인하고, Charness 쪽 HITL/issue/premortem 수정이 설치된 상태인지 확인하세요.

## Current State

- Latest committed spec slice: `d904355 Refine promise specs for reader language`.
  Specs now use this reader order: User Workflow, Maintainer View, Promise Model, Shared Concerns, Evidence State.
- Issue [#33](https://github.com/corca-ai/cautilus/issues/33) has been reframed as a Cautilus-native review-learning design question, not a request to import Engelbart vocabulary directly.
  Read [docs/contracts/review-learning.md](../contracts/review-learning.md) before restarting HITL.
- The first implementation slice for #33 is `cautilus review feedback build`, which emits `cautilus.review_feedback.v1` from source-bound review outcomes.
  Use it after a review decision exists; do not treat Cautilus Agent as the review authority.
  For accepted/narrowed/reframed/rejected decisions, include `--proposal-id` or `--proposal-source-ref`; reserve proposal-less packets for `missing_critical`.
- The previous HITL runtime was `.charness/hitl/runtime/hitl-20260508-222100`, and the durable checkpoint is [charness-artifacts/hitl/latest.md](../../charness-artifacts/hitl/latest.md).
  Treat it as historical context only: the user terminated that HITL and the spec tree was rewritten afterward.
- Current intended HITL target is the rewritten [docs/specs/index.spec.md](../specs/index.spec.md), not the old Claim Discovery runtime target.
- Charness follow-up issues filed from this work:
  [#128](https://github.com/corca-ai/charness/issues/128) issue preflight caller-repo adapter bug,
  [#129](https://github.com/corca-ai/charness/issues/129) HITL recommendation-before-question coverage,
  [#130](https://github.com/corca-ai/charness/issues/130) premortem first-reader language lens,
  [#131](https://github.com/corca-ai/charness/issues/131) title-slug-address drift after renames.
  User says these will be fixed in Charness before the next HITL session.
- Last verified after `d904355`: `npm run verify`, `npm run specdown`, and `npm run hooks:check` passed.

## Next Session

1. Confirm Charness is updated enough that the fixes for #128-#131 are available.
   In particular, `charness:issue` preflight should resolve from the caller repo, and HITL chunks should require agent assessment plus non-binding recommendation before asking the user.
2. Before starting HITL, apply this design rubric from [Review Learning](../contracts/review-learning.md):
   Does this spec leave a clear place for Cautilus Agent to capture source-bound review feedback and turn it into reusable evidence about which discovery or evaluation methods produced review-useful proposals?
3. Start a fresh or explicitly refreshed HITL session for `docs/specs/index.spec.md`.
   Do not advance the old `hitl-20260508-222100` cursor as if it still represents the current text.
4. Present the current index as the first chunk with this shape:
   direct excerpt, related context, agent assessment, risks or gaps, recommended disposition, then the human decision request.
5. Apply the accepted HITL rules every time:
   show rewritten chunk text after changes, require full target readback after chunks, verify target/cursor/line bounds before edits, and sync the durable HITL artifact before closeout.
6. After index acceptance, continue in reader order:
   [User Workflow](../specs/user/index.spec.md), [Maintainer View](../specs/maintainer/index.spec.md), [Shared Concerns](../specs/concerns/index.spec.md), [Evidence State](../specs/proof/index.spec.md), then [Promise Model](../specs/model/index.spec.md) and its reference pages.
7. When a HITL or review decision meaningfully accepts, narrows, reframes, rejects, or identifies a missing-critical proposal, materialize one review-learning packet with `cautilus review feedback build`.
   Include proposal evidence for every non-`missing_critical` disposition.

## Discuss

- Whether the new top-level vocabulary is now reader-plain enough without hiding necessary product terms.
- Whether `Shared Concerns` is the right durable name for workflow-wide rules that are not primary user stories.
- Whether maintainer shared-concern evidence should stay mapped through evidence routes, or later gain dedicated maintainer concern pages.

## References

- [docs/specs/index.spec.md](../specs/index.spec.md)
- [docs/specs/model/names-and-keys.spec.md](../specs/model/names-and-keys.spec.md)
- [docs/specs/model/how-views-relate.spec.md](../specs/model/how-views-relate.spec.md)
- [charness-artifacts/hitl/latest.md](../../charness-artifacts/hitl/latest.md)
