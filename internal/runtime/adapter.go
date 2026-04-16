package runtime

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"

	"gopkg.in/yaml.v3"
)

var AdapterCandidates = []string{
	".agents/cautilus-adapter.yaml",
	".codex/cautilus-adapter.yaml",
	".claude/cautilus-adapter.yaml",
	"docs/cautilus-adapter.yaml",
	"cautilus-adapter.yaml",
}

var NamedAdapterDirs = []string{
	".agents/cautilus-adapters",
	".codex/cautilus-adapters",
	".claude/cautilus-adapters",
	"docs/cautilus-adapters",
	"cautilus-adapters",
}

var adapterStringListFields = []string{
	"evaluation_surfaces",
	"baseline_options",
	"required_prerequisites",
	"preflight_commands",
	"skill_test_command_templates",
	"iterate_command_templates",
	"held_out_command_templates",
	"comparison_command_templates",
	"full_gate_command_templates",
	"artifact_paths",
	"report_paths",
	"comparison_questions",
}

var adapterIntegerFields = []string{
	"version",
	"iterate_samples_default",
	"held_out_samples_default",
	"comparison_samples_default",
	"full_gate_samples_default",
	"review_timeout_ms",
}

var adapterStringFields = []string{
	"repo",
	"history_file_hint",
	"profile_default",
	"default_prompt_file",
	"default_schema_file",
	"skill_cases_default",
}

type AdapterPayload struct {
	Found         bool           `json:"found"`
	Valid         bool           `json:"valid"`
	Path          any            `json:"path"`
	Data          map[string]any `json:"data"`
	Errors        []string       `json:"errors"`
	Warnings      []string       `json:"warnings"`
	SearchedPaths []string       `json:"searched_paths"`
}

func InferRepoDefaults(repoRoot string) map[string]any {
	inferred := map[string]any{}
	packageJSON := filepath.Join(repoRoot, "package.json")
	if !fileExists(packageJSON) {
		return inferred
	}
	parsed, err := readJSONFile(packageJSON)
	if err != nil {
		return inferred
	}
	scripts := asMap(parsed["scripts"])
	if len(scripts) == 0 {
		return inferred
	}
	if _, ok := scripts["check"].(string); ok {
		inferred["preflight_commands"] = []string{"npm run check"}
	}
	if _, ok := scripts["prompt:bench:train"].(string); ok {
		inferred["iterate_command_templates"] = []string{
			"npm run prompt:bench:train -- --baseline-ref {baseline_ref} --history-file {history_file} --samples {iterate_samples}",
		}
	}
	if _, ok := scripts["prompt:bench:test"].(string); ok {
		inferred["held_out_command_templates"] = []string{
			"npm run prompt:bench:test -- --baseline-ref {baseline_ref} --samples {held_out_samples}",
		}
	}
	if _, ok := scripts["prompt:bench:full"].(string); ok {
		inferred["full_gate_command_templates"] = []string{
			"npm run prompt:bench:full -- --baseline-ref {baseline_ref} --history-file {history_file} --samples {full_gate_samples}",
		}
	}
	compareScript := filepath.Join(repoRoot, "scripts", "agent-runtime", "compare-prompt-worktrees.mjs")
	if fileExists(compareScript) {
		inferred["comparison_command_templates"] = []string{
			"node scripts/agent-runtime/compare-prompt-worktrees.mjs --baseline-ref {baseline_ref} --profile {profile} --split {split} --samples {comparison_samples}",
		}
	}
	reportPath := filepath.Join(repoRoot, "specs", "report", "audit-report.html")
	if fileExists(reportPath) {
		inferred["report_paths"] = []string{"specs/report/audit-report.html"}
	}
	inferred["repo"] = filepath.Base(repoRoot)
	inferred["iterate_samples_default"] = 2
	inferred["held_out_samples_default"] = 2
	inferred["comparison_samples_default"] = 2
	inferred["full_gate_samples_default"] = 2
	inferred["history_file_hint"] = "/tmp/cautilus-history.json"
	return inferred
}

