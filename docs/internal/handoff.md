# Cautilus Handoff

## Workflow Trigger

다음 세션의 기본 pickup은 `charness:find-skills`로 설치된 스킬 지도를 먼저 재확인한 뒤, [docs/master-plan.md](../master-plan.md)의 `Immediate Next Moves`에서 evidence가 축적된 슬라이스를 고르는 것이다.
첫 행동은 `git status --short`로 live worktree를 확인하는 것이고, 그 다음 이 handoff의 `Next Session` 섹션을 읽는다.
이 handoff는 mention-only pickup 기준 문서이며, handoff adapter는 `docs/internal/handoff.md`를 canonical artifact로 해석한다.

## Current State

- Cautilus `v0.13.0`이 게시됐다 ([release](https://github.com/corca-ai/cautilus/releases/tag/v0.13.0)).
  release-artifacts / verify-public-release / install-sh smoke 모두 green.
  세부 기록은 [charness-artifacts/release/latest.md](../../charness-artifacts/release/latest.md).
- `evaluation-surfaces` 재설계의 첫 슬라이스(`repo / whole-repo` preset)가 들어왔다 — [docs/specs/evaluation-surfaces.spec.md](../specs/evaluation-surfaces.spec.md).
  - 사용자 노출 surface는 `cautilus eval test` / `cautilus eval evaluate` 두 개로 통일.
  - fixture schema는 `cautilus.evaluation_input.v1` (top-level `surface`, `preset`, `cases[]`).
  - `surface=repo, preset=whole-repo` 외 조합과 C2/C3/C4 composition 필드는 stub-error.
- 외부 사용자가 없는 시점이라 backward compatibility 없이 깨끗하게 cut했다.
  사라진 것: `cautilus instruction-surface test/evaluate`, `cautilus.instruction_surface_*` schema, `instruction_surface_*` adapter field, `workflow` first-class archetype.
  마이그레이션 트래킹: [corca-ai/cautilus#32](https://github.com/corca-ai/cautilus/issues/32).
- self-dogfood adapter는 `.agents/cautilus-adapters/self-dogfood-eval.yaml`, npm 스크립트는 `dogfood:self:eval`, fixture는 `fixtures/eval/whole-repo/checked-in-agents-routing.fixture.json`.
- 잔여 신호: 현재 fixture는 `expectedRouting: { selectedSkill: "none" }`을 기대하지만 real-codex로 cautilus 실제 AGENTS.md를 돌리면 `reject`가 난다.
  fixture 기대치 vs. 실제 AGENTS.md routing 사이 정직성 결정이 필요하다 — fixture를 현실에 맞춰 풀어주거나, AGENTS.md를 더 엄격하게 routing-pinning하거나, 둘 다 손보거나.

## Next Session

1. `git status --short`로 사용자 변경 여부를 먼저 확인한다.
2. `charness:find-skills`로 설치된 public / support / integration 스킬 지도를 한 번 갱신한다.
3. spec [§ First Implementation Slice](../specs/evaluation-surfaces.spec.md)의 follow-up 1번 — `repo / skill` preset 슬라이스로 진입.
   기존 `cautilus skill test/evaluate`를 새 surface 아래로 옮기고, 같은 cutover 패턴(no backward compat)으로 정리.
4. `charness:impl`로 들어가되 spec이 이미 명시한 follow-up 순서를 따른다.

## Discuss

- runtime fingerprint의 두 번째 슬라이스 (automatic prior-evidence selection, provider API 연동)를 언제 시작할지.
- `app / chat` preset 진입 시점에 `mode evaluate` chatbot 모드를 동시에 cut할지, 단독 슬라이스로 분리할지.
- `archetype-boundary.spec.md` retire는 spec follow-up 5번. 모든 preset 출시 후 한 번에 정리할지, 더 빨리 끊을지.
- 잔여 신호의 fixture vs. AGENTS.md 정직성 결정 — `repo / skill` 슬라이스 작업 중 자연스럽게 닿을 수 있음.

## References

- [docs/master-plan.md](../master-plan.md)
- [docs/specs/evaluation-surfaces.spec.md](../specs/evaluation-surfaces.spec.md)
- [docs/contracts/runtime-fingerprint-optimization.md](../contracts/runtime-fingerprint-optimization.md)
- [docs/contracts/scenario-history.md](../contracts/scenario-history.md)
- [corca-ai/charness#66](https://github.com/corca-ai/charness/issues/66) — ideation/spec의 enum-axis consistency 점검 제안 (여전히 열려 있음)
