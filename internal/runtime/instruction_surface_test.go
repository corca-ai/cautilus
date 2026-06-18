package runtime

import (
	"testing"
	"time"
)

func TestBuildEvaluationSummaryScoresRoutingAndFiles(t *testing.T) {
	now := time.Date(2026, 4, 18, 0, 0, 0, 0, time.UTC)
	summary, err := BuildEvaluationSummary(map[string]any{
		"schemaVersion": "cautilus.evaluation_observed.v1",
		"suiteId":       "instruction-surface-demo",
		"evaluations": []any{
			map[string]any{
				"evaluationId":           "compact-agents-pass",
				"displayName":            "compact agents pass",
				"prompt":                 "Read the routing instructions first.",
				"startedAt":              "2026-04-18T00:00:00Z",
				"observationStatus":      "observed",
				"summary":                "Started from AGENTS.md and chose discovery first.",
				"entryFile":              "AGENTS.md",
				"loadedInstructionFiles": []any{"AGENTS.md"},
				"loadedSupportingFiles":  []any{"docs/internal/handoff.md"},
				"routingDecision": map[string]any{
					"bootstrapHelper": "charness:find-skills",
					"workSkill":       "charness:impl",
					"firstToolCall":   "functions.exec_command",
				},
				"instructionSurface": map[string]any{
					"surfaceLabel": "compact_agents",
					"files": []any{
						map[string]any{"path": "AGENTS.md", "kind": "file", "sourceKind": "workspace_default"},
					},
				},
				"expectedEntryFile":        "AGENTS.md",
				"requiredInstructionFiles": []any{"AGENTS.md"},
				"requiredSupportingFiles":  []any{"docs/internal/handoff.md"},
				"allowedFirstToolCalls":    []any{"none", "functions.exec_command"},
				"expectedRouting": map[string]any{
					"bootstrapHelper":      "charness:find-skills",
					"workSkill":            "charness:impl",
					"firstToolCallPattern": "functions.exec_command",
				},
				"artifactRefs": []any{},
			},
			map[string]any{
				"evaluationId":           "expanded-agents-fail",
				"displayName":            "expanded agents fail",
				"prompt":                 "Read the routing instructions first.",
				"startedAt":              "2026-04-18T00:01:00Z",
				"observationStatus":      "observed",
				"summary":                "Skipped the nested follow-up doc.",
				"entryFile":              "AGENTS.md",
				"loadedInstructionFiles": []any{"AGENTS.md"},
				"loadedSupportingFiles":  []any{},
				"routingDecision": map[string]any{
					"bootstrapHelper": "charness:find-skills",
					"workSkill":       "bug-fixer",
				},
				"instructionSurface": map[string]any{
					"surfaceLabel": "expanded_agents",
					"files": []any{
						map[string]any{"path": "AGENTS.md", "kind": "file", "sourceKind": "inline"},
					},
				},
				"expectedEntryFile":        "AGENTS.md",
				"requiredInstructionFiles": []any{"AGENTS.md", "docs/feature/AGENTS.md"},
				"requiredSupportingFiles":  []any{"docs/internal/handoff.md"},
				"expectedRouting": map[string]any{
					"bootstrapHelper": "charness:find-skills",
					"workSkill":       "charness:impl",
				},
				"artifactRefs": []any{},
			},
		},
	}, now)
	if err != nil {
		t.Fatalf("BuildEvaluationSummary returned error: %v", err)
	}
	if summary["schemaVersion"] != "cautilus.evaluation_summary.v1" {
		t.Fatalf("unexpected schema version: %#v", summary["schemaVersion"])
	}
	if summary["recommendation"] != "reject" {
		t.Fatalf("expected reject recommendation, got %#v", summary["recommendation"])
	}
	counts := asMap(summary["evaluationCounts"])
	if counts["passed"] != 1 || counts["failed"] != 1 {
		t.Fatalf("unexpected evaluation counts: %#v", counts)
	}
	routingSummary := asMap(summary["routingSummary"])
	if routingSummary["matchedExpectedRoute"] != 1 || routingSummary["mismatchedExpectedRoute"] != 1 {
		t.Fatalf("unexpected routing summary: %#v", routingSummary)
	}
	if asMap(routingSummary["bootstrapHelperCounts"])["charness:find-skills"] != 2 {
		t.Fatalf("unexpected bootstrap helper counts: %#v", routingSummary)
	}
	if asMap(routingSummary["workSkillCounts"])["charness:impl"] != 1 || asMap(routingSummary["workSkillCounts"])["bug-fixer"] != 1 {
		t.Fatalf("unexpected work skill counts: %#v", routingSummary)
	}
	surfaceSummary := asMap(summary["surfaceSummary"])
	if surfaceSummary["requiredInstructionFileMisses"] != 1 || surfaceSummary["requiredSupportingFileMisses"] != 1 {
		t.Fatalf("unexpected surface summary: %#v", surfaceSummary)
	}
	evaluations := arrayOrEmpty(summary["evaluations"])
	if len(evaluations) != 2 {
		t.Fatalf("unexpected evaluations: %#v", evaluations)
	}
	if status := stringOrEmpty(asMap(evaluations[1])["status"]); status != "failed" {
		t.Fatalf("expected failed second evaluation, got %q", status)
	}
	if got := stringArrayOrEmpty(asMap(evaluations[0])["allowedFirstToolCalls"]); len(got) != 2 || got[1] != "functions.exec_command" {
		t.Fatalf("expected allowed first tool calls to be preserved, got %#v", got)
	}
	firstToolCallResult := asMap(asMap(evaluations[0])["expectationResults"])["firstToolCall"]
	if stringOrEmpty(asMap(firstToolCallResult)["status"]) != "passed" {
		t.Fatalf("expected first tool allowlist to pass, got %#v", firstToolCallResult)
	}
}

