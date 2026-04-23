package runtime

import (
	"fmt"
	"html"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var selfDogfoodStatusLabels = map[string]string{
	"accept":  "accept",
	"blocker": "blocker",
	"concern": "concern",
	"defer":   "defer",
	"failed":  "failed",
	"n/a":     "n/a",
	"pass":    "pass",
	"passed":  "passed",
	"reject":  "reject",
	"unknown": "unknown",
}

var selfDogfoodStatusColors = map[string]string{
	"accept":  "#1b7f3a",
	"blocker": "#a4161a",
	"concern": "#a65d00",
	"defer":   "#a65d00",
	"failed":  "#a4161a",
	"pass":    "#1b7f3a",
	"passed":  "#1b7f3a",
	"reject":  "#a4161a",
	"unknown": "#444c56",
}

const selfDogfoodHTMLStyles = `
:root {
	color-scheme: light dark;
	--page-bg: #f3f5f7;
	--page-accent: rgba(27, 127, 58, 0.08);
	--page-accent-warm: rgba(166, 93, 0, 0.08);
	--surface: #ffffff;
	--surface-muted: #f6f8fa;
	--surface-strong: #eef2f6;
	--text: #1f2328;
	--text-muted: #5a6472;
	--text-soft: #6e7781;
	--border: #d8dee4;
	--border-strong: #c5ced8;
	--shadow: 0 10px 30px rgba(15, 23, 42, 0.06), 0 2px 8px rgba(15, 23, 42, 0.04);
	--shadow-strong: 0 18px 40px rgba(15, 23, 42, 0.10), 0 4px 10px rgba(15, 23, 42, 0.06);
}
body {
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
	margin: 0;
	background:
		radial-gradient(circle at top left, var(--page-accent), transparent 26rem),
		radial-gradient(circle at top right, var(--page-accent-warm), transparent 24rem),
		linear-gradient(180deg, #f8fafc 0%, var(--page-bg) 100%);
	color: var(--text);
	line-height: 1.5;
}
main { max-width: 1120px; margin: 0 auto; padding: 28px 18px 56px; }
.banner {
	background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.94) 100%);
	padding: 24px 26px;
	border-radius: 14px;
	box-shadow: var(--shadow-strong);
	margin-bottom: 18px;
	border: 1px solid rgba(197, 206, 216, 0.65);
}
.banner-title { font-size: 24px; font-weight: 700; margin-bottom: 10px; letter-spacing: -0.02em; }
.banner-status { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.banner-meta { color: var(--text-muted); font-size: 13px; font-variant-numeric: tabular-nums; }
.chip {
	display: inline-block;
	color: #ffffff;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.03em;
	text-transform: lowercase;
	box-shadow: inset 0 -1px 0 rgba(255,255,255,0.18);
}
.chip.neutral { background: #444c56; }
.panel {
	background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%);
	padding: 22px 24px;
	border-radius: 14px;
	box-shadow: var(--shadow);
	margin-bottom: 18px;
	border: 1px solid rgba(197, 206, 216, 0.62);
}
.panel h2 {
	margin-top: 0;
	margin-bottom: 14px;
	font-size: 12px;
	text-transform: uppercase;
	letter-spacing: 0.10em;
	color: var(--text-muted);
}
.panel h3 { margin-top: 0; }
.panel h4 {
	margin: 16px 0 8px;
	font-size: 12px;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: var(--text-muted);
}
.panel-copy { color: var(--text-muted); margin-top: 0; }
.panel-lead { font-size: 15px; margin: 0 0 12px; }
.intent-text { font-size: 16px; margin: 0 0 16px; }
.decision-grid {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12px;
}
.decision-card {
	border: 1px solid var(--border);
	border-radius: 12px;
	padding: 14px 16px;
	background: linear-gradient(180deg, rgba(246,248,250,0.86) 0%, rgba(255,255,255,0.96) 100%);
}
.decision-label {
	margin: 0 0 8px;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: var(--text-muted);
}
.decision-value { margin: 0; font-size: 15px; }
.decision-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.text-link {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	color: var(--text);
	font-size: 13px;
	font-weight: 700;
	text-decoration: none;
	border-bottom: 1px solid var(--border-strong);
}
.text-link:hover { border-bottom-color: currentColor; }
.meta-grid {
	display: grid;
	grid-template-columns: max-content 1fr;
	gap: 4px 16px;
	margin: 0;
	font-size: 14px;
}
.meta-grid dt { color: var(--text-muted); }
.meta-grid dd { margin: 0; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; overflow: hidden; border-radius: 10px; }
.data-table th, .data-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
.data-table th {
	font-weight: 700;
	color: var(--text-muted);
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	background: var(--surface-muted);
}
.data-table tbody tr:nth-child(even) td { background: rgba(238, 242, 246, 0.45); }
.data-table tbody tr:hover td { background: rgba(230, 237, 243, 0.72); }
.data-table code { font-size: 12px; }
.empty { color: var(--text-soft); font-style: italic; }
.variant {
	border: 1px solid var(--border);
	border-radius: 12px;
	padding: 16px 18px;
	margin-top: 12px;
	background: linear-gradient(180deg, rgba(246,248,250,0.82) 0%, rgba(255,255,255,0.92) 100%);
	box-shadow: inset 0 1px 0 rgba(255,255,255,0.75);
}
.variant-header h3 { margin: 0 0 8px; font-size: 16px; letter-spacing: -0.01em; }
.variant-header small { color: var(--text-muted); font-weight: 500; }
.variant-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.variant-summary { margin: 8px 0; white-space: pre-wrap; }
.chip-row { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 12px; }
.findings { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.finding {
	display: flex;
	gap: 10px;
	align-items: flex-start;
	padding: 10px 12px;
	background: var(--surface-muted);
	border-radius: 10px;
	border: 1px solid rgba(216, 222, 228, 0.9);
}
.finding-body { flex: 1; }
.finding-message { font-size: 13px; }
.finding-path { font-size: 12px; color: var(--text-soft); margin-top: 3px; }
.inspect-links { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; font-size: 12px; color: var(--text-soft); }
.telemetry { font-size: 12px; color: var(--text-soft); margin: 0 0 12px; }
.experiment-card {
	border: 1px solid var(--border);
	border-radius: 12px;
	padding: 16px 18px;
	margin-top: 12px;
	background: linear-gradient(180deg, rgba(246,248,250,0.82) 0%, rgba(255,255,255,0.92) 100%);
}
.experiment-header h3 { margin: 0 0 8px; font-size: 15px; }
.variants { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.variant-head { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 6px; }
.footer { margin-top: 24px; font-size: 12px; color: var(--text-soft); }
.footer code { background: rgba(175, 184, 193, 0.2); padding: 0 4px; border-radius: 3px; }
.toc-nav {
	background: rgba(255,255,255,0.86);
	padding: 14px 18px;
	border-radius: 14px;
	box-shadow: var(--shadow);
	margin-bottom: 18px;
	border: 1px solid rgba(197, 206, 216, 0.62);
	backdrop-filter: blur(10px);
}
.toc-nav-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin: 0 0 8px; }
.toc-nav ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 18px; }
.toc-nav li { display: inline-flex; align-items: center; gap: 7px; }
.toc-nav a { color: var(--text); text-decoration: none; font-size: 13px; font-weight: 600; }
.toc-nav a:hover { text-decoration: underline; }
.toc-status { display: inline-flex; align-items: center; gap: 5px; color: var(--text-muted); font-size: 11px; font-weight: 700; letter-spacing: 0.03em; text-transform: lowercase; }
.toc-status-dot { width: 8px; height: 8px; border-radius: 999px; box-shadow: 0 0 0 2px rgba(175, 184, 193, 0.20); }
.finding-path a, a { color: inherit; text-decoration: none; }
.finding-path a:hover { text-decoration: underline; }
code {
	font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
	background: rgba(175, 184, 193, 0.16);
	padding: 0.08rem 0.32rem;
	border-radius: 0.33rem;
}
@media (min-width: 920px) {
	.toc-nav {
		position: sticky;
		top: 12px;
		z-index: 5;
	}
}
@media (max-width: 720px) {
	main { padding: 18px 12px 40px; }
	.banner, .panel, .toc-nav { padding: 18px 16px; border-radius: 12px; }
	.banner-title { font-size: 21px; }
	.decision-grid { grid-template-columns: 1fr; }
	.meta-grid { grid-template-columns: 1fr; gap: 2px 0; }
	.data-table { display: block; overflow-x: auto; }
	.data-table.responsive-cards,
	.data-table.responsive-cards thead,
	.data-table.responsive-cards tbody,
	.data-table.responsive-cards tr,
	.data-table.responsive-cards td { display: block; width: 100%; }
	.data-table.responsive-cards thead { display: none; }
	.data-table.responsive-cards tr {
		box-sizing: border-box;
		border: 1px solid var(--border);
		border-radius: 12px;
		margin-bottom: 10px;
		overflow: hidden;
		background: rgba(255,255,255,0.72);
	}
	.data-table.responsive-cards td {
		box-sizing: border-box;
		border-bottom: 1px solid var(--border);
		display: grid;
		grid-template-columns: minmax(96px, 34%) 1fr;
		gap: 10px;
		padding: 10px 12px;
	}
	.data-table.responsive-cards td::before {
		content: attr(data-label);
		color: var(--text-muted);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.07em;
		text-transform: uppercase;
	}
	.data-table.responsive-cards td:last-child { border-bottom: 0; }
}
@media (prefers-color-scheme: dark) {
	:root {
		--page-bg: #0d1117;
		--page-accent: rgba(88, 166, 255, 0.10);
		--page-accent-warm: rgba(210, 153, 34, 0.10);
		--surface: #161b22;
		--surface-muted: #0d1117;
		--surface-strong: #1c2128;
		--text: #e6edf3;
		--text-muted: #9198a1;
		--text-soft: #8b949e;
		--border: #30363d;
		--border-strong: #3d444d;
		--shadow: 0 12px 28px rgba(0,0,0,0.30);
		--shadow-strong: 0 16px 36px rgba(0,0,0,0.36);
	}
	body {
		background:
			radial-gradient(circle at top left, var(--page-accent), transparent 28rem),
			radial-gradient(circle at top right, var(--page-accent-warm), transparent 25rem),
			linear-gradient(180deg, #0d1117 0%, #11161c 100%);
		color: var(--text);
	}
	.banner, .panel, .variant, .experiment-card, .toc-nav, .decision-card {
		background: linear-gradient(180deg, rgba(22,27,34,0.97) 0%, rgba(22,27,34,0.94) 100%);
		box-shadow: var(--shadow);
		border-color: rgba(61, 68, 77, 0.9);
	}
	.banner-meta, .panel h2, .panel-copy, .panel h4, .decision-label, .meta-grid dt, .data-table th, .footer, .finding-path, .inspect-links, .telemetry, .empty, .toc-nav-title, .toc-status, .variant-header small { color: var(--text-muted); }
	.data-table th, .data-table td { border-bottom-color: var(--border); }
	.data-table th { background: rgba(13, 17, 23, 0.92); }
	.data-table tbody tr:nth-child(even) td { background: rgba(13, 17, 23, 0.42); }
	.data-table tbody tr:hover td { background: rgba(28, 33, 40, 0.92); }
	.variant, .experiment-card { border-color: var(--border); background: linear-gradient(180deg, rgba(13,17,23,0.68) 0%, rgba(22,27,34,0.92) 100%); }
	.finding, .variants .variant { background: rgba(13,17,23,0.9); border-color: rgba(48, 54, 61, 0.92); }
	.data-table.responsive-cards tr { background: rgba(13,17,23,0.72); }
	.footer code { background: rgba(110, 118, 129, 0.4); }
	.toc-nav a { color: var(--text); }
	code { background: rgba(110, 118, 129, 0.22); }
}
`

func RenderSelfDogfoodHTML(summary map[string]any, report map[string]any, reviewSummary map[string]any) string {
	var builder strings.Builder
	title := fmt.Sprintf("Cautilus Self-Dogfood — %s", selfDogfoodStatusLabel(stringOrEmpty(summary["overallStatus"])))
	builder.WriteString("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n")
	builder.WriteString("<meta name=\"generator\" content=\"cautilus self-dogfood render-html\">\n")
	builder.WriteString("<title>" + escapeHTML(title) + "</title>\n<style>" + selfDogfoodHTMLStyles + "</style>\n</head>\n<body>\n<main>\n")
	builder.WriteString(renderSelfDogfoodHeader(summary, "Cautilus Self-Dogfood"))
	builder.WriteString(renderSelfDogfoodDecisionSummary(summary, report, reviewSummary))
	builder.WriteString(renderSelfDogfoodPageTOC([]tocNavEntry{
		{Anchor: "intent-heading", Label: "Intent", Status: stringOrEmpty(summary["overallStatus"])},
		{Anchor: "observations-heading", Label: "Command Observations", Status: observationsAggregateStatus(report)},
		{Anchor: "review-heading", Label: "Review Variants", Status: reviewVariantsAggregateStatus(reviewSummary)},
	}))
	builder.WriteString(renderSelfDogfoodIntentPanel(summary, report))
	builder.WriteString(renderSelfDogfoodObservations(report))
	builder.WriteString(renderSelfDogfoodReviewVariants(summary, reviewSummary))
	builder.WriteString(renderSelfDogfoodFooter(summary, "Generated from <code>summary.json</code>, <code>report.json</code>, and <code>review-summary.json</code>.\n\tDo not hand-edit this file — rerun <code>cautilus self-dogfood render-html</code> to refresh."))
	builder.WriteString("\n</main>\n</body>\n</html>\n")
	return rewriteSelfDogfoodLinks(builder.String())
}

func RenderSelfDogfoodExperimentsHTML(summary map[string]any, report map[string]any) string {
	var builder strings.Builder
	title := fmt.Sprintf("Cautilus Self-Dogfood Experiments — %s", selfDogfoodStatusLabel(stringOrEmpty(summary["overallStatus"])))
	builder.WriteString("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n")
	builder.WriteString("<meta name=\"generator\" content=\"cautilus self-dogfood render-experiments-html\">\n")
	builder.WriteString("<title>" + escapeHTML(title) + "</title>\n<style>" + selfDogfoodHTMLStyles + "</style>\n</head>\n<body>\n<main>\n")
	builder.WriteString(renderSelfDogfoodHeader(summary, "Cautilus Self-Dogfood Experiments"))
	builder.WriteString(renderSelfDogfoodExperimentsDecisionSummary(summary))
	builder.WriteString(renderSelfDogfoodPageTOC([]tocNavEntry{
		{Anchor: "intent-heading", Label: "Intent", Status: stringOrEmpty(summary["overallStatus"])},
		{Anchor: "compare-heading", Label: "A/B Comparison", Status: stringOrEmpty(summary["overallStatus"])},
		{Anchor: "experiments-heading", Label: "Experiment Details", Status: experimentsAggregateStatus(summary)},
	}))
	builder.WriteString(renderSelfDogfoodExperimentsIntentPanel(summary, report))
	builder.WriteString(renderSelfDogfoodComparison(summary))
	builder.WriteString(renderSelfDogfoodExperimentCards(summary))
	builder.WriteString(renderSelfDogfoodFooter(summary, "Generated from <code>summary.json</code> and <code>report.json</code>. The comparison view exists so A/B experiment outcomes can be inspected side by side instead of as isolated summaries.\n\tDo not hand-edit this file — rerun <code>cautilus self-dogfood render-experiments-html</code> to refresh."))
	builder.WriteString("\n</main>\n</body>\n</html>\n")
	return rewriteSelfDogfoodLinks(builder.String())
}

func RenderSelfDogfoodHTMLFromDir(latestDir string) (string, error) {
	summary, report, reviewSummary, err := readSelfDogfoodBundle(latestDir)
	if err != nil {
		return "", err
	}
	return RenderSelfDogfoodHTML(summary, report, reviewSummary), nil
}

func RenderSelfDogfoodExperimentsHTMLFromDir(latestDir string) (string, error) {
	summary, report, err := readSelfDogfoodExperimentsBundle(latestDir)
	if err != nil {
		return "", err
	}
	return RenderSelfDogfoodExperimentsHTML(summary, report), nil
}

func WriteSelfDogfoodHTML(latestDir string, outputPath *string) (string, error) {
	rendered, err := RenderSelfDogfoodHTMLFromDir(latestDir)
	if err != nil {
		return "", err
	}
	return writeSelfDogfoodHTMLFile(latestDir, outputPath, rendered)
}

func WriteSelfDogfoodExperimentsHTML(latestDir string, outputPath *string) (string, error) {
	rendered, err := RenderSelfDogfoodExperimentsHTMLFromDir(latestDir)
	if err != nil {
		return "", err
	}
	return writeSelfDogfoodHTMLFile(latestDir, outputPath, rendered)
}

func writeSelfDogfoodHTMLFile(latestDir string, outputPath *string, rendered string) (string, error) {
	target := filepath.Join(latestDir, "index.html")
	if outputPath != nil && strings.TrimSpace(*outputPath) != "" {
		target = *outputPath
	}
	if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
		return "", err
	}
	if err := os.WriteFile(target, []byte(rendered), 0o644); err != nil {
		return "", err
	}
	return target, nil
}

