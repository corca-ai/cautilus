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
  - concern-level rejected lineage의 다음 mutation batch repair-first 우선화
  - bounded 2-3 parent merge + `threeParentPolicy`
  - rejected sibling scenario-scoped checkpoint feedback의 merge selection weighting 반영
  - rejected sibling scenario-scoped checkpoint severity-aware merge
    tie-breaking
  - selection-cap public reason codes
  - concern/blocker 2-bucket pruning
  - final-only full-gate fallback
- mutation 쪽도 이제 parent ordering에서는 direct policy가 들어갔다.
  - `promptVariantLimit`이 parent set보다 작을 때 concern-level rejected
    lineage가 admissible sibling보다 먼저 repair 대상으로 올라간다.
  - 다만 reflection batch 내부에서는 scenario별 severity를 직접 구분하는
    데이터 shape가 아직 없다.
- latest self-dogfood published bundle는 `pass / accept-now` 상태다.
  - [artifacts/self-dogfood/latest/summary.json](../artifacts/self-dogfood/latest/summary.json)
- 최근 관련 커밋:
  - `9cc12a3` Prioritize rejected mutation repairs under tight budget
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

1. `v2` 완료 기준을 merge + mutation parent ordering까지로 볼지 정리한다.
2. 만약 더 닫고 싶으면 reflection batch 내부에서 scenario별 severity를
   구분할 데이터 shape가 필요한지 결정한다.
3. 그 방향이 맞으면 checkpoint feedback artifact shape부터 최소 확장한다.

## Discuss

- merge 쪽 최소 기준은 닫혔다.
  - checkpoint rejection이 단순 prompt context나 weighting이 아니라
    merge decision policy의 explicit tie-break에도 반영된다.
- mutation 쪽 최소 기준도 parent ordering 레벨에서는 닫혔다.
  - concern-level rejected lineage가 좁은 mutation budget에서 explicit repair
    대상으로 우선된다.
- 아직 열려 있는 질문:
  - `v2` 완료 기준을 여기까지로 볼지
  - 아니면 reflection batch 내부의 scenario severity 해석까지 요구할지
- 아직 의도적으로 안 하는 것:
  - multi-prompt or multi-component coupled updates
  - fine-tuning or trainer orchestration
  - consumer prompt auto-apply

## Premortem

- 가장 쉬운 오해: mutation 쪽 severity 해석이 scenario 내부까지 이미 닫혔다는
  해석.
  아니다. 지금 닫힌 건 mutation parent ordering까지다.
- 다음 세션에서 가장 쉬운 실수: reflection batch data-shape 문제를 정책 tweak처럼
  가볍게 취급하는 것.
  다음 slice는 먼저 data shape 필요 여부를 결정하는 편이 맞다.

## References

- [README.md](../README.md)
- [docs/master-plan.md](./master-plan.md)
- [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
- [docs/contracts/optimization-search.md](./contracts/optimization-search.md)
- [scripts/agent-runtime/optimize-search-core.mjs](../scripts/agent-runtime/optimize-search-core.mjs)
- [scripts/agent-runtime/optimize-search-mutation.mjs](../scripts/agent-runtime/optimize-search-mutation.mjs)
- [scripts/agent-runtime/optimize-search-merge.mjs](../scripts/agent-runtime/optimize-search-merge.mjs)
- [scripts/agent-runtime/optimize-search-flow.test.mjs](../scripts/agent-runtime/optimize-search-flow.test.mjs)
