# Retire the find-skills startup-bootstrap invariant and realign to the catalog-list convention

Status: LANDED 2026-07-16 — full flip complete.
PQ1 resolved to Branch B (no mandatory startup bootstrap): two fresh live captures (claude-sonnet-5) against the realigned AGENTS.md returned `entryFile=AGENTS.md`, `workSkill=charness:impl`, `bootstrapHelper=none` with genuinely differing reasoning, blind-graded (real→sound, constructed control→unsound, `toolUses:0`, judge load-bearing) against the FD7 realigned governing rules.
The harness invariant, standing test, cases prompt, live captures, verdicts, governing-rules source, and the `evaluation.spec.md` / `index.spec.md` / `README.md` / `consumer-readiness.md` promise text are realigned; the flagship badge is restored to freshly-proven.
Deferred per FD5: the FD5-frozen codex-provenance replay claim (`reasoning-soundness-calibration.dev-repo-realsurface-routing.*`, `checked-in-agents-routing.fixture.json`, `internal-runner-fixture-results.json`) and its `emitted_find_skills_bootstrap` code facet stay as historical records of the pre-realignment surface.

This is the realignment that follows the upstream removal of the `find-skills` public charness skill on 2026-07-13.
It retires the `find-skills` startup-bootstrap invariant from Cautilus's behavior-eval flagship and realigns the dev/repo routing surface to the current `charness catalog list` inventory convention.

## Problem

`find-skills` was removed as a public charness skill on 2026-07-13 (upstream retro `find-skills-public-removal`).
It is absent from the installed skill surface, from `charness catalog list`, and from this session's own skill set; the SessionStart hook now routes via `charness catalog list` instead.

Two surfaces in this repo still encode `find-skills` as the mandated startup bootstrap, and they encode it in conflicting ways.

The first is the instruction surface.
`AGENTS.md` §Skill Routing tells every session to "call the shared/public charness skill `find-skills` once before broader exploration" and names `find-skills` output as the routing inventory in three places (lines 57, 60, 68).
That instruction is now impossible to follow: the skill does not exist, so every session — including the one that opened this slice — is told to do something it cannot do.

The second is the proof surface.
The behavior-eval flagship asserts that a live agent, reading this repo's `AGENTS.md`, routes to `find-skills`.
`scripts/on-demand/behavior-eval-live-proof.mjs` hardcodes `STABLE_INVARIANT.bootstrapHelper = "charness:find-skills"`; the standing test, the cases file, both live captures, the blind verdicts, `docs/specs/promises/evaluation.spec.md`, `docs/specs/index.spec.md`, `README.md`, `docs/maintainers/consumer-readiness.md`, and `docs/internal/working-patterns.md` all carry the same token.
So the product currently proves — and publicly promises — that agents route to a skill that no longer exists.

The invariant is downstream of the instruction surface: the live capture's own summary says "CLAUDE.md Skill Routing section explicitly mandates charness:find-skills."
Realigning `AGENTS.md` therefore changes what a fresh live agent does, which is why the proof cannot simply be text-swapped.

## Capability Contract

- Actor: any agent session that reads this repo's `AGENTS.md`, plus a maintainer reading the flagship `Behavior Evaluation` promise.
- Capability delta: a session gets a startup routing instruction it can actually execute (`charness catalog list`, hook-provided or fallback), and the flagship promise asserts an invariant that matches the current convention instead of a removed skill.
- Acceptance boundary: the on-demand live proof drives a real agent against the realigned `AGENTS.md` and asserts the durable invariant on a FRESH capture; the standing spec projects that operator-witnessed capture; the public promise text matches the graded invariant.

## Current Slice

Realign the dev/repo behavior-eval surface off `find-skills` and onto the `charness catalog list` startup-inventory convention, in one coordinated change, gated on an operator-witnessed live re-capture.

