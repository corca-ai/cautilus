# Cautilus Handoff

## Workflow Trigger

다음 세션은 workbench follow-up contract 를 시작한다.
먼저 GitHub issue `#17`, `#18`, [docs/contracts/scenario-conversation-review.md](../contracts/scenario-conversation-review.md), [AGENTS.md](../../AGENTS.md) 를 읽고 `#17` spec 부터 잡는다.

## Current State

- public release 는 `v0.6.1` 이고 tag 는 `0f53d81` 에 있다.
- `v0.6.1` release workflow, public release verify, `install.sh` smoke 는 모두 통과했다.
- `#16` 은 `v0.6.0` 로 닫혔다.
  후속 seam 은 open issue `#17` 과 `#18` 로 분리돼 있다.
- `#17` 은 workbench instance discovery/data roots adapter contract 이다.
  interactive UI 가 아니라 neutral routing/storage seam 이 먼저라는 뜻이다.
- `#18` 은 selected live instance 에 bounded packet 을 실행하는 generic invocation seam 이다.
  Ceal route 복제 없이 product-owned run primitive 를 만들기 위한 follow-up 이다.
- optimize-search 는 이번 라운드 기준으로 practical close 상태다.
  shipped Go runner 는 frontier-promotion review reuse, checkpoint feedback reinjection, bounded merge synthesis, three-parent coverage-expansion selection, bounded repair-lineage prioritization, reflection-batch shaping, structured mutation prompt artifacts, mutation-parent pruning diagnostics 를 product-owned 로 가진다.
- `candidateGenerationDiagnostics` 는 이제 mutation parent eligibility 를 남긴다.
  blocker pruning, concern repair window, expired repair window 를 result packet 에서 읽을 수 있고 CLI smoke proof 도 있다.
- `README`, bundled `skills/cautilus/SKILL.md`, command cookbook, CLI reference 는 릴리즈 직전 다시 확인했고 이번 optimize-search convergence 때문에 stale 해진 문구는 없었다.

## Next Session

1. `#17` 을 먼저 본다.
   instance discovery/data roots seam 을 `docs/contracts/` 아래 spec 으로 고정하고, adapter schema 에 필요한 최소 shape 를 결정한다.
2. `#17` 이 spec 으로 닫히면 `#18` 로 간다.
   selected live instance 에 bounded packet 을 실행하는 generic invocation request/result seam 을 정의한다.
3. optimize-search 는 fresh consumer evidence 가 오거나 external packet 설명력에 실제 gap 이 발견될 때만 다시 연다.

## Discuss

- `#17` 에서 instance discovery 를 typed path contract 로 둘지, command-backed discovery 로 둘지
- `#18` request/result packet 을 scenario review packet 과 어디까지 공유할지
- workbench 후속을 contract-only 로 한 턴 더 둘지, 최소 fixture proof 까지 같은 턴에 넣을지

## References

- [README.md](../../README.md)
- [AGENTS.md](../../AGENTS.md)
- [docs/master-plan.md](../master-plan.md)
- [docs/contracts/scenario-conversation-review.md](../contracts/scenario-conversation-review.md)
- [docs/contracts/optimization-search.md](../contracts/optimization-search.md)
- [docs/maintainers/releasing.md](../maintainers/releasing.md)
