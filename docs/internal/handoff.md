# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행합시다 — surface honesty audit가 착지했으니, 이제 audit를 structural→semantic으로 한 단계 더 단단하게(각 badge의 leaf check 블록이 그 badge의 evidence를 실제로 검증하는지) 또는 남은 라이브 재실행/Go-pin 신선도 중 하나를 골라 진행합시다.`

doc 멘션만으로 픽업하면 이 트리거의 workflow를 실행하세요(파일 재독만 하지 말 것).
지난 합의 시퀀스(**전 표면 정직성 audit + specdown 재설계**)는 이번 세션에 착지 완료. 아래 "Next"에서 다음 슬라이스를 고르세요.

## This Session — Surface Honesty Audit 착지 (2026-06-20, 미push)

- **specdown을 audit 표면으로 재설계 완료.** apex(`docs/specs/index.spec.md`)가 specdown entry인데 badge 단어(proven/declared/promised)가 **bound 안 된 prose**였음 — 배지가 근거 없이 "proven"으로 drift해도 specdown green. 이제 배지가 load-bearing.
  - apex가 badge **level**만 선언, 새 registry(`docs/specs/audit/surface-registry.json`)는 proof **route**만 선언(level 미포함). generator가 reality 검사(leaf에 `> check:` 블록 있나? evidence 파일 존재?)로 **observed level 재계산**, `consistent = claimed===observed`.
  - apex에 load-bearing check 블록 추가 → 배지가 over-claim하거나 apex↔registry 불일치 시 **specdown FAIL**. 네비게이션용 `docs/specs/audit.spec.md` 생성(배지→proof route→class→freshness 맵).
  - legend가 proven-deterministic(매 gate 실행) vs proven-live-replayed(capture replay; live 재실행 opt-in) 구분.
  - **gap 3 수정:** `lint:specs`(=specdown)가 standing `verify`에서 주석 처리돼 있었음("specdown rewrite 중"). 복원 + `audit:surface:check`를 verify·lint·pre-push에 추가 → binding이 standing gate에서 실제로 강제됨.
- **정직성 audit 결과:** deterministic layer green(`lint:specs` 43 specs, `test:on-demand` exit 0). audit = 7 badge(**4 proven / 2 declared / 1 promised**), 전부 consistent, `honest=true`. 라이브 재실행은 사용자 결정으로 **deterministic replay로 충분**(추가 agent 비용 없음); 라이브 재확인은 per-badge `Freshness` 명령으로 opt-in.
- **명령:** `npm run audit:surface`(빌드) · `npm run audit:surface:check`(drift+honesty gate). lib `scripts/agent-runtime/surface-audit-lib.mjs`(+test 15개), CLI `build-surface-audit.mjs`. manifest `.cautilus/audit/surface-audit.json`.
- **fresh-eye critique(Sonnet 서브에이전트): READY-WITH-EDITS, 4건 전부 fold.** fence-aware 파싱(코드펜스 안 예시 `> check:`/`### — proven` 미카운트)+회귀 테스트, structural-not-semantic 한계를 audit 페이지·registry에 명시.
- **검증:** `npm run verify` 전 phase 통과(2회, 최종 green) · `audit:surface:check`·`generated:drift:check`·`hooks:check` clean · git clean.
- **커밋(미push):** `f1b4fc4b`(audit 슬라이스), `b1eea399`(claim refresh — audit.spec.md가 새 claim source, source 71→72/candidate 396→398).

## Current State

- **apex 4 badge = honest-proven으로 bound됨.** Readiness·Claim Discovery(deterministic), Behavior Evaluation·Bounded Improvement(live-replayed). Reviewable Artifacts·Host Ownership=declared(projected-bundle), A Testable Agent=promised(none). 모두 audit consistent.
- **릴리즈 불필요:** 이번 세션은 docs/specs + JS(scripts) + package.json만 변경. 출시 표면(`internal/runtime/*.go`, `skills/cautilus-agent/`)·번들 Agent 무변경. v0.16.2가 현재 published HEAD.

## Next: 다음 슬라이스 중 택1

1. **Audit를 structural→semantic으로 강화(critique가 짚은 핵심 한계).** 현재 audit는 "leaf에 check 블록이 존재"만 확인하지, 그 check가 **이 badge의 behavior/evidence를 실제로 검증**하는지는 미확인 + registry가 proofSpec를 엉뚱한 spec으로 redirect해도 통과. 다음 단계: registry route의 evidence 파일이 해당 leaf spec의 check 블록에서 실제 참조되는지 교차검증(generator가 leaf check 테이블의 path를 파싱해 registry evidence와 매칭). 이러면 redirect/공허한 check 공격이 닫힘.
2. **라이브 2배지 실제 재실행(이번엔 deferred).** `npm run proof:behavior-eval:live`·`proof:skill-orientation:live`·`proof:improve:live`를 Sonnet 서브에이전트로 돌려 end-to-end 정직성 재확인(real agent 비용).
3. **CI Go-version pin 신선도 자동화**(이전 핸드오프 follow-up; renovate/dependabot 또는 verify step).

## 제약

push는 사용자 몫(보류; 미push 커밋 2개). claim-source(spec/AGENTS 등) 편집 후 `npm run claims:refresh:all`(소스 커밋→refresh→패킷 커밋); `status-summary.json is stale` push 실패 시 필요. apex가 claim source이고 audit.spec.md도 이제 scan 범위. 제네릭 엔진·런타임에 repo-specific judge 로직 금지. ground truth 제조 금지. 새 런타임 표면엔 executable test. bug/error/regression은 `charness:debug`. critique/fresh-eye·라이브 runtime은 서브에이전트(Sonnet) 위임.

## References

- **audit 표면**: `docs/specs/audit.spec.md`(네비) · `docs/specs/audit/surface-registry.json`(route SOT) · `.cautilus/audit/surface-audit.json`(manifest) · `docs/specs/index.spec.md`(배지 선언 + Honesty Audit check 블록).
- **엔진**: `scripts/agent-runtime/surface-audit-lib.mjs`(+`surface-audit-lib.test.mjs`) · `build-surface-audit.mjs`. gate 배선: `scripts/run-verify.mjs` PHASES, `package.json` lint 체인, `scripts/check-generated-artifact-drift.mjs`.
- **배지 SOT/proof**: `docs/specs/index.spec.md` · `docs/specs/user/*.spec.md`. 라이브 proof: `npm run proof:improve:live`·`proof:behavior-eval:live`·`proof:skill-orientation:live`.
- **선행 배지 증거**: `charness-artifacts/eval-trust/2026-06-20-bounded-improvement-badge-proven.md` · `2026-06-19-behavior-eval-badge-proven.md`.
