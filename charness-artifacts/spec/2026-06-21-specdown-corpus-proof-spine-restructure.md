# Spec: Specdown Corpus → Proof-Spine + Typed Traceability

Status: bounded critique integrated; pending user greenlight on Slice 1.
Decided axis (user, this session): full transition to proof-spine + typed traceability.

## Problem

The `docs/specs/**` corpus has drifted into three layered structural paradigms that tangle each other.
First, frozen historical specs live under `old/` and `archive/`.
Second, a hand-maintained multi-view documentation IA restates the same promise across four "views" (user, contracts, rules, evidence) plus three ledger pages, with one promise (e.g. Readiness) appearing six times.
Third, a newer generated proof machine (apex + honesty audit + projections) sits on top.

The root cause of the tangle is that the corpus hand-rolls structure that specdown can derive and check.
It uses zero of specdown's structural features: `trace` config is absent, no spec has `type:` frontmatter, there are no `edge::` trace links, and no Alloy models.
The "every active `.spec.md` must be linked from the apex" reachability gate in `scripts/check-specs.mjs` is a hand-built predecessor of `specdown trace`, and the index/nav pages exist largely to satisfy it.
Nineteen executable blocks across the corpus are existence-style checks (`fs.existsSync` / `test -f`); the bounded critique split them into 17 reachability guards, of which the pure-`.md` subset (Class A) asserts files exist and nothing more, plus 2 `!fail` gap markers (Class C) that are not guards at all.

