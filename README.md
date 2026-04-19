[한국어 README](./README.ko.md)

# Cautilus

`Cautilus` keeps agent and workflow behavior honest while prompts keep changing.
It is a repo-local contract layer for agent and workflow behavior evaluation: define the behavior you are trying to protect once, then verify it survives prompt, skill, and wrapper changes.
Ships as a standalone binary plus a bundled skill a host repo can install without copying another scaffold first.

## Who It Is For

- teams maintaining agent runtimes or chatbot loops whose prompts and wrappers change frequently
- maintainers shipping repo-owned skills who want protected validation, not trigger-only smoke checks
- operators who want review-ready outputs and explicit comparison evidence before accepting workflow changes

Day-1 trigger: your repo already has behavior that matters, but prompt tweaks and ad hoc evals no longer explain whether a candidate actually got better.

Not for: repos that only need deterministic lint, unit, or type checks and do not have an evaluator-dependent behavior surface.

## Quick Start

```bash
curl -fsSL \
  https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh \
  | sh
cd /path/to/host-repo
cautilus install
cautilus doctor --repo-root . --scope agent-surface
cautilus adapter init --repo-root .
# fill one runnable command template or executor variant in .agents/cautilus-adapter.yaml
cautilus adapter resolve --repo-root .
cautilus doctor --repo-root .
```

Use the two `doctor` scopes deliberately.
`cautilus doctor --scope agent-surface` verifies the bundled skill and local agent-facing surface are installed and discoverable.
`cautilus doctor` without `--scope` stays the repo-wiring gate and proves the repo has a real runnable `Cautilus` evaluation path.
Do not stop at either gate.
When repo-scope `doctor` returns `ready`, use its `first_bounded_run` payload or `cautilus scenarios --json` to choose one archetype and complete one bounded decision loop.

If you want to hand setup to an agent, paste this:

```md
Read and follow: https://raw.githubusercontent.com/corca-ai/cautilus/main/install.md

Install Cautilus on this machine.
Then cd into /path/to/host-repo, install the bundled skill, and verify the setup there.
```

Quick links:

- Homebrew, update, and version details: [install.md](./install.md)
- Full command catalog: [docs/cli-reference.md](./docs/cli-reference.md)
- Public executable spec report: <https://corca-ai.github.io/cautilus/>

That report is generated with `specdown` from the repo's cheap public spec suite.
Each page pairs one bounded product claim with a small executable proof.
The spec pages are the shipped contract.

## One Reviewable Decision Loop

Start here if you want one concrete picture before reading the full surface.
You need one checked-in proposal input, or one new behavior input you want to turn into a reusable scenario.

**Input (CLI)**

```bash
cautilus scenario propose \
  --input ./fixtures/scenario-proposals/standalone-input.json \
  --output /tmp/proposals.json
cautilus scenario render-proposals-html \
  --input /tmp/proposals.json \
  --output /tmp/proposals.html
```

**Input (For Agent)**: "Turn this behavior input into reusable scenarios and render an HTML page I can review."

`Cautilus` turns the evidence into a reviewable proposal packet whose canonical JSON preserves the full ranked proposal set for agents, then renders the same result into a browser-readable page with a bounded attention-first view for humans.
You get back `proposals.json` as the machine-readable truth surface and `proposals.html` as the human review view.
Next step: a human decides whether to promote the scenario into a protected evaluation path, while an agent can reopen the saved result, compare variants, or feed it into the next bounded step.

The same small loop anchors the public spec report in `docs/specs/index.spec.md`.
It is the shortest honest example of the product claim: `Cautilus` turns behavior evidence into a reviewable decision surface.

## Scenarios

Cautilus has three first-class evaluation archetypes.
They share one pipeline — normalize → propose → evaluate → review — but each has its own input shape and starting command.
Read the 1:1 boundary in `docs/specs/archetype-boundary.spec.md`.

### 1. Chatbot conversation regression

Use when a chat or assistant experience gets worse at multi-turn behavior after a prompt change.
Typical failures are forgetting prior turns, answering when it should clarify, or ignoring a stated preference.
CLI: `cautilus scenario normalize chatbot --input logs.json`
For agent: "Run a chatbot regression with these logs and my new system prompt."
You get reopenable `proposals.json` candidates that can be kept out of tuning as protected checks.
When you want a read-only operator page before promoting or refreshing scenarios, use `cautilus scenario review-conversations --input ...` and `cautilus scenario render-conversation-review-html --input ...` against normalized chatbot threads plus proposal candidates.

### 2. Skill / agent execution regression

Use when you change a skill or agent and want to know whether it still triggers on the right prompts, executes cleanly, and keeps its static validation passing.
CLI: `cautilus skill test --repo-root . --adapter-name <name>`
For agent: "Run the checked-in case suite against the skill I just edited."
You get a report, a review file, and compare-ready evidence instead of one trigger-only smoke result.

### 3. Durable workflow recovery

Use when a stateful automation — a CLI workflow, long-running agent session, or pipeline that persists state across invocations — keeps stalling on the same step.
CLI: `cautilus scenario normalize workflow --input runs.json`
For agent: "Look at last week's automation runs and flag anything that stalled on the same step twice."
You get reusable workflow-recovery proposals that keep the operator question attached to concrete evidence.

`cautilus scenarios --json` prints the same catalog for agents that need to discover archetypes programmatically.
Each catalog entry now also includes `exampleInputCli`, so an operator or wrapper can inspect a minimal valid packet shape without opening a fixture path first.
Sample inputs for these archetypes live in `examples/starters/` and the checked-in fixture directories under `fixtures/`.

