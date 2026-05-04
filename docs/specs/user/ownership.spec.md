# Product And Host Ownership

Cautilus owns the common evaluation workflow; the host repo owns the behavior being evaluated.

## User Promise

Cautilus standardizes claim, eval, optimize, readiness, and evidence packets without secretly taking over a repo's app, prompts, runners, credentials, or policy.

## Subclaims

- Host repos own prompts, model choices, credentials, runtime wiring, and acceptance policy.
- Cautilus-owned packets make the workflow reviewable across repos.
- Adapter-owned commands keep host behavior explicit instead of hiding it inside product logic.
- The same product workflow can be reused across repos because repo-specific behavior lives in adapters and fixtures.

## Evidence Gaps

- Adapter contract test that proves Cautilus invokes host-owned runners without importing host-specific logic into product code paths. Owner: maintainer. Next action: link the existing adapter contract test or author one against a checked-in fixture adapter.
- Consumer-repo proof that the same product workflow runs unchanged across two adapters. Owner: maintainer. Next action: link the `npm run consumer:onboard:smoke` end-to-end evidence packet for the canonical bootstrap path.
- Per-subclaim binding of each existing host-owned-command path (prompts, model choice, credentials, runtime launch) to a deterministic adapter test. Owner: maintainer. Next action: enumerate the host-owned fields under [docs/contracts/adapter-contract.md](../../contracts/adapter-contract.md) and attach one test per field.