func NamedAdapterCandidates(adapterName string) []string {
	result := make([]string, 0, len(NamedAdapterDirs))
	for _, directory := range NamedAdapterDirs {
		result = append(result, filepath.Join(directory, adapterName+".yaml"))
	}
	return result
}

func FindAdapter(repoRoot string, candidates []string) string {
	for _, candidate := range candidates {
		adapterPath := filepath.Join(repoRoot, candidate)
		if fileExists(adapterPath) {
			return adapterPath
		}
	}
	return ""
}

func LoadAdapter(repoRoot string, adapterPath *string, adapterName *string) (*AdapterPayload, error) {
	if adapterPath != nil && adapterName != nil {
		return nil, fmt.Errorf("use either adapter or adapterName, not both")
	}
	var resolvedPath string
	searchedPaths := []string{}
	if adapterPath != nil && strings.TrimSpace(*adapterPath) != "" {
		resolvedPath = resolvePath(repoRoot, *adapterPath)
		searchedPaths = []string{resolvedPath}
	} else {
		candidates := AdapterCandidates
		if adapterName != nil && strings.TrimSpace(*adapterName) != "" {
			candidates = NamedAdapterCandidates(*adapterName)
		}
		for _, candidate := range candidates {
			searchedPaths = append(searchedPaths, filepath.Join(repoRoot, candidate))
		}
		resolvedPath = FindAdapter(repoRoot, candidates)
	}
	if strings.TrimSpace(resolvedPath) == "" || !fileExists(resolvedPath) {
		warning := "No cautilus adapter found. Falling back to inferred defaults."
		if adapterName != nil && strings.TrimSpace(*adapterName) != "" {
			warning = fmt.Sprintf("No named cautilus adapter %q found. Falling back to inferred defaults.", *adapterName)
		}
		return &AdapterPayload{
			Found:         false,
			Valid:         true,
			Path:          nil,
			Data:          InferRepoDefaults(repoRoot),
			Errors:        []string{},
			Warnings:      []string{warning},
			SearchedPaths: searchedPaths,
		}, nil
	}
	payload, err := adapterFilePayload(resolvedPath, searchedPaths)
	if err != nil {
		return nil, err
	}
	return payload, nil
}

func adapterFilePayload(adapterPath string, searchedPaths []string) (*AdapterPayload, error) {
	payload, err := os.ReadFile(adapterPath)
	if err != nil {
		return nil, err
	}
	warnings := []string{}
	var raw map[string]any
	var document yaml.Node
	if err := yaml.Unmarshal(payload, &document); err != nil {
		warnings = append(warnings, "Adapter file did not contain a mapping. Using empty data.")
		raw = map[string]any{}
	} else if converted, err := yamlNodeToAny(&document); err != nil {
		warnings = append(warnings, "Adapter file did not contain a mapping. Using empty data.")
		raw = map[string]any{}
	} else if mapping, ok := converted.(map[string]any); ok {
		raw = mapping
	} else {
		warnings = append(warnings, "Adapter file did not contain a mapping. Using empty data.")
		raw = map[string]any{}
	}
	validated, errors := validateAdapterData(raw)
	return &AdapterPayload{
		Found:         true,
		Valid:         len(errors) == 0,
		Path:          adapterPath,
		Data:          validated,
		Errors:        errors,
		Warnings:      warnings,
		SearchedPaths: searchedPaths,
	}, nil
}

