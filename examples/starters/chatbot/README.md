# Chatbot Starter Kit

Smallest Cautilus wiring for evaluating chatbot or conversational-agent behavior.
Copy this directory into your consumer repo, then gradually replace the smoke placeholders in `cautilus-adapter.yaml` with your real evaluation commands.

## What this Normalization Family Covers

Multi-turn conversational behavior inside a single session: follow-up handling, context recovery after ambiguous confirmations, and intent continuity across turns.
The `scenario normalize chatbot` proposal-input lineage owns the input shape; see [chatbot-normalization.md](../../../docs/contracts/chatbot-normalization.md) and the evaluation claim in [evaluation.spec.md](../../../docs/specs/user/evaluation.spec.md).

## Setup

1. Copy `cautilus-adapter.yaml` and `input.json` from this directory into your consumer repo.
   The adapter can live at the repo root or under `.agents/cautilus-adapter.yaml`.
2. Install the CLI and confirm the starter resolves clean:

   ```bash
   cautilus install --repo-root .
   cautilus adapter resolve --repo-root .
   cautilus doctor --repo-root .
   ```

The starter ships a `node -e` smoke placeholder for `eval_test_command_templates`, so `doctor` returns `ready` immediately.
Replace the placeholder with your real `cautilus eval test` command over time.

## Run the chatbot entry point

`input.json` is a copy of the canonical chatbot normalization fixture that ships with Cautilus (kept byte-identical by a drift test).
Use it to confirm the pipeline is wired, then substitute your own conversation summaries:

```bash
cautilus scenario normalize chatbot --input input.json
```

See [chatbot-normalization.md](../../../docs/contracts/chatbot-normalization.md) for the full input shape.

## Next

- Replace the smoke placeholders with real commands.
- Feed your own conversation logs into `cautilus scenario normalize chatbot`.
- When you have regressions worth saving, pipe them into
  `cautilus scenario propose`.