func TestBuildEvaluationSummaryRejectsDisallowedFirstToolCall(t *testing.T) {
	now := time.Date(2026, 5, 4, 0, 0, 0, 0, time.UTC)
	summary, err := BuildEvaluationSummary(map[string]any{
		"schemaVersion": "cautilus.evaluation_observed.v1",
		"suiteId":       "instruction-surface-demo",
		"evaluations": []any{
			map[string]any{
				"evaluationId":           "disallowed-first-tool",
				"prompt":                 "Read the repo instructions and decide.",
				"startedAt":              "2026-05-04T00:00:00Z",
				"observationStatus":      "observed",
				"summary":                "Used an unexpected first tool.",
				"entryFile":              "AGENTS.md",
				"loadedInstructionFiles": []any{"AGENTS.md"},
				"loadedSupportingFiles":  []any{},
				"routingDecision": map[string]any{
					"bootstrapHelper": "find-skills",
					"workSkill":       "impl",
					"firstToolCall":   "functions.exec_command",
				},
				"instructionSurface": map[string]any{
					"surfaceLabel": "compact_agents",
					"files": []any{
						map[string]any{"path": "AGENTS.md", "kind": "file", "sourceKind": "workspace_default"},
					},
				},
				"expectedEntryFile":        "AGENTS.md",
				"requiredInstructionFiles": []any{"AGENTS.md"},
				"allowedFirstToolCalls":    []any{"none"},
				"expectedRouting": map[string]any{
					"bootstrapHelper": "find-skills",
					"workSkill":       "impl",
				},
				"artifactRefs": []any{},
			},
		},
	}, now)
	if err != nil {
		t.Fatalf("BuildEvaluationSummary returned error: %v", err)
	}
	if summary["recommendation"] != "reject" {
		t.Fatalf("expected reject recommendation, got %#v", summary["recommendation"])
	}
	evaluation := asMap(arrayOrEmpty(summary["evaluations"])[0])
	firstToolCallResult := asMap(asMap(evaluation["expectationResults"])["firstToolCall"])
	if firstToolCallResult["status"] != "failed" {
		t.Fatalf("expected first tool allowlist to fail, got %#v", firstToolCallResult)
	}
	if got := stringArrayOrEmpty(firstToolCallResult["allowed"]); len(got) != 1 || got[0] != "none" {
		t.Fatalf("expected allowed calls in result, got %#v", got)
	}
}

