package app

import (
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
	commandTemplate, err := resolveWorkbenchLiveCommand(liveRunInvocation)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := ensureParentDir(&options.outputFile); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	commandText, err := renderTemplate(commandTemplate, workbenchCommandReplacements(adapterPayload, options))
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if _, err := executeWorkbenchCommand(options.repoRoot, commandText); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	result, err := readJSONObject(options.outputFile)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", options.outputFile, err)
		return 1
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
	turns := arrayOrEmpty(scenario["simulatorTurns"])
	if len(turns) == 0 {
		return fmt.Errorf("request.scenario.simulatorTurns must be a non-empty list of strings")
	}
	for index, turn := range turns {
		if strings.TrimSpace(anyString(turn)) == "" {
			return fmt.Errorf("request.scenario.simulatorTurns[%d] must be a non-empty string", index)
		}
	}
	return nil
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

func workbenchCommandReplacements(adapterPayload *runtime.AdapterPayload, options *workbenchRunLiveArgs) map[string]string {
	return map[string]string{
		"repo_root":    runtime.ShellSingleQuote(options.repoRoot),
		"adapter_path": runtime.ShellSingleQuote(anyString(adapterPayload.Path)),
		"instance_id":  runtime.ShellSingleQuote(options.instanceID),
		"request_file": runtime.ShellSingleQuote(options.requestFile),
		"output_file":  runtime.ShellSingleQuote(options.outputFile),
	}
}

func executeWorkbenchCommand(repoRoot string, commandText string) (string, error) {
	command := exec.Command("bash", "-lc", commandText)
	command.Dir = repoRoot
	output, err := command.CombinedOutput()
	text := strings.TrimSpace(string(output))
	if err != nil {
		if text == "" {
			return "", fmt.Errorf("command failed: %w", err)
		}
		return "", fmt.Errorf("command failed: %s", text)
	}
	return text, nil
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
