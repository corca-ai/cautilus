# Extraction Template Doc↔Binary Routing Drift Debug
Date: 2026-06-18

## Problem

The session-3 commit `080e7d0` ("Teach the extraction template to route ownership and reviewability claims deterministically") added the R16-locked proof-route lean generalization to the contract doc `docs/contracts/claim-extraction-template.md` §4 only.
The operative template that the binary actually emits to blind extractors — hardcoded in `internal/runtime/claim_extraction.go` and surfaced by `cautilus discover claims extraction-input` — was never updated, so the generalization the contract now promises is not in the routing guidance any extractor receives.

## Correct Behavior

Given the contract doc declares a routing-guidance generalization in template `v2`,
when the binary renders the operative extraction template (`claimExtractionTemplate`) and emits it via `discover claims extraction-input`,
then the emitted `routingGuidance` carries the same generalization the doc promises, so a blind re-extraction is actually steered by the edited template (and the planned proof-route before/after measurement is meaningful).

## Observed Facts

- `git show 080e7d0 --stat`: one file changed, `docs/contracts/claim-extraction-template.md`, 1 insertion. `internal/runtime/claim_extraction.go` was not in the commit.
- The operative `routingGuidance` literal at `internal/runtime/claim_extraction.go:142` does not contain the strings `ownership`, `boundary`, `isolation`, or `reviewable / reproducible / auditable`; it stops at the prior `v2` enabler rubric ("prefer deterministic for any capability claim a static check could prove ... do not default a structurally-provable capability claim to human-auditable").
- `extraction-input.json` (gold-set snapshot, anchor `558cda7`) and the binary literal agree byte-for-byte on `routingGuidance`, both at `templateHash` `sha256:41323548…` — confirming the binary, not the doc, is what the gold extraction consumed.
- The closeout / ANCHOR / handoff all record M2 "edited v2 template DONE (`080e7d0`)" and assume the re-extraction will measure it; none flagged that the operative surface was untouched.
- No literal `41323548` hash is pinned in any test or script; the hash is recomputed from the template block (`claim_extraction.go:147` -> `claimExtractionTemplateHash`).

## Reproduction

```
git show 080e7d0 --stat                      # doc-only, 1 insertion
rg -n "ownership|reviewable / reproducible" internal/runtime/claim_extraction.go   # no match in operative routingGuidance
```

The operative template emitted by `discover claims extraction-input` carries the pre-edit routing guidance, so re-extracting now would hand extractors the old template and produce a null before/after on the very change being measured.

## Candidate Causes

- The template prose lives in two places (the contract doc and a hardcoded Go literal) with no generator and no parity check, so a doc-only edit silently diverges. (confirmed)
- The routing-guidance test (`claim_extraction_test.go:213-215`) only substring-checks `enabler` + `schema check does not prove`, which both the old and new guidance satisfy, so it could not catch a content gap. (confirmed — detection gap)
- The session treated `claim-extraction-template.md` as the single source of truth (it is a registered claim source, and `claims:refresh:all` ran for it), creating a false sense that editing the doc edited the product. (confirmed — wrong mental model)
- Alternative: the doc could be intentionally a human superset of a leaner operative template (rejected — the doc §4 explicitly describes the operative `recommendedProof` routing the binary emits, and the gold-set measurement plan depends on parity).

## Hypothesis

If the operative literal at `claim_extraction.go:142` is the gold-extraction routing guidance and lacks the `080e7d0` generalization, then `cautilus discover claims extraction-input` at HEAD emits a template whose `routingGuidance` has no ownership/boundary or reviewable/reproducible clause and whose `templateHash` still equals the pre-edit `41323548`.

## Verification

- Read `claim_extraction.go:142`: the literal ends at the prior enabler rubric; the generalization is absent. Confirmed.
- Read `extraction-input.json` template block: identical `routingGuidance`, `templateHash` `41323548`. Confirmed the binary literal is the operative, gold-consumed text.
- `git show 080e7d0` touches only the doc. Confirmed the operative surface was never edited.
- The fix (mirror the generalization into the literal) changes the recomputed `templateHash`, which is exactly the intended new-template signal for the re-extraction "after".

## Root Cause

