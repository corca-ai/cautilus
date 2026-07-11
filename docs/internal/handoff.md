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
- 가장 최근 자율 개선은 Go와 Node의 review excerpt를 Unicode code point 기준으로 정렬하고, 경계·malformed string·scenario-to-render 회귀 테스트를 추가했다.
- `./scripts/run-quality.sh --read-only`는 비지속 `verify`만 실행하고 dogfood를 건너뛰며, 기본 실행은 `verify:runtime` 뒤 `dogfood:self`를 실행한다.
- release는 계속 repo-owned `scripts/release/*`와 `npm run release:*` 경로가 소유한다.
  Generic Charness publisher 금지는 `scripts/release/check-release-publisher-policy.mjs`가 결정적으로 검사한다.
- risk-tier acceptance 정책은 구현 완료 상태이며 세부 계약은 `docs/contracts/acceptance-risk-tier.md`가 소유한다.

## Next Session

1. `git status --short --branch`와 `charness-artifacts/goals/2026-07-11-second-autonomous-repo-improvement.md`의 상태를 확인한다.
2. 구체적인 사용자 요청이 없으면 새 dormant 트랙을 자동으로 시작하지 말고 원하는 결과를 좁힌다.
3. 자율 개선 요청이면 `charness:quality`의 최신 evidence에서 작은 repo-owned 슬라이스를 고르고, roadmap의 수요 대기 항목은 실제 consumer 증거 없이 열지 않는다.

## Discuss

- Dormant HITL specdown review는 사용자 신호가 있을 때만 `charness:quality`에서 validation route를 확인한 뒤 `charness:hitl`로 재개한다.
- Improvement merge heuristic, scenario-history 확장, runner metadata 확장은 `docs/master-plan.md`의 수요·dogfood trigger를 만족할 때만 착수한다.
- 범용 `BuildReviewPromptInput` 진입점의 0% coverage와 claim-evidence audit의 47개 warning은 후속 후보이지 활성 약속이 아니다.
- 현재 `lint · specs` 병목에는 proof-preserving repo-owned 최적화 seam이 확인되지 않았으므로 새 측정 증거 없이 gate를 줄이거나 병렬화하지 않는다.

## References

- Active/most recent goal: `charness-artifacts/goals/2026-07-11-second-autonomous-repo-improvement.md`
- Latest quality evidence: `charness-artifacts/quality/latest.md`
- Release proof: `charness-artifacts/release/latest.md`
- Product direction: `docs/master-plan.md`
- Quality runner: `scripts/run-quality.sh`
- Risk-tier contract: `docs/contracts/acceptance-risk-tier.md`

Refresh kept: current release pointer, no-auto-track boundary, latest completed goal, and evidence-ranked next-session selection because each changes the first action.
Refresh non-claims: Unicode implementation detail, exact runtime and coverage numbers, and review history remain in their canonical goal and quality artifacts.
