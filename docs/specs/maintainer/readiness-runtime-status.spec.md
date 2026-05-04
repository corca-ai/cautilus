# Readiness And Runtime Status

Doctor and agent status expose readiness without proving behavior claims.

Aligned user claims: U4, U5.
Proof route: deterministic.
Current evidence status: partial.
Next action: keep doctor, agent status, runner-readiness assessment, active-run status, and `specdown_available` checks sharing the same readiness facts.

Absorbs: doctor, agent status, adapter resolve, named adapter, runner readiness, active run, specdown prerequisite, missing git repo, install state, next action, first bounded run.

## Maintainer Promise

Readiness commands tell the operator what can run next, what is blocked, and which command continues the loop; ready means the selected Cautilus surface can run, not that the repo's behavior promises are already proven.

## Subclaims

- `doctor` and `agent status` share the same readiness facts and runner-readiness assessment rather than duplicating decisions.
- Readiness output explains what is ready, what is blocked, and which command continues the loop.
- A ready doctor result means the selected Cautilus surface can run, not that the repo's behavior claims are proven.
- `specdown_available` is checked in both repo and agent-surface doctor scopes so the spec proof prerequisite stays visible.

## Evidence

- The shared runner-readiness assessment is implemented in [internal/runtime/runner_readiness.go](../../../internal/runtime/runner_readiness.go) and exercised by [internal/runtime/runner_readiness_test.go](../../../internal/runtime/runner_readiness_test.go).
- The user-facing readiness surface smoke is enforced by [docs/specs/user/doctor-readiness.spec.md](../user/doctor-readiness.spec.md) (specdown directives over `doctor --help` and `agent status --json`).

## Evidence Gaps

- Test proving `doctor` and `agent status` produce identical readiness verdicts and next-action strings for the same repo state. Owner: maintainer. Next action: add a fixture-backed snapshot test that asserts both commands' outputs agree on a controlled scenario.
- Test proving a ready doctor result does not silently advertise behavior-claim satisfaction. Owner: maintainer. Next action: add an assertion that the readiness packet does not include claim-satisfied counts in its public fields.
