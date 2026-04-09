# Cautilus Current Product

`Cautilus`는 현재 Ceal `workbench`에서 generic evaluation seam을 떼어낸 초기 standalone product여야 한다.

지금 단계의 제품은 큰 admin UI나 scenario store가 아니라, contract + bootstrap + bounded runtime surface에 집중한다.

## Source Guard

현재 product boundary는 다음을 가져야 한다.

> check:source_guard
| file | mode | pattern |
| --- | --- | --- |
| README.md | file_exists |  |
| README.md | fixed | held-out |
| README.md | fixed | intent |
| AGENTS.md | file_exists |  |
| AGENTS.md | fixed | standalone product boundary |
| package.json | file_exists |  |
| package.json | fixed | "lint" |
| package.json | fixed | "test" |
| eslint.config.mjs | file_exists |  |
| bin/cautilus | file_exists |  |
| bin/cautilus | fixed | adapter resolve |
| bin/cautilus | fixed | cautilus doctor |
| bin/cautilus | fixed | scenario propose |
| bin/cautilus | fixed | review variants |
| bin/cautilus.test.mjs | file_exists |  |
| skills/cautilus/SKILL.md | file_exists |  |
| skills/cautilus/agents/openai.yaml | file_exists |  |
| docs/workflow.md | fixed | Meta Eval |
| docs/workflow.md | fixed | Executor Variants |
| docs/contracts/adapter-contract.md | fixed | Dogfooding Pattern |
| docs/contracts/adapter-contract.md | fixed | Executor Variant Shape |
| docs/contracts/scenario-proposal-inputs.md | file_exists |  |
| docs/contracts/scenario-proposal-inputs.md | fixed | cautilus.scenario_proposal_inputs.v1 |
| scripts/resolve_adapter.py | fixed | workbench-adapter.yaml |
| scripts/init_adapter.py | fixed | dump_yaml_document |
| scripts/agent-runtime/scenario-history.mjs | file_exists |  |
| scripts/agent-runtime/scenario-history.mjs | fixed | SCENARIO_HISTORY_SCHEMA |
| scripts/agent-runtime/scenario-proposals.mjs | file_exists |  |
| scripts/agent-runtime/scenario-proposals.mjs | fixed | SCENARIO_PROPOSALS_SCHEMA |
| scripts/agent-runtime/generate-scenario-proposals.mjs | file_exists |  |
| scripts/agent-runtime/generate-scenario-proposals.mjs | fixed | SCENARIO_PROPOSAL_INPUTS_SCHEMA |
| scripts/agent-runtime/run-workbench-review-variant.sh | file_exists |  |
| scripts/agent-runtime/run-workbench-review-variant.sh | fixed | WORKBENCH_REVIEW_TIMEOUT_SECONDS |
| scripts/agent-runtime/run-workbench-executor-variants.mjs | file_exists |  |
| scripts/agent-runtime/run-workbench-executor-variants.mjs | fixed | --repo-root |
| fixtures/workbench/review-verdict.schema.json | file_exists |  |

## Runtime Expectations

`Cautilus`는 최소한 다음 runtime seam을 제공해야 한다.

- target repo의 adapter resolve
- target repo의 adapter scaffold
- target repo의 adapter readiness doctor
- scenario profile and graduation history helpers
- scenario proposal ranking and draft-scenario helpers
- scenario proposal packet generation command
- adapter-defined executor variants fanout
- checked-in standalone skill entrypoint
- structured review verdict schema
- local lint/test surface

아직 이 단계에서 강제하지 않는 것:

- admin web surface
- scenario persistence UI
- runtime-log mining implementation
- Ceal-specific prompt benchmark profiles

## Functional Check

local repo에서 최소 surface는 다음 명령으로 확인할 수 있어야 한다.

```run:shell
$ node ./bin/cautilus adapter resolve --repo-root .
$ node ./bin/cautilus doctor --repo-root . || true
$ node ./bin/cautilus scenario propose --input ./fixtures/scenario-proposals/standalone-input.json
$ node --test ./bin/cautilus.test.mjs
$ python3 ./scripts/init_adapter.py --repo-root /tmp/cautilus-spec-check --output /tmp/cautilus-spec-check/workbench-adapter.yaml --force
$ node --test ./scripts/agent-runtime/scenario-history.test.mjs
$ node --test ./scripts/agent-runtime/scenario-proposals.test.mjs
$ test -f ./skills/cautilus/SKILL.md
$ npm run lint
$ npm run test
```
