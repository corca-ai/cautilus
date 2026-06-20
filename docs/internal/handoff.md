# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — dev/skill orientation grader 언어-robust fix가 착지했습니다(intent judge가 summary semantic을 소유, brittle 영어 fragment 제거, lint 가드, 배지 proven 유지). 권장 우선순위로 deferred sibling(improve 표면 orientation summary 언어-brittleness, follow-up improve-orientation-summary-language-robust)을 spec 슬라이스로 — improve 표면엔 judge backstop이 없으니 bilingual interim vs reasoning judge 확장을 먼저 결정할 것(impl 직행 금지, critique 경유). 차순위: audit 잔여(assertion-value) / CI Go-pin 신선도.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).

## Current State

- **orientation grader 언어-robust fix 착지**(커밋 `59113a04` + claim refresh `23eb4129`). no-input orientation summary는 이제 언어-robust reasoning-soundness judge가 semantic 채점(한국어 capture를 이미 `sound`로 blind 채점·녹화·replay). 4개 fixture에서 brittle 영어 `requiredSummaryFragments` 제거; `requiredCommandFragments`(read-only `doctor status` 실행) + `forbidden*Fragments`(no-escalation)는 언어 독립 가드로 유지; `lint:skill-orientation-grader`가 orientation prompt 시그니처 케이스의 재유입을 차단; 라이브 proof 주석을 honest화(라이브 재실행=언어 독립, semantic은 judge 담당). 엔진/captures/verdicts/calibration byte-unchanged, convergence 보존(judge가 control을 fail시키는 유일 게이트 유지). 상세=spec `charness-artifacts/spec/2026-06-20-skill-orientation-grader-language-robustness.md`.
- **결정 닫힘**: grader 방향=intent judge가 semantic 소유(바이링구얼 기각). 배지="Behavior Evaluation — proven" 유지·Proof Debt 불필요(deterministic gate `audit:surface:check` honest=true + fix가 라이브의 유일 실패 차원 제거). 검증=`npm run verify` green(lint·full node+go·coverage floor·security). scoped Sonnet critique 통과: BLOCKER 1건(신규 lint 파일 coverage <80%)을 테스트 추가로 97%로 해소, 나머지 sound.
- **유료 라이브 재실행 실행·PASS**(2026-06-20, Sonnet, $0.47/125s, EXIT 0, `outcome=passed`). fresh 라이브가 언어 독립 게이트로 통과. 단 이 capture는 우연히 영어 요약이라 한국어 경로 재현은 아님 — proven 속성은 게이트의 언어 독립성이고 한국어는 fragment 제거 + judge replay가 담당. 증거: `charness-artifacts/eval-trust/2026-06-20-skill-orientation-grader-language-robust-live-confirmed.md`.
- **미push 커밋 누적**. push는 사용자 몫. tree clean. 릴리즈 불필요(출시 표면 무변경; v0.16.2 published).

## Next: 다음 슬라이스 중 택1

1. **improve-orientation-summary-language-robust (이번 critique가 surface한 deferred sibling).** `fixtures/eval/dev/skill/improve/skill-orientation-improve.fixture.json`가 동일 영어 fragment(`["adapter","claim","branch"]`)를 no-input orientation summary에 가짐. 단 remedy가 다름 — prompt가 orientation 레시피를 의도적으로 숨기는 held-out 게이트이고 그 표면엔 **reasoning judge backstop이 없음** → 제거하면 coverage 0. 그래서 bilingual interim 또는 improve 표면 judge 확장으로 *언어-robust화*가 필요. latent(최근 `proof:improve:live` PASS), Bounded Improvement 기둥 소속. **repeated-symptom 계열이므로 spec 슬라이스 경유·critique 권장, impl 직행 금지.**
2. **Audit 잔여 닫기.** semantic check가 evidence를 *읽는지*만 보므로 assertion-value/intent-judge로 한 단계 더 좁힐지(이전 핸드오프 잔여).
3. **CI Go-version pin 신선도 자동화**(이전 follow-up).

## Discuss (maintainer 결정 필요)

- **improve 표면 orientation grading 방향**: bilingual interim(저비용·결정적이나 언어 enumerate 한계) vs reasoning judge 확장(언어 독립·semantic이나 그 표면엔 아직 calibration/verdict가 없어 더 큰 슬라이스). skill 표면은 judge가 이미 robust 대안이었음 — improve도 같은 길로 갈지, 아니면 held-out 특성상 bilingual로 충분한지.

## 제약

claim-source(spec/AGENTS/contract 등) 편집 후 `npm run claims:refresh:all`(소스 커밋→refresh→패킷 커밋); `status-summary.json is stale` push 실패 시 필요. 제네릭 엔진·런타임에 repo-specific judge 로직 금지. ground truth 제조 금지. 새 런타임 표면엔 executable test + coverage floor 통과(신규 스크립트는 `npm run verify`로 floor 확인). bug/error/regression은 `charness:debug`. critique/fresh-eye·라이브 runtime은 Sonnet 서브에이전트 위임(백그라운드 결과 회수가 글리치하면 포그라운드로 재실행).

## References

- **이번 fix**: spec `charness-artifacts/spec/2026-06-20-skill-orientation-grader-language-robustness.md` · debug `charness-artifacts/debug/2026-06-20-skill-orientation-live-summary-fragment-language.md` · lint `scripts/check-orientation-summary-language-robust.mjs`(+`.test.mjs`) · grader `scripts/agent-runtime/skill-test-expectations.mjs` · judge `scripts/agent-runtime/reasoning-soundness-judge.mjs` + calibration/verdicts `fixtures/eval/dev/skill/reasoning-soundness-calibration.dev-skill-no-input-orientation.json` · convergence contract `docs/contracts/skill-surface-judge-convergence.md`(2026-06-20 forward-pointer).
- **라이브 proof**: `npm run proof:skill-orientation:live`(언어 독립 게이트) · `proof:improve:live` · `proof:behavior-eval:live`.
- **audit**: `docs/specs/audit.spec.md` · `docs/specs/audit/surface-registry.json` · 엔진 `scripts/agent-runtime/surface-audit-lib.mjs`(+`build-surface-audit.mjs`).
