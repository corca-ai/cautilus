# JQ Claim Summary Shape Debug
Date: 2026-05-16

## Problem

While continuing the claim proof backlog, ad hoc `jq` commands failed because I assumed claim arrays lived at paths that are not present in the current packets.

## Correct Behavior

Given a generated claim packet, when summarizing a specific claim for evidence authoring, then the command should inspect the packet keys first and use the schema's actual claim collection path.
The command should not imply that Cautilus failed to generate claim state when only the operator-authored summary expression is wrong.

## Observed Facts

- A command over `.cautilus/claims/status-summary.json` failed with `jq: error (at .cautilus/claims/status-summary.json:1563): Cannot iterate over null (null)`.
- A follow-up command over `.cautilus/claims/status-summary.json` failed with `jq: error (at .cautilus/claims/status-summary.json:1563): Cannot index string with string "claimId"`.
- A command over `.cautilus/claims/evidenced-typed-runners.json` failed with `jq: error (at .cautilus/claims/evidenced-typed-runners.json:14071): Cannot index object with number`.
- `jq 'keys' .cautilus/claims/status-summary.json` showed report summary keys, not a top-level `.claims` array.
- `jq 'keys' .cautilus/claims/evidenced-typed-runners.json` showed `claimCandidates` as the claim collection path.
- `jq '.. | objects | select(.claimId? == "claim-docs-guides-cli-md-122")' .cautilus/claims/evidenced-typed-runners.json` located the target claim without changing repo files.

## Reproduction

```bash
jq -r '.claims[] | select(.id == "claim-docs-guides-cli-md-122")' .cautilus/claims/status-summary.json
jq '.claimState[]? | select(.claimId == "claim-docs-guides-cli-md-122")' .cautilus/claims/status-summary.json
jq '.candidateClaims[0] // .claims[0] // .entries[0] // .[0] // null' .cautilus/claims/evidenced-typed-runners.json
```

## Candidate Causes

- I reused an older claim packet mental model where claim entries were available through a top-level `.claims` array.
- I treated `status-summary.json` as an evidence runner packet instead of a compact status report.
- The generated claim packets could have been malformed or missing the target claim.

## Hypothesis

If this is an operator jq shape error, then inspecting packet keys and searching object nodes by `claimId` should locate the target claim without requiring product code changes or artifact refresh.

## Verification

```bash
jq 'keys' .cautilus/claims/status-summary.json
jq 'keys' .cautilus/claims/evidenced-typed-runners.json
jq '.. | objects | select(.claimId? == "claim-docs-guides-cli-md-122")' .cautilus/claims/evidenced-typed-runners.json
```

The corrected object search located `claim-docs-guides-cli-md-122` in `.cautilus/claims/evidenced-typed-runners.json`.
The status summary and evidenced runner packets are readable; the failures were confined to incorrect summary expressions.

## Root Cause

The summary commands assumed nonexistent or wrong claim paths.
`status-summary.json` is a report surface without a top-level `.claims` array, and `evidenced-typed-runners.json` stores claim entries under `claimCandidates`.

## Detection Gap

- operator-authored jq summary | no schema/key inspection happened before selecting a nested claim path | inspect `keys` and `schemaVersion` before writing one-off packet queries.

## Sibling Search

- Mental model: all claim packets expose the same top-level claim array.
- Status report axis: use `.cautilus/claims/claim-status-report.md` or recursive object search for quick lookup, not guessed `status-summary.json` paths.
- Evidence packet axis: prefer `claimCandidates` in `.cautilus/claims/evidenced-typed-runners.json` after checking packet keys.
- Workflow axis: keep operator jq failures out of proof bundles unless a corrected command has verified the packet content.

## Seam Risk

- Interrupt ID: jq-claim-summary-shape
- Risk Class: none
- Seam: local operator jq summaries around generated claim packets
- Disproving Observation: corrected key inspection and recursive object search found the target claim in generated artifacts.
- What Local Reasoning Cannot Prove: whether future ad hoc summaries will choose the correct packet-specific field without checking keys.
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Inspect `schemaVersion` and `keys` before composing ad hoc jq over generated Cautilus packets.
For current claim proof lookup, use `claimCandidates` in `.cautilus/claims/evidenced-typed-runners.json` or recursive object search by `claimId`.

## Related Prior Incidents

- `debug-2026-05-03-jq-summary-input-misuse.md`: prior operator-authored jq failure where generated packets were valid but the summary expression used the wrong jq input model.
- `debug-2026-05-04-review-input-jq-shape-misread.md`: prior packet-shape misread where a review input packet used `candidates`, not `claims`.
