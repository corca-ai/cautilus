# Cautilus Handoff

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 [README.md](/home/ubuntu/cautilus/README.md), [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md), [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md), [docs/workflow.md](/home/ubuntu/cautilus/docs/workflow.md), [docs/consumer-readiness.md](/home/ubuntu/cautilus/docs/consumer-readiness.md)를 먼저 읽는다.
- 다음 세션 목표가 operator feedback / runner UX 후속 작업이면 [command-progress.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/command-progress.mjs), [evaluate-adapter-mode.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/evaluate-adapter-mode.mjs), [run-workbench-executor-variants.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/run-workbench-executor-variants.mjs)를 바로 읽고 같은 seam을 이어서 다룬다.
- 시작 workflow는 `impl` 직행이 아니라 `quality` 스킬 선행이다. 현재 quality bar와 existing gates를 먼저 점검한 뒤, 그 결과를 바탕으로 같은 세션에서 `impl`로 이어서 구현한다.
- 작업 시작 repo는 [cautilus](/home/ubuntu/cautilus) 이다. `charness` live failure는 이번 시점에서 consumer-owned follow-up으로 넘겼고, 다음 제품 작업은 다시 `cautilus` 내부 seam을 우선한다.
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
- 이번 세션에서 operator feedback 철학을 실행기 표면으로 실제 반영했다.
  - 공용 progress/heartbeat helper: [command-progress.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/command-progress.mjs)
  - `mode evaluate`: `stderr` progress + heartbeat + failure diagnostics + ownership hint, `stdout`은 최종 `report.json` path 유지, `--quiet` 지원
  - `review variants`: 같은 progress contract 적용, variant별 `.stdout` / `.stderr` artifact 실제 기록, `stdout`은 최종 `summary.json` path 유지, `--quiet` 지원
- 관련 커밋:
  - `d57408f` `Add progress feedback to mode evaluation`
  - `77dd522` `Add heartbeat feedback to evaluation runners`
- 이번 상태에서 `npm run lint`, `npm run test`, `npm run verify` 는 다시 통과했다.
- `charness`는 한 번 `accept-now` snapshot이 있었지만, latest live rerun은 consumer-owned broken link 때문에 `reject`였다.
  - failing file: [charness/docs/handoff.md](/home/ubuntu/charness/docs/handoff.md)
  - failure signal: broken absolute link `/home/ubuntu/charness/docs/skill-migration-map.md`
  - ownership: `charness` consumer-owned 문서 문제
  - 사용자가 이제 이 follow-up은 `charness`가 직접 처리한다고 명시했다.
- HTML report는 계속 deferred다. SoT는 JSON/YAML packet이다.
- [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md), [docs/consumer-readiness.md](/home/ubuntu/cautilus/docs/consumer-readiness.md) 는 위 방향으로 이미 갱신돼 있다.

## Next Session

1. 다음 제품 slice가 정말 필요한지 먼저 판단한다. 현재 `mode evaluate`와 `review variants`에는 early feedback contract가 들어갔고, `charness` follow-up은 consumer 쪽으로 넘겨졌다.
2. 후속 작업이 필요하면 `frequent feedback` 철학을 더 넓힐지 결정한다.
   - 후보 A: 다른 long-running entrypoint에도 [command-progress.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/command-progress.mjs) 재사용
   - 후보 B: heartbeat를 단순 liveness에서 더 풍부한 stage-specific signal로 확장
   - 후보 C: ownership hint를 packet이나 structured exit metadata까지 승격
3. 다음 slice를 고르면 shared helper 우선으로 구현하고, `stdout final artifact path / stderr progress` 계약을 유지한다.
4. 제품 변경이 생기면 `npm run lint`, `npm run test`, `npm run verify`를 다시 통과시킨다.

## Premortem

- 다음 세션에서 가장 쉬운 오해는 `charness` broken link를 다시 `cautilus`에서 고치려는 것이다.
  그 failure는 consumer-owned이고, 사용자도 `charness`가 직접 처리한다고 명시했다.
- 또 다른 쉬운 오해는 `stdout`에 progress를 더 얹어도 된다고 생각하는 것이다.
  현재 자동화/테스트 계약은 `stdout = final artifact path`다.
- heartbeat를 progress percentage로 과해석할 수 있다.
  지금 heartbeat는 “살아 있다”는 신호이지 세부 진행률 계약은 아니다.
- `optimize`/`evidence` seam을 무한 루프로 확장할 위험이 있다.
  현재 claim은 bounded loop와 explicit gate 유지다.

## Discuss

- 현재 열린 제품 질문은 “feedback 철학을 다른 실행 surface로 더 넓힐지”다.
- `stdout final artifact path / stderr progress` 계약은 유지하는 편이 맞다.
- `crill`은 새 제품 seam이 생길 때만 spot-check 성격으로 다시 태운다.
- `charness` live failure는 consumer-owned follow-up으로 넘겼다.

## References

- [README.md](/home/ubuntu/cautilus/README.md)
- [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md)
- [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md)
- [docs/workflow.md](/home/ubuntu/cautilus/docs/workflow.md)
- [docs/consumer-readiness.md](/home/ubuntu/cautilus/docs/consumer-readiness.md)
- [docs/contracts/optimization.md](/home/ubuntu/cautilus/docs/contracts/optimization.md)
- [skill-outputs/quality/quality.md](/home/ubuntu/cautilus/skill-outputs/quality/quality.md)
- [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)
- [command-progress.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/command-progress.mjs)
- [evaluate-adapter-mode.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/evaluate-adapter-mode.mjs)
- [run-workbench-executor-variants.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/run-workbench-executor-variants.mjs)
- [bin/cautilus](/home/ubuntu/cautilus/bin/cautilus)
- [/home/ubuntu/crill/.agents/cautilus-adapter.yaml](/home/ubuntu/crill/.agents/cautilus-adapter.yaml)
- [/home/ubuntu/crill/.agents/cautilus-adapters/consumer-artifacts.yaml](/home/ubuntu/crill/.agents/cautilus-adapters/consumer-artifacts.yaml)
- [/home/ubuntu/crill/tests/fixtures/cautilus/cli-help.json](/home/ubuntu/crill/tests/fixtures/cautilus/cli-help.json)
- [charness/docs/handoff.md](/home/ubuntu/charness/docs/handoff.md)
