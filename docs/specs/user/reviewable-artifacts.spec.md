# Reviewable Artifacts

Cautilus writes machine-readable packets first and readable views over those packets.

## User Promise

Cautilus leaves evidence that another person or agent can reopen instead of relying on terminal scrollback or memory.

## Subclaims

- JSON packets remain the audit source of truth.
- Markdown and HTML views should explain the same state without becoming a separate truth source.
- Report views should make stale, blocked, or missing evidence visible.
- Human-friendly views support claim, eval, optimize, and doctor workflows; they do not prove behavior by themselves.

## Evidence Gaps

- Report renderer tests proving Markdown and HTML views project the same packet without becoming an independent truth source. Owner: maintainer. Next action: link existing report rendering tests under `scripts/agent-runtime/` or author a renderer-projection test.
- Packet freshness check proving stale packets surface stale state in the rendered view rather than masking it. Owner: maintainer. Next action: link the existing freshness logic in `claim show` / `agent status` or extend it with a renderer-side test.
- Per-subclaim binding from each rendered view (claim status report, eval summary, doctor report, optimize report) back to its source packet schema. Owner: maintainer. Next action: enumerate the rendered views and attach one render-from-packet test per view.
