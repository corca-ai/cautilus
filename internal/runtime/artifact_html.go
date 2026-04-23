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
		{Anchor: "signal-map-heading", Label: "Signal Map", Status: verdict},
		{Anchor: "buckets-heading", Label: "Scenario Outcomes", Status: compareBucketsAggregateStatus(packet)},
		{Anchor: "deltas-heading", Label: "Deltas", Status: compareDeltasAggregateStatus(packet)},
		{Anchor: "reasons-heading", Label: "Threshold Reasons", Status: compareReasonsAggregateStatus(packet)},
		{Anchor: "artifacts-heading", Label: "Artifact Paths", Status: compareArtifactPathsAggregateStatus(packet)},
	}))
	builder.WriteString(renderCompareSignalMapPanel(packet))
	builder.WriteString(renderCompareBucketsPanel(packet))
	builder.WriteString(renderCompareDeltasPanel(packet))
	builder.WriteString(renderCompareReasonsPanel(packet))
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
		<span class="chip neutral">regressed: %d</span>
		<span class="chip neutral">noisy: %d</span>
		<span class="chip neutral">improved: %d</span>
		<span class="banner-meta">generatedAt %s</span>
	</div>
</header>`,
		color,
		color,
		escapeHTML(selfDogfoodStatusLabel(verdict)),
		len(arrayOrEmpty(packet["regressed"])),
		len(arrayOrEmpty(packet["noisy"])),
		len(arrayOrEmpty(packet["improved"])),
		escapeHTML(defaultString(packet["generatedAt"], "n/a")),
	)
}

func renderCompareSignalMapPanel(packet map[string]any) string {
	dominantLayer := compareSignalDominantLayer(packet)
	reasons := arrayOrEmpty(packet["reasons"])
	return fmt.Sprintf(`
<section class="panel" aria-labelledby="signal-map-heading">
	<h2 id="signal-map-heading">Signal Map</h2>
	<p class="panel-lead" data-field="summary">%s</p>
	<div class="chip-row">
		<span class="chip" style="background:%s">decision: %s</span>
		<span class="chip neutral">regressed: %d</span>
		<span class="chip neutral">noisy: %d</span>
		<span class="chip neutral">improved: %d</span>
		<span class="chip neutral">deltas: %d</span>
		<span class="chip neutral">reasons: %d</span>
		<span class="chip neutral">artifact paths: %d</span>
	</div>
	<dl class="meta-grid">
		<dt>dominant layer</dt>
		<dd>%s</dd>
		<dt>reading order</dt>
		<dd>scenario outcomes -> deltas -> threshold reasons -> artifact paths</dd>
	</dl>
</section>`,
		escapeHTML(defaultString(packet["summary"], "n/a")),
		selfDogfoodStatusColor(dominantLayer),
		escapeHTML(selfDogfoodStatusLabel(dominantLayer)),
		len(arrayOrEmpty(packet["regressed"])),
		len(arrayOrEmpty(packet["noisy"])),
		len(arrayOrEmpty(packet["improved"])),
		len(arrayOrEmpty(packet["deltas"])),
		len(reasons),
		len(arrayOrEmpty(packet["artifactPaths"])),
		escapeHTML(compareSignalDominantLayerLabel(packet)),
	)
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

func renderCompareReasonsPanel(packet map[string]any) string {
	reasons := arrayOrEmpty(packet["reasons"])
	if len(reasons) == 0 {
		return `
<section class="panel" aria-labelledby="reasons-heading">
	<h2 id="reasons-heading">Threshold Reasons</h2>
	<p class="empty">No threshold reasons recorded.</p>
</section>`
	}
	var items strings.Builder
	items.WriteString(`<ul class="findings">`)
	for idx, raw := range reasons {
		items.WriteString(fmt.Sprintf(`
		<li class="finding" data-reason-index="%d">
			<span class="chip neutral">reason %d</span>
			<div class="finding-body"><div class="finding-message">%s</div></div>
		</li>`,
			idx+1,
			idx+1,
			escapeHTML(stringOrEmpty(raw)),
		))
	}
	items.WriteString(`
	</ul>`)
	return `