func readSelfDogfoodBundle(latestDir string) (map[string]any, map[string]any, map[string]any, error) {
	if err := mustDir(latestDir, "latestDir"); err != nil {
		return nil, nil, nil, err
	}
	summary, err := readJSONFile(filepath.Join(latestDir, "summary.json"))
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to read summary.json: %w", err)
	}
	report, err := readJSONFile(filepath.Join(latestDir, "report.json"))
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to read report.json: %w", err)
	}
	reviewSummary, err := readJSONFile(filepath.Join(latestDir, "review-summary.json"))
	if err != nil {
		return nil, nil, nil, fmt.Errorf("failed to read review-summary.json: %w", err)
	}
	return summary, report, reviewSummary, nil
}

func readSelfDogfoodExperimentsBundle(latestDir string) (map[string]any, map[string]any, error) {
	if err := mustDir(latestDir, "latestDir"); err != nil {
		return nil, nil, err
	}
	summary, err := readJSONFile(filepath.Join(latestDir, "summary.json"))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to read summary.json: %w", err)
	}
	report, err := readJSONFile(filepath.Join(latestDir, "report.json"))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to read report.json: %w", err)
	}
	return summary, report, nil
}

func renderSelfDogfoodHeader(summary map[string]any, title string) string {
	status := stringOrEmpty(summary["overallStatus"])
	color := selfDogfoodStatusColor(status)
	return fmt.Sprintf(`
<header class="banner" style="border-left:8px solid %s">
	<div class="banner-title">%s</div>
	<div class="banner-status">
		<span class="chip" data-status="overallStatus" style="background:%s">%s</span>
		<span class="banner-meta">runId %s</span>
		<span class="banner-meta">generatedAt %s</span>
	</div>
</header>`,
		color,
		escapeHTML(title),
		color,
		escapeHTML(selfDogfoodStatusLabel(status)),
		escapeHTML(defaultString(summary["runId"], "n/a")),
		escapeHTML(defaultString(summary["generatedAt"], "n/a")),
	)
}

