package runtime

import (
	"fmt"
	"sort"
	"strings"

	"github.com/corca-ai/cautilus/internal/contracts"
)

var (
	modeValues         = map[string]struct{}{"iterate": {}, "held_out": {}, "comparison": {}, "full_gate": {}}
	resultStatusValues = map[string]struct{}{
		"passed": {}, "failed": {}, "improved": {}, "regressed": {}, "unchanged": {}, "noisy": {}, "missing": {},
	}
	compareVerdictValues     = map[string]struct{}{"improved": {}, "regressed": {}, "mixed": {}, "unchanged": {}, "inconclusive": {}}
	compareDeltaStatusValues = map[string]struct{}{"improved": {}, "regressed": {}, "unchanged": {}, "noisy": {}}
	telemetryNumericFields   = []string{"prompt_tokens", "completion_tokens", "total_tokens", "cost_usd"}
)

func normalizeCompareArtifact(value any, field string) (map[string]any, error) {
	if value == nil {
		return nil, nil
	}
	record, ok := value.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("%s must be an object", field)
	}
	if record["schemaVersion"] != contracts.CompareArtifactSchema {
		return nil, fmt.Errorf("%s.schemaVersion must be %s", field, contracts.CompareArtifactSchema)
	}
	summary, err := normalizeNonEmptyString(record["summary"], field+".summary")
	if err != nil {
		return nil, err
	}
	normalized := map[string]any{
		"schemaVersion": contracts.CompareArtifactSchema,
		"summary":       summary,
	}
	if generatedAt, err := normalizeISOTimestamp(record["generatedAt"], field+".generatedAt"); err != nil {
		return nil, err
	} else if generatedAt != nil {
		normalized["generatedAt"] = *generatedAt
	}
	if verdict, err := normalizeOptionalString(record["verdict"], field+".verdict"); err != nil {
		return nil, err
	} else if verdict != nil {
		if _, ok := compareVerdictValues[*verdict]; !ok {
			return nil, fmt.Errorf("%s.verdict must be one of %s", field, strings.Join(sortedKeys(compareVerdictValues), ", "))
		}
		normalized["verdict"] = *verdict
	}
	for _, bucketField := range []string{"improved", "regressed", "unchanged", "noisy"} {
		bucket, err := normalizeScenarioBucket(record[bucketField], field+"."+bucketField)
		if err != nil {
			return nil, err
		}
		if len(bucket) > 0 {
			normalized[bucketField] = bucket
		}
	}
	if rawDeltas, err := assertArray(record["deltas"], field+".deltas"); err != nil {
		return nil, err
	} else if len(rawDeltas) > 0 {
		deltas := make([]any, 0, len(rawDeltas))
		for index, entry := range rawDeltas {
			delta, err := normalizeCompareDelta(entry, index, field+".deltas")
			if err != nil {
				return nil, err
			}
			deltas = append(deltas, delta)
		}
		normalized["deltas"] = deltas
	}
	if rawReasons, err := assertArray(record["reasons"], field+".reasons"); err != nil {
		return nil, err
	} else if len(rawReasons) > 0 {
		reasons, err := stringSliceFromAny(rawReasons, field+".reasons")
		if err != nil {
			return nil, err
		}
		normalized["reasons"] = reasons
	}
	if rawPaths, err := assertArray(record["artifactPaths"], field+".artifactPaths"); err != nil {
		return nil, err
	} else if len(rawPaths) > 0 {
		paths, err := stringSliceFromAny(rawPaths, field+".artifactPaths")
		if err != nil {
			return nil, err
		}
		normalized["artifactPaths"] = paths
	}
	return normalized, nil
}

