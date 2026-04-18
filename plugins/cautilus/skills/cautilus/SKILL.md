---
name: cautilus
description: "Use when intentful behavior evaluation itself is the task and the repo should run Cautilus's checked-in workflow instead of reconstructing compare, held-out, and review commands by hand."
---

# Cautilus

Use this bundled skill when intentful behavior evaluation itself is the task
and the repo wants to run the checked-in `Cautilus` workflow instead of
rebuilding commands by hand.

The installed skill assumes `cautilus` is already available on `PATH`.
If it is not, install the CLI first and verify with `cautilus --version`.
To materialize this skill in a host repo, run `cautilus install --repo-root .`.

When a consumer repo or wrapper wants to probe the CLI surface safely, use:

```bash
cautilus healthcheck --json
cautilus commands --json
cautilus doctor --repo-root . --scope agent-surface
```

`Cautilus` should stay usable as a standalone product:

- resolve or scaffold repo-local adapters
- run bounded review variants through the bundled CLI
- evaluate operator-facing behavior with explicit intent packets
- keep held-out evaluation and review prompts explicit
- keep host-repo fixtures, prompts, and policy outside the product boundary

## Scenarios

`Cautilus` has exactly three first-class evaluation archetypes. Pick the one
that matches the task before reaching for adapters, reports, or review. The
1:1 mapping is pinned in `archetype-boundary.spec.md` (chatbot / skill /
workflow); every normalize command also ships a `--example-input` flag that
prints a minimal valid packet to stdout for quick inspection. Run
`cautilus scenarios` (or `cautilus scenarios --json`) to print this same
catalog from the CLI.

### 1. Chatbot conversation regression

Use when a chatbot or assistant gets worse at multi-turn behavior after a
prompt change (forgetting prior turns, answering when it should clarify,
ignoring preferences the user already stated).

- CLI: `cautilus scenario normalize chatbot --input <conversation-logs.json>`
- Inspect shape: `cautilus scenario normalize chatbot --example-input`
- Output: `proposals.json` (`cautilus.scenario_proposals.v1`)

### 2. Skill / agent execution regression

Use when a skill or agent edit should be checked for whether it still
triggers on the right prompts, executes cleanly, and keeps its declared
validation surfaces passing. Two entry points depending on what you
already have:

- Checked-in case suite (`cautilus.skill_test_cases.v1`, e.g.
  `fixtures/skill-test/cases.json`):
  `cautilus skill test --repo-root . --adapter-name <name>`
- Already-normalized observation packet
  (`cautilus.skill_evaluation_inputs.v1`; peek with
  `cautilus skill evaluate --example-input`):
  `cautilus skill evaluate --input <observations.json>`

Either path emits `skill-summary.json`
(`cautilus.skill_evaluation_summary.v1`) plus chained proposal
candidates when regressions appear. To turn those candidates into saved
scenarios, feed the summary into
`cautilus scenario normalize skill --input <summary.json>`; inspect its
input shape with `cautilus scenario normalize skill --example-input`.

### 3. Durable workflow recovery

Use when a stateful automation — a CLI workflow, long-running agent
session, or pipeline that persists state across invocations — keeps
getting stuck on the same step.

- CLI: `cautilus scenario normalize workflow --input <workflow-runs.json>`
- Inspect shape: `cautilus scenario normalize workflow --example-input`
- Output: `proposals.json` with `operator_workflow_recovery` candidates

## Bootstrap

1. Resolve the adapter from the target repo:

```bash
cautilus doctor --repo-root . --scope agent-surface
cautilus adapter resolve --repo-root .
```

For a named adapter: `cautilus adapter resolve --repo-root . --adapter-name <name>`.

2. If the repo does not have an adapter yet, scaffold one:

```bash
cautilus adapter init --repo-root .
```

3. Check whether the repo is already ready for standalone `Cautilus` use:

```bash
cautilus doctor --repo-root .
```

`doctor --scope agent-surface` and default `doctor` answer different questions.
The first checks the bundled skill and local agent-surface install.
The second checks whether the repo is actually wired for a real runnable evaluation path.
When default `doctor` returns `ready`, read its `first_bounded_run` payload before inventing your own next command sequence.
That payload mirrors `cautilus scenarios --json`, includes `exampleInputCli` per archetype, and adds a starter `mode evaluate -> review prepare-input -> review variants` loop.

4. Before hand-editing adapter YAML, run the inventory in
   [bootstrap-inventory.md](references/bootstrap-inventory.md) so `Cautilus`
   is only pointed at LLM-behavior surfaces — not at cheap deterministic
   gates that belong in CI.

5. Read the canonical workflow and contracts before widening the surface:

- [evaluation-process.md](references/evaluation-process.md)
- [active-run.md](references/active-run.md)
- [adapter-contract.md](references/adapter-contract.md)
- [reporting.md](references/reporting.md)
- [scenario-proposal-sources.md](references/scenario-proposal-sources.md)
- [scenario-proposal-inputs.md](references/scenario-proposal-inputs.md)
- [scenario-proposal-normalization.md](references/scenario-proposal-normalization.md)
- [chatbot-normalization.md](references/chatbot-normalization.md)
- [skill-testing.md](references/skill-testing.md)
- [skill-evaluation.md](references/skill-evaluation.md)
- [skill-normalization.md](references/skill-normalization.md)
- [workflow-normalization.md](references/workflow-normalization.md)
- [review-packet.md](references/review-packet.md)
- [review-prompt-inputs.md](references/review-prompt-inputs.md)
- [evidence-bundle.md](references/evidence-bundle.md)
- [optimization.md](references/optimization.md)
- [optimization-search.md](references/optimization-search.md)
- [revision-artifact.md](references/revision-artifact.md)

