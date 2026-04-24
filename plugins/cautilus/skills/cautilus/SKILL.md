---
name: cautilus
description: "Use when intentful behavior evaluation itself is the task and the repo should run Cautilus's checked-in workflow instead of reconstructing compare, held-out, and review commands by hand."
---

# Cautilus

Use this bundled skill when intentful behavior evaluation itself is the task and the repo wants to run the checked-in `Cautilus` workflow instead of rebuilding compare, held-out, report, review, or optimize commands by hand.

The installed skill assumes `cautilus` is already available on `PATH`.
If it is not, install the CLI first and verify with `cautilus --version`.
To materialize this skill in a host repo, run `cautilus install --repo-root .`.

## CLI First

Let the binary own command discovery and packet examples.
Do not copy broad command lists or packet shapes into the answer when the CLI can print them.

Use these probes before improvising:

```bash
cautilus healthcheck --json
cautilus commands --json
cautilus scenarios --json
cautilus doctor --repo-root . --next-action
cautilus doctor --repo-root . --scope agent-surface
```

Use `cautilus --help` for human-readable command discovery.
Use `cautilus <command> --example-input` when a command supports packet examples.
Use [command-cookbook.md](references/command-cookbook.md) only after the binary has identified the relevant command family and you need a concrete multi-step invocation.

`Cautilus` should stay usable as a standalone product:

- resolve or scaffold repo-local adapters
- evaluate one bounded behavior surface with explicit intent
- build report, review, evidence, optimize, and revision packets through the CLI
- run adapter-owned review variants through checked-in executor templates
- keep host-repo fixtures, prompts, wrappers, and policy outside the product boundary

## Archetype Routing

`Cautilus` has exactly three first-class evaluation archetypes: `chatbot`, `skill`, and `workflow`.
Run `cautilus scenarios --json` before choosing an archetype unless the user already named one.
That catalog is the source of truth for summaries, example input commands, behavior focus, and contract docs.

Use this minimal routing rule:

- `chatbot`: multi-turn assistant behavior regressed after a prompt or wrapper change.
- `skill`: a checked-in skill or agent must still trigger, execute, and validate cleanly.
- `workflow`: a stateful automation keeps stalling on the same recovery step.

For input shapes, prefer the relevant `--example-input` command from `cautilus scenarios --json` over hand-written JSON.

## Bootstrap

1. Prove the binary and command registry are healthy:

```bash
cautilus healthcheck --json
cautilus commands --json
```

2. Resolve the target repo adapter and current next action:

```bash
cautilus doctor --repo-root . --next-action
cautilus adapter resolve --repo-root .
```

For a named adapter, pass `--adapter-name <name>` to both adapter and doctor commands when the target surface is intentionally named.

3. If the repo does not have an adapter yet, scaffold one:

```bash
cautilus adapter init --repo-root .
```

4. Check whether the repo is wired for a runnable evaluation path:

```bash
cautilus doctor --repo-root .
```

`doctor --next-action`, `doctor --scope agent-surface`, and default `doctor` answer different questions.
`doctor --next-action` gives one current onboarding step plus the exact follow-up loop.
`doctor --scope agent-surface` checks the bundled skill and local agent-surface install.
Default `doctor` checks whether the repo is actually wired for a real runnable evaluation path.
When default `doctor` returns `ready`, read its `first_bounded_run` payload before inventing your own next command sequence.

5. Before hand-editing adapter YAML, run the inventory in [bootstrap-inventory.md](references/bootstrap-inventory.md) so `Cautilus` is only pointed at LLM-behavior surfaces, not cheap deterministic gates that belong in CI.

6. Read only the references needed for the selected command family:

