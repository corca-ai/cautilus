package runtime

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestDiscoverRunIndexEntriesFindsKnownArtifacts(t *testing.T) {
	runDir := t.TempDir()
	if err := writeReportHTMLPacketFromJSON(filepath.Join(runDir, "proposals.json"), sampleScenarioProposals()); err != nil {
		t.Fatal(err)
	}
	if err := writeReportHTMLPacketFromJSON(filepath.Join(runDir, "conversation-review.json"), sampleScenarioConversationReview()); err != nil {
		t.Fatal(err)
	}
	if err := writeReportHTMLPacketFromJSON(filepath.Join(runDir, "report.json"), sampleReportPacket()); err != nil {
		t.Fatal(err)
	}
	if err := writeReportHTMLPacketFromJSON(filepath.Join(runDir, "review.json"), sampleReviewPacket()); err != nil {
		t.Fatal(err)
	}
	if err := writeReportHTMLPacketFromJSON(filepath.Join(runDir, "review-summary.json"), sampleReviewSummary()); err != nil {
		t.Fatal(err)
	}
	if err := writeReportHTMLPacketFromJSON(filepath.Join(runDir, "compare-artifact.json"), sampleCompareArtifact()); err != nil {
		t.Fatal(err)
	}
	// Nested self-dogfood bundle one level deep.
	nested := filepath.Join(runDir, "self-dogfood")
	if err := os.MkdirAll(nested, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := writeReportHTMLPacketFromJSON(filepath.Join(nested, "summary.json"), map[string]any{"overallStatus": "concern"}); err != nil {
		t.Fatal(err)
	}
	// Seed a report.html next to report.json so the rendered flag flips on.
	if err := os.WriteFile(filepath.Join(runDir, "report.html"), []byte("<html></html>"), 0o644); err != nil {
		t.Fatal(err)
	}

	entries, err := DiscoverRunIndexEntries(runDir)
	if err != nil {
		t.Fatalf("DiscoverRunIndexEntries returned error: %v", err)
	}
	labels := make([]string, 0, len(entries))
	for _, entry := range entries {
		labels = append(labels, entry.Label)
	}
	wantLabels := []string{"proposals", "conversation-review", "compare", "report", "review", "review-summary", "self-dogfood · self-dogfood"}
	for _, want := range wantLabels {
		found := false
		for _, got := range labels {
			if got == want {
				found = true
				break
			}
		}
		if !found {
			t.Fatalf("expected label %q in %v", want, labels)
		}
	}
	if len(entries) < 4 || entries[0].Label != "proposals" || entries[1].Label != "conversation-review" || entries[2].Label != "report" || entries[3].Label != "compare" {
		t.Fatalf("expected review-flow ordering, got %#v", entries)
	}
	// report should be flagged as rendered; others pending.
	for _, entry := range entries {
		if entry.Label == "report" && !entry.HTMLRendered {
			t.Fatalf("expected report entry to be flagged HTMLRendered")
		}
		if entry.Label == "review" && entry.HTMLRendered {
			t.Fatalf("expected review entry to be pending-html")
		}
	}
}

func TestDiscoverRunIndexEntriesSkipsMismatchedSchema(t *testing.T) {
	runDir := t.TempDir()
	if err := writeReportHTMLPacketFromJSON(filepath.Join(runDir, "report.json"), map[string]any{"schemaVersion": "not.report"}); err != nil {
		t.Fatal(err)
	}
	entries, err := DiscoverRunIndexEntries(runDir)
	if err != nil {
		t.Fatalf("DiscoverRunIndexEntries error: %v", err)
	}
	if len(entries) != 0 {
		t.Fatalf("expected mismatched schema to be skipped, got %d entries", len(entries))
	}
}

func TestRenderRunIndexHTMLIncludesSidebarEntriesAndStatus(t *testing.T) {
	entries := []RunIndexEntry{
		{Label: "report", Href: "report.html", Status: "defer", SchemaLabel: "cautilus.report_packet.v2", SourceFile: "report.json", HTMLRendered: true},
		{Label: "review-summary", Href: "review-summary.html", Status: "concern", SchemaLabel: "cautilus.review_summary.v1", SourceFile: "review-summary.json", HTMLRendered: false},
	}
	rendered := RenderRunIndexHTML("2026-04-16-run", entries)
	for _, pattern := range []string{
		`data-status="runStatus"`,
		`data-artifact="report"`,
		`data-artifact="review-summary"`,
		`href="report.html"`,
		`href="review-summary.html"`,
		`pending-html`,
	} {
		if !strings.Contains(rendered, pattern) {
			t.Fatalf("expected %q in run index html", pattern)
		}
	}
	if strings.Count(rendered, "pending-html") != 1 {
		t.Fatalf("expected exactly one pending-html chip; rendered contents:\n%s", rendered)
	}
}

func TestWriteRunIndexHTMLForDirWritesIndexHTML(t *testing.T) {
	runDir := t.TempDir()
	if err := writeReportHTMLPacketFromJSON(filepath.Join(runDir, "report.json"), sampleReportPacket()); err != nil {
		t.Fatal(err)
	}
	target, err := WriteRunIndexHTMLForDir(runDir, nil)
	if err != nil {
		t.Fatalf("WriteRunIndexHTMLForDir error: %v", err)
	}
	if target != filepath.Join(runDir, "index.html") {
		t.Fatalf("unexpected output path: %s", target)
	}
	payload, err := os.ReadFile(target)
	if err != nil {
		t.Fatalf("ReadFile error: %v", err)
	}
	if !strings.Contains(string(payload), "Cautilus Run Index") {
		t.Fatalf("expected run index title in output html")
	}
}

func TestRunIndexAggregateStatus(t *testing.T) {
	entries := []RunIndexEntry{{Status: "pass"}, {Status: "concern"}}
	if got := runIndexAggregateStatus(entries); got != "concern" {
		t.Fatalf("expected concern, got %s", got)
	}
	entries = append(entries, RunIndexEntry{Status: "blocker"})
	if got := runIndexAggregateStatus(entries); got != "blocker" {
		t.Fatalf("expected blocker, got %s", got)
	}
	if got := runIndexAggregateStatus(nil); got != "n/a" {
		t.Fatalf("expected n/a for empty, got %s", got)
	}
}