func yamlNodeToAny(node *yaml.Node) (any, error) {
	if node == nil {
		return nil, nil
	}
	switch node.Kind {
	case yaml.DocumentNode:
		if len(node.Content) == 0 {
			return map[string]any{}, nil
		}
		return yamlNodeToAny(node.Content[0])
	case yaml.MappingNode:
		result := map[string]any{}
		for index := 0; index+1 < len(node.Content); index += 2 {
			keyNode := node.Content[index]
			valueNode := node.Content[index+1]
			key := strings.TrimSpace(keyNode.Value)
			if key == "" {
				continue
			}
			value, err := yamlNodeToAny(valueNode)
			if err != nil {
				return nil, err
			}
			result[key] = value
		}
		return result, nil
	case yaml.SequenceNode:
		result := make([]any, 0, len(node.Content))
		for _, entry := range node.Content {
			value, err := yamlNodeToAny(entry)
			if err != nil {
				return nil, err
			}
			result = append(result, value)
		}
		return result, nil
	case yaml.ScalarNode:
		switch node.Tag {
		case "!!null":
			return nil, nil
		case "!!bool":
			return strings.EqualFold(node.Value, "true"), nil
		case "!!int":
			parsed, err := strconv.Atoi(node.Value)
			if err == nil {
				return parsed, nil
			}
			return node.Value, nil
		case "!!float":
			parsed, err := strconv.ParseFloat(node.Value, 64)
			if err == nil {
				return parsed, nil
			}
			return node.Value, nil
		default:
			return node.Value, nil
		}
	case yaml.AliasNode:
		return yamlNodeToAny(node.Alias)
	default:
		return nil, fmt.Errorf("unsupported YAML node kind: %d", node.Kind)
	}
}

func validateAdapterData(data map[string]any) (map[string]any, []string) {
	validated := map[string]any{}
	errors := []string{}
	for _, field := range adapterStringFields {
		if value, ok := data[field]; ok && value != nil {
			if text, ok := value.(string); ok {
				validated[field] = text
			} else {
				errors = append(errors, fmt.Sprintf("%s must be a string", field))
			}
		}
	}
	for _, field := range adapterIntegerFields {
		if value, ok := data[field]; ok && value != nil {
			if integer, err := normalizeInteger(value, field); err != nil {
				errors = append(errors, err.Error())
			} else {
				validated[field] = *integer
			}
		}
	}
	for _, field := range adapterStringListFields {
		if value, ok := data[field]; ok && value != nil {
			items, err := assertArray(value, field)
			if err != nil {
				errors = append(errors, fmt.Sprintf("%s must be a list of strings", field))
				continue
			}
			normalized := []string{}
			valid := true
			for _, item := range items {
				text, ok := item.(string)
				if !ok {
					valid = false
					break
				}
				normalized = append(normalized, text)
			}
			if !valid {
				errors = append(errors, fmt.Sprintf("%s must be a list of strings", field))
				continue
			}
			validated[field] = normalized
		}
	}
	if prompts, ok := data["human_review_prompts"]; ok && prompts != nil {
		items, err := assertArray(prompts, "human_review_prompts")
		if err != nil {
			errors = append(errors, "human_review_prompts must be a list")
		} else {
			normalized := []any{}
			for index, raw := range items {
				record, ok := raw.(map[string]any)
				if !ok {
					errors = append(errors, fmt.Sprintf("human_review_prompts[%d] must be a mapping", index))
					continue
				}
				id, idErr := normalizeNonEmptyString(record["id"], fmt.Sprintf("human_review_prompts[%d].id", index))
				prompt, promptErr := normalizeNonEmptyString(record["prompt"], fmt.Sprintf("human_review_prompts[%d].prompt", index))
				if idErr != nil || promptErr != nil {
					errors = append(errors, fmt.Sprintf("human_review_prompts[%d] must include string id and prompt", index))
					continue
				}
				normalized = append(normalized, map[string]any{"id": id, "prompt": prompt})
			}
			validated["human_review_prompts"] = normalized
		}
	}
	if variants, ok := data["executor_variants"]; ok && variants != nil {
		items, err := assertArray(variants, "executor_variants")
		if err != nil {
			errors = append(errors, "executor_variants must be a list")
		} else {
			normalized := []any{}
			for index, raw := range items {
				record, ok := raw.(map[string]any)
				if !ok {
					errors = append(errors, fmt.Sprintf("executor_variants[%d] must be a mapping", index))
					continue
				}
				entry := map[string]any{}
				missing := false
				for _, field := range []string{"id", "tool", "command_template"} {
					value, err := normalizeNonEmptyString(record[field], fmt.Sprintf("executor_variants[%d].%s", index, field))
					if err != nil {
						errors = append(errors, fmt.Sprintf("executor_variants[%d].%s must be a non-empty string", index, field))
						missing = true
						continue
					}
					entry[field] = value
				}
				if optionalPurpose, err := normalizeOptionalString(record["purpose"], fmt.Sprintf("executor_variants[%d].purpose", index)); err == nil && optionalPurpose != nil {
					entry["purpose"] = *optionalPurpose
				} else if err != nil {
					errors = append(errors, fmt.Sprintf("executor_variants[%d].purpose must be a string", index))
				}
				for _, field := range []string{"required_prerequisites", "safety_notes"} {
					if value, ok := record[field]; ok && value != nil {
						items, err := assertArray(value, fmt.Sprintf("executor_variants[%d].%s", index, field))
						if err != nil {
							errors = append(errors, fmt.Sprintf("executor_variants[%d].%s must be a list of strings", index, field))
							continue
						}
						entry[field] = stringSliceNoValidate(items)
					}
				}
				if !missing {
					normalized = append(normalized, entry)
				}
			}
			validated["executor_variants"] = normalized
		}
	}
	return validated, errors
}

