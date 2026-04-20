[English README](./README.md)

# Cautilus

`Cautilus`는 프롬프트와 래퍼가 계속 바뀌어도 에이전트와 워크플로 동작을 정직하게 유지합니다.
이 프로젝트는 에이전트와 워크플로 동작 평가를 위한 저장소 로컬 계약 계층입니다.
보호하려는 동작을 한 번 정의해 두고, 그 동작이 프롬프트, 스킬, 래퍼 변경 이후에도 살아남는지 검증할 수 있습니다.
다른 스캐폴드를 먼저 복사하지 않아도 호스트 저장소가 설치할 수 있는 독립 실행형 바이너리와 번들 스킬로 제공됩니다.
`Cautilus`는 머신 수준에서는 바이너리로 설치되지만, 에이전트가 마주하는 표면은 의도적으로 저장소 로컬에 둡니다.
바이너리는 여러 저장소가 공유합니다.
하지만 스킬, adapter wiring, 프롬프트, instruction-routing 표면은 그렇지 않습니다.
이 요소들은 각 호스트 저장소에 체크인된 상태로 남아 있어야 평가 동작이 재현 가능하고 검토 가능하며, 그 저장소의 선언으로 소유됩니다.

## 대상 사용자

- 프롬프트와 래퍼가 자주 바뀌는 에이전트 런타임 또는 챗봇 루프를 유지보수하는 팀
- 트리거만 보는 스모크 체크가 아니라 보호된 검증 경로가 필요한 저장소 소유 스킬 메인테이너
- 워크플로 변경을 승인하기 전에 검토용 결과물과 명시적 비교 근거가 필요한 운영자

첫날의 신호는 이렇습니다.
이미 중요한 동작이 있는 저장소인데, 프롬프트 수정과 임시 eval만으로는 후보 변경이 실제로 나아졌는지 설명이 되지 않습니다.

다음과 같은 저장소를 위한 도구는 아닙니다.
결정적인 lint, unit, type 체크만 있으면 충분하고, 평가자 의존 동작 표면이 없는 저장소입니다.

## 빠른 시작

```bash
curl -fsSL \
  https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh \
  | sh
cd /path/to/host-repo
cautilus install
cautilus doctor
```

에이전트에게 설치를 맡길 거라면, 이 프롬프트를 그대로 주면 됩니다:

```md
Read and follow: https://raw.githubusercontent.com/corca-ai/cautilus/main/install.md

Install Cautilus on this machine.
Then cd into /path/to/host-repo, install the bundled skill, and verify the setup there.
```

바로 가기:

- Homebrew 설치, 업데이트, 버전 안내: [install.md](./install.md)
- 전체 명령 카탈로그: [docs/cli-reference.md](./docs/cli-reference.md)
- 공개 executable spec 리포트: <https://corca-ai.github.io/cautilus/>

이 리포트는 저장소의 저비용 public spec suite를 `specdown`으로 렌더한 결과입니다.
각 페이지는 하나의 제품 주장과 작은 executable proof를 함께 보여줍니다.

## 하나의 검토 가능한 의사결정 루프

전체 표면을 읽기 전에, 먼저 가장 작은 제품 그림부터 보는 편이 좋습니다.

**준비물**

- 재사용 가능한 시나리오로 바꾸고 싶은 체크인된 proposal 입력 하나, 또는 새 동작 입력 하나

**입력 (CLI)**

```bash
cautilus scenario propose \
  --input ./fixtures/scenario-proposals/standalone-input.json \
  --output /tmp/proposals.json
cautilus scenario render-proposals-html \
  --input /tmp/proposals.json \
  --output /tmp/proposals.html
```

**입력 (에이전트)**

- "이 동작 입력을 재사용 가능한 시나리오로 바꾸고, 내가 검토할 HTML 페이지도 렌더해줘."

**이 단계에서 하는 일**

- `Cautilus`는 원시 동작 증거를 재사용 가능한 시나리오 파일로 바꾸고, 같은 결과를 브라우저에서 읽을 수 있는 페이지로 렌더합니다.

**무엇을 받게 되나**

