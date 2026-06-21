---
type: contract
---

# Readiness And Runtime Status

Doctor and doctor status expose readiness without proving behavior claims.

Map keys: `promise.readiness`, `rule.evidence-gaps`, `rule.vocabulary-consistency`, `rule.agent-human-resumability`.
Evidence path: deterministic.
Evidence status: open gap.
Next action: keep doctor, doctor status, runner-readiness assessment, and active-run status sharing the same readiness facts.

Terms covered here: doctor, doctor status, adapter resolve, named adapter, runner readiness, active run, missing git repo, install state, next action, first bounded run.

## Maintainer Promise

Readiness commands tell the operator what can run next, what is blocked, and which command continues the loop; ready means the selected Cautilus surface can run, not that the repo's behavior promises are already proven.

## Subclaims

- `doctor` and `doctor status` share the same readiness facts and runner-readiness assessment rather than duplicating decisions.
- Readiness output explains what is ready, what is blocked, and which command continues the loop.
- `doctor` check objects separate stable `meaning` from run-specific `detail`.
- A ready doctor result means the selected Cautilus surface can run, not that the repo's behavior claims are proven.

## Evidence

- [internal/runtime/runner_readiness_test.go](../../../internal/runtime/runner_readiness_test.go) `TestDoctorAndAgentStatusShareRunnerReadinessFacts` directly asserts the parity of readiness verdicts between `doctor` and `doctor status`.
- The shared runner-readiness assessment is implemented in [internal/runtime/runner_readiness.go](../../../internal/runtime/runner_readiness.go) and covered by the surrounding tests in the same file.
- The user-facing readiness surface smoke is enforced by [docs/specs/user/doctor-readiness.spec.md](../user/doctor-readiness.spec.md) (specdown directives over `doctor --help` and `doctor status --json`).

## Evidence Gaps

- Negative test proving a ready doctor result does not silently advertise behavior-claim satisfaction. Owner: maintainer. Next action: add an assertion that the readiness packet does not include claim-satisfied counts in its public fields; existing tests cover share-of-facts but not this absence property.
