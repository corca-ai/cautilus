# Cautilus

`Cautilus` keeps agent and workflow behavior honest while prompts keep changing.
It gives teams a repo-local way to define the behavior they are trying to
protect, separate iterate and held-out checks, run bounded compare and review
flows, and keep evidence in durable packets instead of ad hoc benchmark
narratives.

The target product is a standalone binary plus a bundled skill that a host repo
can adopt without inheriting another repo's private runtime surfaces.
This repo also carries minimal Codex and Claude plugin manifests plus repo-local
marketplace wiring so the same checked-in skill can be installed without
copying it into another scaffold first.

The longer-term direction is close to the workflow philosophy behind DSPy:
intent and evaluation contracts matter more than preserving one prompt
verbatim, and prompts should be allowed to improve as long as the behavior
survives evaluation.

Use `Cautilus` when prompt tweaks, benchmark anecdotes, and repo-local shell
glue are no longer enough to explain whether a candidate actually got better.

Primary wedge:
`Cautilus` is the repo-local contract layer for agent behavior evaluation, not
another prompt manager or benchmark scrapbook.

## Who It Is For

- teams maintaining agent runtimes or chatbot loops whose prompts and wrappers
  change frequently
- maintainers shipping repo-owned skills and wanting held-out validation instead
  of trigger-only smoke checks
- operators who need review packets, comparison artifacts, and explicit
  evidence before accepting workflow changes

Primary buyer:
the maintainer who has to decide whether a prompt, skill, or workflow change is
actually better before shipping it

Day-1 trigger:
your repo already has behavior that matters, but prompt tweaks and ad hoc evals
no longer explain whether the candidate improved

Not for:
repos that only need deterministic lint, unit, or type checks and do not have
an evaluator-dependent behavior surface

## Why Cautilus

Prompt strings change.
That is not the real contract.

`Cautilus` exists for the harder problem: keeping an agent or workflow's
intended behavior honest while prompts, wrappers, and execution details evolve.
It is not primarily a prompt manager or a benchmark scrapbook.
It treats prompts as mutable implementation detail and treats the evaluated
behavior contract as the source of truth.

The practical stance is:

- define the intended behavior explicitly
- separate iterate or train surfaces from held-out validation
- keep evidence, review, and decisions in durable files
- prefer bounded search and bounded revision over open-ended autonomous loops
- let prompts change when held-out behavior and review discipline improve

## Core Flow

The intended loop is simple:

1. install the standalone binary and bundled skill into a host repo
2. define one repo-local adapter that names the behavior surface and the real
   held-out or gate commands
3. run bounded evaluation and review instead of relying on one benchmark score
4. compare baseline and candidate results through reports, review packets, and
   explicit artifacts

What the operator gets back is not only a pass or fail bit:

- a repo-local adapter that declares the evaluation surface explicitly
- machine-readable run artifacts such as report and review packets
- bounded compare and review surfaces that can be reopened later from files
- a path from observed runtime evidence to new scenario proposals and bounded
  revisions

One minimal host-repo path looks like this:

```text
.agents/cautilus-adapter.yaml
.agents/skills/cautilus/
artifacts/<run>/report.json
artifacts/<run>/review-packet.json
```

That is the first real success condition:
the repo can declare its evaluation surface, run it, and reopen the result from
files later.

## Scenarios

Cautilus has three first-class evaluation archetypes. They share the same
pipeline (normalize -> propose -> evaluate -> review), but each has its own
input shape and starting command. Pick the one that matches what you are
actually evaluating. The 1:1 boundary is fixed in
[archetype-boundary.spec.md](./docs/specs/archetype-boundary.spec.md).

### 1. Chatbot conversation regression

Use when a chat or assistant experience gets worse at multi-turn behavior
after a prompt change — forgetting prior turns, answering when it should
clarify, ignoring a preference the user already stated.

- **What you bring.** A JSON file of recent conversation summaries (turns +
  metadata), the baseline prompt, the changed prompt. See
  [chatbot-consumer-input.json](./fixtures/scenario-proposals/chatbot-consumer-input.json)
  for the shape.
- **Input (CLI).** `cautilus scenario normalize chatbot --input logs.json`
- **Input (what to ask an agent).** "Run a chatbot regression with these
  conversation logs and my new system prompt; flag follow-up and
  context-recovery failures."
- **What happens.** Conversations are normalized into follow-up,
  context-recovery, and intent-retention signals. Regressions become
  candidate scenarios held out from tuning.
- **What comes back.** Stdout prints how many candidates and whether
  evidence was sparse; the real output is
  `proposals.json` (`cautilus.scenario_proposals.v1`) that is reopenable
  later.
- **Next action.**
  - You: if a candidate is a real regression, keep it as a saved scenario;
    otherwise drop it.
  - Agent: feed the proposals into `cautilus mode evaluate --mode held_out`
    to turn them into an actual evaluation run.

### 2. Skill / agent execution regression

Use when you change a skill or agent and want to know whether it still
triggers on the right prompts, executes the task cleanly, and keeps its
static validation surfaces passing.

