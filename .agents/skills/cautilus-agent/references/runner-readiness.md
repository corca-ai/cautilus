# Runner Readiness: Build and Assess a Headless Runner

Use this when the selected claim needs behavior proof and the user must build or assess the headless runner Cautilus drives.
Runner readiness is a setup substrate under `claim`, `eval`, and `improve`, not a fourth command family.
The binary owns command discovery, the assessment scaffold source, and freshness checking; Cautilus Agent owns sequencing and judgment.

## Orient

Read runner readiness from the orientation packet rather than guessing from source:

```bash
"$CAUTILUS_BIN" doctor status --repo-root . --format json
```

Read `runnerReadiness`: `state` (one of missing-assessment, smoke-only, assessed, stale, not-ready, ready), the per-runner entries, `scaffoldSource`, `assessment`, and the readiness next branches.
The branches are ordered by the blocker that prevents honest evaluation: adapter, runner template, runner smoke, assessment missing, assessment stale, assessment not ready, ready.
Resolve the first blocking branch before promising app behavior proof.

## Decide the required capability

For the selected claim, read what the proof actually needs instead of assuming:

```bash
"$CAUTILUS_BIN" evaluate claims plan --claims <claims.json>
```

Read each plan's `proofRequirement`: `requiredRunnerCapability`, `recommendedEvalSurface`, `requiredObservability`, and whether `requiresProductRunnerProof` is set.
These are requirement fields, not readiness verdicts — they say what a fit runner must do, not that the current runner is fit.

## Build

Help the user build a headless runner that reuses the real product path, not a copied prompt.

- For `dev/repo` and `dev/skill`, the runner is usually a coding-agent CLI (Codex or Claude Code) plus a repo-owned wrapper that records the transcript or audit packet.
- For `app/chat` and `app/prompt`, prefer a headless product runner that imports product behavior in-process or invokes a selected live instance over extracting the prompt into a standalone mock.
- The runner takes product-readable input and writes a Cautilus-readable observed packet with the observability the requirement named.

Prompt-only fixtures are useful smoke tests, not the highest-confidence app proof; say so when only smoke is available.

## Assess

Help the user produce a `cautilus.runner_assessment.v1` packet at the binary-named scaffold path (default `.cautilus/runners/<runner-id>.assessment.json`).
Copy the scaffold source the binary names in `doctor status`; do not author the packet shape from prose.
Fill the judgment fields the binary cannot infer:

- `proofClass`: `fixture-smoke`, `coding-agent-messaging`, `in-process-product-runner`, or `live-product-runner`.
- `assessedRequirement`: the claim id or group, surface, required runner capability, and required observability this assessment is scoped to.
- `productionPathReuse`: the reused route handlers, services, prompt builders, tool registries, state stores, or policy modules.
- `observability`: which artifacts the runner emits (normalized messages, transcript, final text, tool calls, runtime fingerprint, side-effect summary, diagnostics).
- `verificationCapabilities`: for `in-process-product-runner` and `live-product-runner` with a `ready-for-selected-surface` recommendation, mark each of `inputSimulation`, `externalSubstitution`, `triggerControl`, and `externalObservation` as `present` or explicitly `not-required` with a reason.
- `runnerFiles`: every host-owned file the assessment relies on, so freshness can be checked from hashes; if transitive files cannot be enumerated, say so in `knownGaps`.
- `knownGaps` and `recommendation` (`ready-for-selected-surface`, `smoke-only`, `needs-instrumentation`, `needs-production-path-reuse`, or `blocked`).

`ready-for-selected-surface` does not mean the repo is generally ready; it means the assessed runner is fit for the listed requirement with the listed known gaps.

## Verify freshness

Re-run `doctor status` and confirm the assessment is not stale: freshness is checked against the current adapter hash and the listed runner file hashes, not the git commit alone.
A commit drift with matching hashes is exposed as provenance, not staleness.

## Boundary

- Keep the proof class honest in every summary so a cheap smoke is never overread as app end-to-end evidence.
- Stop `improve` when the selected claim requires runner-backed proof that is absent, stale, or only `fixture-smoke` / `coding-agent-messaging`; prepare or explain the missing proof instead of claiming behavior improvement.
- Only `in-process-product-runner` or `live-product-runner` plus a `ready-for-selected-surface` assessment may back an app behavior-change claim.
- Host repos own runners, prompts, wrappers, fixtures, and policy; the binary stays repo-agnostic.
