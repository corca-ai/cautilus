package app

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
	"github.com/corca-ai/cautilus/internal/runtime"
)

type workbenchDiscoverArgs struct {
	repoRoot    string
	adapter     *string
	adapterName *string
	output      *string
}

type workbenchRunLiveArgs struct {
	repoRoot    string
	adapter     *string
	adapterName *string
	instanceID  string
	requestFile string
	outputFile  string
}

type workbenchSimulatorSpec struct {
	kind          string
	scriptedTurns []map[string]any
	instructions  string
	seedTurns     []map[string]any
}

func handleWorkbenchDiscover(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseWorkbenchDiscoverArgs(args, cwd)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	adapterPayload, err := runtime.LoadAdapter(options.repoRoot, options.adapter, options.adapterName)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if !adapterPayload.Found {
		_, _ = fmt.Fprintf(stderr, "No checked-in adapter was found.\n")
		return 1
	}
	if !adapterPayload.Valid {
		_, _ = fmt.Fprintf(stderr, "Adapter is invalid: %s\n", toJSONString(adapterPayload.Errors))
		return 1
	}
	catalog, err := resolveWorkbenchCatalog(options, adapterPayload)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := ensureParentDir(options.output); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeOutputResolved(stdout, options.output, catalog); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

func handleWorkbenchRunLive(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseWorkbenchRunLiveArgs(args, cwd)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	adapterPayload, err := runtime.LoadAdapter(options.repoRoot, options.adapter, options.adapterName)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if !adapterPayload.Found {
		_, _ = fmt.Fprintf(stderr, "No checked-in adapter was found.\n")
		return 1
	}
	if !adapterPayload.Valid {
		_, _ = fmt.Fprintf(stderr, "Adapter is invalid: %s\n", toJSONString(adapterPayload.Errors))
		return 1
	}
	request, err := readJSONObject(options.requestFile)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", options.requestFile, err)
		return 1
	}
	if err := validateWorkbenchLiveRequest(request, options.instanceID); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	liveRunInvocation := mapOrEmpty(adapterPayload.Data["live_run_invocation"])
	if len(liveRunInvocation) == 0 {
		_, _ = fmt.Fprintf(stderr, "Adapter does not declare live_run_invocation: %s\n", anyString(adapterPayload.Path))
		return 1
	}
	if err := ensureParentDir(&options.outputFile); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	result, err := executeWorkbenchLiveRequest(options, adapterPayload, request)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := validateWorkbenchLiveResult(result, request); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	_, _ = fmt.Fprintf(stdout, "%s\n", options.outputFile)
	return 0
}

func executeWorkbenchLiveRequest(options *workbenchRunLiveArgs, adapterPayload *runtime.AdapterPayload, request map[string]any) (map[string]any, error) {
	liveRunInvocation := mapOrEmpty(adapterPayload.Data["live_run_invocation"])
	if len(liveRunInvocation) == 0 {
		return nil, fmt.Errorf("adapter does not declare live_run_invocation: %s", anyString(adapterPayload.Path))
	}
	artifactDir, _, err := ensureWorkbenchWorkspace(options.outputFile)
	if err != nil {
		return nil, err
	}
	var result map[string]any
	if hasWorkbenchMultiTurnLoop(liveRunInvocation) {
		result, err = executeWorkbenchMultiTurnLiveRun(options, adapterPayload, liveRunInvocation, request, artifactDir)
		if err != nil {
			return nil, err
		}
		if err := writeOutputResolved(io.Discard, &options.outputFile, result); err != nil {
			return nil, err
		}
	} else {
		commandTemplate, commandErr := resolveWorkbenchLiveCommand(liveRunInvocation)
		if commandErr != nil {
			return nil, commandErr
		}
		commandText, renderErr := renderTemplate(commandTemplate, workbenchCommandReplacements(adapterPayload, options, nil))
		if renderErr != nil {
			return nil, renderErr
		}
		if _, runErr := executeWorkbenchCommand(options.repoRoot, commandText); runErr != nil {
			return nil, runErr
		}
		result, err = readJSONObject(options.outputFile)
		if err != nil {
			return nil, fmt.Errorf("failed to read JSON from %s: %w", options.outputFile, err)
		}
	}
	return result, nil
}

func parseWorkbenchDiscoverArgs(args []string, cwd string) (*workbenchDiscoverArgs, error) {
	options := &workbenchDiscoverArgs{repoRoot: cwd}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--repo-root":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.repoRoot = resolvePath(cwd, value)
		case "--adapter", "--adapter-path":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.adapter = &resolved
		case "--adapter-name":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.adapterName = &value
		case "--output":
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
	if options.adapter != nil && options.adapterName != nil {
		return nil, fmt.Errorf("use either --adapter or --adapter-name, not both")
	}
	return options, nil
}

func parseWorkbenchRunLiveArgs(args []string, cwd string) (*workbenchRunLiveArgs, error) {
	options := &workbenchRunLiveArgs{repoRoot: cwd}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--repo-root":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.repoRoot = resolvePath(cwd, value)
		case "--adapter", "--adapter-path":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.adapter = &resolved
		case "--adapter-name":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.adapterName = &value
		case "--instance-id":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.instanceID = value
		case "--request-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.requestFile = resolvePath(cwd, value)
		case "--output-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.outputFile = resolvePath(cwd, value)
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	if options.adapter != nil && options.adapterName != nil {
		return nil, fmt.Errorf("use either --adapter or --adapter-name, not both")
	}
	if strings.TrimSpace(options.instanceID) == "" {
		return nil, fmt.Errorf("--instance-id is required")
	}
	if strings.TrimSpace(options.requestFile) == "" {
		return nil, fmt.Errorf("--request-file is required")
	}
	if strings.TrimSpace(options.outputFile) == "" {
		return nil, fmt.Errorf("--output-file is required")
	}
	return options, nil
}

func resolveWorkbenchCatalog(options *workbenchDiscoverArgs, adapterPayload *runtime.AdapterPayload) (map[string]any, error) {
	instanceDiscovery := mapOrEmpty(adapterPayload.Data["instance_discovery"])
	if len(instanceDiscovery) == 0 {
		return nil, fmt.Errorf("adapter does not declare instance_discovery: %s", anyString(adapterPayload.Path))
	}
	if anyString(instanceDiscovery["kind"]) == "explicit" {
		catalog := buildExplicitWorkbenchCatalog(instanceDiscovery, time.Now())
		if err := validateWorkbenchCatalogPacket(catalog); err != nil {
			return nil, err
		}
		return catalog, nil
	}
	commandTemplate := anyString(instanceDiscovery["command_template"])
	if isRecursiveWorkbenchDiscoverCommand(commandTemplate) {
		return nil, fmt.Errorf("instance_discovery.command_template points back at the product helper; point it directly at a consumer-owned probe command")
	}
	commandText, err := renderTemplate(commandTemplate, workbenchDiscoverReplacements(adapterPayload, options.repoRoot))
	if err != nil {
		return nil, err
	}
	stdout, err := executeWorkbenchCommand(options.repoRoot, commandText)
	if err != nil {
		return nil, err
	}
	packet, err := decodeJSONObjectFromString(stdout)
	if err != nil {
		return nil, err
	}
	if err := validateWorkbenchCatalogPacket(packet); err != nil {
		return nil, err
	}
	return packet, nil
}

