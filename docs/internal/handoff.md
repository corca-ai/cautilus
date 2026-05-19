# Cautilus Handoff

## Workflow Trigger

사용자가 `docs/specs/index.spec.md`부터 직접 human review를 하다가 중단된 상태입니다.
`docs/specs/.index.spec.md.swp` stale swap이 남아 있으니, 다음 세션은 review를 재개할 때 vim recovery로 복구할지 swap을 삭제할지 먼저 결정하세요.
그 다음 review notes, decisions, requested edits를 받아 정리한 뒤 `.cautilus/claims/claim-status-report.md`의 남은 bucket에 반영하세요.

## Current State

- 이번 세션은 17개 reviewed eval-plan 중 Family B (dev/skill, 3 plans)를 satisfied로 promote하고, rename으로 stale이 되던 evidence carry-forward 구조의 **root cause를 코드 레벨에서 수정**했습니다.
- Family B 산출물: verified evidence bundle `evidence-family-b-dev-skill-deterministic-proof-2026-05-20.json`과 매칭 review-result `review-result-family-b-dev-skill-deterministic-proof-2026-05-20.json`.
  bundle은 binary-emitted contract (claim-review-input의 reviewBudget, refresh-plan의 baselineCommit/targetPolicy/changedSources/claimPlan/staleEvidence/workingTreePolicy, improve proposal의 non-mutating boundary)에 Go 테스트로 anchor.
- Root cause fix(`internal/runtime/claim_discovery.go`):
  - `rewriteEvidenceRefClaimIDs`가 이전엔 previousID를 currentID로 **치환**해 chain 이력을 잃었습니다.
    이제는 **additive**로 currentID를 supportsClaimIds 뒤에 append하고 previousID도 유지합니다.
  - `reconcileCarriedEvidenceRefs`는 ref의 supportsClaimIds를 acceptable bundle ID 집합으로 사용합니다.
    bundle의 createdForClaimIds가 그 중 하나라도 매치하면 통과시킵니다.
  - carry-forward로 인해 `evidenceStatus=stale + reason="Carried evidence requires re-review:..."`가 됐던 candidate가 현재 reconcile에서 깨끗하면 satisfied로 복원하고 reason/nextAction을 제거합니다.
- 새 Go 테스트 2개:
  - `TestDiscoverClaimProofPlanAcceptsBundleListingPreviousClaimIDAfterRename` (single-hop)
  - `TestDiscoverClaimProofPlanRestoresSatisfiedAfterMultiHopRenameRebinds` (multi-hop + 복원)
- Root cause로 자동 복구된 stale claim: 4개 (`claim-docs-contracts-reporting-md-131`, `claim-docs-guides-cli-md-135`, `-md-263`, `-md-265`).
- 잔여 stale 2개 (`claim-docs-guides-cli-md-478`, `claim-docs-contracts-reporting-md-144`)도 일회성 데이터 복구 review-result `review-result-rename-chain-supports-replenish-2026-05-20.json`으로 historical claim id를 supportsClaimIds에 다시 attach해 satisfied로 복구했습니다.
  앞으로 발생할 rename은 additive rewrite가 chain을 자동 보존합니다.
- 최신 커밋 (모두 `origin/main`에 push 완료, HEAD = `860374b`):
  - `860374b Refresh handoff after stale-claim replenishment`
  - `4e6276e Replenish historical claim ids on two surviving rename-chain refs`
  - `b5c8be1 Refresh handoff after rename-chain root cause fix`
  - `d0f985c Preserve rename chain so renamed claims rebind to their original evidence bundle`
  - `1c43b1f Refresh handoff after Family B promotion`
  - `b663104 Satisfy Family B dev/skill claims with deterministic evidence`
- 검증은 모두 통과합니다.
  `npm run generated:drift:check`, `npm run claims:evidence-state:check`, `npm run claims:status-report:check`, `./bin/cautilus discover claims validate --claims .cautilus/claims/evidenced-typed-runners.json`, `npm run lint`, `npm run test`, `npm run hooks:check`.
- 이번 세션 누적 변화:
  - satisfied 136 → 145 (+9: Family B 3개 + root cause 자동 복구 4개 + 데이터 복구 2개)
  - stale 7 → 0 (-7)
  - unknown 218 → 216 (-2)
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
9. stale=0 상태이며 rename chain은 root cause fix가 자동 보존합니다.
   같은 종류의 stale은 더 이상 발생하지 않습니다.

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
- [.cautilus/claims/review-result-rename-chain-supports-replenish-2026-05-20.json](../../.cautilus/claims/review-result-rename-chain-supports-replenish-2026-05-20.json)
- [docs/specs/evidence/claim-evidence-state.md](../specs/evidence/claim-evidence-state.md)
- [charness-artifacts/debug/debug-2026-05-17-scenario-design-matchkind-enum.md](../../charness-artifacts/debug/debug-2026-05-17-scenario-design-matchkind-enum.md)
