# Debug Review
Date: 2026-06-17

## Problem

`discover claims extraction-input --source <path>` returns an empty `template.epicCatalog` even when the resolved adapter declares `claim_discovery.epic_catalog`, and reports `effectiveScanScope.adapterFound: false` even when `--adapter <file>` is passed explicitly.
The slice-3 epic facets therefore never reach the agent on the source-scoped corpus path — the exact path the command help advertises for "read-only corpus measurement before maintainer ratification."

## Correct Behavior

- Given an adapter with `claim_discovery.epic_catalog` (11 epics) and a source-scoped run `extraction-input --adapter .agents/cautilus-adapter.yaml --source README.md --source docs/guides/cli.md`,
- When the packet is generated,
- Then `template.epicCatalog` carries the 11 adapter epics, `effectiveScanScope.adapterFound` is `true`, and the scanned entries are exactly the two `--source` files (explicit scoping still wins for the entry list and link depth).

Explicit `--source` should scope WHICH files are scanned and disable link traversal; it should not silently discard adapter-owned classification config (epic catalog, audience hints, semantic groups, classification hints, excludes).

## Observed Facts

- `extraction-input --adapter .agents/cautilus-adapter.yaml --source README.md --source docs/guides/cli.md` → `template.epicCatalog` len 0, `templateVersion` v2, `adapterFound` false. (templateHash `c93503fe…`)
- `extraction-input --repo-root .` (no `--source`) → `template.epicCatalog` len 11, `adapterFound` true, `adapterPath` `.agents/cautilus-adapter.yaml`. (templateHash `41323548…`)
- `cautilus doctor adapter --repo-root .` parses `claim_discovery.epic_catalog` with all 11 epics — so the adapter file is valid and the parser reads the catalog; the gap is specific to the source-scoped discovery-config resolution, not adapter parsing.
- The slice-3 unit test `TestBuildClaimExtractionInputRendersAdapterEpicCatalog` passes because it calls `buildExtractionInput(..., {AdapterPath: adapterPath})` with NO `SourcePaths` — it never exercises `--source` + adapter together.

## Reproduction

```
./bin/cautilus discover claims extraction-input --repo-root . \
  --adapter .agents/cautilus-adapter.yaml \
  --source README.md --source docs/guides/cli.md --output /tmp/v2-input.json
node -e 'const d=require("/tmp/v2-input.json"); console.log((d.template.epicCatalog||[]).length, d.effectiveScanScope.adapterFound)'
# prints: 0 false   (expected: 11 true)
```

## Candidate Causes

- Early return in `resolveClaimDiscoveryConfig` when explicit sources are present, before the adapter is loaded. (control flow)
- Adapter parser dropping `epic_catalog` for the source-scoped path. (ruled out — `doctor adapter` reads it; no-`--source` renders it)
- `--adapter` flag not threaded into `resolveClaimDiscoveryConfig`. (ruled out — it is threaded as `options.AdapterPath`, but the early return preempts its use)
- Template renderer omitting the catalog. (ruled out — no-`--source` path renders 11)

## Hypothesis

`resolveClaimDiscoveryConfig` returns early on `len(explicit) > 0` before `LoadAdapter`, so no adapter config (including `epic_catalog`) is applied on any explicit-source run.
If true, removing the early return and applying explicit-source overrides AFTER adapter config makes `--source` runs carry the catalog while still scoping entries to the explicit list.

## Verification

`internal/runtime/claim_discovery.go:595-599`:

```go
if len(explicit) > 0 {
    config.entries = normalizeClaimPathList(explicit)
    config.linkedMarkdownDepth = 0
    return config, nil          // <-- returns before LoadAdapter at line 604
}
```

The `--adapter` override setup and `LoadAdapter` call live at lines 600-660, all after this return. Confirmed: any explicit-source run skips the entire adapter block. This matches every observed fact (empty catalog, adapterFound false even with `--adapter`).

## Root Cause

