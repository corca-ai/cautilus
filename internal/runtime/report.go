package runtime

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

var commandObservationNumericFields = []string{"prompt_tokens", "completion_tokens", "total_tokens", "cost_usd"}

func ValidateReportPacket(packet map[string]any, label string) error {
	if packet == nil {
		return fmt.Errorf("%s must be a JSON object", label)
	}
	if schemaVersion, _ := packet["schemaVersion"].(string); schemaVersion == "cautilus.report_packet.v1" {
		return fmt.Errorf("%s uses legacy schemaVersion cautilus.report_packet.v1; rebuild it as %s with `cautilus report build` and update any checked-in fixtures", label, contracts.ReportPacketSchema)
	}
	if packet["schemaVersion"] != contracts.ReportPacketSchema {
		return fmt.Errorf("%s must use schemaVersion %s", label, contracts.ReportPacketSchema)
	}
	intent, err := normalizeNonEmptyString(packet["intent"], label+".intent")
	if err != nil {
		return err
	}
	for _, field := range []string{"generatedAt", "candidate", "baseline", "recommendation"} {
		if _, err := normalizeNonEmptyString(packet[field], label+"."+field); err != nil {
			return err
		}
	}
	intentProfile, ok := packet["intentProfile"].(map[string]any)
	if !ok {
		return fmt.Errorf("%s.intentProfile must be an object", label)
	}
	if intentProfile["schemaVersion"] != contracts.BehaviorIntentSchema {
		return fmt.Errorf("%s.intentProfile.schemaVersion must be %s", label, contracts.BehaviorIntentSchema)
	}
	summary, err := normalizeNonEmptyString(intentProfile["summary"], label+".intentProfile.summary")
	if err != nil {
		return err
	}
	if summary != intent {
		return fmt.Errorf("%s.intentProfile.summary must exactly match %s.intent", label, label)
	}
	if _, err := normalizeAdapterContext(packet["adapterContext"], label+".adapterContext"); err != nil {
		return err
	}
	_, err = BuildBehaviorIntentProfile(summary, intentProfile, BehaviorSurfaces["OPERATOR_BEHAVIOR"], nil, nil)
	return err
}

