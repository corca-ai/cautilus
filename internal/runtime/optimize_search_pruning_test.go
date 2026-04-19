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

func TestOptimizeSearchMutationParentEligibilityExplainsRepairWindowAndBlockers(t *testing.T) {
	seed := map[string]any{"id": "seed"}
	repair := map[string]any{
		"id": "g1-repair",
		"promotionReviewOutcome": map[string]any{
			"admissible":           false,
			"reviewedAtGeneration": 1,
			"variants": []any{
				map[string]any{"verdict": "concern"},
			},
		},
	}
	blocked := map[string]any{
		"id": "g1-blocked",
		"promotionReviewOutcome": map[string]any{
			"admissible":           false,
			"reviewedAtGeneration": 1,
			"variants": []any{
				map[string]any{"verdict": "blocker"},
			},
		},
	}

	records := optimizeSearchMutationParentEligibility(
		[]map[string]any{seed, repair, blocked},
		[]string{"seed", "g1-repair", "g1-blocked"},
		2,
	)
	if len(records) != 3 {
		t.Fatalf("expected three eligibility records, got %#v", records)
	}

	first := asMap(records[0])
	second := asMap(records[1])
	third := asMap(records[2])

	if first["reason"] != "frontier_candidate" || first["eligible"] != true {
		t.Fatalf("expected seed to stay eligible frontier candidate, got %#v", first)
	}
	if second["reason"] != "bounded_repair_generation" || second["eligible"] != true {
		t.Fatalf("expected concern candidate to stay eligible for one repair generation, got %#v", second)
	}
	if third["reason"] != "frontier_promotion_review_blocker" || third["eligible"] != false {
		t.Fatalf("expected blocker candidate to be rejected immediately, got %#v", third)
	}
}

func TestOptimizeSearchMutationParentEligibilityExplainsExpiredRepairWindow(t *testing.T) {
	repair := map[string]any{
		"id": "g1-repair",
		"promotionReviewOutcome": map[string]any{
			"admissible":           false,
			"reviewedAtGeneration": 1,
			"variants": []any{
				map[string]any{"verdict": "concern"},
			},
		},
	}

	records := optimizeSearchMutationParentEligibility(
		[]map[string]any{repair},
		[]string{"g1-repair"},
		3,
	)
	if len(records) != 1 {
		t.Fatalf("expected one eligibility record, got %#v", records)
	}
	record := asMap(records[0])
	if record["reason"] != "repair_window_expired" || record["eligible"] != false {
		t.Fatalf("expected stale repair lineage to explain the expired repair window, got %#v", record)
	}
}