func TestBuildEvaluationSummaryCompositesReasoningSoundnessJudge(t *testing.T) {
	now := time.Date(2026, 6, 19, 0, 0, 0, 0, time.UTC)
	// Two cases whose deterministic expectations BOTH pass. The only difference is the
	// runner-emitted reasoning-soundness verdict: the second case routes correctly (the
	// all-deterministic matchers would pass it) but the judge flags the stated reason as
	// unsound. The CLI must now fail it — this is the semantic seat the field/fragment
	// matchers could not fill (the regressed-reason-control analog at the engine level).
	summary, err := BuildEvaluationSummary(map[string]any{
		"schemaVersion": "cautilus.evaluation_observed.v1",
		"suiteId":       "reasoning-judge-demo",
		"evaluations": []any{
			map[string]any{
				"evaluationId":           "sound-routing",
				"prompt":                 "Read the repo instructions and decide.",
				"startedAt":              "2026-06-19T00:00:00Z",
				"observationStatus":      "observed",
				"summary":                "Bootstrapped find-skills for a sound reason.",
				"entryFile":              "AGENTS.md",
				"loadedInstructionFiles": []any{"AGENTS.md"},
				"loadedSupportingFiles":  []any{},
				"routingDecision": map[string]any{
					"bootstrapHelper": "charness:find-skills",
					"workSkill":       "charness:impl",
				},
				"instructionSurface": map[string]any{
					"surfaceLabel": "compact_agents",
					"files":        []any{map[string]any{"path": "AGENTS.md", "kind": "file", "sourceKind": "workspace_default"}},
				},
				"expectedEntryFile":        "AGENTS.md",
				"requiredInstructionFiles": []any{"AGENTS.md"},
				"expectedRouting":          map[string]any{"bootstrapHelper": "charness:find-skills"},
				"reasoningSoundness": map[string]any{
					"verdict":      "sound",
					"judgeVerdict": "sound",
					"claimId":      "dev-repo-routing-regression",
					"codeFacets":   map[string]any{"emitted_find_skills_bootstrap": true},
					"confidence":   0.95,
					"provenance":   "blind-subagent-harvest-replay",
				},
				"artifactRefs": []any{},
			},
			map[string]any{
				"evaluationId":           "right-route-wrong-reason",
				"prompt":                 "Read the repo instructions and decide.",
				"startedAt":              "2026-06-19T00:01:00Z",
				"observationStatus":      "observed",
				"summary":                "Bootstrapped find-skills but fabricated the reason.",
				"entryFile":              "AGENTS.md",
				"loadedInstructionFiles": []any{"AGENTS.md"},
				"loadedSupportingFiles":  []any{},
				"routingDecision": map[string]any{
					"bootstrapHelper": "charness:find-skills",
					"workSkill":       "charness:impl",
				},
				"instructionSurface": map[string]any{
					"surfaceLabel": "compact_agents",
					"files":        []any{map[string]any{"path": "AGENTS.md", "kind": "file", "sourceKind": "workspace_default"}},
				},
				"expectedEntryFile":        "AGENTS.md",
				"requiredInstructionFiles": []any{"AGENTS.md"},
				"expectedRouting":          map[string]any{"bootstrapHelper": "charness:find-skills"},
				"reasoningSoundness": map[string]any{
					"verdict":      "unsound",
					"judgeVerdict": "unsound",
					"claimId":      "dev-repo-routing-regression",
					"codeFacets":   map[string]any{"emitted_find_skills_bootstrap": true},
					"confidence":   0.97,
					"evidence":     "fabricated a 'find-skills is the test runner' rule",
					"provenance":   "blind-subagent-harvest-replay",
				},
				"artifactRefs": []any{},
			},
		},
	}, now)
	if err != nil {
		t.Fatalf("BuildEvaluationSummary returned error: %v", err)
	}
	if summary["recommendation"] != "reject" {
		t.Fatalf("expected reject recommendation when the judge flags a case unsound, got %#v", summary["recommendation"])
	}
	counts := asMap(summary["evaluationCounts"])
	if counts["passed"] != 1 || counts["failed"] != 1 {
		t.Fatalf("unexpected evaluation counts: %#v", counts)
	}
	evaluations := arrayOrEmpty(summary["evaluations"])
	soundCase := asMap(evaluations[0])
	if status := stringOrEmpty(soundCase["status"]); status != "passed" {
		t.Fatalf("expected the sound-reason case to pass, got %q", status)
	}
	wrongReason := asMap(evaluations[1])
	if status := stringOrEmpty(wrongReason["status"]); status != "failed" {
		t.Fatalf("expected the right-route-wrong-reason case to FAIL via the judge, got %q", status)
	}
	// The deterministic routing matcher PASSES on the failing case — only the judge carries the negative.
	routingResult := asMap(asMap(wrongReason["expectationResults"])["routing"])
	if stringOrEmpty(routingResult["status"]) != "passed" {
		t.Fatalf("expected routing matcher to pass (judge is the sole negative), got %#v", routingResult)
	}
	judgeResult := asMap(asMap(wrongReason["expectationResults"])["reasoningSoundness"])
	if judgeResult["status"] != "failed" || judgeResult["verdict"] != "unsound" {
		t.Fatalf("expected the reasoning-soundness expectation to fail, got %#v", judgeResult)
	}
	if judgeResult["claimId"] != "dev-repo-routing-regression" || judgeResult["evidence"] == nil {
		t.Fatalf("expected judge breakdown preserved for audit, got %#v", judgeResult)
	}
	judgeSummary := asMap(summary["judgeSummary"])
	if judgeSummary["evaluationsWithReasoningJudge"] != 2 || judgeSummary["reasoningSound"] != 1 || judgeSummary["reasoningUnsound"] != 1 {
		t.Fatalf("unexpected judge summary: %#v", judgeSummary)
	}
}

