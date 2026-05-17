# Cautilus Handoff

## Workflow Trigger

다음 세션은 `.cautilus/claims/claim-status-report.md`의 `agent-plan-cautilus-eval` bucket부터 이어가세요.
지금은 deterministic proof backlog와 `agent-design-scenario` bucket이 비어 있고, 남은 agent work는 reviewed eval-ready claim 계획과 heuristic eval claim review입니다.

## Current State

- 최신 claim projection은 fresh입니다.
  `npm run generated:drift:check`, `npm run claims:evidence-state:check`, `npm run claims:status-report:check`, `./bin/cautilus discover claims validate --claims .cautilus/claims/evidenced-typed-runners.json`가 마지막 커밋 뒤 통과했습니다.
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
2. 이미 reviewed인 17개 eval-plan claim은 `.cautilus/claims/eval-plan-after-scenario-design-2026-05-17.json`에서 fixture 후보를 읽으세요.
3. `heuristic=107` eval claim을 더 진행하려면 Cautilus Agent claim review branch로 들어가야 합니다.
   이 branch는 review budget 확인이 필요하므로, maximum clusters, claims per cluster, parallel lanes, excerpt chars, retry policy, skipped-cluster policy를 사용자에게 확인받고 시작하세요.
4. Human bucket은 질문 또는 decomposition 대상으로 남기고, agent가 단독으로 satisfied 처리하지 마세요.

## Discuss

- Heuristic eval claim review budget을 어느 크기로 열지.
- 17개 reviewed eval-plan 중 어떤 fixture family부터 실제 checked-in eval fixture로 승격할지.
- Human bucket을 product promise로 유지할지, proofable subclaim으로 쪼갤지.

## References

- [.cautilus/claims/claim-status-report.md](../../.cautilus/claims/claim-status-report.md)
- [.cautilus/claims/status-summary.json](../../.cautilus/claims/status-summary.json)
- [.cautilus/claims/eval-plan-after-scenario-design-2026-05-17.json](../../.cautilus/claims/eval-plan-after-scenario-design-2026-05-17.json)
- [docs/specs/evidence/claim-evidence-state.md](../specs/evidence/claim-evidence-state.md)
- [charness-artifacts/debug/debug-2026-05-17-scenario-design-matchkind-enum.md](../../charness-artifacts/debug/debug-2026-05-17-scenario-design-matchkind-enum.md)