- workflow and active-run mechanics: [evaluation-process.md](references/evaluation-process.md), [active-run.md](references/active-run.md)
- adapter shape: [adapter-contract.md](references/adapter-contract.md)
- report and review: [reporting.md](references/reporting.md), [review-packet.md](references/review-packet.md), [review-prompt-inputs.md](references/review-prompt-inputs.md)
- scenario proposal flow: [scenario-proposal-sources.md](references/scenario-proposal-sources.md), [scenario-proposal-inputs.md](references/scenario-proposal-inputs.md), [scenario-proposal-normalization.md](references/scenario-proposal-normalization.md)
- archetype details: [chatbot-normalization.md](references/chatbot-normalization.md), [skill-testing.md](references/skill-testing.md), [skill-evaluation.md](references/skill-evaluation.md), [skill-normalization.md](references/skill-normalization.md), [workflow-normalization.md](references/workflow-normalization.md)
- evidence and optimize: [evidence-bundle.md](references/evidence-bundle.md), [optimization.md](references/optimization.md), [optimization-search.md](references/optimization-search.md), [revision-artifact.md](references/revision-artifact.md)

## Workflow

1. Resolve the adapter and restate the candidate, baseline, intended behavior, and decision boundary.
2. Use `workspace start` for a multi-command run instead of inventing unrelated `/tmp` paths by hand.
3. Use `workspace prepare-compare` when the run needs clean git-ref A/B workspaces.
4. Run adapter-defined preflight commands before long evaluations.
5. Use iterate mode for tuning, held-out mode for validation, and full gate for ship decisions.
6. Build `report.json` and treat it as the first decision surface.
7. If the adapter defines `executor_variants`, run `cautilus review variants` instead of retyping ad hoc shell commands.
8. If review variants are requested but unavailable on the selected adapter, treat that as a gate defect to fix or explicitly waive before release.
9. Use `scenario propose` when normalized proposal candidates already exist and the next move is a checked-in scenario packet.
10. Report exact commands, exact adapter selection, exact artifact paths, and the final recommendation.

When the target repo is `Cautilus` itself, prefer the checked-in self-dogfood wrappers over rebuilding the mode/report/review chain by hand; see [self-dogfood-runner.md](references/self-dogfood-runner.md) for wrapper entries and claim boundaries.

## Report Reading

When `mode evaluate` or `report build` emits `report.json`, read it in this order:

1. `recommendation`
2. `modeSummaries[*].status` and `modeSummaries[*].summary`
3. `runtimeContext`, `reasonCodes`, and `warnings`
4. `compareArtifact`, scenario buckets, and telemetry

Interpretation rules:

- `rejected` means comparison-backed evidence found a regression; do not read it as a generic execution failure.
- `failed` means the evaluation surface did not complete cleanly enough to make a comparison-backed decision.
- `provider_rate_limit_contamination` means provider/runtime pressure contaminated the result; do not treat that reject as a clean prompt regression without checking the warning context.
- Runtime fingerprint warnings belong to evidence context unless a pinned runtime policy blocks the workflow.
- Review prompts and review variants carry report warnings forward, so the judge should reuse the report classification instead of rediscovering it from raw stdout/stderr.

## Outputs

Use product-owned outputs instead of paraphrasing command results from memory.

- `report.json`: first machine-readable decision packet.
- `review.json`: durable review packet built around one report plus adapter-owned prompt and artifact context.
- `review-prompt-input.json`: portable meta-prompt packet for human or model review.
- `review-summary.json`: multi-variant judge summary with verdicts, reason codes, and aggregate telemetry.
- `evidence-bundle.json`: combined report, scenario results, run audit, and history context.
- `optimize-input.json`, `optimize-search-result.json`, `optimize-proposal.json`, `revision-artifact.json`: bounded optimization and handoff packets.
- HTML renders: browser-readable mirrors when a human reviewer should inspect the same decision surface without reopening raw JSON.

Humans usually read HTML renders first, then the underlying packet if they need exact fields.
Agents should read the packet first, then cite HTML only when a browser view is the deliverable.

## Guardrails

- Do not treat one host repo's prompts, adapters, or report paths as product-owned defaults.
- Do not copy broad CLI help into skill output; call `cautilus --help` or `cautilus commands --json`.
- Do not hand-write packet JSON when a command exposes `--example-input`.
- Do not turn review loops or optimizer output into open-ended retries.
- When search readiness is blocked, stop and discuss the missing held-out evidence or intent surface before inventing prompt mutations.
- Keep held-out evaluation held out unless the benchmark itself is being changed deliberately.
- Prefer checked-in wrapper scripts and schemas over inline shell quoting.
