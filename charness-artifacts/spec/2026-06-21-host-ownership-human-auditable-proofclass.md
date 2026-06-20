# Spec — Host Ownership → proven via a `human-auditable` proof class

Status: contract (pre-impl). Canonical during implementation.
Track: A (apex Proof Debt). Maintainer-chosen sub-item: **Host Ownership**.
Date: 2026-06-21.

## Problem

The apex (`docs/specs/index.spec.md`) carries **Host Ownership — declared**.
The Proof Debt line says: *"wire the existing `consumer:onboard:smoke` live run into the spec."*
That run exists (`scripts/on-demand/smoke-external-consumer.mjs`) and would prove the promise end-to-end (install → adapter init → doctor ready → one bounded eval in a fresh external git repo, with host-owned adapter/fixture/runner).

The blocker is a **taxonomy gap**, not missing evidence.
A badge's `observedStatus` is driven by its registry `proofClass`
(`scripts/agent-runtime/surface-audit-lib.mjs`):

- `deterministic` → proven (the behavior re-runs every gate)
- `live-replayed` → proven (operator-witnessed **agent** capture **+ blind judge verdict**, opt-in agent re-run)
- `projected-bundle` → **declared** (saved bundle, not re-run live)
- `none` → promised

The onboarding smoke is a **live integration run with no agent and no blind judge**
(install/init/doctor + a fixture-backed eval).
It fits **neither** proven sub-kind: not `deterministic` (too heavy to re-run every gate),
not `live-replayed` as defined (no agent, no judge).
So it cannot honestly reach `proven` under today's taxonomy.

### Root finding (why this is principled, not a hack)

The product already has a **claim-proof-route taxonomy** used by `cautilus discover claims`
(`internal/runtime/claim_extraction.go:142`, live across 174/119/105 tagged claims):

