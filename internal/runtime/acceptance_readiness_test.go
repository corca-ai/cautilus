package runtime

import "testing"

// riskBlock builds the validated acceptance_risk shape ResolveAcceptanceRiskTier
// consumes: tiers keyed by name to an effect, and targets keyed by id to a tier.
func riskBlock(defaultEffect string, tiers map[string]string, targets map[string]string) map[string]any {
	tierMap := map[string]any{}
	for name, effect := range tiers {
		tierMap[name] = map[string]any{"effect": effect}
	}
	targetMap := map[string]any{}
	for id, tier := range targets {
		targetMap[id] = tier
	}
	block := map[string]any{"tiers": tierMap, "targets": targetMap}
	if defaultEffect != "" {
		block["default_effect"] = defaultEffect
	}
	return block
}

func historyWithRead(targetID string) map[string]any {
	return map[string]any{"acceptanceReads": []any{map[string]any{"targetId": targetID}}}
}

func historyWithWaiver(targetID string) map[string]any {
	return map[string]any{"acceptanceWaivers": []any{map[string]any{"targetId": targetID}}}
}

func readinessTargetStatus(t *testing.T, readiness map[string]any, targetID string) map[string]any {
	t.Helper()
	for _, raw := range arrayOrEmpty(readiness["targets"]) {
		entry := asMap(raw)
		if stringOrEmpty(entry["target"]) == targetID {
			return entry
		}
	}
	t.Fatalf("target %q not present in readiness targets %#v", targetID, readiness["targets"])
	return nil
}

func TestBuildAcceptanceReadinessBlocksRequiredTargetNeverRead(t *testing.T) {
	block := riskBlock("", map[string]string{"critical": AcceptanceEffectRequired}, map[string]string{"prompts/router.md": "critical"})

	// Empty history: the required read never ran and was never waived.
	readiness := BuildAcceptanceReadiness(block, map[string]any{})
	if readiness["ready"] != false {
		t.Fatalf("a required target with no read must flip ready to false, got %#v", readiness["ready"])
	}
	if status := readinessTargetStatus(t, readiness, "prompts/router.md")["status"]; status != AcceptanceReadinessBlocked {
		t.Fatalf("expected blocked, got %#v", status)
	}
	if blockedTargets := arrayOrEmpty(readiness["blockedTargets"]); len(blockedTargets) != 1 || blockedTargets[0] != "prompts/router.md" {
		t.Fatalf("expected prompts/router.md in blockedTargets, got %#v", readiness["blockedTargets"])
	}
}

func TestBuildAcceptanceReadinessFailsClosedOnNilHistory(t *testing.T) {
	block := riskBlock("", map[string]string{"critical": AcceptanceEffectRequired}, map[string]string{"prompts/router.md": "critical"})
	readiness := BuildAcceptanceReadiness(block, nil)
	if readiness["ready"] != false {
		t.Fatalf("a required target with nil history must fail closed, got ready=%#v", readiness["ready"])
	}
	if status := readinessTargetStatus(t, readiness, "prompts/router.md")["status"]; status != AcceptanceReadinessBlocked {
		t.Fatalf("expected blocked on nil history, got %#v", status)
	}
}

func TestBuildAcceptanceReadinessSatisfiesRequiredWithReadOrWaiver(t *testing.T) {
	block := riskBlock("", map[string]string{"critical": AcceptanceEffectRequired}, map[string]string{"prompts/router.md": "critical"})

	withRead := BuildAcceptanceReadiness(block, historyWithRead("prompts/router.md"))
	if withRead["ready"] != true {
		t.Fatalf("a recorded read on the target must satisfy the gate, got ready=%#v", withRead["ready"])
	}
	if status := readinessTargetStatus(t, withRead, "prompts/router.md")["status"]; status != AcceptanceReadinessSatisfied {
		t.Fatalf("expected satisfied with a read, got %#v", status)
	}

	withWaiver := BuildAcceptanceReadiness(block, historyWithWaiver("prompts/router.md"))
	if withWaiver["ready"] != true {
		t.Fatalf("a recorded waiver on the target must satisfy the gate, got ready=%#v", withWaiver["ready"])
	}
	if status := readinessTargetStatus(t, withWaiver, "prompts/router.md")["status"]; status != AcceptanceReadinessSatisfied {
		t.Fatalf("expected satisfied with a waiver, got %#v", status)
	}
}

