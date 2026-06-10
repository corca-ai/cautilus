# Cautilus Handoff

## Workflow Trigger

다음 세션의 첫 수는 **agent-primary 추출의 후속 설계 슬라이스 셰이핑**: `charness:spec`(또는 짧은 ideation)으로 추출 템플릿 + 패킷 계약을 설계.
읽기 순서: [골 아티팩트의 `## Redesign Decision`](../../charness-artifacts/goals/2026-06-10-adapter-owned-discovery-classification.md) → [claim-discovery-workflow.md의 direction decision 단락](../contracts/claim-discovery-workflow.md) (Skill Responsibilities + classification-hints 섹션).
maintainer가 HITL 배치를 명시적으로 요청할 때만 대안 첫 수: **S0 HITL 재개** — 세션 `.charness/hitl/runtime/hitl-20260609-235609`, 커서 c02. 골드셋 verdicts는 이제 S3 힌트가 아니라 **agent-추출 평가 기준선**으로 쓰임.

## Current State (2026-06-10)

- **방향 결정 (maintainer 비준):** 클레임 추출은 agent-primary로 — 에이전트가 제품 소유 템플릿(클레임 정의, adapter의 `classification_hints`에서 공급되는 비클레임 규약, 원문 발췌 강제, bounded 스키마)을 따라 추출하고, 바이너리는 앵커링 검증·핑거프린트·refresh/carry-forward·미앵커 거부를 소유. git 해시 + 소스 해시 diff 스캔으로 재추출은 변경 소스에만. 휴리스틱 추출기는 `extractionMode` 라벨(계약에 명명만 됨, 필드 구현은 후속 패킷 계약 슬라이스 소관) 베이스라인으로 유지. 근거·결과는 골 아티팩트 `## Redesign Decision`에.
- **이번 세션 출하:** S1 3-코퍼스 베이스라인(yt-digest 0건 = 언어 갭 실증), S2 엔진(`claim_lexicon_terms` substring + 룬 바운드 + 폴백 레인 + `discover claims --adapter <path>` 오버라이드), S4(`Deferred Decisions` 하드코딩 삭제 → 포터블 기본값 합집합). yt-digest 0→19 측정 아티팩트 체크인.
- **S3 해소 / S2 용어 비준 보류:** 라우팅 힌트 패밀리는 redesign으로 해소; yt-digest 4용어는 agent-proposed로 남김(베이스라인 모드에만 해당).
- verify 전체 green. **push는 사용자 몫(의도적 보류) — origin 대비 50+ 커밋.**

## Next Session

1. 추출 템플릿 + 추출 패킷 계약(`cautilus.claim_extraction_*`는 가칭, 명명 미비준) 설계 슬라이스 셰이핑 (spec/ideation; 바이너리 앵커링 검증 = `discover claims validate` 확장 여부 포함).
2. 골드셋 기준 agent-vs-heuristic 비교 측정 설계 (yt-digest 포함 — 한국어가 템플릿만으로 풀리는지 검증; S1/S2 아티팩트가 before 하네스).
3. S0 HITL 재개 (maintainer 배치; ~14건 우선 순서는 더 이상 강제 아님 — 전체가 평가 기준선).

## Discuss

- 추출 패킷의 재현성 계약: 원문-발췌 앵커링으로 충분한가, 세그먼테이션 드리프트 허용 범위는.
- 이 레포 `claims:refresh:all` 운영: agent-추출 모드에서 푸시 게이트가 "재생성"이 아니라 "유효성 검증 + staleness 보고"로 바뀌는 시점.
- 심판 모델 고정값(sonnet) vs 제품 러너 정합/비용 (이월), harmony judge 배지 배선 (이월).

## References

- [골 아티팩트](../../charness-artifacts/goals/2026-06-10-adapter-owned-discovery-classification.md) — redesign 결정·슬라이스 로그·수용 기준
- [docs/contracts/claim-discovery-workflow.md](../contracts/claim-discovery-workflow.md) — direction decision + classification_hints 계약
- [S2 측정 아티팩트](../../charness-artifacts/eval-trust/2026-06-10-discovery-classification-s2-lexicon-proposal.md) — 0→19 측정, `니다` 퇴화 분석, 비교 하네스
- [S1 베이스라인](../../charness-artifacts/eval-trust/2026-06-10-discovery-classification-s1-baseline.md) — 코퍼스 커밋 고정값
