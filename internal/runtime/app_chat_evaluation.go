package runtime

import (
	"fmt"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

type appChatMessage struct {
	role    string
	content string
}

type appChatTestCase struct {
	caseID      string
	displayName string
	provider    string
	model       string
	system      string
	messages    []appChatMessage
	expected    *appChatExpected
}

type appChatExpected struct {
	finalText *string
}

type appChatTestCaseSuite struct {
	suiteID          string
	suiteDisplayName string
	provider         string
	model            string
	system           string
	cases            []appChatTestCase
}

// normalizeAppChatTestCaseSuite validates a translated app/chat test-case suite.
// It is exported indirectly through translateAppChatFixture; the schema is
// cautilus.app_chat_test_cases.v1.
func normalizeAppChatTestCaseSuite(input map[string]any) (*appChatTestCaseSuite, error) {
	if input["schemaVersion"] != contracts.AppChatTestCasesSchema {
		return nil, fmt.Errorf("schemaVersion must be %s", contracts.AppChatTestCasesSchema)
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
	cases := make([]appChatTestCase, 0, len(rawCases))
	for index, rawCase := range rawCases {
		record, ok := rawCase.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("cases[%d] must be an object", index)
		}
		normalized, err := normalizeAppChatCase(record, index, provider, model, system)
		if err != nil {
			return nil, err
		}
		cases = append(cases, *normalized)
	}
	return &appChatTestCaseSuite{
		suiteID:          suiteID,
		suiteDisplayName: suiteDisplayName,
		provider:         provider,
		model:            model,
		system:           system,
		cases:            cases,
	}, nil
}

func normalizeAppChatCase(record map[string]any, index int, suiteProvider string, suiteModel string, suiteSystem string) (*appChatTestCase, error) {
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
	messages, err := normalizeAppChatMessages(record["messages"], fmt.Sprintf("cases[%d].messages", index))
	if err != nil {
		return nil, err
	}
	expected, err := normalizeAppChatExpected(record["expected"], fmt.Sprintf("cases[%d].expected", index))
	if err != nil {
		return nil, err
	}
	return &appChatTestCase{
		caseID:      caseID,
		displayName: displayName,
		provider:    provider,
		model:       model,
		system:      system,
		messages:    messages,
		expected:    expected,
	}, nil
}

func normalizeAppChatMessages(value any, field string) ([]appChatMessage, error) {
	items, err := assertArray(value, field)
	if err != nil {
		return nil, err
	}
	if len(items) == 0 {
		return nil, fmt.Errorf("%s must be a non-empty array", field)
	}
	messages := make([]appChatMessage, 0, len(items))
	for index, item := range items {
		record, ok := item.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("%s[%d] must be an object", field, index)
		}
		role, err := normalizeNonEmptyString(record["role"], fmt.Sprintf("%s[%d].role", field, index))
		if err != nil {
			return nil, err
		}
		if !containsString([]string{"user", "assistant"}, role) {
			return nil, fmt.Errorf("%s[%d].role must be one of: user, assistant", field, index)
		}
		content, err := normalizeNonEmptyString(record["content"], fmt.Sprintf("%s[%d].content", field, index))
		if err != nil {
			return nil, err
		}
		messages = append(messages, appChatMessage{role: role, content: content})
	}
	if messages[len(messages)-1].role != "user" {
		return nil, fmt.Errorf("%s must end with a user role so the runner has something to send", field)
	}
	return messages, nil
}

func normalizeAppChatExpected(value any, field string) (*appChatExpected, error) {
	if value == nil {
		return nil, nil
	}
	record, ok := value.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("%s must be an object", field)
	}
	if _, snapshot := record["snapshot"]; snapshot {
		return nil, fmt.Errorf("%s.snapshot is reserved for a future composition slice (C4)", field)
	}
	expected := &appChatExpected{}
	if value, err := normalizeOptionalString(record["finalText"], field+".finalText"); err != nil {
		return nil, err
	} else if value != nil {
		expected.finalText = value
	}
	if expected.finalText == nil {
		return nil, fmt.Errorf("%s must declare finalText (other expectation kinds land in later slices)", field)
	}
	return expected, nil
}

func translateAppChatFixture(input map[string]any, suiteID string, suiteDisplayName string) (map[string]any, error) {
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
		"schemaVersion":    contracts.AppChatTestCasesSchema,
		"suiteId":          suiteID,
		"suiteDisplayName": suiteDisplayName,
		"provider":         provider,
		"model":            model,
		"cases":            translated,
	}
	if system != "" {
		suite["system"] = system
	}
	if _, err := normalizeAppChatTestCaseSuite(suite); err != nil {
		return nil, err
	}
	return suite, nil
}

// BuildAppChatEvaluationSummary consumes a runner-produced
// cautilus.app_chat_evaluation_inputs.v1 packet and emits a summary that
// honours the cross-runtime equivalence rules from
// docs/specs/evaluation-surfaces.spec.md § Result packet:
// provider, model, harness, mode, durationMs, observed.messages, and
// observed.finalText must be present and non-empty on every harness.
func BuildAppChatEvaluationSummary(input map[string]any, now time.Time) (map[string]any, error) {
	if input["schemaVersion"] != contracts.AppChatEvaluationInputsSchema {
		return nil, fmt.Errorf("schemaVersion must be %s", contracts.AppChatEvaluationInputsSchema)
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
		evaluation, err := evaluateAppChatRecord(record, index)
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
		"schemaVersion":    contracts.AppChatEvaluationSummarySchema,
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

func evaluateAppChatRecord(record map[string]any, index int) (map[string]any, error) {
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
		return nil, fmt.Errorf("evaluations[%d].mode must be \"messaging\" for app/chat", index)
	}
	duration, err := normalizeNonNegativeNumber(record["durationMs"], fmt.Sprintf("evaluations[%d].durationMs", index))
	if err != nil {
		return nil, err
	}
	if duration == nil {
		return nil, fmt.Errorf("evaluations[%d].durationMs is required and must be a non-negative number", index)
	}
	observed, err := normalizeAppChatObserved(record["observed"], fmt.Sprintf("evaluations[%d].observed", index))
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
	if value, ok := costUsdFromAny(record["costUsd"]); ok {
		result["costUsd"] = value
	}
	return result, nil
}

func normalizeAppChatObserved(value any, field string) (map[string]any, error) {
	record, ok := value.(map[string]any)
	if !ok {
		return nil, fmt.Errorf("%s must be an object", field)
	}
	rawMessages, err := assertArray(record["messages"], field+".messages")
	if err != nil {
		return nil, err
	}
	if len(rawMessages) == 0 {
		return nil, fmt.Errorf("%s.messages must be a non-empty array", field)
	}
	messages := make([]any, 0, len(rawMessages))
	for index, item := range rawMessages {
		entry, ok := item.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("%s.messages[%d] must be an object", field, index)
		}
		role, err := normalizeNonEmptyString(entry["role"], fmt.Sprintf("%s.messages[%d].role", field, index))
		if err != nil {
			return nil, err
		}
		content, err := normalizeNonEmptyString(entry["content"], fmt.Sprintf("%s.messages[%d].content", field, index))
		if err != nil {
			return nil, err
		}
		messages = append(messages, map[string]any{"role": role, "content": content})
	}
	finalText, err := normalizeNonEmptyString(record["finalText"], field+".finalText")
	if err != nil {
		return nil, err
	}
	return map[string]any{
		"messages":  messages,
		"finalText": finalText,
	}, nil
}

func costUsdFromAny(value any) (float64, bool) {
	number, ok := toFloat(value)
	if !ok {
		return 0, false
	}
	return round12(number), true
}
