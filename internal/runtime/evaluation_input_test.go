package runtime

import (
	"strings"
	"testing"

	"github.com/corca-ai/cautilus/internal/contracts"
)

func validRepoWholeRepoFixture() map[string]any {
	return map[string]any{
		"schemaVersion": contracts.EvaluationInputSchema,
		"surface":       "repo",
		"preset":        "whole-repo",
		"suiteId":       "demo",
		"cases": []any{
			map[string]any{
				"caseId":            "case-one",
				"prompt":            "Read the repo instructions and decide.",
				"expectedEntryFile": "AGENTS.md",
				"expectedRouting": map[string]any{
					"selectedSkill": "none",
				},
			},
		},
	}
}

func TestNormalizeEvaluationInputAcceptsRepoWholeRepo(t *testing.T) {
	result, err := NormalizeEvaluationInput(validRepoWholeRepoFixture())
	if err != nil {
		t.Fatalf("expected success, got error: %v", err)
	}
	if result.Surface != "repo" || result.Preset != "whole-repo" {
		t.Fatalf("unexpected surface/preset: %s/%s", result.Surface, result.Preset)
	}
	if result.CaseSuite == nil {
		t.Fatalf("CaseSuite is nil")
	}
	if got, want := result.CaseSuite.SuiteID, "demo"; got != want {
		t.Fatalf("SuiteID got %q want %q", got, want)
	}
	if len(result.CaseSuite.Evaluations) != 1 {
		t.Fatalf("expected 1 evaluation, got %d", len(result.CaseSuite.Evaluations))
	}
	if got, want := result.CaseSuite.Evaluations[0].EvaluationID, "case-one"; got != want {
		t.Fatalf("EvaluationID got %q want %q", got, want)
	}
	if result.TranslatedCases["schemaVersion"] != contracts.InstructionSurfaceCasesSchema {
		t.Fatalf("translated suite must use the existing case-suite schema")
	}
}

func TestNormalizeEvaluationInputRejectsWrongSchemaVersion(t *testing.T) {
	fixture := validRepoWholeRepoFixture()
	fixture["schemaVersion"] = "cautilus.something.v0"
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "schemaVersion must be") {
		t.Fatalf("expected schema version error, got %v", err)
	}
}

func TestNormalizeEvaluationInputRejectsUnsupportedSurface(t *testing.T) {
	fixture := validRepoWholeRepoFixture()
	fixture["surface"] = "app"
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "surface") {
		t.Fatalf("expected surface error, got %v", err)
	}
}

func TestNormalizeEvaluationInputRejectsUnsupportedPreset(t *testing.T) {
	fixture := validRepoWholeRepoFixture()
	fixture["preset"] = "skill"
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "preset") {
		t.Fatalf("expected preset error, got %v", err)
	}
}

func TestNormalizeEvaluationInputRejectsCrossAxisCombo(t *testing.T) {
	fixture := validRepoWholeRepoFixture()
	fixture["surface"] = "repo"
	fixture["preset"] = "chat"
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "preset") {
		t.Fatalf("expected cross-axis preset error, got %v", err)
	}
}

func TestNormalizeEvaluationInputRejectsExtends(t *testing.T) {
	fixture := validRepoWholeRepoFixture()
	fixture["extends"] = "./base.fixture.json"
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "C2") {
		t.Fatalf("expected extends C2 stub error, got %v", err)
	}
}

func TestNormalizeEvaluationInputRejectsSteps(t *testing.T) {
	fixture := validRepoWholeRepoFixture()
	fixture["steps"] = []any{}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "C3") {
		t.Fatalf("expected steps C3 stub error, got %v", err)
	}
}

func TestNormalizeEvaluationInputRejectsSnapshotExpectation(t *testing.T) {
	fixture := validRepoWholeRepoFixture()
	cases := fixture["cases"].([]any)
	caseEntry := cases[0].(map[string]any)
	caseEntry["expected"] = map[string]any{"snapshot": "./golden.json"}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "C4") {
		t.Fatalf("expected snapshot C4 stub error, got %v", err)
	}
}

func TestNormalizeEvaluationInputRejectsEmptyCases(t *testing.T) {
	fixture := validRepoWholeRepoFixture()
	fixture["cases"] = []any{}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "cases must be a non-empty") {
		t.Fatalf("expected empty cases error, got %v", err)
	}
}
