# wp-45 routing discipline landed on the heuristic floor — `Premortem` non-claim section heading

Status: maintainer-ratified 2026-06-19 (interactive, exception-ratify model).

This is the first concrete per-facet-routing wiring move out of the 2026-06-19 facet gold set.
It adds `Premortem` to the cautilus adapter's `claim_discovery.classification_hints.non_claim_section_headings`,
so the deterministic discovery baseline excludes design-critique sections the way the ratified agent extraction already does.

## What the gold set pointed at

The facet gold set ratified `claim-docs-internal-working-patterns-md-45` (wp-45 — "rejected/not-done decisions live only under explicit decision-section headings")
to dominant **deterministic**, because it *is* the `non_claim_section_headings` placement rule a scanner already enforces.
The gold set MD flagged it "directly informs the classification_hints wiring."
This artifact is that wiring landed for the `Premortem` review-section convention.

## The measured gap (heuristic floor only, not the answer key)

The leak is on the no-model heuristic baseline, not the ratified agent extraction.
The answer key `goldset-v2-reextract-head` (agent-extracted, HITL-ratified) already omits every Premortem-section line,
because the extraction template's `nonClaimConventions` guidance tells the agent to skip them.
Cross-check: of the 8 Premortem claim ids the heuristic baseline emits, **0 appear in the 375-entry answer key**.
So this change converges the deterministic floor with the already-ratified discipline rather than introducing a new judgment.

Dry-run via `discover claims --adapter <patched> --repo-root .`:

| | candidateCount |
|---|---|
| before (`Premortem` absent) | 383 |
| after (`Premortem` present) | 375 |

Removed: exactly 8, added: 0. The 8 removed ids:

- `claim-docs-contracts-claim-discovery-workflow-md-{597,599,602,620,621,622,627}` (the Premortem section's Act-before-ship / Bundle-anyway / Over-worry / Valid-but-defer notes)
- `claim-docs-contracts-runner-readiness-md-398`

Every one is a design-critique process note whose real product claim is restated in a body section
(Fixed Decisions, Model-Spend Confirmation, Scan Scope, Existing State Refresh), so no claim content is lost.

## Caveat carried into the refresh

`claim-docs-contracts-claim-discovery-workflow-md-602` carried `reviewStatus=human-reviewed` (evidence=unknown, evRefs=0).
The underlying claim survives as `...-md-644` ("Existing state refresh is selected by Cautilus Agent ... but deterministic refresh-plan output owns the state transition"),
so dropping the Premortem duplicate drops only that instance's human-reviewed marker, not the claim.
`-602` was woven into the canonical map and derived packets; `npm run claims:refresh:all` regenerates them.

## Why adapter-owned, not a portable default

`Premortem` is a charness review-skill section convention, so it genuinely varies across repos and belongs in the adapter,
not in the engine's portable default list (which stays `Deferred Decisions`).
No engine code changed; the existing `non_claim_section_headings` mechanism and its `claim_discovery_test.go` coverage carry the behavior.

## Directional realignment

The handoff framed the next move as "next classification_hints family or per-facet recommendedProof."
The latter is closed by claim-discovery-workflow.md Fixed Decisions: routing keywords do not become a hint family — routing knowledge is agent-primary, in the extraction template.
The contract-legal realization of per-facet routing on the deterministic floor is the `non_claim_section_headings` discipline, which is what wp-45 actually points at.
The kept-capability-boundary rule still holds: `Deprecated Surface Names`, `Probe Questions`, and `Deliberately Not Doing` mix real claims (extraction-template:58 recall targets) and are deliberately not heading-excluded.

## Critique

Bounded fresh-eye subagent review 2026-06-19 returned **READY**, no blockers, no required edits.
It verified all 8 removed claims are Premortem process notes whose product substance is restated in body/decision sections (the highest-risk one, `runner-readiness-md-398`, is restated at `runner-readiness.md:5,50,116,340`; `-602` at `claim-discovery-workflow.md:644`), that the Fixed Decision reading is accurate and not over-claimed, that the Premortem section carries zero capability-boundary recall targets (the two grep-visible negatives are premortem rhetoric, not `not-for`/`does-not` product boundaries), and that the handoff next-action ordering is internally consistent with the Workflow Trigger.
One non-blocking note: a sibling raw extraction packet (`claims-agent.json`) shows 374 while the ratified answer key is 375 (`ANCHOR.md`: accept 346 + relabel 19 + not-a-claim 10, after a `cli-268` over-merge split during recuration); the cross-check's referent is the 375-entry ratified answer key, so the count here is correct.

## Source

Facet gold set: `charness-artifacts/eval-trust/2026-06-19-recommendedproof-facet-gold-set-v2head.{md,json}` (wp-45 ratification).
Contract: `docs/contracts/claim-discovery-workflow.md` (hint-family promotion bar, Fixed Decisions) and `docs/contracts/facet-decomposition.md`.