func stringSliceNoValidate(items []any) []string {
	result := make([]string, 0, len(items))
	for _, item := range items {
		if text, ok := item.(string); ok {
			result = append(result, text)
		}
	}
	return result
}

func numericDefaults(inferred map[string]any) map[string]any {
	defaultValue := func(key string) int {
		if value, ok := toFloat(inferred[key]); ok && int(value) > 0 {
			return int(value)
		}
		return 2
	}
	return map[string]any{
		"iterate_samples_default":    defaultValue("iterate_samples_default"),
		"held_out_samples_default":   defaultValue("held_out_samples_default"),
		"comparison_samples_default": defaultValue("comparison_samples_default"),
		"full_gate_samples_default":  defaultValue("full_gate_samples_default"),
	}
}

func ScaffoldAdapter(repoRoot string, repoName string, scenario string) map[string]any {
	inferred := InferRepoDefaults(repoRoot)
	scaffold := map[string]any{
		"version":                      1,
		"repo":                         repoName,
		"evaluation_surfaces":          []string{"prompt behavior", "workflow behavior"},
		"baseline_options":             []string{"baseline git ref in the same repo via {baseline_ref}"},
		"required_prerequisites":       []string{"choose a real baseline before comparing results"},
		"preflight_commands":           stringArrayOrEmpty(inferred["preflight_commands"]),
		"skill_test_command_templates": []string{},
		"iterate_command_templates":    stringArrayOrEmpty(inferred["iterate_command_templates"]),
		"held_out_command_templates":   stringArrayOrEmpty(inferred["held_out_command_templates"]),
		"comparison_command_templates": stringArrayOrEmpty(inferred["comparison_command_templates"]),
		"full_gate_command_templates":  stringArrayOrEmpty(inferred["full_gate_command_templates"]),
		"executor_variants":            []any{},
		"artifact_paths":               []any{},
		"report_paths":                 stringArrayOrEmpty(inferred["report_paths"]),
		"comparison_questions":         []string{"Which scenarios improved, regressed, or stayed noisy after repeated samples?"},
		"human_review_prompts": []any{map[string]any{
			"id":     "real-user",
			"prompt": "Where would a real user still judge the candidate worse despite benchmark wins?",
		}},
		"history_file_hint": inferred["history_file_hint"],
		"profile_default":   firstNonEmptyString(inferred["profile_default"], "default"),
	}
	for key, value := range numericDefaults(inferred) {
		scaffold[key] = value
	}
	applyScenarioOverlay(scaffold, scenario)
	return scaffold
}

