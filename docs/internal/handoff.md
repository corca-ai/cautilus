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

2026-04-18 세션 기준 public release 는 `v0.5.5` 이다.
이번 세션에서는 `instruction-surface` contract 에서 bootstrap helper 와 durable work skill 을 분리하는 `#11` 을 구현했고, 그 변경을 `v0.5.5` 로 release 했다.
이전 세션에서 정리했던 `#5` 부터 `#10` 까지의 seam 은 유지한 채, instruction-surface summary 가 이제 bootstrap-heavy repo 도 honest 하게 표현할 수 있게 됐다.

지금 기억할 product 상태는 여덟 묶음이다.

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
6. public onboarding 계약은 이제 `doctor --scope agent-surface` 와 기본 `doctor` 를 분리해 설명한다.
   `README`, `install.md`, `docs/guides/consumer-adoption.md`, `docs/cli-reference.md`, install/update CLI output, bundled `skills/cautilus/SKILL.md` 전부에서 같은 canonical sequence 를 쓴다.
   순서는 `install -> doctor --scope agent-surface -> adapter init -> adapter resolve -> doctor --repo-root .` 이고, 첫 bounded run 은 repo-scope doctor 뒤에 하도록 못 박아 두었다.
7. named-adapter-only consumer repo 는 이제 plain repo doctor 에서 더 덜 오해를 부른다.
   default unnamed adapter 가 없고 named adapters 만 있으면 `doctor` 는 `missing_default_adapter` 와 `named_adapters` 힌트를 돌려주고, `review prepare-input` 와 `optimize search prepare-input` 는 report 에 `adapterContext` 가 빠져 있어도 sole named adapter 하나만 있으면 거기로 fallback 한다.
   `review prepare-input --help` 와 `commands --json` 는 이제 `report build --example-input` 와 minimum `humanReviewFindings` shape 를 직접 가리킨다.
8. `instruction-surface` routing summary 는 이제 bootstrap helper 와 durable work skill 을 따로 셀 수 있다.
   observed `routingDecision` 과 checked-in `expectedRouting` 모두 `bootstrapHelper` 와 `workSkill` 을 받을 수 있고, `selectedSkill` 은 single-lane 하위호환 alias 로 남겼다.
   summary packet 은 `bootstrapHelperCounts` 와 `workSkillCounts` 를 별도로 내고, self-dogfood example 과 checked-in fixture 도 `find-skills -> impl` 분리를 실제로 사용한다.

## Recent Commits

최근 주요 커밋:

```text
7307206 Prepare v0.5.5 release
9a98772 Separate bootstrap helpers from work-skill routing
1e806cd Reduce named-adapter onboarding ambiguity
3dee64c Prepare v0.5.4 release
7845e47 Clarify AGENTS skill routing for charness
4aca699 Refresh handoff after issue burn-down
```

`7307206` 에서 `0.5.5` release prepare 를 마쳤고, 이후 `v0.5.5` 태그를 push 해서 GitHub release 와 binary assets 까지 공개된 상태다.

## Release Status

이번 세션에서 확인한 release 상태는 아래다.

1. `v0.5.5` tag 는 `origin` 에 push 되어 있고, GitHub release object 도 published 상태다.
2. public release assets 는 GitHub release API 에서 확인된다.
   tarballs, checksums, release notes, Homebrew formula asset 이 모두 올라와 있다.
3. `npm run release:verify-public -- --version v0.5.5` 는 통과했다.
   release object, checksums, formula asset, tap formula 까지 public surface 검증이 끝난 상태다.
4. `npm run release:smoke-install -- --channel install_sh --version v0.5.5` 도 통과했다.
   install script 로 받은 binary 가 `--version`, `version --verbose`, `update` 까지 정상 응답했다.
