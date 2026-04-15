# Quality Review

Date: 2026-04-15

Prior review at `history/2026-04-12.md`. This refresh runs the standing bar on
the post-Top-3 / starter-kit surface and records three advisory ergonomics
smells that were invisible at the earlier checkpoint.

## Scope

Repo-wide posture check after this session's ship (introspection surfaces spec
pinned, fixture canonical/specialized split, `release:smoke-install:brew`
on-demand wrapper, archetype starter kits + byte-identity drift test). Focus on
whether `npm run verify` still anchors the full bar honestly, whether the
skill and entrypoint-doc surface have drifted into progressive-disclosure
smell, and whether the prior review's deferred items still hold.

## Current Gates

- `npm run verify` (pre-push via checked-in `.githooks/pre-push`; same surface
  re-run on PR + push via `.github/workflows/verify.yml`)
  - `lint:eslint`, `lint:specs`, `lint:archetypes`, `lint:links`,
    `lint:go` (golangci-lint v2.1.6), `vet:go`,
    `security:govulncheck` (v1.1.4), `test:go:race`, `test:node`
- `npm run hooks:install`, `npm run hooks:check`
- `npm run dogfood:self` (on-demand, not pre-push)
- `npm run consumer:onboard:smoke`, `npm run release:smoke-install`,
  `npm run release:smoke-install:brew` (all on-demand)
- `node --test scripts/starter-kit-parity.test.mjs` (byte-identity copy +
  drift) — included in `test:node`

## Runtime Signals

- `./bin/cautilus adapter resolve --repo-root .` → `ready`.
- `npm run hooks:check` → `ready` with `core.hooksPath=.githooks`,
  executable `pre-push`.
- `npm run verify` exit 0 in this session.
  - `lint:specs`: 5 specs, 598 guard rows (was 4 / 451 on 2026-04-12).
  - `lint:archetypes`: 3 archetypes × 11 surfaces pass.
  - `lint:links`: 85 local files, local-only link check.
  - `lint:go` (golangci-lint): 0 issues.
  - `security:govulncheck`: "No vulnerabilities found."
  - `test:go:race`: `internal/app`, `internal/cli`, `internal/runtime` all
    green (cached in this run).
  - `test:node`: 222 pass, 0 fail, 0 skip, ~22s.

## Coverage and Eval Depth

- No standing coverage floor. `quality-adapter.yaml` does not declare a
  `coverage_floor_policy`; the inventory defaults surfaced by
  `resolve_adapter.py` are schema defaults, not a repo claim.
- Evaluator depth is **smoke + HITL**: `dogfood:self` remains the only
  evaluator-backed deeper bar, but it is on-demand, not pre-push. Prior review
  recorded `overallStatus: pass`, `accept-now` reviewer signal.

## Maintainer-Local Enforcement

- `healthy`: repo-owned `hooks:install` + `hooks:check` + checked-in
  `.githooks/pre-push`.
- `healthy`: CI re-runs the same `npm run verify` surface — one source of
  truth for the final stop-before-finish gate.

## Enforcement Triage

- `AUTO_EXISTING`: ESLint, spec guard (5 specs / 598 rows),
  archetype-completeness (11-surface × 3), markdown-local-links (85 files),
  golangci-lint, go vet, govulncheck, Go race tests, Node tests (222),
  starter-kit byte-identity drift, checked-in pre-push, GitHub `verify`
  workflow.
- `AUTO_CANDIDATE`: phase-label the `verify` sequence so a fresh operator can
  tell which of the ~9 sub-phases failed without scrolling; today `pre-push`
  prints one line and defers to `npm run verify`, which runs silently
  except per-phase output (no escape-hatch `--verbose`).
- `AUTO_CANDIDATE`: promote self-dogfood-prompt shape asserts beyond smoke —
  carried over from 2026-04-12.
- `NON_AUTOMATABLE`: self-dogfood review judgment remains human, but reviewer
  and deterministic gate agree on latest run.

## Healthy

- The archetype-completeness 11-surface gate, spec guard rows, and
  starter-kit byte-identity drift together form a strong concept-integrity
  bar: adding a new archetype or letting a canonical fixture drift now fails
  pre-push.
- Supply-chain posture is real, repo-owned, and CI-pinned (`govulncheck`
  v1.1.4, `golangci-lint` v2.1.6, Go 1.26.2, Node 22).
- Dual-implementation inventory finds 0 candidates.
- Hooks + CI share one gate command; no parallel bespoke CI surface to drift.

## Weak

- **Skill ergonomics (advisory)**: `skills/cautilus/SKILL.md` core is 297
  non-empty lines against the 160-line advisory. `inventory_skill_ergonomics`
  flags `long_core`, `mode_pressure_terms_present`,
  `code_fence_without_helper_script`. Not a regression gate today; a signal
  that progressive disclosure has slipped — deeper mode/option prose should
  be pushed into `skills/cautilus/references/` (the dir already exists and
  holds 18 reference files).
