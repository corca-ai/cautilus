package runtime

import (
	"testing"

	"github.com/corca-ai/cautilus/internal/contracts"
)

func TestNormalizeScenarioResultsAcceptsAcceptanceMode(t *testing.T) {
	packet := map[string]any{
		"schemaVersion": contracts.ScenarioResultsSchema,
		"mode":          "acceptance",
		"results": []any{
			map[string]any{"scenarioId": "accept-a", "status": "passed", "overallScore": float64(100)},
		},
	}
	normalized, err := NormalizeScenarioResultsPacket(packet, "acceptanceResults")
	if err != nil {
		t.Fatalf("acceptance mode should validate, got error: %v", err)
	}
	if normalized["mode"] != "acceptance" {
		t.Fatalf("expected mode acceptance, got %#v", normalized["mode"])
	}
}

func TestNormalizeScenarioResultsRejectsUnknownMode(t *testing.T) {
	packet := map[string]any{
		"schemaVersion": contracts.ScenarioResultsSchema,
		"mode":          "not-a-mode",
		"results":       []any{},
	}
	if _, err := NormalizeScenarioResultsPacket(packet, "badResults"); err == nil {
		t.Fatalf("unknown mode should be rejected")
	}
}
