# HTML Report Surface (seed spec)

이 문서는 `Cautilus`의 HTML 보고 surface가 리드미의 human-review 약속을 만족하는지를 executable하게 검증하기 위한 **seed spec**이다.
현재는 최소한의 file_exists 단언만 두고, 다음 세션에서 `charness:spec` + `charness:support/specdown` 스킬로 spec과 구현을 함께 확장한다.

이 spec은 `charness:support/specdown`의 철학 — *spec과 구현은 분리 불가, tight loop로 co-evolve* — 를 따른다.
이번 seed는 의도적으로 미완이다.
다음 세션은 이 파일을 자신이 실행할 로드맵으로 삼는다.

## Intent

리드미는 Core Flow에서 다음을 약속한다:

> "static HTML views of the same artifacts so a human reviewer can judge them in a browser without an agent in the loop"

즉 한 명의 사람이 브라우저에서 evaluation 결과를 열고, LLM 에이전트 없이도 결정 (수용 / 반려 / 추가 검토) 가능해야 한다.
각 first-class evaluation artifact — report, review packet, review variants summary, compare, scenario proposals, evidence bundle, self-dogfood bundle — 이 JSON 옆에 대응 HTML을 갖는다.

## Claim catalog — 다음 세션이 executable row로 승격할 대상

1. **Self-dogfood latest**.
   `artifacts/self-dogfood/latest/index.html`이 자동 렌더되고, `summary.json`, `report.json`, `review-summary.json`의 최종 결론 (`gateRecommendation`, `reportRecommendation`, 주요 review 판정) 이 한 화면에서 인지 가능.
2. **Self-dogfood experiments**.
   `artifacts/self-dogfood/experiments/latest/index.html`이 실험별 A/B를 side-by-side 표현.
3. **Mode evaluate report**.
   `cautilus mode evaluate`가 산출하는 `report.json` 옆에 `report.html`이 자동 생성되고, intent / scenario 결과 / per-mode 상태가 구조적으로 표현.
4. **Review packet**.
   `cautilus review prepare-input`이 산출하는 `review.json` 옆에 `review.html`이 자동 생성되고, review 질문 / artifact 링크 / judge response가 연결 탐색 가능.
5. **Review variants summary**.
   `cautilus review variants`가 산출하는 `review-summary.json` 옆에 `review-summary.html`이 자동 생성되고, variant별 상태 (`passed`/`blocked`/`failed`) 와 blocker reason이 구조화 표현.
6. **Compare artifacts**.
   `cautilus workspace prepare-compare` 결과의 baseline/candidate 차이가 HTML에서 side-by-side 표현.
7. **Scenario proposals**.
   `cautilus scenario propose` 결과 packet에 대한 HTML view.
8. **Evidence bundle**.
   `cautilus evidence bundle` 결과 packet에 대한 HTML view.

각 HTML view는 다음을 만족해야 한다:

- 외부 네트워크 의존 없음 — CSS/JS는 바이너리에 embed (Go `//go:embed`).
- JSON packet이 source of truth, HTML은 read-only 재표현 (원본 JSON이 없으면 HTML도 없다).
- 상호 링크 (`.md`, `.json`) 는 자동으로 `.html`로 rewrite되어 브라우저에서 계속 탐색 가능.
- 글로벌 TOC 사이드바 — 현재 run의 모든 artifact를 한눈에 + 각 항목의 상태 (녹색/황색/적색).
- 모바일 폭에서도 최소한 읽힘 (반응형 필수는 아님, 깨지지만 않으면 됨).

## 현재 상태 (2026-04-16)

- `cautilus self-dogfood render-html` + `render-experiments-html` 존재.
  self-dogfood 전용으로 범위 좁음.
- `internal/runtime/self_dogfood_html.go` — HTML 렌더링 진입점.
  claim 1–2 일부 커버.
- report / review / review-summary / compare / scenario-proposals / evidence 각각에 대한 HTML 렌더 경로: 없음.
- 글로벌 TOC, 사이드바, 링크 rewriting, embed asset 전략: 부재 또는 얇음.
- 관련 `operator-acceptance.md` 행 (6.13–6.17) 중 6.13, 6.14만 실제 판정 가능.

