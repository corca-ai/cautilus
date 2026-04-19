# CLI Reference

Full command catalog for `cautilus`.
For the narrative overview, see the [README](../README.md).
For install and update lifecycle on a fresh machine, see [install.md](../install.md).

## Install & lifecycle

```bash
# curl-install (tagged release)
curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh

# Homebrew tap
brew install corca-ai/tap/cautilus

# install CLI + bundled skill into a host repo
cautilus install --repo-root /path/to/host-repo

# refresh the CLI and the checked-in bundled skill in a repo
cautilus update --repo-root /path/to/host-repo

# inspect local version provenance
cautilus version --verbose
```

`cautilus version --verbose` is also the quickest binary-only summary of what
`Cautilus` currently considers its product surface:
who it is for, which archetype to start from, and which report fields now matter
when a run rejects.

The lower-level compatibility command `cautilus skills install` remains available when a workflow needs to call the skill installer directly.

## Adapter bootstrap

```bash
# generate a minimal repo-local adapter scaffold
cautilus adapter init --repo-root .

# resolve and validate the adapter
cautilus adapter resolve --repo-root .
```

If you already know which archetype your repo evaluates, start from an archetype-specific starter kit under [examples/starters/](../examples/starters/) instead of `cautilus adapter init`.
Each starter ships a pre-filled `cautilus-adapter.yaml`, a canonical input fixture, and a README that explains what to replace next.
Treat starter placeholders as bootstrap help, not as proof that a real consumer workflow is already wired.

A minimal adapter must wire at least one real runnable path to reach `doctor ready`:

```yaml
held_out_command_templates:
  - npm run bench:test -- --baseline-ref {baseline_ref} --samples {held_out_samples}
```

## Probes & discovery

```bash
# binary health, no repo required
cautilus healthcheck --json

# command discovery, safe for wrapper tooling and agent runtimes
cautilus commands --json

# repo readiness for evaluation
cautilus doctor --repo-root /path/to/repo

# local agent-skill discoverability in a consumer repo
cautilus doctor --repo-root /path/to/repo --scope agent-surface

# archetype catalog, for agents that need to discover archetypes
cautilus scenarios --json
```

`cautilus <subcommand> --help` exits `0` for the registered native command surface, including grouped topics such as `cautilus optimize search --help`.
Use `doctor --scope agent-surface` to verify only the bundled skill and local agent-surface install.
Use default `doctor` (`--scope repo`) to verify the repo has a real runnable evaluation path.
When repo-scope `doctor` returns `ready`, the JSON payload includes `first_bounded_run`: the same archetype catalog as `cautilus scenarios --json` plus a starter `mode evaluate -> review prepare-input -> review variants` loop.
When a repo intentionally keeps only named adapters under `.agents/cautilus-adapters/`, run `cautilus doctor --repo-root /path/to/repo --adapter-name <name>` for repo-scope validation instead of expecting plain `doctor` to guess which named adapter you mean.

For the shortest end-to-end adoption proof in a fresh consumer repo:

```bash
npm run consumer:onboard:smoke
```

## Workspace management

```bash
# start a fresh per-run subdirectory under one stable artifact root and pin it
eval "$(cautilus workspace start --label mode-held-out)"

# prepare clean baseline and candidate git worktrees for a compare run
cautilus workspace prepare-compare \
  --repo-root /path/to/repo \
  --baseline-ref origin/main \
  --output-dir /tmp/cautilus-compare

# prune older Cautilus artifact bundles
cautilus workspace prune-artifacts \
  --root /tmp/cautilus-runs \
  --keep-last 20
```

`workspace start` defaults `--root` to `./.cautilus/runs/` (auto-created on first use) and prints `export CAUTILUS_RUN_DIR=<absolute runDir>`.
Pass `--json` instead of `eval` when a script needs the machine-readable payload.
When `CAUTILUS_RUN_DIR` is already pinned, downstream commands (`workspace prepare-compare`, `mode evaluate`) reuse that active `runDir`; if nothing is pinned they auto-materialize a fresh `runDir` and print `Active run: <path>` to stderr.

## Scenarios

