package runtime

import (
	"strings"
	"testing"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

func TestScenarioBuildersRejectEmptyRegistryKeyWithoutPanic(t *testing.T) {
	registry := []any{map[string]any{"scenarioKey": " \t"}}
	tests := []struct {
		name  string
		build func() error
	}{
		{
			name: "proposal packet",
			build: func() error {
				_, err := BuildScenarioProposalPacket(map[string]any{
					"schemaVersion":            contracts.ScenarioProposalInputsSchema,
					"families":                 []any{},
					"proposalCandidates":       []any{},
					"existingScenarioRegistry": registry,
					"scenarioCoverage":         []any{},
				})
				return err
			},
		},
		{
			name: "conversation review",
			build: func() error {
				_, err := BuildScenarioConversationReview(map[string]any{
					"schemaVersion":            contracts.ScenarioConversationReviewInputsSchema,
					"conversationSummaries":    []any{},
					"families":                 []any{},
					"proposalCandidates":       []any{},
					"existingScenarioRegistry": registry,
					"scenarioCoverage":         []any{},
				}, time.Now())
				return err
			},
		},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.build()
			if err == nil || !strings.Contains(err.Error(), "existingScenarioRegistry[0].scenarioKey must be a non-empty string") {
				t.Fatalf("builder error: got %v", err)
			}
		})
	}
}

// TestNormalizeChatbotProposalCandidatesRespectsWordBoundary asserts that the
// review-clarification candidate is produced only when the first user message
// actually mentions "review" or "repo" as whole words (or the Korean
// substrings). "preview" / "repository" must not match the review/repo
// patterns. Guards against the parity regression that motivated the
// archetype-extension hardening pass in
// docs/specs/archetype-boundary.spec.md.
func TestNormalizeChatbotProposalCandidatesRespectsWordBoundary(t *testing.T) {
	conversationWithMessages := func(first, second string) map[string]any {
		return map[string]any{
			"threadKey":      "thread-word-boundary",
			"lastObservedAt": "2026-04-15T00:00:00.000Z",
			"records": []any{
				map[string]any{"actorKind": "user", "text": first},
				map[string]any{"actorKind": "user", "text": second},
			},
		}
	}

	cases := []struct {
		name       string
		first      string
		second     string
		wantReview bool
	}{
		{
			name:       "plain review + repo wording matches",
			first:      "repo review 해주세요",
			second:     "지금 이 저장소 기준으로 봐주세요",
			wantReview: true,
		},
		{
			name:       "preview does not match review",
			first:      "preview the page please",
			second:     "please do checkout and 기준",
			wantReview: false,
		},
		{
			name:       "repository does not match repo",
			first:      "take a look at the repository layout",
			second:     "지금 현재 상태로",
			wantReview: false,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			candidates, err := NormalizeChatbotProposalCandidates(
				[]any{conversationWithMessages(tc.first, tc.second)},
				nil,
			)
			if err != nil {
				t.Fatalf("NormalizeChatbotProposalCandidates: %v", err)
			}
			sawReview := false
			for _, rawCandidate := range candidates {
				candidate, ok := rawCandidate.(map[string]any)
				if !ok {
					continue
				}
				if candidate["proposalKey"] == "repo-review-needs-target-clarification" {
					sawReview = true
				}
			}
			if sawReview != tc.wantReview {
				t.Fatalf("proposalKey repo-review-needs-target-clarification: got %v, want %v (candidates=%#v)", sawReview, tc.wantReview, candidates)
			}
		})
	}
}

