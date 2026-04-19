package runtime

import "testing"

func TestOptimizeSearchSelectMergeParentsPrefersLowerRiskMetadataWhenPairMetricsTie(t *testing.T) {
	scenarioIDs := []string{"operator-recovery", "operator-follow-up"}
	seed := testOptimizeSearchMergeCandidate("seed", map[string]float64{
		"operator-recovery":  95,
		"operator-follow-up": 55,
	}, nil, nil, nil, nil)
	noisyFollowup := testOptimizeSearchMergeCandidate("g1-noisy", map[string]float64{
		"operator-recovery":  55,
		"operator-follow-up": 96,
	}, []string{"operator-follow-up"}, []string{"adds an exhaustive follow-up appendix"}, []string{"operator-follow-up may become too verbose", "operator recovery focus may blur"}, nil)
	stableFollowup := testOptimizeSearchMergeCandidate("g1-stable", map[string]float64{
		"operator-recovery":  55,
		"operator-follow-up": 96,
	}, []string{"operator-follow-up"}, []string{"keeps the follow-up handoff map crisp"}, []string{"held-out should confirm the shorter handoff stays sufficient"}, nil)

	selected := optimizeSearchSelectMergeParents(
		[]map[string]any{seed, noisyFollowup, stableFollowup},
		[]string{"seed", "g1-noisy", "g1-stable"},
		scenarioIDs,
		"coverage_expansion",
	)
	if got := optimizeSearchCandidateIDs(selected); len(got) != 2 || got[0] != "seed" || got[1] != "g1-stable" {
		t.Fatalf("unexpected merge parents: %#v", got)
	}
}

func TestOptimizeSearchSelectMergeParentsWeightsMetadataTowardWeakestFrontierScenario(t *testing.T) {
	scenarioIDs := []string{
		"scenario-1",
		"scenario-2",
		"scenario-3",
		"scenario-4",
		"scenario-5",
		"scenario-6",
		"scenario-7",
		"scenario-8",
		"scenario-9",
		"scenario-10",
	}
	seedScores := map[string]float64{}
	broadScores := map[string]float64{}
	weakestScores := map[string]float64{}
	for index, scenarioID := range scenarioIDs {
		if index == len(scenarioIDs)-1 {
			seedScores[scenarioID] = 60
		} else {
			seedScores[scenarioID] = 96
		}
		broadScores[scenarioID] = 95
		weakestScores[scenarioID] = 95
	}
	broadScores["scenario-10"] = 89
	weakestScores["scenario-10"] = 89
	seed := testOptimizeSearchMergeCandidate("seed", seedScores, nil, nil, nil, nil)
	broadPolish := testOptimizeSearchMergeCandidate("g1-broad", broadScores, []string{"scenario-1"}, []string{"keeps the broad operator framing crisp"}, []string{"held-out should confirm the broader framing stays concise"}, nil)
	weakestRepair := testOptimizeSearchMergeCandidate("g1-weakest", weakestScores, []string{"scenario-10"}, []string{"keeps the narrow recovery path explicit"}, []string{"scenario-3 may still need held-out confirmation"}, nil)

	selected := optimizeSearchSelectMergeParents(
		[]map[string]any{seed, broadPolish, weakestRepair},
		[]string{"seed", "g1-broad", "g1-weakest"},
		scenarioIDs,
		"coverage_expansion",
	)
	if got := optimizeSearchCandidateIDs(selected); len(got) != 2 || got[0] != "seed" || got[1] != "g1-weakest" {
		t.Fatalf("unexpected merge parents: %#v", got)
	}
}

