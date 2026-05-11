# Skill Clone Experiment Contract

`Cautilus` exposes sandboxed skill-clone experiment comparison through `cautilus eval skill-experiment compare`.

The command starts after a host-owned runner has already executed the baseline skill and the temporary variant.
It does not install skills, mutate production skill state, call an LLM, or parse raw host logs.

## Problem

Maintainers sometimes need to try a bounded temporary skill variant against a preserved task packet and compare it with the current skill or a known-good exemplar.
The useful product boundary is the behavior delta, not the local copy operation.

The first product-owned slice is:

`preserved task packet + baseline output + temporary variant output + coverage obligations -> Cautilus comparison report`

This keeps host execution and skill storage ownership outside Cautilus while making the experiment result inspectable and reusable.

## Input Boundary

Use `cautilus.skill_clone_experiment_input.v1`.

Minimum shape:

- `experimentId`
- `taskPacket`
  - at least one of `path`, `sourceRef`, `schemaVersion`, or `summary`
- `baseline`
  - optional `id`
  - optional `skillId`
  - optional `skillPath`
  - optional `status`
  - `text` or `summary`, directly or under `output`
  - optional `sourceRefs`, directly or under `output`
- `variant`
  - same run shape as `baseline`
  - optional `errors`
- optional `exemplar`
- optional `sourceCoverageObligations`
  - `id`
  - `ref`
  - optional `required`
- optional `rubricPhrases`
- `isolation`
  - optional `sandbox`
  - optional `variantPath`
  - `productionSkillTouched`
  - optional `notes`

`status` may be `passed`, `failed`, `blocked`, or `degraded`.
If omitted, it defaults to `passed`.

## Output Boundary

The command emits `cautilus.skill_clone_experiment_report.v1` with:

- `variant_ran`
- `baseline_comparable`
- `baseline_vs_variant_delta`
- `rubric_match`
- `source_coverage_delta`
- `promotion_recommendation`
  - `promote`
  - `revise`
  - `discard`
- `isolation_notes`
- `findings`

`variant_ran` is true only when the variant status is `passed`, no variant errors are present, and comparable variant text exists.
`baseline_comparable` uses the same rule for the baseline.
Coverage is matched against explicit `sourceRefs` so negative prose like "does not cover X" cannot satisfy an obligation.
Rubric promotion uses rubric phrases newly matched by the variant compared with the baseline; a phrase already matched by the baseline is not a promotion signal by itself.

## Recommendation Rules

- If the variant did not run, `discard`.
- If the baseline is not comparable, isolation is not proven, isolation reports production skill mutation, or the variant loses baseline coverage, `revise`.
- If required coverage or rubric phrases are still missing, `revise`.
- If the variant adds declared source coverage or newly satisfies declared rubric phrases, `promote`.
- Otherwise, `discard`.

## Guardrails

- Do not make this command own skill installation, skill cloning, or live execution.
- Do not treat raw transcript parsing as product-owned evidence.
- Do not promote a variant that touched production skill state.
- Keep business rules in the source skill or adapter contract; this report records behavior deltas and isolation safety only.
