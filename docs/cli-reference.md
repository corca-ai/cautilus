# CLI Reference

Full command catalog for `cautilus`.
For the narrative overview, see the [README](../README.md).
For the shortest bootstrap loop on a fresh machine, see the Quick Start section in [README.md](../README.md).

## Install & lifecycle

```bash
# tagged-release install
curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh

# migrate a legacy Homebrew install onto the supported channel
brew uninstall cautilus
curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh

# install CLI + bundled skill into a host repo
cautilus install --repo-root /path/to/host-repo

# refresh the CLI and the checked-in bundled skill in a repo
cautilus update --repo-root /path/to/host-repo

# inspect local version provenance
cautilus version --verbose
```

`cautilus version --verbose` is also the quickest binary-only summary of what
`Cautilus` currently considers its product surface:
who it is for, which archetype to start from, and which report fields now matter
when a run rejects.

The lower-level compatibility command `cautilus skills install` remains available when a workflow needs to call the skill installer directly.
Legacy Homebrew installs are not a supported update channel anymore; remove them and reinstall through `install.sh` instead of mixing channels.

## Adapter bootstrap

```bash
# generate a minimal repo-local adapter scaffold
cautilus adapter init --repo-root .

# resolve and validate the adapter
cautilus adapter resolve --repo-root .
```

If you already know which evaluation surface your repo needs, start from the closest starter kit under [examples/starters/](../examples/starters/) instead of `cautilus adapter init`.
Each starter ships a pre-filled `cautilus-adapter.yaml`, a canonical input fixture, and a README that explains what to replace next.
Treat starter placeholders as bootstrap help, not as proof that a real consumer workflow is already wired.

A minimal adapter must wire at least one real runnable path to reach `doctor ready`:

```yaml
eval_test_command_templates:
  - node scripts/agent-runtime/run-local-eval-test.mjs --repo-root . --workspace {candidate_repo} --cases-file {eval_cases_file} --output-file {eval_observed_file} --artifact-dir {output_dir}/eval-test --backend {backend} --sandbox read-only
```

## Probes & discovery

```bash
# binary health, no repo required
cautilus healthcheck --json

# command discovery, safe for wrapper tooling and agent runtimes
cautilus commands --json

# no-input agent orientation over binary, adapter, agent-surface, and claim state
cautilus agent status --repo-root /path/to/repo --json

# repo readiness for evaluation
cautilus doctor --repo-root /path/to/repo

# one current onboarding step plus the exact continuation loop
cautilus doctor --repo-root /path/to/repo --next-action

# local agent-skill discoverability in a consumer repo
cautilus doctor --repo-root /path/to/repo --scope agent-surface

# declared-claim discovery and proof planning
cautilus claim discover --repo-root /path/to/repo --output /tmp/cautilus-claims.json
cautilus claim show --input /tmp/cautilus-claims.json --sample-claims 10
cautilus claim review prepare-input --claims /tmp/cautilus-claims.json --output /tmp/cautilus-claim-review-input.json
cautilus claim review apply-result --claims /tmp/cautilus-claims.json --review-result /tmp/cautilus-claim-review-result.json --output /tmp/cautilus-reviewed-claims.json
cautilus claim validate --claims /tmp/cautilus-reviewed-claims.json --output /tmp/cautilus-claim-validation.json
cautilus claim plan-evals --claims /tmp/cautilus-reviewed-claims.json --output /tmp/cautilus-eval-plan.json

# scenario-normalization catalog, for agents that need proposal-input examples
cautilus scenarios --json
```

