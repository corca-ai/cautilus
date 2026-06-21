---
type: apex
---

# Cautilus, Proven On Itself

You build agents — coding assistants, chatbots, skills, workflows — and you need to know they do what you intend.
Cautilus is the framework for discovering, evaluating, and improving agent behavior: it lets you pin down the behavior that matters, prove it survives every change to your prompts, skills, and models, and improve it within explicit budgets—whether you're protecting an AGENTS.md, a single skill, a prompt, or a full agent loop.
This page is Cautilus's own promises, proven on Cautilus itself.

## How To Read This

Each promise below gives you what you get in one line, how far it's proven today, and a link to the executable spec that proves it.
The promise stays honest because the badge is earned by what that spec actually runs, not by what this page asserts.

- **proven** — a checked-in executable spec asserts the behavior end-to-end, in one of three honest sub-kinds the [Honesty Audit](generated/audit.spec.md) keeps distinct (the same verdict-mode vocabulary Claim Discovery routes by):
  - *deterministic* — `npm run lint:specs` runs the command and file checks live on every run (Readiness, Claim Discovery, Reviewable Artifacts, A Testable Agent).
  - *cautilus-eval* — the default run replays an operator-witnessed live agent capture and a blind judge verdict; the live agent re-run is opt-in and costs a real agent run (Behavior Evaluation, Bounded Improvement).
  - *human-auditable* — an operator witnessed the live run and vouches for it; the default run replays the checked-in capture and the live re-run is opt-in, with no automated judge (accepted where a full deterministic or eval proof would be disproportionately costly).
- **declared** — the evidence exists as a saved bundle, but the behavior has not been re-run live yet (named in Proof Debt)
- **promised** — stated, with no executable proof attached yet (named in Proof Debt)

Today, all seven promises are proven, none are declared, and none are promised.
That split is the point: this page shows the real state of the work, and the [Honesty Audit](generated/audit.spec.md) binds each badge to its proof route so the split cannot quietly drift.

## What Cautilus Does For You

### Readiness — proven

Before your first evaluation, you can see exactly what's ready and what to set up next — and you'll get the same clear answer every run.

Proof: [badges::Readiness spec](user/doctor-readiness.spec.md) (builds the CLI, runs `cautilus doctor` on sample repos, asserts the JSON and exit codes).
CLI ↔ Agent: the CLI runs the checks and prints the verdict; the agent suggests which workflow to run next.

### Claim Discovery — proven

Point Cautilus at your repo and you get back every promise your docs make, as a worklist — each one linked to the exact line that declares it, and marked proven only once real evidence backs it.

Proof: [badges::Claim Discovery spec](user/claim-discovery.spec.md) (runs `cautilus discover claims` on a sample repo and asserts the routing output).
CLI ↔ Agent: the CLI reads your docs and drafts a first pass; the agent sharpens it, groups it, and decides what to do next.

### Behavior Evaluation — proven on the dev coding-agent surfaces; app-ship surfaces in Proof Debt

