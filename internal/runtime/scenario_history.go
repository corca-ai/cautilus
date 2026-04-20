package runtime

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"sort"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

const (
	defaultScenarioHistoryMaxGraduationInterval = 5
	defaultScenarioHistoryRecentResultsLimit    = 12
)

type scenarioHistoryPolicy struct {
	MaxGraduationInterval int
	RecentResultsLimit    int
}

func LoadScenarioProfile(profilePath string) (map[string]any, error) {
	profile, err := readJSONFile(filepath.Clean(profilePath))
	if err != nil {
		return nil, err
	}
	if err := validateScenarioProfile(profile, profilePath); err != nil {
		return nil, err
	}
	return profile, nil
}

func CreateEmptyScenarioHistory(profile map[string]any) (map[string]any, error) {
	if err := validateScenarioProfile(profile, "profile"); err != nil {
		return nil, err
	}
	return map[string]any{
		"schemaVersion": contracts.ScenarioHistorySchema,
		"profileId":     stringOrEmpty(profile["profileId"]),
		"trainRunCount": 0,
		"scenarioStats": map[string]any{},
		"recentRuns":    []any{},
	}, nil
}

func LoadScenarioHistory(historyPath string, profile map[string]any) map[string]any {
	empty, err := CreateEmptyScenarioHistory(profile)
	if err != nil {
		return map[string]any{}
	}
	parsed, err := readJSONFile(historyPath)
	if err != nil {
		return empty
	}
	if parsed["schemaVersion"] != contracts.ScenarioHistorySchema || stringOrEmpty(parsed["profileId"]) != stringOrEmpty(profile["profileId"]) {
		return empty
	}
	return parsed
}

func SaveScenarioHistory(historyPath string, history map[string]any) error {
	if err := os.MkdirAll(filepath.Dir(historyPath), 0o755); err != nil {
		return err
	}
	return writeJSONFile(historyPath, history)
}

func SelectProfileScenarioIDs(profile map[string]any, split string, history map[string]any, fullCheck bool) ([]string, error) {
	if err := validateScenarioProfile(profile, "profile"); err != nil {
		return nil, err
	}
	scenarios, err := profileScenarios(profile, "profile")
	if err != nil {
		return nil, err
	}
	selected := make([]string, 0, len(scenarios))
	if split == "" {
		split = "train"
	}
	if split != "train" || fullCheck {
		for _, scenario := range scenarios {
			if split == "all" || stringOrEmpty(scenario["split"]) == split {
				selected = append(selected, stringOrEmpty(scenario["scenarioId"]))
			}
		}
		return selected, nil
	}
	nextTrainRunIndex := 1 + intFromAnyRuntime(asMap(history)["trainRunCount"], 0)
	policy := resolveScenarioHistoryPolicy(profile)
	stats := asMap(asMap(history)["scenarioStats"])
	for _, scenario := range scenarios {
		if stringOrEmpty(scenario["split"]) != split {
			continue
		}
		cadence := stringOrEmpty(scenario["cadence"])
		if cadence == "always" {
			selected = append(selected, stringOrEmpty(scenario["scenarioId"]))
			continue
		}
		if scenarioDue(asMap(stats[stringOrEmpty(scenario["scenarioId"])]), nextTrainRunIndex, policy) {
			selected = append(selected, stringOrEmpty(scenario["scenarioId"]))
		}
	}
	return selected, nil
}

func BuildScenarioBaselineCacheKey(profile map[string]any, selectedScenarioIDs []string, baselineFingerprint string, cacheSampleCount int) (map[string]any, error) {
	if err := validateScenarioProfile(profile, "profile"); err != nil {
		return nil, err
	}
	if strings.TrimSpace(baselineFingerprint) == "" {
		return nil, fmt.Errorf("baselineFingerprint must be a non-empty string")
	}
	if cacheSampleCount <= 0 {
		return nil, fmt.Errorf("cacheSampleCount must be a positive integer")
	}
	normalizedIDs, err := normalizeSelectedScenarioIDs(profile, selectedScenarioIDs)
	if err != nil {
		return nil, err
	}
	scenarioMetadata, err := buildScenarioMetadataMap(profile)
	if err != nil {
		return nil, err
	}
	fingerprintEntries := make([]any, 0, len(normalizedIDs))
	for _, scenarioID := range normalizedIDs {
		fingerprintEntries = append(fingerprintEntries, scenarioMetadata[scenarioID])
	}
	payload, err := json.Marshal(fingerprintEntries)
	if err != nil {
		return nil, err
	}
	sum := sha256.Sum256(payload)
	return map[string]any{
		"baselineFingerprint": baselineFingerprint,
		"profileId":           stringOrEmpty(profile["profileId"]),
		"scenarioIds":         stringSliceToAnyRuntime(normalizedIDs),
		"scenarioFingerprint": hex.EncodeToString(sum[:]),
		"cacheSampleCount":    cacheSampleCount,
	}, nil
}

