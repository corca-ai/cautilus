package runtime

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestRenderReviewPacketHTMLIncludesIntentAndQuestions(t *testing.T) {
	packet := sampleReviewPacket()
	rendered := RenderReviewPacketHTML(packet)
	for _, pattern := range []string{
		`<!DOCTYPE html>`,
		`class="toc-nav"`,
		`href="#intent-heading"`,
		`href="#questions-heading"`,
		`href="#prompts-heading"`,
		`href="#artifacts-heading"`,
		`<h2 id="questions-heading">Comparison Questions</h2>`,
		`<h2 id="prompts-heading">Human Review Prompts</h2>`,
		`<h2 id="artifacts-heading">Artifacts</h2>`,
		`data-prompt-id="real-user"`,
		`Which behaviors improved`,
	} {
		if !strings.Contains(rendered, pattern) {
			t.Fatalf("expected %q in rendered review packet html", pattern)
		}
	}
}

func TestRenderReviewPacketHTMLRewritesArtifactLinks(t *testing.T) {
	packet := sampleReviewPacket()
	rendered := RenderReviewPacketHTML(packet)
	if strings.Contains(rendered, `href="/tmp/cautilus/report.json"`) {
		t.Fatalf("expected report.json href to be rewritten to .html")
	}
	if !strings.Contains(rendered, `href="/tmp/cautilus/report.html"`) {
		t.Fatalf("expected rewritten report.html link in review packet html")
	}
	if !strings.Contains(rendered, `href="docs/specs/review.html"><code>docs/specs/review.spec.md</code>`) {
		t.Fatalf("expected artifactFile .spec.md rewritten to .html")
	}
}

func TestRenderReviewPacketHTMLFromFileRejectsWrongSchema(t *testing.T) {
	tempDir := t.TempDir()
	inputPath := filepath.Join(tempDir, "review.json")
	if err := writeReportHTMLPacketFromJSON(inputPath, map[string]any{"schemaVersion": "some.other.schema"}); err != nil {
		t.Fatalf("setup error: %v", err)
	}
	if _, err := RenderReviewPacketHTMLFromFile(inputPath); err == nil {
		t.Fatalf("expected wrong schemaVersion to be rejected")
	}
}

func TestWriteReviewPacketHTMLFromFileWritesNextToInput(t *testing.T) {
	tempDir := t.TempDir()
	inputPath := filepath.Join(tempDir, "review.json")
	if err := writeReportHTMLPacketFromJSON(inputPath, sampleReviewPacket()); err != nil {
		t.Fatalf("setup error: %v", err)
	}
	outputPath, err := WriteReviewPacketHTMLFromFile(inputPath, nil)
	if err != nil {
		t.Fatalf("WriteReviewPacketHTMLFromFile returned error: %v", err)
	}
	if outputPath != filepath.Join(tempDir, "review.html") {
		t.Fatalf("unexpected output path: %s", outputPath)
	}
	payload, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("ReadFile error: %v", err)
	}
	if !strings.Contains(string(payload), "Cautilus Review Packet") {
		t.Fatalf("expected review packet title in output html")
	}
}

func TestRenderReviewSummaryHTMLRendersVariantsAndFindings(t *testing.T) {
	summary := sampleReviewSummary()
	rendered := RenderReviewSummaryHTML(summary)
	for _, pattern := range []string{
		`data-status="reviewVerdict"`,
		`<h2 id="consensus-heading">Consensus</h2>`,
		`<h2 id="telemetry-heading">Telemetry</h2>`,
		`<h2 id="variants-heading">Variants</h2>`,
		`<h2 id="findings-heading">Flattened Findings</h2>`,
		`data-variant="codex-review-a"`,
		`data-variant="codex-review-b"`,
		`verdict concern: 1`,
		`verdict pass: 1`,
		`Execution aligned, but verdicts diverged across variants.`,
		`verdict: concern`,
		`verdict: pass`,
		`execution: pass`,
		`RC_NO_BENCHMARK_EVIDENCE`,
	} {
		if !strings.Contains(rendered, pattern) {
			t.Fatalf("expected %q in rendered review summary html", pattern)
		}
	}
}

func TestRenderReviewSummaryHTMLFromFileRejectsWrongSchema(t *testing.T) {
	tempDir := t.TempDir()
	inputPath := filepath.Join(tempDir, "review-summary.json")
	if err := writeReportHTMLPacketFromJSON(inputPath, map[string]any{"schemaVersion": "cautilus.review_packet.v1"}); err != nil {
		t.Fatalf("setup error: %v", err)
	}
	if _, err := RenderReviewSummaryHTMLFromFile(inputPath); err == nil {
		t.Fatalf("expected wrong schemaVersion to be rejected")
	}
}

