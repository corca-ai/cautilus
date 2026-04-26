# Cautilus Handoff

## Workflow Trigger

다음 세션의 기본 pickup은 `charness:find-skills`로 설치된 스킬 지도를 먼저 재확인한 뒤, [docs/master-plan.md](../master-plan.md)의 `Immediate Next Moves`에서 evidence가 축적된 슬라이스를 고르는 것이다.
첫 행동은 `git status --short`로 live worktree를 확인하는 것이고, 그 다음 이 handoff의 `Next Session` 섹션을 읽는다.
이 handoff는 mention-only pickup 기준 문서이며, handoff adapter는 `docs/internal/handoff.md`를 canonical artifact로 해석한다.

## Current State

- Cautilus `v0.13.0` 게시 상태 그대로 ([release](https://github.com/corca-ai/cautilus/releases/tag/v0.13.0)).
  release-artifacts / verify-public-release / install-sh smoke 모두 green.
  세부 기록은 [charness-artifacts/release/latest.md](../../charness-artifacts/release/latest.md).
- `evaluation-surfaces` 재설계의 네 preset은 모두 shipped 상태다 — [docs/specs/evaluation-surfaces.spec.md](../specs/evaluation-surfaces.spec.md).
  `repo/whole-repo`, `repo/skill`, `app/chat`, `app/prompt` 모두 `cautilus eval test --fixture ...` / `cautilus eval evaluate --input ...` 경로가 있다.
  `app/prompt`는 2026-04-26에 추가됐고 `cautilus.app_prompt_test_cases.v1` / `cautilus.app_prompt_evaluation_inputs.v1` / `cautilus.app_prompt_evaluation_summary.v1`를 쓴다.
  evaluator는 app-surface 공통 runtime 필드(provider, model, harness, mode=`messaging`, durationMs, observed.messages, observed.finalText)에 더해 `app/prompt`에서 `observed.input`을 요구한다.
- 이번 command-surface implementation slice의 closeout verification: `npm run verify`, `npm run hooks:check`, `npm run test:on-demand`, `npm run dogfood:self` green.
  이후 hardcoded claim candidate cap은 제거됐다.
  2026-04-26 후속 구현 기준 `cautilus claim discover --repo-root . --output /tmp/cautilus-claims-self.json`는 adapter/default entries에서 repo-local Markdown links depth 3을 따라가며, `candidateLimit` 없이 `candidateCount=279`, `sourceCount=36`의 source-ref-backed proof plan을 만든다.
  기본 출력은 숨은 product limit으로 잘라내지 않는다.
- `mode evaluate` cut + archetype-boundary retire 슬라이스는 이미 들어왔고, 상세 기록은 이 spec의 follow-up notes와 git history를 본다.
- `dogfood:self` canonical alias가 복원됐고 현재 `dogfood:self:eval`로 위임한다.
  2026-04-26 실행 기준 `repo/whole-repo` checked-in AGENTS routing fixture는 real Codex (`gpt-5.4-mini`, low)에서 `recommendation=accept-now`, `evaluationCounts.passed=1`, `failed=0`, `blocked=0`.
- 제품 프레임은 세 축으로 정리됐다:
  (1) declared behavior claim discovery / proof planning,
  (2) bounded eval verification,
  (3) bounded improvement / optimization.
  README proof는 (1)의 예시일 뿐이며 Cautilus 표면은 README에 강결합하지 않는다.
  세 축은 장기적으로 각각 first-class binary command surface가 있어야 한다.
- 세 핵심 기능의 command-family 설계와 첫 `claim` 구현은 [docs/specs/command-surfaces.spec.md](../specs/command-surfaces.spec.md)에 정착됐다.
  canonical front doors는 `cautilus claim ...`, `cautilus eval ...`, `cautilus optimize ...`이며, `cautilus claim discover --repo-root . --output <claims.json>`는 repo-owned truth surface에서 `cautilus.claim_proof_plan.v1`을 만든다.
  이 packet은 verdict가 아니라 proof plan이며, 발견된 backlog를 정직하게 보존한다.
  selection이나 prioritization이 필요하면 future explicit command option, adapter-owned policy, 또는 다음 agent step으로 드러내야 한다.
- 다음 claim-discovery workflow 설계는 [docs/contracts/claim-discovery-workflow.md](../contracts/claim-discovery-workflow.md)에 있다.
  핵심 결정은 binary가 deterministic skeleton / scan scope / state path / refresh plan / packet semantics를 소유하고, bundled skill이 user confirmation / LLM review / grouping / final evidence interpretation / next-action conversation을 소유한다는 것이다.
  default scan은 entry sources plus repo-local Markdown links depth 3이며, scan confirmation과 LLM review-budget confirmation은 분리한다.
- 2026-04-26 후속 구현으로 bundled skill control-flow slice도 들어왔다.
  no-input invocation은 claim-state availability를 확인하고, prior JSON이 없으면 scan scope를 설명한 뒤 `claim discover`를 쓰며, deterministic scan 뒤 LLM review budget을 별도로 확인하고, prior JSON이 있으면 `claim discover --previous ... --refresh-plan`을 쓴다는 지침이 `skills/cautilus/SKILL.md`와 packaged skill에 반영됐다.
  `repo/skill` self-dogfood fixture에는 `execution-cautilus-no-input-claim-discovery-status` 케이스가 추가됐다.
- 2026-04-26 후속 구현으로 existing-packet helper slice도 들어왔다.
  `claim show --input <claims.json>`는 `cautilus.claim_status_summary.v1`를 만들고, `claim review prepare-input --claims <claims.json>`는 LLM 호출 없이 bounded `cautilus.claim_review_input.v1` cluster packet을 만든다.
  그 다음 `claim review apply-result --claims <claims.json> --review-result <review-result.json>`도 들어왔다.
  `cautilus.claim_review_result.v1`를 적용하되, `evidenceStatus=satisfied`는 direct/verified evidence ref가 claim을 support할 때만 허용한다.
- 2026-04-26 후속 구현으로 reviewed-claim eval planning helper도 들어왔다.
  `claim plan-evals --claims <reviewed-claims.json>`는 reviewed `cautilus-eval` + `ready-to-verify` claims만 골라 `cautilus.claim_eval_plan.v1` intermediate packet을 만든다.
  host-owned fixture, prompt, runner, wrapper, policy는 쓰지 않는다.
- 잔여 신호: `repo/skill` / `app/chat` / `app/prompt` real-codex/claude self-dogfood 증거는 아직 없다.
  `charness-artifacts/cautilus/latest.md` refresh도 별도 artifact-refresh 슬라이스로 남아 있다.
- premortem deferral 상태:
  (a) Result packet surface-agnostic 필드 — `app/chat` / `app/prompt` evaluator에서 require로 명시 정착됨; `repo/whole-repo`/`repo/skill`로 backport는 후속 hardening 슬라이스에서.
  (b) `cautilus eval evaluate` 디스패처는 여전히 schemaVersion만으로 라우팅; fixture preset cross-check는 follow-up.
  (c) Node 측 `scripts/agent-runtime/evaluate-skill.mjs`와 동반 모듈은 self-test와 coverage floor에만 의해 살아있다 — dead-code sweep slice에서 정리.
  (d) optimize-search held-out gating은 honest-skip 상태 — 새 surface 위로 재배선은 별도 슬라이스(아래 Next Session #3 참조).
  (e) consumer onboarding smoke (`npm run consumer:onboard:smoke`)는 2026-04-26에 `doctor ready` 이후 one bounded `eval test`까지 재배선됐다.
  temp consumer repo에 `app/prompt` fixture와 fixture-backend runner를 심고 `eval-summary.json`의 `accept-now`까지 확인한다.
- 마이그레이션 트래킹: [corca-ai/cautilus#32](https://github.com/corca-ai/cautilus/issues/32).

## Next Session

1. `git status --short`로 사용자 변경 여부를 먼저 확인한다.
2. `charness:find-skills`로 설치된 public / support / integration 스킬 지도를 한 번 갱신한다.
3. `cautilus claim discover` 다음 작은 hardening 후보는 `claim validate`류의 packet shape / evidence refs 검증 helper다.
   더 큰 evidence preflight는 false satisfaction 위험이 있으므로, dogfood가 구체적으로 요구할 때 bounded slice로 잡는다.
   public `claim group` 또는 `claim refresh` command는 만들지 않는다.
4. optimize-search held-out/full-gate 신호를 현재 `cautilus eval test` surface 위로 재배선할지, 아니면 C2/C3/C4 composition landing까지 honest-skip으로 둘지 결정한다.
5. spec follow-up #4 — C2/C3/C4 composition primitives (extends / multi-step / snapshot), 슬라이스당 하나.
6. spec follow-up #5 — `scenario normalize` 재범위만 남음.
   archetype-boundary retire는 cut 슬라이스에 흡수됨.
7. `repo/skill` / `app/chat` / `app/prompt` preset 중 어떤 surface에 real-codex/claude self-dogfood evidence를 먼저 붙일지 결정한다.

## Discuss

- runtime fingerprint의 두 번째 슬라이스 (automatic prior-evidence selection, provider API 연동)를 언제 시작할지.
- self-dogfood / consumer onboarding 재배선 슬라이스에서 optimize-search held-out gating까지 같이 풀지, 별도 슬라이스로 분리할지.
- `dogfood:self`는 현재 canonical self-dogfood entry point이고 `dogfood:self:eval`로 위임한다.
  이전 tuning experiments(`dogfood:self:experiments`)에 해당하던 강한 클레임을 새 preset, 새 fixture 시리즈, 또는 폐기 중 어느 쪽으로 정리할지는 아직 결정 필요.
- premortem deferral (a)–(e) 중 어느 것을 다음 hardening 슬라이스로 묶을지.

## References

- [docs/master-plan.md](../master-plan.md)
- [docs/specs/evaluation-surfaces.spec.md](../specs/evaluation-surfaces.spec.md)
- [docs/contracts/runtime-fingerprint-optimization.md](../contracts/runtime-fingerprint-optimization.md)
- [docs/contracts/scenario-history.md](../contracts/scenario-history.md)
- [corca-ai/charness#66](https://github.com/corca-ai/charness/issues/66) — ideation/spec의 enum-axis consistency 점검 제안 (여전히 열려 있음)
