# Adapter Contract

`Cautilus` stays portable by loading repo-specific evaluation commands from an adapter instead of hardcoding benchmark runners into the workflow.
Use one default adapter for the repo's primary benchmark surface, then add named adapters when the repo needs extra surfaces such as `code-quality`, `skill-smoke`, or `meta-eval`.
When the operator wants clean git-ref A/B workspaces, use the product-owned helper instead of copying repo-local `git worktree` shell glue:

```bash
cautilus workspace prepare-compare \
  --repo-root . \
  --baseline-ref origin/main \
  --output-dir /tmp/cautilus-compare
```

Search order:

1. `.agents/cautilus-adapter.yaml`
2. `.codex/cautilus-adapter.yaml`
3. `.claude/cautilus-adapter.yaml`
4. `docs/cautilus-adapter.yaml`
5. `cautilus-adapter.yaml`

Named adapter search order for `--adapter-name <name>`:

1. `.agents/cautilus-adapters/<name>.yaml`
2. `.codex/cautilus-adapters/<name>.yaml`
3. `.claude/cautilus-adapters/<name>.yaml`
4. `docs/cautilus-adapters/<name>.yaml`
5. `cautilus-adapters/<name>.yaml`

## Minimal Shape

```yaml
version: 1
repo: example-repo
evaluation_surfaces:
  - prompt behavior
baseline_options:
  - baseline git ref in the same repo via {baseline_ref}
required_prerequisites:
  - choose a real baseline before comparing results
preflight_commands:
  - npm run check
runtime_policy:
  mode: observe
evaluation_input_default: fixtures/eval/dev/repo/example.fixture.json
eval_test_command_templates:
  - node scripts/agent-runtime/run-local-eval-test.mjs --repo-root . --workspace {candidate_repo} --cases-file {eval_cases_file} --output-file {eval_observed_file} --artifact-dir {output_dir}/eval-test --backend {backend} --sandbox read-only
claim_discovery:
  entries:
    - README.md
    - AGENTS.md
  linked_markdown_depth: 3
  include:
    - docs/**/*.md
  exclude:
    - artifacts/**
    - node_modules/**
  state_path: .cautilus/claims/latest.json
  evidence_roots:
    - docs/specs
    - fixtures
  audience_hints:
    user:
      - README.md
      - docs/guides/**
    developer:
      - AGENTS.md
      - docs/internal/**
  semantic_groups:
    - label: Product promises
      terms:
        - user
        - promise
        - behavior
    - label: Quality gates
      terms:
        - test
        - lint
        - verify
instance_discovery:
  kind: explicit
  instances:
    - id: default
      display_label: Local Default
      data_root: /Users/operator/.example-repo/default
      paths:
        scenario_store: /Users/operator/.example-repo/default/scenarios.json
        scenario_results: /Users/operator/.example-repo/default/simulation-results
  required_prerequisites:
    - keep instance ids stable and keep typed paths machine-readable
live_run_invocation:
  command_template: cautilus workbench run-live --repo-root {repo_root} --adapter {adapter_path} --instance-id {instance_id} --request-file {request_file} --output-file {output_file}
  consumer_single_turn_command_template: node scripts/consumer/run-live-turn.mjs --repo-root {repo_root} --adapter-path {adapter_path} --instance-id {instance_id} --request-file {request_file} --turn-request-file {turn_request_file} --turn-result-file {turn_result_file}
  workspace_prepare_command_template: node scripts/consumer/prepare-live-run-workspace.mjs --repo-root {repo_root} --adapter-path {adapter_path} --instance-id {instance_id} --request-file {request_file} --workspace-dir {workspace_dir}
  simulator_persona_command_template: cautilus workbench run-simulator-persona --workspace {repo_root} --simulator-request-file {simulator_request_file} --simulator-result-file {simulator_result_file} --backend fixture --fixture-results-file fixtures/live-run/persona-fixture.json
  consumer_evaluator_command_template: node scripts/consumer/evaluate-live-run.mjs --repo-root {repo_root} --adapter-path {adapter_path} --request-file {request_file} --input-file {evaluator_input_file} --output-file {evaluation_output_file}
  required_prerequisites:
    - keep invocation bounded to one selected local instance and one request packet
optimize_search:
  default_budget: medium
  budgets:
    light:
      generation_limit: 1
      population_limit: 3
      mutation_batch_size: 3
      review_checkpoint_policy: final_only
      merge_enabled: false
      three_parent_policy: coverage_expansion
    medium:
      generation_limit: 2
      population_limit: 5
      mutation_batch_size: 4
      review_checkpoint_policy: frontier_promotions
      merge_enabled: false
      three_parent_policy: coverage_expansion
    heavy:
      generation_limit: 3
      population_limit: 8
      mutation_batch_size: 5
      review_checkpoint_policy: frontier_promotions
      merge_enabled: false
      three_parent_policy: coverage_expansion
  selection_policy:
    primary_objective: held_out_behavior
    tie_breakers:
      - shorter_target
      - lower_cost
      - lower_latency
    constraint_caps: {}
executor_variants:
  - id: codex-review
    tool: codex_exec
    purpose: independent structured review pass
    command_template: 'cat {prompt_file} | codex exec -C {candidate_repo} --sandbox read-only --ephemeral --output-schema {schema_file} -o {output_file} -'
    required_prerequisites:
      - render the review instructions into {prompt_file} before execution
      - point {candidate_repo} at the exact repo or temp workspace under review
    safety_notes:
      - prefer a clean worktree or read-only temp copy over the live checkout
      - keep the verdict schema in {schema_file} and the final JSON in {output_file}
      - the schema should allow an explicit blocked payload with reason code and reason when bounded review evidence is insufficient
      - do not use bypass-approval or danger-full-access flags for review-only loops
  - id: claude-review
    tool: claude_print
    purpose: independent structured review pass
    command_template: 'claude -p --no-session-persistence --tools "" --output-format json --json-schema "$(cat {schema_file})" < {prompt_file} > {output_file}'
    required_prerequisites:
      - render the review instructions into {prompt_file} before execution
      - run only inside a trusted checkout because -p skips the trust dialog
    safety_notes:
      - prefer self-contained prompts or explicitly bounded attached context
      - keep tools disabled unless the prompt truly needs repo reads
      - allow a schema-compliant blocked payload when the prompt packet is insufficient for a bounded verdict
      - do not use dangerously-skip-permissions flags for review-only loops
      - normalize structured_output if the JSON response is wrapped
artifact_paths:
  - docs/evaluation-plan.md
report_paths:
  - reports/cautilus/latest.json
comparison_questions:
  - Which scenarios improved or regressed?
human_review_prompts:
  - id: real-user
    prompt: Where would a real user still judge the candidate worse despite benchmark wins?
review_timeout_ms: 30000
history_file_hint: /tmp/cautilus-history.json
profile_default: default
default_prompt_file: fixtures/review/skill-smoke.prompt.md
default_schema_file: fixtures/review/review-verdict.schema.json
```

