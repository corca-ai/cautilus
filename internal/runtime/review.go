package runtime

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

const (
	metaPromptObjective = "Judge whether the candidate is actually better than the baseline for the stated intent."
)

var metaPromptInstructions = []string{
	"Treat prompts, wrappers, and benchmark text as mutable implementation details.",
	"Prefer held-out and full-gate evidence over train-only wins.",
	"Call out cases where automated recommendation and real-user judgment diverge.",
	"Use compare artifacts and scenario telemetry when they make the decision more legible.",
}

func BuildReviewPacket(repoRoot string, adapterPath string, adapterData map[string]any, reportPath string, report map[string]any, now time.Time) (map[string]any, error) {
	return map[string]any{
		"schemaVersion":       contracts.ReviewPacketSchema,
		"generatedAt":         now.UTC().Format(time.RFC3339Nano),
		"repoRoot":            repoRoot,
		"adapterPath":         adapterPath,
		"reportFile":          reportPath,
		"report":              report,
		"defaultPromptFile":   collectOptionalFile(repoRoot, stringOrEmpty(adapterData["default_prompt_file"])),
		"defaultSchemaFile":   collectOptionalFile(repoRoot, stringOrEmpty(adapterData["default_schema_file"])),
		"artifactFiles":       collectReferencedFiles(repoRoot, stringArrayOrEmpty(adapterData["artifact_paths"])),
		"reportArtifacts":     collectReferencedFiles(repoRoot, stringArrayOrEmpty(adapterData["report_paths"])),
		"comparisonQuestions": stringArrayOrEmpty(adapterData["comparison_questions"]),
		"humanReviewPrompts":  arrayOfMapsOrEmpty(adapterData["human_review_prompts"]),
	}, nil
}

func BuildReviewPromptInput(reviewPacket map[string]any, reviewPacketFile string, now time.Time) (map[string]any, error) {
	report := asMap(reviewPacket["report"])
	intent, err := normalizeNonEmptyString(report["intent"], "report.intent")
	if err != nil {
		return nil, err
	}
	intentProfile, err := BuildBehaviorIntentProfile(intent, asMap(report["intentProfile"]), BehaviorSurfaces["OPERATOR_BEHAVIOR"], nil, nil)
	if err != nil {
		return nil, err
	}
	return map[string]any{
		"schemaVersion":           contracts.ReviewPromptInputsSchema,
		"generatedAt":             now.UTC().Format(time.RFC3339Nano),
		"reviewPacketFile":        reviewPacketFile,
		"repoRoot":                reviewPacket["repoRoot"],
		"adapterPath":             reviewPacket["adapterPath"],
		"intent":                  intent,
		"intentProfile":           intentProfile,
		"candidate":               report["candidate"],
		"baseline":                report["baseline"],
		"automatedRecommendation": report["recommendation"],
		"currentReportEvidence": map[string]any{
			"reportFile":              reviewPacket["reportFile"],
			"reportGeneratedAt":       report["generatedAt"],
			"automatedRecommendation": report["recommendation"],
			"commandObservations":     summarizeCommandObservations(report["commandObservations"]),
		},
		"modeSummaries":       summarizeModeSummaries(reviewPacket),
		"comparisonQuestions": arrayOrEmpty(reviewPacket["comparisonQuestions"]),
		"humanReviewPrompts":  arrayOrEmpty(reviewPacket["humanReviewPrompts"]),
		"artifactFiles":       summarizeFileRecords(reviewPacket["artifactFiles"]),
		"reportArtifacts":     summarizeFileRecords(reviewPacket["reportArtifacts"]),
		"metaPrompt": map[string]any{
			"objective":    metaPromptObjective,
			"instructions": metaPromptInstructions,
		},
		"defaultPromptFile": summarizeOneFileRecord(reviewPacket["defaultPromptFile"]),
		"defaultSchemaFile": summarizeOneFileRecord(reviewPacket["defaultSchemaFile"]),
	}, nil
}

