package runtime

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

type instructionSurfaceEvaluationInput struct {
	evaluationID              string
	displayName               string
	prompt                    string
	taskPath                  *string
	startedAt                 string
	observationStatus         string
	summary                   string
	entryFile                 *string
	loadedInstructionFiles    []string
	loadedSupportingFiles     []string
	routingDecision           map[string]any
	instructionSurface        map[string]any
	expectedEntryFile         *string
	requiredInstructionFiles  []string
	forbiddenInstructionFiles []string
	requiredSupportingFiles   []string
	forbiddenSupportingFiles  []string
	expectedRouting           map[string]any
	blockerKind               *string
	artifactRefs              []any
	telemetry                 map[string]any
}

func BuildInstructionSurfaceSummary(input map[string]any, now time.Time) (map[string]any, error) {
	if input["schemaVersion"] != contracts.InstructionSurfaceInputsSchema {
		return nil, fmt.Errorf("schemaVersion must be %s", contracts.InstructionSurfaceInputsSchema)
	}
	suiteID, err := normalizeNonEmptyString(input["suiteId"], "suiteId")
	if err != nil {
		return nil, err
	}
	suiteDisplayName := suiteID
	if value, err := normalizeOptionalString(input["suiteDisplayName"], "suiteDisplayName"); err != nil {
		return nil, err
	} else if value != nil {
		suiteDisplayName = *value
	}
	rawEvaluations, err := assertArray(input["evaluations"], "evaluations")
	if err != nil {
		return nil, err
	}
	if len(rawEvaluations) == 0 {
		return nil, fmt.Errorf("evaluations must be a non-empty array")
	}
	counts := map[string]int{"total": 0, "passed": 0, "failed": 0, "blocked": 0}
	surfaceSummary := map[string]any{
		"entryFileMatches":                   0,
		"entryFileMismatches":                0,
		"requiredInstructionFileMisses":      0,
		"forbiddenInstructionFileViolations": 0,
		"requiredSupportingFileMisses":       0,
		"forbiddenSupportingFileViolations":  0,
	}
	routingSummary := map[string]any{
		"evaluationsWithRoutingDecision": 0,
		"evaluationsWithExpectedRoute":   0,
		"matchedExpectedRoute":           0,
		"mismatchedExpectedRoute":        0,
		"selectedSkillCounts":            map[string]any{},
	}
	variantAccumulators := map[string]map[string]any{}
	evaluations := make([]any, 0, len(rawEvaluations))
	for index, rawEvaluation := range rawEvaluations {
		record, ok := rawEvaluation.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("evaluations[%d] must be an object", index)
		}
		evaluation, err := normalizeInstructionSurfaceEvaluationInput(record, index, now)
		if err != nil {
			return nil, err
		}
		result := evaluateInstructionSurfaceEvaluation(evaluation)
		status := stringOrEmpty(result["status"])
		counts["total"]++
		counts[status]++
		accumulateInstructionSurfaceSummary(surfaceSummary, asMap(result["expectationResults"]))
		accumulateInstructionRoutingSummary(routingSummary, asMap(result["routingEvaluation"]))
		accumulateInstructionVariantSummary(variantAccumulators, asMap(result["instructionSurface"]), status, asMap(result["routingEvaluation"]))
		evaluations = append(evaluations, result)
	}
	recommendation := "accept-now"
	if counts["failed"] > 0 {
		recommendation = "reject"
	} else if counts["blocked"] > 0 {
		recommendation = "defer"
	}
	return map[string]any{
		"schemaVersion":    contracts.InstructionSurfaceSummarySchema,
		"suiteId":          suiteID,
		"suiteDisplayName": suiteDisplayName,
		"evaluatedAt":      now.UTC().Format(time.RFC3339Nano),
		"recommendation":   recommendation,
		"evaluationCounts": map[string]any{
			"total":   counts["total"],
			"passed":  counts["passed"],
			"failed":  counts["failed"],
			"blocked": counts["blocked"],
		},
		"surfaceSummary":   surfaceSummary,
		"routingSummary":   routingSummary,
		"variantSummaries": finalizeInstructionVariantSummaries(variantAccumulators),
		"evaluations":      evaluations,
	}, nil
}

