# Init-Repo Normalization

Run date: 2026-04-24

## Repo Mode

`NORMALIZE`

## Agent Docs State

- `AGENTS.md` exists and remains the primary host-facing instruction surface.
- `CLAUDE.md` already symlinks to `AGENTS.md`.
- `.agents/init-repo-adapter.yaml` is present and valid.
- `render_skill_routing.py` can render a stricter generated compact block, but the checked-in block is intentionally more concrete for this repo.

## Verified Facts

- The repo already has all declared operating surfaces, including roadmap, install, operator acceptance, and handoff docs.
- The existing `Skill Routing` section is compact, startup-bootstrap-heavy, and names the high-signal charness routes this repo actually wants surfaced.
- The repo intentionally uses semantic line breaks in prose markdown.
- The README names the canonical install path and probe surfaces for the standalone binary plus bundled skill.
- Operator acceptance is maintained at `docs/maintainers/operator-acceptance.md`, as declared by the init-repo adapter.
- `docs/internal/working-patterns.md` treats premortem, counterweight, and iterative premortem as explicit-scope practices triggered by user request, repo artifact, handoff, AGENTS rule, or current-slice risk.

## Assumptions

- This repo still prefers compact skill routing over an expanded checked-in public skill catalog.
- Keeping concrete high-signal route shapes is higher value than replacing the section with the generated generic compact block.
- On-demand premortem or bounded fresh-eye review should still use the delegated review rule once explicitly in scope.

## Normalized Surfaces

- `AGENTS.md`
  Added an on-demand premortem, counterweight, and bounded fresh-eye review rule.
  The rule says that once such review is explicitly in scope or required by a repo artifact, it is already delegated by repo contract, and host spawn restrictions must be reported rather than hidden behind an unlabelled same-agent pass.
- The existing `AGENTS.md` custom routing was reviewed and left intact.
- The previous normalization already added concrete compact skill routes for `find-skills`, `gather`, `debug`, `impl`, `quality`, `handoff`, and `init-repo`, plus direct routing for user-named charness skills.

## Open Questions

- If maintainers want `premortem`, `release`, `narrative`, or `spec` to be locally discoverable without `find-skills`, the repo can switch to expanded skill routing or add a second compact sentence covering those named surfaces.
- If the inspector should stop flagging the custom Skill Routing block as drift, add an adapter-level decision or adjust the init-repo checker to recognize this repo's accepted compact route list.

## Next Step

- Keep `AGENTS.md` compact unless charness routing misses become common again.
- If misses recur, prefer an explicit adapter-level `skill_routing_mode` decision over ad hoc wording drift.
