# Cautilus Workflow

Use this workflow when evaluation itself is the task.

The point is not to find a flattering benchmark slice. The point is to decide
whether the candidate change survives comparison, held-out checks, and human
review with enough evidence to ship.
When the user wants a repeated quality bar, prefer a bounded evaluation loop
with explicit stop conditions over an open-ended "retry until clean" loop.

## Bootstrap

Every invocation starts here.

1. Resolve the adapter from the target repo:

```bash
python3 scripts/resolve_adapter.py --repo-root .
```

If the repo keeps multiple evaluation adapters, select one explicitly:

```bash
python3 scripts/resolve_adapter.py --repo-root . --adapter-name code-quality
```

2. If the adapter is missing, scaffold one before benchmarking:

```bash
python3 scripts/init_adapter.py --repo-root . --output .agents/workbench-adapter.yaml
```

For a named alternate adapter:

```bash
python3 scripts/init_adapter.py --repo-root . --adapter-name code-quality
```

3. If the adapter is invalid, repair it using
   [adapter-contract.md](/home/ubuntu/cautilus/docs/contracts/adapter-contract.md).
4. Run any adapter-defined `preflight_commands` before spending time on long
   runs.

If interpretation or reporting is getting sloppy, read
[reporting.md](/home/ubuntu/cautilus/docs/contracts/reporting.md) before
continuing.

## Goal

Produce a defensible evaluation packet containing:

- the candidate under test
- the exact baseline used
- the commands and concrete placeholder values used
- improved, regressed, unchanged, and noisy scenarios
- human-review findings that contradict or qualify benchmark wins
- a ship recommendation: `accept-now`, `defer`, or `reject`

## Adapter

Keep repo-specific execution details in the adapter.

Search order:

1. `.agents/workbench-adapter.yaml`
2. `.codex/workbench-adapter.yaml`
3. `.claude/workbench-adapter.yaml`
4. `docs/workbench-adapter.yaml`
5. `workbench-adapter.yaml`

Named adapters:

- `.agents/workbench-adapters/<name>.yaml`
- `.codex/workbench-adapters/<name>.yaml`
- `.claude/workbench-adapters/<name>.yaml`
- `docs/workbench-adapters/<name>.yaml`
- `workbench-adapters/<name>.yaml`

The adapter may define:

- benchmark surfaces and baseline options
- preflight commands
- iterate, held-out, comparison, and full-gate command templates
- executor variants for bounded external review or simulation passes
- artifact and report paths
- human review prompts
- sample-count defaults

Use [adapter-contract.md](/home/ubuntu/cautilus/docs/contracts/adapter-contract.md)
for the schema.

When the repo needs more than one evaluation surface, prefer multiple named
adapters over stuffing every workflow into one giant file.

## Placeholders

Command templates may contain placeholders such as:

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

Replace placeholders with concrete values before execution and report those
values back to the user. Do not hide them behind "same as usual."

## Workflow

1. Resolve the adapter and restate what is being evaluated.
   Name the candidate change surface, baseline choice, and intended decision.
2. Run adapter-defined `preflight_commands`.
   Stop if a prerequisite is missing or the baseline is still vague.
3. Choose the evaluation mode.
   Use iterate mode while tuning, held-out mode to validate without tuning, and
   full gate mode before calling the change successful.
4. Start with iterate commands.
   Use the adapter's `iterate_command_templates` with real placeholder values.
   Keep the held-out split unread while iterating.
5. Run comparison commands when available.
   Use them to expose scenario-by-scenario deltas instead of relying only on a
   single summary score.
6. Run held-out commands before making any success claim.
   If the held-out split regresses, do not bury that behind training wins.
7. Run full gate commands for ship/no-ship decisions.
   This should be the final automatic check, not an optional bonus.
8. Review artifacts and run the adapter's `human_review_prompts`.
   Benchmark wins do not override obvious human-visible failures.
   When useful, run 2-3 independent review variants that judge the same
   candidate from different lenses.
   Require structured findings such as `blocker`, `concern`, or `pass`.
   If the adapter defines `executor_variants`, use those checked-in command
   templates instead of retyping ad-hoc `codex exec` or `claude -p` commands.
9. If the user wants a repeatable local evaluator and none exists, create a
   checked-in bounded runner first.
   Prefer a repo script with fixed inputs, fixed prompt variants, and a small
   retry cap over ad-hoc terminal loops.
10. Classify the result.
   `accept-now` if the change survives automatic and human review,
   `defer` if the signal is real but not yet good enough to ship,
   `reject` if the candidate clearly regresses or overfits.

## Rules

- Treat held-out evaluation as held out. Do not tune by repeatedly reading or
  editing the held-out set unless the user explicitly asks to change the
  benchmark.
- Prefer a real baseline over vague "current behavior" language.
- Increase samples before overreacting to a single noisy regression.
- Separate narrow probe wins from seeded workflow or replay wins when both
  exist.
- Keep human review independent. If a benchmark says "better" but a real user
  would call the result worse, report the conflict directly.
- Report exact commands, exact baseline inputs, and exact sample counts.
- Prefer bounded review loops.
  A useful pattern is "repair while any review variant reports a blocker, stop
  after a small fixed cap."
- Do not use infinite bash loops or endless self-evaluation as a quality gate.
  If the candidate still fails after a few bounded passes, report that the
  current design is not converging.

## Executor Variants

Use `executor_variants` when the evaluation needs an external judge or a
terminal-backed reviewer such as `codex exec` or `claude -p`.

- Prefer checked-in wrapper scripts over long inline command strings once
  schema injection, stdin piping, or output capture become non-trivial.
- Keep review prompts in files.
  Do not hand-edit long shell-quoted prompt strings in the terminal.
- Keep verdicts structured.
  Use a checked-in JSON schema file and a fixed output file path so the loop
  can detect `blocker`, `concern`, and `pass` without guessing.
- Keep stderr.
  A bounded wrapper should leave a companion stderr artifact such as
  `{output_file}.stderr` because some CLI failures show up there even when
  stdout still looks superficially usable.
- Keep these variants bounded and read-mostly.
  Review variants should inspect the candidate, not mutate the repo.

## Reply Expectations

When you finish, report:

- candidate and baseline
- mode used: iterate, held-out, comparison, and/or full gate
- command templates rendered with concrete values
- improved, regressed, unchanged, and noisy scenarios
- human review findings
- final recommendation: `accept-now`, `defer`, or `reject`
