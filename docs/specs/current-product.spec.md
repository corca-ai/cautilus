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
| README.md | fixed | npm run dogfood:self |
| README.md | fixed | npm run dogfood:self:experiments |
| AGENTS.md | file_exists |  |
| AGENTS.md | fixed | standalone product boundary |
| AGENTS.md | fixed | npm run verify |
| AGENTS.md | fixed | npm run hooks:install |
| AGENTS.md | fixed | npm run hooks:check |
| package.json | file_exists |  |
| package.json | fixed | "hooks:install" |
| package.json | fixed | "hooks:check" |
| package.json | fixed | "dogfood:self" |
| package.json | fixed | "dogfood:self:experiments" |
| package.json | fixed | "lint" |
| package.json | fixed | "lint:go" |
| package.json | fixed | "security:govulncheck" |
| package.json | fixed | "test:go" |
| package.json | fixed | "test:go:race" |
| package.json | fixed | "test" |
| package.json | fixed | "vet:go" |
| package.json | fixed | "verify" |
| .agents/cautilus-adapter.yaml | file_exists |  |
| .agents/cautilus-adapter.yaml | fixed | npm run verify |
| .agents/cautilus-adapters/self-dogfood.yaml | file_exists |  |
| .agents/cautilus-adapters/self-dogfood.yaml | fixed | codex-review |
| .agents/cautilus-adapters/self-dogfood.yaml | fixed | review_timeout_ms |
| .agents/cautilus-adapters/self-dogfood.yaml | fixed | scripts/run-self-dogfood.mjs |
| .agents/cautilus-adapters/self-dogfood-binary-surface.yaml | file_exists |  |
| .agents/cautilus-adapters/self-dogfood-binary-surface.yaml | fixed | docs/consumer-readiness.md |
| .agents/cautilus-adapters/self-dogfood-binary-surface.yaml | fixed | scripts/run-self-dogfood.test.mjs |
| .agents/cautilus-adapters/self-dogfood-gate-honesty-a.yaml | file_exists |  |
| .agents/cautilus-adapters/self-dogfood-gate-honesty-b.yaml | file_exists |  |
| .agents/cautilus-adapters/self-dogfood-skill-surface.yaml | file_exists |  |
| .agents/cautilus-adapters/self-dogfood-review-completion.yaml | file_exists |  |
| .agents/quality-adapter.yaml | file_exists |  |
| .agents/quality-adapter.yaml | fixed | ./bin/cautilus adapter resolve --repo-root . |
| .agents/quality-adapter.yaml | fixed | npm run dogfood:self |
| .githooks/pre-push | file_exists |  |
| .githooks/pre-push | fixed | npm run verify |
| .gitignore | file_exists |  |
| .gitignore | fixed | !artifacts/self-dogfood/latest/summary.json |
| eslint.config.mjs | file_exists |  |
| .golangci.yml | file_exists |  |
| .golangci.yml | fixed | staticcheck |
| .golangci.yml | fixed | errorlint |
| .github/workflows/verify.yml | file_exists |  |
| .github/workflows/verify.yml | fixed | actions/setup-go@v5 |
| .github/workflows/verify.yml | fixed | go-version: "1.26.2" |
| .github/workflows/verify.yml | fixed | golangci/golangci-lint-action@ |
| .github/workflows/verify.yml | fixed | govulncheck@v1.1.4 |
| .github/workflows/verify.yml | fixed | npm run verify |
| .github/workflows/release-artifacts.yml | file_exists |  |
| .github/workflows/release-artifacts.yml | fixed | actions/setup-go@v5 |
| .github/workflows/release-artifacts.yml | fixed | go-version: "1.26.2" |
| .github/workflows/release-artifacts.yml | fixed | govulncheck@v1.1.4 |
| .github/workflows/release-artifacts.yml | fixed | render-homebrew-formula.mjs |
| .github/workflows/release-artifacts.yml | fixed | actions/attest@v4 |
| .github/workflows/release-artifacts.yml | fixed | subject-checksums: dist/cautilus-${{ github.ref_name }}-checksums.txt |
| go.mod | file_exists |  |
| go.mod | fixed | module github.com/corca-ai/cautilus |
| go.mod | fixed | toolchain go1.26.2 |
| cmd/cautilus/main.go | file_exists |  |
| cmd/cautilus/main.go | fixed | app.Run |
| bin/cautilus | fixed | CAUTILUS_TOOL_ROOT |
| bin/cautilus | fixed | exec go -C |
| internal/cli/command-registry.json | file_exists |  |
| internal/cli/command-registry.json | fixed | "path": ["version"] |
| internal/cli/command-registry.json | fixed | "path": ["install"] |
| internal/cli/command-registry.json | fixed | "path": ["update"] |
| internal/cli/command-registry.json | fixed | "path": ["skills", "install"] |
| internal/cli/command-registry.json | fixed | "path": ["workspace", "start"] |
| internal/cli/command-registry.json | fixed | "path": ["review", "variants"] |
| internal/cli/command-registry.json | fixed | cautilus version [--verbose] [--check] |
| internal/cli/command-registry.json | fixed | cautilus install [--repo-root <path>] [--overwrite] [--json] |
| internal/cli/command-registry.json | fixed | cautilus update [--repo-root <path>] [--json] |
| internal/cli/command-registry.json | fixed | cautilus skills install [--overwrite] |
| bin/cautilus | file_exists |  |
| .claude-plugin/marketplace.json | file_exists |  |
| .agents/plugins/marketplace.json | file_exists |  |
| plugins/cautilus/.claude-plugin/plugin.json | file_exists |  |
| plugins/cautilus/.codex-plugin/plugin.json | file_exists |  |
| bin/cautilus | fixed | CAUTILUS_CALLER_CWD |
| bin/cautilus.test.mjs | file_exists |  |
| bin/cautilus.test.mjs | fixed | repo shim forwards --version to the Go CLI entry |
| bin/cautilus.test.mjs | fixed | repo shim preserves caller cwd while resolving doctor against a consumer repo |
| bin/cautilus.test.mjs | fixed | repo shim keeps lifecycle install working from a consumer repo |
| skills/bundled.go | file_exists |  |
| skills/bundled.go | fixed | go:embed cautilus |
| internal/app/cli_smoke_test.go | file_exists |  |
| internal/app/cli_smoke_test.go | fixed | TestCLIRootSelfConsumerRepoStaysDoctorReady |
| internal/app/cli_smoke_test.go | fixed | TestCLIStandaloneTempRepoCanAdoptCautilusWithoutHostSpecificPaths |
| internal/app/cli_smoke_test.go | fixed | TestCLISkillsInstallCreatesRepoLocalCanonicalSkill |
| skills/cautilus/SKILL.md | file_exists |  |
| skills/cautilus/SKILL.md | fixed | cautilus install --repo-root . |
| skills/cautilus/SKILL.md | fixed | npm run dogfood:self |
| skills/cautilus/SKILL.md | fixed | npm run dogfood:self:experiments |
| skills/cautilus/agents/openai.yaml | file_exists |  |
| docs/workflow.md | fixed | Meta Eval |
| docs/workflow.md | fixed | Executor Variants |
| docs/contracts/adapter-contract.md | fixed | Dogfooding Pattern |
| docs/contracts/adapter-contract.md | fixed | Executor Variant Shape |
| docs/specs/self-dogfood.spec.md | file_exists |  |
| docs/contracts/behavior-intent.md | file_exists |  |
| docs/contracts/behavior-intent.md | fixed | cautilus.behavior_intent.v1 |
| docs/contracts/behavior-intent.md | fixed | operator_behavior |
| docs/contracts/behavior-intent.md | fixed | operator_workflow_recovery |
| docs/contracts/behavior-intent.md | fixed | operator_guidance_clarity |
| docs/contracts/behavior-intent.md | fixed | repair_explicit_regressions_first |
| docs/contracts/reporting.md | fixed | duration_ms |
| docs/contracts/reporting.md | fixed | cautilus.report_packet.v2 |
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
| scripts/agent-runtime/prune-workspace-artifacts.mjs | fixed | run.json |
| scripts/agent-runtime/workspace-start.mjs | file_exists |  |
| scripts/agent-runtime/workspace-start.mjs | fixed | cautilus.workspace_run_manifest.v1 |
| scripts/agent-runtime/workspace-start.mjs | fixed | RUN_MANIFEST_SCHEMA |
| scripts/agent-runtime/workspace-start.mjs | fixed | ACTIVE_RUN_ENV_VAR |
| scripts/agent-runtime/workspace-start.mjs | fixed | CAUTILUS_RUN_DIR |
| scripts/agent-runtime/workspace-start.mjs | fixed | DEFAULT_RUNS_ROOT |
| scripts/agent-runtime/workspace-start.mjs | fixed | renderShellExport |
| scripts/agent-runtime/workspace-start.mjs | fixed | startWorkspaceRun |
| scripts/agent-runtime/workspace-start.test.mjs | file_exists |  |
| scripts/agent-runtime/active-run.mjs | file_exists |  |
| scripts/agent-runtime/active-run.mjs | fixed | ACTIVE_RUN_ENV_VAR |
| scripts/agent-runtime/active-run.mjs | fixed | DEFAULT_RUNS_ROOT |
| scripts/agent-runtime/active-run.mjs | fixed | resolveRunDir |
| scripts/agent-runtime/active-run.test.mjs | file_exists |  |
| docs/contracts/active-run.md | file_exists |  |
| docs/contracts/active-run.md | fixed | CAUTILUS_RUN_DIR |
| docs/contracts/active-run.md | fixed | One Workflow = One runDir |
| docs/contracts/active-run.md | fixed | Canonical Filenames |
| docs/contracts/active-run.md | fixed | Rejected Alternatives |
| docs/contracts/active-run.md | fixed | cautilus.workspace_run_manifest.v1 |
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
| scripts/agent-runtime/behavior-intent.mjs | file_exists |  |
| scripts/agent-runtime/behavior-intent.mjs | fixed | BEHAVIOR_SURFACES |
| scripts/agent-runtime/behavior-intent.mjs | fixed | BEHAVIOR_DIMENSIONS |
| scripts/agent-runtime/contract-versions.mjs | file_exists |  |
| scripts/agent-runtime/contract-versions.mjs | fixed | BEHAVIOR_INTENT_SCHEMA |
| scripts/agent-runtime/contract-versions.mjs | fixed | REVIEW_PROMPT_INPUTS_SCHEMA |
| scripts/agent-runtime/contract-versions.mjs | fixed | EVIDENCE_BUNDLE_SCHEMA |
| scripts/agent-runtime/contract-versions.mjs | fixed | OPTIMIZE_PROPOSAL_SCHEMA |
| scripts/agent-runtime/contract-versions.mjs | fixed | REVISION_ARTIFACT_SCHEMA |
| scripts/install-git-hooks.mjs | file_exists |  |
| scripts/install-git-hooks.mjs | fixed | core.hooksPath |
| scripts/check-git-hooks.mjs | file_exists |  |
| scripts/check-git-hooks.mjs | fixed | hooks_path_configured |
| scripts/check-git-hooks.test.mjs | file_exists |  |
| scripts/run-govulncheck.mjs | file_exists |  |
| scripts/run-govulncheck.mjs | fixed | govulncheck was not found. |
| scripts/run-govulncheck.test.mjs | file_exists |  |
| scripts/run-self-dogfood.mjs | file_exists |  |
| scripts/run-self-dogfood.mjs | fixed | latest.md |
| scripts/run-self-dogfood.mjs | fixed | gateRecommendation |
| scripts/run-self-dogfood.mjs | fixed | reportRecommendation |
| scripts/self-dogfood-experiment-prompt.mjs | file_exists |  |
| scripts/self-dogfood-experiment-prompt.mjs | fixed | Current Run Evidence |
| scripts/self-dogfood-experiment-prompt.mjs | fixed | projected summary.json |
| scripts/self-dogfood-experiment-prompt.mjs | fixed | gateRecommendation |
| scripts/run-self-dogfood.test.mjs | file_exists |  |
| scripts/run-self-dogfood.test.mjs | fixed | root self-consumer quality path |
| scripts/run-self-dogfood-experiments.mjs | file_exists |  |
| scripts/run-self-dogfood-experiments.mjs | fixed | DEFAULT_EXPERIMENT_ADAPTERS |
| scripts/run-self-dogfood-experiments.mjs | fixed | gateRecommendation |
| scripts/run-self-dogfood-experiments.mjs | fixed | reportRecommendation |
| scripts/run-self-dogfood-experiments.test.mjs | file_exists |  |
| scripts/self-dogfood-experiment-prompt.mjs | file_exists |  |
| docs/contracts/scenario-proposal-inputs.md | file_exists |  |
| docs/contracts/scenario-proposal-inputs.md | fixed | cautilus.scenario_proposal_inputs.v1 |
| docs/contracts/scenario-proposal-normalization.md | file_exists |  |
| docs/contracts/scenario-proposal-normalization.md | fixed | scenario prepare-input |
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
| docs/version-provenance.md | file_exists |  |
| docs/version-provenance.md | fixed | CAUTILUS_NO_UPDATE_CHECK |
| docs/version-provenance.md | fixed | cautilus version --verbose |
| docs/releasing.md | file_exists |  |
| docs/releasing.md | fixed | fetch-github-archive-sha256 |
| docs/releasing.md | fixed | gh attestation verify |
| docs/consumer-readiness.md | file_exists |  |
| docs/consumer-readiness.md | fixed | This note intentionally groups evidence by consumer archetype |
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
| install.sh | file_exists |  |
| install.sh | fixed | releases/download/$VERSION/$ASSET_NAME |
| install.sh | fixed | need_cmd uname |
| scripts/release/binary-assets.mjs | file_exists |  |
| scripts/release/binary-assets.mjs | fixed | binaryAssetName |
| scripts/release/render-homebrew-formula.mjs | file_exists |  |
| scripts/release/render-homebrew-formula.mjs | fixed | renderHomebrewFormula |
| scripts/release/fetch-github-archive-sha256.mjs | file_exists |  |
| scripts/release/fetch-github-archive-sha256.mjs | fixed | fetchArchiveSha256 |
| scripts/release/resolve-release-targets.mjs | file_exists |  |
| scripts/release/resolve-release-targets.mjs | fixed | resolveReleaseTargets |
| scripts/resolve_adapter.mjs | fixed | cautilus-adapter.yaml |
| scripts/init_adapter.mjs | fixed | dumpYamlDocument |
| scripts/agent-runtime/scenario-history.mjs | file_exists |  |
| scripts/agent-runtime/scenario-history.mjs | fixed | SCENARIO_HISTORY_SCHEMA |
| scripts/agent-runtime/chatbot-proposal-candidates.mjs | file_exists |  |
| scripts/agent-runtime/chatbot-proposal-candidates.mjs | fixed | normalizeChatbotProposalCandidates |
| scripts/agent-runtime/normalize-chatbot-proposals.mjs | file_exists |  |
| scripts/agent-runtime/normalize-chatbot-proposals.mjs | fixed | CHATBOT_NORMALIZATION_INPUTS_SCHEMA |
| scripts/agent-runtime/skill-proposal-candidates.mjs | file_exists |  |
| scripts/agent-runtime/skill-proposal-candidates.mjs | fixed | normalizeSkillProposalCandidates |
| scripts/agent-runtime/normalize-skill-proposals.mjs | file_exists |  |
| scripts/agent-runtime/normalize-skill-proposals.mjs | fixed | SKILL_NORMALIZATION_INPUTS_SCHEMA |
| scripts/agent-runtime/consumer-example-fixtures.test.mjs | file_exists |  |
| scripts/agent-runtime/consumer-example-fixtures.test.mjs | fixed | chatbot-consumer packet produces the expected proposal keys |
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
| fixtures/scenario-proposals/skill-input.schema.json | file_exists |  |
| fixtures/scenario-proposals/skill-input.schema.json | fixed | cautilus.skill_normalization_inputs.v1 |
| fixtures/scenario-proposals/chatbot-consumer-input.json | file_exists |  |
| fixtures/scenario-proposals/skill-validation-input.json | file_exists |  |
| fixtures/scenario-proposals/workflow-recovery-input.json | file_exists |  |
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
- explicit per-run workspace directory materialization under one artifact root,
  so consumer commands share a single `--output-dir` convention
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
- adapter-defined executor variants fanout
- explicit self-dogfood runner that refreshes the latest local report bundle
- explicit self-dogfood experiment runner that compares named tuning adapters
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
- skill proposal-candidate normalization helper
- skill normalization command
- scenario proposal input packet assembly command
- scenario proposal ranking and draft-scenario helpers
- scenario proposal packet generation command
- checked-in schema artifacts for proposal and helper input/output packets
- checked-in dogfood packet examples across chatbot, skill-validation, and
  durable-workflow archetypes
