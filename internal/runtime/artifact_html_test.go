package runtime

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// --- compare artifact tests ---

func TestRenderCompareArtifactHTMLIncludesBucketsDeltasAndTOC(t *testing.T) {
	packet := sampleCompareArtifact()
	rendered := RenderCompareArtifactHTML(packet)
	for _, pattern := range []string{
		`data-status="verdict"`,
		`class="toc-nav"`,
		`href="#signal-map-heading"`,
		`href="#buckets-heading"`,
		`href="#deltas-heading"`,
		`href="#reasons-heading"`,
		`href="#artifacts-heading"`,
		`data-bucket="improved"`,
		`data-bucket="regressed"`,
		`data-delta-key="operator-guidance-smoke"`,
		`data-reason-index="1"`,
		`dominant layer`,
	} {
		if !strings.Contains(rendered, pattern) {
			t.Fatalf("expected %q in compare html", pattern)
		}
	}
}

func TestRenderCompareArtifactHTMLRewritesArtifactPaths(t *testing.T) {
	packet := sampleCompareArtifact()
	rendered := RenderCompareArtifactHTML(packet)
	if strings.Contains(rendered, `href="/tmp/cautilus/report.json"`) {
		t.Fatalf("expected .json path to be rewritten to .html")
	}
	if !strings.Contains(rendered, `href="/tmp/cautilus/report.html"`) {
		t.Fatalf("expected rewritten .html link for artifactPath")
	}
}

func TestRenderCompareArtifactHTMLFromFileRejectsWrongSchema(t *testing.T) {
	tempDir := t.TempDir()
	inputPath := filepath.Join(tempDir, "compare.json")
	if err := writeReportHTMLPacketFromJSON(inputPath, map[string]any{"schemaVersion": "not.compare"}); err != nil {
		t.Fatalf("setup error: %v", err)
	}
	if _, err := RenderCompareArtifactHTMLFromFile(inputPath); err == nil {
		t.Fatalf("expected wrong schemaVersion to be rejected")
	}
}

func TestWriteCompareArtifactHTMLFromFileWritesNextToInput(t *testing.T) {
	tempDir := t.TempDir()
	inputPath := filepath.Join(tempDir, "compare.json")
	if err := writeReportHTMLPacketFromJSON(inputPath, sampleCompareArtifact()); err != nil {
		t.Fatalf("setup error: %v", err)
	}
	outputPath, err := WriteCompareArtifactHTMLFromFile(inputPath, nil)
	if err != nil {
		t.Fatalf("WriteCompareArtifactHTMLFromFile returned error: %v", err)
	}
	if outputPath != filepath.Join(tempDir, "compare.html") {
		t.Fatalf("unexpected output path: %s", outputPath)
	}
	payload, err := os.ReadFile(outputPath)
	if err != nil {
		t.Fatalf("ReadFile error: %v", err)
	}
	if !strings.Contains(string(payload), "Cautilus Compare") {
		t.Fatalf("expected compare title in output html")
	}
}

// --- scenario proposals tests ---

func TestRenderScenarioProposalsHTMLRendersProposals(t *testing.T) {
	packet := sampleScenarioProposals()
	rendered := RenderScenarioProposalsHTML(packet)
	for _, pattern := range []string{
		`class="toc-nav"`,
		`href="#context-heading"`,
		`href="#attention-heading"`,
		`href="#proposals-heading"`,
		`Attention View`,
		`Full Ranked Proposals`,
		`data-proposal-key="chatbot-review-clarification"`,
		`action: add_new_scenario`,
		`family: chatbot`,
	} {
		if !strings.Contains(rendered, pattern) {
			t.Fatalf("expected %q in proposals html", pattern)
		}
	}
}

func TestRenderScenarioProposalsHTMLFromFileRejectsWrongSchema(t *testing.T) {
	tempDir := t.TempDir()
	inputPath := filepath.Join(tempDir, "proposals.json")
	if err := writeReportHTMLPacketFromJSON(inputPath, map[string]any{"schemaVersion": "not.proposals"}); err != nil {
		t.Fatalf("setup error: %v", err)
	}
	if _, err := RenderScenarioProposalsHTMLFromFile(inputPath); err == nil {
		t.Fatalf("expected wrong schemaVersion to be rejected")
	}
}

func TestWriteScenarioProposalsHTMLFromFileWritesNextToInput(t *testing.T) {
	tempDir := t.TempDir()
	inputPath := filepath.Join(tempDir, "proposals.json")
	if err := writeReportHTMLPacketFromJSON(inputPath, sampleScenarioProposals()); err != nil {
		t.Fatalf("setup error: %v", err)
	}
	outputPath, err := WriteScenarioProposalsHTMLFromFile(inputPath, nil)
	if err != nil {
		t.Fatalf("WriteScenarioProposalsHTMLFromFile error: %v", err)
	}
	if outputPath != filepath.Join(tempDir, "proposals.html") {
		t.Fatalf("unexpected output path: %s", outputPath)
	}
}

