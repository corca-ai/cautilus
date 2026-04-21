package app

import (
	"fmt"
	"io"
	"strings"

	"github.com/corca-ai/cautilus/internal/contracts"
)

type workbenchPrepareBatchArgs struct {
	inputFile string
	output    *string
}

func handleWorkbenchPrepareRequestBatch(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseWorkbenchPrepareBatchArgs(args, cwd)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	input, err := readJSONObject(options.inputFile)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", options.inputFile, err)
		return 1
	}
	batch, err := buildWorkbenchBatchRequests(input)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := ensureParentDir(options.output); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeOutputResolved(stdout, options.output, batch); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if options.output != nil {
		_, _ = fmt.Fprintf(stdout, "%s\n", *options.output)
	}
	return 0
}

func parseWorkbenchPrepareBatchArgs(args []string, cwd string) (*workbenchPrepareBatchArgs, error) {
	options := &workbenchPrepareBatchArgs{}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--input", "--input-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.inputFile = resolvePath(cwd, value)
		case "--output", "--output-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.output = &resolved
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	if strings.TrimSpace(options.inputFile) == "" {
		return nil, fmt.Errorf("--input is required")
	}
	return options, nil
}

func buildWorkbenchBatchRequests(input map[string]any) (map[string]any, error) {
	scenarios, err := validateWorkbenchBatchPrepareInput(input)
	if err != nil {
		return nil, err
	}
	instanceID := anyString(input["instanceId"])
	timeoutMs := intFromAny(input["timeoutMs"], 0)
	samplesPerScenario := intFromAny(input["samplesPerScenario"], 0)
	requestIDPrefix := strings.TrimSpace(anyString(input["requestIdPrefix"]))

	requests := make([]any, 0, len(scenarios)*samplesPerScenario)
	for _, scenario := range scenarios {
		scenarioID := anyString(scenario["scenarioId"])
		for sample := 1; sample <= samplesPerScenario; sample++ {
			requestID := buildWorkbenchBatchRequestID(requestIDPrefix, scenarioID, sample, samplesPerScenario)
			request := map[string]any{
				"schemaVersion": contracts.LiveRunInvocationRequestSchema,
				"requestId":     requestID,
				"instanceId":    instanceID,
				"timeoutMs":     timeoutMs,
				"scenario": map[string]any{
					"scenarioId":      scenarioID,
					"name":            anyString(scenario["name"]),
					"description":     anyString(scenario["description"]),
					"maxTurns":        intFromAny(scenario["maxTurns"], 0),
					"sideEffectsMode": anyString(scenario["sideEffectsMode"]),
					"simulator":       scenario["simulator"],
				},
			}
			if captureTranscript, ok := input["captureTranscript"].(bool); ok {
				request["captureTranscript"] = captureTranscript
			}
			if metadata := input["consumerMetadata"]; metadata != nil {
				request["consumerMetadata"] = metadata
			}
			if operatorNote := strings.TrimSpace(anyString(input["operatorNote"])); operatorNote != "" {
				request["operatorNote"] = operatorNote
			}
			if intentProfile := scenario["intentProfile"]; intentProfile != nil {
				mapOrEmpty(request["scenario"])["intentProfile"] = intentProfile
			}
			requests = append(requests, request)
		}
	}
	return map[string]any{
		"schemaVersion": contracts.LiveRunInvocationBatchRequestSchema,
		"instanceId":    instanceID,
		"requests":      requests,
	}, nil
}

func validateWorkbenchBatchPrepareInput(input map[string]any) ([]map[string]any, error) {
	if anyString(input["schemaVersion"]) != contracts.LiveRunInvocationBatchPrepareInputSchema {
		return nil, fmt.Errorf("batch prepare input must use schemaVersion %s", contracts.LiveRunInvocationBatchPrepareInputSchema)
	}
	if strings.TrimSpace(anyString(input["instanceId"])) == "" {
		return nil, fmt.Errorf("batch prepare input.instanceId must be a non-empty string")
	}
	if intFromAny(input["timeoutMs"], 0) <= 0 {
		return nil, fmt.Errorf("batch prepare input.timeoutMs must be a positive integer")
	}
	if intFromAny(input["samplesPerScenario"], 0) <= 0 {
		return nil, fmt.Errorf("batch prepare input.samplesPerScenario must be a positive integer")
	}
	if requestIDPrefix, ok := input["requestIdPrefix"]; ok && strings.TrimSpace(anyString(requestIDPrefix)) == "" {
		return nil, fmt.Errorf("batch prepare input.requestIdPrefix must be a non-empty string when present")
	}
	if metadata := input["consumerMetadata"]; metadata != nil {
		if _, ok := metadata.(map[string]any); !ok {
			return nil, fmt.Errorf("batch prepare input.consumerMetadata must be an object when present")
		}
	}
	selectedIDs := map[string]struct{}{}
	if rawIDs := input["scenarioIds"]; rawIDs != nil {
		ids := arrayOrEmpty(rawIDs)
		if len(ids) == 0 {
			return nil, fmt.Errorf("batch prepare input.scenarioIds must contain at least one scenario id when present")
		}
		for index, raw := range ids {
			scenarioID := strings.TrimSpace(anyString(raw))
			if scenarioID == "" {
				return nil, fmt.Errorf("batch prepare input.scenarioIds[%d] must be a non-empty string", index)
			}
			selectedIDs[scenarioID] = struct{}{}
		}
	}
	rawScenarios := arrayOrEmpty(input["scenarios"])
	if len(rawScenarios) == 0 {
		return nil, fmt.Errorf("batch prepare input.scenarios must contain at least one draft scenario")
	}
	scenarios := make([]map[string]any, 0, len(rawScenarios))
	seenScenarioIDs := map[string]struct{}{}
	for index, raw := range rawScenarios {
		scenario := mapOrEmpty(raw)
		if anyString(scenario["schemaVersion"]) != contracts.DraftScenarioSchema {
			return nil, fmt.Errorf("scenarios[%d] must use schemaVersion %s", index, contracts.DraftScenarioSchema)
		}
		if err := validateWorkbenchLiveScenario(scenario); err != nil {
			return nil, fmt.Errorf("scenarios[%d]: %w", index, err)
		}
		scenarioID := anyString(scenario["scenarioId"])
		if _, exists := seenScenarioIDs[scenarioID]; exists {
			return nil, fmt.Errorf("scenarios[%d].scenarioId %q is duplicated", index, scenarioID)
		}
		seenScenarioIDs[scenarioID] = struct{}{}
		if len(selectedIDs) > 0 {
			if _, keep := selectedIDs[scenarioID]; !keep {
				continue
			}
		}
		scenarios = append(scenarios, scenario)
	}
	if len(selectedIDs) > 0 {
		for scenarioID := range selectedIDs {
			if _, ok := seenScenarioIDs[scenarioID]; !ok {
				return nil, fmt.Errorf("batch prepare input.scenarioIds includes %q, but that scenario was not present in input.scenarios", scenarioID)
			}
		}
	}
	if len(scenarios) == 0 {
		return nil, fmt.Errorf("batch prepare input selected zero scenarios")
	}
	return scenarios, nil
}

func buildWorkbenchBatchRequestID(prefix string, scenarioID string, sample int, totalSamples int) string {
	base := scenarioID
	if prefix != "" {
		base = prefix + "--" + scenarioID
	}
	if totalSamples <= 1 {
		return base
	}
	return fmt.Sprintf("%s--sample-%02d", base, sample)
}
