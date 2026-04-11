package runtime

import (
	"fmt"
	"sort"
	"strings"

	"github.com/corca-ai/cautilus/internal/contracts"
)

const (
	DimensionKindSuccess   = "success"
	DimensionKindGuardrail = "guardrail"
)

var BehaviorSurfaces = map[string]string{
	"OPERATOR_BEHAVIOR":          "operator_behavior",
	"OPERATOR_CLI":               "operator_cli",
	"WORKFLOW_CONVERSATION":      "workflow_conversation",
	"THREAD_FOLLOWUP":            "thread_followup",
	"THREAD_CONTEXT_RECOVERY":    "thread_context_recovery",
	"SKILL_VALIDATION":           "skill_validation",
	"OPERATOR_WORKFLOW_RECOVERY": "operator_workflow_recovery",
	"REVIEW_VARIANT_WORKFLOW":    "review_variant_workflow",
}

var BehaviorDimensions = map[string]string{
	"OPERATOR_GUIDANCE_CLARITY":         "operator_guidance_clarity",
	"FAILURE_CAUSE_CLARITY":             "failure_cause_clarity",
	"RECOVERY_NEXT_STEP":                "recovery_next_step",
	"CONTRACT_INTEGRITY":                "contract_integrity",
	"WORKFLOW_CONTINUITY":               "workflow_continuity",
	"TARGET_CLARIFICATION":              "target_clarification",
	"PREFERENCE_REUSE":                  "preference_reuse",
	"VALIDATION_INTEGRITY":              "validation_integrity",
	"WORKFLOW_RECOVERY":                 "workflow_recovery",
	"REVIEW_EVIDENCE_LEGIBILITY":        "review_evidence_legibility",
	"OPERATOR_STATE_TRUTHFULNESS":       "operator_state_truthfulness",
	"REPAIR_EXPLICIT_REGRESSIONS_FIRST": "repair_explicit_regressions_first",
	"REVIEW_FINDINGS_BINDING":           "review_findings_binding",
	"HISTORY_FOCUSES_NEXT_PROBE":        "history_focuses_next_probe",
	"RERUN_RELEVANT_GATES":              "rerun_relevant_gates",
}

type dimensionCatalogEntry struct {
	Kind     string
	Summary  string
	Surfaces []string
}

type BehaviorDimension struct {
	ID      string `json:"id"`
	Summary string `json:"summary"`
}

type BehaviorIntentProfile struct {
	SchemaVersion       string              `json:"schemaVersion"`
	IntentID            string              `json:"intentId"`
	Summary             string              `json:"summary"`
	BehaviorSurface     string              `json:"behaviorSurface"`
	SuccessDimensions   []BehaviorDimension `json:"successDimensions"`
	GuardrailDimensions []BehaviorDimension `json:"guardrailDimensions"`
}

