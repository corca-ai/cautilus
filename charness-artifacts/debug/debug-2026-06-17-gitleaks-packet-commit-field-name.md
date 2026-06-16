# Debug Review
Date: 2026-06-17

## Problem

`npm run verify` fails at the `security · secret scan` gate with `leaks found: 2` (gitleaks), surfaced during the item-3 README/docs user-value rewrite closeout.

## Correct Behavior

Given checked-in Cautilus packets record their source commit as a 40-hex git SHA under commit-metadata fields, when verify runs the secret scan, then those metadata lines are allowlisted regardless of the exact field name and only real secret-shaped content fails the gate.

## Observed Facts

- Exact failure: `✖ security · secret scan failed (exit 1)` after `WRN leaks found: 2`.
- Both findings are rule `sourcegraph-access-token`, entropy 3.756, on line 5 of `charness-artifacts/eval-trust/goldset-v2-agent-extraction/gold-set-proposal.json` (commit `3027ba47`, 2026-06-10) and `gold-set-proposal.developer.json` (commit `1ecdf32`, 2026-06-16).
- Line 5 of both is `"packetGitCommit": "0205b0d67d1aee7a30a86104241d37ee70f1195c"` — this repo's own 40-hex packet source commit, not a credential.
- The README/docs slice under closeout touched only Markdown and regenerated claim JSON; it introduced neither file. Scanning commit `1ecdf32` alone (an ancestor of working HEAD `d20e043`) reproduces the leak, so the finding is pre-existing committed history, independent of the slice.
- `.gitleaks.toml` already carried a path + line allowlist for packet commit metadata, but its line regex was the literal field name `"gitCommit"`, which does not match the gold-set v2 field name `"packetGitCommit"` (camelCase, capital G, different prefix).
- Tracked-file enumeration of `*[Gg]it[Cc]ommit` fields holding 40-hex values: `gitCommit` (46, allowlisted), `packetGitCommit` (6), `currentGitCommit` (2), `claimsPacketGitCommit` (1). Three of the four field-name variants were never covered by the allowlist regex.

## Reproduction

`npm run security:secrets` at working HEAD reproduces `leaks found: 2`; `gitleaks detect --report-format json` lists exactly the two `packetGitCommit` lines above. `gitleaks detect --log-opts="-1 1ecdf32"` reproduces the leak on the committed ancestor in isolation.

## Candidate Causes

- A real Sourcegraph access token was committed — falsified: the matched value is this repo's own packet source commit SHA, present in `git log`, on a `packetGitCommit` metadata field.
- gitleaks version/rule drift newly matching 40-hex tokens — not the trigger: the `sourcegraph-access-token` rule's bare `[a-fA-F0-9]{40}` branch has always matched these SHAs; the identical `gitCommit` shape has required an allowlist since 2026-06-11.
- The packet commit-metadata allowlist matched only the exact field name `gitCommit` while the gold-set v2 schema introduced a new field name `packetGitCommit` (and siblings `currentGitCommit`, `claimsPacketGitCommit`) — confirmed.

## Hypothesis

The `sourcegraph-access-token` rule matches the bare 40-hex SHA on `packetGitCommit` lines, and the existing allowlist line regex only exempts the literal `"gitCommit"` field; generalizing the line regex to any field whose name ends in `git`/`Git` + `commit`/`Commit` (`"[A-Za-z]*[Gg]it[Cc]ommit"`) under the same scoped paths makes the scan pass without weakening scanning anywhere else, and closes the field-name axis so a future `*GitCommit` packet field does not reopen the class.

## Verification

Generalized the line regex in all three `.gitleaks.toml` allowlist entries from `"gitCommit"\s*:\s*"[0-9a-f]{40}"` to `"[A-Za-z]*[Gg]it[Cc]ommit"\s*:\s*"[0-9a-f]{40}"` (paths and `condition = "AND"` unchanged). Confirmed the generalized regex matches all four tracked field-name variants. `npm run security:secrets` → `no leaks found` over the same 1153 commits.

## Root Cause

This is a recurrence of the 2026-06-11 packet-commit allowlist incident on the same seam. That fix generalized the allowlist *path* (`^charness-artifacts/.*\.json$`) but hard-coded the *field name* (`gitCommit`) on the assumption that all packet commit metadata uses that one key. The gold-set v2 schema (and the evidence-state/status packets) instead store the source commit under `packetGitCommit` / `currentGitCommit` / `claimsPacketGitCommit`, so the secret gate correctly flagged the unknown 40-hex tokens that the field-name-narrow allowlist never exempted. The structural root is the field-name assumption, not the path scope.

