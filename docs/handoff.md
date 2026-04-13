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
  - final-only review/full-gate checkpoint execution
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
- latest full verify after checkpoint fallback commit: passed

## Next Session

1. `v2` 범위를 먼저 spec으로 짧게 고정한다.
2. 우선순위는 `frontier_promotions` review checkpoint 실행이다.
3. 그 다음 checkpoint rejection reason을 다음 generation mutation feedback에 다시 주입할지 정한다.
4. 마지막으로 merge parent selection을 더 system-aware하게 만들지, 아니면 multi-parent synthesis를 먼저 열지 결정한다.

## Discuss

- 아직 `v2`는 아니다.
- 지금 닫힌 것은 “bounded GEPA slice with final-only checkpoint fallback”이다.
- 다음 세션의 첫 결정은 이것이다:
  - `v2`를 `frontier_promotions + checkpoint-to-mutation feedback`까지로 자를지
  - 아니면 merge intelligence까지 한 번에 넣을지
- 제 추천은 먼저
  - `frontier_promotions`
  - checkpoint feedback reinjection
  두 개를 `v2` 핵심으로 자르고, merge intelligence는 그 다음 slice로 두는 것이다.

## Premortem

- 가장 쉬운 오해: “GEPA 반영이 완전히 끝났다”는 해석.
  아니다. 현재는 strong `v1.5`다.
- 두 번째 오해: 현재 search가 generation 중간 checkpoint까지 이미 돈다는 해석.
  아니다. 지금은 `final_only`만 실행한다.
- 세 번째 오해: merge가 이미 fully system-aware하다는 해석.
  아니다. 현재 merge는 bounded 2-parent synthesis다.

## References

- [README.md](../README.md)
- [docs/master-plan.md](./master-plan.md)
- [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
- [docs/contracts/optimization-search.md](./contracts/optimization-search.md)
- [scripts/agent-runtime/optimize-search-core.mjs](../scripts/agent-runtime/optimize-search-core.mjs)
- [scripts/agent-runtime/optimize-search-mutation.mjs](../scripts/agent-runtime/optimize-search-mutation.mjs)
- [scripts/agent-runtime/optimize-search-checkpoints.mjs](../scripts/agent-runtime/optimize-search-checkpoints.mjs)
- [scripts/agent-runtime/optimize-search-flow.test.mjs](../scripts/agent-runtime/optimize-search-flow.test.mjs)
