# Achieve Goal: Clear the apex Proof Debt: declared -> live-proven on confirmed scenarios

Status: draft
Created: 2026-06-09
Activation: `/goal @charness-artifacts/goals/2026-06-09-clear-proof-debt-live-proven.md`

This file is the living goal scratchpad. It becomes active only when the user
runs the activation command.

## Active Operating Frame

- Current slice: Slice 3 — operator agreed A/B/C ("추천대로"); swap APPLIED (`dd3f5e6`: real capture replaces hand-authored stand-in, namespaced expected, deterministic replay passes accept-now). BUT applying it honestly surfaced a structural gap: a LIVE dev/repo run fails because the runner isolates CODEX_HOME and excludes `.agents/skills/`, so `find-skills` is unavailable to the agent under test. Behavior Evaluation badge therefore NOT flipped to clean `proven`. Live-gap RCA was recorded in a legacy debug note later removed during artifact cleanup.
- Slice 3 RESOLVED via HITL (maintainer personally verified the anchor): (a) runner fixed to provision the installed charness surface (`426c421`, find-skills now available live); (b) HITL walkthrough of WHAT/HOW corrected my namespace claim (scorer already leaf-normalizes — no scorer change needed) and confirmed the only real instability is the handoff-dependent work skill; (c) fixture made robust — dropped the workSkill pin, asserts only the stable invariant (AGENTS.md -> find-skills bootstrap); (d) maintainer chose to HOLD the apex Behavior Evaluation badge at `declared`, NOT flip to a thin-proxy "proven". HITL record: `charness-artifacts/hitl/latest.md`.
- KEY DIRECTIONAL FINDING (DF-2, promoted): the whole eval is skewed all-deterministic; the `cautilus-eval` (evaluator/intelligence) tier collapsed into code. Badge stays `declared` until code+intelligence harmony is designed. Finding: `charness-artifacts/findings/2026-06-09-determinism-intelligence-eval-skew.md`. This reshapes the discover-driven eval design and likely supersedes simple badge-flipping as the goal's center of gravity.
- Runner assessment (`dev-repo-self-dogfood.assessment.json`) is now stale (hashed fixture files changed) and intentionally NOT re-stamped — left honest until the design direction settles.
- Slice 2 (Host Ownership) advanced autonomously: ran the deterministic `consumer:onboard:smoke` fresh — green (`ok:true`, first bounded run reaches accept-now; eval self-reports `proofClass: declared-eval-runner`, `productProofReady:false`). Fresh proof saved at `charness-artifacts/eval-trust/2026-06-09-slice2-consumer-onboard-smoke.proof.json`. Remaining for slice 2: transform into a stable checked-in proof + rewrite `ownership.spec.md` to assert on it + flip badge — held for operator sign-off (user-facing apex spec; not flipping badges while operator is away).
- Proposal staged (not applied): `charness-artifacts/eval-trust/2026-06-09-slice3-dev-repo-routing-trusted-fixture.proposal.md` — found the checked-in dev/repo result is hand-authored and diverges from a real 2026-05-04 codex capture; proposes swapping in the cleaned real observation + namespaced expectedRouting. Real fixture unchanged pending agreement.
- GOAL PIVOT (2026-06-09): the original "flip declared -> proven" frame is premature. The session proved that flipping badges on thin deterministic proxies just reproduces the hollow proof the maintainer distrusted. The center of gravity moved to building the honest eval first: [docs/contracts/eval-judge-collaboration.md](../../docs/contracts/eval-judge-collaboration.md) (maintainer-agreed design: intelligence as independent log-observer + code as deterministic comparator, judge disciplined by a calibration set). Slices 4-8 (flip more badges) are DEFERRED behind that design.
- Next action (next session): prototype the reasoning-soundness judge on the dev/repo anchor per the design doc's "Next step" — intelligence reads the run log, extracts `reasoning_soundness` against AGENTS.md, code checks a threshold; calibrate with 3-5 known sound/unsound cases first. Only after that can the dev/repo badge move past `declared`.
- Timebox: open-ended (no host timebox set); the operator may set one at activation.
- Activation time: set at `/goal` activation.
- Closeout reserve: reserve the final slice for honest badge updates in the apex plus one full `specdown run` + `npm run verify`.
- Done-early policy: continue_next_improvement
- Verification cadence: cheap deterministic checks at commit boundaries;
  live single-spec runs at slice boundaries; final broad/live proof at closeout.
- Slice review packet: before fresh-eye slice critique, provide intent, changed
  files and owning/generated surfaces, expected invariants, tests/proof,
  non-claims, out-of-scope lines, and reviewer questions.
