package runtime

import (
	"fmt"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

var severityPriority = map[string]int{"high": 3, "medium": 2, "low": 1}
var scenarioResultSeverity = map[string]string{
	"failed": "high", "regressed": "high", "missing": "high", "noisy": "medium", "unchanged": "medium",
}
var runAuditWarningDefinitions = []struct {
	Field      string
	SourceKind string
	Severity   string
	Summary    string
}{
	{"slow_llm_runs", "run_audit.warning", "high", "Slow LLM warnings detected"},
	{"slow_transition_runs", "run_audit.warning", "medium", "Slow transition warnings detected"},
	{"high_token_runs", "run_audit.warning", "medium", "High token usage warnings detected"},
}

func BuildEvidenceInput(repoRoot string, reportFile *string, scenarioResultsFile *string, scenarioMode *string, runAuditFile *string, historyFile *string, activeRunDir *string, now time.Time) (map[string]any, error) {
	resolvedReportFile := reportFile
	resolvedScenarioResultsFile := scenarioResultsFile
	resolvedRunAuditFile := runAuditFile
	resolvedHistoryFile := historyFile
	if activeRunDir != nil {
		if resolvedReportFile == nil {
			value := filepath.Join(*activeRunDir, "report.json")
			resolvedReportFile = &value
		}
		if resolvedScenarioResultsFile == nil && scenarioMode != nil && *scenarioMode != "" {
			value := filepath.Join(*activeRunDir, fmt.Sprintf("%s-scenario-results.json", *scenarioMode))
			resolvedScenarioResultsFile = &value
		}
		if resolvedRunAuditFile == nil {
			value := filepath.Join(*activeRunDir, "run-audit-summary.json")
			if fileExists(value) {
				resolvedRunAuditFile = &value
			}
		}
		if resolvedHistoryFile == nil {
			value := filepath.Join(*activeRunDir, "scenario-history.snapshot.json")
			if fileExists(value) {
				resolvedHistoryFile = &value
			}
		}
	}
	if resolvedReportFile == nil && resolvedScenarioResultsFile == nil && resolvedRunAuditFile == nil && resolvedHistoryFile == nil {
		return nil, fmt.Errorf("at least one evidence source must be provided")
	}
	packet := map[string]any{
		"schemaVersion": contracts.EvidenceBundleInputsSchema,
		"generatedAt":   now.UTC().Format(time.RFC3339Nano),
		"repoRoot":      repoRoot,
		"sources":       []any{},
		"objective": map[string]any{
			"summary": "Bundle host-normalized evidence into one machine-readable packet before mining scenarios or revisions.",
			"constraints": []string{
				"Keep raw log readers and storage access host-owned.",
				"Treat this packet as normalized evidence, not inferred narrative.",
				"Prefer explicit report, scenario-result, audit, and history files over ad-hoc shell history.",
			},
		},
	}
	if resolvedReportFile != nil {
		report, err := readJSONFile(*resolvedReportFile)
		if err != nil {
			return nil, err
		}
		if err := ValidateReportPacket(report, *resolvedReportFile); err != nil {
			return nil, fmt.Errorf("%s: %w", *resolvedReportFile, err)
		}
		packet["reportFile"] = *resolvedReportFile
		packet["report"] = report
		packet["sources"] = append(packet["sources"].([]any), map[string]any{"kind": "report", "file": *resolvedReportFile})
	}
	if resolvedScenarioResultsFile != nil {
		scenarioResults, err := readJSONFile(*resolvedScenarioResultsFile)
		if err != nil {
			return nil, err
		}
		if scenarioResults["schemaVersion"] != contracts.ScenarioResultsSchema {
			return nil, fmt.Errorf("scenario results file must use schemaVersion %s", contracts.ScenarioResultsSchema)
		}
		packet["scenarioResultsFile"] = *resolvedScenarioResultsFile
		packet["scenarioResults"] = scenarioResults
		packet["sources"] = append(packet["sources"].([]any), map[string]any{"kind": "scenario_results", "file": *resolvedScenarioResultsFile})
	}
	if resolvedRunAuditFile != nil {
		runAudit, err := readJSONFile(*resolvedRunAuditFile)
		if err != nil {
			return nil, err
		}
		packet["runAuditFile"] = *resolvedRunAuditFile
		packet["runAudit"] = runAudit
		packet["sources"] = append(packet["sources"].([]any), map[string]any{"kind": "run_audit", "file": *resolvedRunAuditFile})
	}
	if resolvedHistoryFile != nil {
		history, err := readJSONFile(*resolvedHistoryFile)
		if err != nil {
			return nil, err
		}
		if history["schemaVersion"] != contracts.ScenarioHistorySchema {
			return nil, fmt.Errorf("scenario history must use schemaVersion %s", contracts.ScenarioHistorySchema)
		}
		packet["scenarioHistoryFile"] = *resolvedHistoryFile
		packet["scenarioHistory"] = history
		packet["sources"] = append(packet["sources"].([]any), map[string]any{"kind": "scenario_history", "file": *resolvedHistoryFile})
	}
	return packet, nil
}

func BuildEvidenceBundle(packet map[string]any, inputFile *string, now time.Time) map[string]any {
	signals := sortSignals(dedupeSignals(append(append(append(
		gatherReportSignals(asMap(packet["report"])),
		gatherScenarioResultSignals(asMap(packet["scenarioResults"]))...),
		gatherRunAuditSignals(asMap(packet["runAudit"]))...),
		gatherHistorySignals(asMap(packet["scenarioHistory"]))...)))
	bundle := map[string]any{
		"schemaVersion": contracts.EvidenceBundleSchema,
		"generatedAt":   now.UTC().Format(time.RFC3339Nano),
		"repoRoot":      packet["repoRoot"],
		"sources":       arrayOrEmpty(packet["sources"]),
		"summary":       summarizeSignals(signals),
		"signals":       signals,
		"guidance": map[string]any{
			"miningFocus": buildMiningFocus(signals),
			"loopRules": []string{
				"Keep source ownership explicit: hosts own raw readers and storage access.",
				"Use this bundle to propose one bounded next slice, not an open-ended retry loop.",
				"Do not weaken held-out, comparison, or review gates when acting on this bundle.",
			},
		},
	}
	if inputFile != nil {
		bundle["inputFile"] = *inputFile
	}
	return bundle
}

func gatherReportSignals(report map[string]any) []map[string]any {
	signals := []map[string]any{}
	signals = append(signals, buildScenarioListSignals(arrayOrEmpty(report["regressed"]), "report.regressed", "report.regressed", "high", "regressed", "Regressed evidence")...)
	signals = append(signals, buildScenarioListSignals(arrayOrEmpty(report["noisy"]), "report.noisy", "report.noisy", "medium", "noisy", "Noisy evidence")...)
	for index, rawFinding := range arrayOrEmpty(report["humanReviewFindings"]) {
		finding := asMap(rawFinding)
		message := stringOrEmpty(finding["message"])
		if message == "" {
			message = fmt.Sprintf("review-finding-%d", index+1)
		}
		severity := "medium"
		if strings.ToLower(stringOrEmpty(finding["severity"])) == "blocker" {
			severity = "high"
		}
		signals = append(signals, map[string]any{
			"id":         fmt.Sprintf("report.review:%d", index+1),
			"sourceKind": "report.review_finding",
			"severity":   severity,
			"summary":    "Review finding: " + message,
		})
	}
	return signals
}

func buildScenarioListSignals(items []any, idPrefix string, sourceKind string, severity string, fallbackPrefix string, summaryPrefix string) []map[string]any {
	result := []map[string]any{}
	for index, rawItem := range items {
		key := normalizeScenarioKey(rawItem, index, fallbackPrefix)
		result = append(result, map[string]any{
			"id":         idPrefix + ":" + key,
			"sourceKind": sourceKind,
			"severity":   severity,
			"summary":    summaryPrefix + ": " + key,
		})
	}
	return result
}

func gatherScenarioResultSignals(scenarioResults map[string]any) []map[string]any {
	signals := []map[string]any{}
	for index, rawResult := range arrayOrEmpty(scenarioResults["results"]) {
		result := asMap(rawResult)
		status := stringOrEmpty(result["status"])
		severity, ok := scenarioResultSeverity[status]
		if !ok {
			continue
		}
		scenarioID := stringOrEmpty(result["scenarioId"])
		if scenarioID == "" {
			scenarioID = fmt.Sprintf("scenario-%d", index+1)
		}
		signals = append(signals, map[string]any{
			"id":         "scenario_results:" + scenarioID,
			"sourceKind": "scenario_results",
			"severity":   severity,
			"summary":    fmt.Sprintf("Scenario result %s: %s", status, scenarioID),
		})
	}
	return signals
}

func gatherRunAuditSignals(runAudit map[string]any) []map[string]any {
	summary := asMap(runAudit["summary"])
	warnings := asMap(summary["warnings"])
	totals := asMap(summary["totals"])
	signals := []map[string]any{}
	for _, definition := range runAuditWarningDefinitions {
		count, ok := toFloat(warnings[definition.Field])
		if !ok || count <= 0 {
			continue
		}
		signals = append(signals, map[string]any{
			"id":         "run_audit:" + definition.Field,
			"sourceKind": definition.SourceKind,
			"severity":   definition.Severity,
			"summary":    fmt.Sprintf("%s (%.0f)", definition.Summary, count),
		})
	}
	if launchOnlyRuns, ok := toFloat(totals["launch_only_runs"]); ok && launchOnlyRuns > 0 {
		signals = append(signals, map[string]any{
			"id":         "run_audit:launch_only_runs",
			"sourceKind": "run_audit.depth",
			"severity":   "medium",
			"summary":    fmt.Sprintf("Launch-only runs present (%.0f)", launchOnlyRuns),
		})
	}
	return signals
}

func gatherHistorySignals(history map[string]any) []map[string]any {
	signals := []map[string]any{}
	for scenarioID, rawStats := range asMap(history["scenarioStats"]) {
		stats := asMap(rawStats)
		recent := arrayOrEmpty(stats["recentTrainResults"])
		if len(recent) == 0 {
			continue
		}
		latest := asMap(recent[0])
		overallScore, _ := toFloat(latest["overallScore"])
		passRate, _ := toFloat(latest["passRate"])
		if stringOrEmpty(latest["status"]) == "passed" && overallScore == 100 && passRate == 1 {
			continue
		}
		signals = append(signals, map[string]any{
			"id":         "scenario_history:" + scenarioID,
			"sourceKind": "scenario_history",
			"severity":   "medium",
			"summary":    "Recent history remains unstable: " + scenarioID,
		})
	}
	return signals
}

func normalizeScenarioKey(value any, index int, fallbackPrefix string) string {
	if text, ok := value.(string); ok && strings.TrimSpace(text) != "" {
		return text
	}
	record := asMap(value)
	if scenarioID := stringOrEmpty(record["scenarioId"]); scenarioID != "" {
		return scenarioID
	}
	if metric := stringOrEmpty(record["metric"]); metric != "" {
		return metric
	}
	return fmt.Sprintf("%s-%d", fallbackPrefix, index+1)
}

func dedupeSignals(signals []map[string]any) []map[string]any {
	table := map[string]map[string]any{}
	for _, signal := range signals {
		key := stringOrEmpty(signal["id"])
		if _, exists := table[key]; !exists {
			table[key] = signal
		}
	}
	result := make([]map[string]any, 0, len(table))
	for _, signal := range table {
		result = append(result, signal)
	}
	return result
}

func sortSignals(signals []map[string]any) []any {
	sort.Slice(signals, func(left, right int) bool {
		leftPriority := severityPriority[stringOrEmpty(signals[left]["severity"])]
		rightPriority := severityPriority[stringOrEmpty(signals[right]["severity"])]
		if leftPriority != rightPriority {
			return rightPriority < leftPriority
		}
		return stringOrEmpty(signals[left]["id"]) < stringOrEmpty(signals[right]["id"])
	})
	result := make([]any, 0, len(signals))
	for _, signal := range signals {
		result = append(result, signal)
	}
	return result
}

func summarizeSignals(signals []any) map[string]any {
	summary := map[string]any{
		"signalCount":       len(signals),
		"highSignalCount":   0,
		"mediumSignalCount": 0,
		"lowSignalCount":    0,
		"sourceKinds":       []string{},
	}
	sourceKinds := []string{}
	for _, rawSignal := range signals {
		signal := asMap(rawSignal)
		sourceKind := stringOrEmpty(signal["sourceKind"])
		sourceKinds = append(sourceKinds, sourceKind)
		switch stringOrEmpty(signal["severity"]) {
		case "high":
			summary["highSignalCount"] = summary["highSignalCount"].(int) + 1
		case "medium":
			summary["mediumSignalCount"] = summary["mediumSignalCount"].(int) + 1
		default:
			summary["lowSignalCount"] = summary["lowSignalCount"].(int) + 1
		}
	}
	sort.Strings(sourceKinds)
	summary["sourceKinds"] = uniqueStrings(sourceKinds)
	return summary
}

func buildMiningFocus(signals []any) []string {
	if len(signals) == 0 {
		return []string{"No blocking evidence was surfaced in the current bundle."}
	}
	result := []string{}
	for _, rawSignal := range signals {
		result = append(result, stringOrEmpty(asMap(rawSignal)["summary"]))
		if len(result) == 5 {
			break
		}
	}
	return result
}
