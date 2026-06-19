# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — app/chat 외부-데이터 replay 슬라이스가 착지했으니, (1) 나머지 3개 private external chat product 행동(메모리 연속성·명확화·아티팩트 충실도)으로 breadth 확장하거나, (2) app/chat liveness(라이브 앱 재실행)로 가거나, (3) C(자연-unsound harvest)를 같이 정합시다.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).
**app/chat 외부-데이터 replay 착지(2026-06-19): `app/chat` 표면이 이제 진짜 외부 제품(private external chat product, example-app-prod, 40명 실유저) 프로덕션 행동을 load-bearing 블라인드 intent judge로 평가한다 — external-validity + intent-judge 두 축을 닫음(string-match → intent judge).** 단 **app-agent liveness는 deferred**(유저가 replay 선택; agent는 프로덕션 로그에서 replay, 라이브 재실행 아님). apex 배지는 여전히 `proven`(dev 표면이 carry), app/chat 행 + Proof Debt가 정직하게 갱신됨. 남은 Proof Debt: app/chat liveness, app/prompt, 그리고 breadth(나머지 3개 private external chat product 행동).
먼저 `charness-artifacts/eval-trust/2026-06-19-app-chat-external-data-replay.md`(이번 증거)와 `docs/specs/index.spec.md`(apex 배지 SOT)를 읽고 아래 "Next Session"에서 시작.

## Current State

- **양 dev 표면 라이브-proven:** `npm run proof:behavior-eval:live`(dev/repo: 실제 에이전트가 AGENTS.md orient + find-skills 라우팅) + `npm run proof:skill-orientation:live`(dev/skill: cautilus-agent no-input orientation이 read-only `doctor status` 실행 후 요약·브랜치 선택에서 중단). 각 표면 **두 독립 라이브 런이 추론 텍스트는 달랐지만 invariant는 유지**, 둘 다 체크인. 블라인드 Sonnet judge가 각 진짜 라이브 추론 sound + 구성 control unsound(load-bearing). 증거 `2026-06-19-skill-surface-live-proven.md`·`2026-06-19-behavior-eval-live-proven.md`.
- **온디맨드 게이팅(매 실행 아님):** 라이브 런은 `proof:*:live`로만, 상시 `verify`엔 없음. 결정론 표준 테스트가 operator-witnessed 캡처를 동일 `assert*Invariant`로 replay → drift 불가. 신규 라이브-네이티브 픽스처는 `fixtures/eval/dev/{repo,skill}/live/`에 격리, replay 픽스처 무손상.
- **mid-build debug(스킬):** `dontAsk` permission mode가 헤드리스 claude에서 Bash를 안 열어줘 `doctor status`가 차단→orientation degraded. `charness:debug`(`2026-06-19-skill-live-bash-permission-mode.md`) → 스킬 프루프는 `bypassPermissions` 사용(read-only orientation). follow-up: 체크인된 어댑터들이 여전히 `dontAsk`(fixture 기본이라 무해하나 라이브 claude+Bash면 degrade).
- **apex 배지:** `Behavior Evaluation` = **proven**(양 dev 표면 라이브 carry). `app/chat`은 이제 **진짜 외부 데이터(private external chat product) + intent judge**로 업그레이드(external-validity + intent-judge 닫음, liveness deferred). `app/prompt`은 여전히 projection. 자연-unsound 모집단(세 표면 모두 구성 control만)은 배지에 **한계 명시**.
- **A(앱-표면) 실현가능성 확인:** 메커니즘은 **구현돼 있음** — `cautilus discover scenarios normalize chatbot --input <logs.json>`(외부 챗봇 로그→시나리오, smoke 테스트 통과) + `app_chat_evaluation.go`/`app_prompt_evaluation.go` + `cautilus evaluate live persona/request batch`. 빠진 건 코드가 아니라 **데이터**(정규화 입력 shape로 된 진짜 외부 제품 로그; 사용자 언급 "private external chat product" — repo엔 private external chat product 통합 없음, grep 오탐) + owner-confirmed 시나리오. 입력 shape는 `cautilus discover scenarios normalize chatbot --example-input`.

