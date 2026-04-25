package runtime

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
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
	"eval_test_command_templates",
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
	"evaluation_input_default",
}

var adapterOptimizeSearchBudgetNames = []string{"light", "medium", "heavy"}

type AdapterPayload struct {
	Found         bool           `json:"found"`
	Valid         bool           `json:"valid"`
	Path          any            `json:"path"`
	Data          map[string]any `json:"data"`
	Errors        []string       `json:"errors"`
	Warnings      []string       `json:"warnings"`
	SearchedPaths []string       `json:"searched_paths"`
}

type NamedAdapterReference struct {
	Name string `json:"name"`
	Path string `json:"path"`
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

func DiscoverNamedAdapters(repoRoot string) []NamedAdapterReference {
	discovered := []NamedAdapterReference{}
	seen := map[string]struct{}{}
	for _, relativeDir := range NamedAdapterDirs {
		absoluteDir := filepath.Join(repoRoot, relativeDir)
		entries, err := os.ReadDir(absoluteDir)
		if err != nil {
			continue
		}
		names := make([]string, 0, len(entries))
		for _, entry := range entries {
			if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".yaml") {
				continue
			}
			names = append(names, entry.Name())
		}
		sort.Strings(names)
		for _, filename := range names {
			name := strings.TrimSuffix(filename, ".yaml")
			if name == "" {
				continue
			}
			if _, ok := seen[name]; ok {
				continue
			}
			seen[name] = struct{}{}
			discovered = append(discovered, NamedAdapterReference{
				Name: name,
				Path: filepath.Join(absoluteDir, filename),
			})
		}
	}
	return discovered
}

func SoleNamedAdapter(repoRoot string) *NamedAdapterReference {
	discovered := DiscoverNamedAdapters(repoRoot)
	if len(discovered) != 1 {
		return nil
	}
	reference := discovered[0]
	return &reference
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
	if instanceDiscovery, ok := data["instance_discovery"]; ok && instanceDiscovery != nil {
		normalized, instanceErrors := validateAdapterInstanceDiscovery(instanceDiscovery)
		errors = append(errors, instanceErrors...)
		if normalized != nil {
			validated["instance_discovery"] = normalized
		}
	}
	if liveRunInvocation, ok := data["live_run_invocation"]; ok && liveRunInvocation != nil {
		normalized, invocationErrors := validateAdapterLiveRunInvocation(liveRunInvocation)
		errors = append(errors, invocationErrors...)
		if normalized != nil {
			validated["live_run_invocation"] = normalized
		}
	}
	if optimizeSearch, ok := data["optimize_search"]; ok && optimizeSearch != nil {
		normalized, optimizeErrors := validateAdapterOptimizeSearch(optimizeSearch)
		errors = append(errors, optimizeErrors...)
		if normalized != nil {
			validated["optimize_search"] = normalized
		}
	}
	if runtimePolicy, ok := data["runtime_policy"]; ok && runtimePolicy != nil {
		normalized, err := normalizeRuntimePolicy(runtimePolicy, "runtime_policy")
		if err != nil {
			errors = append(errors, err.Error())
		} else if normalized != nil {
			validated["runtime_policy"] = normalized
		}
	}
	return validated, errors
}

