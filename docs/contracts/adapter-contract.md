# Adapter Contract

`Cautilus` stays portable by loading repo-specific evaluation commands from an
adapter instead of hardcoding benchmark runners into the workflow.
Use one default adapter for the repo's primary benchmark surface, then add
named adapters when the repo needs extra surfaces such as `code-quality`,
`skill-smoke`, or `meta-eval`.

Search order:

1. `.agents/workbench-adapter.yaml`
2. `.codex/workbench-adapter.yaml`
3. `.claude/workbench-adapter.yaml`
4. `docs/workbench-adapter.yaml`
5. `workbench-adapter.yaml`

Named adapter search order for `--adapter-name <name>`:

1. `.agents/workbench-adapters/<name>.yaml`
2. `.codex/workbench-adapters/<name>.yaml`
3. `.claude/workbench-adapters/<name>.yaml`
4. `docs/workbench-adapters/<name>.yaml`
5. `workbench-adapters/<name>.yaml`

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
iterate_command_templates:
  - npm run bench:train -- --baseline-ref {baseline_ref} --history-file {history_file} --samples {iterate_samples}
held_out_command_templates:
  - npm run bench:test -- --baseline-ref {baseline_ref} --samples {held_out_samples}
comparison_command_templates:
  - npm run bench:compare -- --baseline-ref {baseline_ref} --profile {profile} --split {split} --samples {comparison_samples}
full_gate_command_templates:
  - npm run bench:full -- --baseline-ref {baseline_ref} --history-file {history_file} --samples {full_gate_samples}
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
      - do not use bypass-approval or danger-full-access flags for review-only loops
artifact_paths:
  - docs/evaluation-plan.md
report_paths:
  - reports/workbench/latest.json
comparison_questions:
  - Which scenarios improved or regressed?
human_review_prompts:
  - id: real-user
    prompt: Where would a real user still judge the candidate worse despite benchmark wins?
iterate_samples_default: 2
held_out_samples_default: 2
comparison_samples_default: 2
full_gate_samples_default: 2
history_file_hint: /tmp/workbench-history.json
profile_default: default
default_prompt_file: fixtures/workbench/skill-smoke.prompt.md
default_schema_file: fixtures/workbench/review-verdict.schema.json
```

## Fields

- `version`: adapter schema version.
- `repo`: human-readable repo name.
- `evaluation_surfaces`: what kinds of behavior the evaluator is judging.
- `baseline_options`: allowed baseline choices and how the agent should think
  about them.
- `required_prerequisites`: conditions that should stop the evaluation early.
- `preflight_commands`: fast commands to run before long evaluations.
- `iterate_command_templates`: commands for training or iterate loops.
- `held_out_command_templates`: commands for the held-out split or equivalent
  validation.
- `comparison_command_templates`: optional commands that produce
  scenario-by-scenario deltas.
- `full_gate_command_templates`: commands for the final shipping gate.
- `executor_variants`: optional backend-specific review or simulation runners.
- `artifact_paths`: code or docs the evaluator should inspect while
  interpreting results.
- `report_paths`: machine-readable or HTML output paths worth checking after
  runs.
- `comparison_questions`: prompts to keep result interpretation focused on real
  deltas.
- `human_review_prompts`: lenses that test whether benchmark wins survive human
  judgment.
- `iterate_samples_default`: default sample count for iterate runs.
- `held_out_samples_default`: default sample count for held-out runs.
- `comparison_samples_default`: default sample count for explicit compare runs.
- `full_gate_samples_default`: default sample count for full gate runs.
- `history_file_hint`: default history file path when the workflow uses
  graduation or cadence.
- `profile_default`: default scenario profile when the backend supports
  profiles.
- `default_prompt_file`: optional checked-in prompt path for executor-variant
  review runs.
- `default_schema_file`: optional checked-in schema path for executor-variant
  review runs.

## Placeholder Discipline

Template placeholders should stay obvious and few. Good placeholders:

- `{baseline_ref}`
- `{baseline_repo}`
- `{candidate_repo}`
- `{history_file}`
- `{profile}`
- `{split}`
- `{prompt_file}`
- `{schema_file}`
- `{output_file}`
- `{iterate_samples}`
- `{held_out_samples}`
- `{comparison_samples}`
- `{full_gate_samples}`

If a value can be inferred cheaply every time, do not add a placeholder for it.

Malformed adapters should fail loudly. A found adapter that does not validate
is worse than no adapter because it creates false confidence.