var behaviorDimensionCatalog = map[string]dimensionCatalogEntry{
	BehaviorDimensions["OPERATOR_GUIDANCE_CLARITY"]: {
		Kind:    DimensionKindSuccess,
		Summary: "Keep the operator-facing guidance explicit and easy to follow.",
		Surfaces: []string{
			BehaviorSurfaces["OPERATOR_BEHAVIOR"],
			BehaviorSurfaces["OPERATOR_CLI"],
		},
	},
	BehaviorDimensions["FAILURE_CAUSE_CLARITY"]: {
		Kind:    DimensionKindSuccess,
		Summary: "Explain the concrete failure cause or missing prerequisite.",
		Surfaces: []string{
			BehaviorSurfaces["OPERATOR_BEHAVIOR"],
			BehaviorSurfaces["OPERATOR_CLI"],
		},
	},
	BehaviorDimensions["RECOVERY_NEXT_STEP"]: {
		Kind:    DimensionKindSuccess,
		Summary: "Make the next safe recovery step explicit without operator guesswork.",
		Surfaces: []string{
			BehaviorSurfaces["OPERATOR_BEHAVIOR"],
			BehaviorSurfaces["OPERATOR_CLI"],
			BehaviorSurfaces["OPERATOR_WORKFLOW_RECOVERY"],
		},
	},
	BehaviorDimensions["CONTRACT_INTEGRITY"]: {
		Kind:     DimensionKindSuccess,
		Summary:  "Preserve the expected exit, output, and side-effect contract.",
		Surfaces: []string{BehaviorSurfaces["OPERATOR_CLI"]},
	},
	BehaviorDimensions["WORKFLOW_CONTINUITY"]: {
		Kind:    DimensionKindSuccess,
		Summary: "Carry the active workflow context cleanly into the next turn.",
		Surfaces: []string{
			BehaviorSurfaces["WORKFLOW_CONVERSATION"],
			BehaviorSurfaces["THREAD_FOLLOWUP"],
		},
	},
	BehaviorDimensions["TARGET_CLARIFICATION"]: {
		Kind:    DimensionKindSuccess,
		Summary: "Ask for the minimum concrete target or missing context before acting.",
		Surfaces: []string{
			BehaviorSurfaces["WORKFLOW_CONVERSATION"],
			BehaviorSurfaces["THREAD_CONTEXT_RECOVERY"],
		},
	},
	BehaviorDimensions["PREFERENCE_REUSE"]: {
		Kind:     DimensionKindSuccess,
		Summary:  "Reuse the preference or constraint the user just established in-thread.",
		Surfaces: []string{BehaviorSurfaces["WORKFLOW_CONVERSATION"]},
	},
	BehaviorDimensions["VALIDATION_INTEGRITY"]: {
		Kind:     DimensionKindSuccess,
		Summary:  "Keep the declared validation surface passing and legible.",
		Surfaces: []string{BehaviorSurfaces["SKILL_VALIDATION"]},
	},
	BehaviorDimensions["WORKFLOW_RECOVERY"]: {
		Kind:     DimensionKindSuccess,
		Summary:  "Recover the workflow cleanly when the known blocker reappears.",
		Surfaces: []string{BehaviorSurfaces["OPERATOR_WORKFLOW_RECOVERY"]},
	},
	BehaviorDimensions["REVIEW_EVIDENCE_LEGIBILITY"]: {
		Kind:     DimensionKindSuccess,
		Summary:  "Keep review evidence and verdict framing legible to a human reviewer.",
		Surfaces: []string{BehaviorSurfaces["REVIEW_VARIANT_WORKFLOW"]},
	},
	BehaviorDimensions["OPERATOR_STATE_TRUTHFULNESS"]: {
		Kind:    DimensionKindGuardrail,
		Summary: "Do not imply success, configuration, or completion state that has not happened.",
		Surfaces: []string{
			BehaviorSurfaces["OPERATOR_BEHAVIOR"],
			BehaviorSurfaces["OPERATOR_CLI"],
			BehaviorSurfaces["OPERATOR_WORKFLOW_RECOVERY"],
		},
	},
	BehaviorDimensions["REPAIR_EXPLICIT_REGRESSIONS_FIRST"]: {
		Kind:     DimensionKindGuardrail,
		Summary:  "Prefer repairing explicit regressions over widening scope.",
		Surfaces: allBehaviorSurfaces(),
	},
	BehaviorDimensions["REVIEW_FINDINGS_BINDING"]: {
		Kind:     DimensionKindGuardrail,
		Summary:  "Treat review findings as first-class evidence, not optional commentary.",
		Surfaces: allBehaviorSurfaces(),
	},
	BehaviorDimensions["HISTORY_FOCUSES_NEXT_PROBE"]: {
		Kind:     DimensionKindGuardrail,
		Summary:  "Use scenario history only to focus the next bounded probe, not to justify overfitting.",
		Surfaces: allBehaviorSurfaces(),
	},
	BehaviorDimensions["RERUN_RELEVANT_GATES"]: {
		Kind:     DimensionKindGuardrail,
		Summary:  "Stop after one bounded revision and rerun the relevant gates.",
		Surfaces: allBehaviorSurfaces(),
	},
}