func BuildReportPacket(input map[string]any, now time.Time) (map[string]any, error) {
	if input == nil {
		return nil, fmt.Errorf("input must be an object")
	}
	if input["schemaVersion"] != contracts.ReportInputsSchema {
		return nil, fmt.Errorf("schemaVersion must be %s", contracts.ReportInputsSchema)
	}
	rawModeRuns, err := assertArray(input["modeRuns"], "modeRuns")
	if err != nil {
		return nil, err
	}
	modeRuns := make([]map[string]any, 0, len(rawModeRuns))
	for index, entry := range rawModeRuns {
		normalized, err := normalizeModeRun(entry, index)
		if err != nil {
			return nil, err
		}
		modeRuns = append(modeRuns, normalized)
	}
	commands, err := normalizeCommands(input["commands"])
	if err != nil {
		return nil, err
	}
	commandObservations, err := normalizeCommandObservations(input["commandObservations"])
	if err != nil {
		return nil, err
	}
	humanReviewFindings, err := normalizeReviewFindings(input["humanReviewFindings"])
	if err != nil {
		return nil, err
	}
	adapterContext, err := normalizeAdapterContext(input["adapterContext"], "adapterContext")
	if err != nil {
		return nil, err
	}
	runtimePolicy, err := normalizeRuntimePolicy(input["runtimePolicy"], "runtimePolicy")
	if err != nil {
		return nil, err
	}
	modeSummaries := make([]any, 0, len(modeRuns))
	modesRun := make([]string, 0, len(modeRuns))
	for _, modeRun := range modeRuns {
		modesRun = append(modesRun, modeRun["mode"].(string))
		scenarioSummary, err := buildModeScenarioTelemetry(modeRun, now)
		if err != nil {
			return nil, err
		}
		modeSummary := map[string]any{
			"mode":   modeRun["mode"],
			"status": modeRun["status"],
		}
		copyIfPresent(modeRun, modeSummary, "summary", "startedAt", "completedAt", "durationMs")
		if telemetry := createModeTelemetry(modeRun, scenarioSummary); telemetry != nil {
			modeSummary["telemetry"] = telemetry
		}
		if scenarioResults, ok := modeRun["scenarioResults"].(map[string]any); ok {
			if compareArtifact, ok := scenarioResults["compareArtifact"]; ok && compareArtifact != nil {
				modeSummary["compareArtifact"] = compareArtifact
			}
		}
		if scenarioSummary != nil {
			modeSummary["scenarioTelemetrySummary"] = scenarioSummary
		}
		reasonCodes, warnings := classifyModeSummary(modeSummary, modeRun, commandObservations)
		if len(reasonCodes) > 0 {
			modeSummary["reasonCodes"] = reasonCodes
		}
		if len(warnings) > 0 {
			modeSummary["warnings"] = warnings
			warningSummaries := make([]string, 0, len(warnings))
			for _, rawWarning := range warnings {
				if summary := stringFromAny(asMap(rawWarning)["summary"]); strings.TrimSpace(summary) != "" {
					warningSummaries = append(warningSummaries, summary)
				}
			}
			if len(warningSummaries) > 0 {
				existingSummary := stringFromAny(modeSummary["summary"])
				if strings.TrimSpace(existingSummary) != "" {
					modeSummary["summary"] = existingSummary + " Warning: " + strings.Join(warningSummaries, " ")
				} else {
					modeSummary["summary"] = "Warning: " + strings.Join(warningSummaries, " ")
				}
			}
		}
		modeSummaries = append(modeSummaries, modeSummary)
	}
	intent, err := normalizeNonEmptyString(input["intent"], "intent")
	if err != nil {
		return nil, err
	}
	intentProfile, err := BuildBehaviorIntentProfile(intent, asMap(input["intentProfile"]), BehaviorSurfaces["OPERATOR_BEHAVIOR"], nil, nil)
	if err != nil {
		return nil, err
	}
	reasonCodes, warnings := summarizeReportReasons(modeSummaries)
	reportTelemetry := summarizeReportTelemetry(modeSummaries)
	report := map[string]any{
		"schemaVersion":       contracts.ReportPacketSchema,
		"generatedAt":         now.UTC().Format(time.RFC3339Nano),
		"candidate":           mustString(input["candidate"], "candidate"),
		"baseline":            mustString(input["baseline"], "baseline"),
		"intent":              intent,
		"intentProfile":       intentProfile,
		"commands":            commands,
		"commandObservations": commandObservations,
		"modesRun":            modesRun,
		"modeSummaries":       modeSummaries,
		"telemetry":           reportTelemetry,
		"improved":            normalizeBucketOrEmpty(input["improved"], "improved"),
		"regressed":           normalizeBucketOrEmpty(input["regressed"], "regressed"),
		"unchanged":           normalizeBucketOrEmpty(input["unchanged"], "unchanged"),
		"noisy":               normalizeBucketOrEmpty(input["noisy"], "noisy"),
		"humanReviewFindings": humanReviewFindings,
		"recommendation":      mustString(input["recommendation"], "recommendation"),
	}
	if len(reasonCodes) > 0 {
		report["reasonCodes"] = reasonCodes
	}
	if len(warnings) > 0 {
		report["warnings"] = warnings
	}
	if adapterContext != nil {
		report["adapterContext"] = adapterContext
	}
	if runtimePolicy != nil {
		report["runtimePolicy"] = runtimePolicy
	}
	if runtimeContext := buildRuntimeContext(
		map[string]any{"telemetry": reportTelemetry},
		asMap(input["priorEvidence"]),
		runtimeContextSource(input),
		runtimePolicy,
	); runtimeContext != nil {
		report["runtimeContext"] = runtimeContext
	}
	return report, nil
}

