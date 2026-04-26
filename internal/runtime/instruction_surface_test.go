package runtime

import (
	"testing"
	"time"
)

func TestBuildEvaluationSummaryScoresRoutingAndFiles(t *testing.T) {
	now := time.Date(2026, 4, 18, 0, 0, 0, 0, time.UTC)
	summary, err := BuildEvaluationSummary(map[string]any{
		"schemaVersion": "cautilus.evaluation_observed.v1",
		"suiteId":       "instruction-surface-demo",
		"evaluations": []any{
			map[string]any{
				"evaluationId":           "compact-agents-pass",
				"displayName":            "compact agents pass",
				"prompt":                 "Read the routing instructions first.",
				"startedAt":              "2026-04-18T00:00:00Z",
				"observationStatus":      "observed",
				"summary":                "Started from AGENTS.md and chose discovery first.",
				"entryFile":              "AGENTS.md",
				"loadedInstructionFiles": []any{"AGENTS.md"},
				"loadedSupportingFiles":  []any{"docs/internal/handoff.md"},
				"routingDecision": map[string]any{
					"bootstrapHelper": "charness:find-skills",
					"workSkill":       "charness:impl",
					"firstToolCall":   "functions.exec_command",
				},
				"instructionSurface": map[string]any{
					"surfaceLabel": "compact_agents",
					"files": []any{
						map[string]any{"path": "AGENTS.md", "kind": "file", "sourceKind": "workspace_default"},
					},
				},
				"expectedEntryFile":        "AGENTS.md",
				"requiredInstructionFiles": []any{"AGENTS.md"},
				"requiredSupportingFiles":  []any{"docs/internal/handoff.md"},
				"expectedRouting": map[string]any{
					"bootstrapHelper":      "charness:find-skills",
					"workSkill":            "charness:impl",
					"firstToolCallPattern": "functions.exec_command",
				},
				"artifactRefs": []any{},
			},
			map[string]any{
				"evaluationId":           "expanded-agents-fail",
				"displayName":            "expanded agents fail",
				"prompt":                 "Read the routing instructions first.",
				"startedAt":              "2026-04-18T00:01:00Z",
				"observationStatus":      "observed",
				"summary":                "Skipped the nested follow-up doc.",
				"entryFile":              "AGENTS.md",
				"loadedInstructionFiles": []any{"AGENTS.md"},
				"loadedSupportingFiles":  []any{},
				"routingDecision": map[string]any{
					"bootstrapHelper": "charness:find-skills",
					"workSkill":       "bug-fixer",
				},
				"instructionSurface": map[string]any{
					"surfaceLabel": "expanded_agents",
					"files": []any{
						map[string]any{"path": "AGENTS.md", "kind": "file", "sourceKind": "inline"},
					},
				},
				"expectedEntryFile":        "AGENTS.md",
				"requiredInstructionFiles": []any{"AGENTS.md", "docs/feature/AGENTS.md"},
				"requiredSupportingFiles":  []any{"docs/internal/handoff.md"},
				"expectedRouting": map[string]any{
					"bootstrapHelper": "charness:find-skills",
					"workSkill":       "charness:impl",
				},
				"artifactRefs": []any{},
			},
		},
	}, now)
	if err != nil {
		t.Fatalf("BuildEvaluationSummary returned error: %v", err)
	}
	if summary["schemaVersion"] != "cautilus.evaluation_summary.v1" {
		t.Fatalf("unexpected schema version: %#v", summary["schemaVersion"])
	}
	if summary["recommendation"] != "reject" {
		t.Fatalf("expected reject recommendation, got %#v", summary["recommendation"])
	}
	counts := asMap(summary["evaluationCounts"])
	if counts["passed"] != 1 || counts["failed"] != 1 {
		t.Fatalf("unexpected evaluation counts: %#v", counts)
	}
	routingSummary := asMap(summary["routingSummary"])
	if routingSummary["matchedExpectedRoute"] != 1 || routingSummary["mismatchedExpectedRoute"] != 1 {
		t.Fatalf("unexpected routing summary: %#v", routingSummary)
	}
	if asMap(routingSummary["bootstrapHelperCounts"])["charness:find-skills"] != 2 {
		t.Fatalf("unexpected bootstrap helper counts: %#v", routingSummary)
	}
	if asMap(routingSummary["workSkillCounts"])["charness:impl"] != 1 || asMap(routingSummary["workSkillCounts"])["bug-fixer"] != 1 {
		t.Fatalf("unexpected work skill counts: %#v", routingSummary)
	}
	surfaceSummary := asMap(summary["surfaceSummary"])
	if surfaceSummary["requiredInstructionFileMisses"] != 1 || surfaceSummary["requiredSupportingFileMisses"] != 1 {
		t.Fatalf("unexpected surface summary: %#v", surfaceSummary)
	}
	evaluations := arrayOrEmpty(summary["evaluations"])
	if len(evaluations) != 2 {
		t.Fatalf("unexpected evaluations: %#v", evaluations)
	}
	if status := stringOrEmpty(asMap(evaluations[1])["status"]); status != "failed" {
		t.Fatalf("expected failed second evaluation, got %q", status)
	}
}

