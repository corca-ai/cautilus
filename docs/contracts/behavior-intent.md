# Behavior Intent

`Cautilus` should keep one small behavior-intent contract above raw prompt or
adapter mechanics.

Use `cautilus.behavior_intent.v1` for that object.

The point is not to freeze one prompt verbatim.
The point is to make the evaluated behavior explicit enough that `report`,
`review`, `optimize`, and `revision artifact` packets can point at the same
intent without re-deriving it from prose.

## Contents

The object should include:

- `intentId`: a stable packet-local identifier for the behavior being judged
- `summary`: one short human-readable statement of the behavior intent
- `behaviorSurface`: the product-owned surface under evaluation
  for example `operator_cli`, `review_variant_workflow`, or `skill_validation`
- `successDimensions`: the primary ways the candidate should get better
- `guardrailDimensions`: the primary ways the candidate must not get worse

Each dimension should stay small:

- `id`
- `summary`

## Current Slice

This slice keeps the contract intentionally thin.

- `report` materializes the intent profile once from explicit inputs
- `review` reuses that same object when building the meta-prompt packet
- `optimize` copies the same object into the bounded revision packet and may
  add default guardrails from optimization constraints when none were declared
- `revision artifact` carries the same object forward so the next operator can
  see what behavior the bounded revision is trying to repair
- `scenario proposal` may now carry the same object when a normalization helper
  or host packet already knows the intended behavior behind a reusable scenario

## Ownership

Two acquisition modes are allowed in the current product.

### Host-Declared Profile

The host or normalization helper provides an explicit `intentProfile`.

Use this when the behavior surface or success dimensions are already known in a
stable operator-facing form.

### Default-Derived Profile

The product derives a minimal profile from a plain `intent` string.

Current derivation rules stay conservative:

- `intentId` is slug-derived from the summary
- `summary` copies the explicit intent text
- `behaviorSurface` falls back to one product-owned default for the seam
- `successDimensions` falls back to one dimension that matches the summary
- `guardrailDimensions` stay empty unless the seam has explicit product-owned
  defaults, such as optimize objective constraints

## Guardrails

- Do not turn the behavior-intent object into a prompt-programming runtime.
- Do not require host repos to encode policy-specific ontologies before they
  can use the product.
- Prefer one explicit summary plus a few durable dimensions over deep nested
  schemas.
- Keep consumer prompts, adapters, policy, and scenario fixtures consumer-owned.
