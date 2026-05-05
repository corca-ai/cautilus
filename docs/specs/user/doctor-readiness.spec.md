# Readiness

Using `cautilus doctor`, `cautilus agent status`, and the bundled Cautilus skill, a user can decide what setup or bounded workflow should happen next before spending effort on claim, eval, or optimize work.

Readiness means the repo has enough Cautilus setup to choose and run the next bounded workflow.
It is not evidence that the repo's behavior promises are already true; proof status is handled by [Evidence Gaps](proof-debt.spec.md).

A valid Cautilus adapter is a repo-owned file, usually `.agents/cautilus-adapter.yaml`, that Cautilus can parse and that declares the repo, evaluation surfaces, baseline options, and runnable eval commands.
Host-specific adapter ownership is covered in [Host Ownership](ownership.spec.md).

## A user can see the setup conditions that make a repo ready for Cautilus work.

`doctor` treats a repo as ready only when the required setup checks pass.
The happy path should show the conditions, the checks Cautilus reports, and what those checks mean to the user.

| Repo condition | Doctor check | Expected result | User meaning |
| --- | --- | --- | --- |
| Cautilus adapter file exists | `adapter_found` | pass | Cautilus can find repo-owned configuration |
| Adapter parses and matches the schema | `adapter_valid` | pass | Cautilus can trust the adapter shape enough to continue |
| `specdown` is available | `specdown_available` | pass | Public executable claim specs can be rendered |
| Adapter declares evaluation surfaces | `evaluation_surfaces` | pass | Cautilus knows which behavior surfaces the repo exposes |
| Adapter declares baseline options | `baseline_options` | pass | Eval and optimize work have comparison targets |
| Adapter declares runnable eval commands | `execution_surface` | pass | Cautilus can point the user to an executable first run |

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
