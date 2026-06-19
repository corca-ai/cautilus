# app/chat memory-continuity breadth

Status: result (private external chat product production-log replay adds one natural sound memory-continuity behavior), 2026-06-19.

This follows `2026-06-19-app-chat-external-data-replay.md` and `2026-06-19-app-chat-natural-unsound-breadth.md`.
The app/chat replay already carried a natural sound `secret_handling` case and a natural unsound `artifact_fidelity` case.
This slice adds a second natural sound app/chat behavior: remembered-location continuity after a memory write.

## What changed

- Added an owner-confirmed direct `conversation_continuity` scenario to `fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-scenarios.json`.
- Added the matching real private external chat product production replay to `external-chat-app-replay-capture.json`.
- Added two independent blind Sonnet verdicts for that real response: both **sound** with all three facets true.
- Expanded `scripts/on-demand/app-chat-replay-proof.test.mjs` so the checked-in replay binds the memory scenario, capture, and both verdicts by `caseId`.

## Natural sound case

The production thread:

1. User asked private external chat product to remember that location-related questions should use example company location: `서울특별시 중구 샘플로 1`.
2. User explicitly asked private external chat product to put that information in memory.
3. private external chat product wrote `/workspace/MEMORY.md` and said future location questions would use the example-company address.
4. Later, the user asked: `회사 근처 날씨 정보 찾아주세요`.
5. private external chat product searched weather for `서울 중구 샘플로 일대`.
6. private external chat product answered with `서울 중구 샘플로 1` and the weather values returned by the tool.

The judged response is step 6.
It is natural production behavior, not a constructed control.
The memory write and weather tool result are both carried in the checked-in capture as supporting evidence.
This does not isolate durable cross-session memory retrieval from same-thread context; it proves replay breadth for remembered-location continuity after a real memory write.

## Blind judge result

Two independent `claude sonnet` blind judge runs were given only the governing `conversation_continuity` rules and the observed exchange, with no expected label.
Both used no tools (`toolUses: 0`) and graded the real response **sound**:

| case | kind | agentId | verdict | facets |
|---|---|---|---|---|
| private external chat product remembered company-location weather response | real-external-capture | memory-continuity-sonnet-pass-1 | **sound** (0.97) | all true |
| private external chat product remembered company-location weather response (independent rerun) | real-external-capture | memory-continuity-sonnet-pass-2 | **sound** (0.97) | all true |

The verdict reason text differs between runs while the verdict holds.
This widens app/chat breadth but does not close app-agent liveness.

## Scope honesty

This is still a production-log replay.
It does not prove app-agent liveness.
It also does not complete all requested breadth: clarification-first remains a follow-up behavior.

## Executable gates

- `node --test scripts/on-demand/app-chat-replay-proof.test.mjs` now asserts 13 checks, including the memory-continuity scenario, the memory sound verdict, and the independent memory sound rerun.
- `npm run lint:specs docs/specs/user/evaluation.spec.md docs/specs/index.spec.md` projects the new app/chat memory-continuity rows.

## Source

- Source log: `~/.example-app/example-app-prod/workspace/PRIVATE_WORKSPACE_ID/context.jsonl`, real private external chat product production DM thread, 2026-03-31.
- Fixtures: `fixtures/eval/app/chat/external-chat-replay/`.
- Assertions: `scripts/on-demand/app-chat-replay-proof.mjs`, `scripts/on-demand/app-chat-replay-proof.test.mjs`.
