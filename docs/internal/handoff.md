# Cautilus Handoff

이 문서는 다음 세션이 바로 이어야 할 현재 상태와 다음 한 수만 남긴다.
장기 패턴은 [working-patterns.md](./working-patterns.md) 가 source of truth 다.

## 먼저 읽기

다음 세션이 이 문서를 멘션하면 먼저 아래만 읽는다.

1. [README.md](../../README.md)
2. [AGENTS.md](../../AGENTS.md)
3. [docs/master-plan.md](../master-plan.md)
4. [docs/maintainers/releasing.md](../maintainers/releasing.md)
5. [docs/maintainers/consumer-readiness.md](../maintainers/consumer-readiness.md)

## Current State

2026-04-18 세션 기준 public release 는 `v0.5.3` 이다.
`main`, `origin/main`, tag 모두 `425bb1e` 를 가리킨다.
이번 세션의 초점은 release 준비가 아니라 post-release issue triage 다.
`charness` 는 최신 `Cautilus` 로 업데이트되었고 open issue 는 현재 `#5` 부터 `#9` 까지 다섯 개다.

지금 기억할 product 상태는 네 묶음이다.

1. `instruction-surface` 는 이제 실제 shipped surface 다.
   `cautilus instruction-surface test` / `evaluate`, 전용 contracts, fixtures, self-dogfood adapter, routingDecision scoring 이 다 들어갔다.
2. `review variants` 의 `output-under-test` seam 은 이미 닫힌 이슈다.
   예전 탐색 과제였던 `#4` 는 reopen 할 이유가 없다.
3. 남은 open issue 들은 크게 두 갈래다.
   `#5` 는 shipped surface 로 대체되어 close 검토 대상이고, `#6` 부터 `#9` 는 실제 product gap 또는 문서 gap 이다.
4. 현재 다음 세션의 최우선 가치는 새 surface 확장이 아니라 issue burn-down 이다.
   특히 `mode evaluate -> review/optimize bridge` 와 `optimize search` readiness 를 먼저 안정화하는 편이 맞다.

## Recent Commits

최근 주요 커밋:

```text
425bb1e Keep handoff release-safe
1fd99b6 Prepare v0.5.3 release
70942fa Make instruction-surface dogfood expectations robust
9fbef9b Keep release gates clean around self-dogfood tests
0deee0f Stabilize instruction-surface self-dogfood isolation
```

직전 public release 는 `v0.5.2` 였고, 지금은 `v0.5.3` 가 이미 공개된 상태다.

## Issue Triage

현재 open issue 별 판단은 아래처럼 잡는 편이 정확하다.