```bash
# normalize chatbot-style conversation summaries
cautilus scenario normalize chatbot \
  --input ./fixtures/scenario-proposals/chatbot-input.json

# normalize skill-evaluation summaries
cautilus scenario normalize skill \
  --input /tmp/cautilus-skill-summary.json

# normalize durable-workflow run summaries
cautilus scenario normalize workflow \
  --input ./fixtures/scenario-proposals/workflow-input.json

# assemble a proposal-input packet from split normalized source files
cautilus scenario prepare-input \
  --candidates ./fixtures/scenario-proposals/candidates.json \
  --registry ./fixtures/scenario-proposals/registry.json \
  --coverage ./fixtures/scenario-proposals/coverage.json \
  --family fast_regression \
  --window-days 14 \
  --now 2026-04-11T00:00:00.000Z

# generate a scenario proposal packet from normalized input
cautilus scenario propose \
  --input ./fixtures/scenario-proposals/standalone-input.json

# summarize scenario-level cost, token, and duration telemetry
cautilus scenario summarize-telemetry \
  --results ./fixtures/scenario-results/example-results.json
```

Every normalize command plus `cautilus skill evaluate`, `cautilus instruction-surface evaluate`, and `cautilus report build` accepts `--example-input`: it prints a minimal valid packet to stdout that can be piped back into the same command, so operators can inspect the expected shape without clicking into a fixture on GitHub.
`cautilus scenarios --json` now exposes those same inspect commands under `exampleInputCli` for each archetype.
`cautilus scenario propose` now preserves the full ranked `proposals` list in the canonical JSON output.
The same packet also emits an `attentionView`, which is a bounded human-facing shortlist derived from the full ranked set.

## Instruction surface

```bash
# official on-demand self-dogfood wrapper for the repo's own instruction surface
npm run dogfood:self:instruction-surface

# run one checked-in instruction-surface suite through an adapter-owned runner
cautilus instruction-surface test \
  --repo-root . \
  --adapter-name self-dogfood-instruction-surface

# evaluate one normalized instruction-surface packet
cautilus instruction-surface evaluate \
  --input ./fixtures/instruction-surface/input.json \
  --output /tmp/cautilus-instruction-surface-summary.json
```

The npm wrapper is the canonical maintainer-facing self-dogfood path for this repo.
It keeps `instruction-surface` first-class without overloading the root unnamed adapter.

## Skill testing & evaluation

```bash
# run one checked-in local skill test through an adapter-owned runner
cautilus skill test \
  --repo-root . \
  --adapter-name self-dogfood-skill-test

# evaluate one normalized skill packet for trigger accuracy and execution quality
cautilus skill evaluate \
  --input ./fixtures/skill-evaluation/input.json \
  --output /tmp/cautilus-skill-summary.json
```

## Mode evaluation

```bash
# execute one adapter-defined mode directly and emit a report packet
cautilus mode evaluate \
  --repo-root . \
  --mode held_out \
  --intent "Operator-facing behavior should remain legible." \
  --baseline-ref origin/main \
  --output-dir /tmp/cautilus-mode
```

This command answers:
"did the bounded evaluation complete, and if it rejected, was that a clean
behavior regression or a contaminated result?"

Start with `report.json`.
Read `recommendation`, then `modeSummaries[*].status`, then `reasonCodes` and
`warnings`.
`provider_rate_limit_contamination` means persisted artifacts suggest
provider/runtime pressure polluted the result.

## Reports

```bash
# build a machine-readable evaluation report packet from explicit mode runs
cautilus report build --input ./fixtures/reports/report-input.json
```

This command answers:
"what is the first product-owned decision packet for this candidate versus the
baseline?"

## Review

```bash
# assemble a durable review packet around a report
cautilus review prepare-input \
  --repo-root . \
  --report-file /tmp/cautilus-mode/report.json

# build the product-owned meta-prompt packet
cautilus review build-prompt-input \
  --review-packet /tmp/cautilus-mode/review.json

# with output-under-test evidence
cautilus review build-prompt-input \
  --review-packet /tmp/cautilus-mode/review.json \
  --output-under-test /tmp/cautilus-mode/analysis-output.json \
  --output-text-key analysis_text

# build from scenario replay
cautilus review build-prompt-input \
  --repo-root . \
  --adapter-name analysis-prompts \
  --scenario-file .agents/cautilus-scenarios/analysis-prompts/proposals.json \
  --scenario replay-negative-path \
  --output-under-test runs/latest/replay-review.json \
  --output-text-key analysis_text

# render the review prompt
cautilus review render-prompt \
  --input /tmp/cautilus-mode/review-prompt-input.json

# run every executor variant defined by an adapter
cautilus review variants \
  --repo-root /path/to/repo \
  --adapter-name code-quality \
  --workspace /path/to/repo \
  --scenario-file /path/to/scenario.json \
  --scenario replay-negative-path \
  --output-under-test /tmp/cautilus-mode/analysis-output.json \
  --output-text-key analysis_text \
  --output-dir /tmp/cautilus-review
```

