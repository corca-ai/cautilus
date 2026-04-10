# Review Prompt Inputs

`Cautilus` owns a generic meta-prompt layer above
`cautilus.review_packet.v1`.

Use `cautilus.review_prompt_inputs.v1` for the packet that turns durable review
evidence into a portable prompt-rendering input.

## Contents

The packet should include:

- repo and adapter identity
- candidate, baseline, and evaluation intent
- the automated recommendation from the report packet
- mode summaries, including compare-artifact and scenario-telemetry summaries
- adapter `comparison_questions`
- adapter `human_review_prompts`
- referenced artifact/report files
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
node ./bin/cautilus review build-prompt-input \
  --review-packet /tmp/cautilus-mode/review.json
```

Render the prompt:

```bash
node ./bin/cautilus review render-prompt \
  --input /tmp/cautilus-mode/review-prompt-input.json
```

## Guardrails

- Keep the meta-prompt product-owned and generic.
- Keep domain-specific instructions adapter-owned.
- Do not inline arbitrary repo files into the packet.
- Prefer explicit file references over hidden prompt assembly.
