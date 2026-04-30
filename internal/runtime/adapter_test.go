package runtime

import (
	"strings"
	"testing"
)

func TestValidateAdapterDataAcceptsExplicitInstanceDiscovery(t *testing.T) {
	validated, errors := validateAdapterData(map[string]any{
		"repo": "repo-x",
		"instance_discovery": map[string]any{
			"kind": "explicit",
			"instances": []any{
				map[string]any{
					"id":            "ceal",
					"display_label": "Ceal Production",
					"data_root":     "/Users/operator/.ceal/ceal",
					"paths": map[string]any{
						"scenario_store":         "/Users/operator/.ceal/ceal/scenarios.json",
						"conversation_summaries": "/Users/operator/.ceal/ceal/human-conversations/normalized",
					},
				},
			},
		},
	})
	if len(errors) != 0 {
		t.Fatalf("expected explicit instance_discovery to validate, got %v", errors)
	}
	instanceDiscovery, ok := validated["instance_discovery"].(map[string]any)
	if !ok {
		t.Fatalf("expected instance_discovery mapping, got %#v", validated["instance_discovery"])
	}
	if instanceDiscovery["kind"] != "explicit" {
		t.Fatalf("expected explicit kind, got %#v", instanceDiscovery["kind"])
	}
	instances, ok := instanceDiscovery["instances"].([]any)
	if !ok || len(instances) != 1 {
		t.Fatalf("expected one instance, got %#v", instanceDiscovery["instances"])
	}
	first, ok := instances[0].(map[string]any)
	if !ok {
		t.Fatalf("expected instance mapping, got %#v", instances[0])
	}
	if first["display_label"] != "Ceal Production" {
		t.Fatalf("unexpected display_label: %#v", first["display_label"])
	}
}

func TestValidateAdapterDataAcceptsCommandInstanceDiscovery(t *testing.T) {
	validated, errors := validateAdapterData(map[string]any{
		"repo": "repo-x",
		"instance_discovery": map[string]any{
			"kind":             "command",
			"command_template": "node scripts/consumer/discover-live-eval-instances.mjs --repo-root {repo_root} --adapter-path {adapter_path}",
			"required_prerequisites": []any{
				"Install the consumer runtime before discovery.",
			},
		},
	})
	if len(errors) != 0 {
		t.Fatalf("expected command instance_discovery to validate, got %v", errors)
	}
	instanceDiscovery, ok := validated["instance_discovery"].(map[string]any)
	if !ok {
		t.Fatalf("expected instance_discovery mapping, got %#v", validated["instance_discovery"])
	}
	if instanceDiscovery["kind"] != "command" {
		t.Fatalf("expected command kind, got %#v", instanceDiscovery["kind"])
	}
	if instanceDiscovery["command_template"] == "" {
		t.Fatalf("expected command_template, got %#v", instanceDiscovery)
	}
}

