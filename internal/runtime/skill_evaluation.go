package runtime

import (
	"fmt"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

type skillEvaluationCase struct {
	evaluationID    string
	targetKind      string
	targetID        string
	displayName     string
	evaluationKind  string
	prompt          string
	startedAt       string
	summary         string
	invoked         bool
	expectedTrigger *string
	outcome         *string
	blockerKind     *string
	artifactRefs    []any
	metrics         map[string]any
	thresholds      map[string]any
	intentProfile   map[string]any
}

func BuildSkillEvaluationSummary(input map[string]any, now time.Time) (map[string]any, error) {
	if input["schemaVersion"] != contracts.SkillEvaluationInputsSchema {
		return nil, fmt.Errorf("schemaVersion must be %s", contracts.SkillEvaluationInputsSchema)
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
	rawEvaluations, err := assertArray(input["evaluations"], "evaluations")
	if err != nil {
		return nil, err
	}
	if len(rawEvaluations) == 0 {
		return nil, fmt.Errorf("evaluations must be a non-empty array")
	}

	counts := map[string]int{
		"total":     0,
		"passed":    0,
		"failed":    0,
		"degraded":  0,
		"blocked":   0,
		"trigger":   0,
		"execution": 0,
	}
	evaluations := make([]any, 0, len(rawEvaluations))
	evaluationRuns := make([]any, 0, len(rawEvaluations))

	for index, rawEvaluation := range rawEvaluations {
		record, ok := rawEvaluation.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("evaluations[%d] must be an object", index)
		}
		evaluation, err := normalizeSkillEvaluationCase(record, index, now)
		if err != nil {
			return nil, err
		}
		result, err := evaluateSkillEvaluationCase(evaluation)
		if err != nil {
			return nil, err
		}
		status := stringOrEmpty(result["status"])
		evaluations = append(evaluations, result["evaluation"])
		evaluationRuns = append(evaluationRuns, result["evaluationRun"])
		counts["total"]++
		counts[status]++
		counts[evaluation.evaluationKind]++
	}

	recommendation := "accept-now"
	if counts["failed"] > 0 {
		recommendation = "reject"
	} else if counts["degraded"] > 0 || counts["blocked"] > 0 {
		recommendation = "defer"
	}

	return map[string]any{
		"schemaVersion":    contracts.SkillEvaluationSummarySchema,
		"skillId":          skillID,
		"skillDisplayName": skillDisplayName,
		"evaluatedAt":      now.UTC().Format(time.RFC3339Nano),
		"recommendation":   recommendation,
		"evaluationCounts": map[string]any{
			"total":     counts["total"],
			"passed":    counts["passed"],
			"failed":    counts["failed"],
			"degraded":  counts["degraded"],
			"blocked":   counts["blocked"],
			"trigger":   counts["trigger"],
			"execution": counts["execution"],
		},
		"evaluations":    evaluations,
		"evaluationRuns": evaluationRuns,
	}, nil
}

func normalizeSkillEvaluationCase(input map[string]any, index int, now time.Time) (*skillEvaluationCase, error) {
	targetKind, err := normalizeNonEmptyString(input["targetKind"], fmt.Sprintf("evaluations[%d].targetKind", index))
	if err != nil {
		return nil, err
	}
	if !containsString([]string{"public_skill", "profile", "integration"}, targetKind) {
		return nil, fmt.Errorf("evaluations[%d].targetKind must be one of: public_skill, profile, integration", index)
	}
	evaluationKind, err := normalizeNonEmptyString(input["evaluationKind"], fmt.Sprintf("evaluations[%d].evaluationKind", index))
	if err != nil {
		return nil, err
	}
	if !containsString([]string{"trigger", "execution"}, evaluationKind) {
		return nil, fmt.Errorf("evaluations[%d].evaluationKind must be one of: trigger, execution", index)
	}
	evaluationID, err := normalizeNonEmptyString(input["evaluationId"], fmt.Sprintf("evaluations[%d].evaluationId", index))
	if err != nil {
		return nil, err
	}
	targetID, err := normalizeNonEmptyString(input["targetId"], fmt.Sprintf("evaluations[%d].targetId", index))
	if err != nil {
		return nil, err
	}
	displayName := targetID
	if value, err := normalizeOptionalString(input["displayName"], fmt.Sprintf("evaluations[%d].displayName", index)); err != nil {
		return nil, err
	} else if value != nil {
		displayName = *value
	}
	prompt, err := normalizeNonEmptyString(input["prompt"], fmt.Sprintf("evaluations[%d].prompt", index))
	if err != nil {
		return nil, err
	}
	startedAt, err := normalizeSkillEvaluationTimestamp(input["startedAt"], fmt.Sprintf("evaluations[%d].startedAt", index))
	if err != nil {
		return nil, err
	}
	if startedAt == nil {
		value := now.UTC().Format(time.RFC3339Nano)
		startedAt = &value
	}
	summary, err := normalizeNonEmptyString(input["summary"], fmt.Sprintf("evaluations[%d].summary", index))
	if err != nil {
		return nil, err
	}
	invoked, ok := input["invoked"].(bool)
	if !ok {
		return nil, fmt.Errorf("evaluations[%d].invoked must be a boolean", index)
	}
	expectedTrigger, err := normalizeOptionalString(input["expectedTrigger"], fmt.Sprintf("evaluations[%d].expectedTrigger", index))
	if err != nil {
		return nil, err
	}
	outcome, err := normalizeOptionalString(input["outcome"], fmt.Sprintf("evaluations[%d].outcome", index))
	if err != nil {
		return nil, err
	}
	blockerKind, err := normalizeOptionalString(input["blockerKind"], fmt.Sprintf("evaluations[%d].blockerKind", index))
	if err != nil {
		return nil, err
	}
	artifactRefs, err := normalizeSkillArtifactRefs(input["artifactRefs"], fmt.Sprintf("evaluations[%d].artifactRefs", index))
	if err != nil {
		return nil, err
	}
	metrics, err := normalizeSkillNumberObject(
		input["metrics"],
		fmt.Sprintf("evaluations[%d].metrics", index),
		map[string]bool{
			"total_tokens": true,
			"duration_ms":  true,
			"cost_usd":     false,
		},
	)
	if err != nil {
		return nil, err
	}
	thresholds, err := normalizeSkillNumberObject(
		input["thresholds"],
		fmt.Sprintf("evaluations[%d].thresholds", index),
		map[string]bool{
			"max_total_tokens": true,
			"max_duration_ms":  true,
			"max_cost_usd":     false,
		},
	)
	if err != nil {
		return nil, err
	}

	return &skillEvaluationCase{
		evaluationID:    evaluationID,
		targetKind:      targetKind,
		targetID:        targetID,
		displayName:     displayName,
		evaluationKind:  evaluationKind,
		prompt:          prompt,
		startedAt:       *startedAt,
		summary:         summary,
		invoked:         invoked,
		expectedTrigger: expectedTrigger,
		outcome:         outcome,
		blockerKind:     blockerKind,
		artifactRefs:    artifactRefs,
		metrics:         metrics,
		thresholds:      thresholds,
		intentProfile:   asMap(input["intentProfile"]),
	}, nil
}

func normalizeSkillEvaluationTimestamp(value any, field string) (*string, error) {
	if value == nil {
		return nil, nil
	}
	text, err := normalizeNonEmptyString(value, field)
	if err != nil {
		return nil, err
	}
	if _, err := time.Parse(time.RFC3339Nano, text); err != nil {
		return nil, fmt.Errorf("%s must be a valid ISO timestamp", field)
	}
	return &text, nil
}

func normalizeSkillArtifactRefs(value any, field string) ([]any, error) {
	items, err := assertArray(value, field)
	if err != nil {
		return nil, err
	}
	normalized := make([]any, 0, len(items))
	for index, item := range items {
		record, ok := item.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("%s[%d] must be an object", field, index)
		}
		kind, err := normalizeNonEmptyString(record["kind"], fmt.Sprintf("%s[%d].kind", field, index))
		if err != nil {
			return nil, err
		}
		path, err := normalizeNonEmptyString(record["path"], fmt.Sprintf("%s[%d].path", field, index))
		if err != nil {
			return nil, err
		}
		normalized = append(normalized, map[string]any{
			"kind": kind,
			"path": path,
		})
	}
	return normalized, nil
}

