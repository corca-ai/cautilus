# Cautilus, Proven On Itself

> Draft under owner review (2026-06-09). A curated, human-readable view — not a generated dump.

You build agents — coding assistants, chatbots, skills, workflows — and you need to know they do what you intend.
Cautilus is a standalone CLI and agent that finds the promises your project makes, proves the ones that matter against real evidence, and improves the behavior behind them.
This page is Cautilus's own promises, proven on Cautilus itself.

## How To Read This

Each promise below gives you three things: what you get in one line, how far it's proven today, and a real example you can open at its source line.
Cautilus marks every promise honestly — proven, thin, or promised — so what you read here is the true state of the work, not a sales sheet.

- proven — backed by checked-in evidence
- thin — partly proven so far
- promised — declared, with proof in progress

## What Cautilus Does For You

### Readiness — proven

Before your first evaluation, you can see exactly what's ready and what to set up next — and you'll get the same clear answer every run.

Open it: `docs/guides/consumer-adoption.md:25`; `docs/guides/cli.md:114`.
The CLI runs the checks and prints the verdict; the agent suggests which workflow to run next.

### Claim Discovery — proven

Point Cautilus at your repo and you get back every promise your docs make, as a worklist — each one linked to the exact line that declares it, and marked proven only once real evidence backs it.

Open it: `docs/guides/cli.md:135`; `docs/guides/cli.md:263`.
The CLI reads your docs and drafts a first pass; the agent sharpens it, groups it, and decides what to do next.

### Behavior Evaluation — thin

You see whether the agents in your repo behave the way you intend — the coding agent you build with (does it follow your repo's rules and pick the right skill?) and the app you ship (does its chatbot give the right answers across a multi-turn conversation, and does a single prompt return what it should?).

Open it: `docs/specs/user/evaluation.spec.md:36`.
The CLI runs your agent and records what it did; the agent turns that into scenarios and reads the result.

### Bounded Improvement — promised

You hand Cautilus a prompt that's failing your eval and it rewrites the prompt until it passes — keeping the agent's intent intact, holding or lowering cost, and proving the win on held-out examples it was never tuned on.
You approve every change before it ships.

Open it: `docs/specs/user/improvement.spec.md:23` (protected checks, held-out evidence, and an explicit budget); `docs/specs/user/improvement.spec.md:41`.
The CLI runs the gates and the comparison; the agent proposes the change and judges whether to keep it.

## Why You Can Trust It

Cautilus marks each promise with how far it's actually proven, and keeps that mark in plain sight.
So everything on this page is the real state of the work — which is what makes the proven marks worth anything.

### Reviewable Artifacts — proven

You, the next teammate, or the next agent can reopen exactly what happened: every run leaves both a machine-readable record and a readable view to audit against.

Open it: `docs/specs/user/reviewable-artifacts.spec.md:3`; `docs/specs/user/reviewable-artifacts.spec.md:6`.

### Host Ownership — proven

Everything specific to you — your prompts, fixtures, and policy — stays in your repo and under your control; Cautilus brings only the generic workflow.

Open it: `docs/specs/user/ownership.spec.md:27`; `README.md:7`.

### A Testable Agent — thin

You get a clean, invokable runner for Cautilus to run against — the kind of entry point that makes any agent testable in the first place — and the Cautilus agent helps you build it and check how testable your agent is, so that testability stays yours for good.

Open it: `docs/contracts/runner-readiness.md`; `docs/guides/cli.md:114`.
The CLI needs a ready runner before it can run anything; the agent helps you build that runner and gauges your agent's testability.

## Where The Evidence Comes From

Every example above is a real claim Cautilus discovered in this repo; the full set lives in `.cautilus/claims/`.
One honest caveat: Cautilus's automatic grouping of raw claims into these promises is still rough, so we picked the examples by hand and left exact per-promise counts out on purpose.
Hardening that grouping is the next piece of work, tracked in [charness-artifacts/findings/2026-06-08-canonicalization-precision-root-finding.md](../charness-artifacts/findings/2026-06-08-canonicalization-precision-root-finding.md).

The whole pitch is simple: real evidence for every promise, and an honest mark of how far each one is proven.
