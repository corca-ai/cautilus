package runtime

import "testing"

func TestOptimizeSearchPrioritizeMutationCandidateIDsPrefersCheckpointRejectedLineageForOneRepairGeneration(t *testing.T) {
	seed := map[string]any{"id": "seed"}
	rejected := map[string]any{
		"id": "g1-rejected",
		"promotionReviewOutcome": map[string]any{
			"admissible":           false,
			"reviewedAtGeneration": 1,
			"variants": []any{
				map[string]any{"verdict": "concern"},
			},
		},
	}

	got := optimizeSearchPrioritizeMutationCandidateIDs(
		[]map[string]any{seed, rejected},
		[]string{"seed", "g1-rejected"},
		2,
	)
	if len(got) != 2 || got[0] != "g1-rejected" || got[1] != "seed" {
		t.Fatalf("expected rejected lineage to take the next repair generation, got %#v", got)
	}
}

func TestOptimizeSearchPrioritizeMutationCandidateIDsPrunesConcernRejectedLineageAfterOneRepairGeneration(t *testing.T) {
	seed := map[string]any{"id": "seed"}
	rejected := map[string]any{
		"id": "g1-rejected",
		"promotionReviewOutcome": map[string]any{
			"admissible":           false,
			"reviewedAtGeneration": 1,
			"variants": []any{
				map[string]any{"verdict": "concern"},
			},
		},
	}

	got := optimizeSearchPrioritizeMutationCandidateIDs(
		[]map[string]any{seed, rejected},
		[]string{"seed", "g1-rejected"},
		3,
	)
	if len(got) != 1 || got[0] != "seed" {
		t.Fatalf("expected stale rejected lineage to be pruned after one repair generation, got %#v", got)
	}
}

func TestOptimizeSearchReviewOutcomeSeverityTreatsRejectedPassVariantAsConcern(t *testing.T) {
	severity := optimizeSearchReviewOutcomeSeverity(map[string]any{
		"admissible": false,
		"variants": []any{
			map[string]any{"verdict": "pass"},
		},
	})
	if severity != "concern" {
		t.Fatalf("expected rejected pass verdict to downgrade to concern, got %q", severity)
	}
}

func TestOptimizeSearchCandidateCanSeedMutationPrunesBlockerRejectedLineageImmediately(t *testing.T) {
	candidate := map[string]any{
		"id": "g1-blocked",
		"promotionReviewOutcome": map[string]any{
			"admissible":           false,
			"reviewedAtGeneration": 1,
			"variants": []any{
				map[string]any{"verdict": "blocker"},
			},
		},
	}

	if optimizeSearchCandidateCanSeedMutation(candidate, 2) {
		t.Fatalf("expected blocker-rejected lineage to be ineligible for the next generation repair")
	}
}
