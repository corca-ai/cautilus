# Cautilus

`Cautilus` is the framework for discovering, evaluating, and improving agent behavior.
It lets you pin down the behavior that matters, prove it survives every change to your prompts, skills, and models, and improve it within explicit budgets—whether you're protecting an `AGENTS.md`, a single skill, a prompt, or a full agent loop.
The three jobs connect: discover the declared behavior claims worth proving from selected source docs, verify the curated claims through bounded evaluation packets, and improve behavior once the proof surface is honest.
`Cautilus` ships as a standalone binary plus Cautilus Agent, which a host repo can install without copying another scaffold first.
Agents are first-class users of the product surface.
Commands should emit durable packets with enough state for the next agent to resume, not only terminal prose for a human operator.
`Cautilus` installs as a machine-level binary, but its agent-facing surface is intentionally repo-local.
The binary is shared across repos.
The Cautilus Agent surface, adapter wiring, prompts, and instruction-routing surface are not.
They stay checked into each host repo so evaluation behavior remains reproducible, reviewable, and owned by the repo that declares it.

## What's Ready Today

Cautilus proves its own promises with honest badges ([the apex spec](./docs/specs/index.spec.md)): all seven apex promises currently carry **proven** badges in the surface audit.
That does not erase narrower proof debt.
Behavior evaluation is proven on the dev coding-agent surfaces while the app-ship surfaces still name live/product-runner proof debt; bounded improvement is proven on the dev/skill surface; reviewable artifacts and a testable-agent readiness surface are proven deterministically; host ownership is proven through a human-auditable fresh-consumer onboarding capture.
For cross-repo adoption, the bounded evaluation loop is the most ready slice: host repos can use `cautilus evaluate fixture`, `cautilus evaluate observation`, and post-run `cautilus evaluate skill-experiment` with checked-in fixtures, host-owned adapters, preserved task packets, and the current evaluation and skill-experiment report packets.
`cautilus evaluate skill-experiment` compares host-preserved baseline and variant outputs; it does not clone, install, or execute skills.
Claim discovery and bounded improvement ship today and are opt-in for host repos that adopt them.

## Who It Is For

- teams maintaining agent runtimes or chatbot loops whose prompts, skills, and models change frequently
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
cautilus init
```

You can also hand setup to an agent instead of running these steps yourself.

Quick links:

- What Cautilus promises: [docs/specs/user/index.spec.md](./docs/specs/user/index.spec.md)
- Maintainer claim map: [docs/specs/contracts/index.spec.md](./docs/specs/contracts/index.spec.md)
- Start here — Cautilus, proven on itself: [docs/specs/index.spec.md](./docs/specs/index.spec.md)
- Full command catalog: [docs/guides/cli.md](./docs/guides/cli.md)
- Fresh consumer bootstrap after the binary is on `PATH`: [docs/guides/consumer-adoption.md](./docs/guides/consumer-adoption.md)
- Public executable spec report: <https://corca-ai.github.io/cautilus/>

[docs/specs/index.spec.md](./docs/specs/index.spec.md) is the top-level "proven on itself" apex and the specdown entry; the user and maintainer spec indexes it links to remain the curated claim source of truth.
Raw `discover claims` packets remain the high-recall, source-ref-backed proof-planning input, not the primary document a user should review.
The Cautilus Agent curates that packet against the repo: reduce false positives, raise likely missing public promises, and separate in-scope discovery bugs from out-of-scope narrative gaps.
The public website report is generated from the claim spec tree, but host repos do not need that renderer before Cautilus can inspect readiness, claims, evals, or improvement work.
Each claim page pairs a bounded product promise with executable evidence or an explicit evidence gap.
Read the user spec index to understand what Cautilus promises, then use the maintainer index to inspect proof routes, adapters, fixtures, and known gaps.

## One Bounded Eval Loop

Start here if you want the current stable cross-repo slice before reading the full surface.
You need one checked-in `cautilus.evaluation_input.v1` fixture and a host-owned adapter runner.
This loop verifies a bounded behavior fixture and produces reopenable observed and summary packets.

**Input (CLI)**

```bash
cautilus evaluate fixture \
  --fixture ./fixtures/eval/<behavior>.fixture.json \
  --output-dir /tmp/cautilus-eval
cautilus evaluate observation \
  --input /tmp/cautilus-eval/eval-observed.json \
  --output /tmp/cautilus-eval/eval-summary.json