## Fields

- `version`: adapter schema version.
- `repo`: human-readable repo name.
- `evaluation_surfaces`: what kinds of behavior the evaluator is judging.
- `baseline_options`: allowed baseline choices and how the agent should think about them.
- `required_prerequisites`: conditions that should stop the evaluation early.
- `preflight_commands`: fast commands to run before long evaluations.
- `runtime_policy`: optional runtime identity policy.
  `mode: observe` is the default and records runtime identity without blocking ordinary default-runtime changes.
  `mode: pinned` requires declared runtime fields to match observed `telemetry.runtimeFingerprint` fields and should block with `model_runtime_pinned_mismatch` when they do not.
- `evaluation_input_default`: optional checked-in `cautilus.evaluation_input.v1` path used by `cautilus eval test` when the operator does not pass `--fixture`.
- `eval_test_command_templates`: commands that turn the validated fixture's translated case suite into an observed `cautilus.evaluation_observed.v1` packet.
- `default_runtime`: optional runtime choice (`codex`, `claude`, or `fixture`), defaults to `codex`. Overridden by `cautilus eval test --runtime`.
- `claim_discovery`: optional bounded truth-surface configuration for `cautilus claim discover`.
  `entries` replaces the product default entry set (`README.md`, `AGENTS.md`, and `CLAUDE.md` when present).
  `linked_markdown_depth` defaults to `3` and controls repo-local Markdown link traversal from those entries.
  `include` and `exclude` are repo-relative glob filters applied to discovered Markdown sources.
  `state_path` tells agents where the repo expects the current claim-state packet to live.
  `evidence_roots` declares repo-relative roots worth checking during later evidence reconciliation; it does not prove claims by itself.
  `audience_hints` optionally maps discovered sources into `user` and `developer` claim audiences.
  The binary uses these hints to label review queues, while the bundled skill or a human reviewer may still correct semantic edge cases.
  `semantic_groups` optionally declares repo-owned review batching labels and text terms.
  If omitted, discovery uses the portable fallback group `General product behavior` instead of assuming a product-specific taxonomy.
