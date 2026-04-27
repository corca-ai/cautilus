# Cautilus

`Cautilus` keeps agent and workflow behavior honest while prompts keep changing.
It is a repo-local contract layer for agent and workflow behavior evaluation: define the behavior you are trying to protect once, then verify it survives prompt, skill, and wrapper changes.
The product has three connected jobs:
discover declared behavior claims worth proving, verify those claims through bounded evaluation packets, and improve behavior with budgeted optimization once the proof surface is honest.
Ships as a standalone binary plus a bundled skill a host repo can install without copying another scaffold first.
Agents are first-class users of the product surface.
Commands should emit durable packets with enough state for the next agent to resume, not only terminal prose for a human operator.
`Cautilus` installs as a machine-level binary, but its agent-facing surface is intentionally repo-local.
The binary is shared across repos.
The skill, adapter wiring, prompts, and instruction-routing surface are not.
They stay checked into each host repo so evaluation behavior remains reproducible, reviewable, and owned by the repo that declares it.

## Who It Is For

- teams maintaining agent runtimes or chatbot loops whose prompts and wrappers change frequently
- maintainers shipping repo-owned skills who want protected validation, not trigger-only smoke checks
- operators who want review-ready outputs and explicit comparison evidence before accepting workflow changes

Day-1 trigger: your repo already has behavior that matters, but prompt tweaks and ad hoc evals no longer explain whether a candidate actually got better.

Not for: repos that only need deterministic lint, unit, or type checks and do not have an evaluator-dependent behavior surface.

## Quick Start

Prerequisites:

- native macOS or native Linux
- a target host repo you can edit locally
- `git` available on `PATH`

```bash
curl -fsSL \
  https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh \
  | sh
cd /path/to/host-repo
cautilus install
```

If this machine still has a legacy Homebrew install, remove that copy first and then reinstall through `install.sh`:

```bash
brew uninstall cautilus
curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh
```

If you want to hand setup to an agent, paste this:

```md
Set up Cautilus in this repo.

Repeat this loop:

1. Run `cautilus doctor --repo-root . --next-action`.
2. Do exactly what it says.
3. After each completed step, run `cautilus doctor --repo-root .` to inspect the full state when needed.
4. Stop only when `cautilus doctor --repo-root .` returns `ready: true`.
5. Then read `first_bounded_run` from `cautilus doctor --repo-root .` and complete one bounded run.

If the repo has only named adapters under `.agents/cautilus-adapters/`, follow the `next_action` output and keep using the doctor command it tells you to continue with.
```

Quick links:

- Full command catalog: [docs/cli-reference.md](./docs/cli-reference.md)
- Fresh consumer bootstrap after the binary is on `PATH`: [docs/guides/consumer-adoption.md](./docs/guides/consumer-adoption.md)
- Public executable spec report: <https://corca-ai.github.io/cautilus/>

That report is generated with `specdown` from the repo's cheap public spec suite.
Each page pairs one bounded product claim with a small executable proof.
The spec pages are the shipped contract.

## One Reviewable Decision Loop

Start here if you want one concrete picture before reading the full surface.
You need one checked-in proposal input, or one new behavior input you want to turn into a reusable scenario.
This loop sits in the claim-discovery layer: it turns messy behavior evidence into candidate claims and scenarios before those candidates become protected eval fixtures.

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

Cautilus has three connected product layers.
First, `cautilus claim discover` and scenario proposal surfaces find behavior claims worth proving from adapter-owned entry docs, README.md, AGENTS.md, CLAUDE.md, and linked repo-local Markdown.
Second, `cautilus eval test` / `eval evaluate` verify selected claims through explicit fixtures and summary packets.
Third, optimize and GEPA-style search improve prompts or behavior only after the proof surface is clear.

For the generic first pass, ask for a proof plan:

