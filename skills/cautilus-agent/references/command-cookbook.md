# Command Cookbook

Concrete invocations for the step-8 scenario-propose workflow in `SKILL.md` §
Workflow. Reach for this reference after the core workflow step has told you
what to do; each subsection below maps to one contract already detailed under
`skills/cautilus-agent/references/`.

Prefer `discover scenarios propose` as the default entry after inventorying the
LLM-behavior surfaces (see `bootstrap-inventory.md`). Use it to turn the
normalized evidence into bounded scenarios before widening adapter YAML by
hand.

## Eval test / evaluate observation

```bash
cautilus evaluate fixture \
  --repo-root . \
  --fixture fixtures/eval/app/prompt/cautilus-tagline.fixture.json \
  --output-dir /tmp/cautilus-eval

cautilus evaluate observation \
  --input /tmp/cautilus-eval/eval-observed.json \
  --output /tmp/cautilus-eval-summary.json
```

Prefer `evaluate fixture` when the repo already has a checked-in `cautilus.evaluation_input.v1` fixture plus adapter-owned runner.
The currently shipped presets are `dev / repo`, `dev / skill`, `app / chat`, and `app / prompt`.
Fall back to `evaluate observation` when the host already produced a normalized observed packet and only needs the product summary/recommendation layer.

## Scenario normalize / prepare / propose / conversation review / telemetry

```bash
cautilus discover scenarios normalize chatbot \
  --input ./fixtures/scenario-proposals/chatbot-input.json

cautilus discover scenarios normalize skill \
  --input /tmp/cautilus-skill-summary.json

cautilus discover scenarios prepare-input \
  --candidates ./fixtures/scenario-proposals/candidates.json \
  --registry ./fixtures/scenario-proposals/registry.json \
  --coverage ./fixtures/scenario-proposals/coverage.json \
  --family fast_regression

cautilus discover scenarios propose \
  --input ./fixtures/scenario-proposals/standalone-input.json

cautilus discover scenarios review-conversations \
  --input ./fixtures/scenario-conversation-review/input.json

cautilus discover scenarios render-conversation-review-html \
  --input /tmp/cautilus-scenario-review/conversation-review.json

cautilus discover scenarios summarize-telemetry \
  --results ./fixtures/scenario-proposals/results.json
```

## Report build

```bash
cautilus evaluate report build \
  --input ./fixtures/reports/report-input.json
```

## Eval test with active run

```bash
# --output-dir is optional when cautilus init run has already pinned
# CAUTILUS_RUN_DIR. Pass it explicitly only when you need to override the
# active run (for example, inside a self-dogfood script that mints its own
# curated bundle path).
cautilus evaluate fixture \
  --repo-root . \
  --fixture fixtures/eval/dev/repo/checked-in-agents-routing.fixture.json \
  --output-dir /tmp/cautilus-mode
```

## Review prepare-input / build-prompt-input / render-prompt

```bash
cautilus evaluate review prepare-input \
  --repo-root . \
  --report-file /tmp/cautilus-mode/report.json

cautilus evaluate review build-prompt-input \
  --review-packet /tmp/cautilus-mode/review.json

cautilus evaluate review build-prompt-input \
  --review-packet /tmp/cautilus-mode/review.json \
  --output-under-test /tmp/cautilus-mode/analysis-output.json \
  --output-text-key analysis_text

cautilus evaluate review build-prompt-input \
  --repo-root . \
  --adapter-name analysis-prompts \
  --scenario-file .agents/cautilus-scenarios/analysis-prompts/proposals.json \
  --scenario replay-negative-path \
  --output-under-test /tmp/cautilus-mode/replay-review.json \
  --output-text-key analysis_text

cautilus evaluate review render-prompt \
  --input /tmp/cautilus-mode/review-prompt-input.json
```

## Evidence prepare-input / bundle

```bash
cautilus evaluate evidence prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --scenario-results-file /tmp/cautilus-mode/held_out-scenario-results.json \
  --run-audit-file /tmp/cautilus-run-audit/run-audit-summary.json \
  --history-file /tmp/cautilus-history/scenario-history.snapshot.json

cautilus evaluate evidence bundle \
  --input /tmp/cautilus-evidence/input.json
```

## Improve prepare-input / search / propose / build-artifact

```bash
cautilus improve prepare-input \
  --report-file /tmp/cautilus-mode/report.json \
  --review-summary /tmp/cautilus-review/review-summary.json \
  --history-file /tmp/cautilus-history/scenario-history.snapshot.json \
  --target prompt \
  --budget medium

cautilus improve search prepare-input \
  --improve-input /tmp/cautilus-improve/input.json \
  --held-out-results-file /tmp/cautilus-mode/held_out-scenario-results.json \
  --target-file ./prompts/system.md \
  --budget light

cautilus improve search run \
  --input /tmp/cautilus-improve/search-input.json \
  --json

cautilus improve propose \
  --input /tmp/cautilus-improve/input.json

cautilus improve propose \
  --from-search /tmp/cautilus-improve/search-result.json

cautilus improve build-artifact \
  --proposal-file /tmp/cautilus-improve/proposal.json
```

## Review variants

```bash
cautilus evaluate review variants \
  --repo-root . \
  --workspace . \
  --report-file /tmp/cautilus-mode/report.json \
  --output-under-test /tmp/cautilus-mode/analysis-output.json \
  --output-text-key analysis_text \
  --output-dir /tmp/cautilus-review

cautilus evaluate review variants \
  --repo-root . \
  --adapter-name analysis-prompts \
  --workspace . \
  --scenario-file .agents/cautilus-scenarios/analysis-prompts/proposals.json \
  --scenario replay-negative-path \
  --output-under-test /tmp/cautilus-mode/replay-review.json \
  --output-text-key analysis_text \
  --output-dir /tmp/cautilus-review
```
