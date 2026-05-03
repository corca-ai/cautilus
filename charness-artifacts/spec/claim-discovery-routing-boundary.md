# Claim Discovery Routing Boundary Spec Handoff

Date: 2026-05-04

## Context

The dev/skill claim-discovery routing fixture must prove more than command selection.
For direct repo-proof questions, it must prove that the Cautilus skill enters the declared claim discovery workflow while preserving the first-scan user confirmation boundary.

## Contract

- A direct question such as "does this repo prove what it claims?" routes into the declared claim discovery workflow.
- When no saved claim packet exists, the first turn states the scan entries and linked Markdown depth before discovery.
- The agent asks the user to confirm or adjust the scan scope and waits for a later user turn before `claim discover`.
- The first discovery branch runs `claim discover` after confirmation and then `claim show --sample-claims`.
- The first discovery branch does not launch LLM claim review, apply review results, plan evals, edit product files, or commit.
- The fixture prompt must not encode first discovery as immediate authorization; it should ask for workflow identification, scope statement, and wait-for-confirmation behavior.

## Checks

- `./bin/cautilus eval test --repo-root . --adapter-name self-dogfood-claim-discovery-routing-flow --runtime codex --output-dir ./artifacts/self-dogfood/cautilus-claim-discovery-routing-flow-eval-codex/latest`
- `jq '.status,.findings' artifacts/self-dogfood/cautilus-claim-discovery-routing-flow-eval-codex/latest/claim-discovery-routing-flow/episode-cautilus-claim-discovery-routing-flow/audit.json`