func TestBuildEvaluationSummaryTreatsNamespacedRoutingTokensAsSameSkill(t *testing.T) {
	now := time.Date(2026, 4, 26, 0, 0, 0, 0, time.UTC)
	summary, err := BuildEvaluationSummary(map[string]any{
		"schemaVersion": "cautilus.evaluation_observed.v1",
		"suiteId":       "instruction-surface-demo",
		"evaluations": []any{
			map[string]any{
				"evaluationId":           "namespaced-bootstrap-helper",
				"prompt":                 "Read the routing instructions first.",
				"startedAt":              "2026-04-26T00:00:00Z",
				"observationStatus":      "observed",
				"summary":                "Started from AGENTS.md and used the required bootstrap helper.",
				"entryFile":              "AGENTS.md",
				"loadedInstructionFiles": []any{"AGENTS.md"},
				"loadedSupportingFiles":  []any{},
				"routingDecision": map[string]any{
					"bootstrapHelper": "charness:find-skills",
					"workSkill":       "none",
					"firstToolCall":   "functions.exec_command",
				},
				"instructionSurface": map[string]any{
					"surfaceLabel": "compact_agents",
					"files": []any{
						map[string]any{"path": "AGENTS.md", "kind": "file", "sourceKind": "workspace_default"},
					},
				},
				"expectedEntryFile":        "AGENTS.md",
				"requiredInstructionFiles": []any{"AGENTS.md"},
				"expectedRouting": map[string]any{
					"bootstrapHelper": "find-skills",
					"workSkill":       "none",
				},
				"artifactRefs": []any{},
			},
		},
	}, now)
	if err != nil {
		t.Fatalf("BuildEvaluationSummary returned error: %v", err)
	}
	if summary["recommendation"] != "accept-now" {
		t.Fatalf("expected accept-now recommendation, got %#v", summary["recommendation"])
	}
	counts := asMap(summary["evaluationCounts"])
	if counts["passed"] != 1 || counts["failed"] != 0 {
		t.Fatalf("unexpected evaluation counts: %#v", counts)
	}
}

func TestBuildEvaluationSummaryTreatsDescriptiveEntryFileAsLoadedInstruction(t *testing.T) {
	now := time.Date(2026, 4, 26, 0, 0, 0, 0, time.UTC)
	summary, err := BuildEvaluationSummary(map[string]any{
		"schemaVersion": "cautilus.evaluation_observed.v1",
		"suiteId":       "instruction-surface-demo",
		"evaluations": []any{
			map[string]any{
				"evaluationId":           "descriptive-entry-file",
				"prompt":                 "Read the routing instructions first.",
				"startedAt":              "2026-04-26T00:00:00Z",
				"observationStatus":      "observed",
				"summary":                "Used AGENTS.md from the prompt and then read find-skills.",
				"entryFile":              "AGENTS.md (entry surface provided in the user prompt)",
				"loadedInstructionFiles": []any{"/tmp/find-skills/SKILL.md"},
				"loadedSupportingFiles":  []any{},
				"routingDecision": map[string]any{
					"bootstrapHelper": "find-skills",
					"workSkill":       "none",
				},
				"instructionSurface": map[string]any{
					"surfaceLabel": "compact_agents",
					"files": []any{
						map[string]any{"path": "AGENTS.md", "kind": "file", "sourceKind": "workspace_default"},
					},
				},
				"expectedEntryFile":        "AGENTS.md",
				"requiredInstructionFiles": []any{"AGENTS.md"},
				"expectedRouting": map[string]any{
					"bootstrapHelper": "find-skills",
					"workSkill":       "none",
				},
				"artifactRefs": []any{},
			},
		},
	}, now)
	if err != nil {
		t.Fatalf("BuildEvaluationSummary returned error: %v", err)
	}
	if summary["recommendation"] != "accept-now" {
		t.Fatalf("expected accept-now recommendation, got %#v", summary["recommendation"])
	}
	counts := asMap(summary["evaluationCounts"])
	if counts["passed"] != 1 || counts["failed"] != 0 {
		t.Fatalf("unexpected evaluation counts: %#v", counts)
	}
}