func validateAdapterLiveRunInvocation(value any) (map[string]any, []string) {
	record, ok := value.(map[string]any)
	if !ok {
		return nil, []string{"live_run_invocation must be a mapping"}
	}
	errors := []string{}
	validated := map[string]any{}
	commandTemplate, err := normalizeNonEmptyString(record["command_template"], "live_run_invocation.command_template")
	if err != nil {
		errors = append(errors, "live_run_invocation.command_template must be a non-empty string")
	} else {
		validated["command_template"] = commandTemplate
	}
	if consumerCommandTemplate, ok := record["consumer_command_template"]; ok && consumerCommandTemplate != nil {
		text, err := normalizeNonEmptyString(consumerCommandTemplate, "live_run_invocation.consumer_command_template")
		if err != nil {
			errors = append(errors, "live_run_invocation.consumer_command_template must be a non-empty string")
		} else {
			validated["consumer_command_template"] = text
		}
	}
	if singleTurnTemplate, ok := record["consumer_single_turn_command_template"]; ok && singleTurnTemplate != nil {
		text, err := normalizeNonEmptyString(singleTurnTemplate, "live_run_invocation.consumer_single_turn_command_template")
		if err != nil {
			errors = append(errors, "live_run_invocation.consumer_single_turn_command_template must be a non-empty string")
		} else {
			validated["consumer_single_turn_command_template"] = text
		}
	}
	if prepareTemplate, ok := record["workspace_prepare_command_template"]; ok && prepareTemplate != nil {
		text, err := normalizeNonEmptyString(prepareTemplate, "live_run_invocation.workspace_prepare_command_template")
		if err != nil {
			errors = append(errors, "live_run_invocation.workspace_prepare_command_template must be a non-empty string")
		} else {
			validated["workspace_prepare_command_template"] = text
		}
	}
	if evaluatorTemplate, ok := record["consumer_evaluator_command_template"]; ok && evaluatorTemplate != nil {
		text, err := normalizeNonEmptyString(evaluatorTemplate, "live_run_invocation.consumer_evaluator_command_template")
		if err != nil {
			errors = append(errors, "live_run_invocation.consumer_evaluator_command_template must be a non-empty string")
		} else {
			validated["consumer_evaluator_command_template"] = text
		}
	}
	if simulatorPersonaTemplate, ok := record["simulator_persona_command_template"]; ok && simulatorPersonaTemplate != nil {
		text, err := normalizeNonEmptyString(simulatorPersonaTemplate, "live_run_invocation.simulator_persona_command_template")
		if err != nil {
			errors = append(errors, "live_run_invocation.simulator_persona_command_template must be a non-empty string")
		} else {
			validated["simulator_persona_command_template"] = text
		}
	}
	if prerequisites, ok := record["required_prerequisites"]; ok && prerequisites != nil {
		items, err := assertArray(prerequisites, "live_run_invocation.required_prerequisites")
		if err != nil {
			errors = append(errors, "live_run_invocation.required_prerequisites must be a list of strings")
		} else {
			validated["required_prerequisites"] = stringSliceNoValidate(items)
		}
	}
	return validated, errors
}

