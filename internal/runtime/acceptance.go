package runtime

import (
	"fmt"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

// Provisional product constants for the final-acceptance-set read.
// They are deliberately fixed in code (not adapter-configurable) for this slice;
// risk-tier-configurable thresholds are deferred per docs/contracts/final-acceptance-set.md.
const (
	// AcceptanceReliabilityFloor is the minimum clean acceptance-scenario count
	// at or above which a single read is reported as `reliable`. Below it the gap
	// estimate is marked `low_confidence`, because a small single read is unbiased
	// but high-variance.
	AcceptanceReliabilityFloor = 10
	// AcceptanceGapTolerance is the held-out-minus-acceptance aggregate score drop
	// (on the 0-100 scale) tolerated before a reliable read is flagged for review.
	AcceptanceGapTolerance = 5.0
)

// BuildAcceptanceReport assembles a cautilus.acceptance_report.v1 packet from a
// search result and the finalist's acceptance-scenario results.
//
// It is the optimizer-untouchable detection surface: it intersects the acceptance
// scenario ids with the held-out set the search actually queried, excludes any
// contaminated ids from the gap, and refuses only when no clean scenario remains.
// The report is advisory; it never auto-applies or auto-rejects a candidate.
func BuildAcceptanceReport(searchResult map[string]any, acceptanceResults map[string]any, reliabilityFloor int, gapTolerance float64, now time.Time) (map[string]any, error) {
	if searchResult["schemaVersion"] != contracts.ImproveSearchResultSchema {
		return nil, fmt.Errorf("searchResult.schemaVersion must be %s", contracts.ImproveSearchResultSchema)
	}
	if acceptanceResults["schemaVersion"] != contracts.ScenarioResultsSchema {
		return nil, fmt.Errorf("acceptanceResults.schemaVersion must be %s", contracts.ScenarioResultsSchema)
	}
	if mode := stringOrEmpty(acceptanceResults["mode"]); mode != "acceptance" {
		return nil, fmt.Errorf("acceptanceResults.mode must be acceptance, got %q", mode)
	}
	selectedID := stringOrEmpty(searchResult["selectedCandidateId"])
	if selectedID == "" {
		return nil, fmt.Errorf("searchResult.selectedCandidateId is required")
	}

	heldOutSet := stringSliceOrEmptyRuntime(searchResult["heldOutScenarioIds"])
	if len(heldOutSet) == 0 {
		// Fall back to the scenario ids recorded in the held-out matrix so an older
		// search result without the convenience field is still guarded.
		heldOutSet = uniqueStrings(matrixScenarioIDs(searchResult["heldOutEvaluationMatrix"]))
	}
	// When the held-out set is empty even after the matrix fallback, the
	// contamination guard cannot be enforced, so the read must not claim a clean
	// pass. This keeps the guarantee a code fact, not a silent no-op.
	heldOutSetVerifiable := len(heldOutSet) > 0
	heldOutSetMembership := make(map[string]struct{}, len(heldOutSet))
	for _, id := range heldOutSet {
		heldOutSetMembership[id] = struct{}{}
	}

	// Finalist held-out per-scenario scores, from the recorded matrix.
	heldOutPerScenario := []any{}
	heldOutScoreSum := 0.0
	heldOutScoreCount := 0
	for _, raw := range arrayOrEmpty(searchResult["heldOutEvaluationMatrix"]) {
		entry := asMap(raw)
		if stringOrEmpty(entry["candidateId"]) != selectedID {
			continue
		}
		scenarioID := stringOrEmpty(entry["scenarioId"])
		if scenarioID == "" {
			continue
		}
		score := numberOrDefault(entry["score"], 0)
		heldOutPerScenario = append(heldOutPerScenario, map[string]any{"scenarioId": scenarioID, "score": score})
		heldOutScoreSum += score
		heldOutScoreCount++
	}

	// Acceptance per-scenario scores, split into clean and contaminated.
	contaminatedIDs := []string{}
	cleanPerScenario := []any{}
	cleanScoreSum := 0.0
	cleanCount := 0
	for _, raw := range arrayOrEmpty(acceptanceResults["results"]) {
		result := asMap(raw)
		scenarioID := stringOrEmpty(result["scenarioId"])
		if scenarioID == "" {
			continue
		}
		if _, contaminated := heldOutSetMembership[scenarioID]; contaminated {
			contaminatedIDs = append(contaminatedIDs, scenarioID)
			continue
		}
		score := numberOrDefault(result["overallScore"], 0)
		cleanPerScenario = append(cleanPerScenario, map[string]any{"scenarioId": scenarioID, "score": score})
		cleanScoreSum += score
		cleanCount++
	}

	heldOutExposureCount := intFromAnyRuntime(asMap(searchResult["searchTelemetry"])["heldOutExposureCount"], 0)

	report := map[string]any{
		"schemaVersion":        contracts.AcceptanceReportSchema,
		"generatedAt":          now.UTC().Format(time.RFC3339Nano),
		"selectedCandidateId":  selectedID,
		"heldOutExposureCount": heldOutExposureCount,
		"contamination": map[string]any{
			"contaminatedScenarioIds":    stringSliceToAny(contaminatedIDs),
			"cleanAcceptanceScenarioIds": acceptanceScenarioIDsFrom(cleanPerScenario),
		},
	}

	// Refuse only when nothing clean remains to measure.
	if cleanCount == 0 {
		report["status"] = "blocked"
		report["recommendation"] = "blocked"
		report["reasonCodes"] = []any{"fully_contaminated"}
		report["suggestedNextSteps"] = []any{
			"author final acceptance scenarios the search never queried",
			"confirm acceptance scenario ids do not appear in the search held-out set",
		}
		return report, nil
	}

	heldOutAggregate := 0.0
	if heldOutScoreCount > 0 {
		heldOutAggregate = heldOutScoreSum / float64(heldOutScoreCount)
	}
	acceptanceAggregate := cleanScoreSum / float64(cleanCount)
	gap := heldOutAggregate - acceptanceAggregate

	reliability := "reliable"
	if cleanCount < reliabilityFloor {
		reliability = "low_confidence"
	}

	reasonCodes := []any{}
	if len(contaminatedIDs) > 0 {
		reasonCodes = append(reasonCodes, "partial_contamination_excluded")
	}
	if !heldOutSetVerifiable {
		reasonCodes = append(reasonCodes, "held_out_set_unverifiable")
	}
	if heldOutScoreCount == 0 {
		reasonCodes = append(reasonCodes, "no_held_out_baseline")
	}
	if reliability == "low_confidence" {
		reasonCodes = append(reasonCodes, "low_confidence")
	}
	if gap > gapTolerance {
		reasonCodes = append(reasonCodes, "generalization_gap_exceeds_tolerance")
	}

	// Accept only when the read is reliable, the contamination guard was
	// verifiable, a real held-out baseline exists, and the gap is within
	// tolerance. Anything else needs human review; rejection stays a human act.
	recommendation := "accept"
	if reliability == "low_confidence" || !heldOutSetVerifiable || heldOutScoreCount == 0 || gap > gapTolerance {
		recommendation = "review"
	}

	report["status"] = "completed"
	report["heldOut"] = map[string]any{
		"aggregateScore": heldOutAggregate,
		"perScenario":    heldOutPerScenario,
	}
	report["acceptance"] = map[string]any{
		"aggregateScore": acceptanceAggregate,
		"perScenario":    cleanPerScenario,
	}
	report["generalizationGap"] = map[string]any{
		"aggregate": gap,
	}
	report["reliability"] = reliability
	report["reliabilityFloor"] = reliabilityFloor
	report["gapTolerance"] = gapTolerance
	report["cleanAcceptanceScenarioCount"] = cleanCount
	report["recommendation"] = recommendation
	report["reasonCodes"] = reasonCodes
	return report, nil
}

func matrixScenarioIDs(matrix any) []string {
	ids := []string{}
	for _, raw := range arrayOrEmpty(matrix) {
		if id := stringOrEmpty(asMap(raw)["scenarioId"]); id != "" {
			ids = append(ids, id)
		}
	}
	return ids
}

func acceptanceScenarioIDsFrom(perScenario []any) []any {
	ids := make([]any, 0, len(perScenario))
	for _, raw := range perScenario {
		if id := stringOrEmpty(asMap(raw)["scenarioId"]); id != "" {
			ids = append(ids, id)
		}
	}
	return ids
}

// RecordAcceptanceRead appends one acceptance-read entry to scenario history so a
// second read after seeing the result is visible rather than silent. It does not
// touch train graduation or trainRunCount; acceptance is optimizer-untouchable.
func RecordAcceptanceRead(history map[string]any, candidateID string, scenarioIDs []string, timestamp string) map[string]any {
	if history == nil {
		history = map[string]any{}
	}
	reads := arrayOrEmpty(history["acceptanceReads"])
	reads = append(reads, map[string]any{
		"timestamp":   timestamp,
		"candidateId": candidateID,
		"scenarioIds": stringSliceToAny(scenarioIDs),
	})
	history["acceptanceReads"] = reads
	return history
}
