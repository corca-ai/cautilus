package runtime

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/corca-ai/cautilus/internal/contracts"
)

// --- compare artifact (claim 6) ---

// RenderCompareArtifactHTML renders a cautilus.compare_artifact.v1 into a
// single diff page. A reviewer sees the verdict, summary, bucketed scenario
// outcomes (improved/regressed/unchanged/noisy), deltas, and linked
// artifactPaths without opening two report.html files. A side-by-side iframe
// layout was considered but rejected: it would require both baseline and
// candidate report.html files to exist alongside the compare artifact, which
// is not guaranteed. The diff page stands on its own.
func RenderCompareArtifactHTML(packet map[string]any) string {
	var builder strings.Builder
	verdict := stringOrEmpty(packet["verdict"])
	title := fmt.Sprintf("Cautilus Compare — %s", selfDogfoodStatusLabel(verdict))
	builder.WriteString("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n")
	builder.WriteString("<meta name=\"generator\" content=\"cautilus workspace render-compare-html\">\n")
	builder.WriteString("<title>" + escapeHTML(title) + "</title>\n<style>" + selfDogfoodHTMLStyles + "</style>\n</head>\n<body>\n<main>\n")
	builder.WriteString(renderCompareHeader(packet, verdict))
	builder.WriteString(renderSelfDogfoodPageTOC([]tocNavEntry{
		{Anchor: "summary-heading", Label: "Summary", Status: verdict},
		{Anchor: "buckets-heading", Label: "Scenario Outcomes", Status: compareBucketsAggregateStatus(packet)},
		{Anchor: "deltas-heading", Label: "Deltas", Status: compareDeltasAggregateStatus(packet)},
		{Anchor: "artifacts-heading", Label: "Artifact Paths", Status: compareArtifactPathsAggregateStatus(packet)},
	}))
	builder.WriteString(renderCompareSummaryPanel(packet))
	builder.WriteString(renderCompareBucketsPanel(packet))
	builder.WriteString(renderCompareDeltasPanel(packet))
	builder.WriteString(renderCompareArtifactPathsPanel(packet))
	builder.WriteString(renderCompareFooter(packet))
	builder.WriteString("\n</main>\n</body>\n</html>\n")
	return rewriteSelfDogfoodLinks(builder.String())
}

func RenderCompareArtifactHTMLFromFile(inputPath string) (string, error) {
	packet, err := readJSONFile(inputPath)
	if err != nil {
		return "", fmt.Errorf("failed to read compare artifact from %s: %w", inputPath, err)
	}
	if packet["schemaVersion"] != contracts.CompareArtifactSchema {
		return "", fmt.Errorf("%s must use schemaVersion %s", inputPath, contracts.CompareArtifactSchema)
	}
	return RenderCompareArtifactHTML(packet), nil
}

func WriteCompareArtifactHTMLFromFile(inputPath string, outputPath *string) (string, error) {
	rendered, err := RenderCompareArtifactHTMLFromFile(inputPath)
	if err != nil {
		return "", err
	}
	return writeRenderedHTML(defaultReportHTMLOutputPath(inputPath), outputPath, rendered)
}

func renderCompareHeader(packet map[string]any, verdict string) string {
	color := selfDogfoodStatusColor(verdict)
	return fmt.Sprintf(`
<header class="banner" style="border-left:8px solid %s">
	<div class="banner-title">Cautilus Compare</div>
	<div class="banner-status">
		<span class="chip" data-status="verdict" style="background:%s">verdict: %s</span>
		<span class="banner-meta">generatedAt %s</span>
	</div>
</header>`,
		color,
		color,
		escapeHTML(selfDogfoodStatusLabel(verdict)),
		escapeHTML(defaultString(packet["generatedAt"], "n/a")),
	)
}

func renderCompareSummaryPanel(packet map[string]any) string {
	return fmt.Sprintf(`
<section class="panel" aria-labelledby="summary-heading">
	<h2 id="summary-heading">Summary</h2>
	<p class="intent-text" data-field="summary">%s</p>
</section>`, escapeHTML(defaultString(packet["summary"], "n/a")))
}

