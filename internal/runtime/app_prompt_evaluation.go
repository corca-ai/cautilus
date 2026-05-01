package runtime

import (
	"fmt"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

type appPromptTestCase struct {
	caseID      string
	displayName string
	provider    string
	model       string
	system      string
	input       string
	expected    *appChatExpected
}

type appPromptTestCaseSuite struct {
	suiteID          string
	suiteDisplayName string
	provider         string
	model            string
	system           string
	cases            []appPromptTestCase
}

// normalizeAppPromptTestCaseSuite validates a translated app/prompt test-case
// suite. The schema is cautilus.app_prompt_test_cases.v1.
func normalizeAppPromptTestCaseSuite(input map[string]any) (*appPromptTestCaseSuite, error) {
	if input["schemaVersion"] != contracts.AppPromptTestCasesSchema {
		return nil, fmt.Errorf("schemaVersion must be %s", contracts.AppPromptTestCasesSchema)
	}
	suiteID, err := normalizeNonEmptyString(input["suiteId"], "suiteId")
	if err != nil {
		return nil, err
	}
	suiteDisplayName := suiteID
	if value, err := normalizeOptionalString(input["suiteDisplayName"], "suiteDisplayName"); err != nil {
		return nil, err
	} else if value != nil {
		suiteDisplayName = *value
	}
	provider, err := normalizeNonEmptyString(input["provider"], "provider")
	if err != nil {
		return nil, err
	}
	model, err := normalizeNonEmptyString(input["model"], "model")
	if err != nil {
		return nil, err
	}
	system := ""
	if value, err := normalizeOptionalString(input["system"], "system"); err != nil {
		return nil, err
	} else if value != nil {
		system = *value
	}
	rawCases, err := assertArray(input["cases"], "cases")
	if err != nil {
		return nil, err
	}
	if len(rawCases) == 0 {
		return nil, fmt.Errorf("cases must be a non-empty array")
	}
	cases := make([]appPromptTestCase, 0, len(rawCases))
	for index, rawCase := range rawCases {
		record, ok := rawCase.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("cases[%d] must be an object", index)
		}
		normalized, err := normalizeAppPromptCase(record, index, provider, model, system)
		if err != nil {
			return nil, err
		}
		cases = append(cases, *normalized)
	}
	return &appPromptTestCaseSuite{
		suiteID:          suiteID,
		suiteDisplayName: suiteDisplayName,
		provider:         provider,
		model:            model,
		system:           system,
		cases:            cases,
	}, nil
}

func normalizeAppPromptCase(record map[string]any, index int, suiteProvider string, suiteModel string, suiteSystem string) (*appPromptTestCase, error) {
	caseID, err := normalizeNonEmptyString(record["caseId"], fmt.Sprintf("cases[%d].caseId", index))
	if err != nil {
		return nil, err
	}
	displayName := caseID
	if value, err := normalizeOptionalString(record["displayName"], fmt.Sprintf("cases[%d].displayName", index)); err != nil {
		return nil, err
	} else if value != nil {
		displayName = *value
	}
	provider := suiteProvider
	if value, err := normalizeOptionalString(record["provider"], fmt.Sprintf("cases[%d].provider", index)); err != nil {
		return nil, err
	} else if value != nil {
		provider = *value
	}
	model := suiteModel
	if value, err := normalizeOptionalString(record["model"], fmt.Sprintf("cases[%d].model", index)); err != nil {
		return nil, err
	} else if value != nil {
		model = *value
	}
	system := suiteSystem
	if value, err := normalizeOptionalString(record["system"], fmt.Sprintf("cases[%d].system", index)); err != nil {
		return nil, err
	} else if value != nil {
		system = *value
	}
	input, err := normalizeNonEmptyString(record["input"], fmt.Sprintf("cases[%d].input", index))
	if err != nil {
		return nil, err
	}
	expected, err := normalizeAppChatExpected(record["expected"], fmt.Sprintf("cases[%d].expected", index))
	if err != nil {
		return nil, err
	}
	return &appPromptTestCase{
		caseID:      caseID,
		displayName: displayName,
		provider:    provider,
		model:       model,
		system:      system,
		input:       input,
		expected:    expected,
	}, nil
}

