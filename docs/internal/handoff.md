# Cautilus Handoff

## Workflow Trigger

다음 세션의 첫 수는 **S0 HITL 재개**: 세션 `.charness/hitl/runtime/hitl-20260609-235609`, 커서 c02, verdicts 0/36.
골드셋 maintainer verdicts가 slice 4(비교 측정)의 마지막 남은 의존성이라, 바이너리 쪽이 끝난 지금 이게 크리티컬 패스.
maintainer가 verdict 전 캘리브레이션으로 요청해서 만든 첫 에이전트 추출 실물 샘플(README 단일 파일, 34/34 앵커링, 휴리스틱 15 대비 34)이 [2026-06-10-agent-extraction-readme-sample.md](../../charness-artifacts/eval-trust/2026-06-10-agent-extraction-readme-sample.md)에 있다.
verdict를 매길 때 이 샘플이 보여준 살아있는 경계 — needs-scenario vs ready-for-proof, 그리고 패킷 메커니즘과 에이전트 행동이 섞인 클레임의 deterministic vs cautilus-eval — 를 참조 잣대로 쓴다.
권장 호출 프롬프트: `@docs/internal/handoff.md 핸드오프대로 진행합시다 — S0 골드셋 HITL을 재개해주세요. 캘리브레이션 샘플 노트를 먼저 요약해서 보여주고 시작하세요.`
대안 첫 수(maintainer 선택 시): **slice 2 구현**(에이전트 추출 플로우 — `charness:impl`, [docs/contracts/claim-extraction-template.md](../contracts/claim-extraction-template.md) Implementation Slices 2; `skills/cautilus-agent/` 변경이라 consumer-intent freeze 규칙 발동, SKILL.md 180줄 공개 예산 준수), 또는 **slice 4 비교 측정 셰이핑**(verdicts 없이도 하네스 설계는 가능하나 채점 기준선이 없으면 드라이런만 됨).

## Current State (2026-06-10)

- **추출 계약 slice 1 출하** (commit `cb3994a`): `discover claims extraction-input` / `apply-extraction` 명령쌍 가동.
  input 패킷 = 소스+콘텐츠 해시, 임베디드 템플릿 v1(버전+해시, 병합된 classification_hints 포함), bounds, `--adapter <path>` 오버라이드(읽기 전용 형제 코퍼스용).
  apply = 결과 스키마/templateHash/소스 드리프트는 커맨드 레벨 실패, 앵커링·primary 정확히 1개·rune 바운드·중복 핑거프린트·스코프는 클레임 레벨 거부(`extractionAudit.rejectedClaims`에 기록, 절대 침묵 드롭 없음), `extractionMode: agent` proof-plan 합성.
- 핑거프린트 = sha256(정규화 primary verbatim 발췌)로 전 모드 통일, 휴리스틱 동치성 골든 테스트 고정.
  휴리스틱 패킷도 이제 `extractionMode: heuristic`을 명시(필드 부재 = heuristic 호환 읽기, 테스트 고정).
- `validate` 확장: 해시 일치 시 미앵커 발췌 = 하드 실패, 해시 드리프트 시 = stale-anchor finding(통과), agent 패킷은 `extractionAudit`로 audit-presence 충족(first-extraction), refresh 타깃은 carryForward도 요구.
- 검증: Go+node 전체 스위트, lint 체인, specdown 43 스펙 green. `docs/specs/user/claim-discovery.spec.md`에 실행 가능한 시임 섹션 추가(fixture 레포 라운드트립 run:shell 2블록).
- 위임 fresh-eye critique verdict **ready, 블로커 0** (계약 Critique 섹션에 기록).
- 남은 슬라이스: 2 에이전트 표면 → 3 refresh 합성(`extraction-input --previous`, carry-forward) → 4 비교 측정(slice 1 + S0 verdicts만 전제, slice 2 불필요 — 비준됨).
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
