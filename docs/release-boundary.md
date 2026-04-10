# Release Boundary

This note fixes what counts as the standalone `Cautilus` product surface before
wider consumer rollout.

## Product-Owned Surface

These are part of the reusable release boundary:

- [bin/cautilus](/home/ubuntu/cautilus/bin/cautilus)
- [skills/cautilus/](/home/ubuntu/cautilus/skills/cautilus)
- [scripts/resolve_adapter.py](/home/ubuntu/cautilus/scripts/resolve_adapter.py)
- [scripts/init_adapter.py](/home/ubuntu/cautilus/scripts/init_adapter.py)
- [scripts/doctor.py](/home/ubuntu/cautilus/scripts/doctor.py)
- [scripts/agent-runtime/](/home/ubuntu/cautilus/scripts/agent-runtime)
- [docs/contracts/](/home/ubuntu/cautilus/docs/contracts)
- [fixtures/workbench/review-verdict.schema.json](/home/ubuntu/cautilus/fixtures/workbench/review-verdict.schema.json)
- checked-in product example fixtures under
  [fixtures/scenario-proposals/](/home/ubuntu/cautilus/fixtures/scenario-proposals),
  [fixtures/reports/](/home/ubuntu/cautilus/fixtures/reports), and
  [fixtures/cli-evaluation/](/home/ubuntu/cautilus/fixtures/cli-evaluation)

## Consumer-Owned Surface

These stay in the host repo:

- `cautilus-adapter.yaml` instances and named adapters
- prompts, schemas, wrappers, compare artifacts, and policy text referenced by
  the adapter
- runtime-log readers, storage integrations, audit UI, and operator dashboards
- repo-specific workflow briefs and fixture packs

## Current Install Story

The current honest install story is:

1. check out `Cautilus`
2. run `npm install`
3. call `node ./bin/cautilus ...` directly or use the bundled skill
4. keep adapters and repo-local assets in the consumer repo

This repo is not yet claiming npm publication, Homebrew packaging, or a
cross-repo skill installer contract.

## Versioning Discipline

Before wider reuse, keep these compatibility rules:

- breaking contract changes must update checked-in docs and fixtures in the
  same change
- CLI help, bundled skill instructions, and executable specs should describe
  the same commands
- new runtime surfaces should land with at least one executable test
- if a consumer migration depends on a new product surface, update
  [docs/handoff.md](/home/ubuntu/cautilus/docs/handoff.md) and
  [docs/master-plan.md](/home/ubuntu/cautilus/docs/master-plan.md) in the same
  work unit
