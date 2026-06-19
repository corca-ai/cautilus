# Debug Review: external chat fixture key tripped gitleaks in local history
Date: 2026-06-19

## Problem

`npm run verify` failed at `security:secrets` with `leaks found: 2` while closing the external chat anonymization slice.

## Correct Behavior

Given the Cautilus public repo carries anonymized replay fixtures, when `npm run security:secrets` scans the checkout and git history before push, then private source names and secret-shaped fixture identifiers should not appear in current files or in unpublished local commits.

## Observed Facts

- Exact failure: `gitleaks detect --source . --no-banner --redact` exited non-zero with `leaks found: 2`.
- The report listed `generic-api-key` findings in `fixtures/eval/app/chat/pre-anonymized-replay/pre-anonymized-app-replay-normalization-inputs.json` and `fixtures/eval/app/chat/pre-anonymized-replay/pre-anonymized-app-replay-scenarios.json`.
- Current working files had already been renamed to `fixtures/eval/app/chat/external-chat-replay/`, so the finding came from the local unpublished commit history, not from the current tree path.
- The matched lines were `threadKey` fixture identifiers shaped like `product-shaped thread-key prefix`; they are not credentials, but the wording looked like a production private chat product key and matched the generic API key detector.
- The task's product boundary requires official Cautilus surfaces to omit the private source repo identity, so preserving the old commit path in public git history would violate the anonymization intent even if it was not a live secret.

## Reproduction

`npm run security:secrets` reproduced the failure after the source anonymization commit and claims-refresh commit were created.
`gitleaks detect --source . --no-banner --redact --report-format json --report-path /tmp/cautilus-gitleaks.json` showed exactly two findings, both under the old `pre-anonymized-replay` fixture path in local history.

## Candidate Causes

- A real credential was committed: falsified; the matching values were fixture `threadKey` labels, not access tokens.
- The current tree still contained private-source fixture keys: partially true before repair for `product-shaped thread-key prefix`, but the gitleaks report path proved the blocking findings were in history under the pre-rename `pre-anonymized-replay` path.
- The last local unpublished commits preserved a transient state that still exposed the private repo name and secret-shaped fixture identifiers: confirmed.

## Hypothesis

If the secret scan fails because the unpublished local commits contain the pre-anonymized fixture path plus `product-shaped thread-key prefix` thread keys, then rewriting the local ahead commits after changing the thread keys to neutral fixture-local identifiers should make `npm run security:secrets` pass without adding a new allowlist.

## Verification

The repair changed the replay fixture `threadKey` values from `product-shaped thread-key prefix` to `external-chat-thread-*`, removed the temporary thread-key allowlist from `.gitleaks.toml`, and rewrote the local unpublished commits before push.
Verification so far: `npm run security:secrets` reports no leaks after pruning stale worktree metadata; focused app-chat, Go, and adapter-resolution tests pass. Full `npm run verify` and `npm run hooks:check` remain the final pre-push gates.

## Root Cause

The first anonymization commit removed current public docs references, but it briefly used `product-shaped thread-key prefix` fixture identifiers and preserved the old `pre-anonymized-replay` path in the commit diff history.
Because gitleaks scans git history by default, the unpublished intermediate state was still part of the scanned source even after the current working tree looked anonymized.

## Invariant Proof

- Invariant: public Cautilus history should not publish private consumer repo identity or secret-shaped replay fixture identifiers.
- Producer Proof: gitleaks report identified the old path and thread-key line shape in local history.
- Final-Consumer Proof: `npm run security:secrets` reports no leaks after stale worktree metadata was pruned; full `npm run verify` remains the final publication gate.
- Interface-Shape Sibling Scan: current replay fixtures use neutral `external-chat-thread-*` identifiers while product provenance remains generic `Private external chat product`.
- Non-Claims: this does not prove live private product replay behavior; it only proves the checked-in Cautilus fixture surface and history are publishable.

## Detection Gap

- pre-commit source hygiene | the source anonymization commit was created before running `npm run security:secrets`, so the history-shaped finding surfaced one commit later | run `npm run security:secrets` before committing anonymization work that touches private-source fixtures or fixture identifiers.

## Sibling Search

- Mental model: "renaming the current path is enough"; wrong because the pre-push secret gate scans git history, not only the working tree.
- fixture-key axis: current app chat replay thread keys now use `external-chat-thread-*` | decision: fixed in slice | proof: targeted `rg` plus post-rewrite secret scan.
- allowlist axis: a path-scoped fixture allowlist would silence the symptom but preserve the misleading identifiers | decision: removed, no allowlist | proof: `.gitleaks.toml` no longer contains the thread-key allowlist.
- cross-file: the current app-chat replay proof tests read only `threadKey` as opaque scenario evidence, so the value rename should not affect behavior; proof is the replay proof test run in the source slice and the follow-up full verify.

## Seam Risk

- Interrupt ID: external-chat-fixture-gitleaks-history-2026-06-19
- Risk Class: none
- Seam: local unpublished git history vs. public repo publication gate.
- Disproving Observation: `gitleaks` still reports the old `pre-anonymized-replay` path after the two commits are rewritten.
- What Local Reasoning Cannot Prove: whether the private source repo itself has enough live proof; that is intentionally deferred to the private repo.
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

For future anonymization slices, run the secret scan before committing and prefer neutral fixture-local identifiers from the first draft.
When a private-source name enters an unpublished commit, rewrite that local commit before push instead of adding an allowlist that preserves the private identifier in public history.

## Related Prior Incidents

- `debug-2026-06-17-gitleaks-packet-commit-field-name.md` — same `gitleaks` gate, but a different root cause: packet commit metadata false positives fixed by scoped allowlist generalization.
- `debug-2026-06-11-gitleaks-packet-commit-allowlist.md` — earlier `gitleaks` false-positive seam for checked-in packet metadata; this incident deliberately avoids adding an allowlist because the fixture identifiers should be renamed instead.