func normalizeInstructionSurfaceEvaluationInput(input map[string]any, index int, now time.Time) (*instructionSurfaceEvaluationInput, error) {
	evaluationID, err := normalizeNonEmptyString(input["evaluationId"], fmt.Sprintf("evaluations[%d].evaluationId", index))
	if err != nil {
		return nil, err
	}
	displayName := evaluationID
	if value, err := normalizeOptionalString(input["displayName"], fmt.Sprintf("evaluations[%d].displayName", index)); err != nil {
		return nil, err
	} else if value != nil {
		displayName = *value
	}
	prompt, err := normalizeNonEmptyString(input["prompt"], fmt.Sprintf("evaluations[%d].prompt", index))
	if err != nil {
		return nil, err
	}
	taskPath, err := normalizeOptionalString(input["taskPath"], fmt.Sprintf("evaluations[%d].taskPath", index))
	if err != nil {
		return nil, err
	}
	startedAt, err := normalizeISOTimestamp(input["startedAt"], fmt.Sprintf("evaluations[%d].startedAt", index))
	if err != nil {
		return nil, err
	}
	if startedAt == nil {
		value := now.UTC().Format(time.RFC3339Nano)
		startedAt = &value
	}
	observationStatus, err := normalizeNonEmptyString(input["observationStatus"], fmt.Sprintf("evaluations[%d].observationStatus", index))
	if err != nil {
		return nil, err
	}
	if !containsString([]string{"observed", "blocked"}, observationStatus) {
		return nil, fmt.Errorf("evaluations[%d].observationStatus must be one of: observed, blocked", index)
	}
	summary, err := normalizeNonEmptyString(input["summary"], fmt.Sprintf("evaluations[%d].summary", index))
	if err != nil {
		return nil, err
	}
	entryFile, err := normalizeOptionalString(input["entryFile"], fmt.Sprintf("evaluations[%d].entryFile", index))
	if err != nil {
		return nil, err
	}
	loadedInstructionFiles, err := normalizeInstructionSurfacePathList(input["loadedInstructionFiles"], fmt.Sprintf("evaluations[%d].loadedInstructionFiles", index))
	if err != nil {
		return nil, err
	}
	loadedSupportingFiles, err := normalizeInstructionSurfacePathList(input["loadedSupportingFiles"], fmt.Sprintf("evaluations[%d].loadedSupportingFiles", index))
	if err != nil {
		return nil, err
	}
	routingDecision, err := normalizeInstructionRoutingDecision(input["routingDecision"], fmt.Sprintf("evaluations[%d].routingDecision", index))
	if err != nil {
		return nil, err
	}
	instructionSurface, err := normalizeObservedInstructionSurface(input["instructionSurface"], fmt.Sprintf("evaluations[%d].instructionSurface", index))
	if err != nil {
		return nil, err
	}
	expectedEntryFile, err := normalizeOptionalString(input["expectedEntryFile"], fmt.Sprintf("evaluations[%d].expectedEntryFile", index))
	if err != nil {
		return nil, err
	}
	requiredInstructionFiles, err := normalizeInstructionSurfacePathList(input["requiredInstructionFiles"], fmt.Sprintf("evaluations[%d].requiredInstructionFiles", index))
	if err != nil {
		return nil, err
	}
	forbiddenInstructionFiles, err := normalizeInstructionSurfacePathList(input["forbiddenInstructionFiles"], fmt.Sprintf("evaluations[%d].forbiddenInstructionFiles", index))
	if err != nil {
		return nil, err
	}
	requiredSupportingFiles, err := normalizeInstructionSurfacePathList(input["requiredSupportingFiles"], fmt.Sprintf("evaluations[%d].requiredSupportingFiles", index))
	if err != nil {
		return nil, err
	}
	forbiddenSupportingFiles, err := normalizeInstructionSurfacePathList(input["forbiddenSupportingFiles"], fmt.Sprintf("evaluations[%d].forbiddenSupportingFiles", index))
	if err != nil {
		return nil, err
	}
	expectedRouting, err := normalizeInstructionSurfaceExpectedRouting(input["expectedRouting"], fmt.Sprintf("evaluations[%d].expectedRouting", index))
	if err != nil {
		return nil, err
	}
	blockerKind, err := normalizeOptionalString(input["blockerKind"], fmt.Sprintf("evaluations[%d].blockerKind", index))
	if err != nil {
		return nil, err
	}
	artifactRefs, err := normalizeSkillArtifactRefs(input["artifactRefs"], fmt.Sprintf("evaluations[%d].artifactRefs", index))
	if err != nil {
		return nil, err
	}
	telemetry, err := normalizeScenarioTelemetry(input["telemetry"], fmt.Sprintf("evaluations[%d].telemetry", index))
	if err != nil {
		return nil, err
	}
	return &instructionSurfaceEvaluationInput{
		evaluationID:              evaluationID,
		displayName:               displayName,
		prompt:                    prompt,
		taskPath:                  taskPath,
		startedAt:                 *startedAt,
		observationStatus:         observationStatus,
		summary:                   summary,
		entryFile:                 entryFile,
		loadedInstructionFiles:    loadedInstructionFiles,
		loadedSupportingFiles:     loadedSupportingFiles,
		routingDecision:           routingDecision,
		instructionSurface:        instructionSurface,
		expectedEntryFile:         expectedEntryFile,
		requiredInstructionFiles:  requiredInstructionFiles,
		forbiddenInstructionFiles: forbiddenInstructionFiles,
		requiredSupportingFiles:   requiredSupportingFiles,
		forbiddenSupportingFiles:  forbiddenSupportingFiles,
		expectedRouting:           expectedRouting,
		blockerKind:               blockerKind,
		artifactRefs:              artifactRefs,
		telemetry:                 telemetry,
	}, nil
}

