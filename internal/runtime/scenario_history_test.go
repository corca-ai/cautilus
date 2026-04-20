package runtime

import (
	"os"
	"path/filepath"
	"reflect"
	"testing"

	"github.com/corca-ai/cautilus/internal/contracts"
)

func testScenarioProfile() map[string]any {
	return map[string]any{
		"schemaVersion": contracts.ScenarioProfileSchema,
		"profileId":     "default-train",
		"historyPolicy": map[string]any{
			"maxGraduationInterval": 5,
			"recentResultsLimit":    12,
		},
		"scenarios": []any{
			map[string]any{"scenarioId": "probe-a", "split": "train", "cadence": "graduated", "cohort": "probe"},
			map[string]any{"scenarioId": "control-a", "split": "train", "cadence": "always", "cohort": "control"},
			map[string]any{"scenarioId": "held-out-a", "split": "test", "cadence": "always", "cohort": "held-out"},
		},
	}
}

func TestSelectProfileScenarioIDsReturnsAllTrainScenariosWithoutHistory(t *testing.T) {
	profile := testScenarioProfile()
	selected, err := SelectProfileScenarioIDs(profile, "train", nil, false)
	if err != nil {
		t.Fatalf("SelectProfileScenarioIDs returned error: %v", err)
	}
	if !reflect.DeepEqual(selected, []string{"probe-a", "control-a"}) {
		t.Fatalf("unexpected selected scenarios: %#v", selected)
	}
}

func TestUpdateScenarioHistoryGraduatesPerfectTrainScenarios(t *testing.T) {
	profile := testScenarioProfile()
	initialHistory, err := CreateEmptyScenarioHistory(profile)
	if err != nil {
		t.Fatalf("CreateEmptyScenarioHistory returned error: %v", err)
	}
	first, err := UpdateScenarioHistory(
		profile,
		initialHistory,
		[]string{"probe-a", "control-a"},
		[]any{
			map[string]any{"scenarioId": "probe-a", "status": "passed", "overallScore": 100, "passRate": 1},
			map[string]any{"scenarioId": "control-a", "status": "passed", "overallScore": 100, "passRate": 1},
		},
		"2026-04-09T21:00:00.000Z",
		"train",
		false,
	)
	if err != nil {
		t.Fatalf("UpdateScenarioHistory returned error: %v", err)
	}
	if first["trainRunCount"] != 1 {
		t.Fatalf("unexpected trainRunCount after first update: %#v", first["trainRunCount"])
	}
	if asMap(asMap(first["scenarioStats"])["probe-a"])["graduationInterval"] != 2 {
		t.Fatalf("unexpected graduation interval: %#v", asMap(first["scenarioStats"]))
	}
	selected, err := SelectProfileScenarioIDs(profile, "train", first, false)
	if err != nil {
		t.Fatalf("SelectProfileScenarioIDs returned error: %v", err)
	}
	if !reflect.DeepEqual(selected, []string{"control-a"}) {
		t.Fatalf("unexpected selected scenarios after graduation: %#v", selected)
	}
	second, err := UpdateScenarioHistory(
		profile,
		first,
		[]string{"control-a"},
		[]any{
			map[string]any{"scenarioId": "control-a", "status": "passed", "overallScore": 100, "passRate": 1},
		},
		"2026-04-09T21:10:00.000Z",
		"train",
		false,
	)
	if err != nil {
		t.Fatalf("UpdateScenarioHistory returned error: %v", err)
	}
	if second["trainRunCount"] != 2 {
		t.Fatalf("unexpected trainRunCount after second update: %#v", second["trainRunCount"])
	}
	selected, err = SelectProfileScenarioIDs(profile, "train", second, false)
	if err != nil {
		t.Fatalf("SelectProfileScenarioIDs returned error: %v", err)
	}
	if !reflect.DeepEqual(selected, []string{"probe-a", "control-a"}) {
		t.Fatalf("unexpected selected scenarios after second run: %#v", selected)
	}
}

