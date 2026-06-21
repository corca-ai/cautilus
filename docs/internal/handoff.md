# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행 — specdown 코퍼스 재구조화 Slice 1~3 착지(코어 완료). 계약 charness-artifacts/spec/2026-06-21-specdown-corpus-proof-spine-restructure.md 를 먼저 읽고, Slice 4(deferred/optional)를 진행할지 사용자에게 확인하거나 다른 백로그로 이동하세요.`

첫 tool call = 계약 파일 read. Slice 1~3 은 끝났으니 doc 멘션 픽업이어도 재독에 그치지 말고 위 분기를 실행하세요. (Slice 4 는 optional 이라 자동 착수 금지 — 사용자 의사 확인 먼저.)

## Current State

- **specdown 코퍼스 재구조화 코어 완료(미push):** proof-spine + typed traceability + 구조 이동까지 전부 착지. `npm run verify` green, honesty audit 7/7(proven=7, inconsistent=0, orphan=0), `specdown trace -strict` 26 typed docs / 45 edges, check-specs 39 specs, lint:links 535 ok, claims freshness 69/69, hooks ready. standing gate 무회귀(specdown run ~25s, lint:specs ~21–28s).
- **이번 세션(Slice 3, 구조 이동) 3커밋:**
  - `a7cbc22e` 3a: 생성 페이지 4개 → `docs/specs/generated/`(audit·promise-ledger·projected-claim-state·claim-evidence-state). trace.ignore `generated/**`로 합침, 어댑터 exclude/artifact_paths·drift 게이트 repoint.
  - `c6d94e89` 3b: 7 promise leaf → `docs/specs/promises/`. `user/`는 워크플로 뷰로 유지(index + evidence-gaps). registry proofSpec·apex badges 엣지·전 인바운드 링크·README 갱신. (D-leftover = user, A안: user/ 유지.)
  - `09d3ad3e` 3c: 어댑터 정합성 — claim exclude에 `archive/**` 추가(old/와 균일), audience_hints.user에 `promises/**` 추가(3b가 7 promise를 developer로 오분류한 것을 user로 복원).
- 각 sub-slice마다 fresh-eye 비평(Explore subagent, read-only) 통과 — 3a/3b/3c 모두 전 항목 CONFIRMED-OK.
- **디렉토리 구조(현재):** `promises/`(7 타입드 promise) · `generated/`(4 머신 페이지) · `contracts/` · `rules/` · `evidence/` · `ledger/` · `user/`(index + evidence-gaps) · `old/`·`archive/`(frozen, 모든 게이트에서 제외·enforced).
- **계약(SOT):** 위 파일에 Slice 1/2a/2b/3a/3b/3c Delivered 전부 기록. Migration Map의 Slice 1~3 완료.

## Next Session

1. **Slice 4(deferred/optional, 사용자 확인 후):** Alloy 불변식(claim-state partition completeness + mutual exclusivity, badge↔route bijection / no-orphan) — `specdown alloy explore` 사용 가능 확인됨. 그리고 optional `.spec.md`→`.md` rename(check-specs/specdown entry/surface-registry proofSpec/build-surface-audit·생성기 출력 경로 결합 — lockstep). 재구조화 코어는 이미 끝났으니 Slice 4 는 폴리시/포멀라이즈 단계 — 착수 전 사용자 의사 확인.
2. **Residual A(권장 follow-up):** `promises/claim-discovery.spec.md`가 live `.cautilus/claims` 버킷을 exact-assert(현재 7) → docs 편집마다 재churn. structural(subset/floor) assert로 전환 권장.
3. **Residual B(3c에서 신규 발견, 보류):** 생성 페이지(`generated/audit.spec.md`·`promise-ledger.spec.md`·`projected-claim-state.md`)가 아직 claim discovery 소스로 스캔됨(~49 후보). 이제 명백히 머신-owned이므로 claim discovery에서 제외할지 별도 슬라이스로 검토 — 단 claim-set semantic 변경이라 bucket 안정성 체크 동반 필요(Non-Goal 경계).
4. **push 전 필수:** claim-source(docs/specs/**, README, AGENTS, 어댑터 등) 편집했으면 `npm run claims:refresh:all` 후 push. (이번 세션 3커밋은 이미 refresh 반영 + 미push — push는 user 몫.)

## Discuss

- Slice 4 를 지금 진행할지 / 다른 백로그 우선인지 (optional 단계라 사용자 결정).

## References

- 계약(SOT): `charness-artifacts/spec/2026-06-21-specdown-corpus-proof-spine-restructure.md`
- specdown 자산: `charness-artifacts/gather/2026-06-21-specdown-tool-purpose-and-authoring.md`
- 증명 머신(rename 시 lockstep): `docs/specs/audit/surface-registry.json`(7 proofSpec → promises/) · `scripts/agent-runtime/build-surface-audit.mjs`(APEX_PATH·AUDIT_PAGE_PATH) · `scripts/check-specs.mjs`(reachability + old/archive 제외 guard) · `scripts/lint-specs.mjs`(trace 게이트) · 생성기들(`render-promise-ledger.mjs`·`render-projected-claim-state.mjs`·`render-claim-evidence-state.mjs` 출력 → generated/)
