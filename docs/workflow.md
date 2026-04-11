# Cautilus Workflow

Use this workflow when intentful behavior evaluation itself is the task.

The point is not to find a flattering benchmark slice. The point is to decide
whether the candidate change survives comparison, held-out checks, and human
review with enough evidence to ship for the behavior the operator actually
cares about.
When the user wants a repeated quality bar, prefer a bounded evaluation loop
with explicit stop conditions over an open-ended "retry until clean" loop.

## Bootstrap

Every invocation starts here.

1. Resolve the adapter from the target repo:

```bash
node scripts/resolve_adapter.mjs --repo-root .
```

If the repo keeps multiple evaluation adapters, select one explicitly:

```bash
node scripts/resolve_adapter.mjs --repo-root . --adapter-name code-quality
```

2. If the adapter is missing, scaffold one before benchmarking:

```bash
node scripts/init_adapter.mjs --repo-root . --output .agents/cautilus-adapter.yaml
```

For a named alternate adapter:

```bash
node scripts/init_adapter.mjs --repo-root . --adapter-name code-quality
```

3. If the adapter is invalid, repair it using
   [adapter-contract.md](./contracts/adapter-contract.md).
4. Run any adapter-defined `preflight_commands` before spending time on long
   runs.

If the run should compare clean git refs rather than a live checkout, prepare
the explicit A/B worktrees first:

```bash
cautilus workspace prepare-compare \
  --repo-root . \
  --baseline-ref origin/main \
  --output-dir /tmp/cautilus-compare
```

The helper emits machine-readable baseline and candidate paths you can pass
back into `mode evaluate` or `review variants`.

`--output-dir` is optional. When `cautilus workspace start` has already
pinned `CAUTILUS_RUN_DIR`, omit it and the helper materializes `baseline/`
and `candidate/` inside that active `runDir`. When nothing is pinned, it
auto-materializes a fresh `runDir` under `./.cautilus/runs/` and prints
`Active run: <path>` to stderr.

If repeated bounded runs are accumulating too many artifact directories under
one artifact root, prune older recognized bundles instead of letting stdout,
stderr, review packets, and compare workspaces grow forever:

```bash
cautilus workspace prune-artifacts \
  --root /tmp/cautilus-runs \
  --keep-last 20
```

When a new bounded run should land under the same artifact root, start a
fresh per-run subdirectory and pin it as the active run with `workspace
start`. Default stdout is a single shell-evalable line so `eval` is the
happy path; the helper also writes a `run.json` manifest inside the new
directory so the pruner recognizes it even before any other bundle file is
written:

```bash
eval "$(cautilus workspace start --label mode-held-out)"
```

`workspace start` defaults `--root` to `./.cautilus/runs/` (auto-created on
first use). After the `eval`, `CAUTILUS_RUN_DIR` is set in the current shell
and consumer commands like `mode evaluate`, `review variants`, `review
prepare-input`, and `workspace prepare-compare` resolve their runDir from
that env var without operator path-threading. Pass `--json` instead of
`eval` if a script needs the machine-readable payload.

If interpretation or reporting is getting sloppy, read
[reporting.md](./contracts/reporting.md) before
continuing.

## Goal

Produce a defensible evaluation packet containing:

- the candidate under test
- the exact baseline used
- the intended behavior under evaluation
- the commands and concrete placeholder values used
- improved, regressed, unchanged, and noisy scenarios
- human-review findings that contradict or qualify benchmark wins
- a ship recommendation: `accept-now`, `defer`, or `reject`

## Adapter

Keep repo-specific execution details in the adapter.

Search order:

1. `.agents/cautilus-adapter.yaml`
2. `.codex/cautilus-adapter.yaml`
3. `.claude/cautilus-adapter.yaml`
4. `docs/cautilus-adapter.yaml`
5. `cautilus-adapter.yaml`

Named adapters:

- `.agents/cautilus-adapters/<name>.yaml`
- `.codex/cautilus-adapters/<name>.yaml`
- `.claude/cautilus-adapters/<name>.yaml`
- `docs/cautilus-adapters/<name>.yaml`
- `cautilus-adapters/<name>.yaml`

The adapter may define:

- benchmark surfaces and baseline options
- preflight commands
- iterate, held-out, comparison, and full-gate command templates
- executor variants for bounded external review or simulation passes
- artifact and report paths
- human review prompts
- sample-count defaults

Use [adapter-contract.md](./contracts/adapter-contract.md)
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
- `{selected_scenario_ids_file}`
- `{split}`
- `{prompt_file}`
- `{schema_file}`
- `{output_file}`
- `{iterate_samples}`
- `{held_out_samples}`
- `{comparison_samples}`
- `{full_gate_samples}`
- `{scenario_results_file}`
- `{report_input_file}`
- `{report_file}`

Replace placeholders with concrete values before execution and report those
values back to the user. Do not hide them behind "same as usual."

When `--profile` or adapter `profile_default` points at a checked-in
`cautilus.scenario_profile.v1` file, `Cautilus` may resolve the selected
scenario set before execution, persist the selected ids as
`{selected_scenario_ids_file}`, and pass a filtered profile file through
`{profile}` for that invocation.

When that run is `comparison`, `Cautilus` also materializes a
`baseline-cache.json` seed beside the mode-evaluation packet so later bounded
compare flows can reuse a stable cache key instead of guessing it ad hoc.

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
   When the adapter command itself is the thing to run, prefer the checked-in
   mode runner over ad-hoc manual rendering:

```bash
cautilus mode evaluate \
  --repo-root . \
  --mode held_out \
  --intent "CLI behavior should remain legible." \
  --baseline-ref origin/main \
  --output-dir /tmp/cautilus-mode
```

   `--output-dir` is optional. When `cautilus workspace start` has already
   pinned `CAUTILUS_RUN_DIR`, omit it and `mode evaluate` writes its report
   packet into that active `runDir`. When nothing is pinned, `mode evaluate`
   auto-materializes a fresh `runDir` under `./.cautilus/runs/` and prints
   `Active run: <path>` to stderr.
8. Review artifacts and run the adapter's `human_review_prompts`.
   Benchmark wins do not override obvious human-visible failures.
   When useful, run 2-3 independent review variants that judge the same
   candidate from different lenses.
   Require structured findings such as `blocker`, `concern`, or `pass`.
   If the adapter defines `executor_variants`, use those checked-in command
   templates instead of retyping ad-hoc `codex exec` or `claude -p` commands.
   When the repo keeps a runner such as
   `scripts/agent-runtime/run-workbench-executor-variants.mjs`, prefer that
   checked-in fanout path over manual per-variant shell invocations.
   When the repo already has a report packet but no fixed prompt file, let the
   runner synthesize the review packet and meta-prompt artifacts directly:

```bash
cautilus review variants \
  --repo-root . \
  --workspace . \
  --report-file /tmp/cautilus-mode/report.json \
  --output-dir /tmp/cautilus-review
```
   When the repo already has explicit mode results, assemble one checked-in
   report packet instead of leaving held-out and full-gate telemetry spread
   across ad-hoc files:

```bash
cautilus report build --input ./fixtures/reports/report-input.json
```
   Before generating or selecting a review prompt, prefer one durable review
   packet that binds the report, artifact paths, and review questions:

```bash
cautilus review prepare-input \
  --repo-root . \
  --report-file /tmp/cautilus-mode/report.json
```
   Then prefer the product-owned meta-prompt seam before hand-written prompt
   glue:

```bash
cautilus review build-prompt-input \
  --review-packet /tmp/cautilus-mode/review.json

cautilus review render-prompt \
  --input /tmp/cautilus-mode/review-prompt-input.json
```
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

## Meta Eval

`Cautilus` is allowed to evaluate another skill, adapter, workflow, or
runtime seam.
This is often the right shape when the real question is "does this evaluator
or operator path produce the kind of change we want?"

Typical examples:

- evaluate whether a skill reduces the intended operator cost instead of only
  passing one synthetic brief
- smoke-test whether a skill invocation path reaches the intended files or
  commands
- evaluate whether a CLI command's stdout, stderr, exit code, and side effects
  match operator intent inside a bounded fixture environment
- compare an old and new adapter or prompt set on the same bounded brief set
- run a fake operator task to see whether a workflow converges cleanly before
  using it for real

For CLI-specific packets, prefer one checked-in intent packet over hand-run
transcripts:

```bash
cautilus cli evaluate \
  --input ./fixtures/cli-evaluation/doctor-missing-adapter.json
```

When repeated CLI failures should become durable scenario coverage, prefer the
checked-in `cli` normalization helper over repo-local one-off shapers:

```bash
cautilus scenario normalize cli \
  --input ./fixtures/scenario-proposals/cli-input.json
```

For this pattern:

- use a dedicated named adapter such as `code-quality`, `skill-smoke`, or
  `meta-eval`
- keep the candidate and baseline explicit
- keep the task briefs fixed and checked in when possible
- judge both artifact quality and operator experience
- prefer adapter-local command templates over one-off shell transcripts
- prefer checked-in prompt/schema fixtures plus a checked-in variant runner
  over hand-assembled terminal commands

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

### Codex Exec Guardrails

- Prefer `codex exec` with `--sandbox read-only` for review-only passes.
- Use `--ephemeral` so repeated review loops do not depend on hidden session
  state.
- Feed the prompt from a file over stdin and use `--output-schema` plus `-o`
  for machine-readable output.
- `Reading additional input from stdin...` can be normal when stdin is
  redirected from a file.
  Treat it as a problem only if the process is attached to an open terminal
  stdin instead of a bounded file redirect.
- Keep stderr.
  Past sessions showed `codex exec` can emit fatal skill-loading errors on
  stderr while the final process exit still looks successful.
- Do not assume older approval-policy flags exist.
  Pick the sandbox mode explicitly instead of inventing legacy approval
  controls.
- Do not force minimal reasoning by default.
  Past sessions showed that overly aggressive effort overrides can conflict
  with tool surfaces that the prompt or skill still needs.
- Avoid `--dangerously-bypass-approvals-and-sandbox` for evaluation loops.
- Point `-C` at the exact workspace under review, ideally a clean worktree or
  read-only temp copy rather than a dirty live checkout.

### Claude Print Guardrails

- Use `--no-session-persistence` so one pass does not silently inherit
  another.
- Keep tool access off unless the review genuinely needs file reads.
- Use `--bare` only when the auth path is explicit and intentional.
  Past sessions showed `--bare` can disable the local OAuth or keychain path
  and fail with `Not logged in`.
- Use `--output-format json` with `--json-schema` and redirect stdout to a
  fixed output file.
- Normalize the output file.
  In JSON mode, `claude -p` can wrap the verdict under `structured_output`
  instead of printing the schema payload as the top-level object.
- Bound the run with an external timeout or wrapper default.
  Past sessions showed `claude -p` can look silent for a while and tempt
  operators into manual polling or abort loops.
- Remember that `-p` skips the trust dialog.
  Run it only inside a trusted checkout or temp workspace you prepared
  deliberately.

## Reply Expectations

When you finish, report:

- candidate and baseline
- mode used: iterate, held-out, comparison, and/or full gate
- command templates rendered with concrete values
- improved, regressed, unchanged, and noisy scenarios
- which scenarios were materially slower or more expensive when telemetry is available
- human review findings
- final recommendation: `accept-now`, `defer`, or `reject`
