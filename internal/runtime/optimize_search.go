package runtime

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

var optimizeSearchBudgets = map[string]map[string]any{
	"light": {
		"generationLimit":   1,
		"populationLimit":   3,
		"mutationBatchSize": 3,
	},
	"medium": {
		"generationLimit":   2,
		"populationLimit":   5,
		"mutationBatchSize": 4,
	},
	"heavy": {
		"generationLimit":   3,
		"populationLimit":   8,
		"mutationBatchSize": 5,
	},
}

func BuildOptimizeSearchInput(optimizeInput map[string]any, optimizeInputFile string, heldOutResultsFile *string, heldOutResults map[string]any, targetFileOverride *string, budget string, now time.Time) (map[string]any, error) {
	if optimizeInput["schemaVersion"] != contracts.OptimizeInputsSchema {
		return nil, fmt.Errorf("optimize input must use schemaVersion %s", contracts.OptimizeInputsSchema)
	}
	if stringOrEmpty(optimizeInput["optimizationTarget"]) != "prompt" {
		return nil, fmt.Errorf("optimize search currently supports prompt targets only")
	}
	if _, ok := optimizeSearchBudgets[budget]; !ok {
		budget = "medium"
	}
	targetPath := stringOrEmpty(asMap(optimizeInput["targetFile"])["path"])
	if targetFileOverride != nil && stringOrEmpty(*targetFileOverride) != "" {
		targetPath = *targetFileOverride
	}
	if targetPath == "" {
		return nil, fmt.Errorf("search input requires a target prompt file")
	}
	packet := map[string]any{
		"schemaVersion":      contracts.OptimizeSearchInputsSchema,
		"generatedAt":        now.UTC().Format(time.RFC3339Nano),
		"repoRoot":           optimizeInput["repoRoot"],
		"optimizeInputFile":  optimizeInputFile,
		"optimizeInput":      optimizeInput,
		"optimizationTarget": "prompt",
		"targetFile": map[string]any{
			"path":   targetPath,
			"exists": fileExists(targetPath),
		},
		"seedCandidate": map[string]any{
			"id": "seed",
			"targetFile": map[string]any{
				"path":   targetPath,
				"exists": fileExists(targetPath),
			},
			"targetSnapshot": collectTargetSnapshot(map[string]any{
				"path":   targetPath,
				"exists": fileExists(targetPath),
			}),
		},
		"searchConfig": buildOptimizeSearchConfig(budget),
		"mutationEvidencePolicy": map[string]any{
			"reportBuckets":          []any{"regressed", "noisy"},
			"reviewFindingLimit":     numberOrDefault(asMap(asMap(optimizeInput["optimizer"])["plan"])["reviewVariantLimit"], 1),
			"includeScenarioHistory": optimizeInput["scenarioHistory"] != nil,
		},
		"scenarioSets": map[string]any{
			"trainScenarioSet":   optimizeSearchTrainScenarioSet(optimizeInput),
			"heldOutScenarioSet": optimizeSearchHeldOutScenarioSet(asMap(optimizeInput["report"])),
		},
		"evaluationFiles": map[string]any{
			"reportFile":          optimizeInput["reportFile"],
			"reviewSummaryFile":   firstNonNil(optimizeInput["reviewSummaryFile"], nil),
			"scenarioHistoryFile": firstNonNil(optimizeInput["scenarioHistoryFile"], nil),
		},
		"objective": optimizeInput["objective"],
	}
	if heldOutResultsFile != nil && strings.TrimSpace(*heldOutResultsFile) != "" {
		asMap(packet["evaluationFiles"])["heldOutResultsFile"] = *heldOutResultsFile
	}
	if len(heldOutResults) > 0 {
		packet["heldOutResults"] = heldOutResults
		packet["scenarioSets"] = map[string]any{
			"trainScenarioSet":   optimizeSearchTrainScenarioSet(optimizeInput),
			"heldOutScenarioSet": optimizeSearchHeldOutScenarioSetFromResults(heldOutResults),
		}
	}
	return packet, nil
}

func buildOptimizeSearchConfig(budget string) map[string]any {
	base := optimizeSearchBudgets[budget]
	config := map[string]any{
		"algorithm":                "reflective_pareto",
		"budget":                   budget,
		"candidateSelection":       "pareto",
		"reviewCheckpointPolicy":   "final_only",
		"fullGateCheckpointPolicy": "final_only",
		"selectionPolicy": map[string]any{
			"primaryObjective": "held_out_behavior",
			"tieBreakers":      []any{"lower_cost", "lower_latency"},
			"constraintCaps":   map[string]any{},
		},
		"mergeEnabled": false,
	}
	for key, value := range base {
		config[key] = value
	}
	return config
}

