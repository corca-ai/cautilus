# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — app/chat breadth와 app/prompt backend probe + intent judge가 착지했으니, (1) app/chat liveness(라이브 앱 재실행)로 가거나, (2) app/prompt product-runner proof로 가거나, (3) dev 자연-unsound harvest로 갑시다.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).
**app/chat replay는 이제 자연 sound(secret + memory continuity + clarification-first) + 자연 unsound(artifact fidelity)를 가진다.** `app/chat` 표면은 익명화된 private external chat product의 실제 production DM thread에서 나온 행동을 load-bearing 블라인드 intent judge로 평가한다 — external-validity + intent-judge + app/chat 자연-unsound gap을 닫음(string-match → intent judge; constructed-only → natural unsound 포함). 단 **app-agent liveness는 deferred**(유저가 replay 선택; agent는 프로덕션 로그에서 replay, 라이브 재실행 아님). `app/prompt`는 2026-06-19 fresh backend probe + blind intent judge가 생김: fixture + Codex live pass, Claude live는 exact fragment `behavior` 부재로 string matcher reject였지만 두 독립 blind judge가 Codex/Claude 응답을 intent-sound로, constructed semantic control을 unsound로 판정. apex의 Behavior Evaluation 배지는 **declared**로 유지됨(dev 표면은 proven, app 표면은 debt), app 행 + Proof Debt가 정직하게 갱신됨. 남은 app-surface Proof Debt: app/chat liveness, app/prompt product-runner proof.
먼저 `charness-artifacts/eval-trust/2026-06-19-app-chat-external-data-replay.md`, `charness-artifacts/eval-trust/2026-06-19-app-chat-natural-unsound-breadth.md`, `charness-artifacts/eval-trust/2026-06-19-app-chat-memory-continuity-breadth.md`, `charness-artifacts/eval-trust/2026-06-19-app-chat-clarification-first-breadth.md`, `charness-artifacts/eval-trust/2026-06-19-app-prompt-backend-probe.md`, `charness-artifacts/eval-trust/2026-06-19-app-prompt-intent-judge.md`, `docs/specs/index.spec.md`를 읽고 아래 "Next Session"에서 시작.

## Current State

- **양 dev 표면 라이브-proven:** `npm run proof:behavior-eval:live`(dev/repo: 실제 에이전트가 AGENTS.md orient + find-skills 라우팅) + `npm run proof:skill-orientation:live`(dev/skill: cautilus-agent no-input orientation이 read-only `doctor status` 실행 후 요약·브랜치 선택에서 중단). 각 표면 **두 독립 라이브 런이 추론 텍스트는 달랐지만 invariant는 유지**, 둘 다 체크인. 블라인드 Sonnet judge가 각 진짜 라이브 추론 sound + 구성 control unsound(load-bearing). 증거 `2026-06-19-skill-surface-live-proven.md`·`2026-06-19-behavior-eval-live-proven.md`.
- **온디맨드 게이팅(매 실행 아님):** 라이브 런은 `proof:*:live`로만, 상시 `verify`엔 없음. 결정론 표준 테스트가 operator-witnessed 캡처를 동일 `assert*Invariant`로 replay → drift 불가. 신규 라이브-네이티브 픽스처는 `fixtures/eval/dev/{repo,skill}/live/`에 격리, replay 픽스처 무손상.
- **mid-build debug(스킬):** `dontAsk` permission mode가 헤드리스 claude에서 Bash를 안 열어줘 `doctor status`가 차단→orientation degraded. `charness:debug`(`2026-06-19-skill-live-bash-permission-mode.md`) → 스킬 프루프는 `bypassPermissions` 사용(read-only orientation). follow-up: 체크인된 어댑터들이 여전히 `dontAsk`(fixture 기본이라 무해하나 라이브 claude+Bash면 degrade).
- **apex 배지:** `Behavior Evaluation` = **declared** overall, with both dev surfaces proven live. `app/chat`은 이제 **익명화된 진짜 외부 데이터 + intent judge + 자연 sound secret/memory/clarification + 자연-unsound artifact case**로 업그레이드(external-validity + intent-judge + app/chat natural-unsound 닫음, liveness deferred). `app/prompt`은 fresh backend probe + blind intent judge가 있지만 `productProofReady=false`와 product-runner boundary가 남음; string-fragment matcher boundary는 intent judge가 분리해 줌. dev/repo·dev/skill reject-capability는 아직 구성 control 한계가 명시됨.
- **A(앱-표면) 실현가능성 확인:** runner/data 메커니즘은 **구현돼 있음** — `cautilus discover scenarios normalize chatbot --input <logs.json>`(외부 챗봇 로그→시나리오, smoke 테스트 통과) + `app_chat_evaluation.go`/`app_prompt_evaluation.go` + `cautilus evaluate live persona/request batch`. app/chat liveness에 빠진 건 코드가 아니라 **데이터/실행 인스턴스**(정규화 입력 shape로 된 진짜 외부 제품 로그; repo엔 해당 private product 통합 없음) + owner-confirmed 시나리오. app/prompt는 별도로 product-runner assessment가 남음. 입력 shape는 `cautilus discover scenarios normalize chatbot --example-input`.

