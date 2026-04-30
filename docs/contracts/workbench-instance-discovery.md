# Live Eval Instance Discovery Contract

Issue `#17` closes only if `Cautilus` can talk about consumer instances without copying one consumer's filesystem layout into the product.
The missing seam is not another HTML page.
It is the local-first routing contract that says which instances exist on this host and where each instance keeps its scenario-adjacent data.
The public command surface for this seam is now `cautilus eval live discover`.

## Current Slice

`Cautilus` now defines `cautilus.workbench_instance_catalog.v1` as the neutral discovery packet for live app eval flows.
The adapter may provide that catalog either through an explicit checked-in instance list or through a local command that prints the catalog to stdout.
Both modes normalize to the same packet so `eval live` commands can route by `instanceId` without learning consumer-specific directory rules.

## What An Instance Means

An instance is one live consumer target on this host that `Cautilus` can select by stable id.
It is not the adapter itself and it is not the scenario packet.
It is the concrete thing an operator wants to inspect or run against, such as one local Ceal environment, one named dev runtime, or one single default app deployment on a laptop.
This vocabulary started from Ceal-style multi-instance workbench needs, but the contract also applies to a simple repo that exposes only one default instance.

## Fixed Decisions

- The discovery boundary is local-first.
- The adapter may choose `kind: explicit` or `kind: command`, but both routes normalize to the same catalog packet.
- Every instance must expose a stable `instanceId` and a human-facing `displayLabel`.
- Every instance must expose either `dataRoot`, typed `paths`, or both.
- The contract does not force one canonical storage root such as `.cautilus/`.
- The product does not hardcode Ceal's route layout or directory names into this seam.

## Packet Shape

Use `cautilus.workbench_instance_catalog.v1`.

Required top-level fields:

- `schemaVersion`
- `instances`

Each instance entry must include:

- `instanceId`
- `displayLabel`

Each instance entry may include:

- `description`
- `dataRoot`
- `paths`

Current product-owned `paths` keys are intentionally small:

- `scenarioStore`
- `conversationSummaries`
- `conversationTranscripts`
- `proposalCandidates`
- `scenarioResults`
- `runArtifacts`
- `compareArtifacts`

Consumers may carry additional future keys as long as the instance id and the known keys remain stable.

## Adapter Boundary

The adapter-owned input lives under `instance_discovery` in `cautilus-adapter.yaml`.

Use `kind: explicit` when the checked-in adapter can safely name the instances itself.
Use `kind: command` when the consumer must probe one or more local roots at runtime.

For `kind: command`:

- `command_template` must be a bounded local command.
- The command should print only `cautilus.workbench_instance_catalog.v1` JSON to stdout.
- Human-facing warnings belong on stderr.

For `kind: explicit`:

- each entry must include `id`
- each entry must include `display_label`
- each entry must include `data_root`, `paths`, or both

## Deferred Decisions

- auto-refresh, caching, or watch-mode semantics for discovery
- authenticated remote discovery
- product-owned mutation of consumer instance metadata
- any generic admin or compliance browsing surface
- future GUI workbench behavior for browsing and editing claims, scenarios, evidence, and related review state
  That future workbench should be specified as an interactive product surface, not as the current live app runner seam.

## Non-Goals

- forcing one shared consumer run-data home
- turning the adapter into a filesystem crawler DSL
- defining the live invocation packet in the same slice
- replacing consumer-specific audit or auth policy

## Success Criteria

- A future live app eval flow can refer to one selected instance by stable id.
- The product can render a human-facing instance chooser without learning consumer-native labels itself.
- The product can read scenario-adjacent paths from typed packet fields instead of hardcoded route templates.
- The same contract works for a simple explicit single-instance repo and a dynamic multi-instance consumer.

## Acceptance Checks

- `go test ./internal/runtime ./internal/app`
- fixture example at [fixtures/workbench-instance-discovery/example-catalog.json](../../fixtures/workbench-instance-discovery/example-catalog.json) validates against [fixtures/workbench-instance-discovery/catalog.schema.json](../../fixtures/workbench-instance-discovery/catalog.schema.json)

## Canonical Artifact

The canonical artifact for this slice is `cautilus.workbench_instance_catalog.v1`.
The checked-in example lives at [fixtures/workbench-instance-discovery/example-catalog.json](../../fixtures/workbench-instance-discovery/example-catalog.json).

## Premortem

The most likely failure mode is leaking one consumer's directory layout into the product contract.
This slice counters that by standardizing only the discovery packet and a small typed-path vocabulary while leaving actual probing logic adapter-owned.
The second likely failure mode is forcing every consumer to write discovery code even when one static instance list is enough.
This slice counters that by supporting both `explicit` and `command` discovery under the same normalized packet.