`cautilus <subcommand> --help` exits `0` for the registered native command surface, including grouped topics such as `cautilus optimize search --help`.
Use `agent status --json` when a bundled skill or agent is invoked without a detailed task.
It emits `cautilus.agent_status.v1`: a read-only orientation packet over binary health, local agent-surface readiness, adapter state, claim-state availability, scan scope, and branch choices.
Use `doctor --next-action` when you want one current onboarding step plus the exact follow-up loop.
Use `doctor --scope agent-surface` to verify only the bundled skill and local agent-surface install.
Use default `doctor` (`--scope repo`) to verify the repo has a real runnable evaluation path.
When repo-scope `doctor` returns `ready`, the JSON payload includes `first_bounded_run`: a starter `eval test -> eval evaluate` packet loop plus the scenario-normalization catalog for agents that still need proposal-input examples.
When a repo intentionally keeps only named adapters under `.agents/cautilus-adapters/`, run `cautilus doctor --repo-root /path/to/repo --adapter-name <name>` for repo-scope validation instead of expecting plain `doctor` to guess which named adapter you mean.
Use `cautilus claim discover` before writing eval fixtures when you need to inventory declared behavior claims and decide whether each belongs in human review, deterministic CI, Cautilus eval, scenario proposal work, or alignment work.
Default discovery starts from adapter-owned claim entries or README.md/AGENTS.md/CLAUDE.md and follows repo-local Markdown links to depth 3.
Use `--previous <claims.json> --refresh-plan` for deterministic refresh planning inside the same discover workflow.
The refresh-plan packet includes `refreshSummary`, which gives agent-readable counts, changed claim source hotspots, and coordinator-facing next actions so agents do not need to infer the plan from raw packet fields.
The packet is `cautilus.claim_proof_plan.v1`, and it is a proof plan rather than a verdict.
Use `cautilus claim show --input <claims.json> --sample-claims <n>` to summarize an existing claim packet without rescanning and include bounded claim examples when an agent needs concrete candidates before choosing the next branch.
The summary includes `gitState`; when it reports `isStale=true`, run `cautilus claim discover --previous <claims.json> --refresh-plan` before review, review application, or eval planning.
Use `cautilus claim review prepare-input --claims <claims.json>` to prepare bounded deterministic review clusters for an agent or subagent.
It emits `cautilus.claim_review_input.v1` and does not call an LLM or mark claims satisfied.
Use `cautilus claim review apply-result --claims <claims.json> --review-result <review-result.json>` to merge reviewed labels and evidence refs back into a claim packet.
It emits an updated claim packet and rejects `evidenceStatus=satisfied` unless a direct or verified evidence ref supports the claim.
Use `cautilus claim validate --claims <claims.json>` to emit `cautilus.claim_validation_report.v1` and fail fast on invalid packet shape or evidence refs.
It does not mutate the packet or search for evidence.
Use `cautilus claim plan-evals --claims <reviewed-claims.json>` after review to turn ready `cautilus-eval` claims into `cautilus.claim_eval_plan.v1`.
That packet preserves claim ids, target eval surfaces, source refs, draft intents, and unresolved questions, but it deliberately does not write host-owned fixtures or runners.
`claim review prepare-input`, `claim review apply-result`, and `claim plan-evals` reject stale claim packets by default; `--allow-stale-claims` is an explicit operator override, not the normal agent path.

For the shortest end-to-end adoption proof in a fresh consumer repo:

```bash
npm run consumer:onboard:smoke
```

## Workbench

```bash
# list live consumer targets that this host repo exposes to Cautilus
cautilus workbench discover --repo-root /path/to/repo

# run one bounded live scenario request against one selected instance
cautilus workbench run-live \
  --repo-root /path/to/repo \
  --instance-id ceal \
  --request-file /tmp/request.json \
  --output-file /tmp/result.json

# turn draft scenarios into a canonical live-run request batch
cautilus workbench prepare-request-batch \
  --input /tmp/prepare-input.json \
  --output /tmp/request-batch.json

# run many explicit live scenario requests against one selected instance
cautilus workbench run-scenarios \
  --repo-root /path/to/repo \
  --instance-id ceal \
  --requests-file /tmp/request-batch.json \
  --output-file /tmp/batch-result.json \
  --concurrency 4
```