// TestNormalizeChatbotProposalCandidatesEmitsEventTriggeredFollowup asserts
// that an `eventType: "app_mention"` wake-up followed by a plain
// follow-up turn produces the `event-triggered-followup` candidate.
// Closes the test gap called out in archetype-extension hardening:
// without this guard `buildEventTriggeredFollowupCandidate` could rot
// silently because no other test exercises the event-triggered branch.
func TestNormalizeChatbotProposalCandidatesEmitsEventTriggeredFollowup(t *testing.T) {
	conversation := map[string]any{
		"threadKey":      "thread-event-triggered",
		"lastObservedAt": "2026-04-15T00:00:00.000Z",
		"records": []any{
			map[string]any{"actorKind": "user", "text": "@cautilus 안녕", "eventType": "app_mention"},
			map[string]any{"actorKind": "user", "text": "이어서 진행해주세요"},
		},
	}
	candidates, err := NormalizeChatbotProposalCandidates([]any{conversation}, nil)
	if err != nil {
		t.Fatalf("NormalizeChatbotProposalCandidates: %v", err)
	}
	saw := false
	for _, rawCandidate := range candidates {
		candidate, ok := rawCandidate.(map[string]any)
		if !ok {
			continue
		}
		if candidate["proposalKey"] == "event-triggered-followup" {
			saw = true
			break
		}
	}
	if !saw {
		t.Fatalf("expected event-triggered-followup candidate, got %#v", candidates)
	}
}

// TestNormalizeChatbotProposalCandidatesEmitsSecretInChatGuardrail asserts that a
// pasted-credential-with-storage-request user turn produces the generic
// `secret-in-chat-needs-safe-handling` candidate with the secret_handling intent
// profile (success: secret_safe_handling, guardrail: no_secret_retention), and that
// a secret noun WITHOUT a storage verb (or a storage verb without a secret noun)
// does not falsely trigger it. This is a generic chatbot guardrail pattern, not a
// host-specific one; the real example app prod log only supplies the evidence that it occurs.
func TestNormalizeChatbotProposalCandidatesEmitsSecretInChatGuardrail(t *testing.T) {
	conversationWith := func(text string) map[string]any {
		return map[string]any{
			"threadKey":      "thread-secret",
			"lastObservedAt": "2026-04-15T00:00:00.000Z",
			"records": []any{
				map[string]any{"actorKind": "user", "text": text},
			},
		}
	}

	cases := []struct {
		name string
		text string
		want bool
	}{
		{name: "API key storage request matches", text: "내 OpenAI API Key 저장해주세요. `<REDACTED:openai-api-key>`", want: true},
		{name: "english save my token matches", text: "please save my API token for later", want: true},
		{name: "secret noun without storage verb does not match", text: "what is an API key used for?", want: false},
		{name: "storage verb without secret noun does not match", text: "이 메모를 저장해주세요", want: false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			candidates, err := NormalizeChatbotProposalCandidates([]any{conversationWith(tc.text)}, nil)
			if err != nil {
				t.Fatalf("NormalizeChatbotProposalCandidates: %v", err)
			}
			var secret map[string]any
			for _, rawCandidate := range candidates {
				candidate, ok := rawCandidate.(map[string]any)
				if !ok {
					continue
				}
				if candidate["proposalKey"] == "secret-in-chat-needs-safe-handling" {
					secret = candidate
				}
			}
			if (secret != nil) != tc.want {
				t.Fatalf("secret-in-chat candidate present=%v, want %v (candidates=%#v)", secret != nil, tc.want, candidates)
			}
			if !tc.want {
				return
			}
			profile, ok := secret["intentProfile"].(map[string]any)
			if !ok {
				t.Fatalf("secret candidate missing intentProfile: %#v", secret)
			}
			if profile["behaviorSurface"] != BehaviorSurfaces["SECRET_HANDLING"] {
				t.Fatalf("behaviorSurface: got %v, want %v", profile["behaviorSurface"], BehaviorSurfaces["SECRET_HANDLING"])
			}
			success, _ := profile["successDimensions"].([]any)
			if len(success) != 1 || asMap(success[0])["id"] != BehaviorDimensions["SECRET_SAFE_HANDLING"] {
				t.Fatalf("successDimensions: got %#v, want [%s]", success, BehaviorDimensions["SECRET_SAFE_HANDLING"])
			}
			guardrail, _ := profile["guardrailDimensions"].([]any)
			if len(guardrail) != 1 || asMap(guardrail[0])["id"] != BehaviorDimensions["NO_SECRET_RETENTION"] {
				t.Fatalf("guardrailDimensions: got %#v, want [%s]", guardrail, BehaviorDimensions["NO_SECRET_RETENTION"])
			}
		})
	}
}

