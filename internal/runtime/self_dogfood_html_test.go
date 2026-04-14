package runtime

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestRenderSelfDogfoodHTMLIncludesHeadlineFields(t *testing.T) {
	summary, report, reviewSummary := sampleSelfDogfoodBundle()
	rendered := RenderSelfDogfoodHTML(summary, report, reviewSummary)
	for _, pattern := range []string{`<!DOCTYPE html>`, `<html lang="en">`, `data-status="overallStatus"`, `data-field="reportRecommendation"`, `>defer<`, `>accept-now<`} {
		if !strings.Contains(rendered, pattern) {
			t.Fatalf("expected %q in rendered html", pattern)
		}
	}
}

func TestRenderSelfDogfoodHTMLEscapesIntentAndSummary(t *testing.T) {
	summary, report, reviewSummary := sampleSelfDogfoodBundle()
	rendered := RenderSelfDogfoodHTML(summary, report, reviewSummary)
	if strings.Contains(rendered, "<strong>honestly</strong>") {
		t.Fatalf("expected escaped intent text")
	}
	for _, pattern := range []string{"&lt;strong&gt;honestly&lt;/strong&gt;", "verdict is &#39;concern&#39;", "findings &gt; 0"} {
		if !strings.Contains(rendered, pattern) {
			t.Fatalf("expected %q in rendered html", pattern)
		}
	}
}

func TestWriteSelfDogfoodHTMLWritesIndexNextToLatestBundle(t *testing.T) {
	latestDir := filepath.Join(t.TempDir(), "latest")
	writeSampleSelfDogfoodBundle(t, latestDir)
	outputPath, err := WriteSelfDogfoodHTML(latestDir, nil)
	if err != nil {
		t.Fatalf("WriteSelfDogfoodHTML returned error: %v", err)
	}
	if outputPath != filepath.Join(latestDir, "index.html") {
		t.Fatalf("unexpected output path: %s", outputPath)
	}
	payload, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	if !strings.Contains(string(payload), "Cautilus Self-Dogfood") {
		t.Fatalf("expected self-dogfood title in output html")
	}
}

func TestRenderSelfDogfoodExperimentsHTMLIncludesComparisonRows(t *testing.T) {
	summary, report := sampleSelfDogfoodExperimentsBundle()
	rendered := RenderSelfDogfoodExperimentsHTML(summary, report)
	for _, pattern := range []string{"A/B Comparison", `data-compare-row="deterministic-gate"`, `data-compare-row="exp-a"`, `data-compare-row="exp-b"`} {
		if !strings.Contains(rendered, pattern) {
			t.Fatalf("expected %q in rendered html", pattern)
		}
	}
}

func TestRenderSelfDogfoodExperimentsHTMLEscapesIntentAndSummary(t *testing.T) {
	summary, report := sampleSelfDogfoodExperimentsBundle()
	rendered := RenderSelfDogfoodExperimentsHTML(summary, report)
	if strings.Contains(rendered, "<b>baseline</b>") {
		t.Fatalf("expected escaped intent text")
	}
	for _, pattern := range []string{"&lt;b&gt;baseline&lt;/b&gt;", "exp-a is better than exp-b &amp; easier to trust."} {
		if !strings.Contains(rendered, pattern) {
			t.Fatalf("expected %q in rendered html", pattern)
		}
	}
}

func TestWriteSelfDogfoodExperimentsHTMLWritesIndexNextToLatestBundle(t *testing.T) {
	latestDir := filepath.Join(t.TempDir(), "latest")
	writeSampleSelfDogfoodExperimentsBundle(t, latestDir)
	outputPath, err := WriteSelfDogfoodExperimentsHTML(latestDir, nil)
	if err != nil {
		t.Fatalf("WriteSelfDogfoodExperimentsHTML returned error: %v", err)
	}
	if outputPath != filepath.Join(latestDir, "index.html") {
		t.Fatalf("unexpected output path: %s", outputPath)
	}
	payload, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	if !strings.Contains(string(payload), "Cautilus Self-Dogfood Experiments") {
		t.Fatalf("expected experiments title in output html")
	}
}