func normalizeModeRun(value any, index int) (map[string]any, error) {
	record, ok := value.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("modeRuns[%d] must be an object", index)
	}
	if _, found := record["candidateResults"]; found {
		return nil, fmt.Errorf("modeRuns[%d].candidateResults is no longer supported; use scenarioResults", index)
	}
	mode, err := normalizeNonEmptyString(record["mode"], fmt.Sprintf("modeRuns[%d].mode", index))
	if err != nil {
		return nil, err
	}
	if _, ok := modeValues[mode]; !ok {
		return nil, fmt.Errorf("modeRuns[%d].mode must be one of %s", index, strings.Join(sortedKeys(modeValues), ", "))
	}
	status := "completed"
	if rawStatus, err := normalizeOptionalString(record["status"], fmt.Sprintf("modeRuns[%d].status", index)); err != nil {
		return nil, err
	} else if rawStatus != nil {
		status = *rawStatus
	}
	normalized := map[string]any{
		"mode":   mode,
		"status": status,
	}
	if err := copyNormalizedOptionalString(record, normalized, "summary", fmt.Sprintf("modeRuns[%d]", index)); err != nil {
		return nil, err
	}
	if err := copyNormalizedOptionalTime(record, normalized, "startedAt", fmt.Sprintf("modeRuns[%d]", index)); err != nil {
		return nil, err
	}
	if err := copyNormalizedOptionalTime(record, normalized, "completedAt", fmt.Sprintf("modeRuns[%d]", index)); err != nil {
		return nil, err
	}
	if err := copyNormalizedOptionalNumber(record, normalized, "durationMs", fmt.Sprintf("modeRuns[%d]", index)); err != nil {
		return nil, err
	}
	if telemetry, err := normalizeScenarioTelemetry(record["telemetry"], fmt.Sprintf("modeRuns[%d].telemetry", index)); err != nil {
		return nil, err
	} else if telemetry != nil {
		normalized["telemetry"] = telemetry
	}
	if rawScenarioResults, exists := record["scenarioResults"]; exists && rawScenarioResults != nil {
		if scenarioResults, err := NormalizeScenarioResultsPacket(rawScenarioResults, fmt.Sprintf("modeRuns[%d].scenarioResults", index)); err != nil {
			return nil, err
		} else if scenarioResults != nil {
			normalized["scenarioResults"] = scenarioResults
		}
	}
	return normalized, nil
}

func normalizeCommands(value any) ([]any, error) {
	items, err := assertArray(value, "commands")
	if err != nil {
		return nil, err
	}
	result := make([]any, 0, len(items))
	for index, entry := range items {
		record, ok := entry.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("commands[%d] must be an object", index)
		}
		mode, err := normalizeNonEmptyString(record["mode"], fmt.Sprintf("commands[%d].mode", index))
		if err != nil {
			return nil, err
		}
		if _, ok := modeValues[mode]; !ok {
			return nil, fmt.Errorf("commands[%d].mode must be one of %s", index, strings.Join(sortedKeys(modeValues), ", "))
		}
		command, err := normalizeNonEmptyString(record["command"], fmt.Sprintf("commands[%d].command", index))
		if err != nil {
			return nil, err
		}
		normalized := map[string]any{"mode": mode, "command": command}
		if label, err := normalizeOptionalString(record["label"], fmt.Sprintf("commands[%d].label", index)); err != nil {
			return nil, err
		} else if label != nil {
			normalized["label"] = *label
		}
		result = append(result, normalized)
	}
	return result, nil
}

