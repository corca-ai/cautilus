package runtime

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
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

type OptimizeSearchBuildOptions struct {
	TargetFileOverride     *string
	HeldOutResultsFile     *string
	HeldOutResults         map[string]any
	Budget                 string
	ReviewCheckpointPolicy *string
	ThreeParentPolicy      *string
	SelectionPolicy        map[string]any
	Adapter                *string
	AdapterName            *string
	Intent                 *string
	BaselineRef            *string
	Profile                *string
	Split                  *string
}

func BuildOptimizeSearchInput(optimizeInput map[string]any, optimizeInputFile string, options OptimizeSearchBuildOptions, now time.Time) (map[string]any, error) {
	if optimizeInput["schemaVersion"] != contracts.OptimizeInputsSchema {
		return nil, fmt.Errorf("optimize input must use schemaVersion %s", contracts.OptimizeInputsSchema)
	}
	if stringOrEmpty(optimizeInput["optimizationTarget"]) != "prompt" {
		return nil, fmt.Errorf("optimize search currently supports prompt targets only")
	}
	budget := normalizeOptimizeSearchBudget(options.Budget)
	targetPath := stringOrEmpty(asMap(optimizeInput["targetFile"])["path"])
	if options.TargetFileOverride != nil && strings.TrimSpace(*options.TargetFileOverride) != "" {
		targetPath = *options.TargetFileOverride
	}
	if targetPath == "" {
		return nil, fmt.Errorf("search input requires a target prompt file")
	}
	targetFile := map[string]any{
		"path":   targetPath,
		"exists": fileExists(targetPath),
	}
	reviewCheckpointPolicy := DefaultOptimizeSearchReviewCheckpointPolicy(budget)
	if options.ReviewCheckpointPolicy != nil && strings.TrimSpace(*options.ReviewCheckpointPolicy) != "" {
		reviewCheckpointPolicy = strings.TrimSpace(*options.ReviewCheckpointPolicy)
	}
	threeParentPolicy := DefaultOptimizeSearchThreeParentPolicy()
	if options.ThreeParentPolicy != nil && strings.TrimSpace(*options.ThreeParentPolicy) != "" {
		threeParentPolicy = strings.TrimSpace(*options.ThreeParentPolicy)
	}
	searchConfig := buildOptimizeSearchConfig(budget, reviewCheckpointPolicy, options.SelectionPolicy, threeParentPolicy)
	packet := map[string]any{
		"schemaVersion":      contracts.OptimizeSearchInputsSchema,
		"generatedAt":        now.UTC().Format(time.RFC3339Nano),
		"repoRoot":           optimizeInput["repoRoot"],
		"optimizeInputFile":  optimizeInputFile,
		"optimizeInput":      optimizeInput,
		"optimizationTarget": "prompt",
		"targetFile":         targetFile,
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
		"searchConfig": searchConfig,
		"mutationConfig": map[string]any{
			"backends":           defaultOptimizeSearchBackends(budget),
			"trainScenarioLimit": maxInt(1, int(numberOrDefault(searchConfig["mutationBatchSize"], 1))-1),
			"promptVariantLimit": int(numberOrDefault(searchConfig["mutationBatchSize"], 1)),
		},
		"mutationEvidencePolicy": map[string]any{
			"reportBuckets":             []any{"regressed", "noisy"},
			"reviewFindingLimit":        numberOrDefault(asMap(asMap(optimizeInput["optimizer"])["plan"])["reviewVariantLimit"], 1),
			"includeScenarioHistory":    optimizeInput["scenarioHistory"] != nil,
			"includeCheckpointFeedback": reviewCheckpointPolicy == "frontier_promotions",
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
		"evaluationContext": map[string]any{
			"mode":        "held_out",
			"adapter":     derefString(options.Adapter),
			"adapterName": derefString(options.AdapterName),
			"intent": firstNonEmpty(
				derefString(options.Intent),
				stringOrEmpty(asMap(optimizeInput["report"])["intent"]),
				stringOrEmpty(asMap(optimizeInput["intentProfile"])["summary"]),
			),
			"baselineRef": firstNonEmpty(
				derefString(options.BaselineRef),
				stringOrEmpty(asMap(optimizeInput["report"])["baseline"]),
				"HEAD",
			),
			"profile": derefString(options.Profile),
			"split":   derefString(options.Split),
		},
		"objective": optimizeInput["objective"],
	}
	if options.HeldOutResultsFile != nil && strings.TrimSpace(*options.HeldOutResultsFile) != "" {
		asMap(packet["evaluationFiles"])["heldOutResultsFile"] = *options.HeldOutResultsFile
	}
	if len(options.HeldOutResults) > 0 {
		packet["heldOutResults"] = options.HeldOutResults
		packet["scenarioSets"] = map[string]any{
			"trainScenarioSet":   optimizeSearchTrainScenarioSet(optimizeInput),
			"heldOutScenarioSet": optimizeSearchHeldOutScenarioSetFromResults(options.HeldOutResults),
		}
	}
	return packet, nil
}

func DefaultOptimizeSearchReviewCheckpointPolicy(budget string) string {
	if normalizeOptimizeSearchBudget(budget) == "light" {
		return "final_only"
	}
	return "frontier_promotions"
}

func DefaultOptimizeSearchThreeParentPolicy() string {
	return "coverage_expansion"
}

func normalizeOptimizeSearchBudget(budget string) string {
	if _, ok := optimizeSearchBudgets[budget]; ok {
		return budget
	}
	return "medium"
}

func defaultOptimizeSearchBackends(budget string) []any {
	if normalizeOptimizeSearchBudget(budget) == "light" {
		return []any{
			map[string]any{
				"id":      "codex-mutate",
				"backend": "codex_exec",
			},
		}
	}
	return []any{
		map[string]any{
			"id":      "codex-mutate",
			"backend": "codex_exec",
		},
		map[string]any{
			"id":      "claude-mutate",
			"backend": "claude_p",
		},
	}
}

func buildOptimizeSearchConfig(budget string, reviewCheckpointPolicy string, selectionPolicy map[string]any, threeParentPolicy string) map[string]any {
	base := optimizeSearchBudgets[normalizeOptimizeSearchBudget(budget)]
	config := map[string]any{
		"algorithm":                "reflective_pareto",
		"budget":                   normalizeOptimizeSearchBudget(budget),
		"candidateSelection":       "pareto",
		"reviewCheckpointPolicy":   reviewCheckpointPolicy,
		"fullGateCheckpointPolicy": "final_only",
		"selectionPolicy":          normalizeOptimizeSearchSelectionPolicy(selectionPolicy),
		"mergeEnabled":             false,
		"threeParentPolicy":        threeParentPolicy,
	}
	for key, value := range base {
		config[key] = value
	}
	return config
}

func normalizeOptimizeSearchSelectionPolicy(value map[string]any) map[string]any {
	result := map[string]any{
		"primaryObjective": "held_out_behavior",
		"tieBreakers":      []any{"lower_cost", "lower_latency"},
		"constraintCaps":   map[string]any{},
	}
	if len(value) == 0 {
		return result
	}
	if primaryObjective := stringOrEmpty(value["primaryObjective"]); primaryObjective != "" {
		result["primaryObjective"] = primaryObjective
	}
	if tieBreakers := arrayOrEmpty(value["tieBreakers"]); len(tieBreakers) > 0 {
		items := make([]any, 0, len(tieBreakers))
		for _, raw := range tieBreakers {
			if text := stringOrEmpty(raw); text != "" {
				items = append(items, text)
			}
		}
		if len(items) > 0 {
			result["tieBreakers"] = items
		}
	}
	if constraintCaps := asMap(value["constraintCaps"]); len(constraintCaps) > 0 {
		normalized := map[string]any{}
		for key, raw := range constraintCaps {
			if cap, ok := toFloat(raw); ok && cap >= 0 {
				normalized[key] = cap
			}
		}
		result["constraintCaps"] = normalized
	}
	return result
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

	seedCandidate := optimizeSearchSeedCandidate(packet, heldOutEntries)
	candidates := []map[string]any{seedCandidate}
	generationSummaries := []any{}
	stopReason := "seed_only"

	if candidate, err := optimizeSearchEvaluateMutation(packet, inputFile); err == nil && candidate != nil {
		candidates = append(candidates, candidate)
		stopReason = "generation_limit"
		matrix := optimizeSearchHeldOutMatrix(candidates)
		scenarioIDs := optimizeSearchScenarioIDs(packet, matrix)
		frontierIDs := optimizeSearchFrontierCandidateIDs(matrix, optimizeSearchCandidateIDs(candidates), scenarioIDs)
		generationSummaries = append(generationSummaries, map[string]any{
			"generationIndex":            1,
			"parentFrontierCandidateIds": []any{"seed"},
			"proposedCandidateIds":       []any{candidate["id"]},
			"promotedCandidateIds":       []any{candidate["id"]},
			"frontierCandidateIds":       stringSliceToAny(frontierIDs),
		})
	}

	matrix := optimizeSearchHeldOutMatrix(candidates)
	scenarioIDs := optimizeSearchScenarioIDs(packet, matrix)
	candidateIDs := optimizeSearchCandidateIDs(candidates)
	frontierIDs := optimizeSearchFrontierCandidateIDs(matrix, candidateIDs, scenarioIDs)
	rankedFrontierIDs := optimizeSearchRankCandidateIDs(frontierIDs, matrix, candidates, scenarioIDs)
	selectedCandidateID := "seed"
	if len(rankedFrontierIDs) > 0 {
		selectedCandidateID = rankedFrontierIDs[0]
	}
	perScenarioBest := make([]any, 0, len(scenarioIDs))
	for _, scenarioID := range scenarioIDs {
		bestIDs := []any{}
		bestScore := -1.0
		for _, candidateID := range candidateIDs {
			score := optimizeSearchScoreForCandidate(matrix, candidateID, scenarioID)
			if score > bestScore {
				bestScore = score
				bestIDs = []any{candidateID}
				continue
			}
			if score == bestScore {
				bestIDs = append(bestIDs, candidateID)
			}
		}
		perScenarioBest = append(perScenarioBest, map[string]any{
			"scenarioId":   scenarioID,
			"candidateIds": bestIDs,
		})
	}
	selectedCandidate := candidates[0]
	for _, candidate := range candidates {
		if stringOrEmpty(candidate["id"]) == selectedCandidateID {
			selectedCandidate = candidate
			break
		}
	}
	return map[string]any{
		"schemaVersion":           contracts.OptimizeSearchResultSchema,
		"generatedAt":             now.UTC().Format(time.RFC3339Nano),
		"status":                  "completed",
		"inputFile":               inputFile,
		"repoRoot":                packet["repoRoot"],
		"optimizeInputFile":       packet["optimizeInputFile"],
		"searchConfig":            packet["searchConfig"],
		"selectedCandidateId":     selectedCandidateID,
		"candidateRegistry":       optimizeSearchCandidateRegistry(candidates),
		"generationSummaries":     generationSummaries,
		"heldOutEvaluationMatrix": matrix,
		"pareto": map[string]any{
			"frontierCandidateIds":        stringSliceToAny(frontierIDs),
			"perScenarioBestCandidateIds": perScenarioBest,
		},
		"checkpointOutcomes": map[string]any{
			"review":   []any{},
			"fullGate": []any{},
		},
		"searchTelemetry": map[string]any{
			"candidateCount":          len(candidates),
			"generationCount":         len(generationSummaries),
			"mutationInvocationCount": maxInt(0, len(candidates)-1),
			"heldOutEvaluationCount":  1 + maxInt(0, len(candidates)-1),
			"reviewCheckpointCount":   0,
			"stopReason":              stopReason,
		},
		"proposalBridge": map[string]any{
			"optimizeInputFile":   packet["optimizeInputFile"],
			"selectedCandidateId": selectedCandidateID,
			"selectedTargetFile":  selectedCandidate["targetFile"],
		},
		"selectionTelemetry": map[string]any{
			"rankedFrontierCandidateIds": stringSliceToAny(rankedFrontierIDs),
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
		return optimizeSearchHeldOutEntriesFromResults(heldOutResults, "seed")
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

func optimizeSearchHeldOutEntriesFromResults(results map[string]any, candidateID string) []map[string]any {
	result := []map[string]any{}
	mode := firstNonEmpty(stringOrEmpty(results["mode"]), "held_out")
	for index, rawScenario := range arrayOrEmpty(results["results"]) {
		scenario := asMap(rawScenario)
		scenarioID := normalizeScenarioKey(scenario["scenarioId"], index, "held_out")
		result = append(result, map[string]any{
			"candidateId": candidateID,
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

func optimizeSearchSeedCandidate(packet map[string]any, heldOutEntries []map[string]any) map[string]any {
	return map[string]any{
		"id":                 "seed",
		"generationIndex":    0,
		"parentCandidateIds": []any{},
		"origin":             "seed",
		"targetFile":         packet["targetFile"],
		"targetSnapshot":     asMap(asMap(packet["seedCandidate"])["targetSnapshot"]),
		"mutationRationale":  "Use the current target prompt file as the seed candidate.",
		"telemetry":          optimizeSearchCandidateTelemetry(heldOutEntries),
		"heldOutEntries":     heldOutEntries,
	}
}

func optimizeSearchEvaluateMutation(packet map[string]any, inputFile string) (map[string]any, error) {
	if !optimizeSearchCanRunMutation(packet) {
		return nil, fmt.Errorf("mutation prerequisites missing")
	}
	toolRoot := strings.TrimSpace(os.Getenv("CAUTILUS_TOOL_ROOT"))
	reviewWrapperPath := filepath.Join(toolRoot, "scripts", "agent-runtime", "run-workbench-review-variant.sh")
	if toolRoot == "" || !fileExists(reviewWrapperPath) {
		return nil, fmt.Errorf("review wrapper unavailable")
	}
	artifactRoot := filepath.Dir(firstNonEmpty(inputFile, stringOrEmpty(packet["optimizeInputFile"])))
	backend := optimizeSearchMutationBackend(packet)
	if backend == "" {
		return nil, fmt.Errorf("mutation backend unavailable")
	}
	candidateID := "g1-1-" + strings.ReplaceAll(strings.ReplaceAll(backend, "_", "-"), " ", "-")
	candidateRoot := filepath.Join(artifactRoot, "optimize-search-candidates", candidateID)
	if err := os.MkdirAll(candidateRoot, 0o755); err != nil {
		return nil, err
	}
	promptFile := filepath.Join(candidateRoot, "mutation.prompt.md")
	schemaFile := filepath.Join(candidateRoot, "mutation.schema.json")
	outputFile := filepath.Join(candidateRoot, "mutation.output.json")
	candidatePromptPath := filepath.Join(candidateRoot, "candidate.prompt.md")
	if err := os.WriteFile(promptFile, []byte(optimizeSearchMutationPrompt(packet)), 0o644); err != nil {
		return nil, err
	}
	if err := writeJSONFile(schemaFile, optimizeSearchMutationSchema()); err != nil {
		return nil, err
	}
	command := exec.Command("bash", reviewWrapperPath,
		"--backend", backend,
		"--workspace", stringOrEmpty(packet["repoRoot"]),
		"--prompt-file", promptFile,
		"--schema-file", schemaFile,
		"--output-file", outputFile,
	)
	command.Env = append(os.Environ(), "WORKBENCH_REVIEW_TIMEOUT_SECONDS="+firstNonEmpty(os.Getenv("CAUTILUS_OPTIMIZE_SEARCH_TIMEOUT_SECONDS"), "180"))
	output, err := command.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("mutation backend failed: %s", strings.TrimSpace(string(output)))
	}
	mutationOutput, err := readJSONFile(outputFile)
	if err != nil {
		return nil, err
	}
	promptMarkdown := strings.TrimSpace(stringOrEmpty(mutationOutput["promptMarkdown"]))
	if promptMarkdown == "" {
		return nil, fmt.Errorf("mutation output omitted promptMarkdown")
	}
	if err := os.WriteFile(candidatePromptPath, []byte(promptMarkdown+"\n"), 0o644); err != nil {
		return nil, err
	}
	heldOutEntries, evaluationArtifacts, err := optimizeSearchEvaluateCandidate(packet, artifactRoot, candidateID, candidatePromptPath)
	if err != nil {
		return nil, err
	}
	return map[string]any{
		"id":                 candidateID,
		"generationIndex":    1,
		"parentCandidateIds": []any{"seed"},
		"origin":             "mutation",
		"targetFile": map[string]any{
			"path":   candidatePromptPath,
			"exists": true,
		},
		"targetSnapshot": collectTargetSnapshot(map[string]any{
			"path":   candidatePromptPath,
			"exists": true,
		}),
		"mutationRationale":    stringOrEmpty(mutationOutput["rationaleSummary"]),
		"expectedImprovements": arrayOrEmpty(mutationOutput["expectedImprovements"]),
		"preservedStrengths":   arrayOrEmpty(mutationOutput["preservedStrengths"]),
		"riskNotes":            arrayOrEmpty(mutationOutput["riskNotes"]),
		"backend":              backend,
		"artifacts": map[string]any{
			"promptFile": promptFile,
			"schemaFile": schemaFile,
			"outputFile": outputFile,
		},
		"evaluationArtifacts": evaluationArtifacts,
		"telemetry":           optimizeSearchCandidateTelemetry(heldOutEntries),
		"heldOutEntries":      heldOutEntries,
	}, nil
}

func optimizeSearchCanRunMutation(packet map[string]any) bool {
	evaluationContext := asMap(packet["evaluationContext"])
	return stringOrEmpty(evaluationContext["intent"]) != "" && stringOrEmpty(evaluationContext["baselineRef"]) != ""
}

func optimizeSearchMutationBackend(packet map[string]any) string {
	for _, rawBackend := range arrayOrEmpty(asMap(packet["mutationConfig"])["backends"]) {
		if backend := stringOrEmpty(asMap(rawBackend)["backend"]); backend != "" {
			return backend
		}
	}
	return ""
}

func optimizeSearchMutationPrompt(packet map[string]any) string {
	targetPath := stringOrEmpty(asMap(packet["targetFile"])["path"])
	currentPrompt := ""
	if targetPath != "" && fileExists(targetPath) {
		payload, err := os.ReadFile(targetPath)
		if err == nil {
			currentPrompt = string(payload)
		}
	}
	feedback := strings.Join(optimizeSearchFeedbackSignals(packet), "\n- ")
	if feedback != "" {
		feedback = "- " + feedback
	}
	return strings.TrimSpace(fmt.Sprintf(`
Return one JSON object matching the schema.

Current prompt:
%s

Behavior objective:
%s

Evidence to address:
%s
`, currentPrompt, stringOrEmpty(asMap(packet["objective"])["summary"]), feedback)) + "\n"
}

func optimizeSearchMutationSchema() map[string]any {
	return map[string]any{
		"type":                 "object",
		"additionalProperties": false,
		"required": []any{
			"promptMarkdown",
			"rationaleSummary",
			"expectedImprovements",
			"preservedStrengths",
			"riskNotes",
		},
		"properties": map[string]any{
			"promptMarkdown":   map[string]any{"type": "string"},
			"rationaleSummary": map[string]any{"type": "string"},
			"expectedImprovements": map[string]any{
				"type":  "array",
				"items": map[string]any{"type": "string"},
			},
			"preservedStrengths": map[string]any{
				"type":  "array",
				"items": map[string]any{"type": "string"},
			},
			"riskNotes": map[string]any{
				"type":  "array",
				"items": map[string]any{"type": "string"},
			},
		},
	}
}

func optimizeSearchEvaluateCandidate(packet map[string]any, artifactRoot string, candidateID string, candidatePromptPath string) ([]map[string]any, map[string]any, error) {
	repoRoot := stringOrEmpty(packet["repoRoot"])
	worktreeRoot := filepath.Join(artifactRoot, "optimize-search-worktrees", candidateID)
	if err := os.MkdirAll(filepath.Dir(worktreeRoot), 0o755); err != nil {
		return nil, nil, err
	}
	worktreeCommand := exec.Command("git", "-C", repoRoot, "worktree", "add", "--detach", worktreeRoot, "HEAD")
	if output, err := worktreeCommand.CombinedOutput(); err != nil {
		return nil, nil, fmt.Errorf("failed to create candidate worktree: %s", strings.TrimSpace(string(output)))
	}
	targetRelativePath, err := filepath.Rel(repoRoot, stringOrEmpty(asMap(packet["targetFile"])["path"]))
	if err != nil {
		return nil, nil, err
	}
	targetRelativePath = filepath.Clean(targetRelativePath)
	if strings.HasPrefix(targetRelativePath, "..") {
		return nil, nil, fmt.Errorf("target file must stay within repoRoot")
	}
	candidatePayload, err := os.ReadFile(candidatePromptPath)
	if err != nil {
		return nil, nil, err
	}
	targetPath := filepath.Join(worktreeRoot, targetRelativePath)
	if err := os.MkdirAll(filepath.Dir(targetPath), 0o755); err != nil {
		return nil, nil, err
	}
	if err := os.WriteFile(targetPath, candidatePayload, 0o644); err != nil {
		return nil, nil, err
	}
	outputDir := filepath.Join(artifactRoot, "optimize-search-candidates", candidateID, "held-out-eval")
	evaluateArgs := []string{
		"mode", "evaluate",
		"--repo-root", worktreeRoot,
		"--mode", firstNonEmpty(stringOrEmpty(asMap(packet["evaluationContext"])["mode"]), "held_out"),
		"--intent", firstNonEmpty(stringOrEmpty(asMap(packet["evaluationContext"])["intent"]), "Prompt candidate evaluation"),
		"--output-dir", outputDir,
		"--quiet",
	}
	for _, pair := range [][2]string{
		{"--adapter", stringOrEmpty(asMap(packet["evaluationContext"])["adapter"])},
		{"--adapter-name", stringOrEmpty(asMap(packet["evaluationContext"])["adapterName"])},
		{"--baseline-ref", stringOrEmpty(asMap(packet["evaluationContext"])["baselineRef"])},
		{"--profile", stringOrEmpty(asMap(packet["evaluationContext"])["profile"])},
		{"--split", stringOrEmpty(asMap(packet["evaluationContext"])["split"])},
	} {
		if strings.TrimSpace(pair[1]) != "" {
			evaluateArgs = append(evaluateArgs, pair[0], pair[1])
		}
	}
	command := exec.Command(optimizeSearchBinaryPath(), evaluateArgs...)
	command.Env = os.Environ()
	output, err := command.CombinedOutput()
	if err != nil {
		return nil, nil, fmt.Errorf("held-out evaluation failed: %s", strings.TrimSpace(string(output)))
	}
	mode := firstNonEmpty(stringOrEmpty(asMap(packet["evaluationContext"])["mode"]), "held_out")
	scenarioResultsPath := filepath.Join(outputDir, mode+"-scenario-results.json")
	scenarioResults, err := readJSONFile(scenarioResultsPath)
	if err != nil {
		return nil, nil, err
	}
	heldOutEntries := optimizeSearchHeldOutEntriesFromResults(scenarioResults, candidateID)
	return heldOutEntries, map[string]any{
		"worktreeRoot":        worktreeRoot,
		"outputDir":           outputDir,
		"reportFile":          filepath.Join(outputDir, "report.json"),
		"scenarioResultsFile": scenarioResultsPath,
	}, nil
}

func optimizeSearchBinaryPath() string {
	if toolRoot := strings.TrimSpace(os.Getenv("CAUTILUS_TOOL_ROOT")); toolRoot != "" {
		candidate := filepath.Join(toolRoot, "bin", "cautilus")
		if fileExists(candidate) {
			return candidate
		}
	}
	executable, err := os.Executable()
	if err == nil && strings.TrimSpace(executable) != "" {
		return executable
	}
	return "cautilus"
}

func optimizeSearchCandidateRegistry(candidates []map[string]any) []any {
	result := make([]any, 0, len(candidates))
	for _, candidate := range candidates {
		entry := map[string]any{
			"id":                 candidate["id"],
			"generationIndex":    candidate["generationIndex"],
			"parentCandidateIds": candidate["parentCandidateIds"],
			"origin":             candidate["origin"],
			"targetFile":         candidate["targetFile"],
			"targetSnapshot":     candidate["targetSnapshot"],
			"mutationRationale":  candidate["mutationRationale"],
			"telemetry":          firstNonNil(candidate["telemetry"], map[string]any{}),
		}
		for _, key := range []string{"expectedImprovements", "preservedStrengths", "riskNotes", "artifacts", "evaluationArtifacts"} {
			if value := candidate[key]; value != nil {
				entry[key] = value
			}
		}
		result = append(result, entry)
	}
	return result
}

func optimizeSearchHeldOutMatrix(candidates []map[string]any) []any {
	matrix := []any{}
	for _, candidate := range candidates {
		for _, entry := range optimizeSearchEntrySlice(candidate["heldOutEntries"]) {
			matrix = append(matrix, entry)
		}
	}
	return matrix
}

func optimizeSearchEntrySlice(value any) []map[string]any {
	if typed, ok := value.([]map[string]any); ok {
		return append([]map[string]any{}, typed...)
	}
	result := []map[string]any{}
	for _, raw := range arrayOrEmpty(value) {
		result = append(result, asMap(raw))
	}
	return result
}

func optimizeSearchCandidateIDs(candidates []map[string]any) []string {
	result := make([]string, 0, len(candidates))
	for _, candidate := range candidates {
		if id := stringOrEmpty(candidate["id"]); id != "" {
			result = append(result, id)
		}
	}
	return result
}

func optimizeSearchScenarioIDs(packet map[string]any, matrix []any) []string {
	explicit := stringSliceOrEmptyRuntime(asMap(packet["scenarioSets"])["heldOutScenarioSet"])
	if len(explicit) > 0 {
		return explicit
	}
	ids := []string{}
	for _, raw := range matrix {
		if scenarioID := stringOrEmpty(asMap(raw)["scenarioId"]); scenarioID != "" {
			ids = append(ids, scenarioID)
		}
	}
	return uniqueStrings(ids)
}

func optimizeSearchFrontierCandidateIDs(matrix []any, candidateIDs []string, scenarioIDs []string) []string {
	frontier := []string{}
	for _, candidateID := range candidateIDs {
		dominated := false
		for _, otherID := range candidateIDs {
			if otherID == candidateID {
				continue
			}
			if optimizeSearchCandidateDominates(matrix, otherID, candidateID, scenarioIDs) {
				dominated = true
				break
			}
		}
		if !dominated {
			frontier = append(frontier, candidateID)
		}
	}
	return frontier
}

func optimizeSearchCandidateDominates(matrix []any, leftID string, rightID string, scenarioIDs []string) bool {
	strictlyBetter := false
	for _, scenarioID := range scenarioIDs {
		leftScore := optimizeSearchScoreForCandidate(matrix, leftID, scenarioID)
		rightScore := optimizeSearchScoreForCandidate(matrix, rightID, scenarioID)
		if leftScore < rightScore {
			return false
		}
		if leftScore > rightScore {
			strictlyBetter = true
		}
	}
	return strictlyBetter
}

func optimizeSearchRankCandidateIDs(candidateIDs []string, matrix []any, candidates []map[string]any, scenarioIDs []string) []string {
	telemetryByID := map[string]map[string]any{}
	for _, candidate := range candidates {
		telemetryByID[stringOrEmpty(candidate["id"])] = asMap(candidate["telemetry"])
	}
	ranked := append([]string{}, candidateIDs...)
	sort.Slice(ranked, func(left, right int) bool {
		leftID := ranked[left]
		rightID := ranked[right]
		scoreDelta := optimizeSearchAverageHeldOutScore(matrix, rightID, scenarioIDs) - optimizeSearchAverageHeldOutScore(matrix, leftID, scenarioIDs)
		if scoreDelta != 0 {
			return scoreDelta > 0
		}
		leftTelemetry := telemetryByID[leftID]
		rightTelemetry := telemetryByID[rightID]
		leftCost, _ := toFloat(leftTelemetry["totalCostUsd"])
		rightCost, _ := toFloat(rightTelemetry["totalCostUsd"])
		if leftCost != rightCost {
			return leftCost < rightCost
		}
		leftDuration, _ := toFloat(leftTelemetry["totalDurationMs"])
		rightDuration, _ := toFloat(rightTelemetry["totalDurationMs"])
		if leftDuration != rightDuration {
			return leftDuration < rightDuration
		}
		return leftID < rightID
	})
	return ranked
}

func optimizeSearchAverageHeldOutScore(matrix []any, candidateID string, scenarioIDs []string) float64 {
	if len(scenarioIDs) == 0 {
		return 0
	}
	total := 0.0
	for _, scenarioID := range scenarioIDs {
		total += optimizeSearchScoreForCandidate(matrix, candidateID, scenarioID)
	}
	return total / float64(len(scenarioIDs))
}

func optimizeSearchScoreForCandidate(matrix []any, candidateID string, scenarioID string) float64 {
	for _, raw := range matrix {
		entry := asMap(raw)
		if stringOrEmpty(entry["candidateId"]) != candidateID || stringOrEmpty(entry["scenarioId"]) != scenarioID {
			continue
		}
		if score, ok := toFloat(entry["score"]); ok {
			return score
		}
	}
	return -1
}

func stringSliceOrEmptyRuntime(value any) []string {
	result := []string{}
	for _, raw := range arrayOrEmpty(value) {
		if text := stringOrEmpty(raw); text != "" {
			result = append(result, text)
		}
	}
	return result
}

func stringSliceToAny(values []string) []any {
	result := make([]any, 0, len(values))
	for _, value := range values {
		result = append(result, value)
	}
	return result
}

func derefString(value *string) string {
	if value == nil {
		return ""
	}
	return strings.TrimSpace(*value)
}

func maxInt(left int, right int) int {
	if left > right {
		return left
	}
	return right
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
