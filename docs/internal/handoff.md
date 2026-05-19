# Cautilus Handoff

## Workflow Trigger

사용자가 `docs/specs/index.spec.md`부터 직접 human review를 하다가 중단된 상태입니다.
`docs/specs/.index.spec.md.swp` stale swap이 남아 있으니, 다음 세션은 review를 재개할 때 vim recovery로 복구할지 swap을 삭제할지 먼저 결정하세요.
그 다음 review notes, decisions, requested edits를 받아 정리한 뒤 `.cautilus/claims/claim-status-report.md`의 남은 bucket에 반영하세요.

## Current State

- 이번 세션은 17개 reviewed eval-plan 중 Family B (dev/skill, 3 plans)를 satisfied로 promote 했습니다.
  대상은 `claim-docs-contracts-claim-discovery-workflow-md-214`, `-md-561` (human-reviewed), `claim-docs-contracts-runtime-fingerprint-improvement-md-50`입니다.
- 산출물은 verified evidence bundle `evidence-family-b-dev-skill-deterministic-proof-2026-05-20.json`과 매칭 review-result `review-result-family-b-dev-skill-deterministic-proof-2026-05-20.json`입니다.
  bundle은 binary-emitted contract (claim-review-input의 reviewBudget, refresh-plan의 baselineCommit/targetPolicy/changedSources/claimPlan/staleEvidence/workingTreePolicy, improve proposal의 non-mutating boundary)에 Go 테스트로 anchor합니다.
- claim-50은 단순 rename(`optimization`→`improvement`)으로 stale이었던 것이며, 기존 historical bundle을 mutate하지 않고 새 bundle로 additive하게 복구했습니다.
- `notClaimed`에 live Cautilus Agent 실행으로만 증명 가능한 skill-level 행동을 명시했습니다.
  fixture-smoke 레벨 증거는 다음 세션의 옵션입니다.
- 최신 커밋은 `b663104 Satisfy Family B dev/skill claims with deterministic evidence`입니다.
- 검증은 모두 통과합니다.
  `npm run generated:drift:check`, `npm run claims:evidence-state:check`, `npm run claims:status-report:check`, `./bin/cautilus discover claims validate --claims .cautilus/claims/evidenced-typed-runners.json`, `npm run lint`, `npm run test`, `npm run hooks:check`.
- 이번 세션 전후 carry:
  - satisfied 136 → 139 (+3)
  - stale 7 → 6 (-1, claim-50)
  - unknown 218 → 216 (-2, claims 214, 561)
- 핸드오프 직전과 동일한 untracked는 stale vim swap `docs/specs/.index.spec.md.swp` 한 개입니다.
  사용자 vim 세션 lock이므로 자율 삭제하지 않았습니다.

## Next Session

1. `git status --short --untracked-files=all`와 `npm run generated:drift:check`로 깨끗한 상태를 확인하세요.
2. `docs/specs/.index.spec.md.swp` 처리를 먼저 결정하세요.
   사용자가 vim review를 이어서 진행하면 `vim -r docs/specs/index.spec.md`로 recovery, 그게 아니면 swap 삭제 후 spec review 흐름 재시작.
3. 사용자가 가져온 human review 결과를 수집하세요.
   시작 파일은 `docs/specs/index.spec.md`이며, 사용자가 이어서 본 spec 파일, 판단, 수정 요청, 보류 질문을 source-ref와 함께 기록하세요.
4. human review가 claim label, proof route, or source wording을 바꾸면 해당 source/spec/review-result를 먼저 갱신하고 claim refresh chain을 다시 돌리세요.
5. 17개 reviewed eval-plan 잔여 14개를 진행하려면 family별로 우선순위를 잡으세요.
   Family A (dev/repo, 10 plans) 중 6개는 unresolvedQuestions를 먼저 답해야 하고, 4개는 즉시 promote 가능.
   Family C (app/chat, 3 plans)와 Family D (app/prompt, 1 plan)는 product runner 백엔드 셋업이 필요.
   Family B는 이번 세션에서 처리 완료.
6. 더 깊은 confidence가 필요하면 Family B에 fixture-smoke를 추가하세요.
   `fixtures/eval/dev/skill/` 아래에 새 `.fixture.json`을 작성하고 `./bin/cautilus evaluate fixture --runtime fixture`로 cheap routing smoke 실행 후 evidence bundle을 deepening 형태로 갱신.
7. `heuristic=107` eval claim을 더 진행하려면 Cautilus Agent claim review branch로 들어가야 합니다.
   review budget 확인이 필요하므로, maximum clusters, claims per cluster, parallel lanes, excerpt chars, retry policy, skipped-cluster policy를 사용자에게 확인받고 시작하세요.
8. Human bucket (`human-align-surfaces=39`, `human-confirm-or-decompose=34`, `split-or-defer=27`)은 maintainer 판단 대상으로 남기고, agent가 단독으로 satisfied 처리하지 마세요.
9. 같은 root cause(claim-id rename으로 stale)인 `claim-docs-contracts-reporting-md-131`은 Family A에 속해 이번 세션에서 손대지 않았습니다.
   다음 Family A 슬라이스가 들어갈 때 같은 additive bundle 패턴으로 정리할 수 있습니다.

## Discuss

- `docs/specs/index.spec.md`부터 이어지는 human review에서 어떤 판단을 claim updates로 반영할지.
- Heuristic eval claim review budget을 어느 크기로 열지.
- Family A 10 plan 중 어느 unresolvedQuestions를 먼저 정리할지 (6개가 maintainer 답을 기다리는 상태).
- Family C/D 진행을 위해 어떤 product runner 백엔드를 표준으로 둘지 (codex_exec vs claude_code).
- Family B에 fixture-smoke 레벨 deepening을 더 할지, 다른 family로 넘어갈지.
- Human bucket을 product promise로 유지할지, proofable subclaim으로 쪼갤지.

## References

- [docs/specs/index.spec.md](../specs/index.spec.md)
- [.cautilus/claims/claim-status-report.md](../../.cautilus/claims/claim-status-report.md)
- [.cautilus/claims/status-summary.json](../../.cautilus/claims/status-summary.json)
- [.cautilus/claims/eval-plan-after-scenario-design-2026-05-17.json](../../.cautilus/claims/eval-plan-after-scenario-design-2026-05-17.json)
- [.cautilus/claims/evidence-family-b-dev-skill-deterministic-proof-2026-05-20.json](../../.cautilus/claims/evidence-family-b-dev-skill-deterministic-proof-2026-05-20.json)
- [.cautilus/claims/review-result-family-b-dev-skill-deterministic-proof-2026-05-20.json](../../.cautilus/claims/review-result-family-b-dev-skill-deterministic-proof-2026-05-20.json)
- [docs/specs/evidence/claim-evidence-state.md](../specs/evidence/claim-evidence-state.md)
- [charness-artifacts/debug/debug-2026-05-17-scenario-design-matchkind-enum.md](../../charness-artifacts/debug/debug-2026-05-17-scenario-design-matchkind-enum.md)