// TestNormalizeWorkflowProposalCandidatesUsesCLIWorkflowLabel asserts
// that the workflow normalization family renders the canonical
// "CLI Workflow" human label inside its description copy. Closes the test gap called
// out in archetype-extension hardening: a future refactor that drops
// the label from `humanizeTargetKind` would otherwise ship silently.
func TestNormalizeWorkflowProposalCandidatesUsesCLIWorkflowLabel(t *testing.T) {
	run := map[string]any{
		"targetKind":   "cli_workflow",
		"targetId":     "self-dogfood-cli",
		"surface":      "operator_workflow_recovery",
		"startedAt":    "2026-04-15T00:00:00.000Z",
		"status":       "blocked",
		"summary":      "Recovery loop kept hitting the same blocker.",
		"blockerKind":  "repeated_screen_no_progress",
		"blockedSteps": []any{"step-1", "step-1"},
	}
	candidates, err := NormalizeWorkflowProposalCandidates([]any{run})
	if err != nil {
		t.Fatalf("NormalizeWorkflowProposalCandidates: %v", err)
	}
	if len(candidates) == 0 {
		t.Fatalf("expected at least one workflow recovery candidate")
	}
	candidate, ok := candidates[0].(map[string]any)
	if !ok {
		t.Fatalf("candidate is not a map: %#v", candidates[0])
	}
	description, _ := candidate["description"].(string)
	if !strings.Contains(description, "CLI Workflow") {
		t.Fatalf("expected description to contain canonical label %q, got %q", "CLI Workflow", description)
	}
}

func TestNormalizeSkillProposalCandidatesCoversValidationTriggerAndExecutionBranches(t *testing.T) {
	runs := []any{
		map[string]any{
			"targetKind":  "public_skill",
			"targetId":    "impl",
			"displayName": "impl",
			"surface":     "smoke_scenario",
			"startedAt":   "2026-04-15T00:00:00.000Z",
			"status":      "failed",
			"summary":     "The impl smoke scenario stopped producing a bounded execution plan.",
		},
		map[string]any{
			"targetKind":  "public_skill",
			"targetId":    "impl",
			"displayName": "impl",
			"surface":     "trigger_selection",
			"startedAt":   "2026-04-15T00:05:00.000Z",
			"status":      "failed",
			"summary":     "The skill triggered on the wrong prompt.",
		},
		map[string]any{
			"targetKind":  "public_skill",
			"targetId":    "impl",
			"displayName": "impl",
			"surface":     "execution_quality",
			"startedAt":   "2026-04-15T00:10:00.000Z",
			"status":      "degraded",
			"summary":     "The skill completed the task but exceeded the quality budget.",
		},
	}

	candidates, err := NormalizeSkillProposalCandidates(runs)
	if err != nil {
		t.Fatalf("NormalizeSkillProposalCandidates: %v", err)
	}
	if len(candidates) != 3 {
		t.Fatalf("expected 3 candidates, got %#v", candidates)
	}

	seen := map[string]string{}
	for _, rawCandidate := range candidates {
		candidate, ok := rawCandidate.(map[string]any)
		if !ok {
			t.Fatalf("candidate is not a map: %#v", rawCandidate)
		}
		intentProfile, ok := candidate["intentProfile"].(map[string]any)
		if !ok {
			t.Fatalf("candidate missing intentProfile: %#v", candidate)
		}
		seen[candidate["proposalKey"].(string)] = intentProfile["behaviorSurface"].(string)
	}

	want := map[string]string{
		"public-skill-impl-smoke-scenario-regression":    "skill_validation",
		"public-skill-impl-trigger-selection-regression": "skill_trigger_selection",
		"public-skill-impl-execution-quality-regression": "skill_execution_quality",
	}
	if len(seen) != len(want) {
		t.Fatalf("unexpected candidate count: got %#v want %#v", seen, want)
	}
	for key, surface := range want {
		if seen[key] != surface {
			t.Fatalf("proposalKey %q: got surface %q, want %q (all=%#v)", key, seen[key], surface, seen)
		}
	}
}

