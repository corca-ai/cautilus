# Consumer Readiness

This note is an evidence appendix.
It records the current dogfood and external-consumer proof for `Cautilus`, but
it is not the canonical product vocabulary.
Product-facing docs should describe repo-agnostic surfaces such as `chatbot`,
`skill`, `workflow`, and `agent runtime` first, then point here for checked-in
evidence shapes and proof expectations.

This note intentionally groups evidence by consumer archetype rather than by
specific private repo name.

## Snapshot

The checks below describe the current readiness split as of 2026-04-13 UTC.

## Cautilus

Current role: product repo self-consumer

Evidence:

- `cautilus doctor --repo-root /path/to/cautilus` returns `ready`
- checked-in root adapter:
  [.agents/cautilus-adapter.yaml](../.agents/cautilus-adapter.yaml)
- checked-in named adapter:
  [.agents/cautilus-adapters/self-dogfood.yaml](../.agents/cautilus-adapters/self-dogfood.yaml)
- explicit self-dogfood command:
  `npm run dogfood:self`
- explicit tuning command:
  `npm run dogfood:self:experiments`

What this means:

- `cautilus` satisfies its own official adapter discovery contract.
- The repo keeps cheap deterministic proof in the root adapter and one
  explicit LLM-backed self-dogfood path in a named adapter.
- Stronger binary or bundled-skill claims stay in named experiment adapters
  instead of being smuggled into the canonical latest report.

## Chatbot Consumer

Current role: external conversational consumer archetype

Evidence:

- `chatbot` normalization has a checked-in consumer-shaped fixture:
  [fixtures/scenario-proposals/samples/chatbot-consumer-input.json](../fixtures/scenario-proposals/samples/chatbot-consumer-input.json)
- the checked-in consumer fixture feeds the normalization helper and proposal
  chain without host-specific rewriting
- the external proof bar remains:
  `cautilus doctor --repo-root <chatbot-consumer-path>` returns `ready`

What this means:

- `Cautilus` has a reusable `chatbot` normalization contract that does not
  require one named repo's storage ownership.
- The product claim is about the archetype, not about one privileged chatbot
  host repo.

## Skill-Validation Consumer

Current role: external skill and validation archetype

Evidence:

- `skill` normalization has a checked-in validation-shaped fixture:
  [fixtures/scenario-proposals/samples/skill-validation-input.json](../fixtures/scenario-proposals/samples/skill-validation-input.json)
- the checked-in consumer fixture produces stable validation-regression
  candidates
- the external proof bar remains:
  `cautilus doctor --repo-root <skill-consumer-path>` returns `ready`

What this means:

- `Cautilus` can normalize public-skill, profile, and validation drift without
  binding the product to one named repo's layout.

## Workflow Consumer

Current role: external durable-workflow archetype

Evidence:

- `workflow` normalization owns a checked-in durable-workflow fixture:
  [fixtures/scenario-proposals/samples/workflow-recovery-input.json](../fixtures/scenario-proposals/samples/workflow-recovery-input.json).
  Routed through `cautilus scenario normalize workflow` per the
  [archetype boundary spec](./specs/archetype-boundary.spec.md).
- `mode evaluate`, `review variants`, and comparison flows are all exercised
  in-tree against workflow-shaped packets and adapters
- the external proof bar remains:
  - `cautilus doctor --repo-root <workflow-consumer-path>` returns `ready`
  - one deep path such as `mode evaluate` or `review variants` passes against
    that consumer before release

What this means:

- The durable-workflow claim is about a reusable archetype, not about one
  named repo becoming part of the product definition.

## Product Positioning

Right now the honest product stance is:

- `cautilus` is the product repo self-consumer and explicit self-dogfood target
- `chatbot consumer` is the primary conversational reference archetype
- `skill-validation consumer` is the primary validation reference archetype
- `workflow consumer` is the primary durable-workflow reference archetype

This split is acceptable.
It keeps one official adapter contract while still grounding the normalization
layer in multiple checked-in consumer shapes.

## Near-Term Implications

1. Keep proving the deepest binary and bundled-skill behavior against
   `cautilus` itself.
2. Keep checked-in consumer-shaped normalized packet examples for the chatbot,
   skill-validation, and durable-workflow archetypes.
3. Treat external consumer proof as archetype validation, not as named-repo
   product ownership.
4. If a stronger claim needs one real external consumer, record that proof as
   an appendix update without turning the named repo into canonical vocabulary.
