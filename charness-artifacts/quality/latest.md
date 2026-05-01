# Quality Review

Date: 2026-05-01

Prior durable reviews:

- `charness-artifacts/quality/history/2026-04-22.md`
- `charness-artifacts/quality/history/2026-04-12.md`
- `charness-artifacts/quality/quality.md` (2026-04-15)

## Scope

Proof-boundary audit for the current `claim` / `eval` / `optimize` posture after app surfaces, runner readiness, proof-class downgrades, claim evidence carry-forward, and review-to-eval evidence landed.
The most likely ownership seam to be wrong is overclaiming: fixture-backed app smoke, Codex/Claude backend proof, `eval live` product-runner proof, and runner-assessed app proof must stay distinct.

## Concept Risks

- `package.json` previously named Codex app messaging dogfood scripts `dogfood:app-chat:live` and `dogfood:app-prompt:live`.
  That was misleading because the scripts execute `cautilus eval test --runtime codex`; they are not `cautilus eval live` product-runner proof.
  The scripts are now renamed to `dogfood:app-chat:codex` and `dogfood:app-prompt:codex`, with no compatibility aliases.
- `docs/cli-reference.md` now states explicitly that Codex/Claude app dogfood proves backend execution over checked-in fixtures, not product-runner app proof.
- The runner-readiness and runner-verification contracts correctly say app product proof requires a host-owned runner assessment and product-proof capability evidence.
- Public spec layering still shows duplicate-proof pressure.
  `inventory_public_spec_quality.py` reports `duplicate_public_spec_examples` and `proof_layering_review_needed`.
- `README.md` remains long for first-touch scanning at 209 lines.
  This is a product-doc ownership issue, not a correctness blocker for this slice.
- `skills/cautilus/SKILL.md` still has `option_pressure_terms_present`.
  It is below the line limit and uses progressive disclosure, but branch wording should remain a review target when the skill changes.

## Current Gates

- `npm run verify`
- `npm run hooks:check`
- checked-in `.githooks/pre-push` running `npm run verify`
- `npm run lint:specs`
- `npm run lint:contracts`, including `check-proof-boundary-names`
- `go test ./internal/runtime`
- `python3 /home/hwidong/.codex/plugins/charness/scripts/validate_debug_artifact.py --repo-root .`
- On-demand Cautilus dogfood commands remain outside standing pre-push unless a specific slice asks for them.

## Runtime Signals

- `python3 .../quality/scripts/resolve_adapter.py --repo-root .` found a valid quality adapter at `.agents/quality-adapter.yaml`.
- `python3 .../find-skills/scripts/list_capabilities.py --repo-root .` reported unchanged canonical find-skills artifacts.
- `inventory_public_spec_quality.py` still reports spec layering review pressure, but no source-guard rows.
- `inventory_entrypoint_docs_ergonomics.py` reports `README.md` as `long_entrypoint`.
- `inventory_cli_ergonomics.py` produced no findings.
- `inventory_skill_ergonomics.py` reports `option_pressure_terms_present` for the bundled skill.
- `npm run dogfood:app-chat:codex` passed with `recommendation=accept-now`, `passed=1`, `failed=0`, and proof metadata `productProofReady=false`, `runnerAssessmentState=missing-assessment`.
- `npm run dogfood:app-prompt:codex` passed with `recommendation=accept-now`, `passed=1`, `failed=0`, and proof metadata `productProofReady=false`, `runnerAssessmentState=missing-assessment`.

## Standing Test Economics

The latest full `npm run verify` in this session passed in about 42 seconds.
The dominant standing costs were Go race tests and spec lint.
That remains acceptable for the checked-in pre-push hook and CI.

## Coverage and Eval Depth

- No standing coverage-floor gate is enforced.
  This remains intentionally deferred unless a concrete escaped behavior or release requirement makes percentage coverage a low-noise authority.