<section class="panel" aria-labelledby="reasons-heading">
	<h2 id="reasons-heading">Threshold Reasons</h2>
	` + items.String() + `
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

func compareReasonsAggregateStatus(packet map[string]any) string {
	if len(arrayOrEmpty(packet["reasons"])) == 0 {
		return "n/a"
	}
	return compareSignalDominantLayer(packet)
}

func compareSignalDominantLayer(packet map[string]any) string {
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

func compareSignalDominantLayerLabel(packet map[string]any) string {
	switch compareSignalDominantLayer(packet) {
	case "blocker":
		return "regressed signal is currently carrying the decision"
	case "concern":
		return "noisy signal is currently limiting confidence"
	case "pass":
		return "improved signal is currently carrying the decision"
	default:
		return "no dominant signal layer recorded"
	}
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
		{Anchor: "selection-heading", Label: "Selection Signals", Status: proposalsAttentionAggregateStatus(attentionProposals)},
		{Anchor: "attention-heading", Label: "Attention", Status: proposalsAggregateStatus(attentionProposals)},
		{Anchor: "proposals-heading", Label: "Proposals", Status: proposalsAggregateStatus(proposals)},
	}))
	builder.WriteString(renderProposalsContextPanel(packet))
	builder.WriteString(renderProposalsSelectionPanel(packet, attentionProposals))
	builder.WriteString(renderProposalsPanel("attention-heading", "Attention View", attentionProposals, attentionView))
	builder.WriteString(renderProposalsPanel("proposals-heading", "Full Ranked Proposals", proposals, attentionView))
	builder.WriteString(renderProposalsFooter(packet))
	builder.WriteString("\n</main>\n</body>\n</html>\n")
	return rewriteSelfDogfoodLinks(builder.String())
}

func RenderScenarioConversationReviewHTML(packet map[string]any) string {
	var builder strings.Builder
	threads := arrayOrEmpty(packet["threads"])
	attentionView := asMap(packet["attentionView"])
	attentionThreads := selectScenarioConversationAttentionSet(threads, stringSliceOrEmptyRuntime(attentionView["threadKeys"]))
	title := fmt.Sprintf("Cautilus Scenario Conversation Review — %d", len(threads))
	builder.WriteString("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n")
	builder.WriteString("<meta name=\"generator\" content=\"cautilus scenario render-conversation-review-html\">\n")
	builder.WriteString("<title>" + escapeHTML(title) + "</title>\n<style>" + selfDogfoodHTMLStyles + "</style>\n</head>\n<body>\n<main>\n")
	builder.WriteString(renderScenarioConversationHeader(packet, threads, attentionThreads))
	builder.WriteString(renderSelfDogfoodPageTOC([]tocNavEntry{
		{Anchor: "context-heading", Label: "Context", Status: "unknown"},
		{Anchor: "selection-heading", Label: "Selection Signals", Status: scenarioConversationThreadsAggregateStatus(attentionThreads)},
		{Anchor: "attention-heading", Label: "Attention", Status: scenarioConversationThreadsAggregateStatus(attentionThreads)},
		{Anchor: "threads-heading", Label: "Threads", Status: scenarioConversationThreadsAggregateStatus(threads)},
	}))
	builder.WriteString(renderScenarioConversationContextPanel(packet))
	builder.WriteString(renderScenarioConversationSelectionPanel(packet, attentionThreads))
	builder.WriteString(renderScenarioConversationThreadsPanel("attention-heading", "Attention Threads", attentionThreads, attentionView))
	builder.WriteString(renderScenarioConversationThreadsPanel("threads-heading", "All Threads", threads, attentionView))
	builder.WriteString(renderScenarioConversationFooter(packet))
	builder.WriteString("\n</main>\n</body>\n</html>\n")
	return rewriteSelfDogfoodLinks(builder.String())
}

