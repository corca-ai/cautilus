package runtime

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/corca-ai/cautilus/internal/contracts"
)

// RunIndexEntry captures one artifact the reviewer can jump to from the run
// index. The href is stored relative to the index file so the sidebar keeps
// working when the run directory is copied or moved.
type RunIndexEntry struct {
	Label        string
	Href         string
	Status       string
	StatusLabel  string
	SchemaLabel  string
	SourceFile   string
	HTMLRendered bool
}

// RenderRunIndexHTML renders a sidebar aggregating known first-class artifacts
// discovered in a run directory. Each sidebar entry links to the artifact's
// existing .html sibling; entries whose .html has not been rendered yet still
// appear but with a "pending" chip so a reviewer can tell at a glance what
// is missing.
func RenderRunIndexHTML(runLabel string, entries []RunIndexEntry) string {
	var builder strings.Builder
	title := fmt.Sprintf("Cautilus Run Index — %s", runLabel)
	aggregate := runIndexAggregateStatus(entries)
	builder.WriteString("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n")
	builder.WriteString("<meta name=\"generator\" content=\"cautilus artifacts render-index-html\">\n")
	builder.WriteString("<title>" + escapeHTML(title) + "</title>\n<style>" + selfDogfoodHTMLStyles + "</style>\n</head>\n<body>\n<main>\n")
	builder.WriteString(fmt.Sprintf(`
<header class="banner" style="border-left:8px solid %s">
	<div class="banner-title">Cautilus Run Index</div>
	<div class="banner-status">
		<span class="chip" data-status="runStatus" style="background:%s">%s</span>
		<span class="banner-meta">run %s</span>
		<span class="banner-meta">artifacts %d</span>
	</div>
</header>`,
		selfDogfoodStatusColor(aggregate),
		selfDogfoodStatusColor(aggregate),
		escapeHTML(selfDogfoodStatusLabel(aggregate)),
		escapeHTML(runLabel),
		len(entries),
	))
	builder.WriteString(renderRunIndexSidebar(entries))
	builder.WriteString(`
<footer class="footer">
	<p>Generated from discovered artifacts. Rerun <code>cautilus artifacts render-index-html --run-dir &lt;path&gt;</code> after any artifact changes.</p>
</footer>
</main>
</body>
</html>
`)
	return rewriteSelfDogfoodLinks(builder.String())
}

func renderRunIndexSidebar(entries []RunIndexEntry) string {
	if len(entries) == 0 {
		return `
<section class="panel" aria-labelledby="artifacts-heading">
	<h2 id="artifacts-heading">Artifacts</h2>
	<p class="empty">No known artifacts discovered in this run directory.</p>
</section>`
	}
	var items strings.Builder
	items.WriteString(`<ul class="findings">`)
	for _, entry := range entries {
		pendingChip := ""
		if !entry.HTMLRendered {
			pendingChip = `<span class="chip neutral">pending-html</span>`
		}
		href := entry.Href
		if href == "" {
			href = entry.SourceFile
		}
		items.WriteString(fmt.Sprintf(`
		<li class="finding" data-artifact="%s">
			<span class="chip" style="background:%s">%s</span>
			%s
			<div class="finding-body">
				<div class="finding-message"><a href="%s"><code>%s</code></a></div>
				<div class="finding-path"><code>%s</code></div>
			</div>
		</li>`,
			escapeHTML(entry.Label),
			selfDogfoodStatusColor(entry.Status),
			escapeHTML(selfDogfoodStatusLabel(entry.Status)),
			pendingChip,
			escapeHTML(href),
			escapeHTML(entry.Label),
			escapeHTML(entry.SchemaLabel),
		))
	}
	items.WriteString(`
	</ul>`)
	return `
<section class="panel" aria-labelledby="artifacts-heading">
	<h2 id="artifacts-heading">Artifacts</h2>
	` + items.String() + `
</section>`
}

func runIndexAggregateStatus(entries []RunIndexEntry) string {
	if len(entries) == 0 {
		return "n/a"
	}
	worst := "pass"
	for _, entry := range entries {
		switch entry.Status {
		case "blocker", "failed", "reject":
			return "blocker"
		case "concern", "defer":
			worst = "concern"
		}
	}
	return worst
}

