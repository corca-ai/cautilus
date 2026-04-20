package app

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
	"github.com/corca-ai/cautilus/internal/runtime"
)

type workbenchRunScenariosArgs struct {
	repoRoot     string
	adapter      *string
	adapterName  *string
	instanceID   string
	requestsFile string
	outputFile   string
	concurrency  int
}

type workbenchRunScenariosJob struct {
	index   int
	request map[string]any
}

type workbenchRunScenariosEntry struct {
	index      int
	requestID  string
	scenarioID string
	outputFile string
	result     map[string]any
}

func handleWorkbenchRunScenarios(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseWorkbenchRunScenariosArgs(args, cwd)
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
	requestBatch, err := readJSONObject(options.requestsFile)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", options.requestsFile, err)
		return 1
	}
	requests, err := validateWorkbenchBatchRequest(requestBatch, options.instanceID)
	if err != nil {
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
	result, err := executeWorkbenchBatchRequests(options, adapterPayload, requests)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeOutputResolved(io.Discard, &options.outputFile, result); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	_, _ = fmt.Fprintf(stdout, "%s\n", options.outputFile)
	return 0
}

func parseWorkbenchRunScenariosArgs(args []string, cwd string) (*workbenchRunScenariosArgs, error) {
	options := &workbenchRunScenariosArgs{repoRoot: cwd, concurrency: 1}
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
		case "--requests-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.requestsFile = resolvePath(cwd, value)
		case "--output-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.outputFile = resolvePath(cwd, value)
		case "--concurrency":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			count, parseErr := parsePositiveInt(value, "--concurrency")
			if parseErr != nil {
				return nil, fmt.Errorf("--concurrency must be a positive integer")
			}
			options.concurrency = count
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
	if strings.TrimSpace(options.requestsFile) == "" {
		return nil, fmt.Errorf("--requests-file is required")
	}
	if strings.TrimSpace(options.outputFile) == "" {
		return nil, fmt.Errorf("--output-file is required")
	}
	return options, nil
}

func validateWorkbenchBatchRequest(packet map[string]any, expectedInstanceID string) ([]map[string]any, error) {
	if anyString(packet["schemaVersion"]) != contracts.LiveRunInvocationBatchRequestSchema {
		return nil, fmt.Errorf("request batch must use schemaVersion %s", contracts.LiveRunInvocationBatchRequestSchema)
	}
	if anyString(packet["instanceId"]) != expectedInstanceID {
		return nil, fmt.Errorf("request batch.instanceId %q does not match --instance-id %q", anyString(packet["instanceId"]), expectedInstanceID)
	}
	rawRequests := arrayOrEmpty(packet["requests"])
	if len(rawRequests) == 0 {
		return nil, fmt.Errorf("request batch.requests must contain at least one request")
	}
	requests := make([]map[string]any, 0, len(rawRequests))
	seenRequestIDs := map[string]struct{}{}
	for index, raw := range rawRequests {
		request := mapOrEmpty(raw)
		if err := validateWorkbenchLiveRequest(request, expectedInstanceID); err != nil {
			return nil, fmt.Errorf("requests[%d]: %w", index, err)
		}
		requestID := anyString(request["requestId"])
		if _, exists := seenRequestIDs[requestID]; exists {
			return nil, fmt.Errorf("requests[%d].requestId %q is duplicated in the batch", index, requestID)
		}
		seenRequestIDs[requestID] = struct{}{}
		requests = append(requests, request)
	}
	return requests, nil
}

func executeWorkbenchBatchRequests(
	options *workbenchRunScenariosArgs,
	adapterPayload *runtime.AdapterPayload,
	requests []map[string]any,
) (map[string]any, error) {
	startedAt := time.Now().UTC()
	batchArtifactDir := options.outputFile + ".d"
	if err := os.MkdirAll(filepath.Join(batchArtifactDir, "runs"), 0o755); err != nil {
		return nil, err
	}

	jobs := make(chan workbenchRunScenariosJob)
	results := make(chan workbenchRunScenariosEntry, len(requests))
	var wg sync.WaitGroup
	workerCount := minInt(options.concurrency, len(requests))
	for workerIndex := 0; workerIndex < workerCount; workerIndex++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for job := range jobs {
				results <- executeWorkbenchBatchJob(options, adapterPayload, batchArtifactDir, job)
			}
		}()
	}
	for index, request := range requests {
		jobs <- workbenchRunScenariosJob{index: index, request: request}
	}
	close(jobs)
	wg.Wait()
	close(results)

	ordered := make([]workbenchRunScenariosEntry, len(requests))
	for entry := range results {
		ordered[entry.index] = entry
	}
	completedCount := 0
	blockedCount := 0
	failedCount := 0
	resultEntries := make([]any, 0, len(ordered))
	for _, entry := range ordered {
		switch anyString(entry.result["executionStatus"]) {
		case "completed":
			completedCount++
		case "blocked":
			blockedCount++
		default:
			failedCount++
		}
		resultEntries = append(resultEntries, map[string]any{
			"requestId":  entry.requestID,
			"scenarioId": entry.scenarioID,
			"outputFile": entry.outputFile,
			"result":     entry.result,
		})
	}
	completedAt := time.Now().UTC()
	packet := map[string]any{
		"schemaVersion": contracts.LiveRunInvocationBatchResultSchema,
		"instanceId":    options.instanceID,
		"summary": fmt.Sprintf(
			"Completed %d batched live-run request(s): %d completed, %d blocked, %d failed.",
			len(ordered),
			completedCount,
			blockedCount,
			failedCount,
		),
		"startedAt":   startedAt.Format(time.RFC3339Nano),
		"completedAt": completedAt.Format(time.RFC3339Nano),
		"durationMs":  completedAt.Sub(startedAt).Milliseconds(),
		"counts": map[string]any{
			"total":     len(ordered),
			"completed": completedCount,
			"blocked":   blockedCount,
			"failed":    failedCount,
		},
		"results": resultEntries,
	}
	if err := validateWorkbenchBatchResult(packet, options.instanceID); err != nil {
		return nil, err
	}
	return packet, nil
}

