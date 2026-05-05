# Readiness

Using `cautilus doctor`, `cautilus agent status`, and the bundled skill, a user can see which Cautilus workflow is ready, blocked, or missing setup before starting claim, eval, or optimize work.

## Acceptance Criteria

### A user can see whether the selected Cautilus surface is ready or blocked.

`doctor` reports readiness, blocker checks, and the next action for the selected repo scope.

> check:cautilus-json-command
| args_json | json_path | equals |
| --- | --- | --- |
| ["doctor","--repo-root","."] | ready | true |
| ["doctor","--repo-root","."] | next_action.kind | complete_first_bounded_run |

### An agent can read the same readiness state before choosing a workflow branch.

`agent status` exposes a stable orientation packet with agent-surface readiness, runner assessment state, claim-state availability, and next branches.

> check:cautilus-json-command
| args_json | json_path | equals | min_number |
| --- | --- | --- | --- |
| ["agent","status","--repo-root",".","--json"] | schemaVersion | cautilus.agent_status.v1 | |
| ["agent","status","--repo-root",".","--json"] | agentSurface.ready | true | |
| ["agent","status","--repo-root",".","--json"] | runnerReadiness.assessment.schemaVersion | cautilus.runner_assessment.v1 | |
| ["agent","status","--repo-root",".","--json"] | nextBranches.length | | 1 |

### A ready result means the selected Cautilus surface can run, not that behavior claims are proven.

When the repo is ready, `doctor` points the user to a first bounded run instead of treating readiness as evidence that the repo's behavior claims are true.

> check:cautilus-json-command
| args_json | json_path | includes |
| --- | --- | --- |
| ["doctor","--repo-root","."] | first_bounded_run.summary | bounded eval |
| ["doctor","--repo-root","."] | first_bounded_run.decisionLoopCommands[0] | cautilus eval test |
