# A Testable Agent

Before you can prove an agent's behavior, you need a clean headless runner for Cautilus to drive and an honest verdict on whether that runner is fit for the surface you want to prove.
Using the `cautilus` CLI and the checked-in runner-readiness fixtures, you can check how testable your agent is: the binary emits a runner-readiness verdict, names the runner capability each claim needs, and flags an assessment that has drifted out of date.
Each subclaim below regenerates its packet live on every `npm run lint:specs` and asserts on the fresh output, except where it asserts on a checked-in assessment fixture that the Surface Honesty Audit also binds.

## You can check how testable your agent is.

The binary reports runner readiness as a setup substrate under the `claim`, `eval`, and `improve` jobs: it reads this repo's runner assessment, preserves the proof class, names the required runner capability for each eval-ready claim, and detects when an assessment no longer matches the current adapter and runner files.
The checks below re-run those commands live and assert on the fresh output.

```run:shell -> $canon
# Resolve this repo's canonical claim proof-plan packet (kept fresh by claims:refresh:all).
jq -r '.inputPath' .cautilus/claims/status-summary.json
```

### The binary emits a live runner-readiness verdict for this repo's agent.

`doctor status --json` carries a `runnerReadiness` block: the assessed runner's proof class, surface, and recommendation, the source of the proof class, the freshness policy, and the scaffold source an operator copies to author an assessment.

> check:cautilus-json-command(command=cautilus doctor status --repo-root . --json)
| path | equals | includes | min_number |
| --- | --- | --- | --- |
| runnerReadiness.assessment.schemaVersion | cautilus.runner_assessment.v1 | | |
| runnerReadiness.assessment.surface | dev/repo | | |
| runnerReadiness.assessment.proofClass | coding-agent-messaging | | |
| runnerReadiness.assessment.recommendation | ready-for-selected-surface | | |
| runnerReadiness.runnerCount | | | 1 |
| runnerReadiness.assessmentRequired | true | | |
| runnerReadiness.proofClassSource | assessment | | |
| runnerReadiness.assessmentProvenance.freshnessPolicy | adapter-and-runner-file-hashes | | |
| runnerReadiness.notice | | product-proof readiness still requires a current runner assessment | |
| runnerReadiness.scaffoldSource | fixtures/runner-readiness/example-assessment.json | | |

### The checked-in runner assessments carry substantive testability verdicts.

A runner assessment records, for a selected surface, the proof class the runner delivers, the runner capability the claim requires, and whether the runner is ready for that surface.
The Surface Honesty Audit reads each file below, so the badge stays bound to assessments that actually state a verdict rather than to assessment-shaped placeholders.

> check:cautilus-json-file
| path | json_path | equals |
| --- | --- | --- |
| .cautilus/runners/dev-repo-self-dogfood.assessment.json | proofClass | coding-agent-messaging |
| .cautilus/runners/dev-repo-self-dogfood.assessment.json | surface | dev/repo |
| .cautilus/runners/dev-repo-self-dogfood.assessment.json | recommendation | ready-for-selected-surface |
| .cautilus/runners/dev-repo-self-dogfood.assessment.json | assessedRequirement.requiredRunnerCapability | development-repo-eval-runner |
| fixtures/runner-readiness/example-assessment.json | proofClass | in-process-product-runner |
| fixtures/runner-readiness/example-assessment.json | surface | app/chat |
| fixtures/runner-readiness/example-assessment.json | recommendation | ready-for-selected-surface |
| fixtures/runner-readiness/example-assessment.json | assessedRequirement.requiredRunnerCapability | headless-product-chat-runner |
| fixtures/runner-readiness/example-live-run-assessment.json | proofClass | live-product-runner |
| fixtures/runner-readiness/example-live-run-assessment.json | recommendation | ready-for-selected-surface |
| fixtures/runner-readiness/example-live-run-assessment.json | assessedRequirement.requiredRunnerCapability | headless-product-chat-runner |

### Eval planning names the runner capability each claim needs.

`evaluate claims plan` records, per eval-ready claim, the runner capability and observability the proof requires — a requirement field, not a readiness verdict.
Every planned claim names a runner capability and the proof mechanism that surfaces it.

> check:cautilus-json-command(command=cautilus evaluate claims plan --claims ${canon} --allow-stale-claims)
| path | equals | includes | min_number |
| --- | --- | --- | --- |
| schemaVersion | cautilus.claim_eval_plan.v1 | | |
| planSummary.evalPlanCount | | | 1 |
| evalPlans[0].proofRequirement.proofMechanism | cautilus-eval | | |
| evalPlans[0].proofRequirement.requiredRunnerCapability | | runner | |
| evalPlans[0].proofRequirement.requiredObservability.length | | | 1 |

### The verdict detects when a runner assessment is out of date.

Freshness is checked against the current adapter hash and the listed runner file hashes, not the git commit alone.
The check below seeds a controlled stale assessment — one that lists a runner file that does not exist — into a throwaway repo root, so `doctor status` must mark it stale and name the offending runner file rather than silently presenting a stale runner as ready.

```run:shell -> $stale_root
# Seed a deliberately-stale runner assessment (lists a missing runner file) in a throwaway
# repo root, so freshness detection is proven on controlled input, not on this repo's
# transient assessment state.
out=$(mktemp -d)
mkdir -p "$out/.agents" "$out/.cautilus/runners"
cp .agents/cautilus-adapter.yaml "$out/.agents/cautilus-adapter.yaml"
jq '(.runnerFiles) = [{"path":"scripts/does-not-exist-runner.mjs","sha256":"sha256:0000000000000000000000000000000000000000000000000000000000000000"}]' \
  .cautilus/runners/dev-repo-self-dogfood.assessment.json > "$out/.cautilus/runners/dev-repo-self-dogfood.assessment.json"
printf '%s\n' "$out"
```

> check:cautilus-json-command(command=cautilus doctor status --repo-root ${stale_root} --json)
| path | equals |
| --- | --- |
| runnerReadiness.state | stale |
| runnerReadiness.reason | runner-assessment-stale |
| runnerReadiness.staleReasons[kind=runnerFile].kind | runnerFile |
| runnerReadiness.staleReasons[kind=runnerFile].path | scripts/does-not-exist-runner.mjs |
