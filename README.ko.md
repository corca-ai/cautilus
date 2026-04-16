[English README](./README.md)

# Cautilus

`Cautilus`는 프롬프트와 래퍼가 계속 바뀌어도 에이전트와 워크플로 동작을 정직하게 유지합니다.
이 프로젝트는 에이전트와 워크플로 동작 평가를 위한 저장소 로컬 계약 계층입니다.
보호하려는 동작을 한 번 정의해 두고, 그 동작이 프롬프트, 스킬, 래퍼 변경 이후에도 살아남는지 검증할 수 있습니다.
다른 스캐폴드를 먼저 복사하지 않아도 호스트 저장소가 설치할 수 있는 독립 실행형 바이너리와 번들 스킬로 제공됩니다.

## 대상 사용자

- 프롬프트와 래퍼가 자주 바뀌는 에이전트 런타임 또는 챗봇 루프를 유지보수하는 팀
- 트리거만 보는 스모크 체크가 아니라 홀드아웃 검증이 필요한 저장소 소유 스킬을 배포하는 메인테이너
- 워크플로 변경을 승인하기 전에 리뷰 패킷과 명시적 비교 산출물이 필요한 운영자

첫날의 신호는 이렇습니다.
이미 중요한 동작이 있는 저장소인데, 프롬프트 수정과 임시 eval만으로는 후보 변경이 실제로 나아졌는지 설명이 되지 않습니다.

다음과 같은 저장소를 위한 도구는 아닙니다.
결정적인 lint, unit, type 체크만 있으면 충분하고, 평가자 의존 동작 표면이 없는 저장소입니다.

## 빠른 시작

```bash
curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh
cautilus install --repo-root /path/to/host-repo
cautilus doctor --repo-root /path/to/host-repo
```

Homebrew 설치, 업데이트, 버전 표면은 [install.md](./install.md)를 참고하세요.
전체 명령 카탈로그는 [docs/cli-reference.md](./docs/cli-reference.md)에 있습니다.
상세 executable spec은 공개 리포트 <https://corca-ai.github.io/cautilus/>에서 확인하세요.
이 리포트는 저장소의 저비용 standing `check:source_guard` 경로를 `specdown`으로 렌더한 결과이고, 각 스펙 페이지에는 더 비싼 functional check가 계속 문서화되어 있습니다.

## 시나리오

Cautilus는 세 가지 평가 아키타입을 1급 개념으로 다룹니다.
세 아키타입은 normalize → propose → evaluate → review라는 하나의 파이프라인을 공유하지만, 각각 입력 형태와 시작 명령이 다릅니다.
이 1:1 경계는 [archetype-boundary.spec.md](./docs/specs/archetype-boundary.spec.md)에 고정되어 있습니다.

### 1. 챗봇 대화 회귀

프롬프트를 바꾼 뒤 채팅 또는 어시스턴트 경험의 다중 턴 동작이 나빠졌을 때 사용합니다.
예를 들어 이전 턴을 잊거나, 명확히 해야 할 때 답해 버리거나, 이미 밝힌 선호를 무시하는 경우입니다.
대화 요약과 기준 프롬프트, 변경 프롬프트를 준비한 뒤 `cautilus scenario normalize chatbot --input logs.json`을 실행하세요.
회귀는 튜닝에서 제외되는 후보 시나리오가 되고, 다시 열어볼 수 있는 `proposals.json`에 저장됩니다.
픽스처: [chatbot-consumer-input.json](./fixtures/scenario-proposals/samples/chatbot-consumer-input.json).

### 2. 스킬 / 에이전트 실행 회귀

스킬이나 에이전트를 바꾼 뒤에도 올바른 프롬프트에서 여전히 트리거되고, 깔끔하게 실행되며, 정적 검증을 계속 통과하는지 확인하고 싶을 때 사용합니다.
수정한 스킬과 체크인된 케이스 스위트를 준비한 뒤 `cautilus skill test --repo-root . --adapter-name <name>`을 실행하세요.
각 케이스는 합의를 위해 여러 번 실행되며, 트리거 정확도, 실행 품질, 선택적 런타임 예산 기준으로 점수화됩니다.
픽스처: [fixtures/skill-test/cases.json](./fixtures/skill-test/cases.json).