A workbench instance is one live consumer target on this host that `Cautilus` can select by stable id.
For a Ceal-like consumer, that may mean `ceal`, `ceal-dev`, or another named runtime.
For a simple adopter, the catalog may contain only one default instance.
`cautilus workbench discover` resolves either explicit adapter instances or a consumer-owned probe command into the same `cautilus.workbench_instance_catalog.v1` packet.
`cautilus workbench run-live` takes one selected instance id plus one request packet and returns one bounded result packet.
`cautilus workbench prepare-request-batch` is the new agent-facing prep surface above that seam: it turns either `cautilus.scenario.v1` draft scenarios or a normalized catalog-candidate packet into a canonical `cautilus.live_run_invocation_request_batch.v1` artifact.
`cautilus workbench run-scenarios` is the product-owned batch primitive above that seam: it accepts an explicit `cautilus.live_run_invocation_request_batch.v1` file for one selected instance, schedules the requests in-process, retries only when the batch packet asks for it and a prior attempt returned an explicit transient class, and writes one aggregated `cautilus.live_run_invocation_batch_result.v1` packet.
The product owns the packet boundary and status semantics.
The consumer still owns actual launch, auth, and runtime wiring through its adapter command.
When the adapter declares `consumer_single_turn_command_template`, the same command can also own a product-managed multi-turn chatbot loop above a consumer-owned single-turn seam.
That loop now allocates one stable per-request workspace directory at `<output_file>.d/workspace/` and exposes it through the `{workspace_dir}` placeholder across live-run command templates.
When the adapter also declares `workspace_prepare_command_template`, `Cautilus` runs that consumer-owned prepare command once before the first turn.
When the public scenario uses `simulator.kind: persona_prompt`, the adapter additionally provides `simulator_persona_command_template`, which normally calls `cautilus workbench run-simulator-persona` with repo-specific backend flags.
That keeps persona prompt shaping and result semantics product-owned while backend selection stays adapter-owned.
When the adapter declares `consumer_evaluator_command_template`, `Cautilus` also materializes one `cautilus.live_run_evaluator_input.v1` packet and expects one `cautilus.live_run_evaluator_result.v1` verdict back under `scenarioResult.evaluation`.
The batch flow keeps prep and execution separate on purpose: prep owns deterministic request synthesis plus explicit filter semantics, and `run-scenarios` owns concurrency, retry, transient-count aggregation, and per-attempt artifact layout for an explicit batch file.

## Workspace management

```bash
# start a fresh per-run subdirectory under one stable artifact root and pin it
eval "$(cautilus workspace start --label mode-held-out)"

# prepare clean baseline and candidate git worktrees for a compare run
cautilus workspace prepare-compare \
  --repo-root /path/to/repo \
  --baseline-ref origin/main \
  --output-dir /tmp/cautilus-compare

# prune older Cautilus artifact bundles
cautilus workspace prune-artifacts \
  --root /tmp/cautilus-runs \
  --keep-last 20
```

`workspace start` defaults `--root` to `./.cautilus/runs/` (auto-created on first use) and prints `export CAUTILUS_RUN_DIR=<absolute runDir>`.
Pass `--json` instead of `eval` when a script needs the machine-readable payload.
When `CAUTILUS_RUN_DIR` is already pinned, downstream commands (`workspace prepare-compare`, `eval test`) reuse that active `runDir`; if nothing is pinned they auto-materialize a fresh `runDir` and print `Active run: <path>` to stderr.

## Scenarios

```bash
# normalize chatbot-style conversation summaries
cautilus scenario normalize chatbot \
  --input ./fixtures/scenario-proposals/chatbot-input.json

# normalize skill-evaluation summaries
cautilus scenario normalize skill \
  --input /tmp/cautilus-skill-summary.json

# normalize durable-workflow run summaries
cautilus scenario normalize workflow \
  --input ./fixtures/scenario-proposals/workflow-input.json

# assemble a proposal-input packet from split normalized source files
cautilus scenario prepare-input \
  --candidates ./fixtures/scenario-proposals/candidates.json \
  --registry ./fixtures/scenario-proposals/registry.json \
  --coverage ./fixtures/scenario-proposals/coverage.json \
  --family fast_regression \
  --window-days 14 \
  --now 2026-04-11T00:00:00.000Z

# generate a scenario proposal packet from normalized input
cautilus scenario propose \
  --input ./fixtures/scenario-proposals/standalone-input.json

# build a scenario-centric conversation review packet from normalized chatbot threads
cautilus scenario review-conversations \
  --input ./fixtures/scenario-conversation-review/input.json

# render the conversation review packet into HTML
cautilus scenario render-conversation-review-html \
  --input /tmp/cautilus-scenario-review/conversation-review.json

# summarize scenario-level cost, token, and duration telemetry
cautilus scenario summarize-telemetry \
  --results ./fixtures/scenario-results/example-results.json
```

