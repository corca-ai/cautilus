# Critique Review
Date: 2026-07-16

## Decision Under Review

Release critique for cautilus v0.19.4 (patch, 0.19.3 → 0.19.4): 11 commits bundling (A) the find-skills retirement doc/proof realign and (B) an internal quality-tooling session, about to lock a tag, plugin manifests, and operator update instructions.

## Release Scope

- version/tag: v0.19.4 (patch bump from 0.19.3); lightest honest bump because every change is a validation/packaging repair, internal tooling, or doc realign — no new public capability, no compatibility break. find-skills was an upstream charness skill (removed 2026-07-13), never a Cautilus-owned command or packaged skill, so its retirement breaks no consumer automation.
- for consumers: nothing changes in the shipped binary or Cautilus Agent behavior; this is proof-badge realign plus internal proof/tooling hygiene.

## Surface-Lock Inventory

- generated/manifests: plugin manifests (`plugins/cautilus/**/plugin.json`) take the version bump at publish; packaged skill tree content is unchanged (and now guarded by the new `lint:skill-packaged-sync` parity gate).
- consumer-visible behavior: none — no CLI command, flag, doctor exit code, or install prerequisite changed.
- docs: AGENTS.md (find-skills references removed), README (1 line), docs/specs/promises/evaluation.spec.md, docs/contracts/find-skills-retirement-realign.md, behavior-eval-live proof fixtures.
- adapter/integration manifests consumers hold: none changed.

## Failure Angles

- Gawande (operational): is a release-time step missing — release record, claim-freshness, packaged-skill sync, generated drift?
- Minto (structure): is the 0.19.4 story legible to an operator who did not follow the thread, given two unrelated themes are bundled?
- Raskin (interface): do the new maintainer commands and reworked defaults surface actionable wording, or footguns?

## Counterweight Pass

Three angle reviewers plus one counterweight (all parent-delegated bounded fresh-eye) triaged into the four bins. Verified deterministically this turn: the claim packet is `fresh` and HEAD-reachable (`release:claim-freshness` exit 0); no consumer-shipped surface outside `internal/app/examples.go` carries `find-skills` (packaged plugin, docs/guides, source skill all grep-clean); `examples.go` is untouched by these 11 commits (pre-existing state, not a regression). The only must-fix-before-publish is the stale release record, which the publish helper self-enforces. Everything else is maintainer-only ergonomics or by-design deferral.

## Structured Findings

- F1 | bin: act-before-ship | evidence: strong | ref: charness-artifacts/release/latest.md:6 | action: fix | note: release record still declares v0.19.3; publish helper assertReleaseNarrativeReady hard-blocks without a v0.19.4 record carrying `## Release Scope` and `## Verification` — author it covering both themes
- F2 | bin: valid-but-defer | evidence: moderate | ref: internal/app/examples.go:70 | action: document | note: shipped binary example still emits find-skills while its summary says "discovery"; pre-existing (untouched by this release) and contract-deferred by AC4 — recorded in Deliberately Not Doing, not silently overridden
- F3 | bin: over-worry | evidence: moderate | ref: scripts/check-coverage-floor.mjs:104 | action: defer | note: floor WARN doesn't name coverage:floor:raise-stale, but its 1pp trigger vs the command's 10pp raise threshold means naming it would mislead
- F4 | bin: valid-but-defer | evidence: moderate | ref: scripts/write-coverage-floor.mjs:26 | action: defer | note: no --help; bare --only-stale uses the tight 1.0pp default vs the alias's 10pp — maintainer-only script, args validated, floor diff-reviewed
- F5 | bin: over-worry | evidence: moderate | ref: package.json:125 | action: defer | note: new maintainer commands absent from AGENTS.md, but package.json is the npm-script SOT and lint:skill-packaged-sync already auto-runs in verify
- F6 | bin: over-worry | evidence: contested | ref: scripts/write-coverage-floor.mjs:13 | action: defer | note: coverage:floor:write default buffer 0.25→1.0pp is strictly safer and is echoed on stdout plus a code comment
- F7 | bin: over-worry | evidence: strong | ref: docs/contracts/find-skills-retirement-realign.md:120 | action: defer | note: lingering internal (non-shipped) find-skills references are by-design frozen history under FD5/AC4

## Deliberately Not Doing

- Not editing `internal/app/examples.go` in this release (F2). It ships a find-skills example that contradicts its own "discovery" summary, but it is pre-existing (already in 0.19.3, untouched by these commits) and was explicitly scoped out of the find-skills-retirement contract (AC4). Expanding release scope into Go product code to override a documented decision without user sign-off is the wrong move; recorded here and recommended as a follow-up cleanup slice so the release does not overclaim "all find-skills references removed."
- Not front-loading maintainer-command docs (F5) or a --help affordance (F4): the repo's own principle prefers the SOT (package.json) over copied checklists; these are internal-only and touchable when the script is next edited.

## Operator Action Required

- F1 (Act Before Ship): author `charness-artifacts/release/latest.md` for v0.19.4 — declaration line `Released Cautilus \`v0.19.4\`.`, `## Release Scope` naming both themes, and `## Verification` — before `release:publish`, which will otherwise refuse.

## Upgrade Path

None required. No consumer-visible binary or Cautilus Agent behavior changed; operators upgrade via the normal adapter-declared install/update path. No migration or rollback step.

## Reviewer Tier Evidence

- Requested tier: high-leverage bounded fresh-eye (release-critique angle + counterweight).
- Requested spawn fields: charness:bounded-reviewer, read-only (Read/Grep/Glob), one lens per reviewer.
- Host exposure state: applied
- Application state: host-confirmed: four bounded reviewers returned — Gawande/Minto/Raskin angle passes plus a separate counterweight pass.

## Fresh-Eye Satisfaction

parent-delegated

## Boundary Ownership

- Producer: this repo's release surface (publish helper + release record).
- Consumer: operators and downstream repos upgrading onto v0.19.4.
- Owning surface: the release record `charness-artifacts/release/latest.md`.
- Verdict: single-surface