func TestBuildAcceptanceReadinessOptionalTargetSkipIsPendingWaiverNeverBlocks(t *testing.T) {
	block := riskBlock("", map[string]string{"routine": AcceptanceEffectOptional}, map[string]string{"prompts/help.md": "routine"})
	readiness := BuildAcceptanceReadiness(block, map[string]any{})
	if readiness["ready"] != true {
		t.Fatalf("an optional target must never block, got ready=%#v", readiness["ready"])
	}
	if status := readinessTargetStatus(t, readiness, "prompts/help.md")["status"]; status != AcceptanceReadinessSkipPendingWaiver {
		t.Fatalf("expected skip_pending_waiver for an unread optional target, got %#v", status)
	}
	if pending := arrayOrEmpty(readiness["skipPendingWaiverTargets"]); len(pending) != 1 || pending[0] != "prompts/help.md" {
		t.Fatalf("expected prompts/help.md pending a skip waiver, got %#v", readiness["skipPendingWaiverTargets"])
	}

	// Once the skip is waived the optional target reads as satisfied.
	waived := BuildAcceptanceReadiness(block, historyWithWaiver("prompts/help.md"))
	if status := readinessTargetStatus(t, waived, "prompts/help.md")["status"]; status != AcceptanceReadinessSatisfied {
		t.Fatalf("expected satisfied after a waiver-on-skip, got %#v", status)
	}
}

func TestBuildAcceptanceReadinessSkippableTargetIsExempt(t *testing.T) {
	block := riskBlock("", map[string]string{"experimental": AcceptanceEffectSkippable}, map[string]string{"prompts/scratch.md": "experimental"})
	readiness := BuildAcceptanceReadiness(block, map[string]any{})
	if readiness["ready"] != true {
		t.Fatalf("a skippable target must never block, got ready=%#v", readiness["ready"])
	}
	if status := readinessTargetStatus(t, readiness, "prompts/scratch.md")["status"]; status != AcceptanceReadinessExempt {
		t.Fatalf("expected exempt for a skippable target, got %#v", status)
	}
}

func TestBuildAcceptanceReadinessSurfacesDefaultEffectAndIsInertWithoutTargets(t *testing.T) {
	// No declared targets: the gate is inert (ready, no blocked targets) but still
	// surfaces the resolved default effect undeclared targets would inherit.
	readiness := BuildAcceptanceReadiness(riskBlock("required", nil, nil), map[string]any{})
	if readiness["ready"] != true {
		t.Fatalf("no declared targets must leave the gate ready, got %#v", readiness["ready"])
	}
	if got := readiness["defaultEffect"]; got != AcceptanceEffectRequired {
		t.Fatalf("expected surfaced default effect required, got %#v", got)
	}
	if targets := arrayOrEmpty(readiness["targets"]); len(targets) != 0 {
		t.Fatalf("expected no enumerated targets, got %#v", targets)
	}

	// A nil block (no acceptance_risk policy at all) is inert and defaults optional.
	none := BuildAcceptanceReadiness(nil, map[string]any{})
	if none["ready"] != true || none["defaultEffect"] != AcceptanceEffectOptional {
		t.Fatalf("a nil acceptance_risk block must be inert and default optional, got %#v", none)
	}
}

func TestBuildAcceptanceReadinessOrdersTargetsAndReportsMixedStatuses(t *testing.T) {
	block := riskBlock(
		"",
		map[string]string{"critical": AcceptanceEffectRequired, "routine": AcceptanceEffectOptional, "experimental": AcceptanceEffectSkippable},
		map[string]string{"b/required.md": "critical", "a/optional.md": "routine", "c/skippable.md": "experimental"},
	)
	readiness := BuildAcceptanceReadiness(block, map[string]any{})
	targets := arrayOrEmpty(readiness["targets"])
	if len(targets) != 3 {
		t.Fatalf("expected three enumerated targets, got %#v", targets)
	}
	// Stable lexical order regardless of map iteration order.
	wantOrder := []string{"a/optional.md", "b/required.md", "c/skippable.md"}
	for index, want := range wantOrder {
		if got := stringOrEmpty(asMap(targets[index])["target"]); got != want {
			t.Fatalf("expected target %d to be %q, got %q", index, want, got)
		}
	}
	if readiness["ready"] != false {
		t.Fatalf("the required target with no read must block the mixed set, got ready=%#v", readiness["ready"])
	}
}