func TestUpdateScenarioHistoryResetsCadenceAfterImperfectResult(t *testing.T) {
	profile := testScenarioProfile()
	initialHistory, err := CreateEmptyScenarioHistory(profile)
	if err != nil {
		t.Fatalf("CreateEmptyScenarioHistory returned error: %v", err)
	}
	history, err := UpdateScenarioHistory(
		profile,
		initialHistory,
		[]string{"probe-a"},
		[]any{
			map[string]any{"scenarioId": "probe-a", "status": "passed", "overallScore": 100, "passRate": 1},
		},
		"2026-04-09T21:00:00.000Z",
		"train",
		false,
	)
	if err != nil {
		t.Fatalf("UpdateScenarioHistory returned error: %v", err)
	}
	reset, err := UpdateScenarioHistory(
		profile,
		history,
		[]string{"probe-a"},
		[]any{
			map[string]any{"scenarioId": "probe-a", "status": "failed", "overallScore": 80, "passRate": 0},
		},
		"2026-04-09T21:05:00.000Z",
		"train",
		false,
	)
	if err != nil {
		t.Fatalf("UpdateScenarioHistory returned error: %v", err)
	}
	if asMap(asMap(reset["scenarioStats"])["probe-a"])["graduationInterval"] != 1 {
		t.Fatalf("unexpected reset cadence: %#v", asMap(reset["scenarioStats"])["probe-a"])
	}
}

func TestUpdateScenarioHistoryPreservesTelemetry(t *testing.T) {
	profile := testScenarioProfile()
	initialHistory, err := CreateEmptyScenarioHistory(profile)
	if err != nil {
		t.Fatalf("CreateEmptyScenarioHistory returned error: %v", err)
	}
	history, err := UpdateScenarioHistory(
		profile,
		initialHistory,
		[]string{"probe-a"},
		[]any{
			map[string]any{
				"scenarioId":   "probe-a",
				"status":       "passed",
				"overallScore": 100,
				"passRate":     1,
				"durationMs":   250,
				"telemetry": map[string]any{
					"provider":     "openai",
					"model":        "gpt-5.4",
					"total_tokens": 320,
					"cost_usd":     0.024,
				},
			},
		},
		"2026-04-09T21:00:00.000Z",
		"train",
		false,
	)
	if err != nil {
		t.Fatalf("UpdateScenarioHistory returned error: %v", err)
	}
	recent := arrayOrEmpty(asMap(asMap(history["scenarioStats"])["probe-a"])["recentTrainResults"])
	record := asMap(recent[0])
	if record["durationMs"] != float64(250) {
		t.Fatalf("unexpected duration: %#v", record)
	}
	telemetry := asMap(record["telemetry"])
	if totalTokens, ok := toFloat(telemetry["total_tokens"]); !ok || totalTokens != 320 {
		t.Fatalf("unexpected telemetry total_tokens: %#v", telemetry)
	}
	if cost, ok := toFloat(telemetry["cost_usd"]); !ok || cost != 0.024 {
		t.Fatalf("unexpected telemetry: %#v", telemetry)
	}
}

func TestUpdateScenarioHistoryFullCheckLeavesHistoryUntouched(t *testing.T) {
	profile := testScenarioProfile()
	initialHistory, err := CreateEmptyScenarioHistory(profile)
	if err != nil {
		t.Fatalf("CreateEmptyScenarioHistory returned error: %v", err)
	}
	selected, err := SelectProfileScenarioIDs(profile, "train", initialHistory, true)
	if err != nil {
		t.Fatalf("SelectProfileScenarioIDs returned error: %v", err)
	}
	if !reflect.DeepEqual(selected, []string{"probe-a", "control-a"}) {
		t.Fatalf("unexpected full-check selection: %#v", selected)
	}
	updated, err := UpdateScenarioHistory(
		profile,
		initialHistory,
		selected,
		[]any{
			map[string]any{"scenarioId": "probe-a", "status": "passed", "overallScore": 100, "passRate": 1},
		},
		"2026-04-09T21:00:00.000Z",
		"train",
		true,
	)
	if err != nil {
		t.Fatalf("UpdateScenarioHistory returned error: %v", err)
	}
	if trainRunCount, ok := toFloat(updated["trainRunCount"]); !ok || trainRunCount != 0 || len(arrayOrEmpty(updated["recentRuns"])) != 0 || len(asMap(updated["scenarioStats"])) != 0 {
		t.Fatalf("expected untouched history, got %#v", updated)
	}
}