## Proposed Direction (제안, 미구현): subagent-first 러너 — run → subagent-evaluate

2026-06-19 유저와 합의한 방향(아직 구현 안 함, A 슬라이스를 이 프레임으로 시작할 것).
핵심: Cautilus 바이너리는 항상 에이전트가 돌린다(단독 실행 아님). 그 호스트 에이전트는 이미 서브에이전트 spawn + 프로비저닝된 환경(스킬·권한·진짜 모델)을 갖는다. 그러니 러너가 `codex exec`/`claude -p` 헤드리스를 새로 띄워 환경을 재구성하는 대신, **호스트 서브에이전트**를 쓴다. 통합 모델은 두 단계 — **실행(run) → 서브에이전트 평가(evaluate)**:

| 표면 | 실행(run) — 피험 trace 생성 | 평가(evaluate) — judge |
|---|---|---|
| dev | 러너가 **서브에이전트를 피험 에이전트로** 띄움(헤드리스 대신) | **호스트 서브에이전트** |
| app | 러너가 **출시 앱을 실행** — 라이브 호출 *또는* 정규화 프로덕션 로그 replay | **호스트 서브에이전트** |

- 바이너리는 **요청 패킷 emit + 결정론 매처 + compositing + 채점·패킷**만 소유(불변). 호스트 에이전트의 서브에이전트가 dev의 실행 + 양쪽의 평가를 fulfill.
- 즉 오늘의 judge(prove-then-project replay)를 → **온디맨드 라이브 서브에이전트 judge**로 통일.
- **additive**(서브에이전트=기본/ambient, 헤드리스 CLI=명시-모델·이식성 fallback): 모델을 명시받거나 서브에이전트 없는 호스트(CI 단독)는 `codex exec`/`claude -p`. 미지정 시 ambient 서브에이전트 상속.
- 기존 seam과 정합: `evaluate live persona --simulator-request-file/--simulator-result-file`(바이너리가 요청 emit → 외부가 결과 채움 → 바이너리 채점)의 자연스러운 fulfiller가 Cautilus 에이전트의 서브에이전트. CLI↔Agent 경계 그대로.
- **솔직한 함의:** 오늘 dev/repo·dev/skill 라이브 증명은 헤드리스 `claude -p --exclude-dynamic-system-prompt-sections`(시스템 프롬프트 벗겨낸 격리 변형)로 만든 거라, 유저가 실제 출시하는 에이전트가 아니라 그 변형을 증명함. subagent-first면 진짜 출시 에이전트를 테스트 → 충실도 상승. 이번 세션의 dontAsk/bypassPermissions·CODEX_HOME 프로비저닝 마찰도 서브에이전트면 통째로 사라짐.
- **A(app/chat) 시작 프레임:** 정규화된 private external chat product 로그 replay(run) + 서브에이전트 judge(evaluate).

## Next Session: 남은 Proof Debt (같이 결정)

