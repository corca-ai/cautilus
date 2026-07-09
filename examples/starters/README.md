# Starter Kits

These directories are the smallest runnable consumer examples for the three shipped scenario-normalization families.
Use them when a new repo already knows the behavior shape it wants to start from and does not need to hand-author an adapter from scratch.
This index is an example catalog, not a claim-source truth surface; the durable adoption claims stay in [consumer-adoption.md](../../docs/guides/consumer-adoption.md) and [master-plan.md](../../docs/master-plan.md).

Each starter contains:

- `cautilus-adapter.yaml`: a minimal adapter with smoke placeholders that let `doctor` reach `ready`
- `input.json`: a byte-identical copy of the canonical normalization fixture for that family
- `README.md`: the family-specific setup and replacement path

The starter adapters are bootstrap aids, not product-behavior proof.
Replace the `node -e` smoke placeholders with host-owned runners before claiming real evaluation coverage.

## Families

| Family | Use When | Entry Point |
| --- | --- | --- |
| [chatbot](./chatbot/) | Multi-turn conversational behavior, context recovery, or follow-up handling | `cautilus discover scenarios normalize chatbot --input input.json` |
| [skill](./skill/) | A single skill or agent invocation needs trigger and execution behavior coverage | `cautilus discover scenarios normalize skill --input input.json` |
| [workflow](./workflow/) | A durable automation needs recovery coverage for repeated blockers or stalled steps | `cautilus discover scenarios normalize workflow --input input.json` |

Run the product-owned smoke from the Cautilus repo:

```bash
npm run consumer:starters:smoke
```

That smoke proves each starter's adapter resolves, repo-scope `doctor` reaches ready, and the matching `discover scenarios normalize` command emits at least one candidate.