func renderSelfDogfoodDecisionSummary(summary map[string]any, report map[string]any, reviewSummary map[string]any) string {
	status := defaultString(summary["overallStatus"], "n/a")
	gate := defaultString(summary["gateRecommendation"], "n/a")
	review := defaultString(summary["reportRecommendation"], "n/a")
	whatHappened := fmt.Sprintf("Overall result is %s. Deterministic gate says %s; review says %s.", status, gate, review)
	whyItMatters := "This page only proves the narrow self-dogfood publication claim: the run was recorded, reviewed, and surfaced for operator inspection."
	if status == "pass" && review == "accept-now" {
		whyItMatters = "The deterministic gate and review agree, so the latest bundle can be trusted for this narrow publication claim."
	}
	next := selfDogfoodNextStep(report, reviewSummary)
	return renderDecisionSummaryPanel(whatHappened, whyItMatters, next, []decisionAction{
		{Label: "Inspect commands", Anchor: "observations-heading"},
		{Label: "Inspect review", Anchor: "review-heading"},
	})
}

func renderSelfDogfoodExperimentsDecisionSummary(summary map[string]any) string {
	status := defaultString(summary["overallStatus"], "n/a")
	gate := defaultString(summary["gateRecommendation"], "n/a")
	review := defaultString(summary["reportRecommendation"], "n/a")
	whatHappened := fmt.Sprintf("Overall result is %s. Deterministic gate says %s; review says %s.", status, gate, review)
	whyItMatters := "The experiment result can disagree with the deterministic gate because the review layer checks whether the browser-facing claim is actually trustworthy."
	if gate != "n/a" && review != "n/a" && gate != review {
		whyItMatters = fmt.Sprintf("The deterministic gate says %s, but the review layer says %s. Treat the review result as the operator-facing decision.", gate, review)
	}
	return renderDecisionSummaryPanel(whatHappened, whyItMatters, experimentsNextStep(summary), []decisionAction{
		{Label: "Compare baseline and candidate", Anchor: "compare-heading"},
		{Label: "Inspect experiment details", Anchor: "experiments-heading"},
	})
}

