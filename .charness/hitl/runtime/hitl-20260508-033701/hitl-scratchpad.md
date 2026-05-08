# HITL Scratchpad: hitl-20260508-033701

- Updated: 2026-05-08T03:37:01+00:00
- Target: docs/specs/user/claim-discovery.spec.md
- Base Ref: main
- Scope: claim-discovery-spec-post-rewrite-from-start
- Apply Mode: explicit-after-all-chunks

## Agreements

- Review target is `docs/specs/user/claim-discovery.spec.md`, starting from the top after commit `b59980d`.
- This HITL is for spec/document judgment, not approval to execute the prepared Cautilus eval.
- Apply mode remains explicit after all chunks; do not edit the target document mid-review.
- Review criteria carried into this run: product value should be visible to a user, vocabulary should stay shared across user/agent/binary where possible, discovery should read as high-recall binary extraction plus bundled-skill curation, in-scope missed declarations are `claim discover` bugs, out-of-scope latent behavior is narrative/catalog/alignment work, and prepared eval evidence must not be presented as executed proof.
- Opening chunk feedback: the first sentence should make the user value more obvious, not only list product actions.
- Opening chunk feedback: explain the two-pass workflow with bullets. Pass 1 should say the binary intentionally allows false positives in order not to miss source-declared promises inside the scan boundary, rather than relying only on "prefers recall".
- Opening chunk feedback: avoid saying "the packet" before the packet has been introduced clearly. Pass 2 should explain curation as work on the discovered candidate list: reduce false positives, compare against docs/code, look for missing public promises, and ask whether missing promises are intentional or under-documented.
- Opening chunk feedback: restore the earlier bullet detail for proof routes: deterministic tests, Cautilus behavior evaluation, and human decision, with examples for each.
- Opening chunk feedback: add a problem-definition sentence before the current value sentence. Pattern should apply across user stories: each repo makes promises to users and maintainers in docs, but the evidence usually has to be found manually.
- Opening chunk feedback: use `bundled Cautilus skill` / `bundled cautilus skill` language for now instead of prematurely renaming the skill inside this doc. A skill rename such as `cautilus-ops` would be a product-wide naming decision, not a local prose tweak.
- Product naming issue raised by user: if `cautilus` is ambiguous between the binary and the bundled skill, that likely signals a real concept-boundary problem rather than only a wording problem. This HITL may need to preserve or surface a broader naming decision for the bundled skill.

## Open Questions
