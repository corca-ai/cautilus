---
name: cautilus
description: "Use when intentful behavior evaluation itself is the task and the repo should run Cautilus's checked-in workflow instead of reconstructing compare, held-out, and review commands by hand."
---

# Cautilus

Use this bundled skill when intentful behavior evaluation itself is the task
and the repo wants to run the checked-in `Cautilus` workflow instead of
rebuilding commands by hand.

`Cautilus` should stay usable as a standalone product:

- resolve or scaffold repo-local adapters
- run bounded review variants through the bundled CLI
- evaluate operator-facing behavior, including CLI surfaces, with explicit
  intent packets
- keep held-out evaluation and review prompts explicit
- keep host-repo fixtures, prompts, and policy outside the product boundary

## Bootstrap

1. Resolve the adapter from the target repo:

```bash
node ./bin/cautilus adapter resolve --repo-root .
```

For a named adapter:

```bash
node ./bin/cautilus adapter resolve --repo-root . --adapter-name code-quality
```

2. If the repo does not have an adapter yet, scaffold one:

```bash
node ./bin/cautilus adapter init --repo-root .
```

3. Check whether the repo is already ready for standalone `Cautilus` use:

```bash
node ./bin/cautilus doctor --repo-root .
```

4. Read the canonical workflow and contracts before widening the surface:

- [docs/workflow.md](/home/ubuntu/cautilus/docs/workflow.md)
- [docs/contracts/adapter-contract.md](/home/ubuntu/cautilus/docs/contracts/adapter-contract.md)
- [docs/contracts/reporting.md](/home/ubuntu/cautilus/docs/contracts/reporting.md)
- [docs/contracts/scenario-proposal-sources.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-sources.md)
- [docs/contracts/scenario-proposal-inputs.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-inputs.md)
- [docs/contracts/scenario-proposal-normalization.md](/home/ubuntu/cautilus/docs/contracts/scenario-proposal-normalization.md)
- [docs/contracts/chatbot-normalization.md](/home/ubuntu/cautilus/docs/contracts/chatbot-normalization.md)
- [docs/contracts/cli-normalization.md](/home/ubuntu/cautilus/docs/contracts/cli-normalization.md)
- [docs/contracts/skill-normalization.md](/home/ubuntu/cautilus/docs/contracts/skill-normalization.md)
- [docs/contracts/cli-evaluation.md](/home/ubuntu/cautilus/docs/contracts/cli-evaluation.md)
- [docs/contracts/review-packet.md](/home/ubuntu/cautilus/docs/contracts/review-packet.md)
- [docs/contracts/review-prompt-inputs.md](/home/ubuntu/cautilus/docs/contracts/review-prompt-inputs.md)
- [docs/contracts/evidence-bundle.md](/home/ubuntu/cautilus/docs/contracts/evidence-bundle.md)
- [docs/contracts/optimization.md](/home/ubuntu/cautilus/docs/contracts/optimization.md)
- [docs/contracts/revision-artifact.md](/home/ubuntu/cautilus/docs/contracts/revision-artifact.md)

## Workflow

1. Resolve the adapter and restate the candidate, baseline, and intended
   decision.
2. When the run needs clean git-ref A/B workspaces, prepare them with the
   product-owned helper:

```bash
node ./bin/cautilus workspace prepare-compare \
  --repo-root . \
  --baseline-ref origin/main \
  --output-dir /tmp/cautilus-compare
```

3. If the repo keeps one artifact root with one subdirectory per run, prune
   older Cautilus bundles instead of letting logs and compare workspaces grow
   forever:

```bash
node ./bin/cautilus workspace prune-artifacts \
  --root /tmp/cautilus-runs \
  --keep-last 20
```

4. Run adapter-defined preflight commands before long evaluations.
5. Use iterate mode for tuning, held-out mode for validation, and full gate for
   ship decisions.
6. When the adapter defines `executor_variants`, run the checked-in review
   runner instead of retyping ad-hoc shell commands:

```bash
node ./bin/cautilus review variants \
  --repo-root . \
  --workspace . \
  --output-dir /tmp/cautilus-review
```

When the target repo is `Cautilus` itself, prefer the checked-in explicit
self-dogfood command over rebuilding the same mode/report/review chain by hand:

```bash
npm run dogfood:self
```

When the job is tuning the self-dogfood review budget or comparing review
surfaces, use the checked-in experiment runner instead of inventing ad hoc
A/B loops:

```bash
npm run dogfood:self:experiments
```

7. Report exact commands, exact placeholder values, and the final recommendation.
8. When the repo already has normalized scenario proposal candidates, generate
   a checked-in proposal packet instead of hand-drafting scenario JSON:

```bash
node ./bin/cautilus scenario normalize chatbot \
  --input ./fixtures/scenario-proposals/chatbot-input.json

node ./bin/cautilus scenario normalize cli \
  --input ./fixtures/scenario-proposals/cli-input.json

node ./bin/cautilus scenario normalize skill \
  --input ./fixtures/scenario-proposals/skill-input.json

node ./bin/cautilus scenario prepare-input \
  --candidates ./fixtures/scenario-proposals/candidates.json \
  --registry ./fixtures/scenario-proposals/registry.json \
  --coverage ./fixtures/scenario-proposals/coverage.json \
  --family fast_regression

node ./bin/cautilus scenario propose \
  --input ./fixtures/scenario-proposals/standalone-input.json

node ./bin/cautilus scenario summarize-telemetry \
  --results ./fixtures/scenario-proposals/results.json

node ./bin/cautilus report build \
  --input ./fixtures/reports/report-input.json

node ./bin/cautilus mode evaluate \
  --repo-root . \
  --mode held_out \
  --intent "CLI behavior should remain legible." \
  --baseline-ref origin/main \
  --output-dir /tmp/cautilus-mode

node ./bin/cautilus review prepare-input \
  --repo-root . \
  --report-file /tmp/cautilus-mode/report.json

node ./bin/cautilus review build-prompt-input \
  --review-packet /tmp/cautilus-mode/review.json

node ./bin/cautilus review render-prompt \
  --input /tmp/cautilus-mode/review-prompt-input.json

node ./bin/cautilus evidence prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --scenario-results-file /tmp/cautilus-mode/scenario-results.json \
  --run-audit-file /tmp/cautilus-run-audit/summary.json \
  --history-file /tmp/cautilus-history/history.json

node ./bin/cautilus evidence bundle \
  --input /tmp/cautilus-evidence/input.json

node ./bin/cautilus optimize prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --review-summary /tmp/cautilus-review/summary.json \
  --history-file /tmp/cautilus-history/history.json \
  --target prompt \
  --optimizer reflection \
  --budget medium

node ./bin/cautilus optimize propose \
  --input /tmp/cautilus-optimize/input.json

node ./bin/cautilus optimize build-artifact \
  --proposal-file /tmp/cautilus-optimize/proposal.json

node ./bin/cautilus review variants \
  --repo-root . \
  --workspace . \
  --report-file /tmp/cautilus-mode/report.json \
  --output-dir /tmp/cautilus-review

node ./bin/cautilus cli evaluate \
  --input ./fixtures/cli-evaluation/doctor-missing-adapter.json
```

## Guardrails

- Do not treat Ceal-local prompts, adapters, or report paths as product-owned
  defaults.
- Do not turn review loops into open-ended retries.
- Do not turn optimizer output into an open-ended retry loop.
- Keep held-out evaluation held out unless the benchmark itself is being
  changed deliberately.
- Prefer checked-in wrapper scripts and schemas over inline shell quoting.
