package runtime

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestRenderReportHTMLIncludesHeadlineAndTOC(t *testing.T) {
	packet := sampleReportPacket()
	rendered := RenderReportHTML(packet)
	for _, pattern := range []string{
		`<!DOCTYPE html>`,
		`data-status="recommendation"`,
		`class="toc-nav"`,
		`href="#intent-heading"`,
		`href="#signals-heading"`,
		`href="#modes-heading"`,
		`href="#scenarios-heading"`,
		`href="#observations-heading"`,
		`href="#findings-heading"`,
		`<h2 id="signals-heading">Decision Signals</h2>`,
		`<h2 id="modes-heading">Modes</h2>`,
		`<h2 id="scenarios-heading">Scenario Outcomes</h2>`,
	} {
		if !strings.Contains(rendered, pattern) {
			t.Fatalf("expected %q in rendered report html", pattern)
		}
	}
}

func TestRenderReportHTMLRendersScenarioBuckets(t *testing.T) {
	packet := sampleReportPacket()
	rendered := RenderReportHTML(packet)
	for _, pattern := range []string{
		`data-bucket="improved"`,
		`data-bucket="regressed"`,
		`data-bucket="noisy"`,
		`<code>operator-guidance-smoke</code>`,
		`data-scenario="operator-recovery-next-step"`,
		`data-scenario="workflow-state-accuracy"`,
	} {
		if !strings.Contains(rendered, pattern) {
			t.Fatalf("expected %q in rendered report html", pattern)
		}
	}
	// Empty bucket (unchanged) should not produce a bucket block — the panel
	// only lists buckets that actually have entries.
	if strings.Contains(rendered, `data-bucket="unchanged"`) {
		t.Fatalf("empty bucket should not render a block")
	}
}

func TestRenderReportHTMLEscapesIntentAndRewritesLinks(t *testing.T) {
	packet := sampleReportPacket()
	rendered := RenderReportHTML(packet)
	if strings.Contains(rendered, "<em>operator</em>") {
		t.Fatalf("expected escaped intent text")
	}
	if !strings.Contains(rendered, "&lt;em&gt;operator&lt;/em&gt;") {
		t.Fatalf("expected html-escaped intent in rendered report html")
	}
	// Finding paths ending in .spec.md or .json should be linked with a rewritten .html href.
	if !strings.Contains(rendered, `<a href="docs/specs/operator.html"><code>docs/specs/operator.spec.md</code></a>`) {
		t.Fatalf("expected markdown finding path rewritten to .html anchor; got:\n%s", rendered)
	}
}

func TestRenderReportHTMLRendersReasonCodesAndWarnings(t *testing.T) {
	packet := sampleReportPacket()
	rendered := RenderReportHTML(packet)
	for _, pattern := range []string{
		`behavior_regression`,
		`provider_rate_limit_contamination`,
		`data-warning-index="1"`,
		`contamination or runtime warnings are currently limiting confidence`,
	} {
		if !strings.Contains(rendered, pattern) {
			t.Fatalf("expected %q in rendered report html", pattern)
		}
	}
}

func TestRenderReportHTMLFromFileRejectsLegacySchema(t *testing.T) {
	tempDir := t.TempDir()
	legacy := map[string]any{"schemaVersion": "cautilus.report_packet.v1"}
	inputPath := filepath.Join(tempDir, "report.json")
	if err := writeReportHTMLPacketFromJSON(inputPath, legacy); err != nil {
		t.Fatalf("setup error: %v", err)
	}
	if _, err := RenderReportHTMLFromFile(inputPath); err == nil {
		t.Fatalf("expected legacy schemaVersion to be rejected")
	}
}

