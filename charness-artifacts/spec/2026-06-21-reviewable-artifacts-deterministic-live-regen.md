# Spec — Reviewable Artifacts → proven via deterministic live regeneration

Status: contract (pre-impl). Canonical during implementation.
Track: A (apex Proof Debt). Maintainer-chosen sub-item: **Reviewable Artifacts** (the last `declared` badge).
Date: 2026-06-21.

## Problem

The apex (`docs/specs/index.spec.md`) carries **Reviewable Artifacts — declared**, the only remaining `declared` badge.
Its Proof Debt line says: *"regenerate packets live in the spec and assert their shape."*

The leaf spec (`docs/specs/user/reviewable-artifacts.spec.md`) currently *projects* three saved evidence bundles dated 2026-05-03 rather than re-running the behavior:

- `evidence-durable-packets-2026-05-03.json` — JSON packets are the audit source of truth.
- `evidence-reviewable-artifact-projections-2026-05-03.json` — generated views preserve the packet source of truth.
- `evidence-reviewable-proof-debt-reports-2026-05-03.json` — stale/blocked/missing evidence is visible in report views.

Each subclaim closes today with a `cautilus-json-file` check over a saved bundle (`decision.evidenceStatus === satisfied`), so the registry route is `proofClass: projected-bundle`, which the audit caps at `declared` (`surface-audit-lib.mjs` `PROOF_CLASSES`).
The behaviors these bundles record are all **deterministic command/file surfaces** — packet emission, readable-view rendering, and report bucketing — with no agent and no judge in the loop.
Nothing about them needs a saved bundle: they can be re-run live inside `npm run lint:specs` on every gate, exactly like Readiness and Claim Discovery.

## Root finding (why deterministic is the honest class, and the mismatch is normal)

Two facts make `deterministic` the right and precedented choice:

1. **The subclaim behaviors are deterministic.**
   All three regenerate from fixed inputs through the `cautilus` binary or repo-owned renderers and produce stable, schema-versioned output — no model call, no operator vouching.
   `human-auditable` would be dishonest (there is nothing un-automatable to witness); `cautilus-eval` would be dishonest (no agent capture, no blind judge).

2. **The ratified gold-set route for the badge's headline claim is `cautilus-eval`, and that divergence is already normal and non-gating.**
   The reviewable-artifacts badge binds T1 claim `claim-readme-md-137` (README.md:137, *"separates iteration from protected validation and keeps evidence reopenable from files — held-out honesty, packet-first"*), ratified `cautilus-eval`.
   The badge taxonomy and the gold-set claim taxonomy are *related but distinct* (`projected-claim-state.md:45`): the apex badge promise is the narrower, structural *"every run leaves a machine-readable record and a readable view to audit,"* which is deterministic-shaped.
   The reconciliation (`goldset-projection-lib.mjs` `reconcileBadges`/`classifyBadge`) compares the registry `proofClass` against the ratified route and reports `route-class-mismatch` — but it is **read-only and non-gating**: `projected-claim-state.md:60` states divergences "are inputs to later proof work, not gate failures," and **all 7/7 badges are divergent today** with the repo green.
   This is the *exact* shape of the proven `claim-discovery` badge: registry `deterministic`, ratified headline route `cautilus-eval`, divergence `route-class-mismatch`, yet `consistent`, `proven`, honest.

So moving `projected-bundle → deterministic` keeps a `route-class-mismatch` against the ratified `cautilus-eval` route (it has one today against the same claim), changes no divergent count (stays 7/7), and reaches `proven` honestly — mirroring `claim-discovery` rather than inventing anything.

## Current Slice

Replace the three projected-bundle subclaims in `reviewable-artifacts.spec.md` with **live regeneration → assertion on fresh output**, flip the registry route to `deterministic` with empty evidence (the Readiness shape), and move the apex badge `declared → proven`.

Two axes, kept explicit (same as the prior Host Ownership slice):

- **verdict mode** (`proofClass`): `deterministic` — the command/file checks re-run every `lint:specs`.
- **freshness**: runs-every-gate (no opt-in command; the `refreshCell` deterministic branch renders "runs every gate").

## Fixed Decisions

1. **Proof class = `deterministic`, evidence = `[]`.**
   The route observes `proven` from `proofSpecExists + checkCount > 0 + empty-evidence` (the Readiness precedent: `computeObserved` makes `evidencePresent/evidenceReferenced/evidenceSubstantive` vacuously true when `evidence` is empty).
   Fresh outputs are written to temp dirs that do not exist at `audit:surface` time, so they cannot be registry evidence; the live `run:shell`/`check` blocks inside `lint:specs` carry the proof, exactly like Readiness.