func validateAdapterInstanceDiscovery(value any) (map[string]any, []string) {
	record, ok := value.(map[string]any)
	if !ok {
		return nil, []string{"instance_discovery must be a mapping"}
	}
	errors := []string{}
	validated := map[string]any{}
	kind, err := normalizeNonEmptyString(record["kind"], "instance_discovery.kind")
	if err != nil || (kind != "explicit" && kind != "command") {
		errors = append(errors, "instance_discovery.kind must be one of: explicit, command")
		return nil, errors
	}
	validated["kind"] = kind
	if prerequisites, ok := record["required_prerequisites"]; ok && prerequisites != nil {
		items, err := assertArray(prerequisites, "instance_discovery.required_prerequisites")
		if err != nil {
			errors = append(errors, "instance_discovery.required_prerequisites must be a list of strings")
		} else {
			validated["required_prerequisites"] = stringSliceNoValidate(items)
		}
	}
	switch kind {
	case "command":
		commandTemplate, err := normalizeNonEmptyString(record["command_template"], "instance_discovery.command_template")
		if err != nil {
			errors = append(errors, "instance_discovery.command_template must be a non-empty string when kind=command")
		} else {
			validated["command_template"] = commandTemplate
		}
		if _, ok := record["instances"]; ok {
			errors = append(errors, "instance_discovery.instances is only allowed when kind=explicit")
		}
	case "explicit":
		if _, ok := record["command_template"]; ok {
			errors = append(errors, "instance_discovery.command_template is only allowed when kind=command")
		}
		instances, ok := record["instances"]
		if !ok || instances == nil {
			errors = append(errors, "instance_discovery.instances must be a non-empty list when kind=explicit")
			return validated, errors
		}
		items, err := assertArray(instances, "instance_discovery.instances")
		if err != nil || len(items) == 0 {
			errors = append(errors, "instance_discovery.instances must be a non-empty list when kind=explicit")
			return validated, errors
		}
		normalizedInstances := []any{}
		for index, raw := range items {
			instance, ok := raw.(map[string]any)
			if !ok {
				errors = append(errors, fmt.Sprintf("instance_discovery.instances[%d] must be a mapping", index))
				continue
			}
			entry := map[string]any{}
			id, idErr := normalizeNonEmptyString(instance["id"], fmt.Sprintf("instance_discovery.instances[%d].id", index))
			displayLabel, labelErr := normalizeNonEmptyString(instance["display_label"], fmt.Sprintf("instance_discovery.instances[%d].display_label", index))
			if idErr != nil {
				errors = append(errors, fmt.Sprintf("instance_discovery.instances[%d].id must be a non-empty string", index))
			} else {
				entry["id"] = id
			}
			if labelErr != nil {
				errors = append(errors, fmt.Sprintf("instance_discovery.instances[%d].display_label must be a non-empty string", index))
			} else {
				entry["display_label"] = displayLabel
			}
			if description, err := normalizeOptionalString(instance["description"], fmt.Sprintf("instance_discovery.instances[%d].description", index)); err == nil && description != nil {
				entry["description"] = *description
			} else if err != nil {
				errors = append(errors, fmt.Sprintf("instance_discovery.instances[%d].description must be a string", index))
			}
			hasLocation := false
			if dataRoot, err := normalizeOptionalString(instance["data_root"], fmt.Sprintf("instance_discovery.instances[%d].data_root", index)); err == nil && dataRoot != nil {
				entry["data_root"] = *dataRoot
				hasLocation = true
			} else if err != nil {
				errors = append(errors, fmt.Sprintf("instance_discovery.instances[%d].data_root must be a string", index))
			}
			if rawPaths, ok := instance["paths"]; ok && rawPaths != nil {
				pathMap, ok := rawPaths.(map[string]any)
				if !ok {
					errors = append(errors, fmt.Sprintf("instance_discovery.instances[%d].paths must be a mapping of strings", index))
				} else {
					normalizedPaths := map[string]any{}
					for key, rawPath := range pathMap {
						trimmedKey := strings.TrimSpace(key)
						if trimmedKey == "" {
							errors = append(errors, fmt.Sprintf("instance_discovery.instances[%d].paths keys must be non-empty", index))
							continue
						}
						path, err := normalizeNonEmptyString(rawPath, fmt.Sprintf("instance_discovery.instances[%d].paths.%s", index, trimmedKey))
						if err != nil {
							errors = append(errors, fmt.Sprintf("instance_discovery.instances[%d].paths.%s must be a non-empty string", index, trimmedKey))
							continue
						}
						normalizedPaths[trimmedKey] = path
					}
					if len(normalizedPaths) > 0 {
						entry["paths"] = normalizedPaths
						hasLocation = true
					}
				}
			}
			if !hasLocation {
				errors = append(errors, fmt.Sprintf("instance_discovery.instances[%d] must include data_root, paths, or both", index))
			}
			if len(entry) > 0 {
				normalizedInstances = append(normalizedInstances, entry)
			}
		}
		validated["instances"] = normalizedInstances
	}
	return validated, errors
}