- `instance_discovery`: optional local-first instance routing contract for future workbench flows.
  Use `kind: explicit` when the adapter can check in a small stable instance list directly.
  Use `kind: command` when the consumer must probe one or more host-local roots at runtime and print `cautilus.workbench_instance_catalog.v1` to stdout.
- `live_run_invocation`: optional command contract for running one bounded scenario packet against one selected live instance.
- `executor_variants`: optional backend-specific review or simulation runners.
- `optimize_search`: optional repo-owned defaults for `cautilus optimize search`.
  The product still owns the shared tier labels `light`, `medium`, and `heavy`.
  The adapter may override the repo's default budget tier, per-tier numeric limits, review checkpoint defaults, and selection policy.
  `merge_enabled` and `three_parent_policy` are currently preserved into the canonical search packet for replay and future expansion, but the current runner does not yet synthesize merge candidates from them.
- `artifact_paths`: code or docs the evaluator should inspect while interpreting results.
- `report_paths`: machine-readable or HTML output paths worth checking after runs.
- `comparison_questions`: prompts to keep result interpretation focused on real deltas.
- `human_review_prompts`: lenses that test whether benchmark wins survive human judgment.
- `review_timeout_ms`: optional bounded timeout for executor-variant review runs that this adapter expects by default.
- `history_file_hint`: default history file path when the workflow uses graduation or cadence.
- `profile_default`: default scenario profile reference when the backend supports profiles.
  This may stay an opaque profile label, or it may point at a checked-in `cautilus.scenario_profile.v1` file for product-owned selection/history integration.
- `default_prompt_file`: optional checked-in prompt path for executor-variant review runs.
- `default_schema_file`: optional checked-in schema path for executor-variant review runs.

## Instance Discovery Shape

Future workbench flows need one neutral way to enumerate consumer instances and route follow-up reads or invocations by a stable instance id.
The adapter therefore may declare one optional `instance_discovery` stanza.

Command-backed discovery:

```yaml
instance_discovery:
  kind: command
  command_template: node scripts/consumer/discover-workbench-instances.mjs --repo-root {repo_root} --adapter-path {adapter_path}
  required_prerequisites:
    - keep stdout machine-readable and reserve stderr for operator hints
```

Explicit discovery:

```yaml
instance_discovery:
  kind: explicit
  instances:
    - id: ceal
      display_label: Ceal Production
      data_root: /Users/operator/.ceal/ceal
      paths:
        scenario_store: /Users/operator/.ceal/ceal/scenarios.json
        conversation_summaries: /Users/operator/.ceal/ceal/human-conversations/normalized
        scenario_results: /Users/operator/.ceal/ceal/simulation-results
```

Fixed rules:

- Every discovered instance needs a stable `id` plus a human-facing `display_label`.
- Every discovered instance must expose either one `data_root`, one or more typed `paths`, or both.
- `kind: command` is the default fit for consumers that enumerate multiple host-local instances dynamically.
- `kind: explicit` keeps fixture-backed repos and simple single-instance adopters cheap without forcing a probe script.
- `command_template` should print `cautilus.workbench_instance_catalog.v1` JSON to stdout.
`cautilus workbench discover` resolves either `kind: explicit` or `kind: command` into the canonical catalog packet.
When the adapter uses `kind: command`, point `command_template` directly at a consumer-owned probe command instead of wrapping the product command around itself.

