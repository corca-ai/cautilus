package runtime

import (
	"testing"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

func TestBuildSkillCloneExperimentReportPromotesCoveredVariant(t *testing.T) {
	report, err := BuildSkillCloneExperimentReport(map[string]any{
		"schemaVersion": contracts.SkillCloneExperimentInputSchema,
		"experimentId":  "announcement-style-lab",
		"taskPacket": map[string]any{
			"path":    "charness-artifacts/announcement/style-lab-input.md",
			"summary": "draft a Ceal announcement from preserved sources",
		},
		"baseline": map[string]any{
			"skillId": "announcement",
			"status":  "passed",
			"output": map[string]any{
				"text":       "Draft mentions Slack notes.",
				"sourceRefs": []any{"Slack thread"},
			},
		},
		"variant": map[string]any{
			"skillId": "announcement-style-lab",
			"status":  "passed",
			"output": map[string]any{
				"text":       "Draft covers Slack thread, Ceal control repo, and user-facing in-progress coverage.",
				"sourceRefs": []any{"Slack thread", "Ceal control repo", "user-facing in-progress coverage"},
			},
		},
		"exemplar": map[string]any{
			"id":     "prior-strong-announcement",
			"status": "passed",
			"output": map[string]any{
				"text":       "Prior strong announcement covers Ceal control repo.",
				"sourceRefs": []any{"Ceal control repo"},
			},
		},
		"sourceCoverageObligations": []any{
			map[string]any{"id": "control-repo", "ref": "Ceal control repo", "required": true},
			map[string]any{"id": "user-progress", "ref": "user-facing in-progress coverage", "required": true},
		},
		"rubricPhrases": []any{"control repo"},
		"isolation": map[string]any{
			"sandbox":                "temporary-skill-clone",
			"productionSkillTouched": false,
		},
	}, time.Date(2026, 5, 11, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildSkillCloneExperimentReport returned error: %v", err)
	}
	if report["schemaVersion"] != contracts.SkillCloneExperimentReportSchema {
		t.Fatalf("unexpected schema: %#v", report["schemaVersion"])
	}
	if report["variant_ran"] != true || report["promotion_recommendation"] != "promote" {
		t.Fatalf("expected promotable variant, got %#v", report)
	}
	if report["baseline_comparable"] != true {
		t.Fatalf("expected comparable baseline, got %#v", report["baseline_comparable"])
	}
	if _, ok := report["exemplar"]; !ok {
		t.Fatalf("expected exemplar summary in report")
	}
	coverage := report["source_coverage_delta"].(map[string]any)
	if len(coverage["stillMissing"].([]string)) != 0 {
		t.Fatalf("expected all required coverage satisfied, got %#v", coverage)
	}
	delta := report["baseline_vs_variant_delta"].(map[string]any)
	if len(delta["addedSourceCoverage"].([]string)) != 2 {
		t.Fatalf("expected added coverage, got %#v", delta)
	}
}

func TestBuildSkillCloneExperimentReportRevisesUnsafeOrIncompleteVariant(t *testing.T) {
	report, err := BuildSkillCloneExperimentReport(map[string]any{
		"schemaVersion": contracts.SkillCloneExperimentInputSchema,
		"experimentId":  "unsafe-style-lab",
		"taskPacket": map[string]any{
			"path": "task.json",
		},
		"baseline": map[string]any{
			"status": "passed",
			"text":   "Baseline covers source A.",
		},
		"variant": map[string]any{
			"status": "passed",
			"text":   "Variant covers source A.",
		},
		"sourceCoverageObligations": []any{
			map[string]any{"id": "source-b", "ref": "source B", "required": true},
		},
		"isolation": map[string]any{
			"productionSkillTouched": true,
		},
	}, time.Date(2026, 5, 11, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildSkillCloneExperimentReport returned error: %v", err)
	}
	if report["promotion_recommendation"] != "revise" {
		t.Fatalf("expected revise recommendation, got %#v", report["promotion_recommendation"])
	}
	coverage := report["source_coverage_delta"].(map[string]any)
	if len(coverage["stillMissing"].([]string)) != 1 {
		t.Fatalf("expected missing coverage, got %#v", coverage)
	}
}

func TestBuildSkillCloneExperimentReportDiscardsNonComparableVariant(t *testing.T) {
	report, err := BuildSkillCloneExperimentReport(map[string]any{
		"schemaVersion": contracts.SkillCloneExperimentInputSchema,
		"experimentId":  "blocked-style-lab",
		"taskPacket": map[string]any{
			"sourceRef": "task-packet",
		},
		"baseline": map[string]any{
			"status":     "passed",
			"text":       "Baseline covers source A.",
			"sourceRefs": []any{"source A"},
		},
		"variant": map[string]any{
			"status": "blocked",
			"errors": []any{"variant YAML was invalid"},
			"text":   "",
		},
		"sourceCoverageObligations": []any{
			map[string]any{"id": "source-a", "ref": "source A", "required": true},
		},
		"rubricPhrases": []any{"polished announcement"},
		"isolation": map[string]any{
			"notes":                  []any{"kept in temp dir"},
			"productionSkillTouched": false,
		},
	}, time.Date(2026, 5, 11, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildSkillCloneExperimentReport returned error: %v", err)
	}
	if report["variant_ran"] != false || report["promotion_recommendation"] != "discard" {
		t.Fatalf("expected discarded blocked variant, got %#v", report)
	}
	delta := report["baseline_vs_variant_delta"].(map[string]any)
	if delta["summary"] != "variant loses declared source coverage" {
		t.Fatalf("expected lost coverage summary, got %#v", delta["summary"])
	}
	findings := report["findings"].([]any)
	if len(findings) < 2 {
		t.Fatalf("expected blocker and coverage findings, got %#v", findings)
	}
}

func TestBuildSkillCloneExperimentReportDiscardsNoDeltaVariant(t *testing.T) {
	longText := "This variant is intentionally long. " +
		"It repeats enough words to exercise summary truncation in the default summary path. " +
		"It still does not declare any source coverage obligations or rubric phrases for promotion."
	report, err := BuildSkillCloneExperimentReport(map[string]any{
		"schemaVersion": contracts.SkillCloneExperimentInputSchema,
		"experimentId":  "no-delta-style-lab",
		"taskPacket": map[string]any{
			"schemaVersion": "task.packet.v1",
		},
		"baseline": map[string]any{
			"status": "passed",
			"text":   longText,
		},
		"variant": map[string]any{
			"status": "passed",
			"text":   longText,
		},
		"isolation": map[string]any{
			"productionSkillTouched": false,
		},
	}, time.Date(2026, 5, 11, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildSkillCloneExperimentReport returned error: %v", err)
	}
	if report["promotion_recommendation"] != "discard" {
		t.Fatalf("expected no-delta variant to be discarded, got %#v", report["promotion_recommendation"])
	}
	variant := report["variant"].(map[string]any)
	if len([]rune(variant["summary"].(string))) != 160 {
		t.Fatalf("expected truncated default summary, got %#v", variant["summary"])
	}
}

func TestBuildSkillCloneExperimentReportRejectsMalformedInput(t *testing.T) {
	cases := []struct {
		name  string
		input map[string]any
	}{
		{
			name: "schema",
			input: map[string]any{
				"schemaVersion": "wrong",
			},
		},
		{
			name: "task packet",
			input: map[string]any{
				"schemaVersion": contracts.SkillCloneExperimentInputSchema,
				"experimentId":  "bad",
				"baseline":      map[string]any{"text": "baseline"},
				"variant":       map[string]any{"text": "variant"},
			},
		},
		{
			name: "task packet identity",
			input: map[string]any{
				"schemaVersion": contracts.SkillCloneExperimentInputSchema,
				"experimentId":  "bad-task-identity",
				"taskPacket":    map[string]any{"opaque": "value"},
				"baseline":      map[string]any{"text": "baseline"},
				"variant":       map[string]any{"text": "variant"},
			},
		},
		{
			name: "run status",
			input: map[string]any{
				"schemaVersion": contracts.SkillCloneExperimentInputSchema,
				"experimentId":  "bad-status",
				"taskPacket":    map[string]any{"path": "task"},
				"baseline":      map[string]any{"status": "unknown", "text": "baseline"},
				"variant":       map[string]any{"text": "variant"},
			},
		},
		{
			name: "coverage obligation",
			input: map[string]any{
				"schemaVersion": contracts.SkillCloneExperimentInputSchema,
				"experimentId":  "bad-obligation",
				"taskPacket":    map[string]any{"path": "task"},
				"baseline":      map[string]any{"text": "baseline"},
				"variant":       map[string]any{"text": "variant"},
				"sourceCoverageObligations": []any{
					map[string]any{"id": "missing-ref"},
				},
			},
		},
		{
			name: "string list",
			input: map[string]any{
				"schemaVersion": contracts.SkillCloneExperimentInputSchema,
				"experimentId":  "bad-list",
				"taskPacket":    map[string]any{"path": "task"},
				"baseline":      map[string]any{"text": "baseline"},
				"variant":       map[string]any{"text": "variant", "sourceRefs": []any{""}},
			},
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := BuildSkillCloneExperimentReport(tc.input, time.Date(2026, 5, 11, 0, 0, 0, 0, time.UTC)); err == nil {
				t.Fatalf("expected malformed input error")
			}
		})
	}
}

func TestBuildSkillCloneExperimentReportRevisesWithoutComparableBaseline(t *testing.T) {
	report, err := BuildSkillCloneExperimentReport(map[string]any{
		"schemaVersion": contracts.SkillCloneExperimentInputSchema,
		"experimentId":  "one-sided-style-lab",
		"taskPacket": map[string]any{
			"path": "task.json",
		},
		"baseline": map[string]any{
			"status": "blocked",
			"errors": []any{"baseline runner failed"},
			"text":   "",
		},
		"variant": map[string]any{
			"status":     "passed",
			"text":       "Variant covers source A and adds clear handoff.",
			"sourceRefs": []any{"source A"},
		},
		"sourceCoverageObligations": []any{
			map[string]any{"id": "source-a", "ref": "source A", "required": true},
		},
		"rubricPhrases": []any{"clear handoff"},
		"isolation": map[string]any{
			"productionSkillTouched": false,
		},
	}, time.Date(2026, 5, 11, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildSkillCloneExperimentReport returned error: %v", err)
	}
	if report["baseline_comparable"] != false || report["promotion_recommendation"] != "revise" {
		t.Fatalf("expected one-sided experiment to revise, got %#v", report)
	}
}

func TestBuildSkillCloneExperimentReportRequiresRubricGainForPromotion(t *testing.T) {
	report, err := BuildSkillCloneExperimentReport(map[string]any{
		"schemaVersion": contracts.SkillCloneExperimentInputSchema,
		"experimentId":  "rubric-only-style-lab",
		"taskPacket": map[string]any{
			"path": "task.json",
		},
		"baseline": map[string]any{
			"status": "passed",
			"text":   "Baseline already has clear handoff.",
		},
		"variant": map[string]any{
			"status": "passed",
			"text":   "Baseline already has clear handoff.",
		},
		"rubricPhrases": []any{"clear handoff"},
		"isolation": map[string]any{
			"productionSkillTouched": false,
		},
	}, time.Date(2026, 5, 11, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildSkillCloneExperimentReport returned error: %v", err)
	}
	rubric := report["rubric_match"].(map[string]any)
	if len(rubric["gained"].([]string)) != 0 || report["promotion_recommendation"] != "discard" {
		t.Fatalf("expected no rubric-only promotion without gain, got %#v", report)
	}
}