func TestBuildEvaluationSummaryOmitsJudgeSummaryWithoutReasoningVerdict(t *testing.T) {
	now := time.Date(2026, 6, 19, 0, 0, 0, 0, time.UTC)
	summary, err := BuildEvaluationSummary(map[string]any{
		"schemaVersion": "cautilus.evaluation_observed.v1",
		"suiteId":       "instruction-surface-demo",
		"evaluations": []any{
			map[string]any{
				"evaluationId":           "no-judge",
				"prompt":                 "Read the repo instructions and decide.",
				"startedAt":              "2026-06-19T00:00:00Z",
				"observationStatus":      "observed",
				"summary":                "No reasoning judge attached.",
				"entryFile":              "AGENTS.md",
				"loadedInstructionFiles": []any{"AGENTS.md"},
				"loadedSupportingFiles":  []any{},
				"routingDecision":        map[string]any{"bootstrapHelper": "charness:find-skills"},
				"instructionSurface": map[string]any{
					"surfaceLabel": "compact_agents",
					"files":        []any{map[string]any{"path": "AGENTS.md", "kind": "file", "sourceKind": "workspace_default"}},
				},
				"expectedEntryFile":        "AGENTS.md",
				"requiredInstructionFiles": []any{"AGENTS.md"},
				"artifactRefs":             []any{},
			},
		},
	}, now)
	if err != nil {
		t.Fatalf("BuildEvaluationSummary returned error: %v", err)
	}
	if _, ok := summary["judgeSummary"]; ok {
		t.Fatalf("expected no judgeSummary when no evaluation carries a reasoning verdict")
	}
	evaluation := asMap(arrayOrEmpty(summary["evaluations"])[0])
	reasoningResult := asMap(asMap(evaluation["expectationResults"])["reasoningSoundness"])
	if reasoningResult["status"] != "not_applicable" {
		t.Fatalf("expected reasoningSoundness not_applicable without a verdict, got %#v", reasoningResult)
	}
	if stringOrEmpty(evaluation["status"]) != "passed" {
		t.Fatalf("expected the case to pass unchanged without a judge tier, got %q", stringOrEmpty(evaluation["status"]))
	}
}

func TestNormalizeReasoningSoundnessVerdictRejectsBadVerdict(t *testing.T) {
	now := time.Date(2026, 6, 19, 0, 0, 0, 0, time.UTC)
	_, err := BuildEvaluationSummary(map[string]any{
		"schemaVersion": "cautilus.evaluation_observed.v1",
		"suiteId":       "instruction-surface-demo",
		"evaluations": []any{
			map[string]any{
				"evaluationId":           "bad-verdict",
				"prompt":                 "Read the repo instructions and decide.",
				"startedAt":              "2026-06-19T00:00:00Z",
				"observationStatus":      "observed",
				"summary":                "Bad judge verdict value.",
				"entryFile":              "AGENTS.md",
				"loadedInstructionFiles": []any{"AGENTS.md"},
				"loadedSupportingFiles":  []any{},
				"routingDecision":        map[string]any{"bootstrapHelper": "charness:find-skills"},
				"instructionSurface": map[string]any{
					"surfaceLabel": "compact_agents",
					"files":        []any{map[string]any{"path": "AGENTS.md", "kind": "file", "sourceKind": "workspace_default"}},
				},
				"reasoningSoundness": map[string]any{"verdict": "maybe"},
				"artifactRefs":       []any{},
			},
		},
	}, now)
	if err == nil {
		t.Fatalf("expected an error for an invalid reasoningSoundness.verdict")
	}
}