Every normalize command plus `cautilus eval evaluate` and `cautilus report build` accepts `--example-input`: it prints a minimal valid packet to stdout that can be piped back into the same command, so operators can inspect the expected shape without clicking into a fixture on GitHub.
`cautilus scenarios --json` now exposes those same inspect commands under `exampleInputCli` for each archetype.
`cautilus scenario propose` now preserves the full ranked `proposals` list in the canonical JSON output.
The same packet also emits an `attentionView`, which is a bounded human-facing shortlist derived from the full ranked set.
`cautilus scenario review-conversations` stays intentionally narrower than a generic audit UI.
It links normalized chatbot threads to scenario proposals and coverage hints so an operator can review behavior-eval evidence without browsing every live operator turn.

## Evaluation surfaces

The shipped surface is `cautilus eval` (see [docs/specs/evaluation-surfaces.spec.md](./specs/evaluation-surfaces.spec.md)).
The first preset, `dev / repo`, replaces the prior `cautilus instruction-surface` commands.
Cautilus exposes two top-level surfaces and four presets:
`dev / repo` for repo work contracts, `dev / skill` for checked-in or portable development skills, `app / chat` for multi-turn product conversation behavior, and `app / prompt` for single product input/output behavior.
`cautilus eval test` runs a checked-in fixture through an adapter-owned runner and then evaluates the observed packet.
`cautilus eval evaluate` evaluates an already-observed packet without launching the runner again.

```bash
# official on-demand self-dogfood wrapper for the repo's own AGENTS.md
npm run dogfood:self

# run a checked-in evaluation_input.v1 fixture through an adapter-owned runner
cautilus eval test \
  --repo-root . \
  --adapter-name self-dogfood-eval

# evaluate one observed eval packet
cautilus eval evaluate \
  --input ./eval-observed.json \
  --output /tmp/cautilus-eval-summary.json
```

The npm wrapper is the canonical maintainer-facing self-dogfood path for this repo.
For cheap fixture-backed product-surface smoke tests, use:

```bash
npm run dogfood:app-chat:fixture
npm run dogfood:app-chat:live
npm run dogfood:app-chat:claude
npm run dogfood:app-prompt:fixture
npm run dogfood:app-prompt:live
npm run dogfood:app-prompt:claude
```

The fixture variants prove the `app / chat` and `app / prompt` fixture translation, adapter runner, and evaluator packet paths.
The live variants run the same checked-in fixtures through Codex CLI in messaging mode.
The Claude variants run the same fixtures through Claude CLI in messaging mode, proving that the app surface is not tied to a single coding-agent CLI.

## Skill testing & evaluation

```bash
# run one checked-in local skill probe through an adapter-owned runner
# (cautilus.evaluation_input.v1 fixture with surface=dev, preset=skill)
cautilus eval test \
  --repo-root . \
  --adapter-name self-dogfood-eval-skill

# run the multi-turn Cautilus refresh-flow episode through the same eval seam
cautilus eval test \
  --repo-root . \
  --adapter-name self-dogfood-refresh-flow

# run the multi-turn Cautilus first-scan episode through the same eval seam
cautilus eval test \
  --repo-root . \
  --adapter-name self-dogfood-first-scan-flow

# run first scan, then prepare deterministic claim review input without reviewer launch
cautilus eval test \
  --repo-root . \
  --adapter-name self-dogfood-review-prepare-flow

# maintainer proof for both supported coding-agent CLI runtimes
npm run dogfood:cautilus-first-scan-flow:eval:codex
npm run dogfood:cautilus-first-scan-flow:eval:claude
npm run dogfood:cautilus-review-prepare-flow:eval:codex
npm run dogfood:cautilus-review-prepare-flow:eval:claude
npm run dogfood:cautilus-refresh-flow:eval:codex
npm run dogfood:cautilus-refresh-flow:eval:claude

# smoke the local skill routing path without recursively launching a model eval
cautilus eval test \
  --repo-root . \
  --adapter-name self-dogfood-eval-skill \
  --runtime fixture \
  --skip-preflight

# evaluate one normalized skill packet for trigger accuracy and execution quality
# (cautilus.skill_evaluation_inputs.v1 input)
cautilus eval evaluate \
  --input ./eval-observed.json \
  --output /tmp/cautilus-skill-summary.json
```

