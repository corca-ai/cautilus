# Cautilus Handoff

## Workflow Trigger

다음 세션의 기본 pickup은 `charness:find-skills`로 설치된 스킬 지도를 먼저 재확인한 뒤, [docs/master-plan.md](../master-plan.md)의 `Immediate Next Moves`에서 evidence가 축적된 슬라이스를 고르는 것이다.
첫 행동은 `git status --short`로 live worktree를 확인하는 것이고, 그 다음 이 handoff의 `Next Session` 섹션을 읽는다.
이 handoff는 mention-only pickup 기준 문서이며, handoff adapter는 `docs/internal/handoff.md`를 canonical artifact로 해석한다.

## Current State

- Cautilus `v0.13.0`이 게시됐다 ([release](https://github.com/corca-ai/cautilus/releases/tag/v0.13.0)).
  release-artifacts / verify-public-release / install-sh smoke 모두 green.
  세부 기록은 [charness-artifacts/release/latest.md](../../charness-artifacts/release/latest.md).
- `evaluation-surfaces` 재설계의 세 번째 슬라이스 `app/chat` preset의 **additive 절반**이 들어왔다 — [docs/specs/evaluation-surfaces.spec.md](../specs/evaluation-surfaces.spec.md).
  - `cautilus.evaluation_input.v1`이 `surface=app, preset=chat`을 받아 새 `cautilus.app_chat_test_cases.v1` 케이스 슈트로 번역한다.
  - `cautilus eval test`는 `eval_test_command_templates`를 통해 messaging-runtime 러너를 호출하고 (fixture-backend smoke로 wiring 증명), 결과를 `cautilus.app_chat_evaluation_inputs.v1`로 emit한다.
  - `cautilus eval evaluate`는 입력 packet의 schemaVersion으로 `BuildAppChatEvaluationSummary`까지 dispatch하며 cross-runtime equivalence 필드(provider, model, harness, mode=`messaging`, durationMs, observed.messages, observed.finalText)를 evaluator 경계에서 강제한다.
  - 새 fixture: `fixtures/eval/app/chat/cautilus-onboarding-greeting.fixture.json`.
  - 추가된 schema: `cautilus.app_chat_test_cases.v1`, `cautilus.app_chat_evaluation_inputs.v1`, `cautilus.app_chat_evaluation_summary.v1`.
- 같은 슬라이스의 **subtractive 절반(=`cautilus mode evaluate` 컷)**은 본 세션에서 지연됐다.
  이유: `internal/runtime/optimize_search.go:1248`의 `optimizeSearchRunFullGateCheckpoint`가 `exec.Command`로 `cautilus mode evaluate --mode full_gate`를 호출한다.
  `mode evaluate`를 즉시 자르면 6개 `TestCLIOptimizeSearchRun*` smoke 테스트가 mutation selection 단계에서 seed로 collapse된다.
  컷을 정직하게 하려면 (1) full_gate checkpoint를 `cautilus eval test`(repo/whole-repo) 위로 다시 배선하거나 (2) `surface_unavailable` reason으로 명시 skip하도록 바꾸고 의존 테스트를 갱신해야 한다.
  컷 범위는 다 매핑돼 있다(아래 Next Session 참조) — 본 세션은 additive만 ship하고, 컷은 follow-up 서브슬라이스로 분리한다.
- 결과적으로 현재 코드는 `cautilus mode evaluate` (legacy)와 `cautilus eval test --fixture <app/chat fixture>` (신규)가 공존한다 — `app/chat` 경로가 supported path이다.
- 잔여 신호: `app/chat`도 `repo/skill`처럼 real-codex/claude self-dogfood 증거는 아직 없다.
  `charness-artifacts/cautilus/latest.md` refresh도 컷 슬라이스 후로 미룬다.
- premortem deferral 상태:
  (a) Result packet surface-agnostic 필드 — `app/chat` evaluator에서 require로 명시 정착됨; `repo/whole-repo`/`repo/skill`로 backport는 후속 hardening 슬라이스에서.
  (b) `cautilus eval evaluate` 디스패처는 여전히 schemaVersion만으로 라우팅; fixture preset cross-check는 follow-up.
  (c) Node 측 `scripts/agent-runtime/evaluate-skill.mjs`와 동반 모듈은 self-test와 coverage floor에만 의해 살아있다 — dead-code sweep slice에서 정리.
- 잔여 신호 (`repo/whole-repo` 이전 슬라이스): 현재 fixture는 `expectedRouting: { selectedSkill: "none" }`을 기대하지만 real-codex로 cautilus 실제 AGENTS.md를 돌리면 `reject`가 난다.
  fixture 기대치 vs. 실제 AGENTS.md routing 사이 정직성 결정 필요.
- 마이그레이션 트래킹: [corca-ai/cautilus#32](https://github.com/corca-ai/cautilus/issues/32).

## Next Session

1. `git status --short`로 사용자 변경 여부를 먼저 확인한다.
2. `charness:find-skills`로 설치된 public / support / integration 스킬 지도를 한 번 갱신한다.
3. **`mode evaluate` cut 서브슬라이스** — spec follow-up 2번의 후반부.
   먼저 결정: `optimizeSearchRunFullGateCheckpoint`를 (a) `cautilus eval test` 위로 다시 배선할지 (b) `surface_unavailable`로 honest-skip하고 의존 테스트를 갱신할지.
   premortem 권고는 (b) — 컷 슬라이스는 작게 가져가고 full_gate checkpoint 재배선은 별도 슬라이스로.
   결정 후 cut 범위(매핑됨):
   - `internal/app/{app.go, remaining_commands.go, examples.go, app_test.go, cli_smoke_test.go}` — `mode evaluate` router/handler/parser/args, mode-evaluate 전용 helpers (commandDescriptors, classifyScenarioBuckets, defaultSplitByMode, comparisonRejected, resolveModeStatus, modeSummaryText, modeRecommendation, cloneJSONObject, resolveBaselineFingerprint, baselineRepoLabel), 6개 `TestCLIModeEvaluate*` 및 chatbot/workflow scaffold 테스트, doctor 테스트의 `iterate_command_templates:` 시드.
   - `internal/runtime/{adapter.go, adapter_test.go, scenarios.go, optimize_search.go}` — `iterate / held_out / comparison / full_gate` *_command_templates 및 *_samples_default adapter slots, `applyScenarioOverlay` chatbot/workflow 분기, `numericDefaults`, `DoctorRepo` execution_surface 체크, `adapterLooksDeterministicOnly`, scaffold 테스트, `LoadFirstBoundedRunGuide`의 mode evaluate 명령, `optimizeSearchRunFullGateCheckpoint` 결정에 따라 처리.
   - `internal/contracts/constants.go` — `AdapterModeEvaluationPacketSchema` 제거.
   - `internal/cli/command-registry.json` — mode evaluate 항목.
   - Node 측: `scripts/agent-runtime/{evaluate-adapter-mode.mjs, evaluate-adapter-mode.test.mjs, mode-evaluation-summary.mjs, mode-evaluation-summary.test.mjs}` 삭제, `contract-versions.mjs`에서 `ADAPTER_MODE_EVALUATION_PACKET_SCHEMA` 제거, `init_adapter.mjs`의 sample/template defaults, `run-self-dogfood-experiments.mjs:396`의 mode evaluate 호출, `on-demand/smoke-external-consumer.mjs`의 `held_out_command_templates` 시드, `bin/cautilus.test.mjs:40`의 어서션.
   - Docs: `README.md`, `docs/master-plan.md`, `docs/cli-reference.md`, `docs/contracts/{scenario-history.md, scenario-results.md, active-run.md, reporting.md, adapter-contract.md}`, `docs/guides/consumer-adoption.md`, 그리고 `examples/starters/{chatbot,workflow}/cautilus-adapter.yaml`, `examples/adapter.example.yaml`, `skills/cautilus/SKILL.md`와 references, `plugins/cautilus/skills/cautilus/...` 미러.
4. cut 슬라이스 종료 후 self-dogfood real-codex/claude evidence 수집과 `charness-artifacts/cautilus/latest.md` refresh 시점을 결정한다.
5. 다음 spec follow-up은 #3 `app / prompt` preset.

## Discuss

- runtime fingerprint의 두 번째 슬라이스 (automatic prior-evidence selection, provider API 연동)를 언제 시작할지.
- ~~`app / chat` preset 진입 시점에 `mode evaluate` chatbot 모드를 동시에 cut할지, 단독 슬라이스로 분리할지.~~ optimize-search full_gate checkpoint 결합 때문에 분리됨; cut은 follow-up 서브슬라이스.
- `optimizeSearchRunFullGateCheckpoint`를 새 surface 위로 재배선할지, honest-skip으로 둘지 — cut 슬라이스 진입 시 결정.
- `archetype-boundary.spec.md` retire는 spec follow-up 5번. 모든 preset 출시 후 한 번에 정리할지, 더 빨리 끊을지.
- 잔여 신호의 fixture vs. AGENTS.md 정직성 결정 — `app / chat` 또는 cut 슬라이스 작업 중 자연스럽게 닿을 수 있음.
- `repo/skill` 및 `app/chat` 슬라이스에 대한 self-dogfood real-codex/claude 증거 수집 시점.

## References

- [docs/master-plan.md](../master-plan.md)
- [docs/specs/evaluation-surfaces.spec.md](../specs/evaluation-surfaces.spec.md)
- [docs/contracts/runtime-fingerprint-optimization.md](../contracts/runtime-fingerprint-optimization.md)
- [docs/contracts/scenario-history.md](../contracts/scenario-history.md)
- [corca-ai/charness#66](https://github.com/corca-ai/charness/issues/66) — ideation/spec의 enum-axis consistency 점검 제안 (여전히 열려 있음)
