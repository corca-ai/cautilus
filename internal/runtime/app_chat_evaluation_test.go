package runtime

import (
	"strings"
	"testing"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

func validAppChatObservedRecord() map[string]any {
	return map[string]any{
		"caseId":      "say-hello",
		"displayName": "Greeting",
		"provider":    "anthropic",
		"model":       "claude-sonnet-4-6",
		"harness":     "anthropic-direct",
		"mode":        "messaging",
		"durationMs":  1234,
		"observed": map[string]any{
			"messages": []any{
				map[string]any{"role": "user", "content": "Say hello in one short sentence."},
				map[string]any{"role": "assistant", "content": "Hello there, friend."},
			},
			"finalText": "Hello there, friend.",
		},
		"expected": map[string]any{"finalText": "Hello"},
	}
}

func validAppChatObservedSuite() map[string]any {
	return map[string]any{
		"schemaVersion":    contracts.AppChatEvaluationInputsSchema,
		"suiteId":          "demo-chat",
		"suiteDisplayName": "Demo Chat",
		"evaluations":      []any{validAppChatObservedRecord()},
	}
}

func TestBuildAppChatEvaluationSummaryAcceptsMatch(t *testing.T) {
	now := time.Date(2026, time.April, 25, 10, 0, 0, 0, time.UTC)
	summary, err := BuildAppChatEvaluationSummary(validAppChatObservedSuite(), now)
	if err != nil {
		t.Fatalf("expected success, got error: %v", err)
	}
	if summary["schemaVersion"] != contracts.AppChatEvaluationSummarySchema {
		t.Fatalf("expected app/chat summary schema, got %v", summary["schemaVersion"])
	}
	if summary["recommendation"] != "accept-now" {
		t.Fatalf("expected accept-now, got %v", summary["recommendation"])
	}
	counts := summary["evaluationCounts"].(map[string]any)
	if counts["passed"] != 1 || counts["failed"] != 0 || counts["total"] != 1 {
		t.Fatalf("unexpected counts: %#v", counts)
	}
	evaluations := summary["evaluations"].([]any)
	first := evaluations[0].(map[string]any)
	if first["status"] != "passed" || first["match"] != true {
		t.Fatalf("expected passing match, got %#v", first)
	}
	if first["mode"] != "messaging" || first["harness"] != "anthropic-direct" {
		t.Fatalf("expected harness/mode round-trip, got %#v", first)
	}
}

func TestBuildAppChatEvaluationSummaryRejectsMissingExpected(t *testing.T) {
	now := time.Date(2026, time.April, 25, 10, 0, 0, 0, time.UTC)
	suite := validAppChatObservedSuite()
	suite["evaluations"].([]any)[0].(map[string]any)["observed"].(map[string]any)["finalText"] = "Hi friend."
	summary, err := BuildAppChatEvaluationSummary(suite, now)
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

func TestBuildAppChatEvaluationSummaryRequiresCrossRuntimeFields(t *testing.T) {
	now := time.Date(2026, time.April, 25, 10, 0, 0, 0, time.UTC)
	for _, field := range []string{"provider", "model", "harness", "mode"} {
		suite := validAppChatObservedSuite()
		evaluation := suite["evaluations"].([]any)[0].(map[string]any)
		delete(evaluation, field)
		_, err := BuildAppChatEvaluationSummary(suite, now)
		if err == nil || !strings.Contains(err.Error(), field) {
			t.Fatalf("expected %s requirement error, got %v", field, err)
		}
	}
}

func TestBuildAppChatEvaluationSummaryRequiresMessagingMode(t *testing.T) {
	now := time.Date(2026, time.April, 25, 10, 0, 0, 0, time.UTC)
	suite := validAppChatObservedSuite()
	suite["evaluations"].([]any)[0].(map[string]any)["mode"] = "workspace"
	_, err := BuildAppChatEvaluationSummary(suite, now)
	if err == nil || !strings.Contains(err.Error(), "messaging") {
		t.Fatalf("expected messaging mode error, got %v", err)
	}
}

func TestBuildAppChatEvaluationSummaryRequiresDurationAndObservedMessages(t *testing.T) {
	now := time.Date(2026, time.April, 25, 10, 0, 0, 0, time.UTC)
	suite := validAppChatObservedSuite()
	delete(suite["evaluations"].([]any)[0].(map[string]any), "durationMs")
	if _, err := BuildAppChatEvaluationSummary(suite, now); err == nil || !strings.Contains(err.Error(), "durationMs") {
		t.Fatalf("expected durationMs error, got %v", err)
	}
	suite = validAppChatObservedSuite()
	suite["evaluations"].([]any)[0].(map[string]any)["observed"].(map[string]any)["messages"] = []any{}
	if _, err := BuildAppChatEvaluationSummary(suite, now); err == nil || !strings.Contains(err.Error(), "messages") {
		t.Fatalf("expected messages error, got %v", err)
	}
	suite = validAppChatObservedSuite()
	suite["evaluations"].([]any)[0].(map[string]any)["observed"].(map[string]any)["finalText"] = ""
	if _, err := BuildAppChatEvaluationSummary(suite, now); err == nil || !strings.Contains(err.Error(), "finalText") {
		t.Fatalf("expected finalText error, got %v", err)
	}
}

func TestBuildAppChatEvaluationSummaryCarriesCostUsdWhenPresent(t *testing.T) {
	now := time.Date(2026, time.April, 25, 10, 0, 0, 0, time.UTC)
	suite := validAppChatObservedSuite()
	suite["evaluations"].([]any)[0].(map[string]any)["costUsd"] = 0.001234
	summary, err := BuildAppChatEvaluationSummary(suite, now)
	if err != nil {
		t.Fatalf("expected success, got error: %v", err)
	}
	first := summary["evaluations"].([]any)[0].(map[string]any)
	if first["costUsd"] == nil {
		t.Fatalf("expected costUsd to be carried, got %#v", first)
	}
}

func TestBuildAppChatEvaluationSummaryRejectsWrongSchemaVersion(t *testing.T) {
	now := time.Date(2026, time.April, 25, 10, 0, 0, 0, time.UTC)
	suite := validAppChatObservedSuite()
	suite["schemaVersion"] = "cautilus.something_else.v1"
	if _, err := BuildAppChatEvaluationSummary(suite, now); err == nil || !strings.Contains(err.Error(), "schemaVersion") {
		t.Fatalf("expected schemaVersion error, got %v", err)
	}
}
