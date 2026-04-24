package runtime

import (
	"fmt"
	"sort"
	"strings"
)

var runtimeFingerprintFields = []string{
	"runtime",
	"provider",
	"model",
	"resolved_model",
	"model_revision",
	"session_mode",
	"pricing_version",
	"source",
}

var runtimeIdentityComparableFields = []string{
	"runtime",
	"provider",
	"model",
	"resolved_model",
	"model_revision",
}

func normalizeRuntimeFingerprint(value any, fallback map[string]any, field string) (map[string]any, error) {
	record := asMap(value)
	normalized := map[string]any{}
	for _, key := range runtimeFingerprintFields {
		raw := record[key]
		if raw == nil && fallback != nil {
			raw = fallback[key]
		}
		text, err := normalizeOptionalString(raw, field+"."+key)
		if err != nil {
			return nil, err
		}
		if text != nil {
			normalized[key] = *text
		}
	}
	if len(runtimeComparableIdentity(normalized)) == 0 && stringOrEmpty(normalized["pricing_version"]) == "" {
		return nil, nil
	}
	return normalized, nil
}

func runtimeComparableIdentity(fingerprint map[string]any) map[string]string {
	result := map[string]string{}
	for _, key := range append(runtimeIdentityComparableFields, "pricing_version") {
		if value := strings.TrimSpace(stringOrEmpty(fingerprint[key])); value != "" {
			result[key] = value
		}
	}
	return result
}

func runtimeFingerprintFromEvidence(evidence map[string]any) map[string]any {
	if len(evidence) == 0 {
		return nil
	}
	telemetry := asMap(evidence["telemetry"])
	if fingerprint := asMap(telemetry["runtimeFingerprint"]); len(fingerprint) > 0 {
		return fingerprint
	}
	if fingerprints := arrayOrEmpty(telemetry["runtimeFingerprints"]); len(fingerprints) == 1 {
		return asMap(fingerprints[0])
	}
	if fingerprint, _ := normalizeRuntimeFingerprint(nil, telemetry, "telemetry.runtimeFingerprint"); len(fingerprint) > 0 {
		return fingerprint
	}
	if fingerprint := runtimeFingerprintFromSummary(evidence); len(fingerprint) > 0 {
		return fingerprint
	}
	return nil
}

func runtimeFingerprintFromSummary(summary map[string]any) map[string]any {
	providers := stringSliceValue(summary["providers"])
	models := stringSliceValue(summary["models"])
	if len(providers) != 1 || len(models) != 1 {
		return nil
	}
	return map[string]any{
		"provider": providers[0],
		"model":    models[0],
	}
}

func buildRuntimeContext(currentEvidence map[string]any, priorEvidence map[string]any, priorSource string, runtimePolicy map[string]any) map[string]any {
	context := map[string]any{
		"reasonCodes": []any{},
		"warnings":    []any{},
		"notes":       []any{},
		"comparisons": []any{},
	}
	current := runtimeFingerprintFromEvidence(currentEvidence)
	if len(runtimePolicy) > 0 {
		appendRuntimePolicyContext(context, current, runtimePolicy)
	}
	if len(priorEvidence) > 0 {
		appendRuntimeComparisonContext(context, current, runtimeFingerprintFromEvidence(priorEvidence), priorSource)
	}
	if len(arrayOrEmpty(context["reasonCodes"])) == 0 {
		return nil
	}
	severity := "context_note"
	for _, rawCode := range arrayOrEmpty(context["reasonCodes"]) {
		switch stringOrEmpty(rawCode) {
		case "model_runtime_pinned_mismatch":
			severity = "blocked"
		case "model_runtime_changed":
			if severity != "blocked" {
				severity = "warning"
			}
		case "pricing_catalog_changed":
			if severity == "context_note" {
				severity = "warning"
			}
		}
	}
	context["severity"] = severity
	return context
}

