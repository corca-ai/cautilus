# Release Record
Date: 2026-06-22

## Summary

Released Cautilus `v0.17.0`.

## Release Scope

Minor release. The bump level is minor because this release adds maintained operator surface on the bundled Cautilus Agent — the `runner-readiness` capability (`skills/cautilus-agent/references/runner-readiness.md`, with the matching `SKILL.md` section) that proves "you can check how testable your agent is", flipping the apex `A Testable Agent` badge to proven (apex now 7/7). It is not a patch (more than a behavior repair) and not a major (no breaking command or invocation change: the CLI still exposes the same 61 commands and the install/launch contract is unchanged).

This release keeps the public product shape stable: installable Cautilus CLI, bundled Cautilus Agent, checked-in claim/spec reports, and the GitHub binary release artifacts as the public release boundary.

The main shipped changes since `v0.16.2`:

- **A Testable Agent (additive capability, drives the minor bump):** the Cautilus Agent gained `runner-readiness` guidance and proof so an operator can check how testable their agent is and build a testable runner; the apex `A Testable Agent` badge is now proven (7/7 apex proven).
- **specdown corpus restructure:** the spec corpus was rebuilt onto a proof-spine with typed traceability — every promise traces to its governing rules and contracts through typed edges, the promise-ledger map is generated from the trace graph so it cannot drift, generator-owned pages are isolated under `docs/specs/generated/`, and the 7 promise leaves live under `docs/specs/promises/`.
- **engine-baseline routing accuracy (per-facet routing, Fork B):** the deterministic claim-discovery baseline stopped over-routing deterministic-checkable claims into `cautilus-eval`. R6/R12 ownership/capability routing plus four Fork B per-facet discriminators (named-packet, CLI-flag-semantics, schema-field-persistence, command-absence) cut the gold-overlap `cautilus-eval → deterministic` disagreement from 10 to 4 and raised the agreeing count from 30 to 38, with zero new over-corrections.
- **recall + structural-coherence repairs:** the rune-bound-recall fix recovered 76 length-dropped routable claims; a gate↔router coherence guard now fails the build if a routable claim shape is not admitted by the upstream gate; and the low-blast gate-router dead-case fixes recovered two previously dropped deterministic lint-gate claims.

This release does not claim a breaking command change, npm publication, or public Claude/Codex marketplace publication. The GitHub binary/install surface remains the public release boundary.

## Commits

This release includes the commits after `v0.16.2` up to the release commit. Representative commits:

- Prove you can check how testable your agent is (runner-readiness); apex now 7/7 proven
- Restructure the specdown corpus to a proof-spine with typed traceability
- Generate the promise ledger map from the trace graph so it cannot drift
- Route ownership/boundary assignments and capability claims deterministically (R6/R12)
- Recover length-dropped promises and make R12 reachable (rune-bound recall)
- Route named-packet, CLI-flag-semantics, schema-field-persistence, and command-absence claims deterministically (Fork B slices 1–4)
- Guard gate↔router coherence so structural deaths fail the build
- Fix low-blast gate-router dead cases so dropped routes go live

## Review

- Critique: full — a bounded fresh-eye subagent reviewed this release before publish (bump justification, narrative honesty against the v0.16.2..HEAD diff, surface parity, and the publish boundary). Verdict and incorporated edits recorded in the closeout.
- Each engine slice in this release (R6/R12, the four Fork B slices, the gate-router fixes) landed through its own delegated spec critique and delegated landed-review, all verdicts clean; the per-slice build contracts and measurements live under `charness-artifacts/eval-trust/`.

## Verification

Local release-close gates (green):

- `node scripts/release/prepare-release.mjs 0.17.0`: green (skills sync is a no-op — the packaged Cautilus Agent is in sync with source, and `runner-readiness.md` is present in both trees; the packaged tree differs only by the sync helper's upward-link depth rewrites, by design — all five version surfaces aligned at 0.17.0, claim freshness fresh).
- CLI/skill surface probes (the Cautilus Agent skill surface moved since `v0.16.2`): `./bin/cautilus --version` → `0.17.0`; `doctor binary --json` → healthy; `doctor commands --json` → 61 commands; `discover scenarios --json` → valid catalog; `--help` → ok.
- `npm run generated:drift:check`: clean.
- `npm run verify`: all phases passed.