```bash
cautilus claim discover --repo-root . --output /tmp/cautilus-claims.json
cautilus claim show --input /tmp/cautilus-claims.json
cautilus claim review prepare-input --claims /tmp/cautilus-claims.json --output /tmp/cautilus-claim-review-input.json
cautilus claim review apply-result --claims /tmp/cautilus-claims.json --review-result /tmp/cautilus-claim-review-result.json --output /tmp/cautilus-reviewed-claims.json
cautilus claim validate --claims /tmp/cautilus-reviewed-claims.json --output /tmp/cautilus-claim-validation.json
cautilus claim plan-evals --claims /tmp/cautilus-reviewed-claims.json --output /tmp/cautilus-eval-plan.json
```

The output is `cautilus.claim_proof_plan.v1`: source-ref-backed candidate claims with split proof, readiness, evidence, review, and lifecycle fields.
It is not a verdict that the repo is correct.
For agents, the bundled skill turns that packet into a status workflow: scan scope first, existing-packet summary via `claim show`, then a separate review budget before `claim review prepare-input` creates deterministic clusters for LLM-backed review.
When reviewed clusters come back, `claim review apply-result` merges reviewed labels and evidence refs while enforcing that possible evidence cannot satisfy a claim.
`claim validate` emits `cautilus.claim_validation_report.v1` and exits non-zero when packet shape or evidence refs are invalid.
For reviewed `cautilus-eval` claims, `claim plan-evals` emits `cautilus.claim_eval_plan.v1`: an intermediate plan for host-owned eval fixtures, not a writer for prompts, runners, fixtures, or policy.
Next branches stay explicit: deterministic proof, Cautilus scenarios, alignment work, or a full report.

Cautilus exposes two top-level evaluation surfaces (`dev` and `app`) with four presets between them.
Use `dev` for AI-assisted development work such as repo contracts, tools, and skills.
Use `app` for AI-powered product behavior such as chat, prompt, and service responses.
The legacy first-class archetype boundary (chatbot / skill / workflow) is retired.
For the live contract, read [docs/specs/evaluation-surfaces.spec.md](./docs/specs/evaluation-surfaces.spec.md).
The `chatbot`, `skill`, and `workflow` `scenario normalize` helpers below still ship; they feed the proposal-input pipeline rather than the evaluation surface.

### 1. Chatbot conversation regression

Use when a chat or assistant experience gets worse at multi-turn behavior after a prompt change.
Typical failures are forgetting prior turns, answering when it should clarify, or ignoring a stated preference.
CLI: `cautilus scenario normalize chatbot --input logs.json`
For agent: "Run a chatbot regression with these logs and my new system prompt."
You get reopenable `proposals.json` candidates that can be kept out of tuning as protected checks.
When you want a read-only operator page before promoting or refreshing scenarios, use `cautilus scenario review-conversations --input ...` and `cautilus scenario render-conversation-review-html --input ...` against normalized chatbot threads plus proposal candidates.

### 2. Skill / agent execution regression

Use when you change a skill or agent and want to know whether it still triggers on the right prompts, executes cleanly, and keeps its static validation passing.
CLI: `cautilus eval test --repo-root . --adapter-name <name>` with a `surface=dev, preset=skill` fixture
For agent: "Run the checked-in case suite against the skill I just edited."
You get `eval-cases.json`, `eval-observed.json`, and `eval-summary.json` instead of one trigger-only smoke result.
The same preset can evaluate a multi-turn agent episode when the fixture provides `turns`; Cautilus's own first-scan, refresh-flow, and review-prepare dogfood fixtures derive their results from audit packets.
When the goal is only to prove command routing and packet evaluation, `cautilus eval test --runtime fixture` can run the same product path with adapter-owned fixture results instead of launching a nested model eval.

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

