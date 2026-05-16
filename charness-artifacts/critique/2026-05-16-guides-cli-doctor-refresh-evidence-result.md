# Guides CLI Doctor And Refresh Evidence Critique

## Scope

Fresh-eye review for the claim evidence refresh that moves `claim-docs-guides-cli-md-121` and `claim-docs-guides-cli-md-127` from stale deterministic backlog to satisfied deterministic proof.

Success means the evidence stays current-claim-id-bound to the `docs/guides/cli.md` named-adapter doctor and refresh-plan overwrite claims, with coherent commit/hash provenance and generated projections.

Out of scope: broad stale evidence cleanup, human buckets, release packaging, and claim discovery heuristic redesign.

## Fresh-Eye Satisfaction

parent-delegated.

Three bounded reviewers inspected the diff, new evidence bundle, review-result, generated projections, focused app/CLI tests, and current hashes.

## Act Before Ship

- The new evidence bundle and review-result must be committed with the generated projections because the projections now reference `.cautilus/claims/evidence-guides-cli-doctor-refresh-boundaries-2026-05-16.json`.

## Bundle Anyway

- The bundle hash, review-result evidence ref hash, and generated projection hashes all match `sha256:8bc174c8f52ddfd1a7ca3f0a93e90bb05f68e656181401e9b3dfddcc0aa68bbe`.
- The `repoCommit` resolves to `7918102e24496ec789c290697060547afad87b28`.
- The checked-in evidence hashes match current `docs/guides/cli.md`, `internal/app/cli_smoke_test.go`, `internal/app/app_test.go`, `internal/app/app.go`, `internal/cli/command-registry.json`, and `internal/cli/registry_test.go`.
- The proof boundary is narrow: `createdForClaimIds` lists only the two current CLI guide claims, and `notClaimed` excludes plain doctor auto-selection, arbitrary JSON overwrite coverage, and broader production behavior.
- The projection effect is coherent: satisfied increases from 50 to 52, stale decreases from 23 to 21, and `agent-add-deterministic-proof` decreases from 89 to 87.

## Over-Worry

- `.cautilus/claims/latest.json` still showing the pre-review stale state is not a blocker because the repo applies current review results into `.cautilus/claims/evidenced-typed-runners.json` and derived status/report/evidence-state projections.
- Existing global `claims:audit-evidence` warnings are not blockers for this slice because audit reports `issueCount=0` and `status=ok`, and this bundle has no direct hash mismatch.
- Sharing one bounded evidence bundle across the two current claims is acceptable because both claims are explicitly listed and covered by the same focused CLI boundary tests.

## Valid But Defer

- Remaining stale evidence backlog cleanup is still valid but outside this slice.
- Canonical claim map semantic sampling details for these claims can stay in the normal semantic review queue.
