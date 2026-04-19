package runtime

import (
	"encoding/json"
	"fmt"
	"math"
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
		"generationLimit":        1,
		"populationLimit":        3,
		"mutationBatchSize":      3,
		"reviewCheckpointPolicy": "final_only",
		"mergeEnabled":           false,
		"threeParentPolicy":      "coverage_expansion",
	},
	"medium": {
		"generationLimit":        2,
		"populationLimit":        5,
		"mutationBatchSize":      4,
		"reviewCheckpointPolicy": "frontier_promotions",
		"mergeEnabled":           false,
		"threeParentPolicy":      "coverage_expansion",
	},
	"heavy": {
		"generationLimit":        3,
		"populationLimit":        8,
		"mutationBatchSize":      5,
		"reviewCheckpointPolicy": "frontier_promotions",
		"mergeEnabled":           false,
		"threeParentPolicy":      "coverage_expansion",
	},
}

type OptimizeSearchBuildOptions struct {
	TargetFileOverride       *string
	HeldOutResultsFile       *string
	HeldOutResults           map[string]any
	Budget                   string
	BudgetExplicit           bool
	ReviewCheckpointPolicy   *string
	ReviewCheckpointExplicit bool
	ThreeParentPolicy        *string
	ThreeParentExplicit      bool
	MergeEnabled             *bool
	SelectionPolicy          map[string]any
	Adapter                  *string
	AdapterName              *string
	Intent                   *string
	BaselineRef              *string
	Profile                  *string
	Split                    *string
}