type decisionAction struct {
	Label  string
	Anchor string
}

func renderDecisionSummaryPanel(whatHappened string, whyItMatters string, nextStep string, actions []decisionAction) string {
	var actionLinks strings.Builder
	for _, action := range actions {
		if strings.TrimSpace(action.Anchor) == "" || strings.TrimSpace(action.Label) == "" {
			continue
		}
		actionLinks.WriteString(fmt.Sprintf(`<a class="text-link" href="#%s">%s</a>`, escapeHTML(action.Anchor), escapeHTML(action.Label)))
	}
	return fmt.Sprintf(`
<section class="panel decision-summary" aria-labelledby="decision-summary-heading">
	<h2 id="decision-summary-heading">Decision Summary</h2>
	<div class="decision-grid">
		<div class="decision-card">
			<p class="decision-label">What happened</p>
			<p class="decision-value">%s</p>
		</div>
		<div class="decision-card">
			<p class="decision-label">Why it matters</p>
			<p class="decision-value">%s</p>
		</div>
		<div class="decision-card">
			<p class="decision-label">What to inspect next</p>
			<p class="decision-value">%s</p>
			<div class="decision-actions">%s</div>
		</div>
	</div>
</section>`,
		escapeHTML(whatHappened),
		escapeHTML(whyItMatters),
		escapeHTML(nextStep),
		actionLinks.String(),
	)
}

func selfDogfoodNextStep(report map[string]any, reviewSummary map[string]any) string {
	if observationsAggregateStatus(report) != "pass" {
		return "Start with command observations; a command did not pass."
	}
	if reviewVariantsAggregateStatus(reviewSummary) != "pass" {
		return "Start with review variants; at least one reviewer did not pass cleanly."
	}
	return "Start with review variants if you need evidence, otherwise the command observations are enough for a quick audit."
}

func experimentsNextStep(summary map[string]any) string {
	failed := 0
	for _, raw := range arrayOrEmpty(summary["experiments"]) {
		experiment := asMap(raw)
		status := stringOrEmpty(experiment["executionStatus"])
		verdict := stringOrEmpty(experiment["overallStatus"])
		if status == "failed" || verdict == "blocker" || verdict == "reject" {
			failed++
		}
	}
	if failed > 0 {
		noun := "candidate has"
		if failed != 1 {
			noun = "candidates have"
		}
		return fmt.Sprintf("Open experiment details; %d %s a failed or blocking result.", failed, noun)
	}
	return "Compare the deterministic baseline against candidate experiments before reading individual details."
}

