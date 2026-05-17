# Cautilus Handoff

## Workflow Trigger

사용자가 `docs/specs/index.spec.md`부터 직접 human review를 하고 돌아올 예정입니다.
다음 세션은 먼저 그 review notes, decisions, or requested edits를 받아 정리한 뒤 `.cautilus/claims/claim-status-report.md`의 남은 bucket에 반영하세요.

## Current State

- 이번 세션은 claim proof backlog의 agent-owned work를 처리했습니다.
  deterministic proof queue를 비웠고, reviewed eval-ready claim plan을 만들었으며, scenario-design bucket을 concrete scenario proposal packet으로 분해했습니다.
- 최신 관련 커밋은 `bb7c652 Clear deterministic proof queue`, `8c3dfe6 Plan reviewed Cautilus eval claims`, `a93fb91 Design scenarios for eval-ready claims`, `000635b Refresh internal handoff for eval planning`, `31febf4 Refresh claim packet after handoff update`입니다.
- 최신 claim projection은 fresh였습니다.
  마지막 확인에서 `npm run generated:drift:check`, `npm run claims:evidence-state:check`, `npm run claims:status-report:check`, `./bin/cautilus discover claims validate --claims .cautilus/claims/evidenced-typed-runners.json`가 통과했습니다.
- `already-satisfied`는 137개입니다.
  deterministic proof queue는 처리 완료되었고 `agent-add-deterministic-proof` bucket은 없습니다.
- `agent-design-scenario` bucket 8개는 4개 scenario proposal로 분해했습니다.
  산출물은 `.cautilus/claims/scenario-proposal-input-agent-design-scenario-2026-05-17.json`, `.cautilus/claims/scenario-proposals-agent-design-scenario-2026-05-17.json`, `.cautilus/claims/evidence-agent-design-scenario-proposals-2026-05-17.json`, `.cautilus/claims/review-result-agent-design-scenario-proposals-2026-05-17.json`입니다.
  이 claim들은 satisfied가 아니라 `ready-for-proof`와 `evidenceStatus=unknown`으로 이동했습니다.
- 최신 eval-plan은 `.cautilus/claims/eval-plan-after-scenario-design-2026-05-17.json`입니다.
  reviewed/human-reviewed eval-ready claim 17개를 계획하고, scenario-design에서 올라온 8개 claim도 포함합니다.
- 현재 status report의 남은 agent bucket은 `agent-plan-cautilus-eval=124`입니다.
  그중 `agent-reviewed=16`, `human-reviewed=1`, `heuristic=107`입니다.
- Human bucket은 그대로 남아 있습니다.
  `human-align-surfaces=39`, `human-confirm-or-decompose=34`, `split-or-defer=27`은 maintainer 판단 없이 proof로 밀지 마세요.
- Scenario-design review-result 작성 중 `matchKind=scenario-designed`가 validation enum을 깨뜨렸고, `possible`로 수정했습니다.
  재발 방지는 [debug-2026-05-17-scenario-design-matchkind-enum.md](../../charness-artifacts/debug/debug-2026-05-17-scenario-design-matchkind-enum.md)에 있습니다.

## Next Session

1. `git status --short --untracked-files=all`와 `npm run generated:drift:check`로 깨끗한 상태를 확인하세요.
2. 사용자가 가져온 human review 결과를 먼저 수집하세요.
   시작 파일은 `docs/specs/index.spec.md`이며, 사용자가 이어서 본 spec 파일, 판단, 수정 요청, 보류 질문을 source-ref와 함께 기록하세요.
3. human review가 claim label, proof route, or source wording을 바꾸면 해당 source/spec/review-result를 먼저 갱신하고 claim refresh chain을 다시 돌리세요.
4. human review가 끝난 뒤 이미 reviewed인 17개 eval-plan claim을 진행하려면 `.cautilus/claims/eval-plan-after-scenario-design-2026-05-17.json`에서 fixture 후보를 읽으세요.
5. `heuristic=107` eval claim을 더 진행하려면 Cautilus Agent claim review branch로 들어가야 합니다.
   이 branch는 review budget 확인이 필요하므로, maximum clusters, claims per cluster, parallel lanes, excerpt chars, retry policy, skipped-cluster policy를 사용자에게 확인받고 시작하세요.
6. Human bucket은 질문 또는 decomposition 대상으로 남기고, agent가 단독으로 satisfied 처리하지 마세요.

## Discuss

- `docs/specs/index.spec.md`부터 이어지는 human review에서 어떤 판단을 claim updates로 반영할지.
- Heuristic eval claim review budget을 어느 크기로 열지.
- 17개 reviewed eval-plan 중 어떤 fixture family부터 실제 checked-in eval fixture로 승격할지.
- Human bucket을 product promise로 유지할지, proofable subclaim으로 쪼갤지.

## References

- [docs/specs/index.spec.md](../specs/index.spec.md)
- [.cautilus/claims/claim-status-report.md](../../.cautilus/claims/claim-status-report.md)
- [.cautilus/claims/status-summary.json](../../.cautilus/claims/status-summary.json)
- [.cautilus/claims/eval-plan-after-scenario-design-2026-05-17.json](../../.cautilus/claims/eval-plan-after-scenario-design-2026-05-17.json)
- [docs/specs/evidence/claim-evidence-state.md](../specs/evidence/claim-evidence-state.md)
- [charness-artifacts/debug/debug-2026-05-17-scenario-design-matchkind-enum.md](../../charness-artifacts/debug/debug-2026-05-17-scenario-design-matchkind-enum.md)