func RenderReviewPrompt(promptInput map[string]any) (string, error) {
	modeSummaries := arrayOrEmpty(promptInput["modeSummaries"])
	comparisonQuestions := arrayOrEmpty(promptInput["comparisonQuestions"])
	if len(comparisonQuestions) == 0 {
		comparisonQuestions = []any{"Which behaviors improved, regressed, or stayed noisy in ways that matter to a real operator?"}
	}
	humanReviewPrompts := arrayOrEmpty(promptInput["humanReviewPrompts"])
	if len(humanReviewPrompts) == 0 {
		humanReviewPrompts = []any{map[string]any{"id": "real-user", "prompt": "Where would a real user still judge the candidate worse despite benchmark wins?"}}
	}
	lines := []string{
		"# Cautilus Review",
		"",
		stringOrEmpty(asMap(promptInput["metaPrompt"])["objective"]),
	}
	for _, entry := range arrayOrEmpty(asMap(promptInput["metaPrompt"])["instructions"]) {
		lines = append(lines, "- "+stringOrEmpty(entry))
	}
	lines = append(lines,
		"",
		"## Evaluation",
		"- intent: "+stringOrEmpty(promptInput["intent"]),
		"- candidate: "+stringOrEmpty(promptInput["candidate"]),
		"- baseline: "+stringOrEmpty(promptInput["baseline"]),
		"- automated recommendation: "+stringOrEmpty(promptInput["automatedRecommendation"]),
		"",
	)
	if evidenceLines := renderCurrentReportEvidence(asMap(promptInput["currentReportEvidence"])); len(evidenceLines) > 0 {
		lines = append(lines, evidenceLines...)
		lines = append(lines, "")
	}
	intentLines := renderIntentProfile(asMap(promptInput["intentProfile"]))
	lines = append(lines, intentLines...)
	lines = append(lines, "", "## Mode Summaries")
	for _, raw := range modeSummaries {
		modeLines := renderModeSummary(asMap(raw))
		lines = append(lines, modeLines...)
	}
	lines = append(lines, "", "## Comparison Questions")
	for index, entry := range comparisonQuestions {
		lines = append(lines, fmt.Sprintf("%d. %s", index+1, stringOrEmpty(entry)))
	}
	lines = append(lines, "", "## Human Review Lenses")
	for _, raw := range humanReviewPrompts {
		record := asMap(raw)
		lines = append(lines, fmt.Sprintf("- %s: %s", stringOrEmpty(record["id"]), stringOrEmpty(record["prompt"])))
	}
	if section := renderFileList("## Artifact Files", arrayOrEmpty(promptInput["artifactFiles"])); len(section) > 0 {
		lines = append(lines, "")
		lines = append(lines, section...)
	}
	if section := renderFileList("## Report Artifacts", arrayOrEmpty(promptInput["reportArtifacts"])); len(section) > 0 {
		lines = append(lines, "")
		lines = append(lines, section...)
	}
	if defaultSchema := asMap(promptInput["defaultSchemaFile"]); stringOrEmpty(defaultSchema["absolutePath"]) != "" {
		lines = append(lines, "", "## Output Contract", "- schema file: "+stringOrEmpty(defaultSchema["absolutePath"]))
	}
	lines = append(lines, "", "Return a verdict that follows the provided output schema. If the provided evidence is insufficient for a bounded review, return the schema-compliant blocked payload with a concrete reason code and reason instead of prose.")
	if consumerPrompt, err := maybeReadConsumerPrompt(asMap(promptInput["defaultPromptFile"])); err == nil && strings.TrimSpace(consumerPrompt) != "" {
		lines = append(lines, "", "## Consumer Prompt Addendum", consumerPrompt)
	}
	return strings.TrimRight(strings.Join(lines, "\n"), "\n") + "\n", nil
}

func collectReferencedFiles(repoRoot string, relativePaths []string) []any {
	result := make([]any, 0, len(relativePaths))
	for _, relativePath := range relativePaths {
		absolutePath := filepath.Join(repoRoot, relativePath)
		result = append(result, map[string]any{
			"relativePath": relativePath,
			"absolutePath": absolutePath,
			"exists":       fileExists(absolutePath),
		})
	}
	return result
}

