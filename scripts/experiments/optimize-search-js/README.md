# Node Optimize-Search Research Harness

This directory keeps the retired richer Node `optimize-search` harness out of the shipped `agent-runtime` path.
It is useful for parity work, fixture archaeology, and research, but it is not the shipped product runtime for `cautilus optimize search run`.

Current ownership rules:

- Go under `internal/runtime/` owns shipped `optimize-search` behavior semantics.
- `scripts/agent-runtime/` may keep thin wrappers and provider glue, but not the only implementation of shipped behavior.
- This directory may hold richer Node experiments while parity work is underway, as long as docs and release claims continue to point at the Go runtime.

If a behavior graduates from this directory into the shipped product surface, land the Go runtime and Go acceptance proof in the same slice.
