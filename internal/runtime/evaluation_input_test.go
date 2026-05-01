package runtime

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/corca-ai/cautilus/internal/contracts"
)

func validDevRepoFixture() map[string]any {
	return map[string]any{
		"schemaVersion": contracts.EvaluationInputSchema,
		"surface":       "dev",
		"preset":        "repo",
		"suiteId":       "demo",
		"cases": []any{
			map[string]any{
				"caseId":            "case-one",
				"prompt":            "Read the repo instructions and decide.",
				"expectedEntryFile": "AGENTS.md",
				"expectedRouting": map[string]any{
					"bootstrapHelper": "find-skills",
					"workSkill":       "none",
				},
			},
		},
	}
}

func validDevSkillFixture() map[string]any {
	return map[string]any{
		"schemaVersion":    contracts.EvaluationInputSchema,
		"surface":          "dev",
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

func TestNormalizeEvaluationInputAcceptsDevRepo(t *testing.T) {
	result, err := NormalizeEvaluationInput(validDevRepoFixture())
	if err != nil {
		t.Fatalf("expected success, got error: %v", err)
	}
	if result.Surface != "dev" || result.Preset != "repo" {
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

func TestNormalizeEvaluationInputAcceptsDevSkill(t *testing.T) {
	result, err := NormalizeEvaluationInput(validDevSkillFixture())
	if err != nil {
		t.Fatalf("expected success, got error: %v", err)
	}
	if result.Surface != "dev" || result.Preset != "skill" {
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

func TestNormalizeEvaluationInputAcceptsDevSkillEpisodeTurns(t *testing.T) {
	fixture := validDevSkillFixture()
	cases := fixture["cases"].([]any)
	cases[0] = map[string]any{
		"caseId":         "episode-demo",
		"evaluationKind": "execution",
		"turns": []any{
			map[string]any{"input": "$demo", "injectSkill": true},
			map[string]any{"input": "1"},
		},
		"auditKind": "cautilus_refresh_flow",
	}
	result, err := NormalizeEvaluationInput(fixture)
	if err != nil {
		t.Fatalf("expected success, got error: %v", err)
	}
	casesOut := result.TranslatedCases["cases"].([]any)
	first := casesOut[0].(map[string]any)
	if first["prompt"] != "Multi-turn episode starting with: $demo" {
		t.Fatalf("expected synthesized prompt, got %#v", first["prompt"])
	}
	if len(first["turns"].([]any)) != 2 || first["auditKind"] != "cautilus_refresh_flow" {
		t.Fatalf("expected turns and auditKind to round-trip, got %#v", first)
	}
}

func TestNormalizeEvaluationInputRejectsDevSkillTurnsOnTrigger(t *testing.T) {
	fixture := validDevSkillFixture()
	cases := fixture["cases"].([]any)
	caseEntry := cases[0].(map[string]any)
	caseEntry["turns"] = []any{map[string]any{"input": "$demo"}}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "turns") {
		t.Fatalf("expected turns trigger validation error, got %v", err)
	}
}

func TestNormalizeEvaluationInputSkillDefaultsSkillIdFromSuiteId(t *testing.T) {
	fixture := validDevSkillFixture()
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
	fixture := validDevSkillFixture()
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
	fixture := validDevSkillFixture()
	cases := fixture["cases"].([]any)
	caseEntry := cases[0].(map[string]any)
	delete(caseEntry, "expectedTrigger")
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "expectedTrigger") {
		t.Fatalf("expected trigger validation error, got %v", err)
	}
}

func TestNormalizeEvaluationInputRejectsWrongSchemaVersion(t *testing.T) {
	fixture := validDevRepoFixture()
	fixture["schemaVersion"] = "cautilus.something.v0"
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "schemaVersion must be") {
		t.Fatalf("expected schema version error, got %v", err)
	}
}

func TestNormalizeEvaluationInputRejectsUnsupportedSurface(t *testing.T) {
	fixture := validDevRepoFixture()
	fixture["surface"] = "no-such-surface"
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "surface") {
		t.Fatalf("expected surface error, got %v", err)
	}
}

func TestNormalizeEvaluationInputRejectsUnsupportedPreset(t *testing.T) {
	fixture := validDevRepoFixture()
	fixture["preset"] = "made-up"
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "preset") {
		t.Fatalf("expected preset error, got %v", err)
	}
}

func TestNormalizeEvaluationInputRejectsCrossAxisCombo(t *testing.T) {
	fixture := validDevRepoFixture()
	fixture["surface"] = "dev"
	fixture["preset"] = "chat"
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "preset") {
		t.Fatalf("expected cross-axis preset error (dev/chat), got %v", err)
	}
	fixture = validDevRepoFixture()
	fixture["surface"] = "app"
	fixture["preset"] = "skill"
	_, err = NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "preset") {
		t.Fatalf("expected cross-axis preset error (app/skill), got %v", err)
	}
}

