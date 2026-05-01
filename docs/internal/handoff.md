# Cautilus Handoff

## Workflow Trigger

다음 세션의 기본 pickup은 `charness:find-skills`로 설치된 스킬 지도를 먼저 재확인한 뒤, [docs/master-plan.md](../master-plan.md)의 `Immediate Next Moves`에서 evidence가 축적된 슬라이스를 고르는 것이다.
첫 행동은 `git status --short`로 live worktree를 확인하는 것이고, 그 다음 이 handoff의 `Next Session` 섹션을 읽는다.
이 handoff는 mention-only pickup 기준 문서이며, handoff adapter는 `docs/internal/handoff.md`를 canonical artifact로 해석한다.

## Current State

- 2026-05-01 후속 구현으로 commit hash는 freshness 판정의 단독 기준이 아니라 provenance가 됐다.
  Claim packet freshness는 recorded source path/content hash를 현재 checkout과 비교하고, runner assessment freshness는 adapter hash와 listed runner file hashes를 비교한다.
  그래서 generated artifact commit이나 source+claim packet atomic commit 뒤에도 source content가 packet과 일치하면 `fresh-with-head-drift`, `isStale=false`로 review/eval planning이 계속 가능하다.
  Symlinked claim source는 `sourceInventory[].contentPath`로 target path를 같이 기록해 target edit stale miss를 막는다.
  관련 커밋은 `368e30a`, `4c59a79`, `f34ccf8`, `c7c88b8`.
- 2026-05-01 live backend eval 기준 dev/repo self-dogfood runner는 실제 Codex backend proof를 갖는다.
  `/tmp/cautilus-dev-repo-codex-eval-v4/eval-summary.json`는 `recommendation=accept-now`, `proof.proofClass=coding-agent-messaging`, `runnerAssessmentState=assessed`였다.
  `/tmp/cautilus-dev-repo-codex-eval-v4/eval-observed.json`에는 `telemetry.runtime=codex_exec`가 기록됐다.
  이제 dev proof promotion은 selected runtime name만 믿지 않고 observed telemetry runtime을 요구한다.
- 2026-05-01 claim state는 `.cautilus/claims/latest.json` 기준 `candidateCount=327`이다.
  `agent-reviewed=13`, `heuristic=314`인 reviewed packet은 `.cautilus/claims/reviewed-typed-runners.json`에 있다.
  `.cautilus/claims/evidenced-typed-runners.json`는 `claim-readme-md-144`, `claim-readme-md-148`, `claim-readme-md-211`을 `evidenceStatus=satisfied`로 올린다.
  Evidence bundles are `.cautilus/claims/evidence-dev-skill-dogfood.json` and `.cautilus/claims/evidence-dev-skill-routing-install.json`.
  `.cautilus/claims/eval-plan-evidenced-typed-runners.json`는 `selectionPolicy.excludesEvidenceStatus=["satisfied"]`를 기록하고, satisfied claims를 `already-satisfied`로 skip하며, 남은 1개 `dev/skill` eval target, `claim-readme-md-3`, 를 드러낸다.
- 2026-05-01 후속 dogfood로 `npm run dogfood:cautilus-review-to-eval-flow:eval:codex`를 다시 실행했다.
  결과는 `recommendation=accept-now`, `passed=1`, `failed=0`이고 artifact는 `artifacts/self-dogfood/cautilus-review-to-eval-flow-eval-codex/latest/eval-summary.json`이다.
  기존 first-scan / refresh-flow / review-prepare / reviewer-launch Codex dogfood summaries and audit packets도 모두 accept/pass 상태라, 이 다섯 run을 묶은 evidence bundle로 `claim-readme-md-148`은 satisfied 상태가 됐다.
