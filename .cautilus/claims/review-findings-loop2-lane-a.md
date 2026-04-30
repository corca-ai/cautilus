# Loop 2 Claim Review Lane A

Reviewed clusters 0-2 from `.cautilus/claims/review-input-loop2.json`.
No product code was changed.
No review result was applied, no evals were planned, and no commit was made.

## Findings

- Cluster 0 looked substantially improved from the earlier loop.
  The README install, adapter ownership, and fixture-runtime claims are real user-facing claims and are correctly routed to `recommendedProof=deterministic`.
- `claim-readme-md-3` is still misrouted to `recommendedEvalSurface=app/prompt`.
  The text mentions changing prompts, but the promise is about Cautilus keeping agent and workflow behavior honest, so `dev/skill` is the more honest eval surface.
- Cluster 2 still overproduces `cautilus-eval` work for broad product narrative or packet-contract statements.
  `claim-readme-md-153` is usage guidance and should be human-auditable unless a concrete stalled-state scenario is promoted.
  `claim-readme-md-231` and `claim-readme-md-9` should be deterministic packet/schema/output claims, not eval fixtures.
- I did not see example or prompt lines in clusters 0-2.
  The previous false-positive pattern around quoted prompt examples does not appear in this slice.

## Evidence Policy

All reviewed claims keep `evidenceStatus=unknown`.
The review input contained source excerpts but no verified evidence refs.