func TestNormalizeEvaluationInputRejectsExtends(t *testing.T) {
	fixture := validDevRepoFixture()
	fixture["extends"] = "./base.fixture.json"
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "file-backed") {
		t.Fatalf("expected file-backed extends error, got %v", err)
	}
}

func TestNormalizeEvaluationInputFromFileAppliesExtends(t *testing.T) {
	root := t.TempDir()
	base := validDevRepoFixture()
	base["suiteId"] = "base-suite"
	base["suiteDisplayName"] = "Base Suite"
	base["metadata"] = map[string]any{
		"owner": "base",
		"labels": map[string]any{
			"tier": "smoke",
		},
	}
	child := map[string]any{
		"schemaVersion": contracts.EvaluationInputSchema,
		"extends":       "./base.fixture.json",
		"suiteId":       "child-suite",
		"metadata": map[string]any{
			"labels": map[string]any{
				"surface": "dev/repo",
			},
		},
		"cases": []any{
			map[string]any{
				"caseId":            "case-child",
				"prompt":            "Read the child instructions.",
				"expectedEntryFile": "CLAUDE.md",
				"expectedRouting": map[string]any{
					"bootstrapHelper": "find-skills",
					"workSkill":       "impl",
				},
			},
		},
	}
	writeEvaluationFixture(t, filepath.Join(root, "base.fixture.json"), base)
	writeEvaluationFixture(t, filepath.Join(root, "child.fixture.json"), child)

	result, err := NormalizeEvaluationInputFromFile(filepath.Join(root, "child.fixture.json"))
	if err != nil {
		t.Fatalf("expected extends to normalize, got %v", err)
	}
	if result.SuiteID != "child-suite" || result.SuiteDisplayName != "Base Suite" {
		t.Fatalf("unexpected suite inheritance: %#v", result)
	}
	evaluations := result.TranslatedCases["evaluations"].([]any)
	if len(evaluations) != 1 || evaluations[0].(map[string]any)["evaluationId"] != "case-child" {
		t.Fatalf("expected child cases to replace base cases, got %#v", evaluations)
	}
}

func TestNormalizeEvaluationInputRejectsSteps(t *testing.T) {
	fixture := validDevRepoFixture()
	fixture["steps"] = []any{}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "C3") {
		t.Fatalf("expected steps C3 stub error, got %v", err)
	}
}

func TestNormalizeEvaluationInputRejectsSnapshotExpectation(t *testing.T) {
	fixture := validDevRepoFixture()
	cases := fixture["cases"].([]any)
	caseEntry := cases[0].(map[string]any)
	caseEntry["expected"] = map[string]any{"snapshot": "./golden.json"}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "C4") {
		t.Fatalf("expected snapshot C4 stub error, got %v", err)
	}
}

func TestNormalizeEvaluationInputSkillRejectsSnapshotExpectation(t *testing.T) {
	fixture := validDevSkillFixture()
	cases := fixture["cases"].([]any)
	caseEntry := cases[0].(map[string]any)
	caseEntry["expected"] = map[string]any{"snapshot": "./golden.json"}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "C4") {
		t.Fatalf("expected snapshot C4 stub error, got %v", err)
	}
}

func TestNormalizeEvaluationInputSkillRejectsNonSnapshotExpected(t *testing.T) {
	fixture := validDevSkillFixture()
	cases := fixture["cases"].([]any)
	caseEntry := cases[0].(map[string]any)
	caseEntry["expected"] = map[string]any{"trigger": "must_invoke"}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "expected") {
		t.Fatalf("expected non-snapshot expected to be rejected, got %v", err)
	}
}

func TestNormalizeEvaluationInputSkillRejectsExtends(t *testing.T) {
	fixture := validDevSkillFixture()
	fixture["extends"] = "./base.fixture.json"
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "file-backed") {
		t.Fatalf("expected file-backed extends error, got %v", err)
	}
}

