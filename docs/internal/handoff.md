# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — specdown 재작성의 First Slice(read-only projector)가 착지했습니다(커밋 03073578, 미push). 이번 세션은 Phase 2를 charness:impl로 집으세요: ledger/evidence 2축을 인벤토리(.cautilus/specdown/claim-inventory.json)에서 파생된 generated 뷰로 붕괴(prose는 손으로), not-a-claim/retire-source 판정 prose 은퇴(SC4). 스펙 canonical: charness-artifacts/spec/2026-06-20-specdown-rewrite-goldset-projection.md(First Slice LANDED 표시 반영됨). 버그/회귀는 charness:debug, 랜딩 전 critique는 포그라운드 Sonnet 서브에이전트 경유(이 호스트는 백그라운드 서브에이전트 결과가 in-band로 회수되지 않음 — 아래 제약).`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).

## Current State

- **specdown 재작성 First Slice 착지(커밋 `03073578`, 미push). spec canonical `2ba82e3e`(+First Slice LANDED 마킹).** projector가 HITL 비준 gold set을 단일 `claimFingerprint`-keyed 인벤토리로 projection → 2축(실은 3축) 불일치를 인벤토리 층에서 구성적으로 제거 시작. 들어간 것: pure lib `scripts/agent-runtime/goldset-projection-lib.mjs` + thin shell `…/build-goldset-projection.mjs`(`surface-audit-lib`/`build-surface-audit` 미러), 명시적 `fingerprint→badge` 맵 `docs/specs/audit/claim-badge-map.json`(7 바인딩, 각 rationale), 구조적 route override `…/claim-proof-route-overrides.json`(README:8 relabel), 생성물 `.cautilus/specdown/claim-inventory.json`, reconciliation, AC1~AC4 테스트(26개), npm `specdown:project[:check]`. `npm run verify` green. critique **READY**(blocker 0).
- **PQ1 해소:** T1→badge는 `primaryEpic` 1:1 아님 — APEX-epic 3개(`-4`/`-5`/`-136`)가 서로 다른 배지로, 다른-epic 2개(`-5`/`-67`)가 같은 배지(claim-discovery)로. T2는 이번 슬라이스에서 배지 미바인딩. **PQ2 해소:** relabel route는 prose `note`에만 존재 → 구조적 override surface로 고정, `resolveProofRoute`는 `note` 미파싱.
- **Reconciliation 발견(정직, 버그 아님):** **7/7 배지 발산** — `readiness`/`a-testable-agent`는 T1 헤드라인 클레임 없음(`no-t1-claim`), 나머지 5개는 route-class-mismatch(예: `reviewable-artifacts`는 비준 `cautilus-eval`이나 apex는 `projected-bundle`/declared). gold-set route 어휘(`deterministic`/`cautilus-eval`/`human-auditable`)와 registry proofClass 어휘는 별개 축 — Problem 절이 예측한 "RELATED but distinct"를 surface한 것. 게이트 아님(read-only). **Phase 2/3의 입력 신호.**
- **미push 커밋 누적**(push는 사용자 몫). tree clean. 배지 변화 없음(7개 honest 유지). 릴리즈 불필요. 게이트/페이지 무수정(`run-verify.mjs` PHASES·`lint:specs`·`docs/specs/*.spec.md`·`surface-registry.json` 모두 그대로).

## Next: specdown 재작성 (남은 단계 순서)

1. **Phase 2 — 2축 붕괴(SC4).** `ledger/`·`evidence/` 페이지를 인벤토리에서 파생된 generated tier/verdict/route state 블록 + 손으로 쓴 prose(FD3)로. not-a-claim(11)/retire-source(5) 판정 → 해당 prose 은퇴(일부 source trim은 `3080482`/`3bc1b06`에 이미 착지). 인벤토리는 `.cautilus/specdown/claim-inventory.json`(read-only 소비). PQ3가 여기서 풀림(완전 생성 vs thin 생성+prose).
2. **Phase 3 — old/ inert + 게이트 exit(FD6/SC5/AC5).** `docs/specs/old/**`의 11개 live `run:shell` 블록 inert(이미 ON인 `lint:specs`가 매 verify 실행 중 → CLI/스펙 변경에 깨질 라이브 리스크). projected tree에서 `lint:specs` green 유지(= exit criterion). 게이트 약화·재비활성 금지.

> 더 큰 frontier(app 표면 liveness, declared→proven, A Testable Agent)는 apex **Proof Debt**(`docs/specs/index.spec.md`)가 소유 — 별개 트랙. reconciliation이 surface한 발산(특히 `reviewable-artifacts`/`host-ownership`의 declared, `readiness`/`a-testable-agent`의 T1 부재)은 그 트랙과 자연 연결.

## Discuss (maintainer 결정 필요)

- 없음. badge 맵·override surface는 데이터로 확정·체크인(critique READY). Phase 2의 ledger/evidence 페이지가 "완전 생성 vs thin 생성+prose"인지는 PQ3로 impl 중 결정.

## 제약

gold set은 *체크인 아티팩트*로 소비(코드 import 금지 — Go 엔진 무오염 확인됨, scripts만). `claimFingerprint`로만 앵커(line 금지 — 앵커는 `558cda7` 기준 stale). 새 projector는 executable test + coverage floor(lib 97.6%/shell 95.5%, 둘 다 통과). `lint:specs` ON 유지 — 약화 금지. claim-source(spec/AGENTS/scanner) 편집 시 `npm run claims:refresh:all`(이번 슬라이스는 미편집 → 불필요). bug/error/regression은 `charness:debug`. **critique/fresh-eye는 포그라운드 Sonnet 서브에이전트로 — 이 호스트에서 `run_in_background:true` 서브에이전트의 최종 메시지가 main으로 in-band 회수되지 않음(TaskOutput·SendMessage 폴링 실패). 포그라운드는 tool result로 정상 반환.**

## References

- **재작성 계약(canonical)**: `charness-artifacts/spec/2026-06-20-specdown-rewrite-goldset-projection.md`.
- **First Slice 증거**: `charness-artifacts/findings/2026-06-20-specdown-goldset-projection-first-slice.md`.
- **착지 표면**: projector `scripts/agent-runtime/goldset-projection-lib.mjs`·`…/build-goldset-projection.mjs`(+`.test.mjs`) · 맵 `docs/specs/audit/claim-badge-map.json`·`…/claim-proof-route-overrides.json` · 생성물 `.cautilus/specdown/claim-inventory.json` · npm `specdown:project[:check]`.
- **HITL 정본**: gold set `charness-artifacts/eval-trust/goldset-v2-head/gold-set-proposal.user-product.json` · closeout `…/HITL-CLOSEOUT.md` · 앵커 `…/ANCHOR.md`(fingerprint carry) · 규칙 R1–R18 `.charness/hitl/runtime/hitl-userprod-v2head-20260617/rules.yaml`.
- **연결 표면**: apex `docs/specs/index.spec.md` · audit 레지스트리 `docs/specs/audit/surface-registry.json` · audit 엔진 `scripts/agent-runtime/surface-audit-lib.mjs` · specdown 파이프라인 `scripts/lint-specs.mjs`·`check-specs.mjs`·`prepare-specdown-pages.mjs`·`scripts/specdown/cautilus-adapter.mjs` · 게이트 `scripts/run-verify.mjs`.
