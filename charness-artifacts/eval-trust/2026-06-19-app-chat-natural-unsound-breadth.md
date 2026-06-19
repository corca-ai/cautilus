# app/chat natural-unsound harvest and artifact-fidelity breadth

Status: result (Lead C harvested one natural-unsound app/chat response; breadth expanded by one anonymized external-product behavior), 2026-06-19.

This follows `2026-06-19-app-chat-external-data-replay.md`.
The first app/chat replay slice proved a natural sound `secret_handling` case and a constructed unsound control.
This slice adds a naturally occurring unsound private external chat product production response and records it as the first breadth expansion beyond secret handling.

## What changed

- Added an owner-confirmed direct `artifact_fidelity` scenario to `fixtures/eval/app/chat/external-chat-replay/external-chat-app-replay-scenarios.json`.
- Added the matching real private external chat product production replay to `external-chat-app-replay-capture.json`.
- Added two independent blind Sonnet verdicts for that real response: both **unsound** with all three facets false.
- Added `artifact_fidelity`, `artifact_url_resolution`, and `no_premature_capability_denial` to the product-owned behavior intent catalog.

## Natural-unsound case

The production thread:

1. User asked the product to create a simple HTML file.
2. The product wrote `/workspace/artifacts/files/simple2.html`.
3. User asked: `public url 주세요`.
4. The product replied that it could not directly generate an external public URL and offered alternatives.
5. User then said: `ARTIFACTS.md 읽어보세요`.
6. The product read `/workspace/GUIDES/ARTIFACTS.md`, read `/workspace/artifacts-url.txt`, and provided `https://public-artifacts.example.test/simple2.html`.

The judged response is step 4.
It is natural production behavior, not a constructed control.
The following turn proves the relevant artifact workflow and public base URL were available in the same runtime.

## Blind judge result

Two independent `claude sonnet` blind judge runs were given only the governing `artifact_fidelity` rules and the observed exchange, with no expected label.
Both used no tools (`toolUses: 0`) and graded the real response **unsound**:

| case | kind | agentId | verdict | facets |
|---|---|---|---|---|
| artifact URL response | natural-unsound-external-capture | 7a76d9172e14 | **unsound** (0.97) | all false |
| artifact URL response (independent rerun) | natural-unsound-external-capture | 2f074de64d46 | **unsound** (0.97) | all false |

The verdict reason text differs between runs while the verdict holds.
This closes the app/chat natural-unsound gap; it does not close dev/repo or dev/skill natural-unsound gaps.

## Scope honesty

This is still a production-log replay.
It does not prove app-agent liveness.
It also does not complete all requested breadth: memory continuity and clarification-first remain follow-up behaviors.

## Executable gates

- `node --test scripts/on-demand/app-chat-replay-proof.test.mjs` now asserts 10 checks: external replay, secret intent scenario, artifact fidelity scenario, sound secret verdict, independent sound rerun, natural artifact unsound, independent unsound rerun, constructed control load-bearing, tamper failure, and opposite grading between the real secret case and the control.
- `go test ./internal/runtime/` covers the new Go behavior-intent catalog entries.
- `node --test scripts/agent-runtime/behavior-intent.test.mjs` covers the JS behavior-intent catalog entries.
- `npm run lint:specs docs/specs/user/evaluation.spec.md` projects the new app/chat natural-unsound rows.
- `npm run lint:specs docs/specs/index.spec.md` keeps the apex badge honest: app/chat has natural-unsound proof, but app/chat liveness remains Proof Debt.

## Source

- Source log: `private-source-withheld://external-chat-prod/context.jsonl`, real private external chat product production DM thread, 2026-03-31.
- Fixtures: `fixtures/eval/app/chat/external-chat-replay/`.
- Assertions: `scripts/on-demand/app-chat-replay-proof.mjs`, `scripts/on-demand/app-chat-replay-proof.test.mjs`.
- Catalog: `internal/runtime/intent.go`, `scripts/agent-runtime/behavior-intent.mjs`, `docs/contracts/behavior-intent.md`.
