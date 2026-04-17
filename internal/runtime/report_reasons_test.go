package runtime

import (
	"os"
	"testing"
)

func TestClassifyModeSummarySurfacesProviderRateLimitFromHTTP429Context(t *testing.T) {
	t.Helper()
	root := t.TempDir()
	stderrFile := root + "/held-out.stderr"
	if err := os.WriteFile(stderrFile, []byte("HTTP 429 from provider after retry budget exhausted.\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	modeSummary := map[string]any{
		"mode":   "held_out",
		"status": "failed",
	}
	modeRun := map[string]any{
		"scenarioResults": map[string]any{},
	}
	commandObservations := []any{
		map[string]any{
			"stage":      "held_out",
			"stderrFile": stderrFile,
		},
	}

	reasonCodes, warnings := classifyModeSummary(modeSummary, modeRun, commandObservations)
	if len(reasonCodes) != 2 {
		t.Fatalf("unexpected reason codes: %#v", reasonCodes)
	}
	if reasonCodes[0] != "infrastructure_failure" || reasonCodes[1] != "provider_rate_limit_contamination" {
		t.Fatalf("unexpected reason codes: %#v", reasonCodes)
	}
	if len(warnings) != 1 {
		t.Fatalf("unexpected warnings: %#v", warnings)
	}
}

func TestClassifyModeSummaryIgnoresResultIDDigitsThatContain429(t *testing.T) {
	t.Helper()
	root := t.TempDir()
	stdoutFile := root + "/held-out.stdout"
	if err := os.WriteFile(stdoutFile, []byte("{\"resultId\":\"sim_1776432344429_6bde32c7\"}\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	modeSummary := map[string]any{
		"mode":   "held_out",
		"status": "failed",
	}
	modeRun := map[string]any{
		"scenarioResults": map[string]any{},
	}
	commandObservations := []any{
		map[string]any{
			"stage":      "held_out",
			"stdoutFile": stdoutFile,
		},
	}

	reasonCodes, warnings := classifyModeSummary(modeSummary, modeRun, commandObservations)
	if len(reasonCodes) != 1 || reasonCodes[0] != "infrastructure_failure" {
		t.Fatalf("unexpected reason codes: %#v", reasonCodes)
	}
	if len(warnings) != 0 {
		t.Fatalf("unexpected warnings: %#v", warnings)
	}
}

func TestClassifyModeSummaryStillDetectsStructured429AlongsideResultID(t *testing.T) {
	t.Helper()
	root := t.TempDir()
	stdoutFile := root + "/held-out.stdout"
	line := "{\"resultId\":\"sim_1776432344429_6bde32c7\",\"status\":429,\"error\":\"Too many requests\"}\n"
	if err := os.WriteFile(stdoutFile, []byte(line), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	modeSummary := map[string]any{
		"mode":   "held_out",
		"status": "failed",
	}
	modeRun := map[string]any{
		"scenarioResults": map[string]any{},
	}
	commandObservations := []any{
		map[string]any{
			"stage":      "held_out",
			"stdoutFile": stdoutFile,
		},
	}

	reasonCodes, warnings := classifyModeSummary(modeSummary, modeRun, commandObservations)
	if len(reasonCodes) != 2 {
		t.Fatalf("unexpected reason codes: %#v", reasonCodes)
	}
	if reasonCodes[0] != "infrastructure_failure" || reasonCodes[1] != "provider_rate_limit_contamination" {
		t.Fatalf("unexpected reason codes: %#v", reasonCodes)
	}
	if len(warnings) != 1 {
		t.Fatalf("unexpected warnings: %#v", warnings)
	}
}

func TestClassifyModeSummaryDoesNotTreat1429AsRateLimit(t *testing.T) {
	t.Helper()
	root := t.TempDir()
	stderrFile := root + "/held-out.stderr"
	if err := os.WriteFile(stderrFile, []byte("statusCode=1429 response=\"upstream validation failed\"\n"), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
	modeSummary := map[string]any{
		"mode":   "held_out",
		"status": "failed",
	}
	modeRun := map[string]any{
		"scenarioResults": map[string]any{},
	}
	commandObservations := []any{
		map[string]any{
			"stage":      "held_out",
			"stderrFile": stderrFile,
		},
	}

	reasonCodes, warnings := classifyModeSummary(modeSummary, modeRun, commandObservations)
	if len(reasonCodes) != 1 || reasonCodes[0] != "infrastructure_failure" {
		t.Fatalf("unexpected reason codes: %#v", reasonCodes)
	}
	if len(warnings) != 0 {
		t.Fatalf("unexpected warnings: %#v", warnings)
	}
}
