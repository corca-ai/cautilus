# README Spec Report Renderer Independence Evidence Critique

## Scope

Fresh-eye review for the claim evidence refresh that moves `claim-readme-md-69` to satisfied deterministic proof.

Success means the evidence is current-claim-id-bound to the `README.md` claim that the public website report is generated from the claim spec tree, while host repos do not need that renderer before Cautilus can inspect readiness, claims, evals, or improvement work.

Out of scope: proving public website deployment freshness, every host repo's adapter readiness, eval or improvement execution quality, and a gap-free spec tree.

## Fresh-Eye Satisfaction

parent-delegated.

Three bounded reviewers inspected provenance, overclaim boundaries, counterweight risk, generated projections, focused command evidence, specdown report evidence, and scanner prepare packet context.

Packet consumed: `charness-artifacts/critique/2026-05-16-082518-packet.md`.

The packet's deterministic sections were findings-free and generic to the registered surfaces, so `charness-artifacts/critique/2026-05-16-082518-packet.{json,md}` was removed before commit as timestamp-only scanner context.

## Act Before Ship

- Fixed before commit: the first evidence draft described `eval-surface inspection` and `improvement-surface inspection` too broadly while relying mostly on catalog/help availability.
  The bundle now adds direct `doctor packet inspect` proof for an eval-plan packet and an improve-input packet, and the review reason now says CLI surfaces are discoverable while eval/improve packet inspection is available.

## Bundle Anyway

- Provenance is coherent: `createdForClaimIds`, `supportsClaimIds`, fingerprint, and projection updates target only `claim-readme-md-69`.
- The review-result evidence ref hash was updated after the bundle changed to `sha256:43d0d224a76f46814e4ea452aefaf5c0a52b03fc3113c293f8bc56a2106dc9d2`.
- Focused verification passed:
  - `npm run lint:specs`
  - `go test ./internal/app -run 'TestRunDoctorDoesNotBlockWhenSpecdownMissingAndPacketsValidate|TestRunCommandsJSONReturnsRegistry|TestRunDoctorDoesNotRequireToolRootForNativeCommands|TestRunPrefixHelpWorksForCommandGroups' -count=1`
  - `go test ./internal/cli -run 'TestRenderUsageGroupsCommandsByPurpose|TestRenderUsageIncludesLifecycleCommands|TestRenderTopicUsageIncludesGroupedSubcommandsForPrefixes' -count=1`
  - `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/prepare-specdown-pages.test.mjs scripts/lint-specs.test.mjs`
  - `./bin/cautilus doctor commands --json`
  - `./bin/cautilus doctor packet inspect --input .cautilus/claims/eval-plan-evidenced-typed-runners.json`
  - `./bin/cautilus doctor packet inspect --input fixtures/improve/example-input.json`
- The generated projection shows satisfied `57`, stale `20`, unknown `282`, and deterministic proof backlog `82`.
- The evidence bundle's `notClaimed` list prevents spillover into deployment freshness, all-host readiness, eval/improve behavior quality, renderer usefulness, and gap-free spec claims.

## Over-Worry

- Requiring proof that GitHub Pages is freshly deployed would exceed this claim.
  The proof here is local report generation from the checked-in spec tree.
- Requiring every host repo to run eval or improve without adapter setup would overread "inspect" as "execute".
- Requiring eval/improve behavior-quality proof is out of scope for renderer independence and CLI/packet inspection.
- `.cautilus/claims/latest.json` remains the raw discovery input; the evidence-applied source of truth is `evidenced-typed-runners.json` plus `status-summary.json`.

## Valid But Defer

- A future tighter smoke could run an eval-planning or improve-inspection command with `specdown` absent if a later claim asserts more than packet inspection and surface discovery.
- If Cautilus later wants `agent-reviewed` to imply fresh-eye independence instead of review-result application, that should become a separate status-semantics change.