func normalizeCompareDelta(value any, index int, field string) (map[string]any, error) {
	record, ok := value.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("%s[%d] must be an object", field, index)
	}
	status, err := normalizeNonEmptyString(record["status"], fmt.Sprintf("%s[%d].status", field, index))
	if err != nil {
		return nil, err
	}
	if _, ok := compareDeltaStatusValues[status]; !ok {
		return nil, fmt.Errorf("%s[%d].status must be one of %s", field, index, strings.Join(sortedKeys(compareDeltaStatusValues), ", "))
	}
	key, err := normalizeNonEmptyString(record["key"], fmt.Sprintf("%s[%d].key", field, index))
	if err != nil {
		return nil, err
	}
	summary, err := normalizeNonEmptyString(record["summary"], fmt.Sprintf("%s[%d].summary", field, index))
	if err != nil {
		return nil, err
	}
	normalized := map[string]any{
		"key":     key,
		"status":  status,
		"summary": summary,
	}
	for _, optionalField := range []string{"scenarioId", "metric", "artifactPath"} {
		value, err := normalizeOptionalString(record[optionalField], fmt.Sprintf("%s[%d].%s", field, index, optionalField))
		if err != nil {
			return nil, err
		}
		if value != nil {
			normalized[optionalField] = *value
		}
	}
	for _, numericField := range []string{"baselineValue", "candidateValue"} {
		value, err := normalizeNonNegativeNumber(record[numericField], fmt.Sprintf("%s[%d].%s", field, index, numericField))
		if err != nil {
			return nil, err
		}
		if value != nil {
			normalized[numericField] = *value
		}
	}
	return normalized, nil
}

func normalizeScenarioBucket(value any, field string) ([]any, error) {
	if value == nil {
		return []any{}, nil
	}
	items, err := assertArray(value, field)
	if err != nil {
		return nil, err
	}
	result := make([]any, 0, len(items))
	for index, entry := range items {
		if text, ok := entry.(string); ok {
			normalized, err := normalizeNonEmptyString(text, fmt.Sprintf("%s[%d]", field, index))
			if err != nil {
				return nil, err
			}
			result = append(result, normalized)
			continue
		}
		record, ok := entry.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("%s[%d] must be a string or object", field, index)
		}
		if scenarioID, ok := record["scenarioId"]; ok && scenarioID != nil {
			if _, err := normalizeNonEmptyString(scenarioID, fmt.Sprintf("%s[%d].scenarioId", field, index)); err != nil {
				return nil, err
			}
		}
		if metric, ok := record["metric"]; ok && metric != nil {
			if _, err := normalizeNonEmptyString(metric, fmt.Sprintf("%s[%d].metric", field, index)); err != nil {
				return nil, err
			}
		}
		if reason, ok := record["reason"]; ok && reason != nil {
			if _, err := normalizeNonEmptyString(reason, fmt.Sprintf("%s[%d].reason", field, index)); err != nil {
				return nil, err
			}
		}
		if summary, ok := record["summary"]; ok && summary != nil {
			if _, err := normalizeNonEmptyString(summary, fmt.Sprintf("%s[%d].summary", field, index)); err != nil {
				return nil, err
			}
		}
		result = append(result, record)
	}
	return result, nil
}

func normalizeScenarioTelemetry(value any, field string) (map[string]any, error) {
	if value == nil {
		return nil, nil
	}
	record, ok := value.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("%s must be an object", field)
	}
	telemetry := map[string]any{}
	for _, key := range []string{"runtime", "provider", "model", "resolved_model", "model_revision", "session_mode", "cost_truth", "pricing_source", "pricing_version", "source"} {
		value, err := normalizeOptionalString(record[key], field+"."+key)
		if err != nil {
			return nil, err
		}
		if value != nil {
			telemetry[key] = *value
		}
	}
	fingerprint, err := normalizeRuntimeFingerprint(record["runtimeFingerprint"], record, field+".runtimeFingerprint")
	if err != nil {
		return nil, err
	}
	if len(fingerprint) > 0 {
		telemetry["runtimeFingerprint"] = fingerprint
	}
	for _, key := range telemetryNumericFields {
		value, err := normalizeNonNegativeNumber(record[key], field+"."+key)
		if err != nil {
			return nil, err
		}
		if value != nil {
			telemetry[key] = *value
		}
	}
	if len(telemetry) == 0 {
		return nil, nil
	}
	return telemetry, nil
}