func collectOptionalFile(repoRoot string, relativePath string) any {
	if strings.TrimSpace(relativePath) == "" {
		return nil
	}
	absolutePath := filepath.Join(repoRoot, relativePath)
	return map[string]any{
		"relativePath": relativePath,
		"absolutePath": absolutePath,
		"exists":       fileExists(absolutePath),
	}
}

func summarizeModeSummaries(reviewPacket map[string]any) []any {
	report := asMap(reviewPacket["report"])
	result := make([]any, 0)
	for _, raw := range arrayOrEmpty(report["modeSummaries"]) {
		record := asMap(raw)
		summary := map[string]any{
			"mode":   record["mode"],
			"status": record["status"],
		}
		copyIfPresent(record, summary, "summary", "telemetry", "scenarioTelemetrySummary", "compareArtifact")
		result = append(result, summary)
	}
	return result
}

func summarizeFileRecords(value any) []any {
	result := make([]any, 0)
	for _, raw := range arrayOrEmpty(value) {
		if summary := summarizeOneFileRecord(raw); summary != nil {
			result = append(result, summary)
		}
	}
	return result
}

func summarizeCommandObservations(value any) []any {
	result := make([]any, 0)
	for _, raw := range arrayOrEmpty(value) {
		record := asMap(raw)
		if len(record) == 0 {
			continue
		}
		summary := map[string]any{}
		copyIfPresent(record, summary, "stage", "command", "status", "exitCode", "durationMs", "startedAt", "completedAt")
		if len(summary) > 0 {
			result = append(result, summary)
		}
	}
	return result
}

func summarizeOneFileRecord(value any) any {
	record := asMap(value)
	absolutePath := stringOrEmpty(record["absolutePath"])
	if absolutePath == "" {
		return nil
	}
	return map[string]any{
		"relativePath": nilIfEmpty(record["relativePath"]),
		"absolutePath": absolutePath,
		"exists":       truthy(record["exists"]),
	}
}

func renderIntentProfile(intentProfile map[string]any) []string {
	if len(intentProfile) == 0 {
		return nil
	}
	lines := []string{
		"## Intent Profile",
		"- intent id: " + stringOrEmpty(intentProfile["intentId"]),
		"- behavior surface: " + stringOrEmpty(intentProfile["behaviorSurface"]),
	}
	for _, raw := range arrayOrEmpty(intentProfile["successDimensions"]) {
		record := asMap(raw)
		lines = append(lines, fmt.Sprintf("- success: %s -> %s", stringOrEmpty(record["id"]), stringOrEmpty(record["summary"])))
	}
	for _, raw := range arrayOrEmpty(intentProfile["guardrailDimensions"]) {
		record := asMap(raw)
		lines = append(lines, fmt.Sprintf("- guardrail: %s -> %s", stringOrEmpty(record["id"]), stringOrEmpty(record["summary"])))
	}
	return lines
}

func renderCurrentReportEvidence(evidence map[string]any) []string {
	if len(evidence) == 0 {
		return nil
	}
	lines := []string{"## Current Report Evidence"}
	if reportFile := stringOrEmpty(evidence["reportFile"]); reportFile != "" {
		lines = append(lines, "- report file: "+reportFile)
	}
	if generatedAt := stringOrEmpty(evidence["reportGeneratedAt"]); generatedAt != "" {
		lines = append(lines, "- report generatedAt: "+generatedAt)
	}
	if recommendation := stringOrEmpty(evidence["automatedRecommendation"]); recommendation != "" {
		lines = append(lines, "- current automated recommendation: "+recommendation)
	}
	commandObservations := arrayOrEmpty(evidence["commandObservations"])
	if len(commandObservations) > 0 {
		lines = append(lines, "- current command observations:")
		for _, raw := range commandObservations {
			lines = append(lines, "  "+renderCommandObservation(asMap(raw)))
		}
	}
	return lines
}