func normalizeInstructionRoutingDecision(value any, field string) (map[string]any, error) {
	if value == nil {
		return nil, nil
	}
	record := asMap(value)
	if len(record) == 0 {
		return nil, fmt.Errorf("%s must be an object", field)
	}
	normalized := map[string]any{}
	for _, key := range []string{"selectedSkill", "selectedSupport", "firstToolCall", "reasonSummary"} {
		if rawValue, ok := record[key]; ok {
			text, err := normalizeNonEmptyString(rawValue, field+"."+key)
			if err != nil {
				return nil, err
			}
			normalized[key] = text
		}
	}
	return normalized, nil
}

func normalizeObservedInstructionSurface(value any, field string) (map[string]any, error) {
	record := asMap(value)
	if len(record) == 0 {
		return nil, fmt.Errorf("%s must be an object", field)
	}
	surfaceLabel, err := normalizeNonEmptyString(record["surfaceLabel"], field+".surfaceLabel")
	if err != nil {
		return nil, err
	}
	rawFiles, err := assertArray(record["files"], field+".files")
	if err != nil {
		return nil, err
	}
	files := make([]any, 0, len(rawFiles))
	for index, rawFile := range rawFiles {
		entry, ok := rawFile.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("%s.files[%d] must be an object", field, index)
		}
		path, err := normalizeNonEmptyString(entry["path"], fmt.Sprintf("%s.files[%d].path", field, index))
		if err != nil {
			return nil, err
		}
		normalizedFile := map[string]any{"path": path}
		kind := "file"
		if value, err := normalizeOptionalString(entry["kind"], fmt.Sprintf("%s.files[%d].kind", field, index)); err != nil {
			return nil, err
		} else if value != nil {
			kind = *value
		}
		normalizedFile["kind"] = kind
		for _, key := range []string{"sourceKind", "sourceFile", "targetPath", "artifactPath"} {
			if value, err := normalizeOptionalString(entry[key], fmt.Sprintf("%s.files[%d].%s", field, index, key)); err != nil {
				return nil, err
			} else if value != nil {
				normalizedFile[key] = *value
			}
		}
		files = append(files, normalizedFile)
	}
	return map[string]any{
		"surfaceLabel": surfaceLabel,
		"files":        files,
	}, nil
}

