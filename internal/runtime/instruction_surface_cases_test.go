package runtime

import "testing"

func TestNormalizeInstructionSurfaceCaseSuiteAcceptsFileAndSymlinkVariants(t *testing.T) {
	suite, err := NormalizeInstructionSurfaceCaseSuite(map[string]any{
		"schemaVersion": "cautilus.instruction_surface_cases.v1",
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
				"expectedRouting": map[string]any{
					"selectedSkill": "find-skills",
				},
			},
		},
	})
	if err != nil {
		t.Fatalf("NormalizeInstructionSurfaceCaseSuite returned error: %v", err)
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
}

func TestNormalizeInstructionSurfaceCaseSuiteRejectsBrokenFileSpec(t *testing.T) {
	_, err := NormalizeInstructionSurfaceCaseSuite(map[string]any{
		"schemaVersion": "cautilus.instruction_surface_cases.v1",
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
