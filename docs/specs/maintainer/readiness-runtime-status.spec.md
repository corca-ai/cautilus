# Readiness And Runtime Status

Doctor and agent status expose readiness without proving behavior claims.

Aligned user claims: U4, U5.
Proof route: deterministic.
Current evidence status: partial.
Next action: keep doctor, agent status, runner-readiness assessment, active-run status, and `specdown_available` checks sharing the same readiness facts.
Absorbs: doctor, agent status, adapter resolve, named adapter, runner readiness, active run, specdown prerequisite, missing git repo, install state, next action, first bounded run.

## Maintainer Promise

Readiness commands should tell the operator what can run next, what is blocked, and which command continues the loop.
Ready means the selected Cautilus surface can run.
Ready does not mean the repo's behavior promises are already proven.

## Proof Notes

The current implementation checks `specdown_available` in both repo and agent-surface doctor scopes.
The next proof should make sure `doctor` and `agent status` share runner-readiness drift logic rather than duplicating decisions.