- **What you bring.** The modified skill or agent, a checked-in case suite
  (see [fixtures/skill-test/cases.json](./fixtures/skill-test/cases.json)),
  and the previous evaluation summary if you have one.
- **Input (CLI).** `cautilus skill test --repo-root . --adapter-name <name>`
  (or `cautilus skill evaluate --input summary.json` if a normalized
  packet already exists).
- **Input (what to ask an agent).** "Run the checked-in case suite against
  the skill I just edited and compare trigger accuracy and execution
  quality against the baseline."
- **What happens.** Each case runs through the adapter-owned runner
  multiple times (consensus). Results are scored on trigger accuracy,
  execution quality, and optional runtime budget.
- **What comes back.** Stdout summarizes pass/fail per case plus blockers;
  files include `skill-summary.json`
  (`cautilus.skill_evaluation_summary.v1`), a `review-summary.json`, and
  chained proposal candidates when there are regressions.
- **Next action.**
  - You: if no blocker appears and dimension scores hold, the change is
    safe to land. Otherwise roll back.
  - Agent: pass the summary into `cautilus scenario normalize skill` to
    turn real regressions into saved scenarios.

### 3. Durable workflow recovery

Use when a stateful automation — a CLI workflow, long-running agent
session, or pipeline that persists state across invocations — keeps
getting stuck on the same step, and you want the blocker to stop living as
a paragraph in a doc.

- **What you bring.** Run summaries from the automation, each including
  `targetId`, `status` (`blocked`, `degraded`, `failed`, or `passed`),
  `surface`, and `blockedSteps` where progress stalled. Example:
  [workflow-recovery-input.json](./fixtures/scenario-proposals/workflow-recovery-input.json).
- **Input (CLI).** `cautilus scenario normalize workflow --input workflow-runs.json`
- **Input (what to ask an agent).** "Look at last week's automation runs
  and flag anything that stalled on the same step twice or reported
  success without actual progress."
- **What happens.** Runs with repeated blocked steps (or the same step
  appearing without status change) become `operator_workflow_recovery`
  candidates. The helper emphasizes explicit next-step guidance and
  honest blocker reporting.
- **What comes back.** Stdout prints blocker count and kind
  (`repeated_screen_no_progress`, etc.); files include `proposals.json`
  that fixes the blocker as a repeatable evaluation case.
- **Next action.**
  - You: turn the proposed recovery scenario into a saved case so the
    next release catches the regression instead of repeating a manual
    recovery.
  - Agent: run `cautilus scenario propose` to produce a draft scenario
    and a PR-ready JSON.

## What It Does Today

Current `core validated surface`:

- adapter-driven CLI entrypoints for `install`, `update`, `resolve`, `init`,
  and `doctor`
- explicit A/B workspace preparation through `workspace prepare-compare`
- artifact-root retention through `workspace prune-artifacts`
- bounded runtime execution through `mode evaluate`
- scenario-history-aware profile selection and history updates for
  profile-backed mode runs
- comparison-mode baseline-cache seed materialization for profile-backed runs
- report assembly, review packet assembly, and review-variant fanout
- standalone install surface, local gates, and checked-in release helpers
- repo-local Codex and Claude plugin package and marketplace wiring for local
  skill install

Current `product-owned helper surface`:

- `chatbot` and `skill` normalization helpers
- scenario proposal packet assembly and proposal generation
- scenario telemetry summaries
- normalized evidence bundling
- bounded optimization input and proposal helpers
- GEPA-style bounded prompt search with reflective mutation and held-out
  candidate reevaluation

Dogfood and migration evidence is tracked separately in
[consumer-readiness.md](./docs/consumer-readiness.md),
[consumer-migration.md](./docs/consumer-migration.md), and
[external-consumer-onboarding.md](./docs/external-consumer-onboarding.md).

## Charness Helpers

This repo also carries repo-local adapters for three `charness` workflows that
help maintain the product story around `Cautilus` itself:

- `narrative`: truth-surface alignment for README and adjacent source-of-truth
  docs, writing to `skill-outputs/narrative/narrative.md`
- `find-skills`: local-first capability discovery for this repo, writing to
  `skill-outputs/find-skills/`
- `announcement`: draft-only change communication for this repo, writing to
  `skill-outputs/announcement/announcement.md`

These helpers are intentionally bounded.
`narrative` is for truth-surface alignment, `find-skills` is local-first, and
`announcement` is currently draft-only rather than a delivery backend.

## Why It Is Different

- unlike a prompt manager, `Cautilus` does not treat one frozen prompt string
  as the product contract; it treats the behavior under evaluation as the
  contract
- unlike a benchmark scrapbook, `Cautilus` separates iterate and held-out
  surfaces and keeps the evidence reopenable from files
- unlike ad hoc eval scripts, `Cautilus` makes adapters, reports, review
  packets, and compare artifacts first-class product boundaries
- unlike open-ended optimizer loops, `Cautilus` keeps search and revision
  explicitly bounded by budgets, checkpoints, and blocked-readiness conditions

The underlying principles are:

- `Intent-first`: center the behavior being protected, not one frozen prompt
  string