## specdown 참조 — 다음 세션이 읽을 패턴 소스

이웃 리포 `/home/hwidong/codes/specdown`의 HTML reporter가 이 spec이 닮아야 할 수준의 reference다.
다음 세션은 `charness:support/specdown` 스킬을 먼저 로드하고, 아래 파일들을 fresh eye로 읽어 Cautilus 맥락으로 옮긴다.

- `internal/specdown/reporter/html/reporter.go` (391 lines) — 진입점, `//go:embed`로 CSS/JS 단일 바이너리 패키징.
- `internal/specdown/reporter/html/render.go` (1005 lines) — 문서 노드 walk, status 주입, 링크 rewriting.
- `internal/specdown/reporter/html/toc.go` (362 lines) — 글로벌 TOC, 계층 구조, 상태 색상.
- `internal/specdown/reporter/html/trace.go` (175 lines) — 실행 trace를 HTML에 연결.
- `internal/specdown/reporter/html/assets/script.js` (104 lines) — TOC collapse, scroll-spy, sticky heading.
- `internal/specdown/reporter/html/assets/style.css` (912 lines) — 전체 시각 언어.
- `internal/specdown/reporter/html/reporter_test.go` (1136 lines) — HTML 출력을 1급 테스트 대상으로 취급.

핵심 교훈은 *HTML을 JSON의 부록이 아니라 독립 1급 surface로 취급하고, 그에 맞는 테스트 밀도를 확보한다*는 것이다.

## 다음 세션 확장 순서 (권장)

1. `charness:find-skills`로 `charness:spec` + `charness:support/specdown`이 이 리포에서 접근 가능한지 확인.
   실패하면 먼저 플러그인/설치 상태 교정.
2. **Claim 1–2 보강**.
   이미 렌더되는 `self_dogfood_html.go`에 글로벌 TOC + 링크 rewriting + 상태 색상 단언을 추가.
   spec row 하나씩 승격 → 테스트 fail → 구현 → pass 의 tight loop.
3. **Claim 3 (mode evaluate report)** — 가장 큰 가치.
   새 렌더러 (`cautilus report render-html` 또는 `cautilus mode evaluate --emit-html`) 추가.
   spec row 작성 → impl.
4. **Claim 4–5 (review packet, review variants summary)** — 3의 패턴 재사용.
5. **Claim 6–8 (compare, scenario proposal, evidence)** — 순차.
6. **글로벌 TOC 통합** — 한 `artifacts/<run>/index.html`에서 그 run의 모든 artifact를 사이드바로 탐색 가능하게.
   specdown의 TOC 패턴이 그대로 참고된다.

각 단계는 spec row 추가 → `npm run lint:specs` fail → impl → pass 로 진행한다.
single commit당 claim 하나 원칙을 지키면 review가 쉬워진다.

## Acceptance 연결

이 spec의 통과 여부는 [operator-acceptance.md](../operator-acceptance.md) Tier 6b (Promotion Readiness — HTML report, 6.13–6.17) 의 인간 판정 체크리스트가 전부 녹색이 되는 것과 등가다.
구현이 진행됨에 따라 Tier 6b의 `(다음 세션 구현 후)` 주석이 실제 렌더 명령으로 치환된다.

## Non-goals (이 spec은 이것을 포함하지 않는다)

- 외부 호스팅 웹사이트 생성.
- 인증 / 권한 / 멀티 사용자.
- 실시간 스트리밍 / WebSocket.
- HTML이 JSON 원본을 대체하는 편집 surface가 되는 것 (항상 read-only).

## 현재 executable guard (seed)

아래 check는 이 seed가 **현재 참인 것만** 단언한다.
다음 세션이 claim 1–8을 하나씩 executable row로 승격시킨다.

> check:source_guard

| file | mode | pattern |
| --- | --- | --- |
| internal/runtime/self_dogfood_html.go | file_exists |  |
| docs/operator-acceptance.md | fixed | Tier 6: Promotion Readiness |
| docs/operator-acceptance.md | fixed | html-report.spec.md |