You see whether the agents in your repo behave the way you intend — the coding agent you build with (does it follow your repo's rules and pick the right skill?) and the app you ship (does its chatbot give the right answers across a multi-turn conversation, and does a single prompt return what it should?).
The coding agent you build with is proven live on BOTH dev surfaces: on-demand executable proofs drive the real agent (claude/Sonnet) against this repo and assert a stable invariant on a fresh capture — `npm run proof:behavior-eval:live` checks it orients on your `AGENTS.md` and routes to the find-skills bootstrap, and `npm run proof:skill-orientation:live` checks the cautilus-agent skill's no-input orientation runs the read-only `doctor status` packet, summarizes, and holds at branch selection. Each invariant held across two independent live runs whose reasoning text differed but did not, and a blind Sonnet judge graded each genuine live reasoning sound while rejecting a constructed wrong-reason control.
The app you ship: the `app/chat` surface is now evaluated on an anonymized real external product-log replay (`external-chat-replay`, real external-user conversation, redacted before check-in) graded by a load-bearing blind intent judge instead of a string match.
That closes external validity and the intent judge on that surface, and the replay now includes natural sound secret-handling, memory-continuity, and clarification-first captures plus a natural unsound artifact-fidelity capture; what stays deferred there is app-agent liveness, because the responses are replayed from the production log rather than re-run live.
The `app/prompt` surface now has a fresh backend probe over the checked-in tagline fixture plus a load-bearing blind intent judge over that probe: fixture and Codex live backends pass, Claude live backend exposes the current string-fragment matcher boundary by returning `reject` for a semantically close response that does not contain the exact expected fragment, and the blind intent judge grades both live backend responses sound while rejecting a constructed semantic control; product-runner proof remains deferred — see Proof Debt.

Proof: the on-demand live proofs `npm run proof:behavior-eval:live` and `npm run proof:skill-orientation:live` (`scripts/on-demand/behavior-eval-live-proof.mjs`, `scripts/on-demand/skill-orientation-live-proof.mjs`) are the checked-in executable specs that run the dev agents live and assert; their operator-witnessed captures and blind verdicts are replayed deterministically by `npm run test:on-demand` and projected by [badges::the Behavior Evaluation spec](user/evaluation.spec.md) via `npm run lint:specs`, so the displayed invariant matches the graded one. The app/chat replay, app/prompt backend probe, and app/prompt intent-judge verdicts are also replayed by `npm run test:on-demand` and projected by the same spec, but both app surfaces still carry the Proof Debt named below. The live dev proofs run on demand — not in the default `npm run verify` — and each live rerun costs a real agent run.
Reject-capability: the dev-surface judges are load-bearing regression guards, not rubber stamps — a checked-in invariant (`an always-sound judge FAILS every decomposed claim`, `scripts/agent-runtime/reasoning-soundness-judge.test.mjs`) fails the gate if the judge stops discriminating, and the same composite catches a deliberately-worse routing variant across three distinct pinned behaviors.
A population of *natural* unsound cases is impractical to harvest on these surfaces: across ~44 real harvested responses over two model tiers and easy and hard traps, zero natural semantic unsound occurred — a property of current capable models, not a weakness of the judge — so the maintainer accepted constructed-control reject-capability plus the natural-sound behavior harvest as the proven standard (2026-06-19, recorded in [the judge-collaboration contract](../contracts/eval-judge-collaboration.md)), with the natural-population bar kept as a known, possibly-permanent limitation.
That harvest is positive context, not a gate: its raw responses live in session transcripts while the prompts, objective truths, and tally are pre-registered in the frontier evidence — the load-bearing gate is the checked-in `always-sound judge FAILS` invariant plus the two on-demand live proofs, not the harvest count.
What stays in Proof Debt is app-ship surface coverage, not the dev judge: `app/chat` liveness (its agent run is replayed from the production log rather than re-run live, though that replay already includes one natural unsound capture) and `app/prompt` product-runner proof.
CLI ↔ Agent: the CLI runs your agent and records what it did; the agent turns that into scenarios and reads the result.

### Bounded Improvement — proven on the dev/skill surface

You hand Cautilus a prompt that's failing your eval and it rewrites the prompt until it passes — keeping the agent's intent intact, holding or lowering cost, and proving the win on held-out examples it was never tuned on.
You approve every change before it ships.
This is proven live on the dev/skill surface: `npm run proof:improve:live` constructs a degraded cautilus-agent orientation prompt, confirms with a live agent that the seed control FAILS the held-out orientation scenario, then runs a real bounded `cautilus improve search` (live codex mutation plus a worktree candidate eval) and asserts that a mutated candidate it was never tuned on recovers the held-out behavior (seed scores 0, the winning candidate scores 100) — producing a reviewable proposal while the working-tree prompt is restored and nothing degraded or mutated ever ships.

Proof: [badges::Bounded Improvement spec](user/improvement.spec.md) (`scripts/on-demand/improve-live-proof.mjs`, the checked-in executable spec that runs the loop live and asserts; its operator-witnessed capture is replayed deterministically by `npm run test:on-demand` and projected by the spec via `npm run lint:specs`). The live loop runs on demand — not in the default `npm run verify` — and each live rerun costs a real agent run.
CLI ↔ Agent: the CLI runs the gates and the comparison; the agent proposes the change and judges whether to keep it.

## Why You Can Trust It

Cautilus marks each promise with how far it's actually proven, and keeps that mark in plain sight.
So everything on this page is the real state of the work — which is what makes the proven marks worth anything.

### Reviewable Artifacts — proven

You, the next teammate, or the next agent can reopen exactly what happened: every run leaves both a machine-readable record and a readable view to audit against.
This is proven **deterministic**: on every `npm run lint:specs` the spec re-runs the packet commands, renders the readable views, and asserts on the fresh output — no saved bundle is projected.

Proof: [badges::Reviewable Artifacts spec](user/reviewable-artifacts.spec.md) (regenerates the agent-status, claim-status, validation, and eval-plan packets live, renders two readable views and asserts each preserves the JSON packet as the audit source, and seeds a stale candidate so the status report surfaces stale, blocked, and missing evidence).
CLI ↔ Agent: the CLI emits the packets and renders the views; the agent reopens them to decide what to inspect or do next.

### Host Ownership — proven

Everything specific to you — your prompts, fixtures, and policy — stays in your repo and under your control; Cautilus brings only the generic workflow.
This is proven **human-auditable**: an operator ran `npm run consumer:onboard:smoke` and vouches for a fresh external consumer installing Cautilus, initializing adapter wiring, reaching doctor readiness, and running one bounded `evaluate fixture` in a temporary git repo whose adapter, fixture, and runner are all host-owned.
The default `npm run lint:specs` replays the operator-witnessed capture; the live re-run is opt-in and regenerates it without drift. There is no automated judge — the onboarding outcome is a deterministic invariant the operator witnessed.

Proof: [badges::Host Ownership spec](user/ownership.spec.md) (projects `fixtures/eval/consumer/onboard/live/consumer-onboarding-live-capture.json`, the operator-witnessed `consumer:onboard:smoke` capture).
CLI ↔ Agent: the CLI runs the onboarding and records the invariant; the agent reads it and routes the next step.

### A Testable Agent — proven

You get a clean, invokable runner for Cautilus to run against — the kind of entry point that makes any agent testable in the first place — and the Cautilus agent helps you build it and check how testable your agent is, so that testability stays yours for good.
This is proven **deterministic**: on every `npm run lint:specs` the spec re-runs `doctor status` for a live runner-readiness verdict, asserts the checked-in runner assessments carry substantive proof-class and required-capability verdicts, reads the runner capability `evaluate claims plan` requires, and seeds a stale assessment so freshness detection fires.
The Cautilus agent half is proven *prepared*: the `cautilus-agent` skill routes runner creation and assessment, and a checked-in dogfood fixture plus an executed audit test grade that the flow asks for readiness orientation, a headless-runner build, assessment authoring, and stop discipline.
What stays deferred is a live agent-builds-a-runner episode — named in Proof Debt — so the badge does not read as if a live agent already built and graded a runner.

Proof: [badges::A Testable Agent spec](user/a-testable-agent.spec.md) (live runner-readiness verdict, substantive assessment fixtures, required-runner-capability planning, controlled stale-assessment detection, and a prepared-skill check whose audit test runs in `npm run test:node`). Background: [runner readiness contract](../contracts/runner-readiness.md).
CLI ↔ Agent: the CLI emits the readiness verdict and names the required runner capability and scaffold source; the agent sequences the build-and-assess flow and decides when the proof is strong enough.

## Honesty Audit

Every badge above is bound to its proof route, so a badge cannot claim more than its proof actually delivers.
[Surface Honesty Audit](generated/audit.spec.md) is the navigable, runnable per-badge map: for each promise it shows the level this page CLAIMS, the level the proof route is OBSERVED to deliver (recomputed by inspecting the leaf spec's checks and evidence files), the proof class, the command that runs it, and whether the two agree.
The binding is semantic, not just structural: for every badge that declares evidence, each evidence file must actually be read by a `cautilus-json-file` check in its leaf spec, so a route cannot point at an unrelated spec or pad its evidence count with files the spec never asserts on.
Run `npm run audit:surface` to regenerate it, or `npm run audit:surface:check` to fail on drift or over-claim; `npm run lint:specs` runs the leaf proofs plus the check block below.
The check reads the generated audit manifest and fails specdown if any badge over-claims, if a badge's evidence is not referenced by its proof spec, or if this page and the proof-route registry disagree about which badges exist.

> check:cautilus-json-file
| path | json_path | equals |
| --- | --- | --- |
| .cautilus/audit/surface-audit.json | schemaVersion | cautilus.surface_audit.v1 |
| .cautilus/audit/surface-audit.json | summary.honest | true |
| .cautilus/audit/surface-audit.json | summary.total | 7 |
| .cautilus/audit/surface-audit.json | summary.byClaimedStatus.proven | 7 |
| .cautilus/audit/surface-audit.json | summary.byClaimedStatus.declared | 0 |
| .cautilus/audit/surface-audit.json | summary.byClaimedStatus.promised | 0 |
| .cautilus/audit/surface-audit.json | summary.inconsistent | 0 |
| .cautilus/audit/surface-audit.json | summary.orphanIssueCount | 0 |
| .cautilus/audit/surface-audit.json | badges[id=readiness].consistent | true |
| .cautilus/audit/surface-audit.json | badges[id=readiness].observed.observedStatus | proven |
| .cautilus/audit/surface-audit.json | badges[id=claim-discovery].consistent | true |
| .cautilus/audit/surface-audit.json | badges[id=claim-discovery].observed.observedStatus | proven |
| .cautilus/audit/surface-audit.json | badges[id=claim-discovery].observed.evidenceReferenced | true |
| .cautilus/audit/surface-audit.json | badges[id=behavior-evaluation].consistent | true |
| .cautilus/audit/surface-audit.json | badges[id=behavior-evaluation].observed.observedStatus | proven |
| .cautilus/audit/surface-audit.json | badges[id=behavior-evaluation].observed.evidenceReferenced | true |
| .cautilus/audit/surface-audit.json | badges[id=bounded-improvement].consistent | true |
| .cautilus/audit/surface-audit.json | badges[id=bounded-improvement].observed.observedStatus | proven |
| .cautilus/audit/surface-audit.json | badges[id=bounded-improvement].observed.evidenceReferenced | true |
| .cautilus/audit/surface-audit.json | badges[id=reviewable-artifacts].consistent | true |
| .cautilus/audit/surface-audit.json | badges[id=reviewable-artifacts].observed.observedStatus | proven |
| .cautilus/audit/surface-audit.json | badges[id=reviewable-artifacts].proofClass | deterministic |
| .cautilus/audit/surface-audit.json | badges[id=reviewable-artifacts].observed.evidenceReferenced | true |
| .cautilus/audit/surface-audit.json | badges[id=host-ownership].consistent | true |
| .cautilus/audit/surface-audit.json | badges[id=host-ownership].observed.observedStatus | proven |
| .cautilus/audit/surface-audit.json | badges[id=host-ownership].observed.evidenceReferenced | true |
| .cautilus/audit/surface-audit.json | badges[id=host-ownership].observed.evidenceSubstantive | true |
| .cautilus/audit/surface-audit.json | badges[id=a-testable-agent].consistent | true |
| .cautilus/audit/surface-audit.json | badges[id=a-testable-agent].observed.observedStatus | proven |
| .cautilus/audit/surface-audit.json | badges[id=a-testable-agent].proofClass | deterministic |
| .cautilus/audit/surface-audit.json | badges[id=a-testable-agent].observed.evidenceReferenced | true |
| .cautilus/audit/surface-audit.json | badges[id=a-testable-agent].observed.evidenceSubstantive | true |

## Proof Debt

What it would take to move each unproven promise to a live **proven** badge. This list is owned work, not a silent gap.

| Promise | Current | To reach proven |
| --- | --- | --- |
| Behavior Evaluation — app surfaces | the coding-agent `dev/repo` and `dev/skill` surfaces are both proven live on demand (`npm run proof:behavior-eval:live`, `npm run proof:skill-orientation:live`); `app/chat` now evaluates an anonymized external product-log replay with a load-bearing blind intent judge (`npm run test:on-demand` replays the checked-in capture + blind verdicts), including natural sound secret handling, natural sound memory continuity, natural sound clarification-first behavior, and natural unsound artifact fidelity, closing external validity, the intent judge, and the app/chat natural-unsound gap, but its agent run is replayed from the production log rather than live; `app/prompt` now has a fresh fixture/Codex/Claude backend probe plus a load-bearing blind intent judge over that probe while still reporting `productProofReady=false` | a live app-runner re-run over an owner-confirmed app scenario for `app/chat` liveness, and product-runner proof for `app/prompt`, asserted in the spec |
| A Testable Agent — live runner-building episode | the testability/readiness check is proven deterministic, and the `cautilus-agent` skill is proven *prepared* to guide runner creation and assessment (checked-in routing + dogfood fixture graded by an executed audit test) | a live `cautilus-eval` episode where the agent actually builds and assesses a headless runner against an owner-confirmed scenario, asserted in the spec |

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
