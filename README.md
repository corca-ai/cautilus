# Cautilus

`Cautilus` is an evaluation product extracted from Ceal's `workbench`.
It is meant to become the repo-agnostic layer that helps a host repo evaluate
agent runtime changes with bounded loops, explicit baselines, held-out
validation, comparison summaries, and independent review variants.
The product target is a standalone binary plus a bundled skill that a host repo
can adopt without inheriting Ceal's private runtime surfaces.

The intended product shape is:

- a small CLI or runtime entrypoint for adapter-driven evaluation
- repo-local adapters that define how a host repo runs iterate, held-out,
  comparison, and full-gate checks
- optional executor-variant runners for structured `codex exec`,
  `claude -p`, or other bounded review passes
- a contract that separates training surfaces from held-out surfaces
- a path to propose new scenarios from runtime logs instead of hand-authoring
  every benchmark case forever

The longer-term direction is closer to the workflow philosophy behind DSPy:
intent and evaluation contracts matter more than preserving one prompt
verbatim, and prompts should be allowed to improve as long as the behavior
survives evaluation.

## Current Status

This repo is still early.
It already owns the generic workflow and adapter contracts plus bootstrap
scripts.
It now also includes a minimal CLI, a bundled `cautilus` skill surface,
executor-variant runners, and local tests for the adapter and review-variant
surfaces.
Ceal remains a proving-ground consumer, not the product boundary.

## Repo Layout

- [docs/workflow.md](/home/ubuntu/cautilus/docs/workflow.md): canonical
  evaluation workflow
- [docs/contracts/adapter-contract.md](/home/ubuntu/cautilus/docs/contracts/adapter-contract.md):
  adapter schema and executor-variant contract
- [docs/contracts/reporting.md](/home/ubuntu/cautilus/docs/contracts/reporting.md):
  minimum report packet shape
- [docs/contracts/scenario-history.md](/home/ubuntu/cautilus/docs/contracts/scenario-history.md):
  profile, graduation, and baseline-cache contract
- [docs/contracts/scenario-proposal-sources.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-sources.md):
  runtime-activity source ports for draft scenario proposals
- [docs/contracts/scenario-proposal-inputs.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-inputs.md):
  normalized input packet consumed by `cautilus scenario propose`
- [docs/contracts/scenario-proposal-normalization.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-normalization.md):
  host-owned reference seam that assembles split normalized sources
- [docs/specs/index.spec.md](/home/ubuntu/cautilus/docs/specs/index.spec.md):
  active product specs
- [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md): roadmap
  from extraction scaffold to standalone product
- [skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md):
  bundled standalone skill entrypoint
- [scripts/resolve_adapter.py](/home/ubuntu/cautilus/scripts/resolve_adapter.py):
  adapter resolution and validation
- [scripts/init_adapter.py](/home/ubuntu/cautilus/scripts/init_adapter.py):
  adapter scaffold creation
- [scripts/doctor.py](/home/ubuntu/cautilus/scripts/doctor.py):
  adapter readiness diagnosis
- [scripts/agent-runtime/scenario-history.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/scenario-history.mjs):
  scenario selection, graduation, and history helpers
- [scripts/agent-runtime/scenario-proposals.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/scenario-proposals.mjs):
  proposal ranking and draft-scenario payload helpers
- [scripts/agent-runtime/generate-scenario-proposals.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/generate-scenario-proposals.mjs):
  standalone proposal packet generator for normalized inputs
- [scripts/agent-runtime/run-workbench-review-variant.sh](/home/ubuntu/cautilus/scripts/agent-runtime/run-workbench-review-variant.sh):
  bounded single-variant runner
- [scripts/agent-runtime/run-workbench-executor-variants.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/run-workbench-executor-variants.mjs):
  adapter-driven variant fanout runner
- [bin/cautilus](/home/ubuntu/cautilus/bin/cautilus): minimal CLI entrypoint

## Quick Start

Resolve an adapter in a target repo:

```bash
node ./bin/cautilus adapter resolve --repo-root /path/to/repo
```

Scaffold a new adapter:

```bash
node ./bin/cautilus adapter init --repo-root /path/to/repo
```

Check whether a repo is ready for standalone `Cautilus` evaluation:

```bash
node ./bin/cautilus doctor --repo-root /path/to/repo
```

Generate a scenario proposal packet from normalized candidate input:

```bash
node ./bin/cautilus scenario propose \
  --input ./fixtures/scenario-proposals/standalone-input.json
```

Assemble that input packet from split normalized source files:

```bash
node ./bin/cautilus scenario prepare-input \
  --candidates ./fixtures/scenario-proposals/candidates.json \
  --registry ./fixtures/scenario-proposals/registry.json \
  --coverage ./fixtures/scenario-proposals/coverage.json \
  --family fast_regression \
  --window-days 14 \
  --now 2026-04-11T00:00:00.000Z
```

Run every executor variant defined by an adapter:

```bash
node ./bin/cautilus review variants \
  --repo-root /path/to/repo \
  --adapter-name code-quality \
  --workspace /path/to/repo \
  --output-dir /tmp/cautilus-review
```

Direct script usage is also supported:

```bash
python3 scripts/resolve_adapter.py --repo-root .
python3 scripts/init_adapter.py --repo-root .
node scripts/agent-runtime/run-workbench-executor-variants.mjs --workspace . --output-dir /tmp/cautilus-review
node scripts/agent-runtime/build-scenario-proposal-input.mjs --candidates ./fixtures/scenario-proposals/candidates.json --registry ./fixtures/scenario-proposals/registry.json --coverage ./fixtures/scenario-proposals/coverage.json --family fast_regression
node scripts/agent-runtime/generate-scenario-proposals.mjs --input ./fixtures/scenario-proposals/standalone-input.json
```

The bundled skill surface lives at
[skills/cautilus/SKILL.md](/home/ubuntu/cautilus/skills/cautilus/SKILL.md).
Use it when the host environment supports checked-in local skills and you want
the same workflow surface as the standalone binary.

## Dev

Install the local Node tooling:

```bash
npm install
```

Run checks:

```bash
npm run lint
npm run test
npm run verify
```

`init_adapter.py` no longer needs `PyYAML`; the Python surface is stdlib-only.