func normalizeCommandObservations(value any) ([]any, error) {
	items, err := assertArray(value, "commandObservations")
	if err != nil {
		return nil, err
	}
	result := make([]any, 0, len(items))
	for index, entry := range items {
		record, ok := entry.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("commandObservations[%d] must be an object", index)
		}
		stage, err := normalizeNonEmptyString(record["stage"], fmt.Sprintf("commandObservations[%d].stage", index))
		if err != nil {
			return nil, err
		}
		status, err := normalizeNonEmptyString(record["status"], fmt.Sprintf("commandObservations[%d].status", index))
		if err != nil {
			return nil, err
		}
		command, err := normalizeNonEmptyString(record["command"], fmt.Sprintf("commandObservations[%d].command", index))
		if err != nil {
			return nil, err
		}
		normalized := map[string]any{
			"stage":   stage,
			"status":  status,
			"command": command,
			"index":   float64(index + 1),
		}
		if explicitIndex, err := normalizeNonNegativeNumber(record["index"], fmt.Sprintf("commandObservations[%d].index", index)); err != nil {
			return nil, err
		} else if explicitIndex != nil {
			normalized["index"] = *explicitIndex
		}
		for _, field := range []string{"startedAt", "completedAt"} {
			if err := copyNormalizedOptionalTime(record, normalized, field, fmt.Sprintf("commandObservations[%d]", index)); err != nil {
				return nil, err
			}
		}
		for _, field := range []string{"durationMs", "exitCode"} {
			if err := copyNormalizedOptionalNumber(record, normalized, field, fmt.Sprintf("commandObservations[%d]", index)); err != nil {
				return nil, err
			}
		}
		for _, field := range []string{"signal", "stdoutFile", "stderrFile"} {
			if err := copyNormalizedOptionalString(record, normalized, field, fmt.Sprintf("commandObservations[%d]", index)); err != nil {
				return nil, err
			}
		}
		result = append(result, normalized)
	}
	return result, nil
}

func normalizeReviewFindings(value any) ([]any, error) {
	items, err := assertArray(value, "humanReviewFindings")
	if err != nil {
		return nil, err
	}
	result := make([]any, 0, len(items))
	for index, entry := range items {
		record, ok := entry.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("humanReviewFindings[%d] must be an object (%s)", index, reviewFindingShapeHint())
		}
		severity, err := normalizeNonEmptyString(record["severity"], fmt.Sprintf("humanReviewFindings[%d].severity", index))
		if err != nil {
			return nil, fmt.Errorf("%w (%s)", err, reviewFindingShapeHint())
		}
		message, err := normalizeNonEmptyString(record["message"], fmt.Sprintf("humanReviewFindings[%d].message", index))
		if err != nil {
			return nil, fmt.Errorf("%w (%s)", err, reviewFindingShapeHint())
		}
		normalized := map[string]any{"severity": severity, "message": message}
		if err := copyNormalizedOptionalString(record, normalized, "path", fmt.Sprintf("humanReviewFindings[%d]", index)); err != nil {
			return nil, fmt.Errorf("%w (%s)", err, reviewFindingShapeHint())
		}
		result = append(result, normalized)
	}
	return result, nil
}

func reviewFindingShapeHint() string {
	return `minimum shape: {"severity":"concern","message":"Concrete review feedback","path":"optional/path.md"}`
}

func normalizeAdapterContext(value any, field string) (map[string]any, error) {
	if value == nil {
		return nil, nil
	}
	record, ok := value.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("%s must be an object", field)
	}
	normalized := map[string]any{}
	if err := copyNormalizedOptionalString(record, normalized, "adapter", field); err != nil {
		return nil, err
	}
	if err := copyNormalizedOptionalString(record, normalized, "adapterName", field); err != nil {
		return nil, err
	}
	if len(normalized) == 0 {
		return nil, nil
	}
	return normalized, nil
}

func InferAdapterSelectionFromReport(report map[string]any) (*string, *string) {
	adapterContext := asMap(report["adapterContext"])
	var adapter *string
	var adapterName *string
	if value := strings.TrimSpace(stringOrEmpty(adapterContext["adapter"])); value != "" {
		adapter = &value
	}
	if value := strings.TrimSpace(stringOrEmpty(adapterContext["adapterName"])); value != "" {
		adapterName = &value
	}
	return adapter, adapterName
}

