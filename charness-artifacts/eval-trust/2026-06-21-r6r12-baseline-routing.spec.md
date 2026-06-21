# Build contract: bring R6/R12 into the deterministic engine baseline (2026-06-21)

Pairs with the measurement [2026-06-21-heuristic-baseline-routing-vs-ratified.md](./2026-06-21-heuristic-baseline-routing-vs-ratified.md).
Slice shape ratified by the maintainer: **default+extension** — portable R6/R12 defaults in the engine plus an adapter-owned routing-hint extension family, mirroring the `non_claim_section_headings` default+extension pattern.
Canonical living contract this realigns: [docs/contracts/facet-decomposition.md](../../docs/contracts/facet-decomposition.md) "Next step".

## Problem

`classifyClaimLine` (`internal/runtime/claim_discovery.go`) is the deterministic baseline extractor that produces the checked-in / CI-visible claim population (`claims:refresh:all` runs deterministically, so `extractionMode: heuristic`).
It never absorbed the ratified R6/R12 discriminators that the agent-primary template and the override surface already carry.
Measured 2026-06-21: ~45% route-accurate against ratified ground truth on the fingerprint overlap, `cautilus-eval` over-assigned ~3.4x (36.3% vs ratified 10.7%), ownership/boundary claims routed `human-auditable` — the opposite of R6.

R6/R12 (from the ratified facet gold set, `2026-06-19-recommendedproof-facet-gold-set-v2head.md:36`):
an ownership / boundary / sequencing **assignment**, or a static repo-owned check that could prove a capability, routes **deterministic**, because the actual agent behavior is a *different* claim's content.

Root cause of the 3.4x skew: the broad `cautilus-eval` catch-all (`claim_discovery.go:1672`, matches ` agent`/` skill`/` behavior`/…) fires on boundary- and capability-existence-shaped claims that merely *mention* an agent/skill noun, and `ownershipBoundaryClaim` (1760) — which does catch ownership shapes earlier — routes them to the wrong value (`human-auditable`/`needs-alignment` instead of `deterministic`).

## Current Slice

Correct the engine baseline toward R6/R12 with portable defaults, and add an adapter-owned `classification_hints` routing-hint extension family for repo-specific phrasings the portable defaults cannot safely generalize.
Everything stays deterministic — no LLM in the standing path.

## Fixed Decisions

1. **R6 portable default — ownership/boundary *assignment* → deterministic, scoped to gold-confirmed clauses only.**
   `ownershipBoundaryClaim` (func at `claim_discovery.go:1760`, switch case at 1445) has three clauses; do **not** flip the whole case.
   Flip only the explicit seam/assignment clauses the gold set actually exercises — clause 1 (`should own`/`must own`/`belongs to the skill|binary`, 1761-1764) and clause 2 (`belongs in adapters|code`, 1765-1767), which match the `claim-readme-md-139` / `claim-docs-contracts-claim-extraction-template-md-18` seam shape — to `deterministic`/`ready-for-proof` with `why`/`next` rewritten to the "static repo-owned boundary check" framing.
   **Leave the broad prose clause 3** (` boundary`/`adapter-owned`/`host-owned`/`repo-owned` + ` while`/` stays`/` keeps `, 1768-1769) at `human-auditable` until a gold-set entry confirms that shape — no ratified entry in the 36-entry set matches it, so flipping it would be hand-wave, not evidence (critique 2026-06-21).
   The behavioral counterpart (does the agent actually honor the boundary) is a *separate* claim that still routes `cautilus-eval`.
1b. **Shadowing guard — keep genuine reconciliation human.**
   `ownershipBoundaryClaim` (case 1445) sits above the ` align `/` drift `/` reconcile ` case (1568). An ownership line that *also* names reconciliation ("X owns Y; reconcile against Z") must stay `human-auditable`/`needs-alignment`, not silently become `deterministic`.
   The flipped clauses must carry a no-`align`/`drift`/`reconcile`/`mismatch`-token exclusion so reconciliation-shaped ownership lines fall through to the existing align case.
2. **R12 portable default — static capability-existence → deterministic.**
   Add a predicate that recognizes "ships / provides N named mechanisms/commands/seams" capability-existence shapes and routes them `deterministic`.
   Placement in the top-down switch: **below** the install case (1625) and the deterministic-token case (1547) so it never shadows a more specific existing deterministic case, and **above** the broad `cautilus-eval` catch-all (1672) so capability-existence shapes are caught before the catch-all sweeps them into eval.
   Scope the phrase set tightly to existence ("ships"/"provides"/"named …") so it does not drag genuine does-X-improve behavior claims into `deterministic`; the does-it-actually-improve outcome stays a separate eval facet.
3. **Adapter routing-hint extension family.**
   Add `claim_discovery.classification_hints.<routing family>` (name fixed in impl, candidate `proof_route_hints`): an adapter-owned list of `{ pattern, route }` entries, matched deterministically (case-insensitive substring, same convention as `claim_lexicon_terms`), that **extends, never replaces** portable defaults, and whose `route` is validated against the 3-value enum (`deterministic | cautilus-eval | human-auditable`).
   Repo-specific knowledge stays adapter-owned (2026-06-10 maintainer decision); only generic R6/R12 lives as portable defaults.