func executeWorkbenchBatchJob(
	options *workbenchRunScenariosArgs,
	adapterPayload *runtime.AdapterPayload,
	batchArtifactDir string,
	job workbenchRunScenariosJob,
) workbenchRunScenariosEntry {
	request := job.request
	requestID := anyString(request["requestId"])
	scenarioID := anyString(mapOrEmpty(request["scenario"])["scenarioId"])
	requestSlug := requestID
	runDir := filepath.Join(batchArtifactDir, "runs", fmt.Sprintf("%03d-%s", job.index+1, runtime.SlugifyLabel(&requestSlug)))
	requestFile := filepath.Join(runDir, "request.json")
	outputFile := filepath.Join(runDir, "result.json")
	if err := os.MkdirAll(runDir, 0o755); err != nil {
		return workbenchRunScenariosEntry{
			index:      job.index,
			requestID:  requestID,
			scenarioID: scenarioID,
			outputFile: outputFile,
			result:     buildWorkbenchBatchErrorResult(request, "batch_artifact_dir_failed", err),
		}
	}
	if err := writeOutputResolved(io.Discard, &requestFile, request); err != nil {
		return workbenchRunScenariosEntry{
			index:      job.index,
			requestID:  requestID,
			scenarioID: scenarioID,
			outputFile: outputFile,
			result:     buildWorkbenchBatchErrorResult(request, "batch_request_write_failed", err),
		}
	}
	liveOptions := &workbenchRunLiveArgs{
		repoRoot:    options.repoRoot,
		adapter:     options.adapter,
		adapterName: options.adapterName,
		instanceID:  options.instanceID,
		requestFile: requestFile,
		outputFile:  outputFile,
	}
	result, err := executeWorkbenchLiveRequest(liveOptions, adapterPayload, request)
	if err != nil {
		result = buildWorkbenchBatchErrorResult(request, "live_run_batch_failed", err)
	}
	_ = writeOutputResolved(io.Discard, &outputFile, result)
	return workbenchRunScenariosEntry{
		index:      job.index,
		requestID:  requestID,
		scenarioID: scenarioID,
		outputFile: outputFile,
		result:     result,
	}
}

func buildWorkbenchBatchErrorResult(request map[string]any, code string, err error) map[string]any {
	message := "batch request failed"
	if err != nil {
		message = err.Error()
	}
	return finalizeWorkbenchDiagnosticResult(
		request,
		nil,
		time.Now().UTC(),
		"failed",
		"live_run_internal_error",
		fmt.Sprintf("Batched live run failed for request %s.", anyString(request["requestId"])),
		[]any{workbenchDiagnostic(code, message)},
	)
}

func validateWorkbenchBatchResult(packet map[string]any, expectedInstanceID string) error {
	if anyString(packet["schemaVersion"]) != contracts.LiveRunInvocationBatchResultSchema {
		return fmt.Errorf("batch result must use schemaVersion %s", contracts.LiveRunInvocationBatchResultSchema)
	}
	if anyString(packet["instanceId"]) != expectedInstanceID {
		return fmt.Errorf("batch result.instanceId %q does not match expected instance %q", anyString(packet["instanceId"]), expectedInstanceID)
	}
	if strings.TrimSpace(anyString(packet["summary"])) == "" {
		return fmt.Errorf("batch result.summary must be a non-empty string")
	}
	counts := mapOrEmpty(packet["counts"])
	for _, field := range []string{"total", "completed", "blocked", "failed"} {
		if intFromAny(counts[field], -1) < 0 {
			return fmt.Errorf("batch result.counts.%s must be a non-negative integer", field)
		}
	}
	results := arrayOrEmpty(packet["results"])
	if len(results) != intFromAny(counts["total"], -1) {
		return fmt.Errorf("batch result.counts.total must match the number of result entries")
	}
	for index, raw := range results {
		entry := mapOrEmpty(raw)
		if strings.TrimSpace(anyString(entry["requestId"])) == "" {
			return fmt.Errorf("results[%d].requestId must be a non-empty string", index)
		}
		if strings.TrimSpace(anyString(entry["scenarioId"])) == "" {
			return fmt.Errorf("results[%d].scenarioId must be a non-empty string", index)
		}
		if strings.TrimSpace(anyString(entry["outputFile"])) == "" {
			return fmt.Errorf("results[%d].outputFile must be a non-empty string", index)
		}
		if err := validateWorkbenchLiveResult(mapOrEmpty(entry["result"]), map[string]any{
			"requestId":  entry["requestId"],
			"instanceId": packet["instanceId"],
			"scenario": map[string]any{
				"scenarioId": entry["scenarioId"],
			},
		}); err != nil {
			return fmt.Errorf("results[%d].result: %w", index, err)
		}
	}
	return nil
}
