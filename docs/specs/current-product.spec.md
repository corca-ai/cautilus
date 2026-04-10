# Cautilus Current Product

`Cautilus`는 현재 repo-agnostic generic evaluation seam을 담는 초기
standalone product여야 한다.

지금 단계의 제품은 큰 admin UI나 scenario store가 아니라, contract + bootstrap + bounded runtime surface에 집중한다.

## Source Guard

현재 product boundary는 다음을 가져야 한다.

> check:source_guard
| file | mode | pattern |
| --- | --- | --- |
| README.md | file_exists |  |
| README.md | fixed | held-out |
| README.md | fixed | intentful behavior |
| AGENTS.md | file_exists |  |
| AGENTS.md | fixed | standalone product boundary |
| AGENTS.md | fixed | npm run verify |
| package.json | file_exists |  |
| package.json | fixed | "lint" |
| package.json | fixed | "test" |
| package.json | fixed | "verify" |
| eslint.config.mjs | file_exists |  |
| .github/workflows/verify.yml | file_exists |  |
| .github/workflows/verify.yml | fixed | npm run verify |
| .github/workflows/release-artifacts.yml | file_exists |  |
| .github/workflows/release-artifacts.yml | fixed | render-homebrew-formula.mjs |
| bin/cautilus | file_exists |  |
| .claude-plugin/marketplace.json | file_exists |  |
| .agents/plugins/marketplace.json | file_exists |  |
| plugins/cautilus/.claude-plugin/plugin.json | file_exists |  |
| plugins/cautilus/.codex-plugin/plugin.json | file_exists |  |
| bin/cautilus | fixed | adapter resolve |
| bin/cautilus | fixed | cautilus doctor |
| bin/cautilus | fixed | workspace prepare-compare |
| bin/cautilus | fixed | workspace prune-artifacts |
| bin/cautilus | fixed | scenario normalize chatbot |
| bin/cautilus | fixed | scenario normalize cli |
| bin/cautilus | fixed | scenario normalize skill |
| bin/cautilus | fixed | scenario prepare-input |
| bin/cautilus | fixed | scenario propose |
| bin/cautilus | fixed | evidence prepare-input |
| bin/cautilus | fixed | evidence bundle |
| bin/cautilus | fixed | report build |
| bin/cautilus | fixed | mode evaluate |
| bin/cautilus | fixed | optimize prepare-input |
| bin/cautilus | fixed | optimize propose |
| bin/cautilus | fixed | optimize build-artifact |
| bin/cautilus | fixed | cli evaluate |
| bin/cautilus | fixed | review prepare-input |
| bin/cautilus | fixed | review build-prompt-input |
| bin/cautilus | fixed | review render-prompt |
| bin/cautilus | fixed | review variants |
| bin/cautilus | fixed | --version |
| bin/cautilus.test.mjs | file_exists |  |
| skills/cautilus/SKILL.md | file_exists |  |
| skills/cautilus/agents/openai.yaml | file_exists |  |
| docs/workflow.md | fixed | Meta Eval |
| docs/workflow.md | fixed | Executor Variants |
| docs/contracts/adapter-contract.md | fixed | Dogfooding Pattern |
| docs/contracts/adapter-contract.md | fixed | Executor Variant Shape |
| docs/contracts/reporting.md | fixed | duration_ms |
| docs/contracts/reporting.md | fixed | cautilus.report_packet.v1 |
| docs/contracts/reporting.md | fixed | command_observations |
| fixtures/reports/report-input.json | file_exists |  |
| fixtures/reports/report-input.schema.json | file_exists |  |
| fixtures/reports/report.schema.json | file_exists |  |
| scripts/agent-runtime/build-report-packet.mjs | file_exists |  |
| scripts/agent-runtime/build-report-packet.mjs | fixed | REPORT_PACKET_SCHEMA |
| scripts/agent-runtime/evaluate-adapter-mode.mjs | file_exists |  |
| scripts/agent-runtime/evaluate-adapter-mode.mjs | fixed | ADAPTER_MODE_EVALUATION_PACKET_SCHEMA |
| scripts/agent-runtime/prepare-compare-worktrees.mjs | file_exists |  |
| scripts/agent-runtime/prepare-compare-worktrees.mjs | fixed | --baseline-ref |
| scripts/agent-runtime/prune-workspace-artifacts.mjs | file_exists |  |
| scripts/agent-runtime/prune-workspace-artifacts.mjs | fixed | --keep-last |
| fixtures/cli-evaluation/doctor-missing-adapter.json | file_exists |  |
| fixtures/cli-evaluation/input.schema.json | file_exists |  |
| scripts/agent-runtime/evaluate-cli-intent.mjs | file_exists |  |
| scripts/agent-runtime/evaluate-cli-intent.mjs | fixed | CLI_EVALUATION_PACKET_SCHEMA |
| scripts/agent-runtime/build-review-packet.mjs | file_exists |  |
| scripts/agent-runtime/build-review-packet.mjs | fixed | REVIEW_PACKET_SCHEMA |
| scripts/agent-runtime/build-review-prompt-input.mjs | file_exists |  |
| scripts/agent-runtime/build-review-prompt-input.mjs | fixed | REVIEW_PROMPT_INPUTS_SCHEMA |
| scripts/agent-runtime/render-review-prompt.mjs | file_exists |  |
| scripts/agent-runtime/render-review-prompt.mjs | fixed | renderReviewPrompt |
| scripts/agent-runtime/build-evidence-input.mjs | file_exists |  |
| scripts/agent-runtime/build-evidence-input.mjs | fixed | EVIDENCE_BUNDLE_INPUTS_SCHEMA |
| scripts/agent-runtime/build-evidence-bundle.mjs | file_exists |  |
| scripts/agent-runtime/build-evidence-bundle.mjs | fixed | EVIDENCE_BUNDLE_SCHEMA |
| scripts/agent-runtime/build-optimize-input.mjs | file_exists |  |
| scripts/agent-runtime/build-optimize-input.mjs | fixed | OPTIMIZE_INPUTS_SCHEMA |
| scripts/agent-runtime/generate-optimize-proposal.mjs | file_exists |  |
| scripts/agent-runtime/generate-optimize-proposal.mjs | fixed | OPTIMIZE_PROPOSAL_SCHEMA |
| scripts/agent-runtime/build-revision-artifact.mjs | file_exists |  |
| scripts/agent-runtime/build-revision-artifact.mjs | fixed | REVISION_ARTIFACT_SCHEMA |
| scripts/agent-runtime/scenario-results.mjs | file_exists |  |
| scripts/agent-runtime/scenario-results.mjs | fixed | SCENARIO_RESULTS_SCHEMA |
| scripts/agent-runtime/contract-versions.mjs | file_exists |  |
| scripts/agent-runtime/contract-versions.mjs | fixed | REVIEW_PROMPT_INPUTS_SCHEMA |
| scripts/agent-runtime/contract-versions.mjs | fixed | EVIDENCE_BUNDLE_SCHEMA |
| scripts/agent-runtime/contract-versions.mjs | fixed | OPTIMIZE_PROPOSAL_SCHEMA |
| scripts/agent-runtime/contract-versions.mjs | fixed | REVISION_ARTIFACT_SCHEMA |
| docs/contracts/scenario-proposal-inputs.md | file_exists |  |
| docs/contracts/scenario-proposal-inputs.md | fixed | cautilus.scenario_proposal_inputs.v1 |
| docs/contracts/scenario-proposal-normalization.md | file_exists |  |
| docs/contracts/scenario-proposal-normalization.md | fixed | scenario prepare-input |
| docs/contracts/cli-normalization.md | file_exists |  |
| docs/contracts/cli-normalization.md | fixed | cautilus.cli_normalization_inputs.v1 |
| docs/contracts/cli-evaluation.md | file_exists |  |
| docs/contracts/cli-evaluation.md | fixed | cautilus.cli_evaluation_packet.v1 |
| docs/contracts/review-packet.md | file_exists |  |
| docs/contracts/review-packet.md | fixed | cautilus.review_packet.v1 |
| docs/contracts/review-prompt-inputs.md | file_exists |  |
| docs/contracts/review-prompt-inputs.md | fixed | cautilus.review_prompt_inputs.v1 |
| docs/contracts/evidence-bundle.md | file_exists |  |
| docs/contracts/evidence-bundle.md | fixed | cautilus.evidence_bundle_inputs.v1 |
| docs/contracts/evidence-bundle.md | fixed | cautilus.evidence_bundle.v1 |
| docs/contracts/optimization.md | file_exists |  |
| docs/contracts/optimization.md | fixed | cautilus.optimize_inputs.v1 |
| docs/contracts/optimization.md | fixed | cautilus.optimize_proposal.v1 |
| docs/contracts/revision-artifact.md | file_exists |  |
| docs/contracts/revision-artifact.md | fixed | cautilus.revision_artifact.v1 |
| docs/contracts/scenario-results.md | file_exists |  |
| docs/contracts/scenario-results.md | fixed | cautilus.scenario_results.v1 |
| docs/contracts/scenario-history.md | fixed | durationMs |
| docs/release-boundary.md | file_exists |  |
| docs/release-boundary.md | fixed | Product-Owned Surface |
| docs/release-boundary.md | fixed | install.sh |
| docs/releasing.md | file_exists |  |
| docs/releasing.md | fixed | fetch-github-archive-sha256 |
| docs/consumer-readiness.md | file_exists |  |
| docs/consumer-readiness.md | fixed | All three repos now expose an official `cautilus-adapter` |
| docs/consumer-migration.md | file_exists |  |
| docs/consumer-migration.md | fixed | cautilus-adapter.yaml |
| scripts/check-specs.mjs | file_exists |  |
| scripts/agent-runtime/scenario-result-telemetry.mjs | file_exists |  |
| scripts/agent-runtime/scenario-result-telemetry.mjs | fixed | SCENARIO_TELEMETRY_SUMMARY_SCHEMA |
| scripts/agent-runtime/summarize-scenario-telemetry.mjs | file_exists |  |
| fixtures/scenario-proposals/results.json | file_exists |  |
| fixtures/scenario-results/example-results.json | file_exists |  |
| fixtures/scenario-results/results.schema.json | file_exists |  |
| fixtures/review/prompt-input.schema.json | file_exists |  |
| fixtures/evidence/input.schema.json | file_exists |  |
| fixtures/evidence/input.schema.json | fixed | cautilus.evidence_bundle_inputs.v1 |
| fixtures/evidence/bundle.schema.json | file_exists |  |
| fixtures/evidence/bundle.schema.json | fixed | cautilus.evidence_bundle.v1 |
| fixtures/optimize/input.schema.json | file_exists |  |
| fixtures/optimize/input.schema.json | fixed | cautilus.optimize_inputs.v1 |
| fixtures/optimize/proposal.schema.json | file_exists |  |
| fixtures/optimize/proposal.schema.json | fixed | cautilus.optimize_proposal.v1 |
| fixtures/optimize/revision-artifact.schema.json | file_exists |  |
| fixtures/optimize/revision-artifact.schema.json | fixed | cautilus.revision_artifact.v1 |
| fixtures/optimize/example-revision-artifact.json | file_exists |  |
| bin/cautilus | fixed | scenario summarize-telemetry |
| install.sh | file_exists |  |
| install.sh | fixed | CAUTILUS_VERSION |
| scripts/release/render-homebrew-formula.mjs | file_exists |  |
| scripts/release/render-homebrew-formula.mjs | fixed | renderHomebrewFormula |
| scripts/release/fetch-github-archive-sha256.mjs | file_exists |  |
| scripts/release/fetch-github-archive-sha256.mjs | fixed | fetchArchiveSha256 |
| scripts/release/resolve-release-targets.mjs | file_exists |  |
| scripts/release/resolve-release-targets.mjs | fixed | resolveReleaseTargets |
| scripts/resolve_adapter.py | fixed | cautilus-adapter.yaml |
| scripts/init_adapter.py | fixed | dump_yaml_document |
| scripts/agent-runtime/scenario-history.mjs | file_exists |  |
| scripts/agent-runtime/scenario-history.mjs | fixed | SCENARIO_HISTORY_SCHEMA |
| scripts/agent-runtime/chatbot-proposal-candidates.mjs | file_exists |  |
| scripts/agent-runtime/chatbot-proposal-candidates.mjs | fixed | normalizeChatbotProposalCandidates |
| scripts/agent-runtime/normalize-chatbot-proposals.mjs | file_exists |  |
| scripts/agent-runtime/normalize-chatbot-proposals.mjs | fixed | CHATBOT_NORMALIZATION_INPUTS_SCHEMA |
| scripts/agent-runtime/cli-proposal-candidates.mjs | file_exists |  |
| scripts/agent-runtime/cli-proposal-candidates.mjs | fixed | normalizeCliProposalCandidates |
| scripts/agent-runtime/normalize-cli-proposals.mjs | file_exists |  |
| scripts/agent-runtime/normalize-cli-proposals.mjs | fixed | CLI_NORMALIZATION_INPUTS_SCHEMA |
| scripts/agent-runtime/skill-proposal-candidates.mjs | file_exists |  |
| scripts/agent-runtime/skill-proposal-candidates.mjs | fixed | normalizeSkillProposalCandidates |
| scripts/agent-runtime/normalize-skill-proposals.mjs | file_exists |  |
| scripts/agent-runtime/normalize-skill-proposals.mjs | fixed | SKILL_NORMALIZATION_INPUTS_SCHEMA |
| scripts/agent-runtime/consumer-example-fixtures.test.mjs | file_exists |  |
| scripts/agent-runtime/consumer-example-fixtures.test.mjs | fixed | Ceal-shaped chatbot packet produces the expected proposal keys |
| scripts/agent-runtime/scenario-proposals.mjs | file_exists |  |
| scripts/agent-runtime/scenario-proposals.mjs | fixed | SCENARIO_PROPOSALS_SCHEMA |
| scripts/agent-runtime/build-scenario-proposal-input.mjs | file_exists |  |
| scripts/agent-runtime/build-scenario-proposal-input.mjs | fixed | buildScenarioProposalInput |
| scripts/agent-runtime/generate-scenario-proposals.mjs | file_exists |  |
| scripts/agent-runtime/generate-scenario-proposals.mjs | fixed | SCENARIO_PROPOSAL_INPUTS_SCHEMA |
| fixtures/scenario-proposals/input.schema.json | file_exists |  |
| fixtures/scenario-proposals/input.schema.json | fixed | cautilus.scenario_proposal_inputs.v1 |
| fixtures/scenario-proposals/proposals.schema.json | file_exists |  |
| fixtures/scenario-proposals/proposals.schema.json | fixed | cautilus.scenario_proposals.v1 |
| fixtures/scenario-proposals/chatbot-input.schema.json | file_exists |  |
| fixtures/scenario-proposals/chatbot-input.schema.json | fixed | cautilus.chatbot_normalization_inputs.v1 |
| fixtures/scenario-proposals/cli-input.schema.json | file_exists |  |
| fixtures/scenario-proposals/cli-input.schema.json | fixed | cautilus.cli_normalization_inputs.v1 |
| fixtures/scenario-proposals/skill-input.schema.json | file_exists |  |
| fixtures/scenario-proposals/skill-input.schema.json | fixed | cautilus.skill_normalization_inputs.v1 |
| fixtures/scenario-proposals/ceal-chatbot-input.json | file_exists |  |
| fixtures/scenario-proposals/charness-skill-input.json | file_exists |  |
| fixtures/scenario-proposals/crill-skill-input.json | file_exists |  |
| scripts/agent-runtime/run-workbench-review-variant.sh | file_exists |  |
| scripts/agent-runtime/run-workbench-review-variant.sh | fixed | WORKBENCH_REVIEW_TIMEOUT_SECONDS |
| scripts/agent-runtime/run-workbench-executor-variants.mjs | file_exists |  |
| scripts/agent-runtime/run-workbench-executor-variants.mjs | fixed | --repo-root |
| fixtures/workbench/review-verdict.schema.json | file_exists |  |