- 빠른 신호: 저장소별 관습을 새로 만들지 않고 재사용 가능한 시나리오 파일 하나가 생성됩니다
- 지속형 파일: 이후 명령이 다시 열 수 있는 `proposals.json`과 사람이 검토할 `proposals.html`

**다음엔 뭘 하나**

- 사람: 제안된 시나리오를 보호된 평가 경로로 올릴 가치가 있는지 판단합니다
- 에이전트: 저장된 결과를 다시 열어 variant를 비교하거나 다음 평가 단계로 넘깁니다

같은 작은 루프가 `docs/specs/index.spec.md`의 public spec 리포트 시작점도 잡고 있습니다.
이것이 제품 주장의 가장 짧고 정직한 예시입니다.
`Cautilus`는 동작 증거를 검토 가능한 의사결정 표면으로 바꿉니다.

## 시나리오

Cautilus는 세 가지 평가 아키타입을 1급 개념으로 다룹니다.
세 아키타입은 normalize → propose → evaluate → review라는 하나의 파이프라인을 공유하지만, 각각 입력 형태와 시작 명령이 다릅니다.
이 1:1 경계는 `docs/specs/archetype-boundary.spec.md`에서 볼 수 있습니다.

### 1. 챗봇 대화 회귀

프롬프트를 바꾼 뒤 채팅 또는 어시스턴트 경험의 다중 턴 동작이 나빠졌을 때 사용합니다.

대표적인 실패는 이전 턴을 잊거나, 명확히 해야 할 때 답해 버리거나, 이미 밝힌 선호를 무시하는 경우입니다.

**준비물**: 대화 요약, 기준 프롬프트, 변경 프롬프트.

**입력 (CLI)**: `cautilus scenario normalize chatbot --input logs.json`

**입력 (에이전트)**: "이 로그와 새 시스템 프롬프트로 챗봇 회귀를 돌려줘."

**이 단계에서 하는 일**: `Cautilus`가 안정적인 대화 회귀로 보이는 실패 후보를 추출합니다.

**무엇을 받게 되나**: 튜닝에서 제외할 수 있는, 나중에 다시 열어볼 `proposals.json` 후보입니다.

**다음엔 뭘 하나**: evaluate/review 단계로 넘기거나, 그 보호된 케이스를 유지한 채 프롬프트를 다시 다듬습니다.

### 2. 스킬 / 에이전트 실행 회귀

스킬이나 에이전트를 바꾼 뒤에도 올바른 프롬프트에서 여전히 트리거되고, 깔끔하게 실행되며, 정적 검증을 계속 통과하는지 확인하고 싶을 때 사용합니다.

**준비물**: 수정한 스킬과 체크인된 케이스 스위트.

**입력 (CLI)**: `cautilus skill test --repo-root . --adapter-name <name>`

**입력 (에이전트)**: "방금 수정한 스킬에 체크인된 케이스 스위트를 돌려줘."

**이 단계에서 하는 일**: 각 케이스가 합의를 위해 여러 번 실행되고, 트리거 정확도, 실행 품질, 선택적 런타임 예산 기준으로 점수화됩니다.

**무엇을 받게 되나**: 트리거만 보는 스모크 하나가 아니라, 리포트, 리뷰 파일, 비교 가능한 증거를 받습니다.

**다음엔 뭘 하나**: 변경된 스킬을 수락하거나, 리뷰 출력을 확인하거나, 한 번 더 제한된 수정 루프로 저장된 결과를 다시 엽니다.

### 3. 지속형 워크플로 복구

상태를 유지하는 자동화, 예를 들어 CLI 워크플로, 장기 실행 에이전트 세션, 또는 호출 간 상태를 보존하는 파이프라인이 계속 같은 단계에서 멈출 때 사용합니다.

**준비물**: `targetId`, `status`, `surface`, `blockedSteps`가 포함된 실행 요약.

**입력 (CLI)**: `cautilus scenario normalize workflow --input runs.json`

**입력 (에이전트)**: "지난주 자동화 실행을 보고 같은 단계에서 두 번 멈춘 항목을 표시해줘."

**이 단계에서 하는 일**: 반복되는 장애를 `operator_workflow_recovery` 후보로 정규화해, 회귀를 반복 가능한 케이스로 고정합니다.