## Invariant Proof

- Invariant: n/a - not a workflow-boundary propagation bug
- Producer Proof: n/a
- Final-Consumer Proof: n/a
- Interface-Shape Sibling Scan: n/a
- Non-Claims: n/a

## Detection Gap

- commit-time gate | the gold-set files (commits `3027ba47` 2026-06-10, `1ecdf32` 2026-06-16) landed without a full `npm run verify`, so the field-name mismatch surfaced sessions later at the next verify | run `npm run security:secrets` (or full verify) before committing a packet artifact that introduces a new schema/field, and `follow-up: gitleaks-allowlist-coverage-test` — a deterministic test asserting every tracked `*[Gg]it[Cc]ommit` 40-hex packet field has a covering allowlist entry would fire the instant a new uncovered field name is added, instead of relying on a scan-time discovery.

## Sibling Search

- Mental model (wrong): "packet commit metadata always uses the field name `gitCommit`", while packet schemas have since added `packetGitCommit`, `currentGitCommit`, and `claimsPacketGitCommit`.
- field-name axis: `git grep -hoE '"[A-Za-z]*[Gg]it[Cc]ommit"...'` enumerated all four variants | decision: fixed in slice by generalizing the line regex to cover the whole `*[Gg]it[Cc]ommit` family | proof: executed grep + `security:secrets` clean.
- path axis: the three allowlisted paths (`^\.cautilus/claims/.*\.json$`, `^charness-artifacts/.*\.json$`, `^charness-artifacts/debug/.*\.md$`) still cover every current carrier | decision: unchanged | proof: post-fix scan clean over 1153 commits.
- evidence-prose axis: this debug record quotes the flagged `"packetGitCommit": "<40-hex>"` line verbatim, so the same rule would fire on `charness-artifacts/debug/latest.md` once committed | decision: covered — the debug-record allowlist entry (entry 3) was generalized the same way | proof: post-fix scan clean with the quote present in the working tree.
- field-name-beyond-gitcommit axis (follow-up): a future packet could store a commit SHA under a field NOT ending in `gitCommit` (e.g. `sourceCommit`, `revision`, `sha`); that would reopen the class under a new name | decision: not fixed in slice (no such field exists today) | proof: enumeration found only `*[Gg]it[Cc]ommit` variants | `follow-up: gitleaks-allowlist-coverage-test` (the same deterministic test would catch it).
- cross-file: the prior `.gitleaks.toml` entries and `debug-2026-06-11-gitleaks-packet-commit-allowlist.md` are the sibling configuration/record this fix generalizes.

## Seam Risk

- Interrupt ID: gitleaks-packet-commit-2026-06-17
- Risk Class: repeated-symptom
- Seam: gitleaks default `sourcegraph-access-token` rule vs. Cautilus packet 40-hex commit-metadata fields; same seam as 2026-06-11, whose fix generalized the allowlist path but hard-coded the field name and so did not prevent this field-name recurrence.
- Disproving Observation: a packet adds a commit-SHA field whose name does not end in `gitCommit`/`GitCommit`, or a packet lands under a path outside the three allowlisted globs.
- What Local Reasoning Cannot Prove: that no future schema introduces a differently named commit field; the field-name generalization closes the observed axis but not arbitrary field names.
- Generalization Pressure: factor-now

## Interrupt Decision

- Critique Required: yes
- Next Step: spec
- Handoff Artifact: charness-artifacts/spec/2026-06-17-gitleaks-packet-commit-allowlist-coverage.md

## Prevention

The field-name-generalized allowlist covers all current commit-metadata field variants and any future `*GitCommit` field under the scoped packet paths, so the class does not reopen on the next new field-name prefix. The durable prevention is `follow-up: gitleaks-allowlist-coverage-test`: a deterministic test that, for every tracked 40-hex `*[Gg]it[Cc]ommit` packet field, asserts a covering `.gitleaks.toml` allowlist entry — this fires in the same slice that introduces an uncovered field instead of at a later scan. Until then, run `npm run security:secrets` before committing a packet artifact that introduces a new schema or field.

## Related Prior Incidents

- `debug-2026-06-11-gitleaks-packet-commit-allowlist.md` — same seam: the `gitCommit` packet metadata tripped the gate and got a path-generalized but field-name-literal allowlist; this incident is the field-name-axis recurrence and generalizes that fix.
- `debug-2026-05-17-ci-claim-packet-dangling-commit.md` — earlier incident where claim packet `gitCommit` metadata interacted badly with a repo gate.