### 3. 지속형 워크플로 복구

상태를 유지하는 자동화, 예를 들어 CLI 워크플로, 장기 실행 에이전트 세션, 또는 호출 간 상태를 보존하는 파이프라인이 계속 같은 단계에서 멈출 때 사용합니다.
`targetId`, `status`, `surface`, `blockedSteps`가 포함된 실행 요약을 준비한 뒤 `cautilus scenario normalize workflow --input runs.json`을 실행하세요.
반복되는 장애는 `operator_workflow_recovery` 후보가 되어 회귀를 반복 가능한 케이스로 고정합니다.
픽스처: [workflow-recovery-input.json](./fixtures/scenario-proposals/samples/workflow-recovery-input.json).

에이전트 대상 표현으로도 사용할 수 있습니다.
"이 로그와 새 시스템 프롬프트로 챗봇 회귀를 돌려줘", "방금 수정한 스킬에 체크인된 케이스 스위트를 돌려줘", "지난주 자동화 실행을 보고 같은 단계에서 두 번 멈춘 항목을 표시해줘" 같은 식입니다.
`cautilus scenarios --json`은 아키타입을 프로그래밍 방식으로 찾아야 하는 에이전트를 위해 같은 카탈로그를 출력합니다.

## 왜 Cautilus인가

프롬프트 문자열은 바뀝니다.
하지만 그것이 실제 계약은 아닙니다.

구체적으로 생각해 보겠습니다.
챗봇 시스템 프롬프트를 조정합니다.
한 사용자의 후속 경험은 좋아집니다.
다른 사용자는 여러 턴에 걸친 문맥 복구 능력을 조용히 잃습니다.
어느 효과가 더 큰지는 일화만으로 알 수 없습니다.
`Cautilus`는 문맥 복구 케이스를 *홀드아웃 시나리오*로 취급합니다.
즉, 신호를 정직하게 유지하기 위해 튜닝에서 제외하고, 그 증거를 다음 메인테이너가 파일에서 다시 열어볼 수 있는 지속형 *패킷*에 저장합니다.

이 입장은 네 가지 대비로 요약됩니다.

- 프롬프트 관리자와 달리 `Cautilus`는 하나의 프롬프트 문자열을 계약으로 고정하지 않습니다. 대신 평가 대상 동작 자체를 계약으로 봅니다 (`intent-first`).
- 벤치마크 스크랩북과 달리 `Cautilus`는 반복 표면과 홀드아웃 표면을 분리하고, 증거를 파일에서 다시 열 수 있게 유지합니다 (`held-out honesty`, `packet-first`).
- 임시 eval 스크립트와 달리 `Cautilus`는 어댑터, 리포트, 리뷰 패킷, 비교 산출물을 1급 제품 경계로 취급합니다 (`structured review`).
- 열린 끝의 최적화 루프와 달리 `Cautilus`는 예산, 체크포인트, blocked-readiness 조건으로 탐색과 수정을 명시적으로 제한합니다 (`bounded autonomy`).

`Cautilus`는 또한 단발성 최적화기 위에 GEPA 스타일의 제한된 프롬프트 탐색 경계를 제공합니다.
여기에는 다세대 반성적 변이, 홀드아웃 재평가, 파레토식 프런티어 선택이 포함됩니다.
자세한 내용은 [docs/gepa.md](./docs/gepa.md)를 보세요.

장기적인 방향성은 DSPy의 워크플로 철학과 가깝습니다.
평가되는 동작만 살아남는다면 프롬프트는 바뀌어도 됩니다.

## 핵심 흐름

두 개의 진입점이 호스트 저장소 안의 하나의 `cautilus-adapter.yaml`을 공유합니다.

