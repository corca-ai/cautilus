# Cautilus

`Cautilus` is an intentful behavior evaluation product extracted from Ceal's
`workbench`.
It is meant to become the repo-agnostic layer that helps a host repo evaluate
agent runtimes, skills, and operator-facing command surfaces with bounded
loops, explicit baselines, held-out validation, comparison summaries, and
independent review variants.
It now also includes a product-owned helper that prepares clean baseline and
candidate git worktrees for explicit A/B evaluation runs.
The product target is a standalone binary plus a bundled skill that a host repo
can adopt without inheriting Ceal's private runtime surfaces.

The intended product shape is:

- a small CLI or runtime entrypoint for adapter-driven intentful behavior
  evaluation
- repo-local adapters that define how a host repo runs iterate, held-out,
  comparison, and full-gate checks
- optional executor-variant runners for structured `codex exec`,
  `claude -p`, or other bounded review passes
- a contract that separates training surfaces from held-out surfaces
- first-class use-case helpers for `chatbot`, `cli`, and `skill`
  evaluation packets
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
It also now includes checked-in GitHub workflows for `verify` and tagged
release artifacts, so the release/install surface is not only prose.
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
- [docs/contracts/chatbot-normalization.md](/home/ubuntu/cautilus/docs/contracts/chatbot-normalization.md):
  product-owned `chatbot` helper boundary for conversation-driven proposal candidates
- [docs/contracts/cli-normalization.md](/home/ubuntu/cautilus/docs/contracts/cli-normalization.md):
  product-owned `cli` helper boundary for operator-guidance and behavior-contract candidates
- [docs/contracts/skill-normalization.md](/home/ubuntu/cautilus/docs/contracts/skill-normalization.md):
  product-owned `skill` helper boundary for durable workflow and validation candidates
- [docs/contracts/cli-evaluation.md](/home/ubuntu/cautilus/docs/contracts/cli-evaluation.md):
  product-owned bounded evaluation packet for operator-facing CLI behavior
- [docs/contracts/review-packet.md](/home/ubuntu/cautilus/docs/contracts/review-packet.md):
  product-owned packet that binds report artifacts to comparison questions and review prompts
- [docs/contracts/review-prompt-inputs.md](/home/ubuntu/cautilus/docs/contracts/review-prompt-inputs.md):
  product-owned meta-prompt packet above the review packet boundary
- [docs/contracts/evidence-bundle.md](/home/ubuntu/cautilus/docs/contracts/evidence-bundle.md):
  product-owned normalized evidence-bundle seam above host-owned raw readers
- [docs/contracts/optimization.md](/home/ubuntu/cautilus/docs/contracts/optimization.md):
  product-owned bounded optimizer input/proposal seam
- [docs/contracts/scenario-results.md](/home/ubuntu/cautilus/docs/contracts/scenario-results.md):
  explicit per-mode scenario-results and compare-artifact contract
- [fixtures/scenario-proposals/input.schema.json](/home/ubuntu/cautilus/fixtures/scenario-proposals/input.schema.json):
  checked-in schema for `cautilus.scenario_proposal_inputs.v1`
- [fixtures/scenario-proposals/proposals.schema.json](/home/ubuntu/cautilus/fixtures/scenario-proposals/proposals.schema.json):
  checked-in schema for `cautilus.scenario_proposals.v1`
- [fixtures/scenario-proposals/chatbot-input.schema.json](/home/ubuntu/cautilus/fixtures/scenario-proposals/chatbot-input.schema.json):
  checked-in schema for `cautilus.chatbot_normalization_inputs.v1`
- [fixtures/scenario-proposals/cli-input.schema.json](/home/ubuntu/cautilus/fixtures/scenario-proposals/cli-input.schema.json):
  checked-in schema for `cautilus.cli_normalization_inputs.v1`
- [fixtures/scenario-proposals/skill-input.schema.json](/home/ubuntu/cautilus/fixtures/scenario-proposals/skill-input.schema.json):
  checked-in schema for `cautilus.skill_normalization_inputs.v1`
- [fixtures/scenario-proposals/ceal-chatbot-input.json](/home/ubuntu/cautilus/fixtures/scenario-proposals/ceal-chatbot-input.json):
  Ceal-shaped `chatbot` normalization example packet