func optimizeSearchTrainScenarioSet(optimizeInput map[string]any) []any {
	ids := []string{}
	report := asMap(optimizeInput["report"])
	for _, key := range []string{"regressed", "noisy", "improved", "unchanged"} {
		for index, raw := range arrayOrEmpty(report[key]) {
			ids = append(ids, normalizeScenarioKey(raw, index, key))
		}
	}
	for scenarioID := range asMap(asMap(optimizeInput["scenarioHistory"])["scenarioStats"]) {
		ids = append(ids, scenarioID)
	}
	ids = uniqueStrings(ids)
	result := make([]any, 0, len(ids))
	for _, id := range ids {
		result = append(result, id)
	}
	return result
}

func optimizeSearchHeldOutScenarioSet(report map[string]any) []any {
	seen := []string{}
	modeRuns := arrayOrEmpty(report["modeRuns"])
	for _, rawModeRun := range modeRuns {
		modeRun := asMap(rawModeRun)
		mode := stringOrEmpty(modeRun["mode"])
		if mode != "held_out" && mode != "full_gate" {
			continue
		}
		results := arrayOrEmpty(asMap(asMap(modeRun["scenarioResults"])["results"]))
		for index, rawResult := range results {
			result := asMap(rawResult)
			seen = append(seen, normalizeScenarioKey(result["scenarioId"], index, "held_out"))
		}
	}
	seen = uniqueStrings(seen)
	result := make([]any, 0, len(seen))
	for _, id := range seen {
		result = append(result, id)
	}
	return result
}

func optimizeSearchHeldOutScenarioSetFromResults(results map[string]any) []any {
	ids := []string{}
	for index, rawResult := range arrayOrEmpty(results["results"]) {
		ids = append(ids, normalizeScenarioKey(asMap(rawResult)["scenarioId"], index, "held_out"))
	}
	ids = uniqueStrings(ids)
	result := make([]any, 0, len(ids))
	for _, id := range ids {
		result = append(result, id)
	}
	return result
}

func RunOptimizeSearch(packet map[string]any, inputFile string, now time.Time) map[string]any {
	heldOutEntries := optimizeSearchHeldOutEntries(packet)
	reasonCodes := []any{}
	missingEvidence := []any{}
	if len(heldOutEntries) == 0 {
		reasonCodes = append(reasonCodes, "missing_held_out_scenarios")
		missingEvidence = append(missingEvidence, "held_out scenario ids")
	}
	scoreCount := 0
	for _, entry := range heldOutEntries {
		if entry["score"] != nil {
			scoreCount++
		}
	}
	if scoreCount == 0 {
		reasonCodes = append(reasonCodes, "missing_per_scenario_scores")
		missingEvidence = append(missingEvidence, "per-scenario score or pass/fail records")
	}
	if len(optimizeSearchFeedbackSignals(packet)) == 0 {
		reasonCodes = append(reasonCodes, "missing_textual_feedback")
		missingEvidence = append(missingEvidence, "compareArtifact reasons or humanReviewFindings")
	}
	if len(reasonCodes) > 0 {
		return map[string]any{
			"schemaVersion":           contracts.OptimizeSearchResultSchema,
			"generatedAt":             now.UTC().Format(time.RFC3339Nano),
			"status":                  "blocked",
			"inputFile":               inputFile,
			"repoRoot":                packet["repoRoot"],
			"optimizeInputFile":       packet["optimizeInputFile"],
			"searchConfig":            packet["searchConfig"],
			"candidateRegistry":       []any{},
			"generationSummaries":     []any{},
			"heldOutEvaluationMatrix": []any{},
			"pareto": map[string]any{
				"frontierCandidateIds":        []any{},
				"perScenarioBestCandidateIds": []any{},
			},
			"checkpointOutcomes": map[string]any{
				"review":   []any{},
				"fullGate": []any{},
			},
			"searchTelemetry": map[string]any{
				"candidateCount":          0,
				"generationCount":         0,
				"mutationInvocationCount": 0,
				"heldOutEvaluationCount":  0,
				"reviewCheckpointCount":   0,
				"stopReason":              "blocked",
			},
			"proposalBridge": map[string]any{
				"optimizeInputFile": packet["optimizeInputFile"],
			},
			"reasonCodes":        reasonCodes,
			"missingEvidence":    missingEvidence,
			"suggestedNextSteps": []any{"run held_out evaluation with scenario results enabled", "build a report packet with compare artifacts", "collect at least one review summary for the target behavior"},
		}
	}
	matrix := make([]any, 0, len(heldOutEntries))
	perScenario := make([]any, 0, len(heldOutEntries))
	for _, entry := range heldOutEntries {
		matrix = append(matrix, entry)
		perScenario = append(perScenario, map[string]any{
			"scenarioId":   entry["scenarioId"],
			"candidateIds": []any{"seed"},
		})
	}
	return map[string]any{
		"schemaVersion":       contracts.OptimizeSearchResultSchema,
		"generatedAt":         now.UTC().Format(time.RFC3339Nano),
		"status":              "completed",
		"inputFile":           inputFile,
		"repoRoot":            packet["repoRoot"],
		"optimizeInputFile":   packet["optimizeInputFile"],
		"searchConfig":        packet["searchConfig"],
		"selectedCandidateId": "seed",
		"candidateRegistry": []any{
			map[string]any{
				"id":                 "seed",
				"generationIndex":    0,
				"parentCandidateIds": []any{},
				"origin":             "seed",
				"targetFile":         packet["targetFile"],
				"targetSnapshot":     asMap(asMap(packet["seedCandidate"])["targetSnapshot"]),
				"mutationRationale":  "Use the current target prompt file as the seed candidate.",
				"telemetry":          optimizeSearchCandidateTelemetry(heldOutEntries),
			},
		},
		"generationSummaries":     []any{},
		"heldOutEvaluationMatrix": matrix,
		"pareto": map[string]any{
			"frontierCandidateIds":        []any{"seed"},
			"perScenarioBestCandidateIds": perScenario,
		},
		"checkpointOutcomes": map[string]any{
			"review":   []any{},
			"fullGate": []any{},
		},
		"searchTelemetry": map[string]any{
			"candidateCount":          1,
			"generationCount":         0,
			"mutationInvocationCount": 0,
			"heldOutEvaluationCount":  heldOutEvaluationCount(heldOutEntries),
			"reviewCheckpointCount":   0,
			"stopReason":              "seed_only",
		},
		"proposalBridge": map[string]any{
			"optimizeInputFile":   packet["optimizeInputFile"],
			"selectedCandidateId": "seed",
			"selectedTargetFile":  packet["targetFile"],
		},
	}
}