func renderCommandObservation(observation map[string]any) string {
	parts := []string{}
	if stage := stringOrEmpty(observation["stage"]); stage != "" {
		parts = append(parts, stage)
	}
	if status := stringOrEmpty(observation["status"]); status != "" {
		parts = append(parts, status)
	}
	if command := stringOrEmpty(observation["command"]); command != "" {
		parts = append(parts, command)
	}
	if exitCode, ok := toFloat(observation["exitCode"]); ok {
		parts = append(parts, fmt.Sprintf("exitCode=%v", exitCode))
	}
	if duration, ok := toFloat(observation["durationMs"]); ok {
		parts = append(parts, fmt.Sprintf("durationMs=%v", duration))
	}
	return strings.Join(parts, " | ")
}

func renderModeSummary(modeSummary map[string]any) []string {
	lines := []string{fmt.Sprintf("- %s: %s", stringOrEmpty(modeSummary["mode"]), stringOrEmpty(modeSummary["status"]))}
	if summary := stringOrEmpty(modeSummary["summary"]); summary != "" {
		lines = append(lines, "  summary: "+summary)
	}
	if telemetry := renderTelemetry(asMap(modeSummary["telemetry"])); telemetry != "" {
		lines = append(lines, "  telemetry: "+telemetry)
	}
	if compareSummary := stringOrEmpty(asMap(modeSummary["compareArtifact"])["summary"]); compareSummary != "" {
		lines = append(lines, "  compare artifact: "+compareSummary)
	}
	return lines
}

func renderTelemetry(telemetry map[string]any) string {
	parts := make([]string, 0)
	if duration, ok := toFloat(telemetry["durationMs"]); ok {
		parts = append(parts, fmt.Sprintf("durationMs=%v", duration))
	}
	if totalTokens, ok := toFloat(telemetry["total_tokens"]); ok {
		parts = append(parts, fmt.Sprintf("total_tokens=%v", totalTokens))
	}
	if costUSD, ok := toFloat(telemetry["cost_usd"]); ok {
		parts = append(parts, fmt.Sprintf("cost_usd=%v", costUSD))
	}
	return strings.Join(parts, ", ")
}

func renderFileList(title string, files []any) []string {
	lines := []string{}
	for _, raw := range files {
		record := asMap(raw)
		absolutePath := stringOrEmpty(record["absolutePath"])
		if absolutePath == "" {
			continue
		}
		line := "- " + absolutePath
		if !truthy(record["exists"]) {
			line += " (missing at render time)"
		}
		lines = append(lines, line)
	}
	if len(lines) == 0 {
		return nil
	}
	return append([]string{title}, lines...)
}

func maybeReadConsumerPrompt(defaultPromptFile map[string]any) (string, error) {
	path := stringOrEmpty(defaultPromptFile["absolutePath"])
	if path == "" || !truthy(defaultPromptFile["exists"]) {
		return "", nil
	}
	payload, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(string(payload)), nil
}

func stringArrayOrEmpty(value any) []string {
	if stringsValue, ok := value.([]string); ok {
		return stringsValue
	}
	result := make([]string, 0)
	for _, raw := range arrayOrEmpty(value) {
		if text, ok := raw.(string); ok && strings.TrimSpace(text) != "" {
			result = append(result, text)
		}
	}
	return result
}

func arrayOfMapsOrEmpty(value any) []any {
	result := make([]any, 0)
	for _, raw := range arrayOrEmpty(value) {
		if record, ok := raw.(map[string]any); ok {
			result = append(result, record)
		}
	}
	return result
}

func truthy(value any) bool {
	flag, _ := value.(bool)
	return flag
}

func nilIfEmpty(value any) any {
	if text, ok := value.(string); ok && strings.TrimSpace(text) != "" {
		return text
	}
	return nil
}

func stringOrEmpty(value any) string {
	text, _ := value.(string)
	return text
}