func validateAdapterOptimizeSearch(value any) (map[string]any, []string) {
	record, ok := value.(map[string]any)
	if !ok {
		return nil, []string{"optimize_search must be a mapping"}
	}
	errors := []string{}
	validated := map[string]any{}
	if defaultBudget, ok := record["default_budget"]; ok && defaultBudget != nil {
		text, err := normalizeNonEmptyString(defaultBudget, "optimize_search.default_budget")
		if err != nil {
			errors = append(errors, "optimize_search.default_budget must be one of: light, medium, heavy")
		} else if !isKnownOptimizeSearchBudget(text) {
			errors = append(errors, "optimize_search.default_budget must be one of: light, medium, heavy")
		} else {
			validated["default_budget"] = text
		}
	}
	if budgets, ok := record["budgets"]; ok && budgets != nil {
		items, ok := budgets.(map[string]any)
		if !ok {
			errors = append(errors, "optimize_search.budgets must be a mapping")
		} else {
			normalizedBudgets := map[string]any{}
			for budgetName, rawBudget := range items {
				if !isKnownOptimizeSearchBudget(budgetName) {
					errors = append(errors, fmt.Sprintf("optimize_search.budgets.%s is not a supported tier", budgetName))
					continue
				}
				budgetRecord, ok := rawBudget.(map[string]any)
				if !ok {
					errors = append(errors, fmt.Sprintf("optimize_search.budgets.%s must be a mapping", budgetName))
					continue
				}
				entry := map[string]any{}
				for _, field := range []string{"generation_limit", "population_limit", "mutation_batch_size"} {
					if rawValue, ok := budgetRecord[field]; ok && rawValue != nil {
						number, err := normalizeInteger(rawValue, fmt.Sprintf("optimize_search.budgets.%s.%s", budgetName, field))
						if err != nil || number == nil || *number <= 0 {
							errors = append(errors, fmt.Sprintf("optimize_search.budgets.%s.%s must be a positive integer", budgetName, field))
							continue
						}
						entry[field] = *number
					}
				}
				if policy, ok := budgetRecord["review_checkpoint_policy"]; ok && policy != nil {
					text, err := normalizeNonEmptyString(policy, fmt.Sprintf("optimize_search.budgets.%s.review_checkpoint_policy", budgetName))
					if err != nil || (text != "final_only" && text != "frontier_promotions") {
						errors = append(errors, fmt.Sprintf("optimize_search.budgets.%s.review_checkpoint_policy must be one of: final_only, frontier_promotions", budgetName))
					} else {
						entry["review_checkpoint_policy"] = text
					}
				}
				if mergeEnabled, ok := budgetRecord["merge_enabled"]; ok && mergeEnabled != nil {
					value, ok := mergeEnabled.(bool)
					if !ok {
						errors = append(errors, fmt.Sprintf("optimize_search.budgets.%s.merge_enabled must be a boolean", budgetName))
					} else {
						entry["merge_enabled"] = value
					}
				}
				if policy, ok := budgetRecord["three_parent_policy"]; ok && policy != nil {
					text, err := normalizeNonEmptyString(policy, fmt.Sprintf("optimize_search.budgets.%s.three_parent_policy", budgetName))
					if err != nil || (text != "disabled" && text != "coverage_expansion") {
						errors = append(errors, fmt.Sprintf("optimize_search.budgets.%s.three_parent_policy must be one of: disabled, coverage_expansion", budgetName))
					} else {
						entry["three_parent_policy"] = text
					}
				}
				normalizedBudgets[budgetName] = entry
			}
			validated["budgets"] = normalizedBudgets
		}
	}
	if selectionPolicy, ok := record["selection_policy"]; ok && selectionPolicy != nil {
		policy, ok := selectionPolicy.(map[string]any)
		if !ok {
			errors = append(errors, "optimize_search.selection_policy must be a mapping")
		} else {
			normalized := map[string]any{}
			if objective, ok := policy["primary_objective"]; ok && objective != nil {
				text, err := normalizeNonEmptyString(objective, "optimize_search.selection_policy.primary_objective")
				if err != nil {
					errors = append(errors, "optimize_search.selection_policy.primary_objective must be a non-empty string")
				} else {
					normalized["primary_objective"] = text
				}
			}
			if tieBreakers, ok := policy["tie_breakers"]; ok && tieBreakers != nil {
				items, err := assertArray(tieBreakers, "optimize_search.selection_policy.tie_breakers")
				if err != nil {
					errors = append(errors, "optimize_search.selection_policy.tie_breakers must be a list of strings")
				} else {
					normalized["tie_breakers"] = stringSliceNoValidate(items)
				}
			}
			if constraintCaps, ok := policy["constraint_caps"]; ok && constraintCaps != nil {
				caps, ok := constraintCaps.(map[string]any)
				if !ok {
					errors = append(errors, "optimize_search.selection_policy.constraint_caps must be a mapping")
				} else {
					normalizedCaps := map[string]any{}
					for key, rawCap := range caps {
						number, err := normalizeNonNegativeNumber(rawCap, fmt.Sprintf("optimize_search.selection_policy.constraint_caps.%s", key))
						if err != nil || number == nil {
							errors = append(errors, fmt.Sprintf("optimize_search.selection_policy.constraint_caps.%s must be a non-negative number", key))
							continue
						}
						normalizedCaps[key] = *number
					}
					normalized["constraint_caps"] = normalizedCaps
				}
			}
			validated["selection_policy"] = normalized
		}
	}
	return validated, errors
}

