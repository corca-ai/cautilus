package runtime

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
	"unicode/utf8"

	"github.com/corca-ai/cautilus/internal/contracts"
)

func TestBuildReviewPacketCollectsDurableReviewBoundary(t *testing.T) {
	repoRoot := t.TempDir()
	for _, dir := range []string{"prompts", "schemas", "artifacts", "reports"} {
		if err := os.MkdirAll(filepath.Join(repoRoot, dir), 0o755); err != nil {
			t.Fatalf("MkdirAll returned error: %v", err)
		}
	}
	writeRuntimeTestFile(t, filepath.Join(repoRoot, "prompts", "review.md"), "review prompt\n")
	writeRuntimeTestFile(t, filepath.Join(repoRoot, "schemas", "review.schema.json"), "{\"type\":\"object\"}\n")
	writeRuntimeTestFile(t, filepath.Join(repoRoot, "artifacts", "compare-report.json"), "{\"verdict\":\"defer\"}\n")
	writeRuntimeTestFile(t, filepath.Join(repoRoot, "reports", "report.json"), "{\"schemaVersion\":\"cautilus.report_packet.v2\"}\n")

	reportFile := filepath.Join(repoRoot, "reports", "report.json")
	report := map[string]any{
		"schemaVersion": contracts.ReportPacketSchema,
		"intent":        "Operator can compare a candidate against a baseline.",
		"intentProfile": map[string]any{
			"schemaVersion": contracts.BehaviorIntentSchema,
			"intentId":      "intent-review-boundary",
		},
		"recommendation": "defer",
	}
	adapterData := map[string]any{
		"default_prompt_file":  "prompts/review.md",
		"default_schema_file":  "schemas/review.schema.json",
		"artifact_paths":       []string{"artifacts/compare-report.json"},
		"report_paths":         []string{"reports/report.json"},
		"comparison_questions": []string{"Which scenario-level deltas matter?"},
		"human_review_prompts": []any{map[string]any{"id": "operator", "prompt": "Where is the workflow still misleading?"}},
	}

	packet, err := BuildReviewPacket(repoRoot, filepath.Join(repoRoot, ".agents", "cautilus-adapter.yaml"), adapterData, reportFile, report, time.Date(2026, 5, 16, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildReviewPacket returned error: %v", err)
	}
	if packet["schemaVersion"] != contracts.ReviewPacketSchema {
		t.Fatalf("unexpected schemaVersion: %#v", packet["schemaVersion"])
	}
	if packet["reportFile"] != reportFile {
		t.Fatalf("unexpected reportFile: %#v", packet["reportFile"])
	}
	if got := packet["report"].(map[string]any)["intent"]; got != report["intent"] {
		t.Fatalf("unexpected report intent: %#v", got)
	}
	assertExistingFileRecord(t, packet["defaultPromptFile"], "prompts/review.md")
	assertExistingFileRecord(t, packet["defaultSchemaFile"], "schemas/review.schema.json")
	assertExistingFileRecord(t, packet["artifactFiles"].([]any)[0], "artifacts/compare-report.json")
	assertExistingFileRecord(t, packet["reportArtifacts"].([]any)[0], "reports/report.json")
	if got := packet["comparisonQuestions"].([]string)[0]; got != "Which scenario-level deltas matter?" {
		t.Fatalf("unexpected comparison question: %#v", got)
	}
	if got := packet["humanReviewPrompts"].([]any)[0].(map[string]any)["id"]; got != "operator" {
		t.Fatalf("unexpected human review prompt id: %#v", got)
	}
}

func TestBuildOutputUnderTestTextCountsUnicodeCodePoints(t *testing.T) {
	tests := []struct {
		name          string
		text          string
		wantText      string
		wantCount     int
		wantExcerpt   int
		wantTruncated bool
	}{
		{name: "exact ASCII boundary", text: strings.Repeat("a", outputUnderTestTextLimit), wantText: strings.Repeat("a", outputUnderTestTextLimit), wantCount: outputUnderTestTextLimit, wantExcerpt: outputUnderTestTextLimit},
		{name: "ASCII beyond boundary", text: strings.Repeat("a", outputUnderTestTextLimit+1), wantText: strings.Repeat("a", outputUnderTestTextLimit), wantCount: outputUnderTestTextLimit + 1, wantExcerpt: outputUnderTestTextLimit, wantTruncated: true},
		{name: "multibyte boundary", text: "a" + strings.Repeat("가", outputUnderTestTextLimit), wantText: "a" + strings.Repeat("가", outputUnderTestTextLimit-1), wantCount: outputUnderTestTextLimit + 1, wantExcerpt: outputUnderTestTextLimit, wantTruncated: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			path := filepath.Join(t.TempDir(), "output.json")
			payload, err := json.Marshal(map[string]any{"result": map[string]any{"text": test.text}})
			if err != nil {
				t.Fatalf("Marshal returned error: %v", err)
			}
			writeRuntimeTestFile(t, path, string(payload))
			key := "result.text"
			value, err := buildOutputUnderTestText(path, &key)
			if err != nil {
				t.Fatalf("buildOutputUnderTestText returned error: %v", err)
			}
			record := value.(map[string]any)
			gotText := record["text"].(string)
			if !utf8.ValidString(gotText) {
				t.Fatal("excerpt is not valid UTF-8")
			}
			if gotText != test.wantText {
				t.Fatal("excerpt did not preserve the first requested Unicode code points")
			}
			if got := record["charCount"]; got != test.wantCount {
				t.Fatalf("charCount = %#v, want %d", got, test.wantCount)
			}
			if got := utf8.RuneCountInString(gotText); got != test.wantExcerpt {
				t.Fatalf("excerpt rune count = %d, want %d", got, test.wantExcerpt)
			}
			if got := record["truncated"]; got != test.wantTruncated {
				t.Fatalf("truncated = %#v, want %t", got, test.wantTruncated)
			}
		})
	}
}