func RenderScenarioConversationReviewHTMLFromFile(inputPath string) (string, error) {
	packet, err := readJSONFile(inputPath)
	if err != nil {
		return "", fmt.Errorf("failed to read scenario conversation review from %s: %w", inputPath, err)
	}
	if packet["schemaVersion"] != contracts.ScenarioConversationReviewSchema {
		return "", fmt.Errorf("%s must use schemaVersion %s", inputPath, contracts.ScenarioConversationReviewSchema)
	}
	return RenderScenarioConversationReviewHTML(packet), nil
}

func WriteScenarioConversationReviewHTMLFromFile(inputPath string, outputPath *string) (string, error) {
	rendered, err := RenderScenarioConversationReviewHTMLFromFile(inputPath)
	if err != nil {
		return "", err
	}
	return writeRenderedHTML(defaultReportHTMLOutputPath(inputPath), outputPath, rendered)
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

func renderProposalsSelectionPanel(packet map[string]any, attentionProposals []any) string {
	attentionView := asMap(packet["attentionView"])
	return fmt.Sprintf(`
<section class="panel" aria-labelledby="selection-heading">
	<h2 id="selection-heading">Selection Signals</h2>
	<p class="panel-lead">%s</p>
	<div class="chip-row">
		<span class="chip neutral">selected: %s</span>
		<span class="chip neutral">matched rules: %s</span>
		<span class="chip neutral">fallback: %s</span>
		<span class="chip neutral">truncated: %s</span>
	</div>
	<dl class="meta-grid">
		<dt>reading order</dt>
		<dd>attention view -> full ranked proposals</dd>
		<dt>attention count</dt>
		<dd>%d</dd>
	</dl>
</section>`,
		escapeHTML(proposalsDecisionPressure(packet, attentionProposals)),
		escapeHTML(defaultString(attentionView["selectedCount"], "0")),
		escapeHTML(defaultString(attentionView["matchedRuleCount"], "0")),
		escapeHTML(defaultString(attentionView["fallbackUsed"], "false")),
		escapeHTML(defaultString(attentionView["truncated"], "false")),
		len(attentionProposals),
	)
}

func renderProposalsPanel(headingID string, title string, proposals []any, attentionView map[string]any) string {
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
		reasonCodes := proposalReasonCodes(proposal, attentionView)
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
		%s
		<p class="variant-summary">%s</p>
	</article>`,
			escapeHTML(defaultString(proposal["proposalKey"], "")),
			escapeHTML(defaultString(proposal["title"], "n/a")),
			escapeHTML(defaultString(proposal["proposalKey"], "n/a")),
			escapeHTML(defaultString(proposal["action"], "n/a")),
			escapeHTML(defaultString(proposal["family"], "n/a")),
			len(evidence),
			renderReasonCodeChips(reasonCodes),
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

func proposalsAttentionAggregateStatus(proposals []any) string {
	if len(proposals) == 0 {
		return "n/a"
	}
	return "concern"
}

func renderScenarioConversationHeader(packet map[string]any, threads []any, attentionThreads []any) string {
	color := selfDogfoodStatusColor(scenarioConversationThreadsAggregateStatus(threads))
	return fmt.Sprintf(`
<header class="banner" style="border-left:8px solid %s">
	<div class="banner-title">Cautilus Scenario Conversation Review</div>
	<div class="banner-status">
		<span class="chip" style="background:%s">threads: %d</span>
		<span class="chip neutral">attention: %d</span>
		<span class="banner-meta">windowDays %s</span>
		<span class="banner-meta">generatedAt %s</span>
	</div>
</header>`,
		color,
		color,
		len(threads),
		len(attentionThreads),
		escapeHTML(defaultString(packet["windowDays"], "n/a")),
		escapeHTML(defaultString(packet["generatedAt"], "n/a")),
	)
}

func renderScenarioConversationContextPanel(packet map[string]any) string {
	summary := asMap(packet["summary"])
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
		<dt>threadCount</dt>
		<dd>%s</dd>
		<dt>linkedProposalCount</dt>
		<dd>%s</dd>
		<dt>unlinkedThreadCount</dt>
		<dd>%s</dd>
		%s
	</dl>
</section>`,
		escapeHTML(defaultString(packet["windowDays"], "n/a")),
		escapeHTML(defaultString(summary["threadCount"], "0")),
		escapeHTML(defaultString(summary["linkedProposalCount"], "0")),
		escapeHTML(defaultString(summary["unlinkedThreadCount"], "0")),
		familyLine,
	)
}

