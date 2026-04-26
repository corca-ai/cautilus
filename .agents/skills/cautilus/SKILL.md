---
name: cautilus
description: "Use when intentful behavior evaluation itself is the task and the repo should run Cautilus's checked-in workflow instead of reconstructing compare, held-out, and review commands by hand."
---

# Cautilus

Use this bundled skill when intentful behavior evaluation itself is the task and the repo wants to run the checked-in `Cautilus` workflow instead of rebuilding claim discovery, eval fixtures, report, review, or optimize commands by hand.

The installed skill assumes a Cautilus binary is available.
In the Cautilus product repo itself, prefer the checked-in source launcher `./bin/cautilus` over `cautilus` on `PATH`, because the installed machine binary can lag the current checkout.
In consumer repos, use `cautilus` on `PATH`.
If no binary is available, install the CLI first and verify with `cautilus --version`.
To materialize this skill in a host repo, run `cautilus install --repo-root .`.

## CLI First

Let the binary own command discovery and packet examples.
Do not copy broad command lists or packet shapes into the answer when the CLI can print them.

Resolve the command you will use before running workflow commands:

```bash
CAUTILUS_BIN=cautilus
if [ -x ./bin/cautilus ]; then CAUTILUS_BIN=./bin/cautilus; fi
"$CAUTILUS_BIN" healthcheck --json
"$CAUTILUS_BIN" commands --json
```

If `commands --json` does not include the command family you need and `./bin/cautilus` exists, retry with `./bin/cautilus` before concluding that the command is unavailable.

Use these probes before improvising:

```bash
"$CAUTILUS_BIN" healthcheck --json
"$CAUTILUS_BIN" commands --json
"$CAUTILUS_BIN" claim discover --repo-root . --output /tmp/cautilus-claims.json
"$CAUTILUS_BIN" scenarios --json
"$CAUTILUS_BIN" doctor --repo-root . --next-action
"$CAUTILUS_BIN" doctor --repo-root . --scope agent-surface
```

Use `cautilus --help` for human-readable command discovery.
Use `cautilus <command> --example-input` when a command supports packet examples.
Use [command-cookbook.md](references/command-cookbook.md) only after the binary has identified the relevant command family and you need a concrete multi-step invocation.

`Cautilus` should stay usable as a standalone product:

- resolve or scaffold repo-local adapters
- discover declared behavior claims worth proving
- evaluate one bounded behavior surface with explicit intent
- build report, review, evidence, optimize, and revision packets through the CLI
- run adapter-owned review variants through checked-in executor templates
- keep host-repo fixtures, prompts, wrappers, and policy outside the product boundary

The three product front doors are `claim`, `eval`, and `optimize`.

## Evaluation Surface Routing

`Cautilus` has two top-level evaluation surfaces and four fixture presets.
Use `cautilus eval test --fixture <fixture.json>` when the repo already has a checked-in fixture and adapter-owned runner.
Use `cautilus scenarios --json` only when you need the proposal-input normalization catalog.

Use this minimal routing rule:

- `repo / whole-repo`: an agent must obey the whole repo's operating contract.
- `repo / skill`: a checked-in skill or agent must still trigger, execute, and validate cleanly.
- `app / chat`: multi-turn assistant behavior regressed after a prompt or wrapper change.
- `app / prompt`: a single-turn prompt input/output behavior must remain stable.

For scenario proposal input shapes, prefer the relevant `--example-input` command from `cautilus scenarios --json` over hand-written JSON.

## Declared Claim Discovery

Use this step when the user asks whether a repo proves what it claims, whether documentation and behavior are aligned, or which scenarios still need to be created.
Also use this path when the user invokes the skill with no detailed task and the repo has no active Cautilus run to resume.
Do not hard-code the search to README.
By default, the binary starts from adapter-owned `claim_discovery.entries` or README.md/AGENTS.md/CLAUDE.md and follows repo-local Markdown links to depth 3.
Use repeated `--source` arguments only when the user or adapter has selected an explicit truth-surface inventory.
Before the first scan, tell the user the entries and depth that will be scanned and ask for confirmation unless they already delegated autonomous continuation.
Then run `cautilus claim discover --repo-root . --output <claims.json>`.
If an existing claim JSON exists, use `cautilus claim discover --previous <claims.json> --refresh-plan --output <refresh-plan.json>` inside the same discover workflow rather than inventing a separate refresh command.
Use `cautilus claim show --input <claims.json>` when you need status from an existing packet without rescanning.
Do not treat scan confirmation as permission for LLM review, subagent fanout, broad edits, or expensive eval runs.

Classify each candidate claim before creating fixtures:

- `human-auditable`: the claim can be checked by reading current source or docs.
- `deterministic`: the claim belongs in unit, lint, type, build, or CI checks.
- `cautilus-eval`: the claim needs model, agent, prompt, skill, or workflow behavior evidence.
- `scenario-candidate`: the claim needs normalized proposal input before it becomes a protected eval fixture.
- `alignment-work`: the code, docs, adapter, or skill surface must be reconciled before proof would be honest.

