# Debug Review: skill no-input orientation fixture requires a non-existent `agent status` command
Date: 2026-06-19

## Problem

The cautilus-agent no-input orientation eval case requires the command fragment `agent status`, which is not a real Cautilus command, so a genuine live capture that orients correctly via `doctor status` is forced to `failed`.

## Correct Behavior

Given the no-input orientation case (`execution-cautilus-no-input-claim-discovery-status`),
when a real agent orients by running the SKILL.md-prescribed `cautilus doctor status --repo-root . --json` (the command that emits the `cautilus.agent_status.v1` packet) and stops at branch selection,
then the deterministic command matcher must pass, because the required fragment should name the real command (`doctor status`), not a non-existent `agent status` command.

## Observed Facts

- `./bin/cautilus agent status --repo-root . --json` prints the usage/error banner; `agent status` is not a command.
- `./bin/cautilus doctor status --repo-root . --json` emits the orientation packet; `internal/app/app.go` dispatches `case "doctor status"`.
- `skills/cautilus-agent/SKILL.md` "No-Input Orientation" prescribes `"$CAUTILUS_BIN" doctor status --repo-root . --json`.
- A live codex capture (`run-local-skill-test.mjs --backend codex_exec`, read-only) ran `./bin/cautilus doctor status --repo-root . --json`, summarized binary/adapter/claim-state/scan-scope/next-branches, and stopped at branch selection — a sound orientation — yet `outcome` was forced to `failed` with "command log missing required fragment: agent status".
- `scripts/agent-runtime/skill-test-expectations.mjs`: `expectationFindings` returns `[]` when `text === null`; `runFixtureSample` passes `commandText = null`, so the `requiredCommandFragments` check is never exercised in fixture mode.
- Two fixtures carry the stale fragment: `fixtures/eval/dev/skill/cautilus-skill-routing.fixture.json:35` and `fixtures/eval/dev/skill/internal-runner-cases.json:31`.

## Reproduction

1. `node ./scripts/agent-runtime/run-local-skill-test.mjs --repo-root . --workspace . --cases-file <one-case no-input suite> --output-file <out> --backend codex_exec --sandbox read-only` (codex backend, live).
2. The agent runs `./bin/cautilus doctor status --repo-root . --json` and orients soundly.
3. Observed `outcome: failed`, summary appended with "Expectation failure: command log missing required fragment: agent status"; the raw pre-matcher `result.json` shows `outcome: passed` and a clean summary.

## Candidate Causes

- The fixture confuses the packet NAME (`cautilus.agent_status.v1`) with the command name; the orientation command is `doctor status`. (Confirmed.)
- A historical `cautilus agent status` command was renamed to `doctor status`, leaving the fragment stale. (Plausible; the current command surface shows `doctor status` is canonical, and the fix is identical either way.)
- The matcher should target the packet schema name rather than the command log. (Rejected: `requiredCommandFragments` checks the command log by design; the summary already carries the packet semantics.)

## Hypothesis

If the required fragment is changed from `agent status` to `doctor status` (the command the genuine orientation actually emits), the live capture's command matcher passes and the case is gated only by the summary fragments, the outcome, and the new judge tier.

## Verification

- The captured command text contains `doctor status` (confirmed via the codex stdout jsonl).
- With the fragment as `doctor status`, `expectationFindings("command log", "...doctor status...", ["doctor status"], ...)` returns no finding, so the genuine capture's `outcome` stays `passed`.

## Root Cause

`requiredCommandFragments: ["agent status"]` names a command that does not exist; the orientation command is `doctor status` (the `agent_status` token is the packet name, not the CLI verb).
The stale fragment survived because the only execution path that ran it — fixture mode — passes `commandText = null`, so `expectationFindings` short-circuits to `[]` and the fragment is never checked; the convergence's first live capture is the first time the fragment met real command text.

## Invariant Proof

- Invariant: a `requiredCommandFragments` entry must name a command the prescribed behavior actually emits.
- Producer Proof: the live runner extracted command text containing `doctor status` (the SKILL.md-prescribed command).
- Final-Consumer Proof: with the fragment `doctor status`, `applyObservationExpectations` yields no command-log finding and keeps `outcome: passed`.
- Interface-Shape Sibling Scan: the sibling fixture `internal-runner-cases.json` carries the identical stale fragment and is fixed in the same change.
- Non-Claims: this does not change fixture-mode behavior (where command text is null and the check is vacuous); it only restores honesty under live execution.

## Detection Gap

- skill eval command matcher | the `requiredCommandFragments` check is dead in fixture mode (`commandText=null` makes `expectationFindings` return `[]`), and the standing dogfood gate runs fixture mode only, so a stale or non-existent command fragment never fired | smallest change to fire it: a fixture lint asserting every `requiredCommandFragments` entry is a known cautilus subcommand, or exercising the no-input case live in CI (follow-up: skill-fixture-command-fragment-lint).

## Sibling Search

- Mental model: "the orientation is called agent status, so the command must be `agent status`" — conflating the orientation packet/concept name with the CLI verb (`doctor status`).
- same-file axis: `cautilus-skill-routing.fixture.json` line 35 | decision: fix `agent status` to `doctor status`; the sibling test-request case (line 23) uses real fragments and is correct | proof: live capture command text.
- cross-file: `internal-runner-cases.json:31` | decision: same fix (identical stale fragment) | proof: grep sibling scan.
- other-surface axis: `SKILL.md` uses `doctor status` correctly and `app_test.go` forbids first-touch escalation commands — no stale sibling there | decision: no change | proof: read.

## Seam Risk

- Interrupt ID: none
- Risk Class: none
- Seam: skill eval fixture matcher (behavior-steering), local to this repo
- Disproving Observation: none — the live capture confirms the corrected fragment matches the genuine command
- What Local Reasoning Cannot Prove: none beyond the live capture already gathered
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: docs/contracts/skill-surface-judge-convergence.md

## Prevention

Fix both fixtures' fragment to `doctor status` now, and (follow-up: skill-fixture-command-fragment-lint) add a deterministic check that every `requiredCommandFragments` entry corresponds to a real cautilus command family, so a non-existent command fragment fails loudly instead of hiding behind fixture-mode's null command text.

## Related Prior Incidents

- `debug-2026-05-03-agent-status-branch-catalog-claim.md`: the same `doctor status` command versus `agent_status` packet boundary, there about the Go branch-catalog claim; this incident is the eval-fixture sibling of that same naming boundary.
