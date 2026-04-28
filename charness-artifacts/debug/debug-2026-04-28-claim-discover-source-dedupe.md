# Debug Review: claim discover source dedupe
Date: 2026-04-28

## Problem

`cautilus claim discover` emitted duplicate claim candidates for `AGENTS.md` and `CLAUDE.md` even though this repo's `CLAUDE.md` is a symlink to `AGENTS.md`.
The generated human review worksheet therefore asked the operator to review the same instruction claims twice.

## Correct Behavior

Given a repo where multiple configured entry paths resolve to the same canonical file, when `claim discover` scans entry sources, then it should read that canonical file once and should not treat symlink aliases as separate sources.
Given two distinct real files that declare the same normalized claim text, discovery should emit one unique claim candidate and preserve both declaration locations in `sourceRefs`.

## Observed Facts

- `ls -l AGENTS.md CLAUDE.md` showed `CLAUDE.md -> AGENTS.md`.
- `.cautilus/claims/latest.json` contained eight `AGENTS.md` claims and eight matching `CLAUDE.md` claims.
- The matching entries had the same summaries and lines but different `claimFingerprint` values because the fingerprint included the source path.
- The source inventory also included both `AGENTS.md` and `CLAUDE.md` before the fix.

## Reproduction

Before the fix, running:

```bash
./bin/cautilus claim discover --repo-root . --output .cautilus/claims/latest.json
jq '[.claimCandidates[] | select(.sourceRefs[0].path=="AGENTS.md" or .sourceRefs[0].path=="CLAUDE.md") | {claimId, path: .sourceRefs[0].path, line: .sourceRefs[0].line, summary, fingerprint: .claimFingerprint}]' .cautilus/claims/latest.json
```

showed duplicate `AGENTS.md` and `CLAUDE.md` claim rows for the same canonical file.

## Candidate Causes

- Source discovery deduped only repo-relative paths, not canonical file identities.
- Claim fingerprints included the source path, so identical claims from alias paths could not merge.
- Rendering assumed each claim candidate had exactly one source ref.
- The current tests covered linked Markdown depth and adapter entries, but not symlink aliases or identical claims across distinct truth surfaces.

## Hypothesis

If source discovery dedupes canonical files with `filepath.EvalSymlinks`, and claim candidates can carry multiple `sourceRefs` keyed by normalized claim text, then symlink aliases will disappear while identical claims in distinct files will merge into one candidate with multiple source refs.

## Verification

Added targeted tests:

```bash
go test ./internal/runtime -run 'TestDiscoverClaimProofPlan(DedupesSymlinkedEntrySources|MergesIdenticalClaimsAcrossDistinctSources|ClassifiesFixtureClaims)'
```

The tests passed.
After regenerating the Cautilus claim packet, `CLAUDE.md` produced zero claim candidates, `AGENTS.md` remained as the canonical source, and validation passed.

## Root Cause

The deterministic discovery layer treated path aliases and claims as path-scoped rows rather than unique claims backed by source references.
That made source-path differences leak into `claimFingerprint` and prevented even mechanical duplicates from being collapsed before LLM review.

## Seam Risk

- Interrupt ID: claim-discover-source-dedupe
- Risk Class: none
- Seam: deterministic claim source inventory and claim identity
- Disproving Observation: a symlink alias produced a second full set of heuristic claims
- What Local Reasoning Cannot Prove: whether all semantic duplicates with different wording should merge; that remains LLM review/grouping work
- Generalization Pressure: use deterministic canonical-file and identical-text dedupe first, then add semantic grouping separately

## Interrupt Decision

- Premortem Required: no
- Next Step: impl
- Handoff Artifact: none

## Prevention

Keep canonical-file aliases out of source inventory.
Represent repeated identical declarations as one claim with multiple `sourceRefs`.
Do not use source path in the stable claim fingerprint when the product goal is unique claim discovery.
Add future discovery-quality review around semantic duplicates, which require grouping rather than mechanical dedupe.