`resolveClaimDiscoveryConfig` treats "explicit sources" as "no adapter at all" via an early return placed before adapter loading.
Source scoping (which files) was conflated with classification config (how to classify), so scoping a corpus with `--source` discards the adapter's epic catalog, audience hints, semantic groups, classification hints, and excludes.
Slice 3 wired the epic catalog through the adapter-load branch but the source-scoped branch never reaches it.

## Invariant Proof

- Invariant: a packet's `template.epicCatalog` must equal the resolved adapter's `claim_discovery.epic_catalog`, independent of whether entries came from `--source` or adapter `entries`.
- Producer Proof: `resolveClaimDiscoveryConfig` populates `config.epicCatalog` from the adapter (line 640) — but only on the non-explicit branch.
- Final-Consumer Proof: `buildClaimExtractionInput` renders `renderEpicCatalog(config.epicCatalog)` into `template.epicCatalog` (claim_extraction.go:144); the CLI end-to-end run is the final consumer and showed 0 epics on the explicit branch.
- Interface-Shape Sibling Scan: same resolver feeds `DiscoverClaimProofPlan` (claim_discovery.go:190) and `agent_status` (agent_status.go:57, passes nil → unaffected); the main `discover` command shares the defect for explicit sources.
- Non-Claims: adapter YAML parsing, template hashing, and the renderer are correct.

## Detection Gap

- Unit test surface (`TestBuildClaimExtractionInputRendersAdapterEpicCatalog`) | it never set `SourcePaths`, so the explicit-source + adapter combination never ran | add a test that passes both `SourcePaths` and an adapter `epic_catalog` and asserts the catalog still renders + entries are scoped to the explicit list.
- Executable spec surface (`docs/specs/user/claim-discovery.spec.md`) | its run:shell uses a temp repo with no adapter, so `epicCatalog=array` is asserted only as empty | optional: add a source-scoped adapter case (deferred; the Go test is the cheaper guard).

## Sibling Search

- Mental model: "explicit `--source` means the caller wants nothing from the adapter." The correct model: `--source` overrides the entry list and link depth only; classification config is orthogonal to file selection.
- control-flow axis: `resolveClaimDiscoveryConfig` early return | decision: fix — load adapter always, apply explicit overrides last | proof: CLI re-run renders 11 epics after fix.
- consumer axis: `DiscoverClaimProofPlan` (main discover) with explicit sources | decision: same fix covers it (shared resolver) | proof: shared code path, covered by the same Go test asserting config fields.
- cross-file: `internal/runtime/agent_status.go:57` calls the resolver with `nil` sources — not affected by the explicit branch, so no change needed there.

## Seam Risk

- Interrupt ID: none
- Risk Class: none
- Seam: none — single-binary, in-process resolver; no host/provider boundary.
- Disproving Observation: none
- What Local Reasoning Cannot Prove: none
- Generalization Pressure: none

## Interrupt Decision

- Critique Required: yes
- Next Step: impl
- Handoff Artifact: none — small local control-flow fix with a Go test; fix proceeds in the same slice-4 work.

## Prevention

- Move adapter loading ahead of explicit-source overrides so file scoping never discards classification config.
- Add a Go test exercising `--source` + adapter `epic_catalog` together (closes the detection gap above).
- This keeps the help-text promise ("`--adapter` … useful for read-only corpus measurement") honest, which is the slice-4 measurement path.
- Behavior-change note (one intended consequence, not a regression): an explicit-source run now loads the adapter, so a genuinely unreadable `--adapter` file errors that run instead of returning early. `LoadAdapter` degrades malformed-but-readable YAML to warnings rather than erroring, so the common no-adapter explicit-source path is unaffected; only an unreadable explicit `--adapter` path surfaces the error, which is the correct fail-loud for a dry-run that asked for a specific adapter.

## Related Prior Incidents

- `debug-2026-06-16-agent-extraction-over-extraction-curation.md` — same extraction/discovery surface; that incident reframed the 292-claim count into the claim-graph model whose epic catalog this bug was suppressing on the measurement path.