func evaluateInstructionSurfaceEvaluation(evaluation *instructionSurfaceEvaluationInput) map[string]any {
	entryResult := evaluateInstructionEntryFile(evaluation.expectedEntryFile, evaluation.entryFile)
	instructionFilesResult := evaluateInstructionFileList(evaluation.requiredInstructionFiles, evaluation.forbiddenInstructionFiles, evaluation.loadedInstructionFiles)
	supportingFilesResult := evaluateInstructionFileList(evaluation.requiredSupportingFiles, evaluation.forbiddenSupportingFiles, evaluation.loadedSupportingFiles)
	routingResult := evaluateInstructionRouting(evaluation.expectedRouting, evaluation.routingDecision)
	expectationResults := map[string]any{
		"entryFile":        entryResult,
		"instructionFiles": instructionFilesResult,
		"supportingFiles":  supportingFilesResult,
		"routing":          routingResult,
	}
	status := "passed"
	if evaluation.observationStatus == "blocked" {
		status = "blocked"
	} else if expectationFailed(expectationResults) {
		status = "failed"
	}
	result := map[string]any{
		"evaluationId":           evaluation.evaluationID,
		"displayName":            evaluation.displayName,
		"surface":                "instruction_surface_fidelity",
		"startedAt":              evaluation.startedAt,
		"status":                 status,
		"summary":                evaluation.summary,
		"prompt":                 evaluation.prompt,
		"observationStatus":      evaluation.observationStatus,
		"instructionSurface":     evaluation.instructionSurface,
		"loadedInstructionFiles": stringArrayToAny(evaluation.loadedInstructionFiles),
		"loadedSupportingFiles":  stringArrayToAny(evaluation.loadedSupportingFiles),
		"routingDecision":        mapOrEmpty(evaluation.routingDecision),
		"expectationResults":     expectationResults,
		"routingEvaluation":      routingResult,
		"artifactRefs":           evaluation.artifactRefs,
	}
	if evaluation.taskPath != nil {
		result["taskPath"] = *evaluation.taskPath
	}
	if evaluation.entryFile != nil {
		result["entryFile"] = *evaluation.entryFile
	}
	if evaluation.expectedEntryFile != nil {
		result["expectedEntryFile"] = *evaluation.expectedEntryFile
	}
	if evaluation.expectedRouting != nil {
		result["expectedRouting"] = evaluation.expectedRouting
	}
	if evaluation.blockerKind != nil {
		result["blockerKind"] = *evaluation.blockerKind
	}
	if evaluation.telemetry != nil {
		result["telemetry"] = evaluation.telemetry
	}
	return result
}

func evaluateInstructionEntryFile(expected *string, observed *string) map[string]any {
	if expected == nil {
		return map[string]any{"status": "not_applicable"}
	}
	result := map[string]any{
		"status":   "failed",
		"expected": *expected,
		"observed": nil,
	}
	if observed != nil {
		result["observed"] = *observed
		if *observed == *expected {
			result["status"] = "passed"
		}
	}
	return result
}