func TestValidateAdapterDataRejectsExplicitInstanceDiscoveryWithoutLocation(t *testing.T) {
	_, errors := validateAdapterData(map[string]any{
		"instance_discovery": map[string]any{
			"kind": "explicit",
			"instances": []any{
				map[string]any{
					"id":            "ceal",
					"display_label": "Ceal Production",
				},
			},
		},
	})
	if len(errors) == 0 {
		t.Fatal("expected missing explicit instance location to fail validation")
	}
	found := false
	for _, err := range errors {
		if strings.Contains(err, "must include data_root, paths, or both") {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("expected location validation error, got %v", errors)
	}
}

func TestValidateAdapterDataAcceptsLiveRunInvocation(t *testing.T) {
	validated, errors := validateAdapterData(map[string]any{
		"live_run_invocation": map[string]any{
			"command_template":                      "cautilus eval live run --repo-root {repo_root} --adapter {adapter_path} --instance-id {instance_id} --request-file {request_file} --output-file {output_file}",
			"consumer_command_template":             "node scripts/consumer/run-live-instance-scenario.mjs --repo-root {repo_root} --adapter-path {adapter_path} --instance-id {instance_id} --request-file {request_file} --output-file {output_file}",
			"consumer_single_turn_command_template": "node scripts/consumer/run-live-turn.mjs --repo-root {repo_root} --adapter-path {adapter_path} --instance-id {instance_id} --request-file {request_file} --turn-request-file {turn_request_file} --turn-result-file {turn_result_file}",
			"workspace_prepare_command_template":    "node scripts/consumer/prepare-live-run-workspace.mjs --repo-root {repo_root} --adapter-path {adapter_path} --instance-id {instance_id} --request-file {request_file} --workspace-dir {workspace_dir}",
			"consumer_evaluator_command_template":   "node scripts/consumer/evaluate-live-run.mjs --repo-root {repo_root} --adapter-path {adapter_path} --request-file {request_file} --input-file {evaluator_input_file} --output-file {evaluation_output_file}",
			"simulator_persona_command_template":    "cautilus eval live run-simulator-persona --workspace {repo_root} --simulator-request-file {simulator_request_file} --simulator-result-file {simulator_result_file} --backend fixture --fixture-results-file fixtures/live-run/persona-fixture.json",
			"required_prerequisites": []any{
				"Keep the invocation command bounded to one selected local instance.",
			},
		},
	})
	if len(errors) != 0 {
		t.Fatalf("expected live_run_invocation to validate, got %v", errors)
	}
	liveRunInvocation, ok := validated["live_run_invocation"].(map[string]any)
	if !ok {
		t.Fatalf("expected live_run_invocation mapping, got %#v", validated["live_run_invocation"])
	}
	if !strings.Contains(liveRunInvocation["command_template"].(string), "{request_file}") {
		t.Fatalf("expected request-file placeholder to survive normalization, got %#v", liveRunInvocation["command_template"])
	}
	if !strings.Contains(liveRunInvocation["consumer_command_template"].(string), "scripts/consumer/run-live-instance-scenario.mjs") {
		t.Fatalf("expected consumer command template to survive normalization, got %#v", liveRunInvocation["consumer_command_template"])
	}
	if !strings.Contains(liveRunInvocation["consumer_single_turn_command_template"].(string), "scripts/consumer/run-live-turn.mjs") {
		t.Fatalf("expected consumer single-turn command template to survive normalization, got %#v", liveRunInvocation["consumer_single_turn_command_template"])
	}
	if !strings.Contains(liveRunInvocation["workspace_prepare_command_template"].(string), "{workspace_dir}") {
		t.Fatalf("expected workspace prepare command template to survive normalization, got %#v", liveRunInvocation["workspace_prepare_command_template"])
	}
	if !strings.Contains(liveRunInvocation["consumer_evaluator_command_template"].(string), "scripts/consumer/evaluate-live-run.mjs") {
		t.Fatalf("expected consumer evaluator command template to survive normalization, got %#v", liveRunInvocation["consumer_evaluator_command_template"])
	}
	if !strings.Contains(liveRunInvocation["simulator_persona_command_template"].(string), "cautilus eval live run-simulator-persona") {
		t.Fatalf("expected simulator persona command template to survive normalization, got %#v", liveRunInvocation["simulator_persona_command_template"])
	}
}

func TestValidateAdapterDataAcceptsClaimDiscoveryConfig(t *testing.T) {
	validated, errors := validateAdapterData(map[string]any{
		"version": float64(1),
		"repo":    "demo",
		"claim_discovery": map[string]any{
			"entries":               []any{"README.md", "AGENTS.md"},
			"linked_markdown_depth": float64(3),
			"include":               []any{"docs/**/*.md"},
			"exclude":               []any{"artifacts/**"},
			"state_path":            ".cautilus/claims/latest.json",
			"evidence_roots":        []any{"artifacts/self-dogfood/eval/latest"},
			"audience_hints": map[string]any{
				"user":      []any{"README.md", "docs/guides/**"},
				"developer": []any{"AGENTS.md", "docs/internal/**"},
			},
			"semantic_groups": []any{
				map[string]any{
					"label": "Product promises",
					"terms": []any{"promise", "user"},
				},
			},
		},
	})
	if len(errors) > 0 {
		t.Fatalf("validateAdapterData returned errors: %#v", errors)
	}
	claimDiscovery := asMap(validated["claim_discovery"])
	if claimDiscovery["linked_markdown_depth"] != 3 {
		t.Fatalf("expected linked_markdown_depth=3, got %#v", claimDiscovery)
	}
	if claimDiscovery["state_path"] != ".cautilus/claims/latest.json" {
		t.Fatalf("expected state path in claim_discovery, got %#v", claimDiscovery)
	}
	hints := asMap(claimDiscovery["audience_hints"])
	if len(stringArrayOrEmpty(hints["user"])) != 2 || len(stringArrayOrEmpty(hints["developer"])) != 2 {
		t.Fatalf("expected audience hints to survive normalization, got %#v", hints)
	}
	groups := arrayOrEmpty(claimDiscovery["semantic_groups"])
	if len(groups) != 1 || asMap(groups[0])["label"] != "Product promises" {
		t.Fatalf("expected semantic groups to survive normalization, got %#v", groups)
	}
}

func TestValidateAdapterDataRejectsInvalidClaimDiscoverySemanticGroups(t *testing.T) {
	_, errors := validateAdapterData(map[string]any{
		"claim_discovery": map[string]any{
			"semantic_groups": []any{
				map[string]any{
					"label": "Missing terms",
				},
			},
		},
	})
	if len(errors) == 0 {
		t.Fatalf("expected invalid claim_discovery semantic group to fail")
	}
}

func TestValidateAdapterDataRejectsUnknownClaimDiscoveryAudienceHint(t *testing.T) {
	_, errors := validateAdapterData(map[string]any{
		"claim_discovery": map[string]any{
			"audience_hints": map[string]any{
				"operator": []any{"docs/**"},
			},
		},
	})
	if len(errors) == 0 {
		t.Fatalf("expected unknown claim_discovery audience hint to fail")
	}
}

func TestValidateAdapterDataRejectsNegativeClaimDiscoveryDepth(t *testing.T) {
	_, errors := validateAdapterData(map[string]any{
		"claim_discovery": map[string]any{
			"linked_markdown_depth": float64(-1),
		},
	})
	if len(errors) == 0 {
		t.Fatalf("expected claim_discovery depth validation error")
	}
}

func TestValidateAdapterDataRejectsLiveRunInvocationWithoutCommandTemplate(t *testing.T) {
	_, errors := validateAdapterData(map[string]any{
		"live_run_invocation": map[string]any{
			"required_prerequisites": []any{
				"Missing command template should fail validation.",
			},
		},
	})
	if len(errors) == 0 {
		t.Fatal("expected missing live_run_invocation command template to fail validation")
	}
	found := false
	for _, err := range errors {
		if strings.Contains(err, "live_run_invocation.command_template must be a non-empty string") {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("expected live_run_invocation command validation error, got %v", errors)
	}
}

func TestScaffoldAdapterLeavesSlotsEmptyWithoutScenario(t *testing.T) {
	scaffold := ScaffoldAdapter(t.TempDir(), "repo-x", "")
	evalSlot, ok := scaffold["eval_test_command_templates"].([]string)
	if !ok || len(evalSlot) != 0 {
		t.Fatalf("expected empty eval_test_command_templates without scenario, got %#v", scaffold["eval_test_command_templates"])
	}
	if surfaces, ok := scaffold["evaluation_surfaces"].([]string); !ok || len(surfaces) != 2 {
		t.Fatalf("expected generic evaluation_surfaces without scenario, got %#v", scaffold["evaluation_surfaces"])
	}
}

func TestScaffoldAdapterSkillPrefillsEvalTestSlot(t *testing.T) {
	scaffold := ScaffoldAdapter(t.TempDir(), "repo-x", "skill")
	slot, ok := scaffold["eval_test_command_templates"].([]string)
	if !ok || len(slot) == 0 {
		t.Fatalf("expected eval_test_command_templates to be pre-filled for skill scenario, got %#v", scaffold["eval_test_command_templates"])
	}
	if !strings.Contains(slot[0], "--fixture fixtures/eval/dev/skill/") {
		t.Fatalf("expected eval_test_command_templates to point at fixtures/eval/dev/skill/, got %#v", slot[0])
	}
	surfaces, ok := scaffold["evaluation_surfaces"].([]string)
	if !ok || len(surfaces) == 0 {
		t.Fatalf("expected evaluation_surfaces to be set, got %#v", scaffold["evaluation_surfaces"])
	}
	found := false
	for _, surface := range surfaces {
		if strings.Contains(surface, "skill") {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("expected evaluation_surfaces to mention skill, got %#v", surfaces)
	}
}
