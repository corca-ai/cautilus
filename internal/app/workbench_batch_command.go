package app

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"slices"
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
	index        int
	requestID    string
	scenarioID   string
	outputFile   string
	result       map[string]any
	attemptCount int
	attempts     []any
}

type workbenchBatchRetryPolicy struct {
	MaxAttempts    int
	RetryOnClasses []string
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
	requests, retryPolicy, err := validateWorkbenchBatchRequest(requestBatch, options.instanceID)
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
	result, err := executeWorkbenchBatchRequests(options, adapterPayload, requests, retryPolicy)
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

func validateWorkbenchBatchRequest(packet map[string]any, expectedInstanceID string) ([]map[string]any, *workbenchBatchRetryPolicy, error) {
	if anyString(packet["schemaVersion"]) != contracts.LiveRunInvocationBatchRequestSchema {
		return nil, nil, fmt.Errorf("request batch must use schemaVersion %s", contracts.LiveRunInvocationBatchRequestSchema)
	}
	if anyString(packet["instanceId"]) != expectedInstanceID {
		return nil, nil, fmt.Errorf("request batch.instanceId %q does not match --instance-id %q", anyString(packet["instanceId"]), expectedInstanceID)
	}
	retryPolicy, err := parseWorkbenchBatchRetryPolicy(packet["retryPolicy"], "request batch.retryPolicy")
	if err != nil {
		return nil, nil, err
	}
	rawRequests := arrayOrEmpty(packet["requests"])
	if len(rawRequests) == 0 {
		return nil, nil, fmt.Errorf("request batch.requests must contain at least one request")
	}
	requests := make([]map[string]any, 0, len(rawRequests))
	seenRequestIDs := map[string]struct{}{}
	for index, raw := range rawRequests {
		request := mapOrEmpty(raw)
		if err := validateWorkbenchLiveRequest(request, expectedInstanceID); err != nil {
			return nil, nil, fmt.Errorf("requests[%d]: %w", index, err)
		}
		requestID := anyString(request["requestId"])
		if _, exists := seenRequestIDs[requestID]; exists {
			return nil, nil, fmt.Errorf("requests[%d].requestId %q is duplicated in the batch", index, requestID)
		}
		seenRequestIDs[requestID] = struct{}{}
		requests = append(requests, request)
	}
	return requests, retryPolicy, nil
}

func executeWorkbenchBatchRequests(
	options *workbenchRunScenariosArgs,
	adapterPayload *runtime.AdapterPayload,
	requests []map[string]any,
	retryPolicy *workbenchBatchRetryPolicy,
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
				results <- executeWorkbenchBatchJob(options, adapterPayload, batchArtifactDir, retryPolicy, job)
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
	attemptTotal := 0
	retriedRequests := 0
	transientClassCounts := map[string]int{
		"rate_limit":                 0,
		"transient_provider_failure": 0,
	}
	resultEntries := make([]any, 0, len(ordered))
	for _, entry := range ordered {
		attemptTotal += entry.attemptCount
		if entry.attemptCount > 1 {
			retriedRequests++
		}
		for _, rawAttempt := range entry.attempts {
			class := workbenchTransientFailureClass(mapOrEmpty(mapOrEmpty(rawAttempt)["result"]))
			if class == "" {
				continue
			}
			transientClassCounts[class] += 1
		}
		switch anyString(entry.result["executionStatus"]) {
		case "completed":
			completedCount++
		case "blocked":
			blockedCount++
		default:
			failedCount++
		}
		resultEntries = append(resultEntries, map[string]any{
			"requestId":    entry.requestID,
			"scenarioId":   entry.scenarioID,
			"outputFile":   entry.outputFile,
			"result":       entry.result,
			"attemptCount": entry.attemptCount,
			"attempts":     entry.attempts,
		})
	}
	completedAt := time.Now().UTC()
	packet := map[string]any{
		"schemaVersion": contracts.LiveRunInvocationBatchResultSchema,
		"instanceId":    options.instanceID,
		"summary": fmt.Sprintf(
			"Completed %d batched live-run request(s) in %d attempt(s): %d completed, %d blocked, %d failed.",
			len(ordered),
			attemptTotal,
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
		"attemptCounts": map[string]any{
			"total":           attemptTotal,
			"retriedRequests": retriedRequests,
		},
		"transientClassCounts": map[string]any{
			"rate_limit":                 transientClassCounts["rate_limit"],
			"transient_provider_failure": transientClassCounts["transient_provider_failure"],
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
	retryPolicy *workbenchBatchRetryPolicy,
	job workbenchRunScenariosJob,
) workbenchRunScenariosEntry {
	request := job.request
	requestID := anyString(request["requestId"])
	scenarioID := anyString(mapOrEmpty(request["scenario"])["scenarioId"])
	requestSlug := requestID
	runDir := filepath.Join(batchArtifactDir, "runs", fmt.Sprintf("%03d-%s", job.index+1, runtime.SlugifyLabel(&requestSlug)))
	if err := os.MkdirAll(runDir, 0o755); err != nil {
		outputFile := filepath.Join(runDir, "attempt-01", "result.json")
		result := buildWorkbenchBatchErrorResult(request, "batch_artifact_dir_failed", err)
		return workbenchRunScenariosEntry{
			index:        job.index,
			requestID:    requestID,
			scenarioID:   scenarioID,
			outputFile:   outputFile,
			result:       result,
			attemptCount: 1,
			attempts: []any{
				map[string]any{
					"attemptIndex": 1,
					"outputFile":   outputFile,
					"result":       result,
				},
			},
		}
	}
	maxAttempts := 1
	if retryPolicy != nil {
		maxAttempts = retryPolicy.MaxAttempts
	}
	attempts := make([]any, 0, maxAttempts)
	finalOutputFile := ""
	finalResult := map[string]any{}
	for attemptIndex := 1; attemptIndex <= maxAttempts; attemptIndex++ {
		attemptDir := filepath.Join(runDir, fmt.Sprintf("attempt-%02d", attemptIndex))
		requestFile := filepath.Join(attemptDir, "request.json")
		outputFile := filepath.Join(attemptDir, "result.json")
		if err := os.MkdirAll(attemptDir, 0o755); err != nil {
			result := buildWorkbenchBatchErrorResult(request, "batch_attempt_dir_failed", err)
			attempts = append(attempts, map[string]any{
				"attemptIndex": attemptIndex,
				"outputFile":   outputFile,
				"result":       result,
			})
			finalOutputFile = outputFile
			finalResult = result
			break
		}
		if err := writeOutputResolved(io.Discard, &requestFile, request); err != nil {
			result := buildWorkbenchBatchErrorResult(request, "batch_request_write_failed", err)
			attempts = append(attempts, map[string]any{
				"attemptIndex": attemptIndex,
				"outputFile":   outputFile,
				"result":       result,
			})
			finalOutputFile = outputFile
			finalResult = result
			break
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
		attempts = append(attempts, map[string]any{
			"attemptIndex": attemptIndex,
			"outputFile":   outputFile,
			"result":       result,
		})
		finalOutputFile = outputFile
		finalResult = result
		if !shouldRetryWorkbenchBatchResult(result, retryPolicy) {
			break
		}
	}
	return workbenchRunScenariosEntry{
		index:        job.index,
		requestID:    requestID,
		scenarioID:   scenarioID,
		outputFile:   finalOutputFile,
		result:       finalResult,
		attemptCount: len(attempts),
		attempts:     attempts,
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
		nil,
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
	attemptCounts := mapOrEmpty(packet["attemptCounts"])
	for _, field := range []string{"total", "retriedRequests"} {
		if intFromAny(attemptCounts[field], -1) < 0 {
			return fmt.Errorf("batch result.attemptCounts.%s must be a non-negative integer", field)
		}
	}
	if err := validateWorkbenchTransientClassCounts(mapOrEmpty(packet["transientClassCounts"]), "batch result.transientClassCounts"); err != nil {
		return err
	}
	results := arrayOrEmpty(packet["results"])
	if len(results) != intFromAny(counts["total"], -1) {
		return fmt.Errorf("batch result.counts.total must match the number of result entries")
	}
	totalAttempts := 0
	retriedRequests := 0
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
		attemptCount := intFromAny(entry["attemptCount"], 0)
		if attemptCount <= 0 {
			return fmt.Errorf("results[%d].attemptCount must be a positive integer", index)
		}
		attempts := arrayOrEmpty(entry["attempts"])
		if len(attempts) != attemptCount {
			return fmt.Errorf("results[%d].attemptCount must match the number of attempt entries", index)
		}
		totalAttempts += attemptCount
		if attemptCount > 1 {
			retriedRequests++
		}
		lastAttempt := map[string]any{}
		for attemptIndex, rawAttempt := range attempts {
			attempt := mapOrEmpty(rawAttempt)
			if intFromAny(attempt["attemptIndex"], 0) != attemptIndex+1 {
				return fmt.Errorf("results[%d].attempts[%d].attemptIndex must equal %d", index, attemptIndex, attemptIndex+1)
			}
			if strings.TrimSpace(anyString(attempt["outputFile"])) == "" {
				return fmt.Errorf("results[%d].attempts[%d].outputFile must be a non-empty string", index, attemptIndex)
			}
			if err := validateWorkbenchLiveResult(mapOrEmpty(attempt["result"]), map[string]any{
				"requestId":  entry["requestId"],
				"instanceId": packet["instanceId"],
				"scenario": map[string]any{
					"scenarioId": entry["scenarioId"],
				},
			}); err != nil {
				return fmt.Errorf("results[%d].attempts[%d].result: %w", index, attemptIndex, err)
			}
			lastAttempt = attempt
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
		if anyString(lastAttempt["outputFile"]) != anyString(entry["outputFile"]) {
			return fmt.Errorf("results[%d].outputFile must match the last attempt output file", index)
		}
		if toJSONString(mapOrEmpty(lastAttempt["result"])) != toJSONString(mapOrEmpty(entry["result"])) {
			return fmt.Errorf("results[%d].result must match the last attempt result", index)
		}
	}
	if totalAttempts != intFromAny(attemptCounts["total"], -1) {
		return fmt.Errorf("batch result.attemptCounts.total must match the total number of attempt entries")
	}
	if retriedRequests != intFromAny(attemptCounts["retriedRequests"], -1) {
		return fmt.Errorf("batch result.attemptCounts.retriedRequests must match the number of retried requests")
	}
	return nil
}

func parseWorkbenchBatchRetryPolicy(value any, path string) (*workbenchBatchRetryPolicy, error) {
	if value == nil {
		return nil, nil
	}
	record := mapOrEmpty(value)
	if len(record) == 0 {
		return nil, fmt.Errorf("%s must be an object when present", path)
	}
	maxAttempts := intFromAny(record["maxAttempts"], 0)
	if maxAttempts <= 0 {
		return nil, fmt.Errorf("%s.maxAttempts must be a positive integer", path)
	}
	rawClasses := arrayOrEmpty(record["retryOnClasses"])
	if len(rawClasses) == 0 {
		return nil, fmt.Errorf("%s.retryOnClasses must contain at least one transient class", path)
	}
	retryOnClasses := make([]string, 0, len(rawClasses))
	for index, raw := range rawClasses {
		class := strings.TrimSpace(anyString(raw))
		if !workbenchValidTransientFailureClass(class) {
			return nil, fmt.Errorf("%s.retryOnClasses[%d] must be one of: rate_limit, transient_provider_failure", path, index)
		}
		if slices.Contains(retryOnClasses, class) {
			continue
		}
		retryOnClasses = append(retryOnClasses, class)
	}
	return &workbenchBatchRetryPolicy{
		MaxAttempts:    maxAttempts,
		RetryOnClasses: retryOnClasses,
	}, nil
}

func validateWorkbenchBatchRetryPolicy(value any, path string) (map[string]any, error) {
	policy, err := parseWorkbenchBatchRetryPolicy(value, path)
	if err != nil || policy == nil {
		return nil, err
	}
	return map[string]any{
		"maxAttempts":    policy.MaxAttempts,
		"retryOnClasses": stringSliceToAny(policy.RetryOnClasses),
	}, nil
}

func shouldRetryWorkbenchBatchResult(result map[string]any, retryPolicy *workbenchBatchRetryPolicy) bool {
	if retryPolicy == nil {
		return false
	}
	class := workbenchTransientFailureClass(result)
	if class == "" {
		return false
	}
	return slices.Contains(retryPolicy.RetryOnClasses, class)
}

func validateWorkbenchTransientClassCounts(counts map[string]any, path string) error {
	if len(counts) == 0 {
		return fmt.Errorf("%s must be an object", path)
	}
	for _, class := range []string{"rate_limit", "transient_provider_failure"} {
		if intFromAny(counts[class], -1) < 0 {
			return fmt.Errorf("%s.%s must be a non-negative integer", path, class)
		}
	}
	return nil
}
