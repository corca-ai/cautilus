package app

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
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

	"github.com/corca-ai/cautilus/internal/cli"
	"github.com/corca-ai/cautilus/internal/contracts"
	"github.com/corca-ai/cautilus/internal/runtime"
	bundledskills "github.com/corca-ai/cautilus/skills"
)

var (
	latestReleaseMetadataForLifecycle = cli.LatestReleaseMetadata
	installManagedReleaseForLifecycle = cli.InstallManagedRelease
)

const (
	defaultBoundedShellCommandTimeout = 15 * time.Minute
	boundedShellCommandTimeoutEnv     = "CAUTILUS_SHELL_COMMAND_TIMEOUT_MS"
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
func handleInstall(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseInstallArgs(args, cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	targetRepo := resolveRepoRoot(cwd, options.repoRoot)
	var logBuffer bytes.Buffer
	skill, err := installBundledSkill(targetRepo, options.overwrite, &logBuffer)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	state, err := cli.InspectVersionState(repoRoot, cli.VersionStateOptions{Now: time.Now()})
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	summary := map[string]any{
		"schemaVersion": "cautilus.install_summary.v1",
		"status":        ternaryString(skill.Overwrote, "reinstalled", "installed"),
		"repoRoot":      targetRepo,
		"current":       state.Current,
		"skill":         skill,
		"messages":      logLines(logBuffer.String()),
		"nextSteps": []string{
			fmt.Sprintf("cautilus doctor --repo-root %s --next-action", targetRepo),
			fmt.Sprintf("cautilus doctor --repo-root %s", targetRepo),
		},
	}
	if options.json {
		if err := writeJSON(stdout, summary); err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		return 0
	}
	writeLifecycleMessages(stdout, logLines(logBuffer.String()))
	fmt.Fprintf(stdout, "Installed %s\n", skill.DestinationDir)
	fmt.Fprintf(stdout, "Current CLI: v%s (%s)\n", state.Current.Version, state.Current.InstallKind)
	fmt.Fprintf(stdout, "Next: cautilus doctor --repo-root %s --next-action\n", targetRepo)
	fmt.Fprintf(stdout, "Inspect: cautilus doctor --repo-root %s\n", targetRepo)
	return 0
}

//nolint:errcheck // CLI stdout/stderr reporting is best-effort.
func handleSkillsInstall(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseInstallArgs(args, cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	var logBuffer bytes.Buffer
	targetRepo := resolveRepoRoot(cwd, options.repoRoot)
	skill, err := installBundledSkill(targetRepo, options.overwrite, &logBuffer)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	writeLifecycleMessages(stdout, logLines(logBuffer.String()))
	fmt.Fprintf(stdout, "Installed %s\n", skill.DestinationDir)
	_, _ = fmt.Fprintln(stdout, "Installed skill expects `cautilus` to be available on PATH.")
	return 0
}

//nolint:errcheck // CLI stdout/stderr reporting is best-effort.
func handleUpdate(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseUpdateArgs(args, cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	current, err := cli.PackageVersionInfo(repoRoot)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	latest, err := latestReleaseMetadataForLifecycle(ctx)
	if err != nil {
		fmt.Fprintf(stderr, "failed to resolve latest release: %s\n", err)
		return 1
	}
	targetRepo := ""
	if options.repoRoot != nil {
		targetRepo = resolveRepoRoot(cwd, options.repoRoot)
	}
	summary := map[string]any{
		"schemaVersion": "cautilus.update_summary.v1",
		"current":       current,
		"latest":        latest,
	}
	var nextSteps []string
	var messages []string

	if current.InstallKind == cli.InstallKindSourceCheckout {
		summary["status"] = "manual_source_checkout"
		summary["updated"] = false
		nextSteps = append(nextSteps, "source checkout installs are updated by pulling the repo and rebuilding the CLI")
		if targetRepo != "" {
			skill, installErr := installBundledSkill(targetRepo, true, io.Discard)
			if installErr != nil {
				fmt.Fprintf(stderr, "%s\n", installErr)
				return 1
			}
			summary["skill"] = skill
			nextSteps = append(nextSteps,
				fmt.Sprintf("cautilus doctor --repo-root %s --next-action", targetRepo),
				fmt.Sprintf("cautilus doctor --repo-root %s", targetRepo),
			)
		}
		if options.json {
			summary["nextSteps"] = nextSteps
			if err := writeJSON(stdout, summary); err != nil {
				fmt.Fprintf(stderr, "%s\n", err)
				return 1
			}
			return 0
		}
		fmt.Fprintf(stdout, "Source checkout detected. Pull the repo and rebuild to update the CLI.\n")
		if targetRepo != "" {
			fmt.Fprintf(stdout, "Refreshed bundled skill in %s\n", targetRepo)
			fmt.Fprintf(stdout, "Next: cautilus doctor --repo-root %s --next-action\n", targetRepo)
			fmt.Fprintf(stdout, "Inspect: cautilus doctor --repo-root %s\n", targetRepo)
		}
		return 0
	}

	if cli.CompareVersions(latest.Version, current.Version) > 0 {
		switch current.InstallKind {
		case cli.InstallKindInstallScript, cli.InstallKindStandalone, cli.InstallKindUnknown:
			installResult, installErr := installManagedReleaseForLifecycle(cli.ReleaseInstallOptions{
				Version: "v" + latest.Version,
			})
			if installErr != nil {
				fmt.Fprintf(stderr, "%s\n", installErr)
				return 1
			}
			summary["channel"] = "managed_release"
			summary["installResult"] = installResult
			messages = append(messages, fmt.Sprintf("Installed Cautilus v%s to %s", installResult.Version, installResult.WrapperPath))
			nextSteps = append(nextSteps, fmt.Sprintf("ensure %s is on PATH", filepath.Dir(installResult.WrapperPath)))
		default:
			nextSteps = append(nextSteps, "download the latest tagged release")
		}
		summary["status"] = "updated"
		summary["updated"] = true
	} else {
		summary["status"] = "current"
		summary["updated"] = false
		messages = append(messages, fmt.Sprintf("Cautilus is already current at v%s", current.Version))
	}

	if targetRepo != "" {
		skill, installErr := installBundledSkill(targetRepo, true, io.Discard)
		if installErr != nil {
			fmt.Fprintf(stderr, "%s\n", installErr)
			return 1
		}
		summary["skill"] = skill
		nextSteps = append(nextSteps,
			fmt.Sprintf("cautilus doctor --repo-root %s --next-action", targetRepo),
			fmt.Sprintf("cautilus doctor --repo-root %s", targetRepo),
		)
	}
	summary["messages"] = messages
	summary["nextSteps"] = nextSteps

	if options.json {
		if err := writeJSON(stdout, summary); err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		return 0
	}
	writeLifecycleMessages(stdout, messages)
	for _, step := range nextSteps {
		fmt.Fprintf(stdout, "Next: %s\n", step)
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
	schemaFile, err := resolveReviewSchemaFile(options, promptArtifacts, adapterPayload, cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	log(fmt.Sprintf("review variants artifacts ready: prompt=%s schema=%s", promptArtifacts.promptFile, schemaFile))
	commandTimeout := reviewVariantCommandTimeout(adapterPayload.Data)
	summaries := make([]any, 0, len(variants))
	warnings := reviewVariantWarnings(variants, promptArtifacts.outputUnderTestFile)
	for _, warning := range warnings {
		log("warning: " + anyString(warning))
	}
	for _, variant := range variants {
		id := anyString(variant["id"])
		outputFile := filepath.Join(outputDir, id+".json")
		replacements := map[string]string{
			"candidate_repo":    runtime.ShellSingleQuote(workspace),
			"prompt_file":       runtime.ShellSingleQuote(promptArtifacts.promptFile),
			"schema_file":       runtime.ShellSingleQuote(schemaFile),
			"output_file":       runtime.ShellSingleQuote(outputFile),
			"variant_id":        runtime.ShellSingleQuote(id),
			"output_under_test": runtime.ShellSingleQuote(anyString(asMapAny(promptArtifacts.outputUnderTestFile)["absolutePath"])),
		}
		commandText, err := renderTemplate(anyString(variant["command_template"]), replacements)
		if err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		result := runShellCommand(
			options.repoRoot,
			commandText,
			filepath.Join(outputDir, id+".json.stdout"),
			filepath.Join(outputDir, id+".json.stderr"),
			log,
			"variant "+id,
			commandTimeout,
		)
		rawOutput := map[string]any(nil)
		rawOutputErr := error(nil)
		if pathExists(outputFile) {
			rawOutput, rawOutputErr = readJSONObject(outputFile)
		}
		output := normalizeReviewVariantResult(id, variant["tool"], result, rawOutput, rawOutputErr)
		if err := writeOutputResolved(io.Discard, &outputFile, output); err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		summary := map[string]any{
			"id":              id,
			"tool":            variant["tool"],
			"status":          output["status"],
			"executionStatus": result["status"],
			"startedAt":       result["startedAt"],
			"completedAt":     result["completedAt"],
			"durationMs":      result["durationMs"],
			"exitCode":        result["exitCode"],
			"signal":          result["signal"],
			"outputFile":      outputFile,
			"stdoutFile":      result["stdoutFile"],
			"stderrFile":      result["stderrFile"],
			"command":         commandText,
			"stdout":          result["stdout"],
			"stderr":          result["stderr"],
			"output":          output,
		}
		if telemetry, ok := output["telemetry"].(map[string]any); ok {
			summary["telemetry"] = telemetry
		}
		if reasonCodes := arrayOrEmpty(output["reasonCodes"]); len(reasonCodes) > 0 {
			summary["reasonCodes"] = reasonCodes
		}
		summaries = append(summaries, summary)
	}
	status := overallReviewExecutionStatus(summaries)
	successfulVariantOutputs := successfulReviewVariantOutputs(summaries)
	summaryPacket := map[string]any{
		"schemaVersion":            contracts.ReviewSummarySchema,
		"generatedAt":              time.Now().UTC().Format(time.RFC3339Nano),
		"repoRoot":                 options.repoRoot,
		"adapterPath":              adapterPayload.Path,
		"workspace":                workspace,
		"promptFile":               promptArtifacts.promptFile,
		"reviewPacketFile":         promptArtifacts.reviewPacketFile,
		"reviewPromptInputFile":    promptArtifacts.reviewPromptInputFile,
		"outputUnderTestFile":      promptArtifacts.outputUnderTestFile,
		"warnings":                 warnings,
		"schemaFile":               schemaFile,
		"outputDir":                outputDir,
		"status":                   status,
		"reviewVerdict":            overallReviewVerdict(summaries),
		"reasonCodes":              collectReviewReasonCodes(summaries),
		"humanReviewFindings":      flattenReviewFindings(summaries),
		"findingsCount":            countReviewFindings(summaries),
		"partialSuccess":           status != "passed" && len(successfulVariantOutputs) > 0,
		"successfulVariantCount":   len(successfulVariantOutputs),
		"successfulVariantOutputs": successfulVariantOutputs,
		"telemetry":                summarizeVariantTelemetry(summaries),
		"variants":                 summaries,
	}
	summaryFile := filepath.Join(outputDir, "review-summary.json")
	if err := writeOutputResolved(stdout, &summaryFile, summaryPacket); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	log(fmt.Sprintf("review variants complete: status=%s summary=%s", status, summaryFile))
	fmt.Fprintf(stdout, "%s\n", summaryFile)
	if status != "passed" {
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
	selectedScenarioIDs := []string{}
	var scenarioProfile map[string]any
	var loadedHistory map[string]any
	profileArg := options.profile
	if profileArg == "" {
		if defaultProfile, ok := adapterPayload.Data["profile_default"].(string); ok && strings.TrimSpace(defaultProfile) != "" {
			profileArg = defaultProfile
		} else {
			profileArg = "default"
		}
	}
	profilePlaceholder := profileArg
	resolvedProfilePath := resolvePath(options.repoRoot, profileArg)
	if pathExists(resolvedProfilePath) {
		profile, err := runtime.LoadScenarioProfile(resolvedProfilePath)
		if err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		selectedSplit := firstNonEmpty(options.split, defaultSplitByMode(options.mode))
		history := runtime.LoadScenarioHistory(historyFile, profile)
		selectedIDs, err := runtime.SelectProfileScenarioIDs(profile, selectedSplit, history, options.mode == "full_gate")
		if err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		selectedScenarioIDs = selectedIDs
		if err := writeOutputResolved(io.Discard, &selectedScenarioIDsFile, stringSliceToAny(selectedScenarioIDs)); err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		selectedProfileFile := filepath.Join(outputDir, "selected-profile.json")
		selectedIDSet := map[string]struct{}{}
		for _, scenarioID := range selectedScenarioIDs {
			selectedIDSet[scenarioID] = struct{}{}
		}
		filteredScenarios := []any{}
		for _, rawScenario := range arrayOrEmpty(profile["scenarios"]) {
			scenarioID := anyString(asMapAny(rawScenario)["scenarioId"])
			if _, ok := selectedIDSet[scenarioID]; ok {
				filteredScenarios = append(filteredScenarios, rawScenario)
			}
		}
		filteredProfile, err := cloneJSONObject(profile)
		if err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		filteredProfile["scenarios"] = filteredScenarios
		if err := writeOutputResolved(io.Discard, &selectedProfileFile, filteredProfile); err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		profilePlaceholder = selectedProfileFile
		scenarioProfile = profile
		loadedHistory = history
	}
	replacements := map[string]string{
		"baseline_ref":               runtime.ShellSingleQuote(firstNonEmpty(options.baselineRef, "HEAD")),
		"baseline_repo":              runtime.ShellSingleQuote(resolvePath(cwd, baselineRepo)),
		"candidate_repo":             runtime.ShellSingleQuote(resolvePath(cwd, candidateRepo)),
		"history_file":               runtime.ShellSingleQuote(historyFile),
		"profile":                    runtime.ShellSingleQuote(profilePlaceholder),
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
	commandTimeout := defaultShellCommandTimeout()
	commandObservations := []any{}
	if !options.skipPreflight {
		for index, commandTemplate := range stringArray(adapterPayload.Data["preflight_commands"]) {
			commandText, err := renderTemplate(commandTemplate, replacements)
			if err != nil {
				fmt.Fprintf(stderr, "%s\n", err)
				return 1
			}
			result := runShellCommand(
				options.repoRoot,
				commandText,
				filepath.Join(outputDir, fmt.Sprintf("preflight-%d.stdout", index+1)),
				filepath.Join(outputDir, fmt.Sprintf("preflight-%d.stderr", index+1)),
				log,
				fmt.Sprintf("preflight %d/%d", index+1, len(stringArray(adapterPayload.Data["preflight_commands"]))),
				commandTimeout,
			)
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
		result := runShellCommand(
			options.repoRoot,
			commandText,
			filepath.Join(outputDir, fmt.Sprintf("%s-%d.stdout", options.mode, index+1)),
			filepath.Join(outputDir, fmt.Sprintf("%s-%d.stderr", options.mode, index+1)),
			log,
			fmt.Sprintf("%s %d/%d", options.mode, index+1, len(templates)),
			commandTimeout,
		)
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
	modeStatus := resolveModeStatus(modeObservations, scenarioResults)
	buckets := classifyScenarioBuckets(scenarioResults)
	modeRun := map[string]any{
		"mode":            options.mode,
		"status":          modeStatus,
		"summary":         modeSummaryText(options.mode, modeStatus, len(modeObservations), buckets),
		"durationMs":      sumDuration(modeObservations),
		"scenarioResults": scenarioResults,
	}
	if len(modeObservations) > 0 {
		first := modeObservations[0].(map[string]any)
		last := modeObservations[len(modeObservations)-1].(map[string]any)
		modeRun["startedAt"] = first["startedAt"]
		modeRun["completedAt"] = last["completedAt"]
	}
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
	if options.adapter != nil || options.adapterName != nil {
		adapterContext := map[string]any{}
		if options.adapter != nil {
			adapterContext["adapter"] = anyString(adapterPayload.Path)
		}
		if options.adapterName != nil {
			adapterContext["adapterName"] = *options.adapterName
		}
		reportInput["adapterContext"] = adapterContext
	}
	if runtimePolicy := asMapAny(adapterPayload.Data["runtime_policy"]); len(runtimePolicy) > 0 {
		reportInput["runtimePolicy"] = runtimePolicy
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
		"selectedScenarioIds": stringSliceToAny(selectedScenarioIDs),
		"baselineCacheFile":   nil,
		"commandObservations": commandObservations,
		"report":              report,
	}
	if scenarioProfile != nil {
		packet["historyFile"] = historyFile
	}
	if scenarioProfile != nil && options.mode == "comparison" && len(selectedScenarioIDs) > 0 {
		baselineCacheFile := filepath.Join(outputDir, "baseline-cache.json")
		baselineFingerprint, err := resolveBaselineFingerprint(resolvePath(cwd, baselineRepo), firstNonEmpty(options.baselineRef, "HEAD"))
		if err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		baselineCache, err := runtime.CreateScenarioBaselineCacheSeed(
			scenarioProfile,
			selectedScenarioIDs,
			baselineFingerprint,
			intOrDefault(options.comparisonSamples, intFromAny(adapterPayload.Data["comparison_samples_default"], 2)),
			baselineRepoLabel(firstNonEmpty(options.baselineRef, "HEAD"), baselineFingerprint),
			time.Now().UTC().Format(time.RFC3339Nano),
		)
		if err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		if err := writeOutputResolved(io.Discard, &baselineCacheFile, baselineCache); err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		packet["baselineCacheFile"] = baselineCacheFile
		packet["baselineCache"] = baselineCache
	}
	if scenarioProfile != nil {
		timestamp := firstNonEmpty(anyString(scenarioResults["completedAt"]), anyString(scenarioResults["timestamp"]), time.Now().UTC().Format(time.RFC3339Nano))
		scenarioHistory, err := runtime.UpdateScenarioHistory(
			scenarioProfile,
			loadedHistory,
			selectedScenarioIDs,
			arrayOrEmpty(scenarioResults["results"]),
			timestamp,
			firstNonEmpty(options.split, defaultSplitByMode(options.mode)),
			options.mode == "full_gate",
		)
		if err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		if err := runtime.SaveScenarioHistory(historyFile, scenarioHistory); err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		snapshotFile := filepath.Join(outputDir, "scenario-history.snapshot.json")
		if err := writeOutputResolved(io.Discard, &snapshotFile, scenarioHistory); err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		packet["scenarioHistory"] = scenarioHistory
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
	scenarioFile      *string
	scenarioID        *string
	outputUnderTest   *string
	outputTextKey     *string
	outputDir         *string
	reportFile        *string
	reviewPacketFile  *string
	reviewPromptInput *string
	variantIDs        []string
	quiet             bool
}

type evalTestArgs struct {
	repoRoot      string
	adapter       *string
	adapterName   *string
	workspace     string
	outputDir     *string
	output        *string
	runtime       string
	quiet         bool
	skipPreflight bool
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
	outputUnderTestFile   any
	schemaFile            string
}

//nolint:errcheck // CLI stdout/stderr reporting is best-effort.
func runEvalTestPipeline(
	options *evalTestArgs,
	adapterPayload *runtime.AdapterPayload,
	suiteID string,
	prepareCasesFile func(outputDir string) (string, error),
	cwd string,
	stdout io.Writer,
	stderr io.Writer,
	progressLabel string,
) int {
	templates := stringArray(adapterPayload.Data["eval_test_command_templates"])
	if len(templates) == 0 {
		fmt.Fprintf(stderr, "Adapter does not define eval_test_command_templates\n")
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
	casesFile, err := prepareCasesFile(outputDir)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	summaryFile := filepath.Join(outputDir, "eval-summary.json")
	if options.output != nil {
		summaryFile = *options.output
	}
	inputFile := filepath.Join(outputDir, "eval-observed.json")
	log := progressLogger(options.quiet, stderr)
	workspace := resolvePath(cwd, options.workspace)
	effectiveRuntime := options.runtime
	if effectiveRuntime == "" {
		effectiveRuntime = strings.TrimSpace(anyString(adapterPayload.Data["default_runtime"]))
	}
	if effectiveRuntime == "" {
		effectiveRuntime = "codex"
	}
	backendValue := "codex_exec"
	if effectiveRuntime == "claude" {
		backendValue = "claude_code"
	}
	replacements := map[string]string{
		"candidate_repo":     runtime.ShellSingleQuote(workspace),
		"output_dir":         runtime.ShellSingleQuote(outputDir),
		"eval_cases_file":    runtime.ShellSingleQuote(casesFile),
		"eval_observed_file": runtime.ShellSingleQuote(inputFile),
		"backend":            backendValue,
	}
	log(fmt.Sprintf("%s start: repo=%s workspace=%s suite=%s runtime=%s output=%s", progressLabel, options.repoRoot, workspace, suiteID, effectiveRuntime, outputDir))
	commandTimeout := defaultShellCommandTimeout()
	commandsPassed := true
	if !options.skipPreflight {
		for index, commandTemplate := range stringArray(adapterPayload.Data["preflight_commands"]) {
			commandText, err := renderTemplate(commandTemplate, replacements)
			if err != nil {
				fmt.Fprintf(stderr, "%s\n", err)
				return 1
			}
			result := runShellCommand(
				options.repoRoot,
				commandText,
				filepath.Join(outputDir, fmt.Sprintf("preflight-%d.stdout", index+1)),
				filepath.Join(outputDir, fmt.Sprintf("preflight-%d.stderr", index+1)),
				log,
				fmt.Sprintf("preflight %d/%d", index+1, len(stringArray(adapterPayload.Data["preflight_commands"]))),
				commandTimeout,
			)
			if anyString(result["status"]) != "passed" {
				commandsPassed = false
				break
			}
		}
	} else {
		log("preflight skipped")
	}
	if commandsPassed {
		for index, commandTemplate := range templates {
			commandText, err := renderTemplate(commandTemplate, replacements)
			if err != nil {
				fmt.Fprintf(stderr, "%s\n", err)
				return 1
			}
			result := runShellCommand(
				options.repoRoot,
				commandText,
				filepath.Join(outputDir, fmt.Sprintf("eval-test-%d.stdout", index+1)),
				filepath.Join(outputDir, fmt.Sprintf("eval-test-%d.stderr", index+1)),
				log,
				fmt.Sprintf("%s %d/%d", progressLabel, index+1, len(templates)),
				commandTimeout,
			)
			if anyString(result["status"]) != "passed" {
				commandsPassed = false
				break
			}
		}
	}
	input, err := readJSONObject(inputFile)
	if err != nil {
		if !commandsPassed {
			fmt.Fprintf(stderr, "%s commands failed before producing %s\n", progressLabel, inputFile)
		} else {
			fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", inputFile, err)
		}
		return 1
	}
	summary, err := buildEvalEvaluateSummary(input)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeOutputResolved(stdout, &summaryFile, summary); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	log(fmt.Sprintf("%s complete: recommendation=%s summary=%s", progressLabel, anyString(summary["recommendation"]), summaryFile))
	fmt.Fprintf(stdout, "%s\n", summaryFile)
	if !commandsPassed {
		return 1
	}
	return 0
}

//nolint:errcheck // CLI stdout/stderr reporting is best-effort.
func handleEvalTest(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, fixturePath, err := parseEvalTestArgs(args, cwd)
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
	if strings.TrimSpace(fixturePath) == "" {
		defaultFixture := strings.TrimSpace(anyString(adapterPayload.Data["evaluation_input_default"]))
		if defaultFixture == "" {
			fmt.Fprintf(stderr, "--fixture is required when the adapter does not declare evaluation_input_default\n")
			return 1
		}
		fixturePath = resolvePath(options.repoRoot, defaultFixture)
	}
	fixtureInput, err := readJSONObject(fixturePath)
	if err != nil {
		fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", fixturePath, err)
		return 1
	}
	evaluation, err := runtime.NormalizeEvaluationInput(fixtureInput)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	prepareCasesFile := func(outputDir string) (string, error) {
		path := filepath.Join(outputDir, "eval-cases.json")
		body, err := json.MarshalIndent(evaluation.TranslatedCases, "", "  ")
		if err != nil {
			return "", fmt.Errorf("marshal eval cases: %w", err)
		}
		if err := os.WriteFile(path, body, 0o644); err != nil {
			return "", fmt.Errorf("write eval cases: %w", err)
		}
		return path, nil
	}
	return runEvalTestPipeline(options, adapterPayload, evaluation.SuiteID, prepareCasesFile, cwd, stdout, stderr, fmt.Sprintf("eval test (%s/%s)", evaluation.Surface, evaluation.Preset))
}

func parseEvalTestArgs(args []string, cwd string) (*evalTestArgs, string, error) {
	options := &evalTestArgs{
		repoRoot:  cwd,
		workspace: cwd,
	}
	fixturePath := ""
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--repo-root":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, "", err
			}
			index = next
			options.repoRoot = resolvePath(cwd, value)
			if options.workspace == cwd {
				options.workspace = options.repoRoot
			}
		case "--workspace":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, "", err
			}
			index = next
			options.workspace = resolvePath(cwd, value)
		case "--fixture":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, "", err
			}
			index = next
			fixturePath = resolvePath(cwd, value)
		case "--adapter":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, "", err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.adapter = &resolved
		case "--adapter-name":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, "", err
			}
			index = next
			options.adapterName = &value
		case "--output-dir":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, "", err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.outputDir = &resolved
		case "--output":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, "", err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.output = &resolved
		case "--runtime":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, "", err
			}
			index = next
			if value != "codex" && value != "claude" {
				return nil, "", fmt.Errorf("--runtime must be codex or claude")
			}
			options.runtime = value
		case "--quiet":
			options.quiet = true
		case "--skip-preflight":
			options.skipPreflight = true
		default:
			return nil, "", fmt.Errorf("unknown argument: %s", arg)
		}
	}
	if options.adapter != nil && options.adapterName != nil {
		return nil, "", fmt.Errorf("use either --adapter or --adapter-name, not both")
	}
	return options, fixturePath, nil
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
		case "--scenario-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.scenarioFile = &resolved
		case "--scenario":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.scenarioID = &value
		case "--output-under-test":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.outputUnderTest = &resolved
		case "--output-text-key":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.outputTextKey = &value
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
	if options.outputTextKey != nil && options.outputUnderTest == nil {
		return nil, fmt.Errorf("--output-text-key requires --output-under-test")
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

type bundledSkillInstallResult struct {
	DestinationDir       string `json:"destinationDir"`
	DestinationSkill     string `json:"destinationSkill"`
	ClaudeSkillsLink     string `json:"claudeSkillsLink"`
	Overwrote            bool   `json:"overwrote"`
	LegacyMigrated       bool   `json:"legacyMigrated"`
	LegacySource         string `json:"legacySource,omitempty"`
	LegacyDestination    string `json:"legacyDestination,omitempty"`
	RequiresBinaryOnPath bool   `json:"requiresBinaryOnPath"`
}

func installBundledSkill(repoRoot string, overwrite bool, log io.Writer) (*bundledSkillInstallResult, error) {
	destinationDir := filepath.Join(repoRoot, ".agents", "skills", "cautilus")
	destinationSkill := filepath.Join(destinationDir, "SKILL.md")
	migrated, err := migrateLegacyClaudeSkillsDir(repoRoot, log)
	if err != nil {
		return nil, err
	}
	if pathExists(destinationSkill) && !overwrite {
		return nil, fmt.Errorf("%s already exists\nhint: use --overwrite to replace existing files", destinationSkill)
	}
	if overwrite {
		_ = os.RemoveAll(destinationDir)
	}
	if err := os.MkdirAll(destinationDir, 0o755); err != nil {
		return nil, err
	}
	if err := bundledskills.InstallCautilus(destinationDir); err != nil {
		return nil, err
	}
	if err := ensureClaudeSkillsSymlink(repoRoot); err != nil {
		return nil, err
	}
	result := &bundledSkillInstallResult{
		DestinationDir:       destinationDir,
		DestinationSkill:     destinationSkill,
		ClaudeSkillsLink:     filepath.Join(repoRoot, ".claude", "skills"),
		Overwrote:            overwrite,
		RequiresBinaryOnPath: true,
	}
	if migrated {
		result.LegacyMigrated = true
		result.LegacySource = filepath.Join(repoRoot, ".claude", "skills")
		result.LegacyDestination = filepath.Join(repoRoot, ".agents", "skills")
	}
	return result, nil
}

func migrateLegacyClaudeSkillsDir(repoRoot string, stdout io.Writer) (bool, error) {
	claudeSkills := filepath.Join(repoRoot, ".claude", "skills")
	agentsSkills := filepath.Join(repoRoot, ".agents", "skills")
	info, err := os.Lstat(claudeSkills)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return false, nil
		}
		return false, err
	}
	if !info.IsDir() || info.Mode()&os.ModeSymlink != 0 {
		return false, nil
	}
	if pathExists(agentsSkills) {
		return true, os.RemoveAll(claudeSkills)
	}
	if err := os.MkdirAll(filepath.Join(repoRoot, ".agents"), 0o755); err != nil {
		return false, err
	}
	if err := os.Rename(claudeSkills, agentsSkills); err != nil {
		return false, err
	}
	_, _ = fmt.Fprintf(stdout, "Migrated %s -> %s\n", claudeSkills, agentsSkills)
	return true, nil
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

func logLines(content string) []string {
	lines := []string{}
	for _, line := range strings.Split(strings.TrimSpace(content), "\n") {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}
		lines = append(lines, trimmed)
	}
	return lines
}

func writeLifecycleMessages(stdout io.Writer, messages []string) {
	for _, message := range messages {
		_, _ = fmt.Fprintln(stdout, message)
	}
}

func progressLogger(quiet bool, stderr io.Writer) func(string) {
	return func(message string) {
		if quiet {
			return
		}
		_, _ = fmt.Fprintln(stderr, message)
	}
}

func runShellCommand(repoRoot string, commandText string, stdoutFile string, stderrFile string, log func(string), label string, timeout time.Duration) map[string]any {
	startedAt := time.Now()
	log(fmt.Sprintf("%s start: %s", label, commandText))
	ctx := context.Background()
	cancel := func() {}
	if timeout > 0 {
		ctx, cancel = context.WithTimeout(ctx, timeout)
	}
	defer cancel()
	command := exec.CommandContext(ctx, "bash", "-lc", commandText)
	command.Dir = repoRoot
	command.Env = externalCommandEnv(nil)
	var stdoutBuffer bytes.Buffer
	var stderrBuffer bytes.Buffer
	command.Stdout = &stdoutBuffer
	command.Stderr = &stderrBuffer
	err := command.Run()
	completedAt := time.Now()
	timedOut := timeout > 0 && ctx.Err() == context.DeadlineExceeded
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
		"timedOut":    timedOut,
	}
	var exitErr *exec.ExitError
	if errors.As(err, &exitErr) {
		result["exitCode"] = exitErr.ExitCode()
	} else if err == nil {
		result["exitCode"] = 0
	} else if timedOut {
		result["exitCode"] = -1
	}
	if timedOut {
		result["error"] = fmt.Sprintf("command timed out after %s", timeout)
	}
	log(fmt.Sprintf("%s %s in %dms", label, result["status"], result["durationMs"]))
	if timedOut {
		log(fmt.Sprintf("%s timeout: command timed out after %s", label, timeout))
	}
	return result
}

func parsePositiveTimeoutDuration(envName string) (time.Duration, bool) {
	raw := strings.TrimSpace(os.Getenv(envName))
	if raw == "" {
		return 0, false
	}
	parsed, err := strconv.Atoi(raw)
	if err != nil || parsed <= 0 {
		return 0, false
	}
	return time.Duration(parsed) * time.Millisecond, true
}

func defaultShellCommandTimeout() time.Duration {
	if timeout, ok := parsePositiveTimeoutDuration(boundedShellCommandTimeoutEnv); ok {
		return timeout
	}
	return defaultBoundedShellCommandTimeout
}

func reviewVariantCommandTimeout(adapterData map[string]any) time.Duration {
	if timeout, ok := parsePositiveTimeoutDuration(boundedShellCommandTimeoutEnv); ok {
		return timeout
	}
	if timeoutMs := intFromAny(adapterData["review_timeout_ms"], 0); timeoutMs > 0 {
		return time.Duration(timeoutMs) * time.Millisecond
	}
	return defaultBoundedShellCommandTimeout
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

func runCommandProcess(commandParts []string, workingDirectory string, extraEnv map[string]string, stdinText string, timeoutMs int) (map[string]any, error) {
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

func resolveReviewVariantPromptArtifacts(options *reviewVariantsArgs, adapterPayload *runtime.AdapterPayload, outputDir string) (*reviewPromptArtifacts, error) {
	repoRoot := options.repoRoot
	if options.outputUnderTest != nil && options.promptFile != nil {
		return nil, fmt.Errorf("--output-under-test cannot be combined with --prompt-file")
	}
	if options.outputUnderTest != nil && options.reviewPromptInput != nil {
		return nil, fmt.Errorf("--output-under-test cannot be combined with --review-prompt-input")
	}
	if options.scenarioFile != nil && options.outputUnderTest == nil {
		return nil, fmt.Errorf("--scenario-file requires --output-under-test")
	}
	if options.scenarioFile != nil && (options.promptFile != nil || options.reviewPromptInput != nil || options.reviewPacketFile != nil || options.reportFile != nil) {
		return nil, fmt.Errorf("--scenario-file cannot be combined with prompt, review-packet, or report inputs")
	}
	if options.promptFile != nil {
		return &reviewPromptArtifacts{promptFile: resolvePath(repoRoot, *options.promptFile), reviewPacketFile: nil, reviewPromptInputFile: nil, outputUnderTestFile: nil, schemaFile: ""}, nil
	}
	if options.outputUnderTest == nil {
		if defaultPrompt, ok := adapterPayload.Data["default_prompt_file"].(string); ok && strings.TrimSpace(defaultPrompt) != "" {
			return &reviewPromptArtifacts{promptFile: resolvePath(repoRoot, defaultPrompt), reviewPacketFile: nil, reviewPromptInputFile: nil, outputUnderTestFile: nil, schemaFile: ""}, nil
		}
	}
	if options.scenarioFile != nil {
		scenarioSourceFile := resolvePath(repoRoot, *options.scenarioFile)
		scenarioSource, err := readJSONObject(scenarioSourceFile)
		if err != nil {
			return nil, err
		}
		promptInput, err := runtime.BuildReviewPromptInputFromScenario(options.repoRoot, anyString(adapterPayload.Path), adapterPayload.Data, scenarioSource, scenarioSourceFile, options.scenarioID, *options.outputUnderTest, options.outputTextKey, time.Now())
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
		return &reviewPromptArtifacts{
			promptFile:            promptFile,
			reviewPacketFile:      nil,
			reviewPromptInputFile: reviewPromptInputFile,
			outputUnderTestFile:   promptInput["outputUnderTestFile"],
			schemaFile:            anyString(asMapAny(promptInput["defaultSchemaFile"])["absolutePath"]),
		}, nil
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
		return &reviewPromptArtifacts{
			promptFile:            promptFile,
			reviewPacketFile:      nil,
			reviewPromptInputFile: reviewPromptInputFile,
			outputUnderTestFile:   input["outputUnderTestFile"],
			schemaFile:            anyString(asMapAny(input["defaultSchemaFile"])["absolutePath"]),
		}, nil
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
	promptInput, err := runtime.BuildReviewPromptInput(reviewPacket, reviewPacketFile, options.outputUnderTest, options.outputTextKey, time.Now())
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
	return &reviewPromptArtifacts{
		promptFile:            promptFile,
		reviewPacketFile:      reviewPacketFile,
		reviewPromptInputFile: reviewPromptInputFile,
		outputUnderTestFile:   promptInput["outputUnderTestFile"],
		schemaFile:            anyString(asMapAny(promptInput["defaultSchemaFile"])["absolutePath"]),
	}, nil
}

func resolveReviewSchemaFile(options *reviewVariantsArgs, promptArtifacts *reviewPromptArtifacts, adapterPayload *runtime.AdapterPayload, cwd string) (string, error) {
	if options.schemaFile != nil {
		return resolvePath(cwd, *options.schemaFile), nil
	}
	if promptArtifacts != nil && strings.TrimSpace(promptArtifacts.schemaFile) != "" {
		return promptArtifacts.schemaFile, nil
	}
	if schemaFile, ok := adapterPayload.Data["default_schema_file"].(string); ok && strings.TrimSpace(schemaFile) != "" {
		return resolvePath(options.repoRoot, schemaFile), nil
	}
	return "", fmt.Errorf("missing required argument or adapter default: schemaFile")
}

func reviewVariantWarnings(variants []map[string]any, outputUnderTestFile any) []any {
	if anyString(asMapAny(outputUnderTestFile)["absolutePath"]) == "" {
		return []any{}
	}
	warnings := make([]any, 0)
	for _, variant := range variants {
		commandTemplate := anyString(variant["command_template"])
		if strings.Contains(commandTemplate, "{output_under_test}") {
			continue
		}
		warnings = append(warnings, fmt.Sprintf("Variant %s does not reference {output_under_test}; it will need to rely on the rendered prompt for the artifact path.", anyString(variant["id"])))
	}
	return warnings
}

func normalizeReviewVariantResult(variantID string, tool any, execution map[string]any, rawOutput map[string]any, rawOutputErr error) map[string]any {
	packet := map[string]any{
		"schemaVersion": contracts.ReviewVariantResultSchema,
		"variantId":     variantID,
		"tool":          tool,
		"status":        "passed",
		"findings":      []any{},
	}
	if len(rawOutput) > 0 {
		packet["rawOutput"] = rawOutput
	}
	if telemetry := asMapAny(rawOutput["telemetry"]); len(telemetry) > 0 {
		packet["telemetry"] = telemetry
	}
	if verdict := normalizeReviewVerdict(anyString(rawOutput["verdict"])); verdict != "" {
		packet["verdict"] = verdict
	}
	if summary := strings.TrimSpace(anyString(rawOutput["summary"])); summary != "" {
		packet["summary"] = summary
	}
	findings := normalizeReviewVariantFindings(rawOutput["findings"], variantID)
	status := "passed"
	reason := ""
	reasonCodes := normalizeReasonCodes(rawOutput["reasonCodes"])
	switch {
	case anyString(execution["status"]) != "passed":
		reason = firstNonEmptyString(
			strings.TrimSpace(anyString(rawOutput["reason"])),
			strings.TrimSpace(anyString(rawOutput["message"])),
			strings.TrimSpace(anyString(execution["stderr"])),
			strings.TrimSpace(anyString(execution["stdout"])),
			"review variant command failed",
		)
		if reviewVariantUnavailableExecutorFailure(execution, reason) {
			status = "blocked"
			if len(reasonCodes) == 0 {
				reasonCodes = []any{"unavailable_executor"}
			}
		} else {
			status = "failed"
		}
		if len(reasonCodes) == 0 {
			reasonCodes = []any{"command_failed"}
		}
	case rawOutputErr != nil:
		status = "failed"
		reason = rawOutputErr.Error()
		if len(reasonCodes) == 0 {
			reasonCodes = []any{"invalid_output_json"}
		}
	case len(rawOutput) == 0:
		status = "failed"
		reason = "review variant did not produce a JSON object"
		if len(reasonCodes) == 0 {
			reasonCodes = []any{"missing_output"}
		}
	default:
		switch normalizeReviewExecutionStatus(anyString(rawOutput["status"])) {
		case "blocked":
			status = "blocked"
			reason = firstNonEmptyString(
				strings.TrimSpace(anyString(rawOutput["reason"])),
				strings.TrimSpace(anyString(rawOutput["abortReason"])),
				strings.TrimSpace(anyString(rawOutput["message"])),
				strings.TrimSpace(anyString(rawOutput["summary"])),
				"review variant blocked without a reason",
			)
			if len(reasonCodes) == 0 {
				reasonCodes = []any{"variant_blocked"}
			}
		case "failed":
			status = "failed"
			reason = firstNonEmptyString(
				strings.TrimSpace(anyString(rawOutput["reason"])),
				strings.TrimSpace(anyString(rawOutput["message"])),
				strings.TrimSpace(anyString(rawOutput["summary"])),
				"review variant reported a failure",
			)
			if len(reasonCodes) == 0 {
				reasonCodes = []any{"variant_failed"}
			}
		}
	}
	packet["status"] = status
	if status != "passed" {
		if reason != "" {
			packet["reason"] = reason
		}
		packet["reasonCodes"] = reasonCodes
		if packet["summary"] == nil || strings.TrimSpace(anyString(packet["summary"])) == "" {
			packet["summary"] = reason
		}
		if len(findings) == 0 {
			findings = []any{map[string]any{
				"severity": "blocker",
				"message":  firstNonEmptyString(anyString(packet["summary"]), reason, "review variant failed without details"),
				"path":     "variant/" + variantID,
			}}
		}
	}
	if packet["summary"] == nil || strings.TrimSpace(anyString(packet["summary"])) == "" {
		switch {
		case len(findings) > 0:
			packet["summary"] = anyString(asMapAny(findings[0])["message"])
		case packet["verdict"] != nil:
			packet["summary"] = fmt.Sprintf("%s review completed with verdict %s.", variantID, packet["verdict"])
		default:
			packet["summary"] = fmt.Sprintf("%s review completed.", variantID)
		}
	}
	packet["findings"] = findings
	return packet
}

func normalizeReviewVariantFindings(value any, variantID string) []any {
	items := arrayOrEmpty(value)
	if len(items) == 0 {
		return []any{}
	}
	findings := make([]any, 0, len(items))
	for index, raw := range items {
		record := asMapAny(raw)
		message := strings.TrimSpace(anyString(record["message"]))
		if message == "" {
			continue
		}
		finding := map[string]any{
			"severity": firstNonEmptyString(normalizeReviewSeverity(anyString(record["severity"])), "concern"),
			"message":  message,
			"path":     firstNonEmptyString(strings.TrimSpace(anyString(record["path"])), fmt.Sprintf("variant/%s/%d", variantID, index)),
		}
		findings = append(findings, finding)
	}
	return findings
}

func normalizeReviewExecutionStatus(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "", "passed", "completed", "success", "ok":
		return "passed"
	case "blocked", "abort", "aborted", "skipped":
		return "blocked"
	case "failed", "error":
		return "failed"
	default:
		return "passed"
	}
}

func normalizeReviewSeverity(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "blocker", "concern", "pass":
		return strings.ToLower(strings.TrimSpace(value))
	default:
		return ""
	}
}

func normalizeReviewVerdict(value string) string {
	return normalizeReviewSeverity(value)
}

func normalizeReasonCodes(value any) []any {
	items := arrayOrEmpty(value)
	if len(items) == 0 {
		return []any{}
	}
	seen := map[string]struct{}{}
	codes := make([]any, 0, len(items))
	for _, raw := range items {
		code := strings.TrimSpace(anyString(raw))
		if code == "" {
			continue
		}
		if _, ok := seen[code]; ok {
			continue
		}
		seen[code] = struct{}{}
		codes = append(codes, code)
	}
	return codes
}

func firstNonEmptyString(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func reviewVariantUnavailableExecutorFailure(execution map[string]any, reason string) bool {
	text := strings.ToLower(strings.Join([]string{
		reason,
		anyString(execution["stderr"]),
		anyString(execution["stdout"]),
		anyString(execution["error"]),
	}, "\n"))
	for _, pattern := range []string{
		"401",
		"unauthorized",
		"authentication",
		"not authenticated",
		"not logged in",
		"login required",
		"please login",
		"api key",
		"api_key",
		"auth token",
		"command not found",
		"executable file not found",
		"no such file or directory",
	} {
		if strings.Contains(text, pattern) {
			return true
		}
	}
	return false
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
		"blockedVariantCount":      countVariantStatus(summaries, "blocked"),
		"failedVariantCount":       countVariantStatus(summaries, "failed"),
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
	if result["timedOut"] == true {
		packet["timedOut"] = true
	}
	if result["error"] != nil {
		packet["error"] = result["error"]
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

func comparisonRejected(scenarioResults map[string]any) bool {
	return len(asMapAny(scenarioResults["compareArtifact"])) > 0 || len(arrayOrEmpty(scenarioResults["results"])) > 0
}

func resolveModeStatus(modeObservations []any, scenarioResults map[string]any) string {
	for _, raw := range modeObservations {
		if anyString(asMapAny(raw)["status"]) != "passed" {
			if comparisonRejected(scenarioResults) {
				return "rejected"
			}
			return "failed"
		}
	}
	return "passed"
}

func modeSummaryText(mode string, status string, count int, scenarioBuckets map[string][]any) string {
	if status == "passed" {
		if count == 1 {
			return fmt.Sprintf("%s completed across 1 command.", mode)
		}
		return fmt.Sprintf("%s completed across %d commands.", mode, count)
	}
	if status == "rejected" {
		regressionCount := len(scenarioBuckets["regressed"])
		if regressionCount > 0 {
			if regressionCount == 1 {
				return fmt.Sprintf("%s completed comparison and reported 1 regression.", mode)
			}
			return fmt.Sprintf("%s completed comparison and reported %d regressions.", mode, regressionCount)
		}
		return fmt.Sprintf("%s completed comparison and returned a rejecting verdict.", mode)
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

func overallReviewExecutionStatus(items []any) string {
	if countVariantStatus(items, "failed") > 0 {
		return "failed"
	}
	if countVariantStatus(items, "blocked") > 0 {
		return "blocked"
	}
	return "passed"
}

func overallReviewVerdict(items []any) string {
	best := ""
	sawPassedVariant := false
	sawReviewBlockingExecution := false
	for _, raw := range items {
		record := asMapAny(raw)
		if anyString(record["status"]) != "passed" {
			if !hasReasonCode(record, "unavailable_executor") {
				sawReviewBlockingExecution = true
			}
			continue
		}
		sawPassedVariant = true
		verdict := normalizeReviewVerdict(anyString(asMapAny(record["output"])["verdict"]))
		if verdict == "" {
			continue
		}
		if best == "" || reviewVerdictPriority(verdict) > reviewVerdictPriority(best) {
			best = verdict
		}
	}
	if best != "" {
		return best
	}
	if sawPassedVariant {
		return "pass"
	}
	if sawReviewBlockingExecution {
		return "blocker"
	}
	return "unknown"
}

func hasReasonCode(record map[string]any, target string) bool {
	for _, raw := range arrayOrEmpty(record["reasonCodes"]) {
		if anyString(raw) == target {
			return true
		}
	}
	return false
}

func reviewVerdictPriority(verdict string) int {
	switch verdict {
	case "blocker":
		return 2
	case "concern":
		return 1
	default:
		return 0
	}
}

func collectReviewReasonCodes(items []any) []any {
	seen := map[string]struct{}{}
	codes := []any{}
	for _, raw := range items {
		for _, code := range arrayOrEmpty(asMapAny(raw)["reasonCodes"]) {
			text := strings.TrimSpace(anyString(code))
			if text == "" {
				continue
			}
			if _, ok := seen[text]; ok {
				continue
			}
			seen[text] = struct{}{}
			codes = append(codes, text)
		}
	}
	return codes
}

func successfulReviewVariantOutputs(items []any) []any {
	successes := []any{}
	for _, raw := range items {
		record := asMapAny(raw)
		if anyString(record["status"]) != "passed" {
			continue
		}
		output := asMapAny(record["output"])
		success := map[string]any{
			"id":            record["id"],
			"tool":          record["tool"],
			"outputFile":    record["outputFile"],
			"verdict":       output["verdict"],
			"summary":       output["summary"],
			"findingsCount": len(arrayOrEmpty(output["findings"])),
		}
		successes = append(successes, success)
	}
	return successes
}

func flattenReviewFindings(items []any) []any {
	findings := []any{}
	for _, raw := range items {
		record := asMapAny(raw)
		variantID := anyString(record["id"])
		for _, rawFinding := range arrayOrEmpty(asMapAny(record["output"])["findings"]) {
			finding := asMapAny(rawFinding)
			message := strings.TrimSpace(anyString(finding["message"]))
			if message == "" {
				continue
			}
			flattened := map[string]any{
				"severity": firstNonEmptyString(normalizeReviewSeverity(anyString(finding["severity"])), "concern"),
				"message":  message,
			}
			if path := strings.TrimSpace(anyString(finding["path"])); path != "" {
				flattened["path"] = path
			}
			if variantID != "" {
				flattened["variantId"] = variantID
			}
			findings = append(findings, flattened)
		}
	}
	return findings
}

func countReviewFindings(items []any) int {
	total := 0
	for _, raw := range items {
		total += len(arrayOrEmpty(asMapAny(asMapAny(raw)["output"])["findings"]))
	}
	return total
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

func stringSliceToAny(values []string) []any {
	result := make([]any, 0, len(values))
	for _, value := range values {
		result = append(result, value)
	}
	return result
}

func cloneJSONObject(value map[string]any) (map[string]any, error) {
	payload, err := json.Marshal(value)
	if err != nil {
		return nil, err
	}
	var cloned map[string]any
	if err := json.Unmarshal(payload, &cloned); err != nil {
		return nil, err
	}
	return cloned, nil
}

func resolveBaselineFingerprint(baselineRepo string, baselineRef string) (string, error) {
	fingerprint, err := runGitStrict(baselineRepo, []string{"rev-parse", "HEAD"})
	if err == nil && strings.TrimSpace(fingerprint) != "" {
		return strings.TrimSpace(fingerprint), nil
	}
	payload, marshalErr := json.Marshal(map[string]any{
		"baselineRepo": baselineRepo,
		"baselineRef":  baselineRef,
	})
	if marshalErr != nil {
		return "", marshalErr
	}
	sum := sha256.Sum256(payload)
	return hex.EncodeToString(sum[:]), nil
}

func baselineRepoLabel(baselineRef string, baselineFingerprint string) string {
	return fmt.Sprintf("%s@%s", baselineRef, baselineFingerprint[:min(len(baselineFingerprint), 12)])
}

func ternaryString(condition bool, yes string, no string) string {
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
