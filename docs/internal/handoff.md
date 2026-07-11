# Cautilus Handoff

## Workflow Trigger

권장 호출(다음 세션): `@docs/internal/handoff.md 핸드오프대로 진행 — 먼저 charness:handoff로 현재 상태를 확인하고, 사용자가 구체적인 트랙을 지정하지 않았다면 자동 착수하지 않는다.`

mention-only 픽업이면 `charness:handoff`로 이 baton과 최신 goal 상태를 확인한다.
구체적인 새 작업 요청이 함께 있으면 그 요청이 우선한다.

## Continuation Capability

현재 활성 구현 트랙은 없다.
다음 작업은 사용자 요청이나 새 품질 증거에서 한정된 슬라이스를 고른 뒤 `charness:achieve` 또는 해당 durable work skill로 시작한다.

## Current State

- 공개 릴리스와 설치 readback의 canonical 상태는 `charness-artifacts/release/latest.md`가 소유하며 현재 릴리스는 `v0.19.1`이다.
- 2026-07-11 자율 개선 목표는 durable quality 실행이 기존 `verify:runtime` 경로를 사용하도록 연결해 정상 quality closeout마다 runtime signal이 갱신되게 했다.
- `./scripts/run-quality.sh --read-only`는 비지속 `verify`만 실행하고 dogfood를 건너뛰며, 기본 실행은 `verify:runtime` 뒤 `dogfood:self`를 실행한다.
- release는 계속 repo-owned `scripts/release/*`와 `npm run release:*` 경로가 소유한다.
  Generic Charness publisher 금지는 `scripts/release/check-release-publisher-policy.mjs`가 결정적으로 검사한다.
- risk-tier acceptance 정책은 구현 완료 상태이며 세부 계약은 `docs/contracts/acceptance-risk-tier.md`가 소유한다.

## Next Session

1. `git status --short --branch`와 `charness-artifacts/goals/2026-07-11-autonomous-repo-improvement.md`의 상태를 확인한다.
2. 구체적인 사용자 요청이 없으면 새 dormant 트랙을 자동으로 시작하지 말고 원하는 결과를 좁힌다.
3. 자율 개선 요청이면 `charness:quality`의 최신 evidence에서 작은 repo-owned 슬라이스를 고르고, roadmap의 수요 대기 항목은 실제 consumer 증거 없이 열지 않는다.

## Discuss

- Dormant HITL specdown review는 사용자 신호가 있을 때만 `charness:quality`에서 validation route를 확인한 뒤 `charness:hitl`로 재개한다.
- Improvement merge heuristic, scenario-history 확장, runner metadata 확장은 `docs/master-plan.md`의 수요·dogfood trigger를 만족할 때만 착수한다.
- 이번 quality pass가 관찰한 `internal/runtime/review.go`의 낮은 deterministic coverage는 후속 후보이지 활성 약속이 아니다.

## References

- Active/most recent goal: `charness-artifacts/goals/2026-07-11-autonomous-repo-improvement.md`
- Release proof: `charness-artifacts/release/latest.md`
- Product direction: `docs/master-plan.md`
- Quality runner: `scripts/run-quality.sh`
- Risk-tier contract: `docs/contracts/acceptance-risk-tier.md`

Refresh kept: current release pointer, durable quality-run behavior, no-auto-track boundary, and the next-session selection rule because each changes the first action.
Refresh non-claims: completed v0.18.0 implementation history, old critique detail, and duplicated release procedure were removed in favor of their canonical owners.
