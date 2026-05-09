# HITL Scratchpad Link Validation Debug
Date: 2026-05-10

## Problem

Pushing commit `cf59649` failed in the pre-push hook because newly tracked HITL scratchpads contained broken Markdown links.

## Correct Behavior

Given HITL runtime scratchpads are committed as repo state, when `npm run lint:links` scans tracked Markdown files, then every Markdown link in those scratchpads should resolve from the scratchpad file location.

## Observed Facts

- `git push origin main` ran the pre-push `npm run verify` hook.
- `npm run lint:links` reported 9 broken links across the newly tracked HITL scratchpads.
- The failing links were embedded in accepted-text excerpts copied from target spec files.
- The copied excerpts used target-file-relative links such as `../concerns/agent-human-resumability.spec.md`.
- Before commit, `npm run verify` passed because the new HITL runtime directories were still untracked and outside the link scan.

## Reproduction

Run:

```bash
git push origin main
```

or, after staging or committing the new runtime scratchpads:

```bash
npm run lint:links
```

## Candidate Causes

- The HITL scratchpad preserved accepted Markdown excerpts exactly, including links that were only valid relative to the target spec file.
- The link checker intentionally ignores untracked files, so local `verify` before `git add` could not observe the future committed-file failure.
- The closeout process committed HITL runtime artifacts as repo state without normalizing copied excerpt links for the runtime artifact location.

## Hypothesis

If copied excerpt links inside committed HITL scratchpads are rewritten to paths that resolve from `.charness/hitl/runtime/<session>/`, then `npm run lint:links` and the pre-push hook should pass without changing the accepted target spec text.

## Verification

- Rewrote the broken scratchpad links to `../../../../docs/...` paths that resolve from each HITL runtime session directory.
- Preserved the actual spec files' accepted link shapes.
- `npm run lint:links` should now cover the tracked scratchpads without broken-link failures.
- The next `git push origin main` will rerun the full pre-push `npm run verify` hook.

## Root Cause

Accepted HITL excerpts were treated as inert review notes, but once their runtime scratchpads became tracked Markdown artifacts, their links became live repo links.
The first full `verify` ran before those directories were tracked, so it did not catch the eventual committed-file link validation failure.

## Seam Risk

- Interrupt ID: hitl-scratchpad-link-validation
- Risk Class: none
- Seam: tracked HITL runtime artifacts versus pre-add local validation
- Disproving Observation: `npm run lint:links` passes after the HITL runtime directories are tracked and the scratchpad links are normalized from their artifact location.
- What Local Reasoning Cannot Prove: Whether future HITL scratchpads should preserve copied target excerpts verbatim or auto-normalize links at sync time.
- Generalization Pressure: monitor

## Interrupt Decision

- Critique Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

When committing new Markdown artifacts that were untracked during an earlier `verify`, run link checks after staging or committing them.
For HITL scratchpads, copied accepted-text excerpts need links that resolve from the scratchpad artifact location, not only from the original target spec.

## Related Prior Incidents

- [debug-2026-05-08-hitl-runtime-sync-metadata.md](debug-2026-05-08-hitl-runtime-sync-metadata.md): HITL runtime artifacts changed shape across Charness contract updates and needed explicit runtime metadata before safe continuation.