// applyScenarioOverlay pre-fills the command slot that matches the selected
// evaluation archetype so a first-time operator sees a concrete starting
// point instead of an empty list. Unknown scenarios leave the scaffold
// untouched; the CLI parser is expected to validate the flag value first.
func applyScenarioOverlay(scaffold map[string]any, scenario string) {
	switch scenario {
	case "chatbot":
		scaffold["evaluation_surfaces"] = []string{"chatbot conversation behavior"}
		scaffold["iterate_command_templates"] = []string{
			"cautilus scenario normalize chatbot --input {chatbot_input_file}",
		}
	case "skill":
		scaffold["evaluation_surfaces"] = []string{"skill trigger, execution, and validation behavior"}
		scaffold["skill_cases_default"] = "fixtures/skill-test/cases.json"
		scaffold["skill_test_command_templates"] = []string{
			"cautilus skill test --repo-root {candidate_repo} --adapter-name {adapter_name}",
		}
	case "workflow":
		scaffold["evaluation_surfaces"] = []string{"workflow recovery behavior across sessions"}
		scaffold["iterate_command_templates"] = []string{
			"cautilus scenario normalize workflow --input {workflow_input_file}",
		}
	}
}

func DumpYAMLDocument(data map[string]any) (string, error) {
	payload, err := yaml.Marshal(data)
	if err != nil {
		return "", err
	}
	return string(payload), nil
}

func checkGitPrecondition(repoRoot string) (map[string]any, int) {
	gitResult := func(checks []any, suggestions []any, status string, summary string) (map[string]any, int) {
		return map[string]any{
			"repo_root":   repoRoot,
			"status":      status,
			"ready":       false,
			"summary":     summary,
			"checks":      checks,
			"suggestions": suggestions,
			"warnings":    []any{},
			"errors":      []any{},
		}, 1
	}

	isGitRepo := exec.Command("git", "-C", repoRoot, "rev-parse", "--is-inside-work-tree")
	if err := isGitRepo.Run(); err != nil {
		return gitResult(
			[]any{map[string]any{"id": "git_repo", "ok": false, "detail": "This directory is not a git repository."}},
			[]any{
				"Run git init to initialize a repository.",
				"Set up a .gitignore before your first commit to avoid tracking large or sensitive files.",
			},
			"missing_git",
			"Not a git repository.",
		)
	}

	hasCommits := exec.Command("git", "-C", repoRoot, "rev-list", "-1", "HEAD")
	if err := hasCommits.Run(); err != nil {
		return gitResult(
			[]any{
				map[string]any{"id": "git_repo", "ok": true, "detail": "This directory is a git repository."},
				map[string]any{"id": "git_has_commits", "ok": false, "detail": "Git repository has no commits yet."},
			},
			[]any{
				"Set up a .gitignore first, then create your initial commit.",
			},
			"no_commits",
			"Git repository has no commits.",
		)
	}

	return nil, 0
}

