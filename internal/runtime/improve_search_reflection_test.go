package runtime

import "testing"

// Regression: improveSearchScenarioSignalMap accumulates buckets/feedback into in-memory []string
// values and reads them back through stringSliceOrEmptyRuntime. Before the []string fix, arrayOrEmpty
// only matched []any, so the just-written slices read back empty and the reflection batch silently
// dropped every per-scenario bucket and feedback message before it could reach the mutation prompt.
func TestReflectionBatchDeliversScenarioFeedback(t *testing.T) {
	scenarioID := "execution-cautilus-no-input-claim-discovery-status"
	packet := map[string]any{
		"scenarioSets": map[string]any{
			"trainScenarioSet": []any{scenarioID},
		},
		"mutationConfig": map[string]any{"trainScenarioLimit": float64(1)},
		"improveInput": map[string]any{
			"report": map[string]any{
				"regressed": []any{scenarioID},
				"humanReviewFindings": []any{
					map[string]any{"message": "Held-out scenario " + scenarioID + " regressed: it now runs the wrong command."},
					map[string]any{"message": "Required behavior to restore for " + scenarioID + ": run the read-only status and hold."},
				},
			},
		},
	}

	batch := improveSearchBuildReflectionBatch(packet, map[string]any{"id": "seed"})
	if len(batch) != 1 {
		t.Fatalf("expected one reflection entry, got %d", len(batch))
	}
	entry := batch[0]
	if got := stringOrEmpty(entry["scenarioId"]); got != scenarioID {
		t.Fatalf("unexpected scenarioId %q", got)
	}
	buckets := stringSliceOrEmptyRuntime(entry["buckets"])
	if len(buckets) == 0 || buckets[0] != "regressed" {
		t.Fatalf("expected regressed bucket, got %v", buckets)
	}
	feedback := stringSliceOrEmptyRuntime(entry["feedback"])
	if len(feedback) < 2 {
		t.Fatalf("expected the scenario-tagged findings to reach the reflection batch, got %d: %v", len(feedback), feedback)
	}
}

// Direct guard on the helper that caused the drop: a freshly-built Go []string must read back intact.
func TestStringSliceOrEmptyRuntimeHandlesGoStringSlice(t *testing.T) {
	got := stringSliceOrEmptyRuntime([]string{"a", "", "b"})
	if len(got) != 2 || got[0] != "a" || got[1] != "b" {
		t.Fatalf("expected [a b], got %v", got)
	}
}