func renderSelfDogfoodIntentPanel(summary map[string]any, report map[string]any) string {
	intentProfile := asMap(report["intentProfile"])
	var rows strings.Builder
	if behaviorSurface := stringOrEmpty(intentProfile["behaviorSurface"]); behaviorSurface != "" {
		rows.WriteString(fmt.Sprintf("\n\t\t<dt>Behavior surface</dt>\n\t\t<dd>%s</dd>", escapeHTML(behaviorSurface)))
	}
	writeDimensionList(&rows, "Success dimensions", arrayOrEmpty(intentProfile["successDimensions"]))
	writeDimensionList(&rows, "Guardrail dimensions", arrayOrEmpty(intentProfile["guardrailDimensions"]))
	status := stringOrEmpty(summary["overallStatus"])
	return fmt.Sprintf(`
	<section class="panel" aria-labelledby="intent-heading">
		<h2 id="intent-heading">Intent</h2>
		<p class="intent-text" data-field="intent">%s</p>
		<dl class="meta-grid">
			<dt>Current status</dt>
			<dd><span class="chip" data-status="overallStatusChip" style="background:%s">%s</span></dd>
			<dt>Deterministic gate</dt>
			<dd data-field="gateRecommendation">%s</dd>
			<dt>Review recommendation</dt>
			<dd data-field="reportRecommendation">%s</dd>
			<dt>Baseline</dt>
			<dd>%s</dd>%s
		</dl>
	</section>`,
		escapeHTML(defaultString(firstNonNil(summary["intent"], report["intent"]), "n/a")),
		selfDogfoodStatusColor(status),
		escapeHTML(selfDogfoodStatusLabel(status)),
		escapeHTML(defaultString(summary["gateRecommendation"], "n/a")),
		escapeHTML(defaultString(summary["reportRecommendation"], "n/a")),
		escapeHTML(defaultString(summary["baselineRef"], "n/a")),
		rows.String(),
	)
}

func renderSelfDogfoodExperimentsIntentPanel(summary map[string]any, report map[string]any) string {
	return fmt.Sprintf(`
	<section class="panel" aria-labelledby="intent-heading">
		<h2 id="intent-heading">Intent</h2>
		<p class="intent-text" data-field="intent">%s</p>
		<dl class="meta-grid">
			<dt>Baseline</dt>
			<dd>%s</dd>
			<dt>Deterministic gate</dt>
			<dd data-field="gateRecommendation">%s</dd>
			<dt>Review recommendation</dt>
			<dd data-field="reportRecommendation">%s</dd>
			<dt>Experiments</dt>
			<dd>%d</dd>
		</dl>
	</section>`,
		escapeHTML(defaultString(firstNonNil(summary["intent"], report["intent"]), "n/a")),
		escapeHTML(defaultString(summary["baselineRef"], "n/a")),
		escapeHTML(defaultString(summary["gateRecommendation"], "n/a")),
		escapeHTML(defaultString(summary["reportRecommendation"], "n/a")),
		len(arrayOrEmpty(summary["experiments"])),
	)
}

func renderSelfDogfoodObservations(report map[string]any) string {
	observations := arrayOrEmpty(report["commandObservations"])
	if len(observations) == 0 {
		return `
<section class="panel" aria-labelledby="observations-heading">
	<h2 id="observations-heading">Command Observations</h2>
	<p class="empty">No command observations recorded.</p>
</section>`
	}
	var rows strings.Builder
	for _, raw := range observations {
		observation := asMap(raw)
		status := stringOrEmpty(observation["status"])
		colorStatus := status
		if status == "passed" {
			colorStatus = "pass"
		}
		rows.WriteString(fmt.Sprintf(`
			<tr data-observation="%s-%s">
				<td data-label="stage">%s</td>
				<td data-label="#">%s</td>
				<td data-label="status"><span class="chip" style="background:%s">%s</span></td>
				<td data-label="command"><code>%s</code></td>
				<td data-label="duration">%s</td>
				<td data-label="exit">%s</td>
			</tr>`,
			escapeHTML(defaultString(observation["stage"], "")),
			escapeHTML(defaultString(observation["index"], "")),
			escapeHTML(defaultString(observation["stage"], "n/a")),
			escapeHTML(defaultString(observation["index"], "")),
			selfDogfoodStatusColor(colorStatus),
			escapeHTML(defaultString(observation["status"], "n/a")),
			escapeHTML(defaultString(observation["command"], "n/a")),
			escapeHTML(formatDuration(numberOrDefault(observation["durationMs"], -1))),
			escapeHTML(defaultString(observation["exitCode"], "n/a")),
		))
	}
	return `
	<section class="panel" aria-labelledby="observations-heading">
		<h2 id="observations-heading">Command Observations</h2>
		<table class="data-table responsive-cards">
		<thead>
			<tr>
				<th>stage</th>
				<th>#</th>
				<th>status</th>
				<th>command</th>
				<th>duration</th>
				<th>exit</th>
			</tr>
		</thead>
		<tbody>` + rows.String() + `
		</tbody>
	</table>
</section>`
}

func renderSelfDogfoodReviewVariants(summary map[string]any, reviewSummary map[string]any) string {
	variants := arrayOrEmpty(reviewSummary["variants"])
	if len(variants) == 0 {
		return `
<section class="panel" aria-labelledby="review-heading">
	<h2 id="review-heading">Review Variants</h2>
	<p class="empty">No review variants recorded.</p>
</section>`
	}
	var blocks strings.Builder
	for _, raw := range variants {
		blocks.WriteString(renderSelfDogfoodVariantBlock(asMap(raw)))
	}
	telemetry := asMap(firstNonNil(reviewSummary["telemetry"], summary["reviewTelemetry"]))
	telemetryLine := ""
	if len(telemetry) > 0 {
		telemetryLine = fmt.Sprintf(`<p class="telemetry">variants %s · passed %s · failed %s · total %s</p>`,
			escapeHTML(defaultString(telemetry["variantCount"], len(variants))),
			escapeHTML(defaultString(telemetry["passedVariantCount"], "n/a")),
			escapeHTML(defaultString(telemetry["failedVariantCount"], "n/a")),
			escapeHTML(formatDuration(numberOrDefault(telemetry["durationMs"], -1))),
		)
	}
	return `
<section class="panel" aria-labelledby="review-heading">
	<h2 id="review-heading">Review Variants</h2>
	` + telemetryLine + `
	` + blocks.String() + `
</section>`
}

