# Ceal Consumer Experiment Brief

This brief is for consumer-side experimentation in the closed-source `Ceal` repo.
Its purpose is to discover realistic `chatbot` and `workflow` scenarios that can later be generalized into product-owned `Cautilus` fixtures, contracts, or runners.

## Boundary

`Ceal` may depend on `Cautilus`.
`Cautilus` must not gain an explicit dependency on `Ceal`.

That means the experiment may use `Ceal` code, prompts, adapters, fixtures, logs, and local scripts to discover candidate scenarios.
It must not copy `Ceal`-specific paths, names, prompts, policy text, or repo assumptions back into the open-source `Cautilus` product surface.

When bringing results back into `Cautilus`, only bring back generic behavior patterns, redacted example packets, and product-owned contract changes.

## Goal

Produce one realistic `chatbot` candidate scenario and one realistic `workflow` candidate scenario from `Ceal`.
Each candidate should be strong enough that a `Cautilus` maintainer could justify promoting it into a checked-in generic fixture or test seam.

## Consumer-Side Workflow

1. Install or restore `Ceal` dependencies until the repo can run its intended local checks.
2. Run the smallest useful `Ceal` checks to confirm the repo is in a usable state before harvesting scenarios.
3. Find one `chatbot`-shaped behavior regression or stability question that reflects a real consumer concern.
4. Find one `workflow`-shaped recovery or blockage scenario that reflects a real consumer concern.
5. Convert each finding into a generic candidate packet shape instead of leaving it as a repo-specific anecdote.
6. Return with redacted notes about what should be promoted into `Cautilus`.

## Candidate Quality Bar

Use a scenario only if it clears this bar.

- It reflects a real operator or user-visible behavior question.
- It maps cleanly onto exactly one `Cautilus` archetype.
- It can be described without `Ceal`-specific naming or private policy text.
- It teaches something reusable about behavior evaluation, not only about `Ceal` internals.
- It is small enough to become a maintained checked-in fixture.

Reject a candidate if it depends on private business context, secret prompts, non-portable environment assumptions, or repo-local naming that would be meaningless to another consumer.

## Archetype Mapping

Use the `Cautilus` archetypes as the normalization target, not as an afterthought.

### Chatbot

Choose a multi-turn conversational behavior inside one session.
Good examples include context recovery, preference retention, clarification behavior, or following a previously established constraint.

The target shape is `cautilus.chatbot_normalization_inputs.v1`.
Use `cautilus scenario normalize chatbot --example-input` as the canonical minimal shape.

### Workflow

Choose a stateful automation or recovery situation that persists across invocations and gets stuck, repeats, or requires operator recovery judgment.
Good examples include repeated no-progress steps, blocked recovery loops, or a durable task that cannot complete after multiple attempts.

The target shape is `cautilus.workflow_normalization_inputs.v1`.
Use `cautilus scenario normalize workflow --example-input` as the canonical minimal shape.

## What To Bring Back

Bring back only generic, redacted artifacts.

Required return items:

- one short note describing the `chatbot` candidate in generic terms
- one short note describing the `workflow` candidate in generic terms
- one redacted JSON draft for the `chatbot` packet
- one redacted JSON draft for the `workflow` packet
- a short judgment for each candidate:
  - `promote now`
  - `needs more reduction`
  - `do not promote`

Optional return items:

- a note about any missing `Cautilus` contract field that blocked honest representation
- a note about any metric or evidence surface that should become product-owned

## Redaction Rules

Before bringing anything back into `Cautilus`, remove or replace:

- repo names
- company or customer names
- internal channel names
- user identifiers
- private prompt text
- policy text that is specific to `Ceal`
- file paths that only make sense inside `Ceal`

Prefer replacements such as:

- `consumer-chat-thread`
- `workflow-recovery-example`
- `system policy omitted`
- `internal actor`

## Return Format

Use a compact handoff like this.

```md
## Candidate: chatbot
Status: promote now
Why it matters: <one or two sentences>
What was redacted: <one sentence>
Generic packet: <attach JSON>
Needed Cautilus change: <optional, one sentence>

## Candidate: workflow
Status: needs more reduction
Why it matters: <one or two sentences>
What was redacted: <one sentence>
Generic packet: <attach JSON>
Needed Cautilus change: <optional, one sentence>
```

## Promotion Rule

Promotion into `Cautilus` should happen only in the `Cautilus` repo.
The promoted artifact must be rewritten as a generic product-owned fixture, test, contract update, or runner change.

Do not land `Ceal` names, paths, adapter ids, or prompt fragments in `Cautilus`.
If a result cannot survive that rewrite, it is consumer evidence, not product surface.