- History boundary: keep this frame current; move completed detail to
  `## Slice Log`, `## Final Verification`, and `## Auto-Retro`.

## Discuss before activation

Discuss before activation: RESOLVED 2026-06-09 — proof model is prove-then-project onto a co-created, operator-trusted fixture; live-agent runtime is out (cost); the real work is co-creating a proper fixture by mutual agreement.

Two operator decisions (in transcript) reshape the proof model below:

1. **Proof model = prove-then-project onto a TRUSTED fixture, not in-spec live execution.** The operator's distrust was never of projection itself — it was of projecting an *auto-generated, self-declaring* bundle (the retired 5/3 `declared-eval-runner` snapshot). A fixture/proof the operator genuinely trusts may be proven out-of-band and projected into the spec; the badge is honestly `proven` when it rests on that trusted fixture.
2. **Live-agent runtime is OUT for this work (cost).** No `--runtime codex/claude` in-loop agent driving. Proof rests on deterministic fixture-backend runs over trusted fixtures.
3. **The bottleneck and the real work is co-creating a "proper" fixture by mutual agreement** (operator + agent), surface by surface. "Owner-confirmed" now means *co-developed and explicitly trusted*, not merely "named from the existing pile."

Original constraints, still in force:

- **Owner-confirmed (now: co-created + trusted) scenarios (hard constraint).** A surface reaches `proven` only on a fixture the operator and agent co-developed and the operator explicitly trusts. Do not fall back to the retired 2026-05-03 self-declaring bundles.
- **Honesty regression.** If a trusted-fixture proof shows a behavior does NOT actually pass, the badge stays `declared`/`promised` and the failure routes to `charness:debug`; never flip a badge to hide a real gap. The fixture-backend packet self-reports its `proofClass` (e.g. `fixture-smoke`, `productProofReady:false`); the badge must not over-claim past what the packet reports.

## Goal

Move each promise in the apex `docs/specs/index.spec.md` from its current honest-but-weak badge to an honest `proven` badge. Per the operator decisions above, `proven` means: the spec projects a fixture/proof the operator and agent **co-developed and explicitly trust**, the spec asserts on that artifact, and the badge claims no more than the artifact's own self-reported `proofClass`. The distinction from today is TRUST + MUTUAL AGREEMENT (a co-created fixture) replacing the retired auto-generated self-declaring 5/3 bundle — not in-spec live execution (out) and not live-agent driving (out, cost). This is the real dogfood: prove Cautilus's own eval/improve claims on a fixture the operator actually believes. Each promise that reaches trusted-fixture proof gets its badge updated honestly and its row removed from the apex Proof Debt table.

## Non-Goals

- Building the generator (cautilus-agent generating this apex from `cautilus discover` JSON for any consumer repo). Track separately; not this goal.
- Forcing specdown onto consumer repos. The generic contract stays claim+evidence; specdown is Cautilus-repo's own prover.
- Re-litigating the apex voice/structure (settled this session) or the canonicalization-precision finding (separate backlog).
- Resolving corca-ai/charness#340 (specdown support-skill discoverability) — already filed, out of scope.
- Reaching `proven` on a surface that has no owner-confirmed scenario — stop and report instead.

## Boundaries

- External side-effect scope: name which phase or bundle any approved
  publish / push / remote-CI / apply applies to. That approval is phase-scoped
  and does not carry forward — after an approved publish/CI/apply lane
  completes, done-early test-only quality continuation is local by default
  (batch remote proof, run CI once over the final bundled state). Per-slice
  remote publication is assumed only when the operator explicitly asks or a
  runtime-affecting slice requires earlier publication.
- Proof must be LIVE per the apex "How Proof Works Here" law: run the scenario and assert on the produced packet/file, or stop. Projection of a saved bundle is not an acceptable closing state for a `proven` badge.
- Touch only the named spec pages and the apex badge/Proof-Debt rows; do not restructure the spec tree.
- Push is out of scope for `achieve` itself; the operator pushes.

## User Acceptance

Open `docs/specs/index.spec.md`. Each promise that this goal closed shows `proven`, and following its proof link lands on a spec that, when run with `specdown`, executes the real behavior (a live `cautilus` invocation, not a `jq` over a checked-in `evidence-*.json`). The Proof Debt table contains only items the operator explicitly chose to defer. `npm run lint:specs`, `npm run lint:links`, and a full `specdown run` are green.

## Agent Verification Plan

### Low-Cost Checks

- `npm run lint:specs` and `npm run lint:links` at commit boundaries.
- Per-spec live-vs-projection grep: confirm the touched spec now runs `./bin/cautilus` / `$bin` rather than only `jq`-ing a checked-in `evidence-*.json`.

### High-Confidence Checks