func buildModeScenarioTelemetry(modeRun map[string]any, now time.Time) (map[string]any, error) {
	scenarioResults, ok := modeRun["scenarioResults"].(map[string]any)
	if !ok {
		return nil, nil
	}
	rawResults, _ := scenarioResults["results"].([]any)
	if len(rawResults) == 0 {
		return nil, nil
	}
	return SummarizeScenarioTelemetryEntries(rawResults, now, "report_mode:"+modeRun["mode"].(string))
}

func createModeTelemetry(modeRun map[string]any, scenarioTelemetrySummary map[string]any) map[string]any {
	telemetry := map[string]any{}
	copyIfPresent(modeRun, telemetry, "startedAt", "completedAt", "durationMs")
	scenarioOverall := asMap(scenarioTelemetrySummary["overall"])
	for _, field := range commandObservationNumericFields {
		if value := chooseNumber(asMap(modeRun["telemetry"])[field], scenarioOverall[field]); value != nil {
			telemetry[field] = value
		}
	}
	providers := uniqueStrings(append(stringValue(asMap(modeRun["telemetry"])["provider"]), stringSliceValue(scenarioOverall["providers"])...))
	if len(providers) > 0 {
		telemetry["providers"] = providers
	}
	models := uniqueStrings(append(stringValue(asMap(modeRun["telemetry"])["model"]), stringSliceValue(scenarioOverall["models"])...))
	if len(models) > 0 {
		telemetry["models"] = models
	}
	if fingerprint := runtimeFingerprintFromEvidence(map[string]any{"telemetry": asMap(modeRun["telemetry"])}); len(fingerprint) > 0 {
		telemetry["runtimeFingerprint"] = fingerprint
	}
	if len(telemetry) == 0 {
		return nil
	}
	return telemetry
}

func summarizeReportTelemetry(modeSummaries []any) map[string]any {
	summary := map[string]any{
		"modeCount":                len(modeSummaries),
		"modesWithScenarioResults": countModeSummariesWithScenarioResults(modeSummaries),
	}
	startedAtValues := collectModeSummaryTimes(modeSummaries, "startedAt", true)
	if len(startedAtValues) > 0 {
		summary["startedAt"] = startedAtValues[0]
	}
	completedAtValues := collectModeSummaryTimes(modeSummaries, "completedAt", false)
	if len(completedAtValues) > 0 {
		summary["completedAt"] = completedAtValues[0]
	}
	if totalDuration, ok := sumModeTelemetryField(modeSummaries, "durationMs"); ok {
		summary["durationMs"] = totalDuration
	}
	for _, field := range commandObservationNumericFields {
		if total, ok := sumModeTelemetryField(modeSummaries, field); ok {
			summary[field] = total
		}
	}
	if providers := collectModeSummaryStrings(modeSummaries, "providers"); len(providers) > 0 {
		summary["providers"] = providers
	}
	if models := collectModeSummaryStrings(modeSummaries, "models"); len(models) > 0 {
		summary["models"] = models
	}
	if fingerprints := collectModeSummaryRuntimeFingerprints(modeSummaries); len(fingerprints) > 0 {
		summary["runtimeFingerprints"] = fingerprints
		if len(fingerprints) == 1 {
			summary["runtimeFingerprint"] = asMap(fingerprints[0])
		}
	} else if fingerprint := runtimeFingerprintFromSummary(summary); len(fingerprint) > 0 {
		summary["runtimeFingerprint"] = fingerprint
	}
	return summary
}

func collectModeSummaryRuntimeFingerprints(modeSummaries []any) []any {
	seen := map[string]struct{}{}
	result := []any{}
	for _, raw := range modeSummaries {
		fingerprint := runtimeFingerprintFromEvidence(map[string]any{"telemetry": asMap(asMap(raw)["telemetry"])})
		if len(fingerprint) == 0 {
			continue
		}
		keyParts := []string{}
		for _, field := range runtimeFingerprintFields {
			keyParts = append(keyParts, field+"="+stringOrEmpty(fingerprint[field]))
		}
		key := strings.Join(keyParts, "\x00")
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		result = append(result, fingerprint)
	}
	return result
}

