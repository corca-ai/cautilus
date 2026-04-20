package app

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
)

type workbenchRunSimulatorPersonaArgs struct {
	workspace            string
	simulatorRequestFile string
	simulatorResultFile  string
	backend              string
	fixtureResultsFile   *string
	timeoutMs            int
}

//nolint:errcheck // CLI stdout/stderr reporting is best-effort.
func handleWorkbenchRunSimulatorPersona(toolRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseWorkbenchRunSimulatorPersonaArgs(args, cwd)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	request, err := readJSONObject(options.simulatorRequestFile)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", options.simulatorRequestFile, err)
		return 1
	}
	if err := validateWorkbenchSimulatorRequest(request); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	result, err := runWorkbenchPersonaSimulator(toolRoot, options, request)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := validateWorkbenchSimulatorResult(result, request, intFromAny(request["turnIndex"], 0)); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := ensureParentDir(&options.simulatorResultFile); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeOutputResolved(io.Discard, &options.simulatorResultFile, result); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	_, _ = fmt.Fprintf(stdout, "%s\n", options.simulatorResultFile)
	return 0
}

func parseWorkbenchRunSimulatorPersonaArgs(args []string, cwd string) (*workbenchRunSimulatorPersonaArgs, error) {
	options := &workbenchRunSimulatorPersonaArgs{
		workspace: cwd,
		timeoutMs: 120000,
	}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--workspace":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.workspace = resolvePath(cwd, value)
		case "--simulator-request-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.simulatorRequestFile = resolvePath(cwd, value)
		case "--simulator-result-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.simulatorResultFile = resolvePath(cwd, value)
		case "--backend":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.backend = value
		case "--fixture-results-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.fixtureResultsFile = &resolved
		case "--timeout-ms":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			timeout, parseErr := parsePositiveInt(value, "--timeout-ms")
			if parseErr != nil {
				return nil, parseErr
			}
			options.timeoutMs = timeout
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	if strings.TrimSpace(options.simulatorRequestFile) == "" {
		return nil, fmt.Errorf("--simulator-request-file is required")
	}
	if strings.TrimSpace(options.simulatorResultFile) == "" {
		return nil, fmt.Errorf("--simulator-result-file is required")
	}
	switch options.backend {
	case "codex_exec", "claude_p", "fixture":
	default:
		return nil, fmt.Errorf("--backend must be codex_exec, claude_p, or fixture")
	}
	if options.backend == "fixture" && (options.fixtureResultsFile == nil || strings.TrimSpace(*options.fixtureResultsFile) == "") {
		return nil, fmt.Errorf("--fixture-results-file is required when --backend fixture")
	}
	return options, nil
}

func parsePositiveInt(value string, field string) (int, error) {
	parsed, err := strconv.Atoi(strings.TrimSpace(value))
	if err != nil || parsed <= 0 {
		return 0, fmt.Errorf("%s must be a positive integer", field)
	}
	return parsed, nil
}

func validateWorkbenchSimulatorRequest(request map[string]any) error {
	if anyString(request["schemaVersion"]) != contracts.LiveRunSimulatorRequestSchema {
		return fmt.Errorf("simulator request packet must use schemaVersion %s", contracts.LiveRunSimulatorRequestSchema)
	}
	for _, field := range []string{"requestId", "instanceId", "scenarioId", "instructions"} {
		if strings.TrimSpace(anyString(request[field])) == "" {
			return fmt.Errorf("simulator request.%s must be a non-empty string", field)
		}
	}
	if intFromAny(request["turnIndex"], 0) <= 0 {
		return fmt.Errorf("simulator request.turnIndex must be a positive integer")
	}
	if intFromAny(request["maxTurns"], 0) <= 0 {
		return fmt.Errorf("simulator request.maxTurns must be a positive integer")
	}
	return validateWorkbenchPersonaTranscript(arrayOrEmpty(request["transcript"]), "simulator request.transcript")
}

