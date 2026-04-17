package runtime

import (
	"os"
	"strconv"
	"strings"
)

var providerRateLimitSignatures = []string{
	"rate limit",
	"rate_limit",
	"too many requests",
	"tokens per min",
	"requests per min",
	"429",
}

type artifactSignal struct {
	path    string
	excerpt string
}

func stringFromAny(value any) string {
	text, ok := value.(string)
	if !ok {
		return ""
	}
	return text
}

func firstRateLimitExcerpt(text string) string {
	for _, rawLine := range strings.Split(text, "\n") {
		line := strings.TrimSpace(rawLine)
		if line == "" {
			continue
		}
		lowerLine := strings.ToLower(line)
		for _, signature := range providerRateLimitSignatures {
			if strings.Contains(lowerLine, signature) {
				return line
			}
		}
	}
	return ""
}

func readArtifactSignal(path string) *artifactSignal {
	if strings.TrimSpace(path) == "" {
		return nil
	}
	payload, err := os.ReadFile(path)
	if err != nil {
		return nil
	}
	excerpt := firstRateLimitExcerpt(string(payload))
	if excerpt == "" {
		return nil
	}
	return &artifactSignal{path: path, excerpt: excerpt}
}

func collectModeArtifactPaths(mode string, modeRun map[string]any, commandObservations []any) []string {
	paths := make([]string, 0)
	for _, raw := range commandObservations {
		observation := asMap(raw)
		if stringFromAny(observation["stage"]) != mode {
			continue
		}
		for _, field := range []string{"stdoutFile", "stderrFile"} {
			if path := stringFromAny(observation[field]); strings.TrimSpace(path) != "" {
				paths = append(paths, path)
			}
		}
	}
	for _, rawPath := range stringSliceValue(asMap(asMap(modeRun["scenarioResults"])["compareArtifact"])["artifactPaths"]) {
		if strings.TrimSpace(rawPath) != "" {
			paths = append(paths, rawPath)
		}
	}
	return uniqueStrings(paths)
}

func buildRateLimitWarning(mode string, modeRun map[string]any, commandObservations []any) map[string]any {
	artifactPaths := collectModeArtifactPaths(mode, modeRun, commandObservations)
	signals := make([]artifactSignal, 0)
	for _, path := range artifactPaths {
		if signal := readArtifactSignal(path); signal != nil {
			signals = append(signals, *signal)
		}
	}
	if len(signals) == 0 {
		return nil
	}
	paths := make([]any, 0, len(signals))
	excerpts := make([]any, 0, minInt(len(signals), 3))
	for index, signal := range signals {
		paths = append(paths, signal.path)
		if index < 3 {
			excerpts = append(excerpts, signal.excerpt)
		}
	}
	return map[string]any{
		"code":          "provider_rate_limit_contamination",
		"category":      "runtime_provider_contamination",
		"mode":          mode,
		"summary":       mode + " evidence may be contaminated by provider rate limits (" + pluralizedCount(len(signals), "matching artifact") + ").",
		"signalCount":   float64(len(signals)),
		"artifactPaths": paths,
		"excerpts":      excerpts,
	}
}

func baseReportReasonCodes(status string) []string {
	switch status {
	case "rejected":
		return []string{"behavior_regression"}
	case "failed":
		return []string{"infrastructure_failure"}
	default:
		return []string{}
	}
}

func classifyModeSummary(modeSummary map[string]any, modeRun map[string]any, commandObservations []any) ([]any, []any) {
	reasonCodes := make([]string, 0)
	reasonCodes = append(reasonCodes, baseReportReasonCodes(stringFromAny(modeSummary["status"]))...)
	warnings := make([]any, 0)
	if warning := buildRateLimitWarning(stringFromAny(modeSummary["mode"]), modeRun, commandObservations); len(warning) > 0 {
		warnings = append(warnings, warning)
		reasonCodes = append(reasonCodes, stringFromAny(warning["code"]))
	}
	resultCodes := make([]any, 0, len(reasonCodes))
	for _, code := range uniqueStrings(reasonCodes) {
		resultCodes = append(resultCodes, code)
	}
	return resultCodes, warnings
}

func summarizeReportReasons(modeSummaries []any) ([]any, []any) {
	reasonCodeStrings := make([]string, 0)
	warnings := make([]any, 0)
	for _, raw := range modeSummaries {
		summary := asMap(raw)
		reasonCodeStrings = append(reasonCodeStrings, stringSliceValue(summary["reasonCodes"])...)
		warnings = append(warnings, arrayOrEmpty(summary["warnings"])...)
	}
	reasonCodes := make([]any, 0, len(reasonCodeStrings))
	for _, code := range uniqueStrings(reasonCodeStrings) {
		reasonCodes = append(reasonCodes, code)
	}
	return reasonCodes, warnings
}

func minInt(left int, right int) int {
	if left < right {
		return left
	}
	return right
}

func pluralizedCount(count int, singular string) string {
	if count == 1 {
		return "1 " + singular
	}
	return strconv.Itoa(count) + " " + singular + "s"
}
