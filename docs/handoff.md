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

- `Cautilus`의 GEPA-style optimize search는 이제 rejected sibling checkpoint
  signal을 merge selection, mutation parent ordering, reflection batch ordering
  모두에서 direct policy로 해석한다.
- 지금 닫힌 핵심:
  - reflective mutation + multi-generation Pareto frontier
  - frontier-promotion review feedback reinjection
  - scenario-scoped checkpoint feedback의 다음 reflection batch 우선순위 반영
  - concern-level rejected lineage의 다음 mutation batch repair-first 우선화
  - finding-level severity를 보존한 scenario-level reflection ordering
  - bounded 2-3 parent merge + `threeParentPolicy`
  - rejected sibling scenario-scoped checkpoint feedback의 merge selection weighting 반영
  - rejected sibling scenario-scoped checkpoint severity-aware merge
    tie-breaking
  - selection-cap public reason codes
  - concern/blocker 2-bucket pruning
  - final-only full-gate fallback
- optimize-search `v2`로 보던 최소 기준은 사실상 닫혔다.
  - checkpoint rejection이 단순 prompt context나 weighting이 아니라
    merge/mutation decision policy에도 명시적으로 반영된다.
- latest self-dogfood published bundle는 `pass / accept-now` 상태다.
  - [artifacts/self-dogfood/latest/summary.json](../artifacts/self-dogfood/latest/summary.json)
- 최근 관련 커밋:
  - `2393cf9` Preserve checkpoint severity in reflection feedback
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

1. optimize-search `v2`를 닫힌 slice로 보고, 다음 bounded improvement seam을
   고른다.
2. 기본 후보:
   - richer merge heuristics가 실제로 더 필요한지 self-dogfood evidence로 확인
   - 아니면 optimize-search contract를 더 건드리지 않고 다른 product seam으로 이동
3. 다음 slice를 고른 뒤 `npm run verify`, `npm run hooks:check`를 다시 닫는다.

## Discuss

- 현재 판단:
  - optimize-search `v2`는 닫혔다고 봐도 된다.
  - 더 나아가려면 이제 contract 확장보다 dogfood evidence가 먼저다.
- 아직 열려 있는 질문:
  - richer merge heuristics가 실제로 필요한지
  - 아니면 현재 bounded search seam을 유지하고 다른 roadmap slice로 넘어갈지
- 아직 의도적으로 안 하는 것:
  - multi-prompt or multi-component coupled updates
  - fine-tuning or trainer orchestration
  - consumer prompt auto-apply

## Premortem

- 가장 쉬운 오해: optimize-search seam을 더 만지는 것이 자동으로 다음 최선의
  수라는 해석.
  아니다. 이제는 evidence 없이 heuristic만 더 얹을 위험이 더 크다.
- 다음 세션에서 가장 쉬운 실수: merge heuristics를 넓히면서 다시 packet
  boundary를 흔드는 것.
  다음 slice는 먼저 dogfood evidence가 진짜 부족한 heuristic을 가리키는지
  확인하는 편이 맞다.

## References

- [README.md](../README.md)
- [docs/master-plan.md](./master-plan.md)
- [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
- [docs/contracts/optimization-search.md](./contracts/optimization-search.md)
- [scripts/agent-runtime/optimize-search-core.mjs](../scripts/agent-runtime/optimize-search-core.mjs)
- [scripts/agent-runtime/optimize-search-mutation.mjs](../scripts/agent-runtime/optimize-search-mutation.mjs)
- [scripts/agent-runtime/optimize-search-merge.mjs](../scripts/agent-runtime/optimize-search-merge.mjs)
- [scripts/agent-runtime/optimize-search-flow.test.mjs](../scripts/agent-runtime/optimize-search-flow.test.mjs)
