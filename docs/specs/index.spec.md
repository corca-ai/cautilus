# Cautilus, Proven On Itself

You build agents — coding assistants, chatbots, skills, workflows — and you need to know they do what you intend.
Cautilus is the framework for discovering, evaluating, and improving agent behavior: it lets you pin down the behavior that matters, prove it survives every change to your prompts, skills, and models, and improve it within explicit budgets—whether you're protecting an AGENTS.md, a single skill, a prompt, or a full agent loop.
This page is Cautilus's own promises, proven on Cautilus itself.

## How To Read This

Each promise below gives you what you get in one line, how far it's proven today, and a link to the executable spec that proves it.
The promise stays honest because the badge is earned by what that spec actually runs, not by what this page asserts.

- **proven** — a checked-in executable spec runs the behavior live and asserts on the result
- **declared** — the evidence exists as a saved bundle, but the behavior has not been re-run live yet (named in Proof Debt)
- **promised** — stated, with no executable proof attached yet (named in Proof Debt)

Today, three promises are proven live and the rest are declared or promised.
That split is the point: this page shows the real state of the work.

## What Cautilus Does For You

### Readiness — proven

Before your first evaluation, you can see exactly what's ready and what to set up next — and you'll get the same clear answer every run.

Proof: [Readiness spec](user/doctor-readiness.spec.md) (builds the CLI, runs `cautilus doctor` on sample repos, asserts the JSON and exit codes).
CLI ↔ Agent: the CLI runs the checks and prints the verdict; the agent suggests which workflow to run next.

### Claim Discovery — proven

Point Cautilus at your repo and you get back every promise your docs make, as a worklist — each one linked to the exact line that declares it, and marked proven only once real evidence backs it.

Proof: [Claim Discovery spec](user/claim-discovery.spec.md) (runs `cautilus discover claims` on a sample repo and asserts the routing output).
CLI ↔ Agent: the CLI reads your docs and drafts a first pass; the agent sharpens it, groups it, and decides what to do next.

### Behavior Evaluation — proven

