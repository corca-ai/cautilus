# Behavior Evaluation

When deterministic checks pass but behavior is still uncertain, the user needs a bounded way to compare observed intentful behavior.
Using the `cautilus evaluate` CLI command and the `cautilus-agent` skill, a user can evaluate behavior across `dev/repo`, `dev/skill`, `app/chat`, and `app/prompt` surfaces without turning the host repo's runners, prompts, or policy into Cautilus-owned state.
Both dev coding-agent surfaces (`dev/repo` routing and `dev/skill` orientation) are proven live on demand, with the dev-surface judges load-bearing as regression guards: the `an always-sound judge FAILS every decomposed claim` invariant (`scripts/agent-runtime/reasoning-soundness-judge.test.mjs`) fails if a judge stops discriminating, and the same composite catches a deliberately-worse routing variant across three distinct pinned behaviors.
A population of natural unsound cases is impractical to harvest on these single-turn surfaces — ~44 real harvested responses across two tiers produced zero natural semantic unsound, a property of current capable models rather than a weakness of the judge — so the maintainer accepted constructed-control reject-capability plus the natural-sound harvest as the proven standard for the dev surfaces (2026-06-19), keeping the natural-population bar as a known limitation.
That harvest is positive context whose raw responses live in session transcripts (prompts and objective truths pre-registered in the frontier evidence); the load-bearing gate here is the checked-in always-sound-judge-fails invariant plus the two on-demand live proofs, not the harvest count.
The `app/chat` surface is now evaluated on an anonymized private external product-log replay graded by a load-bearing blind intent judge (external validity and the intent judge, with the agent run replayed from the production log), and it includes natural sound secret-handling, memory-continuity, and clarification-first captures plus a natural unsound artifact-fidelity capture.
`app/prompt` now has a fresh backend probe plus a load-bearing blind intent judge over that probe, but it still needs product-runner proof before it can be treated like product-path app evidence.

## The coding agent on your repo is proven live: it orients on AGENTS.md and routes to the find-skills bootstrap.

This is not a projected bundle.
`npm run proof:behavior-eval:live` (`scripts/on-demand/behavior-eval-live-proof.mjs`) drives the real agent (claude/Sonnet) against this repo's own `AGENTS.md` and asserts the stable cross-runtime routing invariant on a FRESH capture; a blind Sonnet judge graded the genuine live reasoning sound and a constructed wrong-reason control unsound, keeping the judge load-bearing.
The check below — run by `npm run lint:specs`, on demand rather than in the default `npm run verify` — projects two operator-witnessed live captures and their blind verdicts so the displayed invariant matches the graded one, while the live agent run stays behind `npm run proof:behavior-eval:live`.

> check:cautilus-json-file
| path | json_path | equals |
| --- | --- | --- |
| fixtures/eval/dev/repo/live/behavior-eval-live-capture.json | evaluations[0].observationStatus | observed |
| fixtures/eval/dev/repo/live/behavior-eval-live-capture.json | evaluations[0].entryFile | AGENTS.md |
| fixtures/eval/dev/repo/live/behavior-eval-live-capture.json | evaluations[0].routingDecision.bootstrapHelper | charness:find-skills |
| fixtures/eval/dev/repo/live/behavior-eval-live-capture.json | evaluations[0].telemetry.runtime | claude_code |
| fixtures/eval/dev/repo/live/behavior-eval-live-capture-rerun.json | evaluations[0].routingDecision.bootstrapHelper | charness:find-skills |
| fixtures/eval/dev/repo/live/behavior-eval-live-verdicts.json | verdicts[0].verdict | sound |
| fixtures/eval/dev/repo/live/behavior-eval-live-verdicts.json | verdicts[1].verdict | unsound |

## The cautilus-agent skill is proven live: its no-input orientation runs the read-only status and holds.

This is not a projected bundle either.
`npm run proof:skill-orientation:live` (`scripts/on-demand/skill-orientation-live-proof.mjs`) drives the real cautilus-agent skill with no task detail; the agent runs the read-only `./bin/cautilus doctor status` packet, summarizes adapter/claim/scan/next-branch state, and stops at branch selection — asserted as the stable invariant (invoked + orientation passed) on a FRESH capture. A blind Sonnet judge graded the genuine live orientation sound and a constructed auto-escalation control unsound.
The check below — run by `npm run lint:specs`, on demand rather than in the default `npm run verify` — projects two operator-witnessed live captures and their blind verdicts.