func TestNormalizeWorkflowProposalCandidatesAddsRecoveryTagAndCanonicalProposalKey(t *testing.T) {
	run := map[string]any{
		"targetKind":   "cli_workflow",
		"targetId":     "scan-settings-seed",
		"displayName":  "Scan Settings Seed",
		"surface":      "replay_seed",
		"startedAt":    "2026-04-15T00:00:00.000Z",
		"status":       "blocked",
		"summary":      "Replay seed stalled on the same settings screen after two retries.",
		"blockerKind":  "repeated_screen_no_progress",
		"blockedSteps": []any{"open_settings", "open_settings"},
	}

	candidates, err := NormalizeWorkflowProposalCandidates([]any{run})
	if err != nil {
		t.Fatalf("NormalizeWorkflowProposalCandidates: %v", err)
	}
	if len(candidates) != 1 {
		t.Fatalf("expected 1 candidate, got %#v", candidates)
	}

	candidate, ok := candidates[0].(map[string]any)
	if !ok {
		t.Fatalf("candidate is not a map: %#v", candidates[0])
	}
	if candidate["proposalKey"] != "cli-workflow-scan-settings-seed-replay-seed-repeated-screen-no-progress" {
		t.Fatalf("unexpected proposalKey: %#v", candidate["proposalKey"])
	}
	intentProfile := candidate["intentProfile"].(map[string]any)
	if intentProfile["behaviorSurface"] != "operator_workflow_recovery" {
		t.Fatalf("unexpected behaviorSurface: %#v", intentProfile)
	}
	tags, ok := candidate["tags"].([]any)
	if !ok {
		t.Fatalf("expected tags array, got %#v", candidate["tags"])
	}
	foundRecovery := false
	for _, rawTag := range tags {
		if rawTag == "operator-recovery" {
			foundRecovery = true
			break
		}
	}
	if !foundRecovery {
		t.Fatalf("expected operator-recovery tag, got %#v", tags)
	}
}

// TestMergeCandidatesByProposalKeyPreservesInsertionOrder asserts that
// the merge helper returns candidates in the insertion order of their
// first appearance, not in map-iteration order. Closes the test gap
// called out in archetype-extension hardening: without this guard a
// refactor back to `for k, v := range map` would reintroduce
// nondeterministic candidate ordering.
func TestMergeCandidatesByProposalKeyPreservesInsertionOrder(t *testing.T) {
	candidates := []map[string]any{
		{"proposalKey": "alpha", "evidence": []any{}},
		{"proposalKey": "bravo", "evidence": []any{}},
		{"proposalKey": "charlie", "evidence": []any{}},
		{"proposalKey": "alpha", "evidence": []any{}},
	}
	for iteration := 0; iteration < 8; iteration++ {
		merged := mergeCandidatesByProposalKey(candidates)
		if len(merged) != 3 {
			t.Fatalf("expected 3 unique candidates, got %d", len(merged))
		}
		for index, want := range []string{"alpha", "bravo", "charlie"} {
			candidate, ok := merged[index].(map[string]any)
			if !ok {
				t.Fatalf("merged[%d] is not a map: %#v", index, merged[index])
			}
			if candidate["proposalKey"] != want {
				t.Fatalf("iteration %d: expected merged[%d] proposalKey %q, got %q",
					iteration, index, want, candidate["proposalKey"])
			}
		}
	}
}

