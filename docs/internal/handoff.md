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

2026-04-19 세션 기준 public release 는 `v0.5.6` 이다.
이전 세션에서 `instruction-surface` split, `doctor` first bounded-run handoff, `#5` 부터 `#11` 까지의 seam 정리를 끝냈고, 이번 세션에서는 `instruction-surface` self-dogfood 승격, GEPA/optimize-search runtime ownership 정리, 그리고 retired JS optimize-search runtime 의 experimental 격리를 마쳤다.
핵심은 세 가지다.
첫째, adapter 가 이제 `optimize_search` 블록으로 repo별 `light` / `medium` / `heavy` budget preset 과 default tier 를 소유할 수 있다.
둘째, canonical search packet 이 `searchConfigSources` 를 남겨 product default / adapter preset / explicit override 출처를 다시 열어볼 수 있다.
셋째, Codex skill-test telemetry 는 이제 human stderr scraping 이 아니라 machine-readable `codex exec --json` stream 에서 provider / model / token totals 를 product-owned 로 보존한다.
넷째, optimize-search 의 shipped semantics 는 Go runtime 이 소유한다는 ownership 을 docs 와 maintainer workflow 에 명시했고, 첫 parity slice 로 final selection constraint-cap enforcement 와 review/full-gate checkpoint execution 을 Go runner 로 올렸다.
대신 이번 세션에서 명확히 한 것도 있다.
현재 optimize-search runner 는 full GEPA 엔진이 아니다.
packet 에는 merge toggle, three-parent policy 같은 future intent 가 보존되지만, 현재 runner 가 실제로 소비하는 것은 one-seed plus bounded frontier-following multi-generation mutation, held-out reevaluation, telemetry-aware frontier ranking, final selection constraint caps, final review/full-gate checkpoints 까지다.
문서도 이 경계에 맞춰 다시 honest 하게 줄였다.

지금 기억할 product 상태는 열네 묶음이다.

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
9. repo-scope `doctor` ready payload 는 이제 `first_bounded_run` 을 직접 준다.
   여기에는 `cautilus scenarios --json` 과 같은 archetype catalog, 각 archetype 의 `exampleInputCli`, 그리고 starter `mode evaluate -> review prepare-input -> review variants` loop 가 같이 들어 있다.
   human-readable `cautilus scenarios` 출력, `README`, `install.md`, `docs/guides/consumer-adoption.md`, `docs/cli-reference.md`, bundled skill, packaged skill, executable specs 도 같은 seam 으로 맞춰 두었다.
10. adapter 는 이제 optional `optimize_search` block 으로 repo-owned search preset 을 정의할 수 있다.
    shared tier label 은 product 가 계속 소유하고, adapter 는 default tier, per-tier numeric limits, review checkpoint default, selection policy 를 override 한다.
    canonical search packet 은 `searchConfigSources` 를 남겨 각 knob 가 product default / adapter default / adapter preset / explicit override 중 어디서 왔는지 보여 준다.
11. Codex skill-test telemetry 는 이제 `codex exec --json` event stream 을 읽어 provider, model, prompt/completion/total tokens 를 product-owned 로 보존한다.
    supported OpenAI Codex models 에 대해서는 checked-in pricing catalog 로 `cost_usd` 를 derived 하며, `cost_truth=derived_pricing`, `pricing_source`, `pricing_version` 도 같이 남긴다.
    optimize-search / GEPA 문서도 현재 구현 경계에 맞춰 줄였다.
    merge 와 three-parent 는 packet 에 intent 를 보존하지만 current runner 는 아직 실제 merge candidate synthesis 를 수행하지 않는다.
12. optimize-search result 는 이제 result-only reader 를 위한 얇은 experiment summary surface 를 같이 낸다.
    `searchConfigSources`, `experimentContext`, `telemetryCompleteness` 가 result packet 에 같이 들어가므로, operator 는 input packet 을 다시 열지 않아도 어떤 adapter / baseline / budget / target / mutation backend 조건에서 돌았는지와 비용/시간/token telemetry 가 어디까지 완전한지 바로 볼 수 있다.