func evaluateInstructionFileList(required []string, forbidden []string, observed []string) map[string]any {
	if len(required) == 0 && len(forbidden) == 0 {
		return map[string]any{
			"status":          "not_applicable",
			"missingRequired": []any{},
			"forbiddenLoaded": []any{},
		}
	}
	seen := map[string]bool{}
	for _, path := range observed {
		seen[path] = true
	}
	missingRequired := []any{}
	for _, path := range required {
		if !seen[path] {
			missingRequired = append(missingRequired, path)
		}
	}
	forbiddenLoaded := []any{}
	for _, path := range forbidden {
		if seen[path] {
			forbiddenLoaded = append(forbiddenLoaded, path)
		}
	}
	status := "passed"
	if len(missingRequired) > 0 || len(forbiddenLoaded) > 0 {
		status = "failed"
	}
	return map[string]any{
		"status":          status,
		"missingRequired": missingRequired,
		"forbiddenLoaded": forbiddenLoaded,
	}
}

func evaluateInstructionRouting(expected map[string]any, observed map[string]any) map[string]any {
	if len(expected) == 0 {
		return map[string]any{
			"status":     "not_applicable",
			"mismatches": []any{},
			"matched":    false,
		}
	}
	mismatches := []any{}
	if expectedSkill := stringOrEmpty(expected["selectedSkill"]); expectedSkill != "" && expectedSkill != stringOrEmpty(observed["selectedSkill"]) {
		mismatches = append(mismatches, fmt.Sprintf("selectedSkill expected %q", expectedSkill))
	}
	if expectedSupport := stringOrEmpty(expected["selectedSupport"]); expectedSupport != "" && expectedSupport != stringOrEmpty(observed["selectedSupport"]) {
		mismatches = append(mismatches, fmt.Sprintf("selectedSupport expected %q", expectedSupport))
	}
	if expectedPattern := stringOrEmpty(expected["firstToolCallPattern"]); expectedPattern != "" {
		actual := stringOrEmpty(observed["firstToolCall"])
		if !strings.Contains(actual, expectedPattern) {
			mismatches = append(mismatches, fmt.Sprintf("firstToolCall should contain %q", expectedPattern))
		}
	}
	status := "passed"
	if len(mismatches) > 0 {
		status = "failed"
	}
	return map[string]any{
		"status":     status,
		"matched":    len(mismatches) == 0,
		"mismatches": mismatches,
		"expected":   expected,
		"observed":   mapOrEmpty(observed),
	}
}

func expectationFailed(expectationResults map[string]any) bool {
	for _, key := range []string{"entryFile", "instructionFiles", "supportingFiles", "routing"} {
		if stringOrEmpty(asMap(expectationResults[key])["status"]) == "failed" {
			return true
		}
	}
	return false
}

func accumulateInstructionSurfaceSummary(summary map[string]any, expectationResults map[string]any) {
	if stringOrEmpty(asMap(expectationResults["entryFile"])["status"]) == "passed" {
		summary["entryFileMatches"] = intFromAny(summary["entryFileMatches"]) + 1
	} else if stringOrEmpty(asMap(expectationResults["entryFile"])["status"]) == "failed" {
		summary["entryFileMismatches"] = intFromAny(summary["entryFileMismatches"]) + 1
	}
	instructionFiles := asMap(expectationResults["instructionFiles"])
	summary["requiredInstructionFileMisses"] = intFromAny(summary["requiredInstructionFileMisses"]) + len(arrayOrEmpty(instructionFiles["missingRequired"]))
	summary["forbiddenInstructionFileViolations"] = intFromAny(summary["forbiddenInstructionFileViolations"]) + len(arrayOrEmpty(instructionFiles["forbiddenLoaded"]))
	supportingFiles := asMap(expectationResults["supportingFiles"])
	summary["requiredSupportingFileMisses"] = intFromAny(summary["requiredSupportingFileMisses"]) + len(arrayOrEmpty(supportingFiles["missingRequired"]))
	summary["forbiddenSupportingFileViolations"] = intFromAny(summary["forbiddenSupportingFileViolations"]) + len(arrayOrEmpty(supportingFiles["forbiddenLoaded"]))
}

