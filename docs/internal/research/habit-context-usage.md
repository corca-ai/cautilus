# Habit And Context Usage Frame

## Source

- GitHub issue: <https://github.com/corca-ai/cautilus/issues/45>
- Source identity captured in the issue: `slack://C05J5LTFSCU/1778805288.184149`
- Gathered Slack artifact: [2026-05-17-slack-habit-context-usage-thread.md](../../../charness-artifacts/gather/2026-05-17-slack-habit-context-usage-thread.md)
- Sibling issues: charness <https://github.com/corca-ai/charness/issues/171>, crill <https://github.com/corca-ai/crill/issues/10>, example-app <https://github.com/corca-ai/example-app/issues/102>

## Freshness

The Slack source was gathered through the Charness `gather` Slack adapter on 2026-05-17.
The gathered artifact is repo-local working context for this design, while Slack and private external chat product remain outside Cautilus's product boundary.
Future updates should refresh the gathered artifact through `gather`, not teach Cautilus how to read Slack directly.

## Existing Product Boundary

Cautilus is an intentful behavior evaluation product, not a product analytics backend.
The current source of truth says host repos own prompts, wrappers, credentials, fixtures, and policy, while Cautilus owns generic workflow contracts, packet shapes, and reviewable artifacts.
Existing telemetry contracts already prefer explicit packet fields over scraping logs.

The habit/context frame should therefore enter Cautilus as optional, explicit packet vocabulary for evaluating repeated operator behavior, not as hidden ingestion of raw host usage events.

## Source Reading

The Slack thread started as an actual wellness challenge workflow, not as an abstract analytics discussion.
The operator asked private external chat product to check a Slack thread every day at 10:30 KST for 30 days, detect whether the previous day's record had been posted, and either ask for the missing record or give short feedback.
The first setup response registered a dedicated skill and schedule, but a later check found that the scheduled tick had failed because the workflow was not registered in the workspace registry.
That failure is important because it shows that repeated behavior depends on trigger reliability, setup visibility, and explicit workflow readiness, not only user motivation.

The later product question was how to track habit formation and usage context beyond referral tracking, GA, and interviews.
The thread framed habit as a sequence:

```text
User context
→ Trigger
→ Intent / Job
→ Core action
→ First value
→ Reward / outcome
→ Repeat in same context
→ Automaticity
→ Retention
```

The thread also named concrete measurement ideas: context properties, event-based product analytics, micro-surveys, diary study, cohort analysis, same-context repeat rate, and SRBAI/SRHI-style automaticity prompts.
For Cautilus, the reusable insight is not the wellness domain itself.
The reusable insight is that a behavior workflow has a triggering context, a first-value artifact, and a repeat loop that can be made explicit without importing raw personal logs into the product.

## Concept

Habit tracking asks whether the same cue or context repeatedly leads to the core behavior and whether starting that behavior becomes less consciously effortful over time.
For Cautilus, the core behavior is not login, install, or raw command frequency.
The core behavior is running a bounded claim, eval, or improve workflow that leaves a reviewable packet and a next decision.

The first value moment is the first durable artifact that changes what the operator or agent can do next.
Examples include a readiness next-action packet, a claim proof plan with curation state, an evaluation summary/report with a recommendation, or an improvement revision artifact.

Same-context repeat should mean a later bounded workflow starts from a comparable repo, entry point, trigger type, selected job, and behavior surface.
It should not require the same exact command line or identical prompt text.

The key boundary is that Cautilus should evaluate and preserve behavior context when a host explicitly supplies it.
It should not become the system that watches Slack, browser sessions, private calendars, or arbitrary host activity to discover context on its own.

## Candidate Vocabulary

Optional `usageContext` fields on future packets could include:

- `entryPoint`: `cli`, `cautilus-agent`, `host-agent`, `ci`, or `script`
- `triggerType`: `release`, `regression`, `prompt_change`, `issue_resolution`, `scheduled_check`, `operator_probe`, or `unknown`
- `selectedJob`: `readiness`, `claim_discovery`, `behavior_evaluation`, `bounded_improvement`, or `release_verification`
- `behaviorSurface`: the existing product-owned behavior surface or adapter-declared surface
- `repoContextKey`: an adapter-owned stable bucket, not a raw private path
- `firstValueArtifact`: the packet path or artifact role that represented first value
- `timeToFirstValueMs`: explicit runtime duration when observable from command observations
- `operatorEffortSignal`: optional host-owned survey or review signal, not inferred from transcript vibes
- `triggerReliability`: optional explicit status for scheduled or automated entry points, such as `observed`, `missed`, or `not_applicable`
- `setupReadinessSignal`: optional explicit readiness state when a workflow depends on registry, schedule, runner, or adapter setup