- **Entrypoint-doc ergonomics (advisory)**: `README.md` at 817 effective
  lines and `docs/operator-acceptance.md` at 169 both flag `long_entrypoint`;
  README also flags `mode_pressure_terms_present` and
  `option_pressure_terms_present`. Not a required cut, but worth a pass
  next time README is touched for unrelated reasons.
- **Standing-gate verbosity**: `phase_level_signal: weak` on
  `.githooks/pre-push` (single `printf` line before calling `npm run
  verify`); `escape_hatch: missing` — no `verify:verbose` or `--verbose`
  path. When a phase fails mid-chain an operator has to grep the tail to
  find the failing npm script.
- Self-dogfood honesty still depends partially on reviewer judgment rather
  than a fully deterministic packet-completeness gate.

## Missing

- No deterministic assertion that every self-dogfood review prompt section
  keeps the current-run evidence shape beyond the smoke tests already
  in place (unchanged since 2026-04-12).

## Deferred

- Coverage-floor (Go or Node) — still no product motivator. Defer until a
  self-dogfood run surfaces a coverage-driven regression.
- External-URL link health (`lint:links` is local-only by design). Defer;
  owned surface is local.
- `dogfood:self` promotion to pre-push — intentionally on-demand for runtime
  cost; promote only if a landed regression would have been caught earlier.
- Duplicate-budget follow-up from 2026-04-10 — still a defer candidate.

## Commands Run

- `python3 .../skills/quality/scripts/resolve_adapter.py --repo-root .`
- `python3 .../skills/quality/scripts/inventory_cli_ergonomics.py
  --repo-root . --json`
- `python3 .../skills/quality/scripts/inventory_skill_ergonomics.py
  --repo-root . --skill-path skills/cautilus/SKILL.md --json`
- `python3 .../skills/quality/scripts/inventory_dual_implementation.py
  --repo-root .`
- `python3 .../skills/quality/scripts/inventory_entrypoint_docs_ergonomics.py
  --repo-root .`
- `python3 .../skills/quality/scripts/inventory_standing_gate_verbosity.py
  --repo-root .`
- `./bin/cautilus adapter resolve --repo-root .`
- `npm run hooks:check`
- `npm run verify`
- `node --test --test-reporter=spec ... bin/*.test.mjs scripts/*.test.mjs
  scripts/agent-runtime/*.test.mjs scripts/release/*.test.mjs`
  (to surface 222 pass / 0 fail count behind the default dot reporter)

## Recommended Next Gates

- `active` / AUTO_CANDIDATE: phase-label the pre-push verify sequence. Either
  (a) expand `.githooks/pre-push` to `printf` each npm sub-phase, or (b) add a
  `verify:phases` script that wraps the current chain with labeled echoes.
  Smallest step — improves failure locality without widening scope. Keep the
  dot-reporter default for test:node (already `healthy`), but add
  `test:node:spec` as the escape hatch.
- `active` / AUTO_CANDIDATE: add a deterministic shape assertion on
  self-dogfood review prompt sections (carries over from 2026-04-12). Seam is
  concrete; stop-gap today is smoke coverage only.
- `passive`: trim `skills/cautilus/SKILL.md` core below the 160-line
  advisory by pushing deeper mode/option prose into already-existing
  `skills/cautilus/references/`. Skill is consumer-facing — treat as a
  careful restructure, not a hasty cut. Reason for passive: requires judgment
  on what belongs in core vs references; not a promoteable rule today.
- `passive`: README / operator-acceptance tightening — take the next
  inventory smell cut only when touching those docs for a real reason.
- `passive`: coverage floor (Go or Node) — promote only when self-dogfood
  surfaces a coverage-driven miss. Reason: no product motivator yet.

## Premortem Pass

One fresh-eye sweep on the draft above:

- The "healthy" section claims Go tests green, but `test:go:race` reported
  `(cached)` for all packages during this review. Cached pass is still a
  valid pass (caches invalidate on source change), but a reader who
  skim-reads might conclude a fresh race test ran today. Clarified above.
- `dogfood:self` is listed both as a gate command (in adapter) and as "not
  pre-push" (under Gates). That is not a contradiction — adapter declares
  aspiration, pre-push runs only `verify`. Called out explicitly.
- A fresh agent could misread "no coverage floor" as "coverage not measured"
  when the real statement is weaker: the repo does not declare or enforce
  one. Kept phrasing conservative.
- The skill-ergonomics smell is advisory, not a regression. Flagging it
  without demanding a cut avoids "taste policing" the bundled skill.
