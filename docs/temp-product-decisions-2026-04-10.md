# Cautilus Product Decisions Temp Log

이 문서는 2026-04-10 기준 임시 의사결정 로그다.
목표는 큰 리뷰를 한 번에 끝내는 것이 아니라, 열린 질문을 작게 쪼개서 하나씩 결정하는 것이다.

## Working Rule

- 이미 consumer-owned 로 고정된 내용은 다시 열지 않는다.
- 이미 product-owned 로 고정된 내용은 구현 완성도만 따로 본다.
- 한 번에 하나의 질문만 결정한다.
- 결정 전에는 `current claim`, `actual proof`, `recommended decision` 세 줄만 유지한다.

## Fixed Context

다음 내용은 이번 논의의 출발점으로 고정한다.

### Consumer Boundary

- `charness`는 deterministic local quality gate를 계속 consumer repo 안에 둔다.
- `charness`의 root `cautilus-adapter.yaml`는 현재 intentionally narrow 한 default evaluator entrypoint다.
- `Cautilus`는 `charness` repo hygiene script를 흡수하지 않는다.
- 출처:
  [docs/consumer-migration.md](./consumer-migration.md),
  [docs/charness-consumer-boundary.md](./charness-consumer-boundary.md)

### Repo-Agnostic Product Framing

- `Cautilus`의 제품 설명은 repo name 중심이 아니라 repo-agnostic surface
  archetype 중심이어야 한다.
- 제품 문서에서는 `chatbot`, `skill`, `cli`, `workflow`, `agent runtime`
  같은 generic surface를 먼저 설명한다.
- 특정 consumer repo 이름은 product positioning의 중심이 아니라 dogfood
  evidence 또는 migration note에만 제한적으로 남긴다.
- 특정 repo의 현재 구조를 그대로 product concept로 승격하지 않는다.

### Product Boundary

- `Cautilus`는 generic workflow contract, CLI, normalization helper를 owning surface로 둔다.
- HTML report는 아직 deferred 상태다.
- packet truth가 HTML보다 우선이다.

## Decision Backlog

아래부터 하나씩 결정한다.

### D1. Core Surface vs Experimental Surface

current claim:
- 현재 문서들은 `mode evaluate`, `review variants`, `cli evaluate`, `scenario normalize`, `scenario prepare-input`, `scenario propose`, `evidence`, `optimize`를 거의 같은 강도로 현재 제품 surface처럼 서술한다.

actual proof:
- `mode evaluate`, `review variants`, `cli evaluate`, report/review packet은 CLI, 테스트, consumer evidence가 비교적 강하다.
- `optimize`는 로컬 제품 surface와 테스트는 있지만 live-consumer proof는 아직 문서상 미완료다.
- `evidence`와 `scenario propose` 계열은 packet/helper seam으로는 성립하지만, core engine으로 읽힐 만큼 consumer proof가 강하진 않다.

recommended decision:
- 현재 문서에서 surface를 두 층으로 나눈다.
- `core validated surface`
- `product-owned helper surface`

status:
- decided

decision:
- 현재 문서에서 `Cautilus` surface를 `core validated surface` 와
  `product-owned helper surface` 로 명시적으로 분리한다.

follow-up effect:
- 이후 문서 정리에서는 helper seam이 current repo 안에 구현되어 있어도,
  consumer proof와 runtime centrality가 다르면 core와 같은 강도로 쓰지 않는다.
- 다음 문서 정리 후보:
  - [README.md](../README.md)
  - [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
  - [docs/consumer-readiness.md](./consumer-readiness.md)

### D2. Scenario History Status

current claim:
- 문서상으로는 scenario split selection, graduation history, baseline cache가 evaluation engine의 중심처럼 읽힌다.

actual proof:
- [scripts/agent-runtime/scenario-history.mjs](../scripts/agent-runtime/scenario-history.mjs) 에 pure helper는 있다.
- 하지만 현재 [scripts/agent-runtime/evaluate-adapter-mode.mjs](../scripts/agent-runtime/evaluate-adapter-mode.mjs) 는 이 로직을 orchestration loop에 직접 연결하지 않는다.

recommended decision:
- 당장은 `scenario-history`를 `implemented helper, not yet core runtime` 으로 분류할지,
- 아니면 다음 구현 우선순위 1번으로 올려 current product claim에 맞게 실제 loop에 연결할지 결정한다.

status:
- decided

decision:
- `scenario-history`는 다음 구현 우선순위 1번으로 올린다.
- 현재 claim을 낮추는 대신, 실제 runtime loop에 연결하는 방향으로 간다.

follow-up effect:
- 다음 implementation slice는 `scenario-history`를 pure helper로만 두지 않고,
  공식 실행 경로 하나에 연결해야 한다.
- 다만 첫 slice는 작게 유지한다.
  - 포함:
    - checked-in profile read
    - mode-aware scenario selection
    - explicit scenario results 기반 history update
  - 제외:
    - baseline cache 완성
    - scenario authoring UX
    - HTML/UI 확장

### D3. Consumer Readiness Vocabulary

current claim:
- 일부 문서는 특정 repo 이름을 중심으로 consumer 역할을 설명한다.
- 이 framing은 현재 dogfood provenance는 보여주지만, product positioning을
  repo-coupled 하게 만들 위험이 있다.

actual proof:
- 현재 dogfood evidence는 여러 consumer repo에 분산돼 있다.
- 하지만 그 evidence가 product abstraction의 기준이 되어야 하는 것은 아니다.
- 제품이 지켜야 할 기준은 특정 repo가 아니라 generic surface archetype이다.

recommended decision:
- product-facing 문서에서는 repo 이름 중심 vocabulary를 버린다.
- `chatbot`, `skill`, `cli`, `workflow`, `agent runtime` 같은
  repo-agnostic surface vocabulary로 다시 쓴다.
- 특정 repo 이름은 아래로 내린다.
  - migration evidence
  - dogfood provenance
  - consumer readiness appendix

status:
- decided

decision:
- 앞으로 product-facing 문서에서는 repo name 중심 framing을 쓰지 않는다.
- 제품 설명은 generic surface archetype 중심으로 쓴다.
- 특정 repo 이름은 migration, dogfood evidence, appendix 층으로만 내린다.

follow-up effect:
- 이후 문서 정리에서는 아래 문서부터 repo-agnostic 표현으로 재작성한다.
  - [README.md](../README.md)
  - [docs/master-plan.md](./master-plan.md)
  - [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
- consumer repo 이름이 필요하면 제품 개념 설명 본문이 아니라 증거 문맥에만 둔다.

## Next Decision

다음 decision item은 아직 정하지 않았다.