**운영자 트랙 — 독립 실행형 CLI.**
`Cautilus`를 설치하고, 평가 표면을 선언하고, 커맨드라인에서 제한된 평가를 실행합니다.

```bash
curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh
cautilus install --repo-root .
cautilus adapter init --repo-root .
cautilus mode evaluate --repo-root . --mode held_out
```

**에이전트 트랙 — Claude / Codex 플러그인.**
`cautilus install` 단계는 번들 스킬을 `.agents/skills/cautilus/`에 함께 설치하고, Claude 및 Codex 플러그인 매니페스트도 배치합니다.
그래서 에디터 안의 에이전트가 같은 계약을 대화형으로 구동할 수 있습니다.
"이 로그로 챗봇 회귀를 돌려줘" 같은 요청이 정확히 같은 어댑터로 연결됩니다.

최소 호스트 저장소 구조는 다음과 같습니다.

```text
.agents/cautilus-adapter.yaml
.agents/skills/cautilus/
artifacts/<run>/report.json
artifacts/<run>/review-packet.json
```

운영자가 돌려받는 것은 단순한 통과/실패 비트가 아닙니다.

- 평가 표면을 명시적으로 선언하는 저장소 로컬 어댑터
- 에이전트가 직접 소비할 수 있는 기계 판독형 실행 산출물(리포트와 리뷰 패킷)
- 사람이 에이전트 없이 브라우저에서 같은 산출물을 판단할 수 있게 하는 정적 HTML 뷰([docs/specs/html-report.spec.md](./docs/specs/html-report.spec.md) 참고)
- 파일에서 다시 열 수 있는 제한된 비교 및 리뷰 표면
- 관찰된 런타임 증거에서 새 시나리오 제안과 제한된 수정으로 되돌아가는 경로

검증 게이트:

- `cautilus doctor --repo-root .` — 저장소별 연결 상태 게이트
- `npm run consumer:onboard:smoke` — 가장 짧은 엔드투엔드 도입 증명(이 저장소에서 새 소비자 저장소를 대상으로 실행)

## 더 읽기

```text
docs/
├── guides/                        # 운영자/소비자 가이드
├── contracts/                     # 어댑터, 리포트, 리뷰, 시나리오
├── specs/                         # 현재 제품 표면 + 아키타입
├── maintainers/                   # 메인테이너 운영 및 릴리스 문서
├── master-plan.md                 # 장기 방향
├── cli-reference.md               # 전체 CLI 명령 카탈로그
└── gepa.md                        # GEPA 스타일 프롬프트 탐색 심화
```

우선 읽을 문서:

- <https://corca-ai.github.io/cautilus/> — standing executable spec 리포트
- [install.md](./install.md) — 다른 머신을 위한 운영자 설치 + 업데이트 가이드
- [docs/guides/evaluation-process.md](./docs/guides/evaluation-process.md) — 정규 평가 루프
- [docs/specs/archetype-boundary.spec.md](./docs/specs/archetype-boundary.spec.md) — 챗봇/스킬/워크플로 1:1 계약
- [docs/contracts/adapter-contract.md](./docs/contracts/adapter-contract.md) — 어댑터 스키마
- [docs/contracts/review-packet.md](./docs/contracts/review-packet.md) — 리뷰 패킷 경계
- [docs/cli-reference.md](./docs/cli-reference.md) — 전체 CLI 레퍼런스
- [docs/maintainers/development.md](./docs/maintainers/development.md) — 메인테이너 개발 + 셀프 도그푸드
- [docs/gepa.md](./docs/gepa.md) — GEPA 스타일 프롬프트 탐색
- [docs/master-plan.md](./docs/master-plan.md) — 로드맵
- [examples/starters/](./examples/starters/) — 아키타입별 스타터 키트

도그푸드 및 마이그레이션 근거는 [consumer-readiness.md](./docs/maintainers/consumer-readiness.md)와 [consumer-adoption.md](./docs/guides/consumer-adoption.md)에 있습니다.