func renderScenarioConversationSelectionPanel(packet map[string]any, attentionThreads []any) string {
	attentionView := asMap(packet["attentionView"])
	return fmt.Sprintf(`
<section class="panel" aria-labelledby="selection-heading">
	<h2 id="selection-heading">Selection Signals</h2>
	<p class="panel-lead">%s</p>
	<div class="chip-row">
		<span class="chip neutral">selected: %s</span>
		<span class="chip neutral">matched rules: %s</span>
		<span class="chip neutral">fallback: %s</span>
		<span class="chip neutral">truncated: %s</span>
	</div>
	<dl class="meta-grid">
		<dt>reading order</dt>
		<dd>attention threads -> all threads</dd>
		<dt>attention count</dt>
		<dd>%d</dd>
	</dl>
</section>`,
		escapeHTML(scenarioConversationDecisionPressure(attentionThreads)),
		escapeHTML(defaultString(attentionView["selectedCount"], "0")),
		escapeHTML(defaultString(attentionView["matchedRuleCount"], "0")),
		escapeHTML(defaultString(attentionView["fallbackUsed"], "false")),
		escapeHTML(defaultString(attentionView["truncated"], "false")),
		len(attentionThreads),
	)
}

func renderScenarioConversationThreadsPanel(headingID string, title string, threads []any, attentionView map[string]any) string {
	if len(threads) == 0 {
		return fmt.Sprintf(`
<section class="panel" aria-labelledby="%s">
	<h2 id="%s">%s</h2>
	<p class="empty">No conversation threads recorded.</p>
</section>`, escapeHTML(headingID), escapeHTML(headingID), escapeHTML(title))
	}
	reasonCodesByThreadKey := asMap(attentionView["reasonCodesByThreadKey"])
	var blocks strings.Builder
	for _, rawThread := range threads {
		thread := asMap(rawThread)
		threadKey := stringOrEmpty(thread["threadKey"])
		reasonCodes := stringSliceOrEmptyRuntime(reasonCodesByThreadKey[threadKey])
		blocks.WriteString(fmt.Sprintf(`
	<article class="variant" data-thread-key="%s">
		<header class="variant-header">
			<h3>%s <small>(%s)</small></h3>
			<div class="variant-chips">
				<span class="chip neutral">recommendation: %s</span>
				<span class="chip neutral">linked proposals: %d</span>
				<span class="chip neutral">records: %d</span>
			</div>
		</header>
		<p class="variant-summary">%s</p>
		%s
		%s
	</article>`,
			escapeHTML(threadKey),
			escapeHTML(defaultString(thread["title"], "n/a")),
			escapeHTML(threadKey),
			escapeHTML(defaultString(thread["recommendation"], "n/a")),
			len(arrayOrEmpty(thread["linkedProposals"])),
			len(arrayOrEmpty(thread["records"])),
			escapeHTML(defaultString(thread["rationale"], "")),
			renderScenarioConversationReasonChips(reasonCodes),
			renderScenarioConversationThreadBody(thread),
		))
	}
	return fmt.Sprintf(`
<section class="panel" aria-labelledby="%s">
	<h2 id="%s">%s</h2>
	%s
</section>`, escapeHTML(headingID), escapeHTML(headingID), escapeHTML(title), blocks.String())
}

