# Claim Discovery

`Cautilus claim` turns repo documentation into a reviewable map of behavior promises and proof gaps.

## User Promise

Cautilus helps a repo find the behavior promises it already declares, then gives an agent or maintainer a concrete next-work map.

## Subclaims

- The binary performs the initial scan from configured entry documents and linked Markdown.
- The scan respects the repo's ignore rules and records the effective discovery boundary.
- The output records what was scanned, which claims were found, and whether the saved packet still matches the checkout.
- The bundled skill can use the claim packet to group next work:
  review wording, add deterministic proof, plan Cautilus evals, align docs and adapters, or defer broad claims.
- If an important user-facing feature is not declared in the entry docs or linked Markdown, Cautilus treats that as a product-story gap unless another reviewed artifact proves an in-scope miss.

## Evidence

The current executable proof only checks that the claim-discovery command family and status packet surface are available.
Deeper proof should be added by linking a fresh claim packet, a reviewed status summary, and at least one skill-driven review result.

> check:cautilus-command
| args_json | stdout_includes |
| --- | --- |
| ["claim","discover","--help"] | cautilus claim discover |
| ["claim","show","--input",".cautilus/claims/evidenced-typed-runners.json","--sample-claims","1"] | cautilus.claim_status_summary.v1 |
