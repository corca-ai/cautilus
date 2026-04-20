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
	var result map[string]any
	if hasWorkbenchMultiTurnLoop(liveRunInvocation) {
		result, err = executeWorkbenchMultiTurnLiveRun(options, adapterPayload, liveRunInvocation, request)
		if err != nil {
			_, _ = fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		if err := writeOutputResolved(io.Discard, &options.outputFile, result); err != nil {
			_, _ = fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
	} else {
		commandTemplate, commandErr := resolveWorkbenchLiveCommand(liveRunInvocation)
		if commandErr != nil {
			_, _ = fmt.Fprintf(stderr, "%s\n", commandErr)
			return 1
		}
		commandText, renderErr := renderTemplate(commandTemplate, workbenchCommandReplacements(adapterPayload, options, nil))
		if renderErr != nil {
			_, _ = fmt.Fprintf(stderr, "%s\n", renderErr)
			return 1
		}
		if _, runErr := executeWorkbenchCommand(options.repoRoot, commandText); runErr != nil {
			_, _ = fmt.Fprintf(stderr, "%s\n", runErr)
			return 1
		}
		result, err = readJSONObject(options.outputFile)
		if err != nil {
			_, _ = fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", options.outputFile, err)
			return 1
		}
	}
	if err := validateWorkbenchLiveResult(result, request); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	_, _ = fmt.Fprintf(stdout, "%s\n", options.outputFile)
	return 0
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
	_, err := normalizeWorkbenchSimulatorTurns(scenario)
	return err
}

func normalizeWorkbenchSimulatorTurns(scenario map[string]any) ([]map[string]any, error) {
	if simulator := mapOrEmpty(scenario["simulator"]); len(simulator) > 0 {
		if anyString(simulator["kind"]) != "scripted" {
			return nil, fmt.Errorf("request.scenario.simulator.kind must be scripted for the current slice")
		}
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
		return normalized, nil
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
	return normalized, nil
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
	if status == "completed" {
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
) (map[string]any, error) {
	scriptedTurns, err := normalizeWorkbenchSimulatorTurns(mapOrEmpty(request["scenario"]))
	if err != nil {
		return nil, err
	}
	startedAt := time.Now().UTC()
	timeoutMs := intFromAny(request["timeoutMs"], 0)
	artifactDir := options.outputFile + ".d"
	if err := os.MkdirAll(artifactDir, 0o755); err != nil {
		return nil, err
	}
	transcript := make([]any, 0, minInt(intFromAny(mapOrEmpty(request["scenario"])["maxTurns"], 0), len(scriptedTurns)))
	singleTurnTemplate := strings.TrimSpace(anyString(liveRunInvocation["consumer_single_turn_command_template"]))
	if isRecursiveWorkbenchRunLiveCommand(singleTurnTemplate) {
		return nil, fmt.Errorf("live_run_invocation.consumer_single_turn_command_template must point at a consumer-owned single-turn command")
	}
	for index, simulatorTurn := range scriptedTurns {
		if index >= intFromAny(mapOrEmpty(request["scenario"])["maxTurns"], 0) {
			break
		}
		remainingMs := workbenchRemainingTimeoutMs(startedAt, timeoutMs)
		if remainingMs <= 0 {
			return finalizeWorkbenchCompletedResult(request, transcript, startedAt, "timeout_reached", nil, "", nil)
		}
		turnRequestFile := filepath.Join(artifactDir, fmt.Sprintf("turn-request-%02d.json", index+1))
		turnResultFile := filepath.Join(artifactDir, fmt.Sprintf("turn-result-%02d.json", index+1))
		turnRequest := map[string]any{
			"schemaVersion": contracts.LiveRunTurnRequestSchema,
			"requestId":     anyString(request["requestId"]),
			"instanceId":    anyString(request["instanceId"]),
			"scenarioId":    anyString(mapOrEmpty(request["scenario"])["scenarioId"]),
			"turnIndex":     index + 1,
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
			return nil, err
		}
		commandText, err := renderTemplate(
			singleTurnTemplate,
			workbenchCommandReplacements(adapterPayload, options, map[string]string{
				"turn_request_file": runtime.ShellSingleQuote(turnRequestFile),
				"turn_result_file":  runtime.ShellSingleQuote(turnResultFile),
			}),
		)
		if err != nil {
			return nil, err
		}
		if _, timedOut, err := executeWorkbenchCommandWithTimeout(options.repoRoot, commandText, time.Duration(remainingMs)*time.Millisecond); err != nil {
			if timedOut {
				return finalizeWorkbenchCompletedResult(request, transcript, startedAt, "timeout_reached", nil, "", nil)
			}
			return finalizeWorkbenchDiagnosticResult(
				request,
				transcript,
				startedAt,
				"failed",
				"consumer_turn_failed",
				"consumer single-turn command failed",
				[]any{workbenchDiagnostic("consumer_single_turn_command_failed", err.Error())},
			)
		}
		turnResult, err := readJSONObject(turnResultFile)
		if err != nil {
			return finalizeWorkbenchDiagnosticResult(
				request,
				transcript,
				startedAt,
				"failed",
				"consumer_turn_failed",
				"consumer single-turn command did not produce a valid result",
				[]any{workbenchDiagnostic("invalid_turn_result", err.Error())},
			)
		}
		if err := validateWorkbenchTurnResult(turnResult, request, index+1); err != nil {
			return finalizeWorkbenchDiagnosticResult(
				request,
				transcript,
				startedAt,
				"failed",
				"consumer_turn_failed",
				"consumer single-turn result did not match the contract",
				[]any{workbenchDiagnostic("invalid_turn_result_contract", err.Error())},
			)
		}
		switch anyString(turnResult["executionStatus"]) {
		case "completed":
			entry := map[string]any{
				"turnIndex":     index + 1,
				"simulatorTurn": simulatorTurn,
				"assistantTurn": mapOrEmpty(turnResult["assistantTurn"]),
			}
			if signal := turnResult["consumerSignal"]; signal != nil {
				entry["consumerSignal"] = signal
			}
			transcript = append(transcript, entry)
		case "blocked":
			return finalizeWorkbenchDiagnosticResult(
				request,
				transcript,
				startedAt,
				"blocked",
				"blocked_by_consumer",
				anyString(turnResult["summary"]),
				arrayOrEmpty(turnResult["diagnostics"]),
			)
		default:
			return finalizeWorkbenchDiagnosticResult(
				request,
				transcript,
				startedAt,
				"failed",
				"consumer_turn_failed",
				anyString(turnResult["summary"]),
				arrayOrEmpty(turnResult["diagnostics"]),
			)
		}
	}
	stopReason := "scripted_turns_exhausted"
	if len(scriptedTurns) > intFromAny(mapOrEmpty(request["scenario"])["maxTurns"], 0) {
		stopReason = "turn_limit_reached"
	}
	transcriptFile := ""
	artifactPaths := []any{}
	if truthyWorkbenchCaptureTranscript(request) || strings.TrimSpace(anyString(liveRunInvocation["consumer_evaluator_command_template"])) != "" {
		transcriptFile = filepath.Join(artifactDir, "transcript.json")
		if err := writeOutputResolved(io.Discard, &transcriptFile, buildWorkbenchTranscriptPacket(request, transcript, stopReason)); err != nil {
			return nil, err
		}
		if truthyWorkbenchCaptureTranscript(request) {
			artifactPaths = append(artifactPaths, transcriptFile)
		}
	}
	evaluation := map[string]any(nil)
	if evaluatorTemplate := strings.TrimSpace(anyString(liveRunInvocation["consumer_evaluator_command_template"])); evaluatorTemplate != "" {
		if isRecursiveWorkbenchRunLiveCommand(evaluatorTemplate) {
			return nil, fmt.Errorf("live_run_invocation.consumer_evaluator_command_template must point at a consumer-owned evaluator command")
		}
		remainingMs := workbenchRemainingTimeoutMs(startedAt, timeoutMs)
		if remainingMs <= 0 {
			evaluation = map[string]any{
				"status":  "skipped",
				"summary": "Evaluator skipped because the live-run timeout budget was exhausted.",
			}
		} else {
			evaluationOutputFile := filepath.Join(artifactDir, "evaluation.json")
			commandText, err := renderTemplate(
				evaluatorTemplate,
				workbenchCommandReplacements(adapterPayload, options, map[string]string{
					"transcript_file":        runtime.ShellSingleQuote(transcriptFile),
					"evaluation_output_file": runtime.ShellSingleQuote(evaluationOutputFile),
				}),
			)
			if err != nil {
				return nil, err
			}
			if _, timedOut, err := executeWorkbenchCommandWithTimeout(options.repoRoot, commandText, time.Duration(remainingMs)*time.Millisecond); err != nil {
				if timedOut {
					evaluation = map[string]any{
						"status":  "failed",
						"summary": "Evaluator timed out before producing a result.",
					}
				} else {
					evaluation = map[string]any{
						"status":  "failed",
						"summary": fmt.Sprintf("Evaluator command failed: %s", err),
					}
				}
			} else {
				parsed, err := readJSONObject(evaluationOutputFile)
				if err != nil {
					evaluation = map[string]any{
						"status":  "failed",
						"summary": fmt.Sprintf("Evaluator output was not valid JSON: %s", err),
					}
				} else {
					evaluation = parsed
					artifactPaths = append(artifactPaths, evaluationOutputFile)
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
		scenarioSummary = fmt.Sprintf("Completed %d scripted turn(s); stop reason: %s.", len(transcript), stopReason)
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
	if len(mapOrEmpty(evaluation)) > 0 {
		result["evaluation"] = evaluation
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
) (map[string]any, error) {
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
	return result, nil
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
		"repo_root":    runtime.ShellSingleQuote(options.repoRoot),
		"adapter_path": runtime.ShellSingleQuote(anyString(adapterPayload.Path)),
		"instance_id":  runtime.ShellSingleQuote(options.instanceID),
		"request_file": runtime.ShellSingleQuote(options.requestFile),
		"output_file":  runtime.ShellSingleQuote(options.outputFile),
	}
	for key, value := range extra {
		replacements[key] = value
	}
	return replacements
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
