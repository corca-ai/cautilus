# Cautilus

`Cautilus` is a repo-agnostic intentful behavior evaluation product.
It is meant to help a host repo evaluate
agent runtimes, skills, and operator-facing command surfaces with bounded
loops, explicit baselines, held-out validation, comparison summaries, and
independent review variants.
It now also includes a product-owned helper that prepares clean baseline and
candidate git worktrees for explicit A/B evaluation runs.
The product target is a standalone binary plus a bundled skill that a host repo
can adopt without inheriting another repo's private runtime surfaces.
This repo now also carries minimal Codex and Claude plugin manifests plus
repo-local marketplace wiring so that the same checked-in skill can be
installed without copying it into another local scaffold first.

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
executor-variant runners, local Codex and Claude plugin packaging metadata,
and local tests for the bounded evaluation surface.
It also now includes checked-in GitHub workflows for `verify` and tagged
release artifacts, so the release/install surface is not only prose.

## Current Product Surface

Current `core validated surface`:

- adapter-driven CLI entrypoints for `resolve`, `init`, and `doctor`
- explicit A/B workspace preparation through `workspace prepare-compare`
- artifact-root retention through `workspace prune-artifacts`
- bounded runtime execution through `mode evaluate`
- scenario-history-aware profile selection and history updates for
  profile-backed mode runs
- comparison-mode baseline-cache seed materialization for profile-backed runs
- report assembly, review packet assembly, and review-variant fanout
- bounded CLI behavior evaluation through `cli evaluate`
- standalone install surface, local gates, and checked-in release helpers
- repo-local Codex and Claude plugin package and marketplace wiring for local
  skill install

Current `product-owned helper surface`:

- `chatbot`, `cli`, and `skill` normalization helpers
- scenario proposal packet assembly and proposal generation
- scenario telemetry summaries
- normalized evidence bundling
- bounded optimization input and proposal helpers

Dogfood and migration evidence is tracked separately in
[consumer-readiness.md](./docs/consumer-readiness.md) and
[consumer-migration.md](./docs/consumer-migration.md).

## Repo Layout

- [docs/workflow.md](./docs/workflow.md): canonical
  evaluation workflow
- [docs/contracts/active-run.md](./docs/contracts/active-run.md):
  active-run env var contract, default root, and canonical filenames
  that consumer commands default to inside a single workflow
- [docs/contracts/adapter-contract.md](./docs/contracts/adapter-contract.md):
  adapter schema and executor-variant contract
- [docs/contracts/reporting.md](./docs/contracts/reporting.md):
  minimum report packet shape
- [docs/contracts/scenario-history.md](./docs/contracts/scenario-history.md):
  profile, graduation, and baseline-cache contract
- [docs/contracts/scenario-proposal-sources.md](./docs/contracts/scenario-proposal-sources.md):
  runtime-activity source ports for draft scenario proposals
- [docs/contracts/scenario-proposal-inputs.md](./docs/contracts/scenario-proposal-inputs.md):
  normalized input packet consumed by `cautilus scenario propose`
- [docs/contracts/scenario-proposal-normalization.md](./docs/contracts/scenario-proposal-normalization.md):
  host-owned reference seam that assembles split normalized sources
- [docs/contracts/chatbot-normalization.md](./docs/contracts/chatbot-normalization.md):
  product-owned `chatbot` helper boundary for conversation-driven proposal candidates
- [docs/contracts/cli-normalization.md](./docs/contracts/cli-normalization.md):
  product-owned `cli` helper boundary for operator-guidance and behavior-contract candidates
- [docs/contracts/skill-normalization.md](./docs/contracts/skill-normalization.md):
  product-owned `skill` helper boundary for durable workflow and validation candidates
- [docs/contracts/cli-evaluation.md](./docs/contracts/cli-evaluation.md):
  product-owned bounded evaluation packet for operator-facing CLI behavior
- [docs/contracts/review-packet.md](./docs/contracts/review-packet.md):
  product-owned packet that binds report artifacts to comparison questions and review prompts
- [docs/contracts/review-prompt-inputs.md](./docs/contracts/review-prompt-inputs.md):
  product-owned meta-prompt packet above the review packet boundary
- [docs/contracts/evidence-bundle.md](./docs/contracts/evidence-bundle.md):
  product-owned normalized evidence-bundle seam above host-owned raw readers
