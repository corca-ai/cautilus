# Acceptance Risk Tier

Status: Specified for [issue #51](https://github.com/spilist/cautilus/issues/51) follow-up; implementation deferred.
This contract decides the policy axis that the [final-acceptance-set.md](./final-acceptance-set.md) mechanism left in Deferred Decisions.
It defines the axis, the product-owned effect vocabulary, the product/adapter ownership split, and the default; it ships no code in this slice.
The enforcement seam (block-or-waiver on `required`, the waiver record, the adapter block parser, and reliability-floor adapter-configurability) is the next implementation slice.

`Cautilus` should let a host declare which behavior surfaces must read the optimizer-untouchable acceptance surface before a finalist is accepted, without the product ever defining what counts as high or low risk.

## Problem

The final-acceptance-set mechanism shipped as advisory-only.
`cautilus evaluate acceptance` reads a finalist on the post-hoc acceptance set, reports the generalization gap with a contamination guard and a reliability flag, and recommends `accept` or `review`, but it never decides whether reading the acceptance set was mandatory ([final-acceptance-set.md](./final-acceptance-set.md) lines 46 and 92-94).

Today every behavior surface is effectively the same: an operator can accept a finalist having never authored or read an acceptance set, and the only standing signal is the held-out exposure count.
The mechanism contract already declares that a skipped acceptance read "must be recorded as an explicit waiver" ([final-acceptance-set.md](./final-acceptance-set.md) lines 101-102), but there is no policy axis that distinguishes a surface where skipping is a routine, no-cost choice from a surface where skipping is a risk that must be surfaced and waived.

The missing piece is a single axis that marks, per surface, whether the acceptance read is `required`, `optional`, or `skippable`.
It reuses the *ownership-split discipline* of the search-budget tier — a closed product-owned vocabulary the adapter cannot rename, plus adapter-owned numeric limits — but inverts which vocabulary the product owns: here the product owns the effect labels (not the tier names), while the adapter owns the tier names, which surfaces map to which tier, and the numeric thresholds ([improvement-search.md](./improvement-search.md) lines 65-66).

## Capability Contract

A host can declare, per behavior surface, a risk tier whose acceptance effect is `required`, `optional`, or `skippable`, so that accepting a finalist on a `required` surface without a clean, reliable acceptance read is blocked unless an explicit waiver is recorded, while a `skippable` surface accepts with no acceptance read and no waiver.

The product owns only the closed effect vocabulary and what each effect means at the accept step.
It does not own tier names, the number of tiers, which surface is which tier, or any notion of what makes a surface risky.

## Current Slice

This slice is the contract decision, not the enforcement.
It fixes:

- the axis: a behavior surface carries one adapter-named risk tier, and a tier declares exactly one product-owned acceptance effect
- the product-owned effect enum `required` / `optional` / `skippable` and the accept-step semantics of each value
- the ownership split: the product owns the effect enum and its meaning; the adapter owns tier names, the surface-to-tier mapping, and the per-tier numeric thresholds
- the default effect for a surface with no adapter declaration
- that the reliability floor becomes an adapter-owned, optionally per-tier threshold (the deferred trigger condition is now met), while the gap tolerance stays a fixed product constant

It does not ship the adapter block parser, the block-or-waiver enforcement, the waiver record, or the reliability-floor wiring.
Those are the First Implementation Slice below, intentionally held for a separate slice after this contract is reviewed.

## Entities

- `behavior surface`: the consumer-owned target (the prompt file or behavior under improvement) that a finalist is accepted onto, and the unit a risk tier is attached to. The product does not enumerate these surfaces; the adapter identifies them.
  This is deliberately distinct from the product-owned `BehaviorSurface` enum in [intent.go](../../internal/runtime/intent.go) lines 16-33, which is a closed catalog of evaluated-behavior *categories* (`operator_behavior`, `conversation_continuity`, …) that the intent profile validates against. The tiered unit here is a consumer target, not a value of that enum, so the adapter keys the surface-to-tier mapping by the target file or an adapter-declared id, never by the product enum; an implementer must not conflate the two.
- `risk tier`: an adapter-named category attached to one or more behavior surfaces. Its name and meaning are adapter-owned; its only product-visible property is its acceptance effect.
- `acceptance effect`: the product-owned, closed enum `required` | `optional` | `skippable` that a risk tier declares, fixing how the accept step treats a missing acceptance read for that surface.
- `waiver`: an explicit, recorded acknowledgement that a finalist was accepted on a surface without the acceptance read its tier would otherwise require, so a skipped read is visible rather than silent.
- `reliability floor`: the minimum clean acceptance-scenario count at or above which a read is `reliable`; with this contract it becomes an adapter-owned threshold (default still the product constant) and may be set per tier.

## Acceptance Effect Semantics

These three meanings are the load-bearing product contract; the adapter chooses which surface gets which effect, but it cannot redefine what an effect does.

- `required`: accepting a finalist on this surface must be backed by an acceptance read that is clean (the contamination guard did not return `blocked`) and reliable (`reliability: reliable`) and recommends `accept`, or by an explicit recorded waiver. Absent both, the accept step is blocked. A `low_confidence` or `review`-recommending read does not by itself satisfy `required`; it must be escalated to a waiver or resolved with a larger or cleaner acceptance set.
- `optional`: an acceptance read is recommended but not mandatory. If it is skipped, the skip is recorded as an explicit waiver and the held-out exposure count stands as the detection-lite signal, but the accept step is not blocked.
- `skippable`: no acceptance read is expected. A missing read is neither blocked nor waiver-worthy; the held-out exposure count is the only standing signal. This is the explicit opt-out an adapter declares for genuinely low-stakes surfaces.

The advisory nature of the read itself is unchanged: even on a `required` surface the read never auto-rejects or auto-applies a candidate.
`required` blocks a *silent* accept; a human can still record a waiver and proceed, because rejection and override stay human acts ([final-acceptance-set.md](./final-acceptance-set.md) lines 92-94).

## Fixed Decisions

- The product owns exactly the three effect labels `required`, `optional`, `skippable`, and adapters may not rename or extend them, mirroring the search-budget tier-label rule ([improvement-search.md](./improvement-search.md) line 66).
  Unlike the budget tiers, the tier *names* themselves are adapter-owned and open-ended; only the effect a tier declares is product vocabulary.
  This split keeps risk categorization host-owned (the product never ships "critical" or "low-risk" names) while keeping the accept-step behavior of each effect a product guarantee.
- The default acceptance effect for a behavior surface with no adapter tier declaration is `optional`.
  This default honors a declared-but-unimplemented intent rather than an already-shipped behavior, and the contract says so plainly: the mechanism contract declared that a skipped acceptance read "must be recorded as an explicit waiver" ([final-acceptance-set.md](./final-acceptance-set.md) lines 101-102), but the shipped first slice never implemented a waiver — there is no skip-detection, accept-step gate, or waiver record anywhere in the runtime today, so a skipped read currently costs nothing.
  Defaulting to `optional` is therefore net-new enforcement: the implementation slice will, for the first time, emit a waiver for every undeclared surface that skips the read.
  The strictly zero-churn alternative is to default to `skippable` (a skip stays free and silent); this contract deliberately chooses intent-fidelity over zero-churn, because the encoded mechanism intent is that a skip is a visible waiver event, not a free no-op, and `optional` still never blocks the accept step.
  The product must not default to `required` (it would force acceptance on every repo, a Non-Goal at [final-acceptance-set.md](./final-acceptance-set.md) line 128) and must not invent a risk category to justify a stricter default.
- A behavior surface carries exactly one risk tier, and a tier declares exactly one acceptance effect, so the axis stays single-valued and legible.
- The reliability floor becomes an adapter-owned numeric threshold, optionally per tier, defaulting to the existing product constant (`AcceptanceReliabilityFloor`, currently 10) when unset.
  Risk tiers are the "real consumer need for a different floor" that [final-acceptance-set.md](./final-acceptance-set.md) line 117 named as the trigger for adapter-configurability: a `required` high-stakes tier may demand a higher floor than a default surface, and the floor directly gates whether a `required` read counts as satisfied.
- The gap tolerance stays a fixed product constant and does not become adapter-configurable or per-tier in this slice.
  Risk tiers decide *whether* the acceptance read is required, not how large a generalization gap is tolerable; the accept/review boundary should stay uniform so a high-risk tier cannot paradoxically be configured to accept a larger gap, and the mechanism contract deferred only the reliability floor, not the gap tolerance ([final-acceptance-set.md](./final-acceptance-set.md) line 117 and the carried handoff caveat).
  The runtime already accepts both the floor and the tolerance as parameters (`BuildAcceptanceReport(... reliabilityFloor int, gapTolerance float64 ...)` in [acceptance.go](../../internal/runtime/acceptance.go) line 31), so this asymmetry is a deliberate *policy* choice layered over a mechanism that treats the two symmetrically, not a runtime limitation; the implementation slice that makes the floor adapter-resolvable is correspondingly small.
- Risk-tier policy governs only the acceptance read in this contract.
  It is not a generic risk framework over other gates; if a future surface needs tiering it gets its own contract decision rather than silently inheriting this enum.

## Probe Questions

These resolve during the implementation slice against the real adapter and search-result shapes, not now.

- The exact adapter block shape and key: whether risk tiers live in a new top-level `acceptance_risk` block or nest under an existing acceptance/evaluate block, following the `improve_search` block precedent ([improvement-search.md](./improvement-search.md) lines 206-235).
- How a behavior surface is keyed for the surface-to-tier mapping, which is closer to a now-decision than routine discovery: the `cautilus.improve_search_result.v1` record the acceptance read consumes currently exposes no top-level surface key — only `inputFile` and `improveInputFile` paths ([result.schema.json](../../fixtures/improve-search/result.schema.json)), with the target recoverable only indirectly through the improve input. So the implementation slice must either thread a stable surface key onto the result (a registered schema change) or define a canonical recovery path from `improveInputFile` to the target, and it must treat prompt-file-path-as-identity as fragile, because renaming the target file would silently break the tier mapping.
- Where the waiver is durably recorded: alongside `acceptanceReads` in scenario history, inside the `cautilus.acceptance_report.v1` packet, or in a separate accept-step ledger, and what identifying fields it must carry to be auditable.
- Which command and readiness surfaces enforce the block: `cautilus evaluate acceptance`, `cautilus doctor`/readiness, and/or the human accept step in [operator-acceptance.md](../maintainers/operator-acceptance.md), and how a `required` block is reported there.

## Deferred Decisions

- Any per-surface override richer than one tier per surface (for example, time-boxed waivers that expire, or tier escalation rules).
- Multi-finalist acceptance under a tier, carried from [final-acceptance-set.md](./final-acceptance-set.md) line 119; v1 still reads one selected finalist.
- Tiering of any gate other than the acceptance read.
- Adapter-configurability of the gap tolerance, which stays out of scope until a concrete consumer need is shown and separately justified.

## Non-Goals

- Defining risk categories or any high-risk / low-risk semantics inside the product.
- Making the acceptance read required by default, which would force the mechanism on every repo.
- Per-tier gap tolerance or any per-tier re-tuning of the accept/review boundary.
- Auto-rejecting or auto-applying a candidate on any tier; the read stays advisory.
- Implementing the enforcement, the adapter parser, or the waiver record in this slice.

## Deliberately Not Doing

- Moving the gap tolerance to the adapter.
  The handoff caveat is explicit that gap-tolerance adapter-ization is not auto-carried from the mechanism slice and needs separate justification; risk tiers justify the reliability floor (which gates the `required` effect) but not a per-tier accept boundary.
- Shipping product-owned tier names such as `critical` or `experimental`.
  Naming a tier is host policy; the product would be inventing risk categories, which the mechanism contract explicitly forbids ([final-acceptance-set.md](./final-acceptance-set.md) lines 140-141).
- Defaulting a missing declaration to `required` or `skippable`.
  `required` would force acceptance on every consumer; `skippable` would silently drop the waiver-on-skip discipline the mechanism contract already declares.
- Building the enforcement in this slice.
  The user scoped this slice to the contract decision so the ownership split and default can be reviewed before code lands.

## Constraints

- Keep the adapter schema repo-agnostic: the product validates the effect enum and the block shape, never the tier names or surface ids beyond shape (AGENTS.md working rules).
- Mirror the budget-tier ownership *discipline* rather than inventing a parallel ownership model: a closed product-owned vocabulary the adapter cannot rename, plus adapter-owned numeric limits ([improvement-search.md](./improvement-search.md) lines 65-66). The product-owned vocabulary here is the effect enum, not the tier names — the inversion from the budget tier, where the labels themselves are product-owned.
- Any schema change the implementation slice introduces (an adapter block field, a waiver record shape, or a report field) lands with explicit contract-version registration in both the Node and Go contract-version surfaces, matching the discipline in [final-acceptance-set.md](./final-acceptance-set.md) lines 149-150.
- Preserve the advisory guarantee: the acceptance read still never auto-applies or auto-rejects, even under `required` ([final-acceptance-set.md](./final-acceptance-set.md) lines 92-94).

## Success Criteria

These are the bar the implementation slice must prove; this contract slice satisfies none of them yet by design.

- An adapter can map a behavior surface to a `required` tier, and accepting a finalist on that surface without a clean, reliable, `accept`-recommending acceptance read and without a recorded waiver is blocked.
- An adapter mapping a surface to `optional` (or leaving it to the default) records a skipped read as an explicit waiver but does not block the accept step.
- A `skippable` surface accepts a finalist with no acceptance read and no waiver, leaving the held-out exposure count as the only signal.
- An adapter block that renames or adds an acceptance-effect value is rejected with a clear error; tier names and surface ids are not constrained beyond shape.
- A per-tier `reliability_floor` overrides the product default for reads on that tier's surfaces, and an unset floor falls back to the product constant.
- The gap tolerance is identical across tiers and is not adapter-overridable.

## Acceptance Checks

These are planned tests for the implementation slice, listed so each success criterion implies at least one check; they are not green yet.

- Policy test: a `required` surface with no acceptance read and no waiver yields a blocked accept; the same surface with a recorded waiver proceeds; a `required` surface backed by a clean reliable `accept` read proceeds without a waiver.
- Policy test: an `optional` (and a default, undeclared) surface with no read proceeds and emits a recorded waiver; a `skippable` surface with no read proceeds and emits no waiver.
- Schema/validation test: an adapter block declaring an effect outside `{required, optional, skippable}` is rejected; a block with arbitrary tier names and surface ids on those three effects validates.
- Threshold test: a tier with a `reliability_floor` above the clean acceptance count flips the read to `low_confidence` (and, on a `required` tier, to a blocked-or-waiver path) where the product-default floor would have passed; an unset floor reproduces the current default behavior.
- Invariant test: the gap tolerance used for the `accept`/`review` boundary is unchanged across tiers and is not read from the adapter block.

## Critique

A bounded fresh-eye critique ran against this draft before the implementation slice (verdict `revise`: 0 blockers, 2 should-fix, 2 nits, all verified against the runtime and folded in here).

Resolved in this revision:

- The `optional`-default justification was corrected from "matches already-shipped behavior" to the honest framing that no waiver mechanism exists in the runtime today (`grep waiver internal/**/*.go` is empty; `RecordAcceptanceRead` records reads, never skips), so the default is net-new enforcement of a declared-but-unimplemented intent, and the contract now states that `skippable` is the zero-churn alternative this slice deliberately rejects in favor of intent-fidelity.
- Surface identity was promoted from a routine probe to a flagged near-now decision: the `cautilus.improve_search_result.v1` record carries no top-level surface key, and the term collides with the product-owned `BehaviorSurface` enum in [intent.go](../../internal/runtime/intent.go); both are now called out in Entities and Probe Questions.
- The "mirrors budget-tier ownership" claim was rewritten everywhere it appeared so the inversion (product owns the effect enum, not the tier names) is explicit rather than implied, removing the skim-misread risk.
- The reliability-floor / gap-tolerance asymmetry was confirmed principled and re-grounded: the runtime already accepts both as parameters, so the split is a deliberate policy choice over a symmetric mechanism, and the contract now says so.

Adequately handled without change (recorded so they are not reopened): the `required` semantics map cleanly onto the existing `status`/`recommendation`/`reliability`/`reasonCodes` fields and are never weaker than today's advisory accept; single-tier-per-surface and single-effect-per-tier are correctly deferred for v1.

The remaining open items (adapter block shape, exact surface-key mechanism, waiver record location) are genuine implementation-discovery probes, not unresolved contract decisions.

## Canonical Artifact

This document is the canonical build contract for the acceptance risk-tier policy.
It sits beside [final-acceptance-set.md](./final-acceptance-set.md) and [improvement-search.md](./improvement-search.md) and references them rather than restating their rules.
[final-acceptance-set.md](./final-acceptance-set.md) Deferred Decisions points here as the resolution of its risk-tier and reliability-floor entries.

## First Implementation Slice

Held for a separate slice, after this contract is reviewed:

1. Parse an adapter risk-tier block (shape resolved in Probe Questions): tier name to acceptance effect, surface to tier, and an optional per-tier reliability floor, validating the effect enum and rejecting renamed values.
2. Make the reliability floor adapter-resolvable, per tier, defaulting to `AcceptanceReliabilityFloor`, and thread it into `BuildAcceptanceReport` in place of the fixed argument.
3. Enforce the effect at the accept step: block a `required` accept lacking a clean reliable `accept` read and a waiver, record the waiver for `optional`/default skips, and no-op for `skippable`, surfaced through the command and readiness path resolved in Probe Questions.
4. Register any new schema surface in both contract-version registries and back each success criterion with the matching acceptance check.
