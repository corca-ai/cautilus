# Debug Review
Date: 2026-07-09

## Problem

`npm run consumer:starters:smoke` failed while proving the normalization-family starter kits.
The helper expected JSON from `cautilus doctor` and `discover scenarios normalize`, but it invoked both commands without selecting JSON output.

## Correct Behavior

Given the starter smoke helper parses command stdout as JSON, when it invokes structured Cautilus commands, then it must pass `--format json` or only parse a command whose default stdout contract is JSON.
The starter README files should name the current command surface so a user can follow the same path the smoke verifies.

## Observed Facts

- Reproduction failed with `chatbot doctor did not emit JSON: Unexpected token 'a', "adapter_pa"... is not valid JSON`.
- `docs/guides/cli.md` documents that structured stdout defaults to YAML and callers should use `--format json` when a parser needs JSON.
- `scripts/on-demand/smoke-starter-kits.mjs` parsed `doctor` and normalization stdout with `JSON.parse`.
- The helper called `cautilus doctor --repo-root <starter>` and `cautilus discover scenarios normalize <family> --input <input>` without `--format json`.
- The fresh-consumer smoke helper also parsed `doctor` stdout as JSON after invoking `cautilus doctor --repo-root <fresh-repo>` without `--format json`.
- The starter README files still referenced legacy commands such as `cautilus install`, `cautilus adapter resolve`, `cautilus scenario normalize`, `cautilus eval test`, and `cautilus eval evaluate`.

## Reproduction

- `npm run consumer:starters:smoke`

## Candidate Causes

- The smoke helper forgot to request JSON after the CLI default output changed or was clarified as YAML.
- The CLI `doctor` command ignored `--format json` and could not emit JSON even when requested.
- The starter adapter failed before readiness and emitted a diagnostic that the helper misclassified as non-JSON.

## Hypothesis

- Falsifiable claim: the smoke fails because parser-consuming commands omit `--format json`; adding `--format json` to those calls makes `npm run consumer:starters:smoke` pass without changing starter adapter behavior.
- Disconfirmer: `./bin/cautilus doctor --repo-root examples/starters/chatbot --format json` or `./bin/cautilus discover scenarios normalize chatbot --input examples/starters/chatbot/input.json --format json` still emits non-JSON or fails.

## Verification

- Result: confirmed before repair.
- `./bin/cautilus doctor --repo-root examples/starters/chatbot --format json` emitted parseable JSON.
- `./bin/cautilus discover scenarios normalize chatbot --input examples/starters/chatbot/input.json --format json` emitted a JSON candidate array.
- Post-fix `npm run consumer:starters:smoke` passed.
- Post-fix `npm run consumer:onboard:smoke` passed and refreshed the onboarding capture with the explicit JSON doctor command.
- Post-fix `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/on-demand/smoke-starter-kits.test.mjs` passed.

## Root Cause

The starter smoke script encoded an implicit JSON default for commands whose structured stdout contract is YAML unless `--format json` is explicit.
The same drift left the starter README files pointing at pre-current command names, so the human path and automated smoke no longer matched the current CLI surface.

## Invariant Proof

- Invariant: automation that parses Cautilus structured stdout must request `--format json`.
- Producer Proof: the smoke helper now passes `--format json` to parsed `doctor` and normalization commands.
- Final-Consumer Proof: `npm run consumer:starters:smoke` passed across chatbot, skill, and workflow starters; `npm run consumer:onboard:smoke` passed through install, adapter init, doctor, and one bounded eval.
- Interface-Shape Sibling Scan: n/a
- Non-Claims: starter placeholders remain bootstrap smoke, not product-behavior proof.

## Detection Gap

- starter smoke helper | on-demand gate existed but was not on the default verify path and its own test failed only when run | smallest change to fire it: keep `npm run consumer:starters:smoke` green and run it when editing starter docs or CLI output-format behavior.
- starter README command drift | no check asserted README command names against the command registry | smallest change to fire it: the smoke helper verifies the executable path while docs carry current command names in the same slice.

## Sibling Search

- Mental model: structured CLI commands were treated as if JSON was still the default machine interface.
- same helper axis: `doctor` and normalization parse sites both needed explicit JSON | decision: fixed now | proof: post-fix starter smoke passed.
- fresh-consumer smoke axis: `consumer:onboard:smoke` parsed doctor stdout as JSON | decision: fixed now | proof: post-fix onboarding smoke passed.
- docs axis: chatbot, skill, and workflow starter READMEs all used old command vocabulary | decision: fixed now | proof: grep and smoke-aligned commands.
- cross-file: `docs/guides/cli.md` already owns the YAML-default / `--format json` rule | decision: no contract change needed | proof: documented current behavior.

## Seam Risk

- Interrupt ID: starter-smoke-output-format-drift-2026-07-09
- Risk Class: none
- Seam: none
- Disproving Observation: none
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep parser-facing smoke helpers explicit about output format, and run `npm run consumer:starters:smoke` plus `npm run consumer:onboard:smoke` whenever starter kits, onboarding smoke, or CLI structured-output contracts move.