func TestGenerateScenarioProposalsValidatesOptionalEvidenceProvenance(t *testing.T) {
	baseCandidate := func(evidence map[string]any) map[string]any {
		return map[string]any{
			"proposalKey": "review-after-retro",
			"title":       "Refresh review-after-retro scenario from recent activity",
			"family":      "fast_regression",
			"name":        "Review After Retro",
			"description": "The user pivots from retro back to review in one thread.",
			"brief":       "Recent activity shows a retro turn followed by a review turn.",
			"evidence":    []any{evidence},
		}
	}
	cases := []struct {
		name     string
		evidence map[string]any
		want     string
	}{
		{
			name: "invalid origin",
			evidence: map[string]any{
				"sourceKind": "human_conversation",
				"origin":     "dreamed",
				"title":      "invalid origin",
				"observedAt": "2026-04-09T21:00:00.000Z",
			},
			want: "proposalCandidates[0].evidence[0].origin must be one of",
		},
		{
			name: "invalid origin type",
			evidence: map[string]any{
				"sourceKind": "human_conversation",
				"origin":     12,
				"title":      "invalid origin type",
				"observedAt": "2026-04-09T21:00:00.000Z",
			},
			want: "proposalCandidates[0].evidence[0].origin must be a non-empty string",
		},
		{
			name: "null origin",
			evidence: map[string]any{
				"sourceKind": "human_conversation",
				"origin":     nil,
				"title":      "null origin",
				"observedAt": "2026-04-09T21:00:00.000Z",
			},
			want: "proposalCandidates[0].evidence[0].origin must be a non-empty string",
		},
		{
			name: "empty origin",
			evidence: map[string]any{
				"sourceKind": "human_conversation",
				"origin":     "",
				"title":      "empty origin",
				"observedAt": "2026-04-09T21:00:00.000Z",
			},
			want: "proposalCandidates[0].evidence[0].origin must be a non-empty string",
		},
		{
			name: "invalid split",
			evidence: map[string]any{
				"sourceKind":         "agent_run",
				"origin":             "replayed",
				"title":              "invalid split",
				"observedAt":         "2026-04-09T21:00:00.000Z",
				"activityProvenance": map[string]any{"split": "acceptance"},
			},
			want: "proposalCandidates[0].evidence[0].activityProvenance.split must be one of",
		},
		{
			name: "invalid split type",
			evidence: map[string]any{
				"sourceKind":         "agent_run",
				"origin":             "replayed",
				"title":              "invalid split type",
				"observedAt":         "2026-04-09T21:00:00.000Z",
				"activityProvenance": map[string]any{"split": 12},
			},
			want: "proposalCandidates[0].evidence[0].activityProvenance.split must be a non-empty string",
		},
		{
			name: "null split",
			evidence: map[string]any{
				"sourceKind":         "agent_run",
				"origin":             "replayed",
				"title":              "null split",
				"observedAt":         "2026-04-09T21:00:00.000Z",
				"activityProvenance": map[string]any{"split": nil},
			},
			want: "proposalCandidates[0].evidence[0].activityProvenance.split must be a non-empty string",
		},
		{
			name: "empty split",
			evidence: map[string]any{
				"sourceKind":         "agent_run",
				"origin":             "replayed",
				"title":              "empty split",
				"observedAt":         "2026-04-09T21:00:00.000Z",
				"activityProvenance": map[string]any{"split": ""},
			},
			want: "proposalCandidates[0].evidence[0].activityProvenance.split must be a non-empty string",
		},
		{
			name: "invalid task key type",
			evidence: map[string]any{
				"sourceKind":         "agent_run",
				"origin":             "replayed",
				"title":              "invalid task key",
				"observedAt":         "2026-04-09T21:00:00.000Z",
				"activityProvenance": map[string]any{"taskKey": 12},
			},
			want: "proposalCandidates[0].evidence[0].activityProvenance.taskKey must be a non-empty string",
		},
		{
			name: "invalid score type",
			evidence: map[string]any{
				"sourceKind":         "agent_run",
				"origin":             "replayed",
				"title":              "invalid score",
				"observedAt":         "2026-04-09T21:00:00.000Z",
				"activityProvenance": map[string]any{"score": "0.8"},
			},
			want: "proposalCandidates[0].evidence[0].activityProvenance.score must be a number",
		},
		{
			name: "score below range",
			evidence: map[string]any{
				"sourceKind":         "agent_run",
				"origin":             "replayed",
				"title":              "invalid low score",
				"observedAt":         "2026-04-09T21:00:00.000Z",
				"activityProvenance": map[string]any{"replayId": "replay-1", "score": -0.1},
			},
			want: "proposalCandidates[0].evidence[0].activityProvenance.score must be between 0 and 1",
		},
		{
			name: "score above range",
			evidence: map[string]any{
				"sourceKind":         "agent_run",
				"origin":             "replayed",
				"title":              "invalid high score",
				"observedAt":         "2026-04-09T21:00:00.000Z",
				"activityProvenance": map[string]any{"replayId": "replay-1", "score": 1.1},
			},
			want: "proposalCandidates[0].evidence[0].activityProvenance.score must be between 0 and 1",
		},
		{
			name: "replayed origin without replay id",
			evidence: map[string]any{
				"sourceKind":         "agent_run",
				"origin":             "replayed",
				"title":              "missing replay id",
				"observedAt":         "2026-04-09T21:00:00.000Z",
				"activityProvenance": map[string]any{"split": "review"},
			},
			want: "proposalCandidates[0].evidence[0].activityProvenance.replayId is required when origin is replayed",
		},
		{
			name: "replay id without replayed origin",
			evidence: map[string]any{
				"sourceKind":         "agent_run",
				"origin":             "real",
				"title":              "mismatched replay id",
				"observedAt":         "2026-04-09T21:00:00.000Z",
				"activityProvenance": map[string]any{"replayId": "replay-1"},
			},
			want: "proposalCandidates[0].evidence[0].origin must be replayed when activityProvenance.replayId is present",
		},
		{
			name: "replayed origin without activity provenance",
			evidence: map[string]any{
				"sourceKind": "agent_run",
				"origin":     "replayed",
				"title":      "missing provenance",
				"observedAt": "2026-04-09T21:00:00.000Z",
			},
			want: "proposalCandidates[0].evidence[0].activityProvenance.replayId is required when origin is replayed",
		},
		{
			name: "unsupported provenance field",
			evidence: map[string]any{
				"sourceKind":         "agent_run",
				"origin":             "replayed",
				"title":              "unsupported field",
				"observedAt":         "2026-04-09T21:00:00.000Z",
				"activityProvenance": map[string]any{"logPath": "/tmp/raw.log"},
			},
			want: "proposalCandidates[0].evidence[0].activityProvenance.logPath is not supported",
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := GenerateScenarioProposals([]any{baseCandidate(tc.evidence)}, nil, nil, nil, 14, time.Now())
			if err == nil || !strings.Contains(err.Error(), tc.want) {
				t.Fatalf("GenerateScenarioProposals error: got %v, want containing %q", err, tc.want)
			}
		})
	}
}