- Run the single touched spec live via `specdown run -filter <heading>` at each slice boundary; confirm it executes the behavior and the assertion is on freshly produced output.

### External Or Live Proof

- Final: full `specdown run` (43+ specs) and `npm run verify` at closeout.
- Host Ownership slice: `npm run consumer:onboard:smoke` wired into the spec.
- Name any proof level not run in the final report; do not claim live proof when only projection ran.

## Slice Plan

| Slice | Objective | Why Now | Expected Evidence | Status |
| --- | --- | --- | --- | --- |
| 1 | Repro + fix the render bug (real cause: specdown never renders `run:shell` stdout) | Cheapest; makes the strongest proven promise (Readiness) render trustworthily; unblocks reading specdown output | DONE (31d27c7): minimal repro proved stdout is never rendered; cat block -> asserted doctest; Readiness now shows the named adapter inline | done |
| 2 | Host Ownership -> proven | Lowest-cost proof win: a deterministic `consumer:onboard:smoke` already exists (no agent), just unwired | `ownership.spec.md` projects a smoke-proof the operator trusts + asserts; badge -> proven | pending |
| 3 | **Co-create the first trusted eval fixture by mutual agreement (HITL)** | The real bottleneck per operator: a fixture the operator genuinely trusts, not the auto 5/3 bundle. dev/repo flagship ("agent follows AGENTS.md routing") is the README headline dogfood and small | A co-developed `cautilus.evaluation_input.v1` fixture the operator explicitly trusts (scenario, criteria, recorded outputs all agreed); out-of-band fixture-backend proof | pending (current) |
| 4 | Behavior Evaluation -> proven (project the trusted fixture) | Once a trusted fixture exists, project its out-of-band proof | `evaluation.spec.md` projects the trusted-fixture proof + asserts + badge claims only the packet's self-reported `proofClass` | pending (needs slice 3) |
| 5 | Bounded Improvement -> proven | Differentiated claim; needs a co-created held-out trusted fixture (deterministic, no agent) | `improvement.spec.md` projects a trusted held-out improve proof + asserts | pending |
| 6 | Reviewable Artifacts -> proven | Regenerate packets from the trusted-fixture proof instead of the 5/3 bundle | `reviewable-artifacts.spec.md` projects regenerated packets + asserts shape | pending |
| 7 | A Testable Agent: author spec | Currently promised/no spec | runner-readiness/verification-backed spec + proof link | pending |
| 8 | Closeout: honest badge + Proof Debt update; full `specdown run` + `verify` | Reserve | apex badges match reality (no over-claim past `proofClass`); gates green | pending |

Generative order (Alexander): slice 1 done (cheap de-risk). Slice 3 (co-create a trusted fixture) is now the highest-leverage and the originating reason for the goal — it is collaborative (HITL, mutual agreement), so it cannot be unilaterally completed; slices 4–6 project its proof once it exists.

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
- **Gather step** — when `## Context Sources` names an external source
  (URL / Slack / Notion / Docs / Drive), add a `Gather:` line here pointing at the
  gathered asset, or write `Gather: n/a — <reason>` when no external context
  applies.
- **Release step** — when this run touches a release surface (a version bump or
  install-manifest edit), add a `Release:` line here pointing at the release
  proof, or write `Release: n/a — <reason>`.
- **Issue closeout step** — when this goal resolves tracked GitHub issues, add
  an `Issue closeout:` line naming the close-intended issue numbers, carrier
  (`direct-commit`, PR body, release commit, or manual fallback), and
  `issue_tool.py validate-closeout-draft` / `verify-closeout` proof. If a
  tracked issue appears in `## Context Sources` as context only, use
  `Issue closeout: n/a — <reason>`.

## Slice Log

### Slice 1: Slice 1 — render bug repro + fix (Readiness adapter display)