func normalizeScenarioResult(result any, field string) (map[string]any, error) {
	record, ok := result.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("%s must be an object", field)
	}
	scenarioID, err := normalizeNonEmptyString(record["scenarioId"], field+".scenarioId")
	if err != nil {
		return nil, err
	}
	normalized := map[string]any{
		"scenarioId": scenarioID,
	}
	if status, err := normalizeOptionalString(record["status"], field+".status"); err != nil {
		return nil, err
	} else if status != nil {
		if _, ok := resultStatusValues[*status]; !ok {
			return nil, fmt.Errorf("%s.status must be one of %s", field, strings.Join(sortedKeys(resultStatusValues), ", "))
		}
		normalized["status"] = *status
	}
	if overallScore, err := normalizeNonNegativeNumber(record["overallScore"], field+".overallScore"); err != nil {
		return nil, err
	} else if overallScore != nil {
		normalized["overallScore"] = *overallScore
	}
	if passRate, err := normalizeNonNegativeNumber(record["passRate"], field+".passRate"); err != nil {
		return nil, err
	} else if passRate != nil {
		if *passRate > 1 {
			return nil, fmt.Errorf("%s.passRate must be <= 1", field)
		}
		normalized["passRate"] = *passRate
	}
	for _, timeField := range []string{"timestamp", "startedAt", "completedAt"} {
		value, err := normalizeISOTimestamp(record[timeField], field+"."+timeField)
		if err != nil {
			return nil, err
		}
		if value != nil {
			normalized[timeField] = *value
		}
	}
	if durationMs, err := normalizeNonNegativeNumber(record["durationMs"], field+".durationMs"); err != nil {
		return nil, err
	} else if durationMs != nil {
		normalized["durationMs"] = *durationMs
	}
	if telemetry, err := normalizeScenarioTelemetry(record["telemetry"], field+".telemetry"); err != nil {
		return nil, err
	} else if telemetry != nil {
		normalized["telemetry"] = telemetry
	}
	return normalized, nil
}

func NormalizeScenarioResultsPacket(value any, field string) (map[string]any, error) {
	record, ok := value.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("%s must be an object", field)
	}
	if record["schemaVersion"] != contracts.ScenarioResultsSchema {
		return nil, fmt.Errorf("%s.schemaVersion must be %s", field, contracts.ScenarioResultsSchema)
	}
	rawResults, err := assertArray(record["results"], field+".results")
	if err != nil {
		return nil, err
	}
	results := make([]any, 0, len(rawResults))
	for index, entry := range rawResults {
		normalized, err := normalizeScenarioResult(entry, fmt.Sprintf("%s.results[%d]", field, index))
		if err != nil {
			return nil, err
		}
		results = append(results, normalized)
	}
	normalized := map[string]any{
		"schemaVersion": contracts.ScenarioResultsSchema,
		"results":       results,
	}
	if source, err := normalizeOptionalString(record["source"], field+".source"); err != nil {
		return nil, err
	} else if source != nil {
		normalized["source"] = *source
	}
	if generatedAt, err := normalizeISOTimestamp(record["generatedAt"], field+".generatedAt"); err != nil {
		return nil, err
	} else if generatedAt != nil {
		normalized["generatedAt"] = *generatedAt
	}
	if mode, err := normalizeOptionalString(record["mode"], field+".mode"); err != nil {
		return nil, err
	} else if mode != nil {
		if _, ok := modeValues[*mode]; !ok {
			return nil, fmt.Errorf("%s.mode must be one of %s", field, strings.Join(sortedKeys(modeValues), ", "))
		}
		normalized["mode"] = *mode
	}
	if compareArtifact, err := normalizeCompareArtifact(record["compareArtifact"], field+".compareArtifact"); err != nil {
		return nil, err
	} else if compareArtifact != nil {
		normalized["compareArtifact"] = compareArtifact
	}
	return normalized, nil
}

func sortedKeys(values map[string]struct{}) []string {
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	return keys
}
