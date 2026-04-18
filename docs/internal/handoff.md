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
이번 세션의 초점이었던 post-release issue burn-down 은 끝났다.
`#5` 는 shipped `instruction-surface` surface 로 대체된 이슈로 close 했고, `#6` 부터 `#9` 까지의 실제 seam 도 모두 구현으로 정리했다.

지금 기억할 product 상태는 다섯 묶음이다.

1. `instruction-surface` 는 실제 shipped surface 다.
   `cautilus instruction-surface test` / `evaluate`, 전용 contracts, fixtures, self-dogfood adapter, routingDecision scoring 이 다 들어가 있다.
2. `mode evaluate -> report -> review/optimize/search` 브리지는 이제 adapter identity 를 product-owned `adapterContext` 로 보존한다.
   downstream operator 는 같은 adapter 를 다시 적지 않아도 된다.
3. `optimize search` readiness 는 이제 `compareArtifact.reasons` 를 실제 textual feedback 로 읽는다.
   held-out 결과에 review finding 이 없더라도 compare reason 만으로 unblock 될 수 있다.
4. `mode evaluate` 와 `report build` 는 `compareArtifact.artifactPaths` 의 in-memory `[]string` / JSON array 차이로 갈라지지 않는다.
   non-ASCII artifact path 도 같은 seam 에서 고정됐다.
5. `humanReviewFindings` 는 이제 contract docs, JSON schema, `cautilus report build --example-input`, validator hint 에서 바로 minimum shape 를 찾을 수 있다.
   public fixture 는 repo 안에서 항상 resolve 되는 adapter path 를 쓰도록 다시 맞춰 두었다.

## Recent Commits

최근 주요 커밋:

```text
0937194 Make report input review findings easier to discover
e85a22a Keep mode evaluate consistent with report build
3c91c66 Let optimize search use compare-artifact reasons
62d5b41 Preserve adapter identity across report bridges
7f78dd6 Refresh handoff for post-release issue triage
```

직전 public release 는 `v0.5.2` 였고, 지금은 `v0.5.3` 가 이미 공개된 상태다.

## Issue Triage

이번 세션에서 닫은 issue 와 seam 은 아래다.

1. `#5` [Support AGENTS.md-aware routing evals and expose first routing decision](https://github.com/corca-ai/cautilus/issues/5)
   `instruction-surface` shipped surface 로 흡수된 요구라 comment + close 처리했다.
2. `#6` [mode evaluate fails with `artifactPaths must be an array` even when `report build` accepts the same packet](https://github.com/corca-ai/cautilus/issues/6)
   root cause 는 Go runtime `assertArray` 가 in-memory `[]string` 을 받지 못한 것이었다.
   `mode evaluate` 에서 normalize 된 compare artifact 를 다시 report packet 으로 조립할 때만 터졌고, `report build` 는 JSON array 를 다시 읽으면서 우연히 통과하던 mismatch 였다.
3. `#7` [`optimize search` remains blocked on `missing_textual_feedback` even when held-out results include `compareArtifact.reasons`](https://github.com/corca-ai/cautilus/issues/7)
   JS/Go readiness collector 모두 `compareArtifact.reasons` 를 실제 textual feedback 로 읽게 고쳤다.
4. `#8` [Report/review flow loses adapter identity from `mode evaluate` output, forcing `--adapter-name` to be re-supplied](https://github.com/corca-ai/cautilus/issues/8)
   `mode evaluate` report input, report packet, review prepare-input, optimize prepare-input, optimize search prepare-input 전체에서 `adapterContext` 를 보존하게 고쳤다.
5. `#9` [`humanReviewFindings` schema is hard to discover from CLI/docs and validator errors reveal it one field at a time](https://github.com/corca-ai/cautilus/issues/9)
   docs/contracts, report schemas, CLI example-input, validator error hint 를 같이 보강했다.

## Next Session

다음 세션은 issue burn-down 이 아니라 post-burn-down 정리 쪽으로 보면 된다.

1. `charness` consumer 쪽에서 `instruction-surface` 또는 report/review bridge 를 실제로 새 `v0.5.3` surface 기준으로 사용 중인지 확인한다.
2. 필요하면 `review prepare-input` 와 `optimize prepare-input` 자체에도 richer topic help 나 example surface 를 더 붙인다.
   이번 세션은 `report build --example-input` 까지만 productized 했다.
3. 새 surface 를 늘리기 전에는 지금 고친 bridge seams 가 self-dogfood 와 release-prep 흐름에서 충분히 안정적인지만 보는 편이 낫다.

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
