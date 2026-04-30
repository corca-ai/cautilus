# Skill Testing Contract

Use `eval test` with a `surface=dev, preset=skill` fixture when the operator
asks for the local flow:

`Use Cautilus to test this skill.`

`eval evaluate` remains the packet summarizer for already observed runs.
`eval test` is the workflow seam one step earlier:

`checked-in skill cases -> cautilus eval test -> observed skill evaluation input -> cautilus eval evaluate -> skill evaluation summary -> cautilus scenario normalize skill`

## Checked-In Inputs

`cautilus eval test` consumes a checked-in `cautilus.evaluation_input.v1`
fixture with:

- `surface: dev`
- `preset: skill`
- `suiteId`
- optional `suiteDisplayName`
- optional `skillId` (defaults to `suiteId`)
- optional `skillDisplayName`
- optional suite-level `repeatCount`
- optional suite-level `minConsensusCount`
- `cases`
  - `caseId`
  - `evaluationKind`
    - `trigger`
    - `execution`
  - `prompt`, or `turns` for a multi-turn episode
  - trigger-only `expectedTrigger`
  - optional execution `thresholds`
  - optional execution `auditKind` when the runner derives the result from a product-owned audit packet
  - optional `repeatCount`
  - optional `minConsensusCount`

Each `turns` entry must include an `input` string.
Dev-surface runners may also accept adapter hints such as `injectSkill: true` when the coding-agent CLI needs an explicit skill body in the first turn.
The first shipped audit-backed episodes are `auditKind: cautilus_first_scan_flow`, used when no saved claim map exists, `auditKind: cautilus_refresh_flow`, used when a saved claim map must be compared with current repo changes, `auditKind: cautilus_review_prepare_flow`, used when the agent should prepare deterministic claim review input after first scan without launching reviewers, `auditKind: cautilus_reviewer_launch_flow`, used when the agent should launch one bounded reviewer lane and stop at the review result boundary, and `auditKind: cautilus_review_to_eval_flow`, used when the agent should apply the bounded reviewer result, validate the reviewed packet, plan evals, and stop before fixture authoring.

Repeated cases should be run multiple times by the checked-in runner and
collapsed into one observed evaluation result. `minConsensusCount` is the
number of matching runs needed before that collapsed result counts as a pass.

## Adapter Hooks

Named adapters may declare:

- `evaluation_input_default`
- `eval_test_command_templates`

Useful placeholders:

- `{candidate_repo}`
- `{output_dir}`
- `{eval_cases_file}`
- `{eval_observed_file}`

The adapter-owned runner still owns actual host execution and invocation
observation.
For `dev/skill`, the file written to `{eval_cases_file}` is a
`cautilus.skill_test_cases.v1` packet that any `run-local-skill-test.mjs`-style
runner already consumes.

## Product-Owned Outputs

`eval test` should materialize one bounded run directory with:

- `eval-cases.json`
- `eval-observed.json`
- `eval-summary.json`
- stdout/stderr artifacts for preflight and runner commands
- per-case aggregate artifacts when repeated runs are used

## Guardrails

- Prefer `eval test --fixture <skill.fixture.json>` when the repo has a
  checked-in case suite and runner.
- Prefer `eval evaluate` only when the host already produced the observed
  packet.
- Keep deterministic packaging/bootstrap checks outside this seam.