- [docs/contracts/optimization.md](./docs/contracts/optimization.md):
  product-owned bounded optimizer input/proposal seam
- [docs/contracts/scenario-results.md](./docs/contracts/scenario-results.md):
  explicit per-mode scenario-results and compare-artifact contract
- [fixtures/scenario-proposals/input.schema.json](./fixtures/scenario-proposals/input.schema.json):
  checked-in schema for `cautilus.scenario_proposal_inputs.v1`
- [fixtures/scenario-proposals/proposals.schema.json](./fixtures/scenario-proposals/proposals.schema.json):
  checked-in schema for `cautilus.scenario_proposals.v1`
- [fixtures/scenario-proposals/chatbot-input.schema.json](./fixtures/scenario-proposals/chatbot-input.schema.json):
  checked-in schema for `cautilus.chatbot_normalization_inputs.v1`
- [fixtures/scenario-proposals/cli-input.schema.json](./fixtures/scenario-proposals/cli-input.schema.json):
  checked-in schema for `cautilus.cli_normalization_inputs.v1`
- [fixtures/scenario-proposals/skill-input.schema.json](./fixtures/scenario-proposals/skill-input.schema.json):
  checked-in schema for `cautilus.skill_normalization_inputs.v1`
- [fixtures/scenario-proposals/ceal-chatbot-input.json](./fixtures/scenario-proposals/ceal-chatbot-input.json):
  chatbot-shaped normalization example packet from one checked-in dogfood
  source
- [fixtures/scenario-proposals/charness-skill-input.json](./fixtures/scenario-proposals/charness-skill-input.json):
  skill-validation-shaped normalization example packet from one checked-in
  dogfood source
- [fixtures/scenario-proposals/crill-skill-input.json](./fixtures/scenario-proposals/crill-skill-input.json):
  durable-workflow-shaped normalization example packet from one checked-in
  dogfood source
- [docs/specs/index.spec.md](./docs/specs/index.spec.md):
  active product specs
- [docs/master-plan.md](./docs/master-plan.md): roadmap
  from extraction scaffold to standalone product
- [docs/release-boundary.md](./docs/release-boundary.md):
  current standalone release surface and compatibility discipline
- [docs/cli-distribution.md](./docs/cli-distribution.md):
  durable install, distribution, and Go-port tradeoffs for the standalone CLI
- [docs/releasing.md](./docs/releasing.md):
  tagged-release checksum, archive, and tap publication workflow
- [install.sh](./install.sh):
  curl-install surface for tagged GitHub releases
- [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json):
  repo-local Claude marketplace entry that points at `./plugins/cautilus`
- [plugins/cautilus/.claude-plugin/plugin.json](./plugins/cautilus/.claude-plugin/plugin.json):
  Claude plugin manifest for the packaged local install surface
- [plugins/cautilus/.codex-plugin/plugin.json](./plugins/cautilus/.codex-plugin/plugin.json):
  Codex plugin manifest for the packaged local install surface
- [.agents/plugins/marketplace.json](.agents/plugins/marketplace.json):
  repo-local marketplace entry that points Codex at `./plugins/cautilus`
- [plugins/cautilus/skills/cautilus/SKILL.md](./plugins/cautilus/skills/cautilus/SKILL.md):
  packaged skill copy consumed by the local Codex plugin install flow
- [docs/consumer-readiness.md](./docs/consumer-readiness.md):
  dogfood and live-consumer evidence appendix
- [skills/cautilus/SKILL.md](./skills/cautilus/SKILL.md):
  bundled standalone skill entrypoint
- [scripts/resolve_adapter.mjs](./scripts/resolve_adapter.mjs):
  adapter resolution and validation
- [scripts/init_adapter.mjs](./scripts/init_adapter.mjs):
  adapter scaffold creation
- [scripts/doctor.mjs](./scripts/doctor.mjs):
  adapter readiness diagnosis
- [scripts/agent-runtime/scenario-history.mjs](./scripts/agent-runtime/scenario-history.mjs):
  scenario selection, graduation, and history helpers
- [scripts/agent-runtime/chatbot-proposal-candidates.mjs](./scripts/agent-runtime/chatbot-proposal-candidates.mjs):
  chatbot-shaped conversation and blocked-run summaries to proposal-candidate
  helper
- [scripts/agent-runtime/skill-proposal-candidates.mjs](./scripts/agent-runtime/skill-proposal-candidates.mjs):
  skill-validation and durable-workflow summaries to proposal-candidate helper