- `Packet-first`: make important boundaries reopenable from files, not shell
  history
- `Held-out honesty`: do not silently collapse train and held-out into one score
- `Structured review`: do not treat benchmark wins as enough when
  operator-facing behavior can still mislead
- `Bounded autonomy`: stop search and revision on explicit budgets and
  checkpoints

## GEPA-Style Prompt Search

`Cautilus` now includes a bounded search seam above the older one-shot
optimization flow.
It is inspired by DSPy's `GEPA`, but adapted to `Cautilus`'s file-based,
consumer-owned boundary rather than importing DSPy's runtime directly.

Current search behavior:

- `cautilus optimize search prepare-input` materializes a canonical search
  packet from explicit optimize, held-out, and review evidence
- `cautilus optimize search run` keeps a seed candidate, evolves a bounded
  multi-generation frontier with reflective prompt mutations, can synthesize
  one bounded merge candidate from complementary parents, reevaluates
  candidates on held-out scenarios, can run review checkpoints either across
  ranked frontier finalists or at frontier-promotion time, runs final-only
  full-gate checkpoints across ranked frontier finalists, and selects from a
  Pareto-style frontier over per-scenario scores
- cost and latency are recorded as telemetry and tie-break signals rather than
  dominating the primary behavior objective, and declared selection caps make
  over-budget candidates ineligible for final selection without removing them
  from the frontier search record
- sparse evidence blocks search early with machine-readable JSON so an agent or
  operator can discuss what is missing before generating candidates
- the selected candidate bridges back into the bounded
  `cautilus optimize propose` and `cautilus optimize build-artifact` flow

This is intentionally a bounded first slice, not the final word on prompt
evolution.
The current implementation closes multi-generation reflective mutation,
bounded two- or three-parent merge synthesis, held-out reevaluation,
frontier-promotion review checkpoints, scenario-aware checkpoint-feedback
reinjection, scenario-aware bounded merge selection, scenario-aware
merge-prompt feedback from rejected frontier siblings, severity-aware
retention for review-rejected lineage, final-only checkpoint fallback,
selection-cap filtering across ranked frontier finalists,
search-readiness blocking, and proposal bridging.
Later slices can still add richer merge
heuristics, and stronger self-dogfood loops.

## Current Status

This repo is still early, but the product boundary is already real:

- generic workflow and adapter contracts are checked in under `docs/`
- the standalone CLI, bundled skill, installer, and updater are shipped as one
  surface
- local tests, `verify`, release helpers, and consumer onboarding smoke flows
  are checked in with the product
- the public install story is not only prose; it has tagged-release and
  Homebrew surfaces plus verification helpers

After a tag is published, verify the public release surface with
`npm run release:verify-public -- --version <tag>`.

## Proof

The current proof surface is split on purpose:

- `cautilus doctor --repo-root <repo>`: wiring gate
  Use when a repo should be ready against the checked-in contract.
- `npm run consumer:onboard:smoke`: adoption gate
  Use when you want the shortest end-to-end proof that a fresh consumer repo
  can adopt `Cautilus`.
- [docs/consumer-readiness.md](./docs/consumer-readiness.md): evidence appendix
  Use when you need to see which archetypes and self-consumer paths are backed
  by checked-in proof today.
- `npm run verify` and `npm run hooks:check`: repo health gate
  Use when changing the product repo itself and you need the standing surface to
  stay honest.

## Repo Layout

- [docs/evaluation-process.md](./docs/evaluation-process.md): canonical
  evaluation process
- [docs/contracts/active-run.md](./docs/contracts/active-run.md):
  active-run env var contract, default root, and canonical filenames
  that consumer commands default to inside a single workflow
- [docs/contracts/adapter-contract.md](./docs/contracts/adapter-contract.md):
  adapter schema and executor-variant contract
- [docs/contracts/reporting.md](./docs/contracts/reporting.md):
  minimum report packet shape
- [docs/contracts/scenario-history.md](./docs/contracts/scenario-history.md):
  profile, graduation, and baseline-cache contract
- [docs/contracts/scenario-proposal-sources.md](./docs/contracts/scenario-proposal-sources.md):
  runtime-activity source ports for draft scenario proposals
- [docs/contracts/scenario-proposal-inputs.md](./docs/contracts/scenario-proposal-inputs.md):
  normalized input packet consumed by `cautilus scenario propose`
- [docs/contracts/scenario-proposal-normalization.md](./docs/contracts/scenario-proposal-normalization.md):
  host-owned reference seam that assembles split normalized sources
- [docs/contracts/chatbot-normalization.md](./docs/contracts/chatbot-normalization.md):
  product-owned `chatbot` helper boundary for conversation-driven proposal candidates
- [docs/contracts/skill-testing.md](./docs/contracts/skill-testing.md):
  product-owned workflow seam for checked-in local skill tests
- [docs/contracts/skill-evaluation.md](./docs/contracts/skill-evaluation.md):
  product-owned packet boundary for skill trigger and execution evaluation
- [docs/contracts/skill-normalization.md](./docs/contracts/skill-normalization.md):
  product-owned `skill` helper boundary for validation, trigger, and
  execution candidates
