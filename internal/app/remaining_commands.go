package app

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/contracts"
	"github.com/corca-ai/cautilus/internal/runtime"
	bundledskills "github.com/corca-ai/cautilus/skills"
)

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleWorkspacePrepareCompare(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseWorkspacePrepareCompareArgs(args, cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	gitRoot, err := runGitStrict(options.repoRoot, []string{"rev-parse", "--show-toplevel"})
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	resolvedRun, err := runtime.ResolveRunDir(options.outputDir, nil, nil, environmentMap(), time.Now(), cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if resolvedRun.Source == "auto" {
		fmt.Fprintf(stderr, "Active run: %s\n", resolvedRun.RunDir)
	}
	outputDir := resolvedRun.RunDir
	baselinePath := filepath.Join(outputDir, "baseline")
	candidatePath := filepath.Join(outputDir, "candidate")
	baseline, err := createDetachedWorktree(gitRoot, baselinePath, options.baselineRef, options.force)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	var candidate map[string]any
	if options.useCurrentCandidate {
		commit, err := runGitStrict(gitRoot, []string{"rev-parse", "HEAD"})
		if err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		candidate = map[string]any{
			"path":   gitRoot,
			"ref":    "WORKTREE",
			"commit": strings.TrimSpace(commit),
			"type":   "live_checkout",
		}
	} else {
		candidate, err = createDetachedWorktree(gitRoot, candidatePath, options.candidateRef, options.force)
		if err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
	}
	warnings := []any{}
	if candidate["type"] == "live_checkout" {
		status, err := runGitStrict(gitRoot, []string{"status", "--short"})
		if err == nil && strings.TrimSpace(status) != "" {
			warnings = append(warnings, "Candidate points at the current checkout and includes uncommitted changes. Re-run without --use-current-candidate for a ref-pinned clean A/B workspace.")
		}
	}
	payload := map[string]any{
		"repoRoot":  gitRoot,
		"outputDir": outputDir,
		"baseline":  baseline,
		"candidate": candidate,
		"warnings":  warnings,
		"usage": map[string]any{
			"modeEvaluate":   []string{"cautilus", "mode", "evaluate", "--repo-root", gitRoot, "--baseline-repo", anyString(baseline["path"]), "--candidate-repo", anyString(candidate["path"])},
			"reviewVariants": []string{"cautilus", "review", "variants", "--repo-root", gitRoot, "--workspace", anyString(candidate["path"])},
		},
	}
	if err := writeJSON(stdout, payload); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleWorkspacePruneArtifacts(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseWorkspacePruneArtifactsArgs(args, cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	result, err := pruneWorkspaceArtifacts(options, time.Now())
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeJSON(stdout, result); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

//nolint:errcheck // CLI stdout/stderr reporting is best-effort.
func handleSkillsInstall(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	overwrite := false
	for _, arg := range args {
		if arg == "--overwrite" {
			overwrite = true
			continue
		}
		fmt.Fprintf(stderr, "Unknown argument: %s\n", arg)
		return 1
	}
	destinationDir := filepath.Join(cwd, ".agents", "skills", "cautilus")
	destinationSkill := filepath.Join(destinationDir, "SKILL.md")
	if err := migrateLegacyClaudeSkillsDir(cwd, stdout); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if pathExists(destinationSkill) && !overwrite {
		fmt.Fprintf(stderr, "%s already exists\nhint: use --overwrite to replace existing files\n", destinationSkill)
		return 1
	}
	if overwrite {
		_ = os.RemoveAll(destinationDir)
	}
	if err := os.MkdirAll(destinationDir, 0o755); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := bundledskills.InstallCautilus(destinationDir); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := ensureClaudeSkillsSymlink(cwd); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	fmt.Fprintf(stdout, "Installed %s\n", destinationDir)
	_, _ = fmt.Fprintln(stdout, "Installed skill expects `cautilus` to be available on PATH.")
	return 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleCliEvaluate(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseInputOutputArgs(args)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	inputPath := resolvePath(cwd, options.input)
	packet, err := readJSONObject(inputPath)
	if err != nil {
		fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", options.input, err)
		return 1
	}
	evaluation, err := evaluateCLIIntent(packet, filepath.Dir(inputPath), time.Now())
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeOutput(stdout, cwd, options.output, evaluation); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

//nolint:errcheck // CLI stdout/stderr reporting is best-effort.
func handleReviewVariants(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseReviewVariantsArgs(args, cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	adapterPayload, err := runtime.LoadAdapter(options.repoRoot, options.adapter, options.adapterName)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if !adapterPayload.Valid {
		fmt.Fprintf(stderr, "Adapter is invalid: %s\n", toJSONString(adapterPayload.Errors))
		return 1
	}
	variants := variantRecords(adapterPayload.Data["executor_variants"])
	if len(variants) == 0 {
		fmt.Fprintf(stderr, "Adapter does not define executor_variants: %s\n", anyString(adapterPayload.Path))
		return 1
	}
	if len(options.variantIDs) > 0 {
		filtered := []map[string]any{}
		allowed := map[string]struct{}{}
		for _, id := range options.variantIDs {
			allowed[id] = struct{}{}
		}
		for _, variant := range variants {
			if _, ok := allowed[anyString(variant["id"])]; ok {
				filtered = append(filtered, variant)
			}
		}
		if len(filtered) == 0 {
			_, _ = fmt.Fprintln(stderr, "No executor variants matched the requested --variant-id values.")
			return 1
		}
		variants = filtered
	}
	resolvedRun, err := runtime.ResolveRunDir(options.outputDir, nil, nil, environmentMap(), time.Now(), cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if resolvedRun.Source == "auto" {
		fmt.Fprintf(stderr, "Active run: %s\n", resolvedRun.RunDir)
	}
	log := progressLogger(options.quiet, stderr)
	workspace := resolvePath(cwd, options.workspace)
	outputDir := resolvedRun.RunDir
	log(fmt.Sprintf("review variants start: repo=%s workspace=%s output=%s", options.repoRoot, workspace, outputDir))
	promptArtifacts, err := resolveReviewVariantPromptArtifacts(options, adapterPayload, outputDir)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	schemaFile, err := resolveReviewSchemaFile(options, adapterPayload, cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	log(fmt.Sprintf("review variants artifacts ready: prompt=%s schema=%s", promptArtifacts.promptFile, schemaFile))
	summaries := make([]any, 0, len(variants))
	failed := false
	for _, variant := range variants {
		id := anyString(variant["id"])
		outputFile := filepath.Join(outputDir, id+".json")
		replacements := map[string]string{
			"candidate_repo": runtime.ShellSingleQuote(workspace),
			"prompt_file":    runtime.ShellSingleQuote(promptArtifacts.promptFile),
			"schema_file":    runtime.ShellSingleQuote(schemaFile),
			"output_file":    runtime.ShellSingleQuote(outputFile),
			"variant_id":     runtime.ShellSingleQuote(id),
		}
		commandText, err := renderTemplate(anyString(variant["command_template"]), replacements)
		if err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		result := runShellCommand(options.repoRoot, commandText, filepath.Join(outputDir, id+".json.stdout"), filepath.Join(outputDir, id+".json.stderr"), log, "variant "+id)
		output := map[string]any(nil)
		if pathExists(outputFile) {
			output, _ = readJSONObject(outputFile)
		}
		summary := map[string]any{
			"id":          id,
			"tool":        variant["tool"],
			"status":      result["status"],
			"startedAt":   result["startedAt"],
			"completedAt": result["completedAt"],
			"durationMs":  result["durationMs"],
			"exitCode":    result["exitCode"],
			"signal":      result["signal"],
			"outputFile":  outputFile,
			"stdoutFile":  result["stdoutFile"],
			"stderrFile":  result["stderrFile"],
			"command":     commandText,
			"stdout":      result["stdout"],
			"stderr":      result["stderr"],
			"output":      output,
		}
		if output != nil {
			if telemetry, ok := output["telemetry"].(map[string]any); ok {
				summary["telemetry"] = telemetry
			}
		}
		if anyString(result["status"]) != "passed" {
			failed = true
		}
		summaries = append(summaries, summary)
	}
	summaryPacket := map[string]any{
		"repoRoot":              options.repoRoot,
		"adapterPath":           adapterPayload.Path,
		"workspace":             workspace,
		"promptFile":            promptArtifacts.promptFile,
		"reviewPacketFile":      promptArtifacts.reviewPacketFile,
		"reviewPromptInputFile": promptArtifacts.reviewPromptInputFile,
		"schemaFile":            schemaFile,
		"outputDir":             outputDir,
		"telemetry":             summarizeVariantTelemetry(summaries),
		"variants":              summaries,
	}
	summaryFile := filepath.Join(outputDir, "review-summary.json")
	if err := writeOutputResolved(stdout, &summaryFile, summaryPacket); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	log(fmt.Sprintf("review variants complete: status=%s summary=%s", ternaryString(!failed, "passed", "failed"), summaryFile))
	fmt.Fprintf(stdout, "%s\n", summaryFile)
	if failed {
		return 1
	}
	return 0
}

//nolint:errcheck // CLI stdout/stderr reporting is best-effort.
func handleModeEvaluate(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseModeEvaluateArgs(args, cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	adapterPayload, err := runtime.LoadAdapter(options.repoRoot, options.adapter, options.adapterName)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if !adapterPayload.Found {
		fmt.Fprintf(stderr, "Adapter not found for repo %s\n", options.repoRoot)
		return 1
	}
	if !adapterPayload.Valid {
		fmt.Fprintf(stderr, "Adapter is invalid: %s\n", toJSONString(adapterPayload.Errors))
		return 1
	}
	modeField := map[string]string{
		"iterate":    "iterate_command_templates",
		"held_out":   "held_out_command_templates",
		"comparison": "comparison_command_templates",
		"full_gate":  "full_gate_command_templates",
	}[options.mode]
	templates := stringArray(adapterPayload.Data[modeField])
	if len(templates) == 0 {
		fmt.Fprintf(stderr, "Adapter does not define %s\n", modeField)
		return 1
	}
	resolvedRun, err := runtime.ResolveRunDir(options.outputDir, nil, nil, environmentMap(), time.Now(), cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if resolvedRun.Source == "auto" {
		fmt.Fprintf(stderr, "Active run: %s\n", resolvedRun.RunDir)
	}
	outputDir := resolvedRun.RunDir
	log := progressLogger(options.quiet, stderr)
	candidateRepo := firstNonEmpty(options.candidateRepo, options.repoRoot)
	baselineRepo := firstNonEmpty(options.baselineRepo, options.repoRoot)
	historyFile := options.historyFile
	if historyFile == "" {
		if hint, ok := adapterPayload.Data["history_file_hint"].(string); ok && strings.TrimSpace(hint) != "" {
			historyFile = resolvePath(options.repoRoot, hint)
		} else {
			historyFile = filepath.Join(options.repoRoot, ".cautilus", "history.json")
		}
	}
	scenarioResultsFile := options.scenarioResultsFile
	if scenarioResultsFile == "" {
		scenarioResultsFile = filepath.Join(outputDir, options.mode+"-scenario-results.json")
	}
	reportInputFile := filepath.Join(outputDir, "report-input.json")
	reportFile := filepath.Join(outputDir, "report.json")
	selectedScenarioIDsFile := filepath.Join(outputDir, "selected-scenario-ids.json")
	_ = os.WriteFile(selectedScenarioIDsFile, []byte("[]\n"), 0o644)
	profileArg := options.profile
	if profileArg == "" {
		if defaultProfile, ok := adapterPayload.Data["profile_default"].(string); ok && strings.TrimSpace(defaultProfile) != "" {
			profileArg = defaultProfile
		} else {
			profileArg = "default"
		}
	}
	replacements := map[string]string{
		"baseline_ref":               runtime.ShellSingleQuote(firstNonEmpty(options.baselineRef, "HEAD")),
		"baseline_repo":              runtime.ShellSingleQuote(resolvePath(cwd, baselineRepo)),
		"candidate_repo":             runtime.ShellSingleQuote(resolvePath(cwd, candidateRepo)),
		"history_file":               runtime.ShellSingleQuote(historyFile),
		"profile":                    runtime.ShellSingleQuote(profileArg),
		"split":                      runtime.ShellSingleQuote(firstNonEmpty(options.split, defaultSplitByMode(options.mode))),
		"selected_scenario_ids_file": runtime.ShellSingleQuote(selectedScenarioIDsFile),
		"iterate_samples":            fmt.Sprintf("%d", intOrDefault(options.iterateSamples, intFromAny(adapterPayload.Data["iterate_samples_default"], 2))),
		"held_out_samples":           fmt.Sprintf("%d", intOrDefault(options.heldOutSamples, intFromAny(adapterPayload.Data["held_out_samples_default"], 2))),
		"comparison_samples":         fmt.Sprintf("%d", intOrDefault(options.comparisonSamples, intFromAny(adapterPayload.Data["comparison_samples_default"], 2))),
		"full_gate_samples":          fmt.Sprintf("%d", intOrDefault(options.fullGateSamples, intFromAny(adapterPayload.Data["full_gate_samples_default"], 2))),
		"output_dir":                 runtime.ShellSingleQuote(outputDir),
		"candidate_results_file":     runtime.ShellSingleQuote(scenarioResultsFile),
		"scenario_results_file":      runtime.ShellSingleQuote(scenarioResultsFile),
		"report_input_file":          runtime.ShellSingleQuote(reportInputFile),
		"report_file":                runtime.ShellSingleQuote(reportFile),
	}
	log(fmt.Sprintf("mode evaluate start: mode=%s repo=%s output=%s", options.mode, options.repoRoot, outputDir))
	commandObservations := []any{}
	if !options.skipPreflight {
		for index, commandTemplate := range stringArray(adapterPayload.Data["preflight_commands"]) {
			commandText, err := renderTemplate(commandTemplate, replacements)
			if err != nil {
				fmt.Fprintf(stderr, "%s\n", err)
				return 1
			}
			result := runShellCommand(options.repoRoot, commandText, filepath.Join(outputDir, fmt.Sprintf("preflight-%d.stdout", index+1)), filepath.Join(outputDir, fmt.Sprintf("preflight-%d.stderr", index+1)), log, fmt.Sprintf("preflight %d/%d", index+1, len(stringArray(adapterPayload.Data["preflight_commands"]))))
			commandObservations = append(commandObservations, commandObservation("preflight", index+1, result, commandText))
			if anyString(result["status"]) != "passed" {
				fmt.Fprintf(stderr, "Preflight command failed: %s\n", commandText)
				return 1
			}
		}
	} else {
		log("preflight skipped")
	}
	modeObservations := []any{}
	for index, commandTemplate := range templates {
		commandText, err := renderTemplate(commandTemplate, replacements)
		if err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		result := runShellCommand(options.repoRoot, commandText, filepath.Join(outputDir, fmt.Sprintf("%s-%d.stdout", options.mode, index+1)), filepath.Join(outputDir, fmt.Sprintf("%s-%d.stderr", options.mode, index+1)), log, fmt.Sprintf("%s %d/%d", options.mode, index+1, len(templates)))
		observation := commandObservation(options.mode, index+1, result, commandText)
		modeObservations = append(modeObservations, observation)
		commandObservations = append(commandObservations, observation)
		if anyString(result["status"]) != "passed" {
			break
		}
	}
	scenarioResults := map[string]any{
		"schemaVersion": contracts.ScenarioResultsSchema,
		"source":        "mode_evaluate:" + options.mode,
		"mode":          options.mode,
		"results":       []any{},
	}
	if pathExists(scenarioResultsFile) {
		rawResults, err := readJSONObject(scenarioResultsFile)
		if err == nil {
			if normalized, normalizeErr := runtime.NormalizeScenarioResultsPacket(rawResults, "scenarioResults"); normalizeErr == nil {
				scenarioResults = normalized
				if _, ok := scenarioResults["mode"]; !ok {
					scenarioResults["mode"] = options.mode
				}
			}
		}
	}
	modeStatus := "passed"
	for _, raw := range modeObservations {
		if anyString(raw.(map[string]any)["status"]) != "passed" {
			modeStatus = "failed"
			break
		}
	}
	modeRun := map[string]any{
		"mode":            options.mode,
		"status":          modeStatus,
		"summary":         modeSummaryText(options.mode, modeStatus, len(modeObservations)),
		"durationMs":      sumDuration(modeObservations),
		"scenarioResults": scenarioResults,
	}
	if len(modeObservations) > 0 {
		first := modeObservations[0].(map[string]any)
		last := modeObservations[len(modeObservations)-1].(map[string]any)
		modeRun["startedAt"] = first["startedAt"]
		modeRun["completedAt"] = last["completedAt"]
	}
	buckets := classifyScenarioBuckets(scenarioResults)
	reportInput := map[string]any{
		"schemaVersion":       contracts.ReportInputsSchema,
		"candidate":           resolvePath(cwd, candidateRepo),
		"baseline":            firstNonEmpty(options.baselineRef, resolvePath(cwd, baselineRepo)),
		"intent":              options.intent,
		"commands":            commandDescriptors(options.mode, modeObservations),
		"commandObservations": commandObservations,
		"modeRuns":            []any{modeRun},
		"improved":            buckets["improved"],
		"regressed":           buckets["regressed"],
		"unchanged":           buckets["unchanged"],
		"noisy":               buckets["noisy"],
		"humanReviewFindings": []any{},
		"recommendation":      modeRecommendation(options.mode, options.recommendationOnPass, modeStatus),
	}
	_ = writeOutputResolved(stdout, &reportInputFile, reportInput)
	report, err := runtime.BuildReportPacket(reportInput, time.Now())
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeOutputResolved(stdout, &reportFile, report); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	packet := map[string]any{
		"schemaVersion":       contracts.AdapterModeEvaluationPacketSchema,
		"repoRoot":            options.repoRoot,
		"adapterPath":         adapterPayload.Path,
		"mode":                options.mode,
		"reportInputFile":     reportInputFile,
		"reportFile":          reportFile,
		"historyFile":         nil,
		"selectedScenarioIds": []any{},
		"baselineCacheFile":   nil,
		"commandObservations": commandObservations,
		"report":              report,
	}
	modeEvaluationFile := strings.TrimSuffix(reportFile, ".json") + ".mode-evaluation.json"
	_ = writeOutputResolved(stdout, &modeEvaluationFile, packet)
	log(fmt.Sprintf("mode evaluate complete: status=%s report=%s", report["recommendation"], reportFile))
	fmt.Fprintf(stdout, "%s\n", reportFile)
	return 0
}

type workspacePrepareCompareArgs struct {
	repoRoot            string
	baselineRef         string
	candidateRef        string
	useCurrentCandidate bool
	outputDir           *string
	force               bool
}

type workspacePruneArtifactsArgs struct {
	root       string
	keepLast   *int
	maxAgeDays *float64
	dryRun     bool
}

type reviewVariantsArgs struct {
	repoRoot          string
	adapter           *string
	adapterName       *string
	workspace         string
	promptFile        *string
	schemaFile        *string
	outputDir         *string
	reportFile        *string
	reviewPacketFile  *string
	reviewPromptInput *string
	variantIDs        []string
	quiet             bool
}

type modeEvaluateArgs struct {
	repoRoot             string
	adapter              *string
	adapterName          *string
	mode                 string
	intent               string
	baselineRef          string
	baselineRepo         string
	candidateRepo        string
	historyFile          string
	profile              string
	split                string
	outputDir            *string
	scenarioResultsFile  string
	recommendationOnPass string
	quiet                bool
	skipPreflight        bool
	iterateSamples       *int
	heldOutSamples       *int
	comparisonSamples    *int
	fullGateSamples      *int
}

type reviewPromptArtifacts struct {
	promptFile            string
	reviewPacketFile      any
	reviewPromptInputFile any
}

func parseWorkspacePrepareCompareArgs(args []string, cwd string) (*workspacePrepareCompareArgs, error) {
	options := &workspacePrepareCompareArgs{repoRoot: cwd, candidateRef: "HEAD"}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--force":
			options.force = true
		case "--use-current-candidate":
			options.useCurrentCandidate = true
		case "--repo-root":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.repoRoot = resolvePath(cwd, value)
		case "--baseline-ref":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.baselineRef = value
		case "--candidate-ref":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.candidateRef = value
		case "--output-dir":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.outputDir = &resolved
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	if options.baselineRef == "" {
		return nil, fmt.Errorf("--baseline-ref is required")
	}
	if options.useCurrentCandidate && options.candidateRef != "HEAD" {
		return nil, fmt.Errorf("use either --candidate-ref or --use-current-candidate, not both")
	}
	return options, nil
}

func parseWorkspacePruneArtifactsArgs(args []string, cwd string) (*workspacePruneArtifactsArgs, error) {
	options := &workspacePruneArtifactsArgs{}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--dry-run":
			options.dryRun = true
		case "--root":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.root = resolvePath(cwd, value)
		case "--keep-last":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			parsed, parseErr := strconv.Atoi(value)
			if parseErr != nil || parsed < 0 {
				return nil, fmt.Errorf("--keep-last must be a non-negative integer")
			}
			options.keepLast = &parsed
		case "--max-age-days":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			parsed, parseErr := strconv.ParseFloat(value, 64)
			if parseErr != nil || parsed < 0 {
				return nil, fmt.Errorf("--max-age-days must be a non-negative number")
			}
			options.maxAgeDays = &parsed
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	if options.root == "" {
		return nil, fmt.Errorf("--root is required")
	}
	if options.keepLast == nil && options.maxAgeDays == nil {
		return nil, fmt.Errorf("provide --keep-last, --max-age-days, or both")
	}
	return options, nil
}

func parseReviewVariantsArgs(args []string, cwd string) (*reviewVariantsArgs, error) {
	options := &reviewVariantsArgs{repoRoot: cwd, variantIDs: []string{}}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--quiet":
			options.quiet = true
		case "--variant-id":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.variantIDs = append(options.variantIDs, value)
		case "--repo-root":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.repoRoot = resolvePath(cwd, value)
		case "--adapter":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.adapter = &value
		case "--adapter-name":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.adapterName = &value
		case "--workspace":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.workspace = value
		case "--prompt-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.promptFile = &value
		case "--schema-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.schemaFile = &value
		case "--output-dir":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.outputDir = &resolved
		case "--report-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.reportFile = &value
		case "--review-packet":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.reviewPacketFile = &value
		case "--review-prompt-input":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.reviewPromptInput = &value
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	if options.adapter != nil && options.adapterName != nil {
		return nil, fmt.Errorf("use either --adapter or --adapter-name, not both")
	}
	if options.workspace == "" {
		return nil, fmt.Errorf("missing required argument: workspace")
	}
	return options, nil
}

func parseModeEvaluateArgs(args []string, cwd string) (*modeEvaluateArgs, error) {
	options := &modeEvaluateArgs{repoRoot: cwd}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--quiet":
			options.quiet = true
		case "--skip-preflight":
			options.skipPreflight = true
		case "--repo-root":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.repoRoot = resolvePath(cwd, value)
		case "--adapter":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.adapter = &value
		case "--adapter-name":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.adapterName = &value
		case "--mode":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.mode = value
		case "--intent":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.intent = value
		case "--baseline-ref":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.baselineRef = value
		case "--baseline-repo":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.baselineRepo = value
		case "--candidate-repo":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.candidateRepo = value
		case "--history-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.historyFile = resolvePath(cwd, value)
		case "--profile":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.profile = value
		case "--split":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.split = value
		case "--output-dir":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.outputDir = &resolved
		case "--candidate-results-file", "--scenario-results-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.scenarioResultsFile = resolvePath(cwd, value)
		case "--recommendation-on-pass":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.recommendationOnPass = value
		case "--iterate-samples":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			parsed, parseErr := strconv.Atoi(value)
			if parseErr != nil || parsed <= 0 {
				return nil, fmt.Errorf("%s must be a positive integer", arg)
			}
			options.iterateSamples = &parsed
		case "--held-out-samples":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			parsed, parseErr := strconv.Atoi(value)
			if parseErr != nil || parsed <= 0 {
				return nil, fmt.Errorf("%s must be a positive integer", arg)
			}
			options.heldOutSamples = &parsed
		case "--comparison-samples":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			parsed, parseErr := strconv.Atoi(value)
			if parseErr != nil || parsed <= 0 {
				return nil, fmt.Errorf("%s must be a positive integer", arg)
			}
			options.comparisonSamples = &parsed
		case "--full-gate-samples":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			parsed, parseErr := strconv.Atoi(value)
			if parseErr != nil || parsed <= 0 {
				return nil, fmt.Errorf("%s must be a positive integer", arg)
			}
			options.fullGateSamples = &parsed
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	if options.adapter != nil && options.adapterName != nil {
		return nil, fmt.Errorf("use either --adapter or --adapter-name, not both")
	}
	if _, ok := map[string]struct{}{"iterate": {}, "held_out": {}, "comparison": {}, "full_gate": {}}[options.mode]; !ok {
		return nil, fmt.Errorf("--mode must be one of iterate, held_out, comparison, full_gate")
	}
	if strings.TrimSpace(options.intent) == "" {
		return nil, fmt.Errorf("--intent is required")
	}
	return options, nil
}

func createDetachedWorktree(repoRoot string, path string, ref string, force bool) (map[string]any, error) {
	_ = removeExistingWorktree(repoRoot, path)
	if pathExists(path) {
		if !force {
			return nil, fmt.Errorf("destination already exists: %s; re-run with --force to replace it", path)
		}
		_ = os.RemoveAll(path)
	}
	if _, err := runGitStrict(repoRoot, []string{"worktree", "add", "--detach", path, ref}); err != nil {
		return nil, err
	}
	commit, err := runGitStrict(repoRoot, []string{"rev-parse", ref})
	if err != nil {
		return nil, err
	}
	return map[string]any{"path": path, "ref": ref, "commit": strings.TrimSpace(commit), "type": "git_worktree"}, nil
}

func removeExistingWorktree(repoRoot string, worktreePath string) error {
	porcelain, err := runGitStrict(repoRoot, []string{"worktree", "list", "--porcelain"})
	if err != nil {
		return err
	}
	for _, block := range strings.Split(strings.TrimSpace(porcelain), "\n\n") {
		if strings.TrimSpace(block) == "" {
			continue
		}
		for _, line := range strings.Split(block, "\n") {
			if strings.HasPrefix(line, "worktree ") && resolvePath("/", strings.TrimSpace(strings.TrimPrefix(line, "worktree "))) == resolvePath("/", worktreePath) {
				_, _ = runGitStrict(repoRoot, []string{"worktree", "remove", "--force", worktreePath})
				return nil
			}
		}
	}
	return nil
}

func runGitStrict(repoRoot string, args []string) (string, error) {
	command := exec.Command("git", append([]string{"-C", repoRoot}, args...)...)
	output, err := command.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("%s", strings.TrimSpace(string(output)))
	}
	return strings.TrimSpace(string(output)), nil
}

func migrateLegacyClaudeSkillsDir(repoRoot string, stdout io.Writer) error {
	claudeSkills := filepath.Join(repoRoot, ".claude", "skills")
	agentsSkills := filepath.Join(repoRoot, ".agents", "skills")
	info, err := os.Lstat(claudeSkills)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return nil
		}
		return err
	}
	if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return nil
	}
	if pathExists(agentsSkills) {
		return os.RemoveAll(claudeSkills)
	}
	if err := os.MkdirAll(filepath.Join(repoRoot, ".agents"), 0o755); err != nil {
		return err
	}
	if err := os.Rename(claudeSkills, agentsSkills); err != nil {
		return err
	}
	_, _ = fmt.Fprintf(stdout, "Migrated %s -> %s\n", claudeSkills, agentsSkills)
	return nil
}

func ensureClaudeSkillsSymlink(repoRoot string) error {
	claudeSkills := filepath.Join(repoRoot, ".claude", "skills")
	relativeTarget := "../.agents/skills"
	if current, err := os.Readlink(claudeSkills); err == nil && current == relativeTarget {
		return nil
	}
	_ = os.RemoveAll(claudeSkills)
	if err := os.MkdirAll(filepath.Join(repoRoot, ".claude"), 0o755); err != nil {
		return err
	}
	return os.Symlink(relativeTarget, claudeSkills)
}

func progressLogger(quiet bool, stderr io.Writer) func(string) {
	return func(message string) {
		if quiet {
			return
		}
		_, _ = fmt.Fprintln(stderr, message)
	}
}

func runShellCommand(repoRoot string, commandText string, stdoutFile string, stderrFile string, log func(string), label string) map[string]any {
	startedAt := time.Now()
	log(fmt.Sprintf("%s start: %s", label, commandText))
	command := exec.Command("bash", "-lc", commandText)
	command.Dir = repoRoot
	command.Env = externalCommandEnv(nil)
	var stdoutBuffer bytes.Buffer
	var stderrBuffer bytes.Buffer
	command.Stdout = &stdoutBuffer
	command.Stderr = &stderrBuffer
	err := command.Run()
	completedAt := time.Now()
	_ = os.WriteFile(stdoutFile, stdoutBuffer.Bytes(), 0o644)
	_ = os.WriteFile(stderrFile, stderrBuffer.Bytes(), 0o644)
	result := map[string]any{
		"startedAt":   startedAt.UTC().Format(time.RFC3339Nano),
		"completedAt": completedAt.UTC().Format(time.RFC3339Nano),
		"durationMs":  completedAt.Sub(startedAt).Milliseconds(),
		"stdout":      stdoutBuffer.String(),
		"stderr":      stderrBuffer.String(),
		"stdoutFile":  stdoutFile,
		"stderrFile":  stderrFile,
		"status":      ternaryString(err == nil, "passed", "failed"),
	}
	var exitErr *exec.ExitError
	if errors.As(err, &exitErr) {
		result["exitCode"] = exitErr.ExitCode()
	} else if err == nil {
		result["exitCode"] = 0
	}
	log(fmt.Sprintf("%s %s in %dms", label, result["status"], result["durationMs"]))
	return result
}

func renderTemplate(template string, replacements map[string]string) (string, error) {
	var builder strings.Builder
	for index := 0; index < len(template); index++ {
		if template[index] == '{' {
			end := strings.IndexByte(template[index:], '}')
			if end < 0 {
				return "", fmt.Errorf("unknown placeholder in command template: %s", template[index:])
			}
			key := template[index+1 : index+end]
			value, ok := replacements[key]
			if !ok {
				return "", fmt.Errorf("unknown placeholder in command template: {%s}", key)
			}
			builder.WriteString(value)
			index += end
			continue
		}
		builder.WriteByte(template[index])
	}
	return builder.String(), nil
}

func evaluateCLIIntent(input map[string]any, baseDir string, now time.Time) (map[string]any, error) {
	if input["schemaVersion"] != contracts.CliEvaluationInputsSchema {
		return nil, fmt.Errorf("schemaVersion must be %s", contracts.CliEvaluationInputsSchema)
	}
	commandParts := stringArray(input["command"])
	if len(commandParts) == 0 {
		return nil, fmt.Errorf("command must be a non-empty array")
	}
	workingDirectory := resolvePath(baseDir, firstNonEmpty(anyString(input["workingDirectory"]), "."))
	env := map[string]string{}
	for key, value := range asStringMap(input["environment"]) {
		env[key] = value
	}
	stdinText := anyString(input["stdinText"])
	timeoutMs := intFromAny(input["timeoutMs"], 30000)
	observation, err := runCLIProcess(commandParts, workingDirectory, env, stdinText, timeoutMs)
	if err != nil {
		return nil, err
	}
	expectationResults, err := evaluateCLIExpectations(asMapAny(input["expectations"]), observation, workingDirectory)
	if err != nil {
		return nil, err
	}
	recommendation := "reject"
	failedCount := 0
	for _, raw := range expectationResults {
		if anyString(raw.(map[string]any)["status"]) != "passed" {
			failedCount++
		}
	}
	if failedCount == 0 {
		recommendation = "accept-now"
	}
	observationExitCode := intFromAny(observation["exitCode"], 0)
	expectedExitCode := intFromAny(asMapAny(input["expectations"])["exitCode"], observationExitCode)
	reportInput := map[string]any{
		"schemaVersion": contracts.ReportInputsSchema,
		"candidate":     input["candidate"],
		"baseline":      input["baseline"],
		"intent":        input["intent"],
		"commands": []any{
			map[string]any{
				"mode":    input["mode"],
				"command": strings.Join(commandParts, " "),
				"label":   input["surfaceId"],
			},
		},
		"commandObservations": []any{
			map[string]any{
				"stage":       input["mode"],
				"index":       1,
				"status":      ternaryString(observationExitCode == expectedExitCode, "passed", "failed"),
				"command":     strings.Join(commandParts, " "),
				"startedAt":   observation["startedAt"],
				"completedAt": observation["completedAt"],
				"durationMs":  observation["durationMs"],
				"exitCode":    observation["exitCode"],
			},
		},
		"modeRuns": []any{
			map[string]any{
				"mode":       input["mode"],
				"status":     ternaryString(failedCount == 0, "passed", "failed"),
				"durationMs": observation["durationMs"],
				"scenarioResults": map[string]any{
					"schemaVersion": contracts.ScenarioResultsSchema,
					"source":        "cli_evaluate",
					"mode":          input["mode"],
					"results": []any{
						map[string]any{
							"scenarioId":  input["surfaceId"],
							"status":      ternaryString(failedCount == 0, "passed", "failed"),
							"durationMs":  observation["durationMs"],
							"startedAt":   observation["startedAt"],
							"completedAt": observation["completedAt"],
						},
					},
				},
			},
		},
		"improved":            ternarySlice(failedCount == 0, []any{input["surfaceId"]}, []any{}),
		"regressed":           ternarySlice(failedCount == 0, []any{}, []any{input["surfaceId"]}),
		"unchanged":           []any{},
		"noisy":               []any{},
		"humanReviewFindings": []any{},
		"recommendation":      recommendation,
	}
	report, err := runtime.BuildReportPacket(reportInput, now)
	if err != nil {
		return nil, err
	}
	return map[string]any{
		"schemaVersion":      contracts.CliEvaluationPacketSchema,
		"generatedAt":        now.UTC().Format(time.RFC3339Nano),
		"candidate":          input["candidate"],
		"baseline":           input["baseline"],
		"intent":             input["intent"],
		"surfaceId":          input["surfaceId"],
		"mode":               input["mode"],
		"workingDirectory":   workingDirectory,
		"command":            commandParts,
		"observation":        observation,
		"expectationResults": expectationResults,
		"summary": map[string]any{
			"passedExpectationCount": len(expectationResults) - failedCount,
			"failedExpectationCount": failedCount,
			"recommendation":         recommendation,
		},
		"report": report,
	}, nil
}

func runCLIProcess(commandParts []string, workingDirectory string, extraEnv map[string]string, stdinText string, timeoutMs int) (map[string]any, error) {
	ctx := context.Background()
	if timeoutMs > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, time.Duration(timeoutMs)*time.Millisecond)
		defer cancel()
	}
	startedAt := time.Now()
	command := exec.CommandContext(ctx, commandParts[0], commandParts[1:]...)
	command.Dir = workingDirectory
	command.Env = externalCommandEnv(extraEnv)
	command.Stdin = strings.NewReader(stdinText)
	var stdoutBuffer bytes.Buffer
	var stderrBuffer bytes.Buffer
	command.Stdout = &stdoutBuffer
	command.Stderr = &stderrBuffer
	runErr := command.Run()
	completedAt := time.Now()
	exitCode := 0
	signal := ""
	var exitErr *exec.ExitError
	if errors.As(runErr, &exitErr) {
		exitCode = exitErr.ExitCode()
	}
	if runErr != nil && exitCode == 0 {
		exitCode = -1
	}
	return map[string]any{
		"startedAt":   startedAt.UTC().Format(time.RFC3339Nano),
		"completedAt": completedAt.UTC().Format(time.RFC3339Nano),
		"durationMs":  completedAt.Sub(startedAt).Milliseconds(),
		"exitCode":    exitCode,
		"signal":      nilIfEmpty(signal),
		"stdout":      stdoutBuffer.String(),
		"stderr":      stderrBuffer.String(),
		"error":       nilIfEmpty(errorString(runErr)),
	}, nil
}

func evaluateCLIExpectations(expectations map[string]any, observation map[string]any, workingDirectory string) ([]any, error) {
	results := []any{}
	if exitCode, ok := anyInt(expectations["exitCode"]); ok {
		actual := intFromAny(observation["exitCode"], -1)
		results = append(results, expectationResult("exit-code", actual == exitCode, fmt.Sprintf("Expected exit code %d, saw %d.", exitCode, actual), fmt.Sprintf("Exit code matched %d.", exitCode)))
	}
	for index, entry := range stringArray(expectations["stdoutContains"]) {
		results = append(results, containsExpectation(fmt.Sprintf("stdout-contains-%d", index+1), anyString(observation["stdout"]), entry, true))
	}
	for index, entry := range stringArray(expectations["stderrContains"]) {
		results = append(results, containsExpectation(fmt.Sprintf("stderr-contains-%d", index+1), anyString(observation["stderr"]), entry, true))
	}
	for index, entry := range stringArray(expectations["stdoutNotContains"]) {
		results = append(results, containsExpectation(fmt.Sprintf("stdout-not-contains-%d", index+1), anyString(observation["stdout"]), entry, false))
	}
	for index, entry := range stringArray(expectations["stderrNotContains"]) {
		results = append(results, containsExpectation(fmt.Sprintf("stderr-not-contains-%d", index+1), anyString(observation["stderr"]), entry, false))
	}
	for index, entry := range stringArray(expectations["filesExist"]) {
		path := resolvePath(workingDirectory, entry)
		results = append(results, expectationResult(fmt.Sprintf("file-exists-%d", index+1), pathExists(path), fmt.Sprintf("Expected file %s to exist.", entry), fmt.Sprintf("File exists: %s.", entry)))
	}
	for index, raw := range arrayOrEmpty(expectations["filesContain"]) {
		record := asMapAny(raw)
		path := resolvePath(workingDirectory, anyString(record["path"]))
		content, err := os.ReadFile(path)
		if err != nil {
			results = append(results, expectationResult(fmt.Sprintf("file-contains-%d", index+1), false, fmt.Sprintf("Expected file %s to contain %q.", anyString(record["path"]), anyString(record["text"])), fmt.Sprintf("File %s contained %q.", anyString(record["path"]), anyString(record["text"]))))
			continue
		}
		text := string(content)
		needle := anyString(record["text"])
		results = append(results, expectationResult(fmt.Sprintf("file-contains-%d", index+1), strings.Contains(text, needle), fmt.Sprintf("Expected file %s to contain %q.", anyString(record["path"]), needle), fmt.Sprintf("File %s contained %q.", anyString(record["path"]), needle)))
	}
	if len(results) == 0 {
		return nil, fmt.Errorf("expectations must declare at least one bounded check")
	}
	return results, nil
}

func expectationResult(id string, passed bool, failedMessage string, passedMessage string) map[string]any {
	if passed {
		return map[string]any{"id": id, "status": "passed", "message": passedMessage}
	}
	return map[string]any{"id": id, "status": "failed", "message": failedMessage}
}

func containsExpectation(id string, haystack string, needle string, shouldContain bool) map[string]any {
	contains := strings.Contains(haystack, needle)
	if shouldContain {
		return expectationResult(id, contains, fmt.Sprintf("Expected output to contain %q.", needle), fmt.Sprintf("Output contained %q.", needle))
	}
	return expectationResult(id, !contains, fmt.Sprintf("Expected output not to contain %q.", needle), fmt.Sprintf("Output did not contain %q.", needle))
}

func resolveReviewVariantPromptArtifacts(options *reviewVariantsArgs, adapterPayload *runtime.AdapterPayload, outputDir string) (*reviewPromptArtifacts, error) {
	repoRoot := options.repoRoot
	if options.promptFile != nil {
		return &reviewPromptArtifacts{promptFile: resolvePath(repoRoot, *options.promptFile), reviewPacketFile: nil, reviewPromptInputFile: nil}, nil
	}
	if defaultPrompt, ok := adapterPayload.Data["default_prompt_file"].(string); ok && strings.TrimSpace(defaultPrompt) != "" {
		return &reviewPromptArtifacts{promptFile: resolvePath(repoRoot, defaultPrompt), reviewPacketFile: nil, reviewPromptInputFile: nil}, nil
	}
	if options.reviewPromptInput != nil {
		reviewPromptInputFile := resolvePath(repoRoot, *options.reviewPromptInput)
		input, err := readJSONObject(reviewPromptInputFile)
		if err != nil {
			return nil, err
		}
		if input["schemaVersion"] != contracts.ReviewPromptInputsSchema {
			return nil, fmt.Errorf("review prompt input must use schemaVersion %s", contracts.ReviewPromptInputsSchema)
		}
		prompt, err := runtime.RenderReviewPrompt(input)
		if err != nil {
			return nil, err
		}
		promptFile := filepath.Join(outputDir, "review.prompt.md")
		if err := os.WriteFile(promptFile, []byte(prompt), 0o644); err != nil {
			return nil, err
		}
		return &reviewPromptArtifacts{promptFile: promptFile, reviewPacketFile: nil, reviewPromptInputFile: reviewPromptInputFile}, nil
	}
	reviewPacketFile := ""
	if options.reviewPacketFile != nil {
		reviewPacketFile = resolvePath(repoRoot, *options.reviewPacketFile)
	} else {
		if options.reportFile == nil {
			return nil, fmt.Errorf("provide --prompt-file, adapter default_prompt_file, --review-prompt-input, --review-packet, or --report-file")
		}
		reportFile := resolvePath(repoRoot, *options.reportFile)
		report, err := readJSONObject(reportFile)
		if err != nil {
			return nil, err
		}
		if err := runtime.ValidateReportPacket(report, reportFile); err != nil {
			return nil, err
		}
		reviewPacket, err := runtime.BuildReviewPacket(repoRoot, anyString(adapterPayload.Path), adapterPayload.Data, reportFile, report, time.Now())
		if err != nil {
			return nil, err
		}
		reviewPacketFile = filepath.Join(outputDir, "review-packet.json")
		if err := writeOutputResolved(io.Discard, &reviewPacketFile, reviewPacket); err != nil {
			return nil, err
		}
	}
	reviewPacket, err := readJSONObject(reviewPacketFile)
	if err != nil {
		return nil, err
	}
	promptInput, err := runtime.BuildReviewPromptInput(reviewPacket, reviewPacketFile, time.Now())
	if err != nil {
		return nil, err
	}
	reviewPromptInputFile := filepath.Join(outputDir, "review-prompt-input.json")
	if err := writeOutputResolved(io.Discard, &reviewPromptInputFile, promptInput); err != nil {
		return nil, err
	}
	prompt, err := runtime.RenderReviewPrompt(promptInput)
	if err != nil {
		return nil, err
	}
	promptFile := filepath.Join(outputDir, "review.prompt.md")
	if err := os.WriteFile(promptFile, []byte(prompt), 0o644); err != nil {
		return nil, err
	}
	return &reviewPromptArtifacts{promptFile: promptFile, reviewPacketFile: reviewPacketFile, reviewPromptInputFile: reviewPromptInputFile}, nil
}

func resolveReviewSchemaFile(options *reviewVariantsArgs, adapterPayload *runtime.AdapterPayload, cwd string) (string, error) {
	if options.schemaFile != nil {
		return resolvePath(cwd, *options.schemaFile), nil
	}
	if schemaFile, ok := adapterPayload.Data["default_schema_file"].(string); ok && strings.TrimSpace(schemaFile) != "" {
		return resolvePath(options.repoRoot, schemaFile), nil
	}
	return "", fmt.Errorf("missing required argument or adapter default: schemaFile")
}

func summarizeVariantTelemetry(summaries []any) any {
	if len(summaries) == 0 {
		return nil
	}
	packet := map[string]any{
		"startedAt":                asMapAny(summaries[0])["startedAt"],
		"completedAt":              asMapAny(summaries[len(summaries)-1])["completedAt"],
		"durationMs":               sumDuration(summaries),
		"averageVariantDurationMs": float64(sumDuration(summaries)) / float64(len(summaries)),
		"variantCount":             len(summaries),
		"passedVariantCount":       countVariantStatus(summaries, "passed"),
		"failedVariantCount":       len(summaries) - countVariantStatus(summaries, "passed"),
	}
	providers := uniqueTelemetryStrings(summaries, "provider")
	models := uniqueTelemetryStrings(summaries, "model")
	if len(providers) > 0 {
		packet["providers"] = providers
	}
	if len(models) > 0 {
		packet["models"] = models
	}
	for _, field := range []string{"prompt_tokens", "completion_tokens", "total_tokens", "cost_usd"} {
		if total, ok := sumTelemetryField(summaries, field); ok {
			packet[field] = total
		}
	}
	return packet
}

func pruneWorkspaceArtifacts(options *workspacePruneArtifactsArgs, now time.Time) (map[string]any, error) {
	info, err := os.Stat(options.root)
	if err != nil {
		return nil, fmt.Errorf("root does not exist: %s", options.root)
	}
	if !info.IsDir() {
		return nil, fmt.Errorf("root must be a directory: %s", options.root)
	}
	recognized, skipped, err := classifyArtifactEntries(options.root)
	if err != nil {
		return nil, err
	}
	sort.Slice(recognized, func(i, j int) bool { return recognized[i].mtimeMs > recognized[j].mtimeMs })
	kept := []any{}
	pruned := []any{}
	nowMs := now.UnixMilli()
	for index, entry := range recognized {
		protectedByKeepLast := options.keepLast != nil && index < *options.keepLast
		olderThanMaxAge := options.maxAgeDays == nil || float64(nowMs-entry.mtimeMs) > (*options.maxAgeDays)*24*60*60*1000
		summary := map[string]any{
			"path":    entry.path,
			"mtime":   entry.mtime,
			"markers": entry.markers,
			"reason":  ternaryString(protectedByKeepLast, "keep_last", ternaryString(olderThanMaxAge, "retention_policy", "within_max_age")),
		}
		if protectedByKeepLast || !olderThanMaxAge {
			kept = append(kept, summary)
			continue
		}
		if !options.dryRun {
			_ = os.RemoveAll(entry.path)
		}
		pruned = append(pruned, summary)
	}
	return map[string]any{
		"root":            options.root,
		"dryRun":          options.dryRun,
		"keepLast":        options.keepLast,
		"maxAgeDays":      options.maxAgeDays,
		"recognizedCount": len(recognized),
		"kept":            kept,
		"pruned":          pruned,
		"skipped":         skipped,
	}, nil
}

type artifactEntry struct {
	path    string
	mtimeMs int64
	mtime   string
	markers []string
}

func classifyArtifactEntries(root string) ([]artifactEntry, []any, error) {
	recognized := []artifactEntry{}
	skipped := []any{}
	entries, err := os.ReadDir(root)
	if err != nil {
		return nil, nil, err
	}
	for _, entry := range entries {
		entryPath := filepath.Join(root, entry.Name())
		if !entry.IsDir() {
			skipped = append(skipped, map[string]any{"path": entryPath, "reason": "not_directory"})
			continue
		}
		markers, err := artifactMarkers(entryPath)
		if err != nil {
			return nil, nil, err
		}
		if len(markers) == 0 {
			skipped = append(skipped, map[string]any{"path": entryPath, "reason": "not_cautilus_artifact_bundle"})
			continue
		}
		info, err := os.Stat(entryPath)
		if err != nil {
			return nil, nil, err
		}
		recognized = append(recognized, artifactEntry{
			path:    entryPath,
			mtimeMs: info.ModTime().UnixMilli(),
			mtime:   info.ModTime().UTC().Format(time.RFC3339Nano),
			markers: markers,
		})
	}
	return recognized, skipped, nil
}

func artifactMarkers(path string) ([]string, error) {
	exact := map[string]struct{}{
		"report.json": {}, "report-input.json": {}, "review-packet.json": {},
		"review-prompt-input.json": {}, "review-summary.json": {}, "review.prompt.md": {},
		"run.json": {}, "run-audit-summary.json": {}, "scenario-history.snapshot.json": {},
		"summary.json": {}, "selected-profile.json": {}, "selected-scenario-ids.json": {},
		"baseline-cache.json": {}, "baseline": {}, "candidate": {},
	}
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}
	markers := []string{}
	for _, entry := range entries {
		name := entry.Name()
		if _, ok := exact[name]; ok || strings.HasSuffix(name, ".stdout") || strings.HasSuffix(name, ".stderr") || strings.HasSuffix(name, ".mode-evaluation.json") {
			markers = append(markers, name)
		}
	}
	sort.Strings(markers)
	return markers, nil
}

func commandObservation(stage string, index int, result map[string]any, commandText string) map[string]any {
	packet := map[string]any{
		"stage":       stage,
		"index":       index,
		"status":      result["status"],
		"command":     commandText,
		"startedAt":   result["startedAt"],
		"completedAt": result["completedAt"],
		"durationMs":  result["durationMs"],
		"stdoutFile":  result["stdoutFile"],
		"stderrFile":  result["stderrFile"],
	}
	if result["exitCode"] != nil {
		packet["exitCode"] = result["exitCode"]
	}
	return packet
}

func commandDescriptors(mode string, modeObservations []any) []any {
	commands := make([]any, 0, len(modeObservations))
	for _, raw := range modeObservations {
		record := asMapAny(raw)
		commands = append(commands, map[string]any{
			"mode":    mode,
			"command": record["command"],
			"label":   fmt.Sprintf("%s-%v", mode, record["index"]),
		})
	}
	return commands
}

func classifyScenarioBuckets(scenarioResults map[string]any) map[string][]any {
	compareArtifact := asMapAny(scenarioResults["compareArtifact"])
	if len(compareArtifact) > 0 {
		return map[string][]any{
			"improved":  arrayOrEmpty(compareArtifact["improved"]),
			"regressed": arrayOrEmpty(compareArtifact["regressed"]),
			"unchanged": arrayOrEmpty(compareArtifact["unchanged"]),
			"noisy":     arrayOrEmpty(compareArtifact["noisy"]),
		}
	}
	buckets := map[string][]any{"improved": {}, "regressed": {}, "unchanged": {}, "noisy": {}}
	for _, raw := range arrayOrEmpty(scenarioResults["results"]) {
		result := asMapAny(raw)
		scenarioID := anyString(result["scenarioId"])
		switch anyString(result["status"]) {
		case "passed", "improved":
			buckets["improved"] = append(buckets["improved"], scenarioID)
		case "unchanged":
			buckets["unchanged"] = append(buckets["unchanged"], scenarioID)
		case "noisy":
			buckets["noisy"] = append(buckets["noisy"], scenarioID)
		default:
			buckets["regressed"] = append(buckets["regressed"], scenarioID)
		}
	}
	return buckets
}

func defaultSplitByMode(mode string) string {
	switch mode {
	case "iterate":
		return "train"
	case "held_out":
		return "test"
	default:
		return "all"
	}
}

func modeSummaryText(mode string, status string, count int) string {
	if status == "passed" {
		if count == 1 {
			return fmt.Sprintf("%s completed across 1 command.", mode)
		}
		return fmt.Sprintf("%s completed across %d commands.", mode, count)
	}
	return fmt.Sprintf("%s failed before completing all command templates.", mode)
}

func modeRecommendation(mode string, explicit string, status string) string {
	if status != "passed" {
		return "reject"
	}
	if strings.TrimSpace(explicit) != "" {
		return explicit
	}
	if mode == "full_gate" {
		return "accept-now"
	}
	return "defer"
}

func sumDuration(items []any) int64 {
	var total int64
	for _, raw := range items {
		total += int64(intFromAny(asMapAny(raw)["durationMs"], 0))
	}
	return total
}

func countVariantStatus(items []any, status string) int {
	count := 0
	for _, raw := range items {
		if anyString(asMapAny(raw)["status"]) == status {
			count++
		}
	}
	return count
}

func sumTelemetryField(items []any, field string) (float64, bool) {
	total := 0.0
	seen := false
	for _, raw := range items {
		telemetry := asMapAny(asMapAny(raw)["telemetry"])
		if number, ok := anyNumber(telemetry[field]); ok {
			total += number
			seen = true
		}
	}
	return total, seen
}

func uniqueTelemetryStrings(items []any, field string) []string {
	seen := map[string]struct{}{}
	values := []string{}
	for _, raw := range items {
		telemetry := asMapAny(asMapAny(raw)["telemetry"])
		value := anyString(telemetry[field])
		if value == "" {
			continue
		}
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		values = append(values, value)
	}
	return values
}

func stringArray(value any) []string {
	items, ok := value.([]any)
	if !ok {
		if strings, ok := value.([]string); ok {
			return strings
		}
		return []string{}
	}
	result := make([]string, 0, len(items))
	for _, entry := range items {
		if text, ok := entry.(string); ok && strings.TrimSpace(text) != "" {
			result = append(result, text)
		}
	}
	return result
}

func variantRecords(value any) []map[string]any {
	items := arrayOrEmpty(value)
	result := make([]map[string]any, 0, len(items))
	for _, raw := range items {
		record := asMapAny(raw)
		if len(record) > 0 {
			result = append(result, record)
		}
	}
	return result
}

func asMapAny(value any) map[string]any {
	record, ok := value.(map[string]any)
	if !ok {
		return map[string]any{}
	}
	return record
}

func asStringMap(value any) map[string]string {
	record := asMapAny(value)
	result := map[string]string{}
	for key, raw := range record {
		if text, ok := raw.(string); ok {
			result[key] = text
		}
	}
	return result
}

func intOrDefault(value *int, fallback int) int {
	if value == nil {
		return fallback
	}
	return *value
}

func intFromAny(value any, fallback int) int {
	if number, ok := anyInt(value); ok {
		return number
	}
	return fallback
}

func anyInt(value any) (int, bool) {
	switch typed := value.(type) {
	case int:
		return typed, true
	case int64:
		return int(typed), true
	case float64:
		return int(typed), true
	case json.Number:
		parsed, err := typed.Int64()
		return int(parsed), err == nil
	default:
		return 0, false
	}
}

func anyNumber(value any) (float64, bool) {
	switch typed := value.(type) {
	case float64:
		return typed, true
	case int:
		return float64(typed), true
	case int64:
		return float64(typed), true
	case json.Number:
		parsed, err := typed.Float64()
		return parsed, err == nil
	default:
		return 0, false
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func ternaryString(condition bool, yes string, no string) string {
	if condition {
		return yes
	}
	return no
}

func ternarySlice(condition bool, yes []any, no []any) []any {
	if condition {
		return yes
	}
	return no
}

func errorString(err error) string {
	if err == nil {
		return ""
	}
	return err.Error()
}

func nilIfEmpty(value string) any {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
}