- scenario-level telemetry summaries for cost and token transparency
- intentful behavior framing for chatbot, skill, and durable-workflow surfaces

현재 baseline cache는 reusable result store까지는 아직 아니다.
다만 scenario-history의 comparison path는 baseline-cache seed와 cache key를
runtime이 직접 materialize한다. reusable baseline results와 broader
compare ownership은 아직 다음 step이다.

아직 이 단계에서 강제하지 않는 것:

- admin web surface
- scenario persistence UI
- runtime-log mining implementation
- host-specific prompt benchmark profiles

## Functional Check

local repo에서 최소 surface는 다음 명령으로 확인할 수 있어야 한다.

```run:shell
$ cautilus adapter resolve --repo-root .
$ cautilus doctor --repo-root .
$ cautilus workspace prepare-compare --repo-root . --baseline-ref origin/main --output-dir /tmp/cautilus-compare || true
$ cautilus workspace prune-artifacts --root /tmp/cautilus-runs --keep-last 20 || true
$ mkdir -p /tmp/cautilus-runs
$ cautilus workspace start --root /tmp/cautilus-runs --label mode-held-out --json || true
$ cautilus scenario normalize chatbot --input ./fixtures/scenario-proposals/chatbot-input.json
$ cautilus scenario normalize skill --input ./fixtures/scenario-proposals/skill-input.json
$ cautilus scenario prepare-input --candidates ./fixtures/scenario-proposals/candidates.json --registry ./fixtures/scenario-proposals/registry.json --coverage ./fixtures/scenario-proposals/coverage.json --family fast_regression --window-days 14 --now 2026-04-11T00:00:00.000Z
$ cautilus scenario propose --input ./fixtures/scenario-proposals/standalone-input.json
$ cautilus scenario summarize-telemetry --results ./fixtures/scenario-results/example-results.json
$ cautilus report build --input ./fixtures/reports/report-input.json
$ cautilus mode evaluate --repo-root . --mode held_out --intent "Operator-facing behavior should remain legible." --baseline-ref origin/main --output-dir /tmp/cautilus-mode || true
$ cautilus evidence prepare-input --report-file ./fixtures/reports/report-input.json --scenario-results-file ./fixtures/scenario-results/example-results.json || true
$ cautilus evidence bundle --input ./fixtures/evidence/example-input.json
$ cautilus optimize prepare-input --report-file ./fixtures/reports/report-input.json --target prompt --optimizer repair --budget light || true
$ cautilus optimize propose --input ./fixtures/optimize/example-input.json
$ cautilus optimize build-artifact --proposal-file ./fixtures/optimize/example-proposal.json --input-file ./fixtures/optimize/example-input.json
$ cautilus review prepare-input --repo-root . --report-file ./fixtures/reports/report-input.json || true
$ cautilus review build-prompt-input --review-packet /tmp/cautilus-mode/review.json || true
$ cautilus review render-prompt --input /tmp/cautilus-mode/review-prompt-input.json || true
$ node ./scripts/init_adapter.mjs --repo-root /tmp/cautilus-spec-check --output /tmp/cautilus-spec-check/cautilus-adapter.yaml --force
$ cautilus --version
$ cautilus version --verbose
$ npm run verify
$ npm run dogfood:self
$ npm run dogfood:self:experiments
```