Use `--runtime fixture` when the goal is cheap command-routing proof over fixture-backed runner results.
It is not evidence that a model-backed skill execution is good; it is evidence that the Cautilus command surface, adapter, fixture translation, and packet evaluation path still line up.

## Reports

```bash
# build a machine-readable evaluation report packet from explicit mode runs
cautilus report build --input ./fixtures/reports/report-input.json
```

This command answers:
"what is the first product-owned decision packet for this candidate versus the
baseline?"

## Review

```bash
# assemble a durable review packet around a report
cautilus review prepare-input \
  --repo-root . \
  --report-file /tmp/cautilus-mode/report.json

# build the product-owned meta-prompt packet
cautilus review build-prompt-input \
  --review-packet /tmp/cautilus-mode/review.json

# with output-under-test evidence
cautilus review build-prompt-input \
  --review-packet /tmp/cautilus-mode/review.json \
  --output-under-test /tmp/cautilus-mode/analysis-output.json \
  --output-text-key analysis_text

# build from scenario replay
cautilus review build-prompt-input \
  --repo-root . \
  --adapter-name analysis-prompts \
  --scenario-file .agents/cautilus-scenarios/analysis-prompts/proposals.json \
  --scenario replay-negative-path \
  --output-under-test runs/latest/replay-review.json \
  --output-text-key analysis_text

# render the review prompt
cautilus review render-prompt \
  --input /tmp/cautilus-mode/review-prompt-input.json

# run every executor variant defined by an adapter
cautilus review variants \
  --repo-root /path/to/repo \
  --adapter-name code-quality \
  --workspace /path/to/repo \
  --scenario-file /path/to/scenario.json \
  --scenario replay-negative-path \
  --output-under-test /tmp/cautilus-mode/analysis-output.json \
  --output-text-key analysis_text \
  --output-dir /tmp/cautilus-review

# run an ad-hoc bounded review without first building a review packet
cautilus review variants \
  --repo-root /path/to/repo \
  --workspace /path/to/repo \
  --prompt-file /tmp/review.md \
  --schema-file /tmp/review.schema.json \
  --output-dir /tmp/cautilus-review
```

If you need a minimal valid report packet before review, run `cautilus report build --example-input`.
That example includes the minimum `humanReviewFindings` shape:
`{ "severity": "concern", "message": "...", "path": "optional" }`.

`review variants` writes a product-owned `review-summary.json` (`cautilus.review_summary.v1`) plus one per-variant `cautilus.review_variant_result.v1` file.
A variant can finish as `passed`, `blocked`, or `failed`; blocked runs carry machine-readable reason codes instead of prose-only abort text.
Local executor readiness failures such as missing auth are classified as blocked `unavailable_executor` results rather than negative review verdicts.
When at least one variant passes and another does not, the summary sets `partialSuccess: true` and lifts the passing outputs into `successfulVariantOutputs`.
When `--output-under-test` is present, the generated review prompt switches into `output_under_test` mode and treats the referenced artifact as primary evidence.
When `--output-text-key` is present, Cautilus also extracts that JSON narrative span into the rendered prompt so the judge can read the realized output directly.
This command answers:
"do multiple bounded reviewers agree with the current report, and what concrete
reason codes or warnings survive that second pass?"

