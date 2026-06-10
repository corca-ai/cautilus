# Debug Review
Date: 2026-06-11

## Problem

`npm run verify` fails at the `security · secret scan` gate with `leaks found: 3` (gitleaks), blocking the docs-truth slice closeout.

## Correct Behavior

Given checked-in claim packet evidence artifacts that contain repo commit metadata, when verify runs the secret scan, then `gitCommit` metadata lines are allowlisted and only real secret-shaped content fails the gate.

## Observed Facts

- Exact failure: `✖ security · secret scan failed (exit 1)` after `WRN leaks found: 3`.
- All three findings are rule `sourcegraph-access-token` on the `"gitCommit": "384e6d75888083cb486c63150a6dbdae766a5ac5"` lines of `charness-artifacts/eval-trust/agent-extraction-readme-sample/{input.json:38, claims-heuristic.json:533, claims-agent.json:1148}`.
- The matched value is this repo's own commit `384e6d7` (the calibration-sample extraction commit), not a credential.
- The files were introduced by commit `2abde089` (2026-06-10 calibration sample slice).
- `.cautilus/claims/*.json` packets carry identical `gitCommit` lines and pass only because `.gitleaks.toml` has a path-scoped allowlist for that directory.

## Reproduction

`npm run security:secrets` at the failing HEAD reproduces `leaks found: 3`; `gitleaks detect --report-path` lists exactly the three gitCommit lines above.

## Candidate Causes

- A real secret was committed — falsified: the matched token is the repo's own commit SHA, present in `git log`.
- gitleaks version or rule drift newly matching bare 40-hex tokens — not the trigger: the identical pattern under `.cautilus/claims/` has required an allowlist since it was added, so the rule has always matched these lines.
- The gitCommit-metadata allowlist is path-scoped to `.cautilus/claims/` and does not cover claim packets checked in under `charness-artifacts/` — confirmed.

## Hypothesis

The `sourcegraph-access-token` rule matches the bare 40-hex token on `gitCommit` lines, and the existing allowlist only exempts that line shape under `.cautilus/claims/`; adding the same line-scoped allowlist for `charness-artifacts/**.json` makes the scan pass without weakening scanning anywhere else.

## Verification

Added a second `[[allowlists]]` entry (`paths = ^charness-artifacts/.*\.json$`, same `"gitCommit": "[0-9a-f]{40}"` line regex, `condition = "AND"`) → `npm run security:secrets` reports `no leaks found` over the same 1135 commits.

## Root Cause

Checked-in claim packets gained a second home (`charness-artifacts/eval-trust/` calibration-sample evidence) while the gitCommit-metadata exemption stayed scoped to the original `.cautilus/claims/` path; the secret gate correctly flags unknown 40-hex tokens, so the new packet location needed the same narrowly scoped metadata allowlist.

## Invariant Proof

- Invariant: n/a - not a workflow-boundary propagation bug
- Producer Proof: n/a
- Final-Consumer Proof: n/a
- Interface-Shape Sibling Scan: n/a
- Non-Claims: n/a

## Detection Gap

- commit-time gate | commit `2abde089` landed the packet artifacts without a full `npm run verify`, so the finding surfaced one slice later | run `npm run security:secrets` (or full verify) before committing checked-in claim packet artifacts; the pre-push hook already protects publication, so no new standing gate is needed

## Sibling Search

- Mental model: "claim packets live only under `.cautilus/claims/`", while evidence workflows now intentionally check packets into `charness-artifacts/`.
- path axis: `git grep` for 40-hex `gitCommit` lines in tracked JSON outside `.cautilus/claims/` found only the three sample files | decision: fixed in slice | proof: executed grep at HEAD
- future axis: slice 4 measurement will check in more packets under `charness-artifacts/eval-trust/` | decision: covered by the class-level path regex in the new allowlist entry | proof: config covers `^charness-artifacts/.*\.json$`
- cross-file: the existing `.cautilus/claims` allowlist entry in `.gitleaks.toml` is the sibling configuration the fix mirrors line-for-line
- evidence-prose axis (found one slice later, same session): this debug record itself quoted the flagged `"gitCommit": "<40-hex>"` line verbatim, and the quote entered git history before the next verify, so the same rule fired on `charness-artifacts/debug/latest.md` | decision: third allowlist entry scoped to `charness-artifacts/debug/*.md` with the same line regex (history blobs cannot be edited away) | proof: `npm run security:secrets` clean after the entry

## Seam Risk

- Interrupt ID: none
- Risk Class: none
- Seam: none
- Disproving Observation: none
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

The class-scoped allowlist covers future checked-in packet artifacts under `charness-artifacts/`; before committing new checked-in claim packet evidence, run `npm run security:secrets` so metadata-shaped findings surface in the same slice that creates them.

## Related Prior Incidents

- `debug-2026-05-17-ci-claim-packet-dangling-commit.md` — the previous incident where claim packet `gitCommit` metadata interacted badly with a repo gate (evidence-state on fresh checkout).