func buildExplicitWorkbenchCatalog(instanceDiscovery map[string]any, now time.Time) map[string]any {
	instances := make([]any, 0, len(arrayOrEmpty(instanceDiscovery["instances"])))
	for _, raw := range arrayOrEmpty(instanceDiscovery["instances"]) {
		record := mapOrEmpty(raw)
		entry := map[string]any{
			"instanceId":   anyString(record["id"]),
			"displayLabel": anyString(record["display_label"]),
		}
		if description := anyString(record["description"]); strings.TrimSpace(description) != "" {
			entry["description"] = description
		}
		if dataRoot := anyString(record["data_root"]); strings.TrimSpace(dataRoot) != "" {
			entry["dataRoot"] = dataRoot
		}
		if paths := normalizeWorkbenchPaths(mapOrEmpty(record["paths"])); len(paths) > 0 {
			entry["paths"] = paths
		}
		instances = append(instances, entry)
	}
	return map[string]any{
		"schemaVersion": contracts.WorkbenchInstanceCatalogSchema,
		"generatedAt":   now.UTC().Format(time.RFC3339Nano),
		"instances":     instances,
	}
}

func normalizeWorkbenchPaths(paths map[string]any) map[string]any {
	normalized := map[string]any{}
	for key, value := range paths {
		text := anyString(value)
		if strings.TrimSpace(text) == "" {
			continue
		}
		normalized[toWorkbenchCamelCase(key)] = text
	}
	return normalized
}

func toWorkbenchCamelCase(value string) string {
	parts := strings.FieldsFunc(strings.TrimSpace(value), func(r rune) bool {
		return r == '_' || r == '-' || r == ' '
	})
	if len(parts) == 0 {
		return ""
	}
	for index := range parts {
		parts[index] = strings.TrimSpace(parts[index])
		if parts[index] == "" {
			continue
		}
		if index == 0 {
			parts[index] = strings.ToLower(parts[index][:1]) + parts[index][1:]
			continue
		}
		parts[index] = strings.ToUpper(parts[index][:1]) + parts[index][1:]
	}
	return strings.Join(parts, "")
}

func validateWorkbenchCatalogPacket(packet map[string]any) error {
	if anyString(packet["schemaVersion"]) != contracts.WorkbenchInstanceCatalogSchema {
		return fmt.Errorf("workbench catalog must use schemaVersion %s", contracts.WorkbenchInstanceCatalogSchema)
	}
	instances := arrayOrEmpty(packet["instances"])
	for index, raw := range instances {
		if err := validateWorkbenchCatalogInstance(mapOrEmpty(raw), index); err != nil {
			return err
		}
	}
	return nil
}

func validateWorkbenchCatalogInstance(instance map[string]any, index int) error {
	if strings.TrimSpace(anyString(instance["instanceId"])) == "" {
		return fmt.Errorf("instances[%d].instanceId must be a non-empty string", index)
	}
	if strings.TrimSpace(anyString(instance["displayLabel"])) == "" {
		return fmt.Errorf("instances[%d].displayLabel must be a non-empty string", index)
	}
	if strings.TrimSpace(anyString(instance["dataRoot"])) == "" && len(mapOrEmpty(instance["paths"])) == 0 {
		return fmt.Errorf("instances[%d] must include dataRoot, paths, or both", index)
	}
	for key, value := range mapOrEmpty(instance["paths"]) {
		if strings.TrimSpace(key) == "" || strings.TrimSpace(anyString(value)) == "" {
			return fmt.Errorf("instances[%d].paths must be a mapping of non-empty strings", index)
		}
	}
	return nil
}

func validateWorkbenchLiveRequest(request map[string]any, expectedInstanceID string) error {
	if anyString(request["schemaVersion"]) != contracts.LiveRunInvocationRequestSchema {
		return fmt.Errorf("request packet must use schemaVersion %s", contracts.LiveRunInvocationRequestSchema)
	}
	if strings.TrimSpace(anyString(request["requestId"])) == "" {
		return fmt.Errorf("request.requestId must be a non-empty string")
	}
	if anyString(request["instanceId"]) != expectedInstanceID {
		return fmt.Errorf("request.instanceId %q does not match --instance-id %q", anyString(request["instanceId"]), expectedInstanceID)
	}
	timeout := intFromAny(request["timeoutMs"], 0)
	if timeout <= 0 {
		return fmt.Errorf("request.timeoutMs must be a positive integer")
	}
	if metadata := request["consumerMetadata"]; metadata != nil {
		if _, ok := metadata.(map[string]any); !ok {
			return fmt.Errorf("request.consumerMetadata must be an object when present")
		}
	}
	return validateWorkbenchLiveScenario(mapOrEmpty(request["scenario"]))
}

func validateWorkbenchLiveScenario(scenario map[string]any) error {
	for _, field := range []string{"scenarioId", "name", "description", "sideEffectsMode"} {
		if strings.TrimSpace(anyString(scenario[field])) == "" {
			return fmt.Errorf("request.scenario.%s must be a non-empty string", field)
		}
	}
	if intFromAny(scenario["maxTurns"], 0) <= 0 {
		return fmt.Errorf("request.scenario.maxTurns must be a positive integer")
	}
	if len(mapOrEmpty(scenario["simulator"])) > 0 && len(arrayOrEmpty(scenario["simulatorTurns"])) > 0 {
		return fmt.Errorf("request.scenario.simulator and request.scenario.simulatorTurns cannot both be set")
	}
	_, err := normalizeWorkbenchSimulatorSpec(scenario)
	return err
}

func normalizeWorkbenchSimulatorSpec(scenario map[string]any) (*workbenchSimulatorSpec, error) {
	if simulator := mapOrEmpty(scenario["simulator"]); len(simulator) > 0 {
		kind := anyString(simulator["kind"])
		switch kind {
		case "scripted":
			turns := arrayOrEmpty(simulator["turns"])
			if len(turns) == 0 {
				return nil, fmt.Errorf("request.scenario.simulator.turns must be a non-empty list")
			}
			normalized := make([]map[string]any, 0, len(turns))
			for index, raw := range turns {
				turn, err := normalizeWorkbenchSimulatorTurn(raw, fmt.Sprintf("request.scenario.simulator.turns[%d]", index))
				if err != nil {
					return nil, err
				}
				normalized = append(normalized, turn)
			}
			return &workbenchSimulatorSpec{
				kind:          "scripted",
				scriptedTurns: normalized,
			}, nil
		case "persona_prompt":
			instructions := strings.TrimSpace(anyString(simulator["instructions"]))
			if instructions == "" {
				return nil, fmt.Errorf("request.scenario.simulator.instructions must be a non-empty string")
			}
			seedTurns := make([]map[string]any, 0, len(arrayOrEmpty(simulator["seedTurns"])))
			for index, raw := range arrayOrEmpty(simulator["seedTurns"]) {
				turn, err := normalizeWorkbenchSimulatorTurn(raw, fmt.Sprintf("request.scenario.simulator.seedTurns[%d]", index))
				if err != nil {
					return nil, err
				}
				seedTurns = append(seedTurns, turn)
			}
			return &workbenchSimulatorSpec{
				kind:         "persona_prompt",
				instructions: instructions,
				seedTurns:    seedTurns,
			}, nil
		default:
			return nil, fmt.Errorf("request.scenario.simulator.kind must be scripted or persona_prompt")
		}
	}
	turns := arrayOrEmpty(scenario["simulatorTurns"])
	if len(turns) == 0 {
		return nil, fmt.Errorf("request.scenario.simulatorTurns must be a non-empty list of strings")
	}
	normalized := make([]map[string]any, 0, len(turns))
	for index, turn := range turns {
		text := strings.TrimSpace(anyString(turn))
		if text == "" {
			return nil, fmt.Errorf("request.scenario.simulatorTurns[%d] must be a non-empty string", index)
		}
		normalized = append(normalized, map[string]any{"text": text})
	}
	return &workbenchSimulatorSpec{
		kind:          "scripted",
		scriptedTurns: normalized,
	}, nil
}

