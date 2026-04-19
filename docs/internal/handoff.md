# Cautilus Handoff

## Workflow Trigger

다음 세션은 `optimize-search runtime convergence` 를 계속한다.
먼저 [docs/contracts/optimization-search.md](../contracts/optimization-search.md), [internal/runtime/optimize_search.go](../../internal/runtime/optimize_search.go), [scripts/experiments/optimize-search-js/](../../scripts/experiments/optimize-search-js/) 만 다시 읽고 parity gap 하나를 고른다.

## Current State

- public release 는 `v0.6.0` 이고 tag 는 `23bba1a` 에 있다.
- 현재 `main` 은 `origin/main` 보다 3 commits 앞서 있다.
  아직 push 되지 않은 local commits 는 `2f1258f`, `55c1cdc`, `cb65ec8` 이다.
- `#16` 은 `v0.6.0` 로 닫혔다.
  후속 seam 은 open issue `#17` 과 `#18` 로 분리돼 있다.
- `#17` 은 workbench instance discovery/data roots adapter contract 이다.
  interactive UI 가 아니라 neutral routing/storage seam 이 먼저라는 뜻이다.
- `#18` 은 selected live instance 에 bounded packet 을 실행하는 generic invocation seam 이다.
  Ceal route 복제 없이 product-owned run primitive 를 만들기 위한 follow-up 이다.
- optimize-search shipped Go runner 는 이제 아래를 product-owned 로 가진다.
  frontier-promotion review reuse, checkpoint feedback reinjection, bounded merge synthesis, three-parent coverage-expansion merge selection, bounded repair-lineage prioritization, reflection-batch shaping, mutation-parent pruning diagnostics.
- `candidateGenerationDiagnostics` 는 이제 mutation parent eligibility 를 남긴다.
  blocker 즉시 pruning, concern repair window, expired repair window 를 result packet 에서 바로 읽을 수 있다.
- mutation prompt 는 이제 `trainScenarioLimit` 를 실제로 소비한다.
  reflected scenario batch 를 고르고 checkpoint feedback 도 그 batch 에 맞는 scenario 로만 reinject 한다.

## Next Session

1. optimize-search parity gap 을 하나 더 올린다.
   후보 우선순위는 다음 둘이다.
   첫째, mutation prompt 를 experimental JS 쪽처럼 더 구조화된 search-context shape 로 맞춘다.
   둘째, external consumer artifact 로 `candidateGenerationDiagnostics` 설명력이 실제로 충분한지 검증한다.
2. 만약 optimize-search slice 를 하나 더 닫으면, 그 다음에 현재 앞선 3 commits 를 정리해서 push 여부를 결정한다.
   release 는 아직 다시 자를 단계가 아니다.
3. workbench 후속은 optimize-search 다음이다.
   `#17` 과 `#18` 은 봤고 살아 있다.
   둘 다 지금 당장 구현으로 뛰지 말고, 시작할 때는 contract-first 로 간다.

## Discuss

- optimize-search 를 더 밀기 전에 external consumer packet proof 가 필요한지
- local `main` ahead 3 commits 를 언제 push 할지
- `#17` / `#18` 를 optimize-search 이후 바로 spec 으로 받을지, 아니면 runtime convergence 를 더 진행할지

## References

- [README.md](../../README.md)
- [AGENTS.md](../../AGENTS.md)
- [docs/master-plan.md](../master-plan.md)
- [docs/contracts/optimization-search.md](../contracts/optimization-search.md)
- [docs/contracts/scenario-conversation-review.md](../contracts/scenario-conversation-review.md)
- [internal/runtime/optimize_search.go](../../internal/runtime/optimize_search.go)
- [scripts/experiments/optimize-search-js/](../../scripts/experiments/optimize-search-js/)
