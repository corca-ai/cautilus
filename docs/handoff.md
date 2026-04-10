# Cautilus Handoff

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 [README.md](/home/ubuntu/cautilus/README.md), [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md), [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md), [docs/workflow.md](/home/ubuntu/cautilus/docs/workflow.md), [docs/consumer-readiness.md](/home/ubuntu/cautilus/docs/consumer-readiness.md)를 먼저 읽는다.
- 시작 workflow는 `impl` 직행이 아니라 `quality` 스킬 선행이다. 현재 quality bar와 existing gates를 먼저 점검한 뒤, 그 결과를 바탕으로 같은 세션에서 `impl`로 이어서 구현한다.
- 작업 시작 repo는 [cautilus](/home/ubuntu/cautilus) 이고, `crill`은 consumer 검증용 reference repo로 계속 쓴다.
- gap이 product-owned runtime/contract/helper 문제면 [cautilus](/home/ubuntu/cautilus) 에서 먼저 고치고, consumer-owned adapter/artifact/policy 문제면 [crill](/home/ubuntu/crill) 에서 고친다.

## Current State

- `Cautilus` main은 standalone binary + bundled skill 경계를 거의 닫았고, `workspace prepare-compare`, `mode evaluate`, `review variants`, `cli evaluate`, `scenario normalize chatbot|cli|skill`, `scenario prepare-input`, `scenario propose`, `scenario summarize-telemetry`, `optimize prepare-input`, `optimize propose` 까지 제품 표면이 있다.
- 공식 adapter contract는 `cautilus-adapter.yaml` / `cautilus-adapters/` 로 고정돼 있다.
- 이번 세션에서 `quality` 선행 workflow를 실제로 돌렸고, `.agents/quality-adapter.yaml` + [skill-outputs/quality/quality.md](/home/ubuntu/cautilus/skill-outputs/quality/quality.md) 가 현재 repo quality SoT로 추가됐다.
- `crill` consumer depth는 현재 핵심 표면 기준으로 충분히 검증됐다.
  - root adapter `full_gate`: `accept-now`
  - named adapter `cli-smoke`: 통과
  - named adapter `operator-recovery`: 통과
  - explicit CLI packet [cli-help.json](/home/ubuntu/crill/tests/fixtures/cautilus/cli-help.json): `accept-now`
  - report-driven `review variants`: passing `codex-review`
  - named compare adapter [consumer-artifacts.yaml](/home/ubuntu/crill/.agents/cautilus-adapters/consumer-artifacts.yaml): compare artifact verdict `improved`
- 그래서 `crill`은 “현재 claim을 입증하기 위한 core consumer verification” 기준으로는 이미 닫혔다. 다음 `crill` 검증은 새 제품 surface가 추가될 때 그 surface를 소비자로 다시 태우는 용도다.
- bounded optimizer helper의 첫 slice는 이제 제품 표면에 들어갔다.
  - product-owned contract: [docs/contracts/optimization.md](/home/ubuntu/cautilus/docs/contracts/optimization.md)
  - runtime: [build-optimize-input.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/build-optimize-input.mjs), [generate-optimize-proposal.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/generate-optimize-proposal.mjs)
  - fixtures/tests: [fixtures/optimize/](/home/ubuntu/cautilus/fixtures/optimize), [optimize-flow.test.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/optimize-flow.test.mjs)
- 남은 다음 제품 우선순위는 두 가지다.
  - raw-evidence mining helper: host raw log reader는 host가 소유하고, `Cautilus`는 normalized evidence bundle contract + helper script + bundled skill reference meta-prompt를 준다.
  - optimizer consumer proof: 새 `optimize` seam을 `crill` 또는 `ceal` consumer artifact로 한 번 태워서 live-consumer claim으로 올린다.
- HTML report는 필요하지만 지금은 deferred다. SoT는 계속 JSON/YAML packet이다.
- [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md), [docs/consumer-readiness.md](/home/ubuntu/cautilus/docs/consumer-readiness.md) 는 위 방향으로 이미 갱신돼 있다.
- 이번 상태에서 `npm run lint`, `npm run test`, `npm run verify` 는 다시 통과했다.

## Next Session

1. `quality` 스킬부터 발동해서 현재 repo의 gate surface와 missing deterministic checks를 점검한다.
2. report 작업은 현재 checkout에서 바로 하지 말고 별도 git worktree를 만든 뒤 그 worktree에서 진행한다.
   report 작업은 HTML/report UX 쪽 실험이므로 main checkout의 helper/contract 작업과 분리한다.