func TestWriteReportHTMLFromFileWritesNextToInput(t *testing.T) {
	tempDir := t.TempDir()
	inputPath := filepath.Join(tempDir, "report.json")
	if err := writeReportHTMLPacketFromJSON(inputPath, sampleReportPacket()); err != nil {
		t.Fatalf("setup error: %v", err)
	}
	outputPath, err := WriteReportHTMLFromFile(inputPath, nil)
	if err != nil {
		t.Fatalf("WriteReportHTMLFromFile returned error: %v", err)
	}
	if outputPath != filepath.Join(tempDir, "report.html") {
		t.Fatalf("unexpected output path: %s", outputPath)
	}
	payload, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("ReadFile returned error: %v", err)
	}
	if !strings.Contains(string(payload), "Cautilus Report") {
		t.Fatalf("expected report title in output html")
	}
}

func TestReportAggregateStatusHelpers(t *testing.T) {
	packet := sampleReportPacket()
	if got := reportModesAggregateStatus(packet); got != "blocker" {
		t.Fatalf("modes aggregate: expected blocker (one failed mode), got %s", got)
	}
	if got := reportScenarioBucketsAggregateStatus(packet); got != "blocker" {
		t.Fatalf("buckets aggregate: expected blocker (regressed bucket populated), got %s", got)
	}
	if got := reportFindingsAggregateStatus(packet); got != "concern" {
		t.Fatalf("findings aggregate: expected concern, got %s", got)
	}
	if got := reportFindingsAggregateStatus(map[string]any{}); got != "n/a" {
		t.Fatalf("empty findings aggregate: expected n/a, got %s", got)
	}
}

func sampleReportPacket() map[string]any {
	return map[string]any{
		"schemaVersion":  "cautilus.report_packet.v2",
		"generatedAt":    "2026-04-16T00:00:00Z",
		"candidate":      "feature/report-html",
		"baseline":       "origin/main",
		"intent":         "Operator-facing <em>operator</em> behavior should remain legible.",
		"recommendation": "defer",
		"intentProfile": map[string]any{
			"schemaVersion":   "cautilus.behavior_intent.v1",
			"summary":         "Operator-facing <em>operator</em> behavior should remain legible.",
			"behaviorSurface": "operator_behavior",
			"successDimensions": []any{
				map[string]any{"id": "failure_cause_clarity"},
			},
			"guardrailDimensions": []any{
				map[string]any{"id": "operator_state_truthfulness"},
			},
		},
		"commands": []any{},
		"commandObservations": []any{
			map[string]any{"stage": "preflight", "index": float64(1), "status": "passed", "command": "npm run hooks:check", "durationMs": float64(120), "exitCode": float64(0)},
		},
		"modesRun": []any{"held_out", "full_gate"},
		"modeSummaries": []any{
			map[string]any{"mode": "held_out", "status": "passed", "summary": "held_out succeeded", "durationMs": float64(10000)},
			map[string]any{"mode": "full_gate", "status": "failed", "summary": "full_gate had a regression", "durationMs": float64(15000)},
		},
		"reasonCodes": []any{"behavior_regression", "provider_rate_limit_contamination"},
		"warnings": []any{
			map[string]any{
				"code":    "provider_rate_limit_contamination",
				"summary": "full_gate evidence may be contaminated by provider rate limits (1 matching artifact).",
			},
		},
		"telemetry": map[string]any{"modeCount": float64(2), "modesWithScenarioResults": float64(1), "durationMs": float64(25000)},
		"improved":  []any{"operator-guidance-smoke", map[string]any{"scenarioId": "operator-recovery-next-step"}},
		"regressed": []any{map[string]any{"scenarioId": "workflow-state-accuracy", "metric": "recall"}},
		"noisy":     []any{map[string]any{"scenarioId": "chatbot-latency-p95", "reason": "noisy metric"}},
		"unchanged": []any{},
		"humanReviewFindings": []any{
			map[string]any{"severity": "concern", "message": "operator path slightly ambiguous", "path": "docs/specs/operator.spec.md"},
			map[string]any{"severity": "pass", "message": "operator summary is explicit", "path": "scripts/run-self-dogfood.mjs"},
		},
	}
}