func TestScenarioHistoryRoundTripAndReset(t *testing.T) {
	profile := testScenarioProfile()
	root := t.TempDir()
	historyPath := filepath.Join(root, "history.json")
	initialHistory, err := CreateEmptyScenarioHistory(profile)
	if err != nil {
		t.Fatalf("CreateEmptyScenarioHistory returned error: %v", err)
	}
	history, err := UpdateScenarioHistory(
		profile,
		initialHistory,
		[]string{"control-a"},
		[]any{
			map[string]any{"scenarioId": "control-a", "status": "passed", "overallScore": 100, "passRate": 1},
		},
		"2026-04-09T21:00:00.000Z",
		"train",
		false,
	)
	if err != nil {
		t.Fatalf("UpdateScenarioHistory returned error: %v", err)
	}
	if err := SaveScenarioHistory(historyPath, history); err != nil {
		t.Fatalf("SaveScenarioHistory returned error: %v", err)
	}
	loaded := LoadScenarioHistory(historyPath, profile)
	if loaded["schemaVersion"] != contracts.ScenarioHistorySchema || stringOrEmpty(loaded["profileId"]) != "default-train" {
		t.Fatalf("unexpected loaded history metadata: %#v", loaded)
	}
	if trainRunCount, ok := toFloat(loaded["trainRunCount"]); !ok || trainRunCount != 1 {
		t.Fatalf("unexpected loaded trainRunCount: %#v", loaded["trainRunCount"])
	}
	recentRuns := arrayOrEmpty(loaded["recentRuns"])
	if len(recentRuns) != 1 {
		t.Fatalf("unexpected loaded recentRuns: %#v", loaded["recentRuns"])
	}
	recentRun := asMap(recentRuns[0])
	if runIndex, ok := toFloat(recentRun["runIndex"]); !ok || runIndex != 1 {
		t.Fatalf("unexpected loaded recent run: %#v", recentRun)
	}
	if err := os.WriteFile(historyPath, []byte("{\"schemaVersion\":\"wrong\"}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	reset, err := CreateEmptyScenarioHistory(profile)
	if err != nil {
		t.Fatalf("CreateEmptyScenarioHistory returned error: %v", err)
	}
	if !reflect.DeepEqual(LoadScenarioHistory(historyPath, profile), reset) {
		t.Fatalf("expected reset history after invalid file")
	}
}

func TestScenarioBaselineCacheKeyStableAcrossIDOrder(t *testing.T) {
	profile := testScenarioProfile()
	first, err := BuildScenarioBaselineCacheKey(profile, []string{"control-a", "probe-a"}, "abc123", 5)
	if err != nil {
		t.Fatalf("BuildScenarioBaselineCacheKey returned error: %v", err)
	}
	reordered, err := BuildScenarioBaselineCacheKey(profile, []string{"probe-a", "control-a"}, "abc123", 5)
	if err != nil {
		t.Fatalf("BuildScenarioBaselineCacheKey returned error: %v", err)
	}
	if !reflect.DeepEqual(first, reordered) {
		t.Fatalf("expected stable cache key, got %#v vs %#v", first, reordered)
	}
	changedProfile := testScenarioProfile()
	asMap(arrayOrEmpty(changedProfile["scenarios"])[0])["cadence"] = "always"
	changed, err := BuildScenarioBaselineCacheKey(changedProfile, []string{"probe-a", "control-a"}, "abc123", 5)
	if err != nil {
		t.Fatalf("BuildScenarioBaselineCacheKey returned error: %v", err)
	}
	if asMap(changed)["scenarioFingerprint"] == asMap(first)["scenarioFingerprint"] {
		t.Fatalf("expected fingerprint change after scenario definition change: %#v", changed)
	}
}

func TestCreateScenarioBaselineCacheSeed(t *testing.T) {
	profile := testScenarioProfile()
	seed, err := CreateScenarioBaselineCacheSeed(profile, []string{"probe-a"}, "abc123", 3, "origin/main@abc123", "2026-04-10T00:00:00.000Z")
	if err != nil {
		t.Fatalf("CreateScenarioBaselineCacheSeed returned error: %v", err)
	}
	if seed["schemaVersion"] != contracts.ScenarioBaselineCacheSchema {
		t.Fatalf("unexpected schemaVersion: %#v", seed["schemaVersion"])
	}
	cacheKey := asMap(seed["cacheKey"])
	if cacheKey["profileId"] != "default-train" {
		t.Fatalf("unexpected profileId: %#v", cacheKey)
	}
	if !reflect.DeepEqual(arrayOrEmpty(cacheKey["scenarioIds"]), []any{"probe-a"}) {
		t.Fatalf("unexpected scenarioIds: %#v", cacheKey["scenarioIds"])
	}
	if !reflect.DeepEqual(arrayOrEmpty(seed["results"]), []any{}) {
		t.Fatalf("unexpected seed results: %#v", seed["results"])
	}
}