func TestBuildReviewPromptInputFromScenarioRendersRealizedOutput(t *testing.T) {
	repoRoot := t.TempDir()
	for _, dir := range []string{"prompts", "schemas", "artifacts"} {
		if err := os.MkdirAll(filepath.Join(repoRoot, dir), 0o755); err != nil {
			t.Fatalf("MkdirAll returned error: %v", err)
		}
	}
	writeRuntimeTestFile(t, filepath.Join(repoRoot, "prompts", "review.md"), "Prefer realized operator evidence.\n")
	writeRuntimeTestFile(t, filepath.Join(repoRoot, "schemas", "review.schema.json"), "{\"type\":\"object\"}\n")
	outputPath := filepath.Join(repoRoot, "artifacts", "analysis.json")
	writeRuntimeTestFile(t, outputPath, "{\"result\":{\"text\":\"실패 원인과 복구 경로\"}}\n")
	key := "result.text"
	scenario := map[string]any{
		"schemaVersion":  contracts.DraftScenarioSchema,
		"scenarioId":     "unicode-review-path",
		"name":           "Unicode Review Path",
		"description":    "Judge whether the realized output explains the failure path.",
		"simulatorTurns": []any{"Reproduce the failure", "Explain the recovery path"},
		"intentProfile": map[string]any{
			"schemaVersion": contracts.BehaviorIntentSchema,
			"intentId":      "intent-unicode-review-path",
		},
	}
	adapterData := map[string]any{
		"default_prompt_file":  "prompts/review.md",
		"default_schema_file":  "schemas/review.schema.json",
		"comparison_questions": []string{"Does the realized output explain recovery?"},
	}

	promptInput, err := BuildReviewPromptInputFromScenario(repoRoot, "adapter.yaml", adapterData, scenario, "scenario.json", nil, outputPath, &key, time.Date(2026, 7, 11, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildReviewPromptInputFromScenario returned error: %v", err)
	}
	prompt, err := RenderReviewPrompt(promptInput)
	if err != nil {
		t.Fatalf("RenderReviewPrompt returned error: %v", err)
	}
	for _, want := range []string{
		"## Scenario Context",
		"unicode-review-path",
		"Reproduce the failure",
		"## Output Under Test Text",
		"실패 원인과 복구 경로",
		"## Output Contract",
		"## Consumer Prompt Addendum",
		"Prefer realized operator evidence.",
	} {
		if !strings.Contains(prompt, want) {
			t.Fatalf("rendered prompt missing %q:\n%s", want, prompt)
		}
	}
}

func writeRuntimeTestFile(t *testing.T, path string, payload string) {
	t.Helper()
	if err := os.WriteFile(path, []byte(payload), 0o644); err != nil {
		t.Fatalf("WriteFile returned error: %v", err)
	}
}

func assertExistingFileRecord(t *testing.T, value any, relativePath string) {
	t.Helper()
	record, ok := value.(map[string]any)
	if !ok {
		t.Fatalf("expected file record map, got %#v", value)
	}
	if record["relativePath"] != relativePath {
		t.Fatalf("unexpected relativePath: %#v", record["relativePath"])
	}
	if record["exists"] != true {
		t.Fatalf("unexpected exists flag: %#v", record["exists"])
	}
}
