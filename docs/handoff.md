# Cautilus Handoff

이 문서는 다음 세션이 바로 이어야 할 한 수만 남긴다.

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 먼저
  [README.md](../README.md),
  [AGENTS.md](../AGENTS.md),
  [docs/master-plan.md](./master-plan.md),
  [docs/specs/index.spec.md](./specs/index.spec.md),
  [docs/specs/archetype-boundary.spec.md](./specs/archetype-boundary.spec.md),
  [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
  를 읽는다.
- 시작 branch는 현재 `main`이다.
- product-owned seam이면 `cautilus`에서 먼저 고친다.

## Current State

- 아키타입 경계가 실제 코드·문서에 고정됐다. `cautilus.archetype.v1`
  계약이 [archetype-boundary.spec.md](./specs/archetype-boundary.spec.md)에
  체크인됐고, `lint:specs`가 1:1 mapping을 지킨다.
- 3 first-class archetype과 각각의 schema / helper / CLI / contract:
  - **chatbot** — `cautilus.chatbot_normalization_inputs.v1` ·
    `chatbot-proposal-candidates.mjs` ·
    `cautilus scenario normalize chatbot` ·
    [chatbot-normalization.md](./contracts/chatbot-normalization.md)
  - **skill** — `cautilus.skill_normalization_inputs.v2` ·
    `skill-proposal-candidates.mjs` ·
    `cautilus scenario normalize skill` ·
    [skill-normalization.md](./contracts/skill-normalization.md)
  - **workflow** — `cautilus.workflow_normalization_inputs.v1` ·
    `workflow-proposal-candidates.mjs` ·
    `cautilus scenario normalize workflow` ·
    [workflow-normalization.md](./contracts/workflow-normalization.md)
- `docs/workflow.md`는 `docs/evaluation-process.md`로 개명됐고 본문도
  "process" 표현으로 통일됐다. 패키지드 스킬 references와 모든 참조 링크가
  따라갔다.
- README에 3 archetype "Scenarios" 섹션 신규 블록이 들어갔다. 각 블록이
  **What you bring / Input / What happens / What comes back / Next action**
  5칸으로 정렬돼 있다.
- Go CLI도 `scenario normalize workflow` 커맨드를 노출하고,
  `scenario normalize skill`은 workflow 인풋을 `actionable error`로 거부한다.
- 공통 유틸은 `scripts/agent-runtime/shared/normalized-run.mjs`로 분리됐다.
- 이번 슬라이스로 하위호환 breaking change가 있었다:
  - `cautilus.skill_normalization_inputs.v1` 단종 (v2만 인정)
  - `cautilus.workflow_normalization_inputs.v1` 신설
  - `skill` 아키타입이 `cli_workflow` 인풋을 받지 않음
  - `docs/workflow.md` 경로 제거
- 버전은 `0.4.0`으로 올라갔고, `main` + `v0.4.0` 태그가 이미 푸시됐다.
  GitHub Actions release workflow가 바이너리·Homebrew·attestation을
  생성 중이다.

## Last Verified

- `npm run lint:specs` (5 specs, 571 guard rows)
- `npm run verify` (226/226 pass)
- `npm run hooks:check` (ready)
- `cautilus scenario normalize workflow --input ./fixtures/scenario-proposals/workflow-recovery-input.json` (정상 출력)
- `cautilus scenario normalize skill --input ./fixtures/scenario-proposals/workflow-recovery-input.json` (actionable error로 거부)

## Next Session

1. 공개 release surface 검증:
   `npm run release:verify-public -- --version v0.4.0`
   과 `npm run release:smoke-install -- --channel install_sh --version v0.4.0`.
   Actions가 아직 굴러가는 중이면 완료 대기 후 실행.
2. 아래 `archetype-boundary.spec.md` follow-up 중 하나 골라 다음 슬라이스
   진행 (스펙에 1-12번으로 번호 매겨져 있음):
   - 1 `cautilus scenarios` 커맨드
   - 2 `cautilus --help` 그룹핑 (registry JSON에 `group` 필드)
   - 3 `cautilus adapter init --scenario <chatbot|skill|workflow>` 템플릿
   - 4 `--example-input` 플래그
   - 5 README inline glossary (held-out, packet, bounded, executor
     variant, review variant, intent-first)
   - 6 behavior-intent surface `workflow_conversation` 리네이밍
   - 7 `cautilus doctor` ready 메시지 뒤 시나리오 힌트
   - 8 bundled SKILL.md 상단 3-archetype preamble
   - 9 fixture 네이밍 일관화 (`workflow-input.json` 추가/리네임)
   - 10 `narrative-adapter.yaml` source_documents에
     `archetype-boundary.spec.md` 추가
   - 11 README 섹션 재배치 (Scenarios를 Why 위로)
   - 12 experimental archetype escape hatch (`prototypes/` 네임스페이스)
   - 스펙 범위 밖: skill 내부 sub-drift 재검토 (`archetype-boundary.spec.md`
     "Why skill stays unified" 참고, 필요 시 재의결)
3. `corca-ai/charness`에 narrative / quality 스킬 개선 이슈는 이미
   등록됨. 다음 세션에서는 issue #22, #23에 후속 업데이트만 필요 시 남긴다.

## Consumer Migration (v0.3.x → v0.4.0)

하위호환 breaking 슬라이스라 외부 consumer가 있으면 다음을 갱신해야 한다.

- `schemaVersion`
  - skill: `cautilus.skill_normalization_inputs.v1` → `.v2`
  - workflow(구 skill에 섞여 있던 cli_workflow 인풋):
    `cautilus.skill_normalization_inputs.v1` →
    `cautilus.workflow_normalization_inputs.v1`
- CLI
  - `cautilus scenario normalize skill` + `cli_workflow` 인풋 →
    `cautilus scenario normalize workflow`로 이동
  - skill 아키타입의 `targetKind`는 `public_skill / profile / integration`만
    허용. `cli_workflow`는 workflow 아키타입 전용.
- 문서/링크
  - `docs/workflow.md` 참조가 있으면 `docs/evaluation-process.md`로 치환
  - 번들드 skill references의 `workflow.md`도 동일
- 확인
  - `cautilus doctor --repo-root .`가 ready로 돌면 wiring 재검증 완료
  - `cautilus scenario normalize workflow --input <workflow-input>.json`이
    정상 출력하면 새 아키타입 사용 가능

## Discuss

- 이번 세션의 판단:
  - 구현 편의(한 헬퍼에 3가지 드리프트)가 UX를 이기지 않도록 물리적으로
    파일·스키마·CLI를 쪼갰다.
  - 하위호환보다 mental model 정렬이 우선이라는 기조를 유지했다.
- 아직 열려 있는 질문:
  - 영어 독자도 `held-out`, `packet`, `bounded` 같은 용어를 자연히 알까? →
    inline glossary 슬라이스에서 해결.
  - `cautilus scenarios`가 `cautilus commands`와 어떻게 관계 맺을지 결정
    필요 (동일 registry 확장인가, 별도 리스트인가).
- 아직 의도적으로 안 하는 것:
  - 한국어 `README.ko.md` (영문 자체를 먼저 쉽게 만들기로 결정)
  - backward-compat shim (깔끔히 깼음)

## Premortem

- 가장 쉬운 오해: 아키타입 확장을 미리 많이 해두려는 욕심. 세 번째가 들어
  왔으니 네 번째(예: `tool_use`, `pipeline`)도 지금 만들자는 유혹. 하지
  말자. `archetype-boundary.spec.md`가 요구하는 대로, 새 아키타입은
  schema + helper + CLI + contract + fixture + README 블록을 한
  슬라이스에 같이 가져올 때만 추가한다.
- 가장 쉬운 실수: 다음 세션이 `0.4.0` 릴리즈 태그를 안 찍고 follow-up
  슬라이스부터 진행하는 것. 태그와 공개 검증이 먼저다.

## References

- [README.md](../README.md)
- [docs/master-plan.md](./master-plan.md)
- [docs/specs/archetype-boundary.spec.md](./specs/archetype-boundary.spec.md)
- [docs/specs/current-product.spec.md](./specs/current-product.spec.md)
- [docs/contracts/chatbot-normalization.md](./contracts/chatbot-normalization.md)
- [docs/contracts/skill-normalization.md](./contracts/skill-normalization.md)
- [docs/contracts/workflow-normalization.md](./contracts/workflow-normalization.md)
- [docs/evaluation-process.md](./evaluation-process.md)
- [scripts/agent-runtime/shared/normalized-run.mjs](../scripts/agent-runtime/shared/normalized-run.mjs)
