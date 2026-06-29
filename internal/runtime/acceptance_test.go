package runtime

import (
	"testing"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

func acceptanceTestSearchResult() map[string]any {
	return map[string]any{
		"schemaVersion":       contracts.ImproveSearchResultSchema,
		"selectedCandidateId": "cand-1",
		"heldOutScenarioIds":  []any{"ho-1", "ho-2"},
		"heldOutEvaluationMatrix": []any{
			map[string]any{"candidateId": "cand-1", "scenarioId": "ho-1", "score": float64(90)},
			map[string]any{"candidateId": "cand-1", "scenarioId": "ho-2", "score": float64(100)},
			map[string]any{"candidateId": "cand-0", "scenarioId": "ho-1", "score": float64(10)},
		},
		"searchTelemetry": map[string]any{"heldOutExposureCount": float64(4)},
	}
}

func acceptanceResults(mode string, results ...map[string]any) map[string]any {
	items := make([]any, 0, len(results))
	for _, r := range results {
		items = append(items, r)
	}
	return map[string]any{
		"schemaVersion": contracts.ScenarioResultsSchema,
		"mode":          mode,
		"results":       items,
	}
}

func acceptanceFixedTime() time.Time {
	return time.Date(2026, 6, 29, 0, 0, 0, 0, time.UTC)
}

func TestBuildAcceptanceReportCleanRecommendsAccept(t *testing.T) {
	results := acceptanceResults("acceptance",
		map[string]any{"scenarioId": "acc-1", "overallScore": float64(90)},
		map[string]any{"scenarioId": "acc-2", "overallScore": float64(92)},
	)
	report, err := BuildAcceptanceReport(acceptanceTestSearchResult(), results, 2, AcceptanceGapTolerance, acceptanceFixedTime())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if report["status"] != "completed" {
		t.Fatalf("expected completed status, got %#v", report["status"])
	}
	// held-out aggregate for cand-1 = (90+100)/2 = 95; acceptance = (90+92)/2 = 91; gap = 4.
	if gap := asMap(report["generalizationGap"])["aggregate"]; gap != float64(4) {
		t.Fatalf("expected aggregate gap 4, got %#v", gap)
	}
	if report["reliability"] != "reliable" {
		t.Fatalf("expected reliable, got %#v", report["reliability"])
	}
	if report["recommendation"] != "accept" {
		t.Fatalf("expected accept recommendation, got %#v", report["recommendation"])
	}
	if report["heldOutExposureCount"] != 4 {
		t.Fatalf("expected exposure count 4 carried through, got %#v", report["heldOutExposureCount"])
	}
}

func TestBuildAcceptanceReportSmallReadIsLowConfidence(t *testing.T) {
	results := acceptanceResults("acceptance",
		map[string]any{"scenarioId": "acc-1", "overallScore": float64(95)},
		map[string]any{"scenarioId": "acc-2", "overallScore": float64(95)},
	)
	// floor 5 > clean count 2 -> low_confidence.
	report, err := BuildAcceptanceReport(acceptanceTestSearchResult(), results, 5, AcceptanceGapTolerance, acceptanceFixedTime())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if report["reliability"] != "low_confidence" {
		t.Fatalf("expected low_confidence, got %#v", report["reliability"])
	}
	if report["recommendation"] != "review" {
		t.Fatalf("expected review recommendation on low confidence, got %#v", report["recommendation"])
	}
}

func TestBuildAcceptanceReportLargeGapFlagsReview(t *testing.T) {
	results := acceptanceResults("acceptance",
		map[string]any{"scenarioId": "acc-1", "overallScore": float64(50)},
		map[string]any{"scenarioId": "acc-2", "overallScore": float64(50)},
	)
	report, err := BuildAcceptanceReport(acceptanceTestSearchResult(), results, 2, AcceptanceGapTolerance, acceptanceFixedTime())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// gap = 95 - 50 = 45 > tolerance.
	if report["recommendation"] != "review" {
		t.Fatalf("expected review on large gap, got %#v", report["recommendation"])
	}
	if !acceptanceListContains(report["reasonCodes"], "generalization_gap_exceeds_tolerance") {
		t.Fatalf("expected gap reason code, got %#v", report["reasonCodes"])
	}
}

func TestBuildAcceptanceReportExcludesContaminatedScenarios(t *testing.T) {
	results := acceptanceResults("acceptance",
		map[string]any{"scenarioId": "ho-1", "overallScore": float64(100)}, // contaminated: in held-out set
		map[string]any{"scenarioId": "acc-1", "overallScore": float64(90)}, // clean
	)
	report, err := BuildAcceptanceReport(acceptanceTestSearchResult(), results, 1, AcceptanceGapTolerance, acceptanceFixedTime())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	contamination := asMap(report["contamination"])
	if !acceptanceListContains(contamination["contaminatedScenarioIds"], "ho-1") {
		t.Fatalf("expected ho-1 flagged contaminated, got %#v", contamination)
	}
	if report["cleanAcceptanceScenarioCount"] != 1 {
		t.Fatalf("expected 1 clean scenario, got %#v", report["cleanAcceptanceScenarioCount"])
	}
	// acceptance aggregate computed over clean only = 90; gap = 95 - 90 = 5 (== tolerance, not exceeded).
	if gap := asMap(report["generalizationGap"])["aggregate"]; gap != float64(5) {
		t.Fatalf("expected gap 5 over clean remainder, got %#v", gap)
	}
	if !acceptanceListContains(report["reasonCodes"], "partial_contamination_excluded") {
		t.Fatalf("expected partial contamination reason code, got %#v", report["reasonCodes"])
	}
}

func TestBuildAcceptanceReportFullyContaminatedIsBlocked(t *testing.T) {
	results := acceptanceResults("acceptance",
		map[string]any{"scenarioId": "ho-1", "overallScore": float64(100)},
		map[string]any{"scenarioId": "ho-2", "overallScore": float64(100)},
	)
	report, err := BuildAcceptanceReport(acceptanceTestSearchResult(), results, 1, AcceptanceGapTolerance, acceptanceFixedTime())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if report["status"] != "blocked" || report["recommendation"] != "blocked" {
		t.Fatalf("expected blocked status and recommendation, got %#v", report)
	}
	if !acceptanceListContains(report["reasonCodes"], "fully_contaminated") {
		t.Fatalf("expected fully_contaminated reason code, got %#v", report["reasonCodes"])
	}
}

func TestBuildAcceptanceReportFallsBackToMatrixForContamination(t *testing.T) {
	// Older search result without the heldOutScenarioIds convenience field: the
	// guard must still catch contamination via the recorded matrix scenario ids.
	searchResult := acceptanceTestSearchResult()
	delete(searchResult, "heldOutScenarioIds")
	results := acceptanceResults("acceptance",
		map[string]any{"scenarioId": "ho-1", "overallScore": float64(100)}, // in matrix -> contaminated
		map[string]any{"scenarioId": "acc-1", "overallScore": float64(90)},
	)
	report, err := BuildAcceptanceReport(searchResult, results, 1, AcceptanceGapTolerance, acceptanceFixedTime())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !acceptanceListContains(asMap(report["contamination"])["contaminatedScenarioIds"], "ho-1") {
		t.Fatalf("expected matrix fallback to flag ho-1 contaminated, got %#v", report["contamination"])
	}
	if acceptanceListContains(report["reasonCodes"], "held_out_set_unverifiable") {
		t.Fatalf("matrix fallback should be verifiable, got %#v", report["reasonCodes"])
	}
}

func TestBuildAcceptanceReportUnverifiableHeldOutForcesReview(t *testing.T) {
	// No heldOutScenarioIds and no matrix rows: the guard cannot be enforced, so
	// the read must not recommend accept even with strong-looking acceptance scores.
	searchResult := map[string]any{
		"schemaVersion":           contracts.ImproveSearchResultSchema,
		"selectedCandidateId":     "cand-1",
		"heldOutEvaluationMatrix": []any{},
		"searchTelemetry":         map[string]any{"heldOutExposureCount": float64(0)},
	}
	results := acceptanceResults("acceptance",
		map[string]any{"scenarioId": "acc-1", "overallScore": float64(100)},
		map[string]any{"scenarioId": "acc-2", "overallScore": float64(100)},
	)
	report, err := BuildAcceptanceReport(searchResult, results, 1, AcceptanceGapTolerance, acceptanceFixedTime())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if report["recommendation"] == "accept" {
		t.Fatalf("unverifiable held-out set must not recommend accept, got %#v", report["recommendation"])
	}
	if !acceptanceListContains(report["reasonCodes"], "held_out_set_unverifiable") {
		t.Fatalf("expected held_out_set_unverifiable reason, got %#v", report["reasonCodes"])
	}
}

func TestBuildAcceptanceReportRejectsNonAcceptanceMode(t *testing.T) {
	results := acceptanceResults("held_out",
		map[string]any{"scenarioId": "acc-1", "overallScore": float64(90)},
	)
	if _, err := BuildAcceptanceReport(acceptanceTestSearchResult(), results, 2, AcceptanceGapTolerance, acceptanceFixedTime()); err == nil {
		t.Fatalf("expected error for non-acceptance mode results")
	}
}

func TestRecordAcceptanceReadMakesRereadVisible(t *testing.T) {
	history := map[string]any{"schemaVersion": contracts.ScenarioHistorySchema, "profileId": "default"}
	history = RecordAcceptanceRead(history, "cand-1", []string{"acc-1", "acc-2"}, "2026-06-29T00:00:00Z")
	history = RecordAcceptanceRead(history, "cand-1", []string{"acc-1", "acc-2"}, "2026-06-29T01:00:00Z")
	reads := arrayOrEmpty(history["acceptanceReads"])
	if len(reads) != 2 {
		t.Fatalf("expected two visible acceptance reads, got %d: %#v", len(reads), reads)
	}
	if asMap(reads[0])["timestamp"] == asMap(reads[1])["timestamp"] {
		t.Fatalf("expected distinct read timestamps")
	}
}

func acceptanceListContains(value any, target string) bool {
	for _, raw := range arrayOrEmpty(value) {
		if stringOrEmpty(raw) == target {
			return true
		}
	}
	return false
}
