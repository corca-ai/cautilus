# Residual Key Re-adjudication — Option C (Sharpened R3)

Date: 2026-06-18.
Trigger: the cut-2 R16 gate. The maintainer chose **Option C** — re-adjudicate only the 16 residual relabels under an explicit, sharpened R3 before deciding any template edit.
Question: was R3 ("deterministic = checkable in principle") **over-applied** when these 16 were relabeled toward `deterministic`?

This re-opens **only** the 16 residual relabels of the ratified `goldset-v2-reextract-head` key, as authorized; it does not reopen the full 374.

## Method — sharpened R3 with a substance-check forcing function

Three independent adjudicators (blind to the prior verdicts) re-routed the 16, each required to first **name the single most specific deterministic check that would prove the claim's SUBSTANCE** before ruling.
The sharpening that cut-2's counterweight review demanded: a check that only asserts "the doc/template/README *contains* this sentence" does **not** count — it proves the doc says it, not that the claimed thing is true of the code, the output contract, or an artifact's actual content.
A claim routes `deterministic` only if a concrete substance-level static check exists; `human-auditable` if the only proof is reading current prose and judging; `cautilus-eval` if the substance needs model/agent/behavior execution.

Evidence: `cutC/adjudication-input.json`, `cutC/adjudicator-{A,B,C}.json`, `cutC/synthesis.json`.

## Result — R3 was over-applied, but unevenly

Reading each adjudicated majority against the **blind** route is decisive: when the adjudicated route equals the blind route, the maintainer's relabel was the error (the agent was right) — a gold-key over-relabel, not agent error.

| disposition | n | meaning |
| --- | --- | --- |
| HOLD (relabel correct — real agent under-route) | 9 | the deterministic relabel stands on a genuine substance check |
| UN-RELABEL → accept (gold-key over-relabel — agent was right) | 6 | R3 was over-applied; the blind route was correct |
| RE-AIM | 1 | R15: corrected to `human-auditable`, not the relabel's `deterministic` |

Proposed new ratified counts: **accept 344 / relabel 19 / not-a-claim 10 / badly-bounded 1 = 374** (was accept 338 / relabel 25).

### claim-extraction-template.md — the deterministic ruling mostly STANDS

- **HOLD deterministic (7):** R08, R09, R10, R11, R12, R13, R16 — the "documented-content description" class ("the template documents routing rule X", "v2 adds prompts for Y", "this doc is the canonical contract"). All three adjudicators ruled `deterministic` unanimously: the substance **is** the artifact's content, and a structural/parity check on the template or contract is a real substance check (not a string check). The blind extractor's `cautilus-eval` was a genuine under-route.
- **UN-RELABEL (1):** R14 ("the agent emits the claim with `blocked` when unsure") — unanimous `cautilus-eval`. This is agent runtime behavior; the relabel to `deterministic` was an outright key error, and the blind `cautilus-eval` was correct.
- **RE-AIM (1):** R15 ("verifying the agent flow is later eval-fixture work, not a prerequisite") — a sequencing/scope assertion with no substance check; corrected to `human-auditable` (not `deterministic`).

Net: the cet residual is a **real, concentrated systematic under-route** — 7/80 = 8.75% on one coherent class (documented-content description). The pocket survives re-adjudication.

### README.md — the residual was mostly a gold-key over-relabel

- **HOLD deterministic (2):** R03 ("the summary is not a global verdict") and R05 ("claim discovery is proof planning, not a verdict") — these have a real **output-contract** substance check (the summary/discovery output schema structurally carries no global-verdict field), so deterministic stands.
- **UN-RELABEL → accept (5):** R01 (durable-packet emission, unanimous `deterministic` ≡ blind), R02 (honest badges — proven/declared/promised needs human judgment), R04 (dogfood retro narrative), R06 (intent-first design philosophy), R07 (proof-layer routing-policy prose). These are narrative / policy / design-philosophy statements with no substance check; the maintainer over-applied R3, and the blind routes were correct.

Net: **5 of 7 README residual relabels dissolve.** The README residual relabel rate drops **13.5% → 3.8%** (2/52) — clean, comparable to the other clean sources. The README "pocket" was substantially a measurement artifact of R3 over-application, exactly the contested-key hypothesis cut-2's counterweight flagged and the `0/21` predicted.

## What this resolves for the cut-2 R16 gate

- **README → Option B (no template edit) + key correction.** There is no systematic agent error to teach; the agent routed these correctly. Fix is to amend the key (un-relabel the 5 + R01), not the template.
- **claim-extraction-template "documented-content description" → Option A (scoped) is justified.** A real, concentrated 8.75% under-route on one nameable class survives re-adjudication. A single lean generalization — "a claim that *describes the content* of a documented rule, template, schema, or contract is a static fact about that artifact (a parity check settles it) → `deterministic`, even when the rule's subject is agent behavior" — is the R16-compliant candidate. The README "output scope/negation" sentence from cut-2 is **withdrawn** (R3 over-applied there; only the two genuinely output-structural claims hold, and they are already covered by the existing structural-check guidance).

## Proposed key amendments (PENDING maintainer confirmation)

These amend ratified ground truth, so they are recorded here as **proposed** and applied only on the maintainer's go:

| id | claimId | from (relabel) | to | basis |
| --- | --- | --- | --- | --- |
| R01 | claim-readme-md-8 | relabel→cautilus-eval | accept (deterministic) | durable-packet emission is a checkable output-contract; eval over-read |
| R02 | claim-readme-md-16 | relabel→deterministic | accept (human-auditable) | badge proven/declared/promised state needs human judgment |
| R04 | claim-readme-md-96 | relabel→deterministic | accept (human-auditable) | dogfood retro narrative; no substance check |
| R06 | claim-readme-md-128 | relabel→cautilus-eval | accept (human-auditable) | intent-first design philosophy; design-stance reading |
| R07 | claim-readme-md-134 | relabel→deterministic | accept (human-auditable) | proof-layer routing-policy prose; no substance check |
| R14 | claim-…-template-md-78 | relabel→deterministic | accept (cautilus-eval) | agent runtime behavior; the blind eval was correct |
| R15 | claim-…-template-md-261 | relabel→deterministic | relabel→human-auditable | sequencing/scope assertion; re-aim, not deterministic |

R01 and R06 carried the maintainer's *cautilus-eval* relabels (behavioral readings) rather than deterministic, so they are not R3-over-application in the strict sense; the sharpened-R3 adjudicators read them as the blind route (deterministic / human-auditable), and the proposed amendment defers to that structural/design-stance reading. Both are the most contested of the seven (3/3 and 2/3).

## Status

Re-adjudication complete; dispositions proposed.
The ratified key is **unchanged** until the maintainer confirms the amendments.
On confirmation, the next step is the scoped **Option A**: add the single documented-content-description generalization to the operative `routingGuidance` (parity guard + doc sync), then a 3rd confirming cut over `claim-extraction-template.md` only.
