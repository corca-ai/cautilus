# Debug Review: cross-machine portability
Date: 2026-04-27

## Problem

The no-input Cautilus flow had just moved claim discovery into a repo-local state path, but a code-level portability review found several ways the same released checkout could behave differently on macOS, a checkout with spaces in its path, or a session started outside the target repo.

## Correct Behavior

Given a user runs Cautilus against a target repo, when Cautilus suggests follow-up commands or writes generated artifacts, then the commands should keep the target repo explicit, quote shell-sensitive paths, create nested output parents, and avoid checking local absolute paths into portable state artifacts.

## Observed Facts

- `agent status --repo-root <repo>` suggested follow-up commands using `--repo-root .` or repo-relative claim paths, which pointed at the caller's current directory rather than the reported target repo.
- The source checkout launcher used `dirname -- "$0"` and `cd --`, which is more GNU-userland-specific than necessary for `/bin/sh` on macOS or minimal environments.
- Several `scripts/agent-runtime/*.mjs` CLIs wrote `--output <file>` directly and failed when the parent directory did not already exist.
- `audit-cautilus-no-input-log.mjs` detected its CLI entrypoint with raw `file://${process.argv[1]}`, which breaks when the path needs URL escaping.
- `.cautilus/claims/status-summary.json`, `.cautilus/claims/validation-report.json`, and the published self-dogfood review summary contained `/home/hwidong/codes/cautilus/...` absolute paths.
- The `.gitleaks.toml` allowlist added for claim packet `gitCommit` metadata did not initially extend default rules and did not target the full JSON line.

## Reproduction

The smallest local repros were code-level and command-shaped:

```bash
cautilus agent status --repo-root "/tmp/repo with spaces" --json
node scripts/agent-runtime/audit-cautilus-no-input-log.mjs --input log.jsonl --output artifacts/no-input/audit.json
./bin/cautilus claim show --input .cautilus/claims/latest.json --output .cautilus/claims/status-summary.json
gitleaks detect --source . --no-banner --redact
```

Before the fixes, these surfaces either emitted commands that would target the wrong cwd, failed on nested output parents, preserved local absolute paths in generated artifacts, or weakened/failed the intended secret-scan allowlist.

## Candidate Causes

- Recent native CLI fixes covered Go `writeOutputResolved`, but Node runtime scripts still owned direct file writes independently.
- Agent-facing commands were treated as examples for a same-cwd shell rather than durable commands tied to the reported `repoRoot`.
- Generated claim status used the resolved filesystem input path instead of a portable display path.
- The gitleaks configuration changed only the false positive symptom and did not preserve the scanner's default rule set.

## Hypothesis

If Cautilus centralizes Node output writes, quotes and absolutizes target-repo commands in `agent status`, records relative display paths for claim show/validate artifacts, and preserves gitleaks defaults with a line-targeted allowlist, then the same checkout should avoid these cross-machine failures without hardcoding the current repo path.

## Verification

- `go test ./internal/runtime -run 'TestDiscoverClaimProofPlan(UsesAdapterClaimDiscoveryEntries|RejectsEscapingAdapterStatePath)|TestBuildClaimStatusSummary'` passed.
- `go test ./internal/app -run 'TestRunAgentStatusJSONReturnsNoInputOrientation|TestRunClaimShowSummarizesExistingProofPlan|TestRunClaimValidateWritesReportAndFailsInvalidEvidence|TestCLIDoctor'` passed.
- `go test ./internal/app ./internal/runtime` passed.
- `node --test --test-reporter=dot --test-reporter-destination=stdout scripts/agent-runtime/audit-cautilus-no-input-log.test.mjs scripts/agent-runtime/build-review-packet.test.mjs scripts/agent-runtime/run-local-eval-test.test.mjs scripts/self-dogfood-published-snapshot.test.mjs bin/cautilus.test.mjs` passed.
- `npm run lint` passed, including `gitleaks detect --source . --no-banner --redact`.
- `rg -n "/home/hwidong|C:\\\\|/tmp/cautilus-first-run|dirname --|cd --|file://\\$\\{process\\.argv\\[1\\]\\}|new URL\\(process\\.argv\\[1\\]" .cautilus/claims artifacts/self-dogfood/latest scripts/agent-runtime bin internal -g '!node_modules'` found no matches.

## Root Cause

The product had fixed the immediate Go claim-output failure, but the broader product surface still had duplicated path-output conventions across native Go, shell launcher, generated artifacts, and Node helper scripts.
Those surfaces were not reviewed as one CLI-plus-skill portability boundary until the dogfood flow exposed the first nested claim-state failure.

## Seam Risk

- Interrupt ID: cross-machine-portability
- Risk Class: monitor
- Seam: CLI-generated commands and runtime artifact paths
- Disproving Observation: code review found target repo loss, local absolute artifact paths, and direct nested output writes outside the already-fixed Go helper
- What Local Reasoning Cannot Prove: actual macOS execution, managed install update behavior with custom install env, and `/dev/shm` noexec behavior on hardened Linux
- Generalization Pressure: medium

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep agent-facing commands tied to the reported target repo, not the caller cwd.
Use shared output helpers for Node agent-runtime CLIs that accept `--output`.
When committing generated artifacts, prefer repo-relative display paths over resolved local absolute paths.
Keep secret-scan config changes additive to default rules and verify both the false-positive allowlist and baseline secret detection behavior.
