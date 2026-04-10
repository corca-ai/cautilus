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
  [docs/consumer-migration.md](/home/ubuntu/cautilus/docs/consumer-migration.md),
  [docs/charness-consumer-boundary.md](/home/ubuntu/cautilus/docs/charness-consumer-boundary.md)

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
  - [README.md](/home/ubuntu/cautilus/README.md)
  - [docs/specs/current-product.spec.md](/home/ubuntu/cautilus/docs/specs/current-product.spec.md)
  - [docs/consumer-readiness.md](/home/ubuntu/cautilus/docs/consumer-readiness.md)

### D2. Scenario History Status

current claim:
- 문서상으로는 scenario split selection, graduation history, baseline cache가 evaluation engine의 중심처럼 읽힌다.

actual proof:
- [scripts/agent-runtime/scenario-history.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/scenario-history.mjs) 에 pure helper는 있다.
- 하지만 현재 [scripts/agent-runtime/evaluate-adapter-mode.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/evaluate-adapter-mode.mjs) 는 이 로직을 orchestration loop에 직접 연결하지 않는다.

recommended decision:
- 당장은 `scenario-history`를 `implemented helper, not yet core runtime` 으로 분류할지,
- 아니면 다음 구현 우선순위 1번으로 올려 current product claim에 맞게 실제 loop에 연결할지 결정한다.

status:
- open

### D3. Consumer Readiness Vocabulary

current claim:
- 일부 문서는 `ceal`을 deepest consumer처럼 읽게 하고, 다른 문서는 `crill`의 증거가 더 깊다.

actual proof:
- `ceal`: adapter/review-variant/chatbot reference 성격이 강하다.
- `crill`: mode/cli/review variants/compare까지 더 넓은 runtime proof가 있다.
- `charness`: skill normalization reference와 narrow root adapter proof가 핵심이다.

recommended decision:
- `deepest consumer` 같은 단일 표현 대신 surface별 역할로 다시 쓴다.
- 예:
  - `ceal`: primary chatbot reference
  - `crill`: deepest evaluated workflow consumer
  - `charness`: primary skill normalization reference

status:
- open

### D4. Helper Admission Rule

current claim:
- `chatbot`, `cli`, `skill` helper는 이미 제품에 들어왔다.

actual proof:
- 현재 셋은 각자 real reference가 있고 packet/test가 있다.
- 하지만 다음 helper를 어떤 기준으로 productize 하는지는 문서에 명시돼 있지 않다.

recommended decision:
- 새 helper는 아래 둘 중 하나를 만족할 때만 productize 한다.
- 두 consumer 이상이 같은 normalized pattern을 공유한다.
- 또는 `Cautilus` 자신이 first-class dogfood consumer다.

status:
- open

## Next Decision

다음은 D2만 결정한다.

질문:
- `scenario-history`를 당장 `implemented helper, not yet core runtime` 으로 분류할지,
  아니면 다음 구현 우선순위 1번으로 올려 current product claim에 맞게 실제 loop에 연결할지
