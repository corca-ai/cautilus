package runtime

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// RenderReportHTML converts a normalized cautilus.report_packet.v2 into a
// single-page, self-contained HTML document. It is a read-only re-expression
// of the JSON packet — the caller must ensure the packet is already validated.
//
// The rendered output reuses the self-dogfood stylesheet and helpers so a
// reviewer's eye does not have to re-learn the status palette when moving
// between surfaces.
func RenderReportHTML(report map[string]any) string {
	var builder strings.Builder
	title := fmt.Sprintf("Cautilus Report — %s", selfDogfoodStatusLabel(stringOrEmpty(report["recommendation"])))
	builder.WriteString("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n")
	builder.WriteString("<meta name=\"generator\" content=\"cautilus report render-html\">\n")
	builder.WriteString("<title>" + escapeHTML(title) + "</title>\n<style>" + selfDogfoodHTMLStyles + "</style>\n</head>\n<body>\n<main>\n")
	builder.WriteString(renderReportHeader(report))
	builder.WriteString(renderSelfDogfoodPageTOC([]tocNavEntry{
		{Anchor: "intent-heading", Label: "Intent", Status: stringOrEmpty(report["recommendation"])},
		{Anchor: "signals-heading", Label: "Decision Signals", Status: reportDecisionSignalsAggregateStatus(report)},
		{Anchor: "modes-heading", Label: "Modes", Status: reportModesAggregateStatus(report)},
		{Anchor: "scenarios-heading", Label: "Scenario Outcomes", Status: reportScenarioBucketsAggregateStatus(report)},
		{Anchor: "observations-heading", Label: "Command Observations", Status: observationsAggregateStatus(report)},
		{Anchor: "findings-heading", Label: "Human Review Findings", Status: reportFindingsAggregateStatus(report)},
	}))
	builder.WriteString(renderReportIntentPanel(report))
	builder.WriteString(renderReportDecisionSignalsPanel(report))
	builder.WriteString(renderReportModesPanel(report))
	builder.WriteString(renderReportScenarioBucketsPanel(report))
	builder.WriteString(renderSelfDogfoodObservations(report))
	builder.WriteString(renderReportFindingsPanel(report))
	builder.WriteString(renderReportFooter(report))
	builder.WriteString("\n</main>\n</body>\n</html>\n")
	return rewriteSelfDogfoodLinks(builder.String())
}

// RenderReportHTMLFromFile reads a report.json packet from disk, validates its
// schema version, and returns the rendered HTML. It does not write to disk.
func RenderReportHTMLFromFile(inputPath string) (string, error) {
	packet, err := readJSONFile(inputPath)
	if err != nil {
		return "", fmt.Errorf("failed to read report packet from %s: %w", inputPath, err)
	}
	if err := ValidateReportPacket(packet, inputPath); err != nil {
		return "", err
	}
	return RenderReportHTML(packet), nil
}

