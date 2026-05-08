# HITL Scratchpad: hitl-20260507-113728

- Updated: 2026-05-07T11:37:28+00:00
- Target: docs/specs/user/claim-discovery.spec.md
- Base Ref: main
- Scope: claim-discovery-spec-from-start
- Apply Mode: explicit-after-all-chunks

## Agreements

- Review target is the current `docs/specs/user/claim-discovery.spec.md`, starting from the top.
- This is a document HITL, not approval to execute the prepared Cautilus eval.
- Apply mode remains explicit after all chunks; do not edit the target document mid-review.
- Prior accepted concerns still apply: user-facing prose should avoid unexplained internal terms, heuristic evidence should be real and testable, duplicate handling should be visible at sentence level, and prepared skill proof must not be presented as executed evidence.
- Opening chunk improvement lens: use DDD-style ubiquitous language at the intersection of user, agent, and binary concepts. Prefer terms that all three parties can share, such as `candidate`, `source`, `evidence`, `verified`, `next action`, and `agent-run check`; avoid surfacing implementation field names as the primary user vocabulary.
- Opening chunk correction from user: the intended split is three-way proofability: deterministic tests such as unit/e2e, non-deterministic LLM-backed tests through Cautilus, and human-only confirmation when permissions or decisions are mixed in. `scenario design` is unclear in this opening unless it is explained as pre-work for Cautilus evaluation.
- Opening chunk correction from user: `with sources` does not map clearly to "why did this sentence become a candidate"; use `selected source docs` and `source refs` vocabulary.
- Opening chunk correction from user: `prepared agent-run check` is unclear and must be replaced or defined.
- Opening chunk correction from user: `tests, Cautilus evaluation, human decision` may still assume too much at the top of the page. Prefer short bullets with examples: deterministic unit/e2e-style tests, LLM-backed Cautilus behavior evaluation, and human-only confirmation for permission/policy/ownership/product decisions.
- Opening chunk correction from user: the proposed `where it shows up` column mixes input-like concepts (`scan scope`, `source list`) with output-like concepts (`candidate text`, source refs, recommended verification path). The opening should separate selected source docs from produced candidate outputs, or defer examples to the following chunks with a clear pointer.
- Opening chunk correction from user: the last row about skill evaluation/prepared fixture is confusing because it mixes user workflow with maintainer proof. Discovery produces candidates; the bundled skill may curate those candidates; Cautilus eval is the later proof mechanism for checking that skill behavior, not the user-facing next step after discovery. Opening should likely remove this row or move it to the later skill-proof section.
- Product-model correction from user: binary discovery should intentionally favor high recall and tolerate false positives while producing enough structured help for an agent to work efficiently. The bundled skill should compare discovery output against real docs and code, reduce false positives, scan for likely false negatives, ask whether missing important claims are intentional or under-documented, report the discovery result, and then route to Cautilus eval or other evidence work to fill proof gaps.

## Open Questions

- Does the post-rewrite version now make Claim Discovery feel useful to a user rather than primarily describing implementation?