Current placeholders for `instance_discovery.command_template`:

- `{repo_root}`
- `{adapter_path}`

See [workbench-instance-discovery.md](./workbench-instance-discovery.md) for the packet contract that both `explicit` and `command` discovery normalize to.

## Live Run Invocation Shape

Once the product has one selected instance id, it needs one neutral way to ask the consumer to run a bounded packet against that instance without copying consumer-specific HTTP routes into `Cautilus`.
The adapter may therefore declare one optional `live_run_invocation` stanza.

```yaml
live_run_invocation:
  command_template: cautilus workbench run-live --repo-root {repo_root} --adapter {adapter_path} --instance-id {instance_id} --request-file {request_file} --output-file {output_file}
  consumer_single_turn_command_template: node scripts/consumer/run-live-turn.mjs --repo-root {repo_root} --adapter-path {adapter_path} --instance-id {instance_id} --request-file {request_file} --turn-request-file {turn_request_file} --turn-result-file {turn_result_file}
  workspace_prepare_command_template: node scripts/consumer/prepare-live-run-workspace.mjs --repo-root {repo_root} --adapter-path {adapter_path} --instance-id {instance_id} --request-file {request_file} --workspace-dir {workspace_dir}
  simulator_persona_command_template: cautilus workbench run-simulator-persona --workspace {repo_root} --simulator-request-file {simulator_request_file} --simulator-result-file {simulator_result_file} --backend fixture --fixture-results-file fixtures/live-run/persona-fixture.json
  consumer_evaluator_command_template: node scripts/consumer/evaluate-live-run.mjs --repo-root {repo_root} --adapter-path {adapter_path} --request-file {request_file} --input-file {evaluator_input_file} --output-file {evaluation_output_file}
  required_prerequisites:
    - keep invocation bounded to one selected local instance and one request packet
```

Fixed rules:

- The command handles exactly one selected `instance_id` per invocation.
- `command_template` may point at the product-owned `cautilus workbench run-live` command.
  For the legacy one-shot path, that command must then receive a consumer-owned `consumer_command_template` to avoid recursive self-invocation.
  For the product-owned chatbot loop, it must instead receive `consumer_single_turn_command_template`.
  When the public request uses `simulator.kind: persona_prompt`, it must also receive `simulator_persona_command_template`.
  The canonical path is the product-owned `cautilus workbench run-simulator-persona` helper plus adapter-selected backend flags.
- When the product-owned chatbot loop is active, `Cautilus` allocates one stable workspace directory at `<output_file>.d/workspace/`.
  If `workspace_prepare_command_template` is present, `Cautilus` runs it once per request before the first turn.
- The command reads one request packet from `request_file`.
- The command writes one `cautilus.live_run_invocation_result.v1` packet to `output_file`.
- When `consumer_evaluator_command_template` is present, `Cautilus` writes one `cautilus.live_run_evaluator_input.v1` packet and expects one `cautilus.live_run_evaluator_result.v1` packet back.
- The packet owns scenario execution intent.
  The consumer still owns runtime wiring, auth, secrets, and host-specific launch details.

Current placeholders for `live_run_invocation.command_template`:

- `{repo_root}`
- `{adapter_path}`
- `{instance_id}`
- `{request_file}`
- `{output_file}`
- `{workspace_dir}`

Current placeholders for `live_run_invocation.consumer_command_template`:

- `{repo_root}`
- `{adapter_path}`
- `{instance_id}`
- `{request_file}`
- `{output_file}`
- `{workspace_dir}`

Current placeholders for `live_run_invocation.consumer_single_turn_command_template`:

- `{repo_root}`
- `{adapter_path}`
- `{instance_id}`
- `{request_file}`
- `{turn_request_file}`
- `{turn_result_file}`
- `{workspace_dir}`