func normalizeSkillNumberObject(value any, field string, integerFields map[string]bool) (map[string]any, error) {
	record := asMap(value)
	if value != nil && len(record) == 0 {
		return nil, fmt.Errorf("%s must be an object", field)
	}
	result := map[string]any{}
	for key, expectInteger := range integerFields {
		number, err := normalizeNonNegativeNumber(record[key], fmt.Sprintf("%s.%s", field, key))
		if err != nil {
			return nil, err
		}
		if number == nil {
			continue
		}
		if expectInteger {
			result[key] = int(*number)
		} else {
			result[key] = round12(*number)
		}
	}
	if len(result) == 0 {
		return nil, nil
	}
	return result, nil
}

func evaluateSkillEvaluationCase(evaluation *skillEvaluationCase) (map[string]any, error) {
	switch evaluation.evaluationKind {
	case "trigger":
		return evaluateSkillTriggerCase(evaluation)
	case "execution":
		return evaluateSkillExecutionCase(evaluation)
	default:
		return nil, fmt.Errorf("unknown evaluationKind: %s", evaluation.evaluationKind)
	}
}

func evaluateSkillTriggerCase(evaluation *skillEvaluationCase) (map[string]any, error) {
	if evaluation.expectedTrigger == nil || !containsString([]string{"must_invoke", "must_not_invoke"}, *evaluation.expectedTrigger) {
		return nil, fmt.Errorf("trigger evaluations must use expectedTrigger must_invoke or must_not_invoke")
	}
	passed := (*evaluation.expectedTrigger == "must_invoke" && evaluation.invoked) ||
		(*evaluation.expectedTrigger == "must_not_invoke" && !evaluation.invoked)
	status := "passed"
	summary := evaluation.summary
	if !passed {
		status = "failed"
		if *evaluation.expectedTrigger == "must_invoke" {
			summary = fmt.Sprintf("%s The prompt should have triggered %s, but no invocation was observed.", evaluation.summary, evaluation.displayName)
		} else {
			summary = fmt.Sprintf("%s The prompt should have stayed outside %s, but an invocation was observed.", evaluation.summary, evaluation.displayName)
		}
	}
	intentProfile, err := BuildBehaviorIntentProfile(
		fmt.Sprintf("%s should trigger only when the prompt truly needs the skill.", evaluation.displayName),
		evaluation.intentProfile,
		BehaviorSurfaces["SKILL_TRIGGER_SELECTION"],
		[]string{BehaviorDimensions["SKILL_TRIGGER_ACCURACY"]},
		nil,
	)
	if err != nil {
		return nil, err
	}
	return buildEvaluatedSkillResult(evaluation, "trigger_selection", status, summary, nil, intentProfile), nil
}

