# AGENTS

This repo is the standalone product boundary for `Cautilus`, extracted from
Ceal's `workbench`.

## Product Intent

- `Cautilus` owns generic evaluation workflow contracts.
- Host repos own adapter instances, fixtures, prompts, and policy.
- The product should prefer explicit baselines, held-out validation, bounded
  loops, and structured review over ad-hoc benchmark narratives.
- The long-term direction is intent-first evaluation: prompts can change if
  the evaluated behavior gets better.

## Current Boundaries

- Generic contracts live under [docs/](/home/ubuntu/cautilus/docs).
- Bootstrap Python helpers live under [scripts/](/home/ubuntu/cautilus/scripts).
- Minimal runtime runners live under
  [scripts/agent-runtime/](/home/ubuntu/cautilus/scripts/agent-runtime).
- The CLI entrypoint lives at [bin/cautilus](/home/ubuntu/cautilus/bin/cautilus).
- Product roadmap lives at [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md).

## Working Rules

- Keep the adapter schema repo-agnostic.
- Do not import Ceal-specific adapters, prompts, output paths, or audit UI
  unless they are being explicitly generalized.
- Prefer adding small bounded runtimes over large operator surfaces.
- If Ceal has gained generic workbench knowledge, bring it here rather than
  letting the contracts drift.
- When adding a new runtime surface, add at least one executable test.

## Local Checks

Use these before stopping:

```bash
npm run lint
npm run test
npm run verify
```

Key direct commands:

```bash
node ./bin/cautilus adapter resolve --repo-root .
node ./bin/cautilus adapter init --repo-root .
node ./bin/cautilus review variants --repo-root . --workspace . --output-dir /tmp/cautilus-review
```