func isKnownOptimizeSearchBudget(value string) bool {
	for _, budget := range adapterOptimizeSearchBudgetNames {
		if value == budget {
			return true
		}
	}
	return false
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
		"version":                1,
		"repo":                   repoName,
		"evaluation_surfaces":    []string{"prompt behavior", "workflow behavior"},
		"baseline_options":       []string{"baseline git ref in the same repo via {baseline_ref}"},
		"required_prerequisites": []string{"choose a real baseline before comparing results"},
		"preflight_commands":                         stringArrayOrEmpty(inferred["preflight_commands"]),
		"eval_test_command_templates":                []string{},
		"iterate_command_templates":                  stringArrayOrEmpty(inferred["iterate_command_templates"]),
		"held_out_command_templates":                 stringArrayOrEmpty(inferred["held_out_command_templates"]),
		"comparison_command_templates":               stringArrayOrEmpty(inferred["comparison_command_templates"]),
		"full_gate_command_templates":                stringArrayOrEmpty(inferred["full_gate_command_templates"]),
		"executor_variants":                          []any{},
		"artifact_paths":                             []any{},
		"report_paths":                               stringArrayOrEmpty(inferred["report_paths"]),
		"comparison_questions":                       []string{"Which scenarios improved, regressed, or stayed noisy after repeated samples?"},
		"human_review_prompts": []any{map[string]any{
			"id":     "real-user",
			"prompt": "Where would a real user still judge the candidate worse despite benchmark wins?",
		}},
		"history_file_hint": inferred["history_file_hint"],
		"profile_default":   firstNonEmptyString(inferred["profile_default"], "default"),
		"optimize_search":   defaultAdapterOptimizeSearchConfig(),
	}
	for key, value := range numericDefaults(inferred) {
		scaffold[key] = value
	}
	applyScenarioOverlay(scaffold, scenario)
	return scaffold
}

