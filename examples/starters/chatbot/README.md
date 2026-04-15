# Chatbot Starter Kit

Smallest Cautilus wiring for evaluating chatbot or conversational-agent
behavior. Copy this directory into your consumer repo, then gradually
replace the smoke placeholders in `cautilus-adapter.yaml` with your real
evaluation commands.

## What this archetype evaluates

Multi-turn conversational behavior inside a single session: follow-up
handling, context recovery after ambiguous confirmations, and intent
continuity across turns. Full contract lives in
[archetype-boundary.spec.md](../../../docs/specs/archetype-boundary.spec.md)
under the `chatbot` section.

## Setup

1. Copy `cautilus-adapter.yaml` and `input.json` from this directory into
   your consumer repo. The adapter can live at the repo root or under
   `.agents/cautilus-adapter.yaml`.
2. Install the CLI and confirm the starter resolves clean:

   ```bash
   cautilus install --repo-root .
   cautilus adapter resolve --repo-root .
   cautilus doctor --repo-root .
   ```

The starter ships `node -e` smoke placeholders for every command
template, so `doctor` returns `ready` immediately. Replace each
placeholder (iterate / held_out / comparison / full_gate) with your real
command over time.

## Run the chatbot entry point

`input.json` is a copy of the canonical chatbot normalization fixture
that ships with Cautilus (kept byte-identical by a drift test). Use it
to confirm the pipeline is wired, then substitute your own conversation
summaries:

```bash
cautilus scenario normalize chatbot --input input.json
```

See
[chatbot-normalization.md](../../../docs/contracts/chatbot-normalization.md)
for the full input shape.

## Next

- Replace the smoke placeholders with real commands.
- Feed your own conversation logs into
  `cautilus scenario normalize chatbot`.
- When you have regressions worth saving, pipe them into
  `cautilus scenario propose`.
