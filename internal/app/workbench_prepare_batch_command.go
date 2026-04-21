package app

import (
	"fmt"
	"io"
	"slices"
	"strings"

	"github.com/corca-ai/cautilus/internal/contracts"
)

type workbenchPrepareBatchArgs struct {
	inputFile string
	output    *string
}

type workbenchBatchPrepareSpec struct {
	instanceID         string
	timeoutMs          int
	samplesPerScenario int
	requestIDPrefix    string
	captureTranscript  *bool
	consumerMetadata   map[string]any
	operatorNote       string
	scenarios          []map[string]any
	retryPolicy        map[string]any
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
	spec, err := normalizeWorkbenchBatchPrepareSpec(input)
	if err != nil {
		return nil, err
	}
	requests := make([]any, 0, len(spec.scenarios)*spec.samplesPerScenario)
	for _, scenario := range spec.scenarios {
		scenarioID := anyString(scenario["scenarioId"])
		for sample := 1; sample <= spec.samplesPerScenario; sample++ {
			requestID := buildWorkbenchBatchRequestID(spec.requestIDPrefix, scenarioID, sample, spec.samplesPerScenario)
			request := map[string]any{
				"schemaVersion": contracts.LiveRunInvocationRequestSchema,
				"requestId":     requestID,
				"instanceId":    spec.instanceID,
				"timeoutMs":     spec.timeoutMs,
				"scenario": map[string]any{
					"scenarioId":      scenarioID,
					"name":            anyString(scenario["name"]),
					"description":     anyString(scenario["description"]),
					"maxTurns":        intFromAny(scenario["maxTurns"], 0),
					"sideEffectsMode": anyString(scenario["sideEffectsMode"]),
					"simulator":       scenario["simulator"],
				},
			}
			if spec.captureTranscript != nil {
				request["captureTranscript"] = *spec.captureTranscript
			}
			if len(spec.consumerMetadata) > 0 {
				request["consumerMetadata"] = spec.consumerMetadata
			}
			if spec.operatorNote != "" {
				request["operatorNote"] = spec.operatorNote
			}
			if intentProfile := scenario["intentProfile"]; intentProfile != nil {
				mapOrEmpty(request["scenario"])["intentProfile"] = intentProfile
			}
			requests = append(requests, request)
		}
	}
	packet := map[string]any{
		"schemaVersion": contracts.LiveRunInvocationBatchRequestSchema,
		"instanceId":    spec.instanceID,
		"requests":      requests,
	}
	if len(spec.retryPolicy) > 0 {
		packet["retryPolicy"] = spec.retryPolicy
	}
	return packet, nil
}

func normalizeWorkbenchBatchPrepareSpec(input map[string]any) (*workbenchBatchPrepareSpec, error) {
	spec := &workbenchBatchPrepareSpec{
		instanceID:         anyString(input["instanceId"]),
		timeoutMs:          intFromAny(input["timeoutMs"], 0),
		samplesPerScenario: intFromAny(input["samplesPerScenario"], 0),
		requestIDPrefix:    strings.TrimSpace(anyString(input["requestIdPrefix"])),
		operatorNote:       strings.TrimSpace(anyString(input["operatorNote"])),
	}
	if captureTranscript, ok := input["captureTranscript"].(bool); ok {
		spec.captureTranscript = &captureTranscript
	}
	if metadata := input["consumerMetadata"]; metadata != nil {
		spec.consumerMetadata = mapOrEmpty(metadata)
	}
	retryPolicy, err := validateWorkbenchBatchRetryPolicy(input["retryPolicy"], "batch prepare input.retryPolicy")
	if err != nil {
		return nil, err
	}
	spec.retryPolicy = retryPolicy
	switch anyString(input["schemaVersion"]) {
	case contracts.LiveRunInvocationBatchPrepareInputSchema:
		scenarios, err := validateWorkbenchBatchPrepareInput(input)
		if err != nil {
			return nil, err
		}
		spec.scenarios = scenarios
	case contracts.LiveRunInvocationBatchPrepareCatalogInputSchema:
		scenarios, err := validateWorkbenchBatchPrepareCatalogInput(input)
		if err != nil {
			return nil, err
		}
		spec.scenarios = scenarios
	default:
		return nil, fmt.Errorf(
			"batch prepare input must use schemaVersion %s or %s",
			contracts.LiveRunInvocationBatchPrepareInputSchema,
			contracts.LiveRunInvocationBatchPrepareCatalogInputSchema,
		)
	}
	return spec, nil
}