func normalizeWorkbenchSimulatorTurn(raw any, path string) (map[string]any, error) {
	if text, ok := raw.(string); ok {
		if strings.TrimSpace(text) == "" {
			return nil, fmt.Errorf("%s must be a non-empty string", path)
		}
		return map[string]any{"text": strings.TrimSpace(text)}, nil
	}
	record := mapOrEmpty(raw)
	if len(record) == 0 {
		return nil, fmt.Errorf("%s must be either a string or an object with text", path)
	}
	text := strings.TrimSpace(anyString(record["text"]))
	if text == "" {
		return nil, fmt.Errorf("%s.text must be a non-empty string", path)
	}
	normalized := map[string]any{"text": text}
	if metadata := record["metadata"]; metadata != nil {
		if _, ok := metadata.(map[string]any); !ok {
			return nil, fmt.Errorf("%s.metadata must be an object when present", path)
		}
		normalized["metadata"] = metadata
	}
	return normalized, nil
}

func validateWorkbenchLiveResult(result map[string]any, request map[string]any) error {
	if anyString(result["schemaVersion"]) != contracts.LiveRunInvocationResultSchema {
		return fmt.Errorf("result packet must use schemaVersion %s", contracts.LiveRunInvocationResultSchema)
	}
	if anyString(result["requestId"]) != anyString(request["requestId"]) {
		return fmt.Errorf("result.requestId %q does not match request.requestId %q", anyString(result["requestId"]), anyString(request["requestId"]))
	}
	if anyString(result["instanceId"]) != anyString(request["instanceId"]) {
		return fmt.Errorf("result.instanceId %q does not match request.instanceId %q", anyString(result["instanceId"]), anyString(request["instanceId"]))
	}
	status := anyString(result["executionStatus"])
	if status != "completed" && status != "blocked" && status != "failed" {
		return fmt.Errorf("result.executionStatus must be one of: completed, blocked, failed")
	}
	if strings.TrimSpace(anyString(result["summary"])) == "" {
		return fmt.Errorf("result.summary must be a non-empty string")
	}
	if stopReason, ok := result["stopReason"]; ok && strings.TrimSpace(anyString(stopReason)) == "" {
		return fmt.Errorf("result.stopReason must be a non-empty string when present")
	}
	if transcript, ok := result["transcript"]; ok && transcript != nil {
		if err := validateWorkbenchTranscript(arrayOrEmpty(transcript)); err != nil {
			return err
		}
	}
	transientFailure, err := normalizeWorkbenchTransientFailure(result["transientFailure"], "result.transientFailure")
	if err != nil {
		return err
	}
	if status == "completed" {
		if len(transientFailure) > 0 {
			return fmt.Errorf("completed result must not include result.transientFailure")
		}
		scenarioResult := mapOrEmpty(result["scenarioResult"])
		if strings.TrimSpace(anyString(scenarioResult["scenarioId"])) == "" {
			return fmt.Errorf("completed result must include scenarioResult.scenarioId")
		}
		if anyString(scenarioResult["scenarioId"]) != anyString(mapOrEmpty(request["scenario"])["scenarioId"]) {
			return fmt.Errorf("result.scenarioResult.scenarioId %q does not match request.scenario.scenarioId %q", anyString(scenarioResult["scenarioId"]), anyString(mapOrEmpty(request["scenario"])["scenarioId"]))
		}
		if strings.TrimSpace(anyString(scenarioResult["status"])) == "" || strings.TrimSpace(anyString(scenarioResult["summary"])) == "" {
			return fmt.Errorf("completed result must include scenarioResult.status and scenarioResult.summary")
		}
		if evaluation := mapOrEmpty(scenarioResult["evaluation"]); len(evaluation) > 0 {
			if err := validateWorkbenchEvaluatorResult(evaluation); err != nil {
				return fmt.Errorf("scenarioResult.evaluation: %w", err)
			}
		}
		return nil
	}
	return validateWorkbenchDiagnostics(arrayOrEmpty(result["diagnostics"]), status)
}

func validateWorkbenchTranscript(entries []any) error {
	for index, raw := range entries {
		entry := mapOrEmpty(raw)
		if intFromAny(entry["turnIndex"], 0) <= 0 {
			return fmt.Errorf("transcript[%d].turnIndex must be a positive integer", index)
		}
		if _, err := normalizeWorkbenchSimulatorTurn(entry["simulatorTurn"], fmt.Sprintf("transcript[%d].simulatorTurn", index)); err != nil {
			return err
		}
		if err := validateWorkbenchAssistantTurn(mapOrEmpty(entry["assistantTurn"]), fmt.Sprintf("transcript[%d].assistantTurn", index)); err != nil {
			return err
		}
		if signal := entry["consumerSignal"]; signal != nil {
			if _, ok := signal.(map[string]any); !ok {
				return fmt.Errorf("transcript[%d].consumerSignal must be an object when present", index)
			}
		}
	}
	return nil
}

func validateWorkbenchDiagnostics(diagnostics []any, status string) error {
	if len(diagnostics) == 0 {
		return fmt.Errorf("%s result must include diagnostics", status)
	}
	for index, raw := range diagnostics {
		record := mapOrEmpty(raw)
		for _, field := range []string{"code", "severity", "message"} {
			if strings.TrimSpace(anyString(record[field])) == "" {
				return fmt.Errorf("diagnostics[%d].%s must be a non-empty string", index, field)
			}
		}
	}
	return nil
}

func normalizeWorkbenchTransientFailure(value any, path string) (map[string]any, error) {
	if value == nil {
		return nil, nil
	}
	record := mapOrEmpty(value)
	if len(record) == 0 {
		return nil, fmt.Errorf("%s must be an object when present", path)
	}
	class := strings.TrimSpace(anyString(record["class"]))
	if !workbenchValidTransientFailureClass(class) {
		return nil, fmt.Errorf("%s.class must be one of: rate_limit, transient_provider_failure", path)
	}
	normalized := map[string]any{"class": class}
	if details := record["details"]; details != nil {
		if _, ok := details.(map[string]any); !ok {
			return nil, fmt.Errorf("%s.details must be an object when present", path)
		}
		normalized["details"] = details
	}
	return normalized, nil
}

func workbenchValidTransientFailureClass(class string) bool {
	return class == "rate_limit" || class == "transient_provider_failure"
}

func workbenchTransientFailureClass(result map[string]any) string {
	return anyString(mapOrEmpty(result["transientFailure"])["class"])
}

func validateWorkbenchEvaluatorResult(result map[string]any) error {
	if anyString(result["schemaVersion"]) != contracts.LiveRunEvaluatorResultSchema {
		return fmt.Errorf("evaluator result packet must use schemaVersion %s", contracts.LiveRunEvaluatorResultSchema)
	}
	status := anyString(result["status"])
	if status != "passed" && status != "failed" && status != "error" {
		return fmt.Errorf("evaluator result.status must be one of: passed, failed, error")
	}
	if strings.TrimSpace(anyString(result["summary"])) == "" {
		return fmt.Errorf("evaluator result.summary must be a non-empty string")
	}
	if overallScore := result["overallScore"]; overallScore != nil {
		if _, ok := anyNumber(overallScore); !ok {
			return fmt.Errorf("evaluator result.overallScore must be a number or null when present")
		}
	}
	if details := result["details"]; details != nil {
		if _, ok := details.(map[string]any); !ok {
			return fmt.Errorf("evaluator result.details must be an object when present")
		}
	}
	return nil
}

