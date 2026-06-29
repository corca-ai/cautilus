# Acceptance Risk Tier

Status: Partially implemented for [issue #51](https://github.com/spilist/cautilus/issues/51) follow-up.
This contract decides the policy axis that the [final-acceptance-set.md](./final-acceptance-set.md) mechanism left in Deferred Decisions: the axis, the product-owned effect vocabulary, the product/adapter ownership split, and the default.
The command-side enforcement has landed — the adapter `acceptance_risk` block parser, the per-tier reliability floor, and the block-or-waiver decision in `cautilus evaluate acceptance` — proving the read-time success criteria.
What remains is the skip-case readiness gate: detecting and dispositioning a `required` target that was *never read* (so the read is enforced before accept) and recording a waiver-on-skip for `optional`/default targets. That gate is a distinct surface (doctor/readiness over scenario history) and is the next slice; see Implementation Status.

`Cautilus` should let a host declare which acceptance targets must read the optimizer-untouchable acceptance surface before a finalist is accepted, without the product ever defining what counts as high or low risk.

## Problem

The final-acceptance-set mechanism shipped as advisory-only.
`cautilus evaluate acceptance` reads a finalist on the post-hoc acceptance set, reports the generalization gap with a contamination guard and a reliability flag, and recommends `accept` or `review`, but it never decides whether reading the acceptance set was mandatory ([final-acceptance-set.md](./final-acceptance-set.md) lines 46 and 92-94).

Today every acceptance target is effectively the same: an operator can accept a finalist having never authored or read an acceptance set, and the only standing signal is the held-out exposure count.
The mechanism contract already declares that a skipped acceptance read "must be recorded as an explicit waiver" ([final-acceptance-set.md](./final-acceptance-set.md) lines 101-102), but there is no policy axis that distinguishes a target where skipping is a routine, no-cost choice from a target where skipping is a risk that must be surfaced and waived.

The missing piece is a single axis that marks, per target, whether the acceptance read is `required`, `optional`, or `skippable`.
It reuses the *ownership-split discipline* of the search-budget tier — a closed product-owned vocabulary the adapter cannot rename, plus adapter-owned numeric limits — but inverts which vocabulary the product owns: here the product owns the effect labels (not the tier names), while the adapter owns the tier names, which targets map to which tier, and the numeric thresholds ([improvement-search.md](./improvement-search.md) lines 65-66).

## Capability Contract

A host can declare, per acceptance target, a risk tier whose acceptance effect is `required`, `optional`, or `skippable`, so that accepting a finalist on a `required` target without a clean, reliable acceptance read is blocked unless an explicit waiver is recorded, while a `skippable` target accepts with no acceptance read and no waiver.

The product owns only the closed effect vocabulary and what each effect means at the accept step.
It does not own tier names, the number of tiers, which target is which tier, or any notion of what makes a target risky.

## Current Slice

This slice is the contract decision, not the enforcement.
It fixes:

- the axis: an acceptance target carries one adapter-named risk tier, and a tier declares exactly one product-owned acceptance effect
- the product-owned effect enum `required` / `optional` / `skippable` and the accept-step semantics of each value
- the ownership split: the product owns the effect enum and its meaning; the adapter owns tier names, the target-to-tier mapping, and the per-tier numeric thresholds
- the default effect for a target with no adapter declaration
- that the reliability floor becomes an adapter-owned, optionally per-tier threshold (the deferred trigger condition is now met), while the gap tolerance stays a fixed product constant

The adapter block parser, the per-tier reliability floor, and the read-time block-or-waiver enforcement in `cautilus evaluate acceptance` have since landed (see Implementation Status).
The skip-time readiness gate — catching a `required` target that was never read — is the one remaining slice.

## Entities

- `acceptance target`: the consumer-owned unit — the prompt file or behavior under improvement — that a finalist is accepted onto, and the unit a risk tier is attached to. The product does not enumerate these targets; the adapter identifies them. Shortened to `target` below.
  This term is chosen deliberately to avoid the product-owned `BehaviorSurface` enum in [intent.go](../../internal/runtime/intent.go) lines 16-33, which is a closed catalog of evaluated-behavior *categories* (`operator_behavior`, `conversation_continuity`, …) that the intent profile validates against. The tiered unit here is a consumer target, not a value of that enum, so the adapter keys the target-to-tier mapping by the target file or an adapter-declared id, never by the product enum; an implementer must not conflate the two.
- `risk tier`: an adapter-named category attached to one or more acceptance targets. Its name and meaning are adapter-owned; its only product-visible property is its acceptance effect.
- `acceptance effect`: the product-owned, closed enum `required` | `optional` | `skippable` that a risk tier declares, fixing how the accept step treats a missing acceptance read for that target.
- `waiver`: an explicit, recorded acknowledgement that a finalist was accepted on a target without the acceptance read its tier would otherwise require, so a skipped read is visible rather than silent.
- `reliability floor`: the minimum clean acceptance-scenario count at or above which a read is `reliable`; with this contract it becomes an adapter-owned threshold (default still the product constant) and may be set per tier.

## Acceptance Effect Semantics

These three meanings are the load-bearing product contract; the adapter chooses which target gets which effect, but it cannot redefine what an effect does.

- `required`: accepting a finalist on this target must be backed by an acceptance read that is clean (the contamination guard did not return `blocked`) and reliable (`reliability: reliable`) and recommends `accept`, or by an explicit recorded waiver. Absent both, the accept step is blocked. A `low_confidence` or `review`-recommending read does not by itself satisfy `required`; it must be escalated to a waiver or resolved with a larger or cleaner acceptance set.
- `optional`: an acceptance read is recommended but not mandatory. If it is skipped, the skip is recorded as an explicit waiver and the held-out exposure count stands as the detection-lite signal, but the accept step is not blocked.
- `skippable`: no acceptance read is expected. A missing read is neither blocked nor waiver-worthy; the held-out exposure count is the only standing signal. This is the explicit opt-out an adapter declares for genuinely low-stakes targets.

The advisory nature of the read itself is unchanged: even on a `required` target the read never auto-rejects or auto-applies a candidate.
`required` blocks a *silent* accept; a human can still record a waiver and proceed, because rejection and override stay human acts ([final-acceptance-set.md](./final-acceptance-set.md) lines 92-94).

## Fixed Decisions

- The product owns exactly the three effect labels `required`, `optional`, `skippable`, and adapters may not rename or extend them, mirroring the search-budget tier-label rule ([improvement-search.md](./improvement-search.md) line 66).
  Unlike the budget tiers, the tier *names* themselves are adapter-owned and open-ended; only the effect a tier declares is product vocabulary.
  This split keeps risk categorization host-owned (the product never ships "critical" or "low-risk" names) while keeping the accept-step behavior of each effect a product guarantee.
- The default acceptance effect for an acceptance target with no adapter tier declaration is `optional`.
  This default honors a declared-but-unimplemented intent rather than an already-shipped behavior, and the contract says so plainly: the mechanism contract declared that a skipped acceptance read "must be recorded as an explicit waiver" ([final-acceptance-set.md](./final-acceptance-set.md) lines 101-102), but the shipped first slice never implemented a waiver — there is no skip-detection, accept-step gate, or waiver record anywhere in the runtime today, so a skipped read currently costs nothing.
  Defaulting to `optional` is therefore net-new enforcement: the implementation slice will, for the first time, emit a waiver for every undeclared target that skips the read.
  The strictly zero-churn alternative is to default to `skippable` (a skip stays free and silent); this contract deliberately chooses intent-fidelity over zero-churn, because the encoded mechanism intent is that a skip is a visible waiver event, not a free no-op, and `optional` still never blocks the accept step.
  The product must not default to `required` (it would force acceptance on every repo, a Non-Goal at [final-acceptance-set.md](./final-acceptance-set.md) line 128) and must not invent a risk category to justify a stricter default.
- An acceptance target carries exactly one risk tier, and a tier declares exactly one acceptance effect, so the axis stays single-valued and legible.
- The reliability floor becomes an adapter-owned numeric threshold, optionally per tier, defaulting to the existing product constant (`AcceptanceReliabilityFloor`, currently 10) when unset.
  Risk tiers are the "real consumer need for a different floor" that [final-acceptance-set.md](./final-acceptance-set.md) line 117 named as the trigger for adapter-configurability: a `required` high-stakes tier may demand a higher floor than a default target, and the floor directly gates whether a `required` read counts as satisfied.
- The gap tolerance stays a fixed product constant and does not become adapter-configurable or per-tier in this slice.
  Risk tiers decide *whether* the acceptance read is required, not how large a generalization gap is tolerable; the accept/review boundary should stay uniform so a high-risk tier cannot paradoxically be configured to accept a larger gap, and the mechanism contract deferred only the reliability floor, not the gap tolerance ([final-acceptance-set.md](./final-acceptance-set.md) line 117 and the carried handoff caveat).
  The runtime already accepts both the floor and the tolerance as parameters (`BuildAcceptanceReport(... reliabilityFloor int, gapTolerance float64 ...)` in [acceptance.go](../../internal/runtime/acceptance.go) line 31), so this asymmetry is a deliberate *policy* choice layered over a mechanism that treats the two symmetrically, not a runtime limitation; the implementation slice that makes the floor adapter-resolvable is correspondingly small.
- Risk-tier policy governs only the acceptance read in this contract.
  It is not a generic risk framework over other gates; if a future target needs tiering it gets its own contract decision rather than silently inheriting this enum.

## Probe Questions

All four probes were resolved against repo truth during implementation.

- Resolved: risk tiers live in a new top-level adapter `acceptance_risk` block, validated in [adapter.go](../../internal/runtime/adapter.go) beside `improve_search` (`validateAdapterAcceptanceRisk`). Shape: `default_effect`, `tiers.<name>.{effect, reliability_floor}`, and `targets.<id>: <tier-name>`.
- Resolved: the acceptance target is keyed by an explicit `--target <id>` flag on `cautilus evaluate acceptance`, matched against the adapter `targets` map. The caller (operator or agent) names the target it is accepting, rather than the product deriving identity from the `cautilus.improve_search_result.v1` paths — which carry no top-level target key and would make prompt-file-path the fragile identity the draft flagged. An absent `--target` resolves to the default effect.
- Resolved: the waiver is recorded in scenario history under a new `acceptanceWaivers` array (`RecordAcceptanceWaiver`), beside `acceptanceReads`, carrying timestamp, candidate id, target id, tier, effect, and reason. The report also carries a `waiver` object when an override is taken.
- Resolved (read-time) / deferred (skip-time): `cautilus evaluate acceptance` enforces the block when a read is run. The `cautilus doctor`/readiness skip-gate that catches a `required` target never read at all is the remaining slice (Implementation Status).

## Deferred Decisions

- Any per-target override richer than one tier per target (for example, time-boxed waivers that expire, or tier escalation rules).
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

- Keep the adapter schema repo-agnostic: the product validates the effect enum and the block shape, never the tier names or target ids beyond shape (AGENTS.md working rules).
- Mirror the budget-tier ownership *discipline* rather than inventing a parallel ownership model: a closed product-owned vocabulary the adapter cannot rename, plus adapter-owned numeric limits ([improvement-search.md](./improvement-search.md) lines 65-66). The product-owned vocabulary here is the effect enum, not the tier names — the inversion from the budget tier, where the labels themselves are product-owned.
- Any schema change the implementation slice introduces (an adapter block field, a waiver record shape, or a report field) lands with explicit contract-version registration in both the Node and Go contract-version surfaces, matching the discipline in [final-acceptance-set.md](./final-acceptance-set.md) lines 149-150.
- Preserve the advisory guarantee: the acceptance read still never auto-applies or auto-rejects, even under `required` ([final-acceptance-set.md](./final-acceptance-set.md) lines 92-94).

## Success Criteria

Read-time criteria are proven by the landed slice; the two skip-time criteria are carried by the deferred readiness gate.

- Proven: an adapter can map an acceptance target to a `required` tier, and running the read on that target without a clean, reliable, `accept`-recommending result and without a `--waiver` is blocked (`TestCLIEvaluateAcceptanceRequiredTierBlocksWithoutWaiverAndProceedsWithWaiver`).
- Deferred (skip-gate): an `optional` (or default) target whose read is *skipped entirely* records a waiver-on-skip but does not block. The read-time half — an `optional`/`skippable` read never blocks — is proven (`TestCLIEvaluateAcceptanceSkippableAndUndeclaredTargetsNeverBlock`); the skip-detection half needs the readiness gate.
- Deferred (skip-gate): a `skippable` target accepts a finalist with *no acceptance read at all*. The read-time half is proven by the same test; enforcing it without any read needs the readiness gate.
- Proven: an adapter block that renames or adds an acceptance-effect value is rejected with a clear error; tier names and target ids are not constrained beyond shape (`TestValidateAdapterAcceptanceRiskRejectsRenamedEffect`, `TestValidateAdapterAcceptanceRiskAcceptsArbitraryNamesAndTargets`).
- Proven: a per-tier `reliability_floor` overrides the product default for reads on that tier's targets, and an unset floor falls back to the product constant (`TestResolveAcceptanceRiskTierDeclaredTargetWithPerTierFloor`, `TestCLIEvaluateAcceptanceRequiredTierAcceptsWithPerTierFloor`).
- Proven: the gap tolerance is identical across tiers and is not adapter-overridable (the adapter block has no gap-tolerance key; `AcceptanceGapTolerance` stays the only source).

## Acceptance Checks

These are planned tests for the implementation slice, listed so each success criterion implies at least one check; they are not green yet.

- Policy test: a `required` target with no acceptance read and no waiver yields a blocked accept; the same target with a recorded waiver proceeds; a `required` target backed by a clean reliable `accept` read proceeds without a waiver.
- Policy test: an `optional` (and a default, undeclared) target with no read proceeds and emits a recorded waiver; a `skippable` target with no read proceeds and emits no waiver.
- Schema/validation test: an adapter block declaring an effect outside `{required, optional, skippable}` is rejected; a block with arbitrary tier names and target ids on those three effects validates.
- Threshold test: a tier with a `reliability_floor` above the clean acceptance count flips the read to `low_confidence` (and, on a `required` tier, to a blocked-or-waiver path) where the product-default floor would have passed; an unset floor reproduces the current default behavior.
- Invariant test: the gap tolerance used for the `accept`/`review` boundary is unchanged across tiers and is not read from the adapter block.

## Critique

A bounded fresh-eye critique ran against this draft before the implementation slice (verdict `revise`: 0 blockers, 2 should-fix, 2 nits, all verified against the runtime and folded in here).

Resolved in this revision:

- The `optional`-default justification was corrected from "matches already-shipped behavior" to the honest framing that no waiver mechanism exists in the runtime today (`grep waiver internal/**/*.go` is empty; `RecordAcceptanceRead` records reads, never skips), so the default is net-new enforcement of a declared-but-unimplemented intent, and the contract now states that `skippable` is the zero-churn alternative this slice deliberately rejects in favor of intent-fidelity.
- Target identity was promoted from a routine probe to a flagged near-now decision, and the tiered unit was renamed from "behavior surface" to `acceptance target` to avoid colliding with the product-owned `BehaviorSurface` enum in [intent.go](../../internal/runtime/intent.go); the missing target key on `cautilus.improve_search_result.v1` is now called out in Entities and Probe Questions.
- The "mirrors budget-tier ownership" claim was rewritten everywhere it appeared so the inversion (product owns the effect enum, not the tier names) is explicit rather than implied, removing the skim-misread risk.
- The reliability-floor / gap-tolerance asymmetry was confirmed principled and re-grounded: the runtime already accepts both as parameters, so the split is a deliberate policy choice over a symmetric mechanism, and the contract now says so.

Adequately handled without change (recorded so they are not reopened): the `required` semantics map cleanly onto the existing `status`/`recommendation`/`reliability`/`reasonCodes` fields and are never weaker than today's advisory accept; single-tier-per-target and single-effect-per-tier are correctly deferred for v1.

The remaining open items (adapter block shape, exact target-key mechanism, waiver record location) are genuine implementation-discovery probes, not unresolved contract decisions.

The default-effect (`optional`), the `required` waiver-escape teeth, and the rename to `acceptance target` were confirmed with the user in a contract review after the critique.

A second bounded fresh-eye critique ran against the landed implementation (verdict `ready`: 0 blockers, 1 should-fix, 1 nit, verified against the runtime). It confirmed the `required` decision keyed off `recommendation == "accept"` is equivalent to — not weaker than — the contract's clean-and-reliable-and-accept bar, that the product invents no risk category, and that the read-time-proven / skip-time-deferred split is honest. The should-fix — an invalid adapter with a declared `acceptance_risk` block (including `default_effect: required`) failing open when no `--target` was named — was folded in: the command now fails closed whenever a policy was intended, covered by `TestCLIEvaluateAcceptanceInvalidAdapterWithPolicyFailsClosed`.

## Canonical Artifact

This document is the canonical build contract for the acceptance risk-tier policy.
It sits beside [final-acceptance-set.md](./final-acceptance-set.md) and [improvement-search.md](./improvement-search.md) and references them rather than restating their rules.
[final-acceptance-set.md](./final-acceptance-set.md) Deferred Decisions points here as the resolution of its risk-tier and reliability-floor entries.

## Implementation Status

Landed (read-time enforcement):

1. The adapter `acceptance_risk` block is parsed and validated in [adapter.go](../../internal/runtime/adapter.go) (`validateAdapterAcceptanceRisk`): the closed effect enum is enforced, renamed values are rejected, per-tier `reliability_floor` must be a positive integer, and a target must reference a declared tier. Tier names and target ids are unconstrained.
2. `ResolveAcceptanceRiskTier` in [risk_tier.go](../../internal/runtime/risk_tier.go) turns a target id into its effect and reliability floor, defaulting an undeclared target to `optional` and the product `AcceptanceReliabilityFloor`. The resolved floor is threaded into `BuildAcceptanceReport`.
3. `cautilus evaluate acceptance` ([app.go](../../internal/app/app.go) `handleEvalAcceptance`) takes `--target`, `--waiver`, and `--repo-root`/`--adapter[-name]`, surfaces a `riskTier` block and an `acceptanceDecision`, blocks a `required` target whose read is not a clean reliable `accept` and has no waiver (exit 1), and records a `--waiver` override in scenario history (`RecordAcceptanceWaiver`). An invalid adapter fails closed whenever an acceptance-risk policy was intended — a `--target` is named or an `acceptance_risk` block was declared (even one that failed validation) — so an invalid adapter can never silently downgrade a `required` policy, including a `default_effect: required`.
4. The new fields (`riskTier`, `acceptanceDecision`, `waiver` on the report; `acceptanceWaivers` in history) extend `cautilus.acceptance_report.v1` and scenario history additively; neither has a strict schema validator, so no contract-version bump is required, and the existing `AcceptanceReportSchema` constant is unchanged.

Remaining (skip-time enforcement — next slice):

5. A `cautilus doctor`/readiness skip-gate that, for each `required` target, checks scenario history for a recorded acceptance read or waiver and reports the target blocked when neither exists, and records a waiver-on-skip for `optional`/default targets accepted without a read. This needs the acceptance read record to also carry the target id (today `RecordAcceptanceRead` records only candidate id and scenario ids), so the gate can match a read to a target. `skippable` targets are exempt.