func GenerateOptimizeProposalFromSearch(searchResult map[string]any, searchResultFile string, optimizeInput map[string]any, optimizeInputFile string, now time.Time) (map[string]any, error) {
	proposal, err := GenerateOptimizeProposal(optimizeInput, &optimizeInputFile, now)
	if err != nil {
		return nil, err
	}
	if selectedTargetFile := asMap(asMap(searchResult["proposalBridge"])["selectedTargetFile"]); len(selectedTargetFile) > 0 {
		proposal["targetFile"] = selectedTargetFile
	}
	proposal["searchResultFile"] = searchResultFile
	proposal["rationale"] = fmt.Sprintf("%s Selected candidate: %s.", stringOrEmpty(proposal["rationale"]), firstNonEmpty(stringOrEmpty(asMap(searchResult["proposalBridge"])["selectedCandidateId"]), stringOrEmpty(searchResult["selectedCandidateId"])))
	return proposal, nil
}

func optimizeSearchHeldOutEntries(packet map[string]any) []map[string]any {
	if heldOutResults := asMap(packet["heldOutResults"]); len(heldOutResults) > 0 {
		return optimizeSearchHeldOutEntriesFromResults(heldOutResults)
	}
	report := asMap(asMap(packet["optimizeInput"])["report"])
	result := []map[string]any{}
	for _, rawModeRun := range arrayOrEmpty(report["modeRuns"]) {
		modeRun := asMap(rawModeRun)
		mode := stringOrEmpty(modeRun["mode"])
		if mode != "held_out" && mode != "full_gate" {
			continue
		}
		for index, rawScenario := range arrayOrEmpty(asMap(asMap(modeRun["scenarioResults"])["results"])) {
			scenario := asMap(rawScenario)
			scenarioID := normalizeScenarioKey(scenario["scenarioId"], index, "held_out")
			entry := map[string]any{
				"candidateId": "seed",
				"scenarioId":  scenarioID,
				"mode":        mode,
				"score":       optimizeSearchScenarioScore(scenario),
				"status":      nilIfEmpty(scenario["status"]),
				"telemetry":   firstNonNil(scenario["telemetry"], map[string]any{}),
			}
			result = append(result, entry)
		}
	}
	sort.Slice(result, func(left, right int) bool {
		return stringOrEmpty(result[left]["scenarioId"]) < stringOrEmpty(result[right]["scenarioId"])
	})
	return result
}

