package runtime

// Acceptance risk-tier policy: the product-owned acceptance-effect vocabulary
// and the resolution of an acceptance target to its effect plus reliability
// floor. See docs/contracts/acceptance-risk-tier.md. The product owns only the
// closed effect enum and what each effect means; the adapter owns tier names,
// the target-to-tier mapping, and the per-tier reliability floor.

const (
	// AcceptanceEffectRequired blocks a silent accept: a finalist on this target
	// must be backed by a clean, reliable, accept-recommending read or an explicit
	// recorded waiver.
	AcceptanceEffectRequired = "required"
	// AcceptanceEffectOptional recommends a read; a skip is recorded as a waiver
	// but never blocks.
	AcceptanceEffectOptional = "optional"
	// AcceptanceEffectSkippable expects no read; a skip is neither blocked nor
	// waiver-worthy.
	AcceptanceEffectSkippable = "skippable"
)

// DefaultAcceptanceEffect is the product default for an acceptance target with no
// adapter declaration. It is `optional` so a skipped read stays a visible waiver
// event rather than a free no-op, while never blocking the accept step.
const DefaultAcceptanceEffect = AcceptanceEffectOptional

// acceptanceEffects is the closed product-owned effect set. Adapters may not
// rename or extend it; a value outside this set is an adapter validation error.
var acceptanceEffects = map[string]bool{
	AcceptanceEffectRequired:  true,
	AcceptanceEffectOptional:  true,
	AcceptanceEffectSkippable: true,
}

// ResolvedAcceptanceRiskTier is the effect and reliability floor resolved for one
// acceptance target. Tier is the adapter-owned tier name, or "" when the target
// is undeclared and falls back to the default effect.
type ResolvedAcceptanceRiskTier struct {
	Tier             string
	Effect           string
	ReliabilityFloor int
}

// ResolveAcceptanceRiskTier resolves the acceptance effect and reliability floor
// for one acceptance target from the validated adapter `acceptance_risk` block.
//
// An undeclared target (or a nil/absent block) resolves to the block's
// `default_effect` when present, otherwise the product DefaultAcceptanceEffect,
// and to the product AcceptanceReliabilityFloor. A declared target resolves to
// its tier's effect and, when the tier sets one, its per-tier reliability floor.
func ResolveAcceptanceRiskTier(acceptanceRisk map[string]any, targetID string) ResolvedAcceptanceRiskTier {
	resolved := ResolvedAcceptanceRiskTier{
		Tier:             "",
		Effect:           DefaultAcceptanceEffect,
		ReliabilityFloor: AcceptanceReliabilityFloor,
	}
	if acceptanceRisk == nil {
		return resolved
	}
	if defaultEffect := stringOrEmpty(acceptanceRisk["default_effect"]); acceptanceEffects[defaultEffect] {
		resolved.Effect = defaultEffect
	}
	tierName := stringOrEmpty(asMap(acceptanceRisk["targets"])[targetID])
	if tierName == "" {
		return resolved
	}
	tier := asMap(asMap(acceptanceRisk["tiers"])[tierName])
	if effect := stringOrEmpty(tier["effect"]); acceptanceEffects[effect] {
		resolved.Tier = tierName
		resolved.Effect = effect
	}
	if floor := intFromAnyRuntime(tier["reliability_floor"], 0); floor > 0 {
		resolved.ReliabilityFloor = floor
	}
	return resolved
}
