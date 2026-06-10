# Achieve Goal: Adapter-owned discovery classification, proven portable on real consumer corpora

Status: draft
Created: 2026-06-10
Activation: `/goal @charness-artifacts/goals/2026-06-10-adapter-owned-discovery-classification.md`
Timebox: 3 interactive working sessions (maintainer-gated; ratification pauses do not count against the box)
Activation time: unset — record at `/goal` activation; this goal is deliberately shaped-only for now
Closeout reserve: final 20% of the last session for Final Verification, retro, and handoff
Done-early policy: continue_next_improvement

This file is the living goal scratchpad. It becomes active only when the user
runs the activation command.

Discuss before activation: resolved 2026-06-10 — the consumer corpora are maintainer-named read-only sibling checkouts (`../yt-digest` Korean, `../charness` and `../ceal` English); the maintainer chose shaped-only (no hook activation) because heavy mid-stream intervention is expected at every ratification point.

## Active Operating Frame

- Current slice: extraction-seam design contract landed at `docs/contracts/claim-extraction-template.md` (2026-06-10, four seam decisions maintainer-ratified, bounded fresh-eye critique resolved in-slice).
- Next action: implement the contract's slice 1 (binary first-extraction: `extraction-input`/`apply-extraction`, anchoring validation, unified fingerprint golden test) or shape the gold-set-scored agent-vs-heuristic comparison measurement; resume S0 HITL when maintainer time allows, feeding the eval fixture.
- Execution mode note: the maintainer opened an interactive session on 2026-06-10 asking to implement and discuss; slices run in this interactive session with this artifact as slice memory, per the shaped-only Interview Decision.
- Verification cadence: cheap deterministic checks at commit boundaries;
  higher-cost or fresh-eye proof at slice boundaries; final broad/live proof at
  closeout.
- Slice review packet: before fresh-eye slice critique, provide intent, changed
  files and owning/generated surfaces, expected invariants, tests/proof,
  non-claims, out-of-scope lines, and reviewer questions.
- History boundary: keep this frame current; move completed detail to
  `## Slice Log`, `## Final Verification`, and `## Auto-Retro`.

## Goal

Discovery classification knowledge that varies per repo lives in adapter-owned `claim_discovery.classification_hints`, proposed by the Cautilus Agent from an initial scan and ratified by the maintainer, with the portability claim measured rather than asserted.
Concretely, by the end of this goal:
a Korean-documented consumer repo (`../yt-digest`) extracts claims through an adapter-proposed lexicon hint family instead of extracting almost nothing;
proof-routing hints carry the ratified gold-set corrections so the facet routes are honest on this repo and measured on `../charness` and `../ceal`;
the hardcoded `Deferred Decisions` heading is absorbed into `non_claim_section_headings` portable defaults;
and the paused gold-set HITL queue (c02 onward) has progressed with maintainer verdicts recorded into the gold-set JSON.
The promotion bar and priority order are already contract: `docs/contracts/claim-discovery-workflow.md` (hint-family promotion criteria, 2026-06-10).

## Non-Goals

- Activating this goal's hook or running autonomously past a ratification point; every label and hint ratification is maintainer-gated.
- Editing, committing to, or pushing the three corpus repos; they are read-only measurement targets.
- A per-claim `dominant` field in any schema (dominance was a gold-set scoring device only).
- Rewriting product-owned extraction mechanics (fence/frontmatter skipping, heading tracking, duplicate merge).
- Generic multilingual NLP; the language gap is addressed only as an adapter-owned lexicon hint family.
- Badge movement (`Behavior Evaluation` stays declared unless the maintainer separately decides otherwise).
- Completing all 36 HITL entries if maintainer time runs out; the queue is resumable state, not a completion gate.

## Boundaries

- External side-effect scope: none planned; all changes land locally in this repo and `git push` stays user-owned.
- Corpus access is read-only filesystem scanning of `../yt-digest`, `../charness`, `../ceal`; measurement artifacts (counts, samples, proposed hints) are recorded in THIS repo under `charness-artifacts/eval-trust/`, and corpus excerpts quoted in artifacts stay minimal.
- `skills/cautilus-agent/SKILL.md` stays within the 180-nonempty-line disclosure budget; packaged copy parity is maintained.
- Engine changes must keep the control-test invariant: classification filters come from the adapter, never from new repo-specific hardcoding (portable defaults are allowed when generalized, like the planned Deferred Decisions absorption).
- Claim-state refresh chain (`npm run claims:refresh:all`) runs after any claim-source-touching slice.

