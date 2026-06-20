# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — specdown 재작성 Phase 2 첫 슬라이스(생성 상태 페이지)가 착지했습니다(미커밋/미push). 이번 세션은 Phase 2의 남은 SC4/FD5를 charness:impl로 집으세요: (1) not-a-claim(11)/retire-source(5) 판정의 source prose(README.md / docs/guides/cli.md) 은퇴 — 이건 claim-source 편집이라 push 전 npm run claims:refresh:all 필수, (2) 아직 손으로 claim 상태를 재진술하는 ledger/evidence prose를 생성 페이지 docs/specs/evidence/projected-claim-state.md로 포인팅. 그 다음 Phase 3(old/** inert + lint:specs exit, SC5/AC5). 스펙 canonical: charness-artifacts/spec/2026-06-20-specdown-rewrite-goldset-projection.md(Phase 2 첫 슬라이스 LANDED 반영, PQ3 RESOLVED). 버그/회귀는 charness:debug, 랜딩 전 critique는 포그라운드 Sonnet 서브에이전트 경유(이 호스트는 백그라운드 서브에이전트 결과가 in-band로 회수되지 않음 — 아래 제약).`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).

## Current State

- **Phase 2 첫 슬라이스 착지(미커밋 작업 트리 — commit/push는 다음 행동).** PQ3 해소: thin 생성+손 prose를, 레포 기존 generate+check 선례(`render-claim-evidence-state.mjs` → 생성 `.md`)로 구현(per-page injected region 아님). 인벤토리(`.cautilus/specdown/claim-inventory.json`)를 **단일** 생성 페이지 `docs/specs/evidence/projected-claim-state.md`로 한 번 렌더(provenance · claim-state summary · proof-route 분포 · 7 T1 headline+badge · badge reconciliation · 56-claim 전체 인벤토리 tier별 document-order). 들어간 것: pure lib `scripts/agent-runtime/projected-claim-state-lib.mjs` + thin shell `…/render-projected-claim-state.mjs`(+`.test.mjs` 2개, 21 테스트), npm `specdown:claim-state[:check]`, evidence/ledger index에서 링크. **인벤토리는 read-only 소비**(재투영 안 함).
- **게이트 체인 닫힘:** `npm run verify` PHASES에 `specdown:project:check` + `specdown:claim-state:check` 둘 다 `lint:specs` 직후로 신규 배선(fail-fast) → gold set →(project:check)→ inventory →(claim-state:check)→ page 전 구간 게이트. 이전엔 project:check가 verify에 없어 Phase 1 인벤토리가 gold set 대비 무탐지 drift 가능했음 — 같이 닫음. **게이트 약화/제거 없음(FD6 유지)**, `run-verify.test.mjs` PHASES 리스트 동기 갱신.
- **검증:** `npm run verify` green(전 phase, ~274s). 신규 파일 coverage lib 99.1%/shell 98.4%(둘 다 warn ceiling 위). fresh-eye Sonnet critique(포그라운드) **READY-WITH-EDITS, blocker 0, 정합성 버그 0, 게이트 약화 0** — 유일한 edit(lib 주석이 "3-way collapse"를 현재형으로 앞서감)는 적용 완료.
- **배지 무변화**(7개 honest 유지, apex/audit registry 무수정). 릴리즈 불필요. 증거: `charness-artifacts/findings/2026-06-20-specdown-phase2-projected-claim-state.md`.

## Next: specdown 재작성 (남은 단계 순서)

1. **Phase 2 잔여 — SC4/FD5.** (a) not-a-claim(11)/retire-source(5) 판정의 source prose 은퇴 — 대상은 README.md / docs/guides/cli.md(line 목록은 인벤토리 `nonGradedByVerdict` + gold set `maintainerVerdict` 필터로 도출; 일부는 `3080482`/`3bc1b06`에 이미 trim). **claim-source 편집이므로 push 전 `npm run claims:refresh:all` 필수**(아래 제약). (b) 아직 claim 상태를 손으로 재진술하는 ledger/evidence prose가 있으면 `projected-claim-state.md`로 포인팅(promise-ledger/evidence-map의 ownership 테이블은 gold-set taxonomy와 별개라 손-저작 정당 — 무리하게 생성으로 바꾸지 말 것).
2. **Phase 3 — old/ inert + 게이트 exit(FD6/SC5/AC5).** `docs/specs/old/**`의 11개 live `run:shell` 블록 inert(이미 ON인 `lint:specs`가 매 verify 실행 → CLI/스펙 변경에 깨질 라이브 리스크). projected tree에서 `lint:specs` green 유지(= exit criterion). 게이트 약화·재비활성 금지.