func CreateScenarioBaselineCacheSeed(profile map[string]any, selectedScenarioIDs []string, baselineFingerprint string, cacheSampleCount int, baselineRepoLabel string, createdAt string) (map[string]any, error) {
	if strings.TrimSpace(baselineRepoLabel) == "" {
		return nil, fmt.Errorf("baselineRepoLabel must be a non-empty string")
	}
	if _, err := time.Parse(time.RFC3339Nano, createdAt); err != nil {
		return nil, fmt.Errorf("createdAt must be a valid ISO timestamp")
	}
	cacheKey, err := BuildScenarioBaselineCacheKey(profile, selectedScenarioIDs, baselineFingerprint, cacheSampleCount)
	if err != nil {
		return nil, err
	}
	return map[string]any{
		"schemaVersion":     contracts.ScenarioBaselineCacheSchema,
		"cacheKey":          cacheKey,
		"createdAt":         createdAt,
		"baselineRepoLabel": baselineRepoLabel,
		"results":           []any{},
	}, nil
}

func UpdateScenarioHistory(profile map[string]any, history map[string]any, selectedScenarioIDs []string, candidateResults []any, timestamp string, split string, fullCheck bool) (map[string]any, error) {
	if err := validateScenarioProfile(profile, "profile"); err != nil {
		return nil, err
	}
	if _, err := time.Parse(time.RFC3339Nano, timestamp); err != nil {
		return nil, fmt.Errorf("timestamp must be a valid ISO timestamp")
	}
	nextHistory := history
	if len(nextHistory) == 0 {
		empty, err := CreateEmptyScenarioHistory(profile)
		if err != nil {
			return nil, err
		}
		nextHistory = empty
	} else {
		cloned, err := cloneJSON(history)
		if err != nil {
			return nil, err
		}
		nextHistory = cloned
	}
	if fullCheck {
		return nextHistory, nil
	}
	scenarios, err := profileScenarios(profile, "profile")
	if err != nil {
		return nil, err
	}
	trainScenarioIDs := map[string]struct{}{}
	for _, scenario := range scenarios {
		if stringOrEmpty(scenario["split"]) == "train" {
			trainScenarioIDs[stringOrEmpty(scenario["scenarioId"])] = struct{}{}
		}
	}
	selectedTrainScenarioIDs := make([]string, 0, len(selectedScenarioIDs))
	for _, scenarioID := range selectedScenarioIDs {
		if _, ok := trainScenarioIDs[scenarioID]; ok {
			selectedTrainScenarioIDs = append(selectedTrainScenarioIDs, scenarioID)
		}
	}
	if len(selectedTrainScenarioIDs) == 0 {
		return nextHistory, nil
	}
	policy := resolveScenarioHistoryPolicy(profile)
	resultsByID := map[string]map[string]any{}
	for index, rawResult := range candidateResults {
		normalized, err := normalizeScenarioResult(rawResult, fmt.Sprintf("candidateResults[%d]", index))
		if err != nil {
			return nil, err
		}
		resultsByID[stringOrEmpty(normalized["scenarioId"])] = normalized
	}
	trainRunCount := intFromAnyRuntime(nextHistory["trainRunCount"], 0) + 1
	nextHistory["trainRunCount"] = trainRunCount
	if _, ok := nextHistory["scenarioStats"].(map[string]any); !ok {
		nextHistory["scenarioStats"] = map[string]any{}
	}
	stats := asMap(nextHistory["scenarioStats"])
	for _, scenarioID := range selectedTrainScenarioIDs {
		nextStat, err := nextScenarioHistoryStat(asMap(stats[scenarioID]), resultsByID[scenarioID], trainRunCount, policy, timestamp)
		if err != nil {
			return nil, err
		}
		stats[scenarioID] = nextStat
	}
	nextHistory["scenarioStats"] = stats
	nextHistory["recentRuns"] = trimRecentRuns(
		append(arrayOrEmpty(nextHistory["recentRuns"]), map[string]any{
			"runIndex":            trainRunCount,
			"timestamp":           timestamp,
			"split":               split,
			"fullCheck":           false,
			"selectedScenarioIds": stringSliceToAnyRuntime(selectedTrainScenarioIDs),
		}),
		policy.RecentResultsLimit,
	)
	return nextHistory, nil
}