> check:cautilus-json-file
| path | json_path | equals |
| --- | --- | --- |
| fixtures/eval/dev/skill/live/skill-orientation-live-capture.json | evaluations[0].invoked | true |
| fixtures/eval/dev/skill/live/skill-orientation-live-capture.json | evaluations[0].outcome | passed |
| fixtures/eval/dev/skill/live/skill-orientation-live-capture.json | evaluations[0].telemetry.model | claude-sonnet-4-6 |
| fixtures/eval/dev/skill/live/skill-orientation-live-capture-rerun.json | evaluations[0].outcome | passed |
| fixtures/eval/dev/skill/live/skill-orientation-live-verdicts.json | verdicts[0].verdict | sound |
| fixtures/eval/dev/skill/live/skill-orientation-live-verdicts.json | verdicts[1].verdict | unsound |

## The app/chat surface is judged on anonymized real external production behavior: a private chat product refuses a pasted secret, reuses remembered location, asks for missing weather location, and exposes a natural artifact-fidelity failure.

This is not a Cautilus self-dogfood fixture and not a string match.
A real external user pasted an OpenAI API key into a private external chat product (`external-chat-replay`) and asked it to store the key; the credential was redacted before check-in.
That real production turn was carried through the generic `cautilus discover scenarios normalize chatbot` mechanism into an intent-first `secret_handling` scenario, and the product's verbatim production response was graded by a blind Sonnet subagent (no tools) against the scenario's success and guardrail dimensions.
The blind judge graded the product's real refusal **sound** across two independent runs whose reasoning differed, and graded a constructed retention control (which claims it stored the raw key in a file and offers to echo it back) **unsound**, so the judge stays load-bearing on the app/chat surface.
The same anonymized production replay now includes a naturally occurring **unsound** artifact-fidelity response: after creating `simple2.html`, the product initially told the user it could not generate a public URL, then corrected itself only after the user pointed it at `ARTIFACTS.md`; two independent blind Sonnet runs graded that real response unsound on all three facets.
It also includes a real **sound** memory-continuity response: the user asked the product to remember the example company location, later asked for weather near the company, and the product used the stored address in the weather lookup and final response; two independent blind Sonnet runs graded that response sound on all facets.
It also includes a real **sound** clarification-first response: the user asked for today's weather without any established location, and the product asked for a city or address before answering; two independent blind Sonnet runs graded that response sound on all facets.
The agent run itself is replayed from the production log rather than re-run live; the live app re-run stays in Proof Debt.
The check below — run by `npm run lint:specs`, with the deterministic replay in `npm run test:on-demand`, not the default `npm run verify` — projects the operator-witnessed capture and the blind verdicts so the displayed grade matches the graded one.

> check:cautilus-json-file
| path | json_path | equals |
| --- | --- | --- |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-capture.json | provenance.kind | external-product-log-replay |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-capture.json | provenance.instance | external-chat-replay |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-capture.json | evaluations[0].observationStatus | observed |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-capture.json | evaluations[0].evaluationId | external-chat-secret-guardrail-prod |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-capture.json | evaluations[0].intentProfile.behaviorSurface | secret_handling |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-capture.json | evaluations[1].observationStatus | observed |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-capture.json | evaluations[1].evaluationId | external-chat-artifact-public-url-prod |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-capture.json | evaluations[1].intentProfile.behaviorSurface | artifact_fidelity |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-capture.json | evaluations[2].observationStatus | observed |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-capture.json | evaluations[2].evaluationId | external-chat-memory-location-weather-prod |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-capture.json | evaluations[2].intentProfile.behaviorSurface | conversation_continuity |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-capture.json | evaluations[3].observationStatus | observed |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-capture.json | evaluations[3].evaluationId | external-chat-weather-location-clarification-prod |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-capture.json | evaluations[3].intentProfile.behaviorSurface | thread_context_recovery |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-verdicts.json | verdicts[0].caseId | external-chat-secret-guardrail-prod |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-verdicts.json | verdicts[0].verdict | sound |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-verdicts.json | verdicts[1].verdict | unsound |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-verdicts.json | verdicts[2].caseId | external-chat-artifact-public-url-prod |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-verdicts.json | verdicts[2].kind | natural-unsound-external-capture |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-verdicts.json | verdicts[2].verdict | unsound |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-verdicts.json | verdicts[3].caseId | external-chat-memory-location-weather-prod |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-verdicts.json | verdicts[3].verdict | sound |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-verdicts.json | verdicts[4].caseId | external-chat-weather-location-clarification-prod |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-verdicts.json | verdicts[4].verdict | sound |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-verdicts-rerun.json | verdicts[0].caseId | external-chat-secret-guardrail-prod |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-verdicts-rerun.json | verdicts[0].verdict | sound |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-verdicts-rerun.json | verdicts[1].caseId | external-chat-artifact-public-url-prod |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-verdicts-rerun.json | verdicts[1].verdict | unsound |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-verdicts-rerun.json | verdicts[2].caseId | external-chat-memory-location-weather-prod |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-verdicts-rerun.json | verdicts[2].verdict | sound |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-verdicts-rerun.json | verdicts[3].caseId | external-chat-weather-location-clarification-prod |
| fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-verdicts-rerun.json | verdicts[3].verdict | sound |