> 더 큰 frontier(app 표면 liveness, declared→proven, A Testable Agent)는 apex **Proof Debt**(`docs/specs/index.spec.md`)가 소유 — 별개 트랙. reconciliation이 surface한 7/7 발산(특히 `reviewable-artifacts`/`host-ownership` declared, `readiness`/`a-testable-agent` T1 부재)은 그 트랙과 자연 연결이고, 이제 `projected-claim-state.md`에 가시화됨.

## Discuss (maintainer 결정 필요)

- 없음. PQ3는 impl 권한으로 해소(handoff에서 pre-clear). 한 가지 확인 권장: 생성 페이지를 **standalone `.md` + 링크**로 둔 결정(per-page injected region 대신) — 스펙의 "table per page" 문구를 "단일 생성 페이지를 페이지들이 소비"로 해석. 더 강한 per-page 임베드를 원하면 다음 슬라이스에서 전환 가능(되돌리기 저렴: 페이지 1개 + 링크 2곳).

## 제약

gold set은 *체크인 아티팩트*로 소비(코드 import 금지 — scripts만, Go 엔진 무오염). `claimFingerprint`로만 앵커(line 금지 — 앵커는 `558cda7` 기준 stale). 인벤토리는 read-only 소비(재투영은 `specdown:project`만). 새 runtime은 executable test + coverage(둘 다 통과). `lint:specs` ON 유지 — 약화 금지. **claim-source(README/cli/spec/AGENTS/scanner) 편집 시 push 전 `npm run claims:refresh:all`**(이번 슬라이스는 미편집 → 불필요했음; Phase 2 잔여 (a)는 편집함 → 필수). bug/error/regression은 `charness:debug`. **critique/fresh-eye는 포그라운드 Sonnet 서브에이전트로 — 이 호스트에서 `run_in_background:true` 서브에이전트의 최종 메시지가 main으로 in-band 회수되지 않음(TaskOutput·SendMessage 폴링 실패). 포그라운드는 tool result로 정상 반환.**

## References

- **재작성 계약(canonical)**: `charness-artifacts/spec/2026-06-20-specdown-rewrite-goldset-projection.md`(Phase 1 + Phase 2 첫 슬라이스 LANDED, PQ1/PQ2/PQ3 RESOLVED).
- **Phase 2 증거**: `charness-artifacts/findings/2026-06-20-specdown-phase2-projected-claim-state.md`. **Phase 1 증거**: `…/2026-06-20-specdown-goldset-projection-first-slice.md`.
- **Phase 2 착지 표면**: lib `scripts/agent-runtime/projected-claim-state-lib.mjs` · shell `…/render-projected-claim-state.mjs`(+`.test.mjs`) · 생성 페이지 `docs/specs/evidence/projected-claim-state.md` · npm `specdown:claim-state[:check]` · 링크 `docs/specs/evidence/index.spec.md`·`docs/specs/ledger/index.spec.md` · 게이트 `scripts/run-verify.mjs`(+`.test.mjs`).
- **Phase 1 표면**: projector `scripts/agent-runtime/goldset-projection-lib.mjs`·`…/build-goldset-projection.mjs` · 맵 `docs/specs/audit/claim-badge-map.json`·`…/claim-proof-route-overrides.json` · 생성물 `.cautilus/specdown/claim-inventory.json`.
- **HITL 정본**: gold set `charness-artifacts/eval-trust/goldset-v2-head/gold-set-proposal.user-product.json` · closeout `…/HITL-CLOSEOUT.md` · 앵커 `…/ANCHOR.md` · 규칙 `.charness/hitl/runtime/hitl-userprod-v2head-20260617/rules.yaml`.
- **연결 표면**: apex `docs/specs/index.spec.md` · audit 레지스트리 `docs/specs/audit/surface-registry.json` · audit 엔진 `scripts/agent-runtime/surface-audit-lib.mjs` · specdown 파이프라인 `scripts/lint-specs.mjs`·`check-specs.mjs`·`prepare-specdown-pages.mjs`·`scripts/specdown/cautilus-adapter.mjs`.