func TestGenerateScenarioProposalsSummarizesEvidenceProvenance(t *testing.T) {
	candidate := map[string]any{
		"proposalKey": "review-after-retro",
		"title":       "Refresh review-after-retro scenario from recent activity",
		"family":      "fast_regression",
		"name":        "Review After Retro",
		"description": "The user pivots from retro back to review in one thread.",
		"brief":       "Recent activity shows a retro turn followed by a review turn.",
		"evidence": []any{
			map[string]any{
				"sourceKind": "human_conversation",
				"origin":     "real",
				"title":      "real conversation",
				"observedAt": "2026-04-09T21:00:00.000Z",
				"activityProvenance": map[string]any{
					"activityId": "session-1",
					"split":      "proposal",
				},
			},
			map[string]any{
				"sourceKind": "agent_run",
				"origin":     "replayed",
				"title":      "replay",
				"observedAt": "2026-04-10T21:00:00.000Z",
				"activityProvenance": map[string]any{
					"replayId": "replay-1",
					"split":    "review",
					"score":    0.82,
				},
			},
		},
	}
	packet, err := GenerateScenarioProposals([]any{candidate}, nil, nil, nil, 14, time.Now())
	if err != nil {
		t.Fatalf("GenerateScenarioProposals returned error: %v", err)
	}
	proposal := asMap(arrayOrEmpty(packet["proposals"])[0])
	summary := asMap(proposal["provenanceSummary"])
	originCounts := asMap(summary["originCounts"])
	splitCounts := asMap(summary["splitCounts"])
	if originCounts["real"] != 1 || originCounts["replayed"] != 1 {
		t.Fatalf("unexpected origin counts: %#v", originCounts)
	}
	if splitCounts["proposal"] != 1 || splitCounts["review"] != 1 {
		t.Fatalf("unexpected split counts: %#v", splitCounts)
	}
	if summary["replayEvidenceCount"] != 1 || summary["scoredEvidenceCount"] != 1 || summary["maxScore"] != 0.82 {
		t.Fatalf("unexpected provenance summary: %#v", summary)
	}
}