The product's apex is literally "Cautilus, Proven On Itself", so the corpus's primary job is a trust/proof artifact, with the user-manual role served by prose inside the same specs (specdown's two-audience thesis), not by a parallel doc-site IA.

## Current Slice

Slice 1: introduce the typed-traceability foundation on the current file layout, with no load-bearing file moves, and delete the pure reachability guards.
This closes `gap.traceability-config`, removes the reachability guards the user called out, and proves the pattern without touching the audit/claim path coupling.

Bounded-critique correction (this session): "delete the 15 source guards" was too blunt.
The corpus has 17 reachability-guard blocks plus 2 `!fail` gap-marker blocks, and the guards fall into three classes that must be handled differently (see Guard Taxonomy below).
Only Class A is deleted in Slice 1.

## Guard Taxonomy (from bounded critique)

The 19 `existsSync`/`test -f` blocks in non-`old/`/`archive/` specs are not one kind:

- Class A — pure `.md` reachability guards (every target is a `.spec.md`/`.md` doc).
  These exist only to satisfy the hand-rolled "every spec is linked from apex" gate; `specdown trace -strict` replaces them.
  Delete in Slice 1.
- Class B — non-`.md` / content guards.
  They assert existence of `.json`/`.yaml`/`.mjs` artifacts or `grep -q` real content, e.g. `user/claim-discovery.spec.md` (a `.yaml` adapter + two `.mjs` greps), `ledger/improvement.spec.md` (a live-proof `.json`), and `evidence/index.spec.md` (`.cautilus/**` runtime artifacts).
  Trace cannot replace these because trace edges only connect `.md` nodes.
  Do NOT delete in Slice 1; keep as content checks, and only upgrade a bare `test -f <evidence>.json` to a substantive `cautilus-json-file` check if it is worth strengthening.
- Class C — `!fail` gap-marker blocks (`evidence/gaps.spec.md`).
  These are gap trackers, not guards.
  Leave `gap.vocabulary-evidence-bundle` and `gap.live-batch-fixture` untouched.
  `gap.traceability-config` is the exception: Slice 1 closes it (remove its `!fail` block, which would otherwise invert to an unexpected pass once trace passes, and mark its gaps-table row closed).

## Fixed Decisions

- Axis is proof-spine + typed traceability (user-decided this session); the multi-view doc-site IA is the over-reach to unwind.
- Source guards are banned as proof, scoped to Class A: pure `.md` reachability blocks are deleted and replaced by `specdown trace -strict`. Class B content checks stay (trace cannot express them); Class C gap markers stay (except the now-closed traceability gap).
- The CLI flag is `specdown trace -strict` (single dash; binary 0.47.2), not `--strict`.
- The standing gate stays cheap: no `node --test` or heavy process spawns inside spec executable blocks; live/expensive proofs stay on-demand (`proof:*:live`, `test:on-demand`).
- `specdown run` wall-clock is a health metric; a creeping standing-gate run time is a red flag that the test structure is wrong, not something to absorb.
- Evidence-binding honesty stays owned by `surface-registry.json` + `build-surface-audit.mjs` (semantic/substantive binding), and is NOT duplicated into trace edges; trace owns the doc-graph structure, the audit owns badge↔evidence honesty.
- `specdown trace` and `specdown alloy explore` are available in the installed binary (verified this session), so both are usable.

## Probe Questions

- Exact per-edge cardinalities (`count`) that make `specdown trace -strict` both green and meaningful; tune during Slice 1 against the real graph rather than guessing the multiplicities up front.
- Whether the per-view index pages become generated (from `specdown trace --format dot/matrix`) or trimmed to thin navigation; decide during Slice 2 once edges carry the relationships.
- Whether any of the current 83 `run:shell` blocks are individually expensive enough to move on-demand; audit during Slice 1 while deleting the guards.

## Deferred Decisions

- `.spec.md` → `.md` rename to match specdown's recommended extension; it is a no-op to specdown core but load-bearing in `check-specs.mjs`, `specdown.json` entry, `surface-registry.json` proofSpec paths, and `build-surface-audit.mjs` APEX_PATH, so it is a separate later slice, not part of the foundation.
- Alloy models for the structural invariants (claim-state partition completeness + mutual exclusivity, badge↔route bijection / no-orphan); Slice 4, after traceability lands.
- Relocating generated pages into a dedicated `generated/` directory; Slice 3 structural move.

## Non-Goals

- Changing the seven promises themselves, their proof status, or the honesty-audit verdict (must stay 7/7 honest).
- Touching `skills/cautilus-agent/` or its three-copy packaging.
- Changing the claim-discovery algorithm or the claim-refresh chain semantics.

## Deliberately Not Doing

- Not duplicating the registry's evidence-file binding as trace edges; two sources of truth for evidence would re-create the drift this restructure exists to remove.
- Not moving the apex, the seven leaf specs, or `docs/specs/audit/*.json` in Slice 1; those paths are hardcoded in the audit/projection/claim machinery and moving them is sequenced into Slice 3 with the matching code updates.
- Not replacing `check-specs.mjs` reachability with `specdown trace` in Slice 1; both run in parallel until trace is proven equivalent, then reachability is retired in a later slice.

## Constraints

- At every slice boundary: `npm run verify` green, `npm run hooks:check` ready, honesty audit `summary.honest=true` with `total=7`, `byClaimedStatus.proven=7`, `inconsistent=0`, `orphanIssueCount=0`.
- When a slice moves or edits any claim-source file (`docs/specs/**`, README, AGENTS, CLAUDE, `surface-registry.json`, linked docs), run `npm run claims:refresh:all` before push (evidence-state alone is insufficient).
- `docs/specs/*.md` stays exempt from the semantic-line-break rule (tables + executable patterns); other prose keeps one sentence per line.
- `old/` and `archive/` stay out of the apex reachability graph and out of `specdown run`; trace config must `ignore` them so trace does not start executing or requiring them.
- Generated pages (`audit.spec.md`, `evidence/projected-claim-state.md`, `evidence/claim-evidence-state.md`) stay generator-owned; trace must `ignore` them rather than demanding hand-authored `type:`/edges.
- `trace.ignore` must also cover the repo-wide non-spec trees `charness-artifacts/**`, `node_modules/**`, `.git/**`, because `specdown trace` scans every `.md` from the repo root and untyped docs containing `name::` example links (e.g. this session's gather asset) error otherwise; `ignorePrefixes` does not suppress trace edge errors.

## Success Criteria

- The corpus uses specdown's structural features: a `trace` config exists, spine specs carry `type:` frontmatter, relationships are `edge::` links, and `specdown trace -strict` passes.
- Zero Class A reachability guards remain in `docs/specs/**`; reachability and cardinality are enforced by `specdown trace -strict` instead. Class B content checks and Class C gap markers (except the closed traceability gap) are retained intentionally.
- `gap.traceability-config` is closed (moved from gap to satisfied) by the trace config being live and gating.
- The standing-gate run time does not regress; deleting the guard blocks should reduce, not increase, `specdown run` cost.
- A reader can trace any promise to its rules, contracts, and proof through typed edges without reading a hand-maintained "view" page that restates the model.

## Acceptance Checks

- `specdown trace -strict` exits 0 on the typed spine; introduce a deliberately-broken edge in a scratch copy and confirm `-strict` fails (negative case), so the gate is load-bearing, not decorative.
- Non-vacuity: `specdown trace -strict` is confirmed to FAIL the negative case AND to actually evaluate ≥1 typed document (it exits 0 vacuously when zero docs carry `type:`), so the gate is only committed after the apex and ≥1 promise are typed.
- `npm run lint:specs` (which runs `specdown run` + `check-specs.mjs`) stays green after the Class A guards are deleted.
- `npm run audit:surface:check` stays green: honesty audit still 7/7 consistent and honest.
- `git grep -nE "existsSync|test -f" docs/specs` returns only the retained Class B content checks and Class C `!fail` gap markers (`evidence/gaps.spec.md`) — no Class A reachability block. (The grep is not zero-result; it is reviewed against the retained allowlist.)
- A timed `specdown run` before/after Slice 1 shows non-regressed wall-clock (record both numbers in the closeout).

## Critique

Bounded fresh-eye critique ran (foreground Sonnet subagent, read-only, claims verified against the repo). Verdict: Slice 1 was NOT safe as first drafted; the following are now integrated.

Blockers resolved:
- `charness-artifacts/**` (and `node_modules/**`, `.git/**`) must be in `trace.ignore`, because `specdown trace` scans every `.md` from the repo root and this session's own gather asset (`charness-artifacts/gather/2026-06-21-specdown-tool-purpose-and-authoring.md`) contains literal `[covers::…]` example links that trace parses as unknown edges. `ignorePrefixes` does NOT suppress this — only `trace.ignore` does.
- `evidence/gaps.spec.md` `gap.traceability-config` `!fail` block runs `specdown trace -strict`; once trace passes it inverts to an unexpected pass (a gate failure). Slice 1 must remove that block and mark its table row closed (Class C exception).
- The negative acceptance assertion cannot be "zero `existsSync`/`test -f`", because legitimate Class B/C blocks remain; it is now an allowlist review.

Should-fix resolved:
- Guard count corrected (19 = 17 reachability + 2 `!fail`); only Class A deleted.
- Class B guards (`user/claim-discovery.spec.md` YAML+`.mjs` greps, `ledger/improvement.spec.md` live-proof `.json`, `evidence/index.spec.md` `.cautilus/**` artifacts) are retained, not deleted — trace cannot express non-`.md` targets.
- `specdown trace -strict` passes vacuously with zero typed docs; gate is committed only after the apex + ≥1 promise are typed, with the non-vacuity acceptance check.

Confirmed over-worry (no change needed):
- `type:` frontmatter does not break `cautilus-adapter.mjs` (reads JSON over stdin), `check-specs.mjs` (link regex), or `surface-audit-lib.mjs` (`### Title — status` + `> check:` parsing).
- `claims:refresh:all` is already correctly required in the slice (frontmatter edits change claim-source SHA-256).

Residual probe for impl (the critic flagged a real gap): whether `specdown trace` cardinality alone can express "every promise has an apex badge AND ≥1 contract", or whether a small complementary check is still needed. Resolve in Slice 1 step 5 against the real graph; if cardinality cannot express it, add a minimal complementary assertion rather than re-introducing a guard.

## Canonical Artifact

This file is the canonical contract during implementation: `charness-artifacts/spec/2026-06-21-specdown-corpus-proof-spine-restructure.md`.

## First Implementation Slice

Slice 1, in order:
1. Draft the `trace` block for `specdown.json`: `types` (apex, promise, rule, contract), `edges` (apex→promise `badges`, promise→rule `governed-by`, promise→contract `implemented-by`), and `ignore` covering everything trace must not scan: `docs/specs/old/**`, `docs/specs/archive/**`, the generated `.md` pages (`docs/specs/audit.spec.md`, `docs/specs/evidence/projected-claim-state.md`, `docs/specs/evidence/claim-evidence-state.md`), and the repo-wide non-spec trees `charness-artifacts/**`, `node_modules/**`, `.git/**` (trace scans every `.md` from repo root, so untyped docs with `name::` example links would otherwise error).
2. Add `type:` frontmatter to the spine specs, apex first (apex + 7 promise leaves + rule + contract pages).
3. Convert the relationship links the Class A guards protected into `edge::`-prefixed trace links, then delete ONLY the Class A reachability blocks. Leave Class B content checks and Class C `!fail` markers in place.
4. Close `gap.traceability-config`: remove its `!fail` block from `evidence/gaps.spec.md` and mark its gaps-table row closed (otherwise it inverts to an unexpected pass once trace passes).
5. After the apex + ≥1 promise are typed, run `specdown trace -strict`; tune cardinalities until green and meaningful, add the negative-case proof, and confirm non-vacuity (it must evaluate ≥1 typed doc, not pass on zero docs). If cardinality cannot express "every promise has a badge AND ≥1 contract", add a minimal complementary check rather than a guard.
6. Wire `specdown trace -strict` into `npm run lint:specs` (or `verify`) as a standing gate — only after step 5 confirms it is non-vacuous and load-bearing.
7. Run `claims:refresh:all` (frontmatter edits change claim-source content), then `npm run verify` + `audit:surface:check`; record before/after `specdown run` timing in the closeout.

## Migration Map (full target, for context)

- Slice 1 (this slice): traceability foundation + source-guard removal, no load-bearing moves.
- Slice 2: collapse the multi-view sprawl — demote/merge per-view index + ledger-restatement pages now that edges derive relationships; remove each-promise-×4 duplication.
- Slice 3: structural moves — `promises/` directory for the 7 leaves, `generated/` isolation, formalize history exclusion; update `surface-registry.json`, `build-surface-audit.mjs`, projections, and claim chain in lockstep.
- Slice 4 (deferred): Alloy models for structural invariants; optional `.spec.md` → `.md` rename.
