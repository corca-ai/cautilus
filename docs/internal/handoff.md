# Cautilus Handoff

## Workflow Trigger

Next session should resume `charness:hitl` over the Cautilus user-facing specs.
Start with `git status --short`, then run `charness:find-skills` once and explicitly check whether `support/specdown` applies before editing any `docs/specs/**/*.spec.md` file.

## Current State

- Latest committed slice: `3689443 Focus spec lint on selected files`.
  `npm run lint:specs -- <spec-file>` now validates selected spec files and runs each one as a focused temporary specdown entry with `-no-report`.
- Current deliberate product boundary:
  Cautilus is not strongly coupled to specdown.
  Cautilus owns standalone binary behavior, machine-readable packets, provenance, status summaries, and next-work routing.
  The bundled Cautilus skill interprets those packets.
  Charness-owned authoring discipline should eventually own reusable top-level user-facing, maintainer-facing, and cross-concern spec language.
- The Charness follow-up for missed support-skill discoverability is [corca-ai/charness#108](https://github.com/corca-ai/charness/issues/108).
  Do not over-specify the final Charness design yet; this Cautilus repo is still the sharpening surface.
- The Charness follow-up for reusable top-level spec authoring discipline is [corca-ai/charness#109](https://github.com/corca-ai/charness/issues/109).
  Treat it as a direction marker, not a frozen implementation plan.
- Readiness story review is considered complete.
  Claim Discovery needs smaller HITL chunks because deterministic packet evidence, non-verdict boundary, next-work routing, and bundled-skill curation have different acceptance boundaries.
- `.charness/hitl/` is runtime state and should stay uncommitted unless the user explicitly asks otherwise.

## Next Session

1. Confirm the live worktree with `git status --short`.
2. Read [docs/internal/working-patterns.md](./working-patterns.md) sections `Product Language 및 Cross-Cutting Concern 원칙` and `Standing Gate 순서`.
3. Use `support/specdown` references before changing executable spec syntax.
4. Resume HITL at [docs/specs/user/claim-discovery.spec.md](../specs/user/claim-discovery.spec.md), first chunk: story sentence plus discovery-boundary proof.
5. For each chunk, show the source text and the actual focused command output.
   Use focused checks such as `npm run lint:specs -- docs/specs/user/claim-discovery.spec.md`, not full `specdown run`, until a story-level closeout.

## Discuss

- Whether Charness should place reusable top-level spec authoring in `charness:narrative`, `charness:spec`, or a split contract.
  Current leaning: narrative owns meaning and concern structure; spec/specdown support owns executable syntax and proof mechanics.
- Which Cautilus-only spec patterns should be promoted to Charness after the user-facing and maintainer-facing docs are sharper.

## References

- [docs/specs/user/index.spec.md](../specs/user/index.spec.md)
- [docs/specs/maintainer/index.spec.md](../specs/maintainer/index.spec.md)
- [docs/internal/working-patterns.md](./working-patterns.md)
- [corca-ai/charness#108](https://github.com/corca-ai/charness/issues/108)
- [corca-ai/charness#109](https://github.com/corca-ai/charness/issues/109)
