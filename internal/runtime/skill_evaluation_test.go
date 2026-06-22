package runtime

import (
	"testing"
	"time"
)

func TestBuildSkillEvaluationSummaryUsesCacheExcludedTokenThreshold(t *testing.T) {
	summary, err := BuildSkillEvaluationSummary(map[string]any{
		"schemaVersion": "cautilus.skill_evaluation_inputs.v1",
		"skillId":       "impl",
		"evaluations": []any{
			map[string]any{
				"evaluationId":   "exec-cache-heavy",
				"targetKind":     "public_skill",
				"targetId":       "impl",
				"displayName":    "impl",
				"evaluationKind": "execution",
				"prompt":         "Apply one bounded implementation slice and verify it.",
				"startedAt":      "2026-06-22T00:00:00.000Z",
				"invoked":        true,
				"outcome":        "passed",
				"summary":        "The skill completed the task.",
				"metrics": map[string]any{
					"total_tokens": float64(9000),
					"duration_ms":  float64(1200),
				},
				"telemetry": map[string]any{
					"cache_read_input_tokens": float64(8500),
				},
				"thresholds": map[string]any{
					"max_uncached_tokens": float64(400),
				},
			},
		},
	}, time.Date(2026, 6, 22, 0, 30, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildSkillEvaluationSummary returned error: %v", err)
	}
	counts := asMap(summary["evaluationCounts"])
	if got := counts["degraded"]; got != 1 {
		t.Fatalf("expected one degraded evaluation, got %#v", counts)
	}
	evaluation := asMap(summary["evaluations"].([]any)[0])
	findings := evaluation["thresholdFindings"].([]any)
	if len(findings) != 1 {
		t.Fatalf("expected one threshold finding, got %#v", findings)
	}
	finding := asMap(findings[0])
	if finding["metric"] != "uncached_tokens" {
		t.Fatalf("unexpected threshold metric: %#v", finding)
	}
	if finding["actual"] != float64(500) {
		t.Fatalf("unexpected uncached token actual: %#v", finding)
	}
}

func TestBuildSkillEvaluationSummaryDoesNotReuseCandidateTelemetryForBaseline(t *testing.T) {
	summary, err := BuildSkillEvaluationSummary(map[string]any{
		"schemaVersion": "cautilus.skill_evaluation_inputs.v1",
		"skillId":       "impl",
		"evaluations": []any{
			map[string]any{
				"evaluationId":   "exec-baseline-cache-heavy",
				"targetKind":     "public_skill",
				"targetId":       "impl",
				"displayName":    "impl",
				"evaluationKind": "execution",
				"prompt":         "Apply one bounded implementation slice and verify it.",
				"startedAt":      "2026-06-22T00:00:00.000Z",
				"invoked":        true,
				"outcome":        "passed",
				"summary":        "The skill completed the task.",
				"metrics": map[string]any{
					"total_tokens": float64(9000),
				},
				"telemetry": map[string]any{
					"cache_read_input_tokens": float64(8600),
				},
				"thresholds": map[string]any{
					"max_uncached_tokens": float64(500),
				},
				"baseline": map[string]any{
					"invoked": true,
					"outcome": "passed",
					"metrics": map[string]any{
						"total_tokens": float64(9000),
					},
				},
			},
		},
	}, time.Date(2026, 6, 22, 0, 30, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildSkillEvaluationSummary returned error: %v", err)
	}
	evaluation := asMap(summary["evaluations"].([]any)[0])
	if got := evaluation["status"]; got != "passed" {
		t.Fatalf("unexpected current status: %#v", got)
	}
	comparison := asMap(evaluation["baselineComparison"])
	if got := comparison["baselineStatus"]; got != "degraded" {
		t.Fatalf("unexpected baseline status: %#v", comparison)
	}
	if got := comparison["relativeStatus"]; got != "better" {
		t.Fatalf("unexpected relative status: %#v", comparison)
	}
}