- Deterministic depth is strong for the current product surface: lint, executable specs, contract checks, link checks, Go lint/vet/race tests, Node tests, govulncheck, and secret scan are all in the standing verify command.
- Evaluator-backed depth is strong for the named dogfood branches that have fixtures and checked artifacts.
  It should not be generalized to broad app quality unless the proof class is `in-process-product-runner` or `live-product-runner` with a ready runner assessment.

## Maintainer-Local Enforcement

- `healthy`: checked-in `.githooks/pre-push`
- `healthy`: `core.hooksPath=.githooks`
- `healthy`: local pre-push and GitHub Actions both run `npm run verify`
- `healthy`: `npm run hooks:check` verifies local hook installation
- `weak`: coverage-floor policy exists in adapter-shaped metadata but has no live standing gate

## Enforcement Triage

- `AUTO_EXISTING`: `npm run verify`, `npm run hooks:check`, `lint:specs`, `lint:contracts`, `check-proof-boundary-names`, Go race tests, Node tests, govulncheck, secret scan, `claim validate`, `claim plan-evals`, proof-class summarization, runner-readiness reporting.
- `AUTO_EXISTING`: `check-proof-boundary-names` fails when a `dogfood:*:live` npm script does not call `cautilus eval live`.
  The protected structure is proof-class vocabulary, and a failure should trigger renaming or an explicit `eval live` implementation.
- `AUTO_CANDIDATE`: continue collapsing duplicate proof across public specs and lower-level deterministic tests.
  A failure should trigger deleting or relocating duplicate examples, not widening public specs.
- `NON_AUTOMATABLE`: final judgment about whether `README.md` should be split for first-touch adoption.

## Healthy

- App fixture smoke, Codex/Claude backend proof, and product-runner proof are now separated in command names and docs.
- `claim discover --previous` rechecks carried direct/verified evidence refs with `contentHash` before preserving satisfied evidence.
- Review-to-eval proof is now supported by both Codex and Claude dogfood artifacts.
- `claim review apply-result` can clear stale unresolved questions with an explicit empty array.
- The standing deterministic gate is green and hook-backed.

## Weak

- `README.md` is still long and should be revisited during landing-doc work.
- Public spec layering still has duplicate-proof pressure.
- Generic public-skill validation policy is not configured for this repo; Cautilus still relies on product-owned dogfood fixtures and deterministic tests.

## Missing

- No live coverage-floor gate exists.
- No broad app-product proof exists for app/chat or app/prompt.
  The current app dogfood proves fixture translation, evaluator packets, and Codex/Claude backend runs over checked-in fixtures.
  It does not prove a host app's real route, tool, state, or middleware path.

## Deferred

- Do not promote app fixture or Codex/Claude backend dogfood into broad app quality proof.
- Do not promote `dogfood:self` or app dogfood into standing pre-push without a separate runtime-cost decision.
- Fresh-eye subagent review was not run because the active host instructions only allow subagents when the user explicitly asks for sub-agent delegation.
  This leaves delegated review `blocked`, not substituted by same-agent review.

## Commands Run

- `python3 /home/hwidong/.codex/plugins/charness/skills/find-skills/scripts/resolve_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/charness/skills/find-skills/scripts/list_capabilities.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/charness/skills/quality/scripts/resolve_adapter.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/charness/skills/quality/scripts/inventory_public_spec_quality.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/charness/skills/quality/scripts/inventory_entrypoint_docs_ergonomics.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/charness/skills/quality/scripts/inventory_cli_ergonomics.py --repo-root .`
- `python3 /home/hwidong/.codex/plugins/charness/skills/quality/scripts/inventory_skill_ergonomics.py --repo-root .`
- `rg -n "dogfood:app-(chat|prompt):live|app-(chat|prompt)-live|live variants|live run returned|one-case live Codex|live Codex" ...`
- `node scripts/check-proof-boundary-names.mjs`
- `npm run dogfood:app-chat:codex`
- `npm run dogfood:app-prompt:codex`

## Recommended Next Gates

- `active` / `AUTO_CANDIDATE`: keep public-spec proof layering cleanup in scope when editing specs.
- `passive`: keep coverage-floor work deferred until a concrete missed behavior or release requirement makes it the right authority.
