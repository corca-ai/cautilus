# Go Runtime Consolidation Premortem

## Decision

The pending decision is to consolidate shipped `Cautilus` runtime seams onto Go-owned implementations while leaving tests and maintainer tooling free to remain in JS when they are not part of the shipped runtime contract.
Success means the public runtime boundary becomes singular and honest without turning the migration into a repo-wide language rewrite.
Out of scope for this review are release-tooling rewrites, JS test removal, and broad packet redesign.

## Method Note

The canonical premortem path in the shared skill expects delegated fresh-eye subagents.
This session did not include explicit user authorization for delegated subagents, so this review uses a bounded local multi-angle pass instead of the canonical delegated path.

## Angles

- Product boundary honesty
- Consumer compatibility and rollout risk
- Implementation and test churn
- Operator and docs drift

## Findings

### Product Boundary Honesty

If direct Node entrypoints remain documented as normal shipped usage after the Go migration starts, the repo will still have two effective runtime authorities.
That would recreate the same ambiguity this migration is meant to remove.

### Consumer Compatibility And Rollout Risk

Some consumers may already reference `node scripts/agent-runtime/...` in checked-in adapters or wrappers.
Removing those paths abruptly could create avoidable breakage even when the Go replacement is correct.

### Implementation And Test Churn

If the migration tries to absorb every packet builder, helper, and test harness in one sweep, the work will stall on volume rather than on architectural difficulty.
The highest-risk seams are process-owning runtime commands, not every supporting utility.

### Operator And Docs Drift

The repo currently teaches several direct Node runtime commands in docs and references.
A half-finished migration could leave the code more correct than the docs, which would still steer maintainers and consumers toward the wrong boundary.

## Counterweight Triage

### Act Before Ship

- Define completion in terms of Go ownership of shipped runtime semantics, not in terms of deleting every JS file.
- Decide and document whether direct Node runtime paths get one transition release as shims or are removed immediately per seam.
- Update docs and adapter guidance in the same slice that changes a seam's authoritative implementation.

### Bundle Anyway

- Keep JS tests during the first migration stages.
- Leave release and maintainer tooling in JS unless they become a blocking source of runtime-policy drift.
- Keep explicit experiments under non-shipping directories even if they stay Node-based.

### Over-Worry

- "We must port every JS helper before any runtime seam can be declared Go-owned."
- "The repo is inconsistent unless tests are rewritten in Go too."
- "Release tooling in Node invalidates a Go-owned standalone runtime."

### Valid but Defer

- Generating shared schema/version constants from one source of truth.
- Collapsing packet-builder duplicates that are not themselves high-risk runtime seams.
- Removing compatibility shims after one or more releases once consumer usage is known.

## Deliberately Not Doing

- We are not using this migration to justify unrelated packet redesign.
- We are not treating experimental optimize-search harnesses as part of the immediate shipped runtime boundary.
- We are not promising a zero-shim cutover before checking whether current adapters still depend on Node entrypoints.

## Next Move

- Use [docs/contracts/go-runtime-consolidation.md](../contracts/go-runtime-consolidation.md) as the canonical implementation contract.
- Start with `run-executor-variants` and `evaluate-adapter-mode`, then move the workbench and live-run seams.
- In the same first implementation slice, decide the compatibility-shim policy and update the shipped docs so the preferred path is unambiguously `cautilus ...`.