This vocabulary should be optional and explicit-only.
Cautilus should preserve these fields when wrappers provide them, but should not infer sensitive context from shell history, Slack text, file paths, or raw local activity.

## Candidate Metrics

The first three metrics worth standardizing are:

1. `first_value_completion_rate`: among started Cautilus workflows with usage context, the fraction that produced a first-value artifact.
2. `time_to_first_value_ms`: latency from workflow start to the first durable artifact that can guide the next action.
3. `same_context_repeat_rate`: fraction of contexts that produce another bounded Cautilus workflow with the same `repoContextKey`, `triggerType`, `selectedJob`, and compatible `behaviorSurface` within a chosen window.

Two second-order metrics are useful but should not be first:

1. `trigger_success_rate`: among scheduled or automated triggers explicitly reported by a host, the fraction that reached the workflow entry point.
2. `setup_block_rate`: fraction of starts blocked by missing registry, runner, adapter, credential, or schedule setup.

These matter because the source thread's missed daily check-in was not a habit failure by the operator.
It was a workflow readiness failure.
Keeping that distinction prevents Cautilus from misclassifying infrastructure or setup gaps as user retention or motivation signals.

An automaticity score should stay optional.
If used, it should come from a lightweight operator prompt or host-owned survey, not from Cautilus guessing whether the user acted automatically.

## Design Options

### Option A: No Product Surface Yet

Cautilus does not add vocabulary now.
The issue remains a product research note for c-families comparison.

Tradeoff: safest for scope, but the same question will be rediscovered in each repo and metrics will drift.

### Option B: Packet Vocabulary Only

Cautilus defines optional `usageContext` vocabulary and derived metric names in docs.
Adapters and wrappers may emit it, and future reports can preserve it without Cautilus becoming the analytics store.

Tradeoff: enough shared language for c-families, but no automatic measurement until a host chooses to emit the fields.

### Option C: First-Class Usage Analytics Runtime

Cautilus adds event ingestion, aggregation, and maybe survey prompts.

Tradeoff: strongest analytics loop, but it conflicts with the current host-owned boundary and risks turning Cautilus into a product analytics backend.

## Recommendation

Choose Option B.
It matches Cautilus's packet-first boundary, keeps portability, and gives c-families a shared vocabulary without importing raw host-specific telemetry.

## Decision Points

Decision needed: should Cautilus standardize optional `usageContext` packet vocabulary now, or keep #45 as research-only until a real consumer requests it?

Recommendation: standardize vocabulary only.

Decision needed: should `same-context repeat` be keyed by repo plus trigger/job/surface, or should it include user identity?

Recommendation: do not include user identity in the Cautilus-owned vocabulary.
Let host analytics systems add identity outside Cautilus if they need cohort analysis.

Decision needed: should automaticity be inferred from behavior logs?

Recommendation: no.
Only preserve explicit operator survey or host-owned prompt results.

Decision needed: should trigger reliability and setup readiness be part of the same vocabulary?

Recommendation: yes, but only as explicit host-supplied context fields.
The source thread shows that repeat loops can fail before the user has a chance to act.

Decision needed: which first-value artifact counts for activation?

Recommendation: count the first durable Cautilus packet that names the next decision, with workflow-specific artifact roles documented per command family.

Decision needed: should this become a spec-backed contract now?

Recommendation: not yet.
First land the concept as internal research and issue design, then promote to `docs/contracts/reporting.md` or a dedicated contract only when a wrapper or adapter starts emitting the fields.

## Proposed Next Slice

If the vocabulary direction is accepted, add a small contract section for optional `usageContext` under reporting or a new `usage-context.md` contract.
Then add one fixture or report-packet test that proves Cautilus preserves explicit `usageContext` fields and does not infer them from logs.