func defaultAdapterOptimizeSearchConfig() map[string]any {
	return map[string]any{
		"default_budget": "medium",
		"budgets": map[string]any{
			"light": map[string]any{
				"generation_limit":         1,
				"population_limit":         3,
				"mutation_batch_size":      3,
				"review_checkpoint_policy": "final_only",
				"merge_enabled":            false,
				"three_parent_policy":      "coverage_expansion",
			},
			"medium": map[string]any{
				"generation_limit":         2,
				"population_limit":         5,
				"mutation_batch_size":      4,
				"review_checkpoint_policy": "frontier_promotions",
				"merge_enabled":            false,
				"three_parent_policy":      "coverage_expansion",
			},
			"heavy": map[string]any{
				"generation_limit":         3,
				"population_limit":         8,
				"mutation_batch_size":      5,
				"review_checkpoint_policy": "frontier_promotions",
				"merge_enabled":            false,
				"three_parent_policy":      "coverage_expansion",
			},
		},
		"selection_policy": map[string]any{
			"primary_objective": "held_out_behavior",
			"tie_breakers":      []string{"lower_cost", "lower_latency"},
			"constraint_caps":   map[string]any{},
		},
	}
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
		scaffold["evaluation_input_default"] = "fixtures/eval/skill/cases.fixture.json"
		scaffold["eval_test_command_templates"] = []string{
			"cautilus eval test --repo-root {candidate_repo} --adapter-name {adapter_name}",
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
		return AttachDoctorGuidance(gitResult, repoRoot, "repo", adapterName), gitExit, nil
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
		namedAdapters := []any{}
		discoveredNamedAdapters := DiscoverNamedAdapters(repoRoot)
		if adapterName == nil {
			for _, reference := range discoveredNamedAdapters {
				namedAdapters = append(namedAdapters, map[string]any{
					"name": reference.Name,
					"path": reference.Path,
				})
			}
		}
		detail := "No checked-in adapter was found."
		if len(namedAdapters) > 0 {
			detail = "No default checked-in adapter was found, but named adapters are available."
		}
		checks = append(checks, map[string]any{"id": "adapter_found", "ok": false, "detail": detail})
		command := fmt.Sprintf("cautilus adapter init --repo-root %s", repoRoot)
		if adapterName != nil && strings.TrimSpace(*adapterName) != "" {
			command += " --adapter-name " + *adapterName
		}
		suggestions = append(suggestions, command)
		if len(namedAdapters) > 0 {
			firstNamedAdapter := discoveredNamedAdapters[0].Name
			suggestions = append(suggestions, fmt.Sprintf("Run cautilus doctor --repo-root %s --adapter-name %s to validate a named adapter directly.", repoRoot, firstNamedAdapter))
			suggestions = append(suggestions, fmt.Sprintf("Run cautilus adapter resolve --repo-root %s --adapter-name %s to inspect the named adapter path.", repoRoot, firstNamedAdapter))
			suggestions = append(suggestions, "Add a default .agents/cautilus-adapter.yaml only if you want plain `cautilus doctor` to validate one unnamed adapter without `--adapter-name`.")
		}
		for _, warning := range payload.Warnings {
			suggestions = append(suggestions, warning)
		}
		result := baseResult()
		if len(namedAdapters) > 0 {
			result["status"] = "missing_default_adapter"
			result["summary"] = "Default adapter missing, but named adapters are available."
			result["named_adapters"] = namedAdapters
		} else {
			result["status"] = "missing_adapter"
			result["summary"] = "Adapter missing."
		}
		result["ready"] = false
		return AttachDoctorGuidance(result, repoRoot, "repo", adapterName), 1, nil
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
		return AttachDoctorGuidance(result, repoRoot, "repo", adapterName), 1, nil
	}
	checks = append(checks, map[string]any{"id": "adapter_valid", "ok": true, "detail": "Adapter passed schema validation."})
	data := payload.Data
	appendFieldCheck(&checks, &suggestions, "repo_name", strings.TrimSpace(stringOrEmpty(data["repo"])) != "", "Adapter declares repo.", "Adapter is missing a repo name.", "Set adapter.repo to the host repo name.")
	appendFieldCheck(&checks, &suggestions, "evaluation_surfaces", len(stringArrayOrEmpty(data["evaluation_surfaces"])) > 0, "Adapter declares evaluation surfaces.", "Adapter is missing evaluation_surfaces.", "Add at least one evaluation_surfaces entry that states what the adapter judges.")
	appendFieldCheck(&checks, &suggestions, "baseline_options", len(stringArrayOrEmpty(data["baseline_options"])) > 0, "Adapter declares baseline options.", "Adapter is missing baseline_options.", "Add at least one baseline_options entry so comparisons stay explicit.")
	automatedCommands := len(stringArrayOrEmpty(data["iterate_command_templates"])) > 0 ||
		len(stringArrayOrEmpty(data["eval_test_command_templates"])) > 0 ||
		len(stringArrayOrEmpty(data["held_out_command_templates"])) > 0 ||
		len(stringArrayOrEmpty(data["comparison_command_templates"])) > 0 ||
		len(stringArrayOrEmpty(data["full_gate_command_templates"])) > 0
	hasVariants := len(arrayOrEmpty(data["executor_variants"])) > 0
	appendFieldCheck(&checks, &suggestions, "execution_surface", automatedCommands || hasVariants, "Adapter declares runnable command templates or executor variants.", "Adapter has no command templates or executor variants yet.", "Add at least one eval_test/iterate/held_out/comparison/full_gate command template or executor_variants entry.")
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
		result["first_bounded_run"] = LoadFirstBoundedRunGuide(repoRoot)
		result["next_steps"] = []any{
			"Inspect `first_bounded_run` or run `cautilus scenarios --json` to pick one archetype and its first bounded loop.",
		}
		return AttachDoctorGuidance(result, repoRoot, "repo", adapterName), 0, nil
	}
	result["status"] = "incomplete_adapter"
	result["ready"] = false
	result["summary"] = "Adapter exists but is not ready yet."
	return AttachDoctorGuidance(result, repoRoot, "repo", adapterName), 1, nil
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
		return AttachDoctorGuidance(result, repoRoot, "agent-surface", nil), 0, nil
	}
	result["status"] = "missing_agent_surface"
	result["ready"] = false
	result["summary"] = "Local agent-consumable skill surface is not materialized yet."
	return AttachDoctorGuidance(result, repoRoot, "agent-surface", nil), 1, nil
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
		"eval_test_command_templates",
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