func evaluateSkillExecutionCase(evaluation *skillEvaluationCase) (map[string]any, error) {
	if evaluation.outcome == nil || !containsString([]string{"passed", "failed", "degraded", "blocked"}, *evaluation.outcome) {
		return nil, fmt.Errorf("execution evaluations must use outcome passed, failed, degraded, or blocked")
	}
	successDimensions := []string{BehaviorDimensions["SKILL_TASK_FIDELITY"]}
	if evaluation.thresholds != nil {
		successDimensions = append(successDimensions, BehaviorDimensions["RUNTIME_BUDGET_RESPECT"])
	}
	intentProfile, err := BuildBehaviorIntentProfile(
		fmt.Sprintf("%s should complete the intended task cleanly once the skill is invoked.", evaluation.displayName),
		evaluation.intentProfile,
		BehaviorSurfaces["SKILL_EXECUTION_QUALITY"],
		successDimensions,
		nil,
	)
	if err != nil {
		return nil, err
	}
	if !evaluation.invoked {
		return buildEvaluatedSkillResult(
			evaluation,
			"execution_quality",
			"failed",
			fmt.Sprintf("%s The execution case never invoked the skill, so the task could not complete on the intended surface.", evaluation.summary),
			nil,
			intentProfile,
		), nil
	}

	status := *evaluation.outcome
	summary := evaluation.summary
	findings := thresholdFindings(evaluation.metrics, evaluation.thresholds)
	if status == "passed" && len(findings) > 0 {
		status = "degraded"
		parts := make([]string, 0, len(findings))
		for _, finding := range findings {
			record := asMap(finding)
			parts = append(parts, fmt.Sprintf("%s=%v > %v", record["metric"], record["actual"], record["limit"]))
		}
		summary = fmt.Sprintf("%s Runtime budgets were exceeded for %s.", evaluation.summary, strings.Join(parts, ", "))
	}
	return buildEvaluatedSkillResult(evaluation, "execution_quality", status, summary, findings, intentProfile), nil
}