## User Acceptance

- Run `bin/cautilus discover claims --repo-root ../yt-digest --output /tmp/yt.json` with the proposed adapter hints applied and see a non-trivial Korean claim candidate list (baseline today is near zero); the proposal artifact shows the before/after counts.
- Open the per-corpus measurement artifacts under `charness-artifacts/eval-trust/` and check that every ratified label carries your verdict, not just agent proposals.
- See proof-routing hints in `.agents/cautilus-adapter.yaml`, with the gold set's clear misroutes (6 cautilus-eval, 7 human-auditable) re-tagged correctly in a fresh discovery run.
- Confirm `Deferred Decisions` filtering still works with the hardcoded branch deleted (spec example keeps passing).
- Resume the HITL session and see verdicts recorded in the gold-set JSON `maintainerVerdict` fields.

## Agent Verification Plan

### Low-Cost Checks

- `go test ./internal/...`, `npm run verify` (includes specdown, coverage floors, disclosure gate) at every commit boundary.
- The adapter-not-hardcoded control test per hint family (with-hint vs without-hint discovery on a temp repo).

### High-Confidence Checks

- Before/after discovery diffs per corpus: candidate counts, removed/added claim IDs, and scan-scope hint recording, kept as artifacts.
- Gold-set replay: recompute tallies from ratified `maintainerVerdict` fields and compare against proposed tallies; misroute corrections must be visible in a fresh run on this repo.
- Spec example execution for each new hint family (specdown `run:shell` blocks).

### External Or Live Proof

- None planned and none claimed: no model calls are required by this goal (judge capture work is out of scope).
  If a slice ends up needing LLM-backed review, it pauses for explicit maintainer budget confirmation first.

## Slice Plan

| Slice | Objective | Why Now | Expected Evidence | Status |
| --- | --- | --- | --- | --- |
| S0 | Resume gold-set HITL (c02 onward) in maintainer-sized batches | Ratified labels now baseline the agent-extraction eval (repurposed by the 2026-06-10 redesign); queue is paused resumable state | Verdicts in gold-set JSON, HITL artifact synced | pending (repurposed) |
| S1 | Baseline measurement on the three corpora with today's engine | Establishes the language gap and English-corpus shape before any hint design | Per-corpus artifact: counts, samples, near-zero yt-digest extraction | done |
| S2 | Claim-lexicon hint family (adapter-owned terms; agent proposes from corpus scan; maintainer ratifies) | Largest portability gap; promotion bar met once S1 evidence exists | Engine+test+contract+spec; yt-digest extracts claims via ratified hints | engine done; terms stay agent-proposed (baseline-mode-only after redesign) |
| S3 | Proof-routing hint family from the ratified gold set | Gold-set evidence already exists; corrects the most expensive misroutes | — | dissolved by the 2026-06-10 redesign: routing becomes part of the agent extraction template; the gold set becomes its eval fixture |
| S4 | Absorb hardcoded `Deferred Decisions` into `non_claim_section_headings` portable defaults | Removes the parallel mechanism; small bounded cleanup | Hardcoded branch deleted; behavior pinned by existing+new tests | done |
| S5 | Closeout: consumer-adoption guide note, contract sync, final verify, retro | Truth surfaces must reflect the new onboarding flow | Final Verification filled; retro recorded | pending |

## Coordination Cues

Phase-appropriate routing for this run, deferred to `find-skills` (its
`--recommend-for-task` / `--recommendation-role --next-skill-id` recommendation
engine) — never a hard-coded phase-to-skill list here. `achieve` owns this slot
and the floors below; `find-skills` owns *which* skill answers a boundary. Fill
during the run:

- **Routing** — ask `find-skills` to recommend the skill for the current phase or
  boundary, and record the route it returns. At completion, recorded
  implementation / debug / quality / issue work needs this `Routing:` evidence
  or a `Routing: n/a — <reason>` opt-out.