func TestGenerateScenarioProposalsSummarizesFullEvidenceWhenOutputEvidenceIsTruncated(t *testing.T) {
	candidate := map[string]any{
		"proposalKey": "review-after-retro",
		"title":       "Refresh review-after-retro scenario from recent activity",
		"family":      "fast_regression",
		"name":        "Review After Retro",
		"description": "The user pivots from retro back to review in one thread.",
		"brief":       "Recent activity shows a retro turn followed by a review turn.",
		"evidence": []any{
			map[string]any{
				"sourceKind": "human_conversation",
				"origin":     "real",
				"title":      "newest real",
				"observedAt": "2026-04-12T21:00:00.000Z",
				"activityProvenance": map[string]any{
					"split": "proposal",
				},
			},
			map[string]any{
				"sourceKind": "agent_run",
				"origin":     "replayed",
				"title":      "review replay",
				"observedAt": "2026-04-11T21:00:00.000Z",
				"activityProvenance": map[string]any{
					"replayId": "replay-1",
					"split":    "review",
					"score":    0.7,
				},
			},
			map[string]any{
				"sourceKind": "skill_evaluation",
				"origin":     "synthetic",
				"title":      "train synthetic",
				"observedAt": "2026-04-10T21:00:00.000Z",
				"activityProvenance": map[string]any{
					"split": "train",
					"score": 0.9,
				},
			},
			map[string]any{
				"sourceKind": "workflow_run",
				"origin":     "operator_authored",
				"title":      "old operator authored",
				"observedAt": "2026-04-09T21:00:00.000Z",
				"activityProvenance": map[string]any{
					"split": "review",
				},
			},
		},
	}
	packet, err := GenerateScenarioProposals([]any{candidate}, nil, nil, nil, 14, time.Now())
	if err != nil {
		t.Fatalf("GenerateScenarioProposals returned error: %v", err)
	}
	proposal := asMap(arrayOrEmpty(packet["proposals"])[0])
	if got := len(arrayOrEmpty(proposal["evidence"])); got != 3 {
		t.Fatalf("output evidence length = %d, want 3", got)
	}
	summary := asMap(proposal["provenanceSummary"])
	originCounts := asMap(summary["originCounts"])
	splitCounts := asMap(summary["splitCounts"])
	if originCounts["real"] != 1 || originCounts["replayed"] != 1 || originCounts["synthetic"] != 1 || originCounts["operator_authored"] != 1 {
		t.Fatalf("unexpected full-evidence origin counts: %#v", originCounts)
	}
	if splitCounts["proposal"] != 1 || splitCounts["review"] != 2 || splitCounts["train"] != 1 {
		t.Fatalf("unexpected full-evidence split counts: %#v", splitCounts)
	}
	if summary["maxScore"] != 0.9 {
		t.Fatalf("unexpected maxScore: %#v", summary)
	}
}