func writeSampleSelfDogfoodBundle(t *testing.T, latestDir string) {
	t.Helper()
	if err := os.MkdirAll(latestDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	summary, report, reviewSummary := sampleSelfDogfoodBundle()
	if err := writeJSONFile(filepath.Join(latestDir, "summary.json"), summary); err != nil {
		t.Fatalf("writeJSONFile returned error: %v", err)
	}
	if err := writeJSONFile(filepath.Join(latestDir, "report.json"), report); err != nil {
		t.Fatalf("writeJSONFile returned error: %v", err)
	}
	if err := writeJSONFile(filepath.Join(latestDir, "review-summary.json"), reviewSummary); err != nil {
		t.Fatalf("writeJSONFile returned error: %v", err)
	}
}

func writeSampleSelfDogfoodExperimentsBundle(t *testing.T, latestDir string) {
	t.Helper()
	if err := os.MkdirAll(latestDir, 0o755); err != nil {
		t.Fatalf("MkdirAll returned error: %v", err)
	}
	summary, report := sampleSelfDogfoodExperimentsBundle()
	if err := writeJSONFile(filepath.Join(latestDir, "summary.json"), summary); err != nil {
		t.Fatalf("writeJSONFile returned error: %v", err)
	}
	if err := writeJSONFile(filepath.Join(latestDir, "report.json"), report); err != nil {
		t.Fatalf("writeJSONFile returned error: %v", err)
	}
}

func sampleSelfDogfoodBundle() (map[string]any, map[string]any, map[string]any) {
	return map[string]any{
			"generatedAt":          "2026-04-11T00:29:26.763Z",
			"runId":                "2026-04-11T00-29-08.947Z",
			"baselineRef":          "origin/main",
			"artifactRoot":         "artifacts/self-dogfood",
			"intent":               "Cautilus should <strong>honestly</strong> record dogfood results.",
			"overallStatus":        "concern",
			"reportRecommendation": "defer",
			"gateRecommendation":   "accept-now",
			"reviewTelemetry": map[string]any{
				"variantCount":       1,
				"passedVariantCount": 1,
				"failedVariantCount": 0,
				"durationMs":         8694,
			},
		}, map[string]any{
			"schemaVersion": "cautilus.report_packet.v2",
			"intent":        "Cautilus should <strong>honestly</strong> record dogfood results.",
			"intentProfile": map[string]any{
				"schemaVersion":   "cautilus.behavior_intent.v1",
				"behaviorSurface": "operator_behavior",
				"successDimensions": []any{
					map[string]any{"id": "operator_guidance_clarity", "summary": "Keep guidance clear."},
				},
				"guardrailDimensions": []any{},
			},
			"commandObservations": []any{
				map[string]any{"stage": "preflight", "index": 1, "status": "passed", "command": "npm run hooks:check", "durationMs": 184, "exitCode": 0},
				map[string]any{"stage": "full_gate", "index": 1, "status": "passed", "command": "npm run verify", "durationMs": 8349, "exitCode": 0},
			},
		}, map[string]any{
			"telemetry": map[string]any{"variantCount": 1, "passedVariantCount": 1, "failedVariantCount": 0, "durationMs": 8694},
			"variants": []any{
				map[string]any{
					"id": "codex-review", "tool": "codex_exec", "status": "passed", "durationMs": 8694,
					"output": map[string]any{
						"verdict": "concern",
						"summary": "Review said verdict is 'concern' & findings > 0.",
						"findings": []any{
							map[string]any{"severity": "pass", "message": "Scope is narrow.", "path": "docs/specs/self-dogfood.spec.md"},
							map[string]any{"severity": "pass", "message": "recommendation derived honestly", "path": "scripts/run-self-dogfood.mjs"},
							map[string]any{"severity": "concern", "message": "evidence does not include report body", "path": "."},
						},
					},
				},
			},
		}
}

func sampleSelfDogfoodExperimentsBundle() (map[string]any, map[string]any) {
	return map[string]any{
			"generatedAt":          "2026-04-11T02:00:00.000Z",
			"runId":                "exp-2026-04-11T02-00-00",
			"baselineRef":          "origin/main",
			"artifactRoot":         "artifacts/self-dogfood/experiments",
			"intent":               "Experiments should compare <b>baseline</b> and variants honestly.",
			"overallStatus":        "concern",
			"reportRecommendation": "defer",
			"gateRecommendation":   "accept-now",
			"modeTelemetry":        map[string]any{"durationMs": 2400},
			"experiments": []any{
				map[string]any{
					"adapterName": "exp-a", "overallStatus": "pass", "executionStatus": "passed", "findingsCount": 0, "telemetry": map[string]any{"durationMs": 1800},
					"primarySummary": "exp-a is better than exp-b & easier to trust.",
					"variants":       []any{map[string]any{"id": "codex-review", "executionStatus": "passed", "verdict": "pass", "summary": "exp-a is better than exp-b & easier to trust.", "findingsCount": 0}},
				},
				map[string]any{
					"adapterName": "exp-b", "overallStatus": "concern", "executionStatus": "passed", "findingsCount": 2, "telemetry": map[string]any{"durationMs": 2200},
					"primarySummary": "exp-b needs more evidence.",
					"variants":       []any{map[string]any{"id": "codex-review", "executionStatus": "passed", "verdict": "concern", "summary": "exp-b needs more evidence.", "findingsCount": 2}},
				},
			},
		}, map[string]any{
			"schemaVersion":       "cautilus.report_packet.v2",
			"intent":              "Experiments should compare <b>baseline</b> and variants honestly.",
			"commandObservations": []any{},
		}
}