func appendRuntimeComparisonContext(context map[string]any, current map[string]any, prior map[string]any, priorSource string) {
	if len(runtimeComparableIdentity(current)) == 0 {
		addRuntimeContextEntry(context, "model_runtime_unobserved", "context_note", "Current evidence does not include comparable runtime identity.", priorSource, current, prior, nil)
		return
	}
	if len(runtimeComparableIdentity(prior)) == 0 {
		addRuntimeContextEntry(context, "model_runtime_unobserved", "context_note", "Prior evidence does not include comparable runtime identity.", priorSource, current, prior, nil)
		return
	}
	changedFields := runtimeChangedFields(current, prior, runtimeIdentityComparableFields)
	if len(changedFields) > 0 {
		addRuntimeContextEntry(context, "model_runtime_changed", "warning", "Observed runtime identity differs from the prior evidence.", priorSource, current, prior, changedFields)
	}
	pricingChanged := runtimeChangedFields(current, prior, []string{"pricing_version"})
	if len(pricingChanged) > 0 {
		addRuntimeContextEntry(context, "pricing_catalog_changed", "warning", "Observed pricing catalog version differs from the prior evidence.", priorSource, current, prior, pricingChanged)
	}
}

func appendRuntimePolicyContext(context map[string]any, current map[string]any, runtimePolicy map[string]any) {
	mode := firstNonEmpty(stringOrEmpty(runtimePolicy["mode"]), "observe")
	if mode != "pinned" {
		return
	}
	declared := map[string]any{}
	for _, key := range runtimeIdentityComparableFields {
		if value := strings.TrimSpace(stringOrEmpty(runtimePolicy[key])); value != "" {
			declared[key] = value
		}
	}
	if len(runtimeComparableIdentity(current)) == 0 {
		addRuntimeContextEntry(context, "model_runtime_unobserved", "context_note", "Pinned runtime policy is declared, but current evidence does not expose runtime identity.", "", current, declared, nil)
		return
	}
	mismatches := runtimeChangedFields(current, declared, runtimeIdentityComparableFields)
	if len(mismatches) > 0 {
		addRuntimeContextEntry(context, "model_runtime_pinned_mismatch", "blocked", "Observed runtime identity does not match the pinned runtime policy.", "", current, declared, mismatches)
	}
}

func runtimeChangedFields(current map[string]any, prior map[string]any, fields []string) []string {
	changed := []string{}
	for _, key := range fields {
		currentValue := strings.TrimSpace(stringOrEmpty(current[key]))
		priorValue := strings.TrimSpace(stringOrEmpty(prior[key]))
		if currentValue == "" || priorValue == "" {
			continue
		}
		if currentValue != priorValue {
			changed = append(changed, key)
		}
	}
	sort.Strings(changed)
	return changed
}

func addRuntimeContextEntry(context map[string]any, code string, severity string, summary string, priorSource string, current map[string]any, prior map[string]any, fields []string) {
	if !containsString(stringSliceValue(context["reasonCodes"]), code) {
		context["reasonCodes"] = append(arrayOrEmpty(context["reasonCodes"]), code)
	}
	entry := map[string]any{
		"reasonCode": code,
		"severity":   severity,
		"summary":    summary,
		"current":    firstNonNil(current, map[string]any{}),
		"prior":      firstNonNil(prior, map[string]any{}),
	}
	if strings.TrimSpace(priorSource) != "" {
		entry["priorSource"] = priorSource
	}
	if len(fields) > 0 {
		entry["fields"] = stringSliceToAny(fields)
	}
	context["comparisons"] = append(arrayOrEmpty(context["comparisons"]), entry)
	if severity == "warning" || severity == "blocked" {
		context["warnings"] = append(arrayOrEmpty(context["warnings"]), map[string]any{
			"reasonCode": code,
			"summary":    summary,
		})
	} else {
		context["notes"] = append(arrayOrEmpty(context["notes"]), map[string]any{
			"reasonCode": code,
			"summary":    summary,
		})
	}
}

func runtimeContextSource(input map[string]any) string {
	if source := strings.TrimSpace(stringOrEmpty(input["priorEvidenceSource"])); source != "" {
		return source
	}
	if file := strings.TrimSpace(stringOrEmpty(input["priorEvidenceFile"])); file != "" {
		return file
	}
	return "explicit_prior_evidence"
}

func normalizeRuntimePolicy(value any, field string) (map[string]any, error) {
	if value == nil {
		return nil, nil
	}
	record, ok := value.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("%s must be an object", field)
	}
	mode := firstNonEmpty(stringOrEmpty(record["mode"]), "observe")
	if mode != "observe" && mode != "pinned" {
		return nil, fmt.Errorf("%s.mode must be observe or pinned", field)
	}
	normalized := map[string]any{"mode": mode}
	for _, key := range runtimeIdentityComparableFields {
		text, err := normalizeOptionalString(record[key], field+"."+key)
		if err != nil {
			return nil, err
		}
		if text != nil {
			normalized[key] = *text
		}
	}
	return normalized, nil
}
