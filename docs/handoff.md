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
  [scripts/agent-runtime/optimize-search-checkpoints.mjs](../scripts/agent-runtime/optimize-search-checkpoints.mjs),
  [scripts/agent-runtime/optimize-search-flow.test.mjs](../scripts/agent-runtime/optimize-search-flow.test.mjs)
  를 읽는다.
- 시작 branch는 현재 `main`이다.
- product-owned seam이면 `cautilus`에서 먼저 고친다.

## Current State

- `Cautilus`의 GEPA-style optimize search는 현재 `v1.5` 정도까지 닫혔다.
  - file-first search input/result seam
  - sparse-evidence blocked readiness with JSON
  - reflective mutation
  - multi-generation Pareto frontier retention
  - optional bounded merge candidate
  - scenario-aware bounded 2-3 parent merge selection
  - budget-aware default review checkpoint policy
    - `light` -> `final_only`
    - `medium`/`heavy` -> `frontier_promotions`
  - scenario-aware checkpoint rejection feedback reinjection into later mutation prompts
  - one-generation retention before stale review-rejected lineage is pruned from mutation parents
  - final-only full-gate checkpoint execution
  - ranked-frontier fallback when the leader fails final checkpoints
  - blocked result when no checkpoint-admissible finalist survives
- 이 흐름은 현재 README/spec/current contract와 sync되어 있다.
- CLI probe/readiness 구조 분리도 끝났다.
  - `cautilus <subcommand> --help`
  - `cautilus commands --json`
  - `cautilus healthcheck --json`
  - `cautilus doctor --scope agent-surface`
- latest self-dogfood published bundle는 `pass / accept-now` 상태다.
  - [artifacts/self-dogfood/latest/summary.json](../artifacts/self-dogfood/latest/summary.json)
- 최근 관련 커밋:
  - `c283e72` bounded optimize search scaffolding
  - `7f0f3bb` reflective mutation loop
  - `66ef983` self-dogfood evidence + README story
  - `7095a27` CLI probe/readiness split
  - `fd62b0c` frontier evolution + merge
  - `58ac144` final review/full-gate checkpoint fallback

## Last Verified

- `node --test scripts/agent-runtime/optimize-search-flow.test.mjs scripts/agent-runtime/optimize-search-contract-schemas.test.mjs`
- `npm run lint:specs`
- `npm run verify`
- `npm run hooks:check`
- latest full verify after frontier pruning retention slice: passed

## Next Session

1. bounded multi-parent synthesis는 닫혔으니, review-rejected lineage를 한 generation보다 더 짧게 자를지, 아니면 checkpoint severity별로 retention을 다르게 둘지 판단한다.
2. cost/latency constraint breach를 promotion reject로 볼지, final selection ineligible로만 둘지 정한다.
3. 마지막으로 merge prompt 자체에도 scenario-aware feedback를 더 직접 실을지 판단한다.
4. 필요하면 bounded 3-parent merge를 언제 2-parent보다 먼저 허용할지 policy knob로 뺄지 판단한다.

## Discuss

- 아직 `v2`는 아니다.
- 지금 닫힌 것은 “bounded GEPA slice with frontier-promotion review feedback reinjection + final-only full-gate fallback”이다.
- 다음 세션의 첫 결정은 이것이다:
  - frontier pruning policy를 severity-aware하게 더 조일지
  - 아니면 cost/latency constraint breach semantics를 먼저 닫을지
- 제 추천은 먼저
  - frontier pruning policy
  를 다음 핵심 slice로 두는 것이다.

## Premortem

- 가장 쉬운 오해: “GEPA 반영이 완전히 끝났다”는 해석.
  아니다. 현재는 strong `v1.5`다.
- 두 번째 오해: 현재 feedback reinjection이 scenario-aware root cause까지 완전히 풀었다는 해석.
  아니다. 지금은 named scenario가 드러나는 review rejection만 scenario-scoped로 다시 주입하는 수준이다.
- 세 번째 오해: merge가 무제한 multi-parent나 scenario-aware root cause까지 푼다는 해석.
  아니다. 현재 merge는 weakest-frontier weighting이 들어간 bounded 2-3 parent synthesis다.
- 네 번째 오해: review-rejected lineage가 frontier parent pool에 무기한 남는다는 해석.
  아니다. 지금은 한 번의 repair generation 뒤에는 stale rejected lineage를 mutation parent selection에서 뺀다.

## References

- [README.md](../README.md)
- [docs/master-plan.md](./master-plan.md)
- [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
- [docs/contracts/optimization-search.md](./contracts/optimization-search.md)
- [scripts/agent-runtime/optimize-search-core.mjs](../scripts/agent-runtime/optimize-search-core.mjs)
- [scripts/agent-runtime/optimize-search-mutation.mjs](../scripts/agent-runtime/optimize-search-mutation.mjs)
- [scripts/agent-runtime/optimize-search-checkpoints.mjs](../scripts/agent-runtime/optimize-search-checkpoints.mjs)
- [scripts/agent-runtime/optimize-search-flow.test.mjs](../scripts/agent-runtime/optimize-search-flow.test.mjs)
