# Cautilus Handoff

## Workflow Trigger

다음 세션은 workbench surface 후속보다, 방금 product-owned onboarding smoke 를 `doctor ready` 이후 첫 bounded run 까지 끌어올린 변경이 충분한지 검토하는 쪽으로 시작한다.
먼저 [docs/guides/consumer-adoption.md](../guides/consumer-adoption.md), [docs/maintainers/consumer-readiness.md](../maintainers/consumer-readiness.md), [docs/maintainers/operator-acceptance.md](../maintainers/operator-acceptance.md), [scripts/on-demand/smoke-external-consumer.mjs](../../scripts/on-demand/smoke-external-consumer.mjs), [AGENTS.md](../../AGENTS.md) 를 읽는다.
핵심 질문은 이제 fresh consumer proof 를 `mode evaluate` 에서 멈출지, 아니면 `review prepare-input` 까지 올릴지다.
release workflow 쪽을 더 다듬고 싶다면 `.agents/surfaces.json` 부재 때문에 `charness:release` 의 real-host proof 체크가 깨진다는 점부터 본다.

## Current State

- public release 는 `v0.7.1` 이고 tag/head 는 commit `1061223` 에 있다.
- `release-artifacts` workflow run `24652980502` 는 성공했다.
- `npm run release:verify-public -- --version v0.7.1` 는 통과했다.
- `npm run release:smoke-install -- --channel install_sh --version v0.7.1` 는 통과했다.
- `consumer:onboard:smoke` 는 이제 temp consumer repo 에서 `install -> adapter init -> adapter resolve -> doctor ready -> mode evaluate(report.json 생성)` 까지 통과한다.
- [scripts/on-demand/smoke-external-consumer.mjs](../../scripts/on-demand/smoke-external-consumer.mjs) 는 `doctor` 후 `mode evaluate --mode held_out` 를 실행하고 generated `report.json` 을 확인한다.
- [scripts/on-demand/smoke-external-consumer.test.mjs](../../scripts/on-demand/smoke-external-consumer.test.mjs) 는 이 bounded-run proof 를 검증한다.
- [docs/guides/consumer-adoption.md](../guides/consumer-adoption.md), [docs/maintainers/operator-acceptance.md](../maintainers/operator-acceptance.md), [docs/maintainers/consumer-readiness.md](../maintainers/consumer-readiness.md), [docs/master-plan.md](../master-plan.md) 는 onboarding smoke 가 이제 wiring-only proof 가 아니라는 점을 반영한다.
- workbench discover/run-live operator acceptance row 는 이미 [docs/maintainers/operator-acceptance.md](../maintainers/operator-acceptance.md) 에 반영돼 있다.
- Ceal consumer-owned wiring follow-up 은 외부 issue [corca-ai/ceal#1](https://github.com/corca-ai/ceal/issues/1) 로 분리된 상태다.

## Next Session

1. product-owned onboarding smoke 를 `mode evaluate` 에서 멈출지, 아니면 `review prepare-input` 까지 확장할지 결정한다.
2. workbench acceptance proof 를 지금처럼 synthetic repo smoke 로 유지할지, 아니면 checked-in temp consumer fixture 로 승격할지 다시 본다.
3. Ceal 쪽 real-consumer proof 는 [corca-ai/ceal#1](https://github.com/corca-ai/ceal/issues/1) 진행을 기다리며 추적한다.
   이 repo 에서는 consumer-specific launch/auth/path 결정을 다시 가져오지 않는다.
4. release tooling 을 계속 다듬을 거면 `.agents/surfaces.json` 또는 release adapter seam 을 정리해서 `charness:release` 의 real-host proof 체크가 깨지지 않게 한다.

## Discuss

- live invocation 의 `consumer_command_template` indirection 을 장기 contract 로 고정할지
- onboarding smoke 를 `review prepare-input` 까지 늘릴지
- workbench acceptance 를 위해 temp consumer fixture 를 checked-in artifact 로 둘지, 현재처럼 smoke-test-owned synthetic repo 로 유지할지
- release adapter/surfaces manifest seam 을 product repo 에서 어디까지 first-class 로 관리할지

## References

- [README.md](../../README.md)
- [AGENTS.md](../../AGENTS.md)
- [docs/master-plan.md](../master-plan.md)
- [docs/contracts/adapter-contract.md](../contracts/adapter-contract.md)
- [docs/contracts/workbench-instance-discovery.md](../contracts/workbench-instance-discovery.md)
- [docs/contracts/live-run-invocation.md](../contracts/live-run-invocation.md)
- [docs/contracts/scenario-conversation-review.md](../contracts/scenario-conversation-review.md)
- [examples/adapter.example.yaml](../../examples/adapter.example.yaml)
