# Command Cookbook

Concrete invocations for the step-8 scenario-propose workflow in `SKILL.md` §
Workflow. Reach for this reference after the core workflow step has told you
what to do; each subsection below maps to one contract already detailed under
`skills/cautilus/references/`.

Prefer `scenario propose` as the default entry after inventorying the
LLM-behavior surfaces (see `bootstrap-inventory.md`). Use it to turn the
normalized evidence into bounded scenarios before widening adapter YAML by
hand.

## Skill test / skill evaluate

```bash
cautilus skill test \
  --repo-root . \
  --adapter-name self-dogfood-skill-test

cautilus skill evaluate \
  --input ./fixtures/skill-evaluation/input.json \
  --output /tmp/cautilus-skill-summary.json
```

Prefer `skill test` when the repo already has a checked-in case suite plus
adapter-owned runner for a local skill. Fall back to `skill evaluate` when the
host already produced a normalized observed packet and only needs the product
summary/recommendation layer.

## Scenario normalize / prepare / propose / conversation review / telemetry

```bash
cautilus scenario normalize chatbot \
  --input ./fixtures/scenario-proposals/chatbot-input.json

cautilus scenario normalize skill \
  --input /tmp/cautilus-skill-summary.json

cautilus scenario prepare-input \
  --candidates ./fixtures/scenario-proposals/candidates.json \
  --registry ./fixtures/scenario-proposals/registry.json \
  --coverage ./fixtures/scenario-proposals/coverage.json \
  --family fast_regression

cautilus scenario propose \
  --input ./fixtures/scenario-proposals/standalone-input.json

cautilus scenario review-conversations \
  --input ./fixtures/scenario-conversation-review/input.json

cautilus scenario render-conversation-review-html \
  --input /tmp/cautilus-scenario-review/conversation-review.json

cautilus scenario summarize-telemetry \
  --results ./fixtures/scenario-proposals/results.json
```

## Report build

```bash
cautilus report build \
  --input ./fixtures/reports/report-input.json
```

## Mode evaluate

```bash
# --output-dir is optional when cautilus workspace start has already pinned
# CAUTILUS_RUN_DIR. Pass it explicitly only when you need to override the
# active run (for example, inside a self-dogfood script that mints its own
# curated bundle path).
cautilus mode evaluate \
  --repo-root . \
  --mode held_out \
  --intent "Operator-facing behavior should remain legible." \
  --baseline-ref origin/main \
  --output-dir /tmp/cautilus-mode
```

## Review prepare-input / build-prompt-input / render-prompt

```bash
cautilus review prepare-input \
  --repo-root . \
  --report-file /tmp/cautilus-mode/report.json

cautilus review build-prompt-input \
  --review-packet /tmp/cautilus-mode/review.json

cautilus review build-prompt-input \
  --review-packet /tmp/cautilus-mode/review.json \
  --output-under-test /tmp/cautilus-mode/analysis-output.json \
  --output-text-key analysis_text

cautilus review build-prompt-input \
  --repo-root . \
  --adapter-name analysis-prompts \
  --scenario-file .agents/cautilus-scenarios/analysis-prompts/proposals.json \
  --scenario replay-negative-path \
  --output-under-test /tmp/cautilus-mode/replay-review.json \
  --output-text-key analysis_text

cautilus review render-prompt \
  --input /tmp/cautilus-mode/review-prompt-input.json
```

## Evidence prepare-input / bundle

```bash
cautilus evidence prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --scenario-results-file /tmp/cautilus-mode/held_out-scenario-results.json \
  --run-audit-file /tmp/cautilus-run-audit/run-audit-summary.json \
  --history-file /tmp/cautilus-history/scenario-history.snapshot.json

cautilus evidence bundle \
  --input /tmp/cautilus-evidence/input.json
```

## Optimize prepare-input / search / propose / build-artifact

```bash
cautilus optimize prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --review-summary /tmp/cautilus-review/review-summary.json \
  --history-file /tmp/cautilus-history/scenario-history.snapshot.json \
  --target prompt \
  --budget medium

cautilus optimize search prepare-input \
  --optimize-input /tmp/cautilus-optimize/input.json \
  --held-out-results-file /tmp/cautilus-mode/held_out-scenario-results.json \
  --target-file ./prompts/system.md \
  --budget light

cautilus optimize search run \
  --input /tmp/cautilus-optimize/search-input.json \
  --json

cautilus optimize propose \
  --input /tmp/cautilus-optimize/input.json

cautilus optimize propose \
  --from-search /tmp/cautilus-optimize/search-result.json

cautilus optimize build-artifact \
  --proposal-file /tmp/cautilus-optimize/proposal.json
```

## Review variants

```bash
cautilus review variants \
  --repo-root . \
  --workspace . \
  --report-file /tmp/cautilus-mode/report.json \
  --output-under-test /tmp/cautilus-mode/analysis-output.json \
  --output-text-key analysis_text \
  --output-dir /tmp/cautilus-review

cautilus review variants \
  --repo-root . \
  --adapter-name analysis-prompts \
  --workspace . \
  --scenario-file .agents/cautilus-scenarios/analysis-prompts/proposals.json \
  --scenario replay-negative-path \
  --output-under-test /tmp/cautilus-mode/replay-review.json \
  --output-text-key analysis_text \
  --output-dir /tmp/cautilus-review
```
