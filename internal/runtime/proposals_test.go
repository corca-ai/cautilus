package runtime

import (
	"strings"
	"testing"
)

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
}
