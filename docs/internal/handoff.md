# Cautilus Handoff

## Workflow Trigger

다음 세션의 첫 수는 **추출 계약 slice 1 구현**: `charness:impl`로 [docs/contracts/claim-extraction-template.md](../contracts/claim-extraction-template.md)의 Implementation Slices 1(바이너리 first-extraction)을 구현.
계약이 곧 빌드 컨트랙트 — Fixed Decisions와 "Interaction with shipped claim-state consumers" 섹션을 그대로 따르고, Acceptance Checks가 테스트 목록.
대안 첫 수(maintainer 선택 시): **비교 측정 설계** — 골드셋 기준 agent-vs-heuristic 비교(yt-digest 포함, S1/S2 아티팩트가 before 하네스)를 `charness:spec`으로 셰이핑, 또는 **S0 HITL 재개**(세션 `.charness/hitl/runtime/hitl-20260609-235609`, 커서 c02).

## Current State (2026-06-10)

- **이번 세션 출하:** 추출 시임 설계 계약 `docs/contracts/claim-extraction-template.md`.
  4개 시임 결정 maintainer 비준: ① `extraction-input`/`apply-extraction` 명령쌍(review 심 미러, 템플릿 해시 provenance), ② 핑거프린트 = sha256(정규화 primary verbatim 발췌) 전 모드 통일 — 휴리스틱은 excerpt=summary라 기존 패킷 핑거프린트 불변(마이그레이션 0), ③ 앵커링 = 공백 정규화 substring, line은 locator, 미앵커 거부, ④ `cautilus.claim_extraction_input.v1`/`claim_extraction_result.v1` + `extractionMode: agent|heuristic`(부재 시 heuristic).
- **비평 해소:** 위임된 fresh-eye critique가 블로커 2건 발견(기존 `agent-reviewed` 소비자 3곳 충돌 → "Interaction with shipped claim-state consumers" 섹션으로 해소, primary 발췌 패킷 영속화 누락 → sourceRefs `{path,line,excerpt,primary}` 규칙으로 해소) 후 ready-with-edits → 전부 반영.
- 워크플로우 계약의 낡은 조합-핑거프린트 문장을 비준 규칙으로 정렬, direction 단락이 새 계약을 링크.
- 구현 슬라이스 순서(계약에 고정): 1 바이너리 first-extraction → 2 에이전트 표면(SKILL.md, consumer-intent freeze 규칙 발동) → 3 refresh 합성 → 4 비교 측정.
- 골 아티팩트 Slice Log 갱신. **push는 사용자 몫(의도적 보류).**

## Discuss

- 이 레포 `claims:refresh:all` 운영: agent-추출 모드에서 푸시 게이트가 "재생성"이 아니라 "유효성 검증 + staleness 보고"로 바뀌는 시점 (계약 Deferred Decisions에 기록됨; apply-extraction 출하 후 결정).
- agent 패킷의 dogfood 출력 경로: 게이트 결정 전까지 `state_path` 회피 (계약에 명시).
- 심판 모델 고정값(sonnet) vs 제품 러너 정합/비용 (이월), harmony judge 배지 배선 (이월).

## References

- [docs/contracts/claim-extraction-template.md](../contracts/claim-extraction-template.md) — 추출 시임 빌드 컨트랙트 (canonical)
- [골 아티팩트](../../charness-artifacts/goals/2026-06-10-adapter-owned-discovery-classification.md) — redesign 결정·슬라이스 로그·수용 기준
- [docs/contracts/claim-discovery-workflow.md](../contracts/claim-discovery-workflow.md) — 워크플로우 경계 (충돌 시 추출 시임 디테일은 새 계약이 우선)
- [S2 측정 아티팩트](../../charness-artifacts/eval-trust/2026-06-10-discovery-classification-s2-lexicon-proposal.md), [S1 베이스라인](../../charness-artifacts/eval-trust/2026-06-10-discovery-classification-s1-baseline.md) — 비교 하네스
