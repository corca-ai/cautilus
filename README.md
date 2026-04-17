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
curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh
cautilus install --repo-root /path/to/host-repo
cautilus doctor --repo-root /path/to/host-repo
```

For Homebrew, update, and version surfaces see [install.md](./install.md).
For the full command catalog see [docs/cli-reference.md](./docs/cli-reference.md).
For the standing executable spec report, see <https://corca-ai.github.io/cautilus/>.
That public report is generated with `specdown` from the repo's full cheap public spec suite, with each page pairing a bounded product claim with a small executable proof.

## One Reviewable Decision Loop

Start here if you want one concrete picture before reading the full surface.

What you need:

- one checked-in proposal input or one new behavior input you want to turn into a reusable scenario

Input (CLI):

```bash
cautilus scenario propose --input ./fixtures/scenario-proposals/standalone-input.json --output /tmp/proposals.json
cautilus scenario render-proposals-html --input /tmp/proposals.json --output /tmp/proposals.html
```

Input (For Agent):

- "Turn this behavior input into reusable scenarios and render an HTML page I can review."

What happens:

- `Cautilus` turns raw behavior evidence into a reusable scenario file, then renders the same result into a browser-readable page.

What you get back:

- quick signal: one reusable scenario file was produced without inventing repo-local lore
- durable files: `proposals.json` for later commands and `proposals.html` for human review

What to do next:

- human: decide whether the proposed scenario is worth promoting into a protected evaluation path
- agent: reopen the saved result, compare variants, or feed the proposal into the next evaluation step

The same small loop anchors the public spec report in [docs/specs/index.spec.md](./docs/specs/index.spec.md).
It is the shortest honest example of the product claim: `Cautilus` turns behavior evidence into a reviewable decision surface.

## Scenarios

Cautilus has three first-class evaluation archetypes.
They share one pipeline — normalize → propose → evaluate → review — but each has its own input shape and starting command.
The 1:1 boundary is fixed in [archetype-boundary.spec.md](./docs/specs/archetype-boundary.spec.md).

### 1. Chatbot conversation regression

Use when a chat or assistant experience gets worse at multi-turn behavior after a prompt change.
Typical failures are forgetting prior turns, answering when it should clarify, or ignoring a stated preference.
What you need: conversation summaries plus the baseline and changed prompts.
Input (CLI): `cautilus scenario normalize chatbot --input logs.json`
Input (For Agent): "Run a chatbot regression with these logs and my new system prompt."
What happens: `Cautilus` extracts candidate failures that look like stable conversational regressions.
What you get back: reopenable `proposals.json` candidates that can be kept out of tuning as protected checks.
What to do next: promote the candidate into evaluate/review or revise the prompt with that protected case still guarding the boundary.
Fixture: [chatbot-consumer-input.json](./fixtures/scenario-proposals/samples/chatbot-consumer-input.json).

### 2. Skill / agent execution regression

Use when you change a skill or agent and want to know whether it still triggers on the right prompts, executes cleanly, and keeps its static validation passing.
What you need: the modified skill plus a checked-in case suite.
Input (CLI): `cautilus skill test --repo-root . --adapter-name <name>`
Input (For Agent): "Run the checked-in case suite against the skill I just edited."
What happens: each case runs multiple times for consensus and is scored on trigger accuracy, execution quality, and optional runtime budget.
What you get back: a report, a review file, and compare-ready evidence instead of one trigger-only smoke result.
What to do next: accept the changed skill, inspect the review output, or reopen the saved result for another bounded revision pass.
Fixture: [fixtures/skill-test/cases.json](./fixtures/skill-test/cases.json).

### 3. Durable workflow recovery

Use when a stateful automation — a CLI workflow, long-running agent session, or pipeline that persists state across invocations — keeps stalling on the same step.
What you need: run summaries with `targetId`, `status`, `surface`, and `blockedSteps`.
Input (CLI): `cautilus scenario normalize workflow --input runs.json`
Input (For Agent): "Look at last week's automation runs and flag anything that stalled on the same step twice."
What happens: repeated blockers are normalized into `operator_workflow_recovery` candidates that pin the regression as a repeatable case.
What you get back: reusable workflow-recovery proposals that keep the operator question attached to concrete evidence.
What to do next: route the candidate into compare/review, or use it to justify a targeted workflow repair instead of an anecdotal one-off fix.
Fixture: [workflow-recovery-input.json](./fixtures/scenario-proposals/samples/workflow-recovery-input.json).

`cautilus scenarios --json` prints the same catalog for agents that need to discover archetypes programmatically.

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

`Cautilus` also ships a GEPA-style bounded prompt search seam above the one-shot optimizer: multi-generation reflective mutation, protected reevaluation, and Pareto-style frontier selection.
Deep dive: [docs/gepa.md](./docs/gepa.md).

The longer-term direction is close to the workflow philosophy behind DSPy: prompts can change as long as the evaluated behavior survives.

## Core Flow

Two entry points share one `cautilus-adapter.yaml` in the host repo and return the same durable decision surface.

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
- machine-readable run artifacts (reports and review files) that agents can consume directly
- static HTML views of the same artifacts so a human reviewer can judge them in a browser without an agent in the loop (see [docs/specs/html-report.spec.md](./docs/specs/html-report.spec.md))
- bounded compare and review surfaces reopenable from files
- a path from observed runtime evidence back to new scenario proposals and bounded revisions

Verification gates:

- `cautilus doctor --repo-root .` — wiring gate per repo
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
- [install.md](./install.md) — operator install + update guide for another machine
- [docs/guides/evaluation-process.md](./docs/guides/evaluation-process.md) — canonical evaluation loop
- [docs/specs/archetype-boundary.spec.md](./docs/specs/archetype-boundary.spec.md) — chatbot/skill/workflow 1:1 contract
- [docs/contracts/adapter-contract.md](./docs/contracts/adapter-contract.md) — adapter schema
- [docs/contracts/review-packet.md](./docs/contracts/review-packet.md) — review packet boundary
- [docs/cli-reference.md](./docs/cli-reference.md) — full CLI reference
- [docs/maintainers/development.md](./docs/maintainers/development.md) — maintainer dev + self-dogfood
- [docs/gepa.md](./docs/gepa.md) — GEPA-style prompt search
- [docs/master-plan.md](./docs/master-plan.md) — roadmap
- [examples/starters/](./examples/starters/) — archetype-specific starter kits

Dogfood and migration evidence lives in [consumer-readiness.md](./docs/maintainers/consumer-readiness.md) and [consumer-adoption.md](./docs/guides/consumer-adoption.md).