- **Gather step** — Gather: n/a — all context sources are repo-local artifacts and sibling checkouts; no URL/Slack/Notion/Drive sources.
- **Release step** — fill if a slice bumps plugin versions or install manifests; none planned.
- **Issue closeout step** — Issue closeout: n/a — no tracked GitHub issues are resolved by this goal as shaped.

## Slice Log

- 2026-06-10 S1 done: three-corpus baseline measured and recorded at `charness-artifacts/eval-trust/2026-06-10-discovery-classification-s1-baseline.md`.
  yt-digest extracts 0 candidates from 3 sources (verb-lexicon gap confirmed, traversal healthy); charness 227/56 sources, ceal 308/85 sources, so the English-extraction stop condition did not trigger and S2 stays scoped to the non-English lexicon family.
  Two S2 design inputs surfaced: Korean predicates need substring/suffix matching (space-padded containment can never match), and applying hints to a read-only corpus needs an explicit `--adapter <path>` override on `discover claims` (or a temp-copy harness).
  Routing: fresh-eye plan critique delegated to a bounded subagent (running); S1 measurement itself was direct CLI evidence work, no skill route needed beyond session bootstrap.
- 2026-06-10 S2 engine + S4 done in one engine slice (same functions, same session): `claim_lexicon_terms` hint family (substring match, rune-counted 20–260 bounds, extend-only, fallback routing lane), `discover claims --adapter <path>` override for read-only corpus measurement, hardcoded `Deferred Decisions` branch deleted into the portable `non_claim_section_headings` default with union merge.
  Maintainer ratified all four S2 semantics decisions, the `--adapter` mechanism, and S4 union-no-opt-out interactively; S0 HITL explicitly skipped this session.
  Proposal artifact with measured 0 → 19 yt-digest extraction: `charness-artifacts/eval-trust/2026-06-10-discovery-classification-s2-lexicon-proposal.md` (term list pending ratification).
  Claim-disappearance eyeball diff recorded there: this repo 376 → 378, charness 227 → 227, ceal 308 → 307.
  Routing: maintainer decisions captured via interactive ratification; implementation direct per `impl` conventions; debug detour (lexicon hints silently dropped) root-caused to the adapter classification_hints whitelist in `internal/runtime/adapter.go` before fixing, per the debug-first rule.
- 2026-06-10 redesign landed: maintainer challenged the lexical heuristic after the S2 term proposal; agent-primary extraction direction ratified and recorded in `## Redesign Decision`, contract, and master plan.
  S3 dissolved, S0 repurposed, S2 term ratification deferred (baseline-mode-only relevance).
  Routing: this was a decision-frame conversation (assessment + recommendation), not an implementation slice; realignment edits landed directly per the CLAUDE.md directional-decision rule.
- 2026-06-10 extraction-seam design slice done: `docs/contracts/claim-extraction-template.md` fixes the `extraction-input`/`apply-extraction` command pair, `cautilus.claim_extraction_input.v1`/`cautilus.claim_extraction_result.v1`, excerpt-hash fingerprint unification (heuristic packets unchanged by construction since excerpt=summary), whitespace-normalized substring anchoring with line-as-locator, `extractionMode` agent|heuristic, and the validate audit-presence scoping.
  Maintainer ratified the four seam decisions interactively; bounded fresh-eye critique (delegated subagent, verdict ready-with-edits) surfaced two blockers — `agent-reviewed` collisions with validate/review-input/eval-plan consumers, and missing primary-excerpt persistence — both resolved in the contract before commit.
  Routing: `find-skills` bootstrap → `charness:spec` for the contract; critique delegated per the subagent-delegation rule.
  Follow-up ratifications in the same session: the comparison measurement runs through a bounded harness consuming the same `extraction-input` packet (skill-flow verification deferred to a later Cautilus eval fixture over the cautilus-agent skill itself), `extraction-input` gets the `--adapter <path>` override for read-only corpora, and slice 4 therefore depends on slice 1 plus gold-set verdicts, not on slice 2.