The instruction-surface realignment (`AGENTS.md` §Skill Routing) and the durable invariant are fixed now.
The exact new bootstrap shape and the finalized promise wording are resolved by the fresh live capture, not guessed.

## Fixed Decisions

- FD1 — Retire `find-skills` from the live surface; do not re-add it as a repo-owned skill.
  The upstream removal is deliberate; this repo follows it rather than forking a private copy.
- FD2 — Realign `AGENTS.md` §Skill Routing to the current convention now, preserving this repo's intentional custom richness (the `gather`, `quality`, and `release-packaging` critique-packet paragraphs stay; only the `find-skills`-specific startup and inventory sentences change).
  The startup step becomes: pickup follows `docs/internal/handoff.md` `## Workflow Trigger`, otherwise route directly from installed skill metadata and judgment, with the read-only `charness catalog list --repo-root .` inventory when support/integration availability is unclear, provided by the SessionStart hook when installed and by the agent as fallback when absent.
- FD3 — The durable minimum FLOOR the proof asserts is `observationStatus === observed` AND `entryFile === AGENTS.md` AND the agent routes to the correct durable WORK skill (`workSkill === charness:impl` for the impl-task prompt).
  This is the part of the old invariant that survives the removal; `find-skills` was only the specific startup-bootstrap instance of it.
  Be honest that this floor is thin: `entryFile === AGENTS.md` is near-free (the claude runtime auto-loads `CLAUDE.md`, a symlink to `AGENTS.md`) and `workSkill === charness:impl` is prompt-obvious, so once the `find-skills` sub-assertion is gone the load-bearing discrimination sits on the blind reasoning judge, not the deterministic route.
  Whether a startup-inventory sub-assertion returns on top of this floor is NOT decided here; it is PQ1, resolved by the fresh capture.
- FD4 — The live captures and blind verdicts under `fixtures/eval/dev/repo/live/` are real agent self-reports, byte-identity-checked against the graded reasoning (`behavior-eval-live-proof.test.mjs`).
  They MUST be re-captured by a real live run against the realigned `AGENTS.md`; they are never hand-edited.
  This is the operator-gated on-demand step (live agent cost; `npm run proof:behavior-eval:live`), consistent with the prior slice's FD1 cost gating.
