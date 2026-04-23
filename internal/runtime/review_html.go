package runtime

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/corca-ai/cautilus/internal/contracts"
)

// RenderReviewPacketHTML renders a cautilus.review_packet.v1 into a
// single-page HTML view. The packet wraps a full report.json plus the
// review questions, judge prompts, and referenced files an operator
// needs to decide without opening each JSON manually.
func RenderReviewPacketHTML(packet map[string]any) string {
	var builder strings.Builder
	report := asMap(packet["report"])
	title := fmt.Sprintf("Cautilus Review Packet — %s", selfDogfoodStatusLabel(stringOrEmpty(report["recommendation"])))
	builder.WriteString("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n")
	builder.WriteString("<meta name=\"generator\" content=\"cautilus review render-html\">\n")
	builder.WriteString("<title>" + escapeHTML(title) + "</title>\n<style>" + selfDogfoodHTMLStyles + "</style>\n</head>\n<body>\n<main>\n")
	builder.WriteString(renderReviewPacketHeader(packet, report))
	builder.WriteString(renderSelfDogfoodPageTOC([]tocNavEntry{
		{Anchor: "intent-heading", Label: "Intent", Status: stringOrEmpty(report["recommendation"])},
		{Anchor: "path-heading", Label: "Review Path", Status: reviewPathAggregateStatus(packet)},
		{Anchor: "questions-heading", Label: "Comparison Questions", Status: reviewQuestionsAggregateStatus(packet)},
		{Anchor: "prompts-heading", Label: "Human Review Prompts", Status: reviewPromptsAggregateStatus(packet)},
		{Anchor: "artifacts-heading", Label: "Artifacts", Status: reviewArtifactsAggregateStatus(packet)},
	}))
	builder.WriteString(renderReviewPacketIntentPanel(packet, report))
	builder.WriteString(renderReviewPacketPathPanel(packet, report))
	builder.WriteString(renderReviewComparisonQuestionsPanel(packet))
	builder.WriteString(renderReviewHumanPromptsPanel(packet))
	builder.WriteString(renderReviewArtifactsPanel(packet))
	builder.WriteString(renderReviewPacketFooter(packet))
	builder.WriteString("\n</main>\n</body>\n</html>\n")
	return rewriteSelfDogfoodLinks(builder.String())
}

func RenderReviewPacketHTMLFromFile(inputPath string) (string, error) {
	packet, err := readJSONFile(inputPath)
	if err != nil {
		return "", fmt.Errorf("failed to read review packet from %s: %w", inputPath, err)
	}
	if packet["schemaVersion"] != contracts.ReviewPacketSchema {
		return "", fmt.Errorf("%s must use schemaVersion %s", inputPath, contracts.ReviewPacketSchema)
	}
	return RenderReviewPacketHTML(packet), nil
}

