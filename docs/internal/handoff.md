# Cautilus Handoff

## Workflow Trigger

**방향 전환 (2026-06-16, maintainer 비준)**: 에이전트 추출이 골드셋용으로 292 클레임을 뱉었고, maintainer가 "292가 정당하게 뽑혔나"를 의심.
`charness:debug`(charness-artifacts/debug/latest.md) 결과: 추출 실패가 아니라 **큐레이션 단계 부재**의 증상.
제품엔 리뷰가 둘인데(라벨 리뷰=추출이 인라인으로 함 / 큐레이션 리뷰=중복·층위·worth-proving — 아무 시임도 안 함, README #10/#11 약속만 있고 review-input은 agent-reviewed 제외) 설계가 둘을 뭉갬.
세 결함: ① audience 혼합(working-patterns의 정당한 48 developer 클레임이 user 제품 약속과 한 리스트에), ② raw 패킷을 리뷰 표면으로 씀(README #10/#11 위반), ③ 템플릿 과다-방출(동일 입력서 휴리스틱 2.6배, cli 3.7배).
**spec 비준** (charness-artifacts/spec/2026-06-16-agent-extraction-curation-layering.md): D1 추출 고-recall 유지 / D2 audience 트랙 분리(user-product 먼저) / D3·큐레이션은 **deferred** / 측정은 raw 추출 직접 채점.

**메타 결정 (ground-truth-first, fresh-eye critique 반영)**: 큐레이션을 먼저 빌드하지 **않는다**. 싼 순서로 ground truth부터:
1. **다음 첫 수: 기존 292 패킷을 `claimAudience`로 세그먼트** (새 시임 없이 gold-set-proposal.json 분할) → user-product 트랙(~95) + developer 트랙(~197). union=292 가역성 체크. HITL 큐를 user-product 트랙으로 재범위.
2. **paused HITL을 user-product 트랙(~95)부터 재개** (R1–R9, verdict #0 accept/R8·#1 not-a-claim/R9 이월). verdict의 `not-a-claim`/`badly-bounded` 비율 = 과다추출 신호이자 큐레이터 정의.
3. **그 verdict로 큐레이터 빌드 여부·방식 결정** — 빌드 시 새 시임보다 **review 시임 재사용**(agent-reviewed 제외 완화) 우선 검토. not-a-claim 적으면 큐레이터 불필요.
4. slice 4 비교 측정은 ratified 골드셋 대상(raw 추출의 recall+라벨 정확도; 큐레이터 빌드됐으면 재현도 별도).
권장 호출 프롬프트: `@docs/internal/handoff.md 핸드오프대로 진행합시다 — 292 패킷을 audience로 세그먼트하고 user-product 트랙으로 골드셋 HITL을 재개해주세요.`

**대상 패킷**: charness-artifacts/eval-trust/goldset-v2-agent-extraction/claims-agent.json (292, extractionMode agent, 292/292 앵커, validate clean). 골드셋 제안서: 같은 디렉터리 gold-set-proposal.json.
**HITL 세션 `hitl-20260611-082742`** paused (사유 state.yaml 기록). **이월 자산**: 규칙 R1–R9 (rules.yaml), verdict #0 README:4 accept/R8(우산=대표 e2e 시나리오 1개로 증명), #1 README:6 not-a-claim/R9(전제/프레이밍). R7=클레임 하나씩 자세히 제시(그룹 테이블 금지), R8=우산, R9=전제.
**중요**: 큐레이션을 ground truth 전에 빌드 금지(critique: 틀린 큐레이터). raw를 큐레이션 후 채점 금지(critique: 측정 오염 — 골드셋은 raw 추출 직접 채점). docs/internal/* 제외 금지(maintainer: AGENTS/CLAUDE 링크 = 정당한 developer 클레임).
**다이나믹 워크플로우**: 큐레이터를 빌드하면(slice 3) 그 실행에 사용(팬아웃+적대적 드롭 검증), 또는 비교 측정 팬아웃. 지금 중심 아님.

**이전 세션 (2026-06-11, 완료)**: 게이트 설계 + docs 진실 갱신 출하 (commit `df8a7fb` 외), 갱신 문서에 에이전트 추출 (commit `75e12a6`). 이전 HITL `hitl-20260609-235609`은 superseded (그 골드셋 제안서도).
캘리브레이션 샘플([2026-06-10-agent-extraction-readme-sample.md](../../charness-artifacts/eval-trust/2026-06-10-agent-extraction-readme-sample.md))은 verdict 잣대로 유효.

## Current State (2026-06-10)

- **추출 계약 slice 1 출하** (commit `cb3994a`): `discover claims extraction-input` / `apply-extraction` 명령쌍 가동.
  input 패킷 = 소스+콘텐츠 해시, 임베디드 템플릿 v1(버전+해시, 병합된 classification_hints 포함), bounds, `--adapter <path>` 오버라이드(읽기 전용 형제 코퍼스용).
  apply = 결과 스키마/templateHash/소스 드리프트는 커맨드 레벨 실패, 앵커링·primary 정확히 1개·rune 바운드·중복 핑거프린트·스코프는 클레임 레벨 거부(`extractionAudit.rejectedClaims`에 기록, 절대 침묵 드롭 없음), `extractionMode: agent` proof-plan 합성.
- 핑거프린트 = sha256(정규화 primary verbatim 발췌)로 전 모드 통일, 휴리스틱 동치성 골든 테스트 고정.
  휴리스틱 패킷도 이제 `extractionMode: heuristic`을 명시(필드 부재 = heuristic 호환 읽기, 테스트 고정).
- `validate` 확장: 해시 일치 시 미앵커 발췌 = 하드 실패, 해시 드리프트 시 = stale-anchor finding(통과), agent 패킷은 `extractionAudit`로 audit-presence 충족(first-extraction), refresh 타깃은 carryForward도 요구.
- 검증: Go+node 전체 스위트, lint 체인, specdown 43 스펙 green. `docs/specs/user/claim-discovery.spec.md`에 실행 가능한 시임 섹션 추가(fixture 레포 라운드트립 run:shell 2블록).
- 위임 fresh-eye critique verdict **ready, 블로커 0** (계약 Critique 섹션에 기록).
- 남은 슬라이스 (2026-06-11 재서열): 게이트 설계 + docs 진실 갱신 → 새 골드셋(에이전트 추출 출력 HITL) → 2 에이전트 표면 → 3 refresh 합성(`extraction-input --previous`, carry-forward) → 4 비교 측정(새 골드셋 기준).
- S0 36-엔트리 골드셋 제안서는 superseded(33 미비준 엔트리 재생성 대기); HITL 규칙 R1–R6은 이월 자산.
- **push는 사용자 몫(의도적 보류).**

## Discuss

- 이 레포 `claims:refresh:all` 운영: agent-추출 모드에서 푸시 게이트가 "재생성"이 아니라 "유효성 검증 + staleness 보고"로 바뀌는 시점 — apply-extraction이 출하됐으므로 이제 결정 가능 (계약 Deferred Decisions).
- agent 패킷의 dogfood 출력 경로: 게이트 결정 전까지 `state_path` 회피 (계약에 명시).
- 템플릿 v1 프로즈 품질은 slice 4 비교 측정이 판정 — 측정 전 프로즈 다듬기는 추측이므로 보류.
- 심판 모델 고정값(sonnet) vs 제품 러너 정합/비용 (이월), harmony judge 배지 배선 (이월).

## References

- [docs/contracts/claim-extraction-template.md](../contracts/claim-extraction-template.md) — 추출 시임 빌드 컨트랙트 (canonical; slice 1 shipped 마킹됨)
- [골 아티팩트](../../charness-artifacts/goals/2026-06-10-adapter-owned-discovery-classification.md) — redesign 결정·슬라이스 로그·수용 기준
- [docs/specs/user/claim-discovery.spec.md](../specs/user/claim-discovery.spec.md) — 시임 실행 가능 스펙 (run:shell 라운드트립)
- [docs/contracts/claim-discovery-workflow.md](../contracts/claim-discovery-workflow.md) — 워크플로우 경계 (충돌 시 추출 시임 디테일은 새 계약이 우선)
- [S2 측정 아티팩트](../../charness-artifacts/eval-trust/2026-06-10-discovery-classification-s2-lexicon-proposal.md), [S1 베이스라인](../../charness-artifacts/eval-trust/2026-06-10-discovery-classification-s1-baseline.md) — 비교 하네스
