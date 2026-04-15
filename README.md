# Cautilus

`Cautilus` keeps agent and workflow behavior honest while prompts keep changing.
It is a repo-local contract layer for agent and workflow behavior evaluation: define the behavior you are trying to protect once, then verify it survives prompt, skill, and wrapper changes.
Ships as a standalone binary plus a bundled skill a host repo can install without copying another scaffold first.

## Who It Is For

- teams maintaining agent runtimes or chatbot loops whose prompts and wrappers change frequently
- maintainers shipping repo-owned skills who want held-out validation, not trigger-only smoke checks
- operators who need review packets and explicit comparison artifacts before accepting workflow changes

Day-1 trigger: your repo already has behavior that matters, but prompt tweaks and ad hoc evals no longer explain whether a candidate actually got better.

Not for: repos that only need deterministic lint, unit, or type checks and do not have an evaluator-dependent behavior surface.

## Quick Start

```bash
curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh
cautilus install --repo-root /path/to/host-repo
cautilus doctor --repo-root /path/to/host-repo
```

For Homebrew, update, and version surfaces see [install.md](./install.md).
For the full command catalog see [docs/cli-reference.md](./docs/cli-reference.md).

## Scenarios

Cautilus has three first-class evaluation archetypes.
They share one pipeline — normalize → propose → evaluate → review — but each has its own input shape and starting command.
The 1:1 boundary is fixed in [archetype-boundary.spec.md](./docs/specs/archetype-boundary.spec.md).

### 1. Chatbot conversation regression

Use when a chat or assistant experience gets worse at multi-turn behavior after a prompt change — forgetting prior turns, answering when it should clarify, ignoring a stated preference.
Bring conversation summaries plus the baseline and changed prompts; run `cautilus scenario normalize chatbot --input logs.json`.
Regressions become candidate scenarios held out from tuning, saved in a reopenable `proposals.json`.
Fixture: [chatbot-consumer-input.json](./fixtures/scenario-proposals/samples/chatbot-consumer-input.json).

### 2. Skill / agent execution regression

Use when you change a skill or agent and want to know whether it still triggers on the right prompts, executes cleanly, and keeps its static validation passing.
Bring the modified skill plus a checked-in case suite; run `cautilus skill test --repo-root . --adapter-name <name>`.
Each case runs multiple times for consensus and is scored on trigger accuracy, execution quality, and optional runtime budget.
Fixture: [fixtures/skill-test/cases.json](./fixtures/skill-test/cases.json).

### 3. Durable workflow recovery

Use when a stateful automation — a CLI workflow, long-running agent session, or pipeline that persists state across invocations — keeps stalling on the same step.
Bring run summaries with `targetId`, `status`, `surface`, and `blockedSteps`; run `cautilus scenario normalize workflow --input runs.json`.
Repeated blockers become `operator_workflow_recovery` candidates that pin the regression as a repeatable case.
Fixture: [workflow-recovery-input.json](./fixtures/scenario-proposals/samples/workflow-recovery-input.json).

Agent-facing phrasing works too: "run a chatbot regression with these logs and my new system prompt" / "run the checked-in case suite against the skill I just edited" / "look at last week's automation runs and flag anything that stalled on the same step twice".
`cautilus scenarios --json` prints the same catalog for agents that need to discover archetypes programmatically.

## Why Cautilus

Prompt strings change.
That is not the real contract.

Concrete picture: you tweak a chatbot system prompt.
One user's follow-up experience improves.
Another user silently loses context recovery across turns.
Anecdotes will not tell you which effect dominates.
`Cautilus` treats the context-recovery case as a *held-out scenario* — kept out of tuning so the signal stays honest — and stores the evidence in a durable *packet* the next maintainer can reopen from files.

The stance, in four contrasts:

- Unlike a prompt manager, `Cautilus` does not freeze one prompt string as the contract — it treats the behavior under evaluation as the contract (`intent-first`).
- Unlike a benchmark scrapbook, `Cautilus` separates iterate and held-out surfaces and keeps evidence reopenable from files (`held-out honesty`, `packet-first`).
- Unlike ad hoc eval scripts, `Cautilus` makes adapters, reports, review packets, and compare artifacts first-class product boundaries (`structured review`).
- Unlike open-ended optimizer loops, `Cautilus` keeps search and revision explicitly bounded by budgets, checkpoints, and blocked-readiness conditions (`bounded autonomy`).

`Cautilus` also ships a GEPA-style bounded prompt search seam above the one-shot optimizer — multi-generation reflective mutation, held-out reevaluation, Pareto-style frontier selection.
Deep dive: [docs/gepa.md](./docs/gepa.md).

The longer-term direction is close to the workflow philosophy behind DSPy: prompts can change as long as the evaluated behavior survives.

## Core Flow

Two entry points share one `cautilus-adapter.yaml` in the host repo.

**Operator track — standalone CLI.**
You install Cautilus, declare the evaluation surface, and run bounded evaluation from the command line.

```bash
curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh
cautilus install --repo-root .
cautilus adapter init --repo-root .
cautilus mode evaluate --repo-root . --mode held_out
```

**Agent track — Claude / Codex plugin.**
The `cautilus install` step also lands a bundled skill at `.agents/skills/cautilus/` with Claude and Codex plugin manifests, so an in-editor agent can drive the same contracts conversationally.
"Run a chatbot regression with these logs" feeds into the exact same adapter.

Minimal host-repo layout:

```text
.agents/cautilus-adapter.yaml
.agents/skills/cautilus/
artifacts/<run>/report.json
artifacts/<run>/review-packet.json
```

What the operator gets back is not just a pass/fail bit:

- a repo-local adapter that declares the evaluation surface explicitly
- machine-readable run artifacts (report and review packets)
- bounded compare and review surfaces reopenable from files
- a path from observed runtime evidence back to new scenario proposals and bounded revisions

Verification gates:

- `cautilus doctor --repo-root .` — wiring gate per repo
- `npm run consumer:onboard:smoke` — shortest end-to-end adoption proof (run from this repo against a fresh consumer)

## Read More

```text
docs/
├── evaluation-process.md          # canonical evaluation loop
├── contracts/                     # adapter, reports, review, scenarios
├── specs/                         # active product surface + archetypes
├── master-plan.md                 # durable direction
├── cli-reference.md               # full CLI command catalog
├── development.md                 # dev setup + self-dogfood workflow
└── gepa.md                        # GEPA-style prompt search deep-dive
```

Top picks:

- [install.md](./install.md) — operator install + update guide for another machine
- [docs/evaluation-process.md](./docs/evaluation-process.md) — canonical evaluation loop
- [docs/specs/archetype-boundary.spec.md](./docs/specs/archetype-boundary.spec.md) — chatbot/skill/workflow 1:1 contract
- [docs/contracts/adapter-contract.md](./docs/contracts/adapter-contract.md) — adapter schema
- [docs/contracts/review-packet.md](./docs/contracts/review-packet.md) — review packet boundary
- [docs/cli-reference.md](./docs/cli-reference.md) — full CLI reference
- [docs/development.md](./docs/development.md) — dev + self-dogfood
- [docs/gepa.md](./docs/gepa.md) — GEPA-style prompt search
- [docs/master-plan.md](./docs/master-plan.md) — roadmap
- [examples/starters/](./examples/starters/) — archetype-specific starter kits

Dogfood and migration evidence lives in [consumer-readiness.md](./docs/consumer-readiness.md), [consumer-migration.md](./docs/consumer-migration.md), and [external-consumer-onboarding.md](./docs/external-consumer-onboarding.md).