- [docs/contracts/workflow-normalization.md](./docs/contracts/workflow-normalization.md):
  product-owned `workflow` helper boundary for durable automation recovery
  candidates
- [docs/contracts/review-packet.md](./docs/contracts/review-packet.md):
  product-owned packet that binds report artifacts to comparison questions and review prompts
- [docs/contracts/review-prompt-inputs.md](./docs/contracts/review-prompt-inputs.md):
  product-owned meta-prompt packet above the review packet boundary
- [docs/contracts/evidence-bundle.md](./docs/contracts/evidence-bundle.md):
  product-owned normalized evidence-bundle seam above host-owned raw readers
- [docs/contracts/optimization.md](./docs/contracts/optimization.md):
  product-owned bounded optimizer input/proposal seam
- [docs/contracts/scenario-results.md](./docs/contracts/scenario-results.md):
  explicit per-mode scenario-results and compare-artifact contract
- [fixtures/scenario-proposals/input.schema.json](./fixtures/scenario-proposals/input.schema.json):
  checked-in schema for `cautilus.scenario_proposal_inputs.v1`
- [fixtures/scenario-proposals/proposals.schema.json](./fixtures/scenario-proposals/proposals.schema.json):
  checked-in schema for `cautilus.scenario_proposals.v1`
- [fixtures/scenario-proposals/chatbot-input.schema.json](./fixtures/scenario-proposals/chatbot-input.schema.json):
  checked-in schema for `cautilus.chatbot_normalization_inputs.v1`
- [fixtures/scenario-proposals/skill-input.schema.json](./fixtures/scenario-proposals/skill-input.schema.json):
  checked-in schema for `cautilus.skill_normalization_inputs.v1`
- [fixtures/scenario-proposals/chatbot-consumer-input.json](./fixtures/scenario-proposals/chatbot-consumer-input.json):
  chatbot-consumer-shaped normalization example packet from one checked-in
  dogfood source
- [fixtures/scenario-proposals/skill-validation-input.json](./fixtures/scenario-proposals/skill-validation-input.json):
  skill-validation-shaped normalization example packet from one checked-in
  dogfood source
- [fixtures/scenario-proposals/workflow-recovery-input.json](./fixtures/scenario-proposals/workflow-recovery-input.json):
  durable-workflow-shaped normalization example packet from one checked-in
  dogfood source
- [fixtures/skill-evaluation/input.json](./fixtures/skill-evaluation/input.json):
  checked-in example packet for skill trigger/execution evaluation
- [fixtures/skill-test/cases.json](./fixtures/skill-test/cases.json):
  checked-in example suite for adapter-driven local skill testing
- [docs/specs/index.spec.md](./docs/specs/index.spec.md):
  active product specs
- [docs/master-plan.md](./docs/master-plan.md): roadmap
  from extraction scaffold to standalone product
- [docs/release-boundary.md](./docs/release-boundary.md):
  current standalone release surface and compatibility discipline
- [install.md](./install.md):
  operator-facing install and update guide for another machine
- [docs/cli-distribution.md](./docs/cli-distribution.md):
  durable install, distribution, and Go-port tradeoffs for the standalone CLI
- [docs/releasing.md](./docs/releasing.md):
  tagged-release checksum, archive, and tap publication workflow
- [scripts/release/run-install-smoke.mjs](./scripts/release/run-install-smoke.mjs):
  install.sh or Homebrew install smoke helper for release verification
- [install.sh](./install.sh):
  curl-install surface for tagged GitHub releases
- [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json):
  repo-local Claude marketplace entry that points at `./plugins/cautilus`
- [plugins/cautilus/.claude-plugin/plugin.json](./plugins/cautilus/.claude-plugin/plugin.json):
  Claude plugin manifest for the packaged local install surface
- [plugins/cautilus/.codex-plugin/plugin.json](./plugins/cautilus/.codex-plugin/plugin.json):
  Codex plugin manifest for the packaged local install surface
- [.agents/plugins/marketplace.json](.agents/plugins/marketplace.json):
  repo-local marketplace entry that points Codex at `./plugins/cautilus`
- [plugins/cautilus/skills/cautilus/SKILL.md](./plugins/cautilus/skills/cautilus/SKILL.md):
  packaged skill copy consumed by the local Codex plugin install flow
- [docs/consumer-readiness.md](./docs/consumer-readiness.md):
  dogfood and live-consumer evidence appendix
- [docs/external-consumer-onboarding.md](./docs/external-consumer-onboarding.md):
  shortest end-to-end path for adopting a fresh consumer repo
- [skills/cautilus/SKILL.md](./skills/cautilus/SKILL.md):
  bundled standalone skill entrypoint
- [scripts/resolve_adapter.mjs](./scripts/resolve_adapter.mjs):
  adapter resolution and validation
- [scripts/init_adapter.mjs](./scripts/init_adapter.mjs):
  adapter scaffold creation
- [scripts/doctor.mjs](./scripts/doctor.mjs):
  adapter readiness diagnosis
