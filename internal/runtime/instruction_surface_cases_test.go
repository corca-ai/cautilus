package runtime

import "testing"

func TestNormalizeEvaluationCasesAcceptsFileAndSymlinkVariants(t *testing.T) {
	suite, err := NormalizeEvaluationCases(map[string]any{
		"schemaVersion": "cautilus.evaluation_cases.v1",
		"suiteId":       "instruction-surface-demo",
		"evaluations": []any{
			map[string]any{
				"evaluationId": "claude-symlink",
				"prompt":       "Read the repo instructions first.",
				"instructionSurface": map[string]any{
					"surfaceLabel": "claude-symlink",
					"files": []any{
						map[string]any{
							"path":    "CLAUDE.md",
							"content": "# CLAUDE\nUse discovery first.\n",
						},
						map[string]any{
							"path":       "AGENTS.md",
							"kind":       "symlink",
							"targetPath": "CLAUDE.md",
						},
					},
				},
				"expectedEntryFile":        "AGENTS.md",
				"requiredInstructionFiles": []any{"AGENTS.md", "CLAUDE.md"},
				"allowedFirstToolCalls":    []any{"none", "functions.exec_command"},
				"expectedRouting": map[string]any{
					"bootstrapHelper": "charness:find-skills",
					"workSkill":       "charness:impl",
				},
			},
		},
	})
	if err != nil {
		t.Fatalf("NormalizeEvaluationCases returned error: %v", err)
	}
	if suite.SuiteID != "instruction-surface-demo" {
		t.Fatalf("unexpected suite id: %#v", suite.SuiteID)
	}
	if got := suite.Evaluations[0].InstructionSurface.Files[1].Kind; got != "symlink" {
		t.Fatalf("expected symlink kind, got %q", got)
	}
	if got := *suite.Evaluations[0].InstructionSurface.Files[1].TargetPath; got != "CLAUDE.md" {
		t.Fatalf("unexpected symlink target: %q", got)
	}
	if got := suite.Evaluations[0].AllowedFirstToolCalls; len(got) != 2 || got[1] != "functions.exec_command" {
		t.Fatalf("expected allowed first tool calls to normalize, got %#v", got)
	}
}

func TestNormalizeEvaluationCasesRejectsBrokenFileSpec(t *testing.T) {
	_, err := NormalizeEvaluationCases(map[string]any{
		"schemaVersion": "cautilus.evaluation_cases.v1",
		"suiteId":       "instruction-surface-demo",
		"evaluations": []any{
			map[string]any{
				"evaluationId": "broken",
				"prompt":       "Read the repo instructions first.",
				"instructionSurface": map[string]any{
					"files": []any{
						map[string]any{
							"path":       "AGENTS.md",
							"kind":       "symlink",
							"content":    "bad",
							"targetPath": "CLAUDE.md",
						},
					},
				},
			},
		},
	})
	if err == nil {
		t.Fatal("expected invalid symlink spec to fail")
	}
}
