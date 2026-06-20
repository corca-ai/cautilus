# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — improve held-out orientation 언어-robust fix(①b)가 착지했습니다(브리틀 영어 requiredSummaryFragments 제거, seed-FAIL은 언어-독립 forbidden command 가드가 담당[캡처 증명], lint 가드를 held-out 케이스로 확장, proof:improve:live 라이브 재증명 PASS=seed 0/candidate 100). 권장 우선순위로 audit 잔여(assertion-value/intent-judge tightening) 또는 CI Go-pin 신선도를 spec 슬라이스로. ①a(improve replay-parity judge 수렴)는 deferred/optional로 강등됨 — judge가 live improve 루프에서 구조적으로 못 돌아서(replay 전용, enricher fail-closed) 한계 가치가 '고정 캡처 1개의 replay 패리티'이고 그 행동은 skill 표면 judge가 이미 증명함. strict per-surface 패리티를 원할 때만 집을 것. 어느 쪽이든 impl 직행 금지·critique 경유.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).

## Current State

- **improve held-out orientation 언어-robust fix(①b) 착지.** 커밋: spec `ee0953ef`, deterministic(fixture+guard+test) `0fcde8af`, 라이브 캡처 `f2ea1b50`(+ 이 핸드오프/evidence/claims 커밋). `fixtures/eval/dev/skill/improve/skill-orientation-improve.fixture.json`에서 영어 `requiredSummaryFragments: ["adapter","claim","branch"]` 제거 — 한국어 복구 후보("분기"≠"branch")를 브리틀 fail시켜 proof:improve:live candidate-recover invariant를 깰 수 있던 잠복 버그. seed-FAIL은 언어-독립 forbidden command 가드(`--next-action`)가 담당(리프레시 캡처가 summary-fragment 실패 없이 command 가드만으로 seed fail 증명). lint 가드(`check-orientation-summary-language-robust.mjs`)에 `HELD_OUT_ORIENTATION_PROMPT_SIGNATURE` 추가 — held-out 프롬프트는 explicit orientation 시그니처를 구조적으로 못 담으므로 별도 detector로 재유입 차단. 상세=spec.
- **결정 닫힘**: 방향=reasoning judge(바이링구얼 기각); 크기=①b 지금 + ①a defer. 근거=judge가 live improve 루프에서 못 돎(`enrich-eval-with-reasoning-judge.mjs:85` fail-closed). backend-asymmetry는 이미 해소됨(`skill-test-claude-backend.mjs:188`가 matcher 적용).
- **라이브 PASS**(2026-06-20, Sonnet 위임, EXIT 0): seed held-out 0, winning candidate `g1-1-codex-exec` 100, mutation 1/candidate 2. `npm run verify`(전 phase, coverage floor OK) + `test:on-demand` + 결정적 replay(7/7) green. scoped Sonnet spec critique=READY-WITH-EDITS(blocker 0; 두 edit fold, backend-asymmetry/enricher fail-closed를 코드로 검증).
- **배지 `Bounded Improvement` proven 유지**(언어-robust화), 배지 flip·Proof Debt 변화 없음. **미push 커밋 누적**(push는 사용자 몫). tree clean. 릴리즈 불필요(출시 표면 무변경).

## Next: 다음 슬라이스 중 택1

1. **Audit 잔여 닫기.** semantic check가 evidence를 *읽는지*만 보므로 assertion-value/intent-judge로 한 단계 더 좁힐지(이전 핸드오프 잔여).
2. **CI Go-version pin 신선도 자동화**(이전 follow-up).
3. **①a improve replay-parity judge 수렴(deferred/optional).** co-located calibration `dev-skill-improve-orientation` + surface-clean control + blind verdicts + `self-dogfood-improve-judge-eval` 어댑터 + registry 스캔을 `dev/skill/improve`로 확장 + on-demand dogfood. **단 marginal 가치 낮음**(judge가 live 루프에서 못 돌아 고정 캡처 replay 패리티일 뿐; skill 표면이 이미 그 행동을 judge로 증명). strict per-surface 패리티를 원할 때만.

> 더 큰 frontier(Behavior Eval **app 표면** liveness/product-runner, Reviewable Artifacts·Host Ownership **declared→proven**, A Testable Agent **promised→스펙**)는 apex **Proof Debt**(`docs/specs/index.spec.md`)가 durable하게 소유 — 위 단기 슬라이스와 별개의 더 긴 트랙. handoff는 ledger를 복제하지 않고 거기를 가리킴.

## Discuss (maintainer 결정 필요)

- 없음(이번 방향·크기 결정 닫힘). ①a를 집을지는 strict per-surface 패리티 가치 판단에 달림 — 필요하면 spec 슬라이스로.

## 제약

claim-source(spec/AGENTS/contract 등) 편집 후 `npm run claims:refresh:all`(소스 커밋→refresh→패킷 커밋); `status-summary.json is stale` push 실패 시 필요. 제네릭 엔진·런타임에 repo-specific judge 로직 금지. ground truth 제조 금지(라이브 캡처는 진짜 실행, degraded seed만 구성 control). 새 런타임 표면엔 executable test + coverage floor(신규 스크립트는 `npm run verify`). bug/error/regression은 `charness:debug`. critique/fresh-eye·라이브 runtime은 Sonnet 서브에이전트 위임(백그라운드 회수 글리치 시 포그라운드 재실행).

## References

- **이번 fix**: spec `charness-artifacts/spec/2026-06-20-improve-orientation-summary-language-robustness.md` · evidence `charness-artifacts/eval-trust/2026-06-20-improve-orientation-language-robust-live-confirmed.md` · lint `scripts/check-orientation-summary-language-robust.mjs`(+`.test.mjs`) · 캡처 `fixtures/eval/dev/skill/improve/live/` · 라이브 하니스 `scripts/on-demand/improve-live-proof.mjs`(+`.test.mjs`).
- **선행 디버그**: `charness-artifacts/debug/2026-06-20-improve-live-case-prompt-spoonfeeds-orientation.md`(held-out 무결성·매처 brittleness 라운드).
- **라이브 proof**: `npm run proof:improve:live` · `proof:skill-orientation:live` · `proof:behavior-eval:live`.
- **자매 fix(skill 표면)**: spec `charness-artifacts/spec/2026-06-20-skill-orientation-grader-language-robustness.md` · 수렴 계약 `docs/contracts/skill-surface-judge-convergence.md`.
- **audit**: `docs/specs/audit.spec.md` · 엔진 `scripts/agent-runtime/surface-audit-lib.mjs`.
