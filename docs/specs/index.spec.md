# Cautilus Current Specs

이 index는 현재 `Cautilus`가 실제로 주장하는 제품 경계와, 그 주장을 지키기 위해 유지해야 하는
source-level guard를 담는다.

아직 구현하지 않은 방향은 [master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md)에 둔다.
현재 검증 대상은 이 index에 링크된 문서들이다.

## Current Documents

- [Current Product](current-product.spec.md)
  현재 repo가 실제로 제공하는 contract, CLI, runtime runner, 문서 경계를 정의한다.
- [Standalone Surface](standalone-surface.spec.md)
  standalone binary와 bundled skill이 같은 제품 표면을 가리키는지 정의한다.

## Source Sanity

```run:shell
$ test -f README.md
$ test -f AGENTS.md
$ test -f package.json
$ test -f eslint.config.mjs
$ test -f bin/cautilus
$ test -f docs/workflow.md
$ test -f docs/contracts/adapter-contract.md
$ test -f docs/contracts/reporting.md
$ test -f docs/contracts/scenario-history.md
$ test -f docs/contracts/scenario-proposal-sources.md
$ test -f docs/contracts/scenario-proposal-inputs.md
$ test -f docs/contracts/scenario-proposal-normalization.md
$ test -f docs/contracts/chatbot-normalization.md
$ test -f docs/contracts/skill-normalization.md
$ test -f docs/master-plan.md
$ test -f skills/cautilus/SKILL.md
$ test -f skills/cautilus/agents/openai.yaml
$ test -f scripts/resolve_adapter.py
$ test -f scripts/init_adapter.py
$ test -f scripts/doctor.py
$ test -f scripts/agent-runtime/scenario-history.mjs
$ test -f scripts/agent-runtime/chatbot-proposal-candidates.mjs
$ test -f scripts/agent-runtime/normalize-chatbot-proposals.mjs
$ test -f scripts/agent-runtime/skill-proposal-candidates.mjs
$ test -f scripts/agent-runtime/normalize-skill-proposals.mjs
$ test -f scripts/agent-runtime/scenario-proposals.mjs
$ test -f scripts/agent-runtime/build-scenario-proposal-input.mjs
$ test -f scripts/agent-runtime/generate-scenario-proposals.mjs
$ test -f scripts/agent-runtime/run-workbench-review-variant.sh
$ test -f scripts/agent-runtime/run-workbench-executor-variants.mjs
$ test -f fixtures/scenario-proposals/candidates.json
$ test -f fixtures/scenario-proposals/registry.json
$ test -f fixtures/scenario-proposals/coverage.json
$ test -f fixtures/scenario-proposals/input.schema.json
$ test -f fixtures/scenario-proposals/proposals.schema.json
$ test -f fixtures/scenario-proposals/chatbot-input.schema.json
$ test -f fixtures/scenario-proposals/skill-input.schema.json
$ test -f fixtures/scenario-proposals/standalone-input.json
$ test -f fixtures/scenario-proposals/chatbot-input.json
$ test -f fixtures/scenario-proposals/skill-input.json
$ test -f fixtures/workbench/review-verdict.schema.json
```