func validateWorkbenchPersonaTranscript(entries []any, path string) error {
	for index, raw := range entries {
		entry := mapOrEmpty(raw)
		if intFromAny(entry["turnIndex"], 0) <= 0 {
			return fmt.Errorf("%s[%d].turnIndex must be a positive integer", path, index)
		}
		if _, err := normalizeWorkbenchSimulatorTurn(entry["simulatorTurn"], fmt.Sprintf("%s[%d].simulatorTurn", path, index)); err != nil {
			return err
		}
		if _, err := normalizeWorkbenchSimulatorTurn(entry["assistantTurn"], fmt.Sprintf("%s[%d].assistantTurn", path, index)); err != nil {
			return err
		}
	}
	return nil
}

func runWorkbenchPersonaSimulator(toolRoot string, options *workbenchRunSimulatorPersonaArgs, request map[string]any) (map[string]any, error) {
	if options.backend == "fixture" {
		return buildWorkbenchPersonaFixtureResult(request, anyStringFromPtr(options.fixtureResultsFile))
	}
	return buildWorkbenchPersonaLLMResult(toolRoot, options, request)
}

func buildWorkbenchPersonaFixtureResult(request map[string]any, fixtureFile string) (map[string]any, error) {
	fixture, err := readJSONObject(fixtureFile)
	if err != nil {
		return nil, fmt.Errorf("failed to read JSON from %s: %w", fixtureFile, err)
	}
	responses := arrayOrEmpty(fixture["responses"])
	responseIndex := intFromAny(request["turnIndex"], 0) - 1
	if responseIndex < 0 || responseIndex >= len(responses) {
		return map[string]any{
			"schemaVersion":   contracts.LiveRunSimulatorResultSchema,
			"requestId":       anyString(request["requestId"]),
			"instanceId":      anyString(request["instanceId"]),
			"turnIndex":       intFromAny(request["turnIndex"], 0),
			"executionStatus": "failed",
			"summary":         "Fixture simulator response was missing.",
			"diagnostics": []any{
				workbenchDiagnostic("missing_fixture_response", fmt.Sprintf("No fixture response for turn %d.", intFromAny(request["turnIndex"], 0))),
			},
		}, nil
	}
	response := mapOrEmpty(responses[responseIndex])
	action := strings.TrimSpace(anyString(response["action"]))
	if action == "" {
		return nil, fmt.Errorf("fixture.responses[%d].action must be a non-empty string", responseIndex)
	}
	switch action {
	case "continue":
		turn, err := normalizeWorkbenchSimulatorTurn(firstNonNil(response["simulatorTurn"], response["nextTurnText"]), fmt.Sprintf("fixture.responses[%d].simulatorTurn", responseIndex))
		if err != nil {
			return nil, err
		}
		summary := strings.TrimSpace(anyString(response["summary"]))
		if summary == "" {
			summary = "Fixture simulator continued the conversation."
		}
		return map[string]any{
			"schemaVersion":   contracts.LiveRunSimulatorResultSchema,
			"requestId":       anyString(request["requestId"]),
			"instanceId":      anyString(request["instanceId"]),
			"turnIndex":       intFromAny(request["turnIndex"], 0),
			"executionStatus": "completed",
			"action":          "continue",
			"summary":         summary,
			"simulatorTurn":   turn,
		}, nil
	case "stop":
		stopReason := strings.TrimSpace(anyString(response["stopReason"]))
		if stopReason == "" {
			stopReason = "goal_satisfied"
		}
		summary := strings.TrimSpace(anyString(response["summary"]))
		if summary == "" {
			summary = "Fixture simulator stopped the conversation."
		}
		return map[string]any{
			"schemaVersion":   contracts.LiveRunSimulatorResultSchema,
			"requestId":       anyString(request["requestId"]),
			"instanceId":      anyString(request["instanceId"]),
			"turnIndex":       intFromAny(request["turnIndex"], 0),
			"executionStatus": "completed",
			"action":          "stop",
			"stopReason":      stopReason,
			"summary":         summary,
		}, nil
	default:
		return nil, fmt.Errorf("fixture.responses[%d].action must be continue or stop", responseIndex)
	}
}

