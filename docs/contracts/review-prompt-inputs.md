# Review Prompt Inputs

`Cautilus` owns a generic meta-prompt layer above
`cautilus.review_packet.v1`.

Use `cautilus.review_prompt_inputs.v1` for the packet that turns durable review
evidence into a portable prompt-rendering input.

## Contents

The packet should include:

- repo and adapter identity
- candidate, baseline, and evaluation intent
- the shared `cautilus.behavior_intent.v1`
- the automated recommendation from the report packet
- the current report file and compact command observations from the current run
- mode summaries, including compare-artifact and scenario-telemetry summaries
- adapter `comparison_questions`
- adapter `human_review_prompts`
- referenced artifact/report files
- optional `scenarioContext` for one-scenario direct output review
- `reviewMode`
  - `prompt_under_test`
  - `output_under_test`
- optional explicit `outputUnderTestFile`
- optional `outputUnderTestText`
  - extracted with `--output-text-key <dot.path>` when the narrative span lives
    inside a JSON artifact
- optional default prompt/schema file references
- product-owned meta-prompt objective and instructions

The consumer still owns:

- adapter-specific questions
- prompt addenda checked into the host repo
- output schemas and policy language

`Cautilus` owns the generic framing that says how an independent reviewer
should interpret those inputs.

## Current Use

Build the packet:

```bash
cautilus review build-prompt-input \
  --review-packet /tmp/cautilus-mode/review.json
```

Build the packet for a realized output artifact instead of prompt text:

```bash
cautilus review build-prompt-input \
  --review-packet /tmp/cautilus-mode/review.json \
  --output-under-test /tmp/cautilus-mode/analysis-output.json \
  --output-text-key analysis_text
```

Build the packet directly from one scenario plus one realized output artifact:

```bash
cautilus review build-prompt-input \
  --repo-root . \
  --adapter-name analysis-prompts \
  --scenario-file .agents/cautilus-scenarios/analysis-prompts/proposals.json \
  --scenario replay-negative-path \
  --output-under-test runs/latest/replay-review.json \
  --output-text-key analysis_text
```

Render the prompt:

```bash
cautilus review render-prompt \
  --input /tmp/cautilus-mode/review-prompt-input.json
```

## Guardrails

- Keep the meta-prompt product-owned and generic.
- Keep domain-specific instructions adapter-owned.
- Do not inline arbitrary repo files into the packet.
- Prefer explicit file references over hidden prompt assembly.
- When judging realized behavior, prefer `--output-under-test` over baking the
  artifact path into adapter prose.
- When the realized output is a larger JSON artifact, prefer `--output-text-key`
  so the judge sees the narrative span directly instead of inferring it from a
  file path alone.
