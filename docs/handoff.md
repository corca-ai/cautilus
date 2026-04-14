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

- `Cautilus`의 GEPA-style optimize search는 merge selection 쪽에서
  rejected sibling checkpoint signal을 이제 `scenario weighting` 이상으로 직접
  해석한다.
- 지금 닫힌 핵심:
  - reflective mutation + multi-generation Pareto frontier
  - frontier-promotion review feedback reinjection
  - scenario-scoped checkpoint feedback의 다음 reflection batch 우선순위 반영
  - bounded 2-3 parent merge + `threeParentPolicy`
  - rejected sibling scenario-scoped checkpoint feedback의 merge selection weighting 반영
  - rejected sibling scenario-scoped checkpoint severity-aware merge
    tie-breaking
  - selection-cap public reason codes
  - concern/blocker 2-bucket pruning
  - final-only full-gate fallback
- merge 쪽은 direct policy가 들어갔지만, mutation 쪽은 아직
  scenario priority와 prompt context 중심이다.
  - rejection reason severity를 mutation policy가 직접 해석하는 단계는 아직
    닫히지 않았다.
- latest self-dogfood published bundle는 `pass / accept-now` 상태다.
  - [artifacts/self-dogfood/latest/summary.json](../artifacts/self-dogfood/latest/summary.json)
- 최근 관련 커밋:
  - `ade8bfa` Respect checkpoint severity in merge parent selection
  - `df9b4d1` rejected sibling signals bias merge selection
  - `fe99139` checkpointed scenarios prioritized in repair
  - `ff07f6b` pruning stays bounded to concern/blocker
  - `3943bd4` selection-cap reason codes stabilized
  - `95fd2fd` three-parent policy exposed

## Last Verified

- `npm run verify`
- `npm run hooks:check`

## Next Session

1. mutation policy도 rejected sibling checkpoint severity를 직접 해석해야 하는지
   결정한다.
2. 그 방향이 맞으면 가장 작은 seam만 닫는다.
   예: reflection batch ordering이나 mutation parent selection에서
   `blocker > concern`을 명시적으로 우선순위에 반영
3. 그 구현 후 `npm run verify`, `npm run hooks:check`로 다시 닫는다.

## Discuss

- merge 쪽 최소 기준은 지금 닫혔다.
  - checkpoint rejection이 단순 prompt context나 weighting이 아니라
    merge decision policy의 explicit tie-break에도 반영된다.
- 아직 열려 있는 질문:
  - `v2` 완료 기준을 merge + mutation 둘 다의 explicit policy로 볼지
  - 아니면 mutation은 현재 scenario-priority seam으로도 충분하다고 볼지
- 아직 의도적으로 안 하는 것:
  - multi-prompt or multi-component coupled updates
  - fine-tuning or trainer orchestration
  - consumer prompt auto-apply

## Premortem

- 가장 쉬운 오해: rejected sibling signal의 direct policy가 merge와 mutation
  둘 다 이미 닫혔다는 해석.
  아니다. 지금 닫힌 건 merge selection 쪽이다.
- 다음 세션에서 가장 쉬운 실수: merge prompt feedback, merge selection policy,
  mutation policy를 한꺼번에 섞는 것.
  다음 slice는 mutation decision seam 하나만 따로 잡는 편이 맞다.

## References

- [README.md](../README.md)
- [docs/master-plan.md](./master-plan.md)
- [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
- [docs/contracts/optimization-search.md](./contracts/optimization-search.md)
- [scripts/agent-runtime/optimize-search-core.mjs](../scripts/agent-runtime/optimize-search-core.mjs)
- [scripts/agent-runtime/optimize-search-mutation.mjs](../scripts/agent-runtime/optimize-search-mutation.mjs)
- [scripts/agent-runtime/optimize-search-merge.mjs](../scripts/agent-runtime/optimize-search-merge.mjs)
- [scripts/agent-runtime/optimize-search-flow.test.mjs](../scripts/agent-runtime/optimize-search-flow.test.mjs)