func optimizeSearchHeldOutEntriesFromResults(results map[string]any) []map[string]any {
	result := []map[string]any{}
	mode := firstNonEmpty(stringOrEmpty(results["mode"]), "held_out")
	for index, rawScenario := range arrayOrEmpty(results["results"]) {
		scenario := asMap(rawScenario)
		scenarioID := normalizeScenarioKey(scenario["scenarioId"], index, "held_out")
		result = append(result, map[string]any{
			"candidateId": "seed",
			"scenarioId":  scenarioID,
			"mode":        mode,
			"score":       optimizeSearchScenarioScore(scenario),
			"status":      nilIfEmpty(scenario["status"]),
			"telemetry":   firstNonNil(scenario["telemetry"], map[string]any{}),
		})
	}
	sort.Slice(result, func(left, right int) bool {
		return stringOrEmpty(result[left]["scenarioId"]) < stringOrEmpty(result[right]["scenarioId"])
	})
	return result
}

func optimizeSearchScenarioScore(scenario map[string]any) any {
	if score, ok := toFloat(scenario["overallScore"]); ok {
		return score
	}
	if passRate, ok := toFloat(scenario["passRate"]); ok {
		return passRate * 100
	}
	status := stringOrEmpty(scenario["status"])
	if status == "passed" {
		return 100
	}
	if status != "" {
		return 0
	}
	return nil
}

func optimizeSearchFeedbackSignals(packet map[string]any) []string {
	signals := []string{}
	report := asMap(asMap(packet["optimizeInput"])["report"])
	for _, rawModeRun := range arrayOrEmpty(report["modeRuns"]) {
		modeRun := asMap(rawModeRun)
		compareArtifact := asMap(asMap(modeRun["scenarioResults"])["compareArtifact"])
		if summary := stringOrEmpty(compareArtifact["summary"]); summary != "" {
			signals = append(signals, summary)
		}
		for _, bucket := range []string{"regressed", "noisy"} {
			for _, rawItem := range arrayOrEmpty(compareArtifact[bucket]) {
				item := asMap(rawItem)
				if reason := stringOrEmpty(item["reason"]); reason != "" {
					signals = append(signals, reason)
				}
			}
		}
	}
	for _, rawFinding := range arrayOrEmpty(report["humanReviewFindings"]) {
		finding := asMap(rawFinding)
		if message := stringOrEmpty(finding["message"]); message != "" {
			signals = append(signals, message)
		}
	}
	for _, rawVariant := range arrayOrEmpty(asMap(asMap(packet["optimizeInput"])["reviewSummary"])["variants"]) {
		variant := asMap(rawVariant)
		for _, rawFinding := range arrayOrEmpty(asMap(variant["output"])["findings"]) {
			finding := asMap(rawFinding)
			if message := stringOrEmpty(finding["message"]); message != "" {
				signals = append(signals, message)
			}
		}
	}
	for scenarioID, rawStats := range asMap(asMap(asMap(packet["optimizeInput"])["scenarioHistory"])["scenarioStats"]) {
		stats := asMap(rawStats)
		latest := asMap(firstArrayItem(asMap(stats)["recentTrainResults"]))
		if len(latest) == 0 {
			continue
		}
		status := stringOrEmpty(latest["status"])
		score, _ := toFloat(latest["overallScore"])
		passRate, _ := toFloat(latest["passRate"])
		if status != "passed" || score != 100 || passRate != 1 {
			signals = append(signals, fmt.Sprintf("%s remains unstable in recent train history", scenarioID))
		}
	}
	return uniqueStrings(signals)
}

func optimizeSearchCandidateTelemetry(entries []map[string]any) map[string]any {
	totalCost := 0.0
	totalDuration := 0.0
	sawCost := false
	sawDuration := false
	for _, entry := range entries {
		telemetry := asMap(entry["telemetry"])
		if cost, ok := toFloat(telemetry["cost_usd"]); ok {
			totalCost += cost
			sawCost = true
		}
		if duration, ok := toFloat(firstNonNil(telemetry["durationMs"], telemetry["duration_ms"])); ok {
			totalDuration += duration
			sawDuration = true
		}
	}
	result := map[string]any{}
	if sawCost {
		result["totalCostUsd"] = round12(totalCost)
	}
	if sawDuration {
		result["totalDurationMs"] = round12(totalDuration)
	}
	return result
}

func heldOutEvaluationCount(entries []map[string]any) int {
	if len(entries) == 0 {
		return 0
	}
	return 1
}

func firstArrayItem(value any) any {
	items := arrayOrEmpty(value)
	if len(items) == 0 {
		return nil
	}
	return items[0]
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}