func renderScenarioConversationReasonChips(reasonCodes []string) string {
	if len(reasonCodes) == 0 {
		return ""
	}
	return `<p class="chip-row">` + renderReasonCodeChips(reasonCodes) + `</p>`
}

func renderScenarioConversationThreadBody(thread map[string]any) string {
	var sections strings.Builder
	linkedProposals := arrayOrEmpty(thread["linkedProposals"])
	if len(linkedProposals) > 0 {
		sections.WriteString(`<h4>Linked Proposals</h4>`)
		sections.WriteString(`<ul class="findings">`)
		for _, rawProposal := range linkedProposals {
			proposal := asMap(rawProposal)
			coverage := asMap(proposal["existingCoverage"])
			sections.WriteString(fmt.Sprintf(`
			<li class="finding" data-proposal-key="%s">
				<span class="chip neutral">%s</span>
				<div class="finding-body">
					<div class="finding-message">%s</div>
					<div class="finding-path">family=%s, recentResultCount=%s</div>
				</div>
			</li>`,
				escapeHTML(defaultString(proposal["proposalKey"], "")),
				escapeHTML(defaultString(proposal["action"], "n/a")),
				escapeHTML(defaultString(proposal["title"], "n/a")),
				escapeHTML(defaultString(proposal["family"], "n/a")),
				escapeHTML(defaultString(coverage["recentResultCount"], "0")),
			))
		}
		sections.WriteString(`</ul>`)
	}
	records := arrayOrEmpty(thread["records"])
	if len(records) == 0 {
		return sections.String()
	}
	sections.WriteString(`<h4>Transcript</h4>`)
	sections.WriteString(`<ul class="findings">`)
	for _, rawRecord := range records {
		record := asMap(rawRecord)
		actorKind := defaultString(record["actorKind"], "unknown")
		text := defaultString(record["text"], "")
		sections.WriteString(fmt.Sprintf(`
		<li class="finding" data-actor-kind="%s">
			<span class="chip neutral">%s</span>
			<div class="finding-body"><div class="finding-message">%s</div></div>
		</li>`,
			escapeHTML(actorKind),
			escapeHTML(actorKind),
			escapeHTML(text),
		))
	}
	sections.WriteString(`</ul>`)
	return sections.String()
}

func renderScenarioConversationFooter(packet map[string]any) string {
	return fmt.Sprintf(`
<footer class="footer">
	<p>Generated from <code>conversation-review.json</code> (schemaVersion <code>%s</code>).
	Do not hand-edit this file — rerun <code>cautilus scenario render-conversation-review-html</code> to refresh.</p>
</footer>`, escapeHTML(defaultString(packet["schemaVersion"], "n/a")))
}

func selectScenarioConversationAttentionSet(threads []any, keys []string) []any {
	if len(keys) == 0 {
		return []any{}
	}
	keySet := map[string]struct{}{}
	for _, key := range keys {
		keySet[key] = struct{}{}
	}
	selected := make([]any, 0, len(keys))
	for _, rawThread := range threads {
		threadKey := stringOrEmpty(asMap(rawThread)["threadKey"])
		if _, ok := keySet[threadKey]; !ok {
			continue
		}
		selected = append(selected, rawThread)
	}
	return selected
}

func scenarioConversationThreadsAggregateStatus(threads []any) string {
	if len(threads) == 0 {
		return "n/a"
	}
	for _, rawThread := range threads {
		switch stringOrEmpty(asMap(rawThread)["recommendation"]) {
		case "review_new_scenario":
			return "concern"
		case "review_existing_scenario_refresh":
			return "unknown"
		}
	}
	return "unknown"
}

func proposalsDecisionPressure(packet map[string]any, attentionProposals []any) string {
	if len(attentionProposals) > 0 {
		return "attention-selected proposals are currently the highest-signal scenario candidates"
	}
	if len(arrayOrEmpty(packet["proposals"])) > 0 {
		return "full ranked proposals are currently the only available scenario signal"
	}
	return "no scenario proposal signal recorded"
}