You see whether the agents in your repo behave the way you intend — the coding agent you build with (does it follow your repo's rules and pick the right skill?) and the app you ship (does its chatbot give the right answers across a multi-turn conversation, and does a single prompt return what it should?).
The coding agent on your repo is proven live: an on-demand executable proof (`npm run proof:behavior-eval:live`) drives the real agent (claude/Sonnet) against your own `AGENTS.md` and asserts it orients on the repo rules and routes to the find-skills bootstrap — held across two independent live runs whose reasoning text differed but whose routing invariant did not — and a blind Sonnet judge graded the genuine live reasoning sound while rejecting a route-correct, reason-fabricated control.
The app you ship (multi-turn chatbot, single prompt) is not yet live-proven; those surfaces still project their saved evidence bundle — see Proof Debt.

Proof: [Behavior Evaluation spec](user/evaluation.spec.md) (the standing check replays the operator-witnessed live capture and its blind verdicts so the displayed invariant matches the graded one; `npm run proof:behavior-eval:live` reruns it live on demand, off the standing path for cost).
Limitation: the judge's reject-capability is proven via a constructed wrong-reason control; no naturally-occurring unsound capture has been harvested on either surface yet.
CLI ↔ Agent: the CLI runs your agent and records what it did; the agent turns that into scenarios and reads the result.

### Bounded Improvement — declared

You hand Cautilus a prompt that's failing your eval and it rewrites the prompt until it passes — keeping the agent's intent intact, holding or lowering cost, and proving the win on held-out examples it was never tuned on.
You approve every change before it ships.

Proof: [Bounded Improvement spec](user/improvement.spec.md) — today it projects a saved bundle rather than running a live improve loop; see Proof Debt.
CLI ↔ Agent: the CLI runs the gates and the comparison; the agent proposes the change and judges whether to keep it.

## Why You Can Trust It

Cautilus marks each promise with how far it's actually proven, and keeps that mark in plain sight.
So everything on this page is the real state of the work — which is what makes the proven marks worth anything.

### Reviewable Artifacts — declared

You, the next teammate, or the next agent can reopen exactly what happened: every run leaves both a machine-readable record and a readable view to audit against.

Proof: [Reviewable Artifacts spec](user/reviewable-artifacts.spec.md) — it projects saved packet bundles rather than regenerating them live; see Proof Debt.

### Host Ownership — declared

Everything specific to you — your prompts, fixtures, and policy — stays in your repo and under your control; Cautilus brings only the generic workflow.

Proof: [Host Ownership spec](user/ownership.spec.md). A live onboarding smoke (`npm run consumer:onboard:smoke`) already exists and would upgrade this to proven; see Proof Debt.

### A Testable Agent — promised

You get a clean, invokable runner for Cautilus to run against — the kind of entry point that makes any agent testable in the first place — and the Cautilus agent helps you build it and check how testable your agent is, so that testability stays yours for good.

Proof: none yet — see Proof Debt. Background: [runner readiness contract](../contracts/runner-readiness.md).

## Proof Debt

What it would take to move each unproven promise to a live **proven** badge. This list is owned work, not a silent gap.

| Promise | Current | To reach proven |
| --- | --- | --- |
| Behavior Evaluation — app surfaces | the coding-agent dev/repo flagship is proven live (`npm run proof:behavior-eval:live`); the `app/chat` and `app/prompt` surfaces still project the saved `evidence-current-eval-surfaces` bundle | a live app-runner eval over an owner-confirmed app scenario, asserted in the spec |
| Bounded Improvement | declared (projects a saved bundle) | a live `cautilus improve` loop on a held-out scenario, asserted in the spec |
| Reviewable Artifacts | declared (projects saved packets) | regenerate packets live in the spec and assert their shape |
| Host Ownership | declared (projects onboarding bundle) | wire the existing `consumer:onboard:smoke` live run into the spec |
| A Testable Agent | promised (no spec) | author a spec backed by the runner-readiness/verification contracts |

## How Proof Works Here

Each subclaim on a spec page must be backed by evidence that runs the claimed behavior end-to-end and asserts on the produced packet, file, or audit artifact.
These are **not** acceptable as the closing state of a subclaim:

- `--help` substring matches or other surface-existence checks that only assert a word appears in help output
- "command exists" probes that do not run the claimed scenario
- `Evidence is pending` placeholders left as the closing state

For each subclaim, either (a) add an executable check that runs the actual scenario and asserts on the produced packet/file, or (b) link a concrete existing evidence bundle, audit fixture, or packet path that proves that specific subclaim.
If a subclaim genuinely has no evidence yet, log it as explicit proof debt above — an owned next-action that names the bundle to author — rather than letting it close as a silent omission.

## Vocabulary

- A `promise` means something Cautilus currently says it can help with.
- A `candidate claim` means a possible promise found during Claim Discovery.
- `evidence` means a packet, fixture, command result, or durable artifact that supports a promise.
- A `gap` means missing or weak evidence that stays visible.
- A `cross-cutting rule` means a rule or risk that applies across workflows, such as host ownership, evidence visibility, or packet freshness.

## Go Deeper

Everything below serves the promises above.

1. [User Workflow](user/index.spec.md) — how people use the `cautilus` CLI and the `cautilus-agent` skill to discover, evaluate, and improve behavior against explicit evidence.
2. [Contracts](contracts/index.spec.md) — the command, packet, adapter, fixture, and evidence contracts that keep the workflow buildable and reviewable.
3. [Promise Ledger](ledger/index.spec.md) — which behavior claims Cautilus makes, how they relate, and which workflow or contract owns each.
4. [Cross-Cutting Rules](rules/index.spec.md) — reviewability, ownership, vocabulary, freshness, cost, and resumability rules across workflow steps.
5. [Evidence State](evidence/index.spec.md) — which claims are supported now, which proof was selected instead of rerun, and which gaps remain open.

The whole pitch is simple: real evidence for every promise, and an honest mark of how far each one is proven.