func renderSelfDogfoodVariantBlock(variant map[string]any) string {
	output := asMap(variant["output"])
	findings := arrayOrEmpty(output["findings"])
	execStatus := stringOrEmpty(variant["status"])
	execColorStatus := execStatus
	if execStatus == "passed" {
		execColorStatus = "pass"
	}
	verdict := defaultString(output["verdict"], "n/a")
	var findingsHTML strings.Builder
	if len(findings) == 0 {
		findingsHTML.WriteString(`<p class="empty">No findings recorded.</p>`)
	} else {
		findingsHTML.WriteString(`<ul class="findings">`)
		for _, rawFinding := range findings {
			finding := asMap(rawFinding)
			severity := defaultString(finding["severity"], "unknown")
			findingsHTML.WriteString(fmt.Sprintf(`
		<li class="finding" data-severity="%s">
			<span class="chip" style="background:%s">%s</span>
			<div class="finding-body">
				<div class="finding-message">%s</div>%s
			</div>
		</li>`,
				escapeHTML(severity),
				selfDogfoodStatusColor(severity),
				escapeHTML(severity),
				escapeHTML(defaultString(finding["message"], "")),
				renderOptionalPath(defaultString(finding["path"], "")),
			))
		}
		findingsHTML.WriteString(`
	</ul>`)
	}
	return fmt.Sprintf(`
	<article class="variant" data-variant="%s">
		<header class="variant-header">
			<h3>%s <small>(%s)</small></h3>
			<div class="variant-chips">
				<span class="chip" data-status="executionStatus" style="background:%s">execution: %s</span>
				<span class="chip" data-status="verdict" style="background:%s">verdict: %s</span>
				<span class="chip neutral">findings: %d</span>
				<span class="chip neutral">duration: %s</span>
			</div>
		</header>
		<p class="variant-summary">%s</p>
		%s
	</article>`,
		escapeHTML(defaultString(variant["id"], "")),
		escapeHTML(defaultString(variant["id"], "n/a")),
		escapeHTML(defaultString(variant["tool"], "n/a")),
		selfDogfoodStatusColor(execColorStatus),
		escapeHTML(defaultString(variant["status"], "n/a")),
		selfDogfoodStatusColor(verdict),
		escapeHTML(verdict),
		len(findings),
		escapeHTML(formatDuration(numberOrDefault(variant["durationMs"], -1))),
		escapeHTML(defaultString(output["summary"], "")),
		findingsHTML.String(),
	)
}

func renderSelfDogfoodComparison(summary map[string]any) string {
	rows := []string{
		renderComparisonRow(map[string]any{
			"key":             "deterministic-gate",
			"label":           "deterministic gate",
			"role":            "baseline",
			"executionStatus": "passed",
			"verdict":         gateStatusFromRecommendation(defaultString(summary["gateRecommendation"], "")),
			"findingsCount":   "n/a",
			"duration":        formatDuration(numberOrDefault(asMap(summary["modeTelemetry"])["durationMs"], -1)),
			"summary":         fmt.Sprintf("full_gate recommendation: %s", defaultString(summary["gateRecommendation"], "n/a")),
			"inspectPath":     defaultString(summary["reportPath"], ""),
			"inspectLabel":    "gate report",
		}),
	}
	for _, rawExperiment := range arrayOrEmpty(summary["experiments"]) {
		experiment := asMap(rawExperiment)
		rows = append(rows, renderComparisonRow(map[string]any{
			"key":             defaultString(experiment["adapterName"], "experiment"),
			"label":           defaultString(experiment["adapterName"], "experiment"),
			"role":            "candidate",
			"executionStatus": defaultString(experiment["executionStatus"], "n/a"),
			"verdict":         defaultString(experiment["overallStatus"], "n/a"),
			"findingsCount":   defaultString(experiment["findingsCount"], "n/a"),
			"duration":        formatDuration(numberOrDefault(asMap(experiment["telemetry"])["durationMs"], -1)),
			"summary":         defaultString(experiment["primarySummary"], "n/a"),
			"inspectPath":     defaultString(experiment["summaryPath"], ""),
			"inspectLabel":    "review summary",
		}))
	}
	return `
<section class="panel" aria-labelledby="compare-heading">
	<h2 id="compare-heading">A/B Comparison</h2>
	<p class="panel-copy">When experiments are present, operators should be able to compare the deterministic gate baseline against each experiment adapter without reconstructing the difference by hand.</p>
		<table class="data-table responsive-cards">
		<thead>
			<tr>
				<th>surface</th>
				<th>role</th>
				<th>execution</th>
				<th>verdict</th>
				<th>findings</th>
				<th>duration</th>
				<th>summary</th>
			</tr>
		</thead>
		<tbody>` + strings.Join(rows, "") + `
		</tbody>
	</table>
</section>`
}

func renderComparisonRow(row map[string]any) string {
	inspect := renderInspectCell(defaultString(row["inspectLabel"], "artifact"), defaultString(row["inspectPath"], ""))
	return fmt.Sprintf(`
			<tr data-compare-row="%s">
				<td data-label="surface">%s</td>
				<td data-label="role">%s</td>
				<td data-label="execution"><span class="chip" style="background:%s">%s</span></td>
				<td data-label="verdict"><span class="chip" style="background:%s">%s</span></td>
				<td data-label="findings">%s</td>
				<td data-label="duration">%s</td>
				<td data-label="summary">%s%s</td>
			</tr>`,
		escapeHTML(defaultString(row["key"], "")),
		escapeHTML(defaultString(row["label"], "")),
		escapeHTML(defaultString(row["role"], "")),
		selfDogfoodStatusColor(defaultString(row["executionStatus"], "")),
		escapeHTML(selfDogfoodStatusLabel(defaultString(row["executionStatus"], ""))),
		selfDogfoodStatusColor(defaultString(row["verdict"], "")),
		escapeHTML(selfDogfoodStatusLabel(defaultString(row["verdict"], ""))),
		escapeHTML(defaultString(row["findingsCount"], "")),
		escapeHTML(defaultString(row["duration"], "")),
		escapeHTML(defaultString(row["summary"], "")),
		inspect,
	)
}

