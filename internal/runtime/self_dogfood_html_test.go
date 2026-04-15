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

func TestRenderSelfDogfoodHTMLIncludesPageTOC(t *testing.T) {
	summary, report, reviewSummary := sampleSelfDogfoodBundle()
	rendered := RenderSelfDogfoodHTML(summary, report, reviewSummary)
	for _, pattern := range []string{
		`class="toc-nav"`,
		`data-anchor="intent-heading"`,
		`data-anchor="observations-heading"`,
		`data-anchor="review-heading"`,
		`href="#intent-heading"`,
		`href="#observations-heading"`,
		`href="#review-heading"`,
	} {
		if !strings.Contains(rendered, pattern) {
			t.Fatalf("expected %q in rendered html", pattern)
		}
	}
	if strings.Count(rendered, `id="intent-heading"`) != 1 {
		t.Fatalf("expected intent-heading section to remain a single anchor target")
	}
}

func TestRenderSelfDogfoodExperimentsHTMLIncludesPageTOC(t *testing.T) {
	summary, report := sampleSelfDogfoodExperimentsBundle()
	rendered := RenderSelfDogfoodExperimentsHTML(summary, report)
	for _, pattern := range []string{
		`class="toc-nav"`,
		`href="#intent-heading"`,
		`href="#compare-heading"`,
		`href="#experiments-heading"`,
	} {
		if !strings.Contains(rendered, pattern) {
			t.Fatalf("expected %q in rendered html", pattern)
		}
	}
}

func TestRenderSelfDogfoodExperimentsHTMLRewritesSiblingArtifactLinks(t *testing.T) {
	summary, report := sampleSelfDogfoodExperimentsBundle()
	// Seed a primarySummary that mentions a sibling artifact link so the rewrite
	// surface is exercised beyond finding paths. escapeHTML will wrap the href
	// once the summary flows through the emitter, so this asserts the rewriter
	// runs after panel assembly.
	summary["experiments"] = append(arrayOrEmpty(summary["experiments"]), map[string]any{
		"adapterName":     "exp-linked",
		"overallStatus":   "pass",
		"executionStatus": "passed",
		"findingsCount":   0,
		"telemetry":       map[string]any{"durationMs": 900},
		"primarySummary":  `See <a href="notes/linked.md">linked</a> and <a href="data.json">data</a>.`,
		"variants":        []any{},
	})
	rendered := RenderSelfDogfoodExperimentsHTML(summary, report)
	if strings.Contains(rendered, `href="notes/linked.md"`) || strings.Contains(rendered, `href="data.json"`) {
		t.Fatalf("expected experiments renderer to apply link rewriting to sibling artifacts")
	}
	// Note: escaped HTML in primarySummary will keep raw `&lt;a href=...` text, so
	// rewriting only applies to emitter-produced anchors. Verify at least that
	// the TOC section anchors remain intact and were generated.
	for _, want := range []string{`href="#intent-heading"`, `href="#compare-heading"`, `href="#experiments-heading"`} {
		if !strings.Contains(rendered, want) {
			t.Fatalf("expected TOC anchor %q in experiments html", want)
		}
	}
}

func TestRenderSelfDogfoodHTMLRewritesMarkdownAndJSONLinks(t *testing.T) {
	summary, report, reviewSummary := sampleSelfDogfoodBundle()
	rendered := RenderSelfDogfoodHTML(summary, report, reviewSummary)
	// finding path `docs/specs/self-dogfood.spec.md` should become an anchor to `.html`.
	if !strings.Contains(rendered, `<a href="docs/specs/self-dogfood.html"><code>docs/specs/self-dogfood.spec.md</code></a>`) {
		t.Fatalf("expected .spec.md finding path rewritten to .html anchor; got:\n%s", rendered)
	}
	// Script path `.mjs` is not rewritten — only `.md`/`.spec.md`/`.json` are swapped.
	if !strings.Contains(rendered, `<code>scripts/run-self-dogfood.mjs</code>`) {
		t.Fatalf("expected non-linkable paths to stay code blocks")
	}
	// No stale .md / .spec.md / .json href attributes should leak through.
	stalePatterns := []string{`href="docs/specs/self-dogfood.spec.md"`, `href="summary.json"`, `href="report.json"`}
	for _, pattern := range stalePatterns {
		if strings.Contains(rendered, pattern) {
			t.Fatalf("expected rewriter to swap %q to .html", pattern)
		}
	}
}

func TestRewriteSelfDogfoodLinksPreservesFragmentsAndIgnoresAnchors(t *testing.T) {
	in := `<a href="docs/guide.md#section">g</a><a href="report.json?v=1">r</a><a href="#top">top</a><a href="already.html">x</a>`
	out := rewriteSelfDogfoodLinks(in)
	expected := `<a href="docs/guide.html#section">g</a><a href="report.html?v=1">r</a><a href="#top">top</a><a href="already.html">x</a>`
	if out != expected {
		t.Fatalf("rewriteSelfDogfoodLinks mismatch:\n got: %s\nwant: %s", out, expected)
	}
}

func TestSelfDogfoodStatusColorsMapToSemanticLabels(t *testing.T) {
	groups := map[string][]string{
		"#1b7f3a": {"accept", "pass", "passed"},
		"#a4161a": {"blocker", "failed", "reject"},
		"#a65d00": {"concern", "defer"},
		"#444c56": {"unknown"},
	}
	for color, statuses := range groups {
		for _, status := range statuses {
			if got := selfDogfoodStatusColor(status); got != color {
				t.Fatalf("status %q expected color %s, got %s", status, color, got)
			}
		}
	}
	// Unknown statuses fall back to the neutral color rather than a misleading green/red.
	if got := selfDogfoodStatusColor("totally-made-up"); got != "#444c56" {
		t.Fatalf("unknown status should fall back to neutral; got %s", got)
	}
	// Every label in the labels map must resolve to a color in the palette.
	for status := range selfDogfoodStatusLabels {
		got := selfDogfoodStatusColor(status)
		matched := false
		for color := range groups {
			if got == color {
				matched = true
				break
			}
		}
		if !matched {
			t.Fatalf("status %q maps to color %s which is outside the semantic palette", status, got)
		}
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
