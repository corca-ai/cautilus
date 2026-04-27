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

## Product Shape

`Cautilus` is a standalone binary plus this bundled skill.
Host repos own adapters, fixtures, prompts, wrappers, and policy.
The binary owns command discovery, packet examples, deterministic scans, validation, and reusable evaluation artifacts.
The skill owns routing, sequencing, user-facing decision boundaries, and LLM-backed review work.

The three product front doors are:

- `claim`: discover declared behavior claims and turn them into proof plans.
- `eval`: verify bounded intentful behavior with explicit fixtures and adapters.
- `optimize`: improve behavior only after the claim and held-out proof surface are explicit.

## CLI First

Resolve the binary before workflow commands:

```bash
CAUTILUS_BIN=cautilus
if [ -x ./bin/cautilus ]; then CAUTILUS_BIN=./bin/cautilus; fi
```

Let the binary print command families and packet examples.
Use `"$CAUTILUS_BIN" commands --json`, `"$CAUTILUS_BIN" --help`, or a command's `--example-input` / `--example-output` surface instead of copying broad command lists into the answer.
The portable forms are `cautilus commands --json` and `cautilus --help`.
Use [command-cookbook.md](references/command-cookbook.md) only after the binary has identified the relevant command family and a concrete multi-step invocation is needed.

## No-Input Orientation

When invoked with no task detail, orient first:

```bash
"$CAUTILUS_BIN" agent status --repo-root . --json
```

Read `cautilus.agent_status.v1` as the current product map.
Summarize binary health, agent-surface readiness, adapter state, claim-state availability, scan entries, linked Markdown depth, and `nextBranches`.
Then help the user pick the next branch or stop.
Present branch labels and reasons in coordinator-facing language first.
Keep internal branch ids as secondary references, not the option title.
Treat each `nextBranches[].label` as the human choice name.
The branch `id` is for stable packet references and should only appear after the label when it helps auditability.

If `nextBranches` includes `initialize_adapter` and the user delegated setup continuation, run the adapter setup branch and then rerun `agent status`.
If claim state is missing, present the bounded scan entries and depth before entering claim discovery.
If claim state exists, read or refresh that packet before planning new proof work.
Branch execution starts from the selected branch; no-input orientation is a status turn, not an eval, review, optimize, edit, or commit turn.
Branch execution confirmation is evidence-backed.
When the user selects a numbered branch from a previous orientation turn, rerun `"$CAUTILUS_BIN" agent status --repo-root . --json` before any branch that writes or overwrites the saved claim map, launches review, plans evals, edits files, or commits.
For the refresh-plan branch, it is acceptable to proceed from the immediately preceding orientation when the command only writes a separate refresh-plan artifact and the agent does not claim it rechecked status.
If you say you rechecked status, the command log must show that fresh status command before the branch command.
This prevents a stale `run_first_claim_scan` or stale review/eval choice from overwriting useful state.
If the current status no longer matches the selected branch, summarize the new status and ask for the next branch instead of continuing from the stale menu.

## Declared Claim Discovery

Use this path when the user asks whether a repo proves what it claims, whether docs and behavior are aligned, or which scenarios still need to be created.
Do not hard-code the search to README.
By default, the binary starts from adapter-owned `claim_discovery.entries` or README.md/AGENTS.md/CLAUDE.md and follows repo-local Markdown links to depth 3.
Use repeated `--source` arguments only when the user or adapter has selected an explicit truth-surface inventory.

Initial scan:

```bash
"$CAUTILUS_BIN" claim discover --repo-root . --output <claims.json>
cautilus claim discover --repo-root . --output <claims.json>
```

Refresh from existing state:

```bash
"$CAUTILUS_BIN" claim discover --previous <claims.json> --refresh-plan --output <refresh-plan.json>
```