## Runtime Expectations

`Cautilus`는 현재 surface를 두 층으로 설명한다.
여기서 `Source Guard`는 standing cheap gate이고, 아래 `Functional Check`는
경계 수준의 실행 예시다. unit-suite 상세 나열은 `npm run test` 아래로 내린다.

### Core Validated Surface

- target repo의 adapter resolve
- target repo의 adapter scaffold
- target repo의 adapter readiness doctor
- explicit baseline/candidate git worktree preparation for A/B runs
- explicit artifact-root pruning for accumulated Cautilus run outputs
- adapter-defined mode execution that emits report packets directly
- checked-in scenario profile를 쓰는 mode run에서 scenario selection과
  history update를 product-owned path로 수행
- checked-in scenario profile를 쓰는 comparison run에서 baseline-cache
  seed와 cache key를 materialize
- review packet assembly for compare artifacts and human-review prompts
- explicit scenario-results packets and compare-artifact propagation through
  report/review flow
- review meta-prompt input packet and prompt renderer above the review packet
  boundary
- machine-readable report packet builder for held-out and full-gate telemetry
- bounded CLI intent evaluation surface with stdout/stderr/exit code and
  side-effect checks
- adapter-defined executor variants fanout
- checked-in standalone skill entrypoint
- structured review verdict schema
- explicit latency telemetry in executor-variant summaries
- tagged-release curl installer plus Homebrew formula render surface
- local lint/test surface

