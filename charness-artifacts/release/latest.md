# Release Record
Date: 2026-04-24

## Summary

Released Cautilus `v0.13.0`.

## Release Scope

Minor bump because the optimize surface shed a user-facing field (breaking for host repos that still read `optimizer.kind`) and gained an additive runtime-context surface on HTML reports.
The instruction-surface routing-fidelity improvement is fixture-only for now.

- **Breaking**: `optimizer.kind` removed from the user-facing optimize packet (`913d973`).
  `repair` / `reflection` / `history_followup` preset decisions are derived from evidence shape instead.
  Host repo migration notes and reader-path fixes: [corca-ai/cautilus#31](https://github.com/corca-ai/cautilus/issues/31).
  `fixtures/optimize/input.schema.json` enforces `additionalProperties: false` on the optimizer object, so a stale host packet with `kind` is rejected at the contract boundary.
- **Additive**: HTML report renders `report.runtimeContext` (warnings / notes / comparisons) on the Decision Signals section (`6f543c9`).
  Pinned-runtime mismatches now elevate aggregate status to `blocker`.
  Consumers gating CI on the aggregate signal may turn red on the first pinned-runtime drift after upgrade and need to re-pin or widen their policy.
- **Additive (fixture-only)**: `claude-only-routing` and `claude-symlink-routing` fixtures got `expectedRouting: { selectedSkill: "none" }` so the self-dogfood fixture summary reports `matchedExpectedRoute` 5/5 instead of 3/5 (`d93084a`).
  Known leak: `scripts/agent-runtime/instruction-surface-support.mjs` `ROOT_ENTRY_ALIASES` still masks only root AGENTS.md/CLAUDE.md, so the bundled `skills/cautilus/SKILL.md` and `plugins/cautilus/skills/cautilus/SKILL.md` remain visible to a real agent.
  The next real-codex `dogfood:self:instruction-surface` run will likely reject `claude-only-routing`.
  Real-runner routing fidelity is not 5/5 yet; handoff flags the surface-isolation follow-up.
- Release-adapter hygiene: CLI+skill surface probe now points at `SKILL.md` files and includes `--help` (`841ac85`).

## Commits

- `6f543c9` Render runtime context in HTML report
- `913d973` Remove optimizer.kind from user-facing optimize surface
- `14230e1` chore(retro): seed durable retro memory and record session lessons
- `cbf3d1f` chore(adapters): record repo-owned release seams in release-adapter.yaml
- `a1802c8` Refresh handoff after runtime fingerprint and optimizer.kind closeout
- `d93084a` Assert routing fidelity on all instruction-surface variants
- `9005f27` Refresh handoff after instruction-surface routing fidelity slice
- `f5713c8` Refresh find-skills inventory with newly referenced paths
- `841ac85` Point release CLI+skill check at SKILL.md files and --help probe

## Review

- Premortem: delegated via Agent subagent. Returned four angles (silent `kind` accept, blocker-escalation CI break, routing-fidelity false-green, brew-vs-curl PATH shadow) with verdict "ship with named changes."
  Act-before-ship items: schema `additionalProperties: false` confirmed at `fixtures/optimize/input.schema.json:77`; 5/5 claim qualified as fixture-only here and in the handoff.
  Bundle-anyway items encoded as release-note bullets above.

## Verification

- `npm run release:prepare -- 0.13.0`: surfaces synced, package.json, package-lock.json, marketplace.json, plugin.json (claude + codex) advanced to 0.13.0.
- `npm run verify` (31.43s): green.
- `npm run hooks:check`: ready.
- `python3 check_cli_skill_surface.py --run-probes`: status `ok` with 5/5 probes returning 0.
- `python3 current_release.py`: `drift: []` with every surface reporting 0.13.0.

## Public Release

- URL: https://github.com/corca-ai/cautilus/releases/tag/v0.13.0
- Tag: `v0.13.0` at `b3e90f4`.
- Assets: darwin/linux arm64/x64 archives, checksum manifest, source-archive SHA-256, release notes.
- GitHub Actions: `release-artifacts` (incl. `verify-public-release`) green in 3m40s.
- `npm run release:smoke-install -- --channel install_sh --version v0.13.0 --repo corca-ai/cautilus --installer-source local --skip-update --json`: `ok: true`, installed binary reports `cautilus 0.13.0` and `version --verbose` returns the expected product packet.

## Post-release Follow-ups

- `npm run verify` passed locally without the coverage-floor gate, but CI runs that gate separately and initially failed on three drifted files (`instruction-surface-case-suite.mjs`, `optimize.go`, `generate-optimize-proposal.mjs`).
  Realigned in `d211888 Realign coverage floors after 0.13.0 release surface changes` after two local measurements produced identical hashes.
  Main `verify` is green again.

## Operator Update Steps

1. Refresh the binary via the install-sh channel:
   `curl -fsSL https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh | sh`.
   Operators who previously installed via Homebrew should first run `brew uninstall cautilus` (and `hash -r`) to avoid a PATH shadow where a stale `cautilus` still reports `0.12.x`.
2. Claude Code and Codex plugin consumers pick up the bundled skill refresh via `charness update` or by re-running `cautilus install` in the host repo.
3. Host repos still reading `optimizer.kind` from proposals need the migration from [#31](https://github.com/corca-ai/cautilus/issues/31) before upgrading.

## Open Risks

- `ROOT_ENTRY_ALIASES` surface-isolation leak is known and tracked in the handoff as the natural follow-up slice.
- No standing real-codex dogfood was run for this tag; the fixture-backend self-dogfood is green, but real-runner routing fidelity on `claude-only-routing` is expected to regress under the new expectation until the leak is closed.