**무엇을 받게 되나**: 운영자 질문이 구체적인 증거와 함께 남는 재사용 가능한 workflow-recovery proposal입니다.

**다음엔 뭘 하나**: compare/review 단계로 보내거나, 일회성 대응이 아니라 근거 있는 워크플로 복구 작업으로 이어갑니다.

`cautilus scenarios --json`은 아키타입을 프로그래밍 방식으로 찾아야 하는 에이전트를 위해 같은 카탈로그를 출력합니다.
이 아키타입들의 예시 입력은 `examples/starters/`와 `fixtures/` 아래의 체크인된 픽스처 디렉터리에서 볼 수 있습니다.

## 왜 Cautilus인가

프롬프트 문자열은 바뀝니다.
하지만 그것이 실제 계약은 아닙니다.

구체적으로 생각해 보겠습니다.
챗봇 시스템 프롬프트를 조정합니다.
한 사용자의 후속 경험은 좋아집니다.
다른 사용자는 여러 턴에 걸친 문맥 복구 능력을 조용히 잃습니다.
어느 효과가 더 큰지는 일화만으로 알 수 없습니다.
`Cautilus`는 문맥 복구 케이스를 튜닝에서 제외해 두는 보호된 시나리오로 다룹니다.
그래서 신호를 더 정직하게 유지할 수 있고, 그 증거도 다음 메인테이너가 파일에서 다시 열어볼 수 있게 남깁니다.
뒤쪽 문서에서는 이런 보호된 검증 경로를 `held-out`, 다시 열 수 있는 기계 판독형 파일을 `packet`이라고 줄여 부릅니다.

이 입장은 네 가지 대비로 요약됩니다.

- 프롬프트 관리자와 달리 `Cautilus`는 하나의 프롬프트 문자열을 계약으로 고정하지 않습니다. 대신 평가 대상 동작 자체를 계약으로 봅니다 (`intent-first`).
- 벤치마크 스크랩북과 달리 `Cautilus`는 반복 실험과 보호된 검증 경로를 분리하고, 증거를 파일에서 다시 열 수 있게 유지합니다 (`held-out honesty`, `packet-first`).
- 임시 eval 스크립트와 달리 `Cautilus`는 어댑터, 리포트, 리뷰 파일, 비교 산출물을 1급 제품 경계로 취급합니다 (`structured review`).
- 열린 끝의 최적화 루프와 달리 `Cautilus`는 예산, 체크포인트, blocked-readiness 조건으로 탐색과 수정을 명시적으로 제한합니다 (`bounded autonomy`).

`Cautilus`는 또한 단발성 최적화기 위에 GEPA 스타일의 제한된 프롬프트 탐색 경계를 제공합니다.
여기에는 다세대 반성적 변이, 보호된 검증 재평가, 파레토식 프런티어 선택이 포함됩니다.
자세한 내용은 `docs/gepa.md`를 보세요.

장기적인 방향성은 DSPy의 워크플로 철학과 가깝습니다.
평가되는 동작만 살아남는다면 프롬프트는 바뀌어도 됩니다.

## 핵심 흐름

두 개의 진입점이 호스트 저장소 안의 하나의 `cautilus-adapter.yaml`을 공유하고, 결국 같은 지속형 의사결정 표면을 돌려줍니다.

**운영자 트랙 — 독립 실행형 CLI.**
`Cautilus`를 설치하고, 평가 표면을 선언하고, 커맨드라인에서 제한된 평가를 실행합니다.

```bash
curl -fsSL \
  https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh \
  | sh
cd /path/to/host-repo
cautilus install
cautilus adapter init
cautilus mode evaluate --mode held_out
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
- 에이전트가 직접 소비할 수 있는 기계 판독형 실행 산출물(리포트와 리뷰 파일)
- 사람이 에이전트 없이 브라우저에서 같은 산출물을 판단할 수 있게 하는 정적 HTML 뷰
자세한 내용은 `docs/specs/html-report.spec.md` 참고
- 파일에서 다시 열 수 있는 제한된 비교 및 리뷰 표면
- 관찰된 런타임 증거에서 새 시나리오 제안과 제한된 수정으로 되돌아가는 경로

검증 게이트:

- `cautilus doctor` — 저장소별 연결 상태 게이트
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
