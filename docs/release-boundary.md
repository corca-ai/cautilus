# Release Boundary

This note fixes what counts as the standalone `Cautilus` product surface before
wider consumer rollout.

## Product-Owned Surface

These are part of the reusable release boundary:

- [bin/cautilus](/home/ubuntu/cautilus/bin/cautilus)
- [.claude-plugin/marketplace.json](/home/ubuntu/cautilus/.claude-plugin/marketplace.json)
- [.agents/plugins/marketplace.json](/home/ubuntu/cautilus/.agents/plugins/marketplace.json)
- [plugins/cautilus/](/home/ubuntu/cautilus/plugins/cautilus)
- [plugins/cautilus/.claude-plugin/plugin.json](/home/ubuntu/cautilus/plugins/cautilus/.claude-plugin/plugin.json)
- [skills/cautilus/](/home/ubuntu/cautilus/skills/cautilus)
- [scripts/resolve_adapter.py](/home/ubuntu/cautilus/scripts/resolve_adapter.py)
- [scripts/init_adapter.py](/home/ubuntu/cautilus/scripts/init_adapter.py)
- [scripts/doctor.py](/home/ubuntu/cautilus/scripts/doctor.py)
- [scripts/agent-runtime/](/home/ubuntu/cautilus/scripts/agent-runtime)
- [install.sh](/home/ubuntu/cautilus/install.sh)
- [scripts/release/](/home/ubuntu/cautilus/scripts/release)
- [scripts/release/check-codex-marketplace.mjs](/home/ubuntu/cautilus/scripts/release/check-codex-marketplace.mjs)
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

1. either check out `Cautilus` and run `npm install`
2. for local Codex testing, expose the repo marketplace through
   [.agents/plugins/marketplace.json](/home/ubuntu/cautilus/.agents/plugins/marketplace.json)
   so Codex resolves `./plugins/cautilus` as the installable local plugin
3. verify the repo-local marketplace with
   [check-codex-marketplace.mjs](/home/ubuntu/cautilus/scripts/release/check-codex-marketplace.mjs)
4. for local Claude testing, expose the repo marketplace through
   [.claude-plugin/marketplace.json](/home/ubuntu/cautilus/.claude-plugin/marketplace.json)
   so Claude resolves `./plugins/cautilus` as the installable local plugin
5. validate the checked-in Claude marketplace and plugin manifests with
   `claude plugins validate ./.claude-plugin/marketplace.json`
   and `claude plugins validate ./plugins/cautilus/.claude-plugin/plugin.json`
6. or install the standalone CLI from a tagged GitHub release with
   [install.sh](/home/ubuntu/cautilus/install.sh)
7. call `cautilus --version` or `cautilus ...` directly
8. keep adapters and repo-local assets in the consumer repo
9. when cutting a tagged release, render the Homebrew formula body with
   [render-homebrew-formula.mjs](/home/ubuntu/cautilus/scripts/release/render-homebrew-formula.mjs)

This repo is still not claiming npm publication or a public Codex/Claude
plugin distribution flow. The current plugin install story is repo-local.

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