func validateWorkbenchAssistantTurn(turn map[string]any, path string) error {
	if strings.TrimSpace(anyString(turn["text"])) == "" {
		return fmt.Errorf("%s.text must be a non-empty string", path)
	}
	if metadata := turn["metadata"]; metadata != nil {
		if _, ok := metadata.(map[string]any); !ok {
			return fmt.Errorf("%s.metadata must be an object when present", path)
		}
	}
	return nil
}

func hasWorkbenchMultiTurnLoop(liveRunInvocation map[string]any) bool {
	return strings.TrimSpace(anyString(liveRunInvocation["consumer_single_turn_command_template"])) != ""
}

func executeWorkbenchMultiTurnLiveRun(
	options *workbenchRunLiveArgs,
	adapterPayload *runtime.AdapterPayload,
	liveRunInvocation map[string]any,
	request map[string]any,
	artifactDir string,
) (map[string]any, error) {
	simulatorSpec, err := normalizeWorkbenchSimulatorSpec(mapOrEmpty(request["scenario"]))
	if err != nil {
		return nil, err
	}
	startedAt := time.Now().UTC()
	timeoutMs := intFromAny(request["timeoutMs"], 0)
	singleTurnTemplate := strings.TrimSpace(anyString(liveRunInvocation["consumer_single_turn_command_template"]))
	if isRecursiveWorkbenchRunLiveCommand(singleTurnTemplate) {
		return nil, fmt.Errorf("live_run_invocation.consumer_single_turn_command_template must point at a consumer-owned single-turn command")
	}
	transcript := make([]any, 0, intFromAny(mapOrEmpty(request["scenario"])["maxTurns"], 0))
	if completed, err := prepareWorkbenchWorkspace(options, adapterPayload, liveRunInvocation, request, startedAt, timeoutMs); err != nil {
		return nil, err
	} else if completed != nil {
		return completed, nil
	}
	switch simulatorSpec.kind {
	case "scripted":
		return executeWorkbenchScriptedLoop(options, adapterPayload, liveRunInvocation, request, startedAt, timeoutMs, artifactDir, singleTurnTemplate, simulatorSpec, transcript)
	case "persona_prompt":
		return executeWorkbenchPersonaPromptLoop(options, adapterPayload, liveRunInvocation, request, startedAt, timeoutMs, artifactDir, singleTurnTemplate, simulatorSpec, transcript)
	default:
		return nil, fmt.Errorf("unsupported simulator kind: %s", simulatorSpec.kind)
	}
}

func prepareWorkbenchWorkspace(
	options *workbenchRunLiveArgs,
	adapterPayload *runtime.AdapterPayload,
	liveRunInvocation map[string]any,
	request map[string]any,
	startedAt time.Time,
	timeoutMs int,
) (map[string]any, error) {
	prepareTemplate := strings.TrimSpace(anyString(liveRunInvocation["workspace_prepare_command_template"]))
	if prepareTemplate == "" {
		return nil, nil
	}
	if isRecursiveWorkbenchRunLiveCommand(prepareTemplate) {
		return nil, fmt.Errorf("live_run_invocation.workspace_prepare_command_template must point at a consumer-owned prepare command")
	}
	remainingMs := workbenchRemainingTimeoutMs(startedAt, timeoutMs)
	if remainingMs <= 0 {
		return finalizeWorkbenchCompletedResult(request, nil, startedAt, "timeout_reached", nil, "", nil)
	}
	commandText, err := renderTemplate(prepareTemplate, workbenchCommandReplacements(adapterPayload, options, nil))
	if err != nil {
		return nil, err
	}
	if _, timedOut, err := executeWorkbenchCommandWithTimeout(options.repoRoot, commandText, time.Duration(remainingMs)*time.Millisecond); err != nil {
		if timedOut {
			return finalizeWorkbenchCompletedResult(request, nil, startedAt, "timeout_reached", nil, "", nil)
		}
		completed := finalizeWorkbenchDiagnosticResult(
			request,
			nil,
			startedAt,
			"failed",
			"consumer_turn_failed",
			"workspace prepare command failed",
			[]any{workbenchDiagnostic("workspace_prepare_command_failed", err.Error())},
			nil,
		)
		return completed, nil
	}
	return nil, nil
}

func executeWorkbenchScriptedLoop(
	options *workbenchRunLiveArgs,
	adapterPayload *runtime.AdapterPayload,
	liveRunInvocation map[string]any,
	request map[string]any,
	startedAt time.Time,
	timeoutMs int,
	artifactDir string,
	singleTurnTemplate string,
	simulatorSpec *workbenchSimulatorSpec,
	transcript []any,
) (map[string]any, error) {
	for index, simulatorTurn := range simulatorSpec.scriptedTurns {
		if index >= intFromAny(mapOrEmpty(request["scenario"])["maxTurns"], 0) {
			break
		}
		updatedTranscript, completed, err := executeWorkbenchConsumerTurn(
			options,
			adapterPayload,
			request,
			startedAt,
			timeoutMs,
			artifactDir,
			singleTurnTemplate,
			transcript,
			simulatorTurn,
			index+1,
		)
		if err != nil {
			return nil, err
		}
		transcript = updatedTranscript
		if completed != nil {
			return completed, nil
		}
	}
	stopReason := "scripted_turns_exhausted"
	if len(simulatorSpec.scriptedTurns) > intFromAny(mapOrEmpty(request["scenario"])["maxTurns"], 0) {
		stopReason = "turn_limit_reached"
	}
	return finalizeWorkbenchLoopResult(options, adapterPayload, liveRunInvocation, request, startedAt, timeoutMs, artifactDir, transcript, stopReason)
}

func executeWorkbenchPersonaPromptLoop(
	options *workbenchRunLiveArgs,
	adapterPayload *runtime.AdapterPayload,
	liveRunInvocation map[string]any,
	request map[string]any,
	startedAt time.Time,
	timeoutMs int,
	artifactDir string,
	singleTurnTemplate string,
	simulatorSpec *workbenchSimulatorSpec,
	transcript []any,
) (map[string]any, error) {
	maxTurns := intFromAny(mapOrEmpty(request["scenario"])["maxTurns"], 0)
	for turnIndex := 1; turnIndex <= maxTurns; turnIndex += 1 {
		var simulatorTurn map[string]any
		if turnIndex <= len(simulatorSpec.seedTurns) {
			simulatorTurn = simulatorSpec.seedTurns[turnIndex-1]
		} else {
			simulatedTurn, stopReason, completed, err := executeWorkbenchSimulatorPersonaTurn(
				options,
				adapterPayload,
				liveRunInvocation,
				request,
				startedAt,
				timeoutMs,
				artifactDir,
				simulatorSpec,
				transcript,
				turnIndex,
			)
			if err != nil {
				return nil, err
			}
			if completed != nil {
				return completed, nil
			}
			if stopReason != "" {
				return finalizeWorkbenchLoopResult(options, adapterPayload, liveRunInvocation, request, startedAt, timeoutMs, artifactDir, transcript, stopReason)
			}
			simulatorTurn = simulatedTurn
		}
		updatedTranscript, completed, err := executeWorkbenchConsumerTurn(
			options,
			adapterPayload,
			request,
			startedAt,
			timeoutMs,
			artifactDir,
			singleTurnTemplate,
			transcript,
			simulatorTurn,
			turnIndex,
		)
		if err != nil {
			return nil, err
		}
		transcript = updatedTranscript
		if completed != nil {
			return completed, nil
		}
	}
	return finalizeWorkbenchLoopResult(options, adapterPayload, liveRunInvocation, request, startedAt, timeoutMs, artifactDir, transcript, "turn_limit_reached")
}