func WriteReviewPacketHTMLFromFile(inputPath string, outputPath *string) (string, error) {
	rendered, err := RenderReviewPacketHTMLFromFile(inputPath)
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

// RenderReviewSummaryHTML renders a cautilus.review_summary.v1 packet into a
// human-review view. A reviewer should be able to see the overall verdict,
// per-variant verdicts, and flattened findings without opening each variant
// output file.
func RenderReviewSummaryHTML(summary map[string]any) string {
	var builder strings.Builder
	status := stringOrEmpty(summary["status"])
	verdict := stringOrEmpty(summary["reviewVerdict"])
	title := fmt.Sprintf("Cautilus Review Summary — %s", selfDogfoodStatusLabel(verdict))
	builder.WriteString("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n")
	builder.WriteString("<meta name=\"generator\" content=\"cautilus review render-variants-summary-html\">\n")
	builder.WriteString("<title>" + escapeHTML(title) + "</title>\n<style>" + selfDogfoodHTMLStyles + "</style>\n</head>\n<body>\n<main>\n")
	builder.WriteString(renderReviewSummaryHeader(summary, status, verdict))
	builder.WriteString(renderSelfDogfoodPageTOC([]tocNavEntry{
		{Anchor: "consensus-heading", Label: "Consensus", Status: reviewSummaryConsensusAggregateStatus(summary)},
		{Anchor: "telemetry-heading", Label: "Telemetry", Status: reviewVariantExecutionAggregateStatus(summary)},
		{Anchor: "variants-heading", Label: "Variants", Status: reviewVariantVerdictAggregateStatus(summary)},
		{Anchor: "findings-heading", Label: "Flattened Findings", Status: reviewSummaryFindingsAggregateStatus(summary)},
	}))
	builder.WriteString(renderReviewSummaryConsensusPanel(summary))
	builder.WriteString(renderReviewSummaryTelemetryPanel(summary))
	builder.WriteString(renderReviewSummaryVariantsPanel(summary))
	builder.WriteString(renderReviewSummaryFindingsPanel(summary))
	builder.WriteString(renderReviewSummaryFooter(summary))
	builder.WriteString("\n</main>\n</body>\n</html>\n")
	return rewriteSelfDogfoodLinks(builder.String())
}

func RenderReviewSummaryHTMLFromFile(inputPath string) (string, error) {
	summary, err := readJSONFile(inputPath)
	if err != nil {
		return "", fmt.Errorf("failed to read review summary from %s: %w", inputPath, err)
	}
	if summary["schemaVersion"] != contracts.ReviewSummarySchema {
		return "", fmt.Errorf("%s must use schemaVersion %s", inputPath, contracts.ReviewSummarySchema)
	}
	return RenderReviewSummaryHTML(summary), nil
}

func WriteReviewSummaryHTMLFromFile(inputPath string, outputPath *string) (string, error) {
	rendered, err := RenderReviewSummaryHTMLFromFile(inputPath)
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

// --- review packet renderers ---

func renderReviewPacketHeader(packet map[string]any, report map[string]any) string {
	recommendation := stringOrEmpty(report["recommendation"])
	color := selfDogfoodStatusColor(recommendation)
	return fmt.Sprintf(`
<header class="banner" style="border-left:8px solid %s">
	<div class="banner-title">Cautilus Review Packet</div>
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
		escapeHTML(defaultString(packet["generatedAt"], "n/a")),
	)
}

func renderReviewPacketIntentPanel(packet map[string]any, report map[string]any) string {
	reportFile := defaultString(packet["reportFile"], "")
	reportLink := ""
	if reportFile != "" {
		reportLink = fmt.Sprintf(`<dt>reportFile</dt><dd><a href="%s"><code>%s</code></a></dd>`, escapeHTML(reportFile), escapeHTML(reportFile))
	}
	return fmt.Sprintf(`
<section class="panel" aria-labelledby="intent-heading">
	<h2 id="intent-heading">Intent</h2>
	<p class="intent-text" data-field="intent">%s</p>
	<dl class="meta-grid">
		<dt>recommendation</dt>
		<dd data-field="recommendation">%s</dd>
		<dt>repoRoot</dt>
		<dd><code>%s</code></dd>
		%s
	</dl>
</section>`,
		escapeHTML(defaultString(report["intent"], "n/a")),
		escapeHTML(defaultString(report["recommendation"], "n/a")),
		escapeHTML(defaultString(packet["repoRoot"], "n/a")),
		reportLink,
	)
}

func renderReviewPacketPathPanel(packet map[string]any, report map[string]any) string {
	return fmt.Sprintf(`
<section class="panel" aria-labelledby="path-heading">
	<h2 id="path-heading">Review Path</h2>
	<p class="panel-lead">%s</p>
	<div class="chip-row">
		<span class="chip" style="background:%s">recommendation: %s</span>
		<span class="chip neutral">comparison questions: %d</span>
		<span class="chip neutral">review prompts: %d</span>
		<span class="chip neutral">artifact refs: %d</span>
	</div>
	<dl class="meta-grid">
		<dt>reading order</dt>
		<dd>comparison questions -> human review prompts -> artifact refs</dd>
		<dt>decision pressure</dt>
		<dd>%s</dd>
	</dl>
</section>`,
		escapeHTML(reviewPacketDecisionPressure(packet, report)),
		selfDogfoodStatusColor(stringOrEmpty(report["recommendation"])),
		escapeHTML(selfDogfoodStatusLabel(stringOrEmpty(report["recommendation"]))),
		len(arrayOrEmpty(packet["comparisonQuestions"])),
		len(arrayOrEmpty(packet["humanReviewPrompts"])),
		len(arrayOrEmpty(packet["artifactFiles"]))+len(arrayOrEmpty(packet["reportArtifacts"])),
		escapeHTML(reviewPacketDecisionPressure(packet, report)),
	)
}

func renderReviewComparisonQuestionsPanel(packet map[string]any) string {
	questions := arrayOrEmpty(packet["comparisonQuestions"])
	if len(questions) == 0 {
		return `
<section class="panel" aria-labelledby="questions-heading">
	<h2 id="questions-heading">Comparison Questions</h2>
	<p class="empty">No comparison questions recorded.</p>
</section>`
	}
	var items strings.Builder
	items.WriteString(`<ul class="findings">`)
	for _, raw := range questions {
		items.WriteString(fmt.Sprintf(`
		<li class="finding"><div class="finding-body"><div class="finding-message">%s</div></div></li>`,
			escapeHTML(stringOrEmpty(raw)),
		))
	}
	items.WriteString(`
	</ul>`)
	return `
<section class="panel" aria-labelledby="questions-heading">
	<h2 id="questions-heading">Comparison Questions</h2>
	<p class="panel-copy">These questions define what the reviewer should judge before opening prompts or raw artifacts.</p>
	` + items.String() + `
</section>`
}

func renderReviewHumanPromptsPanel(packet map[string]any) string {
	prompts := arrayOrEmpty(packet["humanReviewPrompts"])
	if len(prompts) == 0 {
		return `
<section class="panel" aria-labelledby="prompts-heading">
	<h2 id="prompts-heading">Human Review Prompts</h2>
	<p class="empty">No human review prompts recorded.</p>
</section>`
	}
	var items strings.Builder
	items.WriteString(`<ul class="findings">`)
	for _, raw := range prompts {
		record := asMap(raw)
		id := defaultString(record["id"], "")
		prompt := defaultString(record["prompt"], "")
		items.WriteString(fmt.Sprintf(`
		<li class="finding" data-prompt-id="%s">
			<span class="chip neutral">%s</span>
			<div class="finding-body"><div class="finding-message">%s</div></div>
		</li>`,
			escapeHTML(id),
			escapeHTML(id),
			escapeHTML(prompt),
		))
	}
	items.WriteString(`
	</ul>`)
	return `
<section class="panel" aria-labelledby="prompts-heading">
	<h2 id="prompts-heading">Human Review Prompts</h2>
	<p class="panel-copy">Prompts are supporting lenses, not the first decision surface.</p>
	` + items.String() + `
</section>`
}

func renderReviewArtifactsPanel(packet map[string]any) string {
	artifactFiles := arrayOrEmpty(packet["artifactFiles"])
	reportArtifacts := arrayOrEmpty(packet["reportArtifacts"])
	if len(artifactFiles) == 0 && len(reportArtifacts) == 0 {
		return `
<section class="panel" aria-labelledby="artifacts-heading">
	<h2 id="artifacts-heading">Artifacts</h2>
	<p class="empty">No artifact references recorded.</p>
</section>`
	}
	var body strings.Builder
	if len(artifactFiles) > 0 {
		body.WriteString(`<h3>artifactFiles</h3>` + renderReviewFileRecordList(artifactFiles))
	}
	if len(reportArtifacts) > 0 {
		body.WriteString(`<h3>reportArtifacts</h3>` + renderReviewFileRecordList(reportArtifacts))
	}
	return `
<section class="panel" aria-labelledby="artifacts-heading">
	<h2 id="artifacts-heading">Artifacts</h2>
	<p class="panel-copy">Artifact references are the last hop when the question or prompt needs exact evidence.</p>
	` + body.String() + `
</section>`
}

func renderReviewFileRecordList(records []any) string {
	var items strings.Builder
	items.WriteString(`<ul class="findings">`)
	for _, raw := range records {
		record := asMap(raw)
		path := defaultString(record["path"], "")
		items.WriteString(fmt.Sprintf(`
		<li class="finding"><div class="finding-body"><div class="finding-message"><a href="%s"><code>%s</code></a></div></div></li>`,
			escapeHTML(path), escapeHTML(path),
		))
	}
	items.WriteString(`
	</ul>`)
	return items.String()
}

func renderReviewPacketFooter(packet map[string]any) string {
	return fmt.Sprintf(`
<footer class="footer">
	<p>Generated from <code>review.json</code> (schemaVersion <code>%s</code>).
	Do not hand-edit this file — rerun <code>cautilus review render-html</code> to refresh.</p>
</footer>`,
		escapeHTML(defaultString(packet["schemaVersion"], "n/a")),
	)
}

// --- review summary renderers ---

func renderReviewSummaryHeader(summary map[string]any, status, verdict string) string {
	color := selfDogfoodStatusColor(verdict)
	execColor := selfDogfoodStatusColor(normalizeReviewExecutionStatus(status))
	return fmt.Sprintf(`
<header class="banner" style="border-left:8px solid %s">
	<div class="banner-title">Cautilus Review Summary</div>
	<div class="banner-status">
		<span class="chip" data-status="reviewVerdict" style="background:%s">verdict: %s</span>
		<span class="chip" data-status="executionStatus" style="background:%s">execution: %s</span>
		<span class="banner-meta">generatedAt %s</span>
	</div>
</header>`,
		color,
		color,
		escapeHTML(selfDogfoodStatusLabel(verdict)),
		execColor,
		escapeHTML(selfDogfoodStatusLabel(normalizeReviewExecutionStatus(status))),
		escapeHTML(defaultString(summary["generatedAt"], "n/a")),
	)
}

func renderReviewSummaryTelemetryPanel(summary map[string]any) string {
	telemetry := asMap(summary["telemetry"])
	if len(telemetry) == 0 {
		return `
<section class="panel" aria-labelledby="telemetry-heading">
	<h2 id="telemetry-heading">Telemetry</h2>
	<p class="empty">No telemetry recorded.</p>
</section>`
	}
	reasonCodes := arrayOrEmpty(summary["reasonCodes"])
	var reasonRow string
	if len(reasonCodes) > 0 {
		chips := make([]string, 0, len(reasonCodes))
		for _, raw := range reasonCodes {
			chips = append(chips, fmt.Sprintf(`<span class="chip neutral">%s</span>`, escapeHTML(stringOrEmpty(raw))))
		}
		reasonRow = fmt.Sprintf(`<dt>reasonCodes</dt><dd>%s</dd>`, strings.Join(chips, " "))
	}
	return fmt.Sprintf(`
<section class="panel" aria-labelledby="telemetry-heading">
	<h2 id="telemetry-heading">Telemetry</h2>
	<dl class="meta-grid">
		<dt>variantCount</dt><dd>%s</dd>
		<dt>passedVariantCount</dt><dd>%s</dd>
		<dt>failedVariantCount</dt><dd>%s</dd>
		<dt>durationMs</dt><dd>%s</dd>
		<dt>findingsCount</dt><dd>%s</dd>
		%s
	</dl>
</section>`,
		escapeHTML(defaultString(telemetry["variantCount"], "n/a")),
		escapeHTML(defaultString(telemetry["passedVariantCount"], "n/a")),
		escapeHTML(defaultString(telemetry["failedVariantCount"], "n/a")),
		escapeHTML(formatDuration(numberOrDefault(telemetry["durationMs"], -1))),
		escapeHTML(defaultString(summary["findingsCount"], "n/a")),
		reasonRow,
	)
}

func renderReviewSummaryConsensusPanel(summary map[string]any) string {
	verdictCounts := reviewSummaryStatusCounts(arrayOrEmpty(summary["variants"]), func(variant map[string]any) string {
		return stringOrEmpty(asMap(variant["output"])["verdict"])
	})
	executionCounts := reviewSummaryStatusCounts(arrayOrEmpty(summary["variants"]), func(variant map[string]any) string {
		return normalizeReviewExecutionStatus(stringOrEmpty(variant["status"]))
	})
	return fmt.Sprintf(`
<section class="panel" aria-labelledby="consensus-heading">
	<h2 id="consensus-heading">Consensus</h2>
	<p class="panel-lead">%s</p>
	<div class="chip-row">%s %s</div>
	<dl class="meta-grid">
		<dt>decision pressure</dt>
		<dd>%s</dd>
		<dt>variant count</dt>
		<dd>%d</dd>
		<dt>distinct verdicts</dt>
		<dd>%d</dd>
		<dt>distinct execution states</dt>
		<dd>%d</dd>
	</dl>
</section>`,
		escapeHTML(reviewSummaryConsensusHeadline(summary)),
		reviewSummaryStatusChips("verdict", verdictCounts),
		reviewSummaryStatusChips("execution", executionCounts),
		escapeHTML(reviewSummaryDecisionPressure(summary)),
		len(arrayOrEmpty(summary["variants"])),
		len(verdictCounts),
		len(executionCounts),
	)
}

func renderReviewSummaryVariantsPanel(summary map[string]any) string {
	variants := arrayOrEmpty(summary["variants"])
	if len(variants) == 0 {
		return `
<section class="panel" aria-labelledby="variants-heading">
	<h2 id="variants-heading">Variants</h2>
	<p class="empty">No variants recorded.</p>
</section>`
	}
	var blocks strings.Builder
	for _, raw := range variants {
		blocks.WriteString(renderReviewSummaryVariantBlock(asMap(raw)))
	}
	return `
<section class="panel" aria-labelledby="variants-heading">
	<h2 id="variants-heading">Variants</h2>
	` + blocks.String() + `
</section>`
}

func renderReviewSummaryVariantBlock(variant map[string]any) string {
	output := asMap(variant["output"])
	execStatus := stringOrEmpty(variant["status"])
	execColor := selfDogfoodStatusColor(normalizeReviewExecutionStatus(execStatus))
	verdict := defaultString(output["verdict"], "n/a")
	verdictColor := selfDogfoodStatusColor(verdict)
	findings := arrayOrEmpty(output["findings"])
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
			<h3>%s</h3>
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
		execColor,
		escapeHTML(selfDogfoodStatusLabel(normalizeReviewExecutionStatus(execStatus))),
		verdictColor,
		escapeHTML(selfDogfoodStatusLabel(verdict)),
		len(findings),
		escapeHTML(formatDuration(numberOrDefault(variant["durationMs"], -1))),
		escapeHTML(defaultString(output["summary"], "")),
		findingsHTML.String(),
	)
}

func renderReviewSummaryFindingsPanel(summary map[string]any) string {
	findings := arrayOrEmpty(summary["humanReviewFindings"])
	if len(findings) == 0 {
		return `
<section class="panel" aria-labelledby="findings-heading">
	<h2 id="findings-heading">Flattened Findings</h2>
	<p class="empty">No findings recorded.</p>
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
	<h2 id="findings-heading">Flattened Findings</h2>
	` + items.String() + `
</section>`
}

func renderReviewSummaryFooter(summary map[string]any) string {
	return fmt.Sprintf(`
<footer class="footer">
	<p>Generated from <code>review-summary.json</code> (schemaVersion <code>%s</code>).
	Do not hand-edit this file — rerun <code>cautilus review render-variants-summary-html</code> to refresh.</p>
</footer>`,
		escapeHTML(defaultString(summary["schemaVersion"], "n/a")),
	)
}

// --- aggregate status helpers ---

func reviewQuestionsAggregateStatus(packet map[string]any) string {
	if len(arrayOrEmpty(packet["comparisonQuestions"])) == 0 {
		return "n/a"
	}
	return "unknown"
}

func reviewPathAggregateStatus(packet map[string]any) string {
	if len(arrayOrEmpty(packet["comparisonQuestions"])) == 0 {
		return reviewArtifactsAggregateStatus(packet)
	}
	return reviewQuestionsAggregateStatus(packet)
}

func reviewPromptsAggregateStatus(packet map[string]any) string {
	if len(arrayOrEmpty(packet["humanReviewPrompts"])) == 0 {
		return "n/a"
	}
	return "unknown"
}

func reviewPacketDecisionPressure(packet map[string]any, report map[string]any) string {
	switch {
	case len(arrayOrEmpty(packet["comparisonQuestions"])) > 0:
		return "comparison questions currently carry the review decision"
	case len(arrayOrEmpty(packet["humanReviewPrompts"])) > 0:
		return "review prompts currently carry the review decision"
	case len(arrayOrEmpty(packet["artifactFiles"]))+len(arrayOrEmpty(packet["reportArtifacts"])) > 0:
		return "artifact references currently carry the review decision"
	case stringOrEmpty(report["recommendation"]) != "":
		return "report recommendation is the only available review signal"
	default:
		return "no explicit review path recorded"
	}
}

func reviewArtifactsAggregateStatus(packet map[string]any) string {
	if len(arrayOrEmpty(packet["artifactFiles"])) == 0 && len(arrayOrEmpty(packet["reportArtifacts"])) == 0 {
		return "n/a"
	}
	return "unknown"
}

func reviewVariantExecutionAggregateStatus(summary map[string]any) string {
	variants := arrayOrEmpty(summary["variants"])
	if len(variants) == 0 {
		return "n/a"
	}
	for _, raw := range variants {
		status := normalizeReviewExecutionStatus(stringOrEmpty(asMap(raw)["status"]))
		if status != "pass" && status != "passed" {
			return status
		}
	}
	return "pass"
}

func reviewVariantVerdictAggregateStatus(summary map[string]any) string {
	if verdict := stringOrEmpty(summary["reviewVerdict"]); verdict != "" {
		return verdict
	}
	worst := "pass"
	for _, raw := range arrayOrEmpty(summary["variants"]) {
		verdict := stringOrEmpty(asMap(asMap(raw)["output"])["verdict"])
		switch verdict {
		case "blocker", "failed", "reject":
			return "blocker"
		case "concern", "defer":
			worst = "concern"
		}
	}
	return worst
}

func reviewSummaryFindingsAggregateStatus(summary map[string]any) string {
	findings := arrayOrEmpty(summary["humanReviewFindings"])
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

func reviewSummaryConsensusAggregateStatus(summary map[string]any) string {
	verdictCounts := reviewSummaryStatusCounts(arrayOrEmpty(summary["variants"]), func(variant map[string]any) string {
		return stringOrEmpty(asMap(variant["output"])["verdict"])
	})
	if len(verdictCounts) > 1 {
		return "concern"
	}
	return reviewVariantVerdictAggregateStatus(summary)
}

func reviewSummaryConsensusHeadline(summary map[string]any) string {
	verdictCounts := reviewSummaryStatusCounts(arrayOrEmpty(summary["variants"]), func(variant map[string]any) string {
		return stringOrEmpty(asMap(variant["output"])["verdict"])
	})
	executionCounts := reviewSummaryStatusCounts(arrayOrEmpty(summary["variants"]), func(variant map[string]any) string {
		return normalizeReviewExecutionStatus(stringOrEmpty(variant["status"]))
	})
	switch {
	case len(verdictCounts) == 0:
		return "No review variants recorded."
	case len(verdictCounts) == 1 && len(executionCounts) == 1:
		return "All variants align on both execution state and review verdict."
	case len(verdictCounts) > 1 && len(executionCounts) == 1:
		return "Execution aligned, but verdicts diverged across variants."
	case len(verdictCounts) == 1 && len(executionCounts) > 1:
		return "Review verdict aligned, but execution states diverged across variants."
	default:
		return "Both execution state and review verdict diverged across variants."
	}
}

func reviewSummaryDecisionPressure(summary map[string]any) string {
	verdictCounts := reviewSummaryStatusCounts(arrayOrEmpty(summary["variants"]), func(variant map[string]any) string {
		return stringOrEmpty(asMap(variant["output"])["verdict"])
	})
	if len(verdictCounts) > 1 {
		return "review verdict disagreement needs inspection before treating the summary as settled"
	}
	executionCounts := reviewSummaryStatusCounts(arrayOrEmpty(summary["variants"]), func(variant map[string]any) string {
		return normalizeReviewExecutionStatus(stringOrEmpty(variant["status"]))
	})
	if len(executionCounts) > 1 {
		return "execution divergence needs inspection before trusting a clean aggregate verdict"
	}
	return "variant consensus is currently the dominant review signal"
}

func reviewSummaryStatusCounts(items []any, statusFn func(map[string]any) string) map[string]int {
	counts := map[string]int{}
	for _, raw := range items {
		status := statusFn(asMap(raw))
		if status == "" {
			status = "n/a"
		}
		counts[status]++
	}
	return counts
}

func reviewSummaryStatusChips(prefix string, counts map[string]int) string {
	if len(counts) == 0 {
		return ""
	}
	order := []string{"blocker", "failed", "concern", "defer", "pass", "passed", "unknown", "n/a"}
	used := map[string]struct{}{}
	parts := make([]string, 0, len(counts))
	for _, status := range order {
		count, ok := counts[status]
		if !ok {
			continue
		}
		used[status] = struct{}{}
		parts = append(parts, fmt.Sprintf(`<span class="chip" style="background:%s">%s %s: %d</span>`,
			selfDogfoodStatusColor(status),
			escapeHTML(prefix),
			escapeHTML(selfDogfoodStatusLabel(status)),
			count,
		))
	}
	for status, count := range counts {
		if _, ok := used[status]; ok {
			continue
		}
		parts = append(parts, fmt.Sprintf(`<span class="chip" style="background:%s">%s %s: %d</span>`,
			selfDogfoodStatusColor(status),
			escapeHTML(prefix),
			escapeHTML(selfDogfoodStatusLabel(status)),
			count,
		))
	}
	return strings.Join(parts, " ")
}

// normalizeReviewExecutionStatus maps the schema's `passed` label onto the
// `pass` key used by the shared color palette so status chips keep the same
// green as the rest of the surface.
func normalizeReviewExecutionStatus(status string) string {
	if status == "passed" {
		return "pass"
	}
	return status
}