func translateAppPromptFixture(input map[string]any, suiteID string, suiteDisplayName string) (map[string]any, error) {
	provider, err := normalizeNonEmptyString(input["provider"], "provider")
	if err != nil {
		return nil, err
	}
	model, err := normalizeNonEmptyString(input["model"], "model")
	if err != nil {
		return nil, err
	}
	system := ""
	if value, err := normalizeOptionalString(input["system"], "system"); err != nil {
		return nil, err
	} else if value != nil {
		system = *value
	}
	rawCases, err := assertArray(input["cases"], "cases")
	if err != nil {
		return nil, err
	}
	if len(rawCases) == 0 {
		return nil, fmt.Errorf("cases must be a non-empty array")
	}
	translated := make([]any, 0, len(rawCases))
	for index, rawCase := range rawCases {
		record, ok := rawCase.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("cases[%d] must be an object", index)
		}
		copyOfRecord := map[string]any{}
		for key, value := range record {
			copyOfRecord[key] = value
		}
		translated = append(translated, copyOfRecord)
	}
	suite := map[string]any{
		"schemaVersion":    contracts.AppPromptTestCasesSchema,
		"suiteId":          suiteID,
		"suiteDisplayName": suiteDisplayName,
		"provider":         provider,
		"model":            model,
		"cases":            translated,
	}
	if system != "" {
		suite["system"] = system
	}
	if _, err := normalizeAppPromptTestCaseSuite(suite); err != nil {
		return nil, err
	}
	return suite, nil
}

// BuildAppPromptEvaluationSummary consumes a runner-produced
// cautilus.app_prompt_evaluation_inputs.v1 packet and emits a summary for the
// single-turn app/prompt preset. It keeps the same app-surface runtime fields as
// app/chat while requiring observed.input for the prompt I/O boundary.
func BuildAppPromptEvaluationSummary(input map[string]any, now time.Time) (map[string]any, error) {
	if input["schemaVersion"] != contracts.AppPromptEvaluationInputsSchema {
		return nil, fmt.Errorf("schemaVersion must be %s", contracts.AppPromptEvaluationInputsSchema)
	}
	suiteID, err := normalizeNonEmptyString(input["suiteId"], "suiteId")
	if err != nil {
		return nil, err
	}
	suiteDisplayName := suiteID
	if value, err := normalizeOptionalString(input["suiteDisplayName"], "suiteDisplayName"); err != nil {
		return nil, err
	} else if value != nil {
		suiteDisplayName = *value
	}
	rawEvaluations, err := assertArray(input["evaluations"], "evaluations")
	if err != nil {
		return nil, err
	}
	if len(rawEvaluations) == 0 {
		return nil, fmt.Errorf("evaluations must be a non-empty array")
	}
	counts := map[string]int{
		"total":  0,
		"passed": 0,
		"failed": 0,
	}
	evaluations := make([]any, 0, len(rawEvaluations))
	for index, rawEvaluation := range rawEvaluations {
		record, ok := rawEvaluation.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("evaluations[%d] must be an object", index)
		}
		evaluation, err := evaluateAppPromptRecord(record, index)
		if err != nil {
			return nil, err
		}
		counts["total"]++
		counts[stringOrEmpty(evaluation["status"])]++
		evaluations = append(evaluations, evaluation)
	}
	recommendation := "accept-now"
	if counts["failed"] > 0 {
		recommendation = "reject"
	}
	summary := map[string]any{
		"schemaVersion":    contracts.AppPromptEvaluationSummarySchema,
		"suiteId":          suiteID,
		"suiteDisplayName": suiteDisplayName,
		"evaluatedAt":      now.UTC().Format(time.RFC3339Nano),
		"recommendation":   recommendation,
		"evaluationCounts": map[string]any{
			"total":  counts["total"],
			"passed": counts["passed"],
			"failed": counts["failed"],
		},
		"evaluations": evaluations,
	}
	if proof := EvaluationProofFromInput(input); len(proof) > 0 {
		summary["proof"] = proof
	}
	return summary, nil
}

