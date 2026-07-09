# Skill Starter Kit

Smallest Cautilus wiring for evaluating a single skill or agent invocation.
Copy this directory into your consumer repo, then gradually replace the smoke placeholders in `cautilus-adapter.yaml` with your real evaluation commands.

## What this Normalization Family Covers

A single skill or agent invocation: does it trigger on the right prompts, execute the intended task cleanly, and keep declared validation surfaces passing.
The `scenario normalize skill` proposal-input lineage owns the input shape; see [skill-normalization.md](../../../docs/contracts/skill-normalization.md) and the evaluation claim in [evaluation.spec.md](../../../docs/specs/promises/evaluation.spec.md).

## Setup

1. Copy `cautilus-adapter.yaml` and `input.json` from this directory into your consumer repo.
   The adapter can live at the repo root or under `.agents/cautilus-adapter.yaml`.
2. Install the repo-local Cautilus Agent and confirm the starter resolves clean:

   ```bash
   cautilus init --repo-root .
   cautilus doctor adapter --repo-root .
   cautilus doctor --repo-root .
   cautilus doctor --repo-root . --next-action
   ```

The starter ships a `node -e` smoke placeholder for `eval_test_command_templates`, so `doctor` returns `ready` immediately.
Treat that as bootstrap help, not product-behavior proof.
Replace the placeholder with your real `cautilus evaluate fixture` runner over time.

## Run the skill entry point

`input.json` is a copy of the canonical skill normalization fixture that ships with Cautilus (kept byte-identical by a drift test).
Use it to confirm the pipeline is wired, then substitute your own skill evaluation summaries:

```bash
cautilus discover scenarios normalize skill --input input.json
```

If you want to generate such a summary in the first place, run `cautilus evaluate fixture` with a `surface=dev, preset=skill` fixture against an adapter-owned runner, then feed its observed packet into `cautilus evaluate observation` and from there into `cautilus discover scenarios normalize skill`.

See [skill-normalization.md](../../../docs/contracts/skill-normalization.md) for the full input shape.

## Next

- Replace the smoke placeholders with real commands.
- Run `cautilus evaluate fixture --fixture <skill.fixture.json>` and `cautilus evaluate observation` against your real skill case suite.
- When you have regressions worth saving, pipe them into
  `cautilus discover scenarios propose`.