- 2026-06-10 extraction slice 1 shipped (commit `cb3994a`): `discover claims extraction-input` (template v1 embedded with version+hash, sources with content hashes, merged hints, bounds, `--adapter` override) and `discover claims apply-extraction` (result schema + templateHash gates command-level; anchoring, exactly-one-primary, rune bounds, duplicate-fingerprint, and scope checks reject claim-level into `extractionAudit.rejectedClaims`; composes `extractionMode: agent` proof plans with `{path,line,excerpt,primary}` sourceRefs).
  Fingerprint unified to sha256(normalized primary verbatim excerpt) with a golden test pinning heuristic equivalence; heuristic packets now write `extractionMode: heuristic`; `validate` gained anchoring re-audit (hash-match hard-fail, hash-drift stale-anchor findings) and the extractionAudit audit-presence rule.
  Verification: full Go+node suites, lint chain, and specdown (43 specs) green; new executable seam section in `docs/specs/user/claim-discovery.spec.md` runs the round trip against a fixture repo.
  Routing: `charness:impl` against the contract; bounded fresh-eye critique delegated to a subagent, verdict ready with zero blockers (recorded in the contract's Critique section).
  Slice 4 (bounded-harness comparison) is now unblocked on the binary side; its remaining dependency is the S0 gold-set verdicts.
- 2026-06-11 S0 HITL paused at c04 with a maintainer-ratified reorder: docs truth first, then a regenerated gold set.
  Session yield before the pause: R5 (heuristic tag verdicts are derived bookkeeping, never a decision item), R6 (ownership/boundary-assignment claims route deterministic; discriminator: "what would an eval of this claim score that is not another claim's content?"), revised c02 verdict (deterministic dominance, live-behavior facet deleted as sibling-owned), c03 accepted under R6.
  c04 exposed the structural problem: the Review Budget Confirmation section contradicts the agent-primary direction recorded in the same contract (31 stale-vocabulary hits in claim-discovery-workflow.md), so ratifying routing verdicts over about-to-be-rewritten text wastes maintainer budget.
  New order ratified: confirmation-gate prose decisions → docs truth update (claim-discovery-workflow.md + README + cli guide; SKILL.md stays slice 2 under consumer-intent freeze) → agent extraction over fresh docs → HITL over that output becomes the new gold set → slice 4 scores against it. The 33 unratified S0 entries are superseded.
  Gate-design prose decisions ratified interactively: (1) one principle stated once — scope confirmation never authorizes model spend — instantiated per stage (scan scope → extraction budget on the primary path → review budget only where the review seam fires); (2) the extraction-budget plan shows the contract list (source count, content size, excerpt bounds, batch plan with expected batch count, stop reasons), subagent lane sizing deferred to slice 2; (3) workflow prose states present behavior only — no historical-transition or not-doing narration outside heading-marked decision sections (recorded as a working-patterns rule; c01/c04 measured the failure mode).
  Routing: HITL via `charness:hitl` (pause synced to `charness-artifacts/hitl/latest.md`); the pivot was a decision-frame conversation with a critical review; realignment edits landed per the CLAUDE.md directional-decision rule.
- 2026-06-11 docs truth update shipped (commit `df8a7fb` + critique edit): claim-discovery-workflow.md rewritten to the agent-primary present behavior — extraction-input/apply-extraction carry the primary path, the Model-Spend Confirmation section instantiates the one principle per stage, the Review Seam section states what review serves now, transition history moved into Fixed Decisions; cli guide gained the missing extraction command pair; README budget sentence covers extraction.
  Verification: full `npm run verify` green (a gitleaks finding on the calibration-sample packets was root-caused via `charness:debug` — allowlist path scope — and fixed class-wide, dated artifact + `latest.md`).
  Critique: full — delegated read-only fresh-eye subagent, verdict READY-WITH-EDITS, one NIT (transition narration in Scan Scope) fixed in the closeout commit; behavior honesty, gate structure, and doc sync confirmed against the command registry and extraction contract.
  Next: agent extraction over the fresh docs, then HITL over that output as the new gold set.

## Context Sources

- `docs/contracts/claim-discovery-workflow.md` — classification-hints contract, matching semantics, promotion criteria and priority inventory (the roadmap this goal executes).
- `docs/contracts/facet-decomposition.md` — redefined Next Step (adapter-owned hints absorb per-facet routing; no dominant field).
- `charness-artifacts/eval-trust/2026-06-10-recommendedproof-facet-gold-set-proposal.md` + `.json` — proposed labels, portability boundary, external-validity caveat; the ratification harness for hint proposals.
- `.charness/hitl/runtime/hitl-20260609-235609/` — paused HITL session (queue, state, scratchpad; c01–c03 accepted, paused at c04 pending the docs-truth rewrite; rules R1–R6 carry forward).
- Commits `a09505e` (first hint family, engine+adapter+SKILL.md), `12816e2`/`8e003e2` (gold set), `432b290` (promotion criteria/roadmap).
- Maintainer decisions this session: corpus choice (`../yt-digest`, `../charness`, `../ceal`), shaped-only activation, tie-break demotion, sc5 ratification.

## Interview Decisions

- Corpus for external validity: options were a real host repo, a checked-in synthetic fixture, or both. Maintainer chose three real sibling checkouts (`../yt-digest` Korean, `../charness`, `../ceal` English). Synthetic-only was rejected as weak external validity; checked-in regression fixtures may still be distilled from findings later (S2/S3 may propose that, maintainer decides then).
- Activation: maintainer explicitly withheld activation because every slice has ratification pauses; the goal is a planning surface, not an autonomous run. Assumed consequence: slices are executed in normal interactive sessions that treat this artifact as the slice memory surface.
- HITL placement: not separately asked; default taken to include the paused gold-set review as S0 because its ratified labels are an input to S3. The maintainer can reorder or interleave S0 with other slices freely.
- Priority order: carried from the maintainer-approved roadmap (lexicon gap first, then proof routing, then residue absorption); not re-asked.

## Plan Critique Findings

Bounded fresh-eye plan critique run 2026-06-10 (delegated subagent, read-only, verified against live corpus runs). Blockers, all resolvable as plan/contract edits:

1. `classifyClaimLine` is a second English gate: even with a perfect lexicon hint, hint-matched lines hit the English-keyword switch whose default drops them, so yt-digest stays at zero after S2 as originally scoped.
   Resolution adopted: S2 includes a portable fallback classification for hint-matched lines that no routing case claims (`human-auditable`, readiness `blocked`-equivalent inspect lane, `reviewStatus=heuristic`); minimal S3 vocabulary is NOT pulled forward.
2. S2 acceptance ("hints applied to read-only yt-digest") had no mechanism. Resolution: maintainer decision recorded below (adapter override vs temp-copy harness).
3. Hint-family matching semantics must be contract-decided before wiring: match mode (substring vs space-padded token) and rune-vs-byte length bounds (current 20–260 is bytes, ≈7–86 Korean chars, silently rejecting moderate Korean sentences). Also: yt-digest README feature bullets are noun-final (스크래핑/분류/생성), so a predicate lexicon alone may under-match list-style claims — known S2 review item.
4. S1 raw counts are gameable (recall gain vs noise injection indistinguishable). Resolution: S2/S3 measurement uses a small labeled sample per corpus for precision, before/after pairs run in the same session against recorded corpus commits (S1 artifact already records commits), and S3 on charness/ceal uses a bounded sampling protocol rather than full-list ratification.

Act-before-ship (folded into slice execution): S3 hint precedence vs the ordered switch's broad catch-alls must be contract-stated; S3 needs a no-regression check on deterministic-tag claims and a label-flip diff over non-sampled claims; S3 corrects per-claim tags only (facet schema stays out of scope); S4 needs explicit merge-vs-override semantics for portable defaults plus a claim-disappearance diff for maintainer eyeball; the with/without control test does not prove absence of new hardcoding — add a frozen default-config golden fixture; S0 can be batched down to the ~14 S3-critical verdicts with the remainder resumable-optional; Korean precision leaks (English-only open-question/definition filters) are a known S2 review item.

Over-worry (dismissed): missing yt-digest adapter (defaults work, exit 0), gitignore distortion (scope recorded per packet), the "English also near zero" branch (empirically false in S1), Korean block-splitting mechanics (declaratives end in `다.`, the `.`-suffix rule works), shaped-only activation risk.

## Redesign Decision (2026-06-10, maintainer-ratified)

Trigger: after the S2 term proposal, the maintainer challenged the lexical heuristic itself ("substring 어미 매칭이면 거의 의미가 없는 거 아닌가") and proposed agent-primary extraction: scan targets are usually under 100 documents, a first scan already happens, so let the agent produce the structured result by following a basic product-owned convention/template.
This is the Stop Conditions' "shaping assumption falsified → redesign decision frame" path, reached through maintainer insight plus this session's own evidence rather than an S1 surprise.

Evidence supporting the redesign: the Korean lexicon measurement showed the claim-shaped gate degenerates to a sentence-length detector on formal prose (`니다` is the only NFC-expressible paradigm-covering term, and it matches nearly every declarative sentence); the gold set shows heuristic routing dominant-correct on only 18/35.

Ratified direction:
agent-primary extraction against a product-owned template (claim definition, non-claim conventions from `classification_hints`, mandatory verbatim excerpts with source refs, bounded output schema);
the binary anchors and audits (traversal/scope, verbatim-excerpt anchoring validation, fingerprints from verbatim excerpts, refresh planning, carry-forward, unanchored-claim rejection);
recorded git commits and per-source hashes bound re-extraction to changed sources (maintainer's operational-rhythm note);
the deterministic heuristic extractor stays as an explicitly labeled `extractionMode` baseline for no-model environments, CI regeneration, and control tests;
the gold set is promoted from hint-family scoring device to the agent-extraction eval fixture.

Consequences inside this goal: S3 dissolved; S0 repurposed (verdicts baseline the agent-extraction eval); the S2 term list stays agent-proposed and gates only the baseline mode, so its ratification is deferred rather than pressed.
Realignment landed in the same slice: `docs/contracts/claim-discovery-workflow.md` (direction decision in the Skill Responsibilities and classification-hints sections), `docs/master-plan.md` (claim-family paragraph), this artifact, and the handoff.
The detailed extraction template and packet contract are deliberately NOT designed here; that is the successor design slice with its own shaping.

## Off-Goal Findings

- 2026-06-10: landing the redesign realignment exposed a real refresh-chain bug — review-result replay matched updates by display claimId only, so a one-line master-plan edit silently lost a ratified readiness label (then two more from the same 2026-05-10 packet were found lost by the repair-risk critique).
  Routed through `charness:debug`; root cause, fingerprint-fallback fix, append-only repair packet, and the historical-fingerprint-backfill follow-up live in `charness-artifacts/debug/latest.md` (commit `d68fff3`).
  Goal-relevant side effect: replay identity now matches the contract's fingerprint rule, which the agent-primary extraction direction depends on even more heavily (verbatim-excerpt fingerprints become the only stable claim identity).

## Final Verification

Closeout evidence — replace each `TODO` with a bound `<path>` (a checked-in
retro / host-log probe / disposition-review artifact) or an explicit
`skipped: <allowed-reason>: <detail>`. The complete gate rejects a literal
`TODO` / `<path>` / `TBD` until you do.

Retro: TODO — create or explicitly skip with an allowed reason before complete
Host log probe: TODO — create or explicitly skip with an allowed reason before complete
Disposition review: TODO — create or explicitly skip only when policy allows before complete

## User Verification Instructions

After completion, the fastest honest check is:
run `bin/cautilus discover claims --repo-root ../yt-digest --output /tmp/yt.json` and compare `candidateCount` against the S1 baseline artifact;
then open the latest `charness-artifacts/eval-trust/` measurement artifact and spot-check three ratified labels against the corpus lines they cite;
then run `npm run verify` once.

## Stop Conditions

- A ratification point is reached and the maintainer is unavailable: pause, sync HITL/goal state, end the session honestly (this is the expected rhythm, not a failure).
- S1 falsifies a shaping assumption (e.g., English corpora also extract near nothing): stop slicing, bring the finding back as a redesign decision frame.
- Any engine change fails the adapter-not-hardcoded control test: stop the slice; the boundary is the product.
- Any bug, regression, or unexpected behavior: route through `charness:debug` before fixes, per repo working rules.

## Auto-Retro

Retro dispositions: TODO — disposition every surfaced improvement, or record the explicit no-improvement opt-out
Structural follow-up: TODO — when the retro names a transferable waste item (a `## Sibling Search` trigger), classify its structural destination (`applied: <gate/hook/validator/test/contract change>` / `issue #N (recurs:|novel: <reason>)` / `repo-local guard: <path>` / `none — <reason>`); delete this line when no transferable waste was named
