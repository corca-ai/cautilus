# Behavior Evaluation

When deterministic checks pass but behavior is still uncertain, the user needs a bounded way to compare observed intentful behavior.
Using the `cautilus evaluate` CLI command and the `cautilus-agent` skill, a user can evaluate behavior across `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt` surfaces without turning the host repo's runners, prompts, or policy into Cautilus-owned state.
The dev/repo coding-agent flagship is proven live on demand; the remaining surfaces project their latest selected evidence bundle.

## The coding agent on your repo is proven live: it orients on AGENTS.md and routes to the find-skills bootstrap.

This is not a projected bundle.
`npm run proof:behavior-eval:live` drives the real agent (claude/Sonnet) against this repo's own `AGENTS.md` and asserts the stable cross-runtime routing invariant on a FRESH capture; a blind Sonnet judge graded the genuine live reasoning sound and a constructed wrong-reason control unsound, keeping the judge load-bearing.
The standing check below replays the operator-witnessed capture and its blind verdicts so the displayed invariant matches the graded one, while the live cost stays on demand.

> check:cautilus-json-file
| path | json_path | equals |
| --- | --- | --- |
| fixtures/eval/dev/repo/live/behavior-eval-live-capture.json | evaluations[0].observationStatus | observed |
| fixtures/eval/dev/repo/live/behavior-eval-live-capture.json | evaluations[0].entryFile | AGENTS.md |
| fixtures/eval/dev/repo/live/behavior-eval-live-capture.json | evaluations[0].routingDecision.bootstrapHelper | charness:find-skills |
| fixtures/eval/dev/repo/live/behavior-eval-live-capture.json | evaluations[0].telemetry.runtime | claude_code |
| fixtures/eval/dev/repo/live/behavior-eval-live-verdicts.json | verdicts[0].verdict | sound |
| fixtures/eval/dev/repo/live/behavior-eval-live-verdicts.json | verdicts[1].verdict | unsound |

## A user can choose the behavior surface that matches the evaluation intent.

The current eval-surface evidence covers repo-contract behavior, checked-in skill behavior, multi-turn app chat behavior, and single prompt input/output behavior.
This spec projects the latest selected evidence bundle instead of rerunning expensive eval work.

```run:shell
# Show the target surfaces from the latest selected eval-surface evidence.
jq '[.packetEvidence[] | {schemaVersion, targetSurface: .proof.targetSurface, recommendation}]' .cautilus/claims/evidence-current-eval-surfaces-2026-05-03.json
```

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| .cautilus/claims/evidence-current-eval-surfaces-2026-05-03.json | decision.evidenceStatus | satisfied | |
| .cautilus/claims/evidence-current-eval-surfaces-2026-05-03.json | packetEvidence[0].proof.targetSurface | dev/repo | |
| .cautilus/claims/evidence-current-eval-surfaces-2026-05-03.json | packetEvidence[2].proof.targetSurface | app/chat | |
| .cautilus/claims/evidence-current-eval-surfaces-2026-05-03.json | packetEvidence[4].proof.targetSurface | app/prompt | |
| .cautilus/claims/evidence-current-eval-surfaces-2026-05-03.json | relatedEvidence[0].reason | | dev/skill |

## A user can evaluate behavior without Cautilus taking over host-owned execution.

The evidence bundle points at checked-in fixtures, adapters, and runner wrappers for the selected surfaces.

> check:cautilus-json-file
| path | json_path | includes |
| --- | --- | --- |
| .cautilus/claims/evidence-current-eval-surfaces-2026-05-03.json | checkedInEvidence[1].kind | eval-fixture |
| .cautilus/claims/evidence-current-eval-surfaces-2026-05-03.json | checkedInEvidence[4].kind | adapter |
| .cautilus/claims/evidence-current-eval-surfaces-2026-05-03.json | checkedInEvidence[7].kind | runner-wrapper |

## A user can reopen observed behavior and summary packets after each eval.

The latest selected eval artifacts record schema versions, recommendations, runtime, proof class, and target surface without rerunning the expensive eval during this report check.

> check:cautilus-json-file
| path | json_path | equals |
| --- | --- | --- |
| .cautilus/claims/evidence-current-eval-surfaces-2026-05-03.json | packetEvidence[0].schemaVersion | cautilus.evaluation_summary.v1 |
| .cautilus/claims/evidence-current-eval-surfaces-2026-05-03.json | packetEvidence[0].recommendation | accept-now |
| .cautilus/claims/evidence-current-eval-surfaces-2026-05-03.json | packetEvidence[1].schemaVersion | cautilus.evaluation_observed.v1 |