- Unlike a dashboard-first review tool, `Cautilus` treats packets, CLI commands, and repo instructions as agent-facing interfaces first; HTML is a human-readable mirror, not the source of truth.
- Unlike a prompt manager, `Cautilus` does not freeze one prompt string as the contract — it treats the behavior under evaluation as the contract (`intent-first`).
- Unlike a benchmark scrapbook, `Cautilus` separates iteration from protected validation and keeps evidence reopenable from files (`held-out honesty`, `packet-first`).
- Unlike ad hoc eval scripts, `Cautilus` makes adapters, reports, review files, and compare artifacts first-class product boundaries (`structured review`).
- Unlike open-ended optimizer loops, `Cautilus` keeps search and revision explicitly bounded by budgets, checkpoints, and blocked-readiness conditions (`bounded autonomy`).

The proof layers are deliberately split because humans, code, and AI are good at different work.
Human-auditable claims stay readable.
Deterministic claims belong in ordinary tests and CI.
Evaluator-dependent behavior goes through `cautilus eval`.
Improvement work waits until the proof surface is explicit.

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
cautilus eval test --fixture <fixture.json>
```

**Agent track — Claude / Codex plugin.**
The `cautilus install` step also lands a bundled skill at `.agents/skills/cautilus/` with Claude and Codex plugin manifests, so an in-editor agent can drive the same contracts conversationally.
"Run a chatbot regression with these logs" feeds into the exact same adapter.
Use `cautilus doctor --scope agent-surface` when you want to verify only this bundled skill surface.
If the repo treats `AGENTS.md`, `CLAUDE.md`, or linked instruction files as part of the behavior contract, verify that separately with the `cautilus eval` seam (preset `dev / repo`) rather than assuming install-time discoverability already proves routing fidelity.
For the product repo itself, this is also a first-class on-demand self-dogfood surface through `npm run dogfood:self`; see [docs/specs/evaluation-surfaces.spec.md](./docs/specs/evaluation-surfaces.spec.md) for the evaluation-surfaces design.

Minimal host-repo layout:

```text
.agents/cautilus-adapter.yaml
.agents/skills/cautilus/
artifacts/<run>/eval-cases.json
artifacts/<run>/eval-observed.json
artifacts/<run>/eval-summary.json
```

What the operator gets back is not just a pass/fail bit:

- a repo-local adapter that declares the evaluation surface explicitly
- machine-readable eval, report, review, evidence, and optimization packets that agents can consume directly
- static HTML views of the same artifacts so a human reviewer can judge them in a browser without an agent in the loop
See `docs/specs/html-report.spec.md` for the rendered contract.
- bounded compare and review surfaces reopenable from files
- a path from observed runtime evidence back to new scenario proposals and bounded revisions

Verification gates:

- `cautilus doctor --next-action` — one current onboarding step plus the exact continuation loop
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
- [docs/guides/consumer-adoption.md](./docs/guides/consumer-adoption.md) — canonical fresh-consumer bootstrap path after the binary is on `PATH`
- [docs/guides/evaluation-process.md](./docs/guides/evaluation-process.md) — canonical evaluation loop
- [docs/specs/evaluation-surfaces.spec.md](./docs/specs/evaluation-surfaces.spec.md) — surface/preset/composition contract for `cautilus eval test`/`evaluate`
- [docs/contracts/adapter-contract.md](./docs/contracts/adapter-contract.md) — adapter schema
- [docs/contracts/review-packet.md](./docs/contracts/review-packet.md) — review packet boundary
- [docs/cli-reference.md](./docs/cli-reference.md) — full CLI reference
- [docs/maintainers/development.md](./docs/maintainers/development.md) — maintainer dev + self-dogfood
- [docs/maintainers/operator-acceptance.md](./docs/maintainers/operator-acceptance.md) — human takeover and acceptance checklist
- [docs/gepa.md](./docs/gepa.md) — GEPA-style prompt search
- [docs/master-plan.md](./docs/master-plan.md) — roadmap
- [examples/starters/](./examples/starters/) — archetype-specific starter kits

Dogfood and migration evidence lives in [consumer-readiness.md](./docs/maintainers/consumer-readiness.md), which is an evidence appendix rather than the canonical bootstrap guide.
