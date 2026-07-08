# Debug Review
Date: 2026-07-09

## Problem

Quality startup probes fail for current Cautilus release-readiness checks because configured probe commands call removed top-level CLI aliases.

## Correct Behavior

Given Cautilus exposes machine-readable discovery through the current command registry, quality startup probes and agent guidance should call runnable commands.
When the probe wants binary health it should use `./bin/cautilus doctor binary --json`.
When the probe wants command discovery it should use `./bin/cautilus doctor commands --json`.
When the probe wants scenario catalog discovery it should use `./bin/cautilus discover scenarios --json`.

## Observed Facts

- `python3 .../measure_startup_probes.py --repo-root . --json` measured five probes and exited 1.
- The failing probes were `cautilus-healthcheck`, `cautilus-command-registry`, and `cautilus-scenario-catalog`.
- `.agents/quality-adapter.yaml` configured those probes as `./bin/cautilus healthcheck --json`, `./bin/cautilus commands --json`, and `./bin/cautilus scenarios --json`.
- `./bin/cautilus doctor binary --json`, `./bin/cautilus doctor commands --json`, and `./bin/cautilus discover scenarios --json` all exit 0.
- `./bin/cautilus healthcheck --json`, `./bin/cautilus commands --json`, and `./bin/cautilus scenarios --json` all exit 1 and print the usage surface.
- `rg` found `.agents/skills/cautilus-agent/SKILL.md` still recommending `"$CAUTILUS_BIN" commands --json` even though portable text in the same line already names `cautilus doctor commands --json`.

## Reproduction

- Run `python3 /home/hwidong/.codex/plugins/cache/local/charness/0.62.0/skills/quality/scripts/measure_startup_probes.py --repo-root . --json`.
- Run the three stale aliases directly: `./bin/cautilus healthcheck --json`, `./bin/cautilus commands --json`, and `./bin/cautilus scenarios --json`.

## Candidate Causes

- The quality adapter startup probes were not updated when command discovery moved under `doctor` and scenario catalog discovery moved under `discover`.
- The binary accidentally removed backwards-compatible aliases that release probes still depend on.
- The quality helper might be resolving an old binary rather than the checked-in `./bin/cautilus`.
- Agent guidance copied an old local alias while docs and release adapter moved to the current command names.

## Hypothesis

- Falsifiable claim: the release-readiness failure is stale probe and agent guidance configuration, not a broken current CLI discovery surface.
- Disconfirmer: current documented commands fail, or registry/docs still define the stale top-level aliases as supported commands.

## Verification

- Result: confirmed.
- Current documented commands passed: `./bin/cautilus doctor binary --json`, `./bin/cautilus doctor commands --json`, and `./bin/cautilus discover scenarios --json`.
- Stale top-level aliases failed and printed the usage surface.
- `docs/master-plan.md`, `README.md`, `docs/guides/cli.md`, `.agents/release-adapter.yaml`, and `.agents/quality-adapter.yaml` command-doc/probe-command sections already point at `doctor commands` and `discover scenarios`.

## Root Cause

The startup probe list and one local Cautilus Agent command-discovery sentence retained pre-registry top-level aliases after the current product surface settled on `doctor binary`, `doctor commands`, and `discover scenarios`.
The standing `npm run verify` gate did not run the optional quality startup-probe inventory, so the drift stayed advisory until the whole-repo quality sweep measured startup probes.

## Invariant Proof

- Invariant: release-readiness startup probes must exercise commands that the current registry and docs advertise.
- Producer Proof: `.agents/quality-adapter.yaml` owns startup probe command lists for `measure_startup_probes.py`.
- Final-Consumer Proof: rerun `measure_startup_probes.py --repo-root . --json` after the fix and require all configured probes to exit 0.
- Interface-Shape Sibling Scan: `.agents/skills/cautilus-agent/SKILL.md`, `skills/cautilus-agent/SKILL.md`, and packaged plugin copies must not recommend removed top-level command-discovery aliases.
- Non-Claims: this does not claim every historical doc in `docs/specs/old/` avoids old vocabulary; archived specs can preserve historical examples.

## Detection Gap

- startup probes | `npm run verify` did not run `measure_startup_probes.py` | smallest change to fire it: run the quality startup-probe inventory during release-readiness review.
- agent command guidance | `lint:skill-disclosure` checks required fragments but not removed alias fragments | smallest change to fire it: add a forbidden fragment for `$CAUTILUS_BIN" commands --json` or update the skill text so existing disclosure checks no longer carry the stale alias.
- CLI docs | docs and release adapter already used the current commands | smallest change to fire it: none needed for maintained docs.

## Sibling Search

- Mental model: a command renamed in docs is automatically renamed in every probe and agent-facing helper sentence.
- same layer: `.agents/quality-adapter.yaml` startup probes | decision: same bug, fix now | proof: direct probe failure.
- same layer: `.agents/skills/cautilus-agent/SKILL.md` command discovery sentence | decision: same bug, fix now | proof: static scan plus current alias failure.
- package layer: `skills/cautilus-agent/SKILL.md` and `plugins/cautilus/skills/cautilus-agent/SKILL.md` | decision: same bug, fix now | proof: source and packaged surfaces should match local agent guidance.
- docs layer: `README.md`, `docs/guides/cli.md`, `.agents/release-adapter.yaml` | decision: same class, diagnostic-only for this slice | proof: static scan found current commands there.
- cross-file: `.agents/quality-adapter.yaml`, `.agents/skills/cautilus-agent/SKILL.md`, `skills/cautilus-agent/SKILL.md`, and `plugins/cautilus/skills/cautilus-agent/SKILL.md`.

## Seam Risk

- Interrupt ID: startup-probe-command-drift-2026-07-09
- Risk Class: none
- Seam: quality adapter probes and Cautilus Agent command-discovery guidance versus current CLI registry.
- Disproving Observation: current documented commands pass directly; stale aliases fail directly.
- What Local Reasoning Cannot Prove: whether downstream consumer repos have copied the stale aliases.
- Generalization Pressure: monitor

## Interrupt Decision

- Resolution: resolved
- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep startup probes tied to registry-backed commands rather than historical aliases.
When command names move, scan quality adapters and Cautilus Agent package copies in the same slice, then rerun `measure_startup_probes.py`.
