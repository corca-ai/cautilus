# Reviewable Artifacts

Cautilus writes machine-readable packets first and readable views over those packets.

## User Promise

Cautilus leaves evidence that another person or agent can reopen instead of relying on terminal scrollback or memory.

## Subclaims

- JSON packets remain the audit source of truth.
- Markdown and HTML views should explain the same state without becoming a separate truth source.
- Report views should make stale, blocked, or missing evidence visible.
- Human-friendly views support claim, eval, optimize, and doctor workflows; they do not prove behavior by themselves.

## Evidence

- [scripts/agent-runtime/reviewable-artifact-projections.test.mjs](../../../scripts/agent-runtime/reviewable-artifact-projections.test.mjs) enumerates the shipped readable views (report, review, eval summary, claim status) and asserts each projects from a source packet without becoming an independent truth surface.
- [scripts/agent-runtime/render-claim-status-report.test.mjs](../../../scripts/agent-runtime/render-claim-status-report.test.mjs) covers the renderer's stale-state pass-through, including the case where a refresh plan points at an older base packet and the rendered view surfaces that as historical rather than masking it.