Read `refreshSummary` first.
Explain it as a saved claim map catching up to current repo changes, not as a completed claim refresh.
Say what was recorded, what was not changed yet, and which next choice is safest.
Prefer labels such as "compare the saved claim map with recent repo changes" and "update the saved claim map before review or eval planning"; include internal branch ids only as references when needed.
After writing a refresh plan, inspect `.refreshSummary` directly, for example with `jq '.refreshSummary' <refresh-plan.json>`.
Do not reconstruct `changedClaimCount`, `carriedForwardClaimCount`, or source hotspots from raw `changedSources` or `claimPlan` when `refreshSummary` exists.

Status from existing state:

```bash
"$CAUTILUS_BIN" claim show --input <claims.json> --sample-claims 10
```

Classify each candidate claim before creating fixtures:

- `human-auditable`: the claim can be checked by reading current source or docs.
- `deterministic`: the claim belongs in unit, lint, type, build, or CI checks.
- `cautilus-eval`: the claim needs model, agent, prompt, skill, or workflow behavior evidence.
- `scenario-candidate`: the claim needs normalized proposal input before it becomes a protected eval fixture.
- `alignment-work`: the code, docs, adapter, or skill surface must be reconciled before proof would be honest.

After discovery or refresh, summarize scanned entry files, linked Markdown count and depth, raw candidate count, claim summary by proof mechanism/readiness/evidence/review/lifecycle, and the groups that look ready for deterministic tests, Cautilus scenarios, alignment work, or human-auditable review.
When the next natural branch is claim review, explain that it is a budgeted LLM review branch before presenting it as a choice.
The coordinator should understand that choosing review means setting a review budget before any reviewer lanes, result application, eval planning, edits, or commits happen.
Use `claim show --sample-claims <n>` as the canonical status view before hand-inspecting packet fields.
If `claim show` or `agent status` reports `gitState.isStale=true`, run `claim discover --previous <claims.json> --refresh-plan` before claim review, review-result application, or eval planning.
Do not launch reviewers, apply review results, plan evals, edit files, or commit artifacts from a stale claim packet unless the user explicitly asks to override stale state.
If a view is missing, prefer adding a product-owned summary option or review packet over guessing raw JSON keys with ad hoc `jq`.
If a new discovery run changes only volatile metadata such as the reviewed git commit and not source inventory, candidate claims, labels, or evidence refs, report it as a semantic no-op and do not create a pointer-only commit.

When reporting a refresh-plan result to a coordinator, use this shape:

- What I did: recorded a comparison between the saved claim map and the current checkout.
- What I found: cite `refreshSummary.changedSourceCount`, `changedClaimCount`, `carriedForwardClaimCount`, and the top `changedClaimSources`.
- What I did not do: did not update the saved claim map, review claims, plan evals, or edit product files unless the user selected that branch.
- Recommended next choice: use the first safe `refreshSummary.nextActions` item in plain language.

LLM-backed claim review is a separate branch.
Before launching it, state the review budget: maximum clusters, parallel lanes, clusters per reviewer, excerpt budget, retry policy, and skipped-cluster policy.
Then run `claim review prepare-input`, give the deterministic clusters to reviewers, apply `cautilus.claim_review_result.v1`, validate the reviewed packet, and only then plan eval fixtures for reviewed `cautilus-eval` claims that are `ready-to-verify`.
The review and eval-planning commands reject stale claim packets by default; treat that error as a prompt to refresh, not as a reason to pass `--allow-stale-claims` automatically.

## Eval Routing

`Cautilus` has two top-level evaluation surfaces and four fixture presets.
Use `dev` for AI-assisted development work such as repo contracts, tools, and skills.
Use `app` for AI-powered product behavior such as chat, prompt, and service responses.
The canonical command families are `claim`, `eval`, and `optimize`.
Use `cautilus eval test --fixture <fixture.json>` when the repo already has a checked-in fixture and adapter-owned runner.
When the agent runtime is read-only, pass an explicit writable `--output-dir`; prefer `/dev/shm/cautilus-<label>` when available, otherwise a writable external temp directory.
For a fixture-runtime smoke where `doctor --scope agent-surface` or `agent status` already shows the local skill surface is ready, `--skip-preflight` is the right boundary in a read-only agent runtime; state that preflight was skipped because the ready state was already observed.
Use `cautilus scenarios --json` only when you need the proposal-input normalization catalog.

