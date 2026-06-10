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

- Current slice: S2 (claim-lexicon hint family) — proposal pending maintainer ratification; S1 complete.
- Next action: ratify the S2 hint-family matching semantics and initial Korean lexicon proposal, then wire engine+test+contract+spec.
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
| S0 | Resume gold-set HITL (c02 onward) in maintainer-sized batches | Ratified labels feed S3 routing hints; queue is paused resumable state | Verdicts in gold-set JSON, HITL artifact synced | pending |
| S1 | Baseline measurement on the three corpora with today's engine | Establishes the language gap and English-corpus shape before any hint design | Per-corpus artifact: counts, samples, near-zero yt-digest extraction | done |
| S2 | Claim-lexicon hint family (adapter-owned terms; agent proposes from corpus scan; maintainer ratifies) | Largest portability gap; promotion bar met once S1 evidence exists | Engine+test+contract+spec; yt-digest extracts claims via ratified hints | pending |
| S3 | Proof-routing hint family from the ratified gold set (per-facet recommendedProof vocabulary) | Gold-set evidence already exists; corrects the most expensive misroutes | Engine+test+contract+spec; fresh run re-tags the clear misroutes | pending |
| S4 | Absorb hardcoded `Deferred Decisions` into `non_claim_section_headings` portable defaults | Removes the parallel mechanism; small bounded cleanup | Hardcoded branch deleted; behavior pinned by existing+new tests | pending |
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

## Context Sources

- `docs/contracts/claim-discovery-workflow.md` — classification-hints contract, matching semantics, promotion criteria and priority inventory (the roadmap this goal executes).
- `docs/contracts/facet-decomposition.md` — redefined Next Step (adapter-owned hints absorb per-facet routing; no dominant field).
- `charness-artifacts/eval-trust/2026-06-10-recommendedproof-facet-gold-set-proposal.md` + `.json` — proposed labels, portability boundary, external-validity caveat; the ratification harness for hint proposals.
- `.charness/hitl/runtime/hitl-20260609-235609/` — paused HITL session (queue, state, scratchpad; c01 accepted, cursor at c02).
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

## Off-Goal Findings

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