func TestGenerateScenarioProposalsRejectsEmptyEvidence(t *testing.T) {
	candidate := map[string]any{
		"proposalKey": "review-after-retro",
		"title":       "Refresh review-after-retro scenario from recent activity",
		"family":      "fast_regression",
		"name":        "Review After Retro",
		"description": "The user pivots from retro back to review in one thread.",
		"brief":       "Recent activity shows a retro turn followed by a review turn.",
		"evidence":    []any{},
	}
	_, err := GenerateScenarioProposals([]any{candidate}, nil, nil, nil, 14, time.Now())
	if err == nil || !strings.Contains(err.Error(), "proposalCandidates[0].evidence must contain at least one item") {
		t.Fatalf("GenerateScenarioProposals error: got %v", err)
	}
}

// TestBuildBehaviorIntentProfileNormalizesDeprecatedSurfaceAlias asserts
// that the deprecated `workflow_conversation` surface name is silently
// normalized to its canonical replacement `conversation_continuity`.
// Guards the catalog-level deprecation contract that closed the
// surface-name disambiguation follow-up in
// docs/specs/archetype-boundary.spec.md.
func TestBuildBehaviorIntentProfileNormalizesDeprecatedSurfaceAlias(t *testing.T) {
	intentProfile := map[string]any{
		"summary":         "Carry workflow context across the next turn.",
		"behaviorSurface": "workflow_conversation",
	}
	profile, err := BuildBehaviorIntentProfile(
		"Carry workflow context across the next turn.",
		intentProfile,
		BehaviorSurfaces["OPERATOR_BEHAVIOR"],
		[]string{BehaviorDimensions["WORKFLOW_CONTINUITY"]},
		nil,
	)
	if err != nil {
		t.Fatalf("BuildBehaviorIntentProfile: %v", err)
	}
	if profile.BehaviorSurface != "conversation_continuity" {
		t.Fatalf("expected behaviorSurface to normalize to conversation_continuity, got %q", profile.BehaviorSurface)
	}
	if contracts.BehaviorIntentSchema != "cautilus.behavior_intent.v1" {
		t.Fatalf("expected behavior intent schema contract to stay v1, got %q", contracts.BehaviorIntentSchema)
	}
	if profile.SchemaVersion != contracts.BehaviorIntentSchema {
		t.Fatalf("expected profile schema to use behavior intent contract %q, got %q", contracts.BehaviorIntentSchema, profile.SchemaVersion)
	}
}

func TestBuildBehaviorIntentProfileAcceptsArtifactFidelity(t *testing.T) {
	intentProfile := map[string]any{
		"summary":             "Resolve the artifact URL before saying it is unavailable.",
		"behaviorSurface":     BehaviorSurfaces["ARTIFACT_FIDELITY"],
		"guardrailDimensions": []any{BehaviorDimensions["NO_PREMATURE_CAPABILITY_DENIAL"]},
	}
	profile, err := BuildBehaviorIntentProfile(
		"Resolve the artifact URL before saying it is unavailable.",
		intentProfile,
		BehaviorSurfaces["OPERATOR_BEHAVIOR"],
		nil,
		nil,
	)
	if err != nil {
		t.Fatalf("BuildBehaviorIntentProfile: %v", err)
	}
	if profile.BehaviorSurface != BehaviorSurfaces["ARTIFACT_FIDELITY"] {
		t.Fatalf("expected artifact_fidelity surface, got %q", profile.BehaviorSurface)
	}
	if len(profile.SuccessDimensions) != 1 || profile.SuccessDimensions[0].ID != BehaviorDimensions["ARTIFACT_URL_RESOLUTION"] {
		t.Fatalf("unexpected success dimensions: %#v", profile.SuccessDimensions)
	}
	if len(profile.GuardrailDimensions) != 1 || profile.GuardrailDimensions[0].ID != BehaviorDimensions["NO_PREMATURE_CAPABILITY_DENIAL"] {
		t.Fatalf("unexpected guardrail dimensions: %#v", profile.GuardrailDimensions)
	}
}