func normalizeBucketOrEmpty(value any, field string) []any {
	bucket, err := normalizeScenarioBucket(value, field)
	if err != nil {
		return []any{}
	}
	return bucket
}

func copyNormalizedOptionalString(source map[string]any, target map[string]any, field string, label string) error {
	value, err := normalizeOptionalString(source[field], label+"."+field)
	if err != nil {
		return err
	}
	if value != nil {
		target[field] = *value
	}
	return nil
}

func copyNormalizedOptionalTime(source map[string]any, target map[string]any, field string, label string) error {
	value, err := normalizeISOTimestamp(source[field], label+"."+field)
	if err != nil {
		return err
	}
	if value != nil {
		target[field] = *value
	}
	return nil
}

func copyNormalizedOptionalNumber(source map[string]any, target map[string]any, field string, label string) error {
	value, err := normalizeNonNegativeNumber(source[field], label+"."+field)
	if err != nil {
		return err
	}
	if value != nil {
		target[field] = *value
	}
	return nil
}

func copyIfPresent(source map[string]any, target map[string]any, fields ...string) {
	for _, field := range fields {
		if value, ok := source[field]; ok && value != nil {
			target[field] = value
		}
	}
}

func chooseNumber(explicit any, fallback any) any {
	if value, ok := toFloat(explicit); ok {
		return value
	}
	if value, ok := toFloat(fallback); ok {
		return value
	}
	return nil
}

func stringValue(value any) []string {
	text, ok := value.(string)
	if !ok || strings.TrimSpace(text) == "" {
		return nil
	}
	return []string{text}
}

func stringSliceValue(value any) []string {
	items, ok := value.([]any)
	if !ok {
		if typed, ok := value.([]string); ok {
			return typed
		}
		return nil
	}
	result := make([]string, 0, len(items))
	for _, item := range items {
		if text, ok := item.(string); ok && strings.TrimSpace(text) != "" {
			result = append(result, text)
		}
	}
	return result
}

func countModeSummariesWithScenarioResults(modeSummaries []any) int {
	count := 0
	for _, raw := range modeSummaries {
		if _, ok := asMap(raw)["scenarioTelemetrySummary"]; ok {
			count++
		}
	}
	return count
}

func collectModeSummaryTimes(modeSummaries []any, field string, ascending bool) []string {
	values := make([]string, 0)
	for _, raw := range modeSummaries {
		record := asMap(raw)
		if value, ok := record[field].(string); ok && strings.TrimSpace(value) != "" {
			values = append(values, value)
			continue
		}
		if value, ok := asMap(record["telemetry"])[field].(string); ok && strings.TrimSpace(value) != "" {
			values = append(values, value)
		}
	}
	sort.Slice(values, func(left, right int) bool {
		if ascending {
			return parseISOTime(values[left]) < parseISOTime(values[right])
		}
		return parseISOTime(values[right]) < parseISOTime(values[left])
	})
	return values
}

func sumModeTelemetryField(modeSummaries []any, field string) (float64, bool) {
	seen := false
	total := 0.0
	for _, raw := range modeSummaries {
		record := asMap(raw)
		if value, ok := toFloat(asMap(record["telemetry"])[field]); ok {
			seen = true
			total += value
		}
	}
	if !seen {
		return 0, false
	}
	return round12(total), true
}

func collectModeSummaryStrings(modeSummaries []any, field string) []string {
	values := make([]string, 0)
	for _, raw := range modeSummaries {
		values = append(values, stringSliceValue(asMap(asMap(raw)["telemetry"])[field])...)
	}
	return uniqueStrings(values)
}

func mustString(value any, field string) string {
	text, _ := normalizeNonEmptyString(value, field)
	return text
}