func evaluateAppPromptRecord(record map[string]any, index int) (map[string]any, error) {
	caseID, err := normalizeNonEmptyString(record["caseId"], fmt.Sprintf("evaluations[%d].caseId", index))
	if err != nil {
		return nil, err
	}
	displayName := caseID
	if value, err := normalizeOptionalString(record["displayName"], fmt.Sprintf("evaluations[%d].displayName", index)); err != nil {
		return nil, err
	} else if value != nil {
		displayName = *value
	}
	provider, err := normalizeNonEmptyString(record["provider"], fmt.Sprintf("evaluations[%d].provider", index))
	if err != nil {
		return nil, err
	}
	model, err := normalizeNonEmptyString(record["model"], fmt.Sprintf("evaluations[%d].model", index))
	if err != nil {
		return nil, err
	}
	harness, err := normalizeNonEmptyString(record["harness"], fmt.Sprintf("evaluations[%d].harness", index))
	if err != nil {
		return nil, err
	}
	mode, err := normalizeNonEmptyString(record["mode"], fmt.Sprintf("evaluations[%d].mode", index))
	if err != nil {
		return nil, err
	}
	if mode != "messaging" {
		return nil, fmt.Errorf("evaluations[%d].mode must be \"messaging\" for app/prompt", index)
	}
	duration, err := normalizeNonNegativeNumber(record["durationMs"], fmt.Sprintf("evaluations[%d].durationMs", index))
	if err != nil {
		return nil, err
	}
	if duration == nil {
		return nil, fmt.Errorf("evaluations[%d].durationMs is required and must be a non-negative number", index)
	}
	observed, err := normalizeAppPromptObserved(record["observed"], fmt.Sprintf("evaluations[%d].observed", index))
	if err != nil {
		return nil, err
	}
	expected, err := normalizeAppChatExpected(record["expected"], fmt.Sprintf("evaluations[%d].expected", index))
	if err != nil {
		return nil, err
	}
	status := "passed"
	summary := fmt.Sprintf("%s produced a final response under %s/%s.", displayName, provider, model)
	matched := true
	if expected != nil && expected.finalText != nil {
		if !strings.Contains(observed["finalText"].(string), *expected.finalText) {
			status = "failed"
			matched = false
			summary = fmt.Sprintf("%s final response did not contain the expected fragment under %s/%s.", displayName, provider, model)
		}
	}
	snapshotMatched := true
	if expected != nil && expected.snapshotText != nil {
		if observed["finalText"].(string) != *expected.snapshotText {
			status = "failed"
			matched = false
			snapshotMatched = false
			summary = fmt.Sprintf("%s final response did not match snapshot under %s/%s.", displayName, provider, model)
		}
	}
	result := map[string]any{
		"caseId":      caseID,
		"displayName": displayName,
		"status":      status,
		"summary":     summary,
		"provider":    provider,
		"model":       model,
		"harness":     harness,
		"mode":        mode,
		"durationMs":  int(*duration),
		"observed":    observed,
	}
	if expected != nil && expected.finalText != nil {
		result["expected"] = map[string]any{"finalText": *expected.finalText}
		result["match"] = matched
	}
	if expected != nil && expected.snapshot != nil {
		expectedPacket := map[string]any{"snapshot": *expected.snapshot}
		if expected.snapshotPath != nil {
			expectedPacket["snapshotPath"] = *expected.snapshotPath
		}
		result["expected"] = expectedPacket
		result["match"] = matched
		if !snapshotMatched {
			result["snapshotDiff"] = map[string]any{
				"kind":     "text-equality",
				"expected": *expected.snapshotText,
				"actual":   observed["finalText"].(string),
			}
		}
	}
	if value, ok := costUsdFromAny(record["costUsd"]); ok {
		result["costUsd"] = value
	}
	return result, nil
}

func normalizeAppPromptObserved(value any, field string) (map[string]any, error) {
	record, ok := value.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("%s must be an object", field)
	}
	input, err := normalizeNonEmptyString(record["input"], field+".input")
	if err != nil {
		return nil, err
	}
	observed, err := normalizeAppChatObserved(value, field)
	if err != nil {
		return nil, err
	}
	observed["input"] = input
	return observed, nil
}