func renderCompareBucketsPanel(packet map[string]any) string {
	var blocks strings.Builder
	hasAny := false
	for _, bucket := range reportScenarioBucketOrder {
		entries := arrayOrEmpty(packet[bucket.field])
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
			escapeHTML(bucket.field), escapeHTML(bucket.label),
			selfDogfoodStatusColor(bucket.color), escapeHTML(selfDogfoodStatusLabel(bucket.color)),
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
<section class="panel" aria-labelledby="buckets-heading">
	<h2 id="buckets-heading">Scenario Outcomes</h2>
	<p class="empty">No scenario bucket entries recorded.</p>
</section>`
	}
	return `
<section class="panel" aria-labelledby="buckets-heading">
	<h2 id="buckets-heading">Scenario Outcomes</h2>
	` + blocks.String() + `
</section>`
}

func renderCompareDeltasPanel(packet map[string]any) string {
	deltas := arrayOrEmpty(packet["deltas"])
	if len(deltas) == 0 {
		return `
<section class="panel" aria-labelledby="deltas-heading">
	<h2 id="deltas-heading">Deltas</h2>
	<p class="empty">No deltas recorded.</p>
</section>`
	}
	var rows strings.Builder
	for _, raw := range deltas {
		delta := asMap(raw)
		status := stringOrEmpty(delta["status"])
		rows.WriteString(fmt.Sprintf(`
		<tr data-delta-key="%s">
			<td><span class="chip" style="background:%s">%s</span></td>
			<td><code>%s</code></td>
			<td>%s</td>
		</tr>`,
			escapeHTML(defaultString(delta["key"], "")),
			selfDogfoodStatusColor(compareDeltaStatusColor(status)),
			escapeHTML(selfDogfoodStatusLabel(compareDeltaStatusColor(status))),
			escapeHTML(defaultString(delta["key"], "n/a")),
			escapeHTML(defaultString(delta["summary"], "")),
		))
	}
	return `
<section class="panel" aria-labelledby="deltas-heading">
	<h2 id="deltas-heading">Deltas</h2>
	<table class="data-table">
		<thead>
			<tr><th>status</th><th>key</th><th>summary</th></tr>
		</thead>
		<tbody>` + rows.String() + `
		</tbody>
	</table>
</section>`
}

func renderCompareArtifactPathsPanel(packet map[string]any) string {
	paths := arrayOrEmpty(packet["artifactPaths"])
	if len(paths) == 0 {
		return `
<section class="panel" aria-labelledby="artifacts-heading">
	<h2 id="artifacts-heading">Artifact Paths</h2>
	<p class="empty">No artifact paths recorded.</p>
</section>`
	}
	var items strings.Builder
	items.WriteString(`<ul class="findings">`)
	for _, raw := range paths {
		path := stringOrEmpty(raw)
		items.WriteString(fmt.Sprintf(`
		<li class="finding"><div class="finding-body"><div class="finding-message"><a href="%s"><code>%s</code></a></div></div></li>`,
			escapeHTML(path), escapeHTML(path),
		))
	}
	items.WriteString(`
	</ul>`)
	return `
<section class="panel" aria-labelledby="artifacts-heading">
	<h2 id="artifacts-heading">Artifact Paths</h2>
	` + items.String() + `
</section>`
}

func renderCompareFooter(packet map[string]any) string {
	return fmt.Sprintf(`
<footer class="footer">
	<p>Generated from <code>compare-artifact.json</code> (schemaVersion <code>%s</code>).
	Do not hand-edit this file — rerun <code>cautilus workspace render-compare-html</code> to refresh.</p>
</footer>`, escapeHTML(defaultString(packet["schemaVersion"], "n/a")))
}

func compareBucketsAggregateStatus(packet map[string]any) string {
	if len(arrayOrEmpty(packet["regressed"])) > 0 {
		return "blocker"
	}
	if len(arrayOrEmpty(packet["noisy"])) > 0 {
		return "concern"
	}
	if len(arrayOrEmpty(packet["improved"])) > 0 {
		return "pass"
	}
	return "unknown"
}

func compareDeltasAggregateStatus(packet map[string]any) string {
	deltas := arrayOrEmpty(packet["deltas"])
	if len(deltas) == 0 {
		return "n/a"
	}
	worst := "pass"
	for _, raw := range deltas {
		status := stringOrEmpty(asMap(raw)["status"])
		switch compareDeltaStatusColor(status) {
		case "blocker":
			return "blocker"
		case "concern":
			worst = "concern"
		}
	}
	return worst
}

func compareArtifactPathsAggregateStatus(packet map[string]any) string {
	if len(arrayOrEmpty(packet["artifactPaths"])) == 0 {
		return "n/a"
	}
	return "unknown"
}

// compareDeltaStatusColor maps compare_delta_status_values to the shared palette.
// Known values (see compareDeltaStatusValues): improved, regressed, unchanged, noisy.
func compareDeltaStatusColor(status string) string {
	switch status {
	case "improved":
		return "pass"
	case "regressed":
		return "blocker"
	case "noisy":
		return "concern"
	case "unchanged":
		return "unknown"
	}
	return "unknown"
}

// --- scenario proposals (claim 7) ---

func RenderScenarioProposalsHTML(packet map[string]any) string {
	var builder strings.Builder
	proposals := arrayOrEmpty(packet["proposals"])
	attentionView := asMap(packet["attentionView"])
	attentionProposals := selectScenarioProposalAttentionSet(proposals, stringSliceOrEmptyRuntime(attentionView["proposalKeys"]))
	title := fmt.Sprintf("Cautilus Scenario Proposals — %d", len(proposals))
	builder.WriteString("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n")
	builder.WriteString("<meta name=\"generator\" content=\"cautilus scenario render-proposals-html\">\n")
	builder.WriteString("<title>" + escapeHTML(title) + "</title>\n<style>" + selfDogfoodHTMLStyles + "</style>\n</head>\n<body>\n<main>\n")
	builder.WriteString(renderProposalsHeader(packet, proposals, attentionProposals))
	builder.WriteString(renderSelfDogfoodPageTOC([]tocNavEntry{
		{Anchor: "context-heading", Label: "Context", Status: "unknown"},
		{Anchor: "attention-heading", Label: "Attention", Status: proposalsAggregateStatus(attentionProposals)},
		{Anchor: "proposals-heading", Label: "Proposals", Status: proposalsAggregateStatus(proposals)},
	}))
	builder.WriteString(renderProposalsContextPanel(packet))
	builder.WriteString(renderProposalsPanel("attention-heading", "Attention View", attentionProposals))
	builder.WriteString(renderProposalsPanel("proposals-heading", "Full Ranked Proposals", proposals))
	builder.WriteString(renderProposalsFooter(packet))
	builder.WriteString("\n</main>\n</body>\n</html>\n")
	return rewriteSelfDogfoodLinks(builder.String())
}

func RenderScenarioProposalsHTMLFromFile(inputPath string) (string, error) {
	packet, err := readJSONFile(inputPath)
	if err != nil {
		return "", fmt.Errorf("failed to read scenario proposals from %s: %w", inputPath, err)
	}
	if packet["schemaVersion"] != contracts.ScenarioProposalsSchema {
		return "", fmt.Errorf("%s must use schemaVersion %s", inputPath, contracts.ScenarioProposalsSchema)
	}
	return RenderScenarioProposalsHTML(packet), nil
}

func WriteScenarioProposalsHTMLFromFile(inputPath string, outputPath *string) (string, error) {
	rendered, err := RenderScenarioProposalsHTMLFromFile(inputPath)
	if err != nil {
		return "", err
	}
	return writeRenderedHTML(defaultReportHTMLOutputPath(inputPath), outputPath, rendered)
}

func renderProposalsHeader(packet map[string]any, proposals []any, attentionProposals []any) string {
	color := selfDogfoodStatusColor(proposalsAggregateStatus(proposals))
	return fmt.Sprintf(`
<header class="banner" style="border-left:8px solid %s">
	<div class="banner-title">Cautilus Scenario Proposals</div>
	<div class="banner-status">
		<span class="chip" style="background:%s">full: %d</span>
		<span class="chip neutral">attention: %d</span>
		<span class="banner-meta">windowDays %s</span>
		<span class="banner-meta">generatedAt %s</span>
	</div>
</header>`,
		color, color, len(proposals), len(attentionProposals),
		escapeHTML(defaultString(packet["windowDays"], "n/a")),
		escapeHTML(defaultString(packet["generatedAt"], "n/a")),
	)
}

func renderProposalsContextPanel(packet map[string]any) string {
	families := arrayOrEmpty(packet["families"])
	chips := make([]string, 0, len(families))
	for _, raw := range families {
		chips = append(chips, fmt.Sprintf(`<span class="chip neutral">%s</span>`, escapeHTML(stringOrEmpty(raw))))
	}
	familyLine := ""
	if len(chips) > 0 {
		familyLine = fmt.Sprintf(`<dt>families</dt><dd>%s</dd>`, strings.Join(chips, " "))
	}
	return fmt.Sprintf(`
<section class="panel" aria-labelledby="context-heading">
	<h2 id="context-heading">Context</h2>
	<dl class="meta-grid">
		<dt>windowDays</dt>
		<dd>%s</dd>
		%s
	</dl>
</section>`,
		escapeHTML(defaultString(packet["windowDays"], "n/a")),
		familyLine,
	)
}

func renderProposalsPanel(headingID string, title string, proposals []any) string {
	if len(proposals) == 0 {
		return fmt.Sprintf(`
<section class="panel" aria-labelledby="%s">
	<h2 id="%s">%s</h2>
	<p class="empty">No scenario proposals generated.</p>
</section>`, escapeHTML(headingID), escapeHTML(headingID), escapeHTML(title))
	}
	var blocks strings.Builder
	for _, raw := range proposals {
		proposal := asMap(raw)
		evidence := arrayOrEmpty(proposal["evidence"])
		blocks.WriteString(fmt.Sprintf(`
	<article class="variant" data-proposal-key="%s">
		<header class="variant-header">
			<h3>%s <small>(%s)</small></h3>
			<div class="variant-chips">
				<span class="chip neutral">action: %s</span>
				<span class="chip neutral">family: %s</span>
				<span class="chip neutral">evidence: %d</span>
			</div>
		</header>
		<p class="variant-summary">%s</p>
	</article>`,
			escapeHTML(defaultString(proposal["proposalKey"], "")),
			escapeHTML(defaultString(proposal["title"], "n/a")),
			escapeHTML(defaultString(proposal["proposalKey"], "n/a")),
			escapeHTML(defaultString(proposal["action"], "n/a")),
			escapeHTML(defaultString(proposal["family"], "n/a")),
			len(evidence),
			escapeHTML(defaultString(proposal["rationale"], "")),
		))
	}
	return fmt.Sprintf(`
<section class="panel" aria-labelledby="%s">
	<h2 id="%s">%s</h2>
	%s
</section>`, escapeHTML(headingID), escapeHTML(headingID), escapeHTML(title), blocks.String())
}

func selectScenarioProposalAttentionSet(proposals []any, keys []string) []any {
	if len(keys) == 0 {
		return []any{}
	}
	keySet := map[string]struct{}{}
	for _, key := range keys {
		keySet[key] = struct{}{}
	}
	selected := make([]any, 0, len(keys))
	for _, rawProposal := range proposals {
		proposalKey := stringOrEmpty(asMap(rawProposal)["proposalKey"])
		if _, ok := keySet[proposalKey]; !ok {
			continue
		}
		selected = append(selected, rawProposal)
	}
	return selected
}

func renderProposalsFooter(packet map[string]any) string {
	return fmt.Sprintf(`
<footer class="footer">
	<p>Generated from <code>proposals.json</code> (schemaVersion <code>%s</code>).
	Do not hand-edit this file — rerun <code>cautilus scenario render-proposals-html</code> to refresh.</p>
</footer>`, escapeHTML(defaultString(packet["schemaVersion"], "n/a")))
}

func proposalsAggregateStatus(proposals []any) string {
	if len(proposals) == 0 {
		return "n/a"
	}
	return "unknown"
}

// --- evidence bundle (claim 8) ---

func RenderEvidenceBundleHTML(bundle map[string]any) string {
	var builder strings.Builder
	signals := arrayOrEmpty(bundle["signals"])
	title := fmt.Sprintf("Cautilus Evidence Bundle — %d signals", len(signals))
	builder.WriteString("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n")
	builder.WriteString("<meta name=\"generator\" content=\"cautilus evidence render-html\">\n")
	builder.WriteString("<title>" + escapeHTML(title) + "</title>\n<style>" + selfDogfoodHTMLStyles + "</style>\n</head>\n<body>\n<main>\n")
	builder.WriteString(renderEvidenceHeader(bundle, signals))
	builder.WriteString(renderSelfDogfoodPageTOC([]tocNavEntry{
		{Anchor: "summary-heading", Label: "Summary", Status: evidenceSignalsAggregateStatus(signals)},
		{Anchor: "signals-heading", Label: "Signals", Status: evidenceSignalsAggregateStatus(signals)},
		{Anchor: "guidance-heading", Label: "Guidance", Status: "unknown"},
		{Anchor: "sources-heading", Label: "Sources", Status: evidenceSourcesAggregateStatus(bundle)},
	}))
	builder.WriteString(renderEvidenceSummaryPanel(bundle))
	builder.WriteString(renderEvidenceSignalsPanel(signals))
	builder.WriteString(renderEvidenceGuidancePanel(bundle))
	builder.WriteString(renderEvidenceSourcesPanel(bundle))
	builder.WriteString(renderEvidenceFooter(bundle))
	builder.WriteString("\n</main>\n</body>\n</html>\n")
	return rewriteSelfDogfoodLinks(builder.String())
}

func RenderEvidenceBundleHTMLFromFile(inputPath string) (string, error) {
	bundle, err := readJSONFile(inputPath)
	if err != nil {
		return "", fmt.Errorf("failed to read evidence bundle from %s: %w", inputPath, err)
	}
	if bundle["schemaVersion"] != contracts.EvidenceBundleSchema {
		return "", fmt.Errorf("%s must use schemaVersion %s", inputPath, contracts.EvidenceBundleSchema)
	}
	return RenderEvidenceBundleHTML(bundle), nil
}

func WriteEvidenceBundleHTMLFromFile(inputPath string, outputPath *string) (string, error) {
	rendered, err := RenderEvidenceBundleHTMLFromFile(inputPath)
	if err != nil {
		return "", err
	}
	return writeRenderedHTML(defaultReportHTMLOutputPath(inputPath), outputPath, rendered)
}

func renderEvidenceHeader(bundle map[string]any, signals []any) string {
	status := evidenceSignalsAggregateStatus(signals)
	color := selfDogfoodStatusColor(status)
	return fmt.Sprintf(`
<header class="banner" style="border-left:8px solid %s">
	<div class="banner-title">Cautilus Evidence Bundle</div>
	<div class="banner-status">
		<span class="chip" style="background:%s">%s</span>
		<span class="banner-meta">signals: %d</span>
		<span class="banner-meta">generatedAt %s</span>
	</div>
</header>`,
		color, color, escapeHTML(selfDogfoodStatusLabel(status)),
		len(signals),
		escapeHTML(defaultString(bundle["generatedAt"], "n/a")),
	)
}

func renderEvidenceSummaryPanel(bundle map[string]any) string {
	summary := asMap(bundle["summary"])
	if len(summary) == 0 {
		return `
<section class="panel" aria-labelledby="summary-heading">
	<h2 id="summary-heading">Summary</h2>
	<p class="empty">No summary recorded.</p>
</section>`
	}
	var rows strings.Builder
	for _, key := range []string{"highSeverityCount", "mediumSeverityCount", "lowSeverityCount", "totalCount"} {
		if value, ok := summary[key]; ok {
			rows.WriteString(fmt.Sprintf(`<dt>%s</dt><dd>%s</dd>`, escapeHTML(key), escapeHTML(defaultString(value, "0"))))
		}
	}
	return `
<section class="panel" aria-labelledby="summary-heading">
	<h2 id="summary-heading">Summary</h2>
	<dl class="meta-grid">` + rows.String() + `</dl>
</section>`
}

func renderEvidenceSignalsPanel(signals []any) string {
	if len(signals) == 0 {
		return `
<section class="panel" aria-labelledby="signals-heading">
	<h2 id="signals-heading">Signals</h2>
	<p class="empty">No signals recorded.</p>
</section>`
	}
	var items strings.Builder
	items.WriteString(`<ul class="findings">`)
	for _, raw := range signals {
		signal := asMap(raw)
		severity := defaultString(signal["severity"], "unknown")
		items.WriteString(fmt.Sprintf(`
		<li class="finding" data-signal-id="%s">
			<span class="chip" style="background:%s">%s</span>
			<div class="finding-body">
				<div class="finding-message">%s</div>
				<div class="finding-path"><code>%s</code></div>
			</div>
		</li>`,
			escapeHTML(defaultString(signal["id"], "")),
			selfDogfoodStatusColor(evidenceSeverityColor(severity)),
			escapeHTML(severity),
			escapeHTML(defaultString(signal["summary"], "")),
			escapeHTML(defaultString(signal["sourceKind"], "")),
		))
	}
	items.WriteString(`
	</ul>`)
	return `
<section class="panel" aria-labelledby="signals-heading">
	<h2 id="signals-heading">Signals</h2>
	` + items.String() + `
</section>`
}

func renderEvidenceGuidancePanel(bundle map[string]any) string {
	guidance := asMap(bundle["guidance"])
	if len(guidance) == 0 {
		return `
<section class="panel" aria-labelledby="guidance-heading">
	<h2 id="guidance-heading">Guidance</h2>
	<p class="empty">No guidance recorded.</p>
</section>`
	}
	var body strings.Builder
	if focus := arrayOrEmpty(guidance["miningFocus"]); len(focus) > 0 {
		body.WriteString(`<h3>miningFocus</h3><ul class="findings">`)
		for _, raw := range focus {
			body.WriteString(fmt.Sprintf(`
		<li class="finding"><div class="finding-body"><div class="finding-message">%s</div></div></li>`,
				escapeHTML(stringOrEmpty(raw))))
		}
		body.WriteString(`</ul>`)
	}
	if rules := arrayOrEmpty(guidance["loopRules"]); len(rules) > 0 {
		body.WriteString(`<h3>loopRules</h3><ul class="findings">`)
		for _, raw := range rules {
			body.WriteString(fmt.Sprintf(`
		<li class="finding"><div class="finding-body"><div class="finding-message">%s</div></div></li>`,
				escapeHTML(stringOrEmpty(raw))))
		}
		body.WriteString(`</ul>`)
	}
	return `
<section class="panel" aria-labelledby="guidance-heading">
	<h2 id="guidance-heading">Guidance</h2>
	` + body.String() + `
</section>`
}

func renderEvidenceSourcesPanel(bundle map[string]any) string {
	sources := arrayOrEmpty(bundle["sources"])
	if len(sources) == 0 {
		return `
<section class="panel" aria-labelledby="sources-heading">
	<h2 id="sources-heading">Sources</h2>
	<p class="empty">No sources recorded.</p>
</section>`
	}
	var rows strings.Builder
	for _, raw := range sources {
		source := asMap(raw)
		file := defaultString(source["file"], "")
		rows.WriteString(fmt.Sprintf(`
		<tr data-source-kind="%s">
			<td><code>%s</code></td>
			<td><a href="%s"><code>%s</code></a></td>
		</tr>`,
			escapeHTML(defaultString(source["kind"], "")),
			escapeHTML(defaultString(source["kind"], "n/a")),
			escapeHTML(file), escapeHTML(file),
		))
	}
	return `
<section class="panel" aria-labelledby="sources-heading">
	<h2 id="sources-heading">Sources</h2>
	<table class="data-table">
		<thead><tr><th>kind</th><th>file</th></tr></thead>
		<tbody>` + rows.String() + `
		</tbody>
	</table>
</section>`
}

func renderEvidenceFooter(bundle map[string]any) string {
	return fmt.Sprintf(`
<footer class="footer">
	<p>Generated from <code>evidence-bundle.json</code> (schemaVersion <code>%s</code>).
	Do not hand-edit this file — rerun <code>cautilus evidence render-html</code> to refresh.</p>
</footer>`, escapeHTML(defaultString(bundle["schemaVersion"], "n/a")))
}

func evidenceSeverityColor(severity string) string {
	switch strings.ToLower(severity) {
	case "high", "critical", "blocker":
		return "blocker"
	case "medium":
		return "concern"
	case "low":
		return "pass"
	}
	return "unknown"
}

func evidenceSignalsAggregateStatus(signals []any) string {
	if len(signals) == 0 {
		return "n/a"
	}
	worst := "pass"
	for _, raw := range signals {
		switch evidenceSeverityColor(stringOrEmpty(asMap(raw)["severity"])) {
		case "blocker":
			return "blocker"
		case "concern":
			worst = "concern"
		}
	}
	return worst
}

func evidenceSourcesAggregateStatus(bundle map[string]any) string {
	if len(arrayOrEmpty(bundle["sources"])) == 0 {
		return "n/a"
	}
	return "unknown"
}

// --- shared helper ---

func writeRenderedHTML(defaultTarget string, outputPath *string, rendered string) (string, error) {
	target := defaultTarget
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