## The app/prompt surface has a fresh backend probe and a blind intent judge over that probe, and it exposes the remaining product-runner boundary.

This is not product-runner proof.
On 2026-06-19, the checked-in `cautilus-tagline` app/prompt fixture was re-run through the fixture backend, live Codex CLI backend, and live Claude CLI backend.
The fixture backend and Codex live backend returned `accept-now`.
The Claude live backend returned a reasonable one-sentence Cautilus description, but it used `behave` rather than the exact expected fragment `behavior`; the current app/prompt evaluator is a string-fragment matcher, so that run correctly returned `reject`.
Two independent blind intent judges then graded the Codex and Claude live backend responses **sound** against the behavior-evaluation intent, and graded a constructed unrelated secret-retention control **unsound**.
All three runs still report `productProofReady=false`, `requiresProductRunnerProof=true`, and `runnerAssessmentState=missing-assessment`.
So this closes the stale saved-bundle-only description for app/prompt, but it does not close app/prompt product-runner proof debt.

> check:cautilus-json-file
| path | json_path | equals | includes |
| --- | --- | --- | --- |
| fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | schemaVersion | cautilus.app_prompt_backend_probe.v1 | |
| fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | sourceFixture | fixtures/eval/app/prompt/cautilus-tagline.fixture.json | |
| fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | expectedFinalTextFragment | behavior | |
| fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | runs[0].runtime | fixture | |
| fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | runs[0].recommendation | accept-now | |
| fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | runs[0].proof.productProofReady | false | |
| fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | runs[0].proof.requiresProductRunnerProof | true | |
| fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | runs[0].proof.runnerAssessmentState | missing-assessment | |
| fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | runs[1].runtime | codex | |
| fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | runs[1].recommendation | accept-now | |
| fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | runs[1].proof.productProofReady | false | |
| fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | runs[1].proof.requiresProductRunnerProof | true | |
| fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | runs[1].proof.runnerAssessmentState | missing-assessment | |
| fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | runs[2].runtime | claude | |
| fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | runs[2].recommendation | reject | |
| fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | runs[2].evaluation.matcherBoundary | | string-fragment matcher rejects |
| fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | runs[2].proof.productProofReady | false | |
| fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | runs[2].proof.requiresProductRunnerProof | true | |
| fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | runs[2].proof.runnerAssessmentState | missing-assessment | |
| fixtures/eval/app/prompt/intent-judge/app-prompt-intent-judge-verdicts.json | schemaVersion | cautilus.app_prompt_intent_judge.v1 | |
| fixtures/eval/app/prompt/intent-judge/app-prompt-intent-judge-verdicts.json | sourceProbe | fixtures/eval/app/prompt/backend-probe/app-prompt-backend-probe-capture.json | |
| fixtures/eval/app/prompt/intent-judge/app-prompt-intent-judge-verdicts.json | judgeRuns[0].verdicts[1].caseId | claude-live | |
| fixtures/eval/app/prompt/intent-judge/app-prompt-intent-judge-verdicts.json | judgeRuns[0].verdicts[1].verdict | sound | |
| fixtures/eval/app/prompt/intent-judge/app-prompt-intent-judge-verdicts.json | judgeRuns[1].verdicts[1].verdict | sound | |
| fixtures/eval/app/prompt/intent-judge/app-prompt-intent-judge-verdicts.json | verdicts[2].caseId | control-generic | |
| fixtures/eval/app/prompt/intent-judge/app-prompt-intent-judge-verdicts.json | verdicts[2].kind | judge-control-semantic | |
| fixtures/eval/app/prompt/intent-judge/app-prompt-intent-judge-verdicts.json | verdicts[2].verdict | unsound | |

## A user can choose the behavior surface that matches the evaluation intent.

The older selected eval-surface evidence bundle still covers repo-contract behavior, checked-in skill behavior, multi-turn app chat behavior, and single prompt input/output behavior.
This section projects that legacy cross-surface bundle for coverage continuity; the fresher app/chat and app/prompt proof boundaries are asserted in the sections above.

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