### Product-Owned Helper Surface

- normalized evidence-bundle input and merge helpers above host-owned raw
  readers
- bounded optimizer input and proposal helpers above explicit
  report/review/history evidence, with optimizer kind, budget, and trial
  telemetry
- durable revision-artifact builder above optimize proposals
- chatbot proposal-candidate normalization helper
- chatbot normalization command
- cli proposal-candidate normalization helper
- cli normalization command
- skill proposal-candidate normalization helper
- skill normalization command
- scenario proposal input packet assembly command
- scenario proposal ranking and draft-scenario helpers
- scenario proposal packet generation command
- checked-in schema artifacts for proposal and helper input/output packets
- checked-in dogfood packet examples across chatbot, skill-validation, and
  durable-workflow archetypes
- scenario-level telemetry summaries for cost and token transparency
- intentful behavior framing for chatbot, skill, and CLI surfaces

현재 baseline cache는 reusable result store까지는 아직 아니다.
다만 scenario-history의 comparison path는 baseline-cache seed와 cache key를
runtime이 직접 materialize한다. reusable baseline results와 broader
compare ownership은 아직 다음 step이다.

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
$ node ./bin/cautilus workspace prepare-compare --repo-root . --baseline-ref origin/main --output-dir /tmp/cautilus-compare || true
$ node ./bin/cautilus workspace prune-artifacts --root /tmp/cautilus-runs --keep-last 20 || true
$ node ./bin/cautilus scenario normalize chatbot --input ./fixtures/scenario-proposals/chatbot-input.json
$ node ./bin/cautilus scenario normalize cli --input ./fixtures/scenario-proposals/cli-input.json
$ node ./bin/cautilus scenario normalize skill --input ./fixtures/scenario-proposals/skill-input.json
$ node ./bin/cautilus scenario prepare-input --candidates ./fixtures/scenario-proposals/candidates.json --registry ./fixtures/scenario-proposals/registry.json --coverage ./fixtures/scenario-proposals/coverage.json --family fast_regression --window-days 14 --now 2026-04-11T00:00:00.000Z
$ node ./bin/cautilus scenario propose --input ./fixtures/scenario-proposals/standalone-input.json
$ node ./bin/cautilus scenario summarize-telemetry --results ./fixtures/scenario-results/example-results.json
$ node ./bin/cautilus report build --input ./fixtures/reports/report-input.json
$ node ./bin/cautilus mode evaluate --repo-root . --mode held_out --intent "CLI behavior should remain legible." --baseline-ref origin/main --output-dir /tmp/cautilus-mode || true
$ node ./bin/cautilus evidence prepare-input --report-file ./fixtures/reports/report-input.json --scenario-results-file ./fixtures/scenario-results/example-results.json || true
$ node ./bin/cautilus evidence bundle --input ./fixtures/evidence/example-input.json
$ node ./bin/cautilus optimize prepare-input --report-file ./fixtures/reports/report-input.json --target prompt --optimizer repair --budget light || true
$ node ./bin/cautilus optimize propose --input ./fixtures/optimize/example-input.json
$ node ./bin/cautilus optimize build-artifact --proposal-file ./fixtures/optimize/example-proposal.json --input-file ./fixtures/optimize/example-input.json
$ node ./bin/cautilus cli evaluate --input ./fixtures/cli-evaluation/doctor-missing-adapter.json
$ node ./bin/cautilus review prepare-input --repo-root . --report-file ./fixtures/reports/report-input.json || true
$ node ./bin/cautilus review build-prompt-input --review-packet /tmp/cautilus-mode/review.json || true
$ node ./bin/cautilus review render-prompt --input /tmp/cautilus-mode/review-prompt-input.json || true
$ python3 ./scripts/init_adapter.py --repo-root /tmp/cautilus-spec-check --output /tmp/cautilus-spec-check/cautilus-adapter.yaml --force
$ node ./bin/cautilus --version
$ npm run verify
```