var defaultSuccessDimensionsBySurface = map[string][]string{
	BehaviorSurfaces["OPERATOR_BEHAVIOR"]:          {BehaviorDimensions["OPERATOR_GUIDANCE_CLARITY"]},
	BehaviorSurfaces["OPERATOR_CLI"]:               {BehaviorDimensions["OPERATOR_GUIDANCE_CLARITY"]},
	BehaviorSurfaces["WORKFLOW_CONVERSATION"]:      {BehaviorDimensions["WORKFLOW_CONTINUITY"]},
	BehaviorSurfaces["THREAD_FOLLOWUP"]:            {BehaviorDimensions["WORKFLOW_CONTINUITY"]},
	BehaviorSurfaces["THREAD_CONTEXT_RECOVERY"]:    {BehaviorDimensions["TARGET_CLARIFICATION"]},
	BehaviorSurfaces["SKILL_VALIDATION"]:           {BehaviorDimensions["VALIDATION_INTEGRITY"]},
	BehaviorSurfaces["OPERATOR_WORKFLOW_RECOVERY"]: {BehaviorDimensions["WORKFLOW_RECOVERY"]},
	BehaviorSurfaces["REVIEW_VARIANT_WORKFLOW"]:    {BehaviorDimensions["REVIEW_EVIDENCE_LEGIBILITY"]},
}

func allBehaviorSurfaces() []string {
	values := make([]string, 0, len(BehaviorSurfaces))
	for _, surface := range BehaviorSurfaces {
		values = append(values, surface)
	}
	sort.Strings(values)
	return values
}

func slugify(value string) string {
	text := strings.ToLower(value)
	var builder strings.Builder
	lastDash := false
	for _, r := range text {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			builder.WriteRune(r)
			lastDash = false
			continue
		}
		if !lastDash && builder.Len() > 0 {
			builder.WriteByte('-')
			lastDash = true
		}
	}
	result := strings.Trim(builder.String(), "-")
	if len(result) > 80 {
		return result[:80]
	}
	return result
}

func BuildCatalogDimensions(ids []string) ([]BehaviorDimension, error) {
	result := make([]BehaviorDimension, 0, len(ids))
	for index, id := range ids {
		id = strings.TrimSpace(id)
		if id == "" {
			return nil, fmt.Errorf("dimension ids[%d] must be a non-empty string", index)
		}
		entry, ok := behaviorDimensionCatalog[id]
		if !ok {
			return nil, fmt.Errorf("dimension id must be one of: %s", strings.Join(sortedDimensionIDs(), ", "))
		}
		result = append(result, BehaviorDimension{ID: id, Summary: entry.Summary})
	}
	return result, nil
}

func BuildBehaviorIntentProfile(intent any, intentProfile map[string]any, fallbackBehaviorSurface string, defaultSuccessDimensions []string, defaultGuardrailDimensions []string) (*BehaviorIntentProfile, error) {
	summaryValue := intent
	if intentProfile != nil {
		if profileSummary, ok := intentProfile["summary"]; ok {
			summaryValue = profileSummary
		}
	}
	summary, err := normalizeNonEmptyString(summaryValue, "intent")
	if err != nil {
		return nil, err
	}
	behaviorSurfaceValue := fallbackBehaviorSurface
	if intentProfile != nil {
		if rawSurface, ok := intentProfile["behaviorSurface"]; ok {
			behaviorSurfaceValue, err = normalizeNonEmptyString(rawSurface, "intentProfile.behaviorSurface")
			if err != nil {
				return nil, err
			}
		}
	}
	if !containsString(allBehaviorSurfaces(), behaviorSurfaceValue) {
		return nil, fmt.Errorf("behaviorSurface must be one of: %s", strings.Join(allBehaviorSurfaces(), ", "))
	}
	intentID := fmt.Sprintf("intent-%s", slugify(summary))
	if intentID == "intent-" {
		intentID = "intent-default"
	}
	if intentProfile != nil {
		if rawIntentID, ok := intentProfile["intentId"]; ok {
			intentID, err = normalizeNonEmptyString(rawIntentID, "intentProfile.intentId")
			if err != nil {
				return nil, err
			}
		}
	}
	successEntries, err := chooseDimensions(intentProfile, "successDimensions", defaultSuccessDimensions, defaultSuccessDimensionsBySurface[behaviorSurfaceValue], behaviorSurfaceValue, DimensionKindSuccess)
	if err != nil {
		return nil, err
	}
	guardrailEntries, err := chooseDimensions(intentProfile, "guardrailDimensions", defaultGuardrailDimensions, nil, behaviorSurfaceValue, DimensionKindGuardrail)
	if err != nil {
		return nil, err
	}
	return &BehaviorIntentProfile{
		SchemaVersion:       contracts.BehaviorIntentSchema,
		IntentID:            intentID,
		Summary:             summary,
		BehaviorSurface:     behaviorSurfaceValue,
		SuccessDimensions:   successEntries,
		GuardrailDimensions: guardrailEntries,
	}, nil
}