func DoctorRepo(repoRoot string, adapterPath *string, adapterName *string) (map[string]any, int, error) {
	if gitResult, gitExit := checkGitPrecondition(repoRoot); gitResult != nil {
		return gitResult, gitExit, nil
	}
	payload, err := LoadAdapter(repoRoot, adapterPath, adapterName)
	if err != nil {
		return nil, 1, err
	}
	checks := []any{}
	suggestions := []any{}
	warnings := append([]string{}, payload.Warnings...)
	baseResult := func() map[string]any {
		return map[string]any{
			"repo_root":      repoRoot,
			"adapter_path":   payload.Path,
			"searched_paths": payload.SearchedPaths,
			"checks":         checks,
			"suggestions":    suggestions,
			"warnings":       warnings,
			"errors":         payload.Errors,
		}
	}
	if !payload.Found {
		checks = append(checks, map[string]any{"id": "adapter_found", "ok": false, "detail": "No checked-in adapter was found."})
		command := fmt.Sprintf("cautilus adapter init --repo-root %s", repoRoot)
		if adapterName != nil && strings.TrimSpace(*adapterName) != "" {
			command += " --adapter-name " + *adapterName
		}
		suggestions = append(suggestions, command)
		for _, warning := range payload.Warnings {
			suggestions = append(suggestions, warning)
		}
		result := baseResult()
		result["status"] = "missing_adapter"
		result["ready"] = false
		result["summary"] = "Adapter missing."
		return result, 1, nil
	}
	checks = append(checks, map[string]any{"id": "adapter_found", "ok": true, "detail": fmt.Sprintf("Using adapter at %v", payload.Path)})
	if !payload.Valid {
		checks = append(checks, map[string]any{"id": "adapter_valid", "ok": false, "detail": "Adapter failed schema validation."})
		result := baseResult()
		result["status"] = "invalid_adapter"
		result["ready"] = false
		result["summary"] = "Adapter is present but invalid."
		result["suggestions"] = []any{
			"Repair the adapter fields reported in errors before running evaluation.",
			"See docs/contracts/adapter-contract.md for the canonical adapter shape.",
		}
		return result, 1, nil
	}
	checks = append(checks, map[string]any{"id": "adapter_valid", "ok": true, "detail": "Adapter passed schema validation."})
	data := payload.Data
	appendFieldCheck(&checks, &suggestions, "repo_name", strings.TrimSpace(stringOrEmpty(data["repo"])) != "", "Adapter declares repo.", "Adapter is missing a repo name.", "Set adapter.repo to the host repo name.")
	appendFieldCheck(&checks, &suggestions, "evaluation_surfaces", len(stringArrayOrEmpty(data["evaluation_surfaces"])) > 0, "Adapter declares evaluation surfaces.", "Adapter is missing evaluation_surfaces.", "Add at least one evaluation_surfaces entry that states what the adapter judges.")
	appendFieldCheck(&checks, &suggestions, "baseline_options", len(stringArrayOrEmpty(data["baseline_options"])) > 0, "Adapter declares baseline options.", "Adapter is missing baseline_options.", "Add at least one baseline_options entry so comparisons stay explicit.")
	automatedCommands := len(stringArrayOrEmpty(data["iterate_command_templates"])) > 0 ||
		len(stringArrayOrEmpty(data["skill_test_command_templates"])) > 0 ||
		len(stringArrayOrEmpty(data["held_out_command_templates"])) > 0 ||
		len(stringArrayOrEmpty(data["comparison_command_templates"])) > 0 ||
		len(stringArrayOrEmpty(data["full_gate_command_templates"])) > 0
	hasVariants := len(arrayOrEmpty(data["executor_variants"])) > 0
	appendFieldCheck(&checks, &suggestions, "execution_surface", automatedCommands || hasVariants, "Adapter declares runnable command templates or executor variants.", "Adapter has no command templates or executor variants yet.", "Add at least one skill_test/iterate/held_out/comparison/full_gate command template or executor_variants entry.")
	if adapterLooksDeterministicOnly(data) {
		warnings = append(warnings, "Adapter commands look like repo-local deterministic gates only. Keep pytest/lint/type/spec checks in CI or pre-push hooks; use Cautilus for LLM-behavior, judge, or operator-facing review surfaces.")
		suggestions = append(suggestions, "Inventory LLM-behavior surfaces first (system prompts, agent/chat loops, LLM-backed analysis, operator copy reviewed by a judge) before hand-editing adapter YAML.")
		suggestions = append(suggestions, "Run cautilus scenario propose against those LLM-behavior surfaces before adding more deterministic command wrappers.")
	}
	ready := allChecksReady(checks)
	result := baseResult()
	if ready {
		result["status"] = "ready"
		result["ready"] = true
		result["summary"] = "Adapter is ready for standalone Cautilus use."
		result["next_steps"] = []any{
			"Run `cautilus scenarios` to see which evaluation archetype matches your situation.",
		}
		return result, 0, nil
	}
	result["status"] = "incomplete_adapter"
	result["ready"] = false
	result["summary"] = "Adapter exists but is not ready yet."
	return result, 1, nil
}

