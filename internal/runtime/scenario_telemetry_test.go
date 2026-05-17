package runtime

import (
	"testing"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

func TestSummarizeScenarioTelemetryEntriesCarriesBudgetAttribution(t *testing.T) {
	now := time.Date(2026, time.May, 17, 11, 10, 0, 0, time.UTC)
	summary, err := SummarizeScenarioTelemetryEntries([]any{
		map[string]any{
			"scenarioId": "alpha",
			"timestamp":  "2026-05-17T01:00:00.000Z",
			"durationMs": float64(100),
			"telemetry": map[string]any{
				"provider":                    "anthropic",
				"model":                       "claude-sonnet-4-6",
				"request_kind":                "app_chat",
				"source_flow":                 "release_smoke",
				"cache_policy":                "cacheable_system_prompt",
				"static_context_id":           "shared-context",
				"cost_truth":                  "derived_pricing",
				"pricing_source":              "openai_pricing",
				"pricing_version":             "2026-05-17",
				"cache_creation_input_tokens": float64(10),
				"cache_read_input_tokens":     float64(30),
				"retry_count":                 float64(1),
				"tool_call_count":             float64(2),
				"total_tokens":                float64(100),
				"cost_usd":                    0.01,
			},
		},
		map[string]any{
			"scenarioId": "alpha",
			"timestamp":  "2026-05-17T01:05:00.000Z",
			"durationMs": float64(120),
			"telemetry": map[string]any{
				"provider":                    "anthropic",
				"model":                       "claude-sonnet-4-6",
				"request_kind":                "app_chat",
				"source_flow":                 "release_smoke",
				"cache_policy":                "cacheable_system_prompt",
				"static_context_id":           "shared-context",
				"cost_truth":                  "derived_pricing",
				"pricing_source":              "openai_pricing",
				"pricing_version":             "2026-05-17",
				"cache_creation_input_tokens": float64(20),
				"cache_read_input_tokens":     float64(40),
				"retry_count":                 float64(0),
				"tool_call_count":             float64(3),
				"total_tokens":                float64(120),
				"cost_usd":                    0.012,
			},
		},
	}, now, "test")
	if err != nil {
		t.Fatalf("expected success, got error: %v", err)
	}
	if summary["schemaVersion"] != contracts.ScenarioTelemetrySummarySchema {
		t.Fatalf("unexpected schemaVersion: %#v", summary["schemaVersion"])
	}
	overall := summary["overall"].(map[string]any)
	if overall["cache_creation_input_tokens"] != float64(30) || overall["cache_read_input_tokens"] != float64(70) {
		t.Fatalf("unexpected cache telemetry: %#v", overall)
	}
	if overall["retry_count"] != float64(1) || overall["tool_call_count"] != float64(5) {
		t.Fatalf("unexpected attribution counts: %#v", overall)
	}
	assertStringSlice(t, overall["requestKinds"], []string{"app_chat"})
	assertStringSlice(t, overall["sourceFlows"], []string{"release_smoke"})
	assertStringSlice(t, overall["cachePolicies"], []string{"cacheable_system_prompt"})
	assertStringSlice(t, overall["staticContextIds"], []string{"shared-context"})
	assertStringSlice(t, overall["costTruths"], []string{"derived_pricing"})
	assertStringSlice(t, overall["pricingSources"], []string{"openai_pricing"})
	assertStringSlice(t, overall["pricingVersions"], []string{"2026-05-17"})
}

func assertStringSlice(t *testing.T, value any, expected []string) {
	t.Helper()
	items, ok := value.([]string)
	if !ok {
		t.Fatalf("expected []string, got %#v", value)
	}
	if len(items) != len(expected) {
		t.Fatalf("expected %v, got %v", expected, items)
	}
	for index := range expected {
		if items[index] != expected[index] {
			t.Fatalf("expected %v, got %v", expected, items)
		}
	}
}