- Objective: Make the Readiness spec render the repo-owned adapter instead of a bare variable-binding line; confirm the true root cause via minimal specdown repro.
- Why this approach: Cheapest de-risk; Readiness is the strongest proven promise so its render must be trustworthy. Routed via charness:debug per AGENTS.md + goal Slice 1.
- Commits: 31d27c7
- What changed: docs/specs/user/doctor-readiness.spec.md (cat block -> doctest showing repo/version + evaluation_surfaces, asserted); debug artifact RESOLVED with final RCA.
- Alternatives rejected: Remove leading comment (prior 'corrected direction') — REJECTED: falsified by repro, stdout is never rendered for run:shell regardless of comment. Full-YAML doctest — rejected as too verbose for the newcomer-voiced page.
- Targeted verification: Live single-spec: specdown run -filter 'repo-owned adapter' PASS (2/2); HTML now renders 'repo: sample-skill-repo' + evaluation surface inline. Cheap: lint:specs 42, lint:links 436, specdown dry-run 43 specs/169 cases.
- Test duplication pressure:
- Critique: n/a — slice-level critique reserved; diagnosis self-verified by minimal repro in both directions (plain block shows no stdout; doctest does).
- Off-goal findings: The '# Show ...' caption wording on ~24 check-backed run:shell blocks is a misnomer (blocks don't show output; adjacent check tables carry the proof). Readability nit, not a render defect — recorded in debug Sibling Search as a deferred voice-pass follow-up, not filed as an issue.
- Lessons carried forward: Routing: charness:debug. specdown authoring rule for this repo: to show a reader output, use a doctest or check table; never a plain run:shell stdout.
- Metrics:

## Context Sources

Durable references this goal was shaped from. A fresh session can reconstruct
the originating context by following them in order.

- `docs/specs/index.spec.md` — the apex with the Proof Debt table this goal clears.
- `charness-artifacts/findings/2026-06-08-canonicalization-precision-root-finding.md` — why the proof felt hollow (the upstream finding).
- Legacy debug note for the doctor-readiness adapter YAML render issue — slice 1 parked debug lead; removed during artifact cleanup.
- `docs/specs/user/{doctor-readiness,claim-discovery,evaluation,improvement,reviewable-artifacts,evidence-gaps,ownership}.spec.md` — the per-promise specs.
- Audit facts (this session): only `doctor-readiness` (28 live markers) and `claim-discovery` (mixed) run live; `evaluation/improvement/reviewable-artifacts/evidence-gaps/ownership` project saved 2026-05-03 bundles; the eval bundle's proof is `proofClass: declared-eval-runner`.
- Issue: corca-ai/charness#340 (specdown support-skill discoverability) — context only, out of scope.

## Interview Decisions

- Scope of "proven" (SUPERSEDED 2026-06-09 by operator): initially chose live-executable-only (run the behavior in-spec + assert), rejecting projection. The operator overrode this: projection IS acceptable when the projected fixture is co-created and genuinely trusted; the original distrust was of the auto-generated self-declaring 5/3 bundle, not projection per se. New scope: prove-then-project onto a trusted, co-created fixture; badge claims only the packet's self-reported `proofClass`.
- Live-agent runtime (2026-06-09, operator): OUT for this goal due to cost. Proof rests on deterministic fixture-backend runs over trusted fixtures, not `--runtime codex/claude` agent driving. Surfaced after the fixture-backend packet self-reported `proofClass: fixture-smoke`, `productProofReady: false`, `runnerAssessmentState: missing-assessment` — confirming the binary itself does not treat a fixture run as product-ready proof.
- Co-creation as the real work (2026-06-09, operator): the bottleneck is a "proper" fixture built by mutual agreement, not running more evals. Slice 3 is therefore a collaborative HITL fixture build, starting from the dev/repo flagship, that the operator must explicitly trust before any badge flips.
- Sequencing: chose cheapest-first / de-risk-first (render bug, Host Ownership) before the hard eval/improve proofs. Rejected hardest-first because cheap wins build confidence and the apex already reads honestly in the meantime.
- Owner-confirmed scenarios: chose to gate eval/improve slices on explicit operator confirmation (Discuss-before-activation) rather than letting the agent pick scenarios. Rejected agent-picks because the maintainer's distrust of unconfirmed scenarios is the originating reason for this goal.

## Plan Critique Findings

To be folded during the run. Pre-activation note: slice 3 (Behavior Evaluation live proof) is the riskiest — converting declared->live may reveal the behavior does not actually pass; it carries a Discuss-before-activation gate and a slice-level critique requirement.

## Off-Goal Findings

Issues or deferred findings discovered during the run.

## Final Verification

Closeout evidence — replace each `TODO` with a bound `<path>` (a checked-in
retro / host-log probe / disposition-review artifact) or an explicit
`skipped: <allowed-reason>: <detail>`. The complete gate rejects a literal
`TODO` / `<path>` / `TBD` until you do.

Retro: TODO — create or explicitly skip with an allowed reason before complete
Host log probe: TODO — create or explicitly skip with an allowed reason before complete
Disposition review: TODO — create or explicitly skip only when policy allows before complete

## User Verification Instructions

To be written at closeout.

## Auto-Retro

Retro dispositions: TODO — disposition every surfaced improvement, or record the explicit no-improvement opt-out
Structural follow-up: TODO — when the retro names a transferable waste item (a `## Sibling Search` trigger), classify its structural destination (`applied: <change>` / `issue #N (recurs:|novel:)` / `repo-local guard: <path>` / `none — <reason>`); delete this line when no transferable waste was named
