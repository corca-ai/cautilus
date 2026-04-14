# Skill Testing Contract

Use `skill test` when the operator asks for the local flow:

`Use Cautilus to test this skill.`

`skill evaluate` remains the packet summarizer for already observed runs.
`skill test` is the workflow seam one step earlier:

`checked-in skill cases -> cautilus skill test -> observed skill evaluation input -> cautilus skill evaluate -> skill evaluation summary -> cautilus scenario normalize skill`

## Checked-In Inputs

`cautilus skill test` consumes a checked-in `cautilus.skill_test_cases.v1`
suite with:

- `skillId`
- optional `skillDisplayName`
- `cases`
  - `caseId`
  - `evaluationKind`
    - `trigger`
    - `execution`
  - `prompt`
  - trigger-only `expectedTrigger`
  - optional execution `thresholds`

## Adapter Hooks

Named adapters may declare:

- `skill_cases_default`
- `skill_test_command_templates`

Useful placeholders:

- `{candidate_repo}`
- `{output_dir}`
- `{skill_id}`
- `{skill_cases_file}`
- `{skill_eval_input_file}`

The adapter-owned runner still owns actual host execution and invocation
observation.

## Product-Owned Outputs

`skill test` should materialize one bounded run directory with:

- `skill-evaluation-input.json`
- `skill-evaluation-summary.json`
- `skill-candidates.json`
- stdout/stderr artifacts for preflight and runner commands

## Guardrails

- Prefer `skill test` when the repo has a checked-in case suite and runner.
- Prefer `skill evaluate` only when the host already produced the observed
  packet.
- Keep deterministic packaging/bootstrap checks outside this seam.