func TestNormalizeEvaluationInputSkillRejectsSteps(t *testing.T) {
	fixture := validDevSkillFixture()
	fixture["steps"] = []any{}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "C3") {
		t.Fatalf("expected steps C3 stub error, got %v", err)
	}
}

func validAppChatFixture() map[string]any {
	return map[string]any{
		"schemaVersion":    contracts.EvaluationInputSchema,
		"surface":          "app",
		"preset":           "chat",
		"suiteId":          "demo-chat",
		"suiteDisplayName": "Demo Chat",
		"provider":         "anthropic",
		"model":            "claude-sonnet-4-6",
		"system":           "You are a careful assistant.",
		"cases": []any{
			map[string]any{
				"caseId":      "say-hello",
				"displayName": "Greeting",
				"messages": []any{
					map[string]any{"role": "user", "content": "Say hello in one short sentence."},
				},
				"expected": map[string]any{"finalText": "hello"},
			},
		},
	}
}

func TestNormalizeEvaluationInputAcceptsAppChat(t *testing.T) {
	result, err := NormalizeEvaluationInput(validAppChatFixture())
	if err != nil {
		t.Fatalf("expected success, got error: %v", err)
	}
	if result.Surface != "app" || result.Preset != "chat" {
		t.Fatalf("unexpected surface/preset: %s/%s", result.Surface, result.Preset)
	}
	if result.SuiteID != "demo-chat" {
		t.Fatalf("SuiteID got %q want %q", result.SuiteID, "demo-chat")
	}
	if result.TranslatedCases["schemaVersion"] != contracts.AppChatTestCasesSchema {
		t.Fatalf("translated suite must use the app/chat case-suite schema, got %v", result.TranslatedCases["schemaVersion"])
	}
	if result.TranslatedCases["provider"] != "anthropic" {
		t.Fatalf("expected provider to round-trip, got %v", result.TranslatedCases["provider"])
	}
	if result.TranslatedCases["model"] != "claude-sonnet-4-6" {
		t.Fatalf("expected model to round-trip, got %v", result.TranslatedCases["model"])
	}
	if result.TranslatedCases["system"] != "You are a careful assistant." {
		t.Fatalf("expected system prompt to round-trip, got %v", result.TranslatedCases["system"])
	}
	cases, ok := result.TranslatedCases["cases"].([]any)
	if !ok || len(cases) != 1 {
		t.Fatalf("expected 1 translated case, got %#v", result.TranslatedCases["cases"])
	}
}

func TestNormalizeEvaluationInputAppChatRequiresProviderAndModel(t *testing.T) {
	fixture := validAppChatFixture()
	delete(fixture, "provider")
	if _, err := NormalizeEvaluationInput(fixture); err == nil || !strings.Contains(err.Error(), "provider") {
		t.Fatalf("expected provider error, got %v", err)
	}
	fixture = validAppChatFixture()
	delete(fixture, "model")
	if _, err := NormalizeEvaluationInput(fixture); err == nil || !strings.Contains(err.Error(), "model") {
		t.Fatalf("expected model error, got %v", err)
	}
}

func TestNormalizeEvaluationInputAppChatRequiresUserTerminalMessage(t *testing.T) {
	fixture := validAppChatFixture()
	cases := fixture["cases"].([]any)
	cases[0].(map[string]any)["messages"] = []any{
		map[string]any{"role": "user", "content": "Hi."},
		map[string]any{"role": "assistant", "content": "Hello."},
	}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "user role") {
		t.Fatalf("expected trailing-user error, got %v", err)
	}
}

func TestNormalizeEvaluationInputAppChatRejectsSnapshotExpectation(t *testing.T) {
	fixture := validAppChatFixture()
	cases := fixture["cases"].([]any)
	cases[0].(map[string]any)["expected"] = map[string]any{"snapshot": "./golden.json"}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "C4") {
		t.Fatalf("expected snapshot C4 stub error, got %v", err)
	}
}

func TestNormalizeEvaluationInputAppChatRejectsRoleOther(t *testing.T) {
	fixture := validAppChatFixture()
	cases := fixture["cases"].([]any)
	cases[0].(map[string]any)["messages"] = []any{
		map[string]any{"role": "system", "content": "..."},
	}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "role must be") {
		t.Fatalf("expected role enum error, got %v", err)
	}
}

func TestNormalizeEvaluationInputAppChatRejectsExpectedWithoutFinalText(t *testing.T) {
	fixture := validAppChatFixture()
	cases := fixture["cases"].([]any)
	cases[0].(map[string]any)["expected"] = map[string]any{}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "finalText") {
		t.Fatalf("expected finalText requirement error, got %v", err)
	}
}

