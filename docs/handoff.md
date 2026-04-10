# Cautilus Handoff

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 [README.md](/home/ubuntu/cautilus/README.md), [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md), [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md), [docs/workflow.md](/home/ubuntu/cautilus/docs/workflow.md), [docs/consumer-readiness.md](/home/ubuntu/cautilus/docs/consumer-readiness.md)를 먼저 읽는다.
- 다음 세션 목표가 `charness` consumer 검증이면 위 파일들을 읽은 직후 [charness/docs/handoff.md](/home/ubuntu/charness/docs/handoff.md)를 추가로 읽고 그 pickup을 우선한다.
- 시작 workflow는 `impl` 직행이 아니라 `quality` 스킬 선행이다. 현재 quality bar와 existing gates를 먼저 점검한 뒤, 그 결과를 바탕으로 같은 세션에서 `impl`로 이어서 구현한다.
- 작업 시작 repo는 [cautilus](/home/ubuntu/cautilus) 이고, 다음 primary consumer target은 `crill` 다음으로 `charness`다.
- gap이 product-owned runtime/contract/helper 문제면 [cautilus](/home/ubuntu/cautilus) 에서 먼저 고치고, consumer-owned adapter/artifact/policy 문제면 해당 consumer repo(`crill` 또는 `charness`)에서 고친다.

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
- evidence bundle helper seam(`evidence prepare-input`, `evidence bundle`)은 제품 표면으로 들어갔다.
- optimizer seam의 첫 live consumer proof는 `crill` 비교 표면에서 닫혔다.
- 다음 consumer 검증 우선순위는 `charness`다. 목표는 `charness`에서 현재 Cautilus claim이 동일하게 통과하는지 확인하고, 실패를 consumer-owned vs product-owned으로 분리하는 것이다.
- HTML report는 계속 deferred다. SoT는 JSON/YAML packet이다.
- [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md), [docs/consumer-readiness.md](/home/ubuntu/cautilus/docs/consumer-readiness.md) 는 위 방향으로 이미 갱신돼 있다.
- 이번 상태에서 `npm run lint`, `npm run test`, `npm run verify` 는 다시 통과했다.

## Next Session

1. [charness/docs/handoff.md](/home/ubuntu/charness/docs/handoff.md)를 먼저 읽고 `charness`의 현재 pickup과 blocker를 확정한다.
2. `charness`에서 Cautilus adapter 상태를 확인한다.
   - `node /home/ubuntu/cautilus/bin/cautilus adapter resolve --repo-root /home/ubuntu/charness`
   - adapter가 없으면 `node /home/ubuntu/cautilus/bin/cautilus adapter init --repo-root /home/ubuntu/charness`
   - `node /home/ubuntu/cautilus/bin/cautilus doctor --repo-root /home/ubuntu/charness`
3. `charness` primary consumer proof를 실행한다.
   - `node /home/ubuntu/cautilus/bin/cautilus mode evaluate --repo-root /home/ubuntu/charness --mode full_gate --intent 'Charness should validate cleanly as the next standalone Cautilus consumer.' --baseline-ref origin/main --output-dir /tmp/cautilus-charness-full-gate`
4. 실패가 나오면 먼저 ownership을 분리한다.
   - consumer-owned(어댑터/픽스처/정책): `/home/ubuntu/charness`에서 수정
   - product-owned(runtime/contract/helper): `/home/ubuntu/cautilus`에서 수정
5. 수정 후 동일 명령으로 재검증하고, 결과를 `charness` handoff와 이 handoff 둘 다에 resume command까지 남긴다.
6. `cautilus`를 수정했다면 마지막에 `npm run lint`, `npm run test`, `npm run verify`를 다시 통과시킨다.

## Premortem

- 다음 세션에서 가장 쉬운 오해는 `crill`을 다시 처음부터 검증하는 것이다.
  현재 우선순위는 `charness` consumer proof다.
- `charness` failure를 곧바로 `cautilus` 결함으로 단정할 수 있다.
  먼저 consumer-owned vs product-owned ownership 분리가 필요하다.
- `charness` handoff를 읽지 않고 명령부터 실행하면 이미 알려진 blocker를 반복할 가능성이 높다.
- `optimize`/`evidence` seam을 무한 루프로 확장할 위험이 있다.
  현재 claim은 bounded loop와 explicit gate 유지다.

## Discuss

- 다음 consumer 검증의 1순위는 `charness`다.
- `crill`은 새 제품 seam이 생길 때만 spot-check 성격으로 다시 태운다.
- `ceal`은 여전히 깊은 consumer이지만, 바로 다음 실행 단위는 `charness` 검증 결과를 먼저 닫는 것이다.

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
- [charness/docs/handoff.md](/home/ubuntu/charness/docs/handoff.md)