func executeWorkbenchConsumerTurn(
	options *workbenchRunLiveArgs,
	adapterPayload *runtime.AdapterPayload,
	request map[string]any,
	startedAt time.Time,
	timeoutMs int,
	artifactDir string,
	singleTurnTemplate string,
	transcript []any,
	simulatorTurn map[string]any,
	turnIndex int,
) ([]any, map[string]any, error) {
	remainingMs := workbenchRemainingTimeoutMs(startedAt, timeoutMs)
	if remainingMs <= 0 {
		completed, err := finalizeWorkbenchCompletedResult(request, transcript, startedAt, "timeout_reached", nil, "", nil)
		return transcript, completed, err
	}
	turnRequestFile := filepath.Join(artifactDir, fmt.Sprintf("turn-request-%02d.json", turnIndex))
	turnResultFile := filepath.Join(artifactDir, fmt.Sprintf("turn-result-%02d.json", turnIndex))
	turnRequest := map[string]any{
		"schemaVersion": contracts.LiveRunTurnRequestSchema,
		"requestId":     anyString(request["requestId"]),
		"instanceId":    anyString(request["instanceId"]),
		"scenarioId":    anyString(mapOrEmpty(request["scenario"])["scenarioId"]),
		"turnIndex":     turnIndex,
		"maxTurns":      intFromAny(mapOrEmpty(request["scenario"])["maxTurns"], 0),
		"simulatorTurn": simulatorTurn,
		"transcript":    transcript,
	}
	if metadata := request["consumerMetadata"]; metadata != nil {
		turnRequest["consumerMetadata"] = metadata
	}
	if capture, ok := request["captureTranscript"].(bool); ok {
		turnRequest["captureTranscript"] = capture
	}
	if err := writeOutputResolved(io.Discard, &turnRequestFile, turnRequest); err != nil {
		return transcript, nil, err
	}
	commandText, err := renderTemplate(
		singleTurnTemplate,
		workbenchCommandReplacements(adapterPayload, options, map[string]string{
			"turn_request_file": runtime.ShellSingleQuote(turnRequestFile),
			"turn_result_file":  runtime.ShellSingleQuote(turnResultFile),
		}),
	)
	if err != nil {
		return transcript, nil, err
	}
	if _, timedOut, err := executeWorkbenchCommandWithTimeout(options.repoRoot, commandText, time.Duration(remainingMs)*time.Millisecond); err != nil {
		if timedOut {
			completed, completeErr := finalizeWorkbenchCompletedResult(request, transcript, startedAt, "timeout_reached", nil, "", nil)
			return transcript, completed, completeErr
		}
		completed := finalizeWorkbenchDiagnosticResult(
			request,
			transcript,
			startedAt,
			"failed",
			"consumer_turn_failed",
			"consumer single-turn command failed",
			[]any{workbenchDiagnostic("consumer_single_turn_command_failed", err.Error())},
			nil,
		)
		return transcript, completed, nil
	}
	turnResult, err := readJSONObject(turnResultFile)
	if err != nil {
		completed := finalizeWorkbenchDiagnosticResult(
			request,
			transcript,
			startedAt,
			"failed",
			"consumer_turn_failed",
			"consumer single-turn command did not produce a valid result",
			[]any{workbenchDiagnostic("invalid_turn_result", err.Error())},
			nil,
		)
		return transcript, completed, nil
	}
	if err := validateWorkbenchTurnResult(turnResult, request, turnIndex); err != nil {
		completed := finalizeWorkbenchDiagnosticResult(
			request,
			transcript,
			startedAt,
			"failed",
			"consumer_turn_failed",
			"consumer single-turn result did not match the contract",
			[]any{workbenchDiagnostic("invalid_turn_result_contract", err.Error())},
			nil,
		)
		return transcript, completed, nil
	}
	switch anyString(turnResult["executionStatus"]) {
	case "completed":
		entry := map[string]any{
			"turnIndex":     turnIndex,
			"simulatorTurn": simulatorTurn,
			"assistantTurn": mapOrEmpty(turnResult["assistantTurn"]),
		}
		if signal := turnResult["consumerSignal"]; signal != nil {
			entry["consumerSignal"] = signal
		}
		transcript = append(transcript, entry)
		return transcript, nil, nil
	case "blocked":
		completed := finalizeWorkbenchDiagnosticResult(
			request,
			transcript,
			startedAt,
			"blocked",
			"blocked_by_consumer",
			anyString(turnResult["summary"]),
			arrayOrEmpty(turnResult["diagnostics"]),
			mapOrEmpty(turnResult["transientFailure"]),
		)
		return transcript, completed, nil
	default:
		completed := finalizeWorkbenchDiagnosticResult(
			request,
			transcript,
			startedAt,
			"failed",
			"consumer_turn_failed",
			anyString(turnResult["summary"]),
			arrayOrEmpty(turnResult["diagnostics"]),
			mapOrEmpty(turnResult["transientFailure"]),
		)
		return transcript, completed, nil
	}
}