0. **(착지함, 2026-06-19) app/chat 외부-데이터 replay.** 익명화된 private external chat product 실유저 DM(시크릿 가드레일: API key 저장 요청)을 redact → 제네릭 `normalize chatbot`(신규 `secret_handling` 패턴) → intent-first 시나리오 → 실제 응답을 블라인드 Sonnet 서브에이전트가 채점(real→sound ×2 독립, 구성 control→unsound, load-bearing). 표준 테스트 `scripts/on-demand/app-chat-replay-proof.test.mjs`, spec subclaim, apex 행 갱신, claims refresh 완료. 증거: `2026-06-19-app-chat-external-data-replay.md`. **닫은 것: external-validity + intent-judge. 안 닫은 것: app-agent liveness.**
1. **(착지함, 2026-06-19) natural-unsound harvest + artifact breadth.** 익명화된 production artifact URL 턴에서 자연 발생 unsound를 수확: `simple2.html` 생성 후 `public url 주세요`에 product가 먼저 public URL 불가라고 답했고, 사용자가 `ARTIFACTS.md`를 지적하자 `/workspace/artifacts-url.txt`를 읽어 URL을 제공. 신규 `artifact_fidelity` intent catalog + owner-confirmed 직접 시나리오 + 두 독립 blind Sonnet verdict 모두 unsound(all false). 증거: `2026-06-19-app-chat-natural-unsound-breadth.md`.
2. **(착지함, 2026-06-19) memory-continuity breadth.** 익명화된 production log에서 사용자가 회사 위치(예시 회사, 서울특별시 중구 샘플로 1)를 memory에 넣으라고 한 뒤, 나중에 `회사 근처 날씨 정보 찾아주세요`라고 요청했고 product가 저장된 주소를 사용해 날씨를 답함. 기존 `conversation_continuity` + `workflow_continuity`/`preference_reuse` dim 재사용, owner-confirmed 직접 시나리오, 두 독립 blind Sonnet verdict 모두 sound(all true). 증거: `2026-06-19-app-chat-memory-continuity-breadth.md`.
3. **(착지함, 2026-06-19) clarification-first breadth.** 익명화된 production log에서 사용자가 위치 없이 `오늘 날씨가 어떻죠?`라고 묻자 product가 날씨를 추정하지 않고 도시명 또는 주소를 요청함. 기존 `thread_context_recovery` + `target_clarification` dim 재사용, owner-confirmed 직접 시나리오, 두 독립 blind Sonnet verdict 모두 sound(all true). 증거: `2026-06-19-app-chat-clarification-first-breadth.md`.
4. **(partial 착지, 2026-06-19) app/prompt backend probe + intent judge.** `fixtures/eval/app/prompt/cautilus-tagline.fixture.json`을 fixture/Codex/Claude backend로 fresh 실행. fixture + Codex live는 `accept-now`; Claude live는 Cautilus를 설명했지만 `behavior` exact fragment 대신 `behave`를 써서 string matcher가 `reject`. 이후 두 독립 blind judge가 Codex/Claude live 응답을 intent-sound로, constructed semantic control을 unsound로 판정. 신규 replay tests `scripts/on-demand/app-prompt-backend-proof.test.mjs` + `scripts/on-demand/app-prompt-intent-judge-proof.test.mjs`가 세 run, string matcher boundary, intent verdict, `productProofReady=false`를 고정. 증거: `2026-06-19-app-prompt-backend-probe.md`, `2026-06-19-app-prompt-intent-judge.md`. **닫은 것: saved-bundle-only 상태, app/prompt intent judge. 안 닫은 것: product-runner proof.**
5. **(app/chat liveness) 라이브 앱 재실행.** 오늘은 agent를 프로덕션 로그에서 replay했음. liveness 축을 닫으려면 private product repo에서 라이브 앱을 시나리오 턴으로 새로 구동(`evaluate live persona/scenarios` + `--simulator-request-file/--simulator-result-file`의 fulfiller = 호스트 서브에이전트, Proposed Direction 참조) → fresh 응답 judge. 라이브 비용·실행 인스턴스 필요(maintainer 결정).
6. **(리드 C 후속) dev 자연-unsound는 아직 미해결.** app/chat은 자연-unsound가 생겼지만 dev/repo·dev/skill은 여전히 constructed control 한계. 필요하면 별도 harvest로 다룰 것.
7. **(선택) 잔여:** follow-up skill-fixture-command-fragment-lint; 체크인 어댑터의 `dontAsk`→라이브-claude 시 degrade; per-facet routing; specdown 재설계(맨 마지막).

## Discuss (열린 결정)

- 다음 우선순위: app/chat liveness vs app/prompt product-runner proof vs dev 자연-unsound harvest.
- app/chat liveness는 라이브 비용·실행 인스턴스가 필요한 maintainer 결정.

## 제약

push는 사용자 몫(보류). claim-source 편집 후 `npm run claims:refresh:all`(소스 커밋 → refresh → 패킷 커밋); push가 `status-summary.json is stale`로 실패할 때 필요(이번 슬라이스는 apex·evaluation.spec가 claim source라 refresh 수행). 제네릭 엔진·제네릭 런타임 러너에 repo-specific judge 로직 금지. ground truth 제조 금지(sound 케이스는 진짜 라이브 캡처, control만 구성). 새 런타임 표면엔 executable test. bug/error/regression은 `charness:debug`. critique/fresh-eye는 서브에이전트 위임. 검증 서브에이전트·라이브 runtime은 Sonnet.

## References

- **계약/spec/증거**: `docs/contracts/behavior-eval-live-proof.md`(닫힌 결정)·`realsurface-judge-convergence.md`·`skill-surface-judge-convergence.md`·`eval-judge-collaboration.md`(forward pointer); `charness-artifacts/eval-trust/2026-06-19-behavior-eval-live-proven.md`·`2026-06-19-skill-surface-live-proven.md`.
- **라이브 증명 코드**: 드라이버 `scripts/on-demand/behavior-eval-live-proof.mjs`·`skill-orientation-live-proof.mjs`(+각 test); npm `proof:behavior-eval:live`·`proof:skill-orientation:live`; 라이브 러너 `run-local-eval-test.mjs`·`run-local-skill-test.mjs --backend claude_code`.
- **픽스처**: `fixtures/eval/dev/repo/live/`·`fixtures/eval/dev/skill/live/`(capture + rerun + verdicts + cases).
- **debug**: `charness-artifacts/debug/2026-06-19-skill-live-bash-permission-mode.md`.
- **A(앱) 메커니즘**: `cautilus discover scenarios normalize chatbot`(app.go:212), `app_chat_evaluation.go`/`app_prompt_evaluation.go`, `evaluate live persona/request batch`.
- **배지 SOT**: `docs/specs/index.spec.md`·`docs/specs/user/evaluation.spec.md`(양 dev 표면 라이브-proven subclaim). 로드맵 `docs/master-plan.md`.