- FD5 — Preserve the codex-provenance replay fixtures as honest history.
  The `dev-repo-realsurface-routing` replay fixtures and the `reasoning-soundness-*` / `realsurface-*` captures record what agents actually did under the old `AGENTS.md`; they are historical evidence, not current claims, and are not rewritten (this repeats the prior slice's FD5).
  Their `find-skills` tokens stay; any reader-facing description that presents them as CURRENT convention (not history) is the only thing that moves.
  Exception: the LIVE re-grade needs governing rules describing the NEW convention (FD7), so the frozen `reasoning-soundness-calibration.dev-repo-realsurface-routing.json` — which `behavior-eval-live-verdicts.json` currently points `governingRulesSource` at, and whose `governingRules.startup_bootstrap` is the exact old find-skills sentence being removed — is kept as history but is NOT reused as the live re-grade's governing rules.
- FD6 — The coordinated flip lands together to protect public-promise honesty, with a disclosed-limitation fallback if the paid re-capture cannot be scheduled promptly.
  `AGENTS.md`, the harness invariant, the cases prompt, the re-captured fixtures, the re-graded verdicts, the `evaluation.spec.md` / `index.spec.md` / `README.md` promise text, and the claim packet move in one slice.
  `AGENTS.md` is not flipped in isolation while the badge still reads `proven`, because a realigned instruction surface plus a frozen capture whose own `reasonSummary` quotes "mandates charness:find-skills" would make the `proven` badge counterfactual — worse than the current state.
  But the current state is not merely "upstream-stale": `AGENTS.md` §Skill Routing is unfollowable NOW — every session, including the one that opened this slice, is told to call a skill that does not exist.
  So if the operator-gated live re-capture cannot be scheduled promptly, the fallback is to flip `AGENTS.md` AND demote the flagship badge to a disclosed-stale / historical state (the promise already uses disclosed-limitation lines for the app surfaces) rather than hold a broken instruction hostage to an unscheduled paid run.
- FD7 — The blind judge re-grade gets a realigned live-surface governing-rules source.
  A new (or forked) live calibration/governing-rules artifact describes the catalog-list convention: the `startup_bootstrap`/inventory rule and `work_skill` rule reworded off `find-skills`, and the `emitted_find_skills_bootstrap` code facet renamed/retired to match PQ1's branch.
  `behavior-eval-live-verdicts.json` `governingRulesSource` re-points to it, so the judge grades the fresh catalog-list (or bootstrap-dropped) capture against rules describing the same convention it observed — never against the frozen find-skills rules.

## Probe Questions (resolved by the live re-capture, not guessed now)

- PQ1 — Under the realigned `AGENTS.md` plus the current SessionStart hook, does the live agent issue a distinct startup-inventory call (`charness catalog list`), or does it treat the inventory as hook-provided and go straight to work-skill routing?
  Likely outcome, named honestly: FD2's realigned wording makes the `charness catalog list` call CONDITIONAL ("when support/integration availability is unclear"), and the frozen full-runner calibration capture already shows `firstToolCall: functions.exec_command` (the agent reads the docs first, not a bootstrap skill), so the fresh capture will most plausibly land on the bootstrap-DROPPED branch (`entryFile` + `workSkill` only).
  Branch A (inventory call issued): keep a `bootstrapHelper` sub-assertion pinned to the observed `charness catalog list` token.
  Branch B (no distinct inventory call): drop the mandatory-bootstrap sub-assertion and rest on the FD3 floor.
  Both target skeletons are pre-written in the First Implementation Slice so the post-capture step is a fill-in, not a second design round: `STABLE_INVARIANT` fields, the `assertLiveInvariant` branches, the `test.mjs` "dropped the bootstrap" case, and the load-bearing composite `routePasses` key all fork on this.
  The fresh capture decides; the harness, the cases `expectedRouting`/`allowedFirstToolCalls`, the verdicts `observedRoute`, and the promise headline are finalized to match what was actually observed.
- PQ2 — The judge control currently fabricates that `find-skills` "executes the test suite / validates the routing table" — an objectively-false claim against a no-op-able inventory bootstrap.
  On Branch A (`charness catalog list` inventory), the same read-only-inventory fabrication transfers directly.
  On Branch B (bootstrap dropped), the control must re-anchor its right-route-wrong-reason fabrication onto the WORK-skill route (a false claim about what selecting `charness:impl` does) so the judge still catches a route-correct, reason-fabricated case.
  Either way, confirm the reconstructed control still grades unsound with the judge load-bearing on the fresh capture, graded against the FD7 realigned governing rules.

## Deferred Decisions

- The app-ship surfaces (`app/chat`, `app/prompt`) are untouched; their Proof Debt and limitations are unchanged.
- Whether the cases prompt should evaluate more than one routing behavior is out of this slice; it stays the single impl-task routing prompt, reworded to not presuppose a mandated bootstrap skill.

## Non-Goals

- Re-adding `find-skills` as a local skill (FD1).
- Rewriting the codex-provenance replay fixtures or re-litigating the apex voice (FD5).
- Live-proving app surfaces or adding a live judge per CI run.
- Broad Skill Routing rewrite beyond the `find-skills`-specific sentences (FD2 preserves the custom block).

## Deliberately Not Doing

- Flipping `AGENTS.md` or the public promise before the fresh live capture exists (FD6): an isolated instruction flip would make the public `Behavior Evaluation` promise assert `find-skills` while `AGENTS.md` no longer mentions it — a self-contradiction on a repo whose identity is honest proof badges.
- Hand-editing the live capture `bootstrapHelper`/`reasonSummary` or the verdicts to `charness catalog list` (FD4): that fabricates ground truth the byte-identity test is designed to catch.

## Constraints

- No manufacturing ground truth: the re-captured sound case is a REAL live run; only the control is constructed with an objectively-false fabrication (repeats prior-slice constraint).
- Live re-capture is operator-gated on cost and provenance witness (`Cost And Proof Freshness` governance; prior slice FD1); the standing test requires TWO captures with differing reasoning (`behavior-eval-live-capture.json` + `-rerun.json`), so the re-capture is at least two live runs plus the blind re-grade, not a single ~$0.16 run.
- `AGENTS.md` is a claim-source file; after it changes, run `npm run claims:refresh:all` before push (its `isStale` flag forces strict equality otherwise).
- Bounded critique is delegated to a fresh-eye subagent, never a same-agent pass (repo Subagent Delegation contract).

## Success Criteria

- SC1 — `AGENTS.md` §Skill Routing no longer instructs any session to call `find-skills`; it names the `charness catalog list` startup-inventory convention and preserves the repo's custom `gather`/`quality`/critique-packet paragraphs.
- SC2 — `npm run proof:behavior-eval:live` drives the live agent against the realigned `AGENTS.md` and asserts the FD3 durable invariant on a FRESH capture; it fails loudly if the agent stops orienting on `AGENTS.md` or stops routing to the correct work skill.
- SC3 — No surface asserts or promises `charness:find-skills` as a CURRENT routing invariant: the harness `STABLE_INVARIANT` and error strings (`behavior-eval-live-proof.mjs`), the standing test (`behavior-eval-live-proof.test.mjs`), the cases file, the re-captured live captures, the verdicts and their FD7 realigned `governingRulesSource`, `evaluation.spec.md`, `index.spec.md`, `README.md`, `consumer-readiness.md`, and `working-patterns.md` all reflect the observed post-realignment shape.
- SC4 — The fresh capture pinned in the standing spec/test is byte-identical to the live capture the blind judge graded (provenance honesty), and the re-graded control still grades unsound with the judge load-bearing (PQ2).
- SC5 — `npm run lint:specs`, `npm run verify`, and `npm run test:on-demand` stay green after the flip.
  On Branch B the apex/promise text is updated to state honestly that the deterministic route floor is thin and the blind reasoning judge is the discriminating gate (not silently kept as "unchanged except for the retired token"); the badge scope and Proof Debt boundary otherwise stay as-is.

## Acceptance Checks

- AC1 — `eval` (live; on demand): `npm run proof:behavior-eval:live` exits 0 and asserts `entryFile === AGENTS.md` and the FD3 work-skill route on a freshly produced capture against the realigned `AGENTS.md`.
- AC2 — `unit` (deterministic; standing): `node --test scripts/on-demand/behavior-eval-live-proof.test.mjs` holds the FD3 invariant on the re-captured checked-in capture; the verdicts carry live → sound and control → unsound with `tool_uses: 0`; the always-sound-judge composite still fails the control; the control fabricates a behavior the governing rules do not support (PQ2).
- AC3 — `specdown` (deterministic; on demand): `npm run lint:specs` is green with the realigned `evaluation.spec.md` check tables projecting the re-captured captures and re-graded verdicts, and `docs/specs/index.spec.md` badge text no longer says `find-skills`.
- AC4 — `unit` (deterministic; standing): `grep -rn "find-skills" AGENTS.md docs/specs docs/contracts README.md docs/maintainers/consumer-readiness.md docs/internal/working-patterns.md scripts/on-demand scripts/agent-runtime fixtures/eval/dev/repo/live` returns only historical-context references (FD5) and this contract, with no CURRENT-convention or CURRENT-invariant assertion of `find-skills` — in particular none in the harness (`STABLE_INVARIANT`, error strings), the standing test, or the re-captured live fixtures/verdicts.
- AC5 — `manual`: `npm run claims:refresh:all` regenerates `.cautilus/claims/latest.json` against the flipped HEAD and the packet is no longer stale.

## Boundary Ownership

`moved-to-owner`.
The instruction surface (`AGENTS.md`) is owned by the repo host-doc policy; the durable proof invariant is owned by `docs/contracts/behavior-eval-live-proof.md`, which this contract updates rather than replaces; the fixtures are owned by the live proof harness.
No logic moves into the generic Go engine or the runtime runner; the invariant token and judge logic stay adapter/SOT-owned.
This contract is a slice contract that hands its closed decisions back to `behavior-eval-live-proof.md` (FD3/PQ2/SC1/AC1 there are superseded by this realignment once the flip lands).

## Critique

Bounded fresh-eye subagent critique (delegated, read-only, Sonnet) returned READY-WITH-EDITS with one blocker-severity finding; all edits are folded.
- Blocker → FD7: the blind re-grade had no realigned governing-rules source — `behavior-eval-live-verdicts.json` `governingRulesSource` points at `reasoning-soundness-calibration.dev-repo-realsurface-routing.json`, whose `governingRules.startup_bootstrap` is the exact old find-skills sentence, and FD5 froze it; re-grading a catalog-list capture against frozen find-skills rules is contradictory, so FD7 carves a realigned live governing-rules source out of the freeze.
- FD3-vs-PQ1 contradiction resolved: FD3 is now the "minimum floor" and honestly flags the floor is thin (entryFile near-free, workSkill prompt-obvious → the reasoning judge is the discriminating gate); the bootstrap sub-assertion is PQ1's to resolve.
- FD6 now names the current state as unfollowable-NOW (not merely stale) and adds a disclosed-limitation fallback if the paid re-capture slips.
- PQ1 owns the likely bootstrap-DROPPED branch (FD2's conditional wording + the exec_command-first calibration capture) and pre-writes both skeletons; PQ2 re-anchors the control onto the work-skill route on Branch B.
- AC4 grep widened to the harness/test/live-fixture files that actually carry the token; the cost line notes the re-capture is ≥2 live runs plus re-grade.
The reviewer confirmed the coordinated-flip default and the find-skills retirement direction are sound, with no product-direction reopen.

## Canonical Artifact

This file during the build.
At closeout, the durable evidence record is a new `charness-artifacts/eval-trust/` entry pinning the re-captured provenance, mirroring `2026-06-19-behavior-eval-live-proven.md`.

## First Implementation Slice

1. On a working branch, realign `AGENTS.md` §Skill Routing per FD2 (SC1) and reword the cases prompt to not presuppose a mandated bootstrap skill.
2. Author the FD7 realigned live governing-rules source (fork the frozen calibration into a live-convention file; rules and code-facet reworded off `find-skills`) and pre-write BOTH invariant skeletons (PQ1 Branch A / Branch B) in `behavior-eval-live-proof.mjs` / `test.mjs` so step 4 is fill-in only.
3. Run `npm run proof:behavior-eval:live` (operator-gated; ≥2 runs) to produce the fresh captures and observe PQ1's actual branch.
4. Select the matching skeleton and set `STABLE_INVARIANT`, the cases `expectedRouting`/`allowedFirstToolCalls`, the two re-captured live captures, the re-graded verdicts, and their re-pointed `governingRulesSource` (FD7) to the observed shape (FD4); update the `test.mjs` error strings and the control fabrication matcher (PQ2).
5. Update the `evaluation.spec.md` headline + check tables, `index.spec.md`, `README.md`, `consumer-readiness.md`, `working-patterns.md`, and the superseded-decision note in `behavior-eval-live-proof.md`.
6. `npm run claims:refresh:all`, then `npm run lint:specs` / `npm run verify` / `npm run test:on-demand` green (SC5).
7. Bounded fresh-eye critique on the landed flip before closeout.
</content>
</invoke>
