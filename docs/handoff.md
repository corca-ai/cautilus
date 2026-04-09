# Cautilus Handoff

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 `$ceal:impl`로 이어서 Ceal `workbench`의 generic surface를 `Cautilus`로 repoint하는 1차분을 진행한다.
- 시작 직후 [README.md](/home/ubuntu/cautilus/README.md), [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md), [master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md), [workflow.md](/home/ubuntu/cautilus/docs/workflow.md), [current-product.spec.md](/home/ubuntu/cautilus/docs/specs/current-product.spec.md)를 읽고 현재 제품 경계와 다음 단계 계획을 다시 잡는다.
- 그 다음 Ceal의 `.agents/skills/workbench/`와 `scripts/agent-runtime/`에서 아직 `Cautilus`가 직접 소유하지 않는 generic seam이 있는지 확인하고, Ceal 테스트나 invocation surface를 `Cautilus` 경로로 바꾸기 시작한다.

## Current State

- `Cautilus`는 Ceal `workbench`를 떼어내는 별도 evaluation product로 잡혔다.
- [ceal-workbench-extraction.md](/home/ubuntu/cautilus/docs/ceal-workbench-extraction.md)에 extraction source-of-truth와 import sequence가 정리돼 있다.
- `README.md`, `AGENTS.md`, `docs/specs/`, `docs/master-plan.md`, `package.json`, `eslint.config.mjs`가 추가돼 이제 이 리포만의 제품 문서와 품질 바닥이 생겼다.
- minimal CLI [bin/cautilus](/home/ubuntu/cautilus/bin/cautilus)가 추가돼 `adapter resolve`, `adapter init`, `review variants`를 직접 호출할 수 있다.
- Ceal에서 generic runtime seam으로 볼 수 있는 executor-variant 러너와 검증용 테스트, review verdict schema를 가져왔다.
- [scripts/init_adapter.py](/home/ubuntu/cautilus/scripts/init_adapter.py)는 `PyYAML` 의존성을 제거하고 stdlib-only YAML writer로 바뀌었다.
- [workflow.md](/home/ubuntu/cautilus/docs/workflow.md)와 [adapter-contract.md](/home/ubuntu/cautilus/docs/contracts/adapter-contract.md)는 Ceal 최신 generic knowledge를 반영하도록 보강됐다.
- `npm install`, `npm run lint`, `npm run test`, `npm run verify`가 모두 통과했다.
- 현재 작업트리는 아직 커밋되지 않았다.
- 아직 없는 것:
  - Ceal가 `Cautilus`를 실제로 소비하는 repoint
  - generic `validate` 또는 `doctor` command
  - scenario/history contract의 generic extraction
  - runtime log 기반 scenario proposal engine의 generic contract와 구현

## Next Session

1. Ceal의 `workbench` 관련 generic 테스트와 invocation surface 중 `Cautilus`로 repoint 가능한 최소 묶음을 정한다.
2. Ceal 쪽 `skill-smoke`와 관련 테스트가 Ceal 내부 `.agents/skills/workbench/scripts/*` 대신 `Cautilus` surface를 읽게 바꿀 1차 패치를 만든다.
3. 그 다음 `validate` 또는 `doctor` command를 `Cautilus` CLI에 추가할지 결정하고, adapter readiness check contract를 쓴다.
4. 이어서 Ceal의 `prompt-benchmark-profile`에서 generic한 scenario/history logic를 별도 contract/spec로 승격할 범위를 정한다.

## Discuss

- adapter file naming을 당장은 `workbench-adapter`로 유지할지, 어느 시점에 `cautilus` naming으로 바꿀지 정해야 한다.
- Ceal repoint를 한 번에 할지, tests/review-variant/adapter-resolution부터 단계적으로 할지 정해야 한다.
- scenario proposal engine을 Slack/Ceal storage model에서 얼마나 빨리 분리할지 결정이 필요하다.
- `charness`나 다른 consumer에 공개할 release boundary를 언제 처음 만들지 정해야 한다.

## References

- [docs/handoff.md](/home/ubuntu/cautilus/docs/handoff.md)
- [README.md](/home/ubuntu/cautilus/README.md)
- [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md)
- [ceal-workbench-extraction.md](/home/ubuntu/cautilus/docs/ceal-workbench-extraction.md)
- [master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md)
- [workflow.md](/home/ubuntu/cautilus/docs/workflow.md)
- [adapter-contract.md](/home/ubuntu/cautilus/docs/contracts/adapter-contract.md)
- [reporting.md](/home/ubuntu/cautilus/docs/contracts/reporting.md)
- [current-product.spec.md](/home/ubuntu/cautilus/docs/specs/current-product.spec.md)
- [adapter.example.yaml](/home/ubuntu/cautilus/examples/adapter.example.yaml)
- [review-verdict.schema.json](/home/ubuntu/cautilus/fixtures/workbench/review-verdict.schema.json)
- [cautilus](/home/ubuntu/cautilus/bin/cautilus)
- [resolve_adapter.py](/home/ubuntu/cautilus/scripts/resolve_adapter.py)
- [init_adapter.py](/home/ubuntu/cautilus/scripts/init_adapter.py)
- [run-workbench-review-variant.sh](/home/ubuntu/cautilus/scripts/agent-runtime/run-workbench-review-variant.sh)
- [run-workbench-executor-variants.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/run-workbench-executor-variants.mjs)
- [workbench-adapter-resolution.test.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/workbench-adapter-resolution.test.mjs)
- [run-workbench-review-variant.test.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/run-workbench-review-variant.test.mjs)
- [run-workbench-executor-variants.test.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/run-workbench-executor-variants.test.mjs)
- [WORKBENCH_PRODUCT_EXTRACTION_PLAN.md](/home/ubuntu/ceal/WORKBENCH_PRODUCT_EXTRACTION_PLAN.md)
- [/home/ubuntu/ceal/.agents/skills/workbench/SKILL.md](/home/ubuntu/ceal/.agents/skills/workbench/SKILL.md)
- `/home/ubuntu/ceal/.agents/workbench-adapter.yaml`
- `/home/ubuntu/ceal/.agents/workbench-adapters/code-quality.yaml`
- `/home/ubuntu/ceal/.agents/workbench-adapters/skill-smoke.yaml`
- `/home/ubuntu/ceal/scripts/agent-runtime/prompt-benchmark-profile.mjs`
- `/home/ubuntu/ceal/scripts/agent-runtime/propose-audit-scenarios.mjs`
- `python3 /home/ubuntu/cautilus/scripts/resolve_adapter.py --repo-root /home/ubuntu/ceal`
- `python3 /home/ubuntu/cautilus/scripts/resolve_adapter.py --repo-root /home/ubuntu/ceal --adapter-name code-quality`
- `python3 /home/ubuntu/cautilus/scripts/resolve_adapter.py --repo-root /home/ubuntu/ceal --adapter-name skill-smoke`
- `npm run lint`
- `npm run test`
- `npm run verify`