Current placeholders for `live_run_invocation.workspace_prepare_command_template`:

- `{repo_root}`
- `{adapter_path}`
- `{instance_id}`
- `{request_file}`
- `{output_file}`
- `{workspace_dir}`

Current placeholders for `live_run_invocation.simulator_persona_command_template`:

- `{repo_root}`
- `{adapter_path}`
- `{instance_id}`
- `{request_file}`
- `{simulator_request_file}`
- `{simulator_result_file}`
- `{workspace_dir}`

Current placeholders for `live_run_invocation.consumer_evaluator_command_template`:

- `{repo_root}`
- `{adapter_path}`
- `{request_file}`
- `{evaluator_input_file}`
- `{transcript_file}`
- `{evaluation_output_file}`
- `{workspace_dir}`

Use `{evaluator_input_file}` as the canonical evaluator input placeholder.
`{transcript_file}` remains available only as a compatibility escape hatch for older adapters.

See [live-run-invocation.md](./live-run-invocation.md) for the request/result packet contract.

## Dogfooding Pattern

To evaluate a skill, adapter, or workflow with `Cautilus` itself, add a named adapter instead of overloading the repo's default adapter.
Named adapters are not second-class.
When one named self-dogfood surface becomes an official on-demand proof path, give it a repo-owned wrapper command and document that wrapper as the canonical entrypoint for operators.

Example names:

- `code-quality`
- `skill-smoke`
- `skill-test`
- `eval`
- `self-dogfood`
- `meta-eval`

Each named adapter should define its own:

- task surface
- command templates
- artifacts to inspect
- human review prompts
- optional `optimize_search` defaults when that surface needs a different bounded search policy from the repo root adapter

This keeps prompt benchmarking, code-quality benchmarking, and workflow smoke tests from collapsing into one overloaded adapter file.
When a repo runs review variants repeatedly, add a checked-in wrapper that loads the adapter and fans out `executor_variants`, but keep it as a thin delegate to `cautilus review variants` instead of letting it become a second runtime authority.

## Split Criteria

Keep one root `cautilus-adapter.yaml` only while it stays the repo's obvious default evaluation entrypoint.
Split work into named `cautilus-adapters/` when one or more of these become true:

- the root file is trying to represent more than one operator decision, such as release gating and workflow smoke validation
- different evaluation surfaces need different prompt/schema bundles or different `executor_variants`
- iterate, held-out, or full-gate commands stop sharing the same baseline and artifact interpretation story
- one surface would benefit from a narrower default recommendation or a different human-review lens
- operators can no longer tell which command path is the safe default without reading the whole adapter file

Do not split just because a repo already has other host-local `*-adapter.yaml` files.
Split only when `Cautilus` itself would become less legible or less bounded if the root adapter kept absorbing more surfaces.

### Compare Artifact Pattern

A named adapter whose eval-test commands produce rich scenario-by-scenario signals should also persist them as files so executor variants and human reviewers can ground their verdicts on the same numbers.

Recommended shape:

- emit `compare-report.md` and `compare-report.json` into a repo-local path
- compute one verdict per entry in `comparison_questions` and include the supporting signals inline in both artifacts
- point review prompts at the same path so human and machine review can refer to the same compare output

## Executor Variant Shape

Each executor variant should make the execution surface and the safety contract explicit:

```yaml
executor_variants:
  - id: codex-review
    tool: codex_exec
    purpose: independent structured review pass
    command_template: bash scripts/agent-runtime/run-review-variant.sh --backend codex_exec --workspace {candidate_repo} --prompt-file {prompt_file} --schema-file {schema_file} --output-file {output_file}
    required_prerequisites:
      - render the review instructions into {prompt_file} before execution
      - point {candidate_repo} at the exact workspace under review
    safety_notes:
      - prefer wrapper scripts over raw shell when schema injection or quoting gets brittle
      - keep review loops read-only and bounded
      - leave a companion stderr file such as {output_file}.stderr
```

Required fields:

- `id`: stable identifier used in reports
- `tool`: executor family, for example `codex_exec`, `claude_print`, or `command`
- `command_template`: checked-in command or wrapper invocation

