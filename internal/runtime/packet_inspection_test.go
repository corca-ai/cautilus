package runtime

import (
	"strings"
	"testing"

	"github.com/corca-ai/cautilus/internal/contracts"
)

func TestBuildPacketInspectionEmitsCanonicalSchemaAndKeys(t *testing.T) {
	packet := map[string]any{
		"schemaVersion": contracts.ClaimEvalPlanSchema,
		"evalPlans": []any{
			map[string]any{"claimId": "claim-1"},
			map[string]any{"claimId": "claim-2"},
		},
		"skippedClaims": []any{
			map[string]any{"claimId": "claim-skip-1"},
		},
		"otherField": "value",
	}

	report := BuildPacketInspection(packet)

	if report["schemaVersion"] != contracts.PacketInspectionSchema {
		t.Fatalf("expected schema %q, got %#v", contracts.PacketInspectionSchema, report["schemaVersion"])
	}
	if report["inputSchemaVersion"] != contracts.ClaimEvalPlanSchema {
		t.Fatalf("expected inputSchemaVersion to echo input, got %#v", report["inputSchemaVersion"])
	}
	keys := report["topLevelKeys"].([]any)
	want := []string{"evalPlans", "otherField", "schemaVersion", "skippedClaims"}
	if len(keys) != len(want) {
		t.Fatalf("topLevelKeys mismatch: got %#v want %v", keys, want)
	}
	for index, key := range want {
		if keys[index] != key {
			t.Fatalf("topLevelKeys[%d] = %v, want %s", index, keys[index], key)
		}
	}
	counts := report["arrayCounts"].(map[string]any)
	if counts["evalPlans"] != 2 {
		t.Fatalf("expected evalPlans count 2, got %#v", counts["evalPlans"])
	}
	if counts["skippedClaims"] != 1 {
		t.Fatalf("expected skippedClaims count 1, got %#v", counts["skippedClaims"])
	}
	if _, ok := counts["otherField"]; ok {
		t.Fatalf("non-array fields must not appear in arrayCounts: %#v", counts)
	}
}

func TestBuildPacketInspectionPopulatesSelectorHintsForKnownSchemas(t *testing.T) {
	packet := map[string]any{
		"schemaVersion": contracts.ClaimReviewInputSchema,
		"clusters": []any{
			map[string]any{
				"clusterId":  "cluster-a",
				"candidates": []any{map[string]any{"claimId": "c1"}, map[string]any{"claimId": "c2"}},
			},
			map[string]any{
				"clusterId":  "cluster-b",
				"candidates": []any{map[string]any{"claimId": "c3"}},
			},
		},
		"skippedClaims": []any{},
	}

	report := BuildPacketInspection(packet)
	hints := report["selectorHints"].([]any)
	if len(hints) != 3 {
		t.Fatalf("expected 3 selector hints, got %#v", hints)
	}
	byName := map[string]map[string]any{}
	for _, raw := range hints {
		hint := raw.(map[string]any)
		byName[hint["name"].(string)] = hint
	}
	if byName["clusters"]["count"] != 2 {
		t.Fatalf("expected clusters count 2, got %#v", byName["clusters"])
	}
	if byName["candidates"]["count"] != 3 {
		t.Fatalf("expected candidates count 3 across all clusters, got %#v", byName["candidates"])
	}
	if byName["candidates"]["path"] != ".clusters[].candidates" {
		t.Fatalf("expected canonical path for candidates, got %#v", byName["candidates"]["path"])
	}
	if byName["skipped"]["count"] != 0 {
		t.Fatalf("expected skipped count 0, got %#v", byName["skipped"])
	}
}

func TestBuildPacketInspectionFallsBackForUnknownSchema(t *testing.T) {
	packet := map[string]any{
		"schemaVersion": "third.party.unknown.v1",
		"items":         []any{1, 2, 3},
		"meta":          map[string]any{"name": "x"},
	}

	report := BuildPacketInspection(packet)
	if report["selectorHints"] == nil {
		t.Fatalf("selectorHints must be present (possibly empty), got nil")
	}
	hints := report["selectorHints"].([]any)
	if len(hints) != 0 {
		t.Fatalf("unknown schema must yield empty selectorHints, got %#v", hints)
	}
	counts := report["arrayCounts"].(map[string]any)
	if counts["items"] != 3 {
		t.Fatalf("expected items count 3, got %#v", counts["items"])
	}
	if _, ok := counts["meta"]; ok {
		t.Fatalf("nested object must not appear in arrayCounts, got %#v", counts)
	}
	policy, _ := report["selectorHintPolicy"].(string)
	if !strings.Contains(policy, "known Cautilus packet schemas") {
		t.Fatalf("expected selectorHintPolicy to explain coverage, got %q", policy)
	}
}

func TestBuildPacketInspectionHandlesEmptyPacket(t *testing.T) {
	report := BuildPacketInspection(nil)
	if report["schemaVersion"] != contracts.PacketInspectionSchema {
		t.Fatalf("nil packet should still emit canonical schemaVersion")
	}
	if len(report["topLevelKeys"].([]any)) != 0 {
		t.Fatalf("nil packet should yield no topLevelKeys, got %#v", report["topLevelKeys"])
	}
}
