# Cautilus Handoff

## Workflow Trigger

다음 세션은 issue [#33](https://github.com/corca-ai/cautilus/issues/33)를 이어서 HITL하지 마세요.
Issue #33은 닫혔고, 이번 세션의 후속 작업은 claim Evidence State SOT/프로젝션 정리입니다.

## Current State

- Issue #33 closeout은 `cautilus review feedback build`와 `cautilus review feedback summarize`까지 좁혀 완료되었습니다.
  관련 커밋은 `1d5024b Close review-learning concern loop`와 로컬 커밋 `815a3de Add review feedback summary CLI`입니다.
- 사용자가 Evidence State와 raw claim backlog가 둘로 갈라져 SOT가 흐려진다고 지적했습니다.
  현재 개선은 raw audit source를 `.cautilus/claims/evidenced-typed-runners.json`로 고정하고, 사람이 읽는 Evidence State projection을 생성물로 둡니다.
- 새 projection은 `.cautilus/claims/evidence-state.json`와 [Claim Evidence State](../specs/proof/claim-evidence-state.md)입니다.
  이 파일은 Cautilus eval로 증명해야 하지만 아직 열려 있는 claim 총량, ready-for-proof/needs-scenario queue, surface별 분포, 샘플 claim, action bucket, stale 신호를 보여줍니다.
- `npm run claims:evidence-state`는 `cautilus claim show`로 `.cautilus/claims/status-summary.json`를 새로 만들고 Evidence State projection을 다시 렌더링합니다.
  `npm run claims:evidence-state:check`와 `npm run verify`는 status snapshot, JSON projection, Markdown projection의 drift를 잡습니다.
- `claim-status-report.md`도 같은 status snapshot을 읽으므로 `claims:status-report:check`를 추가해 `verify`에서 함께 검사합니다.
- 현재 claim packet은 HEAD 기준 stale입니다.
  생성 projection은 `Git state: stale`, packet commit `fe162d3`, current commit `815a3de`, changed claim sources `33`을 그대로 표시합니다.
- 현재 open Cautilus-eval backlog는 89개입니다.
  ready for proof 80개, needs scenario 9개이며, surface 분포는 dev/repo 49, dev/skill 23, app/prompt 10, app/chat 1, undecided 6입니다.
- Fresh-eye 리뷰에서 잡힌 핵심 문제는 반영했습니다.
  totals는 claim packet에서만 오고, status summary가 claim packet summary와 어긋나면 projection 렌더가 실패합니다.
  Evidence Map 상태도 `current` 대신 `generated; packet freshness shown`으로 바꿨습니다.
- 디버그 메모는 [charness-artifacts/debug/latest.md](../../charness-artifacts/debug/latest.md)에 있습니다.
  원인은 stale status summary를 새로 고치면서 기존 spec이 오래된 action bucket 목록을 복제하고 있던 것입니다.
- `npm run verify`, `npm run hooks:check`, `git diff --check`, debug artifact validator가 통과했습니다.

## Next Session

1. `git status --short`로 이번 Evidence State projection 변경이 그대로 있는지 확인하세요.
2. 변경 내용을 읽을 때는 [Claim Evidence State](../specs/proof/claim-evidence-state.md)부터 보고, 그 다음 `.cautilus/claims/evidence-state.json`, `.cautilus/claims/status-summary.json`, `.cautilus/claims/claim-status-report.md` 순서로 보세요.
3. 커밋 전이면 `npm run claims:evidence-state:check`, `npm run claims:status-report:check`, `npm run verify`, `npm run hooks:check`를 유지하세요.
4. 다음 실제 product work는 stale claim packet refresh입니다.
   `claim discover --previous .cautilus/claims/evidenced-typed-runners.json --refresh-plan ...` 계열로 33 changed claim sources를 갱신한 뒤, projection을 다시 렌더링해야 합니다.

## Discuss

- `discovery-review.md`도 verified generated projection으로 승격할지, 아니면 human worksheet로 남겨 drift check 대상에서 제외할지.
- `claim-status-report`와 Evidence State projection을 장기적으로 하나의 renderer/packet family로 합칠지.
- stale claim packet refresh를 지금 할지, 아니면 현재 stale 상태를 일부러 드러낸 채 다음 proof-planning slice로 넘길지.

## References

- [docs/specs/proof/claim-evidence-state.md](../specs/proof/claim-evidence-state.md)
- [docs/specs/proof/evidence-map.spec.md](../specs/proof/evidence-map.spec.md)
- [docs/specs/user/evidence-gaps.spec.md](../specs/user/evidence-gaps.spec.md)
- [.cautilus/claims/evidence-state.json](../../.cautilus/claims/evidence-state.json)
- [.cautilus/claims/evidenced-typed-runners.json](../../.cautilus/claims/evidenced-typed-runners.json)
- [charness-artifacts/debug/latest.md](../../charness-artifacts/debug/latest.md)