func BuildOptimizeSearchInput(optimizeInput map[string]any, optimizeInputFile string, options OptimizeSearchBuildOptions, now time.Time) (map[string]any, error) {
	if optimizeInput["schemaVersion"] != contracts.OptimizeInputsSchema {
		return nil, fmt.Errorf("optimize input must use schemaVersion %s", contracts.OptimizeInputsSchema)
	}
	if stringOrEmpty(optimizeInput["optimizationTarget"]) != "prompt" {
		return nil, fmt.Errorf("optimize search currently supports prompt targets only")
	}
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
	reportAdapterContext := asMap(asMap(optimizeInput["report"])["adapterContext"])
	inferredNamedAdapter := ""
	if derefString(options.Adapter) == "" && derefString(options.AdapterName) == "" {
		if stringOrEmpty(reportAdapterContext["adapter"]) == "" && stringOrEmpty(reportAdapterContext["adapterName"]) == "" {
			if namedAdapter := SoleNamedAdapter(stringOrEmpty(optimizeInput["repoRoot"])); namedAdapter != nil {
				inferredNamedAdapter = namedAdapter.Name
			}
		}
	}
	resolvedAdapterPath, resolvedAdapterName := resolveOptimizeSearchAdapterSelection(options, reportAdapterContext, inferredNamedAdapter)
	adapterPayload, err := LoadAdapter(stringOrEmpty(optimizeInput["repoRoot"]), resolvedAdapterPath, resolvedAdapterName)
	if err != nil {
		return nil, err
	}
	if !adapterPayload.Valid {
		return nil, fmt.Errorf("adapter is invalid: %s", strings.Join(adapterPayload.Errors, "; "))
	}
	searchConfig, searchConfigSources := buildOptimizeSearchResolvedConfig(options, adapterPayload)
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
		"searchConfig":        searchConfig,
		"searchConfigSources": searchConfigSources,
		"mutationConfig": map[string]any{
			"backends":           defaultOptimizeSearchBackends(stringOrEmpty(searchConfig["budget"])),
			"trainScenarioLimit": atLeastOne(int(numberOrDefault(searchConfig["mutationBatchSize"], 1)) - 1),
			"promptVariantLimit": int(numberOrDefault(searchConfig["mutationBatchSize"], 1)),
		},
		"mutationEvidencePolicy": map[string]any{
			"reportBuckets":             []any{"regressed", "noisy"},
			"reviewFindingLimit":        numberOrDefault(asMap(asMap(optimizeInput["optimizer"])["plan"])["reviewVariantLimit"], 1),
			"includeScenarioHistory":    optimizeInput["scenarioHistory"] != nil,
			"includeCheckpointFeedback": stringOrEmpty(searchConfig["reviewCheckpointPolicy"]) == "frontier_promotions",
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
			"mode": "held_out",
			"adapter": firstNonEmpty(
				derefString(options.Adapter),
				stringOrEmpty(reportAdapterContext["adapter"]),
			),
			"adapterName": firstNonEmpty(
				derefString(options.AdapterName),
				stringOrEmpty(reportAdapterContext["adapterName"]),
				inferredNamedAdapter,
			),
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
	return stringOrEmpty(optimizeSearchBudgets[normalizeOptimizeSearchBudget(budget)]["reviewCheckpointPolicy"])
}

func DefaultOptimizeSearchThreeParentPolicy() string {
	return stringOrEmpty(optimizeSearchBudgets["medium"]["threeParentPolicy"])
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

func buildOptimizeSearchResolvedConfig(options OptimizeSearchBuildOptions, adapterPayload *AdapterPayload) (map[string]any, map[string]any) {
	budget := normalizeOptimizeSearchBudget(options.Budget)
	sources := map[string]any{
		"adapterPath":            adapterPayload.Path,
		"budget":                 "product_default",
		"preset":                 "product_default",
		"selectionPolicy":        "product_default",
		"reviewCheckpointPolicy": "product_default",
		"mergeEnabled":           "product_default",
		"threeParentPolicy":      "product_default",
	}
	adapterOptimizeSearch := asMap(adapterPayload.Data["optimize_search"])
	if !options.BudgetExplicit {
		if defaultBudget := stringOrEmpty(adapterOptimizeSearch["default_budget"]); defaultBudget != "" {
			budget = normalizeOptimizeSearchBudget(defaultBudget)
			sources["budget"] = "adapter_default"
		}
	} else {
		sources["budget"] = "explicit_override"
	}
	preset, presetSource := resolveOptimizeSearchBudgetPreset(budget, adapterOptimizeSearch)
	sources["preset"] = presetSource

	reviewCheckpointPolicy := stringOrEmpty(preset["reviewCheckpointPolicy"])
	if options.ReviewCheckpointExplicit && options.ReviewCheckpointPolicy != nil && strings.TrimSpace(*options.ReviewCheckpointPolicy) != "" {
		reviewCheckpointPolicy = strings.TrimSpace(*options.ReviewCheckpointPolicy)
		sources["reviewCheckpointPolicy"] = "explicit_override"
	} else {
		sources["reviewCheckpointPolicy"] = presetSource
	}

	mergeEnabled := false
	if value, ok := preset["mergeEnabled"].(bool); ok {
		mergeEnabled = value
	}
	if options.MergeEnabled != nil {
		mergeEnabled = *options.MergeEnabled
		sources["mergeEnabled"] = "explicit_override"
	} else {
		sources["mergeEnabled"] = presetSource
	}

	threeParentPolicy := stringOrEmpty(preset["threeParentPolicy"])
	if options.ThreeParentExplicit && options.ThreeParentPolicy != nil && strings.TrimSpace(*options.ThreeParentPolicy) != "" {
		threeParentPolicy = strings.TrimSpace(*options.ThreeParentPolicy)
		sources["threeParentPolicy"] = "explicit_override"
	} else {
		sources["threeParentPolicy"] = presetSource
	}

	selectionPolicy := normalizeAdapterOptimizeSearchSelectionPolicy(asMap(adapterOptimizeSearch["selection_policy"]))
	if len(selectionPolicy) > 0 {
		sources["selectionPolicy"] = "adapter_default"
	}
	if len(options.SelectionPolicy) > 0 {
		selectionPolicy = options.SelectionPolicy
		sources["selectionPolicy"] = "explicit_override"
	}
	return buildOptimizeSearchConfig(budget, preset, reviewCheckpointPolicy, selectionPolicy, mergeEnabled, threeParentPolicy), sources
}

func normalizeAdapterOptimizeSearchSelectionPolicy(value map[string]any) map[string]any {
	if len(value) == 0 {
		return map[string]any{}
	}
	normalized := map[string]any{}
	if primaryObjective := stringOrEmpty(value["primary_objective"]); primaryObjective != "" {
		normalized["primaryObjective"] = primaryObjective
	}
	if tieBreakers := arrayOrEmpty(value["tie_breakers"]); len(tieBreakers) > 0 {
		normalized["tieBreakers"] = tieBreakers
	}
	if constraintCaps := asMap(value["constraint_caps"]); len(constraintCaps) > 0 {
		normalized["constraintCaps"] = constraintCaps
	}
	return normalized
}

func resolveOptimizeSearchAdapterSelection(options OptimizeSearchBuildOptions, reportAdapterContext map[string]any, inferredNamedAdapter string) (*string, *string) {
	if derefString(options.Adapter) != "" {
		return options.Adapter, nil
	}
	if reportAdapter := stringOrEmpty(reportAdapterContext["adapter"]); reportAdapter != "" {
		return &reportAdapter, nil
	}
	if derefString(options.AdapterName) != "" {
		return nil, options.AdapterName
	}
	if reportAdapterName := stringOrEmpty(reportAdapterContext["adapterName"]); reportAdapterName != "" {
		return nil, &reportAdapterName
	}
	if inferredNamedAdapter != "" {
		return nil, &inferredNamedAdapter
	}
	return nil, nil
}

func resolveOptimizeSearchBudgetPreset(budget string, adapterOptimizeSearch map[string]any) (map[string]any, string) {
	base, _ := cloneJSON(optimizeSearchBudgets[normalizeOptimizeSearchBudget(budget)])
	presetSource := "product_default"
	adapterBudgets := asMap(adapterOptimizeSearch["budgets"])
	if customPreset := asMap(adapterBudgets[budget]); len(customPreset) > 0 {
		for key, value := range customPreset {
			switch key {
			case "generation_limit":
				base["generationLimit"] = value
			case "population_limit":
				base["populationLimit"] = value
			case "mutation_batch_size":
				base["mutationBatchSize"] = value
			case "review_checkpoint_policy":
				base["reviewCheckpointPolicy"] = value
			case "merge_enabled":
				base["mergeEnabled"] = value
			case "three_parent_policy":
				base["threeParentPolicy"] = value
			}
		}
		presetSource = "adapter_preset"
	}
	return base, presetSource
}

func buildOptimizeSearchConfig(budget string, preset map[string]any, reviewCheckpointPolicy string, selectionPolicy map[string]any, mergeEnabled bool, threeParentPolicy string) map[string]any {
	config := map[string]any{
		"algorithm":                "reflective_pareto",
		"budget":                   normalizeOptimizeSearchBudget(budget),
		"candidateSelection":       "pareto",
		"reviewCheckpointPolicy":   reviewCheckpointPolicy,
		"fullGateCheckpointPolicy": "final_only",
		"selectionPolicy":          normalizeOptimizeSearchSelectionPolicy(selectionPolicy),
		"mergeEnabled":             mergeEnabled,
		"threeParentPolicy":        threeParentPolicy,
	}
	for key, value := range preset {
		if key == "reviewCheckpointPolicy" || key == "mergeEnabled" || key == "threeParentPolicy" {
			continue
		}
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
			"searchConfigSources":     firstNonNil(packet["searchConfigSources"], map[string]any{}),
			"experimentContext":       optimizeSearchExperimentContext(packet),
			"telemetryCompleteness":   optimizeSearchTelemetryCompleteness(nil, nil),
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
	checkpointLedger := map[string]any{
		"review":   []any{},
		"fullGate": []any{},
	}
	stopReason := "seed_only"
	mutationInvocations := 0
	mergeInvocations := 0
	generatedCandidateCount := 0
	candidateGenerationAttempts := []any{}
	generationLimit := optimizeSearchConfigInt(packet, "generationLimit", 1)
	populationLimit := optimizeSearchConfigInt(packet, "populationLimit", generationLimit+1)
	artifactRoot := filepath.Dir(firstNonEmpty(inputFile, stringOrEmpty(packet["optimizeInputFile"])))

	for generationIndex := 1; generationIndex <= generationLimit; generationIndex++ {
		if len(candidates) >= populationLimit {
			stopReason = "population_limit"
			break
		}
		matrix := optimizeSearchHeldOutMatrix(candidates)
		scenarioIDs := optimizeSearchScenarioIDs(packet, matrix)
		candidateIDs := optimizeSearchCandidateIDs(candidates)
		parentFrontierIDs := optimizeSearchFrontierCandidateIDs(matrix, candidateIDs, scenarioIDs)
		rankedParentFrontierIDs := optimizeSearchRankCandidateIDs(parentFrontierIDs, matrix, candidates, scenarioIDs)
		eligibleMutationParentIDs := optimizeSearchPrioritizeMutationCandidateIDs(candidates, rankedParentFrontierIDs, generationIndex)
		parentCandidate := optimizeSearchPreferredCandidate(candidates, eligibleMutationParentIDs)
		if parentCandidate == nil {
			stopReason = "no_parent_candidate"
			candidateGenerationAttempts = append(candidateGenerationAttempts, map[string]any{
				"generationIndex":             generationIndex,
				"parentFrontierCandidateIds":  stringSliceToAny(parentFrontierIDs),
				"rankedParentFrontierIds":     stringSliceToAny(rankedParentFrontierIDs),
				"eligibleMutationParentIds":   stringSliceToAny(eligibleMutationParentIDs),
				"selectedParentCandidateId":   nil,
				"backendInvoked":              false,
				"status":                      "no_parent_candidate",
				"prerequisites":               optimizeSearchMutationPrerequisites(packet),
				"mutationBackend":             nilIfEmpty(optimizeSearchMutationBackend(packet)),
				"generatedCandidateIds":       []any{},
				"generatedCandidateCount":     0,
				"selectionConstraintEligible": false,
			})
			break
		}
		mutationInvocations++
		candidate, attemptDiagnostics, err := optimizeSearchEvaluateMutation(packet, inputFile, optimizeSearchMutationOptions{
			GenerationIndex: generationIndex,
			AttemptIndex:    1,
			ParentCandidate: parentCandidate,
		})
		attemptRecord := map[string]any{
			"generationIndex":            generationIndex,
			"parentFrontierCandidateIds": stringSliceToAny(parentFrontierIDs),
			"rankedParentFrontierIds":    stringSliceToAny(rankedParentFrontierIDs),
			"eligibleMutationParentIds":  stringSliceToAny(eligibleMutationParentIDs),
			"selectedParentCandidateId":  stringOrEmpty(parentCandidate["id"]),
			"generatedCandidateIds":      []any{},
			"generatedCandidateCount":    0,
		}
		for key, value := range attemptDiagnostics {
			attemptRecord[key] = value
		}
		if err != nil || candidate == nil {
			reason := firstNonEmpty(stringOrEmpty(attemptDiagnostics["status"]), "mutation_unavailable")
			stopReason = reason
			if err != nil {
				message := strings.TrimSpace(err.Error())
				if message != "" {
					attemptRecord["message"] = message
				}
			}
			candidateGenerationAttempts = append(candidateGenerationAttempts, attemptRecord)
			break
		}
		proposedCandidates := []map[string]any{candidate}
		candidates = append(candidates, candidate)
		generatedCandidateCount++
		updatedMatrix := optimizeSearchHeldOutMatrix(candidates)
		updatedScenarioIDs := optimizeSearchScenarioIDs(packet, updatedMatrix)
		updatedFrontierIDs := optimizeSearchFrontierCandidateIDs(updatedMatrix, optimizeSearchCandidateIDs(candidates), updatedScenarioIDs)
		optimizeSearchRecordFrontierPromotionReviews(packet, artifactRoot, []map[string]any{candidate}, updatedFrontierIDs, checkpointLedger)
		if mergeCandidate, err := optimizeSearchEvaluateMerge(packet, inputFile, generationIndex, candidates, updatedFrontierIDs, updatedScenarioIDs); err == nil && mergeCandidate != nil {
			if !optimizeSearchHasFingerprint(candidates, stringOrEmpty(asMap(mergeCandidate["targetSnapshot"])["sha256"])) {
				proposedCandidates = append(proposedCandidates, mergeCandidate)
				candidates = append(candidates, mergeCandidate)
				mergeInvocations++
				generatedCandidateCount++
				updatedMatrix = optimizeSearchHeldOutMatrix(candidates)
				updatedScenarioIDs = optimizeSearchScenarioIDs(packet, updatedMatrix)
				updatedFrontierIDs = optimizeSearchFrontierCandidateIDs(updatedMatrix, optimizeSearchCandidateIDs(candidates), updatedScenarioIDs)
			}
		}
		attemptRecord["generatedCandidateIds"] = candidateIDList(proposedCandidates)
		attemptRecord["generatedCandidateCount"] = len(proposedCandidates)
		candidateGenerationAttempts = append(candidateGenerationAttempts, attemptRecord)
		generationSummaries = append(generationSummaries, map[string]any{
			"generationIndex":            generationIndex,
			"parentFrontierCandidateIds": stringSliceToAny(parentFrontierIDs),
			"proposedCandidateIds":       candidateIDList(proposedCandidates),
			"promotedCandidateIds":       candidateIDList(proposedCandidates),
			"frontierCandidateIds":       stringSliceToAny(updatedFrontierIDs),
		})
		if len(candidates) >= populationLimit {
			stopReason = "population_limit"
			break
		}
		if generationIndex == generationLimit {
			stopReason = "generation_limit"
		}
	}

	matrix := optimizeSearchHeldOutMatrix(candidates)
	scenarioIDs := optimizeSearchScenarioIDs(packet, matrix)
	candidateIDs := optimizeSearchCandidateIDs(candidates)
	frontierIDs := optimizeSearchFrontierCandidateIDs(matrix, candidateIDs, scenarioIDs)
	rankedFrontierIDs := optimizeSearchRankCandidateIDs(frontierIDs, matrix, candidates, scenarioIDs)
	selectionOutcome := optimizeSearchSelectionOutcome(packet, artifactRoot, candidates, rankedFrontierIDs, checkpointLedger)
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
	selectedCandidateID := "seed"
	if selectionOutcome != nil {
		selectedCandidateID = firstNonEmpty(stringOrEmpty(selectionOutcome["selectedCandidateId"]), selectedCandidateID)
	} else if len(rankedFrontierIDs) > 0 {
		selectedCandidateID = rankedFrontierIDs[0]
	}
	for _, candidate := range candidates {
		if stringOrEmpty(candidate["id"]) == selectedCandidateID {
			selectedCandidate = candidate
			break
		}
	}
	status := "completed"
	proposalBridge := map[string]any{
		"optimizeInputFile":   packet["optimizeInputFile"],
		"selectedCandidateId": selectedCandidateID,
		"selectedTargetFile":  selectedCandidate["targetFile"],
	}
	reasonCodes = []any{}
	missingEvidence = []any{}
	suggestedNextSteps := []any{}
	if selectionOutcome != nil && stringOrEmpty(selectionOutcome["status"]) == "blocked" {
		status = "blocked"
		proposalBridge = map[string]any{
			"optimizeInputFile": packet["optimizeInputFile"],
		}
		reasonCodes = arrayOrEmpty(selectionOutcome["reasonCodes"])
		suggestedNextSteps = []any{
			"inspect checkpoint outcomes for the rejected frontier candidates",
			"tighten the prompt or search brief to satisfy review and full-gate constraints",
			"rerun optimize search after updating the bounded evidence or selection policy",
		}
	}
	checkpointOutcomes := map[string]any{
		"review":   []any{},
		"fullGate": []any{},
	}
	selectionTelemetry := map[string]any{
		"rankedFrontierCandidateIds": stringSliceToAny(rankedFrontierIDs),
	}
	reviewCheckpointCount := 0
	fullGateCheckpointCount := 0
	if selectionOutcome != nil {
		checkpointOutcomes = asMap(selectionOutcome["checkpointOutcomes"])
		selectionTelemetry = asMap(selectionOutcome["selectionTelemetry"])
		reviewCheckpointCount = optimizeSearchCountExecutedCheckpoints(arrayOrEmpty(checkpointOutcomes["review"]))
		fullGateCheckpointCount = optimizeSearchCountExecutedCheckpoints(arrayOrEmpty(checkpointOutcomes["fullGate"]))
	}
	return map[string]any{
		"schemaVersion":           contracts.OptimizeSearchResultSchema,
		"generatedAt":             now.UTC().Format(time.RFC3339Nano),
		"status":                  status,
		"inputFile":               inputFile,
		"repoRoot":                packet["repoRoot"],
		"optimizeInputFile":       packet["optimizeInputFile"],
		"searchConfig":            packet["searchConfig"],
		"searchConfigSources":     firstNonNil(packet["searchConfigSources"], map[string]any{}),
		"experimentContext":       optimizeSearchExperimentContext(packet),
		"telemetryCompleteness":   optimizeSearchTelemetryCompleteness(matrix, candidates),
		"selectedCandidateId":     selectedCandidateID,
		"candidateRegistry":       optimizeSearchCandidateRegistry(candidates),
		"generationSummaries":     generationSummaries,
		"heldOutEvaluationMatrix": matrix,
		"pareto": map[string]any{
			"frontierCandidateIds":        stringSliceToAny(frontierIDs),
			"perScenarioBestCandidateIds": perScenarioBest,
		},
		"checkpointOutcomes": checkpointOutcomes,
		"searchTelemetry": map[string]any{
			"candidateCount":          len(candidates),
			"generatedCandidateCount": generatedCandidateCount,
			"generationCount":         len(generationSummaries),
			"mutationInvocationCount": mutationInvocations,
			"mergeInvocationCount":    mergeInvocations,
			"heldOutEvaluationCount":  len(candidates),
			"reviewCheckpointCount":   reviewCheckpointCount,
			"fullGateCheckpointCount": fullGateCheckpointCount,
			"candidateAttemptCount":   len(candidateGenerationAttempts),
			"stopReason":              stopReason,
		},
		"candidateGenerationDiagnostics": optimizeSearchCandidateGenerationDiagnostics(packet, candidateGenerationAttempts, generatedCandidateCount, stopReason),
		"proposalBridge":                 proposalBridge,
		"selectionTelemetry":             selectionTelemetry,
		"reasonCodes":                    reasonCodes,
		"missingEvidence":                missingEvidence,
		"suggestedNextSteps":             suggestedNextSteps,
	}
}

func optimizeSearchSelectionOutcome(packet map[string]any, artifactRoot string, candidates []map[string]any, rankedFrontierIDs []string, checkpointLedger map[string]any) map[string]any {
	checkpointOutcomes := map[string]any{
		"review":   append([]any{}, arrayOrEmpty(checkpointLedger["review"])...),
		"fullGate": append([]any{}, arrayOrEmpty(checkpointLedger["fullGate"])...),
	}
	rejectedFinalistCandidateIDs := []any{}
	selectionConstraintIneligibleCandidateIDs := []any{}
	rejectionReasons := map[string]any{}
	for _, candidateID := range rankedFrontierIDs {
		candidate := optimizeSearchCandidateByID(candidates, candidateID)
		if candidate == nil {
			continue
		}
		constraintReasons := optimizeSearchCandidateConstraintRejectionReasons(packet, candidate)
		if len(constraintReasons) > 0 {
			rejectedFinalistCandidateIDs = append(rejectedFinalistCandidateIDs, candidateID)
			selectionConstraintIneligibleCandidateIDs = append(selectionConstraintIneligibleCandidateIDs, candidateID)
			rejectionReasons[candidateID] = stringSliceToAny(constraintReasons)
			continue
		}
		checkpointOutcome := optimizeSearchEvaluateCandidateCheckpoints(packet, artifactRoot, candidate)
		if executed, _ := checkpointOutcome["reviewExecuted"].(bool); executed {
			checkpointOutcomes["review"] = optimizeSearchRecordCheckpointOutcome(arrayOrEmpty(checkpointOutcomes["review"]), asMap(checkpointOutcome["review"]))
		}
		if executed, _ := checkpointOutcome["fullGateExecuted"].(bool); executed {
			checkpointOutcomes["fullGate"] = optimizeSearchRecordCheckpointOutcome(arrayOrEmpty(checkpointOutcomes["fullGate"]), asMap(checkpointOutcome["fullGate"]))
		}
		if admissible, _ := checkpointOutcome["admissible"].(bool); admissible {
			return map[string]any{
				"selectedCandidateId": candidateID,
				"checkpointOutcomes":  checkpointOutcomes,
				"selectionTelemetry": map[string]any{
					"rankedFrontierCandidateIds":                stringSliceToAny(rankedFrontierIDs),
					"rejectedFinalistCandidateIds":              rejectedFinalistCandidateIDs,
					"selectionConstraintIneligibleCandidateIds": selectionConstraintIneligibleCandidateIDs,
					"rejectionReasons":                          rejectionReasons,
				},
				"status":      "completed",
				"reasonCodes": []any{},
			}
		}
		rejectedFinalistCandidateIDs = append(rejectedFinalistCandidateIDs, candidateID)
		rejectionReasons[candidateID] = firstNonNil(checkpointOutcome["rejectionReasons"], []any{})
	}
	reasonCodes := []any{"no_checkpoint_admissible_candidate"}
	if len(rankedFrontierIDs) > 0 && len(selectionConstraintIneligibleCandidateIDs) == len(rankedFrontierIDs) {
		reasonCodes = []any{"no_selection_policy_eligible_candidate"}
	}
	return map[string]any{
		"selectedCandidateId": nil,
		"checkpointOutcomes":  checkpointOutcomes,
		"selectionTelemetry": map[string]any{
			"rankedFrontierCandidateIds":                stringSliceToAny(rankedFrontierIDs),
			"rejectedFinalistCandidateIds":              rejectedFinalistCandidateIDs,
			"selectionConstraintIneligibleCandidateIds": selectionConstraintIneligibleCandidateIDs,
			"rejectionReasons":                          rejectionReasons,
		},
		"status":      "blocked",
		"reasonCodes": reasonCodes,
	}
}

func optimizeSearchCandidateGenerationDiagnostics(packet map[string]any, attempts []any, generatedCandidateCount int, stopReason string) map[string]any {
	whyNoCandidates := []any{}
	if generatedCandidateCount == 0 {
		for _, rawAttempt := range attempts {
			status := stringOrEmpty(asMap(rawAttempt)["status"])
			if status == "" || status == "candidate_generated" {
				continue
			}
			whyNoCandidates = append(whyNoCandidates, map[string]any{
				"generationIndex": asMap(rawAttempt)["generationIndex"],
				"status":          status,
				"message":         nilIfEmpty(asMap(rawAttempt)["message"]),
			})
		}
	}
	return map[string]any{
		"generatedCandidateCount": generatedCandidateCount,
		"attemptCount":            len(attempts),
		"stopReason":              stopReason,
		"prerequisites":           optimizeSearchMutationPrerequisites(packet),
		"attempts":                attempts,
		"whyNoCandidates":         whyNoCandidates,
	}
}

func optimizeSearchCandidateByID(candidates []map[string]any, candidateID string) map[string]any {
	for _, candidate := range candidates {
		if stringOrEmpty(candidate["id"]) == candidateID {
			return candidate
		}
	}
	return nil
}

func optimizeSearchCandidateConstraintRejectionReasons(packet map[string]any, candidate map[string]any) []string {
	caps := asMap(asMap(asMap(packet["searchConfig"])["selectionPolicy"])["constraintCaps"])
	reasons := []string{}
	if maxCostUsd, ok := toFloat(caps["maxCostUsd"]); ok {
		if totalCostUsd, ok := toFloat(asMap(candidate["telemetry"])["totalCostUsd"]); ok && totalCostUsd > maxCostUsd {
			reasons = append(reasons, "selection_constraint_max_cost_exceeded")
		}
	}
	if maxDurationMs, ok := toFloat(caps["maxDurationMs"]); ok {
		if totalDurationMs, ok := toFloat(asMap(candidate["telemetry"])["totalDurationMs"]); ok && totalDurationMs > maxDurationMs {
			reasons = append(reasons, "selection_constraint_max_duration_exceeded")
		}
	}
	return reasons
}

func optimizeSearchRecordFrontierPromotionReviews(packet map[string]any, artifactRoot string, promotedCandidates []map[string]any, frontierIDs []string, checkpointLedger map[string]any) {
	if stringOrEmpty(asMap(packet["searchConfig"])["reviewCheckpointPolicy"]) != "frontier_promotions" {
		return
	}
	frontierSet := map[string]struct{}{}
	for _, candidateID := range frontierIDs {
		frontierSet[candidateID] = struct{}{}
	}
	reviewOutcomes := arrayOrEmpty(checkpointLedger["review"])
	for _, candidate := range promotedCandidates {
		candidateID := stringOrEmpty(candidate["id"])
		if candidateID == "" {
			continue
		}
		if _, ok := frontierSet[candidateID]; !ok {
			continue
		}
		if _, ok := candidate["promotionReviewOutcome"].(map[string]any); ok {
			continue
		}
		outcome := optimizeSearchRunReviewCheckpoint(packet, artifactRoot, candidate)
		outcome["reviewedAtGeneration"] = firstNonNil(candidate["generationIndex"], nil)
		candidate["promotionReviewOutcome"] = outcome
		if admissible, _ := outcome["admissible"].(bool); !admissible {
			if feedback := optimizeSearchBuildCheckpointFeedback(packet, outcome); len(feedback) > 0 {
				candidate["checkpointFeedback"] = feedback
			}
		}
		reviewOutcomes = optimizeSearchRecordCheckpointOutcome(reviewOutcomes, outcome)
	}
	checkpointLedger["review"] = reviewOutcomes
}

func optimizeSearchRecordCheckpointOutcome(collection []any, outcome map[string]any) []any {
	if len(outcome) == 0 || stringOrEmpty(outcome["status"]) == "skipped" {
		return collection
	}
	outcomeType := stringOrEmpty(outcome["type"])
	candidateID := stringOrEmpty(outcome["candidateId"])
	for _, raw := range collection {
		existing := asMap(raw)
		if stringOrEmpty(existing["type"]) == outcomeType && stringOrEmpty(existing["candidateId"]) == candidateID {
			return collection
		}
	}
	return append(collection, outcome)
}

func optimizeSearchEvaluateCandidateCheckpoints(packet map[string]any, artifactRoot string, candidate map[string]any) map[string]any {
	review := map[string]any{}
	reviewExecuted := true
	if stringOrEmpty(asMap(packet["searchConfig"])["reviewCheckpointPolicy"]) == "frontier_promotions" {
		if existing := asMap(candidate["promotionReviewOutcome"]); len(existing) > 0 {
			review = existing
			reviewExecuted = false
		}
	}
	if len(review) == 0 {
		review = optimizeSearchRunReviewCheckpoint(packet, artifactRoot, candidate)
		reviewExecuted = stringOrEmpty(review["status"]) != "skipped"
	}
	reviewAdmissible, _ := review["admissible"].(bool)
	if !reviewAdmissible {
		return map[string]any{
			"admissible":       false,
			"rejectionReasons": firstNonNil(review["rejectionReasons"], []any{}),
			"review":           review,
			"reviewExecuted":   reviewExecuted,
			"fullGate":         optimizeSearchSkipCheckpointOutcome("full_gate", stringOrEmpty(candidate["id"]), "review_rejected"),
			"fullGateExecuted": false,
		}
	}
	fullGate := optimizeSearchRunFullGateCheckpoint(packet, artifactRoot, candidate)
	fullGateExecuted := stringOrEmpty(fullGate["status"]) != "skipped"
	fullGateAdmissible, _ := fullGate["admissible"].(bool)
	return map[string]any{
		"admissible":       fullGateAdmissible,
		"rejectionReasons": append(arrayOrEmpty(review["rejectionReasons"]), arrayOrEmpty(fullGate["rejectionReasons"])...),
		"review":           review,
		"reviewExecuted":   reviewExecuted,
		"fullGate":         fullGate,
		"fullGateExecuted": fullGateExecuted,
	}
}

func optimizeSearchRunReviewCheckpoint(packet map[string]any, artifactRoot string, candidate map[string]any) map[string]any {
	adapterPayload, err := optimizeSearchLoadCheckpointAdapter(packet)
	if err != nil {
		return optimizeSearchSkipCheckpointOutcome("review", stringOrEmpty(candidate["id"]), "adapter_not_found")
	}
	if !adapterPayload.Found || !adapterPayload.Valid || len(arrayOrEmpty(adapterPayload.Data["executor_variants"])) == 0 {
		reason := "surface_unavailable"
		if !adapterPayload.Found {
			reason = "adapter_not_found"
		}
		return optimizeSearchSkipCheckpointOutcome("review", stringOrEmpty(candidate["id"]), reason)
	}
	reportFile := optimizeSearchCandidateReportFile(packet, candidate)
	if reportFile == "" || !fileExists(reportFile) {
		return optimizeSearchSkipCheckpointOutcome("review", stringOrEmpty(candidate["id"]), "report_missing")
	}
	outputDir := filepath.Join(artifactRoot, "optimize-search-checkpoints", stringOrEmpty(candidate["id"]), "review")
	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		return map[string]any{
			"type":             "review",
			"candidateId":      candidate["id"],
			"status":           "failed",
			"admissible":       false,
			"rejectionReasons": []any{"review:output_dir_failed"},
		}
	}
	args := []string{
		"review", "variants",
		"--repo-root", stringOrEmpty(packet["repoRoot"]),
		"--workspace", optimizeSearchCandidateWorkspace(packet, candidate),
		"--report-file", reportFile,
		"--output-dir", outputDir,
		"--quiet",
	}
	args = append(args, optimizeSearchAdapterArgs(packet)...)
	command := exec.Command(optimizeSearchBinaryPath(), args...)
	command.Env = optimizeSearchCommandEnv()
	output, runErr := command.CombinedOutput()
	summaryFile := filepath.Join(outputDir, "review-summary.json")
	if !fileExists(summaryFile) {
		return map[string]any{
			"type":             "review",
			"candidateId":      candidate["id"],
			"status":           "failed",
			"admissible":       false,
			"rejectionReasons": []any{"review:summary_missing"},
			"outputDir":        outputDir,
			"summaryFile":      summaryFile,
			"stdout":           string(output),
			"stderr":           string(output),
		}
	}
	summary, err := readJSONFile(summaryFile)
	if err != nil {
		return map[string]any{
			"type":             "review",
			"candidateId":      candidate["id"],
			"status":           "failed",
			"admissible":       false,
			"rejectionReasons": []any{"review:summary_invalid"},
			"outputDir":        outputDir,
			"summaryFile":      summaryFile,
		}
	}
	rejectionReasons := optimizeSearchReviewRejectionReasons(summary)
	feedbackEntries := optimizeSearchReviewFeedbackEntries(summary)
	feedbackMessages := optimizeSearchReviewFeedbackMessages(summary)
	variants := []any{}
	for _, rawVariant := range arrayOrEmpty(summary["variants"]) {
		variant := asMap(rawVariant)
		variants = append(variants, map[string]any{
			"id":            firstNonNil(variant["id"], nil),
			"status":        firstNonNil(variant["status"], nil),
			"verdict":       firstNonNil(asMap(variant["output"])["verdict"], nil),
			"findingsCount": len(arrayOrEmpty(asMap(variant["output"])["findings"])),
			"outputFile":    firstNonNil(variant["outputFile"], nil),
		})
	}
	return map[string]any{
		"type":             "review",
		"candidateId":      candidate["id"],
		"status":           ternaryStatus(runErr == nil, "passed", "failed"),
		"admissible":       len(rejectionReasons) == 0,
		"rejectionReasons": stringSliceToAny(rejectionReasons),
		"feedbackEntries":  mapsToAny(feedbackEntries),
		"feedbackMessages": stringSliceToAny(feedbackMessages),
		"outputDir":        outputDir,
		"summaryFile":      summaryFile,
		"telemetry":        firstNonNil(summary["telemetry"], nil),
		"variants":         variants,
	}
}

func optimizeSearchReviewFeedbackEntries(summary map[string]any) []map[string]any {
	entries := []map[string]any{}
	for _, rawVariant := range arrayOrEmpty(summary["variants"]) {
		variant := asMap(rawVariant)
		variantID := firstNonEmpty(stringOrEmpty(variant["id"]), "variant")
		defaultSeverity := optimizeSearchReviewStatusFromVariant(variant)
		output := asMap(variant["output"])
		findings := arrayOrEmpty(output["findings"])
		if len(findings) > 0 {
			for _, rawFinding := range findings {
				finding := asMap(rawFinding)
				message := stringOrEmpty(finding["message"])
				if message == "" {
					continue
				}
				severity := firstNonEmpty(stringOrEmpty(finding["severity"]), defaultSeverity)
				entries = append(entries, map[string]any{
					"message":         message,
					"severity":        severity,
					"rejectionReason": fmt.Sprintf("review:%s:%s", variantID, severity),
				})
			}
			continue
		}
		if summaryText := stringOrEmpty(output["summary"]); summaryText != "" {
			entries = append(entries, map[string]any{
				"message":         summaryText,
				"severity":        defaultSeverity,
				"rejectionReason": fmt.Sprintf("review:%s:%s", variantID, defaultSeverity),
			})
		}
	}
	return entries
}

func optimizeSearchReviewFeedbackMessages(summary map[string]any) []string {
	messages := []string{}
	for _, rawEntry := range optimizeSearchReviewFeedbackEntries(summary) {
		if message := stringOrEmpty(rawEntry["message"]); message != "" {
			messages = append(messages, message)
		}
	}
	return uniqueStrings(messages)
}

func optimizeSearchBuildCheckpointFeedback(packet map[string]any, reviewOutcome map[string]any) []any {
	entries := arrayOrEmpty(reviewOutcome["feedbackEntries"])
	rejectionReasons := stringSliceValue(reviewOutcome["rejectionReasons"])
	if len(entries) == 0 {
		fallbackSeverity := "concern"
		for _, reason := range rejectionReasons {
			if strings.HasSuffix(reason, ":blocker") {
				fallbackSeverity = "blocker"
				break
			}
		}
		for _, message := range stringSliceValue(reviewOutcome["feedbackMessages"]) {
			entries = append(entries, map[string]any{
				"message":         message,
				"severity":        fallbackSeverity,
				"rejectionReason": firstNonEmpty(firstNonEmptySliceString(rejectionReasons), ""),
			})
		}
	}
	if len(entries) == 0 {
		return []any{}
	}
	scenarioIDs := optimizeSearchCheckpointScenarioIDs(packet)
	feedbackByScenarioID := map[string][]map[string]any{}
	genericEntries := []map[string]any{}
	for _, rawEntry := range entries {
		entry := asMap(rawEntry)
		message := stringOrEmpty(entry["message"])
		matchedScenarioIDs := optimizeSearchFeedbackScenarioIDs(message, scenarioIDs)
		if len(matchedScenarioIDs) == 0 {
			genericEntries = append(genericEntries, entry)
			continue
		}
		for _, scenarioID := range matchedScenarioIDs {
			feedbackByScenarioID[scenarioID] = append(feedbackByScenarioID[scenarioID], entry)
		}
	}
	result := []any{}
	for _, scenarioID := range scenarioIDs {
		scopedEntries := feedbackByScenarioID[scenarioID]
		if len(scopedEntries) == 0 {
			continue
		}
		result = append(result, map[string]any{
			"source":           "frontier_promotion_review",
			"scope":            "scenario",
			"scenarioIds":      []any{scenarioID},
			"severity":         optimizeSearchCheckpointEntrySeverity(scopedEntries),
			"rejectionReasons": stringSliceToAny(optimizeSearchCheckpointEntryReasons(scopedEntries, rejectionReasons)),
			"feedbackMessages": stringSliceToAny(optimizeSearchCheckpointEntryMessages(scopedEntries)),
		})
	}
	if len(genericEntries) > 0 || len(result) == 0 {
		sourceEntries := genericEntries
		scope := "generic"
		if len(sourceEntries) == 0 {
			scope = "candidate"
			sourceEntries = []map[string]any{}
			for _, rawEntry := range entries {
				sourceEntries = append(sourceEntries, asMap(rawEntry))
			}
		}
		result = append(result, map[string]any{
			"source":           "frontier_promotion_review",
			"scope":            scope,
			"scenarioIds":      []any{},
			"severity":         optimizeSearchCheckpointEntrySeverity(sourceEntries),
			"rejectionReasons": stringSliceToAny(optimizeSearchCheckpointEntryReasons(sourceEntries, rejectionReasons)),
			"feedbackMessages": stringSliceToAny(optimizeSearchCheckpointEntryMessages(sourceEntries)),
		})
	}
	return result
}

func optimizeSearchCheckpointScenarioIDs(packet map[string]any) []string {
	ordered := []string{}
	for _, raw := range append(arrayOrEmpty(asMap(packet["scenarioSets"])["trainScenarioSet"]), arrayOrEmpty(asMap(packet["scenarioSets"])["heldOutScenarioSet"])...) {
		if scenarioID := strings.TrimSpace(stringOrEmpty(raw)); scenarioID != "" {
			ordered = append(ordered, scenarioID)
		}
	}
	return uniqueStrings(ordered)
}

func optimizeSearchFeedbackScenarioIDs(message string, scenarioIDs []string) []string {
	normalizedMessage := optimizeSearchNormalizedMatchText(message)
	if normalizedMessage == "" {
		return []string{}
	}
	matches := []string{}
	for _, scenarioID := range scenarioIDs {
		if strings.Contains(normalizedMessage, optimizeSearchNormalizedMatchText(scenarioID)) {
			matches = append(matches, scenarioID)
		}
	}
	return matches
}

func optimizeSearchNormalizedMatchText(value string) string {
	builder := strings.Builder{}
	lastSpace := false
	for _, r := range strings.ToLower(value) {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			builder.WriteRune(r)
			lastSpace = false
			continue
		}
		if !lastSpace {
			builder.WriteRune(' ')
			lastSpace = true
		}
	}
	return strings.TrimSpace(builder.String())
}

func optimizeSearchCheckpointEntrySeverity(entries []map[string]any) string {
	best := "concern"
	for _, entry := range entries {
		severity := stringOrEmpty(entry["severity"])
		if severity == "blocker" {
			return "blocker"
		}
		if severity == "concern" {
			best = "concern"
		}
	}
	return best
}

func optimizeSearchCheckpointEntryReasons(entries []map[string]any, fallback []string) []string {
	reasons := []string{}
	for _, entry := range entries {
		if reason := stringOrEmpty(entry["rejectionReason"]); reason != "" {
			reasons = append(reasons, reason)
		}
	}
	reasons = uniqueStrings(reasons)
	if len(reasons) > 0 {
		return reasons
	}
	return uniqueStrings(fallback)
}

func optimizeSearchCheckpointEntryMessages(entries []map[string]any) []string {
	messages := []string{}
	for _, entry := range entries {
		if message := stringOrEmpty(entry["message"]); message != "" {
			messages = append(messages, message)
		}
	}
	return uniqueStrings(messages)
}

func mapsToAny(items []map[string]any) []any {
	result := make([]any, 0, len(items))
	for _, item := range items {
		result = append(result, item)
	}
	return result
}

func firstNonEmptySliceString(items []string) string {
	for _, item := range items {
		if strings.TrimSpace(item) != "" {
			return item
		}
	}
	return ""
}

func optimizeSearchRunFullGateCheckpoint(packet map[string]any, artifactRoot string, candidate map[string]any) map[string]any {
	if stringOrEmpty(asMap(packet["searchConfig"])["fullGateCheckpointPolicy"]) != "final_only" {
		return optimizeSearchSkipCheckpointOutcome("full_gate", stringOrEmpty(candidate["id"]), "policy_disabled")
	}
	adapterPayload, err := optimizeSearchLoadCheckpointAdapter(packet)
	if err != nil {
		return optimizeSearchSkipCheckpointOutcome("full_gate", stringOrEmpty(candidate["id"]), "adapter_not_found")
	}
	if !adapterPayload.Found || !adapterPayload.Valid || len(stringArrayOrEmpty(adapterPayload.Data["full_gate_command_templates"])) == 0 {
		reason := "surface_unavailable"
		if !adapterPayload.Found {
			reason = "adapter_not_found"
		}
		return optimizeSearchSkipCheckpointOutcome("full_gate", stringOrEmpty(candidate["id"]), reason)
	}
	outputDir := filepath.Join(artifactRoot, "optimize-search-checkpoints", stringOrEmpty(candidate["id"]), "full-gate")
	if err := os.MkdirAll(outputDir, 0o755); err != nil {
		return map[string]any{
			"type":             "full_gate",
			"candidateId":      candidate["id"],
			"status":           "failed",
			"admissible":       false,
			"rejectionReasons": []any{"full_gate:output_dir_failed"},
		}
	}
	args := []string{
		"mode", "evaluate",
		"--repo-root", stringOrEmpty(packet["repoRoot"]),
		"--candidate-repo", optimizeSearchCandidateWorkspace(packet, candidate),
		"--mode", "full_gate",
		"--intent", firstNonEmpty(stringOrEmpty(asMap(packet["evaluationContext"])["intent"]), stringOrEmpty(asMap(asMap(packet["optimizeInput"])["report"])["intent"]), "Prompt candidate evaluation"),
		"--baseline-ref", firstNonEmpty(stringOrEmpty(asMap(packet["evaluationContext"])["baselineRef"]), stringOrEmpty(asMap(asMap(packet["optimizeInput"])["report"])["baseline"]), "HEAD"),
		"--output-dir", outputDir,
		"--quiet",
	}
	for _, pair := range [][2]string{
		{"--profile", stringOrEmpty(asMap(packet["evaluationContext"])["profile"])},
		{"--split", stringOrEmpty(asMap(packet["evaluationContext"])["split"])},
	} {
		if strings.TrimSpace(pair[1]) != "" {
			args = append(args, pair[0], pair[1])
		}
	}
	args = append(args, optimizeSearchAdapterArgs(packet)...)
	command := exec.Command(optimizeSearchBinaryPath(), args...)
	command.Env = optimizeSearchCommandEnv()
	output, runErr := command.CombinedOutput()
	reportFile := filepath.Join(outputDir, "report.json")
	if !fileExists(reportFile) {
		return map[string]any{
			"type":             "full_gate",
			"candidateId":      candidate["id"],
			"status":           "failed",
			"admissible":       false,
			"rejectionReasons": []any{"full_gate:report_missing"},
			"outputDir":        outputDir,
			"reportFile":       reportFile,
			"stdout":           string(output),
			"stderr":           string(output),
		}
	}
	report, err := readJSONFile(reportFile)
	if err != nil {
		return map[string]any{
			"type":             "full_gate",
			"candidateId":      candidate["id"],
			"status":           "failed",
			"admissible":       false,
			"rejectionReasons": []any{"full_gate:report_invalid"},
			"outputDir":        outputDir,
			"reportFile":       reportFile,
		}
	}
	recommendation := stringOrEmpty(report["recommendation"])
	admissible := recommendation == "accept-now"
	rejectionReasons := []any{}
	if !admissible {
		rejectionReasons = []any{"full_gate:" + firstNonEmpty(recommendation, "reject")}
	}
	return map[string]any{
		"type":             "full_gate",
		"candidateId":      candidate["id"],
		"status":           ternaryStatus(runErr == nil, "passed", "failed"),
		"admissible":       admissible,
		"rejectionReasons": rejectionReasons,
		"outputDir":        outputDir,
		"reportFile":       reportFile,
		"recommendation":   firstNonNil(report["recommendation"], nil),
	}
}

func optimizeSearchLoadCheckpointAdapter(packet map[string]any) (*AdapterPayload, error) {
	evaluationContext := asMap(packet["evaluationContext"])
	return LoadAdapter(
		stringOrEmpty(packet["repoRoot"]),
		optimizeSearchOptionalStringPointer(evaluationContext["adapter"]),
		optimizeSearchOptionalStringPointer(evaluationContext["adapterName"]),
	)
}

func optimizeSearchAdapterArgs(packet map[string]any) []string {
	evaluationContext := asMap(packet["evaluationContext"])
	args := []string{}
	if adapter := stringOrEmpty(evaluationContext["adapter"]); adapter != "" {
		args = append(args, "--adapter", adapter)
	}
	if adapterName := stringOrEmpty(evaluationContext["adapterName"]); adapterName != "" {
		args = append(args, "--adapter-name", adapterName)
	}
	return args
}

func optimizeSearchCandidateWorkspace(packet map[string]any, candidate map[string]any) string {
	if worktreeRoot := stringOrEmpty(asMap(candidate["evaluationArtifacts"])["worktreeRoot"]); worktreeRoot != "" {
		return worktreeRoot
	}
	return stringOrEmpty(packet["repoRoot"])
}

func optimizeSearchCandidateReportFile(packet map[string]any, candidate map[string]any) string {
	if reportFile := stringOrEmpty(asMap(candidate["evaluationArtifacts"])["reportFile"]); reportFile != "" {
		return reportFile
	}
	if reportFile := stringOrEmpty(asMap(packet["evaluationFiles"])["reportFile"]); reportFile != "" {
		return reportFile
	}
	return stringOrEmpty(asMap(asMap(packet["optimizeInput"])["reportFile"])["path"])
}

func optimizeSearchSkipCheckpointOutcome(checkpointType string, candidateID string, reason string) map[string]any {
	return map[string]any{
		"type":             checkpointType,
		"candidateId":      candidateID,
		"status":           "skipped",
		"admissible":       true,
		"rejectionReasons": []any{},
		"skipReason":       reason,
	}
}

func optimizeSearchCommandEnv() []string {
	env := []string{}
	for _, entry := range os.Environ() {
		if strings.HasPrefix(entry, "CAUTILUS_RUN_DIR=") {
			continue
		}
		env = append(env, entry)
	}
	return append(env, "CAUTILUS_RUN_DIR=")
}

func optimizeSearchReviewRejectionReasons(summary map[string]any) []string {
	reasons := []string{}
	for _, rawVariant := range arrayOrEmpty(summary["variants"]) {
		variant := asMap(rawVariant)
		status := optimizeSearchReviewStatusFromVariant(variant)
		if status == "pass" {
			continue
		}
		reasons = append(reasons, fmt.Sprintf("review:%s:%s", firstNonEmpty(stringOrEmpty(variant["id"]), "variant"), status))
	}
	return reasons
}

func optimizeSearchReviewStatusFromVariant(variant map[string]any) string {
	if stringOrEmpty(variant["status"]) != "passed" {
		return "blocker"
	}
	verdict := stringOrEmpty(asMap(variant["output"])["verdict"])
	switch verdict {
	case "pass", "concern", "blocker":
		return verdict
	default:
		return "concern"
	}
}

func optimizeSearchCountExecutedCheckpoints(items []any) int {
	count := 0
	for _, raw := range items {
		status := stringOrEmpty(asMap(raw)["status"])
		if status != "" && status != "skipped" {
			count++
		}
	}
	return count
}

func ternaryStatus(condition bool, whenTrue string, whenFalse string) string {
	if condition {
		return whenTrue
	}
	return whenFalse
}

func optimizeSearchOptionalStringPointer(value any) *string {
	text := strings.TrimSpace(stringOrEmpty(value))
	if text == "" {
		return nil
	}
	return &text
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
		signals = append(signals, collectCompareArtifactFeedbackSignals(asMap(asMap(modeRun["scenarioResults"])["compareArtifact"]))...)
	}
	signals = append(signals, collectCompareArtifactFeedbackSignals(asMap(asMap(packet["heldOutResults"])["compareArtifact"]))...)
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

func collectCompareArtifactFeedbackSignals(compareArtifact map[string]any) []string {
	signals := []string{}
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
	for _, reason := range stringSliceValue(compareArtifact["reasons"]) {
		if strings.TrimSpace(reason) != "" {
			signals = append(signals, reason)
		}
	}
	return signals
}

func optimizeSearchCandidateTelemetry(entries []map[string]any) map[string]any {
	totalCost := 0.0
	totalDuration := 0.0
	totalTokens := 0.0
	sawCost := false
	sawDuration := false
	sawTokens := false
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
		if tokens, ok := toFloat(telemetry["total_tokens"]); ok {
			totalTokens += tokens
			sawTokens = true
		}
	}
	result := map[string]any{}
	if sawCost {
		result["totalCostUsd"] = round12(totalCost)
	}
	if sawDuration {
		result["totalDurationMs"] = round12(totalDuration)
	}
	if sawTokens {
		result["totalTokens"] = round12(totalTokens)
	}
	return result
}

