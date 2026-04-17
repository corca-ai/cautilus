package runtime

import (
	"fmt"

	"github.com/corca-ai/cautilus/internal/contracts"
)

type SkillTestCase struct {
	CaseID             string
	TargetKind         string
	TargetID           string
	DisplayName        string
	EvaluationKind     string
	Prompt             string
	ExpectedTrigger    *string
	ExpectedRouting    map[string]any
	InstructionSurface map[string]any
	Thresholds         map[string]any
	RepeatCount        int
	MinConsensus       int
}

type SkillTestCaseSuite struct {
	SkillID            string
	SkillDisplayName   string
	RepeatCount        int
	MinConsensus       int
	InstructionSurface map[string]any
	Cases              []SkillTestCase
}

func normalizeSkillInstructionSurface(value any, field string) (map[string]any, error) {
	record := asMap(value)
	if len(record) == 0 {
		return nil, nil
	}
	surfaceLabel, err := normalizeOptionalString(record["surfaceLabel"], field+".surfaceLabel")
	if err != nil {
		return nil, err
	}
	files, err := assertArray(record["files"], field+".files")
	if err != nil {
		return nil, err
	}
	if len(files) == 0 {
		return nil, fmt.Errorf("%s.files must be a non-empty array", field)
	}
	normalizedFiles := make([]any, 0, len(files))
	for index, rawFile := range files {
		fileRecord := asMap(rawFile)
		path, err := normalizeNonEmptyString(fileRecord["path"], fmt.Sprintf("%s.files[%d].path", field, index))
		if err != nil {
			return nil, err
		}
		content, err := normalizeOptionalString(fileRecord["content"], fmt.Sprintf("%s.files[%d].content", field, index))
		if err != nil {
			return nil, err
		}
		sourceFile, err := normalizeOptionalString(fileRecord["sourceFile"], fmt.Sprintf("%s.files[%d].sourceFile", field, index))
		if err != nil {
			return nil, err
		}
		count := 0
		if content != nil {
			count++
		}
		if sourceFile != nil {
			count++
		}
		if count != 1 {
			return nil, fmt.Errorf("%s.files[%d] must set exactly one of content or sourceFile", field, index)
		}
		entry := map[string]any{"path": path}
		if content != nil {
			entry["content"] = *content
		}
		if sourceFile != nil {
			entry["sourceFile"] = *sourceFile
		}
		normalizedFiles = append(normalizedFiles, entry)
	}
	normalized := map[string]any{
		"surfaceLabel": "custom_instruction_surface",
		"files":        normalizedFiles,
	}
	if surfaceLabel != nil {
		normalized["surfaceLabel"] = *surfaceLabel
	}
	return normalized, nil
}

func normalizeSkillExpectedRouting(value any, field string) (map[string]any, error) {
	record := asMap(value)
	if len(record) == 0 {
		return nil, nil
	}
	normalized := map[string]any{}
	if _, exists := record["selectedSkill"]; exists {
		text, err := normalizeNullableString(record["selectedSkill"], field+".selectedSkill")
		if err != nil {
			return nil, err
		}
		if text == nil {
			normalized["selectedSkill"] = nil
		} else {
			normalized["selectedSkill"] = *text
		}
	}
	if _, exists := record["selectedSupport"]; exists {
		text, err := normalizeNullableString(record["selectedSupport"], field+".selectedSupport")
		if err != nil {
			return nil, err
		}
		if text == nil {
			normalized["selectedSupport"] = nil
		} else {
			normalized["selectedSupport"] = *text
		}
	}
	if _, exists := record["firstToolCallPattern"]; exists {
		text, err := normalizeOptionalString(record["firstToolCallPattern"], field+".firstToolCallPattern")
		if err != nil {
			return nil, err
		}
		if text != nil {
			normalized["firstToolCallPattern"] = *text
		}
	}
	if len(normalized) == 0 {
		return nil, fmt.Errorf("%s must declare at least one expectation field", field)
	}
	return normalized, nil
}

func normalizeNullableString(value any, field string) (*string, error) {
	if value == nil {
		return nil, nil
	}
	return normalizeOptionalString(value, field)
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
	suiteInstructionSurface, err := normalizeSkillInstructionSurface(input["instructionSurface"], "instructionSurface")
	if err != nil {
		return nil, err
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
		expectedRouting, err := normalizeSkillExpectedRouting(record["expectedRouting"], fmt.Sprintf("cases[%d].expectedRouting", index))
		if err != nil {
			return nil, err
		}
		instructionSurface, err := normalizeSkillInstructionSurface(record["instructionSurface"], fmt.Sprintf("cases[%d].instructionSurface", index))
		if err != nil {
			return nil, err
		}
		if instructionSurface == nil {
			instructionSurface = suiteInstructionSurface
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
			CaseID:             caseID,
			TargetKind:         targetKind,
			TargetID:           targetID,
			DisplayName:        displayName,
			EvaluationKind:     evaluationKind,
			Prompt:             prompt,
			ExpectedTrigger:    expectedTrigger,
			ExpectedRouting:    expectedRouting,
			InstructionSurface: instructionSurface,
			Thresholds:         thresholds,
			RepeatCount:        repeatCount,
			MinConsensus:       minConsensus,
		})
	}

	return &SkillTestCaseSuite{
		SkillID:            skillID,
		SkillDisplayName:   skillDisplayName,
		RepeatCount:        suiteRepeatCount,
		MinConsensus:       suiteMinConsensus,
		InstructionSurface: suiteInstructionSurface,
		Cases:              cases,
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