// WriteReportHTMLFromFile renders report.json to HTML next to the input file
// and returns the absolute output path. If outputPath is nil, the HTML is
// written as report.html in the same directory.
func WriteReportHTMLFromFile(inputPath string, outputPath *string) (string, error) {
	rendered, err := RenderReportHTMLFromFile(inputPath)
	if err != nil {
		return "", err
	}
	target := defaultReportHTMLOutputPath(inputPath)
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

func defaultReportHTMLOutputPath(inputPath string) string {
	dir := filepath.Dir(inputPath)
	base := filepath.Base(inputPath)
	name := strings.TrimSuffix(base, filepath.Ext(base))
	return filepath.Join(dir, name+".html")
}

func renderReportHeader(report map[string]any) string {
	recommendation := stringOrEmpty(report["recommendation"])
	color := selfDogfoodStatusColor(recommendation)
	return fmt.Sprintf(`
<header class="banner" style="border-left:8px solid %s">
	<div class="banner-title">Cautilus Report</div>
	<div class="banner-status">
		<span class="chip" data-status="recommendation" style="background:%s">%s</span>
		<span class="banner-meta">candidate %s</span>
		<span class="banner-meta">baseline %s</span>
		<span class="banner-meta">generatedAt %s</span>
	</div>
</header>`,
		color,
		color,
		escapeHTML(selfDogfoodStatusLabel(recommendation)),
		escapeHTML(defaultString(report["candidate"], "n/a")),
		escapeHTML(defaultString(report["baseline"], "n/a")),
		escapeHTML(defaultString(report["generatedAt"], "n/a")),
	)
}

func renderReportIntentPanel(report map[string]any) string {
	intentProfile := asMap(report["intentProfile"])
	var extras strings.Builder
	if behaviorSurface := stringOrEmpty(intentProfile["behaviorSurface"]); behaviorSurface != "" {
		extras.WriteString(fmt.Sprintf("\n\t\t<dt>behaviorSurface</dt>\n\t\t<dd>%s</dd>", escapeHTML(behaviorSurface)))
	}
	writeDimensionList(&extras, "successDimensions", arrayOrEmpty(intentProfile["successDimensions"]))
	writeDimensionList(&extras, "guardrailDimensions", arrayOrEmpty(intentProfile["guardrailDimensions"]))
	return fmt.Sprintf(`
<section class="panel" aria-labelledby="intent-heading">
	<h2 id="intent-heading">Intent</h2>
	<p class="intent-text" data-field="intent">%s</p>
	<dl class="meta-grid">
		<dt>recommendation</dt>
		<dd data-field="recommendation">%s</dd>%s
	</dl>
</section>`,
		escapeHTML(defaultString(report["intent"], "n/a")),
		escapeHTML(defaultString(report["recommendation"], "n/a")),
		extras.String(),
	)
}

func renderReportDecisionSignalsPanel(report map[string]any) string {
	reasonCodes := arrayOrEmpty(report["reasonCodes"])
	warnings := arrayOrEmpty(report["warnings"])
	return fmt.Sprintf(`
<section class="panel" aria-labelledby="signals-heading">
	<h2 id="signals-heading">Decision Signals</h2>
	<p class="panel-lead">%s</p>
	<div class="chip-row">
		<span class="chip" style="background:%s">recommendation: %s</span>
		<span class="chip neutral">regressed: %d</span>
		<span class="chip neutral">noisy: %d</span>
		<span class="chip neutral">improved: %d</span>
		<span class="chip neutral">warnings: %d</span>
	</div>
	%s
	%s
</section>`,
		escapeHTML(reportDecisionPressure(report)),
		selfDogfoodStatusColor(stringOrEmpty(report["recommendation"])),
		escapeHTML(selfDogfoodStatusLabel(stringOrEmpty(report["recommendation"]))),
		len(arrayOrEmpty(report["regressed"])),
		len(arrayOrEmpty(report["noisy"])),
		len(arrayOrEmpty(report["improved"])),
		len(warnings),
		renderReportReasonCodes(reasonCodes),
		renderReportWarnings(warnings),
	)
}

func renderReportModesPanel(report map[string]any) string {
	modeSummaries := arrayOrEmpty(report["modeSummaries"])
	if len(modeSummaries) == 0 {
		return `
<section class="panel" aria-labelledby="modes-heading">
	<h2 id="modes-heading">Modes</h2>
	<p class="empty">No mode runs recorded.</p>
</section>`
	}
	var rows strings.Builder
	for _, raw := range modeSummaries {
		mode := asMap(raw)
		status := stringOrEmpty(mode["status"])
		colorStatus := status
		if status == "passed" {
			colorStatus = "pass"
		}
		rows.WriteString(fmt.Sprintf(`
		<tr data-mode="%s">
			<td>%s</td>
			<td><span class="chip" style="background:%s">%s</span></td>
			<td>%s</td>
			<td>%s</td>
		</tr>`,
			escapeHTML(defaultString(mode["mode"], "")),
			escapeHTML(defaultString(mode["mode"], "n/a")),
			selfDogfoodStatusColor(colorStatus),
			escapeHTML(selfDogfoodStatusLabel(status)),
			escapeHTML(formatDuration(numberOrDefault(mode["durationMs"], -1))),
			escapeHTML(defaultString(mode["summary"], "")),
		))
	}
	return `
<section class="panel" aria-labelledby="modes-heading">
	<h2 id="modes-heading">Modes</h2>
	<p class="panel-copy">Mode execution is supporting context unless it carries a blocker or contamination warning that changes the recommendation.</p>
	<table class="data-table">
		<thead>
			<tr>
				<th>mode</th>
				<th>status</th>
				<th>duration</th>
				<th>summary</th>
			</tr>
		</thead>
		<tbody>` + rows.String() + `
		</tbody>
	</table>
</section>`
}

func renderReportReasonCodes(reasonCodes []any) string {
	if len(reasonCodes) == 0 {
		return `<p class="empty">No report-level reason codes recorded.</p>`
	}
	chips := make([]string, 0, len(reasonCodes))
	for _, raw := range reasonCodes {
		chips = append(chips, fmt.Sprintf(`<span class="chip neutral">%s</span>`, escapeHTML(stringOrEmpty(raw))))
	}
	return `<p class="chip-row">` + strings.Join(chips, " ") + `</p>`
}

func renderReportWarnings(warnings []any) string {
	if len(warnings) == 0 {
		return ""
	}
	var items strings.Builder
	items.WriteString(`<ul class="findings">`)
	for idx, raw := range warnings {
		warning := asMap(raw)
		items.WriteString(fmt.Sprintf(`
		<li class="finding" data-warning-index="%d">
			<span class="chip" style="background:%s">warning</span>
			<div class="finding-body">
				<div class="finding-message">%s</div>
				<div class="finding-path"><code>%s</code></div>
			</div>
		</li>`,
			idx+1,
			selfDogfoodStatusColor("concern"),
			escapeHTML(defaultString(warning["summary"], "")),
			escapeHTML(defaultString(warning["code"], "")),
		))
	}
	items.WriteString(`
	</ul>`)
	return items.String()
}

var reportScenarioBucketOrder = []struct {
	field string
	label string
	color string
}{
	{"improved", "improved", "pass"},
	{"regressed", "regressed", "blocker"},
	{"noisy", "noisy", "concern"},
	{"unchanged", "unchanged", "unknown"},
}

func renderReportScenarioBucketsPanel(report map[string]any) string {
	var blocks strings.Builder
	hasAny := false
	for _, bucket := range reportScenarioBucketOrder {
		entries := arrayOrEmpty(report[bucket.field])
		if len(entries) == 0 {
			continue
		}
		hasAny = true
		blocks.WriteString(fmt.Sprintf(`
	<article class="variant" data-bucket="%s">
		<header class="variant-header">
			<h3>%s</h3>
			<div class="variant-chips">
				<span class="chip" style="background:%s">%s</span>
				<span class="chip neutral">count: %d</span>
			</div>
		</header>
		<ul class="findings">`,
			escapeHTML(bucket.field),
			escapeHTML(bucket.label),
			selfDogfoodStatusColor(bucket.color),
			escapeHTML(selfDogfoodStatusLabel(bucket.color)),
			len(entries),
		))
		for _, entry := range entries {
			blocks.WriteString(renderReportScenarioBucketEntry(entry))
		}
		blocks.WriteString(`
		</ul>
	</article>`)
	}
	if !hasAny {
		return `
<section class="panel" aria-labelledby="scenarios-heading">
	<h2 id="scenarios-heading">Scenario Outcomes</h2>
	<p class="empty">No scenario bucket entries recorded.</p>
</section>`
	}
	return `
<section class="panel" aria-labelledby="scenarios-heading">
	<h2 id="scenarios-heading">Scenario Outcomes</h2>
	` + blocks.String() + `
</section>`
}

func renderReportScenarioBucketEntry(entry any) string {
	if text, ok := entry.(string); ok {
		return fmt.Sprintf(`
			<li class="finding">
				<div class="finding-body"><div class="finding-message"><code>%s</code></div></div>
			</li>`, escapeHTML(text))
	}
	record := asMap(entry)
	scenarioID := defaultString(record["scenarioId"], "")
	metric := defaultString(record["metric"], "")
	var chips strings.Builder
	if metric != "" {
		chips.WriteString(fmt.Sprintf(`<span class="chip neutral">metric: %s</span>`, escapeHTML(metric)))
	}
	message := scenarioID
	if message == "" {
		message = defaultString(record["reason"], "")
	}
	return fmt.Sprintf(`
			<li class="finding" data-scenario="%s">
				%s
				<div class="finding-body"><div class="finding-message">%s</div></div>
			</li>`,
		escapeHTML(scenarioID),
		chips.String(),
		escapeHTML(message),
	)
}

func renderReportFindingsPanel(report map[string]any) string {
	findings := arrayOrEmpty(report["humanReviewFindings"])
	if len(findings) == 0 {
		return `
<section class="panel" aria-labelledby="findings-heading">
	<h2 id="findings-heading">Human Review Findings</h2>
	<p class="empty">No human review findings recorded.</p>
</section>`
	}
	var items strings.Builder
	items.WriteString(`<ul class="findings">`)
	for _, raw := range findings {
		finding := asMap(raw)
		severity := defaultString(finding["severity"], "unknown")
		items.WriteString(fmt.Sprintf(`
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
	items.WriteString(`
	</ul>`)
	return `
<section class="panel" aria-labelledby="findings-heading">
	<h2 id="findings-heading">Human Review Findings</h2>
	` + items.String() + `
</section>`
}

func renderReportFooter(report map[string]any) string {
	telemetry := asMap(report["telemetry"])
	telemetryLine := ""
	if len(telemetry) > 0 {
		telemetryLine = fmt.Sprintf(`<p class="telemetry">modes %s · with scenario results %s · total %s</p>`,
			escapeHTML(defaultString(telemetry["modeCount"], "n/a")),
			escapeHTML(defaultString(telemetry["modesWithScenarioResults"], "n/a")),
			escapeHTML(formatDuration(numberOrDefault(telemetry["durationMs"], -1))),
		)
	}
	return fmt.Sprintf(`
<footer class="footer">
	%s
	<p>Generated from <code>report.json</code> (schemaVersion <code>%s</code>).
	Do not hand-edit this file — rerun <code>cautilus report render-html</code> to refresh.</p>
</footer>`,
		telemetryLine,
		escapeHTML(defaultString(report["schemaVersion"], "n/a")),
	)
}

func reportModesAggregateStatus(report map[string]any) string {
	modes := arrayOrEmpty(report["modeSummaries"])
	if len(modes) == 0 {
		return "n/a"
	}
	worst := "pass"
	for _, raw := range modes {
		status := stringOrEmpty(asMap(raw)["status"])
		switch status {
		case "failed", "blocker", "reject":
			return "blocker"
		case "concern", "defer":
			worst = "concern"
		}
	}
	return worst
}

func reportScenarioBucketsAggregateStatus(report map[string]any) string {
	if len(arrayOrEmpty(report["regressed"])) > 0 {
		return "blocker"
	}
	if len(arrayOrEmpty(report["noisy"])) > 0 {
		return "concern"
	}
	if len(arrayOrEmpty(report["improved"])) > 0 {
		return "pass"
	}
	return "unknown"
}

func reportFindingsAggregateStatus(report map[string]any) string {
	findings := arrayOrEmpty(report["humanReviewFindings"])
	if len(findings) == 0 {
		return "n/a"
	}
	worst := "pass"
	for _, raw := range findings {
		severity := stringOrEmpty(asMap(raw)["severity"])
		switch severity {
		case "blocker", "failed", "reject":
			return "blocker"
		case "concern", "defer":
			worst = "concern"
		}
	}
	return worst
}

func reportDecisionSignalsAggregateStatus(report map[string]any) string {
	if len(arrayOrEmpty(report["warnings"])) > 0 {
		return "concern"
	}
	return reportScenarioBucketsAggregateStatus(report)
}

func reportDecisionPressure(report map[string]any) string {
	if len(arrayOrEmpty(report["warnings"])) > 0 {
		return "contamination or runtime warnings are currently limiting confidence"
	}
	if len(arrayOrEmpty(report["regressed"])) > 0 {
		return "regressed signal is currently carrying the decision"
	}
	if len(arrayOrEmpty(report["noisy"])) > 0 {
		return "noisy signal is currently limiting confidence"
	}
	if len(arrayOrEmpty(report["improved"])) > 0 {
		return "improved signal is currently carrying the decision"
	}
	return "no dominant decision signal recorded"
}

// writeReportHTMLPacketFromJSON is a small helper used by tests to materialize
// a report packet map to a temporary file for integration-style coverage.
// It is intentionally unexported.
func writeReportHTMLPacketFromJSON(path string, packet map[string]any) error {
	data, err := json.MarshalIndent(packet, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0o644)
}
