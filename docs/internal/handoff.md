# Cautilus Handoff

## Workflow Trigger

다음 세션은 issue [#33](https://github.com/corca-ai/cautilus/issues/33)를 이어서 HITL하지 마세요.
이번 closeout은 Cautilus-native review-learning slice로 정리되었고, 남은 일은 새 issue나 명시적 follow-up으로 다룹니다.

## Current State

- Issue #33 closeout decision is narrowed, not a full import of Engelbart or DKR vocabulary.
  The product surface now treats the shipped slice as source-bound review feedback that can become reusable learning evidence about which discovery or evaluation work produced review-useful proposals.
- The current packet surface is `cautilus review feedback build`, which emits `cautilus.review_feedback.v1`.
  The selected-packet summary surface is `cautilus review feedback summarize`, which emits `cautilus.review_feedback_summary.v1` for explicitly supplied packet files.
  The closeout packet is [charness-artifacts/hitl/issue-33-review-feedback.json](../../charness-artifacts/hitl/issue-33-review-feedback.json), and its source review points to the stable HITL scratchpad `.charness/hitl/runtime/hitl-20260509-161518/hitl-scratchpad.md`.
- The spec tree carries the result through:
  [Agent-Human Resumability](../specs/concerns/agent-human-resumability.spec.md),
  [Promise Ledger](../specs/model/promise-ledger.spec.md),
  [Evidence State And Review Artifacts](../specs/maintainer/evidence-state-artifacts.spec.md),
  [Reporting And Review Variants](../specs/maintainer/reporting-review-variants.spec.md),
  [Evidence Map](../specs/proof/evidence-map.spec.md),
  and [Proof Gaps](../specs/proof/gaps.spec.md).
- The proof map marks `Review Learning Packet Builder` and `Review Learning Summary CLI` current.
  The active-run discovery story is intentionally not claimed as current.
- `gap.review-learning-active-run-aggregation` remains open.
  `review feedback build` also does not yet default into an active-run workspace; [Active Run Workspace](../specs/maintainer/active-run-workspace.spec.md) records that as an explicit maintainer gap.
- HITL runtime checkpoints for this closeout are accepted or complete.
  `hitl-20260509-053911` is historical closeout context, not an active cursor to resume.
- `npm run verify` and `npm run hooks:check` passed during the closeout pass before this handoff refresh.

## Next Session

1. Bootstrap with `git status --short` and `charness:find-skills`.
2. Confirm issue #33 is closed on GitHub before starting new #33 work.
   If it is still open, close it with a comment that separates the shipped narrowed slice from deferred DKR, operator-learning aggregation, and active-run default work.
3. If continuing review-learning, start from the explicit gaps:
   `gap.review-learning-active-run-aggregation` and the active-run default question for review-feedback packets.
4. Do not add Engelbart's five terms or C-level vocabulary as new product concerns unless a new spec decision explicitly reopens that product-language question.

## Discuss

- How an active-run or report route should select review-feedback packets before running `cautilus review feedback summarize`.
- Whether `review feedback build` should default to `review-feedback.json` inside an active run.
- Whether future operator-learning evidence should live in reports, evidence state, or a dedicated aggregate artifact.

## References

- [docs/contracts/review-learning.md](../contracts/review-learning.md)
- [docs/specs/concerns/agent-human-resumability.spec.md](../specs/concerns/agent-human-resumability.spec.md)
- [docs/specs/maintainer/evidence-state-artifacts.spec.md](../specs/maintainer/evidence-state-artifacts.spec.md)
- [docs/specs/maintainer/reporting-review-variants.spec.md](../specs/maintainer/reporting-review-variants.spec.md)
- [docs/specs/proof/evidence-map.spec.md](../specs/proof/evidence-map.spec.md)
- [docs/specs/proof/gaps.spec.md](../specs/proof/gaps.spec.md)
- [charness-artifacts/hitl/issue-33-review-feedback.json](../../charness-artifacts/hitl/issue-33-review-feedback.json)