2. **Each of the three subclaims regenerates live and asserts on the produced packet/view/report.**
   - **① JSON packets are the audit SOT.** Build the CLI and a fresh temp git repo, `init adapter`, `discover claims --output`, then run the packet commands and assert their schema versions and load-bearing state fields on the **fresh stdout JSON** via `check:cautilus-json-command` (interpolation-proven by Readiness): `doctor status --json` → `cautilus.agent_status.v1` (mode/nextBranches), `discover claims status --input` → `cautilus.claim_status_summary.v1`, `discover claims validate --claims` → `cautilus.claim_validation_report.v1` (`valid`), `evaluate claims plan --claims` → `cautilus.claim_eval_plan.v1`.
   - **② generated views preserve the packet SOT.** Render a readable view live from a fresh packet and assert (a) the view is produced and (b) the JSON packet is preserved as the audit source. `cautilus evaluate review render-prompt --input` prints Markdown to stdout; the Node renderers `render-claim-status-report.mjs` and `render-claim-discovery-review.mjs` write Markdown carrying an explicit audit-source notice (`"Use the JSON packets as the audit source…"` / `"The JSON packet is the audit source; this Markdown is a readable projection…"`). **Notice substrings must be asserted with a real content check** — a doctest block (`$ <cmd> | grep -q "<notice>" && echo ok` → `ok`) or `check:cautilus-command(stdout_includes=…)` — **never a bare `run:shell # comment` block, which only fails on non-zero exit and does not assert output** (specdown engine `cases.go`: non-doctest blocks check `resp.Error` only). Node renderers cannot go through `check:cautilus-json-command` (the adapter's `parseCommand` requires the command to start with `cautilus`), so run them in `run:shell` and assert the written file via a doctest `grep` or, for the JSON-source-still-present half, `check:cautilus-json-file` over the captured packet.
   - **③ stale/blocked/missing evidence is visible in reports.** Produce an input claims packet that contains a blocked claim, a missing-evidence claim, and a stale-evidence claim, then run `discover claims status` (and the status-report renderer) and assert the buckets/signals surface all three: `actionSummary.primaryBuckets[].id` (`split-or-defer` for blocked, `agent-add-deterministic-proof`/unsatisfied for missing) and `actionSummary.crossCuttingSignals[].id == "stale-evidence"` for stale. **The input packet must be a real `discover claims` output mutated via `jq`, not hand-authored from `printf`** — `discover claims status --input` validates `cautilus.claim_proof_plan.v1` and requires `claimId`, `claimFingerprint` (sha256), `summary`, `recommendedProof`, and `verificationReadiness` on every candidate (`ValidateClaimProofPlan`, `internal/runtime/claim_discovery.go`), which a from-scratch `printf` cannot satisfy. Mirrors how Readiness constructs a repo per blocker branch, but starts from a valid emitted packet.

3. **Registry route update.**
   `reviewable-artifacts.proofClass: projected-bundle → deterministic`; `evidence: [...] → []`; `liveOptInCommand` stays `null`; `proofCommand` stays `npm run lint:specs`.

4. **The three 2026-05-03 bundles leave the reviewable-artifacts registry evidence list.**
   They stay checked in (non-destructive; `evidence-durable-packets-2026-05-03.json` is still referenced as a supporting projected check inside `ownership.spec.md`), but they are no longer the badge's load-bearing proof.
   Matching the Host Ownership FD6 precedent (supporting projected checks may remain in a spec but leave the registry evidence list).

5. **Accepted non-gating divergence.**
   With `proofClass = deterministic`, the reconciliation keeps a `route-class-mismatch` for this badge against the ratified `cautilus-eval` route of `claim-readme-md-137` (it has one today against the same claim as `projected-bundle`).
   This is **honest and non-gating** by design (`projected-claim-state.md:60`; `reconcileBadges` is read-only; no `--check` fails on divergence) and identical in shape to the proven `claim-discovery` badge.
   We accept it: the apex badge promise (reopenable machine-readable record + readable view) is deterministic and is what the spec proves; the broader gold-set principle claim stays a separate, pre-existing divergence.
   Re-ratifying the gold-set route to `deterministic` (which would make the badge `aligned`) is a heavier gold-set edit, recorded as a rejected alternative below.

6. **No other badge flips.**
   After this slice the audit summary is `proven 6 / declared 0 / promised 1`; only Reviewable Artifacts changes.

## Probe Questions

- **P1 — exact load-bearing field paths per packet.** Default: assert `schemaVersion` (anchor) plus one substantive state field each — `agent_status.v1`: `mode`/`nextBranches.length`; `claim_status_summary.v1`: `actionSummary.primaryBuckets[0].id`; `claim_validation_report.v1`: `valid`; `claim_eval_plan.v1`: `schemaVersion` + a plan field. Confirm exact field names against fresh output while implementing (the audit needs each `cautilus-json-file` row substantive on a non-`schemaVersion` field; `cautilus-json-command` rows are not subject to the registry-evidence binding because evidence is empty, but should still assert real fields).
- **P2 — how to deterministically produce the stale/blocked/missing states for ③.** Default: emit a real packet with `discover claims --repo-root $tmp --output` (valid fingerprints/ids), then `jq`-mutate specific candidates to set `verificationReadiness: blocked`, leave one with no satisfied evidence, and set one `evidenceStatus: stale`, then run `discover claims status --input` over the mutated packet and assert the three buckets/signals. This regenerates the *report* live (the artifact the subclaim is about) while exercising each branch — the Readiness precedent, but seeded from a schema-valid emitted packet so `ValidateClaimProofPlan` accepts it. Fallback if the status summary will not surface a `jq`-set stale `evidenceStatus`: build a temp repo, `discover claims` → commit → mutate a source → re-run `discover claims --previous --refresh-plan` to produce real `claimState.gitState.isStale` / refresh-plan currentness, and assert on that. Confirm which path surfaces all three during impl.
- **P3 — temp-repo setup cost in `lint:specs`.** Default: one `run:shell -> $tmp, $bin` that `go build`s the CLI and inits a committed sample repo with `init adapter --scenario skill` + `discover claims` (the Readiness setup plus discover), reused across ①–③ where possible to keep the spec fast. Confirm the focused-run and full-run both stay green and within current `lint:specs` runtime norms.

## Non-Goals / Deliberately Not Doing

- Not flipping any badge other than Reviewable Artifacts.
- Not re-ratifying the gold-set proof route for `claim-readme-md-137` (the `route-class-mismatch` is accepted as non-gating; see FD5 and Rejected Alternatives).
- Not deleting the three 2026-05-03 bundles (non-destructive; `evidence-durable-packets` is still referenced by `ownership.spec.md`).
- Not adding any new opt-in/live command (`liveOptInCommand` stays `null`; deterministic checks run in the default gate).
- Not touching the app/chat liveness, app/prompt product-runner, or A Testable Agent items (separate Track A frontier).

## Rejected Alternatives

- **Keep `projected-bundle` and just refresh the bundle dates.** Rejected: it never satisfies the Proof Debt line (*"regenerate packets live"*) and stays capped at `declared`.
- **Use `cautilus-eval` so the badge reconciles `aligned` with the ratified route.** Rejected as dishonest: the three subclaims have no agent capture and no blind judge, so `cautilus-eval`'s meaning would not be delivered. The audit's whole point is that the class names what the proof actually delivers.
- **Re-ratify `claim-readme-md-137` to `deterministic` via the maintainer override surface** (`claim-proof-route-overrides.json`), making the badge `aligned`. Rejected for this slice: it edits the HITL-ratified gold set to fix a cosmetic, non-gating reconciliation note, and the "held-out honesty" principle in that claim is genuinely eval-flavored. Deterministic-registry-with-cautilus-eval-headline is already the accepted, proven shape of `claim-discovery`. May be revisited if the maintainer wants 0/7 divergent.

## Constraints

- `deterministic` badges must actually re-run the behavior in `lint:specs`; do not leave a surface-existence or `decision.evidenceStatus` projection as the closing state of a subclaim (apex "How Proof Works Here" bans surface-existence checks).
- Keep `lint:specs` ON and never weaken the gold-set lint.
- Claim sources change (`docs/specs/**` incl. `surface-registry.json`, apex) → `npm run claims:refresh:all` before push so `claims:source-freshness:check` passes.
- Bug/error/regression during impl → route to `charness:debug` before further fixes.

## Success Criteria

1. The audit observes Reviewable Artifacts as `deterministic`-proven, `consistent === true`, with `summary.byClaimedStatus.proven === 6`, `declared === 0`, `promised === 1`, and `summary.honest === true`, `summary.inconsistent === 0`.
2. Each of the three subclaims in `reviewable-artifacts.spec.md` regenerates its artifact live (CLI/renderer run inside `lint:specs`) and asserts on the **fresh** packet/view/report — no closing `decision.evidenceStatus === satisfied` over a saved 2026-05-03 bundle.
3. `surface-registry.json` `reviewable-artifacts` is `proofClass: deterministic`, `evidence: []`, `liveOptInCommand: null`.
4. The goldset projection and `projected-claim-state.md` regenerate cleanly: `reviewable-artifacts` reconciliation row reads `deterministic | route-class-mismatch | claim-readme-md-137`, divergent badges stays 7/7, and `specdown:project:check` + `specdown:claim-state:check` pass.
5. `npm run verify` is green (full `lint:specs` re-runs the live regeneration); `npm run claims:refresh:all` leaves no staleness.

## Acceptance Checks (mapped to gates)

- **`lint:specs`** (verify): the rewritten `reviewable-artifacts.spec.md` runs its `run:shell` setup + `check:cautilus-json-command`/`cautilus-json-file` + golden-output blocks live and passes; focused run (`node scripts/lint-specs.mjs docs/specs/user/reviewable-artifacts.spec.md`) also passes.
- **`audit:surface:check`** (verify): regenerated `.cautilus/audit/surface-audit.json` + `docs/specs/audit.spec.md`; `summary.byClaimedStatus.proven === 6`, `declared === 0`, `promised === 1`; `badges[id=reviewable-artifacts].observed.observedStatus === "proven"`, `.proofClass === "deterministic"`, `.consistent === true`.
- **Apex check block** (`lint:specs`): in-page `cautilus-json-file` table over `surface-audit.json` updated to the new counts and `badges[id=reviewable-artifacts].observed.observedStatus === proven`; **add a `badges[id=reviewable-artifacts].observed.evidenceReferenced | true` row** (vacuously true with empty evidence) for symmetry with the other proven badges; prose "five…proven, one…declared" → "six…proven, zero…declared"; Proof Debt table row for Reviewable Artifacts removed; badge heading `### Reviewable Artifacts — proven`; How-To-Read deterministic line may add Reviewable Artifacts.
- **`specdown:project:check`** (verify): regenerated `.cautilus/specdown/claim-inventory.json` with `reviewable-artifacts` `registryProofClass: deterministic`.
- **`specdown:claim-state:check`** (verify): regenerated `docs/specs/evidence/projected-claim-state.md` reconciliation row `reviewable-artifacts | deterministic | route-class-mismatch | claim-readme-md-137`; divergent 7/7 unchanged.
- **`claims:source-freshness:check`** (push): `npm run claims:refresh:all` run after the docs/specs edits.

## First Implementation Slice

**Single slice (no cross-slice barrier — one badge, safe refactor):**

1. Rewrite `docs/specs/user/reviewable-artifacts.spec.md`: replace the three projected-bundle blocks with the live-regeneration blocks of FD2 (one shared `run:shell -> $tmp, $bin` setup; per-subclaim `run:shell` + `check` assertions on fresh output). Resolve P1 field paths and P2 stale/blocked/missing construction against real output while editing.
2. `surface-registry.json`: `reviewable-artifacts` `proofClass projected-bundle → deterministic`, `evidence [...] → []`.
3. Apex `docs/specs/index.spec.md`: badge `declared → proven` + prose counts + Proof Debt row removal + check-block count/observed updates (per Acceptance Checks).
4. Regenerate AND commit the three generated artifacts: `npm run audit:surface`, `npm run specdown:project`, `npm run specdown:claim-state`.
5. `npm run verify`; commit; then `npm run claims:refresh:all` before stopping/push.

## Critique

Bounded fresh-eye critique (foreground Sonnet subagent, 2026-06-21): **ready-with-fixes, zero blockers.**
The critic traced the audit mechanics against `surface-audit-lib.mjs` and the specdown engine source and confirmed the core design: a `deterministic` route with `evidence: []` observes `proven` (evidence-binding vacuously satisfied at `computeObserved`/`computeEvidenceReference`), `${var}` interpolation works in `cautilus-json-command` checkParams (`engine/template.go` renders them), temp-dir bindings persist across blocks under the same heading (`engine/bindings.go`), the `route-class-mismatch` is read-only/non-gating (`reconcileBadges`, 7/7 divergent today with the repo green), none of the three 2026-05-03 bundles are in any other route's registry evidence, `deterministic` is the honest class (no agent/judge), and `evidenceCell`/`refreshCell` already render the empty-evidence/deterministic cases.
Four SHOULD-FIX findings, all impl-mechanism precision, folded in above:
- **SF1/SF3** — notice substrings must be asserted with a real content check (doctest `grep` or `cautilus-command stdout_includes`), never a bare `run:shell # comment` block (which only fails on non-zero exit); Node renderers cannot route through `cautilus-json-command` (adapter `parseCommand` requires a `cautilus` command) — folded into FD2 ②.
- **SF2** — subclaim ③'s input must be a real `discover claims` packet mutated via `jq` (not `printf`-from-scratch), because `discover claims status --input` validates `claim_proof_plan.v1` (requires `claimId`/`claimFingerprint`/`summary`/`recommendedProof`/`verificationReadiness`) — folded into FD2 ③ and P2.
- **SF4** — add a `badges[id=reviewable-artifacts].observed.evidenceReferenced | true` row to the apex check block for symmetry — folded into Acceptance Checks.
All over-worries dismissed with source evidence (audit-mechanics correctness, interpolation, bundle cross-references, mismatch gating, temp-dir persistence, honesty, evidence/refresh-cell rendering).

## Canonical Artifact

This file, until the slice lands; thereafter the apex spec + registry + `reviewable-artifacts.spec.md` live regeneration are the source of truth and this becomes the recorded contract.
