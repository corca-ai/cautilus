---
type: promise
---

# A Testable Agent

Before you can prove an agent's behavior, you need a clean headless runner for Cautilus to drive and an honest verdict on whether that runner is fit for the surface you want to prove.
Using the `cautilus` CLI and the checked-in runner-readiness fixtures, you can check how testable your agent is: the binary emits a runner-readiness verdict, names the runner capability each claim needs, and flags an assessment that has drifted out of date.
Each subclaim below regenerates its packet live on every `npm run lint:specs` and asserts on the fresh output, except where it asserts on a checked-in assessment fixture that the Surface Honesty Audit also binds.

Typed traceability: this promise carries no `governed-by` or `implemented-by` edge yet — its runner-readiness background lives in maintainer prose under `docs/contracts/`, not a typed contract node, so the typed edge is deferred to a later slice.

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

## The Cautilus agent helps you build and assess a runner.

The `cautilus-agent` skill carries the runner-readiness routing: orient runner readiness from `doctor status`, read the required runner capability for the selected claim, help build a headless product runner that reuses the real product path, help produce a `cautilus.runner_assessment.v1` packet at the binary-named scaffold path, keep the proof class honest, and stop `improve` when runner-backed proof is missing, stale, or smoke-only — while the binary owns command discovery, the scaffold source, and freshness.
This subclaim checks that the dogfood fixture and audit hook are *prepared* to ask for and grade that build-and-assess flow.
It does not execute the Cautilus eval episode or claim that a live runner-building episode has passed; that live `cautilus-eval` episode is deferred and named in the apex Proof Debt.

The prepared dogfood episode asks the agent to orient readiness and then help build and assess a runner, and to stop before eval execution, improve, edits, or commits.

```run:shell
$ jq -r '.cases[0].turns[1].input as $p | "asks-orient=" + ($p|contains("Orient runner readiness")|tostring), "asks-build-runner=" + ($p|contains("headless product runner")|tostring), "asks-assessment=" + ($p|contains("runner_assessment.v1")|tostring), "asks-proof-class-boundary=" + ($p|contains("which proof classes can back an app behavior-change claim")|tostring), "stops-before-eval-or-commit=" + ($p|contains("Stop before evaluate fixture, improve, edits, or commits")|tostring)' fixtures/eval/dev/skill/cautilus-runner-readiness-flow.fixture.json
asks-orient=true
asks-build-runner=true
asks-assessment=true
asks-proof-class-boundary=true
stops-before-eval-or-commit=true
```

The audit hook is executable and load-bearing: it passes a flow that orients readiness and helps build and assess a runner, and fails one that orients but never helps build or assess, never orients at all, or overruns into eval, improve, or commits.

```run:shell
$ node --test --test-reporter=dot --test-reporter-destination=stdout scripts/agent-runtime/audit-cautilus-runner-readiness-flow-log.test.mjs >/dev/null && echo runner-readiness-audit-unit-test=passed
runner-readiness-audit-unit-test=passed
```

The prepared dogfood fixture is a machine-readable evaluation input that names the runner-readiness audit kind and asks for the build-and-assess behaviors, so the Surface Honesty Audit binds the badge to a prepared skill flow rather than to skill prose alone.

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| fixtures/eval/dev/skill/cautilus-runner-readiness-flow.fixture.json | schemaVersion | cautilus.evaluation_input.v1 | |
| fixtures/eval/dev/skill/cautilus-runner-readiness-flow.fixture.json | suiteId | cautilus-runner-readiness-flow | |
| fixtures/eval/dev/skill/cautilus-runner-readiness-flow.fixture.json | skillId | cautilus-agent | |
| fixtures/eval/dev/skill/cautilus-runner-readiness-flow.fixture.json | cases[0].auditKind | cautilus_runner_readiness_flow | |
| fixtures/eval/dev/skill/cautilus-runner-readiness-flow.fixture.json | cases[0].turns[1].input | | headless product runner |
| fixtures/eval/dev/skill/cautilus-runner-readiness-flow.fixture.json | cases[0].turns[1].input | | runner_assessment.v1 |

| behavior to check | prepared artifact | current state |
| --- | --- | --- |
| the skill routes runner creation and assessment as sequencing and judgment | `skills/cautilus-agent/SKILL.md` (`## Runner Readiness`) and `skills/cautilus-agent/references/runner-readiness.md` | prepared, not executed |
| the dogfood episode asks for readiness orientation, headless-runner build, assessment authoring, proof-class boundary, and stop discipline | `fixtures/eval/dev/skill/cautilus-runner-readiness-flow.fixture.json` | prepared, not executed |
| the transcript is audited for the build-and-assess flow instead of manually trusted | `scripts/agent-runtime/audit-cautilus-runner-readiness-flow-log.mjs` | prepared, executed in `npm run test:node` |
