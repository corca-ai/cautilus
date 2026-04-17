# Ceal Consumer Promotion Follow-Up

This note is the product-side companion to the consumer experiment brief that
lives in the closed-source `Ceal` repo.

`Ceal` is allowed to depend on `Cautilus`.
`Cautilus` must not gain an explicit dependency back on `Ceal`.

That means `Cautilus` should record only what to inspect after the consumer
experiment and what kind of generic product work to do next.
The consumer-side instructions, private prompts, repo paths, and runtime setup
belong in `Ceal`, not here.

## What To Look For

When the `Ceal` experiment returns, inspect only the redacted, genericizable
parts of the handoff.

Expected return items:

- one `chatbot` candidate summary
- one `workflow` candidate summary
- one redacted JSON draft for a `chatbot` packet
- one redacted JSON draft for a `workflow` packet
- one promotion judgment per candidate
- optional notes about missing contract fields or missing product-owned
  telemetry

If the returned material still depends on `Ceal`-specific naming, prompt text,
or private policy, stop and reduce it further before promoting anything into
the product.

## Promotion Questions

For each returned candidate, answer these questions before making a product
change.

1. Does it map cleanly onto exactly one first-class `Cautilus` archetype?
2. Can it be represented honestly with current product-owned packet fields?
3. Would another consumer understand the scenario without knowing anything
   about `Ceal`?
4. Is the scenario small enough to maintain as a checked-in fixture or test?
5. Does the scenario improve rollout evidence, normalization quality, or
   operator-facing evaluation guidance instead of only preserving a Ceal-local
   anecdote?

If any answer is no, do not promote the artifact as-is.
Either reduce it further or treat it as consumer-only evidence.

## Allowed Product Outcomes

If the candidate clears the bar, `Cautilus` may promote it in one of these
forms:

- a checked-in generic fixture
- a contract clarification
- a new or expanded executable test
- a runner or packet-preparation improvement
- a product-owned telemetry field or evidence seam improvement

The promoted form should match the smallest honest product surface that captures
the learned behavior.

## Disallowed Product Outcomes

Do not land any of these in `Cautilus`:

- `Ceal` repo paths
- `Ceal` adapter ids
- `Ceal` prompt fragments
- `Ceal` policy text
- consumer-specific naming that another repo would not understand
- private business context or user identifiers

If a candidate cannot survive those removals, it is not product surface.

## Expected Follow-Up Work

After a good consumer experiment, the next `Cautilus` move should usually be:

1. rewrite the returned packet into a generic fixture
2. add or update the smallest test or contract that proves the behavior
3. connect that fixture to the relevant archetype workflow
4. document any new rollout-facing evidence question the artifact now answers

The product should prefer small, generic promotions over preserving a detailed
consumer story.
