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
	Turns           []map[string]any
	AuditKind       *string
	ExpectedTrigger *string
	Thresholds      map[string]any
	RepeatCount     int
	MinConsensus    int
}

type SkillTestCaseSuite struct {
	SkillID          string
	SkillDisplayName string
	RepeatCount      int
	MinConsensus     int
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
	suiteRepeatCount := 1
	if value, err := normalizeOptionalPositiveInt(input["repeatCount"], "repeatCount"); err != nil {
		return nil, err
	} else if value != nil {
		suiteRepeatCount = *value
	}
	suiteMinConsensus := suiteRepeatCount
	if value, err := normalizeOptionalPositiveInt(input["minConsensusCount"], "minConsensusCount"); err != nil {
		return nil, err
	} else if value != nil {
		suiteMinConsensus = *value
	}
	if suiteMinConsensus > suiteRepeatCount {
		return nil, fmt.Errorf("minConsensusCount must be less than or equal to repeatCount")
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
		turns, err := normalizeSkillCaseTurns(record["turns"], fmt.Sprintf("cases[%d].turns", index))
		if err != nil {
			return nil, err
		}
		prompt := ""
		if len(turns) > 0 {
			if value, err := normalizeOptionalString(record["prompt"], fmt.Sprintf("cases[%d].prompt", index)); err != nil {
				return nil, err
			} else if value != nil {
				prompt = *value
			} else {
				prompt = fmt.Sprintf("Multi-turn episode starting with: %s", stringOrEmpty(turns[0]["input"]))
			}
			if evaluationKind != "execution" {
				return nil, fmt.Errorf("cases[%d].turns is only supported for execution cases", index)
			}
		} else {
			var promptErr error
			prompt, promptErr = normalizeNonEmptyString(record["prompt"], fmt.Sprintf("cases[%d].prompt", index))
			if promptErr != nil {
				return nil, promptErr
			}
		}
		auditKind, err := normalizeSkillCaseAuditKind(record["auditKind"], fmt.Sprintf("cases[%d].auditKind", index))
		if err != nil {
			return nil, err
		}
		if auditKind != nil && len(turns) == 0 {
			return nil, fmt.Errorf("cases[%d].auditKind requires turns", index)
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
		caseRepeatCount, err := normalizeOptionalPositiveInt(record["repeatCount"], fmt.Sprintf("cases[%d].repeatCount", index))
		if err != nil {
			return nil, err
		}
		repeatCount := suiteRepeatCount
		if caseRepeatCount != nil {
			repeatCount = *caseRepeatCount
		}
		minConsensus := suiteMinConsensus
		if caseRepeatCount != nil {
			minConsensus = repeatCount
		}
		if value, err := normalizeOptionalPositiveInt(record["minConsensusCount"], fmt.Sprintf("cases[%d].minConsensusCount", index)); err != nil {
			return nil, err
		} else if value != nil {
			minConsensus = *value
		}
		if minConsensus > repeatCount {
			return nil, fmt.Errorf("cases[%d].minConsensusCount must be less than or equal to repeatCount", index)
		}
		cases = append(cases, SkillTestCase{
			CaseID:          caseID,
			TargetKind:      targetKind,
			TargetID:        targetID,
			DisplayName:     displayName,
			EvaluationKind:  evaluationKind,
			Prompt:          prompt,
			Turns:           turns,
			AuditKind:       auditKind,
			ExpectedTrigger: expectedTrigger,
			Thresholds:      thresholds,
			RepeatCount:     repeatCount,
			MinConsensus:    minConsensus,
		})
	}

	return &SkillTestCaseSuite{
		SkillID:          skillID,
		SkillDisplayName: skillDisplayName,
		RepeatCount:      suiteRepeatCount,
		MinConsensus:     suiteMinConsensus,
		Cases:            cases,
	}, nil
}

func normalizeOptionalPositiveInt(value any, field string) (*int, error) {
	number, err := normalizeNonNegativeNumber(value, field)
	if err != nil {
		return nil, err
	}
	if number == nil {
		return nil, nil
	}
	if *number < 1 || float64(int(*number)) != *number {
		return nil, fmt.Errorf("%s must be a positive integer", field)
	}
	normalized := int(*number)
	return &normalized, nil
}

func normalizeSkillCaseTurns(value any, field string) ([]map[string]any, error) {
	if value == nil {
		return []map[string]any{}, nil
	}
	rawTurns, err := assertArray(value, field)
	if err != nil {
		return nil, err
	}
	if len(rawTurns) == 0 {
		return nil, fmt.Errorf("%s must be a non-empty array", field)
	}
	turns := make([]map[string]any, 0, len(rawTurns))
	for index, rawTurn := range rawTurns {
		record, ok := rawTurn.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("%s[%d] must be an object", field, index)
		}
		input, err := normalizeNonEmptyString(record["input"], fmt.Sprintf("%s[%d].input", field, index))
		if err != nil {
			return nil, err
		}
		turn := map[string]any{"input": input}
		if value, present := record["injectSkill"]; present {
			boolValue, ok := value.(bool)
			if !ok {
				return nil, fmt.Errorf("%s[%d].injectSkill must be a boolean", field, index)
			}
			turn["injectSkill"] = boolValue
		}
		turns = append(turns, turn)
	}
	return turns, nil
}

func normalizeSkillCaseAuditKind(value any, field string) (*string, error) {
	auditKind, err := normalizeOptionalString(value, field)
	if err != nil || auditKind == nil {
		return auditKind, err
	}
	if *auditKind != "cautilus_refresh_flow" && *auditKind != "cautilus_first_scan_flow" && *auditKind != "cautilus_review_prepare_flow" && *auditKind != "cautilus_reviewer_launch_flow" && *auditKind != "cautilus_review_to_eval_flow" && *auditKind != "cautilus_packet_first_flow" {
		return nil, fmt.Errorf("%s must be cautilus_refresh_flow, cautilus_first_scan_flow, cautilus_review_prepare_flow, cautilus_reviewer_launch_flow, cautilus_review_to_eval_flow, or cautilus_packet_first_flow", field)
	}
	return auditKind, nil
}
