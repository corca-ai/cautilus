package runtime

import "testing"

func TestResolveAcceptanceRiskTierDefaultsWhenUndeclared(t *testing.T) {
	resolved := ResolveAcceptanceRiskTier(nil, "any-target")
	if resolved.Effect != AcceptanceEffectOptional {
		t.Fatalf("nil block must default to optional, got %q", resolved.Effect)
	}
	if resolved.ReliabilityFloor != AcceptanceReliabilityFloor {
		t.Fatalf("nil block must use product floor %d, got %d", AcceptanceReliabilityFloor, resolved.ReliabilityFloor)
	}
	if resolved.Tier != "" {
		t.Fatalf("undeclared target must have empty tier, got %q", resolved.Tier)
	}
}

func TestResolveAcceptanceRiskTierDefaultEffectOverride(t *testing.T) {
	block := map[string]any{"default_effect": AcceptanceEffectSkippable}
	resolved := ResolveAcceptanceRiskTier(block, "undeclared")
	if resolved.Effect != AcceptanceEffectSkippable {
		t.Fatalf("undeclared target must take default_effect, got %q", resolved.Effect)
	}
	if resolved.ReliabilityFloor != AcceptanceReliabilityFloor {
		t.Fatalf("undeclared target must keep product floor, got %d", resolved.ReliabilityFloor)
	}
}

func TestResolveAcceptanceRiskTierDeclaredTargetWithPerTierFloor(t *testing.T) {
	block := map[string]any{
		"tiers": map[string]any{
			"critical": map[string]any{"effect": AcceptanceEffectRequired, "reliability_floor": 15},
		},
		"targets": map[string]any{"prompts/router.md": "critical"},
	}
	resolved := ResolveAcceptanceRiskTier(block, "prompts/router.md")
	if resolved.Tier != "critical" || resolved.Effect != AcceptanceEffectRequired {
		t.Fatalf("declared target must resolve to its tier/effect, got tier=%q effect=%q", resolved.Tier, resolved.Effect)
	}
	if resolved.ReliabilityFloor != 15 {
		t.Fatalf("per-tier floor must override product default, got %d", resolved.ReliabilityFloor)
	}
}

func TestResolveAcceptanceRiskTierDeclaredTargetFloorFallback(t *testing.T) {
	block := map[string]any{
		"tiers":   map[string]any{"standard": map[string]any{"effect": AcceptanceEffectRequired}},
		"targets": map[string]any{"prompts/router.md": "standard"},
	}
	resolved := ResolveAcceptanceRiskTier(block, "prompts/router.md")
	if resolved.ReliabilityFloor != AcceptanceReliabilityFloor {
		t.Fatalf("tier without floor must fall back to product default %d, got %d", AcceptanceReliabilityFloor, resolved.ReliabilityFloor)
	}
}

func TestValidateAdapterAcceptanceRiskRejectsRenamedEffect(t *testing.T) {
	_, errs := validateAdapterAcceptanceRisk(map[string]any{
		"tiers": map[string]any{"critical": map[string]any{"effect": "mandatory"}},
	})
	if len(errs) == 0 {
		t.Fatalf("a renamed effect value must be rejected")
	}
}

func TestValidateAdapterAcceptanceRiskAcceptsArbitraryNamesAndTargets(t *testing.T) {
	normalized, errs := validateAdapterAcceptanceRisk(map[string]any{
		"default_effect": AcceptanceEffectSkippable,
		"tiers": map[string]any{
			"any-host-name":   map[string]any{"effect": AcceptanceEffectRequired, "reliability_floor": 12},
			"another_tier_42": map[string]any{"effect": AcceptanceEffectOptional},
		},
		"targets": map[string]any{
			"prompts/a.md": "any-host-name",
			"prompts/b.md": "another_tier_42",
		},
	})
	if len(errs) != 0 {
		t.Fatalf("arbitrary tier names and target ids on valid effects must validate, got %v", errs)
	}
	if normalized["default_effect"] != AcceptanceEffectSkippable {
		t.Fatalf("default_effect must be preserved, got %v", normalized["default_effect"])
	}
}

func TestValidateAdapterAcceptanceRiskRejectsUndeclaredTargetTier(t *testing.T) {
	_, errs := validateAdapterAcceptanceRisk(map[string]any{
		"tiers":   map[string]any{"critical": map[string]any{"effect": AcceptanceEffectRequired}},
		"targets": map[string]any{"prompts/a.md": "ghost-tier"},
	})
	if len(errs) == 0 {
		t.Fatalf("a target referencing an undeclared tier must be rejected")
	}
}

func TestValidateAdapterAcceptanceRiskRejectsNonPositiveFloor(t *testing.T) {
	_, errs := validateAdapterAcceptanceRisk(map[string]any{
		"tiers": map[string]any{"critical": map[string]any{"effect": AcceptanceEffectRequired, "reliability_floor": 0}},
	})
	if len(errs) == 0 {
		t.Fatalf("a non-positive reliability_floor must be rejected")
	}
}

func TestValidateAdapterDataRegistersAcceptanceRisk(t *testing.T) {
	validated, errs := validateAdapterData(map[string]any{
		"acceptance_risk": map[string]any{
			"tiers":   map[string]any{"critical": map[string]any{"effect": AcceptanceEffectRequired}},
			"targets": map[string]any{"prompts/a.md": "critical"},
		},
	})
	if len(errs) != 0 {
		t.Fatalf("valid acceptance_risk must pass adapter validation, got %v", errs)
	}
	if _, ok := validated["acceptance_risk"].(map[string]any); !ok {
		t.Fatalf("acceptance_risk must be normalized into validated adapter data")
	}
}
