# Doctor And Readiness

`Cautilus doctor` tells a repo whether the selected Cautilus surface is ready for the next bounded step.

## User Promise

Cautilus makes setup, agent-surface install, adapter state, runner readiness, and saved claim state visible instead of relying on private operator memory.

## Subclaims

- Doctor output should explain what is ready, what is blocked, and what the next action is.
- Agent status should share the same readiness facts when an agent is driving the workflow.
- A ready doctor result means the selected Cautilus surface can run.
- A ready doctor result does not prove the repo's behavior claims by itself.

## Evidence

The current executable proof checks that `doctor` and `agent status` expose their public readiness surfaces.
Future proof should connect the shared runner-readiness assessment used by both commands.

> check:cautilus-command
| args_json | stdout_includes |
| --- | --- |
| ["doctor","--help"] | ready repo payload |
| ["agent","status","--repo-root",".","--json"] | cautilus.agent_status.v1 |