1. `#5` [Support AGENTS.md-aware routing evals and expose first routing decision](https://github.com/corca-ai/cautilus/issues/5)
   close 후보다.
   요청 핵심이었던 `AGENTS.md` override / fixture 비교, first routing decision 구조화, prompt-set 반복 평가, route comparison summary 는 지금 shipped `instruction-surface` surface 와 맞닿아 있다.
   근거 문서는 [docs/contracts/instruction-surface.md](../contracts/instruction-surface.md), [docs/specs/instruction-surface.spec.md](../specs/instruction-surface.spec.md), [docs/cli-reference.md](../cli-reference.md) 의 `instruction-surface` 섹션이다.
   next action 은 구현이 아니라 issue comment + close 다.
   만약 `charness` 관점에서 "동일 skill inventory 를 고정한 instruction-surface A/B 비교" 같은 더 좁은 후속이 필요하면 새 issue 로 다시 자르는 편이 낫다.
2. `#6` [mode evaluate fails with `artifactPaths must be an array` even when `report build` accepts the same packet](https://github.com/corca-ai/cautilus/issues/6)
   아직 open 유지가 맞다.
   `v0.5.2..v0.5.3` 사이에 `scenario_results` / `report` normalization seam 에 의미 있는 수정이 보이지 않는다.
   repo 안 근거만으로는 미해결 가능성이 높고, 최소 repro 를 checked-in fixture 또는 executable test 로 먼저 확보해야 한다.
   특히 non-ASCII path 가 섞인 `compareArtifact.artifactPaths` 경로를 우선 의심하는 편이 맞다.
3. `#7` [`optimize search` remains blocked on `missing_textual_feedback` even when held-out results include `compareArtifact.reasons`](https://github.com/corca-ai/cautilus/issues/7)
   현재 `main` 기준으로도 실결함 쪽에 가깝다.
   readiness collector 는 `compareArtifact.summary`, `regressed[].reason`, `noisy[].reason`, review findings, history signals 는 읽지만 `compareArtifact.reasons` 는 읽지 않는다.
   blocker 문구는 `compareArtifact reasons or humanReviewFindings` 라고 말하므로 구현과 operator contract 가 어긋나 있다.
   이슈 설명대로 code fix 가 우선이고, doc-only 봉합은 차선이다.
4. `#8` [Report/review flow loses adapter identity from `mode evaluate` output, forcing `--adapter-name` to be re-supplied](https://github.com/corca-ai/cautilus/issues/8)
   가장 명확한 현재형 bug 후보다.
   `mode evaluate` 쪽 report input 조립은 adapter identity 를 packet 에 실어두지 않고, downstream review/search bridge 는 여전히 explicit adapter resolution 에 기대고 있다.
   fix seam 은 `mode evaluate -> report packet -> review prepare-input / optimize search prepare-input` 전체에서 adapter identity 를 product-owned context 로 보존하는 것이다.
5. `#9` [`humanReviewFindings` schema is hard to discover from CLI/docs and validator errors reveal it one field at a time](https://github.com/corca-ai/cautilus/issues/9)
   문서와 discoverability gap 으로 남아 있다.
   reporting contract 는 `humanReviewFindings` 존재만 말하고 canonical object shape 를 바로 보여주지 않는다.
   validator 도 현재는 field 를 하나씩만 드러낸다.
   최소 slice 는 canonical shape 문서화 + `report` 또는 관련 bridge surface 의 example input 보강이다.

## Next Session

다음 세션의 권장 순서는 아래다.

1. `#5` 에 shipped-surface mapping comment 를 남기고 close 한다.
   핵심은 "issue 가 요구한 surface 는 `instruction-surface` 로 이미 분리 shipping 되었다" 를 짧고 단단하게 적는 것이다.
2. `#8` 을 먼저 고친다.
   operator friction 이 가장 직접적이고, `mode evaluate` 를 중심으로 review 와 optimize bridge 모두에 파급되기 때문이다.
   이 slice 는 executable test 를 반드시 같이 넣는다.
3. `#7` 을 바로 뒤에서 고친다.
   `compareArtifact.reasons` 를 실제 readiness evidence 로 읽게 하거나, 정말 의도적으로 제외할 거면 blocker text 와 contract 를 더 좁게 고쳐야 한다.
   현재는 code fix 가 더 자연스럽다.
4. `#6` 은 repro-first 로 다룬다.
   먼저 failing fixture 또는 executable test 로 mismatch 를 고정하고, 그 다음 normalization seam 을 줄여서 고친다.
   재현 없이 추측 수정부터 하면 시간만 잃는다.
5. `#9` 는 `#7` 과 묶어서 operator 문서/UX slice 로 마무리한다.
   `humanReviewFindings` 최소 object shape 를 docs 와 example input 양쪽에서 바로 찾을 수 있게 해야 한다.

이 순서로 가면 "stale close 1건 + bug 3건 + doc gap 1건" 으로 정리된다.
새 roadmap seam 은 이 burn-down 뒤에 다시 보는 편이 낫다.

## Stop Checks

코드나 계약을 건드린 세션이면 기본으로 아래 둘은 돌린다.

1. `npm run verify`
2. `npm run hooks:check`

아래 명령은 변경 seam 이 맞을 때만 추가한다.

1. `npm run test:on-demand`
   release-prep flow, self-dogfood workflow scripts, operator-facing quality record 를 바꿨을 때
2. issue 재현용 ad-hoc command
   단, 가능하면 같은 세션 안에서 executable test 로 승격한다

## References

- [README.md](../../README.md)
- [docs/cli-reference.md](../cli-reference.md)
- [docs/contracts/instruction-surface.md](../contracts/instruction-surface.md)
- [docs/contracts/reporting.md](../contracts/reporting.md)
- [docs/contracts/optimization-search.md](../contracts/optimization-search.md)
- [docs/maintainers/consumer-readiness.md](../maintainers/consumer-readiness.md)
- [docs/specs/instruction-surface.spec.md](../specs/instruction-surface.spec.md)
- [skills/cautilus/SKILL.md](../../skills/cautilus/SKILL.md)
