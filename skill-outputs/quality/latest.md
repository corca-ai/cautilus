# Quality Review

Date: 2026-04-17

Prior durable reviews:

- `skill-outputs/quality/quality.md` (2026-04-15)
- `skill-outputs/quality/history/2026-04-12.md`

## Scope

Repo-wide posture refresh after the public spec and README reshaping work.
Focus on whether the standing bar is still honest, whether public specs now duplicate proof at the wrong layer, and whether entrypoint docs have become easier to scan in rendered markdown without weakening real runtime integrity.

## Concept Risks

- Public spec drift is better than before, but `inventory_public_spec_quality.py` still flags:
  - `docs/specs/current-product.spec.md`: `future_state_mixed`
  - `docs/specs/html-report.spec.md`: `future_state_mixed`
  - `docs/specs/standalone-surface.spec.md`: `implementation_guard_pressure`
- Public spec layering still needs review.
  The inventory reports `duplicate_public_spec_examples` and `proof_layering_review_needed`, which means the repo has improved the public report but has not yet fully collapsed repeated proof across README/spec/tests.
- README first-touch ergonomics improved, but `inventory_entrypoint_docs_ergonomics.py` still flags `README.md` as `long_entrypoint`.
  That is now a structural compression question, not a rendering accident.

## Current Gates

- `npm run verify`
  - `lint:eslint`
  - `lint:specs`
  - `lint:archetypes`
  - `lint:links`
  - `lint:go`
  - `vet:go`
  - `security:govulncheck`
  - `test:go:race`
  - `test:node`
- `npm run hooks:check`
- checked-in `.githooks/pre-push` running `npm run verify`
- `npm run dogfood:self`
  - explicit quality work, not standing pre-push
- `npm run consumer:onboard:smoke`
  - on-demand adoption proof

## Runtime Signals

- `python3 .../resolve_adapter.py --repo-root .` found a valid quality adapter.
- `git status --short` was clean at review start.
- `npm run verify` passed end-to-end in this session.
  - `lint:specs`: passed for 7 specs
  - `lint:archetypes`: passed after narrowing the checker to runtime-completeness instead of prose lock
  - `lint:links`: passed on 99 local markdown files
  - `lint:go`: 0 issues
  - `security:govulncheck`: no vulnerabilities found
  - `test:go:race`: green
  - `test:node`: green, still the longest standing phase at about 22s
- Recent standing-gate runtime remains dominated by:
  - `lint:specs` at about 7s
  - `test:node` at about 22s
  - full `verify` at about 38-41s

## Coverage and Eval Depth

- No standing coverage floor is enforced.
  The adapter carries a coverage-floor policy shape, but the repo does not currently claim a live coverage floor gate.
- Evaluator depth is still `smoke + explicit deeper quality work`.
  Standing proof comes from deterministic lint/spec/go/node gates.
  `dogfood:self` remains the stronger evaluator-backed operator-quality path, but it is intentionally not part of pre-push.

## Maintainer-Local Enforcement

- `healthy`: checked-in `.githooks/pre-push`
- `healthy`: `core.hooksPath=.githooks`
- `healthy`: `npm run verify` is the same final stop-before-push command used locally and in CI
- `weak`: phase-level signal in `.githooks/pre-push` is still thin
  - the hook prints one banner and then hands off to `npm run verify`
  - failure locality depends on reading the downstream phase output, not on a richer wrapper surface

## Enforcement Triage

- `AUTO_EXISTING`
  - `npm run verify`
  - `npm run hooks:check`
  - checked-in `.githooks/pre-push`
  - `lint:specs`
  - runtime-focused `lint:archetypes`
  - `lint:links`
  - `golangci-lint`
  - `go vet`
  - `govulncheck`
  - Go race tests
  - standing Node tests
- `AUTO_CANDIDATE`
  - phase-label the final local gate more explicitly
  - add a rendered-markdown preview helper to the doc-review toolchain once the new `charness` support seam lands
  - continue collapsing duplicate proof between public specs and deeper deterministic tests
- `NON_AUTOMATABLE`
  - final reviewer judgment in self-dogfood and public-doc taste remains partially human

## Healthy

- The repo-owned standing bar is real, deterministic, and currently green.
- Maintainer-local enforcement is checked in and active.
- The brittle archetype prose lock was replaced with a more honest runtime-completeness gate.
- Source-guard pressure is effectively gone from the public spec path.
- Rendered README review with `glow` surfaced real readability issues and confirmed the docs now need structure-based fixes, not source-only wrap guessing.

## Weak

- `current-product.spec.md` and `html-report.spec.md` still mix current shipped contract with some future-state pressure.
- Public spec layering is improved but not yet cleanly minimized.
- `README.md` remains long for a first-touch entrypoint even after the quick-start cleanup.
- There is still no repo-owned rendered-markdown preview workflow; `glow` was helpful, but the repo has no checked-in seam for it yet.

## Missing

- No deterministic repo-owned command yet exists for rendered markdown preview across README and spec prose.
- No standing gate yet checks the rendered readability of landing docs or public specs.
  That is appropriate for now, but the helper surface itself is missing.

## Deferred

- Do not turn rendered readability into a hard fail gate yet.
  Start with preview artifacts or explicit preview commands first.
- Do not promote `dogfood:self` into the standing bar yet.
  Runtime cost and evaluator dependence still make it an explicit quality pass, not a stop-before-push command.
- Do not add a coverage floor yet.
  There is still no strong product motivator for one.

## Commands Run

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.1.1/skills/quality/scripts/resolve_adapter.py --repo-root .`
- `git status --short`
- `rg --files .`
- `git config --get core.hooksPath`
- `find .git/hooks -maxdepth 1 -type f`
- `rg -n "eslint|golangci|govulncheck|verify|pre-push|core\\.hooksPath|specdown|glow|coverage|..." .`
- `python3 .../inventory_public_spec_quality.py --repo-root .`
- `python3 .../inventory_entrypoint_docs_ergonomics.py --repo-root .`
- `python3 .../inventory_cli_ergonomics.py --repo-root .`
- `python3 .../inventory_standing_gate_verbosity.py --repo-root .`
- `python3 .../inventory_brittle_source_guards.py --repo-root .`
- `python3 .../inventory_skill_ergonomics.py --repo-root .`
- `python3 .../inventory_lint_ignores.py --repo-root .`
- `python3 .../inventory_dual_implementation.py --repo-root .`
- `npm run verify`
- `glow -w 100 README.md`
- `glow -w 100 README.ko.md`

## Recommended Next Gates

- `active` / `AUTO_CANDIDATE`: add a repo-owned markdown preview command once the `charness` support seam lands.
  Start with preview generation, not hard fail gating.
- `active` / `AUTO_CANDIDATE`: trim proof duplication in public specs.
  The next step is not “more spec”; it is deleting or moving duplicate proof to the right layer.
- `passive`: compress `README.md` further only when touching landing docs again.
  The current problem is entrypoint length, not a missing paragraph.
- `passive`: revisit `current-product.spec.md` and `html-report.spec.md` to remove remaining future-state mixing.

## Premortem Pass

Fresh-eye subagent path was not used because delegation was not explicitly requested.

Local premortem:

- The repo could mistake “verify passes” for “public spec layering is solved”.
  It is not; the quality inventory still reports proof overlap.
- The repo could mistake “glow helped once” for “rendered markdown QA now exists”.
  It does not; there is still no checked-in preview seam.
- The repo could overreact by turning readability into a hard fail gate too early.
  That would likely create noise before the helper and artifact model are stable.
