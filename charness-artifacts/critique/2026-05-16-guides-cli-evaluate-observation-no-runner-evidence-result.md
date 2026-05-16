# Guides CLI Evaluate Observation No-Runner Evidence Critique

## Scope

Fresh-eye review for the claim evidence refresh that moves `claim-docs-guides-cli-md-277` to satisfied deterministic proof.

Success means the evidence is current-claim-id-bound to the `docs/guides/cli.md` claim that `cautilus evaluate observation` evaluates an already-observed packet without launching the runner again.

Out of scope: proving `evaluate fixture` runner execution, proof metadata behavior, runner selection, live behavior, all-schema semantic quality, and full runner readiness.

## Fresh-Eye Satisfaction

parent-delegated.

Three bounded reviewers inspected provenance, overclaim boundaries, counterweight risk, generated projections, focused command evidence, packet evidence, and scanner prepare packet context.

Packet consumed: `charness-artifacts/critique/2026-05-16-081526-packet.md`.

The packet's deterministic sections were findings-free and generic to the registered surfaces, so `charness-artifacts/critique/2026-05-16-081526-packet.{json,md}` was removed before commit as timestamp-only scanner context.

## Act Before Ship

None.

## Bundle Anyway

- Provenance is coherent: `createdForClaimIds`, `supportsClaimIds`, fingerprint, and projection updates target only `claim-docs-guides-cli-md-277`.
- The review-result evidence ref hash matches the evidence bundle hash `sha256:a5aca507605edd98dbcaa61c068f37b3b435ea1b1c71b16d51b956c2132f878f`.
- Focused verification passed:
  - `go test ./internal/app -run 'TestCLIEvalEvaluateDoesNotLaunchAdapterRunner|TestCLIEvalEvaluateAcceptsSkillObservedPacket|TestCLIEvalEvaluateAcceptsAppChatObservedPacket|TestCLIEvalEvaluateAcceptsAppPromptObservedPacket' -count=1`
  - `./bin/cautilus evaluate observation --input /tmp/cautilus-guides-cli-273-dev-skill-proof-2026-05-16/eval-observed.json --output /tmp/cautilus-guides-cli-277-observation-recheck-2026-05-16.json`
  - `./bin/cautilus doctor commands --json`
- The direct `/tmp` packet recheck is supporting evidence only.
  The durable proof is the checked-in no-runner sentinel test and command implementation.
- The generated projection shows satisfied `56`, stale `20`, unknown `283`, and deterministic proof backlog `83`.
- The evidence bundle's `notClaimed` list prevents spillover into `evaluate fixture`, proof metadata, runner selection, live behavior, all-schema semantic quality, and runner readiness.

## Over-Worry

- Requiring schema-specific runner-sentinel tests for every observed-packet schema would exceed this claim.
  `handleEvalEvaluate` ignores `repoRoot`, reads the input packet, and dispatches by schema without adapter runner resolution.
- Checking `/tmp` packet payloads into the repo is unnecessary for this slice because the command is reproducible and the durable no-runner proof is checked in.
- Proof metadata in packet evidence is not an overclaim because the bundle explicitly excludes proof metadata claims.
- The prepare packet's `ready` status is not a broad repo-quality certificate; the packet itself limits coverage to the enumerated rule families.

## Valid But Defer

- Future evidence slices could snapshot temporary packet payloads into repo-owned artifacts when packet body durability matters more than command reproducibility.
- Canonical claim-map confidence changes for this claim are generator behavior worth watching later, but they do not weaken this proof attachment.
- Broader semantic quality of each summary builder remains a separate surface from the packet-only/no-runner boundary.