// WriteRunIndexHTMLForDir discovers known first-class artifacts in runDir,
// derives a status chip for each, and writes an index.html alongside them.
// The discovery is non-recursive for the top level but descends one level to
// pick up nested bundles (e.g. artifacts/self-dogfood/experiments/<name>).
func WriteRunIndexHTMLForDir(runDir string, outputPath *string) (string, error) {
	if err := mustDir(runDir, "runDir"); err != nil {
		return "", err
	}
	entries, err := DiscoverRunIndexEntries(runDir)
	if err != nil {
		return "", err
	}
	label := filepath.Base(runDir)
	rendered := RenderRunIndexHTML(label, entries)
	target := filepath.Join(runDir, "index.html")
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

// DiscoverRunIndexEntries walks runDir (one level deep) and returns index
// entries for any file whose name matches a known first-class artifact.
// The returned slice is sorted by Label so the sidebar is stable.
func DiscoverRunIndexEntries(runDir string) ([]RunIndexEntry, error) {
	entries := append([]RunIndexEntry{}, collectRunIndexEntriesInDir(runDir, runDir)...)
	subdirs, err := os.ReadDir(runDir)
	if err != nil {
		return nil, err
	}
	for _, child := range subdirs {
		if !child.IsDir() {
			continue
		}
		nested := filepath.Join(runDir, child.Name())
		entries = append(entries, collectRunIndexEntriesInDir(runDir, nested)...)
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Label < entries[j].Label })
	return entries, nil
}

type runIndexArtifactDescriptor struct {
	filename    string
	labelPrefix string
	schema      string
	labelStatus func(packet map[string]any) string
	schemaLabel string
}

var runIndexArtifactDescriptors = []runIndexArtifactDescriptor{
	{
		filename: "report.json", labelPrefix: "report", schema: contracts.ReportPacketSchema, schemaLabel: contracts.ReportPacketSchema,
		labelStatus: func(packet map[string]any) string { return stringOrEmpty(packet["recommendation"]) },
	},
	{
		filename: "review.json", labelPrefix: "review", schema: contracts.ReviewPacketSchema, schemaLabel: contracts.ReviewPacketSchema,
		labelStatus: func(packet map[string]any) string {
			return stringOrEmpty(asMap(packet["report"])["recommendation"])
		},
	},
	{
		filename: "review-summary.json", labelPrefix: "review-summary", schema: contracts.ReviewSummarySchema, schemaLabel: contracts.ReviewSummarySchema,
		labelStatus: func(packet map[string]any) string { return stringOrEmpty(packet["reviewVerdict"]) },
	},
	{
		filename: "compare-artifact.json", labelPrefix: "compare", schema: contracts.CompareArtifactSchema, schemaLabel: contracts.CompareArtifactSchema,
		labelStatus: func(packet map[string]any) string { return stringOrEmpty(packet["verdict"]) },
	},
	{
		filename: "proposals.json", labelPrefix: "proposals", schema: contracts.ScenarioProposalsSchema, schemaLabel: contracts.ScenarioProposalsSchema,
		labelStatus: func(packet map[string]any) string {
			if len(arrayOrEmpty(packet["proposals"])) == 0 {
				return "n/a"
			}
			return "unknown"
		},
	},
	{
		filename: "evidence-bundle.json", labelPrefix: "evidence", schema: contracts.EvidenceBundleSchema, schemaLabel: contracts.EvidenceBundleSchema,
		labelStatus: func(packet map[string]any) string {
			return evidenceSignalsAggregateStatus(arrayOrEmpty(packet["signals"]))
		},
	},
	{
		filename: "summary.json", labelPrefix: "self-dogfood", schema: "", schemaLabel: "self-dogfood summary",
		labelStatus: func(packet map[string]any) string { return stringOrEmpty(packet["overallStatus"]) },
	},
}

func collectRunIndexEntriesInDir(runDir, dir string) []RunIndexEntry {
	result := []RunIndexEntry{}
	for _, descriptor := range runIndexArtifactDescriptors {
		candidate := filepath.Join(dir, descriptor.filename)
		info, err := os.Stat(candidate)
		if err != nil || info.IsDir() {
			continue
		}
		packet, readErr := readJSONFile(candidate)
		if readErr != nil {
			continue
		}
		if descriptor.schema != "" && stringOrEmpty(packet["schemaVersion"]) != descriptor.schema {
			continue
		}
		relSource, err := filepath.Rel(runDir, candidate)
		if err != nil {
			relSource = candidate
		}
		htmlName := strings.TrimSuffix(descriptor.filename, filepath.Ext(descriptor.filename)) + ".html"
		htmlCandidate := filepath.Join(dir, htmlName)
		htmlExists := false
		if info, err := os.Stat(htmlCandidate); err == nil && !info.IsDir() {
			htmlExists = true
		}
		relHref, err := filepath.Rel(runDir, htmlCandidate)
		if err != nil {
			relHref = htmlCandidate
		}
		label := descriptor.labelPrefix
		if nested, err := filepath.Rel(runDir, dir); err == nil && nested != "." {
			label = descriptor.labelPrefix + " · " + nested
		}
		status := descriptor.labelStatus(packet)
		result = append(result, RunIndexEntry{
			Label:        label,
			Href:         filepath.ToSlash(relHref),
			Status:       status,
			StatusLabel:  selfDogfoodStatusLabel(status),
			SchemaLabel:  descriptor.schemaLabel,
			SourceFile:   filepath.ToSlash(relSource),
			HTMLRendered: htmlExists,
		})
	}
	return result
}