- [scripts/agent-runtime/consumer-example-fixtures.test.mjs](./scripts/agent-runtime/consumer-example-fixtures.test.mjs):
  executable proof that multiple checked-in dogfood packet shapes normalize
  cleanly
- [scripts/agent-runtime/scenario-proposals.mjs](./scripts/agent-runtime/scenario-proposals.mjs):
  proposal ranking and draft-scenario payload helpers
- [scripts/agent-runtime/generate-scenario-proposals.mjs](./scripts/agent-runtime/generate-scenario-proposals.mjs):
  standalone proposal packet generator for normalized inputs
- [scripts/agent-runtime/build-review-prompt-input.mjs](./scripts/agent-runtime/build-review-prompt-input.mjs):
  explicit review meta-prompt input builder
- [scripts/agent-runtime/render-review-prompt.mjs](./scripts/agent-runtime/render-review-prompt.mjs):
  generic review meta-prompt renderer
- [scripts/agent-runtime/build-evidence-input.mjs](./scripts/agent-runtime/build-evidence-input.mjs):
  explicit evidence-input packet builder around normalized report/scenario/audit/history sources
- [scripts/agent-runtime/build-evidence-bundle.mjs](./scripts/agent-runtime/build-evidence-bundle.mjs):
  normalized evidence bundle builder with prioritized signals and bounded mining guidance
- [scripts/agent-runtime/build-optimize-input.mjs](./scripts/agent-runtime/build-optimize-input.mjs):
  bounded optimizer input builder around explicit report, review, and history evidence
- [scripts/agent-runtime/generate-optimize-proposal.mjs](./scripts/agent-runtime/generate-optimize-proposal.mjs):
  deterministic bounded revision proposal generator
- [scripts/agent-runtime/run-workbench-review-variant.sh](./scripts/agent-runtime/run-workbench-review-variant.sh):
  bounded single-variant runner
- [scripts/agent-runtime/run-workbench-executor-variants.mjs](./scripts/agent-runtime/run-workbench-executor-variants.mjs):
  adapter-driven variant fanout runner
- [bin/cautilus](./bin/cautilus): minimal CLI entrypoint

## Quick Start

Install from a tagged GitHub release:

```bash
curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh
cautilus --version
```

The installer downloads the tagged binary asset that matches the host OS and
architecture, so no local Go toolchain is required for the public install
path.

Install the bundled skill into a host repo:

```bash
cd /path/to/host-repo
cautilus skills install
```

This creates `.agents/skills/cautilus/` as the canonical checked-in skill path
and `.claude/skills -> ../.agents/skills` for Claude compatibility. The
installed skill assumes `cautilus` is already on `PATH`.

Resolve an adapter in a target repo:

```bash
cautilus adapter resolve --repo-root /path/to/repo
```

Scaffold a new adapter:

```bash
cautilus adapter init --repo-root /path/to/repo
```

Check whether a repo is ready for standalone `Cautilus` evaluation:

```bash
cautilus doctor --repo-root /path/to/repo
```

For Codex local plugin testing, this repo also exposes a packaged plugin
subtree through
[.agents/plugins/marketplace.json](.agents/plugins/marketplace.json)
and
[plugins/cautilus/.codex-plugin/plugin.json](./plugins/cautilus/.codex-plugin/plugin.json).

For Claude local plugin testing, this repo also exposes a repo-local
marketplace through
[.claude-plugin/marketplace.json](.claude-plugin/marketplace.json)
and
[plugins/cautilus/.claude-plugin/plugin.json](./plugins/cautilus/.claude-plugin/plugin.json).
Validate the checked-in Claude surface with:

```bash
claude plugins validate ./.claude-plugin/marketplace.json
claude plugins validate ./plugins/cautilus/.claude-plugin/plugin.json
```

Run the explicit self-dogfood pass for this repo and refresh the latest local
artifacts:

```bash
npm run dogfood:self
```

Run the self-dogfood tuning experiments without changing the canonical latest
bundle:

```bash
npm run dogfood:self:experiments
```

Refresh only the static HTML comparison view of the current latest experiments
bundle, without replaying the experiment reviews:

```bash
npm run dogfood:self:experiments:html
```

Refresh only the static HTML view of the current checked-in self-dogfood
bundle, without replaying the LLM-backed review:

```bash
npm run dogfood:self:html
```

The rendered HTML is written alongside the other published files at
`artifacts/self-dogfood/latest/index.html` and is automatically refreshed every
time `npm run dogfood:self` rewrites the latest bundle. It is a read-only view
of `summary.json`, `report.json`, and `review-summary.json`, so the JSON files
remain the source of truth.

The experiments HTML comparison view is written to
`artifacts/self-dogfood/experiments/latest/index.html` and is automatically
refreshed every time `npm run dogfood:self:experiments` rewrites the latest
experiments bundle. It exists so the deterministic gate baseline and named
experiment adapters can be compared side by side without reconstructing an A/B
diff by hand.

Prepare clean baseline and candidate git worktrees for a compare run:

```bash
cautilus workspace prepare-compare \
  --repo-root /path/to/repo \
  --baseline-ref origin/main \
  --output-dir /tmp/cautilus-compare
```

`--output-dir` is optional. When `CAUTILUS_RUN_DIR` is already pinned by
`cautilus workspace start`, `workspace prepare-compare` materializes
`baseline/` and `candidate/` under that active `runDir`; if nothing is pinned
it auto-materializes a fresh `runDir` under `./.cautilus/runs/` and prints
`Active run: <path>` to stderr.

Prune older Cautilus artifact bundles from a dedicated artifact root:

```bash
cautilus workspace prune-artifacts \
  --root /tmp/cautilus-runs \
  --keep-last 20
```

Start a fresh per-run subdirectory under one stable artifact root and pin it
as the active run for subsequent consumer commands. The default stdout is a
single shell-evalable line, so `eval` is the happy path:

```bash
eval "$(cautilus workspace start --label mode-held-out)"
```

`workspace start` defaults `--root` to `./.cautilus/runs/` (auto-created on
first use) and prints `export CAUTILUS_RUN_DIR=<absolute runDir>`. Pass
`--json` instead of `eval` if a script needs the machine-readable payload.

Normalize chatbot-style conversational summaries into proposal candidates:

```bash
cautilus scenario normalize chatbot \
  --input ./fixtures/scenario-proposals/chatbot-input.json
```

Normalize skill- or workflow-evaluation summaries into proposal candidates:

```bash
cautilus scenario normalize skill \
  --input ./fixtures/scenario-proposals/skill-input.json
```

Normalize CLI intent/evaluation summaries into proposal candidates:

```bash
cautilus scenario normalize cli \
  --input ./fixtures/scenario-proposals/cli-input.json
```

Generate a scenario proposal packet from normalized candidate input:

```bash
cautilus scenario propose \
  --input ./fixtures/scenario-proposals/standalone-input.json
```

Summarize scenario-level cost, token, and duration telemetry from explicit
result packets:

```bash
cautilus scenario summarize-telemetry \
  --results ./fixtures/scenario-results/example-results.json
```

Build a machine-readable evaluation report packet from explicit mode runs:

```bash
cautilus report build \
  --input ./fixtures/reports/report-input.json
```

Execute one adapter-defined mode directly and emit a report packet:

```bash
cautilus mode evaluate \
  --repo-root . \
  --mode held_out \
  --intent "CLI behavior should remain legible." \
  --baseline-ref origin/main \
  --output-dir /tmp/cautilus-mode
```

`--output-dir` is optional. When `CAUTILUS_RUN_DIR` is already pinned by
`cautilus workspace start`, `mode evaluate` drops its artifacts into that
active `runDir`; if nothing is pinned it auto-materializes a fresh `runDir`
under `./.cautilus/runs/` and prints `Active run: <path>` to stderr so the
operator still sees where the artifacts landed.

Assemble a durable review packet around a report before running review variants:

```bash
cautilus review prepare-input \
  --repo-root . \
  --report-file /tmp/cautilus-mode/report.json
```

Build the product-owned meta-prompt packet and render a review prompt:

```bash
cautilus review build-prompt-input \
  --review-packet /tmp/cautilus-mode/review.json

cautilus review render-prompt \
  --input /tmp/cautilus-mode/review-prompt-input.json
```

Prepare normalized evidence input and bundle packets before mining or
optimization:

```bash
cautilus evidence prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --scenario-results-file /tmp/cautilus-mode/scenario-results.json \
  --run-audit-file /tmp/cautilus-run-audit/summary.json \
  --history-file /tmp/cautilus-history/history.json

cautilus evidence bundle \
  --input /tmp/cautilus-evidence/input.json
```