func TestRenderScenarioConversationReviewHTMLRendersThreadsAndLinkedProposals(t *testing.T) {
	packet := sampleScenarioConversationReview()
	rendered := RenderScenarioConversationReviewHTML(packet)
	for _, pattern := range []string{
		`class="toc-nav"`,
		`href="#context-heading"`,
		`href="#attention-heading"`,
		`href="#threads-heading"`,
		`Attention Threads`,
		`All Threads`,
		`data-thread-key="thread-1"`,
		`recommendation: review_existing_scenario_refresh`,
		`retro 먼저 해주세요`,
	} {
		if !strings.Contains(rendered, pattern) {
			t.Fatalf("expected %q in conversation review html", pattern)
		}
	}
}

func TestRenderScenarioConversationReviewHTMLFromFileRejectsWrongSchema(t *testing.T) {
	tempDir := t.TempDir()
	inputPath := filepath.Join(tempDir, "conversation-review.json")
	if err := writeReportHTMLPacketFromJSON(inputPath, map[string]any{"schemaVersion": "not.conversation-review"}); err != nil {
		t.Fatalf("setup error: %v", err)
	}
	if _, err := RenderScenarioConversationReviewHTMLFromFile(inputPath); err == nil {
		t.Fatalf("expected wrong schemaVersion to be rejected")
	}
}

func TestWriteScenarioConversationReviewHTMLFromFileWritesNextToInput(t *testing.T) {
	tempDir := t.TempDir()
	inputPath := filepath.Join(tempDir, "conversation-review.json")
	if err := writeReportHTMLPacketFromJSON(inputPath, sampleScenarioConversationReview()); err != nil {
		t.Fatalf("setup error: %v", err)
	}
	outputPath, err := WriteScenarioConversationReviewHTMLFromFile(inputPath, nil)
	if err != nil {
		t.Fatalf("WriteScenarioConversationReviewHTMLFromFile error: %v", err)
	}
	if outputPath != filepath.Join(tempDir, "conversation-review.html") {
		t.Fatalf("unexpected output path: %s", outputPath)
	}
}

// --- evidence bundle tests ---

func TestRenderEvidenceBundleHTMLRendersSignalsAndSources(t *testing.T) {
	bundle := sampleEvidenceBundle()
	rendered := RenderEvidenceBundleHTML(bundle)
	for _, pattern := range []string{
		`class="toc-nav"`,
		`href="#summary-heading"`,
		`href="#signals-heading"`,
		`href="#guidance-heading"`,
		`href="#sources-heading"`,
		`data-signal-id="report.regressed:1"`,
		`data-source-kind="report"`,
		`<code>report.regressed</code>`,
	} {
		if !strings.Contains(rendered, pattern) {
			t.Fatalf("expected %q in evidence html", pattern)
		}
	}
}

func TestRenderEvidenceBundleHTMLFromFileRejectsWrongSchema(t *testing.T) {
	tempDir := t.TempDir()
	inputPath := filepath.Join(tempDir, "evidence.json")
	if err := writeReportHTMLPacketFromJSON(inputPath, map[string]any{"schemaVersion": "not.evidence"}); err != nil {
		t.Fatalf("setup error: %v", err)
	}
	if _, err := RenderEvidenceBundleHTMLFromFile(inputPath); err == nil {
		t.Fatalf("expected wrong schemaVersion to be rejected")
	}
}

func TestEvidenceSignalsAggregateStatus(t *testing.T) {
	signals := []any{
		map[string]any{"severity": "medium"},
		map[string]any{"severity": "low"},
	}
	if got := evidenceSignalsAggregateStatus(signals); got != "concern" {
		t.Fatalf("expected concern with medium severity, got %s", got)
	}
	signals = append(signals, map[string]any{"severity": "high"})
	if got := evidenceSignalsAggregateStatus(signals); got != "blocker" {
		t.Fatalf("expected blocker with high severity, got %s", got)
	}
	if got := evidenceSignalsAggregateStatus(nil); got != "n/a" {
		t.Fatalf("expected n/a for empty signals, got %s", got)
	}
}

// --- sample factories ---

func sampleCompareArtifact() map[string]any {
	return map[string]any{
		"schemaVersion": "cautilus.compare_artifact.v1",
		"generatedAt":   "2026-04-16T00:00:00Z",
		"verdict":       "improved",
		"summary":       "The candidate keeps the operator recovery path explicit.",
		"improved":      []any{"operator-guidance-smoke"},
		"regressed":     []any{map[string]any{"scenarioId": "workflow-state-accuracy"}},
		"reasons": []any{
			"operator-guidance-smoke: recovery wording became easier to follow.",
			"workflow-state-accuracy: one held-out regression still matters downstream.",
		},
		"deltas": []any{
			map[string]any{"status": "improved", "key": "operator-guidance-smoke", "summary": "Pass rate climbed from 60% to 90%."},
			map[string]any{"status": "regressed", "key": "workflow-state-accuracy", "summary": "Recall dropped from 0.9 to 0.7."},
		},
		"artifactPaths": []any{"/tmp/cautilus/report.json", "/tmp/cautilus/scenario-results.json"},
	}
}