func buildWorkbenchPersonaLLMResult(toolRoot string, options *workbenchRunSimulatorPersonaArgs, request map[string]any) (map[string]any, error) {
	tempDir, err := os.MkdirTemp("", "cautilus-live-persona-")
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = os.RemoveAll(tempDir)
	}()

	promptFile := filepath.Join(tempDir, "prompt.txt")
	schemaFile := filepath.Join(tempDir, "schema.json")
	outputFile := filepath.Join(tempDir, "output.json")
	if err := os.WriteFile(promptFile, []byte(renderWorkbenchPersonaPrompt(request)), 0o644); err != nil {
		return nil, err
	}
	if err := writeOutputResolved(io.Discard, &schemaFile, workbenchPersonaSchema()); err != nil {
		return nil, err
	}
	runnerPath, err := resolveWorkbenchPersonaRunner(toolRoot)
	if err != nil {
		return buildWorkbenchPersonaFailureResult(request, "persona_backend_failed", "Simulator persona backend failed.", err.Error()), nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(options.timeoutMs)*time.Millisecond)
	defer cancel()
	command := exec.CommandContext(
		ctx,
		"bash",
		runnerPath,
		"--backend",
		options.backend,
		"--workspace",
		options.workspace,
		"--prompt-file",
		promptFile,
		"--schema-file",
		schemaFile,
		"--output-file",
		outputFile,
	)
	var stdout bytes.Buffer
	var stderr bytes.Buffer
	command.Stdout = &stdout
	command.Stderr = &stderr
	err = command.Run()
	if ctx.Err() == context.DeadlineExceeded {
		return buildWorkbenchPersonaFailureResult(
			request,
			"persona_timeout",
			"Simulator persona timed out before producing a result.",
			fmt.Sprintf("Simulator backend timed out after %dms.", options.timeoutMs),
		), nil
	}
	if err != nil {
		detail := strings.TrimSpace(strings.Join(filterNonEmptyStrings(stdout.String(), stderr.String()), "\n"))
		if detail == "" {
			detail = "Simulator backend failed."
		}
		return buildWorkbenchPersonaFailureResult(request, "persona_backend_failed", "Simulator persona backend failed.", detail), nil
	}
	parsed, err := readJSONObject(outputFile)
	if err != nil {
		return buildWorkbenchPersonaFailureResult(
			request,
			"persona_backend_failed",
			"Simulator persona backend failed.",
			fmt.Sprintf("persona backend output must be valid JSON: %s", err),
		), nil
	}
	action := strings.TrimSpace(anyString(parsed["action"]))
	if action == "" {
		return nil, fmt.Errorf("persona backend output.action must be a non-empty string")
	}
	switch action {
	case "continue":
		nextTurnText := strings.TrimSpace(anyString(parsed["nextTurnText"]))
		if nextTurnText == "" {
			return nil, fmt.Errorf("persona backend output.nextTurnText must be a non-empty string")
		}
		summary := strings.TrimSpace(anyString(parsed["summary"]))
		if summary == "" {
			return nil, fmt.Errorf("persona backend output.summary must be a non-empty string")
		}
		return map[string]any{
			"schemaVersion":   contracts.LiveRunSimulatorResultSchema,
			"requestId":       anyString(request["requestId"]),
			"instanceId":      anyString(request["instanceId"]),
			"turnIndex":       intFromAny(request["turnIndex"], 0),
			"executionStatus": "completed",
			"action":          "continue",
			"summary":         summary,
			"simulatorTurn":   map[string]any{"text": nextTurnText},
		}, nil
	case "stop":
		summary := strings.TrimSpace(anyString(parsed["summary"]))
		if summary == "" {
			return nil, fmt.Errorf("persona backend output.summary must be a non-empty string")
		}
		stopReason := strings.TrimSpace(anyString(parsed["stopReason"]))
		if stopReason == "" {
			stopReason = "goal_satisfied"
		}
		return map[string]any{
			"schemaVersion":   contracts.LiveRunSimulatorResultSchema,
			"requestId":       anyString(request["requestId"]),
			"instanceId":      anyString(request["instanceId"]),
			"turnIndex":       intFromAny(request["turnIndex"], 0),
			"executionStatus": "completed",
			"action":          "stop",
			"summary":         summary,
			"stopReason":      stopReason,
		}, nil
	default:
		return nil, fmt.Errorf("persona backend output.action must be continue or stop")
	}
}