func DoctorAgentSurface(repoRoot string) (map[string]any, int, error) {
	type surfaceCheck struct {
		id         string
		path       string
		okDetail   string
		failDetail string
		suggestion string
	}

	checkDefinitions := []surfaceCheck{
		{
			id:         "skill_installed",
			path:       filepath.Join(repoRoot, ".agents", "skills", "cautilus", "SKILL.md"),
			okDetail:   "Installed bundled skill is present under .agents/skills/cautilus.",
			failDetail: "Installed bundled skill is missing under .agents/skills/cautilus.",
			suggestion: fmt.Sprintf("Run cautilus install --repo-root %s to materialize the local agent skill surface.", repoRoot),
		},
		{
			id:         "claude_skills_link",
			path:       filepath.Join(repoRoot, ".claude", "skills"),
			okDetail:   "Claude compatibility skills link is present.",
			failDetail: "Claude compatibility skills link is missing.",
			suggestion: fmt.Sprintf("Run cautilus install --repo-root %s to refresh the Claude skills link.", repoRoot),
		},
	}

	checks := []any{}
	suggestions := []any{}
	artifactPaths := map[string]any{}
	for _, definition := range checkDefinitions {
		_, err := os.Lstat(definition.path)
		ok := err == nil
		detail := definition.failDetail
		if ok {
			detail = definition.okDetail
			artifactPaths[definition.id] = definition.path
		}
		checks = append(checks, map[string]any{
			"id":     definition.id,
			"ok":     ok,
			"detail": detail,
		})
		if !ok {
			suggestions = append(suggestions, definition.suggestion)
		}
	}

	ready := allChecksReady(checks)
	result := map[string]any{
		"repo_root":      repoRoot,
		"scope":          "agent-surface",
		"checks":         checks,
		"suggestions":    suggestions,
		"warnings":       []any{},
		"errors":         []any{},
		"artifact_paths": artifactPaths,
	}
	if ready {
		result["status"] = "ready"
		result["ready"] = true
		result["summary"] = "Local agent-consumable skill surface is materialized."
		return result, 0, nil
	}
	result["status"] = "missing_agent_surface"
	result["ready"] = false
	result["summary"] = "Local agent-consumable skill surface is not materialized yet."
	return result, 1, nil
}

func appendFieldCheck(checks *[]any, suggestions *[]any, id string, ok bool, okDetail string, missingDetail string, suggestion string) {
	detail := missingDetail
	if ok {
		detail = okDetail
	}
	*checks = append(*checks, map[string]any{"id": id, "ok": ok, "detail": detail})
	if !ok {
		*suggestions = append(*suggestions, suggestion)
	}
}

func allChecksReady(checks []any) bool {
	for _, raw := range checks {
		if !truthy(asMap(raw)["ok"]) {
			return false
		}
	}
	return true
}

func firstNonEmptyString(value any, fallback string) string {
	if text := strings.TrimSpace(stringOrEmpty(value)); text != "" {
		return text
	}
	return fallback
}

func adapterLooksDeterministicOnly(data map[string]any) bool {
	if len(arrayOrEmpty(data["executor_variants"])) > 0 {
		return false
	}
	commands := []string{}
	for _, key := range []string{
		"skill_test_command_templates",
		"iterate_command_templates",
		"held_out_command_templates",
		"comparison_command_templates",
		"full_gate_command_templates",
	} {
		commands = append(commands, stringArrayOrEmpty(data[key])...)
	}
	if len(commands) == 0 {
		return false
	}
	for _, command := range commands {
		if !looksLikeDeterministicGateCommand(command) {
			return false
		}
	}
	return true
}

func looksLikeDeterministicGateCommand(command string) bool {
	normalized := strings.ToLower(strings.TrimSpace(command))
	for _, marker := range []string{
		"pytest",
		"ruff",
		"mypy",
		"pyright",
		"specdown",
		"eslint",
		"prettier",
		"golangci-lint",
		"go test",
		"go vet",
		"cargo test",
		"cargo clippy",
		"npm test",
		"npm run test",
		"npm run lint",
		"pnpm test",
		"pnpm lint",
		"uv run python -m pytest",
		"python -m pytest",
		"uv run ruff",
		"uv run ty",
		" ty ",
	} {
		if strings.Contains(normalized, marker) {
			return true
		}
	}
	return false
}