func sampleScenarioProposals() map[string]any {
	return map[string]any{
		"schemaVersion": "cautilus.scenario_proposals.v1",
		"generatedAt":   "2026-04-16T00:00:00Z",
		"windowDays":    float64(7),
		"families":      []any{"chatbot", "workflow"},
		"proposalTelemetry": map[string]any{
			"mergedCandidateCount":  float64(1),
			"returnedProposalCount": float64(1),
		},
		"attentionView": map[string]any{
			"ruleVersion": "v1",
			"proposalKeys": []any{
				"chatbot-review-clarification",
			},
			"reasonCodesByProposalKey": map[string]any{
				"chatbot-review-clarification": []any{"new_scenario", "low_recent_coverage"},
			},
			"matchedRuleCount": float64(1),
			"selectedCount":    float64(1),
			"fallbackUsed":     false,
			"truncated":        false,
		},
		"proposals": []any{
			map[string]any{
				"proposalKey": "chatbot-review-clarification",
				"title":       "Clarify ambiguous review prompts",
				"action":      "add_new_scenario",
				"family":      "chatbot",
				"rationale":   "3 recent log match(es) suggested this pattern.",
				"evidence":    []any{map[string]any{"conversationId": "c-1"}},
			},
		},
	}
}

func sampleEvidenceBundle() map[string]any {
	return map[string]any{
		"schemaVersion": "cautilus.evidence_bundle.v1",
		"generatedAt":   "2026-04-16T00:00:00Z",
		"repoRoot":      "/home/op/cautilus",
		"summary":       map[string]any{"highSeverityCount": float64(1), "mediumSeverityCount": float64(2), "totalCount": float64(3)},
		"signals": []any{
			map[string]any{"id": "report.regressed:1", "sourceKind": "report.regressed", "severity": "high", "summary": "Regressed evidence: workflow-state-accuracy"},
			map[string]any{"id": "report.noisy:1", "sourceKind": "report.noisy", "severity": "medium", "summary": "Noisy evidence: chatbot-latency-p95"},
		},
		"guidance": map[string]any{
			"miningFocus": []any{"workflow-state-accuracy"},
			"loopRules":   []any{"Keep source ownership explicit."},
		},
		"sources": []any{map[string]any{"kind": "report", "file": "/tmp/cautilus/report.json"}},
	}
}

func sampleScenarioConversationReview() map[string]any {
	return map[string]any{
		"schemaVersion": "cautilus.scenario_conversation_review.v1",
		"generatedAt":   "2026-04-19T00:00:00Z",
		"windowDays":    float64(14),
		"families":      []any{"fast_regression"},
		"summary": map[string]any{
			"threadCount":            float64(2),
			"linkedThreadCount":      float64(1),
			"unlinkedThreadCount":    float64(1),
			"linkedProposalCount":    float64(1),
			"newScenarioThreadCount": float64(0),
			"refreshThreadCount":     float64(1),
		},
		"proposalTelemetry": map[string]any{
			"mergedCandidateCount":  float64(1),
			"returnedProposalCount": float64(1),
		},
		"attentionView": map[string]any{
			"ruleVersion": "v1",
			"threadKeys": []any{
				"thread-1",
			},
			"reasonCodesByThreadKey": map[string]any{
				"thread-1": []any{"linked_proposal", "low_recent_coverage"},
			},
			"matchedRuleCount": float64(1),
			"selectedCount":    float64(1),
			"fallbackUsed":     false,
			"truncated":        false,
		},
		"threads": []any{
			map[string]any{
				"threadKey":       "thread-1",
				"title":           "Refresh review-after-retro scenario from recent activity",
				"recommendation":  "review_existing_scenario_refresh",
				"rationale":       "1 linked proposal(s) reference this conversation. Actions: refresh_existing_scenario. At least one linked scenario has low recent coverage.",
				"linkedProposals": []any{map[string]any{"proposalKey": "review-after-retro", "title": "Refresh review-after-retro scenario from recent activity", "action": "refresh_existing_scenario", "family": "fast_regression", "existingCoverage": map[string]any{"recentResultCount": float64(2)}}},
				"records": []any{
					map[string]any{"actorKind": "user", "text": "retro 먼저 해주세요"},
					map[string]any{"actorKind": "assistant", "text": "retro를 먼저 정리하겠습니다."},
					map[string]any{"actorKind": "user", "text": "이제 review로 돌아가죠"},
				},
			},
			map[string]any{
				"threadKey":       "thread-2",
				"title":           "배포 전에 체크리스트를 다시 보여주세요",
				"recommendation":  "inspect_unlinked_thread",
				"rationale":       "No linked scenario proposal currently references this conversation.",
				"linkedProposals": []any{},
				"records": []any{
					map[string]any{"actorKind": "user", "text": "배포 전에 체크리스트를 다시 보여주세요"},
				},
			},
		},
	}
}
