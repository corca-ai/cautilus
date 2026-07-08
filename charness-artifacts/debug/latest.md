# Debug Review
Date: 2026-07-08

## Problem

`npm run verify:runtime` failed after adding active-only claim evidence audit support.
ESLint reported `parseArgs` in `scripts/agent-runtime/audit-claim-evidence-hashes.mjs` exceeded the `sonarjs/cognitive-complexity` limit: current 18, allowed 12.

## Correct Behavior

Given the evidence audit accepts `--reference-scope active|full`, when the standing command narrows its scope, then argument parsing should preserve the CLI contract and remain inside the repo's maintainability gate.

## Observed Facts

- `npm run verify:runtime` failed in the first phase, `lint · eslint`.
- Focused reproduction with `npx eslint scripts/agent-runtime/audit-claim-evidence-hashes.mjs` produced the exact error: `42:17 error Refactor this function to reduce its Cognitive Complexity from 18 to the 12 allowed`.
- `eslint.config.mjs` sets both cyclomatic complexity and `sonarjs/cognitive-complexity` to 12 for non-test `.mjs` files.
- The SonarJS rule reports cognitive complexity at function level, so the whole `parseArgs` branch ladder is the measured unit.
- Related prior incidents in `charness-artifacts/debug/latest.md` and `charness-artifacts/debug/2026-07-08-scenario-provenance-js-validation-complexity.md` recorded the same maintainability pattern: adding control-flow branches inline tripped the lint gate.

## Reproduction

- Run `npx eslint scripts/agent-runtime/audit-claim-evidence-hashes.mjs` after the initial active-only audit patch.
- Observed result: eslint exits 1 with one `sonarjs/cognitive-complexity` error for `parseArgs`.

## Candidate Causes

- The parser change added `--reference-scope`, its value validation, and `--active-only` directly to an already branch-heavy `parseArgs`.
- The lint threshold is too strict for CLI argument parsing.
- The active-only feature introduced an invalid option contract that forced complex parsing.

## Hypothesis

- Falsifiable claim: the failure is local structural complexity in `parseArgs`, not a bad active-only audit contract or a lint threshold problem.
- Disconfirmer: if extracting value-option and flag handling still fails focused eslint or breaks parser tests, the option contract or lint rule needs reconsideration.

## Verification

- Result: confirmed.
- `npx eslint scripts/agent-runtime/audit-claim-evidence-hashes.mjs scripts/agent-runtime/audit-claim-evidence-hashes.test.mjs scripts/github-actions.test.mjs` passed.
- `node --test --test-reporter=spec --test-reporter-destination=stdout scripts/agent-runtime/audit-claim-evidence-hashes.test.mjs scripts/github-actions.test.mjs` passed.
- `npm run --silent claims:audit-evidence` reported `mode: active-only`, scanned 2 reference files, skipped 172 historical reference files, and exited 0.
- `npm run --silent claims:audit-evidence:full` reported `mode: full`, scanned all 174 reference files, and exited 0.

## Root Cause

The root cause was adding a new value-taking option and alias flag by extending one parser function directly.
That concentrated help handling, value extraction, value validation, flag mutation, and unknown-argument handling in `parseArgs`, exceeding the repo's cognitive-complexity gate.

## Invariant Proof

- Invariant: runner and audit CLI parsing should route value-taking options and standalone flags through helpers once a parser owns several branches.
- Producer Proof: eslint caught the overloaded parser before the quality slice could complete.
- Final-Consumer Proof: focused parser tests, active-only audit behavior tests, active audit command, and full audit command passed after helper extraction.
- Interface-Shape Sibling Scan: `--repo-root`, `--claims-dir`, and `--reference-scope` are the value-option siblings; `--strict-checked-in-evidence`, `--active-only`, and `--summary` are the flag siblings.
- Non-Claims: this debug note does not claim `npm run verify:runtime`, `npm run verify`, or hooks have passed; those belong to the resumed quality verification.

## Detection Gap

- surface: audit CLI parser maintainability | what did not fire: focused behavior tests do not measure function complexity | smallest change to fire it: existing eslint gate already fires in `verify:runtime`, so no new gate is needed.

## Sibling Search

- Mental model: adding one more CLI branch can stay inline in the existing parser.
- same-file axis: `--repo-root`, `--claims-dir`, and `--reference-scope` | decision: same bug, fix now | proof: static scan plus failing eslint points to one value-option branch ladder.
- same-file axis: `--strict-checked-in-evidence`, `--active-only`, and `--summary` | decision: same bug, fix now | proof: static scan shows standalone flag branches contribute to the same measured function.
- cross-file: `scripts/run-verify.mjs` parser complexity debug memory | decision: same class, diagnostic-only for this slice | proof: prior debug record says helper extraction already resolved that parser.
- cross-file: `scripts/agent-runtime/scenario-proposals.mjs` validation complexity debug memory | decision: same class, diagnostic-only for this slice | proof: prior debug record says helper-oriented validation resolved that function.

## Seam Risk

- Interrupt ID: claim-evidence-audit-parser-complexity-2026-07-08
- Risk Class: none
- Seam: audit CLI option parsing to maintainability gate
- Disproving Observation: eslint failed deterministically before broader runtime verification continued.
- What Local Reasoning Cannot Prove: n/a
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep audit and runner parser additions helper-oriented when adding value-taking flags or aliases.
Do not weaken the eslint complexity gate for parser code; it is catching the same maintainability regression class repeatedly.
