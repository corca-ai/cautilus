# Quality Review
Date: 2026-07-08

## Scope

Minimal SkillOpt runtime absorption slice for Cautilus scenario proposal evidence provenance.
The review covered schema, Node runtime, Go runtime, CLI smoke, contract docs, claim refresh, and delegated fresh-eye critique disposition.

## Current Gates

- `./bin/cautilus doctor commands --json`
- `./bin/cautilus discover scenarios --json`
- `./bin/cautilus doctor --repo-root . --scope agent-surface`
- `node --test scripts/agent-runtime/scenario-proposals.test.mjs scripts/agent-runtime/scenario-proposal-schemas.test.mjs`
- `go test ./internal/runtime -run TestGenerateScenarioProposalsValidatesOptionalEvidenceProvenance`
- `go test ./internal/app -run 'TestCLIScenario(ProposeGeneratesStandaloneProposalPacket|NormalizeChatbotProducesCandidatesThatChainIntoPrepareAndPropose)$'`
- `npm run lint:eslint`
- `npm run lint:specs`
- `npm run lint:scenario-normalizers`
- `npm run test:coverage`
- `npm run coverage:floor:check`
- `npm run claims:refresh:all`
- `npm run verify`
- `npm run hooks:check`

## Runtime Signals

- runtime source: direct command output from the local quality and verification gates listed in `## Commands Run`; structured timing capture is missing.
- runtime hot spots: unavailable because structured timing capture is missing.
- coverage gate: `npm run test:coverage` and `npm run coverage:floor:check` passed.
- evaluator depth: deterministic local gates only, because this slice changed packet/schema/runtime preservation and did not require live provider or on-demand evaluator proof.
- command discovery: `./bin/cautilus doctor commands --json` passed.
- scenario discovery: `./bin/cautilus discover scenarios --json` passed.
- agent surface readiness: `./bin/cautilus doctor --repo-root . --scope agent-surface` passed with ready status.
- final verification: `npm run verify` passed all phases in 95.32s.
- hook verification: `npm run hooks:check` passed.

## Healthy

- Scenario proposal evidence now has bounded optional `origin` values for `real`, `synthetic`, `replayed`, and `operator_authored`.
- `activityProvenance` is a portable object with allowed keys only, bounded `split`, numeric `score`, and string identity fields.
- Go and Node runtimes reject malformed optional provenance instead of only relying on fixture schemas.
- CLI smoke now proves replay provenance through standalone propose and proves built-in normalized `origin: real` through normalize, prepare-input, and propose.
- Contract docs now distinguish complete input audit trail preservation from top-ranked emitted proposal evidence preservation.
- Final claim artifacts were refreshed after claim-source doc edits, and `npm run verify` reported claim freshness as current.

## Fixed In This Slice

- Added schema, fixture, runtime, and CLI proof for scenario proposal evidence provenance as the first implemented SkillOpt absorption route.
- Narrowed public wording that previously could read as if rejected-candidate, staged-adoption, replay/recall, or optimizer-adjacent routes were already implemented.
- Addressed delegated review findings about weak runtime validation, overbroad preservation claims, and untracked critique packets.

## Weak

- Proposal output intentionally keeps only top-ranked evidence entries, so lower-ranked evidence remains available in the input packet rather than every emitted proposal.
- HTML proposal rendering still summarizes evidence count and does not expose provenance details.
- `origin` remains optional in v1 for backwards compatibility.

## Missing

- No raw transcript reader, scheduler, optimizer loop, recall index, long-term memory store, or auto-apply route was added.
- No external CI, release, live-provider proof, or GitHub issue closeout was run for this local slice.

## Deferred

- A future v2 may make `origin` required or add semantic requirements such as `origin: replayed` requiring `replayId`.
- Rejected-candidate, staged-adoption, replay/recall, and optimizer-adjacent absorption routes remain contract targets rather than shipped runtime surfaces.
- Auditor-facing rendered provenance details can be added later if JSON packet inspection is not enough.

## Advisory

- `./scripts/run-quality.sh --read-only` was listed only as a conditional adapter gate and does not exist in this repo.
- The attempted invocation failed with `zsh: no such file or directory`; this was recorded as operator misuse of a conditional recommendation, not a Cautilus regression.

## Delegated Review

executed: parent-delegated fresh-eye review and counterweight review scoped to the SkillOpt runtime absorption packet/schema/helper slice.
Recorded critique packet: `charness-artifacts/critique/2026-07-08-013231-packet.md`.
Disposition: all Act Before Ship findings were addressed before final verification.

## Commands Run

- `./bin/cautilus doctor commands --json`
- `./bin/cautilus discover scenarios --json`
- `./bin/cautilus doctor --repo-root . --scope agent-surface`
- `node --test scripts/agent-runtime/scenario-proposals.test.mjs scripts/agent-runtime/scenario-proposal-schemas.test.mjs`
- `go test ./internal/runtime -run TestGenerateScenarioProposalsValidatesOptionalEvidenceProvenance`
- `go test ./internal/app -run 'TestCLIScenario(ProposeGeneratesStandaloneProposalPacket|NormalizeChatbotProducesCandidatesThatChainIntoPrepareAndPropose)$'`
- `npm run lint:eslint`
- `npm run lint:specs`
- `npm run lint:scenario-normalizers`
- `npm run test:coverage`
- `npm run coverage:floor:check`
- `npm run claims:refresh:all`
- `npm run verify`
- `npm run hooks:check`

## Recommended Next Quality Moves

- active repeat broad verification when claim-source files change — capability_needed=claim freshness; next_center=claim refresh; transformation=rerun `npm run claims:refresh:all` and `npm run verify`; proof_boundary=local deterministic gates; enforcement_posture=existing gate.
- passive rendered provenance details until auditor-facing HTML proof is claimed — capability_needed=proposal review UX; next_center=HTML renderer; transformation=show origin/provenance from emitted evidence; proof_boundary=focused renderer and proposal packet tests; enforcement_posture=no-gate because JSON packet proof is sufficient for this slice.
- passive additional SkillOpt absorption routes until a separate goal selects one — capability_needed=product boundary design; next_center=rejected-candidate, staged-adoption, replay/recall, or optimizer-adjacent route; transformation=implement one bounded route with tests; proof_boundary=goal-specific local verification; enforcement_posture=no-gate because these routes are explicitly deferred.

## History

- [2026-05-10 quality review](2026-05-10-quality-review.md)
- [2026-04-22 quality review](history/2026-04-22.md)
