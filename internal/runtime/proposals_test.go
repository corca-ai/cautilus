package runtime

import (
	"testing"
)

// TestNormalizeChatbotProposalCandidatesRespectsWordBoundary asserts that the
// review-clarification candidate is produced only when the first user message
// actually mentions "review" or "repo" as whole words (or the Korean
// substrings). "preview" / "repository" must not match the review/repo
// patterns. Guards against the parity regression that motivated follow-up 8
// in docs/specs/archetype-boundary.spec.md.
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