## Workflow

1. Resolve the adapter and restate the candidate, baseline, and intended
   decision.
2. When the run needs clean git-ref A/B workspaces, prepare them with the
   product-owned helper. `--output-dir` is optional when `workspace start`
   has already pinned `CAUTILUS_RUN_DIR`; the helper will drop `baseline/`
   and `candidate/` inside that active `runDir`:

```bash
cautilus workspace prepare-compare \
  --repo-root . \
  --baseline-ref origin/main \
  --output-dir /tmp/cautilus-compare
```

3. Pin one active run for the workflow with `workspace start` instead of
   inventing `--output-dir` paths by hand, and prune older recognized bundles
   with `workspace prune-artifacts` instead of letting logs and compare
   workspaces grow forever. The default stdout of `workspace start` is a
   single shell-evalable line, so `eval` is the happy path:

```bash
eval "$(cautilus workspace start --label mode-held-out)"

cautilus workspace prune-artifacts \
  --root ./.cautilus/runs \
  --keep-last 20
```

   `workspace start` auto-creates `./.cautilus/runs/`, writes a `run.json`
   manifest so the pruner recognizes the run immediately, and exports
   `CAUTILUS_RUN_DIR` via `eval`. Pass `--json` instead of `eval` when a
   script needs the machine-readable payload.

4. Run adapter-defined preflight commands before long evaluations.

5. Use iterate mode for tuning, held-out mode for validation, and full gate for
   ship decisions.

6. When the adapter defines `executor_variants`, run the checked-in review
   runner instead of retyping ad-hoc shell commands:

```bash
cautilus review variants \
  --repo-root . \
  --workspace . \
  --output-dir /tmp/cautilus-review
```

   When the target repo is `Cautilus` itself, prefer the checked-in
   self-dogfood wrappers over rebuilding the mode/report/review chain by hand
   — see [self-dogfood-runner.md](references/self-dogfood-runner.md) for the
   four wrapper entries and their claim boundaries.

7. Report exact commands, exact placeholder values, and the final
   recommendation.

8. When the repo already has normalized scenario proposal candidates,
   generate a checked-in proposal packet instead of hand-drafting scenario
   JSON. Prefer `cautilus scenario propose` as the default entry after the
   bootstrap inventory. Use it to turn normalized evidence into bounded
   scenarios before widening adapter YAML by hand. For the concrete
   invocations across skill test / skill evaluate / scenario normalize /
   report build / mode evaluate / review / evidence / optimize / review
   variants, see [command-cookbook.md](references/command-cookbook.md).

## Current Report Surface

When `mode evaluate` or `report build` emits `report.json`, treat that packet as
the first decision surface rather than digging into raw artifacts immediately.

Read it in this order:

1. `recommendation`
2. `modeSummaries[*].status` and `modeSummaries[*].summary`
3. `reasonCodes` and `warnings`
4. `compareArtifact`, scenario buckets, and telemetry

Current interpretation rules:

- `rejected` means comparison-backed evidence found a regression; do not read it
  as a generic execution failure.
- `failed` means the evaluation surface did not complete cleanly enough to make
  a comparison-backed decision.
- `provider_rate_limit_contamination` inside `reasonCodes` or `warnings` means
  persisted artifacts suggest provider/runtime pressure contaminated the result;
  do not treat that reject as a clean prompt regression without checking the
  warning context.
- `review build-prompt-input` and `review variants` now carry those warnings
  forward, so the judge should reuse the report classification instead of
  rediscovering it from raw stdout/stderr.

## Outputs And Review Surfaces

Use the product-owned outputs instead of paraphrasing command results from
memory.

- `report.json`: first machine-readable decision packet for held-out, full-gate,
  or explicit report assembly.
- `review.json`: durable review packet built around one report plus adapter-owned
  prompt and artifact context.
- `review-prompt-input.json`: portable meta-prompt packet for human or model
  review.
- `review-summary.json`: multi-variant judge summary with verdicts, reason codes,
  and aggregate telemetry.
- `evidence-bundle.json`: one place to collect report, scenario results, run
  audit, and history when the next move depends on all of them together.
- `index.html` or per-surface HTML renders: browser-readable mirrors of those
  packets when a human reviewer should inspect the same decision surface without
  reopening raw JSON.

Human-readable rule of thumb:

- humans usually read HTML renders first, then the underlying packet if they
  need the exact fields
- agents should read the packet first, then cite HTML only when a browser view
  is the actual deliverable

## Guardrails

- Do not treat one host repo's prompts, adapters, or report paths as product-owned
  defaults.
- Do not turn review loops into open-ended retries.
- Do not turn optimizer output into an open-ended retry loop.
- When search readiness is blocked, stop and discuss the missing held-out
  evidence or intent surface before inventing prompt mutations.
- Keep held-out evaluation held out unless the benchmark itself is being
  changed deliberately.
- Prefer checked-in wrapper scripts and schemas over inline shell quoting.