4. **Auditability.**
   Surface the new family in `renderClaimScanScope` / `effectiveScanScope`, exactly like `nonClaimSectionHeadings` and `claimLexiconTerms`.
5. **Golden freeze.**
   Any new portable default must surface as a diff in `TestClaimClassificationPortableDefaultsAreFrozen` and force the matching contract-doc update.
6. **Tests in the same slice** (mirror the existing hint-test structure): R6 ownership-assignment→deterministic, the shadowing-guard negative (ownership+reconcile line stays `human-auditable`), the broad-prose clause stays `human-auditable` (proves the flip is scoped), R12 capability-existence→deterministic plus a does-X-improve negative that must stay `cautilus-eval`, adapter routing-hint extension with a no-hint control (proves the route change comes from the adapter, not new hardcoding), and an English-defaults-preserved control. Add a frozen-route golden for the flipped cases (parallel to `TestClaimClassificationPortableDefaultsAreFrozen`) so any future broadening of `ownershipBoundaryClaim` re-triggers gold-set review.
7. **Contract docs realigned in-slice:** `docs/contracts/adapter-contract.md` (new hint family schema), `docs/contracts/claim-discovery-workflow.md` (portable defaults), `docs/contracts/facet-decomposition.md` (mark the engine baseline corrected).
8. **Re-measure after impl:** record before/after route distribution + fingerprint-overlap accuracy in the paired measurement artifact.

## Probe Questions (resolved during impl, not blocking start)

- **Which predicates beyond `ownershipBoundaryClaim` are confirmed R6/R12 violators safe to flip?**
  Candidates: `reusableBehaviorOwnershipClaim` (1822, placement assignment), `providerNeutralBoundaryClaim` (1741, boundary + static-capability).
  Default = flip only those a gold-set entry confirms; otherwise leave.
- **`futureOrMixedWorkflowBoundaryClaim` (1532) and `proofRoutingPolicyClaim` (1718):** mixed-future / policy shapes.
  Default = **leave `human-auditable`** unless the gold set shows a clear deterministic call — avoid over-correction (a future-looking claim is not yet a satisfied static check).
- **R12 capability-existence phrase set:** the smallest pattern set that catches `claim-readme-md-139`-style ("six named mechanisms shipping") without dragging genuine behavior claims into `deterministic`.
- **Adapter family field name + match semantics:** `proof_route_hints` vs alternative; confirm substring/case-insensitive matching and enum-validated `route`.

## Non-Goals / Deliberately Not Doing

- NOT true per-facet decomposition for the whole population (Fork B — deferred, gated behind this).
- NOT editing the agent-primary extraction template (already R6/R12-aware) or the override surface (already pins individual ratified corrections).
- NOT adding any LLM call to the standing `claims:refresh:all` path.
- NOT chasing 100% route accuracy — the target is directional movement toward ratified, with the measurement as the before/after record. The probe sets a realistic target band.

## Constraints

- Adapter schema stays repo-agnostic; portable defaults stay generic R6/R12; repo-specific phrasings go to the adapter family.
- Deterministic only.
- Claim-source files change → `npm run claims:refresh:all` before push.

## Success Criteria

1. Ownership/boundary-assignment claims route `deterministic` in the engine baseline (R6).
2. Static capability-existence claims route `deterministic` (R12).
3. The adapter routing-hint family extends portable defaults deterministically, proven by a no-hint control.
4. **Falsifiable accuracy gate (not "directional movement").** On the 49-fingerprint overlap from the paired measurement, per-claim route agreement against the ratified key must **rise above the measured 22/49 (45%) baseline**, AND there must be **zero new `human-auditable → deterministic` disagreements** (the over-correction signature). Aggregate `cautilus-eval` share should also drop from 36.3% toward the ratified ~11% band, but the overlap agreement + no-new-over-correction pair is the binding gate.
5. All existing claim-discovery tests pass or are updated with a stated justification; new per-predicate tests added.
6. Contract docs realigned; portable-defaults golden updated.

## Acceptance Checks

- `go test ./internal/runtime/...` (new per-predicate tests + existing suite).
- `npm run claims:refresh:all` regenerates `latest.json`; re-run the measurement jq (route distribution + the 49-fingerprint overlap agreement) → overlap agreement up from 22/49, zero new `human-auditable → deterministic` flips.
- `npm run verify` green; apex honesty 7/7 preserved.

## First Implementation Slice

1. Add per-predicate unit tests asserting the TARGET routes (red first).
2. Flip confirmed R6 predicates (`ownershipBoundaryClaim` + gold-set-confirmed friends) to `deterministic`.
3. Add the R12 capability-existence predicate before the `cautilus-eval` catch-all.
4. Add the adapter `classification_hints` routing-hint family + scan-scope surfacing + golden freeze.
5. Realign contract docs.
6. `claims:refresh:all` + re-measure + record before/after.
7. `verify` + commit + push.

## Canonical Artifact

This file is the slice build contract; `docs/contracts/facet-decomposition.md` is the living direction it realigns.