func TestOptimizeSearchSelectMergeParentsPrioritizesHigherSeverityRejectedSiblingScenariosWhenPairMetricsTie(t *testing.T) {
	scenarioIDs := []string{"operator-recovery", "operator-follow-up"}
	seed := testOptimizeSearchMergeCandidate("seed", map[string]float64{
		"operator-recovery":  95,
		"operator-follow-up": 55,
	}, nil, nil, nil, nil)
	recoveryRepair := testOptimizeSearchMergeCandidate("g1-recovery", map[string]float64{
		"operator-recovery":  55,
		"operator-follow-up": 96,
	}, []string{"operator-recovery"}, []string{"keeps the recovery checklist concrete"}, []string{"operator-follow-up may still remain sparse"}, nil)
	followupRepair := testOptimizeSearchMergeCandidate("g1-followup", map[string]float64{
		"operator-recovery":  55,
		"operator-follow-up": 96,
	}, []string{"operator-follow-up"}, []string{"keeps the handoff map concise"}, []string{"operator-recovery may still need stronger wording"}, nil)
	rejectedSibling := testOptimizeSearchMergeCandidate("g1-rejected", nil, nil, nil, nil, []map[string]any{
		{
			"source":           "frontier_promotion_review",
			"scope":            "scenario",
			"scenarioIds":      []any{"operator-recovery"},
			"rejectionReasons": []any{"review:operator-review:blocker"},
			"feedbackMessages": []any{"Checklist candidate still leaves operator-recovery sequencing too implicit."},
		},
		{
			"source":           "frontier_promotion_review",
			"scope":            "scenario",
			"scenarioIds":      []any{"operator-follow-up"},
			"rejectionReasons": []any{"review:operator-review:concern"},
			"feedbackMessages": []any{"Checklist candidate still leaves operator-follow-up under-specified."},
		},
	})

	selected := optimizeSearchSelectMergeParents(
		[]map[string]any{seed, recoveryRepair, followupRepair, rejectedSibling},
		[]string{"seed", "g1-recovery", "g1-followup"},
		scenarioIDs,
		"coverage_expansion",
	)
	if got := optimizeSearchCandidateIDs(selected); len(got) != 2 || got[0] != "seed" || got[1] != "g1-recovery" {
		t.Fatalf("unexpected merge parents: %#v", got)
	}
}

func TestOptimizeSearchSelectMergeParentsCanPickBoundedThreeParentMergeWhenCoverageExpands(t *testing.T) {
	scenarioIDs := []string{"operator-recovery", "operator-follow-up", "operator-escalation"}
	recovery := testOptimizeSearchMergeCandidate("g1-recovery", map[string]float64{
		"operator-recovery":   96,
		"operator-follow-up":  55,
		"operator-escalation": 55,
	}, []string{"operator-recovery"}, nil, nil, nil)
	followup := testOptimizeSearchMergeCandidate("g1-followup", map[string]float64{
		"operator-recovery":   55,
		"operator-follow-up":  96,
		"operator-escalation": 55,
	}, []string{"operator-follow-up"}, nil, nil, nil)
	escalation := testOptimizeSearchMergeCandidate("g1-escalation", map[string]float64{
		"operator-recovery":   55,
		"operator-follow-up":  55,
		"operator-escalation": 96,
	}, []string{"operator-escalation"}, nil, nil, nil)

	selected := optimizeSearchSelectMergeParents(
		[]map[string]any{recovery, followup, escalation},
		[]string{"g1-recovery", "g1-followup", "g1-escalation"},
		scenarioIDs,
		"coverage_expansion",
	)
	if got := optimizeSearchCandidateIDs(selected); len(got) != 3 || got[0] != "g1-recovery" || got[1] != "g1-followup" || got[2] != "g1-escalation" {
		t.Fatalf("unexpected merge parents: %#v", got)
	}
}

func testOptimizeSearchMergeCandidate(id string, scores map[string]float64, expectedImprovements []string, preservedStrengths []string, riskNotes []string, checkpointFeedback []map[string]any) map[string]any {
	heldOutEntries := []any{}
	for scenarioID, score := range scores {
		heldOutEntries = append(heldOutEntries, map[string]any{
			"scenarioId": scenarioID,
			"score":      score,
		})
	}
	feedbackEntries := []any{}
	for _, entry := range checkpointFeedback {
		feedbackEntries = append(feedbackEntries, entry)
	}
	return map[string]any{
		"id":                   id,
		"heldOutEntries":       heldOutEntries,
		"expectedImprovements": stringSliceToAny(expectedImprovements),
		"preservedStrengths":   stringSliceToAny(preservedStrengths),
		"riskNotes":            stringSliceToAny(riskNotes),
		"checkpointFeedback":   feedbackEntries,
		"telemetry": map[string]any{
			"totalCostUsd":    0.07,
			"totalDurationMs": 1900,
		},
	}
}