## Proposed Direction (제안, 미구현): subagent-first 러너 — run → subagent-evaluate

2026-06-19 유저와 합의한 방향(아직 구현 안 함, A 슬라이스를 이 프레임으로 시작할 것).
핵심: Cautilus 바이너리는 항상 에이전트가 돌린다(단독 실행 아님). 그 호스트 에이전트는 이미 서브에이전트 spawn + 프로비저닝된 환경(스킬·권한·진짜 모델)을 갖는다. 그러니 러너가 `codex exec`/`claude -p` 헤드리스를 새로 띄워 환경을 재구성하는 대신, **호스트 서브에이전트**를 쓴다. 통합 모델은 두 단계 — **실행(run) → 서브에이전트 평가(evaluate)**:

| 표면 | 실행(run) — 피험 trace 생성 | 평가(evaluate) — judge |
|---|---|---|
| dev | 러너가 **서브에이전트를 피험 에이전트로** 띄움(헤드리스 대신) | **호스트 서브에이전트** |
| app | 러너가 **출시 앱을 실행** — 라이브 호출 *또는* 정규화 프로덕션 로그 replay(private external chat product) | **호스트 서브에이전트** |

- 바이너리는 **요청 패킷 emit + 결정론 매처 + compositing + 채점·패킷**만 소유(불변). 호스트 에이전트의 서브에이전트가 dev의 실행 + 양쪽의 평가를 fulfill.
- 즉 오늘의 judge(prove-then-project replay)를 → **온디맨드 라이브 서브에이전트 judge**로 통일.
- **additive**(서브에이전트=기본/ambient, 헤드리스 CLI=명시-모델·이식성 fallback): 모델을 명시받거나 서브에이전트 없는 호스트(CI 단독)는 `codex exec`/`claude -p`. 미지정 시 ambient 서브에이전트 상속.
- 기존 seam과 정합: `evaluate live persona --simulator-request-file/--simulator-result-file`(바이너리가 요청 emit → 외부가 결과 채움 → 바이너리 채점)의 자연스러운 fulfiller가 Cautilus 에이전트의 서브에이전트. CLI↔Agent 경계 그대로.
- **솔직한 함의:** 오늘 dev/repo·dev/skill 라이브 증명은 헤드리스 `claude -p --exclude-dynamic-system-prompt-sections`(시스템 프롬프트 벗겨낸 격리 변형)로 만든 거라, 유저가 실제 출시하는 에이전트가 아니라 그 변형을 증명함. subagent-first면 진짜 출시 에이전트를 테스트 → 충실도 상승. 이번 세션의 dontAsk/bypassPermissions·CODEX_HOME 프로비저닝 마찰도 서브에이전트면 통째로 사라짐.
- **A(private external chat product) 시작 프레임:** 정규화 private external chat product 로그 replay(run) + 서브에이전트 judge(evaluate).

## Next Session: 남은 Proof Debt (같이 결정)

