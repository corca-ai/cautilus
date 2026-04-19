package runtime

import (
	"strings"
	"testing"
)

func TestOptimizeSearchBuildReflectionBatchPrioritizesScenarioScopedCheckpointFeedback(t *testing.T) {
	packet := map[string]any{
		"mutationConfig": map[string]any{
			"trainScenarioLimit": 1,
		},
		"scenarioSets": map[string]any{
			"trainScenarioSet": []any{"operator-recovery", "operator-follow-up"},
		},
	}
	parentCandidate := map[string]any{
		"heldOutEntries": []any{
			map[string]any{"scenarioId": "operator-recovery", "score": 92},
			map[string]any{"scenarioId": "operator-follow-up", "score": 70},
		},
		"checkpointFeedback": []any{
			map[string]any{
				"scenarioIds":      []any{"operator-recovery"},
				"severity":         "concern",
				"feedbackMessages": []any{"Checklist candidate still leaves operator-recovery sequencing too implicit."},
			},
		},
	}

	batch := optimizeSearchBuildReflectionBatch(packet, parentCandidate)
	if len(batch) != 1 || stringOrEmpty(batch[0]["scenarioId"]) != "operator-recovery" {
		t.Fatalf("expected checkpointed scenario to take the reflection batch, got %#v", batch)
	}
}

func TestOptimizeSearchBuildReflectionBatchPrioritizesBlockerOverConcern(t *testing.T) {
	packet := map[string]any{
		"mutationConfig": map[string]any{
			"trainScenarioLimit": 1,
		},
		"scenarioSets": map[string]any{
			"trainScenarioSet": []any{"operator-recovery", "operator-follow-up"},
		},
	}
	parentCandidate := map[string]any{
		"heldOutEntries": []any{
			map[string]any{"scenarioId": "operator-recovery", "score": 70},
			map[string]any{"scenarioId": "operator-follow-up", "score": 92},
		},
		"checkpointFeedback": []any{
			map[string]any{
				"scenarioIds":      []any{"operator-recovery"},
				"severity":         "blocker",
				"feedbackMessages": []any{"Checklist candidate still leaves operator-recovery sequencing too implicit."},
			},
			map[string]any{
				"scenarioIds":      []any{"operator-follow-up"},
				"severity":         "concern",
				"feedbackMessages": []any{"Checklist candidate still leaves operator-follow-up under-specified."},
			},
		},
	}

	batch := optimizeSearchBuildReflectionBatch(packet, parentCandidate)
	if len(batch) != 1 || stringOrEmpty(batch[0]["scenarioId"]) != "operator-recovery" {
		t.Fatalf("expected blocker-scoped checkpoint to outrank concern-scoped scenarios, got %#v", batch)
	}
}

func TestOptimizeSearchMutationPromptFiltersCheckpointFeedbackToReflectionBatch(t *testing.T) {
	packet := map[string]any{
		"objective": map[string]any{
			"summary": "Improve operator recovery behavior.",
		},
		"mutationConfig": map[string]any{
			"trainScenarioLimit": 1,
		},
		"mutationEvidencePolicy": map[string]any{
			"includeCheckpointFeedback": true,
		},
		"scenarioSets": map[string]any{
			"trainScenarioSet": []any{"operator-recovery", "operator-follow-up"},
		},
	}
	parentCandidate := map[string]any{
		"heldOutEntries": []any{
			map[string]any{"scenarioId": "operator-recovery", "score": 70},
			map[string]any{"scenarioId": "operator-follow-up", "score": 92},
		},
		"checkpointFeedback": []any{
			map[string]any{
				"scenarioIds":      []any{"operator-recovery"},
				"severity":         "blocker",
				"feedbackMessages": []any{"Checklist candidate still leaves operator-recovery sequencing too implicit."},
			},
			map[string]any{
				"scenarioIds":      []any{"operator-follow-up"},
				"severity":         "concern",
				"feedbackMessages": []any{"Checklist candidate still leaves operator-follow-up under-specified."},
			},
		},
	}

	prompt := optimizeSearchMutationPrompt(packet, parentCandidate)
	if !strings.Contains(prompt, "operator-recovery sequencing too implicit.") {
		t.Fatalf("expected reflected checkpoint feedback to remain in prompt: %s", prompt)
	}
	if strings.Contains(prompt, "operator-follow-up under-specified.") {
		t.Fatalf("expected unrelated checkpoint feedback to be filtered from prompt: %s", prompt)
	}
}
