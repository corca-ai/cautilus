# Evaluate-Review Doubled-Verb Debug
Date: 2026-06-18

## Problem

`cautilus evaluate review --help` and the command catalog advertise `cautilus evaluate evaluate review prepare-input | build-prompt-input | render-prompt | variants` — a doubled "evaluate" — which is an unroutable command form.

## Correct Behavior

- Given the real command tree (`evaluate` → `review` → `<sub>`),
- when the binary renders usage/example for those four review subcommands,
- then it should print `cautilus evaluate review <sub>`, the form that actually routes.

## Observed Facts

- `./bin/cautilus evaluate review --help` Usage block printed `cautilus evaluate evaluate review prepare-input [args]` (and the same for build-prompt-input / render-prompt / variants).
- `./bin/cautilus evaluate evaluate` → `unknown command topic: evaluate evaluate` (exit 1): the advertised form does not route.
- `./bin/cautilus evaluate review prepare-input` → `--report-file is required` (exit 1): the single-evaluate form routes (fails only on a missing arg).
- The "Subcommands:" list and the render-html / feedback / render-variants-summary-html commands already used the correct single form; only the four review subcommands were doubled.
- The same `evaluate evaluate review` string had propagated into 23 tracked sites: 6 docs, the canonical skill tree, and its two synced copies.

## Reproduction

`./bin/cautilus evaluate review --help | grep 'evaluate evaluate'` → 4 doubled usage lines. `./bin/cautilus evaluate evaluate review prepare-input` → exit 1 unknown topic.

## Candidate Causes

- Control-flow: a usage renderer that prepends the group ("evaluate") on top of an already-fully-qualified path. (Falsified: `cautilus evaluate report build` renders correctly, so the renderer is not doubling.)
- Data: hardcoded `usage`/`example` strings in the embedded command registry carrying a literal doubled verb. (Confirmed.)
- Test/detection: a test that asserts the doubled form, pinning it as expected. (Confirmed — `registry_test.go:63`.)

## Hypothesis

If the registry JSON literally stores `evaluate evaluate review` in the four commands' `usage`/`example` (and a test asserts it), then correcting those strings fixes the help, and no rendering-logic change is needed. Falsifier: any OTHER command's usage/example also mismatching its path would mean the renderer is at fault.

## Verification

- `internal/cli/command-registry.json` holds the literal doubled string in 8 fields (4 commands × usage+example); `internal/cli/registry.go` `//go:embed`s the file (hand-maintained, not generated).
- A path-prefix scan of every registry command: 8 mismatches, all the `evaluate evaluate review` bug class; **0 other** mismatches (the one non-`cautilus`-prefixed example, `init run`'s `eval "$(cautilus …)"`, is correctly exempt). So the renderer is sound; the data is wrong.
- After correcting the 8 strings: `go test ./...` passes, `cautilus evaluate review --help` shows 0 doubled forms, and the previously-pinning assertion now asserts the single form.

## Root Cause

Hand-authored display strings in `internal/cli/command-registry.json` carried a copy-paste doubled `evaluate` for the four `evaluate review` subcommands, embedded into the binary and surfaced in its own `--help`. A unit assertion (`registry_test.go:63`) hardcoded the doubled form, so the test suite ratified the defect instead of catching it, and the string was copied into 23 doc/skill sites.

## Invariant Proof

- Invariant: every `cautilus `-prefixed `usage`/`example` string in the registry must lead with that command's own `Path` (help only advertises routable forms).
- Producer Proof: `command-registry.json` corrected; the new `TestRegistryUsageExamplePrefixMatchesPath` loads the embedded registry and asserts the invariant for every command.
- Final-Consumer Proof: `cautilus evaluate review --help` (RenderTopicUsage) and `cautilus doctor commands` (UsageLines/ExampleLines) read the same registry, so the corrected strings flow to every consumer; help output verified clean.
- Interface-Shape Sibling Scan: the prefix-scan over all commands found no other producer-side violation.
- Non-Claims: n/a.

## Detection Gap

- Surface: `internal/cli/registry_test.go` | did not fire — it asserted `strings.Contains(usage, "cautilus evaluate evaluate review variants …")`, ratifying the doubled form | smallest change that fires it: a structural invariant test (`usage/example` prefix == command `Path`) instead of a literal-string contains-check. Added as `TestRegistryUsageExamplePrefixMatchesPath`, so any future doubled/missing/wrong verb fails at `go test`.

## Sibling Search

- Mental model (wrong): "command usage strings are free-form display text," so a doubled token reads as harmless prose rather than an unroutable command.
- registry-data axis: `command-registry.json` 4 commands × {usage, example} | decision: all 8 corrected | proof: path-prefix scan = 0 residual, go test green.
- test axis: `registry_test.go:63` pinned the bug | decision: corrected the assertion + added the structural guard | proof: go test green.
- doc axis: 6 docs (`review-packet`, `review-prompt-inputs`, `scenario-history`, `adapter-contract` contracts; `evaluation-process` guide; `operator-acceptance`) | decision: all corrected | proof: repo-wide grep = 0 residual (outside the doc-of-record).
- skill axis / cross-file: the canonical `skills/cautilus-agent/` tree plus its synced copies `plugins/cautilus/skills/cautilus-agent/` and `.agents/skills/cautilus-agent/` (SKILL.md + 4 references each) | decision: corrected identically across all three, re-synced via `skills:sync-packaged`, parity reconfirmed by `critique:surface-packet:check` (findings: []) | proof: 3-tree sha parity.
- follow-up: none outstanding — `cli.md` was fixed earlier this session (commit 3bc1b06); `RECALL-PROBE-cli.md` intentionally retains the literal string as the documenting record.

## Seam Risk

- Interrupt ID: n/a
- Risk Class: none
- Seam: none (in-repo embedded data + its own consumers; no external host seam)
- Disproving Observation: none
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none

## Prevention

The structural invariant test (`TestRegistryUsageExamplePrefixMatchesPath`) replaces the literal-string assertion that ratified the defect, converting the detection gap into a standing `go test` gate that fails on any usage/example whose prefix diverges from its command path.

## Related Prior Incidents

None found in `charness-artifacts/debug/` (no prior command-registry or usage-rendering incident).