func TestWriteReviewSummaryHTMLFromFileWritesNextToInput(t *testing.T) {
	tempDir := t.TempDir()
	inputPath := filepath.Join(tempDir, "review-summary.json")
	if err := writeReportHTMLPacketFromJSON(inputPath, sampleReviewSummary()); err != nil {
		t.Fatalf("setup error: %v", err)
	}
	outputPath, err := WriteReviewSummaryHTMLFromFile(inputPath, nil)
	if err != nil {
		t.Fatalf("WriteReviewSummaryHTMLFromFile returned error: %v", err)
	}
	if outputPath != filepath.Join(tempDir, "review-summary.html") {
		t.Fatalf("unexpected output path: %s", outputPath)
	}
	payload, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("ReadFile error: %v", err)
	}
	if !strings.Contains(string(payload), "Cautilus Review Summary") {
		t.Fatalf("expected review summary title in output html")
	}
}

func TestReviewSummaryConsensusAggregateStatus(t *testing.T) {
	summary := sampleReviewSummary()
	if got := reviewSummaryConsensusAggregateStatus(summary); got != "concern" {
		t.Fatalf("expected concern when verdicts diverge, got %s", got)
	}
	summary["variants"] = []any{
		map[string]any{
			"id":     "codex-review-a",
			"status": "passed",
			"output": map[string]any{"verdict": "pass"},
		},
		map[string]any{
			"id":     "codex-review-b",
			"status": "passed",
			"output": map[string]any{"verdict": "pass"},
		},
	}
	summary["reviewVerdict"] = "pass"
	if got := reviewSummaryConsensusAggregateStatus(summary); got != "pass" {
		t.Fatalf("expected pass when variants align, got %s", got)
	}
}

func sampleReviewPacket() map[string]any {
	return map[string]any{
		"schemaVersion": "cautilus.review_packet.v1",
		"generatedAt":   "2026-04-16T00:00:00Z",
		"repoRoot":      "/home/op/cautilus",
		"adapterPath":   "/home/op/cautilus/.agents/cautilus-adapter.yaml",
		"reportFile":    "/tmp/cautilus/report.json",
		"report": map[string]any{
			"schemaVersion":  "cautilus.report_packet.v2",
			"intent":         "Operator can judge an evaluation without an agent.",
			"candidate":      "feature/review-html",
			"baseline":       "origin/main",
			"recommendation": "defer",
		},
		"comparisonQuestions": []any{
			"Which behaviors improved?",
			"Where do automated and human judgment diverge?",
		},
		"humanReviewPrompts": []any{
			map[string]any{"id": "real-user", "prompt": "Would a real user still judge the candidate worse?"},
		},
		"artifactFiles": []any{
			map[string]any{"path": "docs/specs/review.spec.md"},
		},
		"reportArtifacts": []any{
			map[string]any{"path": "/tmp/cautilus/scenario-results.json"},
		},
	}
}

func sampleReviewSummary() map[string]any {
	return map[string]any{
		"schemaVersion": "cautilus.review_summary.v1",
		"generatedAt":   "2026-04-16T00:00:00Z",
		"status":        "passed",
		"reviewVerdict": "concern",
		"reasonCodes":   []any{"RC_NO_BENCHMARK_EVIDENCE"},
		"findingsCount": float64(1),
		"telemetry": map[string]any{
			"variantCount":       float64(2),
			"passedVariantCount": float64(2),
			"failedVariantCount": float64(0),
			"durationMs":         float64(12000),
		},
		"variants": []any{
			map[string]any{
				"id":         "codex-review-a",
				"status":     "passed",
				"durationMs": float64(6000),
				"output": map[string]any{
					"verdict": "concern",
					"summary": "Evidence is promising but shallow.",
					"findings": []any{
						map[string]any{"severity": "concern", "message": "needs more held_out evidence", "path": "docs/specs/review.spec.md"},
					},
				},
			},
			map[string]any{
				"id":         "codex-review-b",
				"status":     "passed",
				"durationMs": float64(6000),
				"output": map[string]any{
					"verdict":  "pass",
					"summary":  "Second reviewer is satisfied.",
					"findings": []any{},
				},
			},
		},
		"humanReviewFindings": []any{
			map[string]any{"severity": "concern", "message": "needs more held_out evidence", "path": "docs/specs/review.spec.md"},
		},
	}
}