- [scripts/agent-runtime/scenario-history.mjs](./scripts/agent-runtime/scenario-history.mjs):
  scenario selection, graduation, and history helpers
- [scripts/agent-runtime/chatbot-proposal-candidates.mjs](./scripts/agent-runtime/chatbot-proposal-candidates.mjs):
  chatbot-shaped conversation and blocked-run summaries to proposal-candidate
  helper
- [scripts/agent-runtime/skill-proposal-candidates.mjs](./scripts/agent-runtime/skill-proposal-candidates.mjs):
  skill-validation and durable-workflow summaries to proposal-candidate helper
- [scripts/agent-runtime/consumer-example-fixtures.test.mjs](./scripts/agent-runtime/consumer-example-fixtures.test.mjs):
  executable proof that multiple checked-in dogfood packet shapes normalize
  cleanly
- [scripts/agent-runtime/scenario-proposals.mjs](./scripts/agent-runtime/scenario-proposals.mjs):
  proposal ranking and draft-scenario payload helpers
- [scripts/agent-runtime/generate-scenario-proposals.mjs](./scripts/agent-runtime/generate-scenario-proposals.mjs):
  standalone proposal packet generator for normalized inputs
- [scripts/agent-runtime/build-review-prompt-input.mjs](./scripts/agent-runtime/build-review-prompt-input.mjs):
  explicit review meta-prompt input builder
- [scripts/agent-runtime/render-review-prompt.mjs](./scripts/agent-runtime/render-review-prompt.mjs):
  generic review meta-prompt renderer
- [scripts/agent-runtime/build-evidence-input.mjs](./scripts/agent-runtime/build-evidence-input.mjs):
  explicit evidence-input packet builder around normalized report/scenario/audit/history sources
- [scripts/agent-runtime/build-evidence-bundle.mjs](./scripts/agent-runtime/build-evidence-bundle.mjs):
  normalized evidence bundle builder with prioritized signals and bounded mining guidance
- [scripts/agent-runtime/build-optimize-input.mjs](./scripts/agent-runtime/build-optimize-input.mjs):
  bounded optimizer input builder around explicit report, review, and history evidence
- [scripts/agent-runtime/generate-optimize-proposal.mjs](./scripts/agent-runtime/generate-optimize-proposal.mjs):
  deterministic bounded revision proposal generator
- [scripts/agent-runtime/run-review-variant.sh](./scripts/agent-runtime/run-review-variant.sh):
  bounded single-variant runner
- [scripts/agent-runtime/run-executor-variants.mjs](./scripts/agent-runtime/run-executor-variants.mjs):
  adapter-driven variant fanout runner
- [bin/cautilus](./bin/cautilus): minimal CLI entrypoint

## Quick Start

For the full operator-facing install guide on another machine, start with
[install.md](./install.md).

Fastest path in a real repo:

```bash
curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh
cd /path/to/host-repo
cautilus install --repo-root .
cautilus adapter init --repo-root .
cautilus adapter resolve --repo-root .
```

The generated adapter is intentionally minimal.
To reach `doctor ready`, wire at least one real runnable path into it.
The smallest possible proof looks like this:

```yaml
held_out_command_templates:
  - node -e "console.log('held out ok')"
```

That example is a smoke-only placeholder, not a meaningful held-out workflow.
In a real repo, the same slot should point at the repo's actual held-out
evaluation command, for example:

```yaml
held_out_command_templates:
  - npm run bench:test -- --baseline-ref {baseline_ref} --samples {held_out_samples}
```

Then run:

```bash
cautilus doctor --repo-root .
```

If you want the shortest end-to-end proof without hand-editing a real consumer
repo, run the checked-in smoke helper from this repo:

```bash
npm run consumer:onboard:smoke
```

What success looks like:

- `.agents/skills/cautilus/` exists in the consumer repo
- `.agents/cautilus-adapter.yaml` exists and resolves cleanly
- `cautilus doctor --repo-root .` returns `ready`

If `doctor` passes, the usual next step is one of these:

- run your repo's first real held-out or full-gate command through the adapter
- prepare an explicit A/B workspace with `cautilus workspace prepare-compare`
- use `npm run consumer:onboard:smoke` when you only need adoption proof, not a
  real consumer evaluation run

Official install and lifecycle commands:

```bash
# install from Homebrew instead of install.sh
brew install corca-ai/tap/cautilus

# inspect local version provenance
cautilus version --verbose

# refresh the CLI and the checked-in bundled skill in a repo
cautilus update --repo-root /path/to/host-repo
```

Before designing adapters, inventory LLM-behavior surfaces first:

- system prompts and prompt assets
- agent or chatbot loops whose behavior needs a judge
- LLM-backed analysis or summarization passes
- operator-facing copy that should be reviewed for intent fidelity

Do not wrap pytest/lint/type/spec checks under `Cautilus`. Keep cheap
deterministic gates in CI or pre-push hooks, then use `scenario propose`,
held-out evaluation, and bounded review variants for the behavior surfaces
that actually need evaluator-backed judgment.

Use the probe surfaces according to what you are actually verifying:

```bash
# binary health, no repo required
cautilus healthcheck --json

# command discovery, safe for wrapper tooling and agent runtimes
cautilus commands --json

# repo readiness for evaluation
cautilus doctor --repo-root /path/to/repo

# local agent-skill discoverability in a consumer repo
cautilus doctor --repo-root /path/to/repo --scope agent-surface
```

`cautilus <subcommand> --help` is expected to exit `0` for the registered
native command surface, including grouped topics such as
`cautilus optimize search --help`.

For Codex local plugin testing, this repo also exposes a packaged plugin
subtree through
[.agents/plugins/marketplace.json](.agents/plugins/marketplace.json)
and
[plugins/cautilus/.codex-plugin/plugin.json](./plugins/cautilus/.codex-plugin/plugin.json).

For Claude local plugin testing, this repo also exposes a repo-local
marketplace through
[.claude-plugin/marketplace.json](.claude-plugin/marketplace.json)
and
[plugins/cautilus/.claude-plugin/plugin.json](./plugins/cautilus/.claude-plugin/plugin.json).
Validate the checked-in Claude surface with:

```bash
claude plugins validate ./.claude-plugin/marketplace.json
claude plugins validate ./plugins/cautilus/.claude-plugin/plugin.json
```

Run the explicit self-dogfood pass for this repo and refresh the latest local
artifacts:

```bash
npm run dogfood:self
```

Run the self-dogfood tuning experiments without changing the canonical latest
bundle:

```bash
npm run dogfood:self:experiments
```

Refresh only the static HTML comparison view of the current latest experiments
bundle, without replaying the experiment reviews:

```bash
npm run dogfood:self:experiments:html
cautilus self-dogfood render-experiments-html
```

Refresh only the static HTML view of the current checked-in self-dogfood
bundle, without replaying the LLM-backed review:

```bash
npm run dogfood:self:html
cautilus self-dogfood render-html
```

The rendered HTML is written alongside the other published files at
`artifacts/self-dogfood/latest/index.html` and is automatically refreshed every
time `npm run dogfood:self` rewrites the latest bundle. The product-owned
renderer is `cautilus self-dogfood render-html`; `npm run dogfood:self:html`
is only a repo-local convenience wrapper around that command. It is a read-only
view of `summary.json`, `report.json`, and `review-summary.json`, so the JSON
files remain the source of truth.

The experiments HTML comparison view is written to
`artifacts/self-dogfood/experiments/latest/index.html` and is automatically
refreshed every time `npm run dogfood:self:experiments` rewrites the latest
experiments bundle. The product-owned renderer is
`cautilus self-dogfood render-experiments-html`; `npm run dogfood:self:experiments:html`
is only a repo-local convenience wrapper around that command. It exists so the
deterministic gate baseline and named experiment adapters can be compared side
by side without reconstructing an A/B diff by hand.

Prepare clean baseline and candidate git worktrees for a compare run:

```bash
cautilus workspace prepare-compare \
  --repo-root /path/to/repo \
  --baseline-ref origin/main \
  --output-dir /tmp/cautilus-compare
```

`--output-dir` is optional. When `CAUTILUS_RUN_DIR` is already pinned by
`cautilus workspace start`, `workspace prepare-compare` materializes
`baseline/` and `candidate/` under that active `runDir`; if nothing is pinned
it auto-materializes a fresh `runDir` under `./.cautilus/runs/` and prints
`Active run: <path>` to stderr.

Prune older Cautilus artifact bundles from a dedicated artifact root:

```bash
cautilus workspace prune-artifacts \
  --root /tmp/cautilus-runs \
  --keep-last 20
```

Start a fresh per-run subdirectory under one stable artifact root and pin it
as the active run for subsequent consumer commands. The default stdout is a
single shell-evalable line, so `eval` is the happy path:

```bash
eval "$(cautilus workspace start --label mode-held-out)"
```

`workspace start` defaults `--root` to `./.cautilus/runs/` (auto-created on
first use) and prints `export CAUTILUS_RUN_DIR=<absolute runDir>`. Pass
`--json` instead of `eval` if a script needs the machine-readable payload.

Normalize chatbot-style conversational summaries into proposal candidates:

```bash
cautilus scenario normalize chatbot \
  --input ./fixtures/scenario-proposals/chatbot-input.json
```

Run one checked-in local skill test through an adapter-owned runner and write
the summary plus chained candidates into one bounded run directory:

```bash
cautilus skill test \
  --repo-root . \
  --adapter-name self-dogfood-skill-test
```

Evaluate one normalized skill packet for trigger accuracy and execution
quality:

```bash
cautilus skill evaluate \
  --input ./fixtures/skill-evaluation/input.json \
  --output /tmp/cautilus-skill-summary.json
```

Normalize skill- or workflow-evaluation summaries into proposal candidates:

```bash
cautilus scenario normalize skill \
  --input /tmp/cautilus-skill-summary.json
```

Generate a scenario proposal packet from normalized candidate input:

```bash
cautilus scenario propose \
  --input ./fixtures/scenario-proposals/standalone-input.json
```