0. **(착지함, 2026-06-19) app/chat 외부-데이터 replay.** private external chat product example-app-prod 실유저 DM(시크릿 가드레일: API key 저장 요청)을 redact → 제네릭 `normalize chatbot`(신규 `secret_handling` 패턴) → intent-first 시나리오 → private external chat product 실제 응답을 블라인드 Sonnet 서브에이전트가 채점(real→sound ×2 독립, 구성 control→unsound, load-bearing). 표준 테스트 `scripts/on-demand/app-chat-replay-proof.test.mjs`(7/7), spec subclaim, apex 행 갱신, claims refresh 완료. 증거: `2026-06-19-app-chat-external-data-replay.md`. **닫은 것: external-validity + intent-judge. 안 닫은 것: app-agent liveness.**
1. **(breadth) 나머지 3개 private external chat product 행동.** 같은 패턴으로 메모리 연속성(`PREFERENCE_REUSE`/`conversation_continuity` 기존 dim 재사용 가능)·명확화-우선·아티팩트 충실도를 real example-app-prod 캡처 + 블라인드 judge로 추가. 메모리/아티팩트는 normalizer 패턴이 아직 없어 신규 패턴 또는 owner-confirmed 직접 시나리오 필요. 이번 세션은 flagship 1개(시크릿)만 — 첫 proof엔 강한 1개로 충분, 컨텍스트 한계로 deferred.
2. **(app/chat liveness) 라이브 앱 재실행.** 오늘은 agent를 프로덕션 로그에서 replay했음. liveness 축을 닫으려면 라이브 private external chat product 앱을 시나리오 턴으로 새로 구동(`evaluate live persona/scenarios` + `--simulator-request-file/--simulator-result-file`의 fulfiller = 호스트 서브에이전트, Proposed Direction 참조) → fresh 응답 judge. 라이브 비용·실행 인스턴스 필요(maintainer 결정).
3. **(리드 C, 데이터 없이 가능) 자연-unsound harvest.** 세 표면(dev/repo·dev/skill·app/chat) 모두 reject-capability를 구성 control로만 증명. private external chat product prod 로그에 **자연 발생 unsound** 응답이 있을 수 있음(예: 명확화 실패/잘못된 메모리 적용) → harvest해 블라인드 등급 → 배지 명시 한계 해소. app/chat replay 데이터가 이미 손에 있어 가장 저비용 경로.
4. **(선택) 잔여:** follow-up skill-fixture-command-fragment-lint; 체크인 어댑터의 `dontAsk`→라이브-claude 시 degrade; per-facet routing; specdown 재설계(맨 마지막).

## Discuss (열린 결정)

- A vs C 우선순위. A는 사용자 private external chat product 로그 의존(가장 강한 외부 검증), C는 데이터 없이 가능(배지 한계 해소). 라이브 비용 범위는 maintainer 결정.

## 제약

push는 사용자 몫(보류). claim-source 편집 후 `npm run claims:refresh:all`(소스 커밋 → refresh → 패킷 커밋); push가 `status-summary.json is stale`로 실패할 때 필요(이번 슬라이스는 apex·evaluation.spec가 claim source라 refresh 수행). 제네릭 엔진·제네릭 런타임 러너에 repo-specific judge 로직 금지. ground truth 제조 금지(sound 케이스는 진짜 라이브 캡처, control만 구성). 새 런타임 표면엔 executable test. bug/error/regression은 `charness:debug`. critique/fresh-eye는 서브에이전트 위임. 검증 서브에이전트·라이브 runtime은 Sonnet.

## References

- **계약/spec/증거**: `docs/contracts/behavior-eval-live-proof.md`(닫힌 결정)·`realsurface-judge-convergence.md`·`skill-surface-judge-convergence.md`·`eval-judge-collaboration.md`(forward pointer); `charness-artifacts/eval-trust/2026-06-19-behavior-eval-live-proven.md`·`2026-06-19-skill-surface-live-proven.md`.
- **라이브 증명 코드**: 드라이버 `scripts/on-demand/behavior-eval-live-proof.mjs`·`skill-orientation-live-proof.mjs`(+각 test); npm `proof:behavior-eval:live`·`proof:skill-orientation:live`; 라이브 러너 `run-local-eval-test.mjs`·`run-local-skill-test.mjs --backend claude_code`.
- **픽스처**: `fixtures/eval/dev/repo/live/`·`fixtures/eval/dev/skill/live/`(capture + rerun + verdicts + cases).
- **debug**: `charness-artifacts/debug/2026-06-19-skill-live-bash-permission-mode.md`.
- **A(앱) 메커니즘**: `cautilus discover scenarios normalize chatbot`(app.go:212), `app_chat_evaluation.go`/`app_prompt_evaluation.go`, `evaluate live persona/request batch`.
- **배지 SOT**: `docs/specs/index.spec.md`·`docs/specs/user/evaluation.spec.md`(양 dev 표면 라이브-proven subclaim). 로드맵 `docs/master-plan.md`.