func thresholdFindings(metrics map[string]any, thresholds map[string]any) []any {
	if metrics == nil || thresholds == nil {
		return nil
	}
	findings := []any{}
	for _, pair := range []struct {
		metric    string
		threshold string
	}{
		{metric: "total_tokens", threshold: "max_total_tokens"},
		{metric: "duration_ms", threshold: "max_duration_ms"},
		{metric: "cost_usd", threshold: "max_cost_usd"},
	} {
		actual, actualOK := toFloat(metrics[pair.metric])
		limit, limitOK := toFloat(thresholds[pair.threshold])
		if !actualOK || !limitOK {
			continue
		}
		if actual > limit {
			findings = append(findings, map[string]any{
				"metric": pair.metric,
				"actual": metrics[pair.metric],
				"limit":  thresholds[pair.threshold],
			})
		}
	}
	return findings
}

func buildEvaluatedSkillResult(
	evaluation *skillEvaluationCase,
	surface string,
	status string,
	summary string,
	findings []any,
	intentProfile *BehaviorIntentProfile,
) map[string]any {
	evaluationPayload := map[string]any{
		"evaluationId":   evaluation.evaluationID,
		"targetKind":     evaluation.targetKind,
		"targetId":       evaluation.targetID,
		"displayName":    evaluation.displayName,
		"evaluationKind": evaluation.evaluationKind,
		"surface":        surface,
		"status":         status,
		"startedAt":      evaluation.startedAt,
		"prompt":         evaluation.prompt,
		"summary":        summary,
		"invoked":        evaluation.invoked,
		"intentProfile":  anyFromProfileMust(intentProfile, nil),
	}
	if evaluation.expectedTrigger != nil {
		evaluationPayload["expectedTrigger"] = *evaluation.expectedTrigger
	}
	if evaluation.blockerKind != nil {
		evaluationPayload["blockerKind"] = *evaluation.blockerKind
	}
	if evaluation.metrics != nil {
		evaluationPayload["metrics"] = evaluation.metrics
	}
	if evaluation.thresholds != nil {
		evaluationPayload["thresholds"] = evaluation.thresholds
	}
	if len(findings) > 0 {
		evaluationPayload["thresholdFindings"] = findings
	}
	if len(evaluation.artifactRefs) > 0 {
		evaluationPayload["artifactRefs"] = evaluation.artifactRefs
	}

	evaluationRun := map[string]any{
		"targetKind":     evaluation.targetKind,
		"targetId":       evaluation.targetID,
		"displayName":    evaluation.displayName,
		"evaluationKind": evaluation.evaluationKind,
		"surface":        surface,
		"startedAt":      evaluation.startedAt,
		"status":         status,
		"summary":        summary,
		"intentProfile":  anyFromProfileMust(intentProfile, nil),
	}
	if evaluation.blockerKind != nil {
		evaluationRun["blockerKind"] = *evaluation.blockerKind
	}
	if evaluation.metrics != nil {
		evaluationRun["metrics"] = evaluation.metrics
	}
	if len(evaluation.artifactRefs) > 0 {
		evaluationRun["artifactRefs"] = evaluation.artifactRefs
	}
	return map[string]any{
		"status":        status,
		"evaluation":    evaluationPayload,
		"evaluationRun": evaluationRun,
	}
}
