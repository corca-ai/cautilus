package runtime

import (
	"strings"
	"testing"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

func validAppPromptObservedRecord() map[string]any {
	return map[string]any{
		"caseId":      "summarize-one-line",
		"displayName": "One-line summary",
		"provider":    "anthropic",
		"model":       "claude-sonnet-4-6",
		"harness":     "anthropic-direct",
		"mode":        "messaging",
		"durationMs":  1234,
		"observed": map[string]any{
			"input": "Summarize: Cautilus evaluates behavior.",
			"messages": []any{
				map[string]any{"role": "user", "content": "Summarize: Cautilus evaluates behavior."},
				map[string]any{"role": "assistant", "content": "Cautilus evaluates behavior."},
			},
			"finalText": "Cautilus evaluates behavior.",
		},
		"expected": map[string]any{"finalText": "behavior"},
	}
}

func validAppPromptObservedSuite() map[string]any {
	return map[string]any{
		"schemaVersion":    contracts.AppPromptEvaluationInputsSchema,
		"suiteId":          "demo-prompt",
		"suiteDisplayName": "Demo Prompt",
		"evaluations":      []any{validAppPromptObservedRecord()},
	}
}

func TestBuildAppPromptEvaluationSummaryAcceptsMatch(t *testing.T) {
	now := time.Date(2026, time.April, 26, 10, 0, 0, 0, time.UTC)
	summary, err := BuildAppPromptEvaluationSummary(validAppPromptObservedSuite(), now)
	if err != nil {
		t.Fatalf("expected success, got error: %v", err)
	}
	if summary["schemaVersion"] != contracts.AppPromptEvaluationSummarySchema {
		t.Fatalf("expected app/prompt summary schema, got %v", summary["schemaVersion"])
	}
	if summary["recommendation"] != "accept-now" {
		t.Fatalf("expected accept-now, got %v", summary["recommendation"])
	}
	first := summary["evaluations"].([]any)[0].(map[string]any)
	if first["status"] != "passed" || first["match"] != true {
		t.Fatalf("expected passing match, got %#v", first)
	}
	observed := first["observed"].(map[string]any)
	if observed["input"] != "Summarize: Cautilus evaluates behavior." {
		t.Fatalf("expected observed input to round-trip, got %#v", observed)
	}
}

func TestBuildAppPromptEvaluationSummaryRejectsMissingExpected(t *testing.T) {
	now := time.Date(2026, time.April, 26, 10, 0, 0, 0, time.UTC)
	suite := validAppPromptObservedSuite()
	suite["evaluations"].([]any)[0].(map[string]any)["observed"].(map[string]any)["finalText"] = "Done."
	summary, err := BuildAppPromptEvaluationSummary(suite, now)
	if err != nil {
		t.Fatalf("expected success, got error: %v", err)
	}
	if summary["recommendation"] != "reject" {
		t.Fatalf("expected reject, got %v", summary["recommendation"])
	}
	first := summary["evaluations"].([]any)[0].(map[string]any)
	if first["status"] != "failed" || first["match"] != false {
		t.Fatalf("expected failing match, got %#v", first)
	}
}

func TestBuildAppPromptEvaluationSummaryRequiresCrossRuntimeFields(t *testing.T) {
	now := time.Date(2026, time.April, 26, 10, 0, 0, 0, time.UTC)
	for _, field := range []string{"provider", "model", "harness", "mode"} {
		suite := validAppPromptObservedSuite()
		evaluation := suite["evaluations"].([]any)[0].(map[string]any)
		delete(evaluation, field)
		_, err := BuildAppPromptEvaluationSummary(suite, now)
		if err == nil || !strings.Contains(err.Error(), field) {
			t.Fatalf("expected %s requirement error, got %v", field, err)
		}
	}
}

func TestBuildAppPromptEvaluationSummaryRequiresPromptObservedFields(t *testing.T) {
	now := time.Date(2026, time.April, 26, 10, 0, 0, 0, time.UTC)
	suite := validAppPromptObservedSuite()
	delete(suite["evaluations"].([]any)[0].(map[string]any), "durationMs")
	if _, err := BuildAppPromptEvaluationSummary(suite, now); err == nil || !strings.Contains(err.Error(), "durationMs") {
		t.Fatalf("expected durationMs error, got %v", err)
	}
	suite = validAppPromptObservedSuite()
	delete(suite["evaluations"].([]any)[0].(map[string]any)["observed"].(map[string]any), "input")
	if _, err := BuildAppPromptEvaluationSummary(suite, now); err == nil || !strings.Contains(err.Error(), "input") {
		t.Fatalf("expected input error, got %v", err)
	}
	suite = validAppPromptObservedSuite()
	suite["evaluations"].([]any)[0].(map[string]any)["observed"].(map[string]any)["messages"] = []any{}
	if _, err := BuildAppPromptEvaluationSummary(suite, now); err == nil || !strings.Contains(err.Error(), "messages") {
		t.Fatalf("expected messages error, got %v", err)
	}
	suite = validAppPromptObservedSuite()
	suite["evaluations"].([]any)[0].(map[string]any)["observed"].(map[string]any)["finalText"] = ""
	if _, err := BuildAppPromptEvaluationSummary(suite, now); err == nil || !strings.Contains(err.Error(), "finalText") {
		t.Fatalf("expected finalText error, got %v", err)
	}
}

func TestBuildAppPromptEvaluationSummaryRequiresMessagingMode(t *testing.T) {
	now := time.Date(2026, time.April, 26, 10, 0, 0, 0, time.UTC)
	suite := validAppPromptObservedSuite()
	suite["evaluations"].([]any)[0].(map[string]any)["mode"] = "workspace"
	_, err := BuildAppPromptEvaluationSummary(suite, now)
	if err == nil || !strings.Contains(err.Error(), "messaging") {
		t.Fatalf("expected messaging mode error, got %v", err)
	}
}
