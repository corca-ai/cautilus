# Cautilus Handoff

이 문서는 다음 세션이 바로 이어야 할 한 수만 남긴다.

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 먼저
  [README.md](../README.md),
  [AGENTS.md](../AGENTS.md),
  [docs/master-plan.md](./master-plan.md),
  [docs/specs/current-product.spec.md](./specs/current-product.spec.md),
  [docs/contracts/optimization-search.md](./contracts/optimization-search.md),
  [scripts/agent-runtime/optimize-search-core.mjs](../scripts/agent-runtime/optimize-search-core.mjs),
  [scripts/agent-runtime/optimize-search-mutation.mjs](../scripts/agent-runtime/optimize-search-mutation.mjs),
  [scripts/agent-runtime/optimize-search-merge.mjs](../scripts/agent-runtime/optimize-search-merge.mjs),
  [scripts/agent-runtime/optimize-search-flow.test.mjs](../scripts/agent-runtime/optimize-search-flow.test.mjs)
  를 읽는다.
- 시작 branch는 현재 `main`이다.
- product-owned seam이면 `cautilus`에서 먼저 고친다.

## Current State

- `Cautilus`의 GEPA-style optimize search는 현재 strong `v1.5`다.
- 지금 닫힌 핵심:
  - reflective mutation + multi-generation Pareto frontier
  - frontier-promotion review feedback reinjection
  - scenario-scoped checkpoint feedback의 다음 reflection batch 우선순위 반영
  - bounded 2-3 parent merge + `threeParentPolicy`
  - rejected sibling scenario-scoped checkpoint feedback의 merge selection weighting 반영
  - selection-cap public reason codes
  - concern/blocker 2-bucket pruning
  - final-only full-gate fallback
- 아직 `v2`는 아니다.
  - 현재는 checkpoint signal을 `weighting`과 `prompt context`에는 반영하지만,
    merge/mutation policy가 그 signal을 더 직접적으로 해석하는 단계는 아직 덜 닫혔다.
- latest self-dogfood published bundle는 `pass / accept-now` 상태다.
  - [artifacts/self-dogfood/latest/summary.json](../artifacts/self-dogfood/latest/summary.json)
- 최근 관련 커밋:
  - `df9b4d1` rejected sibling signals bias merge selection
  - `fe99139` checkpointed scenarios prioritized in repair
  - `ff07f6b` pruning stays bounded to concern/blocker
  - `3943bd4` selection-cap reason codes stabilized
  - `95fd2fd` three-parent policy exposed

## Last Verified

- `npm run verify`
- `npm run hooks:check`

## Next Session

1. merge selection이 rejected sibling checkpoint signal을 `scenario weighting` 이상으로 직접 해석해야 하는지 결정한다.
2. 그 방향이 맞으면 가장 작은 policy를 구현한다.
   예: 특정 rejection reason이 있으면 특정 parent group을 명시적으로 밀어주는 규칙
3. 그 구현 후 `npm run verify`, `npm run hooks:check`로 다시 닫는다.

## Discuss

- `v2` 완료로 볼 최소 기준:
  - checkpoint rejection이 단순 prompt context나 weighting이 아니라
    merge/mutation decision policy에도 명시적으로 반영된다.
  - 이 추가 정책이 packet boundary를 흔들지 않고 기존 bounded search를 더
    system-aware하게 만든다.
- 아직 의도적으로 안 하는 것:
  - multi-prompt or multi-component coupled updates
  - fine-tuning or trainer orchestration
  - consumer prompt auto-apply

## Premortem

- 가장 쉬운 오해: “GEPA 반영이 완전히 끝났다”는 해석.
  아니다. 현재는 strong `v1.5`다.
- 다음 세션에서 가장 쉬운 실수: merge prompt feedback와 merge selection
  policy를 같은 문제로 섞어 scope를 넓히는 것.
  다음 slice는 `selection policy`에만 집중하는 편이 맞다.

## References

- [README.md](../README.md)
- [docs/master-plan.md](./master-plan.md)
- [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
- [docs/contracts/optimization-search.md](./contracts/optimization-search.md)
- [scripts/agent-runtime/optimize-search-core.mjs](../scripts/agent-runtime/optimize-search-core.mjs)
- [scripts/agent-runtime/optimize-search-mutation.mjs](../scripts/agent-runtime/optimize-search-mutation.mjs)
- [scripts/agent-runtime/optimize-search-merge.mjs](../scripts/agent-runtime/optimize-search-merge.mjs)
- [scripts/agent-runtime/optimize-search-flow.test.mjs](../scripts/agent-runtime/optimize-search-flow.test.mjs)
