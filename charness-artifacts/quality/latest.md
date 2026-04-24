# Quality Review

Date: 2026-04-24

Prior durable reviews:

- `charness-artifacts/quality/history/2026-04-22.md`
- `charness-artifacts/quality/quality.md` (2026-04-15)
- `charness-artifacts/quality/history/2026-04-12.md`

## Scope

Repo-wide posture refresh for the current deterministic gate, maintainer-local enforcement, public spec layering, and evaluator-backed self-dogfood surface.
The most likely ownership seam to be wrong is still proof placement: public executable specs, lower-level tests, generated self-dogfood artifacts, and first-touch docs all prove adjacent claims and can drift into duplicate or over-broad evidence.

## Concept Risks

- Public spec layering still shows duplicate-proof pressure.
  `inventory_public_spec_quality.py` reports `duplicate_public_spec_examples` and `proof_layering_review_needed`.
- `README.md` remains a long first-touch entrypoint.
  `inventory_entrypoint_docs_ergonomics.py` flags it as `long_entrypoint` at 171 lines.
- The public-skill dogfood suggestion helper could not run because this repo has no `docs/public-skill-validation.json` policy.
  That is not a product failure by itself, but it means public skill routing proof is still owned by repo-specific self-dogfood and deterministic tests rather than the generic public-skill matrix helper.
- `scripts/agent-runtime/evaluate-skill.mjs` and the generated candidate copy carry file-level `max-lines` suppressions.
  This is an explicit pressure signal, not harmless background lint debt.

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
- `npm run docs:preview:specs`
- `npm run dogfood:self`
  - explicit quality work, not standing pre-push

## Runtime Signals

- `python3 .../resolve_adapter.py --repo-root .` found a valid quality adapter at `.agents/quality-adapter.yaml`.
- `./bin/cautilus adapter resolve --repo-root .` found a valid product adapter at `.agents/cautilus-adapter.yaml`.
- `git status --short` was clean at review start.
- `npm run hooks:check` passed and confirmed `core.hooksPath=.githooks`, an existing `.githooks/pre-push`, and executable permissions.
- `npm run docs:preview:specs` passed and rendered 16 snapshots across 8 spec files into `.artifacts/markdown-preview`.
- `npm run verify` passed in 29.92s.
- `npm run dogfood:self` passed and refreshed `artifacts/self-dogfood/latest/*`.
  The run produced `overallStatus: pass`, `gateRecommendation: accept-now`, and one passing `codex-review` variant.
- The self-dogfood review variant duration was 10.442s, down from the previous checked-in latest bundle's 17.964s.

## Standing Test Economics

- The standing gate is compact enough for pre-push and CI at about 30s in this run.
- The dominant standing cost is `test:go:race` at 13.24s, followed by `lint:specs` at 8.49s and `lint:eslint` at 3.04s.
- `dogfood:self` remains correctly outside the standing gate because it depends on the review executor and refreshes generated artifacts.
- Phase-level signal is healthy in `scripts/run-verify.mjs`, but `.githooks/pre-push` only prints one umbrella line before handing off to `npm run verify`.
  This is acceptable because `run-verify.mjs` owns phase labels and `verify:verbose` exists as the on-demand escape hatch.

## Coverage and Eval Depth

- No standing coverage floor is enforced.
  The quality adapter resolution reports a coverage-floor policy shape, but `coverage_floor_inventory.py` fails with `no gate scripts matched gate_script_pattern`, so there is no live coverage-floor gate.
- Deterministic depth is healthy.
  Standing lint, spec, archetype, contract, link, Go lint/vet, govulncheck, Go race, and Node tests are real and green.
- Evaluator-backed depth is healthy for the narrow self-dogfood claim in this run.
  It is still on-demand rather than standing, and it proves honest recording and surfacing of the self-dogfood result rather than broader binary or public-skill coverage.

## Maintainer-Local Enforcement

- `healthy`: checked-in `.githooks/pre-push`
- `healthy`: `core.hooksPath=.githooks`
- `healthy`: local pre-push and GitHub Actions both run `npm run verify`
- `healthy`: `npm run hooks:check` verifies the local hook installation contract
- `weak`: coverage-floor policy exists as adapter-shaped metadata but has no live gate script

## Enforcement Triage

