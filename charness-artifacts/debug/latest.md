# Debug Review
Date: 2026-07-09

## Problem

`npm run lint:specs` failed after structured stdout changed to default YAML because executable specs still asked the `cautilus-json-command` adapter to parse default stdout as JSON.

## Correct Behavior

Given structured command stdout defaults to YAML, human or agent display commands may omit a format flag.
When an executable spec or parser expects JSON, the command under `cautilus-json-command` must request `--format json`.

## Observed Facts

- `go test ./internal/app ./internal/cli ./internal/runtime` passed.
- `npm run lint:skill-disclosure` initially failed because its required fragments still expected `doctor commands --json` and `discover scenarios --json`.
- `npm run lint:specs` failed with `Command stdout was not JSON`.
- `specdown run` showed YAML stdout for `doctor --repo-root ...` and `evaluate claims plan ...` cases executed through `cautilus-json-command`.
- Adding `--format json` to JSON-parser spec commands made `npm run lint:specs` pass.
- `npm run verify` then failed in `claims:evidence-state:check` because `render-claim-evidence-state.mjs --refresh-status` parsed `discover claims status` stdout without requesting JSON.

## Reproduction

- Run `npm run lint:specs` after defaulting `writeJSON`/`writeOutput` stdout to YAML.
- The smallest spec failing command was `${sample_cautilus} doctor --repo-root ${missing_git_repo}` under `check:cautilus-json-command(exit_code=1)`.
- The smallest script failing path was `node scripts/agent-runtime/render-claim-evidence-state.mjs --refresh-status --check`.

## Candidate Causes

- Executable specs that verify JSON parser paths were not updated to pass `--format json`.
- The specdown Cautilus adapter could be incorrectly parsing YAML as JSON.
- The CLI default could be wrong and should have preserved JSON for all specdown runs.

## Hypothesis

- Falsifiable claim: the failure is spec/parser command drift, not a broken CLI JSON mode.
- Disconfirmer: the same commands still fail when run with `--format json`.

## Verification

- Result: confirmed.
- `cautilus doctor ... --format json`, `cautilus doctor status ... --format json`, `cautilus discover claims status ... --format json`, `cautilus discover claims validate ... --format json`, and `cautilus evaluate claims plan ... --format json` are valid JSON parser paths.
- `npm run lint:specs` passed after the spec directives and parser examples were updated.
- `npm run lint:skill-disclosure` passed after the required fragments moved from `--json` to `--format json`.
- `scripts/agent-runtime/render-claim-evidence-state.test.mjs` now uses a fixture binary that fails unless `--format json` is passed on refresh.

## Root Cause

The implementation correctly changed structured stdout presentation to YAML, but executable specs and a disclosure guard still encoded the old assumption that no flag or the legacy `--json` spelling was the canonical parser path.
The product contract had moved to `--format json`; the parser-facing proof surface had not fully moved with it.

## Invariant Proof

- Invariant: parser-facing proof commands must request JSON explicitly.
- Producer Proof: `docs/contracts/cli-output-format.md` defines YAML default stdout and `--format json` parser stdout.
- Final-Consumer Proof: `npm run lint:specs` re-executes the specdown JSON parser checks and passed; `npm run claims:evidence-state:check` covers the internal refresh parser path.
- Interface-Shape Sibling Scan: `scripts/check-cautilus-skill-disclosure.mjs` now requires `--format json` fragments for Cautilus Agent command discovery.
- Non-Claims: default human/auditor display commands may still omit `--format json` and receive YAML.

## Detection Gap

- executable specs | JSON-parser directives did not fail until `lint:specs` ran after implementation | smallest change to fire it: keep `npm run lint:specs` in the focused gate for CLI stdout-format work.
- skill disclosure guard | required fragments lagged behind the command contract | smallest change to fire it: update required fragments in the same slice as contract language.
- examples with `jq` | parser examples can silently become stale when stdout defaults change | smallest change to fire it: search `| jq` examples whenever stdout presentation changes.

## Sibling Search

- Mental model: changing the CLI writer is enough if app tests pass.
- same layer: `docs/specs/promises/doctor-readiness.spec.md` | decision: same bug, fixed now | proof: specdown failure and passing rerun.
- same layer: `docs/specs/promises/reviewable-artifacts.spec.md` and `docs/specs/promises/a-testable-agent.spec.md` | decision: same bug, fixed now | proof: parser-command scan and passing rerun.
- internal script layer: `scripts/agent-runtime/render-claim-evidence-state.mjs` | decision: same bug, fixed now | proof: `verify` failure and fixture assertion requiring `--format json`.
- guard layer: `scripts/check-cautilus-skill-disclosure.mjs` | decision: same bug, fixed now | proof: failing then passing `npm run lint:skill-disclosure`.
- cross-file: specs, internal parser scripts, skill-disclosure guard, and Cautilus Agent skill/package copies.

## Seam Risk

- Interrupt ID: cli-yaml-default-parser-spec-drift-2026-07-09
- Risk Class: none
- Seam: CLI stdout presentation contract versus executable JSON-parser specs.
- Disproving Observation: explicit `--format json` commands parse and specdown passes.
- What Local Reasoning Cannot Prove: whether external consumer scripts parse default stdout without `--format json`; release notes must call out the new default.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

For future stdout-format changes, update executable spec commands, `jq` examples, and deterministic skill-disclosure fragments in the same slice as the CLI writer change.
