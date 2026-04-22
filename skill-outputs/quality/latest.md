# Quality Review

Date: 2026-04-22

Prior durable reviews:

- `skill-outputs/quality/quality.md` (2026-04-15)
- `skill-outputs/quality/history/2026-04-12.md`

## Scope

Repo-wide posture refresh for the current standing gate, rendered-doc proof seam, and explicit self-dogfood review surface.
Focus on whether `npm run verify` still matches the repo's claimed stop-before-push contract and whether evaluator-backed quality remains operational.

## Concept Risks

- The standing gate had drifted from the repo's claimed contract.
  `package.json` kept `lint:contracts`, but `scripts/run-verify.mjs` omitted it until this review.
- Public spec layering still shows duplicate-proof pressure.
  `inventory_public_spec_quality.py` still reports `duplicate_public_spec_examples` and `proof_layering_review_needed`.
- `README.md` remains a long first-touch entrypoint.
  `inventory_entrypoint_docs_ergonomics.py` still flags `README.md` as `long_entrypoint`.

## Current Gates

- `npm run verify`
  - `lint:eslint`
  - `lint:specs`
  - `lint:archetypes`
  - `lint:contracts`
  - `lint:links`
  - `lint:go`
  - `vet:go`
  - `security:govulncheck`
  - `test:go:race`
  - `test:node`
- `npm run hooks:check`
- checked-in `.githooks/pre-push` running `npm run verify`
- `npm run docs:preview`
- `npm run dogfood:self`
  - explicit quality work, not standing pre-push

## Runtime Signals

- `python3 .../resolve_adapter.py --repo-root .` found a valid quality adapter.
- `git status --short` was clean at review start.
- `npm run hooks:check` passed and confirmed `core.hooksPath=.githooks`.
- `npm run docs:preview:specs` passed and rendered 16 snapshots across 8 spec files into `.artifacts/markdown-preview`.
- `npm run verify` passed after restoring `lint:contracts` to the phase list.
  Total runtime in this session was about 17.21s.
- `npm run dogfood:self` failed in this session.
  The generated `artifacts/self-dogfood/latest/summary.json` reports `overallStatus: blocker` because the lone `codex-review` variant ended with `executionStatus: failed` and only the generic reason `review variant command failed`.

## Coverage and Eval Depth

- No standing coverage floor is enforced.
  The adapter carries coverage-floor policy shape, but the repo does not currently claim a live coverage-floor gate.
- Deterministic depth is healthy.
  Standing lint, link, Go, security, race, and Node gates are real and green.
- Evaluator-backed depth is currently weak.
  The explicit self-dogfood review surface exists, but the current run did not complete a usable executor-backed review result.

## Maintainer-Local Enforcement

- `healthy`: checked-in `.githooks/pre-push`
- `healthy`: `core.hooksPath=.githooks`
- `healthy`: local pre-push and GitHub Actions both run `npm run verify`
- `healthy`: `scripts/run-verify.mjs` now names phases explicitly, including `lint:contracts`
- `weak`: failed self-dogfood review variants do not leave enough operator-facing failure detail in the published latest bundle

## Enforcement Triage

- `AUTO_EXISTING`
  - `npm run verify`
  - `npm run hooks:check`
  - checked-in `.githooks/pre-push`
  - `npm run docs:preview`
  - `lint:specs`
  - `lint:archetypes`
  - `lint:contracts`
  - `lint:links`
  - `golangci-lint`
  - `go vet`
  - `govulncheck`
  - Go race tests
  - standing Node tests
- `AUTO_CANDIDATE`
  - keep `review-summary.json` linked to concrete stderr or artifact paths when a review variant command fails
  - add an executor preflight or clearer fatal reason for the `codex-review` self-dogfood seam
  - continue collapsing duplicate proof between public specs and deeper deterministic tests
- `NON_AUTOMATABLE`
  - final reviewer judgment in self-dogfood and landing-doc taste remains partially human

## Healthy

- The standing deterministic bar is real, checked in, and green.
- Maintainer-local enforcement is active and aligned with CI.
- Rendered markdown preview now exists as a repo-owned seam and passes in this session.
- The `verify` contract gap was fixed in this review instead of being left as prose debt.

## Weak

- Evaluator-backed self-dogfood is currently blocked by a failed review variant execution.
- The published self-dogfood latest bundle flattens that failure into a generic message, which weakens operator diagnosis.
- Public spec layering still needs structural cleanup rather than more surface-area growth.
- `README.md` is still long for first-touch scanning.

## Missing

- No standing gate proves executor-backed self-dogfood review readiness before `dogfood:self` is invoked.
- No published latest-bundle field currently points operators to captured stderr or a concrete host-side failure cause when a review variant command fails.

## Deferred

- Do not promote `dogfood:self` into the standing pre-push gate yet.
  Its runtime cost and executor dependence still make it explicit quality work.
- Do not add a coverage floor yet.
  There is still no clear product reason to make coverage percentage the standing authority.
- Do not turn rendered markdown preview into a hard fail gate yet.
  The current seam is useful as advisory proof.

## Commands Run

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.4/skills/quality/scripts/resolve_adapter.py --repo-root .`
- `rg --files .`
- `git status --short`
- `sed -n '1,220p' skill-outputs/quality/latest.md`
- `sed -n '1,220p' docs/internal/handoff.md`
- `rg -n "eslint|ruff|mypy|pyright|tsc|pytest|vitest|jest|coverage|..." .`
- `git config --get core.hooksPath`
- `find .git/hooks -maxdepth 1 -type f`
- `python3 .../inventory_cli_ergonomics.py --repo-root .`
- `python3 .../inventory_standing_gate_verbosity.py --repo-root .`
- `python3 .../inventory_dual_implementation.py --repo-root .`
- `python3 .../inventory_entrypoint_docs_ergonomics.py --repo-root .`
- `python3 .../inventory_public_spec_quality.py --repo-root .`
- `python3 .../inventory_brittle_source_guards.py --repo-root .`
- `python3 .../inventory_skill_ergonomics.py --repo-root .`
- `python3 .../inventory_lint_ignores.py --repo-root .`
- `npm run lint:contracts`
- `node --test scripts/run-verify.test.mjs`
- `npm run hooks:check`
- `npm run docs:preview:specs`
- `npm run verify`
- `npm run dogfood:self`

## Recommended Next Gates

- `active` / `AUTO_CANDIDATE`: make failed review variants publish concrete diagnostic evidence.
  The structural question is whether operator-facing self-dogfood can stay trustworthy when the executor layer fails.
  A failure should point to stderr or an artifact path, not only `review variant command failed`.
- `active` / `AUTO_CANDIDATE`: add a bounded readiness check for the configured review executor before `dogfood:self` relies on it.
  The invariant is low-noise because the adapter already declares a concrete `codex-review` backend.
- `active` / `AUTO_CANDIDATE`: keep deleting duplicate proof across public specs and deeper deterministic tests.
  The next step is structural compression, not more spec text.
- `passive`: compress `README.md` further when landing-doc work resumes.
  The pressure is first-touch length, not missing explanation.

## Premortem Pass

Local premortem:

- The repo could over-celebrate the green standing gate and miss that evaluator-backed self-dogfood is presently blocked.
- The repo could treat the new markdown preview seam as solved posture and still leave landing-doc length pressure untouched.
- The repo could chase more public spec prose instead of deleting duplicated proof at the wrong layer.