- `AUTO_EXISTING`
  - `npm run verify`
  - `npm run hooks:check`
  - checked-in `.githooks/pre-push`
  - GitHub Actions `verify`
  - `npm run docs:preview:specs`
  - `npm run dogfood:self`
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
  - add or intentionally waive `docs/public-skill-validation.json` if the generic public-skill dogfood matrix should cover the bundled `cautilus` skill.
    The structural question is whether public-skill routing proof belongs in the generic helper or remains owned by the product's self-dogfood adapter.
    A failure should trigger adding the policy file or documenting that this product intentionally uses a different skill-validation seam.
  - split or retire the file-level `max-lines` suppression in `scripts/agent-runtime/evaluate-skill.mjs` once the next edit touches that seam.
    The structural question is whether skill evaluation has too many responsibilities in one runtime file.
    A failure should trigger extracting schema parsing, execution, or summary rendering rather than widening the suppression.
  - keep collapsing duplicate proof across public specs and lower-level deterministic tests.
    The structural question is which layer owns examples versus executable behavior checks.
    A failure should trigger deletion or relocation of duplicate proof, not adding more spec prose.
- `NON_AUTOMATABLE`
  - final concept judgment about whether `README.md` is too long for first-touch adoption
  - final reviewer judgment in self-dogfood findings

## Healthy

- The standing deterministic bar is real, checked in, CI-backed, and green.
- Maintainer-local enforcement is active and aligned with CI.
- Rendered spec preview exists as repo-owned proof and passes.
- Self-dogfood is currently passing with executor-backed review depth for its intentionally narrow claim.
- No dual-implementation parity smell was found by the advisory inventory.
- Inline prompt/content bulk inventory returned no findings under the current policy.

## Weak

- Public spec layering still needs structural cleanup rather than more executable prose.
- `README.md` remains long for first-touch scanning.
- Public-skill matrix dogfood is not configured for this repo.
- File-level lint suppression pressure remains around `scripts/agent-runtime/evaluate-skill.mjs`.

## Missing

- No live coverage-floor gate exists.
  This is not automatically a blocker, but the adapter-shaped policy can be misread as active enforcement.
- No explicit public-skill validation policy exists for the generic dogfood suggestion helper.

## Deferred

- Do not promote `dogfood:self` into the standing pre-push gate.
  Its executor dependency and artifact writes make it explicit quality work.
- Do not add a coverage floor yet unless a real escaped defect or product requirement makes percentage coverage the right authority.
- Do not compress `README.md` as a cosmetic quality edit.
  The structural move is to clarify first-touch ownership and progressive disclosure when landing-doc work resumes.
- Fresh-eye subagent review was not run in this session because the host policy only permits subagents when the user explicitly requests sub-agent delegation.
  This leaves a host-contract gap for the canonical fresh-eye path rather than a substitute same-agent pass.

## Commands Run

- `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.5.8/skills/quality/scripts/resolve_adapter.py --repo-root .`
- `rg --files .`
- `git status --short`
- `sed -n '1,260p' charness-artifacts/quality/latest.md`
- `sed -n '1,240p' package.json`
- `sed -n '1,220p' go.mod`
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
- `python3 .../suggest_public_skill_dogfood.py --repo-root . --skill-id cautilus`
- `python3 .../suggest_public_skill_dogfood.py --repo-root . --json`
- `python3 .../find_inline_prompt_bulk.py --repo-root .`
- `python3 .../coverage_floor_inventory.py --repo-root .`
- `python3 .../list_tool_recommendations.py --repo-root .`
- `./bin/cautilus adapter resolve --repo-root .`
- `npm run hooks:check`
- `npm run docs:preview:specs`
- `npm run verify`
- `npm run dogfood:self`

## Recommended Next Gates

- `active` / `AUTO_CANDIDATE`: decide whether to add `docs/public-skill-validation.json` for the bundled public skill.
  If the generic helper should own public-skill routing proof, add the policy and a generated dogfood matrix case.
  If not, document why `dogfood:self` and deterministic tests are the canonical seam.
- `active` / `AUTO_CANDIDATE`: when `scripts/agent-runtime/evaluate-skill.mjs` changes next, split the responsibility that forced file-level `max-lines` suppression.
  Do not simply raise the threshold.
- `active` / `AUTO_CANDIDATE`: continue deleting or relocating duplicate proof across public specs and lower-level tests.
  Treat the public spec as the reader-facing contract and unit/script tests as detailed behavior proof.
- `passive`: keep coverage-floor work deferred until there is a concrete missed behavior or release requirement that makes coverage percentage a low-noise authority.
