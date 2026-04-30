package runtime

import (
	"strings"
	"testing"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

func TestEvaluationSummaryPreservesRunnerProof(t *testing.T) {
	summary, err := BuildAppChatEvaluationSummary(map[string]any{
		"schemaVersion": contracts.AppChatEvaluationInputsSchema,
		"suiteId":       "chat-proof",
		"proof": map[string]any{
			"proofClass":                     "in-process-product-runner",
			"proofClassSource":               "assessment",
			"runnerAssessmentState":          "assessed",
			"runnerAssessmentRecommendation": "ready-for-selected-surface",
			"targetSurface":                  "app/chat",
			"runnerVerification":             map[string]any{"capabilityState": "ready"},
		},
		"evaluations": []any{
			map[string]any{
				"caseId":     "case-1",
				"provider":   "fixture",
				"model":      "fixture-model",
				"harness":    "local",
				"mode":       "messaging",
				"durationMs": 1,
				"observed": map[string]any{
					"messages":  []any{map[string]any{"role": "assistant", "content": "hello"}},
					"finalText": "hello",
				},
				"expected": map[string]any{"finalText": "hello"},
			},
		},
	}, time.Date(2026, 4, 30, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildAppChatEvaluationSummary returned error: %v", err)
	}
	proof := asMap(summary["proof"])
	if proof["proofClass"] != "in-process-product-runner" || proof["productProofReady"] != true {
		t.Fatalf("expected preserved ready product proof, got %#v", proof)
	}
}

func TestEvaluationProofIgnoresSelfCertifiedProductProofReady(t *testing.T) {
	proof := EvaluationProofFromInput(map[string]any{
		"proof": map[string]any{
			"proofClass":                 "live-product-runner",
			"targetSurface":              "app/chat",
			"requiresProductRunnerProof": true,
			"productProofReady":          true,
		},
	})
	if proof["productProofReady"] != false {
		t.Fatalf("expected productProofReady to be recomputed false, got %#v", proof)
	}
}

func TestEvaluationProofDowngradesFixtureRuntimeProofClass(t *testing.T) {
	proof := BuildEvaluationProofFromRunnerReadiness(map[string]any{
		"state":            "missing-assessment",
		"proofClass":       "live-product-runner",
		"proofClassSource": "adapter-runner",
	}, "app/chat", "fixture")
	if proof["proofClass"] != "fixture-smoke" || proof["proofClassSource"] != "runtime" {
		t.Fatalf("expected fixture runtime proof class, got %#v", proof)
	}
	if proof["declaredProofClass"] != "live-product-runner" || proof["productProofReady"] != false {
		t.Fatalf("expected declared proof metadata without product readiness, got %#v", proof)
	}
}

func TestEvaluationProofRequiresReadyAssessmentRecommendation(t *testing.T) {
	proof := EvaluationProofFromInput(map[string]any{
		"proof": map[string]any{
			"proofClass":                     "live-product-runner",
			"targetSurface":                  "app/chat",
			"runnerAssessmentState":          "assessed",
			"runnerAssessmentRecommendation": "needs-instrumentation",
			"runnerVerification":             map[string]any{"capabilityState": "ready"},
		},
	})
	if proof["productProofReady"] != false {
		t.Fatalf("expected non-ready recommendation to block product proof, got %#v", proof)
	}
}

func TestEvaluationProofBlocksAssessmentSurfaceMismatch(t *testing.T) {
	proof := BuildEvaluationProofFromRunnerReadiness(map[string]any{
		"state":              "assessed",
		"proofClass":         "live-product-runner",
		"proofClassSource":   "assessment",
		"recommendation":     "ready-for-selected-surface",
		"runnerVerification": map[string]any{"capabilityState": "ready"},
		"assessment": map[string]any{
			"surface": "app/chat",
			"assessedRequirement": map[string]any{
				"recommendedEvalSurface": "app/chat",
			},
		},
	}, "app/prompt", "fixture")
	if proof["productProofReady"] != false || len(arrayOrEmpty(proof["proofBlockers"])) == 0 {
		t.Fatalf("expected surface mismatch to block product proof, got %#v", proof)
	}
}

func TestEvaluationProofPreservesBlockersThroughSummary(t *testing.T) {
	summary, err := BuildAppPromptEvaluationSummary(map[string]any{
		"schemaVersion": contracts.AppPromptEvaluationInputsSchema,
		"suiteId":       "prompt-proof",
		"proof": map[string]any{
			"proofClass":                     "live-product-runner",
			"runnerAssessmentState":          "assessed",
			"runnerAssessmentRecommendation": "ready-for-selected-surface",
			"targetSurface":                  "app/prompt",
			"runnerVerification":             map[string]any{"capabilityState": "ready"},
			"proofBlockers": []any{
				map[string]any{"reason": "assessment-surface-mismatch", "expected": "app/prompt", "actual": "app/chat"},
			},
		},
		"evaluations": []any{
			map[string]any{
				"caseId":     "case-1",
				"provider":   "fixture",
				"model":      "fixture-model",
				"harness":    "local",
				"mode":       "messaging",
				"durationMs": 1,
				"observed": map[string]any{
					"input":     "Say hello.",
					"messages":  []any{map[string]any{"role": "assistant", "content": "hello"}},
					"finalText": "hello",
				},
				"expected": map[string]any{"finalText": "hello"},
			},
		},
	}, time.Date(2026, 4, 30, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildAppPromptEvaluationSummary returned error: %v", err)
	}
	proof := asMap(summary["proof"])
	if proof["productProofReady"] != false || len(arrayOrEmpty(proof["proofBlockers"])) == 0 {
		t.Fatalf("expected blockers to survive summary normalization, got %#v", proof)
	}
}

func TestReportPacketSummarizesBlockedProductRunnerProof(t *testing.T) {
	report, err := BuildReportPacket(map[string]any{
		"schemaVersion":       contracts.ReportInputsSchema,
		"candidate":           "candidate",
		"baseline":            "baseline",
		"intent":              "Improve app chat behavior.",
		"intentProfile":       map[string]any{},
		"commands":            []any{},
		"commandObservations": []any{},
		"modeRuns": []any{
			map[string]any{
				"mode":   "held_out",
				"status": "completed",
				"proof": map[string]any{
					"proofClass":                 "declared-eval-runner",
					"targetSurface":              "app/chat",
					"requiresProductRunnerProof": true,
					"runnerAssessmentState":      "missing-assessment",
				},
			},
		},
		"improved":            []any{},
		"regressed":           []any{},
		"unchanged":           []any{},
		"noisy":               []any{},
		"humanReviewFindings": []any{},
		"recommendation":      "defer",
	}, time.Date(2026, 4, 30, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildReportPacket returned error: %v", err)
	}
	proofSummary := asMap(report["proofSummary"])
	if proofSummary["productRunnerProofReadiness"] != "blocked" {
		t.Fatalf("expected blocked product proof summary, got %#v", proofSummary)
	}
}

func TestOptimizeInputRejectsBlockedProductRunnerProof(t *testing.T) {
	report := map[string]any{
		"schemaVersion":       contracts.ReportPacketSchema,
		"generatedAt":         "2026-04-30T00:00:00Z",
		"candidate":           "candidate",
		"baseline":            "baseline",
		"intent":              "Improve app chat behavior.",
		"intentProfile":       map[string]any{"schemaVersion": contracts.BehaviorIntentSchema, "summary": "Improve app chat behavior.", "behaviorSurface": BehaviorSurfaces["OPERATOR_BEHAVIOR"]},
		"commands":            []any{},
		"commandObservations": []any{},
		"modesRun":            []any{"held_out"},
		"modeSummaries":       []any{map[string]any{"mode": "held_out", "status": "completed"}},
		"telemetry":           map[string]any{},
		"improved":            []any{},
		"regressed":           []any{},
		"unchanged":           []any{},
		"noisy":               []any{},
		"humanReviewFindings": []any{},
		"recommendation":      "accept-now",
		"proofSummary": map[string]any{
			"requiresProductRunnerProof":  true,
			"productRunnerProofReadiness": "blocked",
		},
	}
	if err := requireOptimizeRunnerProof(report); err == nil || !strings.Contains(err.Error(), "runner-backed product proof") {
		t.Fatalf("expected optimize proof gate error, got %v", err)
	}
}
