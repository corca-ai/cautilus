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

func validRepoSkillFixture() map[string]any {
	return map[string]any{
		"schemaVersion":    contracts.EvaluationInputSchema,
		"surface":          "repo",
		"preset":           "skill",
		"suiteId":          "demo-skill",
		"suiteDisplayName": "Demo Skill",
		"skillId":          "demo",
		"skillDisplayName": "Demo",
		"cases": []any{
			map[string]any{
				"caseId":          "trigger-demo",
				"evaluationKind":  "trigger",
				"prompt":          "Use $demo here.",
				"expectedTrigger": "must_invoke",
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
	if result.SuiteID != "demo" {
		t.Fatalf("SuiteID got %q want %q", result.SuiteID, "demo")
	}
	if result.TranslatedCases["schemaVersion"] != contracts.EvaluationCasesSchema {
		t.Fatalf("translated suite must use the existing case-suite schema")
	}
	evaluations, ok := result.TranslatedCases["evaluations"].([]any)
	if !ok || len(evaluations) != 1 {
		t.Fatalf("expected 1 translated evaluation, got %#v", result.TranslatedCases["evaluations"])
	}
	first := evaluations[0].(map[string]any)
	if first["evaluationId"] != "case-one" {
		t.Fatalf("expected caseId to translate into evaluationId, got %#v", first)
	}
}

func TestNormalizeEvaluationInputAcceptsRepoSkill(t *testing.T) {
	result, err := NormalizeEvaluationInput(validRepoSkillFixture())
	if err != nil {
		t.Fatalf("expected success, got error: %v", err)
	}
	if result.Surface != "repo" || result.Preset != "skill" {
		t.Fatalf("unexpected surface/preset: %s/%s", result.Surface, result.Preset)
	}
	if result.SuiteID != "demo-skill" {
		t.Fatalf("SuiteID got %q want %q", result.SuiteID, "demo-skill")
	}
	if result.TranslatedCases["schemaVersion"] != contracts.SkillTestCasesSchema {
		t.Fatalf("translated suite must use the existing skill-test-cases schema, got %v", result.TranslatedCases["schemaVersion"])
	}
	if result.TranslatedCases["skillId"] != "demo" {
		t.Fatalf("translated skillId got %v want demo", result.TranslatedCases["skillId"])
	}
	cases, ok := result.TranslatedCases["cases"].([]any)
	if !ok || len(cases) != 1 {
		t.Fatalf("expected 1 translated case, got %#v", result.TranslatedCases["cases"])
	}
	first := cases[0].(map[string]any)
	if first["caseId"] != "trigger-demo" {
		t.Fatalf("expected caseId to round-trip, got %#v", first)
	}
}

func TestNormalizeEvaluationInputSkillDefaultsSkillIdFromSuiteId(t *testing.T) {
	fixture := validRepoSkillFixture()
	delete(fixture, "skillId")
	delete(fixture, "skillDisplayName")
	result, err := NormalizeEvaluationInput(fixture)
	if err != nil {
		t.Fatalf("expected success, got error: %v", err)
	}
	if result.TranslatedCases["skillId"] != "demo-skill" {
		t.Fatalf("expected skillId to default to suiteId, got %v", result.TranslatedCases["skillId"])
	}
}

func TestNormalizeEvaluationInputSkillForwardsRepeatConsensus(t *testing.T) {
	fixture := validRepoSkillFixture()
	fixture["repeatCount"] = 3
	fixture["minConsensusCount"] = 2
	result, err := NormalizeEvaluationInput(fixture)
	if err != nil {
		t.Fatalf("expected success, got error: %v", err)
	}
	if result.TranslatedCases["repeatCount"] != 3 {
		t.Fatalf("expected repeatCount=3, got %v", result.TranslatedCases["repeatCount"])
	}
	if result.TranslatedCases["minConsensusCount"] != 2 {
		t.Fatalf("expected minConsensusCount=2, got %v", result.TranslatedCases["minConsensusCount"])
	}
}

func TestNormalizeEvaluationInputSkillRejectsTriggerWithoutExpected(t *testing.T) {
	fixture := validRepoSkillFixture()
	cases := fixture["cases"].([]any)
	caseEntry := cases[0].(map[string]any)
	delete(caseEntry, "expectedTrigger")
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "expectedTrigger") {
		t.Fatalf("expected trigger validation error, got %v", err)
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
	fixture["preset"] = "made-up"
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

func TestNormalizeEvaluationInputSkillRejectsSnapshotExpectation(t *testing.T) {
	fixture := validRepoSkillFixture()
	cases := fixture["cases"].([]any)
	caseEntry := cases[0].(map[string]any)
	caseEntry["expected"] = map[string]any{"snapshot": "./golden.json"}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "C4") {
		t.Fatalf("expected snapshot C4 stub error, got %v", err)
	}
}

func TestNormalizeEvaluationInputSkillRejectsNonSnapshotExpected(t *testing.T) {
	fixture := validRepoSkillFixture()
	cases := fixture["cases"].([]any)
	caseEntry := cases[0].(map[string]any)
	caseEntry["expected"] = map[string]any{"trigger": "must_invoke"}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "expected") {
		t.Fatalf("expected non-snapshot expected to be rejected, got %v", err)
	}
}

func TestNormalizeEvaluationInputSkillRejectsExtends(t *testing.T) {
	fixture := validRepoSkillFixture()
	fixture["extends"] = "./base.fixture.json"
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "C2") {
		t.Fatalf("expected extends C2 stub error, got %v", err)
	}
}

func TestNormalizeEvaluationInputSkillRejectsSteps(t *testing.T) {
	fixture := validRepoSkillFixture()
	fixture["steps"] = []any{}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "C3") {
		t.Fatalf("expected steps C3 stub error, got %v", err)
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