func chooseDimensions(intentProfile map[string]any, field string, preferred []string, fallback []string, behaviorSurface string, expectedKind string) ([]BehaviorDimension, error) {
	var rawEntries []any
	if intentProfile != nil {
		if value, ok := intentProfile[field]; ok && value != nil {
			entries, err := assertArray(value, fmt.Sprintf("intentProfile.%s", field))
			if err != nil {
				return nil, err
			}
			rawEntries = entries
		}
	}
	if len(rawEntries) == 0 {
		seed := preferred
		if len(seed) == 0 {
			seed = fallback
		}
		if len(seed) == 0 && expectedKind == DimensionKindSuccess {
			return nil, fmt.Errorf("intentProfile.%s must include at least one success dimension", field)
		}
		dimensions, err := BuildCatalogDimensions(seed)
		if err != nil {
			return nil, err
		}
		return dimensions, nil
	}
	result := make([]BehaviorDimension, 0, len(rawEntries))
	for index, entry := range rawEntries {
		dimension, err := normalizeDimension(entry, index, field, behaviorSurface, expectedKind)
		if err != nil {
			return nil, err
		}
		result = append(result, *dimension)
	}
	if expectedKind == DimensionKindSuccess && len(result) == 0 {
		return nil, fmt.Errorf("intentProfile.%s must include at least one success dimension", field)
	}
	return result, nil
}

func normalizeDimension(entry any, index int, field string, behaviorSurface string, expectedKind string) (*BehaviorDimension, error) {
	if rawID, ok := entry.(string); ok {
		entry = map[string]any{"id": rawID}
	}
	record, ok := entry.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("intentProfile.%s[%d] must be a product-owned dimension id or object", field, index)
	}
	id, err := normalizeNonEmptyString(record["id"], fmt.Sprintf("intentProfile.%s[%d].id", field, index))
	if err != nil {
		return nil, err
	}
	catalogEntry, ok := behaviorDimensionCatalog[id]
	if !ok {
		return nil, fmt.Errorf("dimension id must be one of: %s", strings.Join(sortedDimensionIDs(), ", "))
	}
	if catalogEntry.Kind != expectedKind {
		return nil, fmt.Errorf("intentProfile.%s[%d] must use a %s dimension id", field, index, expectedKind)
	}
	if !containsString(catalogEntry.Surfaces, behaviorSurface) {
		return nil, fmt.Errorf("intentProfile.%s[%d] is not allowed for behaviorSurface %s", field, index, behaviorSurface)
	}
	if summaryValue, ok := record["summary"]; ok && summaryValue != nil {
		summary, err := normalizeNonEmptyString(summaryValue, fmt.Sprintf("intentProfile.%s[%d].summary", field, index))
		if err != nil {
			return nil, err
		}
		if summary != catalogEntry.Summary {
			return nil, fmt.Errorf("intentProfile.%s[%d].summary must match the product-owned catalog summary for %s", field, index, id)
		}
	}
	return &BehaviorDimension{
		ID:      id,
		Summary: catalogEntry.Summary,
	}, nil
}

func sortedDimensionIDs() []string {
	keys := make([]string, 0, len(behaviorDimensionCatalog))
	for key := range behaviorDimensionCatalog {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	return keys
}

func containsString(values []string, target string) bool {
	for _, value := range values {
		if value == target {
			return true
		}
	}
	return false
}
