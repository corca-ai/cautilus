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
  - rejected sibling scenario-scoped checkpoint feedback can bias merge selection
  - explicit `threeParentPolicy`
    - default `coverage_expansion`
    - `disabled` override
  - budget-aware default review checkpoint policy
    - `light` -> `final_only`
    - `medium`/`heavy` -> `frontier_promotions`
  - scenario-aware checkpoint rejection feedback reinjection into later mutation prompts
  - scenario-scoped checkpoint feedback can reprioritize the next reflection batch
  - merge prompt rejected sibling feedback stays implicitly bounded
    - no separate explicit feedback-entry cap
    - bounded today by frontier parent retention + scenario filtering
  - severity-aware frontier pruning
    - concern -> one repair generation
    - blocker -> prune before the next generation
    - no finer pruning bucket yet
  - final-only full-gate checkpoint execution
  - selection-cap breach keeps candidates in frontier search but makes them final-selection ineligible
  - selection-cap rejection reason codes are public contract
    - top-level `no_selection_policy_eligible_candidate`
    - per-candidate `selection_constraint_max_cost_exceeded`
    - per-candidate `selection_constraint_max_duration_exceeded`
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
- latest full verify after merge-prompt frontier-feedback slice: passed

## Next Session

1. merge selection을 rejected sibling checkpoint signals beyond scenario weighting까지 더 system-aware하게 만들지 판단한다.

## Discuss

- 아직 `v2`는 아니다.
- 지금 닫힌 것은 “bounded GEPA slice with frontier-promotion review feedback reinjection + final-only full-gate fallback”이다.
- bounded 3-parent activation policy는 이제 product surface로 뺐다.
  - 기본값은 `coverage_expansion`
  - 즉, 3-parent는 held-out frontier coverage를 실제로 넓힐 때만 2-parent보다 먼저 허용한다.
- selection-cap reason code는 이제 public contract로 고정했다.
  - top-level blocked code는 `no_selection_policy_eligible_candidate`
  - per-candidate cap rejection code는 open set이지만 현재 stable set은
    `selection_constraint_max_cost_exceeded`,
    `selection_constraint_max_duration_exceeded`다.
- pruning bucket은 현재 `concern` / `blocker` 2단계 유지로 두기로 했다.
  - 이유: 현재 bounded budget에선 “한 번 repair vs 즉시 prune” 결정만으로 충분하다.
  - finer bucket은 더 큰 search budget이나 반복 telemetry 패턴이 생길 때 다시 본다.
- merge prompt rejected sibling feedback는 별도 explicit cap을 두지 않기로 했다.
  - 현재는 frontier parent retention, scenario filtering, review-admissible merge-parent selection으로 충분히 bounded하다고 본다.
- rejected sibling scenario-scoped checkpoint feedback는 이제 merge selection에서도 scenario weighting에 반영한다.
- 다음 세션의 첫 product decision은 merge selection이 scenario weighting을 넘어서
  rejected sibling checkpoint signals를 더 직접적으로 해석해야 하는지 여부다.

## Premortem

- 가장 쉬운 오해: “GEPA 반영이 완전히 끝났다”는 해석.
  아니다. 현재는 strong `v1.5`다.
- 두 번째 오해: 현재 feedback reinjection이 scenario-aware root cause까지 완전히 풀었다는 해석.
  아니다. 지금은 named scenario가 드러나는 review rejection만 scenario-scoped로 다시 주입하는 수준이다.
- 세 번째 오해: merge가 무제한 multi-parent나 scenario-aware root cause까지 푼다는 해석.
  아니다. 현재 merge는 weakest-frontier weighting이 들어간 bounded 2-3 parent synthesis이고, rejected sibling feedback도 bounded context로만 실린다.
- 네 번째 오해: review-rejected lineage가 frontier parent pool에 무기한 남는다는 해석.
  아니다. 지금은 concern이면 한 번의 repair generation만 남고, blocker면 다음 generation 전에 바로 mutation parent selection에서 뺀다.

## References

- [README.md](../README.md)
- [docs/master-plan.md](./master-plan.md)
- [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
- [docs/contracts/optimization-search.md](./contracts/optimization-search.md)
- [scripts/agent-runtime/optimize-search-core.mjs](../scripts/agent-runtime/optimize-search-core.mjs)
- [scripts/agent-runtime/optimize-search-mutation.mjs](../scripts/agent-runtime/optimize-search-mutation.mjs)
- [scripts/agent-runtime/optimize-search-checkpoints.mjs](../scripts/agent-runtime/optimize-search-checkpoints.mjs)
- [scripts/agent-runtime/optimize-search-flow.test.mjs](../scripts/agent-runtime/optimize-search-flow.test.mjs)
