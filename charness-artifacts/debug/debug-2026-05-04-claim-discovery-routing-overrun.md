# Claim Discovery Routing Overrun Debug
Date: 2026-05-04

## Problem

The new `cautilus-claim-discovery-routing-flow` dev/skill dogfood exited 0 but produced an audit reject.
The audit reported `missing_pre_discover_scope_confirmation` and `missing_review_budget_boundary`.

## Correct Behavior

Given a user asks whether a repo proves what it claims, when no saved claim state exists, then the Cautilus skill should route to declared claim discovery by first reading `agent status`, stating the scan entries and linked Markdown depth, asking the user to confirm or adjust that scan scope, and waiting for that confirmation before `claim discover`.
After deterministic discovery, the skill should still keep LLM claim review as a separate branch with its own review budget.

## Observed Facts

The transcript did route the repo-proof question into `agent status`, `claim discover`, and `claim show`.
The first turn prompt said to "stop after the first deterministic claim discovery status."
The agent treated that as authorization to run the first discovery immediately after reading `agent status`.
The second fixture turn confirmed the scan scope, but it arrived after the first discovery had already happened.
The transcript did not mention the separate LLM review budget boundary before or after the first discovery.

## Reproduction

Run:

```bash
./bin/cautilus eval test --repo-root . --adapter-name self-dogfood-claim-discovery-routing-flow --runtime codex --output-dir ./artifacts/self-dogfood/cautilus-claim-discovery-routing-flow-eval-codex/latest
```

Inspect:

```bash
jq '.status,.findings' artifacts/self-dogfood/cautilus-claim-discovery-routing-flow-eval-codex/latest/claim-discovery-routing-flow/episode-cautilus-claim-discovery-routing-flow/audit.json
```

## Candidate Causes

- The fixture prompt over-authorized execution by saying to stop after first discovery instead of asking the agent to expose the scan boundary and wait.
- The skill states the missing-claim-state rule under no-input orientation, but the direct repo-proof path can still be compressed into immediate execution.
- The audit is correctly stricter than route detection; command presence alone does not prove the product's scan-scope decision boundary.

## Hypothesis

If the routing fixture asks the agent to identify the workflow, state the scan scope, and wait for user confirmation before first discovery, then the same first-scan audit should prove both routing and boundary preservation.
If that still fails, the skill wording needs a stronger direct-question rule under declared claim discovery.

## Verification

After strengthening the direct-question skill guard and splitting the three trigger classes into fresh single-case fixtures, all three Codex dev/skill eval commands completed with `recommendation=accept-now`.
The audits for repo-proof, docs-behavior-alignment, and scenario-needed prompts passed with no findings.

## Root Cause

The original fixture prompt was proving a weaker behavior than the product claim.
It asked whether the repo proves its claims, but also told the agent to stop after the first deterministic discovery status, which functioned as implicit authorization to run discovery immediately.
The source claim named three trigger classes, so a single repo-proof transcript would have overclaimed satisfaction for docs-behavior-alignment and scenario-needed prompts.
The fix made the direct-question guard explicit in the skill and verified each trigger class in an isolated fresh-claim-state fixture.

## Seam Risk

- Interrupt ID: claim-discovery-routing-overrun
- Risk Class: host-disproves-local
- Seam: dev/skill prompt-to-agent execution boundary
- Disproving Observation: A direct repo-proof request can pass through the right commands while skipping the product's pre-discovery user confirmation boundary.
- What Local Reasoning Cannot Prove: Static skill text alone cannot prove that a hosted coding agent preserves confirmation boundaries under direct execution pressure.
- Generalization Pressure: factor-now

## Interrupt Decision

- Premortem Required: yes
- Next Step: spec
- Handoff Artifact: charness-artifacts/spec/claim-discovery-routing-boundary.md

## Prevention

Keep route fixtures from encoding the expected command as immediate authorization when the product behavior being proven is a decision boundary.
Use the first-scan audit for direct repo-proof prompts too, so route proof and boundary proof stay tied together.

## Related Prior Incidents

- `debug-2026-05-04-first-scan-scope-confirmation-gap.md`: established that first scan must prove explicit pre-discovery scan-scope confirmation, not just branch selection.
- `debug-2026-04-27-first-scan-review-budget-boundary.md`: established that first scan summaries must keep LLM review as a separate budgeted branch.