func TestNormalizeEvaluationInputAppChatRejectsExtends(t *testing.T) {
	fixture := validAppChatFixture()
	fixture["extends"] = "./base.fixture.json"
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "file-backed") {
		t.Fatalf("expected file-backed extends error, got %v", err)
	}
}

func TestNormalizeEvaluationInputAppChatRejectsSteps(t *testing.T) {
	fixture := validAppChatFixture()
	fixture["steps"] = []any{}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "C3") {
		t.Fatalf("expected steps C3 stub error, got %v", err)
	}
}

func validAppPromptFixture() map[string]any {
	return map[string]any{
		"schemaVersion":    contracts.EvaluationInputSchema,
		"surface":          "app",
		"preset":           "prompt",
		"suiteId":          "demo-prompt",
		"suiteDisplayName": "Demo Prompt",
		"provider":         "anthropic",
		"model":            "claude-sonnet-4-6",
		"system":           "You are a careful assistant.",
		"cases": []any{
			map[string]any{
				"caseId":      "summarize-one-line",
				"displayName": "One-line summary",
				"input":       "Summarize: Cautilus evaluates behavior.",
				"expected":    map[string]any{"finalText": "behavior"},
			},
		},
	}
}

func TestNormalizeEvaluationInputAcceptsAppPrompt(t *testing.T) {
	result, err := NormalizeEvaluationInput(validAppPromptFixture())
	if err != nil {
		t.Fatalf("expected success, got error: %v", err)
	}
	if result.Surface != "app" || result.Preset != "prompt" {
		t.Fatalf("unexpected surface/preset: %s/%s", result.Surface, result.Preset)
	}
	if result.SuiteID != "demo-prompt" {
		t.Fatalf("SuiteID got %q want %q", result.SuiteID, "demo-prompt")
	}
	if result.TranslatedCases["schemaVersion"] != contracts.AppPromptTestCasesSchema {
		t.Fatalf("translated suite must use the app/prompt case-suite schema, got %v", result.TranslatedCases["schemaVersion"])
	}
	cases, ok := result.TranslatedCases["cases"].([]any)
	if !ok || len(cases) != 1 {
		t.Fatalf("expected 1 translated case, got %#v", result.TranslatedCases["cases"])
	}
	first := cases[0].(map[string]any)
	if first["input"] != "Summarize: Cautilus evaluates behavior." {
		t.Fatalf("expected input to round-trip, got %#v", first)
	}
}

func TestNormalizeEvaluationInputAppPromptRequiresInput(t *testing.T) {
	fixture := validAppPromptFixture()
	cases := fixture["cases"].([]any)
	delete(cases[0].(map[string]any), "input")
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "input") {
		t.Fatalf("expected input requirement error, got %v", err)
	}
}

func TestNormalizeEvaluationInputAppPromptRejectsSnapshotExpectation(t *testing.T) {
	fixture := validAppPromptFixture()
	cases := fixture["cases"].([]any)
	cases[0].(map[string]any)["expected"] = map[string]any{"snapshot": "./golden.json"}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "C4") {
		t.Fatalf("expected snapshot C4 stub error, got %v", err)
	}
}

func TestNormalizeEvaluationInputAppPromptRejectsExtends(t *testing.T) {
	fixture := validAppPromptFixture()
	fixture["extends"] = "./base.fixture.json"
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "file-backed") {
		t.Fatalf("expected file-backed extends error, got %v", err)
	}
}

func TestNormalizeEvaluationInputAppPromptRejectsSteps(t *testing.T) {
	fixture := validAppPromptFixture()
	fixture["steps"] = []any{}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "C3") {
		t.Fatalf("expected steps C3 stub error, got %v", err)
	}
}

func TestNormalizeEvaluationInputRejectsEmptyCases(t *testing.T) {
	fixture := validDevRepoFixture()
	fixture["cases"] = []any{}
	_, err := NormalizeEvaluationInput(fixture)
	if err == nil || !strings.Contains(err.Error(), "cases must be a non-empty") {
		t.Fatalf("expected empty cases error, got %v", err)
	}
}

func writeEvaluationFixture(t *testing.T, path string, value map[string]any) {
	t.Helper()
	payload, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		t.Fatalf("MarshalIndent returned error: %v", err)
	}
	if err := os.WriteFile(path, append(payload, '\n'), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
}
