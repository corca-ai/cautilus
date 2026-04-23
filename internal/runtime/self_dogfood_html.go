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
:root { color-scheme: light dark; }
body {
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
	margin: 0;
	background: #f6f8fa;
	color: #1f2328;
	line-height: 1.5;
}
main { max-width: 1120px; margin: 0 auto; padding: 24px 16px 48px; }
.banner {
	background: #ffffff;
	padding: 20px 24px;
	border-radius: 8px;
	box-shadow: 0 1px 3px rgba(0,0,0,0.08);
	margin-bottom: 20px;
}
.banner-title { font-size: 22px; font-weight: 600; margin-bottom: 8px; }
.banner-status { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.banner-meta { color: #5a6472; font-size: 13px; font-variant-numeric: tabular-nums; }
.chip {
	display: inline-block;
	color: #ffffff;
	padding: 2px 10px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.02em;
	text-transform: lowercase;
}
.chip.neutral { background: #444c56; }
.panel {
	background: #ffffff;
	padding: 20px 24px;
	border-radius: 8px;
	box-shadow: 0 1px 3px rgba(0,0,0,0.08);
	margin-bottom: 20px;
}
.panel h2 { margin-top: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 0.06em; color: #5a6472; }
.panel-copy { color: #5a6472; margin-top: 0; }
.panel-lead { font-size: 15px; margin: 0 0 12px; }
.intent-text { font-size: 16px; margin: 0 0 16px; }
.meta-grid {
	display: grid;
	grid-template-columns: max-content 1fr;
	gap: 4px 16px;
	margin: 0;
	font-size: 14px;
}
.meta-grid dt { color: #5a6472; }
.meta-grid dd { margin: 0; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e4e8ed; vertical-align: top; }
.data-table th { font-weight: 600; color: #5a6472; }
.data-table code { font-size: 12px; }
.empty { color: #6e7781; font-style: italic; }
.variant {
	border: 1px solid #e4e8ed;
	border-radius: 6px;
	padding: 14px 18px;
	margin-top: 12px;
}
.variant-header h3 { margin: 0 0 8px; font-size: 15px; }
.variant-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.variant-summary { margin: 8px 0; white-space: pre-wrap; }
.chip-row { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 12px; }
.findings { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.finding { display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px; background: #f6f8fa; border-radius: 6px; }
.finding-body { flex: 1; }
.finding-message { font-size: 13px; }
.finding-path { font-size: 12px; color: #6e7781; margin-top: 2px; }
.telemetry { font-size: 12px; color: #6e7781; margin: 0 0 12px; }
.experiment-card {
	border: 1px solid #e4e8ed;
	border-radius: 6px;
	padding: 14px 18px;
	margin-top: 12px;
}
.experiment-header h3 { margin: 0 0 8px; font-size: 15px; }
.variants { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.variant-head { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 6px; }
.footer { margin-top: 24px; font-size: 12px; color: #6e7781; }
.footer code { background: rgba(175, 184, 193, 0.2); padding: 0 4px; border-radius: 3px; }
.toc-nav {
	background: #ffffff;
	padding: 14px 24px;
	border-radius: 8px;
	box-shadow: 0 1px 3px rgba(0,0,0,0.08);
	margin-bottom: 20px;
}
.toc-nav-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #5a6472; margin: 0 0 8px; }
.toc-nav ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 18px; }
.toc-nav li { display: inline-flex; align-items: center; gap: 6px; }
.toc-nav a { color: #1f2328; text-decoration: none; font-size: 13px; }
.toc-nav a:hover { text-decoration: underline; }
.finding-path a { color: inherit; text-decoration: none; }
.finding-path a:hover { text-decoration: underline; }
code { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; }
@media (prefers-color-scheme: dark) {
	body { background: #0d1117; color: #e6edf3; }
	.banner, .panel, .variant, .experiment-card, .toc-nav { background: #161b22; box-shadow: 0 1px 3px rgba(0,0,0,0.4); }
	.banner-meta, .panel h2, .panel-copy, .meta-grid dt, .data-table th, .footer, .finding-path, .telemetry, .empty, .toc-nav-title { color: #9198a1; }
	.data-table th, .data-table td { border-bottom-color: #30363d; }
	.variant, .experiment-card { border-color: #30363d; }
	.finding, .variants .variant { background: #0d1117; }
	.footer code { background: rgba(110, 118, 129, 0.4); }
	.toc-nav a { color: #e6edf3; }
}
`

func RenderSelfDogfoodHTML(summary map[string]any, report map[string]any, reviewSummary map[string]any) string {
	var builder strings.Builder
	title := fmt.Sprintf("Cautilus Self-Dogfood — %s", selfDogfoodStatusLabel(stringOrEmpty(summary["overallStatus"])))
	builder.WriteString("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n")
	builder.WriteString("<meta name=\"generator\" content=\"cautilus self-dogfood render-html\">\n")
	builder.WriteString("<title>" + escapeHTML(title) + "</title>\n<style>" + selfDogfoodHTMLStyles + "</style>\n</head>\n<body>\n<main>\n")
	builder.WriteString(renderSelfDogfoodHeader(summary, "Cautilus Self-Dogfood"))
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
	builder.WriteString(renderSelfDogfoodPageTOC([]tocNavEntry{
		{Anchor: "intent-heading", Label: "Intent", Status: stringOrEmpty(summary["overallStatus"])},
		{Anchor: "compare-heading", Label: "A/B Comparison", Status: stringOrEmpty(summary["gateRecommendation"])},
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

func renderSelfDogfoodIntentPanel(summary map[string]any, report map[string]any) string {
	intentProfile := asMap(report["intentProfile"])
	var rows strings.Builder
	if behaviorSurface := stringOrEmpty(intentProfile["behaviorSurface"]); behaviorSurface != "" {
		rows.WriteString(fmt.Sprintf("\n\t\t<dt>behaviorSurface</dt>\n\t\t<dd>%s</dd>", escapeHTML(behaviorSurface)))
	}
	writeDimensionList(&rows, "successDimensions", arrayOrEmpty(intentProfile["successDimensions"]))
	writeDimensionList(&rows, "guardrailDimensions", arrayOrEmpty(intentProfile["guardrailDimensions"]))
	status := stringOrEmpty(summary["overallStatus"])
	return fmt.Sprintf(`
<section class="panel" aria-labelledby="intent-heading">
	<h2 id="intent-heading">Intent</h2>
	<p class="intent-text" data-field="intent">%s</p>
	<dl class="meta-grid">
		<dt>overallStatus</dt>
		<dd><span class="chip" data-status="overallStatusChip" style="background:%s">%s</span></dd>
		<dt>gateRecommendation</dt>
		<dd data-field="gateRecommendation">%s</dd>
		<dt>reportRecommendation</dt>
		<dd data-field="reportRecommendation">%s</dd>
		<dt>baselineRef</dt>
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
		<dt>baselineRef</dt>
		<dd>%s</dd>
		<dt>gateRecommendation</dt>
		<dd data-field="gateRecommendation">%s</dd>
		<dt>reportRecommendation</dt>
		<dd data-field="reportRecommendation">%s</dd>
		<dt>experimentCount</dt>
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
			<td>%s</td>
			<td>%s</td>
			<td><span class="chip" style="background:%s">%s</span></td>
			<td><code>%s</code></td>
			<td>%s</td>
			<td>%s</td>
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
	<table class="data-table">
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
		}))
	}
	return `
<section class="panel" aria-labelledby="compare-heading">
	<h2 id="compare-heading">A/B Comparison</h2>
	<p class="panel-copy">When experiments are present, operators should be able to compare the deterministic gate baseline against each experiment adapter without reconstructing the difference by hand.</p>
	<table class="data-table">
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
	return fmt.Sprintf(`
		<tr data-compare-row="%s">
			<td>%s</td>
			<td>%s</td>
			<td><span class="chip" style="background:%s">%s</span></td>
			<td><span class="chip" style="background:%s">%s</span></td>
			<td>%s</td>
			<td>%s</td>
			<td>%s</td>
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
			variants.WriteString(fmt.Sprintf(`
	<li class="variant" data-variant="%s">
		<div class="variant-head">
			<strong>%s</strong>
			<span class="chip" style="background:%s">%s</span>
			<span class="chip" style="background:%s">%s</span>
			<span class="chip neutral">findings: %s</span>
		</div>
		<p class="variant-summary">%s</p>
	</li>`,
				escapeHTML(defaultString(experiment["adapterName"], "experiment")+":"+defaultString(variant["id"], "n/a")),
				escapeHTML(defaultString(variant["id"], "n/a")),
				selfDogfoodStatusColor(defaultString(variant["executionStatus"], "")),
				escapeHTML(selfDogfoodStatusLabel(defaultString(variant["executionStatus"], ""))),
				selfDogfoodStatusColor(defaultString(variant["verdict"], "")),
				escapeHTML(selfDogfoodStatusLabel(defaultString(variant["verdict"], ""))),
				escapeHTML(defaultString(variant["findingsCount"], "n/a")),
				escapeHTML(defaultString(variant["summary"], "")),
			))
		}
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
		<span>artifactRoot: <code>%s</code></span>
	</p>
</footer>`, copy, escapeHTML(defaultString(summary["artifactRoot"], "n/a")))
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
// Each entry carries a status chip so a human reviewer can skim state before
// deciding which section to read in full.
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
			<span class="chip" style="background:%s">%s</span>
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