func resolveWorkbenchPersonaRunner(toolRoot string) (string, error) {
	if strings.TrimSpace(toolRoot) == "" {
		return "", fmt.Errorf("unable to resolve tool root for run-review-variant.sh")
	}
	runnerPath := filepath.Join(toolRoot, "scripts", "agent-runtime", "run-review-variant.sh")
	if !pathExists(runnerPath) {
		return "", fmt.Errorf("missing %s", runnerPath)
	}
	return runnerPath, nil
}

func renderWorkbenchPersonaPrompt(request map[string]any) string {
	transcriptLines := []string{}
	for _, raw := range arrayOrEmpty(request["transcript"]) {
		entry := mapOrEmpty(raw)
		transcriptLines = append(
			transcriptLines,
			fmt.Sprintf("Turn %d user: %s", intFromAny(entry["turnIndex"], 0), anyString(mapOrEmpty(entry["simulatorTurn"])["text"])),
			fmt.Sprintf("Turn %d assistant: %s", intFromAny(entry["turnIndex"], 0), anyString(mapOrEmpty(entry["assistantTurn"])["text"])),
		)
	}
	lines := []string{
		"You are a synthetic user simulator in a bounded chatbot evaluation loop.",
		"Decide whether the user should continue with one more turn or stop because the goal is already satisfied.",
		"If you continue, return one concise user turn.",
		"If you stop, use stopReason `goal_satisfied` unless a more specific stop reason is clearly required.",
		"",
		"Persona instructions:",
		anyString(request["instructions"]),
		"",
		fmt.Sprintf("Next turn index: %d", intFromAny(request["turnIndex"], 0)),
		fmt.Sprintf("Max turns: %d", intFromAny(request["maxTurns"], 0)),
		"",
		"Transcript so far:",
	}
	if len(transcriptLines) == 0 {
		lines = append(lines, "(no prior turns)")
	} else {
		lines = append(lines, transcriptLines...)
	}
	lines = append(lines, "", "Return only JSON matching the provided schema.")
	return strings.Join(lines, "\n") + "\n"
}

func workbenchPersonaSchema() map[string]any {
	return map[string]any{
		"type":     "object",
		"required": []any{"action", "summary"},
		"properties": map[string]any{
			"action": map[string]any{
				"type": "string",
				"enum": []any{"continue", "stop"},
			},
			"summary": map[string]any{
				"type": "string",
			},
			"nextTurnText": map[string]any{
				"type": "string",
			},
			"stopReason": map[string]any{
				"type": "string",
			},
		},
	}
}

func buildWorkbenchPersonaFailureResult(request map[string]any, code string, summary string, message string) map[string]any {
	return map[string]any{
		"schemaVersion":   contracts.LiveRunSimulatorResultSchema,
		"requestId":       anyString(request["requestId"]),
		"instanceId":      anyString(request["instanceId"]),
		"turnIndex":       intFromAny(request["turnIndex"], 0),
		"executionStatus": "failed",
		"summary":         summary,
		"diagnostics": []any{
			workbenchDiagnostic(code, message),
		},
	}
}

func anyStringFromPtr(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func firstNonNil(values ...any) any {
	for _, value := range values {
		if value != nil {
			return value
		}
	}
	return nil
}

func filterNonEmptyStrings(values ...string) []string {
	filtered := []string{}
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed != "" {
			filtered = append(filtered, trimmed)
		}
	}
	return filtered
}