func renderSelfDogfoodExperimentCards(summary map[string]any) string {
	experiments := arrayOrEmpty(summary["experiments"])
	if len(experiments) == 0 {
		return `
<section class="panel" aria-labelledby="experiments-heading">
	<h2 id="experiments-heading">Experiment Details</h2>
	<p class="empty">No experiments recorded.</p>
</section>`
	}
	var cards strings.Builder
	for _, rawExperiment := range experiments {
		experiment := asMap(rawExperiment)
		var variants strings.Builder
		for _, rawVariant := range arrayOrEmpty(experiment["variants"]) {
			variant := asMap(rawVariant)
			inspectLinks := renderInspectLinks([]artifactLink{
				{Label: "variant output", Path: defaultString(variant["outputFile"], "")},
			})
			variants.WriteString(fmt.Sprintf(`
		<li class="variant" data-variant="%s">
			<div class="variant-head">
			<strong>%s</strong>
			<span class="chip" style="background:%s">%s</span>
			<span class="chip" style="background:%s">%s</span>
				<span class="chip neutral">findings: %s</span>
			</div>
			<p class="variant-summary">%s</p>
			%s
		</li>`,
				escapeHTML(defaultString(experiment["adapterName"], "experiment")+":"+defaultString(variant["id"], "n/a")),
				escapeHTML(defaultString(variant["id"], "n/a")),
				selfDogfoodStatusColor(defaultString(variant["executionStatus"], "")),
				escapeHTML(selfDogfoodStatusLabel(defaultString(variant["executionStatus"], ""))),
				selfDogfoodStatusColor(defaultString(variant["verdict"], "")),
				escapeHTML(selfDogfoodStatusLabel(defaultString(variant["verdict"], ""))),
				escapeHTML(defaultString(variant["findingsCount"], "n/a")),
				escapeHTML(defaultString(variant["summary"], "")),
				inspectLinks,
			))
		}
		inspectLinks := renderInspectLinks([]artifactLink{
			{Label: "review summary", Path: defaultString(experiment["summaryPath"], "")},
		})
		cards.WriteString(fmt.Sprintf(`
		<article class="experiment-card" data-experiment="%s">
		<header class="experiment-header">
			<h3>%s</h3>
			<div class="variant-chips">
				<span class="chip" style="background:%s">execution: %s</span>
				<span class="chip" style="background:%s">verdict: %s</span>
				<span class="chip neutral">findings: %s</span>
				<span class="chip neutral">duration: %s</span>
			</div>
			</header>
			<p class="variant-summary">%s</p>
			%s
			<ul class="variants">%s</ul>
		</article>`,
			escapeHTML(defaultString(experiment["adapterName"], "n/a")),
			escapeHTML(defaultString(experiment["adapterName"], "n/a")),
			selfDogfoodStatusColor(defaultString(experiment["executionStatus"], "")),
			escapeHTML(selfDogfoodStatusLabel(defaultString(experiment["executionStatus"], ""))),
			selfDogfoodStatusColor(defaultString(experiment["overallStatus"], "")),
			escapeHTML(selfDogfoodStatusLabel(defaultString(experiment["overallStatus"], ""))),
			escapeHTML(defaultString(experiment["findingsCount"], "n/a")),
			escapeHTML(formatDuration(numberOrDefault(asMap(experiment["telemetry"])["durationMs"], -1))),
			escapeHTML(defaultString(experiment["primarySummary"], "")),
			inspectLinks,
			variants.String(),
		))
	}
	return `
<section class="panel" aria-labelledby="experiments-heading">
	<h2 id="experiments-heading">Experiment Details</h2>
	` + cards.String() + `
</section>`
}

func renderSelfDogfoodFooter(summary map[string]any, copy string) string {
	return fmt.Sprintf(`
	<footer class="footer">
		<p>%s</p>
		<p class="footer-paths">
			<span>Artifact root: <code>%s</code></span>
		</p>
	</footer>`, copy, escapeHTML(displayArtifactPath(defaultString(summary["artifactRoot"], "n/a"))))
}

type artifactLink struct {
	Label string
	Path  string
}

func renderInspectCell(label string, path string) string {
	trimmed := strings.TrimSpace(path)
	if trimmed == "" {
		return ""
	}
	return `<div class="inspect-links">Inspect ` + renderRawArtifactLink(label, trimmed) + `</div>`
}

func renderInspectLinks(links []artifactLink) string {
	var rendered strings.Builder
	for _, link := range links {
		if strings.TrimSpace(link.Path) == "" {
			continue
		}
		rendered.WriteString(renderRawArtifactLink(link.Label, link.Path))
	}
	if rendered.Len() == 0 {
		return ""
	}
	return `<div class="inspect-links"><span>Inspect</span>` + rendered.String() + `</div>`
}

func renderRawArtifactLink(label string, path string) string {
	trimmed := strings.TrimSpace(path)
	if trimmed == "" {
		return ""
	}
	display := displayArtifactPath(trimmed)
	// Single-quoted href keeps raw JSON diagnostic links out of the generic
	// Markdown/JSON-to-HTML rewriter, because these targets may not have an HTML
	// sibling yet.
	return fmt.Sprintf(`<a class="text-link" href='%s'><code>%s</code></a>`,
		escapeHTML(trimmed),
		escapeHTML(defaultString(label, display)),
	)
}

func displayArtifactPath(path string) string {
	trimmed := strings.TrimSpace(path)
	if trimmed == "" {
		return "n/a"
	}
	if !filepath.IsAbs(trimmed) {
		return trimmed
	}
	cwd, err := os.Getwd()
	if err != nil {
		return trimmed
	}
	rel, err := filepath.Rel(cwd, trimmed)
	if err != nil || strings.HasPrefix(rel, ".."+string(filepath.Separator)) || rel == ".." {
		return trimmed
	}
	return rel
}

