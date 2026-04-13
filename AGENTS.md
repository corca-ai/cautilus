# AGENTS

This repo is the standalone product boundary for `Cautilus`, extracted from
Ceal's `workbench`.

## Operating Stance

- Use the actual available skills for this turn before improvising a local
  workflow.
- Keep manually maintained docs in English.
  Exceptions: [docs/handoff.md](./docs/handoff.md),
  [docs/operator-acceptance.md](./docs/operator-acceptance.md),
  executable specs under [docs/specs/](./docs/specs), and
  temporary product-planning notes while they are being rewritten.
- Speak to this user in Korean unless they ask otherwise.
- Prefer the source of truth over copied checklists.
  Deterministic behavior belongs in code, scripts, adapters, tests, and specs.
- Optimize for `Cautilus` as an independent binary plus bundled skill before
  optimizing Ceal or another host repo as a consumer.

## Product Intent

- `Cautilus` owns generic intentful behavior evaluation workflow contracts.
- Host repos own adapter instances, fixtures, prompts, and policy.
- The product should prefer explicit baselines, held-out validation, bounded
  loops, and structured review over ad-hoc benchmark narratives.
- The long-term direction is intent-first and intentful behavior evaluation:
  prompts can change if the evaluated behavior gets better.

## Current Boundaries

- Generic contracts live under [docs/](./docs).
- Bootstrap adapter helpers live under [scripts/](./scripts).
- Minimal runtime runners live under
  [scripts/agent-runtime/](./scripts/agent-runtime).
- The CLI entrypoint lives at [bin/cautilus](./bin/cautilus).
- The bundled standalone skill lives under
  [skills/cautilus/](./skills/cautilus).
- Product roadmap lives at [docs/master-plan.md](./docs/master-plan.md).

## Repo Memory

- [docs/handoff.md](./docs/handoff.md): next-session pickup
  and volatile state
- [docs/master-plan.md](./docs/master-plan.md): durable
  product direction and priority order
- [docs/specs/index.spec.md](./docs/specs/index.spec.md):
  currently claimed product surface
- [docs/operator-acceptance.md](./docs/operator-acceptance.md):
  tiered human acceptance checklist
- [docs/ceal-workbench-extraction.md](./docs/ceal-workbench-extraction.md):
  Ceal extraction and consumer migration notes

## Working Rules

- Keep the adapter schema repo-agnostic.
- Do not import Ceal-specific adapters, prompts, output paths, or audit UI
  unless they are being explicitly generalized.
- Prefer adding small bounded runtimes over large operator surfaces.
- If Ceal has gained generic workbench knowledge, bring it here rather than
  letting the contracts drift.
- When adding a new runtime surface, add at least one executable test.

## Commit Discipline

- After each meaningful unit of work, create a git commit before moving on.
- Write commit messages so later announcements can recover intent without
  guessing.
- Prefer commit subjects that state user-facing or operator-facing purpose, not
  mechanism.
- Add a short body when it clarifies the trigger, boundary, or behavior change.

## Local Checks

Once per clone, install the checked-in Git hooks:

```bash
npm run hooks:install
```

Use these before stopping:

```bash
npm run verify
npm run hooks:check
```

Use `npm run lint` and `npm run test` directly when iterating on one seam, but
do not require all three in sequence before stopping.

Key direct commands:

```bash
cautilus adapter resolve --repo-root .
cautilus adapter init --repo-root .
cautilus doctor --repo-root .
cautilus review variants --repo-root . --workspace . --output-dir /tmp/cautilus-review
```
