# Debug: first-scan scope confirmation gap

## Trigger

`npm run dogfood:cautilus-first-scan-flow:eval:codex` failed after the first-scan audit was tightened to require pre-discovery entries/depth and scope confirmation.

## Observation

The agent did state the configured entries and linked Markdown depth before `claim discover`, but it framed continuation as "reply with `1`" rather than explicitly asking the coordinator to confirm or adjust the scan scope.
It also did not state before discovery that LLM claim review is a separate branch with its own review budget.

## Root Cause

The bundled skill said to ask for confirmation, but the wording was too easy for the agent to compress into generic branch selection language.
The audit now protects the stronger product claim, so the skill instruction must use explicit confirmation wording.

## Fix Direction

The no-input orientation instruction now tells the agent to use the phrase "confirm this scan scope or adjust it" and to state the separate LLM review budget boundary before discovery.

## Regression Check

Rerun the first-scan dogfood after the skill change.
The old failing transcript should remain useful as proof that branch selection alone is not sufficient evidence for scope confirmation.