Command-template placeholders currently include:

- `{candidate_repo}`
- `{prompt_file}`
- `{schema_file}`
- `{output_file}`
- `{variant_id}`
- optional `{output_under_test}` when `review variants` is run with `--output-under-test`

Optional fields:

- `purpose`: what this variant is judging
- `required_prerequisites`: concise preconditions the operator should satisfy before running it
- `safety_notes`: concise mistakes to avoid for this variant

If a checked-in wrapper can observe provider cost or token usage, let it emit an optional `telemetry` object in the structured verdict payload instead of hiding that data in stderr text.

## Human Review Prompt Shape

Each review prompt should point at human-visible failure:

```yaml
human_review_prompts:
  - id: operator
    prompt: Where would an operator still conclude the workflow is misleading or brittle?
```

Prefer prompts about user-visible failure, operator trust, portability, or overfitting.
Avoid generic code-style prompts.

## Placeholder Discipline

Template placeholders should stay obvious and few.
Good placeholders:

- `{baseline_ref}`
- `{baseline_repo}`
- `{candidate_repo}`
- `{eval_cases_file}`
- `{eval_observed_file}`
- `{backend}`
- `{history_file}`
- `{profile}`
- `{selected_scenario_ids_file}`
- `{split}`
- `{prompt_file}`
- `{schema_file}`
- `{output_file}`
- `{output_dir}`
- `{scenario_results_file}`
- `{candidate_results_file}` for migration-only compatibility
- `{report_input_file}`
- `{report_file}`

If a value can be inferred cheaply every time, do not add a placeholder for it.

For adapter-driven mode execution, `Cautilus` may also supply:

- `{output_dir}`: bounded artifact directory for this invocation
- `{scenario_results_file}`: JSON file the command should write using `cautilus.scenario_results.v1`
- `{candidate_results_file}`: compatibility alias for `{scenario_results_file}` while older adapters migrate
- `{report_input_file}`: path where `Cautilus` will persist the intermediate report input packet
- `{report_file}`: path where `Cautilus` will persist the final report packet
- `{selected_scenario_ids_file}`: JSON file containing the selected scenario ids for this invocation when `Cautilus` is driving a checked-in scenario profile

When `profile_default` or `--profile` points at a checked-in `cautilus.scenario_profile.v1` file, `Cautilus` may materialize a selected profile file for the current invocation and pass that path through `{profile}` instead of the original reference.
This lets the runtime keep selection and history ownership product-side while leaving the actual benchmark command consumer-owned.

For `codex exec`, do not invent approval-policy flags from older wrappers.
Use `--sandbox` and your surrounding runtime sandbox instead.
Keep ephemeral mode as the default, but allow explicit opt-out when a behavior probe intentionally depends on session or fork tool surface.
When opt-out is used, emit the selected session mode in runtime telemetry so reviewers can audit whether a result was session-independent.
For stdin-driven commands, prefer file redirection or a checked-in wrapper so the process receives EOF and does not wait on an open terminal pipe.
`Reading additional input from stdin...` is expected when the process is reading from a bounded file redirect.
It is only a bug when stdin is left attached to an interactive terminal and never closes.
When using `--output-schema`, keep object item schemas conservative.
Past runs showed some CLIs can reject schemas that declare object properties without also listing them in `required`, even when plain JSON Schema would allow them as optional.
For skill-aware smoke tests, treat stderr as part of the contract.
Past sessions showed `codex exec` can emit skill-load errors on stderr while still returning a successful exit code.
For `claude -p`, prefer `--no-session-persistence` plus explicit tool settings.
Use `--bare` only when the auth path is explicit because `--bare` can disable the local OAuth or keychain path.
In JSON mode, normalize the response and extract `structured_output` if present instead of assuming the verdict is top-level.
Also keep the run bounded with an external timeout or wrapper default because `claude -p` can look silent for a while before eventually completing.

Malformed adapters should fail loudly.
A found adapter that does not validate is worse than no adapter because it creates false confidence.