func scenarioConversationDecisionPressure(attentionThreads []any) string {
	if len(attentionThreads) > 0 {
		return "attention-selected threads currently carry the strongest scenario-refresh signal"
	}
	return "all recorded threads currently have equal review priority"
}

func proposalReasonCodes(proposal map[string]any, attentionView map[string]any) []string {
	proposalKey := defaultString(proposal["proposalKey"], "")
	if proposalKey == "" {
		return nil
	}
	return stringSliceOrEmptyRuntime(asMap(attentionView["reasonCodesByProposalKey"])[proposalKey])
}

func renderReasonCodeChips(reasonCodes []string) string {
	if len(reasonCodes) == 0 {
		return ""
	}
	chips := make([]string, 0, len(reasonCodes))
	for _, reason := range reasonCodes {
		chips = append(chips, fmt.Sprintf(`<span class="chip neutral">%s</span>`, escapeHTML(reason)))
	}
	return strings.Join(chips, " ")
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
		{Anchor: "signals-heading", Label: "Signals By Source", Status: evidenceSignalsAggregateStatus(signals)},
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
	for _, key := range []string{"signalCount", "highSignalCount", "mediumSignalCount", "lowSignalCount", "totalCount", "highSeverityCount", "mediumSeverityCount", "lowSeverityCount"} {
		if value, ok := summary[key]; ok {
			rows.WriteString(fmt.Sprintf(`<dt>%s</dt><dd>%s</dd>`, escapeHTML(key), escapeHTML(defaultString(value, "0"))))
		}
	}
	if sourceKinds := arrayOrEmpty(summary["sourceKinds"]); len(sourceKinds) > 0 {
		chips := make([]string, 0, len(sourceKinds))
		for _, raw := range sourceKinds {
			chips = append(chips, fmt.Sprintf(`<span class="chip neutral">%s</span>`, escapeHTML(stringOrEmpty(raw))))
		}
		rows.WriteString(fmt.Sprintf(`<dt>sourceKinds</dt><dd>%s</dd>`, strings.Join(chips, " ")))
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
	groupOrder, grouped := groupEvidenceSignalsBySourceKind(signals)
	var items strings.Builder
	for _, sourceKind := range groupOrder {
		groupSignals := grouped[sourceKind]
		items.WriteString(fmt.Sprintf(`
	<article class="variant" data-source-kind-group="%s">
		<header class="variant-header">
			<h3>%s</h3>
			<div class="variant-chips">
				<span class="chip" style="background:%s">%s</span>
				<span class="chip neutral">signals: %d</span>
			</div>
		</header>
		<ul class="findings">`,
			escapeHTML(sourceKind),
			escapeHTML(sourceKind),
			selfDogfoodStatusColor(evidenceSourceKindAggregateStatus(groupSignals)),
			escapeHTML(selfDogfoodStatusLabel(evidenceSourceKindAggregateStatus(groupSignals))),
			len(groupSignals),
		))
		for _, raw := range groupSignals {
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
		</ul>
	</article>`)
	}
	return `
<section class="panel" aria-labelledby="signals-heading">
	<h2 id="signals-heading">Signals By Source</h2>
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

func evidenceSourceKindAggregateStatus(signals []any) string {
	return evidenceSignalsAggregateStatus(signals)
}

func groupEvidenceSignalsBySourceKind(signals []any) ([]string, map[string][]any) {
	order := make([]string, 0)
	grouped := map[string][]any{}
	for _, raw := range signals {
		sourceKind := defaultString(asMap(raw)["sourceKind"], "unknown")
		if _, ok := grouped[sourceKind]; !ok {
			order = append(order, sourceKind)
		}
		grouped[sourceKind] = append(grouped[sourceKind], raw)
	}
	return order, grouped
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
