# Review Packet

`Cautilus` should keep review prompts, schemas, compare questions, and report
artifacts on one durable boundary before executor variants run.

Use `cautilus.review_packet.v1` for that boundary.

## Contents

The packet should include:

- resolved adapter identity
- the `cautilus.report_packet.v1` under review
- referenced `artifact_paths`
- referenced `report_paths`
- adapter `comparison_questions`
- adapter `human_review_prompts`
- default prompt/schema file references when the adapter declares them

The point is not to inline every artifact body.
The point is to give the repo one stable machine-readable object that tells a
review prompt builder or executor wrapper what evidence exists and where it
lives.

## Current Use

The first standalone surface is:

```bash
node ./bin/cautilus review prepare-input \
  --repo-root . \
  --report-file /tmp/cautilus-mode/report.json
```

This packet is the intended bridge between:

- adapter-driven mode execution
- compare/report artifacts
- product-owned meta-prompt rendering for bounded review variants

## Guardrails

- Keep artifact discovery adapter-driven and explicit.
- Do not scrape arbitrary repo files outside `artifact_paths` and `report_paths`
  in this product-owned layer.
- Keep domain-specific prompt authoring consumer-owned even when packet
  assembly and meta-prompt framing are product-owned.
