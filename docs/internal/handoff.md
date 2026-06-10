# Cautilus Handoff

## Workflow Trigger

**방향 전환 (2026-06-11, maintainer 비준)**: S0 골드셋 HITL은 c04에서 **일시중지**.
c04가 드러낸 구조 문제 — 디스커버 대상 문서 자체가 휴리스틱-시대 stale (claim-discovery-workflow.md의 Review Budget Confirmation 섹션이 같은 파일 30줄 위의 agent-primary 방향 결정과 모순, stale 어휘 31곳) — 때문에 stale 텍스트 위 verdict 비준은 maintainer 예산 낭비로 판정.
새 순서:
1. **확인 게이트 설계** (진행 중, maintainer와 함께): agent-primary에서 스코프 확인 ≠ 모델 비용 승인의 새 배치, 별도 리뷰 단계 존속 여부 — [claim-extraction-template.md](../contracts/claim-extraction-template.md)에 작은 결정 묶음으로 기록.
2. **docs 진실 갱신**: claim-discovery-workflow.md stale 섹션 + README 1곳 + docs/guides/cli.md 1곳. `skills/cautilus-agent/SKILL.md`(stale 8곳)는 제외 — slice 2 본체, consumer-intent freeze 규칙 적용.
3. **갱신 문서에 에이전트 추출 → 그 출력에 HITL** = 새 골드셋 (정답지 비준 + 추출 품질 검수 한 패스; 휴리스틱 점수는 R5대로 파생 계산).
4. slice 4 비교 측정은 새 골드셋 기준.
HITL 세션 `hitl-20260609-235609`은 paused, 사유 기록됨; **R1–R6 규칙과 c01–c03 verdict는 이월** (특히 R6: 소유권/경계-배정 클레임은 deterministic — 판별 테스트 "이 클레임을 평가하면 다른 클레임의 내용이 아닌 무엇이 채점되는가?"). 나머지 33 엔트리는 재생성 대기로 superseded.
캘리브레이션 샘플([2026-06-10-agent-extraction-readme-sample.md](../../charness-artifacts/eval-trust/2026-06-10-agent-extraction-readme-sample.md))은 새 HITL에서도 verdict 잣대로 유효.

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