func validateScenarioProfile(profile map[string]any, label string) error {
	if len(profile) == 0 {
		return fmt.Errorf("%s must be an object", label)
	}
	if profile["schemaVersion"] != contracts.ScenarioProfileSchema {
		return fmt.Errorf("%s must use schemaVersion %s", label, contracts.ScenarioProfileSchema)
	}
	if _, err := normalizeNonEmptyString(profile["profileId"], label+".profileId"); err != nil {
		return err
	}
	_, err := profileScenarios(profile, label)
	return err
}

func profileScenarios(profile map[string]any, label string) ([]map[string]any, error) {
	rawScenarios, err := assertArray(profile["scenarios"], label+".scenarios")
	if err != nil {
		return nil, err
	}
	scenarios := make([]map[string]any, 0, len(rawScenarios))
	for index, rawScenario := range rawScenarios {
		scenario := asMap(rawScenario)
		if len(scenario) == 0 {
			return nil, fmt.Errorf("%s.scenarios[%d] must be an object", label, index)
		}
		if _, err := normalizeNonEmptyString(scenario["scenarioId"], fmt.Sprintf("%s.scenarios[%d].scenarioId", label, index)); err != nil {
			return nil, err
		}
		split, err := normalizeNonEmptyString(scenario["split"], fmt.Sprintf("%s.scenarios[%d].split", label, index))
		if err != nil {
			return nil, err
		}
		if !slices.Contains([]string{"train", "test", "all"}, split) {
			return nil, fmt.Errorf("%s.scenarios[%d].split must be train, test, or all", label, index)
		}
		cadence, err := normalizeNonEmptyString(scenario["cadence"], fmt.Sprintf("%s.scenarios[%d].cadence", label, index))
		if err != nil {
			return nil, err
		}
		if !slices.Contains([]string{"always", "graduated"}, cadence) {
			return nil, fmt.Errorf("%s.scenarios[%d].cadence must be always or graduated", label, index)
		}
		scenarios = append(scenarios, scenario)
	}
	return scenarios, nil
}

func buildScenarioMetadataMap(profile map[string]any) (map[string]map[string]any, error) {
	scenarios, err := profileScenarios(profile, "profile")
	if err != nil {
		return nil, err
	}
	result := make(map[string]map[string]any, len(scenarios))
	for _, scenario := range scenarios {
		result[stringOrEmpty(scenario["scenarioId"])] = scenario
	}
	return result, nil
}

func normalizeSelectedScenarioIDs(profile map[string]any, selectedScenarioIDs []string) ([]string, error) {
	scenarioMetadata, err := buildScenarioMetadataMap(profile)
	if err != nil {
		return nil, err
	}
	unique := uniqueStrings(selectedScenarioIDs)
	for index, scenarioID := range unique {
		if _, ok := scenarioMetadata[scenarioID]; !ok {
			return nil, fmt.Errorf("selectedScenarioIds[%d] is not present in profile.scenarios", index)
		}
	}
	sort.Strings(unique)
	return unique, nil
}

func resolveScenarioHistoryPolicy(profile map[string]any) scenarioHistoryPolicy {
	policy := scenarioHistoryPolicy{
		MaxGraduationInterval: defaultScenarioHistoryMaxGraduationInterval,
		RecentResultsLimit:    defaultScenarioHistoryRecentResultsLimit,
	}
	historyPolicy := asMap(profile["historyPolicy"])
	if value := intFromAnyRuntime(historyPolicy["maxGraduationInterval"], 0); value > 0 {
		policy.MaxGraduationInterval = value
	}
	if value := intFromAnyRuntime(historyPolicy["recentResultsLimit"], 0); value > 0 {
		policy.RecentResultsLimit = value
	}
	return policy
}