func optimizeSearchExperimentContext(packet map[string]any) map[string]any {
	evaluationContext := asMap(packet["evaluationContext"])
	mutationBackends := []any{}
	for _, rawBackend := range arrayOrEmpty(asMap(packet["mutationConfig"])["backends"]) {
		backend := asMap(rawBackend)
		mutationBackends = append(mutationBackends, map[string]any{
			"id":      nilIfEmpty(backend["id"]),
			"backend": nilIfEmpty(backend["backend"]),
		})
	}
	return map[string]any{
		"mode":             nilIfEmpty(evaluationContext["mode"]),
		"intent":           nilIfEmpty(evaluationContext["intent"]),
		"baselineRef":      nilIfEmpty(evaluationContext["baselineRef"]),
		"adapter":          nilIfEmpty(evaluationContext["adapter"]),
		"adapterName":      nilIfEmpty(evaluationContext["adapterName"]),
		"adapterPath":      nilIfEmpty(asMap(packet["searchConfigSources"])["adapterPath"]),
		"profile":          nilIfEmpty(evaluationContext["profile"]),
		"split":            nilIfEmpty(evaluationContext["split"]),
		"targetFile":       firstNonNil(packet["targetFile"], map[string]any{}),
		"searchBudget":     nilIfEmpty(asMap(packet["searchConfig"])["budget"]),
		"mutationBackends": mutationBackends,
	}
}