func validateWorkbenchBatchPrepareInput(input map[string]any) ([]map[string]any, error) {
	if err := validateWorkbenchBatchPrepareCommonFields(input, contracts.LiveRunInvocationBatchPrepareInputSchema); err != nil {
		return nil, err
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

func validateWorkbenchBatchPrepareCatalogInput(input map[string]any) ([]map[string]any, error) {
	if err := validateWorkbenchBatchPrepareCommonFields(input, contracts.LiveRunInvocationBatchPrepareCatalogInputSchema); err != nil {
		return nil, err
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
	requiredTags := []string{}
	if rawTags := input["requiredTags"]; rawTags != nil {
		tags := arrayOrEmpty(rawTags)
		if len(tags) == 0 {
			return nil, fmt.Errorf("batch prepare input.requiredTags must contain at least one tag when present")
		}
		seenTags := map[string]struct{}{}
		for index, raw := range tags {
			tag := strings.TrimSpace(anyString(raw))
			if tag == "" {
				return nil, fmt.Errorf("batch prepare input.requiredTags[%d] must be a non-empty string", index)
			}
			if _, exists := seenTags[tag]; exists {
				continue
			}
			seenTags[tag] = struct{}{}
			requiredTags = append(requiredTags, tag)
		}
	}
	rawCandidates := arrayOrEmpty(input["scenarioCandidates"])
	if len(rawCandidates) == 0 {
		return nil, fmt.Errorf("batch prepare input.scenarioCandidates must contain at least one normalized scenario candidate")
	}
	scenarios := make([]map[string]any, 0, len(rawCandidates))
	seenScenarioIDs := map[string]struct{}{}
	for index, raw := range rawCandidates {
		candidate := mapOrEmpty(raw)
		scenario, tags, err := normalizeWorkbenchBatchPrepareCatalogCandidate(candidate, index)
		if err != nil {
			return nil, err
		}
		scenarioID := anyString(scenario["scenarioId"])
		if _, exists := seenScenarioIDs[scenarioID]; exists {
			return nil, fmt.Errorf("scenarioCandidates[%d].scenarioId %q is duplicated", index, scenarioID)
		}
		seenScenarioIDs[scenarioID] = struct{}{}
		if len(selectedIDs) > 0 {
			if _, keep := selectedIDs[scenarioID]; !keep {
				continue
			}
		}
		if len(requiredTags) > 0 && !workbenchScenarioCandidateHasAllTags(tags, requiredTags) {
			continue
		}
		scenarios = append(scenarios, scenario)
	}
	if len(selectedIDs) > 0 {
		for scenarioID := range selectedIDs {
			if _, ok := seenScenarioIDs[scenarioID]; !ok {
				return nil, fmt.Errorf("batch prepare input.scenarioIds includes %q, but that candidate was not present in input.scenarioCandidates", scenarioID)
			}
		}
	}
	if len(scenarios) == 0 {
		return nil, fmt.Errorf("batch prepare input selected zero scenarios")
	}
	return scenarios, nil
}

func validateWorkbenchBatchPrepareCommonFields(input map[string]any, expectedSchema string) error {
	if anyString(input["schemaVersion"]) != expectedSchema {
		return fmt.Errorf("batch prepare input must use schemaVersion %s", expectedSchema)
	}
	if strings.TrimSpace(anyString(input["instanceId"])) == "" {
		return fmt.Errorf("batch prepare input.instanceId must be a non-empty string")
	}
	if intFromAny(input["timeoutMs"], 0) <= 0 {
		return fmt.Errorf("batch prepare input.timeoutMs must be a positive integer")
	}
	if intFromAny(input["samplesPerScenario"], 0) <= 0 {
		return fmt.Errorf("batch prepare input.samplesPerScenario must be a positive integer")
	}
	if requestIDPrefix, ok := input["requestIdPrefix"]; ok && strings.TrimSpace(anyString(requestIDPrefix)) == "" {
		return fmt.Errorf("batch prepare input.requestIdPrefix must be a non-empty string when present")
	}
	if metadata := input["consumerMetadata"]; metadata != nil {
		if _, ok := metadata.(map[string]any); !ok {
			return fmt.Errorf("batch prepare input.consumerMetadata must be an object when present")
		}
	}
	return nil
}

func normalizeWorkbenchBatchPrepareCatalogCandidate(candidate map[string]any, index int) (map[string]any, []string, error) {
	path := fmt.Sprintf("scenarioCandidates[%d]", index)
	scenario := map[string]any{
		"scenarioId":      anyString(candidate["scenarioId"]),
		"name":            anyString(candidate["name"]),
		"description":     anyString(candidate["description"]),
		"maxTurns":        intFromAny(candidate["maxTurns"], 0),
		"sideEffectsMode": anyString(candidate["sideEffectsMode"]),
	}
	if simulator := candidate["simulator"]; simulator != nil {
		scenario["simulator"] = simulator
	}
	if simulatorTurns := candidate["simulatorTurns"]; simulatorTurns != nil {
		scenario["simulatorTurns"] = simulatorTurns
	}
	if intentProfile := candidate["intentProfile"]; intentProfile != nil {
		scenario["intentProfile"] = intentProfile
	}
	if err := validateWorkbenchLiveScenario(scenario); err != nil {
		return nil, nil, fmt.Errorf("%s: %w", path, err)
	}
	rawTags := candidate["tags"]
	if rawTags == nil {
		return scenario, nil, nil
	}
	tags := arrayOrEmpty(rawTags)
	normalized := make([]string, 0, len(tags))
	for tagIndex, raw := range tags {
		tag := strings.TrimSpace(anyString(raw))
		if tag == "" {
			return nil, nil, fmt.Errorf("%s.tags[%d] must be a non-empty string", path, tagIndex)
		}
		if slices.Contains(normalized, tag) {
			continue
		}
		normalized = append(normalized, tag)
	}
	return scenario, normalized, nil
}

func workbenchScenarioCandidateHasAllTags(candidateTags []string, requiredTags []string) bool {
	if len(requiredTags) == 0 {
		return true
	}
	if len(candidateTags) == 0 {
		return false
	}
	for _, tag := range requiredTags {
		if !slices.Contains(candidateTags, tag) {
			return false
		}
	}
	return true
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