func executeWorkbenchSimulatorPersonaTurn(
	options *workbenchRunLiveArgs,
	adapterPayload *runtime.AdapterPayload,
	liveRunInvocation map[string]any,
	request map[string]any,
	startedAt time.Time,
	timeoutMs int,
	artifactDir string,
	simulatorSpec *workbenchSimulatorSpec,
	transcript []any,
	turnIndex int,
) (map[string]any, string, map[string]any, error) {
	simulatorTemplate := strings.TrimSpace(anyString(liveRunInvocation["simulator_persona_command_template"]))
	if simulatorTemplate == "" {
		return nil, "", nil, fmt.Errorf("live_run_invocation.simulator_persona_command_template is required for simulator.kind persona_prompt")
	}
	remainingMs := workbenchRemainingTimeoutMs(startedAt, timeoutMs)
	if remainingMs <= 0 {
		completed, err := finalizeWorkbenchCompletedResult(request, transcript, startedAt, "timeout_reached", nil, "", nil)
		return nil, "", completed, err
	}
	simulatorRequestFile := filepath.Join(artifactDir, fmt.Sprintf("simulator-request-%02d.json", turnIndex))
	simulatorResultFile := filepath.Join(artifactDir, fmt.Sprintf("simulator-result-%02d.json", turnIndex))
	simulatorRequest := map[string]any{
		"schemaVersion": contracts.LiveRunSimulatorRequestSchema,
		"requestId":     anyString(request["requestId"]),
		"instanceId":    anyString(request["instanceId"]),
		"scenarioId":    anyString(mapOrEmpty(request["scenario"])["scenarioId"]),
		"turnIndex":     turnIndex,
		"maxTurns":      intFromAny(mapOrEmpty(request["scenario"])["maxTurns"], 0),
		"instructions":  simulatorSpec.instructions,
		"transcript":    transcript,
	}
	if metadata := request["consumerMetadata"]; metadata != nil {
		simulatorRequest["consumerMetadata"] = metadata
	}
	if err := writeOutputResolved(io.Discard, &simulatorRequestFile, simulatorRequest); err != nil {
		return nil, "", nil, err
	}
	commandText, err := renderTemplate(
		simulatorTemplate,
		workbenchCommandReplacements(adapterPayload, options, map[string]string{
			"simulator_request_file": runtime.ShellSingleQuote(simulatorRequestFile),
			"simulator_result_file":  runtime.ShellSingleQuote(simulatorResultFile),
		}),
	)
	if err != nil {
		return nil, "", nil, err
	}
	if _, timedOut, err := executeWorkbenchCommandWithTimeout(options.repoRoot, commandText, time.Duration(remainingMs)*time.Millisecond); err != nil {
		if timedOut {
			completed, completeErr := finalizeWorkbenchCompletedResult(request, transcript, startedAt, "timeout_reached", nil, "", nil)
			return nil, "", completed, completeErr
		}
		completed := finalizeWorkbenchDiagnosticResult(
			request,
			transcript,
			startedAt,
			"failed",
			"simulator_persona_failed",
			"simulator persona command failed",
			[]any{workbenchDiagnostic("simulator_persona_command_failed", err.Error())},
			nil,
		)
		return nil, "", completed, nil
	}
	simulatorResult, err := readJSONObject(simulatorResultFile)
	if err != nil {
		completed := finalizeWorkbenchDiagnosticResult(
			request,
			transcript,
			startedAt,
			"failed",
			"simulator_persona_failed",
			"simulator persona command did not produce a valid result",
			[]any{workbenchDiagnostic("invalid_simulator_result", err.Error())},
			nil,
		)
		return nil, "", completed, nil
	}
	if err := validateWorkbenchSimulatorResult(simulatorResult, request, turnIndex); err != nil {
		completed := finalizeWorkbenchDiagnosticResult(
			request,
			transcript,
			startedAt,
			"failed",
			"simulator_persona_failed",
			"simulator persona result did not match the contract",
			[]any{workbenchDiagnostic("invalid_simulator_result_contract", err.Error())},
			nil,
		)
		return nil, "", completed, nil
	}
	switch anyString(simulatorResult["executionStatus"]) {
	case "completed":
		if anyString(simulatorResult["action"]) == "stop" {
			return nil, anyString(simulatorResult["stopReason"]), nil, nil
		}
		return mapOrEmpty(simulatorResult["simulatorTurn"]), "", nil, nil
	case "blocked":
		completed := finalizeWorkbenchDiagnosticResult(
			request,
			transcript,
			startedAt,
			"blocked",
			"blocked_by_consumer",
			anyString(simulatorResult["summary"]),
			arrayOrEmpty(simulatorResult["diagnostics"]),
			mapOrEmpty(simulatorResult["transientFailure"]),
		)
		return nil, "", completed, nil
	default:
		completed := finalizeWorkbenchDiagnosticResult(
			request,
			transcript,
			startedAt,
			"failed",
			"simulator_persona_failed",
			anyString(simulatorResult["summary"]),
			arrayOrEmpty(simulatorResult["diagnostics"]),
			mapOrEmpty(simulatorResult["transientFailure"]),
		)
		return nil, "", completed, nil
	}
}

func finalizeWorkbenchLoopResult(
	options *workbenchRunLiveArgs,
	adapterPayload *runtime.AdapterPayload,
	liveRunInvocation map[string]any,
	request map[string]any,
	startedAt time.Time,
	timeoutMs int,
	artifactDir string,
	transcript []any,
	stopReason string,
) (map[string]any, error) {
	transcriptFile := ""
	artifactPaths := []any{}
	evaluatorTemplate := strings.TrimSpace(anyString(liveRunInvocation["consumer_evaluator_command_template"]))
	if truthyWorkbenchCaptureTranscript(request) || evaluatorTemplate != "" {
		transcriptFile = filepath.Join(artifactDir, "transcript.json")
		if err := writeOutputResolved(io.Discard, &transcriptFile, buildWorkbenchTranscriptPacket(request, transcript, stopReason)); err != nil {
			return nil, err
		}
		if truthyWorkbenchCaptureTranscript(request) {
			artifactPaths = append(artifactPaths, transcriptFile)
		}
	}
	evaluation := map[string]any(nil)
	if evaluatorTemplate != "" {
		if isRecursiveWorkbenchRunLiveCommand(evaluatorTemplate) {
			return nil, fmt.Errorf("live_run_invocation.consumer_evaluator_command_template must point at a consumer-owned evaluator command")
		}
		evaluatorInputFile := filepath.Join(artifactDir, "evaluator-input.json")
		evaluatorArtifacts := []any{}
		if transcriptFile != "" {
			evaluatorArtifacts = append(evaluatorArtifacts, transcriptFile)
		}
		if err := writeOutputResolved(io.Discard, &evaluatorInputFile, buildWorkbenchEvaluatorInputPacket(request, transcript, stopReason, evaluatorArtifacts)); err != nil {
			return nil, err
		}
		artifactPaths = append(artifactPaths, evaluatorInputFile)
		remainingMs := workbenchRemainingTimeoutMs(startedAt, timeoutMs)
		if remainingMs <= 0 {
			evaluation = workbenchEvaluatorErrorResult(
				"Evaluator could not run because the live-run timeout budget was exhausted.",
				"live_run_timeout_exhausted",
				"The bounded live run exhausted its timeout budget before the evaluator command could start.",
			)
		} else {
			evaluationOutputFile := filepath.Join(artifactDir, "evaluation.json")
			commandText, err := renderTemplate(
				evaluatorTemplate,
				workbenchCommandReplacements(adapterPayload, options, map[string]string{
					"transcript_file":        runtime.ShellSingleQuote(transcriptFile),
					"evaluator_input_file":   runtime.ShellSingleQuote(evaluatorInputFile),
					"evaluation_output_file": runtime.ShellSingleQuote(evaluationOutputFile),
				}),
			)
			if err != nil {
				return nil, err
			}
			if _, timedOut, err := executeWorkbenchCommandWithTimeout(options.repoRoot, commandText, time.Duration(remainingMs)*time.Millisecond); err != nil {
				if timedOut {
					evaluation = workbenchEvaluatorErrorResult(
						"Evaluator timed out before producing a result.",
						"evaluator_timed_out",
						"The evaluator command exceeded the remaining live-run timeout budget.",
					)
				} else {
					evaluation = workbenchEvaluatorErrorResult(
						fmt.Sprintf("Evaluator command failed: %s", err),
						"evaluator_command_failed",
						err.Error(),
					)
				}
			} else {
				parsed, err := readJSONObject(evaluationOutputFile)
				if err != nil {
					evaluation = workbenchEvaluatorErrorResult(
						fmt.Sprintf("Evaluator output was not valid JSON: %s", err),
						"invalid_evaluator_json",
						err.Error(),
					)
				} else {
					if err := validateWorkbenchEvaluatorResult(parsed); err != nil {
						evaluation = workbenchEvaluatorErrorResult(
							"Evaluator output did not match the contract.",
							"invalid_evaluator_contract",
							err.Error(),
						)
					} else {
						evaluation = parsed
						artifactPaths = append(artifactPaths, evaluationOutputFile)
					}
				}
			}
		}
	}
	return finalizeWorkbenchCompletedResult(request, transcript, startedAt, stopReason, evaluation, transcriptFile, artifactPaths)
}