Routing rule:

- `dev / repo`: an AI development agent must obey the repo work contract.
- `dev / skill`: a checked-in or portable development skill must still trigger, execute, and validate cleanly.
- `app / chat`: multi-turn product conversation behavior regressed after a prompt or wrapper change.
- `app / prompt`: a single product input/output behavior must remain stable.

For scenario proposal input shapes, prefer the relevant `--example-input` command from `cautilus scenarios --json` over hand-written JSON.

Use `cautilus doctor --repo-root .` when the selected branch is repo evaluation readiness.
Use `cautilus doctor --repo-root . --scope agent-surface` or `doctor --scope agent-surface` when the selected branch is only local bundled-skill install/readiness.

## Workflow

1. Start from `agent status`, an explicit user branch, or an existing Cautilus packet.
2. Restate the selected claim, baseline, intended behavior, and decision boundary.
3. Use `workspace start` for a multi-command run instead of inventing unrelated `/tmp` paths by hand.
4. Use `workspace prepare-compare` when the run needs clean git-ref A/B workspaces.
5. Run adapter-defined preflight commands before long evaluations.
6. Run `cautilus eval test` for checked-in fixtures and read `eval-summary.json` as the first bounded evaluation decision.
7. Build `report.json` only when the workflow needs the broader report/review/evidence/optimize packet layer.
8. If the adapter defines `executor_variants`, run `cautilus review variants` instead of retyping ad hoc shell commands.
If review variants are requested but unavailable on the selected adapter, treat that as a gate defect to fix or explicitly waive before release.
9. Use `scenario propose` when normalized proposal candidates already exist and the next move is a checked-in scenario packet.
10. Use optimize or GEPA-style search only after the claim and held-out proof surface are explicit.
11. Report exact commands, exact adapter selection, exact artifact paths, and the final recommendation.

When the target repo is `Cautilus` itself, prefer the checked-in self-dogfood wrappers over rebuilding the mode/report/review chain by hand; see [self-dogfood-runner.md](references/self-dogfood-runner.md) for wrapper entries and claim boundaries.

## Packet Reading

Use product-owned outputs instead of paraphrasing command results from memory.

- `cautilus.agent_status.v1`: no-input orientation over binary health, agent surface, adapter, claim state, scan scope, and next branches.
- `cautilus.claim_proof_plan.v1`: source-ref-backed claim candidates and proof-layer routing, not a verdict.
- `cautilus.claim_status_summary.v1`: grouped status from an existing claim packet.
- `cautilus.claim_validation_report.v1`: claim packet and evidence-ref validation, not evidence discovery.
- `cautilus.claim_eval_plan.v1`: intermediate eval-fixture planning over reviewed claims, not a host fixture writer.
- `eval-cases.json`: product-normalized test cases handed to the host-owned runner.
- `eval-observed.json`: observed behavior packet written by the runner.
- `eval-summary.json`: first bounded evaluation decision packet.
- `report.json`, `review.json`, `review-summary.json`, `evidence-bundle.json`: broader decision packets for review, evidence, and improvement workflows.
- `optimize-input.json`, `optimize-search-result.json`, `optimize-proposal.json`, `revision-artifact.json`: bounded optimization and handoff packets.

Humans usually read HTML renders first, then the underlying packet if they need exact fields.
Agents should read the packet first, then cite HTML only when a browser view is the deliverable.

## Guardrails

- Keep host-repo fixtures, prompts, wrappers, and acceptance policy outside the product boundary.
- Prefer CLI examples and schemas over hand-written packet JSON.
- Treat deterministic tests and CI checks as host-owned proof when they are cheaper and stronger than an LLM behavior evaluation.
- Treat review loops and optimizer output as bounded decision artifacts, not open-ended retries.
