package runtime

import (
	"encoding/json"
	"fmt"
	"os"
	"sort"

	"github.com/corca-ai/cautilus/internal/contracts"
)

type PacketInspectionOptions struct {
	InputPath string
}

type packetSelectorHint struct {
	name        string
	path        string
	description string
	count       func(packet map[string]any) int
}

func arrayLengthAt(keys ...string) func(packet map[string]any) int {
	return func(packet map[string]any) int {
		current := any(packet)
		for _, key := range keys {
			obj, ok := current.(map[string]any)
			if !ok {
				return 0
			}
			current = obj[key]
		}
		arr, ok := current.([]any)
		if !ok {
			return 0
		}
		return len(arr)
	}
}

func nestedArrayLengthSum(parentKey string, childKey string) func(packet map[string]any) int {
	return func(packet map[string]any) int {
		parents, ok := packet[parentKey].([]any)
		if !ok {
			return 0
		}
		total := 0
		for _, raw := range parents {
			parent, ok := raw.(map[string]any)
			if !ok {
				continue
			}
			children, ok := parent[childKey].([]any)
			if ok {
				total += len(children)
			}
		}
		return total
	}
}

var packetSelectorHints = map[string][]packetSelectorHint{
	contracts.ClaimEvalPlanSchema: {
		{name: "plans", path: ".evalPlans", description: "planned eval fixtures", count: arrayLengthAt("evalPlans")},
		{name: "skipped", path: ".skippedClaims", description: "claims excluded from this plan", count: arrayLengthAt("skippedClaims")},
	},
	contracts.ClaimReviewInputSchema: {
		{name: "clusters", path: ".clusters", description: "review clusters", count: arrayLengthAt("clusters")},
		{name: "candidates", path: ".clusters[].candidates", description: "claim candidates across all clusters", count: nestedArrayLengthSum("clusters", "candidates")},
		{name: "skipped", path: ".skippedClaims", description: "claims not clustered for review", count: arrayLengthAt("skippedClaims")},
	},
}

func BuildPacketInspection(packet map[string]any) map[string]any {
	if packet == nil {
		packet = map[string]any{}
	}
	keys := make([]string, 0, len(packet))
	for key := range packet {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	arrayCounts := map[string]any{}
	for key, value := range packet {
		if arr, ok := value.([]any); ok {
			arrayCounts[key] = len(arr)
		}
	}

	hints := []any{}
	schemaVersion := stringFromAny(packet["schemaVersion"])
	if entries, ok := packetSelectorHints[schemaVersion]; ok {
		for _, hint := range entries {
			hints = append(hints, map[string]any{
				"name":        hint.name,
				"path":        hint.path,
				"description": hint.description,
				"count":       hint.count(packet),
			})
		}
	}

	return map[string]any{
		"schemaVersion":      contracts.PacketInspectionSchema,
		"inputSchemaVersion": schemaVersion,
		"topLevelKeys":       toAnySlice(keys),
		"arrayCounts":        arrayCounts,
		"selectorHints":      hints,
		"selectorHintPolicy": "selectorHints are populated for known Cautilus packet schemas; arrayCounts always reflects the literal top-level array fields.",
	}
}

func ReadPacketForInspection(path string) (map[string]any, error) {
	if path == "" {
		return nil, fmt.Errorf("--input must not be empty")
	}
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var packet map[string]any
	if err := json.Unmarshal(content, &packet); err != nil {
		return nil, fmt.Errorf("input %s is not a JSON object: %w", path, err)
	}
	if packet == nil {
		packet = map[string]any{}
	}
	return packet, nil
}

func toAnySlice(values []string) []any {
	result := make([]any, len(values))
	for index, value := range values {
		result[index] = value
	}
	return result
}