func finalizeWorkbenchCompletedResult(
	request map[string]any,
	transcript []any,
	startedAt time.Time,
	stopReason string,
	evaluation map[string]any,
	transcriptFile string,
	artifactPaths []any,
) (map[string]any, error) {
	completedAt := time.Now().UTC()
	scenarioSummary := anyString(mapOrEmpty(evaluation)["summary"])
	if strings.TrimSpace(scenarioSummary) == "" {
		scenarioSummary = fmt.Sprintf("Completed %d turn(s); stop reason: %s.", len(transcript), stopReason)
	}
	scenarioStatus := anyString(mapOrEmpty(evaluation)["status"])
	if strings.TrimSpace(scenarioStatus) == "" {
		scenarioStatus = "completed"
	}
	scenarioResult := map[string]any{
		"scenarioId": anyString(mapOrEmpty(request["scenario"])["scenarioId"]),
		"status":     scenarioStatus,
		"summary":    scenarioSummary,
	}
	if len(mapOrEmpty(evaluation)) > 0 {
		scenarioResult["evaluation"] = evaluation
	}
	if excerpt := workbenchTranscriptExcerpt(transcript); len(excerpt) > 0 {
		scenarioResult["transcriptExcerpt"] = excerpt
	}
	result := map[string]any{
		"schemaVersion":   contracts.LiveRunInvocationResultSchema,
		"requestId":       anyString(request["requestId"]),
		"instanceId":      anyString(request["instanceId"]),
		"executionStatus": "completed",
		"summary":         scenarioSummary,
		"stopReason":      stopReason,
		"startedAt":       startedAt.Format(time.RFC3339Nano),
		"completedAt":     completedAt.Format(time.RFC3339Nano),
		"durationMs":      completedAt.Sub(startedAt).Milliseconds(),
		"scenarioResult":  scenarioResult,
	}
	if truthyWorkbenchCaptureTranscript(request) {
		result["transcript"] = transcript
	}
	if len(artifactPaths) > 0 {
		result["artifactPaths"] = artifactPaths
	} else if transcriptFile != "" && truthyWorkbenchCaptureTranscript(request) {
		result["artifactPaths"] = []any{transcriptFile}
	}
	return result, nil
}

func finalizeWorkbenchDiagnosticResult(
	request map[string]any,
	transcript []any,
	startedAt time.Time,
	executionStatus string,
	stopReason string,
	summary string,
	diagnostics []any,
	transientFailure map[string]any,
) map[string]any {
	completedAt := time.Now().UTC()
	result := map[string]any{
		"schemaVersion":   contracts.LiveRunInvocationResultSchema,
		"requestId":       anyString(request["requestId"]),
		"instanceId":      anyString(request["instanceId"]),
		"executionStatus": executionStatus,
		"summary":         summary,
		"stopReason":      stopReason,
		"startedAt":       startedAt.Format(time.RFC3339Nano),
		"completedAt":     completedAt.Format(time.RFC3339Nano),
		"durationMs":      completedAt.Sub(startedAt).Milliseconds(),
		"diagnostics":     diagnostics,
	}
	if truthyWorkbenchCaptureTranscript(request) && len(transcript) > 0 {
		result["transcript"] = transcript
	}
	if len(transientFailure) > 0 {
		result["transientFailure"] = transientFailure
	}
	return result
}

func validateWorkbenchSimulatorResult(result map[string]any, request map[string]any, expectedTurnIndex int) error {
	if anyString(result["schemaVersion"]) != contracts.LiveRunSimulatorResultSchema {
		return fmt.Errorf("simulator result packet must use schemaVersion %s", contracts.LiveRunSimulatorResultSchema)
	}
	if anyString(result["requestId"]) != anyString(request["requestId"]) {
		return fmt.Errorf("simulator result.requestId %q does not match request.requestId %q", anyString(result["requestId"]), anyString(request["requestId"]))
	}
	if anyString(result["instanceId"]) != anyString(request["instanceId"]) {
		return fmt.Errorf("simulator result.instanceId %q does not match request.instanceId %q", anyString(result["instanceId"]), anyString(request["instanceId"]))
	}
	if intFromAny(result["turnIndex"], 0) != expectedTurnIndex {
		return fmt.Errorf("simulator result.turnIndex %d does not match expected turn index %d", intFromAny(result["turnIndex"], 0), expectedTurnIndex)
	}
	status := anyString(result["executionStatus"])
	if status != "completed" && status != "blocked" && status != "failed" {
		return fmt.Errorf("simulator result.executionStatus must be one of: completed, blocked, failed")
	}
	if strings.TrimSpace(anyString(result["summary"])) == "" {
		return fmt.Errorf("simulator result.summary must be a non-empty string")
	}
	if status == "completed" {
		if transientFailure, err := normalizeWorkbenchTransientFailure(result["transientFailure"], "simulator result.transientFailure"); err != nil {
			return err
		} else if len(transientFailure) > 0 {
			return fmt.Errorf("completed simulator result must not include simulator result.transientFailure")
		}
		action := strings.TrimSpace(anyString(result["action"]))
		if action != "continue" && action != "stop" {
			return fmt.Errorf("simulator result.action must be continue or stop")
		}
		if action == "continue" {
			if _, err := normalizeWorkbenchSimulatorTurn(result["simulatorTurn"], "simulator result.simulatorTurn"); err != nil {
				return err
			}
			return nil
		}
		if strings.TrimSpace(anyString(result["stopReason"])) == "" {
			return fmt.Errorf("simulator result.stopReason must be a non-empty string when action is stop")
		}
		return nil
	}
	if _, err := normalizeWorkbenchTransientFailure(result["transientFailure"], "simulator result.transientFailure"); err != nil {
		return err
	}
	return validateWorkbenchDiagnostics(arrayOrEmpty(result["diagnostics"]), status)
}

func validateWorkbenchTurnResult(result map[string]any, request map[string]any, expectedTurnIndex int) error {
	if anyString(result["schemaVersion"]) != contracts.LiveRunTurnResultSchema {
		return fmt.Errorf("turn result packet must use schemaVersion %s", contracts.LiveRunTurnResultSchema)
	}
	if anyString(result["requestId"]) != anyString(request["requestId"]) {
		return fmt.Errorf("turn result.requestId %q does not match request.requestId %q", anyString(result["requestId"]), anyString(request["requestId"]))
	}
	if anyString(result["instanceId"]) != anyString(request["instanceId"]) {
		return fmt.Errorf("turn result.instanceId %q does not match request.instanceId %q", anyString(result["instanceId"]), anyString(request["instanceId"]))
	}
	if intFromAny(result["turnIndex"], 0) != expectedTurnIndex {
		return fmt.Errorf("turn result.turnIndex %d does not match expected turn index %d", intFromAny(result["turnIndex"], 0), expectedTurnIndex)
	}
	status := anyString(result["executionStatus"])
	if status != "completed" && status != "blocked" && status != "failed" {
		return fmt.Errorf("turn result.executionStatus must be one of: completed, blocked, failed")
	}
	if strings.TrimSpace(anyString(result["summary"])) == "" {
		return fmt.Errorf("turn result.summary must be a non-empty string")
	}
	if status == "completed" {
		if transientFailure, err := normalizeWorkbenchTransientFailure(result["transientFailure"], "turn result.transientFailure"); err != nil {
			return err
		} else if len(transientFailure) > 0 {
			return fmt.Errorf("completed turn result must not include turn result.transientFailure")
		}
		if err := validateWorkbenchAssistantTurn(mapOrEmpty(result["assistantTurn"]), "turn result.assistantTurn"); err != nil {
			return err
		}
		if signal := result["consumerSignal"]; signal != nil {
			if _, ok := signal.(map[string]any); !ok {
				return fmt.Errorf("turn result.consumerSignal must be an object when present")
			}
		}
		return nil
	}
	if _, err := normalizeWorkbenchTransientFailure(result["transientFailure"], "turn result.transientFailure"); err != nil {
		return err
	}
	return validateWorkbenchDiagnostics(arrayOrEmpty(result["diagnostics"]), status)
}

