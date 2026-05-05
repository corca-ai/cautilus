# Readiness

Using `cautilus doctor` and the bundled Cautilus skill, a user can decide whether to fix setup, inspect claims, run a first eval, or stop before spending effort on claim, eval, or optimize work.

Readiness means the repo has enough Cautilus setup to choose and run the next bounded workflow.
It is not evidence that the repo's behavior promises are already true; proof status is handled by [Evidence Gaps](proof-debt.spec.md).

A valid Cautilus adapter is a repo-owned file, usually `.agents/cautilus-adapter.yaml`, that Cautilus can parse and that declares the repo, evaluation surfaces, baseline options, and runnable eval commands.
Host-specific adapter ownership is covered in [Host Ownership](ownership.spec.md).

This repo's adapter exposes the readiness fields directly:

```run:shell
$ node -e 'const fs=require("fs"); const text=fs.readFileSync(".agents/cautilus-adapter.yaml","utf8"); for (const key of ["repo:","evaluation_surfaces:","baseline_options:","eval_test_command_templates:"]) { const line=text.split("\n").find((candidate)=>candidate.startsWith(key)); if (!line) process.exit(1); console.log(line); }'
repo: cautilus
evaluation_surfaces:
baseline_options:
eval_test_command_templates:
```

## A user can see the setup conditions that make this repo ready for the selected Cautilus workflow.

`doctor` reports workflow-relevant readiness checks with machine-readable meaning.
The public report should project those meanings from the binary output so people and agents read the same readiness contract.

> check:cautilus-readiness
| workflow | setup_condition | command | doctor_check | meaning |
| --- | --- | --- | --- | --- |
| adapter discovery | Cautilus adapter file exists | cautilus doctor --repo-root . | adapter_found | Cautilus can find repo-owned configuration. |
| adapter discovery | Adapter parses and matches the schema | cautilus doctor --repo-root . | adapter_valid | Cautilus can parse and trust the adapter shape enough to continue. |
| repo identity | Adapter names the repo | cautilus doctor --repo-root . | repo_name | The adapter identifies the host repo whose behavior is being evaluated. |
| claim-spec report | `specdown` is available | cautilus doctor --repo-root . | specdown_available | The public claim-spec report can render executable evidence. |
| first bounded eval | Adapter declares evaluation surfaces | cautilus doctor --repo-root . | evaluation_surfaces | The repo names the behavior surfaces Cautilus may evaluate. |
| first bounded eval | Adapter declares baseline options | cautilus doctor --repo-root . | baseline_options | Eval and optimize work have explicit comparison targets. |
| first bounded eval | Adapter declares runnable eval commands | cautilus doctor --repo-root . | execution_surface | Cautilus can point the user to an executable first run. |

## A user can see which setup condition blocks readiness.

`doctor` reports a blocked state when required setup is missing.
Each blocked case should show the failed check and the next setup action instead of letting the user start an invalid workflow.

| Repo condition | Command | Status | Failed check | Next action |
| --- | --- | --- | --- | --- |
| No Cautilus adapter file | `cautilus doctor --repo-root .` | blocked | `adapter_found` | create or configure a Cautilus adapter |
| Malformed adapter YAML | `cautilus doctor --repo-root .` | blocked | `adapter_valid` | fix adapter schema errors |
| `specdown` missing from the environment | `cautilus doctor --repo-root .` | blocked | `specdown_available` | install `specdown` before relying on the claim-spec report |
| No evaluation surfaces declared | `cautilus doctor --repo-root .` | blocked | `evaluation_surfaces` | declare at least one eval surface in the adapter |
| No baseline options declared | `cautilus doctor --repo-root .` | blocked | `baseline_options` | declare baseline options before eval or optimize work |
| No runnable eval command declared | `cautilus doctor --repo-root .` | blocked | `execution_surface` | add a runnable eval command or runner binding |

## A user can see the next bounded action for the current readiness state.

Readiness is useful only if it points to bounded next work.
The next action depends on the current repo state, so the report should show state-to-action examples rather than one generic success sentence.

| Current state | Command | Status | Next action | Suggested command includes |
| --- | --- | --- | --- | --- |
| Adapter is ready and no first bounded run has been completed | `cautilus doctor --repo-root .` | ready | `complete_first_bounded_run` | `cautilus eval test` |
| Adapter is ready and the user needs the scenario catalog first | `cautilus doctor --repo-root .` | ready | inspect scenario-normalization catalog | `cautilus scenarios --json` |
| Claim map exists but is stale against the current checkout | `cautilus agent status --repo-root . --json` | ready | `refresh_claims_from_diff` | `cautilus claim discover --previous` |
| Adapter setup is blocked | `cautilus doctor --repo-root .` | blocked | configure or fix adapter setup | `cautilus adapter init` or adapter schema guidance |

## The bundled skill can choose a safe branch from the readiness packet before spending workflow budget.

This is different from the human-facing `doctor` result.
`doctor` answers whether setup is ready and what a user should fix or run next.
`agent status --json` gives the bundled skill an orientation packet so it can propose claim discovery, eval, optimize, setup, inspection, or stop branches before running discovery, evaluation, optimization, edits, or commits.

| Repo state | Command | Packet field | Expected branch | User value |
| --- | --- | --- | --- | --- |
| Ready setup with stale claim state | `cautilus agent status --repo-root . --json` | `nextBranches` | `refresh_claims_from_diff` | the skill refreshes claims before review or eval planning |
| Ready setup with an existing claim map | `cautilus agent status --repo-root . --json` | `nextBranches` | `show_existing_claims` | the skill can inspect without mutating repo state |
| User only asked for orientation | `cautilus agent status --repo-root . --json` | `nextBranches` | `stop` | the skill can stop after reporting state |
| Setup is blocked | `cautilus agent status --repo-root . --json` | `nextBranches` | setup branch | the skill fixes readiness before proposing claim, eval, or optimize work |
