# App Chat Natural Unsound Breadth Critique
Date: 2026-06-19

## Execution

Subagent critique completed for the app/chat natural-unsound harvest and artifact-fidelity breadth slice.

## Fresh-Eye Satisfaction

parent-delegated

## Packet Consumed

`charness-artifacts/critique/2026-06-19-072248-packet.md`

## Target

`code-critique`

## Change

Review of the `artifact_fidelity` behavior-intent catalog addition, private external chat product replay fixture expansion, blind Sonnet verdict replay, app/chat proof tests, apex/user spec sync, handoff refresh, gitleaks fixture allowlist, and claim refresh commits.

## Angles

- Proof honesty and spec/truth-surface synchronization
- Runtime catalog, fixture, and deterministic gate risk
- Counterweight triage for remaining concerns

## Findings

- The handoff overclaimed “40 real users” relative to this slice's fixture evidence; fixed by narrowing it to real private external chat product production DM thread behavior.
- The evidence artifact said the app-chat replay proof had 9 checks while the test has 10 subtests; fixed.
- The artifact-fidelity test did not bind `postHocEvidence`, the final public URL, and the verdict `observedResponse` tightly enough to the capture; fixed with exact assertions.
- The natural-unsound rerun verdict did not explicitly pin the artifact case id; fixed.
- `npm run verify` initially failed because this clone lacked `golangci-lint`, `govulncheck`, and `c8`; installed the repo-pinned/locked tools and reran verify.
- `gitleaks` flagged historical private external chat product replay `threadKey` fixture strings as `generic-api-key`; fixed with a narrow path+line allowlist in `.gitleaks.toml`.

## Counterweight Triage

### Act Before Ship

- strong: `npm run verify` must pass before closeout. Resolved after installing `golangci-lint@v2.1.6`, `govulncheck@v1.1.4`, completing `npm install` for locked Node deps, and adding the narrow gitleaks fixture allowlist.

### Bundle Anyway

- strong: tighten artifact proof assertions and stale evidence check count. Done.
- strong: lower handoff wording to what this slice directly proves. Done.

### Over-Worry

- moderate: do not generalize `assertNaturalUnsoundVerdict` for partial-unsound cases in this slice; this proof intentionally asserts the captured artifact case is all-false.

### Valid but Defer

- moderate: add a Go/JS/docs behavior-intent catalog parity gate or machine-readable SOT in a separate catalog-health slice.
- moderate: promote artifact-fidelity from owner-confirmed direct scenario to `NormalizeChatbotProposalCandidates` only when the normalizer expansion is intentionally scoped.

## Deliberately Not Doing

This slice does not add a catalog parity gate, normalize artifact-fidelity automatically, close app/chat liveness, or harvest natural unsound dev/repo and dev/skill cases.

## Next Move

Commit the critique fixes and result artifact, keep the two proof commits intact, and continue next session with either remaining private external chat product breadth, app/chat liveness, or app/prompt proof debt.
