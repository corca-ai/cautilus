# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — audit 잔여(③)의 구조적 절반이 착지했습니다(evidenceSubstantive floor: 각 레지스트리 evidence 파일은 schemaVersion/exists 같은 hollow touch가 아니라 ≥1개의 substantive assertion으로 참조돼야 proven). 메인테이너는 이제 specdown 재작성 트랙으로 전환 의향. 그 전에 남은 audit-트랙 항목은 의미적 intent-judge(deferred·optional, 게이트-비호환)뿐이고 구조는 전부 green. specdown 재작성을 집으면 먼저 그 범위를 spec으로 좁히고 impl 직행 금지·critique 경유. 작은 슬라이스를 원하면 CI Go-pin 신선도 또는 improve ①a(둘 다 deferred).`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).

## Current State

- **Audit 잔여 ③ 구조적 절반 착지.** 커밋: spec `4d263b97`, impl `b2391e0d`. Surface Honesty Audit의 evidence 바인딩을 "evidence 파일이 *읽히는지*"(`evidenceReferenced`)에서 "≥1개 **substantive** check로 읽히는지"(`evidenceSubstantive`)로 상향. substantive = 비-`schemaVersion` 경로에 값-담지 `equals`/`includes`/`min_number≥1`/`meaning`(빈 셀 comparator는 어댑터가 no-op 취급 → trivial). hollow 약화(schemaVersion-only)는 이제 badge를 `unproven`으로 떨구고 `audit:surface --check` 게이트 실패.
- **Latent-not-active**: 모든 레지스트리 evidence가 이미 substantive 참조 → floor는 all-true로 착지(회귀 가드). 구조적 padding 갭만 닫고, assertion 값이 *의미적으로 정당한지*는 의도적으로 판단 안 함 → 그게 deferred intent-judge. audit 페이지의 잔여 문단을 그에 맞게 재작성.
- **검증**: `npm run verify` 전 phase green(302s, `audit:surface --check` clean 7/7 honest, coverage floor OK), 유닛 27/27(AC3 실파일 회귀 + hollow→unproven 포함). lib는 순수 유지(fs는 build 스크립트). 두 Sonnet critique(spec READY-WITH-EDITS 1 edit fold, impl READY 0 blocker) 모두 코드 대조 file:line 인용.
- **배지 변화 없음**(7개 전부 레벨 유지·honest). **미push 커밋 누적**(push는 사용자 몫). tree clean(claims refresh 후). 릴리즈 불필요(출시 표면 무변경).

## Next: 다음 트랙

1. **specdown 재작성(메인테이너 다음 트랙).** 아직 spec 없음 — 집으면 먼저 범위를 spec으로 좁히고 critique 경유. audit-트랙은 이 전환 전에 구조적으로 정리됨.
2. **Audit 잔여 ③ 의미적 절반(deferred·optional).** 각 substantive assertion의 값이 behavior를 실제로 정당화하는지 verdict하는 LLM intent-judge. deterministic `lint:specs` 게이트에서 못 돎(replay 전용) → standing이 아니라 opt-in일 수밖에. 구조적 padding은 이미 닫혀 marginal. per-assertion 의미 강도를 원할 때만.
3. **작은 deferred 슬라이스**: CI Go-version pin 신선도 자동화 · improve `①a` replay-parity judge 수렴(둘 다 marginal, 이전 핸드오프 잔여).

> 더 큰 frontier(Behavior Eval **app 표면** liveness/product-runner, Reviewable Artifacts·Host Ownership **declared→proven**, A Testable Agent **promised→스펙**)는 apex **Proof Debt**(`docs/specs/index.spec.md`)가 durable하게 소유 — 위 트랙과 별개의 더 긴 길. handoff는 ledger를 복제하지 않고 거기를 가리킴.

## Discuss (maintainer 결정 필요)

- 없음. specdown 재작성 범위는 그 슬라이스를 집을 때 spec으로 좁힘.

## 제약

claim-source(spec/AGENTS/scanner 등) 편집 후 `npm run claims:refresh:all`(소스 커밋→refresh→패킷 커밋); `status-summary.json is stale` push 실패 시 필요. 생성 산출물(`.cautilus/audit/surface-audit.json`, `docs/specs/audit.spec.md`)은 손으로 고치지 말고 `npm run audit:surface`로 재생성. 제네릭 lib는 순수 유지(fs/process 금지, repo-specific 로직 금지). 새 런타임 표면엔 executable test + coverage floor. bug/error/regression은 `charness:debug`. critique/fresh-eye·라이브 runtime은 Sonnet 서브에이전트 위임.

## References

- **이번 슬라이스**: spec `charness-artifacts/spec/2026-06-20-surface-audit-assertion-value-floor.md` · evidence `charness-artifacts/findings/2026-06-20-surface-audit-assertion-value-floor.md` · 엔진 `scripts/agent-runtime/surface-audit-lib.mjs`(+`.test.mjs`) · 빌드 `scripts/agent-runtime/build-surface-audit.mjs` · 어댑터 어휘 `scripts/specdown/cautilus-adapter.mjs`.
- **audit 표면**: 페이지 `docs/specs/audit.spec.md` · 레지스트리 `docs/specs/audit/surface-registry.json` · 매니페스트 `.cautilus/audit/surface-audit.json`.
- **선행 슬라이스(improve 언어-robust ①b)**: spec `charness-artifacts/spec/2026-06-20-improve-orientation-summary-language-robustness.md` · evidence `charness-artifacts/eval-trust/2026-06-20-improve-orientation-language-robust-live-confirmed.md`.
- **라이브 proof**: `npm run proof:improve:live` · `proof:skill-orientation:live` · `proof:behavior-eval:live`.