- `deterministic` — a static repo-owned check makes the claim true
- `cautilus-eval` — true only via model/agent/prompt/skill/workflow/behavior execution (needs the eval/judge tier)
- `human-auditable` — no automated check could settle it; an operator reads/witnesses and **vouches** (a deliberate cost-vs-rigor tradeoff: you *could* build a deterministic or judge proof, but it is disproportionately costly, so a named operator's guarantee is the accepted, re-auditable standard)

The bridge between the two taxonomies already exists and **documents the exact gap**
(`scripts/agent-runtime/goldset-projection-lib.mjs:38-47`):

```js
// The two are distinct axes ... `human-auditable` has no registry counterpart,
// so a badge whose ratified route is human-auditable surfaces as a divergence.
export const ROUTE_TO_PROOF_CLASS = {
	deterministic: "deterministic",
	"cautilus-eval": "live-replayed",
	"human-auditable": null,        // ← the documented gap
};
```

So the apex proof-class enum **conflates two orthogonal axes** into one word
(`live-replayed` = "cautilus-eval verdict" **and** "replayed freshness"),
and it is **missing the third verdict mode** (`human-auditable`) that the product's own
claim taxonomy already treats as first-class.
`consumer:onboard:smoke` is precisely a `human-auditable` proof, which is why it had no home.

## Current Slice

Realign the apex proof-class vocabulary to the product's own claim-route vocabulary
(closing the `human-auditable: null` gap), then use the new `human-auditable` proven mode
to move **Host Ownership** from `declared` to `proven`, wired to a checked-in,
operator-witnessed `consumer:onboard:smoke` capture.

Two axes, made explicit:

- **verdict mode** (`proofClass`): `deterministic` / `cautilus-eval` / `human-auditable` — the three proven modes, identical to the discover route vocabulary.
- **freshness** (already a separate `Freshness` column in `audit.spec.md`): runs-every-gate / replayed; live re-run opt-in / projected / none. This is where the old `live-replayed`'s "replay + opt-in re-run" meaning lives on, as a cadence descriptor rather than a category the reader must memorize.

## Fixed Decisions

1. **Proof tier for the onboarding smoke = `human-auditable`.**
   Honesty rests on a *named operator who ran it and vouched* plus a *re-auditable, re-runnable capture* — not on an automated judge.
   The badge prose must state plainly: no agent, no blind judge; operator-vouched; re-run via `npm run consumer:onboard:smoke`.

2. **Rename apex proof class `live-replayed` → `cautilus-eval`.**
   Same provenLevel (`proven`), same meaning content (operator-witnessed agent capture + blind judge, opt-in agent re-run), new name that matches the discover route vocabulary.
   The "replay / opt-in live re-run" cadence stays in the `Freshness` column.

3. **Add apex proof class `human-auditable`** with `provenLevel: "proven"`.
   Meaning: an operator witnessed the live run and vouches; the gate replays the checked-in capture; the live re-run is opt-in. No automated judge — accepted because a full deterministic/eval proof would be disproportionately costly.

4. **`ROUTE_TO_PROOF_CLASS` becomes the identity map.**
   `{deterministic: "deterministic", "cautilus-eval": "cautilus-eval", "human-auditable": "human-auditable"}`.
   The documented gap comment is removed; the route vocabulary and the proofClass vocabulary are now one vocabulary.

5. **`projected-bundle` and `none` stay unchanged** (lower realization tiers, no verdict-mode counterpart — a claim's recommended route is always one of the three verdict modes; these two describe realization incompleteness).

6. **Host Ownership registry route:** `proofClass: projected-bundle → human-auditable`;
   `evidence` → the new checked-in onboarding capture file(s) only (matching the Behavior Evaluation precedent, whose registry evidence is its live captures only);
   `liveOptInCommand` stays `npm run consumer:onboard:smoke`.
   The current adapter-discovery and durable-packets 2026-05-03 bundles may remain as **supporting** projected checks inside `ownership.spec.md`, but they leave the registry evidence list (they are not the badge's load-bearing proof).

7. **Accepted non-gating divergence.**
   Host Ownership's T1 headline claim (`claim-readme-md-6`, "ships as a standalone binary installable without copying a scaffold") is ratified-routed `deterministic`.
   With `proofClass = human-auditable`, the read-only reconciliation keeps a `route-class-mismatch` for this badge (it was already mismatched as `projected-bundle`).
   This is **honest and non-gating** by design (`projected-claim-state.md:60`).
   We accept it: the onboarding smoke proves the *full* host-ownership promise (a fresh external consumer keeps execution), which is broader than the narrow deterministic install fact in the headline claim.
   Rejected alternative documented below.

8. **No behavior status flips in Slice 1.**
   The rename keeps Behavior Evaluation and Bounded Improvement `proven` (claimed=proven, observed from `cautilus-eval` = proven). Audit summary counts are unchanged after Slice 1 (proven 4, declared 2, promised 1). Only Slice 2 flips a badge.

## Probe Questions

- **P1 — capture schema + path.** Default: write `fixtures/eval/consumer/onboard/live/consumer-onboarding-live-capture.json` (mirrors `fixtures/eval/dev/repo/live/...`), with a `provenance.kind` such as `operator-witnessed-onboarding`, and stable json paths for the load-bearing invariant: doctor `ready === true`, first bounded eval `recommendation === "accept-now"`, and host-owned runner/adapter presence. Confirm exact field names while implementing so `ownership.spec.md` can assert substantively (the audit requires evidence to be referenced **and** substantively asserted — a value-bearing `equals`/`includes` on a field other than `schemaVersion`).
- **P2 — single capture vs capture+rerun.** Default: **single** operator-witnessed capture. The invariant is deterministic once executed (no model variance), so the behavior-eval `capture + rerun + verdicts` triple is unnecessary; one capture + the on-demand replay test is enough. Revisit only if the smoke proves flaky.
- **P3 — does any other gate read the renamed class string?** Default assumption from search: `surface-audit-lib`, `surface-registry.json`, `goldset-projection-lib`, the apex How-To-Read bullet, and two node test files. Confirm during Slice 1 that regenerating `audit.spec.md`, the goldset inventory, and `projected-claim-state.md` clears `audit:surface:check`, `lint:specs`, and `specdown:project:check`.

## Non-Goals / Deliberately Not Doing

- Not flipping any badge other than Host Ownership.
- Not re-running the app/chat live agent, app/prompt product runner, A Testable Agent spec, or Reviewable Artifacts live regeneration (separate Track A items).
- Not "fixing" the behavior-evaluation / bounded-improvement reconciliation mismatches (their T1 headline claims are human-auditable principle claims; that is a separate, pre-existing, non-gating condition).
- Not making `consumer:onboard:smoke` run inside the default `npm run verify` (it stays on-demand; the gate replays the checked-in capture).

## Rejected Alternatives

- **Generalize `live-replayed` to drop the agent/judge guarantee** (so the smoke fits the existing class). Rejected: it would weaken a definition that Behavior Evaluation and Bounded Improvement depend on, and it would leave the apex vocabulary diverged from the discover vocabulary (the reader still learns two languages). The two-axis split keeps both intact.
- **Prove Host Ownership `deterministic` over this repo's own production adapter, every gate** (cheapest, would make the headline claim `aligned`). Rejected as the *badge* proof because it proves only a narrow self-install fact, not a fresh external consumer keeping execution; the maintainer chose the broader operator-vouched proof. May be added later as a complementary deterministic sub-check that would also resolve the FD7 divergence.
- **Invent a fresh `live-integration` class.** Rejected: it re-names a category the product already owns (`human-auditable`); reusing the existing vocabulary is the honest, lower-vocabulary move.

## Constraints

- `human-auditable` proven badges must be self-honest: the apex prose and badge copy must say "operator-vouched, no automated judge" and link the re-runnable command and the checked-in capture. Do not let a `human-auditable` badge read as if it carried machine or judge rigor.
- Keep `lint:specs` ON and never weaken the gold-set lint.
- Claim sources change (`docs/specs/**`, apex) → `npm run claims:refresh:all` before push so `claims:source-freshness:check` passes.
- Bug/error/regression during impl → route to `charness:debug` before further fixes.

## Success Criteria

1. The apex declares exactly **three** proven verdict modes (`deterministic`, `cautilus-eval`, `human-auditable`), and the audit observes Behavior Evaluation + Bounded Improvement as `cautilus-eval`-proven with no status change.
2. Host Ownership is `proven` on the apex, observed `proven` by its `human-auditable` route, with the onboarding capture referenced **and** substantively asserted by a `cautilus-json-file` check in `ownership.spec.md`.
3. `consumer:onboard:smoke` writes a checked-in operator-witnessed capture, and an on-demand test replays/asserts its load-bearing invariant.
4. `ROUTE_TO_PROOF_CLASS` is the identity map; the goldset projection and `projected-claim-state.md` regenerate cleanly and `specdown:project:check` passes.
5. `npm run verify` is green; `npm run claims:refresh:all` leaves no staleness; the audit summary is honest (`summary.honest === true`, `summary.inconsistent === 0`).

## Acceptance Checks (mapped to gates)

- **`audit:surface:check`** (verify): regenerated `.cautilus/audit/surface-audit.json` + `docs/specs/audit.spec.md`; `summary.byClaimedStatus.proven === 5`, `declared === 1`, `promised === 1`; `badges[id=host-ownership].observed.observedStatus === "proven"` and `.consistent === true`; `badges[id=behavior-evaluation].proofClass === "cautilus-eval"` (and consistent).
- **Apex check block** (`lint:specs`): the in-page `cautilus-json-file` table over `surface-audit.json` updated to the new counts and the host-ownership/behavior-evaluation assertions above.
- **`ownership.spec.md` projection** (`lint:specs`): the "standalone consumer can install…" subclaim asserts substantively on the new capture (e.g. doctor `ready` true, eval `recommendation` `accept-now`, host-owned runner path `includes`).
- **On-demand** (`npm run test:on-demand`): `smoke-external-consumer.test.mjs` asserts the capture invariant (ready true, recommendation accept-now, host-owned adapter/runner present).
- **`specdown:project:check`** (verify): regenerated goldset inventory + `projected-claim-state.md` consistent with the identity bridge + new proofClasses; host-ownership row reflects `human-auditable` + the (accepted) divergence.
- **Node tests**: `surface-audit-lib.test.mjs` (proofClass fixtures `live-replayed`→`cautilus-eval`; new `human-auditable` proven case) and `goldset-projection-lib.test.mjs` (identity-map assertions) updated and green.

## First Implementation Slice

**Slice 1 — taxonomy realignment (safe refactor, no badge flips):**

- `surface-audit-lib.mjs`: `PROOF_CLASSES` — rename `live-replayed` → `cautilus-eval` (keep `provenLevel: "proven"`), add `human-auditable` (`provenLevel: "proven"`). **`refreshCell` (lines ~528–541): rename the `live-replayed` branch → `cautilus-eval`** (otherwise it becomes a dead string-check). The `human-auditable` branch is added in Slice 2.
- `surface-registry.json`: `proofClasses` map (replace `live-replayed` key with `cautilus-eval`); routes `behavior-evaluation` + `bounded-improvement` `proofClass` → `cautilus-eval`.
- `goldset-projection-lib.mjs`: `ROUTE_TO_PROOF_CLASS` → identity; remove the "documented gap" comment.
- apex `How To Read This`: three proven sub-kinds.
- **Tests (named explicitly — both run in `npm run verify` via `test:node`):**
  - `surface-audit-lib.test.mjs` (~line 36): REGISTRY fixture `proofClass: "live-replayed"` → `"cautilus-eval"` (else the `honest` fixture world observes `unproven` and fails).
  - `goldset-projection-lib.test.mjs` (~lines 234, 313): `impliedProofClass` and `ROUTE_TO_PROOF_CLASS["cautilus-eval"]` assertions `"live-replayed"` → `"cautilus-eval"`; add `ROUTE_TO_PROOF_CLASS["human-auditable"] === "human-auditable"`.
- **Regenerate AND commit all three generated artifacts** (each has a `:check` gate that diffs the checked-in file): `npm run audit:surface` (→ `.cautilus/audit/surface-audit.json` + `docs/specs/audit.spec.md`), `npm run specdown:project` (→ `.cautilus/specdown/claim-inventory.json`), `npm run specdown:claim-state` (→ `docs/specs/evidence/projected-claim-state.md`).
- `npm run verify`, commit. Audit summary counts unchanged (proven 4, declared 2, promised 1); `summary.honest === true`.

**Slice 2 — Host Ownership → proven:**

- `smoke-external-consumer.mjs`: write the checked-in capture (P1 path). **Mandatory field-path resolution first:** today's load-bearing fields are `summary.ready` and `summary.evalSummary.recommendation` (recommendation is NOT top-level). Write the capture so the JSON paths `ownership.spec.md` will assert on are stable, and add the host-owned runner/adapter path so a substantive `includes` is possible.
- `surface-audit-lib.mjs` `refreshCell`: add a `human-auditable` branch (e.g. `witnessed; live re-run \`npm run consumer:onboard:smoke\``) so the Freshness column is honest (not the default "replayed").
- `ownership.spec.md`: re-point the "standalone consumer can install…" subclaim to project the new capture substantively (doctor `ready` true, eval `recommendation` `accept-now`, host-owned runner path `includes`).
- `surface-registry.json`: host-ownership route `proofClass` → `human-auditable`, `evidence` → the new capture file(s), keep `liveOptInCommand`.
- apex: badge `declared → proven` + prose (operator-vouched, no judge) + Proof Debt row + check-block counts (`proven 5`, `declared 1`). **Add explicit `badges[id=host-ownership].observed.evidenceReferenced` and `.evidenceSubstantive` rows** to the apex check block so the binding is self-describing.
- `smoke-external-consumer.test.mjs`: assert the capture invariant.
- Regenerate + commit the three generated artifacts again; `npm run verify`; commit; then `npm run claims:refresh:all` before stopping/push.

## Critique

Bounded fresh-eye critique (foreground Sonnet subagent, 2026-06-21): **ready-with-fixes, zero blockers.**
The direction and the honesty of a `human-auditable` proven tier hold under the repo's own Honesty-Audit rules (the apex bans surface-existence checks but deliberately permits operator-witnessed runs; FD1 requires the badge copy to say "operator-vouched, no judge").
FD7's `route-class-mismatch` confirmed **non-gating** (`reconcileBadges` is read-only; no `--check` fails on divergence).
All six SHOULD-FIX findings were folded into the slices above (the two named test files' specific assertions, `refreshCell` branch rename + `human-auditable` branch, committing all three regenerated artifacts, mandatory capture field-path resolution, explicit host-ownership binding rows).
Over-worry checked and dismissed: no HTML renderer layer exists; an empty-evidence `human-auditable` entry would still observe proven, but Slice 2 adds a real capture so the full reference+substantive binding fires.

## Canonical Artifact

This file, until the slices land; thereafter the apex spec + registry + `surface-audit-lib` are the source of truth and this becomes the recorded contract.
