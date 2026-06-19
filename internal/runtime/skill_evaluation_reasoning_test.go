package runtime

import (
	"testing"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

// These pin the generic verdict-compositing the skill engine gained (symmetric with the instruction
// surface): it reads an optional per-evaluation reasoningSoundness verdict, ANDs it into the case
// status, attaches it to the payload, and accumulates a judgeSummary — while a missing verdict leaves
// existing cases byte-for-byte unchanged. The judge LOGIC stays in the adapter-owned enricher; the
// engine only reads and composites a structured verdict.

func skillReasoningInput(reasoningSoundness map[string]any) map[string]any {
	evaluation := map[string]any{
		"evaluationId":   "execution-cautilus-no-input-claim-discovery-status",
		"targetKind":     "public_skill",
		"targetId":       "cautilus-agent",
		"evaluationKind": "execution",
		"prompt":         "Orient with no task detail.",
		"summary":        "Oriented via the read-only doctor status packet and stopped at branch selection.",
		"invoked":        true,
		"outcome":        "passed",
	}
	if reasoningSoundness != nil {
		evaluation["reasoningSoundness"] = reasoningSoundness
	}
	return map[string]any{
		"schemaVersion": contracts.SkillEvaluationInputsSchema,
		"skillId":       "cautilus-agent",
		"evaluations":   []any{evaluation},
	}
}

func firstSkillEvaluation(t *testing.T, summary map[string]any) map[string]any {
	t.Helper()
	evaluations, ok := summary["evaluations"].([]any)
	if !ok || len(evaluations) != 1 {
		t.Fatalf("expected one evaluation, got %#v", summary["evaluations"])
	}
	return asMap(evaluations[0])
}

func TestSkillEvaluationANDsUnsoundReasoningVerdictIntoStatus(t *testing.T) {
	summary, err := BuildSkillEvaluationSummary(skillReasoningInput(map[string]any{
		"verdict":      "unsound",
		"judgeVerdict": "unsound",
		"claimId":      "dev-skill-no-input-orientation",
		"provenance":   "full-runner-capture-replay",
	}), time.Date(2026, 6, 19, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildSkillEvaluationSummary returned error: %v", err)
	}
	evaluation := firstSkillEvaluation(t, summary)
	if evaluation["status"] != "failed" {
		t.Fatalf("expected an unsound judge verdict to fail a passed case, got status %#v", evaluation["status"])
	}
	reasoning := asMap(evaluation["reasoningSoundness"])
	if reasoning["status"] != "failed" || reasoning["verdict"] != "unsound" {
		t.Fatalf("expected reasoningSoundness failed/unsound, got %#v", reasoning)
	}
	if reasoning["provenance"] != "full-runner-capture-replay" {
		t.Fatalf("expected provenance preserved, got %#v", reasoning["provenance"])
	}
	if summary["recommendation"] != "reject" {
		t.Fatalf("expected reject when the judge fails a case, got %#v", summary["recommendation"])
	}
	counts := asMap(summary["evaluationCounts"])
	if intFromAny(counts["failed"]) != 1 || intFromAny(counts["passed"]) != 0 {
		t.Fatalf("expected failed=1 passed=0, got %#v", counts)
	}
	judge := asMap(summary["judgeSummary"])
	if intFromAny(judge["evaluationsWithReasoningJudge"]) != 1 || intFromAny(judge["reasoningUnsound"]) != 1 {
		t.Fatalf("expected judgeSummary to count one unsound verdict, got %#v", judge)
	}
}

func TestSkillEvaluationKeepsPassWhenReasoningSound(t *testing.T) {
	summary, err := BuildSkillEvaluationSummary(skillReasoningInput(map[string]any{
		"verdict":    "sound",
		"provenance": "full-runner-capture-replay",
	}), time.Date(2026, 6, 19, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildSkillEvaluationSummary returned error: %v", err)
	}
	evaluation := firstSkillEvaluation(t, summary)
	if evaluation["status"] != "passed" {
		t.Fatalf("expected a sound judge verdict to keep the case passed, got %#v", evaluation["status"])
	}
	if asMap(evaluation["reasoningSoundness"])["status"] != "passed" {
		t.Fatalf("expected reasoningSoundness passed, got %#v", evaluation["reasoningSoundness"])
	}
	if summary["recommendation"] != "accept-now" {
		t.Fatalf("expected accept-now, got %#v", summary["recommendation"])
	}
	judge := asMap(summary["judgeSummary"])
	if intFromAny(judge["reasoningSound"]) != 1 {
		t.Fatalf("expected judgeSummary to count one sound verdict, got %#v", judge)
	}
}

func TestSkillEvaluationMissingReasoningVerdictIsNotApplicable(t *testing.T) {
	summary, err := BuildSkillEvaluationSummary(skillReasoningInput(nil), time.Date(2026, 6, 19, 0, 0, 0, 0, time.UTC))
	if err != nil {
		t.Fatalf("BuildSkillEvaluationSummary returned error: %v", err)
	}
	evaluation := firstSkillEvaluation(t, summary)
	if evaluation["status"] != "passed" {
		t.Fatalf("expected an unchanged passed case, got %#v", evaluation["status"])
	}
	if _, ok := evaluation["reasoningSoundness"]; ok {
		t.Fatalf("expected no reasoningSoundness field when no verdict supplied, got %#v", evaluation["reasoningSoundness"])
	}
	if _, ok := summary["judgeSummary"]; ok {
		t.Fatalf("expected no judgeSummary when no verdict supplied, got %#v", summary["judgeSummary"])
	}
	if summary["recommendation"] != "accept-now" {
		t.Fatalf("expected accept-now, got %#v", summary["recommendation"])
	}
}
