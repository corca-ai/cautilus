# Cautilus Handoff

## Workflow Trigger

- 다음 세션에서 이 문서를 멘션하면 `impl`로 이어서 standalone binary + bundled skill surface를 먼저 굳히고, 그 다음 Ceal을 consumer로 repoint하는 순서로 진행한다.
- 시작 직후 [README.md](/home/ubuntu/cautilus/README.md), [AGENTS.md](/home/ubuntu/cautilus/AGENTS.md), [master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md), [workflow.md](/home/ubuntu/cautilus/docs/workflow.md), [current-product.spec.md](/home/ubuntu/cautilus/docs/specs/current-product.spec.md)를 읽고 현재 제품 경계와 다음 단계 계획을 다시 잡는다.
- 그 다음 bundled skill, CLI, executable spec이 같은 standalone surface를 가리키는지 확인하고, Ceal 관련 repoint는 consumer migration으로만 다룬다.

## Current State

- `Cautilus`는 Ceal `workbench`를 떼어내는 별도 evaluation product로 잡혔다.
- [ceal-workbench-extraction.md](/home/ubuntu/cautilus/docs/ceal-workbench-extraction.md)에 extraction source-of-truth와 import sequence가 정리돼 있다.
- `README.md`, `AGENTS.md`, `docs/specs/`, `docs/master-plan.md`, `package.json`, `eslint.config.mjs`가 추가돼 이제 이 리포만의 제품 문서와 품질 바닥이 생겼다.
- minimal CLI [bin/cautilus](/home/ubuntu/cautilus/bin/cautilus)가 추가돼 `adapter resolve`, `adapter init`, `review variants`를 직접 호출할 수 있다.
- bundled standalone skill [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)이 추가돼 binary와 같은 workflow surface를 문서화하기 시작했다.
- standalone `doctor` command가 추가돼 host repo의 adapter readiness를 deterministic하게 검사할 수 있다.
- Ceal에서 generic runtime seam으로 볼 수 있는 executor-variant 러너와 검증용 테스트, review verdict schema를 가져왔다.
- [scripts/init_adapter.py](/home/ubuntu/cautilus/scripts/init_adapter.py)는 `PyYAML` 의존성을 제거하고 stdlib-only YAML writer로 바뀌었다.
- [workflow.md](/home/ubuntu/cautilus/docs/workflow.md)와 [adapter-contract.md](/home/ubuntu/cautilus/docs/contracts/adapter-contract.md)는 Ceal 최신 generic knowledge를 반영하도록 보강됐다.
- `npm install`, `npm run lint`, `npm run test`, `npm run verify`가 모두 통과했다.
- `Cautilus` resolver는 Ceal의 `skill-smoke`, `code-quality` adapter를 이미 읽을 수 있어 consumer repoint의 전제는 갖췄다.
- 아직 없는 것:
  - standalone temp-repo smoke test
  - Ceal가 `Cautilus`를 실제로 소비하는 repoint
  - scenario/history contract의 generic extraction
  - runtime log 기반 scenario proposal engine의 generic contract와 구현

## Next Session

1. temp repo를 대상으로 standalone smoke test를 추가해 Ceal 없이도 binary + skill surface가 성립하는지 검증한다.
2. 그 다음 Ceal의 generic 테스트와 invocation surface를 `Cautilus` consumer 경로로 repoint하는 1차 패치를 만든다.
3. 이어서 Ceal의 `prompt-benchmark-profile`에서 generic한 scenario/history logic를 별도 contract/spec로 승격할 범위를 정한다.

## Discuss

- adapter file naming을 당장은 `workbench-adapter`로 유지할지, 어느 시점에 `cautilus` naming으로 바꿀지 정해야 한다.
- standalone skill 배포 경로를 repo-local `skills/`로만 둘지, 추후 installable package 형태까지 같이 정의할지 정해야 한다.
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
- [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md)
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