func optimizeSearchTelemetryCompleteness(matrix []any, candidates []map[string]any) map[string]any {
	heldOutValues := func(extract func(map[string]any) bool) string {
		if len(matrix) == 0 {
			return "absent"
		}
		count := 0
		for _, rawEntry := range matrix {
			entry := asMap(rawEntry)
			if extract(entry) {
				count++
			}
		}
		return telemetryCompletenessStatus(len(matrix), count)
	}
	candidateValues := func(extract func(map[string]any) bool) string {
		if len(candidates) == 0 {
			return "absent"
		}
		count := 0
		for _, candidate := range candidates {
			if extract(asMap(candidate["telemetry"])) {
				count++
			}
		}
		return telemetryCompletenessStatus(len(candidates), count)
	}
	return map[string]any{
		"heldOutDurationMs": heldOutValues(func(entry map[string]any) bool {
			_, ok := toFloat(firstNonNil(asMap(entry["telemetry"])["durationMs"], asMap(entry["telemetry"])["duration_ms"]))
			return ok
		}),
		"heldOutTotalTokens": heldOutValues(func(entry map[string]any) bool {
			_, ok := toFloat(asMap(entry["telemetry"])["total_tokens"])
			return ok
		}),
		"heldOutCostUsd":               heldOutValues(func(entry map[string]any) bool { _, ok := toFloat(asMap(entry["telemetry"])["cost_usd"]); return ok }),
		"candidateAggregateDurationMs": candidateValues(func(telemetry map[string]any) bool { _, ok := toFloat(telemetry["totalDurationMs"]); return ok }),
		"candidateAggregateTotalTokens": candidateValues(func(telemetry map[string]any) bool {
			_, ok := toFloat(telemetry["totalTokens"])
			return ok
		}),
		"candidateAggregateCostUsd": candidateValues(func(telemetry map[string]any) bool {
			_, ok := toFloat(telemetry["totalCostUsd"])
			return ok
		}),
	}
}