```

**Input (For Agent)**: "Run this checked-in Cautilus eval fixture and summarize the observed packet and summary packet."

`Cautilus` turns the fixture run into durable eval packets that another agent or maintainer can reopen.
The summary is not a global product verdict; it is evidence for the behavior fixture and adapter path that the host repo chose.
Next step: a human decides whether that evidence is enough for the host repo's current proof need.

The same small loop anchors the public spec report in `docs/specs/user/index.spec.md`.
It is the shortest currently stable external-adoption example of the product claim: `Cautilus` turns behavior evidence into a reviewable decision surface.

## Dogfood Example

`Cautilus` is useful when a repo instruction such as `AGENTS.md` is supposed to steer an agent's first move.
On this repo's own `AGENTS.md`, an on-demand live proof (`npm run proof:behavior-eval:live`) drives the real agent and asserts it orients on `AGENTS.md` and routes to the durable work skill (`charness:impl`) for the actual task.
That turned "did the agent read and follow the repo instructions?" from transcript judgment into a reproducible packet with artifacts another maintainer can reopen.
The same dogfood run also exposed a useful limit: routing proof is not backend subagent capability proof.
Keeping that distinction in the packet prevented the result from over-claiming what had been verified.

## Scenarios

Cautilus has three connected product layers:
claim discovery, bounded evaluation, and bounded improvement.

Claim discovery turns adapter-owned entry docs and linked docs into `cautilus.claim_proof_plan.v1` candidates.
It is proof planning, not a verdict that the repo is correct.
The Cautilus Agent curates false positives, likely missing promises, scan boundaries, and extraction and review budgets before any eval plan is trusted.

Evaluation uses two top-level surfaces: `dev` for AI-assisted development work such as repo contracts, tools, and skills, and `app` for AI-powered product behavior such as chat, prompt, and service responses.
For the live reader-facing contract, read [docs/specs/promises/evaluation.spec.md](./docs/specs/promises/evaluation.spec.md).
For the full command catalog, including claim review, scenario normalization, live targets, and improvement commands, read [docs/guides/cli.md](./docs/guides/cli.md).
Sample normalization inputs live in [examples/starters/](./examples/starters/) and the checked-in fixture directories under [fixtures/](./fixtures/).

## Why Cautilus

Prompt strings change, but behavior is the real contract.

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
- Unlike open-ended improver loops, `Cautilus` keeps search and revision explicitly bounded by budgets, checkpoints, and blocked-readiness conditions (`bounded autonomy`).

The proof layers are deliberately split because humans, code, and AI are good at different work.
Human-auditable claims stay readable.
Deterministic claims belong in ordinary tests and CI.
Evaluator-dependent behavior goes through `cautilus evaluate`.
Improvement work waits until the proof surface is explicit.

`Cautilus` also ships a GEPA-style bounded prompt search seam above the one-shot improver: multi-generation reflective mutation, protected reevaluation, frontier-promotion review reuse, checkpoint feedback reinjection, bounded merge synthesis, and Pareto-style frontier selection.
Deep dive: `docs/guides/improve.md`.

The longer-term direction is close to the workflow philosophy behind DSPy: prompts can change as long as the evaluated behavior survives.

## Core Flow

Two entry points share one host-owned `cautilus-adapter.yaml` and return the same durable decision surface.
Operators use the standalone CLI.
Claude and Codex use the repo-local Cautilus Agent that `cautilus init` installs under `.agents/skills/cautilus-agent/`.

The minimum host-repo shape is an adapter, an installed Cautilus Agent, and run artifacts such as `eval-cases.json`, `eval-observed.json`, and `eval-summary.json`.
The result is not just a pass/fail bit: it is a set of machine-readable packets plus readable views that another maintainer or agent can reopen.
See [docs/specs/promises/reviewable-artifacts.spec.md](./docs/specs/promises/reviewable-artifacts.spec.md) for the rendered-artifact claim.

Use `cautilus doctor --next-action` for the next onboarding step, `cautilus doctor --scope agent-surface` for agent-surface discoverability, and `cautilus doctor` for repo wiring readiness.
From this repo, `npm run consumer:onboard:smoke` is an end-to-end adoption proof against a fresh consumer.

## Read More

Top picks:

- <https://corca-ai.github.io/cautilus/> — standing executable spec report
- [docs/guides/consumer-adoption.md](./docs/guides/consumer-adoption.md) — canonical fresh-consumer bootstrap path after the binary is on `PATH`
- [docs/guides/evaluation-process.md](./docs/guides/evaluation-process.md) — canonical evaluation loop
- [docs/specs/user/index.spec.md](./docs/specs/user/index.spec.md) — user-facing claim spec index
- [docs/specs/contracts/index.spec.md](./docs/specs/contracts/index.spec.md) — maintainer-facing claim spec index
- [docs/contracts/adapter-contract.md](./docs/contracts/adapter-contract.md) — adapter schema
- [docs/contracts/review-packet.md](./docs/contracts/review-packet.md) — review packet boundary
- [docs/guides/cli.md](./docs/guides/cli.md) — full CLI reference
- [docs/maintainers/development.md](./docs/maintainers/development.md) — maintainer dev + self-dogfood
- [docs/maintainers/operator-acceptance.md](./docs/maintainers/operator-acceptance.md) — human takeover and acceptance checklist
- [docs/guides/improve.md](./docs/guides/improve.md) — GEPA-style prompt search
- [docs/master-plan.md](./docs/master-plan.md) — roadmap
- [examples/starters/](./examples/starters/) — normalization-family starter kits

Dogfood and migration evidence lives in [consumer-readiness.md](./docs/maintainers/consumer-readiness.md), which is an evidence appendix rather than the canonical bootstrap guide.
