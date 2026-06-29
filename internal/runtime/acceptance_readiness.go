package runtime

import "sort"

// Acceptance readiness gate: the skip-time half of the risk-tier policy. It is a
// read-only report over scenario history that catches a `required` acceptance
// target which was never read (and never waived) before a finalist is accepted,
// the case the read-time enforcement in `cautilus evaluate acceptance` cannot see.
// See docs/contracts/acceptance-risk-tier.md Implementation Status item 5.

const (
	// AcceptanceReadinessSatisfied marks a target whose acceptance read was run
	// (recorded in scenario history) or whose skip was explicitly waived.
	AcceptanceReadinessSatisfied = "satisfied"
	// AcceptanceReadinessBlocked marks a `required` target with neither a recorded
	// read nor a waiver: the accept step must not proceed silently.
	AcceptanceReadinessBlocked = "blocked"
	// AcceptanceReadinessSkipPendingWaiver marks an `optional`/default target with
	// neither a read nor a waiver. It never blocks; it flags that skipping the read
	// should be recorded as a waiver-on-skip.
	AcceptanceReadinessSkipPendingWaiver = "skip_pending_waiver"
	// AcceptanceReadinessExempt marks a `skippable` target: no read is expected and
	// a missing read is neither blocked nor waiver-worthy.
	AcceptanceReadinessExempt = "exempt"
)

// BuildAcceptanceReadiness reports, per adapter-declared acceptance target,
// whether its risk-tier acceptance-read requirement is met by scenario history.
//
// It is strictly read-only: it never records a waiver. A `required` target with
// no recorded read and no waiver is `blocked` and flips `ready` to false; an
// `optional`/default target without either is `skip_pending_waiver` (non-blocking);
// a `skippable` target is `exempt`. A nil/empty history fails closed — every
// `required` target with nothing recorded is blocked.
//
// The gate enumerates only the targets the adapter declares in
// `acceptance_risk.targets`. Undeclared targets inherit `defaultEffect` (surfaced
// here) but cannot be enumerated by this gate; the read-time `--target` path on
// `cautilus evaluate acceptance` enforces an undeclared target at accept time.
func BuildAcceptanceReadiness(acceptanceRisk map[string]any, history map[string]any) map[string]any {
	readTargets := acceptanceTargetIDsWithEntry(history, "acceptanceReads")
	waivedTargets := acceptanceTargetIDsWithEntry(history, "acceptanceWaivers")

	declared := asMap(acceptanceRisk["targets"])
	ids := make([]string, 0, len(declared))
	for id := range declared {
		ids = append(ids, id)
	}
	sort.Strings(ids)

	targets := make([]any, 0, len(ids))
	blocked := []any{}
	pending := []any{}
	for _, id := range ids {
		resolved := ResolveAcceptanceRiskTier(acceptanceRisk, id)
		_, hasRead := readTargets[id]
		_, hasWaiver := waivedTargets[id]
		status := AcceptanceReadinessSatisfied
		switch resolved.Effect {
		case AcceptanceEffectSkippable:
			status = AcceptanceReadinessExempt
		case AcceptanceEffectRequired:
			if !hasRead && !hasWaiver {
				status = AcceptanceReadinessBlocked
			}
		default: // optional, and any target resolved to the optional default
			if !hasRead && !hasWaiver {
				status = AcceptanceReadinessSkipPendingWaiver
			}
		}
		targets = append(targets, map[string]any{
			"target":    id,
			"tier":      resolved.Tier,
			"effect":    resolved.Effect,
			"status":    status,
			"hasRead":   hasRead,
			"hasWaiver": hasWaiver,
		})
		switch status {
		case AcceptanceReadinessBlocked:
			blocked = append(blocked, id)
		case AcceptanceReadinessSkipPendingWaiver:
			pending = append(pending, id)
		}
	}

	return map[string]any{
		"defaultEffect":            ResolveAcceptanceRiskTier(acceptanceRisk, "").Effect,
		"targets":                  targets,
		"blockedTargets":           blocked,
		"skipPendingWaiverTargets": pending,
		"ready":                    len(blocked) == 0,
	}
}

// acceptanceTargetIDsWithEntry collects the set of non-empty acceptance target
// ids present under a scenario-history array key (acceptanceReads or
// acceptanceWaivers). Entries recorded before target ids were carried have no
// targetId and are skipped, so they never falsely satisfy a declared target.
func acceptanceTargetIDsWithEntry(history map[string]any, key string) map[string]struct{} {
	ids := map[string]struct{}{}
	if history == nil {
		return ids
	}
	for _, raw := range arrayOrEmpty(history[key]) {
		if id := stringOrEmpty(asMap(raw)["targetId"]); id != "" {
			ids[id] = struct{}{}
		}
	}
	return ids
}