5. native Homebrew smoke 는 이번 세션에서 일부러 돌리지 않았다.
   이 경로는 host package manager 를 실제로 mutate 하므로 on-demand 로만 다룬다.

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
6. `#11` [instruction-surface summary should separate bootstrap helper from work-skill routing](https://github.com/corca-ai/cautilus/issues/11)
   `instruction-surface` contract, schemas, fixtures, self-dogfood runner prompt, summary aggregation 이 이제 `bootstrapHelper` 와 `workSkill` 을 first-class 로 다룬다.
   `selectedSkill` 은 old single-lane expectations 를 깨지 않도록 compatibility alias 로 유지했다.

새 follow-up triage 는 아래처럼 보면 된다.

1. `#10` [`doctor --repo-root` reports missing adapter for repos that rely on named adapters under `.agents/cautilus-adapters/`](https://github.com/corca-ai/cautilus/issues/10)
   product mismatch 였고 실제로 재현됐다.
   fix 는 `1e806cd` 에 들어갔다.
   plain repo doctor 는 이제 default unnamed adapter 가 없더라도 named adapters 존재를 별도 status 와 suggestions 로 드러낸다.
2. `#9` 의 새 댓글은 “완전 미발견” 보다 help/discovery follow-up 으로 보는 편이 맞았다.
   `review prepare-input --help` 와 `commands --json` 가 이제 `report build --example-input` 와 minimum `humanReviewFindings` shape 를 직접 노출한다.
3. `#8` 의 새 댓글은 원래 보고된 seam 을 artifact 없이 완전히 재현하진 못했지만, 같은 failure surface 에 대한 fallback 과 diagnostics 는 보강했다.
   report 에 `adapterContext` 가 빠졌더라도 sole named adapter 하나만 있으면 `review prepare-input` 와 `optimize search prepare-input` 가 그 adapter 를 재사용한다.
   여러 named adapters 가 있는 repo 에서 여전히 재현된다면 다음엔 `report.json` 의 `.adapterContext` 와 generated optimize packet 을 같이 받아서 본다.
4. `#11` 은 이번 세션에서 product-side 로 처리했다.
   bootstrap helper 와 work skill 을 따로 기대하거나 관찰할 수 있으므로, `find-skills` 같은 bootstrap helper 와 `impl` 같은 durable work skill 을 같은 honest run 안에서 같이 표현할 수 있다.

## Charness Follow-Up

이번 세션에서 드러난 operator mistake 하나는 canonical `$charness:premortem` 경로를 열 수 있는지 직접 확인하지 않고, local fallback 으로 너무 빨리 내려간 점이다.
이건 skill 쪽에서도 guardrail 을 둘 여지가 있다고 판단해서 `corca-ai/charness#38` 을 열어 두었다.
요지는 `premortem` skill 이 canonical path 가 막혔다고 선언하기 전에 subagent availability 를 먼저 확인하거나 시도하도록 요구를 더 분명히 하자는 것이다.

## Next Session

다음 세션은 release blocker 를 처리하는 세션이 아니라, `v0.5.5` 이후 onboarding 체감과 instruction-surface consumer adoption 을 보는 세션이다.

1. 새 consumer 가 여전히 `doctor ready` 에서 멈춘다면, 다음 개선점은 문서 분리보다 “repo-scope doctor 뒤 첫 bounded run” 을 더 product-owned 하게 만드는 쪽이다.
2. 여러 named adapters 를 가진 consumer repo 에서 `#8` 류 repro 가 다시 오면, `report.json` 의 `.adapterContext`, `optimize-input.json`, `optimize-search-input.json` 을 같이 받아 exact loss point 를 잡는다.
3. `charness` 같은 bootstrap-heavy consumer 에서 새 `bootstrapHelper` / `workSkill` lanes 가 실제로 false mismatch 를 줄이는지 확인한다.
4. `corca-ai/charness#38` 진행 여부를 보고, `premortem` skill 이 정말 availability check 를 강제하게 바뀌면 여기 `AGENTS.md` 의 skill-routing 문구도 그에 맞춰 다시 다듬는다.

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
