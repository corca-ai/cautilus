# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — specdown 재작성의 설계+critique가 끝났습니다(스펙 canonical: charness-artifacts/spec/2026-06-20-specdown-rewrite-goldset-projection.md, READY-WITH-EDITS·4 edit fold). 이번 세션은 impl 안 함 — 다음 세션이 First Implementation Slice를 charness:impl로 집으세요. 첫 슬라이스 = read-only projector(gold set→fingerprint-keyed claim 인벤토리) + 명시적 fingerprint→badge 맵 + relabel-route override surface, 게이트/페이지 변경 0. 스펙의 Fixed Decisions·AC1~AC4·First Implementation Slice를 계약으로 읽고, 버그/회귀는 charness:debug, 랜딩 전 critique 경유.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).

## Current State

- **specdown 재작성 설계 착지(impl 미착수, 의도된 경계).** 커밋 spec `2ba82e3e`. 방향 = **project, not patch**: `docs/specs/` 표면을 손으로 쓴 3축(apex/ledger/evidence)에서 **HITL 비준 gold set**(`charness-artifacts/eval-trust/goldset-v2-head/gold-set-proposal.user-product.json`, 74 user-product, R1–R18)의 projection으로 재생성 → 2축 불일치를 구성적으로 제거. `claimFingerprint` 앵커(line 아님), hybrid generate(인벤토리·tier·proof-route 바인딩)+prose(배지 카피), **user track만**(dev 232 defer).
- **critique가 코드/데이터로 잡은 4개**(폴드됨): (1) `lint:specs`는 이미 **ON**(`f1b4fc4b`) — `docs/specs/old/**`의 **live `run:shell` 11개**가 매 verify 실행 → inert화는 *초반* 작업; (2) T1 7개 ↔ 배지 7개는 **1:1 아님**(3개가 `primaryEpic=APEX`, epic 어휘가 badge ID와 disjoint) → 명시적 `fingerprint→badge` 맵 필수; (3) relabel(`claim-readme-md-8`) ratified route는 **prose-only**(`agentLabels.recommendedProof`는 pre-relabel 값) → override surface가 day-1; (4) `significanceTier`는 top-level 필드. **FD2(fingerprint 키 안정성) 확인됨.**
- **선행(이번 세션 앞부분): audit 잔여 ③ 구조적 절반 착지** — `evidenceSubstantive` floor(커밋 `b2391e0d`). 이게 projection이 먹일 proof-route 바인딩 층이라 재작성과 자연 연결. 의미적 intent-judge는 deferred·게이트-비호환.
- **미push 커밋 누적**(push는 사용자 몫). tree clean. 배지 변화 없음(7개 honest 유지). 릴리즈 불필요.

## Next: specdown 재작성 (스펙 단계 순서)

1. **First slice (projector, 게이트 변경 0).** gold set→durable-graded 56개 필터→`claimFingerprint`-keyed 인벤토리 아티팩트(`{significanceTier, ratifiedProofRoute, primaryEpic, summary, sourceRef, audience}`). day-1에 `fingerprint→badge` 맵 + `fingerprint→ratifiedProofRoute` override(relabel용). 7 T1 projection + 56/18 split을 테스트로 고정. `surface-registry.json`과 reconcile(read-only). AC1~AC4.
2. **2축 붕괴.** ledger/evidence를 인벤토리에서 파생된 generated 뷰로(prose는 손으로). not-a-claim/retire-source 판정 → 해당 prose 은퇴.
3. **old/ inert + 게이트 유지.** `docs/specs/old/**` 11개 `run:shell` 블록 inert(초반에), 이미 ON인 `lint:specs`를 projected tree에서 green 유지(= exit). 게이트 약화·재비활성 금지.

> 더 큰 frontier(app 표면 liveness, declared→proven, A Testable Agent)는 apex **Proof Debt**(`docs/specs/index.spec.md`)가 소유 — 별개 트랙. 재작성이 그 표현을 projection으로 일원화하면 거기로 자연 수렴.

## Discuss (maintainer 결정 필요)

- 없음. 방향(project-not-patch·hybrid·user-track·fingerprint)은 메인테이너 비준됨. 첫 슬라이스의 `fingerprint→badge` 맵 내용·override surface 형태는 impl 중 데이터로 결정(PQ1/PQ2).

## 제약

gold set은 *체크인 아티팩트*로 소비(코드 import 금지, generic 엔진에 정본 로직 금지). `claimFingerprint`로만 앵커(line 금지 — 앵커는 `558cda7` 기준 stale). 새 projector는 executable test + coverage floor. `lint:specs` ON 상태 유지 — 약화 금지. claim-source(spec/AGENTS/scanner) 편집 시 `npm run claims:refresh:all`. bug/error/regression은 `charness:debug`. critique/fresh-eye·라이브 runtime은 Sonnet 서브에이전트 위임.

## References

- **재작성 계약(canonical)**: `charness-artifacts/spec/2026-06-20-specdown-rewrite-goldset-projection.md`.
- **HITL 정본**: gold set `charness-artifacts/eval-trust/goldset-v2-head/gold-set-proposal.user-product.json` · closeout `…/HITL-CLOSEOUT.md` · 앵커 `…/ANCHOR.md`(fingerprint carry) · 규칙 R1–R18 `.charness/hitl/runtime/hitl-userprod-v2head-20260617/rules.yaml`.
- **연결 표면**: apex `docs/specs/index.spec.md` · audit 레지스트리 `docs/specs/audit/surface-registry.json` · audit 엔진 `scripts/agent-runtime/surface-audit-lib.mjs` · specdown 파이프라인 `scripts/lint-specs.mjs`·`check-specs.mjs`·`prepare-specdown-pages.mjs`·`scripts/specdown/cautilus-adapter.mjs` · 게이트 `scripts/run-verify.mjs`.
- **선행 audit 슬라이스**: spec `charness-artifacts/spec/2026-06-20-surface-audit-assertion-value-floor.md` · evidence `charness-artifacts/findings/2026-06-20-surface-audit-assertion-value-floor.md`.
