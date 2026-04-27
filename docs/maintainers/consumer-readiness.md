# Consumer Readiness

This note is an evidence appendix.
It records the current dogfood and external-consumer proof for `Cautilus`, but it is not the canonical product vocabulary.
Product-facing docs should describe repo-agnostic surfaces such as `chatbot`, `skill`, `workflow`, and `agent runtime` first, then point here for checked-in evidence shapes and proof expectations.

This note intentionally groups evidence by consumer archetype rather than by specific private repo name.

## Snapshot

The checks below describe the current readiness split as of 2026-04-20 UTC.

## Cautilus

Current role: product repo self-consumer

Evidence:

- `cautilus doctor --repo-root /path/to/cautilus` returns `ready`
- checked-in root adapter: [.agents/cautilus-adapter.yaml](../../.agents/cautilus-adapter.yaml)
- checked-in named adapter: [.agents/cautilus-adapters/self-dogfood.yaml](../../.agents/cautilus-adapters/self-dogfood.yaml)
- explicit self-dogfood command: `npm run dogfood:self`
- explicit `dev / repo` self-dogfood command: `npm run dogfood:self:eval`
- prior tuning-experiment path: retired until it is rebuilt on the current `cautilus eval` surfaces

What this means:

- `cautilus` satisfies its own official adapter discovery contract.
- The repo keeps cheap deterministic proof in the root adapter and explicit LLM-backed self-dogfood paths in named adapters.
- Stronger binary or bundled-skill claims should come back as explicit eval presets, fixture series, or named adapters instead of being smuggled into the canonical latest eval summary.

## Chatbot Consumer

Current role: external conversational consumer archetype

Evidence:

- `chatbot` normalization has a checked-in consumer-shaped fixture: [fixtures/scenario-proposals/samples/chatbot-consumer-input.json](../../fixtures/scenario-proposals/samples/chatbot-consumer-input.json)
- the checked-in consumer fixture feeds the normalization helper and proposal chain without host-specific rewriting
- the external proof bar remains: `cautilus doctor --repo-root <chatbot-consumer-path>` returns `ready`

What this means:

- `Cautilus` has a reusable `chatbot` normalization contract that does not require one named repo's storage ownership.
- The product claim is about the archetype, not about one privileged chatbot host repo.

## Skill-Validation Consumer

Current role: external skill and validation archetype

Evidence:

- `skill` normalization has a checked-in validation-shaped fixture: [fixtures/scenario-proposals/samples/skill-validation-input.json](../../fixtures/scenario-proposals/samples/skill-validation-input.json)
- the checked-in consumer fixture produces stable validation-regression candidates
- the external proof bar remains: `cautilus doctor --repo-root <skill-consumer-path>` returns `ready`

What this means:

- `Cautilus` can normalize public-skill, profile, and validation drift without binding the product to one named repo's layout.

## Workflow Consumer

Current role: external durable-workflow archetype

Evidence:

- `workflow` normalization owns a checked-in durable-workflow fixture: [fixtures/scenario-proposals/samples/workflow-recovery-input.json](../../fixtures/scenario-proposals/samples/workflow-recovery-input.json).
  Routed through `cautilus scenario normalize workflow`; the proposal-input lineage stays in this surface even though the legacy archetype boundary was retired (see [evaluation-surfaces.spec.md](../specs/evaluation-surfaces.spec.md)).
- `eval test`, `review variants`, and comparison flows are all exercised in-tree against workflow-shaped packets and adapters
- the external proof bar remains:
  - `cautilus doctor --repo-root <workflow-consumer-path>` returns `ready`
  - one deep path such as `eval test` or `review variants` passes against that consumer before release
- one real external workflow-style consumer run now exists in internal research:
  it reached `doctor ready`, completed `eval test`, and completed `review variants` with an explicit schema-file override.
  The value of that run was twofold:
  it exposed repairable consumer-readiness gaps, and after those were fixed it produced an honest rejection rather than a false positive.
  The report surface is now also expected to distinguish a clean behavior regression from provider-contaminated evidence when persisted artifacts carry signatures such as repeated rate limits.

What this means:

- The durable-workflow claim is about a reusable archetype, not about one named repo becoming part of the product definition.

## Agent-Runtime Consumer

Current role: external bootstrap-heavy agent-runtime archetype

Evidence:

- one real external bootstrap-heavy consumer validated the released `instruction-surface` split on `Cautilus v0.5.5` (now folded into the `dev / repo` preset under `cautilus eval`).
- the consumer seam now exercises `cautilus eval test --repo-root .` (formerly `cautilus instruction-surface test`) against a routing case that expects `bootstrapHelper=find-skills` and `workSkill=impl`
- the same consumer keeps its standing repo-owned evaluator path green on the released binary:
  `python3 scripts/run-evals.py --repo-root .` passed its maintained scenario set and `pytest tests/test_cautilus_scenarios.py` stayed green
- the checked validation artifact records `recommendation=accept-now` plus explicit `bootstrapHelperCounts` / `workSkillCounts` output instead of the older collapsed single-lane interpretation
- the same consumer deliberately kept `premortem` outside standing evaluator-required coverage and treated it as on-demand / HITL-backed proof, so the split validation did not depend on widening that policy-heavy seam

What this means:

- `Cautilus` now has one external proof that a bootstrap-heavy agent-runtime consumer can adopt the released `bootstrapHelper` / `workSkill` contract without false mismatches.
- The product does not need to promote every policy-heavy routing seam into standing evaluator coverage just to validate the bootstrap-versus-work split honestly.
- The remaining onboarding question is no longer "does the released split work in a real consumer?" but "does a fresh consumer reach the first meaningful bounded run quickly enough after `doctor ready`?"

## Product Positioning

Right now the honest product stance is:

- `cautilus` is the product repo self-consumer and explicit self-dogfood target
- `chatbot consumer` is the primary conversational reference archetype
- `skill-validation consumer` is the primary validation reference archetype
- `workflow consumer` is the primary durable-workflow reference archetype
- `agent-runtime consumer` is the current bootstrap-heavy routing reference archetype

This split is acceptable.
It keeps one official adapter contract while still grounding the normalization layer in multiple checked-in consumer shapes.

## Near-Term Implications

1. Keep proving the deepest binary and bundled-skill behavior against `cautilus` itself.
2. Keep checked-in consumer-shaped normalized packet examples for the chatbot, skill-validation, and durable-workflow archetypes.
3. Keep one explicit external bootstrap-heavy consumer proof for the `dev / repo` preset, but treat it as archetype validation rather than named-repo product ownership.
4. Treat the next external-consumer question as whether the first bounded run should expand beyond `eval test` into the first review loop, not as whether `bootstrapHelper` / `workSkill` works at all.
5. If a stronger claim needs one real external consumer, record that proof as an appendix update without turning the named repo into canonical vocabulary.
6. Keep the current product-owned onboarding smoke honest: today it proves fresh-consumer install to `doctor ready` and one completed bounded `eval test` run; the next proof question is whether that smoke should also reach `review prepare-input` without turning the helper into a consumer-specific workflow.
