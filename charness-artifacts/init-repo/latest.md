# Init-Repo Normalization

## Repo Mode

`NORMALIZE`

## Agent Docs State

- `AGENTS.md` exists and remains the primary host-facing instruction surface.
- `CLAUDE.md` already symlinks to `AGENTS.md`.
- `.agents/init-repo-adapter.yaml` is present and valid.

## Verified Facts

- The repo already has all declared operating surfaces, including roadmap, install, operator acceptance, and handoff docs.
- The existing `Skill Routing` section was compact but too abstract compared with the current `init-repo` compact routing guidance.
- The repo intentionally uses semantic line breaks in prose markdown.

## Assumptions

- This repo still prefers compact skill routing over an expanded checked-in public skill catalog.
- Adding concrete route shapes is higher value than adding every currently installed charness skill to `AGENTS.md`.

## Normalized Surfaces

- `AGENTS.md`
  Added concrete compact skill routes for `find-skills`, `gather`, `debug`, `impl`, `quality`, `handoff`, and `init-repo`.
  Also made explicit that user-named charness skills should be routed directly.

## Open Questions

- If maintainers want `premortem`, `release`, `narrative`, or `spec` to be locally discoverable without `find-skills`, the repo can switch to expanded skill routing or add a second compact sentence covering those named surfaces.

## Next Step

- Keep `AGENTS.md` compact unless charness routing misses become common again.
- If misses recur, prefer an explicit adapter-level `skill_routing_mode` decision over ad hoc wording drift.