Summarize scenario-level cost, token, and duration telemetry from explicit
result packets:

```bash
cautilus scenario summarize-telemetry \
  --results ./fixtures/scenario-results/example-results.json
```

Build a machine-readable evaluation report packet from explicit mode runs:

```bash
cautilus report build \
  --input ./fixtures/reports/report-input.json
```

Execute one adapter-defined mode directly and emit a report packet:

```bash
cautilus mode evaluate \
  --repo-root . \
  --mode held_out \
  --intent "Operator-facing behavior should remain legible." \
  --baseline-ref origin/main \
  --output-dir /tmp/cautilus-mode
```

`--output-dir` is optional. When `CAUTILUS_RUN_DIR` is already pinned by
`cautilus workspace start`, `mode evaluate` drops its artifacts into that
active `runDir`; if nothing is pinned it auto-materializes a fresh `runDir`
under `./.cautilus/runs/` and prints `Active run: <path>` to stderr so the
operator still sees where the artifacts landed.

Assemble a durable review packet around a report before running review variants:

```bash
cautilus review prepare-input \
  --repo-root . \
  --report-file /tmp/cautilus-mode/report.json
```

Build the product-owned meta-prompt packet and render a review prompt:

```bash
cautilus review build-prompt-input \
  --review-packet /tmp/cautilus-mode/review.json

cautilus review build-prompt-input \
  --review-packet /tmp/cautilus-mode/review.json \
  --output-under-test /tmp/cautilus-mode/analysis-output.json \
  --output-text-key analysis_text

cautilus review build-prompt-input \
  --repo-root . \
  --adapter-name analysis-prompts \
  --scenario-file .agents/cautilus-scenarios/analysis-prompts/proposals.json \
  --scenario replay-negative-path \
  --output-under-test runs/latest/replay-review.json \
  --output-text-key analysis_text

cautilus review render-prompt \
  --input /tmp/cautilus-mode/review-prompt-input.json
```

Prepare normalized evidence input and bundle packets before mining or
optimization:

```bash
cautilus evidence prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --scenario-results-file /tmp/cautilus-mode/scenario-results.json \
  --run-audit-file /tmp/cautilus-run-audit/summary.json \
  --history-file /tmp/cautilus-history/history.json

cautilus evidence bundle \
  --input /tmp/cautilus-evidence/input.json
```

Prepare one bounded optimization packet and generate a deterministic revision
brief from explicit evidence:

```bash
cautilus optimize prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --review-summary /tmp/cautilus-review/summary.json \
  --history-file /tmp/cautilus-history/history.json \
  --target prompt

cautilus optimize propose \
  --input /tmp/cautilus-optimize/input.json
```

Run the GEPA-style bounded prompt search seam above that optimize packet:

```bash
cautilus optimize search prepare-input \
  --optimize-input /tmp/cautilus-optimize/input.json \
  --held-out-results-file /tmp/cautilus-mode/held_out-scenario-results.json \
  --budget medium

cautilus optimize search run \
  --input /tmp/cautilus-run/optimize-search-input.json

cautilus optimize propose \
  --from-search /tmp/cautilus-run/optimize-search-result.json
```

If the repo is not search-ready yet, `optimize search run` returns a blocked
machine-readable result instead of improvising candidate prompts from weak
evidence.

For `light` searches, the default review checkpoint policy stays
`final_only`. For `medium` and `heavy`, it defaults to
`frontier_promotions` unless you override it explicitly.

Assemble that input packet from split normalized source files:

```bash
cautilus scenario prepare-input \
  --candidates ./fixtures/scenario-proposals/candidates.json \
  --registry ./fixtures/scenario-proposals/registry.json \
  --coverage ./fixtures/scenario-proposals/coverage.json \
  --family fast_regression \
  --window-days 14 \
  --now 2026-04-11T00:00:00.000Z
```

Run every executor variant defined by an adapter:

```bash
cautilus review variants \
  --repo-root /path/to/repo \
  --adapter-name code-quality \
  --workspace /path/to/repo \
  --scenario-file /path/to/scenario.json \
  --scenario replay-negative-path \
  --output-under-test /tmp/cautilus-mode/analysis-output.json \
  --output-text-key analysis_text \
  --output-dir /tmp/cautilus-review
```

`review variants` now writes a product-owned `review-summary.json`
(`cautilus.review_summary.v1`) plus one per-variant
`cautilus.review_variant_result.v1` file. A variant can finish as
`passed`, `blocked`, or `failed`; blocked runs are expected to carry machine
readable reason codes instead of prose-only abort text. When
`--output-under-test` is present, the generated review prompt switches into
`output_under_test` mode and treats the referenced artifact as primary
evidence. When `--output-text-key` is present, `Cautilus` also extracts that
JSON narrative span into the rendered prompt so the judge can read the realized
output directly instead of only following a file path.

Direct script usage is also supported:

```bash
node scripts/resolve_adapter.mjs --repo-root .
node scripts/init_adapter.mjs --repo-root .
node scripts/agent-runtime/run-executor-variants.mjs --workspace . --output-dir /tmp/cautilus-review
node scripts/agent-runtime/normalize-chatbot-proposals.mjs --input ./fixtures/scenario-proposals/chatbot-input.json
node scripts/agent-runtime/normalize-skill-proposals.mjs --input ./fixtures/scenario-proposals/skill-input.json
node scripts/agent-runtime/build-scenario-proposal-input.mjs --candidates ./fixtures/scenario-proposals/candidates.json --registry ./fixtures/scenario-proposals/registry.json --coverage ./fixtures/scenario-proposals/coverage.json --family fast_regression
node scripts/agent-runtime/generate-scenario-proposals.mjs --input ./fixtures/scenario-proposals/standalone-input.json
node scripts/agent-runtime/build-evidence-input.mjs --report-file /tmp/cautilus-mode/report.json --scenario-results-file ./fixtures/scenario-results/example-results.json
node scripts/agent-runtime/build-evidence-bundle.mjs --input /tmp/cautilus-evidence/input.json
node scripts/agent-runtime/build-optimize-input.mjs --report-file /tmp/cautilus-mode/report.json --target prompt
node scripts/agent-runtime/generate-optimize-proposal.mjs --input /tmp/cautilus-optimize/input.json
node scripts/agent-runtime/summarize-scenario-telemetry.mjs --results ./fixtures/scenario-proposals/results.json
node scripts/agent-runtime/build-report-packet.mjs --input ./fixtures/reports/report-input.json
node scripts/agent-runtime/evaluate-adapter-mode.mjs --repo-root . --mode held_out --intent "Operator-facing behavior should remain legible." --baseline-ref origin/main --output-dir /tmp/cautilus-mode
```

The bundled skill surface lives at
[skills/cautilus/SKILL.md](./skills/cautilus/SKILL.md).
Use `cautilus install --repo-root .` to materialize that same bundled surface
into a host repo under `.agents/skills/cautilus/`, with `.claude/skills`
symlinked to `.agents/skills` for Claude compatibility. The lower-level
compatibility command `cautilus skills install` remains available when a
workflow needs to call the skill installer directly.

For Codex local plugin testing, the repo also exposes a packaged copy of that
skill through
[plugins/cautilus/.codex-plugin/plugin.json](./plugins/cautilus/.codex-plugin/plugin.json)
and [.agents/plugins/marketplace.json](.agents/plugins/marketplace.json).
Use
[`node ./scripts/release/check-codex-marketplace.mjs --repo-root .`](./scripts/release/check-codex-marketplace.mjs)
to verify that Codex can actually discover the repo marketplace entry.
For Claude local plugin testing, the same packaged subtree is also exposed
through
[plugins/cautilus/.claude-plugin/plugin.json](./plugins/cautilus/.claude-plugin/plugin.json)
and
[.claude-plugin/marketplace.json](.claude-plugin/marketplace.json).
Use `claude plugins validate ./.claude-plugin/marketplace.json` and
`claude plugins validate ./plugins/cautilus/.claude-plugin/plugin.json` to
verify the checked-in Claude manifest shapes.

## Dev

Install the local Node tooling, and make sure Go `1.26.2+`,
`golangci-lint`, and `govulncheck` are available on `PATH` (or under
`$(go env GOPATH)/bin`):

```bash
npm install
npm run hooks:install
go version
golangci-lint --version
govulncheck --version
```

Run checks:

```bash
npm run verify
npm run hooks:check
npm run test:on-demand
npm run dogfood:self
npm run dogfood:self:experiments
```

Use `npm run lint` or `npm run test` directly only when iterating on one seam.
`npm run lint` includes `golangci-lint run`, `go vet`, and `govulncheck`, while
`npm run verify` additionally runs `go test -race` before the standing Node
test suite.

`npm run test:on-demand` is not part of the standing gate. It exists for the
heavier self-dogfood workflow script tests that prove operator-facing quality
record behavior without paying that cost on every `pre-push` and CI verify run.

`hooks:install` is a once-per-clone setup step that points `core.hooksPath` at
the checked-in `.githooks` directory, where `pre-push` runs `npm run verify`.

`dogfood:self` is explicit quality work, not a standing pre-push or CI gate.
It refreshes the latest self-dogfood bundle under
`artifacts/self-dogfood/latest/`. Its canonical claim is intentionally narrow:
it should tell operators whether Cautilus is recording and surfacing its own
self-dogfood result honestly, not whether every stronger binary or skill claim
has already been proven.
That `latest/` bundle is the published snapshot meant to be checked into Git,
so CI or a static HTML report can inspect the latest result without replaying
the LLM-backed review.

`dogfood:self:experiments` is the tuning path for named A/B and split-surface
reviews, including stronger binary and skill surface claims. It writes aggregate
experiment results under
`artifacts/self-dogfood/experiments/latest/`.
That bundle now includes a static `index.html` comparison view for the same
summary/report data, and `npm run dogfood:self:experiments:html` can refresh
that view without rerunning the experiment reviews.

Adapter bootstrap, readiness, and review-variant JSON helpers now live inside
the product-owned Node runtime. The standalone release surface no longer
depends on `python3`.