For `cautilus-eval` claims, route to `repo / whole-repo`, `repo / skill`, `app / chat`, or `app / prompt`.
Keep the fixture, runner, prompt files, wrapper scripts, and acceptance policy in the host repo.
Use Cautilus for the generic packet contract, bounded run loop, and reusable decision artifacts.

After discovery or refresh, summarize the packet before choosing work:

- scanned entry files, linked Markdown count, and depth
- raw candidate count and claim summary by proof mechanism, readiness, evidence status, review status, and lifecycle
- refresh baseline and changed source count when a previous packet was used
- which groups look ready for deterministic tests, Cautilus scenarios, alignment work, or human-auditable review
- the next branch options: plan eval scenario drafts, add deterministic proof, resolve alignment, show the full packet, or stop

Only launch LLM-backed review after a separate review-budget confirmation that states maximum clusters, parallel review lanes, clusters per reviewer, excerpt budget, retry policy, and skipped-cluster policy.
After that budget is confirmed, run `cautilus claim review prepare-input --claims <claims.json> --max-clusters <n> --output <review-input.json>` to create deterministic review clusters, then give those clusters to reviewers.
When reviewers return `cautilus.claim_review_result.v1`, run `cautilus claim review apply-result --claims <claims.json> --review-result <review-result.json> --output <reviewed-claims.json>`.
Treat an apply-result rejection as a proof-quality blocker, especially when a reviewer tried to satisfy a claim with only possible evidence.
Run `cautilus claim validate --claims <claims.json> --output <validation-report.json>` before depending on a reviewed packet in automation.
If validation exits non-zero, read `cautilus.claim_validation_report.v1` and fix packet shape or evidence refs before planning evals.
For reviewed `cautilus-eval` claims that are `ready-to-verify`, run `cautilus claim plan-evals --claims <reviewed-claims.json> --output <eval-plan.json>` before writing any host-owned fixtures.
Treat `cautilus.claim_eval_plan.v1` as an intermediate planning packet: it can guide fixture creation, but the host repo still owns fixture contents, runner code, prompts, wrappers, and acceptance policy.
When autonomous continuation is already delegated, keep that review inside the stated budget and record the budget in the resulting artifact or handoff.

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
- evaluation and normalization details: [skill-testing.md](references/skill-testing.md), [skill-evaluation.md](references/skill-evaluation.md), [chatbot-normalization.md](references/chatbot-normalization.md), [skill-normalization.md](references/skill-normalization.md), [workflow-normalization.md](references/workflow-normalization.md)
- evidence and optimize: [evidence-bundle.md](references/evidence-bundle.md), [optimization.md](references/optimization.md), [optimization-search.md](references/optimization-search.md), [revision-artifact.md](references/revision-artifact.md)

## Workflow

1. Run `cautilus claim discover` or read its existing proof-plan packet, then restate the selected claim, baseline, intended behavior, and decision boundary.
2. Use `workspace start` for a multi-command run instead of inventing unrelated `/tmp` paths by hand.
3. Use `workspace prepare-compare` when the run needs clean git-ref A/B workspaces.
4. Run adapter-defined preflight commands before long evaluations.
5. Run `cautilus eval test` for checked-in fixtures and read `eval-summary.json` as the first bounded evaluation decision.
6. Build `report.json` only when the workflow needs the broader report/review/evidence/optimize packet layer.
7. If the adapter defines `executor_variants`, run `cautilus review variants` instead of retyping ad hoc shell commands.
8. If review variants are requested but unavailable on the selected adapter, treat that as a gate defect to fix or explicitly waive before release.
9. Use `scenario propose` when normalized proposal candidates already exist and the next move is a checked-in scenario packet.
10. Use optimize or GEPA-style search only after the claim and held-out proof surface are explicit.
11. Report exact commands, exact adapter selection, exact artifact paths, and the final recommendation.

When the target repo is `Cautilus` itself, prefer the checked-in self-dogfood wrappers over rebuilding the mode/report/review chain by hand; see [self-dogfood-runner.md](references/self-dogfood-runner.md) for wrapper entries and claim boundaries.

## Eval And Report Reading

When `eval test` writes `eval-summary.json`, read it in this order:

1. `recommendation`
2. per-case status counts and failed or blocked evaluations
3. expectation results, routing summaries, or surface-specific mismatch details
4. artifact refs and runtime telemetry

When `report build` emits `report.json`, read it in this order:

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

- `eval-cases.json`: product-normalized test cases handed to the host-owned runner.
- `cautilus.claim_proof_plan.v1`: source-ref-backed claim candidates and proof-layer routing, not a verdict.
- `cautilus.claim_validation_report.v1`: claim packet and evidence-ref validation, not evidence discovery.
- `cautilus.claim_eval_plan.v1`: intermediate eval-fixture planning over reviewed claims, not a host fixture writer.
- `eval-observed.json`: observed behavior packet written by the runner.
- `eval-summary.json`: first bounded evaluation decision packet.
- `report.json`: broader report packet for review, evidence, and optimization workflows.
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