func accumulateInstructionRoutingSummary(summary map[string]any, routingEvaluation map[string]any) {
	observed := asMap(routingEvaluation["observed"])
	if len(observed) > 0 {
		summary["evaluationsWithRoutingDecision"] = intFromAny(summary["evaluationsWithRoutingDecision"]) + 1
		if selectedSkill := stringOrEmpty(observed["selectedSkill"]); selectedSkill != "" {
			selectedSkillCounts := asMap(summary["selectedSkillCounts"])
			selectedSkillCounts[selectedSkill] = intFromAny(selectedSkillCounts[selectedSkill]) + 1
			summary["selectedSkillCounts"] = selectedSkillCounts
		}
	}
	if stringOrEmpty(routingEvaluation["status"]) == "not_applicable" {
		return
	}
	summary["evaluationsWithExpectedRoute"] = intFromAny(summary["evaluationsWithExpectedRoute"]) + 1
	if truthy(routingEvaluation["matched"]) {
		summary["matchedExpectedRoute"] = intFromAny(summary["matchedExpectedRoute"]) + 1
		return
	}
	summary["mismatchedExpectedRoute"] = intFromAny(summary["mismatchedExpectedRoute"]) + 1
}

func accumulateInstructionVariantSummary(accumulators map[string]map[string]any, instructionSurface map[string]any, status string, routingEvaluation map[string]any) {
	label := stringOrEmpty(instructionSurface["surfaceLabel"])
	if label == "" {
		label = "workspace_checked_in"
	}
	entry := accumulators[label]
	if entry == nil {
		entry = map[string]any{
			"surfaceLabel":            label,
			"evaluationCounts":        map[string]any{"total": 0, "passed": 0, "failed": 0, "blocked": 0},
			"selectedSkillCounts":     map[string]any{},
			"matchedExpectedRoute":    0,
			"mismatchedExpectedRoute": 0,
		}
		accumulators[label] = entry
	}
	counts := asMap(entry["evaluationCounts"])
	counts["total"] = intFromAny(counts["total"]) + 1
	counts[status] = intFromAny(counts[status]) + 1
	entry["evaluationCounts"] = counts
	observed := asMap(routingEvaluation["observed"])
	if selectedSkill := stringOrEmpty(observed["selectedSkill"]); selectedSkill != "" {
		selectedSkillCounts := asMap(entry["selectedSkillCounts"])
		selectedSkillCounts[selectedSkill] = intFromAny(selectedSkillCounts[selectedSkill]) + 1
		entry["selectedSkillCounts"] = selectedSkillCounts
	}
	if stringOrEmpty(routingEvaluation["status"]) == "not_applicable" {
		return
	}
	if truthy(routingEvaluation["matched"]) {
		entry["matchedExpectedRoute"] = intFromAny(entry["matchedExpectedRoute"]) + 1
		return
	}
	entry["mismatchedExpectedRoute"] = intFromAny(entry["mismatchedExpectedRoute"]) + 1
}

func finalizeInstructionVariantSummaries(accumulators map[string]map[string]any) []any {
	labels := make([]string, 0, len(accumulators))
	for label := range accumulators {
		labels = append(labels, label)
	}
	sort.Strings(labels)
	result := make([]any, 0, len(labels))
	for _, label := range labels {
		entry := accumulators[label]
		entry["selectedSkillCounts"] = sortedInstructionCounts(asMap(entry["selectedSkillCounts"]))
		result = append(result, entry)
	}
	return result
}

func sortedInstructionCounts(counts map[string]any) map[string]any {
	if len(counts) == 0 {
		return map[string]any{}
	}
	keys := make([]string, 0, len(counts))
	for key := range counts {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	result := map[string]any{}
	for _, key := range keys {
		result[key] = counts[key]
	}
	return result
}

func mapOrEmpty(value map[string]any) map[string]any {
	if len(value) == 0 {
		return map[string]any{}
	}
	return value
}