- 2026-05-01 후속 dogfood로 `./bin/cautilus eval test --repo-root . --adapter-name self-dogfood-eval-skill --runtime codex --output-dir ./artifacts/self-dogfood/eval-skill-codex/latest`를 실행했다.
  결과는 `recommendation=accept-now`, `passed=3`, `failed=0`, trigger case 1개와 execution case 2개다.
  이 run과 install/doctor preflight, installed skill/plugin manifest content hashes를 묶은 evidence bundle로 `claim-readme-md-144`와 `claim-readme-md-211`은 satisfied 상태가 됐다.
  단, `claim-readme-md-211`의 evidence boundary는 Claude/Codex manifest presence와 Codex conversational runtime proof를 만족시키는 것이며, Claude conversational runtime parity는 explicitly not claimed다.
  `claim-readme-md-3`은 더 넓은 positioning claim이라 아직 unknown으로 남겼다.
- 2026-05-01 Cautilus dogfood 중 Charness follow-up 두 개를 열었다.
  [corca-ai/charness#87](https://github.com/corca-ai/charness/issues/87)는 delegated premortem reviewer가 nested subagent capability check를 다시 수행해 blocked로 끝나는 문제다.
  [corca-ai/charness#88](https://github.com/corca-ai/charness/issues/88)는 `debug` scaffold가 consumer repo에 없는 `scripts/validate_debug_artifact.py` 경로를 안내하는 문제다.
- Cautilus `v0.13.0` 게시 상태 그대로 ([release](https://github.com/corca-ai/cautilus/releases/tag/v0.13.0)).
  release-artifacts / verify-public-release / install-sh smoke 모두 green.
  세부 기록은 [charness-artifacts/release/latest.md](../../charness-artifacts/release/latest.md).
- `evaluation-surfaces` 재설계의 네 preset은 모두 shipped 상태다 — [docs/specs/evaluation-surfaces.spec.md](../specs/evaluation-surfaces.spec.md).
  `dev/repo`, `dev/skill`, `app/chat`, `app/prompt` 모두 `cautilus eval test --fixture ...` / `cautilus eval evaluate --input ...` 경로가 있다.
  `app/prompt`는 2026-04-26에 추가됐고 `cautilus.app_prompt_test_cases.v1` / `cautilus.app_prompt_evaluation_inputs.v1` / `cautilus.app_prompt_evaluation_summary.v1`를 쓴다.
  evaluator는 app-surface 공통 runtime 필드(provider, model, harness, mode=`messaging`, durationMs, observed.messages, observed.finalText)에 더해 `app/prompt`에서 `observed.input`을 요구한다.
- 이번 command-surface implementation slice의 closeout verification: `npm run verify`, `npm run hooks:check`, `npm run test:on-demand`, `npm run dogfood:self` green.
  이후 hardcoded claim candidate cap은 제거됐다.
  2026-04-26 후속 구현 기준 `cautilus claim discover --repo-root . --output /tmp/cautilus-claims-self.json`는 adapter/default entries에서 repo-local Markdown links depth 3을 따라가며, `candidateLimit` 없이 `candidateCount=283`의 source-ref-backed proof plan을 만든다.
  기본 출력은 숨은 product limit으로 잘라내지 않는다.
- `mode evaluate` cut + archetype-boundary retire 슬라이스는 이미 들어왔고, 상세 기록은 이 spec의 follow-up notes와 git history를 본다.
- `dogfood:self` canonical alias가 복원됐고 현재 `dogfood:self:eval`로 위임한다.
  2026-04-26 실행 기준 `dev/repo` checked-in AGENTS routing fixture는 real Codex (`gpt-5.4-mini`, low)에서 `recommendation=accept-now`, `evaluationCounts.passed=1`, `failed=0`, `blocked=0`.
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
  `dev/skill` self-dogfood fixture에는 `execution-cautilus-no-input-claim-discovery-status` 케이스가 추가됐다.
  2026-04-26에 product repo 자체의 `.agents/skills/cautilus`와 `.claude/skills -> ../.agents/skills`도 materialize했다.
  `./bin/cautilus doctor --repo-root . --scope agent-surface`는 `ready=true`.
  새 `codex exec` no-input dogfood는 `$cautilus` 경로에서 `./bin/cautilus`를 사용했고, `.cautilus/claims/latest.json` 부재를 감지한 뒤 `/tmp/cautilus-claims-discovery-status.json`와 `/tmp/cautilus-claim-status-summary.json`만 생성했다.
  LLM review는 별도 review budget이 없어서 실행하지 않았다.
  사전 실패 방지로 bundled skill은 Cautilus product repo에서 `cautilus` PATH binary보다 `./bin/cautilus`를 우선하도록 바뀌었다.
  이유: 이 host의 PATH `cautilus`는 v0.12.1로 claim command family가 없었고, checkout `./bin/cautilus`는 v0.13.0로 claim command family가 있었다.
- 2026-04-26 no-input `$cautilus` 경로는 다시 조여졌다.
  최초 실행은 binary / command registry / agent surface / adapter bootstrap까지 허용하고, 그 다음 claim-state/status와 next branch만 요약한다.
  default `doctor`가 ready라고 해서 `eval test`, quality review, code edit, commit으로 넘어가지 않도록 `skills/cautilus/SKILL.md`, packaged skill, `.agents/skills/cautilus/SKILL.md`, dev/skill fixture expectation에 반영했다.
  실제 `codex_exec` read-only 단독 no-input 검증은 `/tmp/cautilus-no-input-live/observed.json` 기준 `outcome=passed`였고, 금지된 eval/quality/test/commit command expectation을 통과했다.
  source checkout launcher `bin/cautilus`는 read-only agent sandbox에서 `go run`/`cgo`가 깨지지 않도록 external scratch root(`/dev/shm/cautilus-go` 우선, `/tmp/cautilus-go` fallback, `CAUTILUS_GO_TMP_ROOT` override)를 쓰도록 바뀌었다.
  관련 debug record는 [charness-artifacts/debug/debug-2026-04-26-source-shim-read-only-go-cache.md](../../charness-artifacts/debug/debug-2026-04-26-source-shim-read-only-go-cache.md).
- 2026-04-27 후속 구현으로 no-input 경로는 `cautilus agent status --repo-root . --json`를 canonical orientation packet으로 읽는다.
  이 command는 `cautilus.agent_status.v1`를 내보내며 binary health, agent-surface readiness, adapter state, repo-local claim-state availability, scan scope, next branches를 읽기 전용으로 묶는다.
  bundled skill은 prompt-level 금지 목록 대신 `agent status`를 먼저 읽고 branch selection에서 멈추는 what/why 계약으로 정리됐다.
  `scripts/agent-runtime/audit-cautilus-no-input-log.mjs`는 real `codex exec '$cautilus'` JSONL 전체에서 command/tool/message를 훑어 `agent status` 사용 여부와 discovery/eval/review/optimize/debug/edit/commit 회귀를 잡는다.
  실제 self-check `/tmp/cautilus-no-input-1777250621.jsonl`는 audit `passed`였고 실행 command는 `find-skills` bootstrap 뒤 `./bin/cautilus agent status --repo-root . --json`까지였다.
- 2026-04-27 후속 구현으로 Codex session log review는 repo-local normalized helper를 갖는다.
  `scripts/agent-runtime/summarize-codex-session-log.mjs --session-id <id>`는 JSONL 전체에서 user/assistant messages, tool calls, command outputs, shell commands, commits, parse warnings를 `cautilus.codex_session_summary.v1`로 요약한다.
  `audit-cautilus-no-input-log.mjs`도 이 shared summarizer를 재사용한다.
  이 helper는 public Cautilus command가 아니라 self-dogfood/debug aid이며, raw `jq` 추측을 줄이는 것이 목적이다.
- 2026-04-27 후속 구현으로 `$cautilus` two-turn refresh-flow dogfood가 생겼다.
  `npm run dogfood:cautilus-refresh-flow`는 disposable candidate worktree에서 실제 `codex exec "$cautilus"`를 실행하고, 같은 session id로 `codex exec resume <id> "1"`을 이어 실행한 뒤 `scripts/agent-runtime/audit-cautilus-refresh-flow-log.mjs`로 combined JSONL을 판정한다.
  이 감사는 branch 선택 뒤 fresh `agent status` 재확인, `refreshSummary` 읽기, coordinator-facing saved-claim-map 언어, 내부 branch id를 option title로 쓰는 회귀, review/eval 과진행을 잡는다.
  같은 수동 검증을 사용자가 새 세션에서 반복하는 것은 더 이상 기본 경로가 아니다.
- 2026-04-27 후속 구현으로 위 two-turn refresh-flow가 `cautilus eval test`의 `dev/skill` multi-turn episode fixture로 들어왔다.
  `fixtures/eval/dev/skill/cautilus-refresh-flow.fixture.json`는 `$cautilus` 다음 `1`을 ordered `turns`로 표현하고 `auditKind=cautilus_refresh_flow`로 결과를 판정한다.
  `npm run dogfood:cautilus-refresh-flow:eval`는 adapter-owned wrapper를 통해 disposable candidate worktree를 만들고, source checkout을 오염시키지 않는 상태로 live Codex episode를 실행한다.
  최종 실행은 `recommendation=accept-now`, `passed=1`, `failed=0`이며 artifact는 `artifacts/self-dogfood/cautilus-refresh-flow-eval/latest/eval-summary.json`.
  2026-04-27 후속 구현으로 같은 refresh-flow eval이 Codex와 Claude 양쪽 live runtime에서 명시적으로 증명됐다.
  `npm run dogfood:cautilus-refresh-flow:eval:codex`와 `npm run dogfood:cautilus-refresh-flow:eval:claude`는 모두 `recommendation=accept-now`, `passed=1`, `failed=0`이다.
  Claude parity를 위해 `run-local-skill-test`는 Claude `stream-json` + `--resume` 기반 multi-turn episode runner를 갖고, refresh-flow audit은 Claude stream-json tool calls / `$CAUTILUS_BIN` command shape / 한국어 saved-claim-map 표현을 인식한다.
  debug record는 [charness-artifacts/debug/debug-2026-04-27-claude-refresh-flow-parity.md](../../charness-artifacts/debug/debug-2026-04-27-claude-refresh-flow-parity.md).
  2026-04-27 후속 구현으로 saved claim map이 없는 최초 실행도 같은 `dev/skill` multi-turn episode로 증명된다.
  `fixtures/eval/dev/skill/cautilus-first-scan-flow.fixture.json`는 candidate worktree에서 `.cautilus/claims/`를 제거한 뒤 `$cautilus`, `1`을 실행하고 `auditKind=cautilus_first_scan_flow`로 판정한다.
  이 감사는 branch 선택 전 `agent status`, 최초 `claim discover`, 후속 `claim show --sample-claims`, scan scope 설명, LLM review budget boundary를 요구하고 review/eval/edit/commit 과진행을 막는다.
  `npm run dogfood:cautilus-first-scan-flow:eval:codex`와 `npm run dogfood:cautilus-first-scan-flow:eval:claude`는 모두 `recommendation=accept-now`, `passed=1`, `failed=0`이다.
  2026-04-27 후속 구현으로 discover 다음의 review-prepare branch도 `dev/skill` multi-turn episode로 증명된다.
  `fixtures/eval/dev/skill/cautilus-review-prepare-flow.fixture.json`는 `$cautilus`, `1`, `1`을 실행하고 `auditKind=cautilus_review_prepare_flow`로 판정한다.
  이 감사는 first scan 이후 `claim review prepare-input`까지만 허용하고 reviewer launch, review-result application, eval planning, product edit, commit 과진행을 막는다.
  `npm run dogfood:cautilus-review-prepare-flow:eval:codex`와 `npm run dogfood:cautilus-review-prepare-flow:eval:claude`는 모두 `recommendation=accept-now`, `passed=1`, `failed=0`이다.
  debug record는 [charness-artifacts/debug/debug-2026-04-27-review-prepare-flow-dogfood-hardening.md](../../charness-artifacts/debug/debug-2026-04-27-review-prepare-flow-dogfood-hardening.md).
  2026-04-28 후속 구현으로 review-prepare 다음의 reviewer-launch branch도 `dev/skill` multi-turn episode로 증명된다.
  `fixtures/eval/dev/skill/cautilus-reviewer-launch-flow.fixture.json`는 `$cautilus`, `1`, `1`, `launch the default single reviewer lane and stop at the review-result packet boundary`를 실행하고 `auditKind=cautilus_reviewer_launch_flow`로 판정한다.
  이 감사는 first scan, `claim show`, `claim review prepare-input`, one default reviewer lane, `cautilus.claim_review_result.v1` packet output을 요구하고, `claim review apply-result`, eval planning, product edit, commit 과진행을 막는다.
  portable default reviewer lane은 external CLI helper가 아니라 현재 에이전트가 직접 review-result packet을 쓰는 방식이다.
  external reviewer helper는 명시 선택 시에만 쓰는 smoke 경로로 남겼고, nested provider CLI에는 `danger-full-access` sandbox가 필요할 수 있다.
  `npm run dogfood:cautilus-reviewer-launch-flow:eval:codex`와 `npm run dogfood:cautilus-reviewer-launch-flow:eval:claude`는 모두 `recommendation=accept-now`, `passed=1`, `failed=0`이다.
  debug record는 [charness-artifacts/debug/debug-2026-04-28-reviewer-launch-flow-boundary.md](../../charness-artifacts/debug/debug-2026-04-28-reviewer-launch-flow-boundary.md).
  이 과정에서 `.cautilus/claims/latest.json`의 legacy `repo/whole-repo` / `repo/skill` labels도 `dev/repo` / `dev/skill`로 정리되어 `agent status`가 `claimState.status=present`와 `refresh_claims_from_diff` 첫 branch를 보여준다.
- 2026-04-26 후속 구현으로 existing-packet helper slice도 들어왔다.
  `claim show --input <claims.json> --sample-claims <n>`는 `cautilus.claim_status_summary.v1`를 만들고 bounded `sampleClaims`와 `gitState`로 stable candidate fields와 claim-packet freshness를 보여준다.
  `agent status`도 claim summary 안에 `gitState`를 포함하고, stale packet이면 `refresh_claims_from_diff`를 `show_existing_claims`보다 먼저 제안한다.
  `claim review prepare-input --claims <claims.json>`는 LLM 호출 없이 bounded `cautilus.claim_review_input.v1` cluster packet을 만들되, stale packet은 기본 거부한다.
  그 다음 `claim review apply-result --claims <claims.json> --review-result <review-result.json>`도 들어왔다.
  `cautilus.claim_review_result.v1`를 적용하되, `evidenceStatus=satisfied`는 direct/verified evidence ref가 claim을 support할 때만 허용하며 stale packet은 기본 거부한다.
- 2026-04-26 후속 구현으로 reviewed-claim eval planning helper도 들어왔다.
  `claim plan-evals --claims <reviewed-claims.json>`는 reviewed `cautilus-eval` + `ready-to-verify` claims만 골라 `cautilus.claim_eval_plan.v1` intermediate packet을 만들고, stale packet은 기본 거부한다.
  host-owned fixture, prompt, runner, wrapper, policy는 쓰지 않는다.
- 2026-04-26 후속 구현으로 packet/evidence validation helper도 들어왔다.
  `claim validate --claims <claims.json>`는 `cautilus.claim_validation_report.v1`를 만들고, packet shape 또는 evidence refs가 invalid면 non-zero exit한다.
  이 command는 claim을 mutate하거나 evidence를 찾지 않는다.
  실제 Cautilus repo dogfood에서 fresh discover packet은 `issueCount=0`, `valid=true`였다.
  `claim review prepare-input --max-clusters 8 --max-claims-per-cluster 4` 기준 top 8 clusters는 모두 entry-surface priority 10이고, skipped clusters는 30개였다.
  즉 지금 병목은 evidence preflight보다 bounded review budget / reviewed-claim promotion 쪽이다.
- 2026-04-27 후속 구현으로 broader `self-dogfood-eval-skill` suite의 nested self-eval 실패도 해소됐다.
  `cautilus eval test --runtime fixture`가 public `dev/skill` test runtime으로 노출됐고, adapter template은 `{backend}=fixture`를 받을 수 있다.
  `execution-cautilus-test-request`는 이제 live Codex 안에서 `$cautilus`를 호출해 same suite를 `--runtime fixture --skip-preflight`로 cheap smoke하고 `accept-now`를 요약한다.
  실제 live run `./bin/cautilus eval test --repo-root . --adapter-name self-dogfood-eval-skill --output-dir /tmp/cautilus-skill-live`는 `recommendation=accept-now`, `passed=3`, `failed=0`이었다.
- 2026-04-27 후속 구현으로 README / CLI reference / binary help도 네 evaluation presets와 세 command-family front doors에 맞춰 조정됐다.
  `cautilus --help`의 첫 run group은 이제 `claim discover`, `eval test`, `eval evaluate`를 먼저 보여주고, `eval --help`는 `dev/repo`, `dev/skill`, `app/chat`, `app/prompt`와 `--runtime fixture`의 cheap command-routing 의미를 설명한다.
  `optimize --help`는 optimize가 proof surface 이후의 improvement front door임을 명시한다.
  `app/chat`과 `app/prompt`도 fixture-backed self-dogfood entry가 생겼다.
  `npm run dogfood:app-chat:fixture`와 `npm run dogfood:app-prompt:fixture`는 각각 `recommendation=accept-now`, `passed=1`, `failed=0`으로 통과했다.
  이 과정에서 adapter loader가 `default_runtime`을 버리던 버그를 고쳐 named adapter의 `default_runtime: fixture`가 실제 `eval test` runtime으로 쓰이게 했다.
  같은 runner를 Codex CLI messaging mode로도 확장했다.
  `npm run dogfood:app-prompt:live`와 `npm run dogfood:app-chat:live` 모두 `recommendation=accept-now`, `passed=1`, `failed=0`이다.
  2026-04-27 후속 구현으로 같은 app runner가 Claude CLI messaging mode도 지원한다.
  `npm run dogfood:app-prompt:claude`와 `npm run dogfood:app-chat:claude` 모두 실제 `claude -p` 경로에서 `recommendation=accept-now`, `passed=1`, `failed=0`이다.
  app/chat live의 첫 시도는 fixture가 제품명을 기대하면서도 user turn에 제품명을 넣지 않아 `reject`였고, debug record는 [charness-artifacts/debug/debug-2026-04-27-app-chat-live-fixture-ambiguity.md](../../charness-artifacts/debug/debug-2026-04-27-app-chat-live-fixture-ambiguity.md).
  이전 handoff에 적힌 `charness-artifacts/cautilus/latest.md`는 현재 repo에 존재하지 않는 artifact path였으므로 다음 작업 후보에서 제거했다.
- 2026-04-27 skill-surface verification 중 shared charness guidance가 removed `cautilus instruction-surface test --repo-root .`를 아직 참조한다는 것을 확인했다.
  Cautilus binary는 현재 spec대로 해당 command를 제거했고, replacement path는 `cautilus eval test --adapter-name self-dogfood-eval` 또는 `npm run dogfood:self`다.
  debug record는 [charness-artifacts/debug/debug-2026-04-27-stale-instruction-surface-command.md](../../charness-artifacts/debug/debug-2026-04-27-stale-instruction-surface-command.md)이고, charness follow-up은 [corca-ai/charness#76](https://github.com/corca-ai/charness/issues/76).
  같은 검증에서 `npm run dogfood:self`는 real Codex로 `recommendation=accept-now`, `caseCount=1`을 통과했다.
- 2026-04-27 resumed `$cautilus` test session exposed a stale-claim overrun.
  The session used updated skill text, but after `claim show` it accepted `prepare-claim-review`, spawned reviewer lanes, applied results, planned evals, verified, and committed artifacts from stale `.cautilus/claims/latest.json`.
  That artifact commit `7048548` was reverted by `0fe2942`.
  The fix is binary-backed: `claim show` / `agent status` now expose `gitState`, and review/eval-planning commands reject stale packets unless `--allow-stale-claims` is explicitly passed.
  debug record: [charness-artifacts/debug/debug-2026-04-27-stale-claim-review-overrun.md](../../charness-artifacts/debug/debug-2026-04-27-stale-claim-review-overrun.md).
- premortem deferral 상태:
  (a) Result packet surface-agnostic 필드 — `app/chat` / `app/prompt` evaluator에서 require로 명시 정착됨; `dev/repo`/`dev/skill`로 backport는 후속 hardening 슬라이스에서.
  (b) `cautilus eval evaluate` 디스패처는 여전히 schemaVersion만으로 라우팅; fixture preset cross-check는 follow-up.
  (c) Node 측 `scripts/agent-runtime/evaluate-skill.mjs`와 동반 모듈은 self-test와 coverage floor에만 의해 살아있다 — dead-code sweep slice에서 정리.
  (d) optimize-search held-out gating은 honest-skip 상태 — 새 surface 위로 재배선은 별도 슬라이스(아래 Next Session #3 참조).
  (e) consumer onboarding smoke (`npm run consumer:onboard:smoke`)는 2026-04-26에 `doctor ready` 이후 one bounded `eval test`까지 재배선됐다.
  temp consumer repo에 `app/prompt` fixture와 fixture-backend runner를 심고 `eval-summary.json`의 `accept-now`까지 확인한다.
- 마이그레이션 트래킹: [corca-ai/cautilus#32](https://github.com/corca-ai/cautilus/issues/32).

## Next Session

1. `git status --short`로 사용자 변경 여부를 먼저 확인한다.
2. `charness:find-skills`로 설치된 public / support / integration 스킬 지도를 한 번 갱신한다.
3. 현재 가장 직접적인 Cautilus next slice는 `.cautilus/claims/eval-plan-reviewed-typed-runners.json`의 4개 `dev/skill` eval plans를 실제 checked-in fixture 또는 기존 dogfood fixture와 매핑하는 것이다.
   새 fixture를 바로 만들기 전에 각 plan이 이미 first-scan / refresh-flow / review-prepare / reviewer-launch / review-to-eval dogfood fixture로 증명되는지 확인한다.
4. 그 다음 claim hardening 후보는 review-result application branch proof, bounded evidence preflight, 또는 eval-fixture authoring guidance다.
   review prepare-input과 reviewer launch branch proof는 Codex/Claude 양쪽에서 완료됐다.
   evidence preflight는 false satisfaction 위험이 있으므로 possible evidence hint까지만 허용하는 식의 bounded slice가 필요하다.
   public `claim group` 또는 `claim refresh` command는 만들지 않는다.
5. optimize-search held-out/full-gate 신호를 현재 `cautilus eval test` surface 위로 재배선할지, 아니면 C2/C3/C4 composition landing까지 honest-skip으로 둘지 결정한다.
6. spec follow-up #4 — C2/C3/C4 composition primitives (extends / multi-step / snapshot), 슬라이스당 하나.
7. spec follow-up #5 — `scenario normalize` 재범위만 남음.
   archetype-boundary retire는 cut 슬라이스에 흡수됨.
8. 후속 후보: fixture-backed app smoke와 one-case live Codex/Claude proof를 broader app quality proof로 과장하지 않도록 release / quality artifact 쪽 proof boundary 표현을 점검한다.
9. 후속 후보: direct provider parity가 필요한지 결정한다.

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
