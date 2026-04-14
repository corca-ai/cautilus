package runtime

import (
	"fmt"

	"github.com/corca-ai/cautilus/internal/contracts"
)

type SkillTestCase struct {
	CaseID          string
	TargetKind      string
	TargetID        string
	DisplayName     string
	EvaluationKind  string
	Prompt          string
	ExpectedTrigger *string
	Thresholds      map[string]any
}

type SkillTestCaseSuite struct {
	SkillID          string
	SkillDisplayName string
	Cases            []SkillTestCase
}

func NormalizeSkillTestCaseSuite(input map[string]any) (*SkillTestCaseSuite, error) {
	if input["schemaVersion"] != contracts.SkillTestCasesSchema {
		return nil, fmt.Errorf("schemaVersion must be %s", contracts.SkillTestCasesSchema)
	}
	skillID, err := normalizeNonEmptyString(input["skillId"], "skillId")
	if err != nil {
		return nil, err
	}
	skillDisplayName := skillID
	if value, err := normalizeOptionalString(input["skillDisplayName"], "skillDisplayName"); err != nil {
		return nil, err
	} else if value != nil {
		skillDisplayName = *value
	}
	rawCases, err := assertArray(input["cases"], "cases")
	if err != nil {
		return nil, err
	}
	if len(rawCases) == 0 {
		return nil, fmt.Errorf("cases must be a non-empty array")
	}

	cases := make([]SkillTestCase, 0, len(rawCases))
	for index, rawCase := range rawCases {
		record, ok := rawCase.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("cases[%d] must be an object", index)
		}
		caseID, err := normalizeNonEmptyString(record["caseId"], fmt.Sprintf("cases[%d].caseId", index))
		if err != nil {
			return nil, err
		}
		evaluationKind, err := normalizeNonEmptyString(record["evaluationKind"], fmt.Sprintf("cases[%d].evaluationKind", index))
		if err != nil {
			return nil, err
		}
		if !containsString([]string{"trigger", "execution"}, evaluationKind) {
			return nil, fmt.Errorf("cases[%d].evaluationKind must be one of: trigger, execution", index)
		}
		targetKind := "public_skill"
		if value, err := normalizeOptionalString(record["targetKind"], fmt.Sprintf("cases[%d].targetKind", index)); err != nil {
			return nil, err
		} else if value != nil {
			targetKind = *value
		}
		if !containsString([]string{"public_skill", "profile", "integration"}, targetKind) {
			return nil, fmt.Errorf("cases[%d].targetKind must be one of: public_skill, profile, integration", index)
		}
		targetID := skillID
		if value, err := normalizeOptionalString(record["targetId"], fmt.Sprintf("cases[%d].targetId", index)); err != nil {
			return nil, err
		} else if value != nil {
			targetID = *value
		}
		displayName := skillDisplayName
		if value, err := normalizeOptionalString(record["displayName"], fmt.Sprintf("cases[%d].displayName", index)); err != nil {
			return nil, err
		} else if value != nil {
			displayName = *value
		}
		prompt, err := normalizeNonEmptyString(record["prompt"], fmt.Sprintf("cases[%d].prompt", index))
		if err != nil {
			return nil, err
		}
		expectedTrigger, err := normalizeOptionalString(record["expectedTrigger"], fmt.Sprintf("cases[%d].expectedTrigger", index))
		if err != nil {
			return nil, err
		}
		if evaluationKind == "trigger" {
			if expectedTrigger == nil || !containsString([]string{"must_invoke", "must_not_invoke"}, *expectedTrigger) {
				return nil, fmt.Errorf("trigger cases must use expectedTrigger must_invoke or must_not_invoke")
			}
		} else if expectedTrigger != nil {
			return nil, fmt.Errorf("execution cases must not set expectedTrigger")
		}
		thresholds, err := normalizeSkillNumberObject(
			record["thresholds"],
			fmt.Sprintf("cases[%d].thresholds", index),
			map[string]bool{
				"max_total_tokens": true,
				"max_duration_ms":  true,
				"max_cost_usd":     false,
			},
		)
		if err != nil {
			return nil, err
		}
		cases = append(cases, SkillTestCase{
			CaseID:          caseID,
			TargetKind:      targetKind,
			TargetID:        targetID,
			DisplayName:     displayName,
			EvaluationKind:  evaluationKind,
			Prompt:          prompt,
			ExpectedTrigger: expectedTrigger,
			Thresholds:      thresholds,
		})
	}

	return &SkillTestCaseSuite{
		SkillID:          skillID,
		SkillDisplayName: skillDisplayName,
		Cases:            cases,
	}, nil
}