func scenarioGraduationInterval(stat map[string]any, policy scenarioHistoryPolicy) int {
	candidate := intFromAnyRuntime(stat["graduationInterval"], 1)
	if candidate < 1 {
		candidate = 1
	}
	if candidate > policy.MaxGraduationInterval {
		candidate = policy.MaxGraduationInterval
	}
	return candidate
}

func scenarioDue(stat map[string]any, nextTrainRunIndex int, policy scenarioHistoryPolicy) bool {
	lastRunIndex := intFromAnyRuntime(stat["lastTrainRunIndex"], 0)
	if lastRunIndex == 0 {
		return true
	}
	return nextTrainRunIndex-lastRunIndex >= scenarioGraduationInterval(stat, policy)
}

func nextScenarioHistoryStat(stat map[string]any, result map[string]any, runIndex int, policy scenarioHistoryPolicy, timestamp string) (map[string]any, error) {
	nextStat := stat
	if len(nextStat) == 0 {
		nextStat = map[string]any{
			"graduationInterval": 1,
			"recentTrainResults": []any{},
		}
	} else {
		cloned, err := cloneJSON(stat)
		if err != nil {
			return nil, err
		}
		nextStat = cloned
	}
	nextStat["lastTrainRunIndex"] = runIndex
	if scenarioResultPerfect(result) {
		nextStat["graduationInterval"] = minRuntime(policy.MaxGraduationInterval, scenarioGraduationInterval(nextStat, policy)+1)
	} else {
		nextStat["graduationInterval"] = 1
	}
	recentResult := map[string]any{
		"runIndex":     runIndex,
		"timestamp":    timestamp,
		"overallScore": nil,
		"passRate":     float64(0),
		"status":       "missing",
		"fullCheck":    false,
	}
	if len(result) > 0 {
		recentResult["overallScore"] = firstNonNilRuntime(result["overallScore"], nil)
		recentResult["passRate"] = numberOrDefaultRuntime(result["passRate"], 0)
		recentResult["status"] = firstNonEmpty(stringOrEmpty(result["status"]), "missing")
		if startedAt := stringOrEmpty(result["startedAt"]); startedAt != "" {
			recentResult["startedAt"] = startedAt
		}
		if completedAt := stringOrEmpty(result["completedAt"]); completedAt != "" {
			recentResult["completedAt"] = completedAt
		}
		if durationMs, ok := toFloat(result["durationMs"]); ok {
			recentResult["durationMs"] = durationMs
		}
		if telemetry := asMap(result["telemetry"]); len(telemetry) > 0 {
			recentResult["telemetry"] = telemetry
		}
	}
	nextStat["recentTrainResults"] = trimRecentRuns(
		append(arrayOrEmpty(nextStat["recentTrainResults"]), recentResult),
		policy.RecentResultsLimit,
	)
	return nextStat, nil
}

func scenarioResultPerfect(result map[string]any) bool {
	return numberOrDefaultRuntime(result["passRate"], 0) == 1 && numberOrDefaultRuntime(result["overallScore"], -1) == 100
}

func trimRecentRuns(values []any, limit int) []any {
	if limit <= 0 || len(values) <= limit {
		return values
	}
	return values[len(values)-limit:]
}

func intFromAnyRuntime(value any, fallback int) int {
	number, ok := toFloat(value)
	if !ok {
		return fallback
	}
	return int(number)
}

func numberOrDefaultRuntime(value any, fallback float64) float64 {
	number, ok := toFloat(value)
	if !ok {
		return fallback
	}
	return number
}

func stringSliceToAnyRuntime(values []string) []any {
	result := make([]any, 0, len(values))
	for _, value := range values {
		result = append(result, value)
	}
	return result
}

func firstNonNilRuntime(values ...any) any {
	for _, value := range values {
		if value != nil {
			return value
		}
	}
	return nil
}

func minRuntime(left int, right int) int {
	if left < right {
		return left
	}
	return right
}
