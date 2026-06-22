package runtime

import "testing"

func TestNormalizeSkillTestCaseSuiteRepeatDefaults(t *testing.T) {
	suite, err := NormalizeSkillTestCaseSuite(map[string]any{
		"schemaVersion":     "cautilus.skill_test_cases.v1",
		"skillId":           "demo",
		"repeatCount":       3,
		"minConsensusCount": 2,
		"cases": []any{
			map[string]any{
				"caseId":          "trigger-demo",
				"evaluationKind":  "trigger",
				"prompt":          "Use $demo here.",
				"expectedTrigger": "must_invoke",
			},
		},
	})
	if err != nil {
		t.Fatalf("NormalizeSkillTestCaseSuite returned error: %v", err)
	}
	if suite.RepeatCount != 3 || suite.MinConsensus != 2 {
		t.Fatalf("unexpected suite repeat config: %#v", suite)
	}
	if got := suite.Cases[0].RepeatCount; got != 3 {
		t.Fatalf("unexpected case repeatCount: %d", got)
	}
	if got := suite.Cases[0].MinConsensus; got != 2 {
		t.Fatalf("unexpected case minConsensus: %d", got)
	}
}

func TestNormalizeSkillTestCaseSuiteRejectsConsensusAboveRepeatCount(t *testing.T) {
	_, err := NormalizeSkillTestCaseSuite(map[string]any{
		"schemaVersion": "cautilus.skill_test_cases.v1",
		"skillId":       "demo",
		"cases": []any{
			map[string]any{
				"caseId":            "trigger-demo",
				"evaluationKind":    "trigger",
				"prompt":            "Use $demo here.",
				"expectedTrigger":   "must_invoke",
				"repeatCount":       2,
				"minConsensusCount": 3,
			},
		},
	})
	if err == nil {
		t.Fatal("expected validation error, got nil")
	}
}

func TestNormalizeSkillTestCaseSuiteAcceptsCacheExcludedTokenThreshold(t *testing.T) {
	suite, err := NormalizeSkillTestCaseSuite(map[string]any{
		"schemaVersion": "cautilus.skill_test_cases.v1",
		"skillId":       "demo",
		"cases": []any{
			map[string]any{
				"caseId":         "execution-demo",
				"evaluationKind": "execution",
				"prompt":         "Use $demo.",
				"thresholds": map[string]any{
					"max_uncached_tokens": float64(1000),
				},
			},
		},
	})
	if err != nil {
		t.Fatalf("NormalizeSkillTestCaseSuite returned error: %v", err)
	}
	if got := suite.Cases[0].Thresholds["max_uncached_tokens"]; got != 1000 {
		t.Fatalf("unexpected max_uncached_tokens threshold: %#v", got)
	}
}