## Evidence

```bash
# prepare normalized evidence input
cautilus evidence prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --scenario-results-file /tmp/cautilus-mode/scenario-results.json \
  --run-audit-file /tmp/cautilus-run-audit/summary.json \
  --history-file /tmp/cautilus-history/history.json

# build the evidence bundle
cautilus evidence bundle \
  --input /tmp/cautilus-evidence/input.json
```

This command answers:
"what single packet should I hand to the next decision step when report,
scenario, audit, and history evidence all matter together?"

## Optimization

`cautilus optimize` is the improvement front door.
Use it only after the claim and eval proof surface are explicit enough that an improvement loop has something honest to optimize against.
The bounded one-shot optimizer:

```bash
cautilus optimize prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --review-summary /tmp/cautilus-review/summary.json \
  --history-file /tmp/cautilus-history/history.json \
  --target prompt

cautilus optimize propose \
  --input /tmp/cautilus-optimize/input.json
```

For the GEPA-style bounded prompt search seam layered above that optimizer — multi-generation reflective mutation, held-out reevaluation, frontier selection — see [gepa.md](./gepa.md).

## Self-dogfood rendering

```bash
# refresh the static HTML view of the current checked-in self-dogfood bundle
cautilus self-dogfood render-html

# refresh the static HTML comparison view of the current latest experiments bundle
cautilus self-dogfood render-experiments-html
```

The rendered HTML is read-only over `summary.json`, `report.json`, and `review-summary.json`; those JSON files remain the source of truth.
For the npm wrappers and the full dogfood workflow, see [development.md](./maintainers/development.md).
These renderers answer:
"what should a human reviewer open first if they should inspect the same
decision surface without parsing raw JSON?"

## Plugin manifest validation

```bash
# validate the checked-in Claude marketplace and plugin manifest
claude plugins validate ./.claude-plugin/marketplace.json
claude plugins validate ./plugins/cautilus/.claude-plugin/plugin.json

# verify Codex can discover the repo-local marketplace entry
node ./scripts/release/check-codex-marketplace.mjs --repo-root .
```

## Direct script usage

Most underlying Node scripts are still runnable directly when a wrapper tool needs them without the `cautilus` binary.
Shipped runtime entrypoints such as `cautilus workbench discover` and `cautilus workbench run-live` are Go-owned now and should be called through the CLI instead of direct `node scripts/agent-runtime/...` paths.
Only the remaining wrapper and packet-builder utilities below should be invoked directly.

```bash
node scripts/resolve_adapter.mjs --repo-root .
node scripts/init_adapter.mjs --repo-root .
node scripts/agent-runtime/run-executor-variants.mjs --repo-root . --workspace . --output-dir /tmp/cautilus-review
node scripts/agent-runtime/build-scenario-proposal-input.mjs --candidates ./fixtures/scenario-proposals/candidates.json --registry ./fixtures/scenario-proposals/registry.json --coverage ./fixtures/scenario-proposals/coverage.json --family fast_regression
node scripts/agent-runtime/generate-scenario-proposals.mjs --input ./fixtures/scenario-proposals/standalone-input.json
node scripts/agent-runtime/build-evidence-input.mjs --report-file /tmp/cautilus-mode/report.json --scenario-results-file ./fixtures/scenario-results/example-results.json
node scripts/agent-runtime/build-evidence-bundle.mjs --input /tmp/cautilus-evidence/input.json
node scripts/agent-runtime/build-optimize-input.mjs --report-file /tmp/cautilus-mode/report.json --target prompt
node scripts/agent-runtime/generate-optimize-proposal.mjs --input /tmp/cautilus-optimize/input.json
node scripts/agent-runtime/summarize-scenario-telemetry.mjs --results ./fixtures/scenario-proposals/results.json
node scripts/agent-runtime/build-report-packet.mjs --input ./fixtures/reports/report-input.json
./bin/cautilus eval test --repo-root . --fixture fixtures/eval/app/prompt/cautilus-tagline.fixture.json --output-dir /tmp/cautilus-eval
```