If you need a minimal valid report packet before review, run `cautilus report build --example-input`.
That example includes the minimum `humanReviewFindings` shape:
`{ "severity": "concern", "message": "...", "path": "optional" }`.

`review variants` writes a product-owned `review-summary.json` (`cautilus.review_summary.v1`) plus one per-variant `cautilus.review_variant_result.v1` file.
A variant can finish as `passed`, `blocked`, or `failed`; blocked runs carry machine-readable reason codes instead of prose-only abort text.
When `--output-under-test` is present, the generated review prompt switches into `output_under_test` mode and treats the referenced artifact as primary evidence.
When `--output-text-key` is present, Cautilus also extracts that JSON narrative span into the rendered prompt so the judge can read the realized output directly.
This command answers:
"do multiple bounded reviewers agree with the current report, and what concrete
reason codes or warnings survive that second pass?"

## Evidence

```bash
# prepare normalized evidence input
cautilus evidence prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --scenario-results-file /tmp/cautilus-mode/scenario-results.json \
  --run-audit-file /tmp/cautilus-run-audit/summary.json \
  --history-file /tmp/cautilus-history/history.json

# build the evidence bundle
cautilus evidence bundle \
  --input /tmp/cautilus-evidence/input.json
```

This command answers:
"what single packet should I hand to the next decision step when report,
scenario, audit, and history evidence all matter together?"

## Optimization

The bounded one-shot optimizer:

```bash
cautilus optimize prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --review-summary /tmp/cautilus-review/summary.json \
  --history-file /tmp/cautilus-history/history.json \
  --target prompt

cautilus optimize propose \
  --input /tmp/cautilus-optimize/input.json
```

For the GEPA-style bounded prompt search seam layered above that optimizer — multi-generation reflective mutation, held-out reevaluation, frontier selection — see [gepa.md](./gepa.md).

## Self-dogfood rendering

```bash
# refresh the static HTML view of the current checked-in self-dogfood bundle
cautilus self-dogfood render-html

# refresh the static HTML comparison view of the current latest experiments bundle
cautilus self-dogfood render-experiments-html
```

The rendered HTML is read-only over `summary.json`, `report.json`, and `review-summary.json`; those JSON files remain the source of truth.
For the npm wrappers and the full dogfood workflow, see [development.md](./maintainers/development.md).
These renderers answer:
"what should a human reviewer open first if they should inspect the same
decision surface without parsing raw JSON?"

## Plugin manifest validation

```bash
# validate the checked-in Claude marketplace and plugin manifest
claude plugins validate ./.claude-plugin/marketplace.json
claude plugins validate ./plugins/cautilus/.claude-plugin/plugin.json

# verify Codex can discover the repo-local marketplace entry
node ./scripts/release/check-codex-marketplace.mjs --repo-root .
```

## Direct script usage

The underlying Node scripts are runnable directly when a wrapper tool needs to call them without the `cautilus` binary:

```bash
node scripts/resolve_adapter.mjs --repo-root .
node scripts/init_adapter.mjs --repo-root .
node scripts/agent-runtime/run-executor-variants.mjs --workspace . --output-dir /tmp/cautilus-review
node scripts/agent-runtime/build-scenario-proposal-input.mjs --candidates ./fixtures/scenario-proposals/candidates.json --registry ./fixtures/scenario-proposals/registry.json --coverage ./fixtures/scenario-proposals/coverage.json --family fast_regression
node scripts/agent-runtime/generate-scenario-proposals.mjs --input ./fixtures/scenario-proposals/standalone-input.json
node scripts/agent-runtime/build-evidence-input.mjs --report-file /tmp/cautilus-mode/report.json --scenario-results-file ./fixtures/scenario-results/example-results.json
node scripts/agent-runtime/build-evidence-bundle.mjs --input /tmp/cautilus-evidence/input.json
node scripts/agent-runtime/build-optimize-input.mjs --report-file /tmp/cautilus-mode/report.json --target prompt
node scripts/agent-runtime/generate-optimize-proposal.mjs --input /tmp/cautilus-optimize/input.json
node scripts/agent-runtime/summarize-scenario-telemetry.mjs --results ./fixtures/scenario-proposals/results.json
node scripts/agent-runtime/build-report-packet.mjs --input ./fixtures/reports/report-input.json
node scripts/agent-runtime/evaluate-adapter-mode.mjs --repo-root . --mode held_out --intent "Operator-facing behavior should remain legible." --baseline-ref origin/main --output-dir /tmp/cautilus-mode
```