func buildWorkbenchTranscriptPacket(request map[string]any, transcript []any, stopReason string) map[string]any {
	packet := map[string]any{
		"schemaVersion": contracts.LiveRunTranscriptSchema,
		"requestId":     anyString(request["requestId"]),
		"instanceId":    anyString(request["instanceId"]),
		"scenarioId":    anyString(mapOrEmpty(request["scenario"])["scenarioId"]),
		"stopReason":    stopReason,
		"transcript":    transcript,
	}
	if metadata := request["consumerMetadata"]; metadata != nil {
		packet["consumerMetadata"] = metadata
	}
	return packet
}

func buildWorkbenchEvaluatorInputPacket(request map[string]any, transcript []any, stopReason string, artifactPaths []any) map[string]any {
	packet := map[string]any{
		"schemaVersion": contracts.LiveRunEvaluatorInputSchema,
		"requestId":     anyString(request["requestId"]),
		"instanceId":    anyString(request["instanceId"]),
		"scenarioId":    anyString(mapOrEmpty(request["scenario"])["scenarioId"]),
		"stopReason":    stopReason,
		"transcript":    transcript,
	}
	if metadata := request["consumerMetadata"]; metadata != nil {
		packet["consumerMetadata"] = metadata
	}
	if len(artifactPaths) > 0 {
		packet["artifactPaths"] = artifactPaths
	}
	return packet
}

func workbenchEvaluatorErrorResult(summary string, code string, message string) map[string]any {
	result := map[string]any{
		"schemaVersion": contracts.LiveRunEvaluatorResultSchema,
		"status":        "error",
		"overallScore":  nil,
		"summary":       summary,
	}
	if strings.TrimSpace(code) != "" || strings.TrimSpace(message) != "" {
		details := map[string]any{}
		if strings.TrimSpace(code) != "" {
			details["code"] = code
		}
		if strings.TrimSpace(message) != "" {
			details["message"] = message
		}
		result["details"] = details
	}
	return result
}

func workbenchTranscriptExcerpt(transcript []any) []any {
	if len(transcript) == 0 {
		return nil
	}
	limit := minInt(len(transcript), 2)
	return append([]any{}, transcript[:limit]...)
}

func truthyWorkbenchCaptureTranscript(request map[string]any) bool {
	capture, _ := request["captureTranscript"].(bool)
	return capture
}

func workbenchRemainingTimeoutMs(startedAt time.Time, timeoutMs int) int {
	remaining := timeoutMs - int(time.Since(startedAt).Milliseconds())
	if remaining < 0 {
		return 0
	}
	return remaining
}

func workbenchDiagnostic(code string, message string) map[string]any {
	return map[string]any{
		"code":     code,
		"severity": "error",
		"message":  message,
	}
}

func minInt(left int, right int) int {
	if left < right {
		return left
	}
	return right
}

func resolveWorkbenchLiveCommand(liveRunInvocation map[string]any) (string, error) {
	if template := strings.TrimSpace(anyString(liveRunInvocation["consumer_command_template"])); template != "" {
		return template, nil
	}
	commandTemplate := strings.TrimSpace(anyString(liveRunInvocation["command_template"]))
	if commandTemplate == "" {
		return "", fmt.Errorf("adapter does not declare a runnable live invocation command")
	}
	if isRecursiveWorkbenchRunLiveCommand(commandTemplate) {
		return "", fmt.Errorf("live_run_invocation.command_template points back at the product helper; set live_run_invocation.consumer_command_template to the consumer-owned command")
	}
	return commandTemplate, nil
}

func workbenchDiscoverReplacements(adapterPayload *runtime.AdapterPayload, repoRoot string) map[string]string {
	return map[string]string{
		"repo_root":    runtime.ShellSingleQuote(repoRoot),
		"adapter_path": runtime.ShellSingleQuote(anyString(adapterPayload.Path)),
	}
}

func workbenchCommandReplacements(adapterPayload *runtime.AdapterPayload, options *workbenchRunLiveArgs, extra map[string]string) map[string]string {
	replacements := map[string]string{
		"repo_root":     runtime.ShellSingleQuote(options.repoRoot),
		"adapter_path":  runtime.ShellSingleQuote(anyString(adapterPayload.Path)),
		"instance_id":   runtime.ShellSingleQuote(options.instanceID),
		"request_file":  runtime.ShellSingleQuote(options.requestFile),
		"output_file":   runtime.ShellSingleQuote(options.outputFile),
		"workspace_dir": runtime.ShellSingleQuote(workbenchWorkspaceDir(options.outputFile)),
	}
	for key, value := range extra {
		replacements[key] = value
	}
	return replacements
}

func workbenchWorkspaceDir(outputFile string) string {
	return filepath.Join(outputFile+".d", "workspace")
}

func ensureWorkbenchWorkspace(outputFile string) (string, string, error) {
	artifactDir := outputFile + ".d"
	workspaceDir := workbenchWorkspaceDir(outputFile)
	if err := os.MkdirAll(workspaceDir, 0o755); err != nil {
		return "", "", err
	}
	return artifactDir, workspaceDir, nil
}

func executeWorkbenchCommand(repoRoot string, commandText string) (string, error) {
	stdoutText, _, err := executeWorkbenchCommandWithTimeout(repoRoot, commandText, 0)
	return stdoutText, err
}

func executeWorkbenchCommandWithTimeout(repoRoot string, commandText string, timeout time.Duration) (string, bool, error) {
	commandContext := context.Background()
	cancel := func() {}
	if timeout > 0 {
		commandContext, cancel = context.WithTimeout(commandContext, timeout)
	}
	defer cancel()
	command := exec.CommandContext(commandContext, "bash", "-lc", commandText)
	command.Dir = repoRoot
	var stdout bytes.Buffer
	var stderr bytes.Buffer
	command.Stdout = &stdout
	command.Stderr = &stderr
	err := command.Run()
	stdoutText := strings.TrimSpace(stdout.String())
	stderrText := strings.TrimSpace(stderr.String())
	if err != nil {
		if timeout > 0 && commandContext.Err() == context.DeadlineExceeded {
			return stdoutText, true, fmt.Errorf("command timed out after %s", timeout)
		}
		if stderrText != "" {
			if stdoutText != "" {
				return stdoutText, false, fmt.Errorf("command failed: %s\n%s", stderrText, stdoutText)
			}
			return stdoutText, false, fmt.Errorf("command failed: %s", stderrText)
		}
		if stdoutText == "" {
			return stdoutText, false, fmt.Errorf("command failed: %w", err)
		}
		return stdoutText, false, fmt.Errorf("command failed: %s", stdoutText)
	}
	return stdoutText, false, nil
}

func decodeJSONObjectFromString(payload string) (map[string]any, error) {
	decoder := json.NewDecoder(strings.NewReader(payload))
	decoder.UseNumber()
	value := map[string]any{}
	if err := decoder.Decode(&value); err != nil {
		return nil, fmt.Errorf("failed to parse JSON object: %w", err)
	}
	if len(value) == 0 {
		return nil, fmt.Errorf("JSON root must be an object")
	}
	return value, nil
}

func ensureParentDir(path *string) error {
	if path == nil || strings.TrimSpace(*path) == "" {
		return nil
	}
	return os.MkdirAll(filepath.Dir(*path), 0o755)
}

func isRecursiveWorkbenchDiscoverCommand(command string) bool {
	return strings.Contains(command, "cautilus workbench discover") ||
		strings.Contains(command, "scripts/agent-runtime/discover-workbench-instances.mjs")
}

func isRecursiveWorkbenchRunLiveCommand(command string) bool {
	return strings.Contains(command, "cautilus workbench run-live") ||
		strings.Contains(command, "scripts/agent-runtime/run-live-instance-scenario.mjs")
}
