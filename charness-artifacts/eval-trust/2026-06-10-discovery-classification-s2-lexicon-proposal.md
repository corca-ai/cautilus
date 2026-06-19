# Discovery classification S2: claim-lexicon hint family, with the yt-digest term proposal

Status: engine shipped and ratified-by-semantics; the term list below is agent-proposed, 2026-06-10, pending maintainer ratification.
Goal: [2026-06-10-adapter-owned-discovery-classification.md](../goals/2026-06-10-adapter-owned-discovery-classification.md), slice S2.
Baseline input: [2026-06-10-discovery-classification-s1-baseline.md](./2026-06-10-discovery-classification-s1-baseline.md) (yt-digest `99d10cf`, charness `2bbd8a40`, example-app `8368964b`; same-session before/after pairs).

## Ratified semantics (maintainer, 2026-06-10, this session)

- Adapter `claim_discovery.classification_hints.claim_lexicon_terms` match as case-insensitive substrings (agglutinative predicates carry no space boundaries).
- Claim-shaped length bounds count runes, not bytes (the old 20–260 bytes allowed only ≈86 Korean characters).
- Adapter terms extend the built-in English defaults; there is no replace knob.
- A line matched only by an adapter term that no portable routing case recognizes routes through the fallback lane (`human-auditable`, `blocked`, `heuristic`) instead of being dropped by the English routing switch (the plan-critique blocker).
- Read-only corpus measurement uses the new explicit `discover claims --adapter <adapter.yaml>` override; the scanned repo is never written.

## Proposed yt-digest term list (pending ratification)

Measured per term on the three scanned sources (README.md, AGENTS.md, INSTALL.md), engine at this slice:

| term | candidates alone | note |
| --- | --- | --- |
| `니다` | 16 | formal declarative ending; carries most prose claims |
| `한다` | 1 | plain declarative; carries AGENTS.md operating rules |
| `해야` | 3 | obligation marker (≈ must) |
| `수 있` | 3 | ability marker (≈ can) |
| `된다` | 0 | no yield on this corpus; dropped from the proposal |
| `이다` | 0 | no yield on this corpus; dropped from the proposal |

Combined proposal (`니다`, `한다`, `해야`, `수 있`): **0 → 19 candidates** against the S1 baseline of 0.
The proposed adapter file is checked in at [adapters/yt-digest-claim-lexicon.proposal.yaml](./adapters/yt-digest-claim-lexicon.proposal.yaml) for reproducible measurement.

## Precision sample (agent-labeled, for the ratification read)

Claim-shaped (examples): `README.md:3` (product promise), `README.md:62` (dashboard reads `data/index.json`), `INSTALL.md:5` (agents must execute, not explain), `INSTALL.md:15` (`data/index.json` points at latest output), `AGENTS.md:7` (commit-per-meaningful-unit rule).
Noise (examples): `README.md:30`, `README.md:45` (list-intro sentences "…다음과 같습니다"), `INSTALL.md:129` (checklist fragment).
Rough agent count: 12–14 of 19 claim- or acceptance-shaped, 5–7 list-intro/fragment noise; comparable to the English heuristic's noise floor, and the review lane exists for exactly this.
Known precision leak (from plan critique): the open-question/definition filters are English-only, so Korean questions (`…인가?`) would pass; none occur in this corpus.
Known under-match: README feature bullets are noun-final (`…스크래핑`, `…분류`) and stay unextracted; that is list-item shape, not lexicon, and stays out of S2 per the goal's non-goals.

## Control evidence

- With/without control: the same Korean document yields 0 candidates without the adapter hint and >0 with it (Go test `TestDiscoverClaimProofPlanAdapterClaimLexiconExtractsKoreanClaims`; executable spec example in `docs/specs/user/claim-discovery.spec.md`).
- Extend-only control: English extraction is unchanged by configured Korean terms (`TestDiscoverClaimProofPlanAdapterLexiconKeepsEnglishDefaults`).
- Frozen defaults golden: `TestClaimClassificationPortableDefaultsAreFrozen` pins the portable default lexicon and non-claim headings so new hardcoding surfaces as a test diff (plan-critique act-before-ship).
- English-corpus side effects of this engine slice (rune bounds + S4 default): charness 227 → 227; example-app 308 → 307 (the removed line is a deferred-decisions intro sentence at `docs/implementation/20-example-app-plugin-model.md:243` — intended S4 behavior); this repo 376 → 378 (−1 deferred-decisions line, +2 long lines whose em-dashes previously broke the byte bound, +1 new spec sentence written this session).

## Outcome (2026-06-10, same session)

Term ratification was deliberately deferred: when the maintainer challenged the term list's naivety, the analysis showed `니다` is the only NFC-expressible paradigm-covering substring (ㅂ-irregular forms like `가리킵니다` contain no other candidate), which means the claim-shaped gate degenerates to a sentence-length detector on formal Korean prose.
That finding fed the goal's agent-primary redesign decision (see the goal artifact's `## Redesign Decision`): extraction moves to the Cautilus Agent against a product-owned template, and this lexicon family now gates only the explicitly labeled heuristic baseline mode.
The terms above stay agent-proposed; this measurement remains the baseline-mode evidence and the before/after harness for the agent-vs-heuristic comparison.