The extraction template's routing guidance is maintained as two hand-kept copies — the contract doc and a Go string literal in `claim_extraction.go` — with no generator binding them and no parity test.
`080e7d0` edited the doc copy and left the operative copy stale, so the product still emits the pre-edit template while every living doc records the edit as landed.

## Invariant Proof

- Invariant: the routing guidance the contract doc declares for template `v2` equals the `routingGuidance` the binary emits via `discover claims extraction-input`.
- Producer Proof: doc `claim-extraction-template.md` §4 carries the ownership/boundary/isolation + reviewable/reproducible generalization (`080e7d0`).
- Final-Consumer Proof: before fix, `claim_extraction.go:142` (the only producer of the emitted template) lacked it -> consumer (blind extractor) received pre-edit guidance. After fix, the literal carries it and the guard test asserts it.
- Interface-Shape Sibling Scan: the other six template fields (`claimDefinition`, `excerptRules`, `epicGuidance`, `uncertaintyRule`, `nonClaimConventions`, `epicCatalog`) — `claimDefinition` is parity-guarded (`first-class`/`not for`/`deliberately will not do`); the rest were not edited by `080e7d0`/`3bc1b06` and stay in sync.
- Non-Claims: the `3bc1b06` README "shortest" and template "(ratified 2026-06-10)" trims were prose-only and touch no operative template field, so they need no binary mirror.

## Detection Gap

- `internal/runtime/claim_extraction_test.go:213-215` | the routingGuidance assertion checks only `enabler` + `schema check does not prove`, both satisfied by old and new text, so a missing generalization passes | assert the operative `routingGuidance` carries `ownership/boundary/isolation` and `reviewable/reproducible/auditable`.
- `claims:refresh:all` revalidated the doc as a claim source but nothing checks the operative template tracks doc edits | a doc↔binary template parity guard (named below as a follow-up) would fire when either copy moves without the other.

## Sibling Search

- Mental model (wrong): editing the contract doc edits the operative template. Reality: the operative template is a hardcoded Go literal; the doc is a parallel hand-kept copy.
- same-symbol axis: other `routingGuidance`-adjacent template fields in `claim_extraction.go` | decision: in sync (not touched by the drifting commit) | proof: read literal; only routingGuidance diverged.
- same-session axis: `3bc1b06` doc trims | decision: no operative mirror needed | proof: prose-only, no template field.
- cross-file: `internal/cli/command-registry.json` doubled-verb strings (`debug-2026-06-18-evaluate-review-doubled-verb.md`) | decision: same family already fixed this session | proof: both are hand-authored binary prose that drifted from intent past a weak/incorrect guard.
- follow-up: `follow-up: doc↔binary extraction-template parity` — add a test (or generate one copy from the other) so the contract doc and the operative Go template literal cannot diverge silently; pattern recurs across registry strings and template prose, so a shared parity harness is the durable fix. Outside this slice.

## Seam Risk

- Interrupt ID: extraction-template-doc-binary-routing-drift-2026-06-18
- Risk Class: none
- Seam: internal doc↔binary string parity (fully provable locally; no host/runtime dependency).
- Disproving Observation: none — local read of the literal and the commit settles it.
- What Local Reasoning Cannot Prove: nothing for this incident.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Mirror the `080e7d0` generalization into the operative `routingGuidance` literal (`claim_extraction.go:142`) in the condensed operative register, which recomputes `templateHash` to the new-template signal, and strengthen the routing-guidance guard test to assert the generalization keywords so a future doc-only or binary-only edit fails fast.
The repeated hand-authored-binary-prose drift (this incident plus the doubled-verb registry bug in the same session) is recorded as Generalization Pressure: monitor with the `follow-up: doc↔binary extraction-template parity` sibling; a third occurrence should factor a shared parity harness now.

## Related Prior Incidents

- `2026-06-18-evaluate-review-doubled-verb.md` — same session, same family: a hardcoded binary string (`command-registry.json`) drifted from the routable command form, and a test pinned the wrong form. Same root shape (hand-kept binary prose + weak guard), same prevention shape (structural guard asserting the intended invariant).
- `2026-05-16-command-registry-surface-name.md` — earlier registry-string drift; reinforces the recurring "binary hardcodes prose a contract should govern" pattern feeding the monitor pressure.