3. quality 결과를 본 뒤 같은 세션에서 `impl`로 이어서 evidence bundle / prepare-evidence helper를 먼저 자른다.
4. evidence helper를 추가하지 않고 optimizer 쪽을 더 만질 경우, 다음 구현 priority는 기능 추가가 아니라 consumer proof다.
   - `crill` 또는 `ceal` 쪽에 checked-in optimize input artifact를 만들고
   - 새 `optimize` seam이 실제 consumer packet으로도 도는지 확인한다.
5. 새 surface를 추가하면 그때만 `crill` consumer 검증을 다시 돈다.
   현재 재사용할 consumer surface:
   - [cli-smoke.yaml](/home/ubuntu/crill/.agents/cautilus-adapters/cli-smoke.yaml)
   - [operator-recovery.yaml](/home/ubuntu/crill/.agents/cautilus-adapters/operator-recovery.yaml)
   - [consumer-artifacts.yaml](/home/ubuntu/crill/.agents/cautilus-adapters/consumer-artifacts.yaml)
   - [cli-help.json](/home/ubuntu/crill/tests/fixtures/cautilus/cli-help.json)
6. report worktree에서 UI/report 작업을 하더라도, product-owned contract/helper 변경이 생기면 마지막에는 [consumer-readiness.md](/home/ubuntu/cautilus/docs/consumer-readiness.md) 와 이 handoff를 다시 맞춘다.

## Premortem

- 다음 세션에서 가장 쉬운 오해는 `crill` 검증을 처음부터 다시 여는 것이다.
  현재 core verification은 충분하다. 새 surface를 추가하지 않았다면 `crill`은 full rerun 대상이 아니라 spot-check 대상이다.
- report 작업을 main checkout에서 바로 시작하면 helper/contract 변경과 섞여서 경계가 흐려진다.
  report 실험은 separate worktree에서 시작해야 한다.
- raw log mining을 제품이 직접 읽는 방향으로 잘못 확장할 수 있다.
  raw reader는 host-owned이고, `Cautilus`는 normalized evidence bundle과 meta-prompt/helper까지만 소유해야 한다.
- optimizer를 “자동 무한 개선 루프”로 오해할 수 있다.
  이미 추가된 `optimize` surface도 bounded loop 전제다. held_out/comparison/review gate를 약화하는 방향으로 쓰면 안 된다.
- `quality`를 형식적 점검으로만 끝내고 바로 구현으로 넘어갈 수 있다.
  다음 세션의 `quality`는 실제 next gate를 고르기 위한 선행 작업이므로, 그 결과가 다음 구현 slice 선택을 바꿀 수 있다는 점을 잊지 말아야 한다.

## Discuss

- 다음 `crill` 검증은 “더 해야만 하는 일”은 아니다.
  현재 claim을 위한 검증은 충분하다. 다만 evidence helper, optimizer, report surface처럼 새 제품 seam을 만들면 그 seam을 `crill` consumer artifact로 다시 태우는 것이 좋다.
- `ceal`은 여전히 deepest live consumer라서, 다음 큰 consumer 검증 후보는 `ceal`이다.
- release/install surface는 이미 살아 있으므로, 다음 무게중심은 release ops보다 helper seams와 report worktree 분리다.

## References

- [README.md](/home/ubuntu/cautilus/README.md)
- [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md)
- [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md)
- [docs/workflow.md](/home/ubuntu/cautilus/docs/workflow.md)
- [docs/consumer-readiness.md](/home/ubuntu/cautilus/docs/consumer-readiness.md)
- [docs/contracts/optimization.md](/home/ubuntu/cautilus/docs/contracts/optimization.md)
- [skill-outputs/quality/quality.md](/home/ubuntu/cautilus/skill-outputs/quality/quality.md)
- [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)
- [bin/cautilus](/home/ubuntu/cautilus/bin/cautilus)
- [/home/ubuntu/crill/.agents/cautilus-adapter.yaml](/home/ubuntu/crill/.agents/cautilus-adapter.yaml)
- [/home/ubuntu/crill/.agents/cautilus-adapters/consumer-artifacts.yaml](/home/ubuntu/crill/.agents/cautilus-adapters/consumer-artifacts.yaml)
- [/home/ubuntu/crill/tests/fixtures/cautilus/cli-help.json](/home/ubuntu/crill/tests/fixtures/cautilus/cli-help.json)