Prepare one bounded optimization packet and generate a deterministic revision
brief from explicit evidence:

```bash
cautilus optimize prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --review-summary /tmp/cautilus-review/summary.json \
  --history-file /tmp/cautilus-history/history.json \
  --target prompt

cautilus optimize propose \
  --input /tmp/cautilus-optimize/input.json
```

Evaluate one operator-facing CLI behavior from an explicit intent packet:

```bash
cautilus cli evaluate \
  --input ./fixtures/cli-evaluation/doctor-missing-adapter.json
```

Assemble that input packet from split normalized source files:

```bash
cautilus scenario prepare-input \
  --candidates ./fixtures/scenario-proposals/candidates.json \
  --registry ./fixtures/scenario-proposals/registry.json \
  --coverage ./fixtures/scenario-proposals/coverage.json \
  --family fast_regression \
  --window-days 14 \
  --now 2026-04-11T00:00:00.000Z
```

Run every executor variant defined by an adapter:

```bash
cautilus review variants \
  --repo-root /path/to/repo \
  --adapter-name code-quality \
  --workspace /path/to/repo \
  --output-dir /tmp/cautilus-review
```

Direct script usage is also supported:

```bash
node scripts/resolve_adapter.mjs --repo-root .
node scripts/init_adapter.mjs --repo-root .
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
[skills/cautilus/SKILL.md](./skills/cautilus/SKILL.md).
Use `cautilus skills install` to materialize that same bundled surface into a
host repo under `.agents/skills/cautilus/`, with `.claude/skills` symlinked to
`.agents/skills` for Claude compatibility.

For Codex local plugin testing, the repo also exposes a packaged copy of that
skill through
[plugins/cautilus/.codex-plugin/plugin.json](./plugins/cautilus/.codex-plugin/plugin.json)
and [.agents/plugins/marketplace.json](.agents/plugins/marketplace.json).
Use
[`node ./scripts/release/check-codex-marketplace.mjs --repo-root .`](./scripts/release/check-codex-marketplace.mjs)
to verify that Codex can actually discover the repo marketplace entry.
For Claude local plugin testing, the same packaged subtree is also exposed
through
[plugins/cautilus/.claude-plugin/plugin.json](./plugins/cautilus/.claude-plugin/plugin.json)
and
[.claude-plugin/marketplace.json](.claude-plugin/marketplace.json).
Use `claude plugins validate ./.claude-plugin/marketplace.json` and
`claude plugins validate ./plugins/cautilus/.claude-plugin/plugin.json` to
verify the checked-in Claude manifest shapes.

## Dev

Install the local Node tooling, and make sure Go `1.26.x` plus
`golangci-lint` are available on `PATH`:

```bash
npm install
npm run hooks:install
go version
golangci-lint --version
```

Run checks:

```bash
npm run verify
npm run hooks:check
npm run dogfood:self
npm run dogfood:self:experiments
```

Use `npm run lint` or `npm run test` directly only when iterating on one seam.
`npm run lint` includes `golangci-lint run` and `go vet`, while
`npm run verify` additionally runs `go test -race` before the Node test suite.

`hooks:install` is a once-per-clone setup step that points `core.hooksPath` at
the checked-in `.githooks` directory, where `pre-push` runs `npm run verify`.

`dogfood:self` is explicit quality work, not a standing pre-push or CI gate.
It refreshes the latest self-dogfood bundle under
`artifacts/self-dogfood/latest/`. Its canonical claim is intentionally narrow:
it should tell operators whether Cautilus is recording and surfacing its own
self-dogfood result honestly, not whether every stronger binary or skill claim
has already been proven.
That `latest/` bundle is the published snapshot meant to be checked into Git,
so CI or a static HTML report can inspect the latest result without replaying
the LLM-backed review.

`dogfood:self:experiments` is the tuning path for named A/B and split-surface
reviews, including stronger binary and skill surface claims. It writes aggregate
experiment results under
`artifacts/self-dogfood/experiments/latest/`.
That bundle now includes a static `index.html` comparison view for the same
summary/report data, and `npm run dogfood:self:experiments:html` can refresh
that view without rerunning the experiment reviews.

Adapter bootstrap, readiness, and review-variant JSON helpers now live inside
the product-owned Node runtime. The standalone release surface no longer
depends on `python3`.
