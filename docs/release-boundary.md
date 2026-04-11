# Release Boundary

This note fixes what counts as the standalone `Cautilus` product surface before
wider consumer rollout.

## Product-Owned Surface

These are part of the reusable release boundary:

- [bin/cautilus](../bin/cautilus)
- [.claude-plugin/marketplace.json](../.claude-plugin/marketplace.json)
- [.agents/plugins/marketplace.json](../.agents/plugins/marketplace.json)
- [plugins/cautilus/](../plugins/cautilus)
- [plugins/cautilus/.claude-plugin/plugin.json](../plugins/cautilus/.claude-plugin/plugin.json)
- [skills/cautilus/](../skills/cautilus)
- [scripts/resolve_adapter.mjs](../scripts/resolve_adapter.mjs)
- [scripts/init_adapter.mjs](../scripts/init_adapter.mjs)
- [scripts/doctor.mjs](../scripts/doctor.mjs)
- [scripts/agent-runtime/](../scripts/agent-runtime)
- [install.sh](../install.sh)
- [scripts/release/](../scripts/release)
- [scripts/release/check-codex-marketplace.mjs](../scripts/release/check-codex-marketplace.mjs)
- [docs/contracts/](./contracts)
- [fixtures/workbench/review-verdict.schema.json](../fixtures/workbench/review-verdict.schema.json)
- checked-in product example fixtures under
  [fixtures/scenario-proposals/](../fixtures/scenario-proposals),
  [fixtures/reports/](../fixtures/reports), and
  [fixtures/cli-evaluation/](../fixtures/cli-evaluation)

## Consumer-Owned Surface

These stay in the host repo:

- `cautilus-adapter.yaml` instances and named adapters
- prompts, schemas, wrappers, compare artifacts, and policy text referenced by
  the adapter
- runtime-log readers, storage integrations, audit UI, and operator dashboards
- repo-specific workflow briefs and fixture packs

## Current Install Story

The current honest install story is:

1. install the standalone CLI from a tagged GitHub release with
   [install.sh](../install.sh)
2. let `install.sh` detect the host OS and architecture and download the
   matching tagged binary asset
3. require `cautilus --version` to work on `PATH`
4. in each consumer repo, run `cautilus skills install`
5. treat `.agents/skills/cautilus/` as the canonical checked-in skill path and
   `.claude/skills -> ../.agents/skills` as the Claude compatibility shim
6. keep adapters and repo-local assets in the consumer repo
7. for local Codex plugin testing, expose the repo marketplace through
   [.agents/plugins/marketplace.json](../.agents/plugins/marketplace.json)
   so Codex resolves `./plugins/cautilus` as the installable local plugin
8. verify the repo-local marketplace with
   [check-codex-marketplace.mjs](../scripts/release/check-codex-marketplace.mjs)
9. for local Claude plugin testing, expose the repo marketplace through
   [.claude-plugin/marketplace.json](../.claude-plugin/marketplace.json)
   so Claude resolves `./plugins/cautilus` as the installable local plugin
10. validate the checked-in Claude marketplace and plugin manifests with
   `claude plugins validate ./.claude-plugin/marketplace.json`
   and `claude plugins validate ./plugins/cautilus/.claude-plugin/plugin.json`
11. when cutting a tagged release, keep the checksum manifest and GitHub
    artifact attestations as the public provenance surface for the binary
    assets
12. when cutting a tagged release, render the Homebrew formula body with
   [render-homebrew-formula.mjs](../scripts/release/render-homebrew-formula.mjs)

This repo is still not claiming npm publication or a public Codex/Claude
plugin distribution flow. The plugin surfaces remain repo-local test fixtures,
not the canonical consumer install contract.

## Versioning Discipline

Before wider reuse, keep these compatibility rules:

- breaking contract changes must update checked-in docs and fixtures in the
  same change
- CLI help, bundled skill instructions, and executable specs should describe
  the same commands
- new runtime surfaces should land with at least one executable test
- if a consumer migration depends on a new product surface, update
  [docs/handoff.md](./handoff.md) and
  [docs/master-plan.md](./master-plan.md) in the same
  work unit
