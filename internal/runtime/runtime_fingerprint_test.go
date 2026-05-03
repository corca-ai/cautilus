package runtime

import (
	"testing"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

func TestBuildReportPacketNormalizesAndComparesRuntimeFingerprint(t *testing.T) {
	report, err := BuildReportPacket(minimalReportInput(map[string]any{
		"telemetry": map[string]any{
			"provider": "openai",
			"model":    "gpt-5.4",
		},
	}, map[string]any{
		"schemaVersion": contracts.ReportPacketSchema,
		"telemetry": map[string]any{
			"runtimeFingerprint": map[string]any{
				"provider": "openai",
				"model":    "gpt-5.3",
			},
		},
	}), time.Date(2026, 4, 24, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildReportPacket returned error: %v", err)
	}
	runtimeContext := asMap(report["runtimeContext"])
	if !containsString(stringSliceValue(runtimeContext["reasonCodes"]), "model_runtime_changed") {
		t.Fatalf("expected model_runtime_changed context, got %#v", runtimeContext)
	}
	if report["recommendation"] != "accept-now" {
		t.Fatalf("runtime warning should not change recommendation: %#v", report["recommendation"])
	}
	fingerprint := asMap(asMap(report["telemetry"])["runtimeFingerprint"])
	if fingerprint["model"] != "gpt-5.4" {
		t.Fatalf("expected nested runtime fingerprint, got %#v", fingerprint)
	}
}

func TestBuildReportPacketNotesPriorEvidenceWithoutRuntimeIdentity(t *testing.T) {
	report, err := BuildReportPacket(minimalReportInput(map[string]any{
		"telemetry": map[string]any{
			"provider": "openai",
			"model":    "gpt-5.4",
		},
	}, map[string]any{
		"schemaVersion": contracts.ReportPacketSchema,
		"telemetry":     map[string]any{"modeCount": 1},
	}), time.Date(2026, 4, 24, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildReportPacket returned error: %v", err)
	}
	runtimeContext := asMap(report["runtimeContext"])
	if !containsString(stringSliceValue(runtimeContext["reasonCodes"]), "model_runtime_unobserved") {
		t.Fatalf("expected model_runtime_unobserved context, got %#v", runtimeContext)
	}
	if runtimeContext["severity"] != "context_note" {
		t.Fatalf("expected non-failing note, got %#v", runtimeContext)
	}
}

func TestBuildSkillEvaluationSummaryPreservesPassingRecommendationWithRuntimeChange(t *testing.T) {
	summary, err := BuildSkillEvaluationSummary(map[string]any{
		"schemaVersion": contracts.SkillEvaluationInputsSchema,
		"skillId":       "operator-guidance",
		"priorEvidence": map[string]any{
			"telemetry": map[string]any{
				"runtimeFingerprint": map[string]any{
					"provider": "openai",
					"model":    "gpt-5.3",
				},
			},
		},
		"evaluations": []any{
			map[string]any{
				"evaluationId":   "execution-pass",
				"targetKind":     "public_skill",
				"targetId":       "operator-guidance",
				"evaluationKind": "execution",
				"prompt":         "Summarize the operator guidance.",
				"summary":        "The skill completed the intended task.",
				"invoked":        true,
				"outcome":        "passed",
				"telemetry": map[string]any{
					"provider": "openai",
					"model":    "gpt-5.4",
				},
			},
		},
	}, time.Date(2026, 4, 24, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildSkillEvaluationSummary returned error: %v", err)
	}
	if summary["recommendation"] != "accept-now" {
		t.Fatalf("expected passing recommendation, got %#v", summary)
	}
	runtimeContext := asMap(summary["runtimeContext"])
	if !containsString(stringSliceValue(runtimeContext["reasonCodes"]), "model_runtime_changed") {
		t.Fatalf("expected runtime change context, got %#v", runtimeContext)
	}
}

func TestBuildEvaluationSummaryBlocksPinnedRuntimeMismatch(t *testing.T) {
	summary, err := BuildEvaluationSummary(map[string]any{
		"schemaVersion": contracts.EvaluationObservedSchema,
		"suiteId":       "root-routing",
		"runtimePolicy": map[string]any{
			"mode":     "pinned",
			"provider": "openai",
			"model":    "gpt-5.3",
		},
		"evaluations": []any{
			map[string]any{
				"evaluationId":           "root-first",
				"prompt":                 "Use the repo instructions.",
				"summary":                "The root instruction surface loaded.",
				"observationStatus":      "observed",
				"loadedInstructionFiles": []any{"AGENTS.md"},
				"loadedSupportingFiles":  []any{},
				"instructionSurface": map[string]any{
					"surfaceLabel": "root",
					"files": []any{
						map[string]any{"path": "AGENTS.md", "kind": "instruction"},
					},
				},
				"requiredInstructionFiles":  []any{"AGENTS.md"},
				"forbiddenInstructionFiles": []any{},
				"requiredSupportingFiles":   []any{},
				"forbiddenSupportingFiles":  []any{},
				"telemetry": map[string]any{
					"provider": "openai",
					"model":    "gpt-5.4",
				},
			},
		},
	}, time.Date(2026, 4, 24, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildEvaluationSummary returned error: %v", err)
	}
	runtimeContext := asMap(summary["runtimeContext"])
	if !containsString(stringSliceValue(runtimeContext["reasonCodes"]), "model_runtime_pinned_mismatch") {
		t.Fatalf("expected pinned mismatch context, got %#v", runtimeContext)
	}
	if runtimeContext["severity"] != "blocked" || summary["recommendation"] != "defer" {
		t.Fatalf("expected blocked runtime context to defer, got %#v", summary)
	}
}

func TestGenerateOptimizeProposalAddsPassingSimplificationForRuntimeChange(t *testing.T) {
	report := map[string]any{
		"schemaVersion": contracts.ReportPacketSchema,
		"generatedAt":   "2026-04-24T00:00:00Z",
		"candidate":     "candidate",
		"baseline":      "baseline",
		"intent":        "Keep the skill behavior stable.",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"summary":         "Keep the skill behavior stable.",
			"behaviorSurface": BehaviorSurfaces["OPERATOR_BEHAVIOR"],
		},
		"commands":            []any{},
		"commandObservations": []any{},
		"modesRun":            []any{"held_out"},
		"modeSummaries":       []any{map[string]any{"mode": "held_out", "status": "completed"}},
		"telemetry":           map[string]any{},
		"improved":            []any{"stable-case"},
		"regressed":           []any{},
		"unchanged":           []any{},
		"noisy":               []any{},
		"humanReviewFindings": []any{},
		"recommendation":      "accept-now",
		"runtimeContext":      modelRuntimeChangedContext(),
	}
	packet := map[string]any{
		"schemaVersion":      contracts.OptimizeInputsSchema,
		"generatedAt":        "2026-04-24T00:00:00Z",
		"repoRoot":           ".",
		"optimizationTarget": "prompt",
		"intentProfile":      report["intentProfile"],
		"optimizer":          buildOptimizerPlan("medium"),
		"reportFile":         "report.json",
		"report":             report,
		"runtimeContext":     report["runtimeContext"],
		"objective":          map[string]any{"constraints": []any{}},
	}
	proposal, err := GenerateOptimizeProposal(packet, nil, time.Date(2026, 4, 24, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("GenerateOptimizeProposal returned error: %v", err)
	}
	reasons := stringSliceValue(proposal["revisionReasons"])
	if !containsString(reasons, "model_runtime_changed") || !containsString(reasons, "passing_simplification") {
		t.Fatalf("expected runtime simplification reasons, got %#v", proposal["revisionReasons"])
	}
	firstChange := asMap(arrayOrEmpty(proposal["suggestedChanges"])[0])
	if firstChange["id"] != "passing-simplification" || firstChange["optional"] != true {
		t.Fatalf("expected optional simplification change, got %#v", proposal["suggestedChanges"])
	}
	stopConditions := stringSliceValue(proposal["stopConditions"])
	if !containsString(stopConditions, "Do not weaken held-out, comparison, or structured review gates to make the candidate pass.") {
		t.Fatalf("expected stop conditions to preserve review gates, got %#v", proposal["stopConditions"])
	}
	followUpChecks := stringSliceValue(proposal["followUpChecks"])
	if !containsString(followUpChecks, "Rerun held-out before accepting the revision.") ||
		!containsString(followUpChecks, "Rerun comparison and review variants when those surfaces exist for the target repo.") {
		t.Fatalf("expected follow-up checks to require held-out, comparison, and review gates, got %#v", proposal["followUpChecks"])
	}
}

func TestGenerateOptimizeProposalKeepsBaselineFollowUpForHoldWithoutSuggestedChanges(t *testing.T) {
	report := map[string]any{
		"schemaVersion": contracts.ReportPacketSchema,
		"generatedAt":   "2026-04-24T00:00:00Z",
		"candidate":     "candidate",
		"baseline":      "baseline",
		"intent":        "Keep the skill behavior stable.",
		"intentProfile": map[string]any{
			"schemaVersion":   contracts.BehaviorIntentSchema,
			"summary":         "Keep the skill behavior stable.",
			"behaviorSurface": BehaviorSurfaces["OPERATOR_BEHAVIOR"],
		},
		"commands":            []any{},
		"commandObservations": []any{},
		"modesRun":            []any{"held_out"},
		"modeSummaries":       []any{map[string]any{"mode": "held_out", "status": "completed"}},
		"telemetry":           map[string]any{},
		"improved":            []any{"stable-case"},
		"regressed":           []any{},
		"unchanged":           []any{},
		"noisy":               []any{},
		"humanReviewFindings": []any{},
		"recommendation":      "accept-now",
	}
	packet := map[string]any{
		"schemaVersion":      contracts.OptimizeInputsSchema,
		"generatedAt":        "2026-04-24T00:00:00Z",
		"repoRoot":           ".",
		"optimizationTarget": "prompt",
		"intentProfile":      report["intentProfile"],
		"optimizer":          buildOptimizerPlan("medium"),
		"reportFile":         "report.json",
		"report":             report,
		"objective":          map[string]any{"constraints": []any{}},
	}
	proposal, err := GenerateOptimizeProposal(packet, nil, time.Date(2026, 4, 24, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("GenerateOptimizeProposal returned error: %v", err)
	}
	if proposal["decision"] != "hold" || len(arrayOrEmpty(proposal["suggestedChanges"])) != 0 {
		t.Fatalf("expected hold without suggested changes, got decision=%#v changes=%#v", proposal["decision"], proposal["suggestedChanges"])
	}
	followUpChecks := stringSliceValue(proposal["followUpChecks"])
	if len(followUpChecks) != 1 || followUpChecks[0] != "Preserve the current candidate as the next baseline." {
		t.Fatalf("expected baseline-only follow-up for hold without changes, got %#v", proposal["followUpChecks"])
	}
}

func TestOptimizeSearchRankCandidateIDsPrefersShorterTargetAfterBehaviorTie(t *testing.T) {
	matrix := []any{
		map[string]any{"candidateId": "long", "scenarioId": "case", "score": 1.0},
		map[string]any{"candidateId": "short", "scenarioId": "case", "score": 1.0},
	}
	candidates := []map[string]any{
		{"id": "long", "targetSnapshot": map[string]any{"sizeBytes": 100}, "telemetry": map[string]any{"totalCostUsd": 0.01}},
		{"id": "short", "targetSnapshot": map[string]any{"sizeBytes": 40}, "telemetry": map[string]any{"totalCostUsd": 0.02}},
	}
	ranked := optimizeSearchRankCandidateIDs([]string{"long", "short"}, matrix, candidates, []string{"case"})
	if len(ranked) == 0 || ranked[0] != "short" {
		t.Fatalf("expected shorter candidate to win behavioral tie, got %#v", ranked)
	}
	registry := optimizeSearchCandidateRegistry(candidates)
	delta := asMap(asMap(registry[1])["targetSizeDelta"])
	if delta["sizeBytes"] != float64(-60) {
		t.Fatalf("expected target size delta to be recorded, got %#v", registry)
	}
}

func minimalReportInput(modeRun map[string]any, priorEvidence map[string]any) map[string]any {
	input := map[string]any{
		"schemaVersion":       contracts.ReportInputsSchema,
		"candidate":           "candidate",
		"baseline":            "baseline",
		"intent":              "Keep the evaluated behavior stable.",
		"intentProfile":       map[string]any{},
		"commands":            []any{},
		"commandObservations": []any{},
		"modeRuns": []any{
			map[string]any{
				"mode":      "held_out",
				"status":    "completed",
				"summary":   "Held-out passed.",
				"telemetry": modeRun["telemetry"],
			},
		},
		"improved":            []any{"stable-case"},
		"regressed":           []any{},
		"unchanged":           []any{},
		"noisy":               []any{},
		"humanReviewFindings": []any{},
		"recommendation":      "accept-now",
	}
	if len(priorEvidence) > 0 {
		input["priorEvidence"] = priorEvidence
		input["priorEvidenceSource"] = "test-prior.json"
	}
	return input
}

func modelRuntimeChangedContext() map[string]any {
	return map[string]any{
		"severity":    "warning",
		"reasonCodes": []any{"model_runtime_changed"},
		"comparisons": []any{
			map[string]any{
				"reasonCode": "model_runtime_changed",
				"severity":   "warning",
				"current":    map[string]any{"provider": "openai", "model": "gpt-5.4"},
				"prior":      map[string]any{"provider": "openai", "model": "gpt-5.3"},
				"fields":     []any{"model"},
			},
		},
	}
}
