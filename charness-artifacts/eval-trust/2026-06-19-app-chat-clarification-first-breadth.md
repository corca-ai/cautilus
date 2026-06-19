# app/chat clarification-first breadth

Status: result (private external chat product production-log replay adds one natural sound clarification-first behavior), 2026-06-19.

This follows `2026-06-19-app-chat-external-data-replay.md`, `2026-06-19-app-chat-natural-unsound-breadth.md`, and `2026-06-19-app-chat-memory-continuity-breadth.md`.
The app/chat replay already carried natural sound `secret_handling` and `conversation_continuity` cases plus a natural unsound `artifact_fidelity` case.
This slice adds a third natural sound app/chat behavior: missing-location clarification before answering a weather request.

## What changed

- Added an owner-confirmed direct `thread_context_recovery` scenario to `fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-scenarios.json`.
- Added the matching real private external chat product production replay to `external-chat-app-replay-capture.json`.
- Added two independent blind Sonnet verdicts for that real response: both **sound** with all three facets true.
- Expanded `scripts/on-demand/app-chat-replay-proof.test.mjs` so the checked-in replay binds the clarification scenario, capture, and both verdicts by `caseId`.

## Natural sound case

The production thread:

1. User asked: `오늘 날씨가 어떻죠?`
2. No city, address, current location, or default location had been established in that thread yet.
3. private external chat product answered: `현재 위치 정보를 알 수 없어 정확한 지역의 날씨를 알 수 없습니다. 원하시는 지역(도시명 또는 주소)을 알려주시면 오늘의 날씨 정보를 안내해드릴 수 있습니다. 지역을 알려주시겠어요?`

The judged response is step 3.
It is natural production behavior, not a constructed control.
The checked-in capture carries explicit `clarificationEvidence` for the missing context (`location`) and requested concrete target (`city name or address`).

## Blind judge result

Two independent `claude sonnet` blind judge runs were given only the governing `thread_context_recovery` rules and the observed exchange, with no expected label.
Both used no tools (`toolUses: 0`) and graded the real response **sound**:

| case | kind | agentId | verdict | facets |
|---|---|---|---|---|
| private external chat product missing-location weather clarification | real-external-capture | weather-clarification-sonnet-pass-1 | **sound** (0.98) | all true |
| private external chat product missing-location weather clarification (independent rerun) | real-external-capture | weather-clarification-sonnet-pass-2 | **sound** (0.98) | all true |

The verdict reason text differs between runs while the verdict holds.
This widens app/chat breadth but does not close app-agent liveness.

## Scope honesty

This is still a production-log replay.
It does not prove app-agent liveness.
It does not prove that private external chat product would ask for location in every future weather request; it proves this owner-confirmed production capture and keeps it in the deterministic replay gate.
Together with the prior app/chat breadth slices, the remaining app-surface Proof Debt is now live app/chat re-run and app/prompt proof, not another local private external chat product replay breadth item.

## Executable gates

- `node --test scripts/on-demand/app-chat-replay-proof.test.mjs` now asserts 16 checks, including the clarification-first scenario, the sound verdict, and the independent sound rerun.
- `npm run lint:specs docs/specs/user/evaluation.spec.md docs/specs/index.spec.md` projects the new app/chat clarification-first rows.

## Source

- Source log: `~/.example-app/example-app-prod/workspace/PRIVATE_WORKSPACE_ID/context.jsonl`, real private external chat product production DM thread, 2026-03-31.
- Fixtures: `fixtures/eval/app/chat/external-chat-replay/`.
- Assertions: `scripts/on-demand/app-chat-replay-proof.mjs`, `scripts/on-demand/app-chat-replay-proof.test.mjs`.