## Why Cautilus

Prompt strings change.
That is not the real contract.

Concrete picture: you tweak a chatbot system prompt.
One user's follow-up experience improves.
Another user silently loses context recovery across turns.
Anecdotes will not tell you which effect dominates.
`Cautilus` treats the context-recovery case as a protected scenario kept out of tuning so the signal stays honest.
It stores the evidence in a durable file the next maintainer can reopen from disk.
Later docs use the shorthand `held-out` for that protected validation path and `packet` for those reopenable machine-readable files.

The stance, in four contrasts:

- Unlike a prompt manager, `Cautilus` does not freeze one prompt string as the contract — it treats the behavior under evaluation as the contract (`intent-first`).
- Unlike a benchmark scrapbook, `Cautilus` separates iteration from protected validation and keeps evidence reopenable from files (`held-out honesty`, `packet-first`).
- Unlike ad hoc eval scripts, `Cautilus` makes adapters, reports, review files, and compare artifacts first-class product boundaries (`structured review`).
- Unlike open-ended optimizer loops, `Cautilus` keeps search and revision explicitly bounded by budgets, checkpoints, and blocked-readiness conditions (`bounded autonomy`).

`Cautilus` also ships a GEPA-style bounded prompt search seam above the one-shot optimizer: multi-generation reflective mutation, protected reevaluation, frontier-promotion review reuse, checkpoint feedback reinjection, bounded merge synthesis, and Pareto-style frontier selection.
Deep dive: `docs/gepa.md`.

The longer-term direction is close to the workflow philosophy behind DSPy: prompts can change as long as the evaluated behavior survives.

## Core Flow

Two entry points share one `cautilus-adapter.yaml` in the host repo and return the same durable decision surface.

**Operator track — standalone CLI.**
You install Cautilus, declare the evaluation surface, and run bounded evaluation from the command line.

```bash
curl -fsSL \
  https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh \
  | sh
cd /path/to/host-repo
cautilus install
cautilus adapter init
cautilus mode evaluate --mode held_out
```

**Agent track — Claude / Codex plugin.**
The `cautilus install` step also lands a bundled skill at `.agents/skills/cautilus/` with Claude and Codex plugin manifests, so an in-editor agent can drive the same contracts conversationally.
"Run a chatbot regression with these logs" feeds into the exact same adapter.
Use `cautilus doctor --scope agent-surface` when you want to verify only this bundled skill surface.
If the repo treats `AGENTS.md`, `CLAUDE.md`, or linked instruction files as part of the behavior contract, verify that separately with the `instruction-surface` seam rather than assuming install-time discoverability already proves routing fidelity.
For the product repo itself, `instruction-surface` is also a first-class on-demand self-dogfood surface through `npm run dogfood:self:instruction-surface`.

Minimal host-repo layout:

```text
.agents/cautilus-adapter.yaml
.agents/skills/cautilus/
artifacts/<run>/report.json
artifacts/<run>/review-packet.json
```

What the operator gets back is not just a pass/fail bit:

- a repo-local adapter that declares the evaluation surface explicitly
- machine-readable run artifacts (reports and review files) that agents can consume directly
- static HTML views of the same artifacts so a human reviewer can judge them in a browser without an agent in the loop
See `docs/specs/html-report.spec.md` for the rendered contract.
- bounded compare and review surfaces reopenable from files
- a path from observed runtime evidence back to new scenario proposals and bounded revisions

Verification gates:

- `cautilus doctor --scope agent-surface` — bundled skill and local agent-surface discoverability gate
- `cautilus doctor` — repo wiring gate for a runnable evaluation path
- `npm run consumer:onboard:smoke` — shortest end-to-end adoption proof (run from this repo against a fresh consumer)

## Read More

```text
docs/
├── guides/                        # operator and consumer guides
├── contracts/                     # adapter, reports, review, scenarios
├── specs/                         # active product surface + archetypes
├── maintainers/                   # maintainer-only operations and release docs
├── master-plan.md                 # durable direction
├── cli-reference.md               # full CLI command catalog
└── gepa.md                        # GEPA-style prompt search deep-dive
```

Top picks:

- <https://corca-ai.github.io/cautilus/> — standing executable spec report
- [install.md](./install.md) — canonical machine install guide and first post-install checks
- [docs/guides/consumer-adoption.md](./docs/guides/consumer-adoption.md) — canonical fresh-consumer bootstrap path after the binary is on `PATH`
- [docs/guides/evaluation-process.md](./docs/guides/evaluation-process.md) — canonical evaluation loop
- [docs/specs/archetype-boundary.spec.md](./docs/specs/archetype-boundary.spec.md) — chatbot/skill/workflow 1:1 contract
- [docs/contracts/adapter-contract.md](./docs/contracts/adapter-contract.md) — adapter schema
- [docs/contracts/review-packet.md](./docs/contracts/review-packet.md) — review packet boundary
- [docs/cli-reference.md](./docs/cli-reference.md) — full CLI reference
- [docs/maintainers/development.md](./docs/maintainers/development.md) — maintainer dev + self-dogfood
- [docs/gepa.md](./docs/gepa.md) — GEPA-style prompt search
- [docs/master-plan.md](./docs/master-plan.md) — roadmap
- [examples/starters/](./examples/starters/) — archetype-specific starter kits

Dogfood and migration evidence lives in [consumer-readiness.md](./docs/maintainers/consumer-readiness.md), which is an evidence appendix rather than the canonical bootstrap guide.
