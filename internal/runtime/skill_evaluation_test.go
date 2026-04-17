package runtime

import (
	"testing"
	"time"
)

func TestBuildSkillEvaluationSummaryTracksRoutingExpectationMismatches(t *testing.T) {
	summary, err := BuildSkillEvaluationSummary(map[string]any{
		"schemaVersion": "cautilus.skill_evaluation_inputs.v1",
		"skillId":       "find-skills",
		"evaluations": []any{
			map[string]any{
				"evaluationId":    "trigger-routing",
				"targetKind":      "public_skill",
				"targetId":        "find-skills",
				"displayName":     "find-skills",
				"evaluationKind":  "trigger",
				"prompt":          "Route this ambiguous prompt through the right shared skill.",
				"startedAt":       "2026-04-14T00:00:00.000Z",
				"expectedTrigger": "must_invoke",
				"expectedRouting": map[string]any{
					"selectedSkill":        "find-skills",
					"firstToolCallPattern": "list_capabilities.py",
				},
				"invoked": true,
				"summary": "The agent routed directly to impl.",
				"routingDecision": map[string]any{
					"selectedSkill":   "impl",
					"selectedSupport": nil,
					"firstToolCall":   "python3 skills/public/impl/scripts/run.py --repo-root .",
					"reasonSummary":   "The task looked implementation-shaped.",
				},
				"instructionSurface": map[string]any{
					"surfaceLabel": "compact-routing",
					"files": []any{
						map[string]any{
							"path":         "AGENTS.md",
							"sourceKind":   "source_file",
							"artifactPath": "artifacts/instruction-surface/AGENTS.md",
						},
					},
				},
			},
		},
	}, time.Date(2026, 4, 14, 1, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildSkillEvaluationSummary returned error: %v", err)
	}
	if got := stringOrEmpty(summary["recommendation"]); got != "reject" {
		t.Fatalf("unexpected recommendation: %#v", summary)
	}
	routingSummary := asMap(summary["routingSummary"])
	if got := intFromAny(routingSummary["mismatchedExpectedRoute"]); got != 1 {
		t.Fatalf("unexpected routing summary: %#v", routingSummary)
	}
	evaluations := arrayOrEmpty(summary["evaluations"])
	if len(evaluations) != 1 {
		t.Fatalf("unexpected evaluations: %#v", evaluations)
	}
	evaluation := asMap(evaluations[0])
	if got := stringOrEmpty(asMap(evaluation["routingEvaluation"])["status"]); got != "mismatched" {
		t.Fatalf("unexpected routing evaluation: %#v", evaluation)
	}
	if got := stringOrEmpty(asMap(evaluation["instructionSurface"])["surfaceLabel"]); got != "compact-routing" {
		t.Fatalf("unexpected instruction surface: %#v", evaluation)
	}
}