13. `instruction-surface` 는 이제 공식 on-demand self-dogfood surface 다.
    root unnamed adapter 를 과적재하지 않고 named adapter 를 유지하되, `npm run dogfood:self:instruction-surface` 를 canonical maintainer entrypoint 로 올렸다.
    operator acceptance 와 development docs 도 같은 경로를 가리킨다.
14. retired richer Node optimize-search runtime 은 이제 shipped `agent-runtime` 경로 밖으로 내려갔다.
    `scripts/agent-runtime/` 에는 thin helper 와 provider glue 만 남기고, 이전 JS core/checkpoint/merge runtime 과 flow tests 는 `scripts/experiments/optimize-search-js/` 로 옮겼다.
    product docs 와 maintainer docs 도 이 경계를 source of truth 로 명시한다.

## Recent Commits

최근 주요 커밋:

```text
<pending> Retire the Node optimize-search runtime to experiments
9593bae Promote instruction-surface dogfood and Go finalist checks
60c36f3 Make doctor hand off the first bounded run
7307206 Prepare v0.5.5 release
9a98772 Separate bootstrap helpers from work-skill routing
1e806cd Reduce named-adapter onboarding ambiguity
3dee64c Prepare v0.5.4 release
7845e47 Clarify AGENTS skill routing for charness
4aca699 Refresh handoff after issue burn-down
```

`b38502f` 에서 `0.5.6` release prepare 를 마쳤고, 이후 `v0.5.6` 태그를 push 해서 GitHub release 와 binary assets 까지 공개된 상태다.

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
이건 `corca-ai/charness#38` 로 올라갔고, 현재 `charness v0.3.3` 에서는 `premortem` skill 이 canonical path 를 blocked 라고 선언하기 전에 capability check 를 먼저 수행하도록 정리됐다.
별도로 `corca-ai/charness#39` 는 released `Cautilus v0.5.5` 기준으로 `bootstrapHelper` / `workSkill` split consumer validation 을 요청하는 follow-up 이었고, 현재는 close 됐다.
`charness` 는 checked-in `instruction-surface` case 와 validator 를 widened 해서 bootstrap case 를 `bootstrapHelper=find-skills`, `workSkill=impl` expectation 으로 통과시키고, released `v0.5.5` binary 에서 `cautilus instruction-surface test --repo-root .` 를 `recommendation=accept-now` 로 확인했다.
즉 `charness` 쪽 follow-up 은 pending risk 가 아니라 external bootstrap-heavy consumer proof 로 흡수하면 된다.

## Next Session

다음 세션의 우선순위는 onboarding 보다 GEPA runtime convergence 쪽이다.
여러 external consumer 가 이미 잘 쓰고 있어서 onboarding 은 지금 즉시 불타는 seam 이 아니다.
`doctor ready` 뒤에서 멈춘다는 fresh-consumer signal 이 다시 오기 전까지는 후순위로 둬도 된다.

1. optimize-search runtime convergence 를 계속 진행한다.
   shipped path 에서 JS dual runtime 은 치웠지만, `scripts/experiments/optimize-search-js/` 에 parity backlog 가 남아 있다.
   다음 parity 후보는 frontier-promotion review reuse 와 merge synthesis 중 무엇을 먼저 Go 로 올릴지 정하는 것이다.
2. Codex cost truth surface 를 계속 다듬는다.
   지금은 derived pricing 까지 올라왔지만, future stable machine cost field 가 있으면 exact surface 로 바꿀 여지가 있다.
3. optimize-search / deployment-evidence 의 experiment context 를 더 노골적으로 드러낼지 본다.
   optimize-search result 자체에는 이미 result-only summary 면이 있다.
   다음 질문은 다른 evidence surfaces 도 같은 수준의 context summary 를 가져야 하는지다.
4. 여러 named adapters 를 가진 consumer repo 에서 `#8` 류 repro 가 다시 오면, 여기서는 바로 diagnostics, fallback, regression test 추가를 할 수 있다.
   다만 diagnosis 자체는 outside artifact 가 필요하다.
   최소한 `report.json` 의 `.adapterContext`, `optimize-input.json`, `optimize-search-input.json`, 그리고 기대한 adapter name/context 를 받아야 exact loss point 를 잡을 수 있다.

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
