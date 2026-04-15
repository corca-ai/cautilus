package app

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/corca-ai/cautilus/internal/cli"
	"github.com/corca-ai/cautilus/internal/contracts"
	"github.com/corca-ai/cautilus/internal/runtime"
)

type handlerFunc func(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int

func Run(args []string, stdout io.Writer, stderr io.Writer) int {
	var err error

	if len(args) == 0 || args[0] == "-h" || args[0] == "--help" {
		usage, err := cli.RenderUsage()
		if err != nil {
			_, _ = fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		_, _ = fmt.Fprintf(stdout, "%s\n", usage)
		return 0
	}

	cwd, err := resolveCallerCWD()
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}

	if args[0] == "--version" || args[0] == "-v" {
		args = append([]string{"version"}, args[1:]...)
	}

	toolRoot := optionalToolRoot(cwd)
	match, err := cli.MatchCommand(args)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if match == nil {
		if topicArgs, ok := helpTopicArgs(args); ok {
			usage, helpErr := cli.RenderTopicUsage(topicArgs)
			if helpErr != nil {
				_, _ = fmt.Fprintf(stderr, "%s\n", helpErr)
				return 1
			}
			_, _ = fmt.Fprintf(stdout, "%s\n", usage)
			return 0
		}
		usage, usageErr := cli.RenderUsage()
		if usageErr != nil {
			_, _ = fmt.Fprintf(stderr, "%s\n", usageErr)
			return 1
		}
		_, _ = fmt.Fprintf(stderr, "%s\n", usage)
		return 1
	}

	if helpRequested(match.ForwardedArgs) {
		usage, helpErr := cli.RenderTopicUsage(match.Command.Path)
		if helpErr != nil {
			_, _ = fmt.Fprintf(stderr, "%s\n", helpErr)
			return 1
		}
		_, _ = fmt.Fprintf(stdout, "%s\n", usage)
		return 0
	}

	if handler := nativeHandler(match.Command.Path); handler != nil {
		if shouldPrimeVersionState(match.Command.Path) {
			_, _ = cli.InspectVersionState(toolRoot, cli.VersionStateOptions{Now: time.Now()})
		}
		exitCode := invokeHandler(handler, toolRoot, cwd, match.ForwardedArgs, stdout, stderr)
		if shouldCheckForUpdates(match.Command.Path) {
			notice, noticeErr := cli.MaybeCheckForUpdates(toolRoot, cli.AutoUpdateOptions{
				Now:         time.Now(),
				Interactive: detectInteractiveSession(stdout, stderr),
			})
			if noticeErr == nil && notice != "" {
				_, _ = fmt.Fprintf(stderr, "%s\n", notice)
			}
		}
		return exitCode
	}
	_, _ = fmt.Fprintf(stderr, "command is listed in the registry but has no Go handler: %s\n", strings.Join(match.Command.Path, " "))
	return 1
}

//nolint:errcheck // CLI panic recovery writes are best-effort.
func invokeHandler(handler handlerFunc, repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) (exitCode int) {
	defer func() {
		if recovered := recover(); recovered != nil {
			_, _ = fmt.Fprintf(stderr, "%v\n", recovered)
			exitCode = 1
		}
	}()
	return handler(repoRoot, cwd, args, stdout, stderr)
}

func shouldPrimeVersionState(path []string) bool {
	return strings.Join(path, " ") != "version"
}

func shouldCheckForUpdates(path []string) bool {
	switch strings.Join(path, " ") {
	case "version", "commands", "healthcheck":
		return false
	default:
		return true
	}
}

func helpRequested(args []string) bool {
	for _, arg := range args {
		if arg == "-h" || arg == "--help" {
			return true
		}
	}
	return false
}

func helpTopicArgs(args []string) ([]string, bool) {
	if len(args) == 0 || !helpRequested(args) {
		return nil, false
	}
	topic := []string{}
	for _, arg := range args {
		if arg == "-h" || arg == "--help" {
			continue
		}
		topic = append(topic, arg)
	}
	return topic, true
}

func nativeHandler(path []string) handlerFunc {
	switch strings.Join(path, " ") {
	case "commands":
		return handleCommands
	case "scenarios":
		return handleScenarios
	case "healthcheck":
		return handleHealthcheck
	case "adapter resolve":
		return handleAdapterResolve
	case "adapter init":
		return handleAdapterInit
	case "version":
		return handleVersion
	case "doctor":
		return handleDoctor
	case "install":
		return handleInstall
	case "update":
		return handleUpdate
	case "workspace prepare-compare":
		return handleWorkspacePrepareCompare
	case "workspace prune-artifacts":
		return handleWorkspacePruneArtifacts
	case "workspace start":
		return handleWorkspaceStart
	case "self-dogfood render-html":
		return handleSelfDogfoodRenderHTML
	case "self-dogfood render-experiments-html":
		return handleSelfDogfoodRenderExperimentsHTML
	case "skill test":
		return handleSkillTest
	case "scenario normalize chatbot":
		return handleScenarioNormalizeChatbot
	case "scenario normalize skill":
		return handleScenarioNormalizeSkill
	case "scenario normalize workflow":
		return handleScenarioNormalizeWorkflow
	case "skill evaluate":
		return handleSkillEvaluate
	case "scenario summarize-telemetry":
		return handleScenarioSummarizeTelemetry
	case "scenario prepare-input":
		return handleScenarioPrepareInput
	case "scenario propose":
		return handleScenarioPropose
	case "report build":
		return handleReportBuild
	case "report render-html":
		return handleReportRenderHTML
	case "mode evaluate":
		return handleModeEvaluate
	case "skills install":
		return handleSkillsInstall
	case "review prepare-input":
		return handleReviewPrepareInput
	case "review build-prompt-input":
		return handleReviewBuildPromptInput
	case "review render-prompt":
		return handleReviewRenderPrompt
	case "review variants":
		return handleReviewVariants
	case "review render-html":
		return handleReviewRenderHTML
	case "review render-variants-summary-html":
		return handleReviewRenderVariantsSummaryHTML
	case "workspace render-compare-html":
		return handleWorkspaceRenderCompareHTML
	case "scenario render-proposals-html":
		return handleScenarioRenderProposalsHTML
	case "evidence render-html":
		return handleEvidenceRenderHTML
	case "artifacts render-index-html":
		return handleArtifactsRenderIndexHTML
	case "evidence prepare-input":
		return handleEvidencePrepareInput
	case "evidence bundle":
		return handleEvidenceBundle
	case "optimize prepare-input":
		return handleOptimizePrepareInput
	case "optimize search prepare-input":
		return handleOptimizeSearchPrepareInput
	case "optimize search run":
		return handleOptimizeSearchRun
	case "optimize propose":
		return handleOptimizePropose
	case "optimize build-artifact":
		return handleOptimizeBuildArtifact
	default:
		return nil
	}
}

func resolveCallerCWD() (string, error) {
	cwd := strings.TrimSpace(os.Getenv("CAUTILUS_CALLER_CWD"))
	if cwd == "" {
		return os.Getwd()
	}
	return filepath.Clean(cwd), nil
}

func optionalToolRoot(cwd string) string {
	toolRoot := strings.TrimSpace(os.Getenv("CAUTILUS_TOOL_ROOT"))
	if toolRoot != "" {
		return filepath.Clean(toolRoot)
	}
	toolRoot, err := cli.FindRepoRoot(cwd)
	if err != nil {
		return ""
	}
	return toolRoot
}

func detectInteractiveSession(stdout io.Writer, stderr io.Writer) bool {
	return isInteractiveWriter(stdout) && isInteractiveWriter(stderr)
}

func isInteractiveWriter(writer io.Writer) bool {
	file, ok := writer.(*os.File)
	if !ok {
		return false
	}
	info, err := file.Stat()
	if err != nil {
		return false
	}
	return (info.Mode() & os.ModeCharDevice) != 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
type adapterArgs struct {
	repoRoot    *string
	adapter     *string
	adapterName *string
}

type initArgs struct {
	repoRoot    *string
	adapterName *string
	repoName    *string
	output      *string
	scenario    string
	force       bool
}

type versionArgs struct {
	verbose bool
	check   bool
}

type commandsArgs struct {
	json bool
}

type scenariosArgs struct {
	json bool
}

type healthcheckArgs struct {
	json bool
}

type installArgs struct {
	repoRoot  *string
	overwrite bool
	json      bool
}

type doctorArgs struct {
	repoRoot    *string
	adapter     *string
	adapterName *string
	scope       string
}

type updateArgs struct {
	repoRoot *string
	json     bool
}

type workspaceStartArgs struct {
	root  *string
	label *string
	json  bool
}

type inputOutputArgs struct {
	input  string
	output *string
}

type optimizeProposeArgs struct {
	input      string
	fromSearch *string
	output     *string
}

type scenarioSummarizeTelemetryArgs struct {
	results *string
	history *string
	output  *string
}

type scenarioPrepareInputArgs struct {
	candidates string
	registry   string
	coverage   string
	families   []string
	windowDays int
	now        *time.Time
	output     *string
}

type reviewPrepareArgs struct {
	repoRoot    string
	reportFile  string
	adapter     *string
	adapterName *string
	output      *string
}

type reviewBuildPromptArgs struct {
	repoRoot        string
	adapter         *string
	adapterName     *string
	reviewPacket    *string
	scenarioFile    *string
	scenarioID      *string
	output          *string
	outputUnderTest *string
	outputTextKey   *string
}

type evidencePrepareArgs struct {
	repoRoot            string
	reportFile          *string
	scenarioResultsFile *string
	scenarioMode        *string
	runAuditFile        *string
	historyFile         *string
	output              *string
}

type optimizePrepareArgs struct {
	repoRoot      string
	reportFile    string
	reviewSummary *string
	historyFile   *string
	target        string
	targetFile    *string
	optimizer     string
	budget        string
	output        *string
}

type optimizeSearchPrepareArgs struct {
	optimizeInputFile      string
	inputJSON              map[string]any
	targetFile             *string
	heldOutResultsFile     *string
	adapter                *string
	adapterName            *string
	intent                 *string
	baselineRef            *string
	profile                *string
	split                  *string
	budget                 string
	reviewCheckpointPolicy *string
	threeParentPolicy      *string
	output                 *string
	json                   bool
}

type optimizeSearchRunArgs struct {
	input  string
	output *string
	json   bool
}

type optimizeBuildArtifactArgs struct {
	proposalFile string
	inputFile    *string
	output       *string
}

type selfDogfoodRenderArgs struct {
	latestDir string
	output    *string
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleAdapterResolve(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseAdapterArgs(args)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	payload, err := runtime.LoadAdapter(resolveRepoRoot(cwd, options.repoRoot), options.adapter, options.adapterName)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeJSON(stdout, payload); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

func handleVersion(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseVersionArgs(args)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	state, err := cli.InspectVersionState(repoRoot, cli.VersionStateOptions{
		Now:              time.Now(),
		AllowRemoteCheck: false,
		ForceRemoteCheck: options.check,
	})
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if !options.verbose {
		_, _ = fmt.Fprintf(stdout, "%s\n", state.Current.Version)
		return 0
	}
	if err := writeJSON(stdout, state); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

func handleCommands(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseCommandsArgs(args)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	registry, err := cli.LoadRegistry()
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if options.json {
		payload := map[string]any{
			"schemaVersion": "cautilus.commands.v1",
			"usage":         registry.UsageLines(),
			"examples":      registry.ExampleLines(),
			"groups":        registry.Groups,
			"commands":      registry.Commands,
		}
		if err := writeJSON(stdout, payload); err != nil {
			_, _ = fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		return 0
	}
	usage, err := cli.RenderUsage()
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	_, _ = fmt.Fprintf(stdout, "%s\n", usage)
	return 0
}

//nolint:errcheck // CLI stdout/stderr reporting is best-effort.
func handleScenarios(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseScenariosArgs(args)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	catalog := runtime.LoadScenarioCatalog()
	if options.json {
		if err := writeJSON(stdout, catalog); err != nil {
			_, _ = fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		return 0
	}
	lines := []string{"Cautilus evaluation archetypes (1:1 to archetype-boundary.spec.md):", ""}
	for _, entry := range catalog.Archetypes {
		lines = append(lines,
			fmt.Sprintf("  %s", entry.Archetype),
			fmt.Sprintf("    %s", entry.Summary),
			fmt.Sprintf("    behavior focus: %s", entry.BehaviorFocus),
			fmt.Sprintf("    example input:  %s", entry.ExampleInput),
			fmt.Sprintf("    next-step CLI:  %s", entry.NextStepCLI),
			"",
		)
	}
	lines = append(lines,
		"Every normalize command also accepts --example-input, which prints a",
		"minimal valid packet you can pipe back into the same command:",
		"  cautilus scenario normalize chatbot --example-input | \\",
		"    cautilus scenario normalize chatbot --input /dev/stdin",
		"",
		"Pass --json for the machine-readable catalog (schema: "+runtime.ScenarioCatalogSchema+").",
	)
	_, _ = fmt.Fprintln(stdout, strings.Join(lines, "\n"))
	return 0
}

func handleHealthcheck(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseHealthcheckArgs(args)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	state, err := cli.InspectVersionState(repoRoot, cli.VersionStateOptions{
		Now:              time.Now(),
		AllowRemoteCheck: false,
	})
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	registry, err := cli.LoadRegistry()
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	payload := map[string]any{
		"schemaVersion": "cautilus.healthcheck.v1",
		"status":        "healthy",
		"healthy":       true,
		"checks": []any{
			map[string]any{"id": "version_state", "ok": true, "detail": fmt.Sprintf("Resolved Cautilus v%s.", state.Current.Version)},
			map[string]any{"id": "command_registry", "ok": true, "detail": fmt.Sprintf("Loaded %d registered commands.", len(registry.Commands))},
		},
		"current": state.Current,
	}
	if options.json {
		if err := writeJSON(stdout, payload); err != nil {
			_, _ = fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		return 0
	}
	_, _ = fmt.Fprintf(stdout, "healthy\n")
	return 0
}

//nolint:errcheck // CLI stderr/stdout reporting is best-effort.
func handleAdapterInit(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseInitArgs(args)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	resolvedRoot := resolveRepoRoot(cwd, options.repoRoot)
	outputPath := defaultAdapterOutputPath(resolvedRoot, options.output, options.adapterName)
	if pathExists(outputPath) && !options.force {
		_, _ = fmt.Fprintf(stderr, "Adapter already exists at %s. Use --force to overwrite.\n", outputPath)
		return 1
	}
	if err := os.MkdirAll(filepath.Dir(outputPath), 0o755); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	repoName := filepath.Base(resolvedRoot)
	if options.repoName != nil && strings.TrimSpace(*options.repoName) != "" {
		repoName = strings.TrimSpace(*options.repoName)
	}
	document, err := runtime.DumpYAMLDocument(runtime.ScaffoldAdapter(resolvedRoot, repoName, options.scenario))
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if !strings.HasSuffix(document, "\n") {
		document += "\n"
	}
	if err := os.WriteFile(outputPath, []byte(document), 0o644); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	_, _ = fmt.Fprintf(stdout, "%s\n", outputPath)
	return 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleDoctor(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseDoctorArgs(args)
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	resolvedRepoRoot := resolveRepoRoot(cwd, options.repoRoot)
	var result map[string]any
	var exitCode int
	switch options.scope {
	case "repo":
		result, exitCode, err = runtime.DoctorRepo(resolvedRepoRoot, options.adapter, options.adapterName)
	case "agent-surface":
		result, exitCode, err = runtime.DoctorAgentSurface(resolvedRepoRoot)
	default:
		err = fmt.Errorf("unsupported doctor scope: %s", options.scope)
	}
	if err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeJSON(stdout, result); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return exitCode
}

//nolint:errcheck // CLI stdout/stderr reporting is best-effort.
func handleWorkspaceStart(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseWorkspaceStartArgs(args)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	run, err := runtime.StartWorkspaceRun(options.root, options.label, time.Now(), cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if options.json {
		if err := writeJSON(stdout, run); err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		return 0
	}
	_, _ = fmt.Fprint(stdout, runtime.RenderShellExport(run.RunDir))
	return 0
}

func handleScenarioNormalizeChatbot(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	return handleScenarioNormalize(args, cwd, stdout, stderr, "chatbot")
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleSelfDogfoodRenderHTML(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseSelfDogfoodRenderArgs(args, cwd, filepath.Join("artifacts", "self-dogfood", "latest"))
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	outputPath, err := runtime.WriteSelfDogfoodHTML(options.latestDir, options.output)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	fmt.Fprintf(stdout, "%s\n", outputPath)
	return 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleSelfDogfoodRenderExperimentsHTML(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseSelfDogfoodRenderArgs(args, cwd, filepath.Join("artifacts", "self-dogfood", "experiments", "latest"))
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	outputPath, err := runtime.WriteSelfDogfoodExperimentsHTML(options.latestDir, options.output)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	fmt.Fprintf(stdout, "%s\n", outputPath)
	return 0
}

func handleScenarioNormalizeSkill(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	return handleScenarioNormalize(args, cwd, stdout, stderr, "skill")
}

func handleScenarioNormalizeWorkflow(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	return handleScenarioNormalize(args, cwd, stdout, stderr, "workflow")
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleSkillEvaluate(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	if hasExampleInputFlag(args) {
		fmt.Fprint(stdout, skillEvaluateExampleInput)
		return 0
	}
	options, err := parseInputOutputArgs(args)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	input, err := readJSONObject(resolvePath(cwd, options.input))
	if err != nil {
		fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", options.input, err)
		return 1
	}
	summary, err := runtime.BuildSkillEvaluationSummary(input, time.Now())
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeOutput(stdout, cwd, options.output, summary); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleScenarioNormalize(args []string, cwd string, stdout io.Writer, stderr io.Writer, kind string) int {
	if hasExampleInputFlag(args) {
		switch kind {
		case "chatbot":
			fmt.Fprint(stdout, chatbotExampleInput)
		case "skill":
			fmt.Fprint(stdout, skillNormalizeExampleInput)
		case "workflow":
			fmt.Fprint(stdout, workflowExampleInput)
		default:
			fmt.Fprintf(stderr, "unknown scenario normalization kind: %s\n", kind)
			return 1
		}
		return 0
	}
	options, err := parseInputOutputArgs(args)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	input, err := readJSONObject(resolvePath(cwd, options.input))
	if err != nil {
		fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", options.input, err)
		return 1
	}

	var candidates []any
	switch kind {
	case "chatbot":
		if input["schemaVersion"] != contracts.ChatbotNormalizationInputsSchema {
			fmt.Fprintf(stderr, "schemaVersion must be %s\n", contracts.ChatbotNormalizationInputsSchema)
			return 1
		}
		candidates, err = runtime.NormalizeChatbotProposalCandidates(arrayOrEmpty(input["conversationSummaries"]), arrayOrEmpty(input["runSummaries"]))
	case "skill":
		if input["schemaVersion"] == contracts.WorkflowNormalizationInputsSchema {
			fmt.Fprintf(stderr, "Input uses %s; use `cautilus scenario normalize workflow` instead.\n", contracts.WorkflowNormalizationInputsSchema)
			return 1
		}
		switch input["schemaVersion"] {
		case contracts.SkillNormalizationInputsSchema, contracts.SkillEvaluationSummarySchema:
			candidates, err = runtime.NormalizeSkillProposalCandidates(arrayOrEmpty(input["evaluationRuns"]))
		default:
			fmt.Fprintf(stderr, "schemaVersion must be %s or %s\n", contracts.SkillNormalizationInputsSchema, contracts.SkillEvaluationSummarySchema)
			return 1
		}
	case "workflow":
		if input["schemaVersion"] != contracts.WorkflowNormalizationInputsSchema {
			fmt.Fprintf(stderr, "schemaVersion must be %s\n", contracts.WorkflowNormalizationInputsSchema)
			return 1
		}
		candidates, err = runtime.NormalizeWorkflowProposalCandidates(arrayOrEmpty(input["evaluationRuns"]))
	default:
		err = fmt.Errorf("unknown scenario normalization kind: %s", kind)
	}
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeOutput(stdout, cwd, options.output, candidates); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleScenarioSummarizeTelemetry(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseScenarioSummarizeTelemetryArgs(args)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	var payload map[string]any
	if options.results != nil {
		results, err := readJSONObject(resolvePath(cwd, *options.results))
		if err != nil {
			fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", *options.results, err)
			return 1
		}
		normalized, err := runtime.NormalizeScenarioResultsPacket(results, "results")
		if err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		payload, err = runtime.SummarizeScenarioTelemetryEntries(arrayOrEmpty(normalized["results"]), time.Now(), "scenario_results")
		if err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
	} else {
		history, err := readJSONObject(resolvePath(cwd, *options.history))
		if err != nil {
			fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", *options.history, err)
			return 1
		}
		if history["schemaVersion"] != contracts.ScenarioHistorySchema {
			fmt.Fprintf(stderr, "history input must use schemaVersion %s\n", contracts.ScenarioHistorySchema)
			return 1
		}
		payload, err = runtime.SummarizeScenarioTelemetryFromHistory(history, time.Now())
		if err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
	}
	if err := writeOutput(stdout, cwd, options.output, payload); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleScenarioPrepareInput(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseScenarioPrepareInputArgs(args)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	candidates, err := readJSONArray(resolvePath(cwd, options.candidates), "proposalCandidates")
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	registry, err := readJSONArray(resolvePath(cwd, options.registry), "existingScenarioRegistry")
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	coverage, err := readJSONArray(resolvePath(cwd, options.coverage), "scenarioCoverage")
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	packet, err := runtime.BuildScenarioProposalInput(candidates, registry, coverage, options.families, options.windowDays, options.now)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeOutput(stdout, cwd, options.output, packet); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleScenarioPropose(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseInputOutputArgs(args)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	input, err := readJSONObject(resolvePath(cwd, options.input))
	if err != nil {
		fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", options.input, err)
		return 1
	}
	packet, err := runtime.BuildScenarioProposalPacket(input)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeOutput(stdout, cwd, options.output, packet); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
//nolint:errcheck // CLI stderr reporting is best-effort.
func handleReportRenderHTML(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	return renderJSONToHTMLCommand(args, cwd, stdout, stderr, runtime.WriteReportHTMLFromFile)
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleReviewRenderHTML(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	return renderJSONToHTMLCommand(args, cwd, stdout, stderr, runtime.WriteReviewPacketHTMLFromFile)
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleReviewRenderVariantsSummaryHTML(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	return renderJSONToHTMLCommand(args, cwd, stdout, stderr, runtime.WriteReviewSummaryHTMLFromFile)
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleWorkspaceRenderCompareHTML(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	return renderJSONToHTMLCommand(args, cwd, stdout, stderr, runtime.WriteCompareArtifactHTMLFromFile)
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleScenarioRenderProposalsHTML(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	return renderJSONToHTMLCommand(args, cwd, stdout, stderr, runtime.WriteScenarioProposalsHTMLFromFile)
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleEvidenceRenderHTML(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	return renderJSONToHTMLCommand(args, cwd, stdout, stderr, runtime.WriteEvidenceBundleHTMLFromFile)
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleArtifactsRenderIndexHTML(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseArtifactsRenderIndexArgs(args, cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	target, err := runtime.WriteRunIndexHTMLForDir(options.runDir, options.output)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	fmt.Fprintf(stdout, "%s\n", target)
	return 0
}

type artifactsRenderIndexArgs struct {
	runDir string
	output *string
}

func parseArtifactsRenderIndexArgs(args []string, cwd string) (*artifactsRenderIndexArgs, error) {
	options := &artifactsRenderIndexArgs{}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--run-dir":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.runDir = resolvePath(cwd, value)
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
	if strings.TrimSpace(options.runDir) == "" {
		return nil, fmt.Errorf("--run-dir is required")
	}
	return options, nil
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func renderJSONToHTMLCommand(args []string, cwd string, stdout io.Writer, stderr io.Writer, writer func(string, *string) (string, error)) int {
	options, err := parseInputOutputArgs(args)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	inputPath := resolvePath(cwd, options.input)
	var outputPath *string
	if options.output != nil {
		resolved := resolvePath(cwd, *options.output)
		outputPath = &resolved
	}
	target, err := writer(inputPath, outputPath)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	fmt.Fprintf(stdout, "%s\n", target)
	return 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleReportBuild(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseInputOutputOrActiveRunArgs(args, cwd, "report-input.json", "report.json")
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	input, err := readJSONObject(options.input)
	if err != nil {
		fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", options.input, err)
		return 1
	}
	packet, err := runtime.BuildReportPacket(input, time.Now())
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeOutputResolved(stdout, options.output, packet); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleReviewPrepareInput(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseReviewPrepareArgs(args, cwd)
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
	report, err := readJSONObject(options.reportFile)
	if err != nil {
		fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", options.reportFile, err)
		return 1
	}
	if err := runtime.ValidateReportPacket(report, options.reportFile); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	packet, err := runtime.BuildReviewPacket(options.repoRoot, anyString(adapterPayload.Path), adapterPayload.Data, options.reportFile, report, time.Now())
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeOutputResolved(stdout, options.output, packet); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleReviewBuildPromptInput(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseReviewBuildPromptArgs(args, cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	adapterPath := ""
	adapterData := map[string]any{}
	if options.scenarioFile != nil && (options.adapter != nil || options.adapterName != nil) {
		adapterPayload, loadErr := runtime.LoadAdapter(options.repoRoot, options.adapter, options.adapterName)
		if loadErr != nil {
			fmt.Fprintf(stderr, "%s\n", loadErr)
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
		adapterPath = anyString(adapterPayload.Path)
		adapterData = adapterPayload.Data
	}
	var promptInput map[string]any
	if options.scenarioFile != nil {
		scenarioInput, readErr := readJSONObject(*options.scenarioFile)
		if readErr != nil {
			fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", *options.scenarioFile, readErr)
			return 1
		}
		promptInput, err = runtime.BuildReviewPromptInputFromScenario(options.repoRoot, adapterPath, adapterData, scenarioInput, *options.scenarioFile, options.scenarioID, *options.outputUnderTest, options.outputTextKey, time.Now())
	} else {
		packet, readErr := readJSONObject(*options.reviewPacket)
		if readErr != nil {
			fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", *options.reviewPacket, readErr)
			return 1
		}
		if packet["schemaVersion"] != contracts.ReviewPacketSchema {
			fmt.Fprintf(stderr, "review packet must use schemaVersion %s\n", contracts.ReviewPacketSchema)
			return 1
		}
		promptInput, err = runtime.BuildReviewPromptInput(packet, *options.reviewPacket, options.outputUnderTest, options.outputTextKey, time.Now())
	}
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeOutput(stdout, cwd, options.output, promptInput); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

//nolint:errcheck // CLI stdout/stderr reporting is best-effort.
func handleReviewRenderPrompt(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseInputOutputArgs(args)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	input, err := readJSONObject(resolvePath(cwd, options.input))
	if err != nil {
		fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", options.input, err)
		return 1
	}
	prompt, err := runtime.RenderReviewPrompt(input)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if options.output != nil {
		outputPath := resolvePath(cwd, *options.output)
		if err := os.WriteFile(outputPath, []byte(prompt), 0o644); err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
		return 0
	}
	_, _ = fmt.Fprint(stdout, prompt)
	return 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleEvidencePrepareInput(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseEvidencePrepareArgs(args, cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	activeRunDir, err := readActiveRunDir()
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	packet, err := runtime.BuildEvidenceInput(options.repoRoot, options.reportFile, options.scenarioResultsFile, options.scenarioMode, options.runAuditFile, options.historyFile, activeRunDir, time.Now())
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeOutputResolved(stdout, options.output, packet); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleEvidenceBundle(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseInputOutputOrActiveRunArgs(args, cwd, "evidence-input.json", "evidence-bundle.json")
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	input, err := readJSONObject(options.input)
	if err != nil {
		fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", options.input, err)
		return 1
	}
	if input["schemaVersion"] != contracts.EvidenceBundleInputsSchema {
		fmt.Fprintf(stderr, "evidence input must use schemaVersion %s\n", contracts.EvidenceBundleInputsSchema)
		return 1
	}
	bundle := runtime.BuildEvidenceBundle(input, &options.input, time.Now())
	if err := writeOutputResolved(stdout, options.output, bundle); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleOptimizePrepareInput(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseOptimizePrepareArgs(args, cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	activeRunDir, err := readActiveRunDir()
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	packet, err := runtime.BuildOptimizeInput(options.repoRoot, options.reportFile, options.reviewSummary, options.historyFile, options.target, options.targetFile, options.optimizer, options.budget, activeRunDir, time.Now())
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeOutputResolved(stdout, options.output, packet); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleOptimizePropose(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseOptimizeProposeArgs(args, cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	var packet map[string]any
	if options.fromSearch != nil {
		searchResult, err := readJSONObject(*options.fromSearch)
		if err != nil {
			fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", *options.fromSearch, err)
			return 1
		}
		if searchResult["schemaVersion"] != contracts.OptimizeSearchResultSchema {
			fmt.Fprintf(stderr, "search result must use schemaVersion %s\n", contracts.OptimizeSearchResultSchema)
			return 1
		}
		if anyString(searchResult["status"]) != "completed" {
			fmt.Fprintf(stderr, "search result must be completed before generating a proposal from it\n")
			return 1
		}
		optimizeInputFile := anyString(mapOrEmpty(searchResult["proposalBridge"])["optimizeInputFile"])
		if optimizeInputFile == "" {
			optimizeInputFile = anyString(searchResult["optimizeInputFile"])
		}
		if optimizeInputFile == "" {
			fmt.Fprintf(stderr, "search result must carry proposalBridge.optimizeInputFile\n")
			return 1
		}
		input, err := readJSONObject(optimizeInputFile)
		if err != nil {
			fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", optimizeInputFile, err)
			return 1
		}
		if input["schemaVersion"] != contracts.OptimizeInputsSchema {
			fmt.Fprintf(stderr, "optimize input must use schemaVersion %s\n", contracts.OptimizeInputsSchema)
			return 1
		}
		packet, err = runtime.GenerateOptimizeProposalFromSearch(searchResult, *options.fromSearch, input, optimizeInputFile, time.Now())
		if err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
	} else {
		input, err := readJSONObject(options.input)
		if err != nil {
			fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", options.input, err)
			return 1
		}
		if input["schemaVersion"] != contracts.OptimizeInputsSchema {
			fmt.Fprintf(stderr, "optimize input must use schemaVersion %s\n", contracts.OptimizeInputsSchema)
			return 1
		}
		packet, err = runtime.GenerateOptimizeProposal(input, &options.input, time.Now())
		if err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
	}
	if err := writeOutputResolved(stdout, options.output, packet); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleOptimizeSearchPrepareInput(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseOptimizeSearchPrepareArgs(args, cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}

	rawInput := map[string]any{}
	if len(options.inputJSON) > 0 {
		rawInput = options.inputJSON
	}
	optimizeInputFile, buildOptions, err := resolveOptimizeSearchBuildInputs(options, cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	optimizeInput, err := readJSONObject(optimizeInputFile)
	if err != nil {
		fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", optimizeInputFile, err)
		return 1
	}
	if optimizeInput["schemaVersion"] != contracts.OptimizeInputsSchema {
		fmt.Fprintf(stderr, "optimize input must use schemaVersion %s\n", contracts.OptimizeInputsSchema)
		return 1
	}
	if buildOptions.HeldOutResultsFile != nil {
		heldOutResults, readErr := readJSONObject(*buildOptions.HeldOutResultsFile)
		if readErr != nil {
			fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", *buildOptions.HeldOutResultsFile, readErr)
			return 1
		}
		buildOptions.HeldOutResults = heldOutResults
	}
	packet, err := runtime.BuildOptimizeSearchInput(optimizeInput, optimizeInputFile, buildOptions, time.Now())
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	var rawInputFile *string
	if len(rawInput) > 0 && options.output != nil {
		path := deriveSiblingRawJSONPath(*options.output)
		rawInputFile = &path
		if err := writeOutputResolved(stdout, rawInputFile, rawInput); err != nil {
			fmt.Fprintf(stderr, "%s\n", err)
			return 1
		}
	}
	if options.json {
		if options.output != nil {
			if err := writeOutputResolved(stdout, options.output, packet); err != nil {
				fmt.Fprintf(stderr, "%s\n", err)
				return 1
			}
		}
		return writeOptimizeSearchPrepareReady(stdout, options.output, rawInputFile, stderr)
	}
	if err := writeOutputResolved(stdout, options.output, packet); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleOptimizeSearchRun(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseOptimizeSearchRunArgs(args, cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	packet, err := readJSONObject(options.input)
	if err != nil {
		fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", options.input, err)
		return 1
	}
	if packet["schemaVersion"] != contracts.OptimizeSearchInputsSchema {
		fmt.Fprintf(stderr, "search input must use schemaVersion %s\n", contracts.OptimizeSearchInputsSchema)
		return 1
	}
	result := runtime.RunOptimizeSearch(packet, options.input, time.Now())
	if err := writeOutputResolved(stdout, options.output, result); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if options.output != nil && !options.json {
		if anyString(result["status"]) == "blocked" {
			return 1
		}
		return 0
	}
	if anyString(result["status"]) == "blocked" {
		return 1
	}
	return 0
}

//nolint:errcheck // CLI stderr reporting is best-effort.
func handleOptimizeBuildArtifact(repoRoot string, cwd string, args []string, stdout io.Writer, stderr io.Writer) int {
	options, err := parseOptimizeBuildArtifactArgs(args, cwd)
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	proposal, err := readJSONObject(options.proposalFile)
	if err != nil {
		fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", options.proposalFile, err)
		return 1
	}
	if proposal["schemaVersion"] != contracts.OptimizeProposalSchema {
		fmt.Fprintf(stderr, "optimize proposal must use schemaVersion %s\n", contracts.OptimizeProposalSchema)
		return 1
	}
	inputFile := options.inputFile
	if inputFile == nil {
		if raw, ok := proposal["inputFile"].(string); ok && strings.TrimSpace(raw) != "" {
			resolved := resolvePath(cwd, raw)
			inputFile = &resolved
		}
	}
	if inputFile == nil {
		_, _ = fmt.Fprintln(stderr, "optimize proposal must carry inputFile or use --input-file")
		return 1
	}
	input, err := readJSONObject(*inputFile)
	if err != nil {
		fmt.Fprintf(stderr, "Failed to read JSON from %s: %s\n", *inputFile, err)
		return 1
	}
	if input["schemaVersion"] != contracts.OptimizeInputsSchema {
		fmt.Fprintf(stderr, "optimize input must use schemaVersion %s\n", contracts.OptimizeInputsSchema)
		return 1
	}
	packet, err := runtime.BuildRevisionArtifact(proposal, options.proposalFile, input, *inputFile, time.Now())
	if err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	if err := writeOutputResolved(stdout, options.output, packet); err != nil {
		fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

func parseAdapterArgs(args []string) (*adapterArgs, error) {
	options := &adapterArgs{}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--repo-root":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.repoRoot = &value
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
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	if options.adapter != nil && options.adapterName != nil {
		return nil, fmt.Errorf("use either adapter or adapterName, not both")
	}
	return options, nil
}

func parseDoctorArgs(args []string) (*doctorArgs, error) {
	options := &doctorArgs{
		scope: "repo",
	}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--repo-root":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.repoRoot = &value
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
		case "--scope":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.scope = strings.TrimSpace(value)
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	if options.adapter != nil && options.adapterName != nil {
		return nil, fmt.Errorf("use either adapter or adapterName, not both")
	}
	if options.scope == "" {
		return nil, fmt.Errorf("--scope requires a value")
	}
	return options, nil
}

func parseInitArgs(args []string) (*initArgs, error) {
	options := &initArgs{}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--force":
			options.force = true
		case "--repo-root":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.repoRoot = &value
		case "--adapter-name":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.adapterName = &value
		case "--repo-name":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.repoName = &value
		case "--output":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.output = &value
		case "--scenario":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			switch value {
			case "chatbot", "skill", "workflow":
				options.scenario = value
			default:
				return nil, fmt.Errorf("unknown --scenario value %q: use chatbot, skill, or workflow", value)
			}
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	return options, nil
}

func parseVersionArgs(args []string) (*versionArgs, error) {
	options := &versionArgs{}
	for index := 0; index < len(args); index++ {
		switch args[index] {
		case "--verbose":
			options.verbose = true
		case "--check":
			options.check = true
			options.verbose = true
		default:
			return nil, fmt.Errorf("unexpected argument %q", args[index])
		}
	}
	return options, nil
}

func parseCommandsArgs(args []string) (*commandsArgs, error) {
	options := &commandsArgs{}
	for index := 0; index < len(args); index++ {
		switch args[index] {
		case "--json":
			options.json = true
		default:
			return nil, fmt.Errorf("unexpected argument %q", args[index])
		}
	}
	return options, nil
}

func parseScenariosArgs(args []string) (*scenariosArgs, error) {
	options := &scenariosArgs{}
	for index := 0; index < len(args); index++ {
		switch args[index] {
		case "--json":
			options.json = true
		default:
			return nil, fmt.Errorf("unexpected argument %q", args[index])
		}
	}
	return options, nil
}

func parseHealthcheckArgs(args []string) (*healthcheckArgs, error) {
	options := &healthcheckArgs{}
	for index := 0; index < len(args); index++ {
		switch args[index] {
		case "--json":
			options.json = true
		default:
			return nil, fmt.Errorf("unexpected argument %q", args[index])
		}
	}
	return options, nil
}

func parseInstallArgs(args []string, cwd string) (*installArgs, error) {
	options := &installArgs{}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--overwrite":
			options.overwrite = true
		case "--json":
			options.json = true
		case "--repo-root":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.repoRoot = &resolved
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	return options, nil
}

func parseUpdateArgs(args []string, cwd string) (*updateArgs, error) {
	options := &updateArgs{}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--json":
			options.json = true
		case "--repo-root":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.repoRoot = &resolved
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	return options, nil
}

func parseWorkspaceStartArgs(args []string) (*workspaceStartArgs, error) {
	options := &workspaceStartArgs{}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--json":
			options.json = true
		case "--root":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.root = &value
		case "--label":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.label = &value
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	return options, nil
}

func parseInputOutputArgs(args []string) (*inputOutputArgs, error) {
	options := &inputOutputArgs{}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--input":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.input = value
		case "--output":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.output = &value
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	if strings.TrimSpace(options.input) == "" {
		return nil, fmt.Errorf("--input is required")
	}
	return options, nil
}

func parseInputOutputOrActiveRunArgs(args []string, cwd string, defaultInputName string, defaultOutputName string) (*inputOutputArgs, error) {
	options := &inputOutputArgs{}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--input":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.input = resolvePath(cwd, value)
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
	activeRunDir, err := readActiveRunDir()
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(options.input) == "" && activeRunDir != nil {
		options.input = filepath.Join(*activeRunDir, defaultInputName)
	}
	if strings.TrimSpace(options.input) == "" {
		return nil, fmt.Errorf("--input is required")
	}
	if options.output == nil && activeRunDir != nil {
		value := filepath.Join(*activeRunDir, defaultOutputName)
		options.output = &value
	}
	return options, nil
}

func parseScenarioSummarizeTelemetryArgs(args []string) (*scenarioSummarizeTelemetryArgs, error) {
	options := &scenarioSummarizeTelemetryArgs{}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--results":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.results = &value
		case "--history":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.history = &value
		case "--output":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.output = &value
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	if (options.results == nil && options.history == nil) || (options.results != nil && options.history != nil) {
		return nil, fmt.Errorf("use exactly one of --results or --history")
	}
	return options, nil
}

func parseScenarioPrepareInputArgs(args []string) (*scenarioPrepareInputArgs, error) {
	options := &scenarioPrepareInputArgs{
		families:   []string{},
		windowDays: 14,
	}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--candidates":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.candidates = value
		case "--registry":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.registry = value
		case "--coverage":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.coverage = value
		case "--family":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.families = append(options.families, value)
		case "--window-days":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			parsed, parseErr := strconv.Atoi(value)
			if parseErr != nil || parsed <= 0 {
				return nil, fmt.Errorf("--window-days must be a positive integer")
			}
			options.windowDays = parsed
		case "--now":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			parsed, parseErr := time.Parse(time.RFC3339Nano, value)
			if parseErr != nil {
				return nil, fmt.Errorf("--now must be a valid ISO timestamp")
			}
			options.now = &parsed
		case "--output":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.output = &value
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	for _, required := range []struct {
		name  string
		value string
	}{
		{"--candidates", options.candidates},
		{"--registry", options.registry},
		{"--coverage", options.coverage},
	} {
		if strings.TrimSpace(required.value) == "" {
			return nil, fmt.Errorf("%s is required", required.name)
		}
	}
	return options, nil
}

func parseReviewPrepareArgs(args []string, cwd string) (*reviewPrepareArgs, error) {
	options := &reviewPrepareArgs{repoRoot: cwd}
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
		case "--report-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.reportFile = resolvePath(cwd, value)
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
	activeRunDir, err := readActiveRunDir()
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(options.reportFile) == "" && activeRunDir != nil {
		options.reportFile = filepath.Join(*activeRunDir, "report.json")
	}
	if strings.TrimSpace(options.reportFile) == "" {
		return nil, fmt.Errorf("--report-file is required")
	}
	if options.output == nil && activeRunDir != nil {
		value := filepath.Join(*activeRunDir, "review-packet.json")
		options.output = &value
	}
	if options.adapter != nil && options.adapterName != nil {
		return nil, fmt.Errorf("use either --adapter or --adapter-name, not both")
	}
	return options, nil
}

func parseReviewBuildPromptArgs(args []string, cwd string) (*reviewBuildPromptArgs, error) {
	options := &reviewBuildPromptArgs{repoRoot: cwd}
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
		case "--review-packet":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.reviewPacket = &resolved
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
		case "--output":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.output = &value
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
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	if options.adapter != nil && options.adapterName != nil {
		return nil, fmt.Errorf("use either --adapter or --adapter-name, not both")
	}
	if options.reviewPacket != nil && options.scenarioFile != nil {
		return nil, fmt.Errorf("use either --review-packet or --scenario-file, not both")
	}
	if options.outputTextKey != nil && options.outputUnderTest == nil {
		return nil, fmt.Errorf("--output-text-key requires --output-under-test")
	}
	if options.reviewPacket == nil && options.scenarioFile == nil {
		return nil, fmt.Errorf("provide --review-packet or --scenario-file")
	}
	if options.scenarioFile != nil && options.outputUnderTest == nil {
		return nil, fmt.Errorf("--scenario-file requires --output-under-test")
	}
	return options, nil
}

func parseEvidencePrepareArgs(args []string, cwd string) (*evidencePrepareArgs, error) {
	options := &evidencePrepareArgs{repoRoot: cwd}
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
		case "--report-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.reportFile = &resolved
		case "--scenario-results-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.scenarioResultsFile = &resolved
		case "--scenario-mode":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			if _, ok := map[string]struct{}{"iterate": {}, "held_out": {}, "comparison": {}, "full_gate": {}}[value]; !ok {
				return nil, fmt.Errorf("--scenario-mode must be one of: iterate, held_out, comparison, full_gate")
			}
			options.scenarioMode = &value
		case "--run-audit-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.runAuditFile = &resolved
		case "--history-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.historyFile = &resolved
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
	activeRunDir, err := readActiveRunDir()
	if err != nil {
		return nil, err
	}
	if options.output == nil && activeRunDir != nil {
		value := filepath.Join(*activeRunDir, "evidence-input.json")
		options.output = &value
	}
	if options.reportFile == nil && options.scenarioResultsFile == nil && options.runAuditFile == nil && options.historyFile == nil && activeRunDir == nil {
		return nil, fmt.Errorf("at least one evidence source must be provided")
	}
	return options, nil
}

func parseOptimizePrepareArgs(args []string, cwd string) (*optimizePrepareArgs, error) {
	options := &optimizePrepareArgs{
		repoRoot:  cwd,
		target:    "prompt",
		optimizer: "repair",
		budget:    "medium",
	}
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
		case "--report-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.reportFile = resolvePath(cwd, value)
		case "--review-summary":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.reviewSummary = &resolved
		case "--history-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.historyFile = &resolved
		case "--target":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			if value != "prompt" && value != "adapter" {
				return nil, fmt.Errorf("--target must be prompt or adapter")
			}
			options.target = value
		case "--target-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.targetFile = &resolved
		case "--optimizer":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			if _, ok := map[string]struct{}{"repair": {}, "reflection": {}, "history_followup": {}}[value]; !ok {
				return nil, fmt.Errorf("--optimizer must be one of: repair, reflection, history_followup")
			}
			options.optimizer = value
		case "--budget":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			if _, ok := map[string]struct{}{"light": {}, "medium": {}, "heavy": {}}[value]; !ok {
				return nil, fmt.Errorf("--budget must be one of: light, medium, heavy")
			}
			options.budget = value
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
	activeRunDir, err := readActiveRunDir()
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(options.reportFile) == "" && activeRunDir != nil {
		options.reportFile = filepath.Join(*activeRunDir, "report.json")
	}
	if strings.TrimSpace(options.reportFile) == "" {
		return nil, fmt.Errorf("--report-file is required")
	}
	if options.output == nil && activeRunDir != nil {
		value := filepath.Join(*activeRunDir, "optimize-input.json")
		options.output = &value
	}
	return options, nil
}

func parseSelfDogfoodRenderArgs(args []string, cwd string, defaultLatestDir string) (*selfDogfoodRenderArgs, error) {
	options := &selfDogfoodRenderArgs{
		latestDir: resolvePath(cwd, defaultLatestDir),
	}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--latest-dir":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.latestDir = resolvePath(cwd, value)
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
	return options, nil
}

func parseOptimizeSearchPrepareArgs(args []string, cwd string) (*optimizeSearchPrepareArgs, error) {
	options := &optimizeSearchPrepareArgs{
		budget: "medium",
	}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--optimize-input":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.optimizeInputFile = resolvePath(cwd, value)
		case "--input-json":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			decoder := json.NewDecoder(strings.NewReader(value))
			decoder.UseNumber()
			if err := decoder.Decode(&options.inputJSON); err != nil {
				return nil, fmt.Errorf("failed to parse --input-json: %w", err)
			}
			if len(options.inputJSON) == 0 {
				return nil, fmt.Errorf("--input-json must be a JSON object")
			}
		case "--target-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.targetFile = &resolved
		case "--adapter":
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
		case "--intent":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.intent = &value
		case "--baseline-ref":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.baselineRef = &value
		case "--profile":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.profile = &value
		case "--split":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.split = &value
		case "--held-out-results-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.heldOutResultsFile = &resolved
		case "--budget":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			if _, ok := map[string]struct{}{"light": {}, "medium": {}, "heavy": {}}[value]; !ok {
				return nil, fmt.Errorf("--budget must be one of: light, medium, heavy")
			}
			options.budget = value
		case "--review-checkpoint-policy":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			if _, ok := map[string]struct{}{"final_only": {}, "frontier_promotions": {}}[value]; !ok {
				return nil, fmt.Errorf("--review-checkpoint-policy must be one of: final_only, frontier_promotions")
			}
			options.reviewCheckpointPolicy = &value
		case "--three-parent-policy":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			if _, ok := map[string]struct{}{"disabled": {}, "coverage_expansion": {}}[value]; !ok {
				return nil, fmt.Errorf("--three-parent-policy must be one of: disabled, coverage_expansion")
			}
			options.threeParentPolicy = &value
		case "--output":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.output = &resolved
		case "--json":
			options.json = true
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	if strings.TrimSpace(options.optimizeInputFile) != "" && len(options.inputJSON) > 0 {
		return nil, fmt.Errorf("use either --optimize-input or --input-json, not both")
	}
	if strings.TrimSpace(options.optimizeInputFile) == "" && len(options.inputJSON) == 0 {
		return nil, fmt.Errorf("use one of --optimize-input or --input-json")
	}
	if options.adapter != nil && options.adapterName != nil {
		return nil, fmt.Errorf("use either --adapter or --adapter-name, not both")
	}
	activeRunDir, err := readActiveRunDir()
	if err != nil {
		return nil, err
	}
	if options.output == nil && activeRunDir != nil {
		value := filepath.Join(*activeRunDir, "optimize-search-input.json")
		options.output = &value
	}
	if len(options.inputJSON) > 0 && options.output == nil {
		return nil, fmt.Errorf("--input-json requires --output or CAUTILUS_RUN_DIR so the canonical input file can be materialized")
	}
	return options, nil
}

func parseOptimizeSearchRunArgs(args []string, cwd string) (*optimizeSearchRunArgs, error) {
	options := &optimizeSearchRunArgs{}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--input":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.input = resolvePath(cwd, value)
		case "--output":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.output = &resolved
		case "--json":
			options.json = true
		default:
			return nil, fmt.Errorf("unknown argument: %s", arg)
		}
	}
	activeRunDir, err := readActiveRunDir()
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(options.input) == "" && activeRunDir != nil {
		options.input = filepath.Join(*activeRunDir, "optimize-search-input.json")
	}
	if strings.TrimSpace(options.input) == "" {
		return nil, fmt.Errorf("--input is required")
	}
	if options.output == nil && activeRunDir != nil {
		value := filepath.Join(*activeRunDir, "optimize-search-result.json")
		options.output = &value
	}
	return options, nil
}

func parseOptimizeProposeArgs(args []string, cwd string) (*optimizeProposeArgs, error) {
	options := &optimizeProposeArgs{}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--input":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.input = resolvePath(cwd, value)
		case "--from-search":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.fromSearch = &resolved
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
	if strings.TrimSpace(options.input) != "" && options.fromSearch != nil {
		return nil, fmt.Errorf("use either --input or --from-search, not both")
	}
	activeRunDir, err := readActiveRunDir()
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(options.input) == "" && options.fromSearch == nil && activeRunDir != nil {
		options.input = filepath.Join(*activeRunDir, "optimize-input.json")
	}
	if strings.TrimSpace(options.input) == "" && options.fromSearch == nil {
		return nil, fmt.Errorf("use one of --input or --from-search")
	}
	if options.output == nil && activeRunDir != nil {
		value := filepath.Join(*activeRunDir, "optimize-proposal.json")
		options.output = &value
	}
	return options, nil
}

func parseOptimizeBuildArtifactArgs(args []string, cwd string) (*optimizeBuildArtifactArgs, error) {
	options := &optimizeBuildArtifactArgs{}
	for index := 0; index < len(args); index++ {
		arg := args[index]
		switch arg {
		case "--proposal-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			options.proposalFile = resolvePath(cwd, value)
		case "--input-file":
			value, next, err := requiredValue(args, index, arg)
			if err != nil {
				return nil, err
			}
			index = next
			resolved := resolvePath(cwd, value)
			options.inputFile = &resolved
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
	activeRunDir, err := readActiveRunDir()
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(options.proposalFile) == "" && activeRunDir != nil {
		options.proposalFile = filepath.Join(*activeRunDir, "optimize-proposal.json")
	}
	if strings.TrimSpace(options.proposalFile) == "" {
		return nil, fmt.Errorf("--proposal-file is required")
	}
	if options.output == nil && activeRunDir != nil {
		value := filepath.Join(*activeRunDir, "revision-artifact.json")
		options.output = &value
	}
	return options, nil
}

func requiredValue(args []string, index int, option string) (string, int, error) {
	if index+1 >= len(args) || strings.TrimSpace(args[index+1]) == "" {
		return "", index, fmt.Errorf("%s requires a value", option)
	}
	return args[index+1], index + 1, nil
}

func defaultAdapterOutputPath(repoRoot string, output *string, adapterName *string) string {
	if output != nil && strings.TrimSpace(*output) != "" {
		return resolvePath(repoRoot, *output)
	}
	if adapterName != nil && strings.TrimSpace(*adapterName) != "" {
		return filepath.Join(repoRoot, ".agents", "cautilus-adapters", strings.TrimSpace(*adapterName)+".yaml")
	}
	return filepath.Join(repoRoot, ".agents", "cautilus-adapter.yaml")
}

func resolveRepoRoot(cwd string, repoRoot *string) string {
	if repoRoot == nil || strings.TrimSpace(*repoRoot) == "" {
		return cwd
	}
	return resolvePath(cwd, *repoRoot)
}

func resolvePath(base string, value string) string {
	if filepath.IsAbs(value) {
		return filepath.Clean(value)
	}
	return filepath.Clean(filepath.Join(base, value))
}

func deriveSiblingRawJSONPath(path string) string {
	if strings.HasSuffix(path, ".json") {
		return strings.TrimSuffix(path, ".json") + ".raw.json"
	}
	return path + ".raw.json"
}

func pathExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func readJSONObject(path string) (map[string]any, error) {
	payload, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	decoder := json.NewDecoder(strings.NewReader(string(payload)))
	decoder.UseNumber()
	var value map[string]any
	if err := decoder.Decode(&value); err != nil {
		return nil, err
	}
	if value == nil {
		return nil, errors.New("JSON root must be an object")
	}
	return value, nil
}

func readJSONArray(path string, label string) ([]any, error) {
	payload, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	decoder := json.NewDecoder(strings.NewReader(string(payload)))
	decoder.UseNumber()
	var value []any
	if err := decoder.Decode(&value); err != nil {
		return nil, fmt.Errorf("failed to read JSON from %s: %w", path, err)
	}
	if value == nil {
		return nil, fmt.Errorf("%s must be a JSON array", label)
	}
	return value, nil
}

func writeJSON(writer io.Writer, value any) error {
	payload, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return err
	}
	_, err = writer.Write(append(payload, '\n'))
	return err
}

func writeOutput(stdout io.Writer, cwd string, output *string, value any) error {
	if output == nil {
		return writeJSON(stdout, value)
	}
	resolved := resolvePath(cwd, *output)
	return writeOutputResolved(stdout, &resolved, value)
}

func writeOutputResolved(stdout io.Writer, output *string, value any) error {
	if output == nil {
		return writeJSON(stdout, value)
	}
	payload, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(*output, append(payload, '\n'), 0o644)
}

func arrayOrEmpty(value any) []any {
	items, ok := value.([]any)
	if !ok {
		return []any{}
	}
	return items
}

func anyString(value any) string {
	if text, ok := value.(string); ok {
		return text
	}
	return ""
}

func mapOrEmpty(value any) map[string]any {
	record, ok := value.(map[string]any)
	if !ok || record == nil {
		return map[string]any{}
	}
	return record
}

func resolveOptimizeSearchBuildInputs(options *optimizeSearchPrepareArgs, cwd string) (string, runtime.OptimizeSearchBuildOptions, error) {
	buildOptions := runtime.OptimizeSearchBuildOptions{
		TargetFileOverride:     options.targetFile,
		HeldOutResultsFile:     options.heldOutResultsFile,
		Budget:                 options.budget,
		ReviewCheckpointPolicy: options.reviewCheckpointPolicy,
		ThreeParentPolicy:      options.threeParentPolicy,
		Adapter:                options.adapter,
		AdapterName:            options.adapterName,
		Intent:                 options.intent,
		BaselineRef:            options.baselineRef,
		Profile:                options.profile,
		Split:                  options.split,
	}
	if len(options.inputJSON) == 0 {
		return options.optimizeInputFile, buildOptions, nil
	}
	rawInput := options.inputJSON
	optimizeInputFile := firstNonEmptyJSONString(rawInput["optimizeInputFile"], options.optimizeInputFile)
	if optimizeInputFile == "" {
		return "", runtime.OptimizeSearchBuildOptions{}, fmt.Errorf("input JSON must include optimizeInputFile")
	}
	optimizeInputFile = resolvePath(cwd, optimizeInputFile)
	if targetFile := firstNonEmptyJSONString(rawInput["targetFile"], derefString(options.targetFile)); targetFile != "" {
		resolved := resolvePath(cwd, targetFile)
		buildOptions.TargetFileOverride = &resolved
	}
	if heldOutResultsFile := firstNonEmptyJSONString(rawInput["heldOutResultsFile"], derefString(options.heldOutResultsFile)); heldOutResultsFile != "" {
		resolved := resolvePath(cwd, heldOutResultsFile)
		buildOptions.HeldOutResultsFile = &resolved
	}
	if adapter := firstNonEmptyJSONString(rawInput["adapter"], derefString(options.adapter)); adapter != "" {
		buildOptions.Adapter = &adapter
	}
	if adapterName := firstNonEmptyJSONString(rawInput["adapterName"], derefString(options.adapterName)); adapterName != "" {
		buildOptions.AdapterName = &adapterName
	}
	if intent := firstNonEmptyJSONString(rawInput["intent"], derefString(options.intent)); intent != "" {
		buildOptions.Intent = &intent
	}
	if baselineRef := firstNonEmptyJSONString(rawInput["baselineRef"], derefString(options.baselineRef)); baselineRef != "" {
		buildOptions.BaselineRef = &baselineRef
	}
	if profile := firstNonEmptyJSONString(rawInput["profile"], derefString(options.profile)); profile != "" {
		buildOptions.Profile = &profile
	}
	if split := firstNonEmptyJSONString(rawInput["split"], derefString(options.split)); split != "" {
		buildOptions.Split = &split
	}
	if budget := firstNonEmptyJSONString(rawInput["budget"], options.budget); budget != "" {
		buildOptions.Budget = budget
	}
	if reviewCheckpointPolicy := firstNonEmptyJSONString(rawInput["reviewCheckpointPolicy"], derefString(options.reviewCheckpointPolicy)); reviewCheckpointPolicy != "" {
		buildOptions.ReviewCheckpointPolicy = &reviewCheckpointPolicy
	}
	if threeParentPolicy := firstNonEmptyJSONString(rawInput["threeParentPolicy"], derefString(options.threeParentPolicy)); threeParentPolicy != "" {
		buildOptions.ThreeParentPolicy = &threeParentPolicy
	}
	if selectionPolicy := mapOrEmpty(rawInput["selectionPolicy"]); len(selectionPolicy) > 0 {
		buildOptions.SelectionPolicy = selectionPolicy
	}
	return optimizeInputFile, buildOptions, nil
}

func writeOptimizeSearchPrepareReady(stdout io.Writer, inputFile *string, rawInputFile *string, stderr io.Writer) int {
	payload := map[string]any{
		"status":       "ready",
		"inputFile":    nil,
		"rawInputFile": nil,
	}
	if inputFile != nil {
		payload["inputFile"] = *inputFile
	}
	if rawInputFile != nil {
		payload["rawInputFile"] = *rawInputFile
	}
	if err := writeJSON(stdout, payload); err != nil {
		_, _ = fmt.Fprintf(stderr, "%s\n", err)
		return 1
	}
	return 0
}

func derefString(value *string) string {
	if value == nil {
		return ""
	}
	return strings.TrimSpace(*value)
}

func firstNonEmptyJSONString(value any, fallback string) string {
	if text := anyString(value); strings.TrimSpace(text) != "" {
		return strings.TrimSpace(text)
	}
	return fallback
}

func readActiveRunDir() (*string, error) {
	return runtime.ReadActiveRunDir(environmentMap())
}

func environmentMap() map[string]string {
	result := map[string]string{}
	for _, entry := range os.Environ() {
		parts := strings.SplitN(entry, "=", 2)
		if len(parts) == 2 {
			result[parts[0]] = parts[1]
		}
	}
	return result
}

func externalCommandEnv(extraEnv map[string]string) []string {
	blocked := map[string]struct{}{
		"CAUTILUS_CALLER_CWD": {},
		"CAUTILUS_TOOL_ROOT":  {},
	}
	env := make([]string, 0, len(os.Environ())+len(extraEnv))
	for _, entry := range os.Environ() {
		parts := strings.SplitN(entry, "=", 2)
		if len(parts) != 2 {
			continue
		}
		if _, blockedKey := blocked[parts[0]]; blockedKey {
			continue
		}
		env = append(env, entry)
	}
	for key, value := range extraEnv {
		env = append(env, key+"="+value)
	}
	return env
}

func toJSONString(value any) string {
	payload, err := json.Marshal(value)
	if err != nil {
		return fmt.Sprintf("%v", value)
	}
	return string(payload)
}