- [fixtures/scenario-proposals/charness-skill-input.json](/home/ubuntu/cautilus/fixtures/scenario-proposals/charness-skill-input.json):
  charness-shaped `skill` normalization example packet
- [fixtures/scenario-proposals/crill-skill-input.json](/home/ubuntu/cautilus/fixtures/scenario-proposals/crill-skill-input.json):
  crill-shaped `skill` normalization example packet
- [docs/specs/index.spec.md](/home/ubuntu/cautilus/docs/specs/index.spec.md):
  active product specs
- [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md): roadmap
  from extraction scaffold to standalone product
- [docs/release-boundary.md](/home/ubuntu/cautilus/docs/release-boundary.md):
  current standalone release surface and compatibility discipline
- [docs/releasing.md](/home/ubuntu/cautilus/docs/releasing.md):
  tagged-release checksum, archive, and tap publication workflow
- [install.sh](/home/ubuntu/cautilus/install.sh):
  curl-install surface for tagged GitHub releases
- [docs/consumer-readiness.md](/home/ubuntu/cautilus/docs/consumer-readiness.md):
  current live-consumer vs normalization-reference status for Ceal, charness,
  and crill
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
- [scripts/agent-runtime/chatbot-proposal-candidates.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/chatbot-proposal-candidates.mjs):
  Ceal-shaped conversation and blocked-run summaries to proposal-candidate helper
- [scripts/agent-runtime/skill-proposal-candidates.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/skill-proposal-candidates.mjs):
  charness- and crill-shaped validation summaries to proposal-candidate helper
- [scripts/agent-runtime/consumer-example-fixtures.test.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/consumer-example-fixtures.test.mjs):
  executable proof that Ceal/charness/crill-shaped packets normalize cleanly
- [scripts/agent-runtime/scenario-proposals.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/scenario-proposals.mjs):
  proposal ranking and draft-scenario payload helpers
- [scripts/agent-runtime/generate-scenario-proposals.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/generate-scenario-proposals.mjs):
  standalone proposal packet generator for normalized inputs
- [scripts/agent-runtime/build-review-prompt-input.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/build-review-prompt-input.mjs):
  explicit review meta-prompt input builder
- [scripts/agent-runtime/render-review-prompt.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/render-review-prompt.mjs):
  generic review meta-prompt renderer
- [scripts/agent-runtime/build-evidence-input.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/build-evidence-input.mjs):
  explicit evidence-input packet builder around normalized report/scenario/audit/history sources
- [scripts/agent-runtime/build-evidence-bundle.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/build-evidence-bundle.mjs):
  normalized evidence bundle builder with prioritized signals and bounded mining guidance
- [scripts/agent-runtime/build-optimize-input.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/build-optimize-input.mjs):
  bounded optimizer input builder around explicit report, review, and history evidence
- [scripts/agent-runtime/generate-optimize-proposal.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/generate-optimize-proposal.mjs):
  deterministic bounded revision proposal generator
- [scripts/agent-runtime/run-workbench-review-variant.sh](/home/ubuntu/cautilus/scripts/agent-runtime/run-workbench-review-variant.sh):
  bounded single-variant runner
- [scripts/agent-runtime/run-workbench-executor-variants.mjs](/home/ubuntu/cautilus/scripts/agent-runtime/run-workbench-executor-variants.mjs):
  adapter-driven variant fanout runner
- [bin/cautilus](/home/ubuntu/cautilus/bin/cautilus): minimal CLI entrypoint

## Quick Start

Install from a tagged GitHub release:

```bash
curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh
```

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

Prepare clean baseline and candidate git worktrees for a compare run:

```bash
node ./bin/cautilus workspace prepare-compare \
  --repo-root /path/to/repo \
  --baseline-ref origin/main \
  --output-dir /tmp/cautilus-compare
```

Normalize chatbot-style conversational summaries into proposal candidates:

```bash
node ./bin/cautilus scenario normalize chatbot \
  --input ./fixtures/scenario-proposals/chatbot-input.json
```

Normalize skill- or workflow-evaluation summaries into proposal candidates:

```bash
node ./bin/cautilus scenario normalize skill \
  --input ./fixtures/scenario-proposals/skill-input.json
```

Normalize CLI intent/evaluation summaries into proposal candidates:

```bash
node ./bin/cautilus scenario normalize cli \
  --input ./fixtures/scenario-proposals/cli-input.json
```

Generate a scenario proposal packet from normalized candidate input:

```bash
node ./bin/cautilus scenario propose \
  --input ./fixtures/scenario-proposals/standalone-input.json
```

Summarize scenario-level cost, token, and duration telemetry from explicit
result packets:

```bash
node ./bin/cautilus scenario summarize-telemetry \
  --results ./fixtures/scenario-results/example-results.json
```

Build a machine-readable evaluation report packet from explicit mode runs:

```bash
node ./bin/cautilus report build \
  --input ./fixtures/reports/report-input.json
```

Execute one adapter-defined mode directly and emit a report packet:

```bash
node ./bin/cautilus mode evaluate \
  --repo-root . \
  --mode held_out \
  --intent "CLI behavior should remain legible." \
  --baseline-ref origin/main \
  --output-dir /tmp/cautilus-mode
```

Assemble a durable review packet around a report before running review variants:

```bash
node ./bin/cautilus review prepare-input \
  --repo-root . \
  --report-file /tmp/cautilus-mode/report.json
```

Build the product-owned meta-prompt packet and render a review prompt:

```bash
node ./bin/cautilus review build-prompt-input \
  --review-packet /tmp/cautilus-mode/review.json

node ./bin/cautilus review render-prompt \
  --input /tmp/cautilus-mode/review-prompt-input.json
```

Prepare normalized evidence input and bundle packets before mining or
optimization:

```bash
node ./bin/cautilus evidence prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --scenario-results-file /tmp/cautilus-mode/scenario-results.json \
  --run-audit-file /tmp/cautilus-run-audit/summary.json \
  --history-file /tmp/cautilus-history/history.json

node ./bin/cautilus evidence bundle \
  --input /tmp/cautilus-evidence/input.json
```

Prepare one bounded optimization packet and generate a deterministic revision
brief from explicit evidence:

```bash
node ./bin/cautilus optimize prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --review-summary /tmp/cautilus-review/summary.json \
  --history-file /tmp/cautilus-history/history.json \
  --target prompt

node ./bin/cautilus optimize propose \
  --input /tmp/cautilus-optimize/input.json
```

Evaluate one operator-facing CLI behavior from an explicit intent packet:

```bash
node ./bin/cautilus cli evaluate \
  --input ./fixtures/cli-evaluation/doctor-missing-adapter.json
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
node scripts/agent-runtime/normalize-chatbot-proposals.mjs --input ./fixtures/scenario-proposals/chatbot-input.json
node scripts/agent-runtime/normalize-cli-proposals.mjs --input ./fixtures/scenario-proposals/cli-input.json
node scripts/agent-runtime/normalize-skill-proposals.mjs --input ./fixtures/scenario-proposals/skill-input.json
node scripts/agent-runtime/build-scenario-proposal-input.mjs --candidates ./fixtures/scenario-proposals/candidates.json --registry ./fixtures/scenario-proposals/registry.json --coverage ./fixtures/scenario-proposals/coverage.json --family fast_regression
node scripts/agent-runtime/generate-scenario-proposals.mjs --input ./fixtures/scenario-proposals/standalone-input.json
node scripts/agent-runtime/build-evidence-input.mjs --report-file /tmp/cautilus-mode/report.json --scenario-results-file ./fixtures/scenario-results/example-results.json
node scripts/agent-runtime/build-evidence-bundle.mjs --input /tmp/cautilus-evidence/input.json
node scripts/agent-runtime/build-optimize-input.mjs --report-file /tmp/cautilus-mode/report.json --target prompt
node scripts/agent-runtime/generate-optimize-proposal.mjs --input /tmp/cautilus-optimize/input.json
node scripts/agent-runtime/summarize-scenario-telemetry.mjs --results ./fixtures/scenario-proposals/results.json
node scripts/agent-runtime/build-report-packet.mjs --input ./fixtures/reports/report-input.json
node scripts/agent-runtime/evaluate-adapter-mode.mjs --repo-root . --mode held_out --intent "CLI behavior should remain legible." --baseline-ref origin/main --output-dir /tmp/cautilus-mode
node scripts/agent-runtime/evaluate-cli-intent.mjs --input ./fixtures/cli-evaluation/doctor-missing-adapter.json
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