func TestBuildEvaluationSummaryTreatsNamespacedRoutingTokensAsSameSkill(t *testing.T) {
	now := time.Date(2026, 4, 26, 0, 0, 0, 0, time.UTC)
	summary, err := BuildEvaluationSummary(map[string]any{
		"schemaVersion": "cautilus.evaluation_observed.v1",
		"suiteId":       "instruction-surface-demo",
		"evaluations": []any{
			map[string]any{
				"evaluationId":           "namespaced-bootstrap-helper",
				"prompt":                 "Read the routing instructions first.",
				"startedAt":              "2026-04-26T00:00:00Z",
				"observationStatus":      "observed",
				"summary":                "Started from AGENTS.md and used the required bootstrap helper.",
				"entryFile":              "AGENTS.md",
				"loadedInstructionFiles": []any{"AGENTS.md"},
				"loadedSupportingFiles":  []any{},
				"routingDecision": map[string]any{
					"bootstrapHelper": "charness:find-skills",
					"workSkill":       "none",
					"firstToolCall":   "functions.exec_command",
				},
				"instructionSurface": map[string]any{
					"surfaceLabel": "compact_agents",
					"files": []any{
						map[string]any{"path": "AGENTS.md", "kind": "file", "sourceKind": "workspace_default"},
					},
				},
				"expectedEntryFile":        "AGENTS.md",
				"requiredInstructionFiles": []any{"AGENTS.md"},
				"expectedRouting": map[string]any{
					"bootstrapHelper": "find-skills",
					"workSkill":       "none",
				},
				"artifactRefs": []any{},
			},
		},
	}, now)
	if err != nil {
		t.Fatalf("BuildEvaluationSummary returned error: %v", err)
	}
	if summary["recommendation"] != "accept-now" {
		t.Fatalf("expected accept-now recommendation, got %#v", summary["recommendation"])
	}
	counts := asMap(summary["evaluationCounts"])
	if counts["passed"] != 1 || counts["failed"] != 0 {
		t.Fatalf("unexpected evaluation counts: %#v", counts)
	}
}

func TestBuildEvaluationSummaryTreatsDescriptiveEntryFileAsLoadedInstruction(t *testing.T) {
	now := time.Date(2026, 4, 26, 0, 0, 0, 0, time.UTC)
	summary, err := BuildEvaluationSummary(map[string]any{
		"schemaVersion": "cautilus.evaluation_observed.v1",
		"suiteId":       "instruction-surface-demo",
		"evaluations": []any{
			map[string]any{
				"evaluationId":           "descriptive-entry-file",
				"prompt":                 "Read the routing instructions first.",
				"startedAt":              "2026-04-26T00:00:00Z",
				"observationStatus":      "observed",
				"summary":                "Used AGENTS.md from the prompt and then read find-skills.",
				"entryFile":              "AGENTS.md (entry surface provided in the user prompt)",
				"loadedInstructionFiles": []any{"/tmp/find-skills/SKILL.md"},
				"loadedSupportingFiles":  []any{},
				"routingDecision": map[string]any{
					"bootstrapHelper": "find-skills",
					"workSkill":       "none",
				},
				"instructionSurface": map[string]any{
					"surfaceLabel": "compact_agents",
					"files": []any{
						map[string]any{"path": "AGENTS.md", "kind": "file", "sourceKind": "workspace_default"},
					},
				},
				"expectedEntryFile":        "AGENTS.md",
				"requiredInstructionFiles": []any{"AGENTS.md"},
				"expectedRouting": map[string]any{
					"bootstrapHelper": "find-skills",
					"workSkill":       "none",
				},
				"artifactRefs": []any{},
			},
		},
	}, now)
	if err != nil {
		t.Fatalf("BuildEvaluationSummary returned error: %v", err)
	}
	if summary["recommendation"] != "accept-now" {
		t.Fatalf("expected accept-now recommendation, got %#v", summary["recommendation"])
	}
	counts := asMap(summary["evaluationCounts"])
	if counts["passed"] != 1 || counts["failed"] != 0 {
		t.Fatalf("unexpected evaluation counts: %#v", counts)
	}
}
