# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — audit는 semantic-bound로 착지했고, 라이브 재실행에서 dev/skill orientation grader가 언어-brittle(Korean 출력 vs 영어 fragment matcher)임이 드러났습니다. 권장 우선순위로 spec handoff(charness-artifacts/spec/2026-06-20-skill-orientation-grader-language-robustness.md)대로 grader 방향 + 배지 문구를 결정·진행(repeated-symptom 계약상 critique 필수, impl 직행 금지). 차순위: 남은 Go-pin 신선도.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).

## Current State

- **Item 1 (audit structural→semantic) 착지.** registry route의 evidence 파일이 그 proofSpec의 `cautilus-json-file` check에서 실제 참조돼야 observed=proven; 아니면 unproven→`honest=false`→specdown FAIL. redirect/hollow 공격 닫힘(behavior-eval proofSpec를 무관 spec으로 redirect 시 실제 FAIL 확인 후 revert). 5개 evidence 배지 전부 100% 참조 → `honest=true` 유지. 잔여: check가 evidence를 *읽는지*만 보지 assertion 강도는 미검, Readiness는 title-bound. 상세=커밋 `c3e5d1f4` + `docs/specs/audit.spec.md`.
- **Item 2 (라이브 3 proof 재실행) 완료.** behavior-eval·improve = fresh PASS(live-true 재확인). **skill-orientation = FAIL이지만 behavior가 아니라 grader가 brittle**: agent가 doctor status로 정확히 orient·정지했으나 CLAUDE.md Korean 규칙대로 한국어 요약(`어댑터`/`다음 분기`)을 했는데 case의 `requiredSummaryFragments`가 영어 literal이라 미스. 같은 case 2026-06-19 인시던트의 repeated-symptom. 근본원인=커밋 `5e3e4f51` + debug `charness-artifacts/debug/2026-06-20-skill-orientation-live-summary-fragment-language.md`.
- **미push 커밋 8개**(이전 4 + 이번 4: audit `c3e5d1f4`·claim refresh `2e73b631`·debug `5e3e4f51`·이 handoff 커밋). push는 사용자 몫. tree clean. 릴리즈 불필요(출시 표면 무변경; v0.16.2 published).

## Next: 다음 슬라이스 중 택1

1. **dev/skill orientation grader 언어-robust화(이번 finding의 fix slice).** spec handoff(`charness-artifacts/spec/2026-06-20-skill-orientation-grader-language-robustness.md`)대로 grader를 packet/action-log assert 또는 blind intent judge로(언어 독립), interim으로 4개 fixture `requiredSummaryFragments` bilingual + single-language lint(follow-up: skill-orientation-summary-language-robust-grader). **repeated-symptom 계약상 `impl` 직행 금지 — spec slice 경유, fix slice에 scoped critique 필수.**
2. **Audit 잔여 닫기.** semantic check가 evidence를 읽는지만 보므로, assertion-value/intent-judge로 한 단계 더 좁힐지.
3. **CI Go-version pin 신선도 자동화**(이전 핸드오프 follow-up).

## Discuss (maintainer 결정 필요)

- **배지 문구:** dev/skill 라이브 re-run이 fresh로 실패(behavior sound, grader brittle). audit는 deterministic replay+always-sound-judge-fails 게이트로 `honest=true` 유지 중 — "Behavior Evaluation — proven" 문구를 약화/Proof Debt 추가할지, 현 게이트로 충분한지.
- **grader 방향:** packet/action-log assert vs intent judge vs bilingual fragment(권장: 앞 둘 + bilingual 임시 가드).

## 제약

claim-source(spec/AGENTS 등) 편집 후 `npm run claims:refresh:all`(소스 커밋→refresh→패킷 커밋); `status-summary.json is stale` push 실패 시 필요. 제네릭 엔진·런타임에 repo-specific judge 로직 금지. ground truth 제조 금지. 새 런타임 표면엔 executable test. bug/error/regression은 `charness:debug`. critique/fresh-eye·라이브 runtime은 Sonnet 서브에이전트 위임.

## References

- **audit**: `docs/specs/audit.spec.md`(네비) · `docs/specs/audit/surface-registry.json`(route SOT) · `docs/specs/index.spec.md`(배지 선언+check 블록) · 엔진 `scripts/agent-runtime/surface-audit-lib.mjs`(+`surface-audit-lib.test.mjs`)·`build-surface-audit.mjs`.
- **이번 finding**: debug `charness-artifacts/debug/2026-06-20-skill-orientation-live-summary-fragment-language.md` · spec `charness-artifacts/spec/2026-06-20-skill-orientation-grader-language-robustness.md` · 채점 대상 `fixtures/eval/dev/skill/live/skill-orientation-live-cases.json` · grader `scripts/agent-runtime/skill-test-expectations.mjs`.
- **라이브 proof**: `npm run proof:improve:live`·`proof:behavior-eval:live`·`proof:skill-orientation:live`. 선행 배지 증거: `charness-artifacts/eval-trust/2026-06-20-bounded-improvement-badge-proven.md`·`2026-06-19-behavior-eval-badge-proven.md`.