func writeDimensionList(builder *strings.Builder, label string, values []any) {
	if len(values) == 0 {
		return
	}
	items := make([]string, 0, len(values))
	for _, raw := range values {
		items = append(items, "<code>"+escapeHTML(defaultString(asMap(raw)["id"], ""))+"</code>")
	}
	_, _ = fmt.Fprintf(builder, "\n\t\t<dt>%s</dt>\n\t\t<dd>%s</dd>", escapeHTML(label), strings.Join(items, ", "))
}

func renderOptionalPath(path string) string {
	trimmed := strings.TrimSpace(path)
	if trimmed == "" {
		return ""
	}
	if selfDogfoodPathLinkable(trimmed) {
		return `<div class="finding-path"><a href="` + escapeHTML(trimmed) + `"><code>` + escapeHTML(trimmed) + `</code></a></div>`
	}
	return `<div class="finding-path"><code>` + escapeHTML(trimmed) + `</code></div>`
}

type tocNavEntry struct {
	Anchor string
	Label  string
	Status string
}

// renderSelfDogfoodPageTOC emits an in-page nav anchored to known section IDs.
// Each entry carries a subdued status marker so the nav remains skimmable without
// competing with the primary decision summary.
func renderSelfDogfoodPageTOC(entries []tocNavEntry) string {
	if len(entries) == 0 {
		return ""
	}
	var items strings.Builder
	for _, entry := range entries {
		color := selfDogfoodStatusColor(entry.Status)
		label := selfDogfoodStatusLabel(entry.Status)
		items.WriteString(fmt.Sprintf(`
			<li data-anchor="%s">
				<span class="toc-status"><span class="toc-status-dot" style="background:%s"></span>%s</span>
				<a href="#%s">%s</a>
			</li>`,
			escapeHTML(entry.Anchor),
			color,
			escapeHTML(label),
			escapeHTML(entry.Anchor),
			escapeHTML(entry.Label),
		))
	}
	return fmt.Sprintf(`
<nav class="toc-nav" aria-label="Page contents">
	<p class="toc-nav-title">On this page</p>
	<ul>%s
	</ul>
</nav>`, items.String())
}

var selfDogfoodLinkablePathSuffixes = []string{".md", ".spec.md", ".json", ".html"}

func selfDogfoodPathLinkable(value string) bool {
	lower := strings.ToLower(value)
	for _, suffix := range selfDogfoodLinkablePathSuffixes {
		if strings.HasSuffix(lower, suffix) {
			return true
		}
	}
	return false
}

var selfDogfoodLinkRewriter = regexp.MustCompile(`(href|src)="([^"#?]+?)(?:\.spec\.md|\.md|\.json)((?:#[^"]*)?(?:\?[^"]*)?)"`)

// rewriteSelfDogfoodLinks rewrites href/src attributes pointing to sibling JSON
// or Markdown artifacts so the generated HTML stays navigable in a browser.
// A `.md`, `.spec.md`, or `.json` target is swapped for `.html`, preserving any
// fragment or query. Anchors that do not point at a path (e.g. `href="#top"`)
// are left intact because they are handled elsewhere.
func rewriteSelfDogfoodLinks(s string) string {
	return selfDogfoodLinkRewriter.ReplaceAllString(s, `$1="$2.html$3"`)
}

func observationsAggregateStatus(report map[string]any) string {
	observations := arrayOrEmpty(report["commandObservations"])
	if len(observations) == 0 {
		return "n/a"
	}
	for _, raw := range observations {
		status := stringOrEmpty(asMap(raw)["status"])
		if status != "passed" && status != "pass" {
			return status
		}
	}
	return "pass"
}

func reviewVariantsAggregateStatus(reviewSummary map[string]any) string {
	variants := arrayOrEmpty(reviewSummary["variants"])
	if len(variants) == 0 {
		return "n/a"
	}
	for _, raw := range variants {
		variant := asMap(raw)
		status := stringOrEmpty(variant["status"])
		if status != "passed" && status != "pass" {
			return status
		}
	}
	return "pass"
}

func experimentsAggregateStatus(summary map[string]any) string {
	experiments := arrayOrEmpty(summary["experiments"])
	if len(experiments) == 0 {
		return "n/a"
	}
	worst := "pass"
	for _, raw := range experiments {
		overall := stringOrEmpty(asMap(raw)["overallStatus"])
		if overall == "blocker" || overall == "failed" || overall == "reject" {
			return overall
		}
		if overall == "concern" || overall == "defer" {
			worst = overall
		}
	}
	return worst
}

func defaultString(value any, fallback any) string {
	switch typed := value.(type) {
	case string:
		if strings.TrimSpace(typed) != "" {
			return typed
		}
	case nil:
	default:
		text := fmt.Sprintf("%v", typed)
		if strings.TrimSpace(text) != "" && text != "<nil>" {
			return text
		}
	}
	return fmt.Sprintf("%v", fallback)
}

func escapeHTML(value string) string {
	return html.EscapeString(value)
}

func selfDogfoodStatusColor(status string) string {
	if color, ok := selfDogfoodStatusColors[status]; ok {
		return color
	}
	return selfDogfoodStatusColors["unknown"]
}

func selfDogfoodStatusLabel(status string) string {
	if strings.TrimSpace(status) == "" {
		return "n/a"
	}
	if label, ok := selfDogfoodStatusLabels[status]; ok {
		return label
	}
	return status
}

func formatDuration(ms float64) string {
	if ms < 0 {
		return "n/a"
	}
	if ms < 1000 {
		return fmt.Sprintf("%.0fms", ms)
	}
	seconds := ms / 1000
	if seconds < 60 {
		return fmt.Sprintf("%.2fs", seconds)
	}
	minutes := int(seconds / 60)
	remaining := seconds - float64(minutes*60)
	return fmt.Sprintf("%dm %.1fs", minutes, remaining)
}

func gateStatusFromRecommendation(recommendation string) string {
	switch recommendation {
	case "accept-now":
		return "pass"
	case "defer":
		return "concern"
	default:
		return "blocker"
	}
}