func telemetryCompletenessStatus(total, present int) string {
	if total == 0 || present == 0 {
		return "absent"
	}
	if present == total {
		return "complete"
	}
	return "partial"
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

type optimizeSearchMutationOptions struct {
	GenerationIndex int
	AttemptIndex    int
	ParentCandidate map[string]any
}

func optimizeSearchEvaluateMutation(packet map[string]any, inputFile string, options optimizeSearchMutationOptions) (map[string]any, map[string]any, error) {
	prerequisites := optimizeSearchMutationPrerequisites(packet)
	diagnostics := map[string]any{
		"mutationBackend": nil,
		"backendInvoked":  false,
		"status":          "",
		"prerequisites":   prerequisites,
	}
	if !truthy(prerequisites["intentPresent"]) || !truthy(prerequisites["baselineRefPresent"]) {
		diagnostics["status"] = "mutation_prerequisites_missing"
		return nil, diagnostics, fmt.Errorf("mutation prerequisites missing")
	}
	toolRoot := strings.TrimSpace(os.Getenv("CAUTILUS_TOOL_ROOT"))
	reviewWrapperPath := filepath.Join(toolRoot, "scripts", "agent-runtime", "run-review-variant.sh")
	if toolRoot == "" || !fileExists(reviewWrapperPath) {
		diagnostics["status"] = "review_wrapper_unavailable"
		return nil, diagnostics, fmt.Errorf("review wrapper unavailable")
	}
	artifactRoot := filepath.Dir(firstNonEmpty(inputFile, stringOrEmpty(packet["optimizeInputFile"])))
	backend := optimizeSearchMutationBackend(packet)
	diagnostics["mutationBackend"] = nilIfEmpty(backend)
	if backend == "" {
		diagnostics["status"] = "mutation_backend_unavailable"
		return nil, diagnostics, fmt.Errorf("mutation backend unavailable")
	}
	generationIndex := atLeastOne(options.GenerationIndex)
	attemptIndex := atLeastOne(options.AttemptIndex)
	parentCandidate := options.ParentCandidate
	candidateID := fmt.Sprintf("g%d-%d-%s", generationIndex, attemptIndex, strings.ReplaceAll(strings.ReplaceAll(backend, "_", "-"), " ", "-"))
	candidateRoot := filepath.Join(artifactRoot, "optimize-search-candidates", candidateID)
	if err := os.MkdirAll(candidateRoot, 0o755); err != nil {
		diagnostics["status"] = "candidate_setup_failed"
		return nil, diagnostics, err
	}
	promptFile := filepath.Join(candidateRoot, "mutation.prompt.md")
	schemaFile := filepath.Join(candidateRoot, "mutation.schema.json")
	outputFile := filepath.Join(candidateRoot, "mutation.output.json")
	candidatePromptPath := filepath.Join(candidateRoot, "candidate.prompt.md")
	if err := os.WriteFile(promptFile, []byte(optimizeSearchMutationPrompt(packet, parentCandidate)), 0o644); err != nil {
		diagnostics["status"] = "candidate_setup_failed"
		return nil, diagnostics, err
	}
	if err := writeJSONFile(schemaFile, optimizeSearchMutationSchema()); err != nil {
		diagnostics["status"] = "candidate_setup_failed"
		return nil, diagnostics, err
	}
	command := exec.Command("bash", reviewWrapperPath,
		"--backend", backend,
		"--workspace", stringOrEmpty(packet["repoRoot"]),
		"--prompt-file", promptFile,
		"--schema-file", schemaFile,
		"--output-file", outputFile,
	)
	command.Env = append(os.Environ(), "CAUTILUS_REVIEW_VARIANT_TIMEOUT_SECONDS="+firstNonEmpty(os.Getenv("CAUTILUS_OPTIMIZE_SEARCH_TIMEOUT_SECONDS"), "180"))
	diagnostics["backendInvoked"] = true
	output, err := command.CombinedOutput()
	if err != nil {
		diagnostics["status"] = "mutation_backend_failed"
		return nil, diagnostics, fmt.Errorf("mutation backend failed: %s", strings.TrimSpace(string(output)))
	}
	mutationOutput, err := readJSONFile(outputFile)
	if err != nil {
		diagnostics["status"] = "mutation_output_invalid"
		return nil, diagnostics, err
	}
	promptMarkdown := strings.TrimSpace(stringOrEmpty(mutationOutput["promptMarkdown"]))
	if promptMarkdown == "" {
		diagnostics["status"] = "mutation_output_missing_prompt"
		return nil, diagnostics, fmt.Errorf("mutation output omitted promptMarkdown")
	}
	if err := os.WriteFile(candidatePromptPath, []byte(promptMarkdown+"\n"), 0o644); err != nil {
		diagnostics["status"] = "candidate_setup_failed"
		return nil, diagnostics, err
	}
	heldOutEntries, evaluationArtifacts, err := optimizeSearchEvaluateCandidate(packet, artifactRoot, candidateID, candidatePromptPath)
	if err != nil {
		diagnostics["status"] = "held_out_evaluation_failed"
		return nil, diagnostics, err
	}
	diagnostics["status"] = "candidate_generated"
	diagnostics["candidateId"] = candidateID
	return map[string]any{
		"id":                 candidateID,
		"generationIndex":    generationIndex,
		"parentCandidateIds": []any{stringOrEmpty(parentCandidate["id"])},
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
	}, diagnostics, nil
}

func optimizeSearchMutationPrerequisites(packet map[string]any) map[string]any {
	evaluationContext := asMap(packet["evaluationContext"])
	targetFile := asMap(packet["targetFile"])
	backend := optimizeSearchMutationBackend(packet)
	toolRoot := strings.TrimSpace(os.Getenv("CAUTILUS_TOOL_ROOT"))
	reviewWrapperPath := filepath.Join(toolRoot, "scripts", "agent-runtime", "run-review-variant.sh")
	return map[string]any{
		"intentPresent":             stringOrEmpty(evaluationContext["intent"]) != "",
		"baselineRefPresent":        stringOrEmpty(evaluationContext["baselineRef"]) != "",
		"targetFilePath":            nilIfEmpty(targetFile["path"]),
		"targetFileExists":          truthy(targetFile["exists"]),
		"reviewWrapperAvailable":    toolRoot != "" && fileExists(reviewWrapperPath),
		"mutationBackendConfigured": backend != "",
	}
}

func optimizeSearchConfigInt(packet map[string]any, key string, defaultValue int) int {
	value := int(numberOrDefault(asMap(packet["searchConfig"])[key], float64(defaultValue)))
	return atLeastOne(value)
}

func optimizeSearchMutationBackend(packet map[string]any) string {
	for _, rawBackend := range arrayOrEmpty(asMap(packet["mutationConfig"])["backends"]) {
		if backend := stringOrEmpty(asMap(rawBackend)["backend"]); backend != "" {
			return backend
		}
	}
	return ""
}

func optimizeSearchEvaluateMerge(packet map[string]any, inputFile string, generationIndex int, candidates []map[string]any, rankedFrontierIDs []string, scenarioIDs []string) (map[string]any, error) {
	mergeEnabled, _ := asMap(packet["searchConfig"])["mergeEnabled"].(bool)
	if !mergeEnabled {
		return nil, nil
	}
	parents := optimizeSearchSelectMergeParents(candidates, rankedFrontierIDs, scenarioIDs, stringOrEmpty(asMap(packet["searchConfig"])["threeParentPolicy"]))
	if len(parents) < 2 {
		return nil, nil
	}
	toolRoot := strings.TrimSpace(os.Getenv("CAUTILUS_TOOL_ROOT"))
	reviewWrapperPath := filepath.Join(toolRoot, "scripts", "agent-runtime", "run-review-variant.sh")
	if toolRoot == "" || !fileExists(reviewWrapperPath) {
		return nil, fmt.Errorf("review wrapper unavailable")
	}
	artifactRoot := filepath.Dir(firstNonEmpty(inputFile, stringOrEmpty(packet["optimizeInputFile"])))
	backend := optimizeSearchMutationBackend(packet)
	if backend == "" {
		return nil, fmt.Errorf("mutation backend unavailable")
	}
	candidateID := fmt.Sprintf("g%d-merge-1-%s", atLeastOne(generationIndex), strings.ReplaceAll(strings.ReplaceAll(backend, "_", "-"), " ", "-"))
	candidateRoot := filepath.Join(artifactRoot, "optimize-search-candidates", candidateID)
	if err := os.MkdirAll(candidateRoot, 0o755); err != nil {
		return nil, err
	}
	promptFile := filepath.Join(candidateRoot, "mutation.prompt.md")
	schemaFile := filepath.Join(candidateRoot, "mutation.schema.json")
	outputFile := filepath.Join(candidateRoot, "mutation.output.json")
	candidatePromptPath := filepath.Join(candidateRoot, "candidate.prompt.md")
	parentPrompts := make([]string, 0, len(parents))
	for _, parent := range parents {
		targetPath := stringOrEmpty(asMap(parent["targetFile"])["path"])
		payload, err := os.ReadFile(targetPath)
		if err != nil {
			return nil, err
		}
		parentPrompts = append(parentPrompts, string(payload))
	}
	mergeCheckpointFeedback := optimizeSearchCollectMergeCheckpointFeedback(candidates, rankedFrontierIDs, scenarioIDs)
	promptText := optimizeSearchMergePrompt(packet, parents, parentPrompts, backend, scenarioIDs, mergeCheckpointFeedback)
	if err := os.WriteFile(promptFile, []byte(promptText), 0o644); err != nil {
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
	command.Env = append(os.Environ(), "CAUTILUS_REVIEW_VARIANT_TIMEOUT_SECONDS="+firstNonEmpty(os.Getenv("CAUTILUS_OPTIMIZE_SEARCH_TIMEOUT_SECONDS"), "180"))
	output, err := command.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("merge backend failed: %s", strings.TrimSpace(string(output)))
	}
	mutationOutput, err := readJSONFile(outputFile)
	if err != nil {
		return nil, err
	}
	promptMarkdown := strings.TrimSpace(stringOrEmpty(mutationOutput["promptMarkdown"]))
	if promptMarkdown == "" {
		return nil, fmt.Errorf("merge output omitted promptMarkdown")
	}
	if err := os.WriteFile(candidatePromptPath, []byte(promptMarkdown+"\n"), 0o644); err != nil {
		return nil, err
	}
	heldOutEntries, evaluationArtifacts, err := optimizeSearchEvaluateCandidate(packet, artifactRoot, candidateID, candidatePromptPath)
	if err != nil {
		return nil, err
	}
	parentIDs := make([]any, 0, len(parents))
	for _, parent := range parents {
		parentIDs = append(parentIDs, stringOrEmpty(parent["id"]))
	}
	return map[string]any{
		"id":                 candidateID,
		"generationIndex":    atLeastOne(generationIndex),
		"parentCandidateIds": parentIDs,
		"origin":             "merge",
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

func optimizeSearchSelectMergeParents(candidates []map[string]any, rankedFrontierIDs []string, scenarioIDs []string, threeParentPolicy string) []map[string]any {
	if len(rankedFrontierIDs) < 2 {
		return nil
	}
	frontierCandidates := []map[string]any{}
	for _, candidateID := range rankedFrontierIDs {
		candidate := optimizeSearchCandidateByID(candidates, candidateID)
		if candidate != nil {
			frontierCandidates = append(frontierCandidates, candidate)
		}
	}
	if len(frontierCandidates) < 2 {
		return nil
	}
	scenarioWeights := optimizeSearchMergeScenarioPriorityWeights(frontierCandidates, scenarioIDs, candidates)
	checkpointRepairWeights := optimizeSearchMergeCheckpointRepairWeights(candidates, scenarioIDs)
	bestFrontierScores := optimizeSearchMergeFrontierBestScores(frontierCandidates, scenarioIDs)
	bestPair := optimizeSearchBestMergeGroup(frontierCandidates, 2, scenarioIDs, scenarioWeights, checkpointRepairWeights, bestFrontierScores)
	if bestPair == nil {
		return nil
	}
	if len(frontierCandidates) < 3 || threeParentPolicy == "disabled" {
		return bestPair.Candidates
	}
	bestTriple := optimizeSearchBestMergeGroup(frontierCandidates, 3, scenarioIDs, scenarioWeights, checkpointRepairWeights, bestFrontierScores)
	if bestTriple == nil {
		return bestPair.Candidates
	}
	if threeParentPolicy == "coverage_expansion" && bestTriple.Metrics.Coverage <= bestPair.Metrics.Coverage {
		return bestPair.Candidates
	}
	if optimizeSearchCompareMergeGroupMetrics(bestTriple.Metrics, bestPair.Metrics) > 0 {
		return bestTriple.Candidates
	}
	return bestPair.Candidates
}

func optimizeSearchHasFingerprint(candidates []map[string]any, fingerprint string) bool {
	if strings.TrimSpace(fingerprint) == "" {
		return false
	}
	for _, candidate := range candidates {
		if stringOrEmpty(asMap(candidate["targetSnapshot"])["sha256"]) == fingerprint {
			return true
		}
	}
	return false
}

func candidateIDList(candidates []map[string]any) []any {
	result := make([]any, 0, len(candidates))
	for _, candidate := range candidates {
		if id := stringOrEmpty(candidate["id"]); id != "" {
			result = append(result, id)
		}
	}
	return result
}

type optimizeSearchMergeGroup struct {
	Candidates []map[string]any
	Metrics    optimizeSearchMergeGroupMetrics
}

type optimizeSearchMergeGroupMetrics struct {
	Coverage                  int
	WeakestScore              float64
	Average                   float64
	CheckpointRepairWeight    float64
	CheckpointRepairCoverage  int
	ParentCount               int
	PriorityImprovementWeight float64
	ImprovementCoverage       int
	ImprovementDiversity      int
	StrengthCount             int
	PriorityRiskPenalty       float64
	RiskPenalty               int
	TotalCostUsd              float64
	TotalDurationMs           float64
}

func optimizeSearchBestMergeGroup(frontierCandidates []map[string]any, size int, scenarioIDs []string, scenarioWeights map[string]float64, checkpointRepairWeights map[string]float64, bestFrontierScores map[string]float64) *optimizeSearchMergeGroup {
	if len(frontierCandidates) < size || size < 2 {
		return nil
	}
	var best *optimizeSearchMergeGroup
	for _, indexes := range optimizeSearchCombinationIndexes(len(frontierCandidates), size) {
		group := make([]map[string]any, 0, size)
		for _, index := range indexes {
			group = append(group, frontierCandidates[index])
		}
		candidateGroup := &optimizeSearchMergeGroup{
			Candidates: group,
			Metrics:    optimizeSearchMergeGroupMetricsForCandidates(group, scenarioIDs, scenarioWeights, checkpointRepairWeights, bestFrontierScores),
		}
		if best == nil || optimizeSearchCompareMergeGroupMetrics(candidateGroup.Metrics, best.Metrics) > 0 {
			best = candidateGroup
		}
	}
	return best
}

func optimizeSearchCompareMergeGroupMetrics(left optimizeSearchMergeGroupMetrics, right optimizeSearchMergeGroupMetrics) int {
	switch {
	case left.Coverage != right.Coverage:
		return compareInt(left.Coverage, right.Coverage)
	case left.WeakestScore != right.WeakestScore:
		return compareFloat(left.WeakestScore, right.WeakestScore)
	case left.Average != right.Average:
		return compareFloat(left.Average, right.Average)
	case left.CheckpointRepairWeight != right.CheckpointRepairWeight:
		return compareFloat(left.CheckpointRepairWeight, right.CheckpointRepairWeight)
	case left.CheckpointRepairCoverage != right.CheckpointRepairCoverage:
		return compareInt(left.CheckpointRepairCoverage, right.CheckpointRepairCoverage)
	case left.ParentCount != right.ParentCount:
		return compareInt(right.ParentCount, left.ParentCount)
	case left.PriorityImprovementWeight != right.PriorityImprovementWeight:
		return compareFloat(left.PriorityImprovementWeight, right.PriorityImprovementWeight)
	case left.ImprovementCoverage != right.ImprovementCoverage:
		return compareInt(left.ImprovementCoverage, right.ImprovementCoverage)
	case left.ImprovementDiversity != right.ImprovementDiversity:
		return compareInt(left.ImprovementDiversity, right.ImprovementDiversity)
	case left.StrengthCount != right.StrengthCount:
		return compareInt(left.StrengthCount, right.StrengthCount)
	case left.PriorityRiskPenalty != right.PriorityRiskPenalty:
		return compareFloat(right.PriorityRiskPenalty, left.PriorityRiskPenalty)
	case left.RiskPenalty != right.RiskPenalty:
		return compareInt(right.RiskPenalty, left.RiskPenalty)
	case left.TotalCostUsd != right.TotalCostUsd:
		return compareFloat(right.TotalCostUsd, left.TotalCostUsd)
	case left.TotalDurationMs != right.TotalDurationMs:
		return compareFloat(right.TotalDurationMs, left.TotalDurationMs)
	default:
		return 0
	}
}

func optimizeSearchMergeGroupMetricsForCandidates(candidates []map[string]any, scenarioIDs []string, scenarioWeights map[string]float64, checkpointRepairWeights map[string]float64, bestFrontierScores map[string]float64) optimizeSearchMergeGroupMetrics {
	coverage := 0
	weakestScore := math.Inf(1)
	average := 0.0
	expectedImprovements := []string{}
	preservedStrengths := []string{}
	riskNotes := []string{}
	totalCostUsd := 0.0
	totalDurationMs := 0.0
	for _, scenarioID := range scenarioIDs {
		bestScore := math.Inf(-1)
		for _, candidate := range candidates {
			score := optimizeSearchHeldOutScoreForCandidate(candidate, scenarioID)
			if score > bestScore {
				bestScore = score
			}
		}
		if bestScore == bestFrontierScores[scenarioID] {
			coverage++
			if bestScore < weakestScore {
				weakestScore = bestScore
			}
		}
		average += bestScore
	}
	if weakestScore == math.Inf(1) {
		weakestScore = math.Inf(-1)
	}
	for _, candidate := range candidates {
		expectedImprovements = append(expectedImprovements, stringSliceOrEmptyRuntime(candidate["expectedImprovements"])...)
		preservedStrengths = append(preservedStrengths, stringSliceOrEmptyRuntime(candidate["preservedStrengths"])...)
		riskNotes = append(riskNotes, stringSliceOrEmptyRuntime(candidate["riskNotes"])...)
		telemetry := asMap(candidate["telemetry"])
		if cost, ok := toFloat(telemetry["totalCostUsd"]); ok {
			totalCostUsd += cost
		} else {
			totalCostUsd += math.Inf(1)
		}
		if duration, ok := toFloat(telemetry["totalDurationMs"]); ok {
			totalDurationMs += duration
		} else {
			totalDurationMs += math.Inf(1)
		}
	}
	if len(scenarioIDs) > 0 {
		average = average / float64(len(scenarioIDs))
	}
	checkpointScenarioIDs := []string{}
	for scenarioID, weight := range checkpointRepairWeights {
		if weight > 0 {
			checkpointScenarioIDs = append(checkpointScenarioIDs, scenarioID)
		}
	}
	return optimizeSearchMergeGroupMetrics{
		Coverage:                  coverage,
		WeakestScore:              weakestScore,
		Average:                   average,
		CheckpointRepairWeight:    optimizeSearchWeightedScenarioMentions(expectedImprovements, scenarioIDs, checkpointRepairWeights),
		CheckpointRepairCoverage:  optimizeSearchCountScenarioMentions(expectedImprovements, checkpointScenarioIDs),
		ParentCount:               len(candidates),
		PriorityImprovementWeight: optimizeSearchWeightedScenarioMentions(expectedImprovements, scenarioIDs, scenarioWeights),
		ImprovementCoverage:       optimizeSearchCountScenarioMentions(expectedImprovements, scenarioIDs),
		ImprovementDiversity:      len(uniqueStrings(expectedImprovements)),
		StrengthCount:             len(uniqueStrings(preservedStrengths)),
		PriorityRiskPenalty:       optimizeSearchWeightedScenarioMentions(riskNotes, scenarioIDs, scenarioWeights),
		RiskPenalty:               len(riskNotes),
		TotalCostUsd:              totalCostUsd,
		TotalDurationMs:           totalDurationMs,
	}
}

func optimizeSearchMergeScenarioPriorityWeights(frontierCandidates []map[string]any, scenarioIDs []string, feedbackCandidates []map[string]any) map[string]float64 {
	bonuses := optimizeSearchMergeCheckpointFeedbackBonuses(feedbackCandidates, scenarioIDs)
	weights := map[string]float64{}
	for _, scenarioID := range scenarioIDs {
		scores := []float64{}
		for _, candidate := range frontierCandidates {
			score := optimizeSearchHeldOutScoreForCandidate(candidate, scenarioID)
			if !math.IsInf(score, -1) {
				scores = append(scores, score)
			}
		}
		if len(scores) == 0 {
			weights[scenarioID] = 1 + bonuses[scenarioID]
			continue
		}
		total := 0.0
		for _, score := range scores {
			total += score
		}
		weights[scenarioID] = math.Max(1, 100-(total/float64(len(scores)))) + bonuses[scenarioID]
	}
	return weights
}

func optimizeSearchMergeCheckpointRepairWeights(feedbackCandidates []map[string]any, scenarioIDs []string) map[string]float64 {
	selectedScenarioIDs := map[string]struct{}{}
	weights := map[string]float64{}
	for _, scenarioID := range scenarioIDs {
		selectedScenarioIDs[scenarioID] = struct{}{}
		weights[scenarioID] = 0
	}
	for _, candidate := range feedbackCandidates {
		for _, entry := range optimizeSearchScopedCheckpointFeedbackEntries(candidate) {
			severity := optimizeSearchMergeCheckpointReasonSeverity(entry)
			for _, scenarioID := range stringSliceOrEmptyRuntime(entry["scenarioIds"]) {
				if _, ok := selectedScenarioIDs[scenarioID]; ok {
					weights[scenarioID] += severity
				}
			}
		}
	}
	return weights
}

func optimizeSearchMergeCheckpointFeedbackBonuses(feedbackCandidates []map[string]any, scenarioIDs []string) map[string]float64 {
	selectedScenarioIDs := map[string]struct{}{}
	bonuses := map[string]float64{}
	for _, scenarioID := range scenarioIDs {
		selectedScenarioIDs[scenarioID] = struct{}{}
		bonuses[scenarioID] = 0
	}
	for _, candidate := range feedbackCandidates {
		for _, entry := range optimizeSearchScopedCheckpointFeedbackEntries(candidate) {
			bonus := float64(max(1, len(stringSliceOrEmptyRuntime(entry["feedbackMessages"]))) * 100)
			for _, scenarioID := range stringSliceOrEmptyRuntime(entry["scenarioIds"]) {
				if _, ok := selectedScenarioIDs[scenarioID]; ok {
					bonuses[scenarioID] += bonus
				}
			}
		}
	}
	return bonuses
}

func optimizeSearchScopedCheckpointFeedbackEntries(candidate map[string]any) []map[string]any {
	entries := []map[string]any{}
	for _, rawEntry := range arrayOrEmpty(candidate["checkpointFeedback"]) {
		entry := asMap(rawEntry)
		if len(stringSliceOrEmptyRuntime(entry["scenarioIds"])) == 0 {
			continue
		}
		entries = append(entries, entry)
	}
	return entries
}

func optimizeSearchMergeCheckpointReasonSeverity(entry map[string]any) float64 {
	severity := 1.0
	for _, reason := range stringSliceOrEmptyRuntime(entry["rejectionReasons"]) {
		switch {
		case strings.HasPrefix(reason, "full_gate:"):
			if severity < 3 {
				severity = 3
			}
		case strings.HasSuffix(reason, ":blocker"):
			if severity < 3 {
				severity = 3
			}
		case strings.HasSuffix(reason, ":concern"):
			if severity < 2 {
				severity = 2
			}
		}
	}
	return severity
}

func optimizeSearchMergeFrontierBestScores(frontierCandidates []map[string]any, scenarioIDs []string) map[string]float64 {
	scores := map[string]float64{}
	for _, scenarioID := range scenarioIDs {
		best := math.Inf(-1)
		for _, candidate := range frontierCandidates {
			score := optimizeSearchHeldOutScoreForCandidate(candidate, scenarioID)
			if score > best {
				best = score
			}
		}
		scores[scenarioID] = best
	}
	return scores
}

func optimizeSearchHeldOutScoreForCandidate(candidate map[string]any, scenarioID string) float64 {
	for _, rawEntry := range arrayOrEmpty(candidate["heldOutEntries"]) {
		entry := asMap(rawEntry)
		if stringOrEmpty(entry["scenarioId"]) != scenarioID {
			continue
		}
		if score, ok := toFloat(entry["score"]); ok {
			return score
		}
		return math.Inf(-1)
	}
	return math.Inf(-1)
}

func optimizeSearchCountScenarioMentions(items []string, scenarioIDs []string) int {
	count := 0
	for _, scenarioID := range scenarioIDs {
		scenarioToken := strings.ToLower(strings.TrimSpace(scenarioID))
		if scenarioToken == "" {
			continue
		}
		for _, item := range items {
			if strings.Contains(strings.ToLower(item), scenarioToken) {
				count++
				break
			}
		}
	}
	return count
}

func optimizeSearchWeightedScenarioMentions(items []string, scenarioIDs []string, weights map[string]float64) float64 {
	total := 0.0
	for _, scenarioID := range scenarioIDs {
		scenarioToken := strings.ToLower(strings.TrimSpace(scenarioID))
		if scenarioToken == "" {
			continue
		}
		for _, item := range items {
			if strings.Contains(strings.ToLower(item), scenarioToken) {
				total += weights[scenarioID]
				break
			}
		}
	}
	return total
}

func optimizeSearchScenarioSignalMap(packet map[string]any, feedbackSignals []string) map[string]map[string]any {
	signals := map[string]map[string]any{}
	report := asMap(asMap(packet["optimizeInput"])["report"])
	for _, bucket := range []string{"regressed", "noisy", "improved", "unchanged"} {
		for _, rawItem := range arrayOrEmpty(report[bucket]) {
			item := asMap(rawItem)
			scenarioID := firstNonEmpty(stringOrEmpty(rawItem), stringOrEmpty(item["scenarioId"]))
			if scenarioID == "" {
				continue
			}
			entry := signals[scenarioID]
			if entry == nil {
				entry = map[string]any{
					"scenarioId": scenarioID,
					"buckets":    []string{},
					"feedback":   []string{},
				}
			}
			entry["buckets"] = append(stringSliceOrEmptyRuntime(entry["buckets"]), bucket)
			if reason := stringOrEmpty(item["reason"]); reason != "" {
				entry["feedback"] = append(stringSliceOrEmptyRuntime(entry["feedback"]), reason)
			}
			signals[scenarioID] = entry
		}
	}
	for _, rawScenarioID := range arrayOrEmpty(asMap(packet["scenarioSets"])["trainScenarioSet"]) {
		scenarioID := strings.TrimSpace(stringOrEmpty(rawScenarioID))
		if scenarioID == "" {
			continue
		}
		entry := signals[scenarioID]
		if entry == nil {
			entry = map[string]any{
				"scenarioId": scenarioID,
				"buckets":    []string{},
				"feedback":   []string{},
			}
		}
		for _, feedback := range feedbackSignals {
			if strings.Contains(feedback, scenarioID) {
				entry["feedback"] = append(stringSliceOrEmptyRuntime(entry["feedback"]), feedback)
			}
		}
		entry["buckets"] = uniqueStrings(stringSliceOrEmptyRuntime(entry["buckets"]))
		entry["feedback"] = uniqueStrings(stringSliceOrEmptyRuntime(entry["feedback"]))
		signals[scenarioID] = entry
	}
	return signals
}

func optimizeSearchCheckpointPriorityForScenario(candidate map[string]any, scenarioID string) int {
	total := 0
	for _, rawEntry := range arrayOrEmpty(candidate["checkpointFeedback"]) {
		entry := asMap(rawEntry)
		matchesScenario := false
		for _, scopedScenarioID := range stringSliceOrEmptyRuntime(entry["scenarioIds"]) {
			if scopedScenarioID == scenarioID {
				matchesScenario = true
				break
			}
		}
		if !matchesScenario {
			continue
		}
		severityWeight := 1
		switch stringOrEmpty(entry["severity"]) {
		case "blocker":
			severityWeight = 100
		case "concern":
			severityWeight = 10
		}
		total += severityWeight + max(1, len(stringSliceOrEmptyRuntime(entry["feedbackMessages"])))
	}
	return total
}

func optimizeSearchBuildReflectionBatch(packet map[string]any, parentCandidate map[string]any) []map[string]any {
	scenarioIDs := []string{}
	for _, rawScenarioID := range arrayOrEmpty(asMap(packet["scenarioSets"])["trainScenarioSet"]) {
		if scenarioID := strings.TrimSpace(stringOrEmpty(rawScenarioID)); scenarioID != "" {
			scenarioIDs = append(scenarioIDs, scenarioID)
		}
	}
	if len(scenarioIDs) == 0 {
		return []map[string]any{}
	}
	feedbackSignals := optimizeSearchFeedbackSignals(packet)
	signalMap := optimizeSearchScenarioSignalMap(packet, feedbackSignals)
	sort.SliceStable(scenarioIDs, func(i, j int) bool {
		leftID := scenarioIDs[i]
		rightID := scenarioIDs[j]
		leftCheckpoint := optimizeSearchCheckpointPriorityForScenario(parentCandidate, leftID)
		rightCheckpoint := optimizeSearchCheckpointPriorityForScenario(parentCandidate, rightID)
		if leftCheckpoint != rightCheckpoint {
			return leftCheckpoint > rightCheckpoint
		}
		leftScore := optimizeSearchHeldOutScoreForCandidate(parentCandidate, leftID)
		rightScore := optimizeSearchHeldOutScoreForCandidate(parentCandidate, rightID)
		leftHasScore := !math.IsInf(leftScore, -1)
		rightHasScore := !math.IsInf(rightScore, -1)
		switch {
		case leftHasScore && rightHasScore && leftScore != rightScore:
			return leftScore < rightScore
		case leftHasScore && !rightHasScore:
			return true
		case !leftHasScore && rightHasScore:
			return false
		default:
			return leftID < rightID
		}
	})
	limit := atLeastOne(int(numberOrDefault(asMap(packet["mutationConfig"])["trainScenarioLimit"], 1)))
	if len(scenarioIDs) > limit {
		scenarioIDs = scenarioIDs[:limit]
	}
	batch := make([]map[string]any, 0, len(scenarioIDs))
	for _, scenarioID := range scenarioIDs {
		entry := signalMap[scenarioID]
		if entry == nil {
			entry = map[string]any{
				"scenarioId": scenarioID,
				"buckets":    []string{},
				"feedback":   []string{},
			}
		}
		feedback := stringSliceOrEmptyRuntime(entry["feedback"])
		if len(feedback) > 3 {
			feedback = feedback[:3]
		}
		batch = append(batch, map[string]any{
			"scenarioId": scenarioID,
			"buckets":    stringSliceToAny(stringSliceOrEmptyRuntime(entry["buckets"])),
			"feedback":   stringSliceToAny(feedback),
		})
	}
	return batch
}

func optimizeSearchFilterCheckpointFeedbackForReflectionBatch(checkpointFeedback []any, reflectionBatch []map[string]any) []any {
	if len(checkpointFeedback) == 0 {
		return []any{}
	}
	selectedScenarioIDs := map[string]struct{}{}
	for _, entry := range reflectionBatch {
		if scenarioID := strings.TrimSpace(stringOrEmpty(entry["scenarioId"])); scenarioID != "" {
			selectedScenarioIDs[scenarioID] = struct{}{}
		}
	}
	if len(selectedScenarioIDs) == 0 {
		return checkpointFeedback
	}
	filtered := []any{}
	for _, rawEntry := range checkpointFeedback {
		entry := asMap(rawEntry)
		scopedScenarioIDs := stringSliceOrEmptyRuntime(entry["scenarioIds"])
		if len(scopedScenarioIDs) == 0 {
			filtered = append(filtered, rawEntry)
			continue
		}
		for _, scenarioID := range scopedScenarioIDs {
			if _, ok := selectedScenarioIDs[scenarioID]; ok {
				filtered = append(filtered, rawEntry)
				break
			}
		}
	}
	return filtered
}

func optimizeSearchCombinationIndexes(length int, size int) [][]int {
	results := [][]int{}
	if size <= 0 || size > length {
		return results
	}
	var walk func(start int, prefix []int)
	walk = func(start int, prefix []int) {
		if len(prefix) == size {
			results = append(results, append([]int{}, prefix...))
			return
		}
		for index := start; index <= length-(size-len(prefix)); index++ {
			walk(index+1, append(prefix, index))
		}
	}
	walk(0, []int{})
	return results
}

func compareFloat(left float64, right float64) int {
	switch {
	case left > right:
		return 1
	case left < right:
		return -1
	default:
		return 0
	}
}

func compareInt(left int, right int) int {
	switch {
	case left > right:
		return 1
	case left < right:
		return -1
	default:
		return 0
	}
}

func optimizeSearchMutationPrompt(packet map[string]any, parentCandidate map[string]any) string {
	targetPath := stringOrEmpty(asMap(parentCandidate["targetFile"])["path"])
	if targetPath == "" {
		targetPath = stringOrEmpty(asMap(packet["targetFile"])["path"])
	}
	currentPrompt := ""
	if targetPath != "" && fileExists(targetPath) {
		payload, err := os.ReadFile(targetPath)
		if err == nil {
			currentPrompt = string(payload)
		}
	}
	reflectionBatch := optimizeSearchBuildReflectionBatch(packet, parentCandidate)
	reflectionBatchJSON := "[]"
	if payload, err := json.MarshalIndent(reflectionBatch, "", "  "); err == nil {
		reflectionBatchJSON = string(payload)
	}
	checkpointFeedback := "[]"
	if includeCheckpointFeedback, _ := asMap(packet["mutationEvidencePolicy"])["includeCheckpointFeedback"].(bool); includeCheckpointFeedback {
		filteredEntries := optimizeSearchFilterCheckpointFeedbackForReflectionBatch(arrayOrEmpty(parentCandidate["checkpointFeedback"]), reflectionBatch)
		if len(filteredEntries) > 0 {
			if payload, err := json.MarshalIndent(filteredEntries, "", "  "); err == nil {
				checkpointFeedback = string(payload)
			}
		}
	}
	return strings.TrimSpace(fmt.Sprintf(`
Return one JSON object matching the schema.

Current prompt:
%s

Behavior objective:
%s

Reflection batch:
%s

Checkpoint feedback to repair:
%s
`, currentPrompt, stringOrEmpty(asMap(packet["objective"])["summary"]), reflectionBatchJSON, checkpointFeedback)) + "\n"
}

func optimizeSearchCollectMergeCheckpointFeedback(candidates []map[string]any, frontierIDs []string, scenarioIDs []string) []any {
	allowedScenarioIDs := map[string]struct{}{}
	for _, scenarioID := range scenarioIDs {
		if strings.TrimSpace(scenarioID) != "" {
			allowedScenarioIDs[scenarioID] = struct{}{}
		}
	}
	feedback := []any{}
	for _, candidateID := range frontierIDs {
		candidate := optimizeSearchCandidateByID(candidates, candidateID)
		if candidate == nil {
			continue
		}
		for _, rawEntry := range arrayOrEmpty(candidate["checkpointFeedback"]) {
			entry := asMap(rawEntry)
			entryScenarioIDs := stringSliceOrEmptyRuntime(entry["scenarioIds"])
			if len(allowedScenarioIDs) > 0 && len(entryScenarioIDs) > 0 {
				matchesScenario := false
				for _, scenarioID := range entryScenarioIDs {
					if _, ok := allowedScenarioIDs[scenarioID]; ok {
						matchesScenario = true
						break
					}
				}
				if !matchesScenario {
					continue
				}
			}
			enriched := map[string]any{}
			for key, value := range entry {
				enriched[key] = value
			}
			enriched["sourceCandidateId"] = candidateID
			feedback = append(feedback, enriched)
		}
	}
	return feedback
}

func optimizeSearchMergePrompt(packet map[string]any, parentCandidates []map[string]any, parentPrompts []string, backend string, scenarioIDs []string, mergeCheckpointFeedback []any) string {
	constraints := []string{}
	for _, rawConstraint := range arrayOrEmpty(asMap(packet["objective"])["constraints"]) {
		if constraint := strings.TrimSpace(stringOrEmpty(rawConstraint)); constraint != "" {
			constraints = append(constraints, constraint)
		}
	}
	mergeFeedback := []any{}
	if includeCheckpointFeedback, _ := asMap(packet["mutationEvidencePolicy"])["includeCheckpointFeedback"].(bool); includeCheckpointFeedback {
		mergeFeedback = append(mergeFeedback, mergeCheckpointFeedback...)
	}
	feedbackJSON := "[]"
	if payload, err := json.MarshalIndent(mergeFeedback, "", "  "); err == nil {
		feedbackJSON = string(payload)
	}
	sections := []string{
		"Return one JSON object matching the schema.",
		"",
		"# Merge context",
		fmt.Sprintf("- backend: %s", backend),
		fmt.Sprintf("- objective: %s", stringOrEmpty(asMap(packet["objective"])["summary"])),
		fmt.Sprintf("- parentCandidateIds: %s", strings.Join(optimizeSearchCandidateIDs(parentCandidates), ", ")),
		fmt.Sprintf("- targetFile: %s", stringOrEmpty(asMap(packet["targetFile"])["path"])),
		fmt.Sprintf("- heldOutScenarioSet: %s", strings.Join(scenarioIDs, ", ")),
		"",
		"# Guardrails",
		"- Output valid JSON matching the provided schema.",
		"- Synthesize one coherent prompt body instead of concatenating the parent prompts verbatim.",
		"- Preserve complementary strengths from the selected frontier parents when they do not conflict.",
		"- Do not weaken the stronger held-out behaviors already achieved by either parent.",
		"- Do not optimize for lower cost by merely making the prompt shorter.",
	}
	for _, constraint := range constraints {
		sections = append(sections, "- "+constraint)
	}
	sections = append(sections,
		"",
		"# Frontier checkpoint feedback",
		feedbackJSON,
	)
	for index, candidate := range parentCandidates {
		parentMetadata := map[string]any{
			"id":                   candidate["id"],
			"expectedImprovements": arrayOrEmpty(candidate["expectedImprovements"]),
			"preservedStrengths":   arrayOrEmpty(candidate["preservedStrengths"]),
			"riskNotes":            arrayOrEmpty(candidate["riskNotes"]),
		}
		parentJSON := "{}"
		if payload, err := json.MarshalIndent(parentMetadata, "", "  "); err == nil {
			parentJSON = string(payload)
		}
		parentPrompt := ""
		if index < len(parentPrompts) {
			parentPrompt = strings.TrimSpace(parentPrompts[index])
		}
		sections = append(sections,
			"",
			fmt.Sprintf("# Parent %s", stringOrEmpty(candidate["id"])),
			parentJSON,
			"```md",
			parentPrompt,
			"```",
		)
	}
	sections = append(sections,
		"",
		"# Response shape",
		"- promptMarkdown: full revised prompt body",
		"- rationaleSummary: 1-2 sentence explanation of what changed and why",
		"- expectedImprovements: list of scenarios or failure modes this candidate should improve",
		"- preservedStrengths: list of strengths intentionally kept from the parents",
		"- riskNotes: list of residual risks that still need held-out validation",
	)
	return strings.Join(sections, "\n") + "\n"
}

func optimizeSearchPreferredCandidate(candidates []map[string]any, candidateIDs []string) map[string]any {
	if len(candidateIDs) == 0 {
		return nil
	}
	targetID := candidateIDs[0]
	for _, candidate := range candidates {
		if stringOrEmpty(candidate["id"]) == targetID {
			return candidate
		}
	}
	if len(candidates) == 0 {
		return nil
	}
	return candidates[0]
}

func optimizeSearchPrioritizeMutationCandidateIDs(candidates []map[string]any, candidateIDs []string, nextGenerationIndex int) []string {
	type prioritizedCandidate struct {
		id       string
		priority int
		index    int
	}
	prioritized := []prioritizedCandidate{}
	for index, candidateID := range candidateIDs {
		candidate := optimizeSearchCandidateByID(candidates, candidateID)
		if candidate == nil || !optimizeSearchCandidateCanSeedMutation(candidate, nextGenerationIndex) {
			continue
		}
		prioritized = append(prioritized, prioritizedCandidate{
			id:       candidateID,
			priority: optimizeSearchMutationRepairPriority(candidate),
			index:    index,
		})
	}
	sort.SliceStable(prioritized, func(i, j int) bool {
		if prioritized[i].priority != prioritized[j].priority {
			return prioritized[i].priority > prioritized[j].priority
		}
		return prioritized[i].index < prioritized[j].index
	})
	result := make([]string, 0, len(prioritized))
	for _, entry := range prioritized {
		result = append(result, entry.id)
	}
	return result
}

func optimizeSearchCandidateCanSeedMutation(candidate map[string]any, nextGenerationIndex int) bool {
	outcome := asMap(candidate["promotionReviewOutcome"])
	if len(outcome) == 0 {
		return true
	}
	if admissible, _ := outcome["admissible"].(bool); admissible {
		return true
	}
	reviewedAtGeneration := int(numberOrDefault(firstNonNil(outcome["reviewedAtGeneration"], candidate["generationIndex"]), 0))
	return nextGenerationIndex <= reviewedAtGeneration+optimizeSearchMutationRepairGenerationBudget(outcome)
}

func optimizeSearchMutationRepairPriority(candidate map[string]any) int {
	outcome := asMap(candidate["promotionReviewOutcome"])
	if len(outcome) == 0 {
		return 0
	}
	if admissible, _ := outcome["admissible"].(bool); admissible {
		return 0
	}
	if optimizeSearchReviewOutcomeSeverity(outcome) == "blocker" {
		return 2
	}
	return 1
}

func optimizeSearchMutationRepairGenerationBudget(outcome map[string]any) int {
	if len(outcome) == 0 {
		return math.MaxInt
	}
	if admissible, _ := outcome["admissible"].(bool); admissible {
		return math.MaxInt
	}
	if optimizeSearchReviewOutcomeSeverity(outcome) == "blocker" {
		return 0
	}
	return 1
}

func optimizeSearchReviewOutcomeSeverity(outcome map[string]any) string {
	severity := "pass"
	severityRank := map[string]int{
		"pass":    0,
		"concern": 1,
		"blocker": 2,
	}
	for _, rawVariant := range arrayOrEmpty(outcome["variants"]) {
		variant := asMap(rawVariant)
		verdict := firstNonEmpty(stringOrEmpty(variant["verdict"]), "pass")
		if severityRank[verdict] > severityRank[severity] {
			severity = verdict
		}
	}
	if admissible, _ := outcome["admissible"].(bool); !admissible && severity == "pass" {
		return "concern"
	}
	return severity
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
		for _, key := range []string{"expectedImprovements", "preservedStrengths", "riskNotes", "checkpointFeedback", "artifacts", "evaluationArtifacts"} {
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

func atLeastOne(value int) int {
	if value < 1 {
		return 1
	}
	return value
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
