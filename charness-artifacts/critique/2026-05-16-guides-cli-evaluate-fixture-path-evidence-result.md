# Guides CLI Evaluate Fixture Path Evidence Critique

## Scope

Fresh-eye review for the claim evidence refresh that moves `claim-docs-guides-cli-md-273` to satisfied deterministic proof.

Success means the evidence is current-claim-id-bound to the `docs/guides/cli.md` claim that `cautilus evaluate fixture` runs a checked-in fixture through an adapter-owned runner and then evaluates the observed packet.

Out of scope: proving live model or app behavior, every adapter's runner readiness, adjacent proof metadata, adjacent runner-selection behavior, and the `evaluate observation` no-runner claim.

## Fresh-Eye Satisfaction

parent-delegated.

Three bounded reviewers inspected provenance, overclaim boundaries, counterweight risk, generated projections, focused command evidence, and scanner prepare packet context.

Packet consumed: `charness-artifacts/critique/2026-05-16-080211-packet.md`.

The packet's deterministic sections were findings-free and generic to the registered surfaces, so `charness-artifacts/critique/2026-05-16-080211-packet.{json,md}` was removed before commit as timestamp-only scanner context.

## Act Before Ship

- Fixed before commit: the first evidence draft overclaimed "checked-in fixture" based mostly on focused tests that create temp fixtures.
  The evidence bundle now includes checked-in fixture input hashes and a direct passing `dev/skill` checked-in fixture run through `cautilus evaluate fixture`.

## Bundle Anyway

- Provenance is coherent: `createdForClaimIds`, `supportsClaimIds`, fingerprint, and projection updates target only `claim-docs-guides-cli-md-273`.
- The review-result evidence ref hash was updated after the evidence bundle changed to `sha256:b9732421d5afd3510b94d6890808fe6987ec739cc0539406715263fb45c24711`.
- Focused verification passed:
  - `go test ./internal/app -run 'TestCLIEvalTestRunsDevRepoFixture|TestCLIEvalTestRunsDevSkillFixture|TestCLIEvalTestAcceptsFixtureRuntime|TestCLIEvalEvaluateDoesNotLaunchAdapterRunner' -count=1`
  - `./bin/cautilus evaluate fixture --repo-root . --adapter-name self-dogfood-eval-skill --runtime fixture --skip-preflight --output-dir /tmp/cautilus-guides-cli-273-dev-skill-proof-2026-05-16`
  - `./bin/cautilus doctor commands --json`
- The generated projection shows satisfied `55`, stale `20`, unknown `284`, and deterministic proof backlog `84`.
- The evidence bundle's `notClaimed` list prevents spillover into live behavior, all-adapter runner readiness, proof metadata, runner selection, and `evaluate observation`.

## Over-Worry

- Requiring live model or product-runner proof would exceed this claim.
  This is a deterministic CLI path claim.
- The prepare packet's `ready` status is not a broad repo-quality certificate; the packet itself limits coverage to the enumerated rule families.
- Same-agent evidence application is acceptable here because the slice attaches deterministic proof and was separately reviewed by bounded subagents.

## Valid But Defer

- The adjacent `evaluate observation` no-runner assertion remains `claim-docs-guides-cli-md-277` and should get a separate bundle.
- The direct `dev/repo` checked-in fixture run under `--runtime fixture` failed because the adapter runner requires `--fixture-results-file`; a legacy debug note recorded that requirement and was later removed during artifact cleanup, so this does not block this claim.
- Future critique packet work could add claim-specific evidence sections so reviewers do not receive only generic surface packets for claim-proof slices.
