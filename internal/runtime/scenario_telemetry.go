package runtime

import (
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

func SummarizeScenarioTelemetryEntries(entries []any, now time.Time, source string) (map[string]any, error) {
	normalizedEntries := make([]map[string]any, 0, len(entries))
	for index, entry := range entries {
		normalized, err := normalizeScenarioResult(entry, "entries["+strconv.Itoa(index)+"]")
		if err != nil {
			return nil, err
		}
		normalizedEntries = append(normalizedEntries, normalized)
	}
	grouped := map[string][]map[string]any{}
	for _, entry := range normalizedEntries {
		scenarioID := entry["scenarioId"].(string)
		grouped[scenarioID] = append(grouped[scenarioID], entry)
	}
	scenarios := make([]map[string]any, 0, len(grouped))
	for scenarioID, scenarioEntries := range grouped {
		scenarios = append(scenarios, buildTelemetryBreakdown(scenarioEntries, &scenarioID))
	}
	sort.Slice(scenarios, func(left, right int) bool {
		leftCost := readTelemetryNumber(scenarios[left], "cost_usd")
		rightCost := readTelemetryNumber(scenarios[right], "cost_usd")
		if leftCost != rightCost {
			return rightCost < leftCost
		}
		leftTokens := readTelemetryNumber(scenarios[left], "total_tokens")
		rightTokens := readTelemetryNumber(scenarios[right], "total_tokens")
		if leftTokens != rightTokens {
			return rightTokens < leftTokens
		}
		return parseISOTime(scenarios[right]["latestTimestamp"]) < parseISOTime(scenarios[left]["latestTimestamp"])
	})
	overall := buildTelemetryBreakdown(normalizedEntries, nil)
	overall["scenarioCount"] = len(scenarios)
	return map[string]any{
		"schemaVersion": contracts.ScenarioTelemetrySummarySchema,
		"generatedAt":   now.UTC().Format(time.RFC3339Nano),
		"source":        source,
		"overall":       overall,
		"scenarios":     scenarios,
	}, nil
}

func SummarizeScenarioTelemetryFromHistory(history map[string]any, now time.Time) (map[string]any, error) {
	entries := make([]any, 0)
	for scenarioID, rawStats := range asMap(history["scenarioStats"]) {
		stats := asMap(rawStats)
		for _, rawResult := range arrayOrEmpty(stats["recentTrainResults"]) {
			entry := asMap(rawResult)
			entry["scenarioId"] = scenarioID
			entries = append(entries, entry)
		}
	}
	return SummarizeScenarioTelemetryEntries(entries, now, "scenario_history")
}

func arrayOrEmpty(value any) []any {
	items, ok := value.([]any)
	if !ok {
		return []any{}
	}
	return items
}

func buildTelemetryBreakdown(entries []map[string]any, scenarioID *string) map[string]any {
	summary := map[string]any{
		"runCount":        len(entries),
		"latestTimestamp": latestTimestamp(entries),
	}
	if scenarioID != nil {
		summary["scenarioId"] = *scenarioID
	}
	if totalDuration, ok := sumEntryField(entries, "durationMs", true); ok {
		summary["totalDurationMs"] = totalDuration
		summary["averageDurationMs"] = totalDuration / float64(len(entries))
	}
	for _, field := range telemetryNumericFields {
		if total, ok := sumEntryField(entries, field, false); ok {
			summary[field] = total
		}
	}
	if providers := uniqueTelemetryValues(entries, "provider"); len(providers) > 0 {
		summary["providers"] = providers
	}
	if models := uniqueTelemetryValues(entries, "model"); len(models) > 0 {
		summary["models"] = models
	}
	return summary
}

func latestTimestamp(entries []map[string]any) any {
	values := make([]string, 0)
	for _, entry := range entries {
		for _, field := range []string{"completedAt", "timestamp", "startedAt"} {
			if value, ok := entry[field].(string); ok && strings.TrimSpace(value) != "" {
				values = append(values, value)
				break
			}
		}
	}
	sort.Slice(values, func(left, right int) bool {
		return parseISOTime(values[right]) < parseISOTime(values[left])
	})
	if len(values) == 0 {
		return nil
	}
	return values[0]
}

func sumEntryField(entries []map[string]any, field string, fromResult bool) (float64, bool) {
	seen := false
	total := 0.0
	for _, entry := range entries {
		var value any
		if fromResult {
			value = entry[field]
		} else {
			value = asMap(entry["telemetry"])[field]
		}
		number, ok := toFloat(value)
		if !ok {
			continue
		}
		seen = true
		total += number
	}
	if !seen {
		return 0, false
	}
	return round12(total), true
}

func uniqueTelemetryValues(entries []map[string]any, field string) []string {
	values := make([]string, 0)
	for _, entry := range entries {
		if value, ok := asMap(entry["telemetry"])[field].(string); ok && strings.TrimSpace(value) != "" {
			values = append(values, value)
		}
	}
	return uniqueStrings(values)
}

func readTelemetryNumber(record map[string]any, field string) float64 {
	if number, ok := toFloat(record[field]); ok {
		return number
	}
	return -1
}
