package app

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"testing"
)

func TestExampleInputConstantsValidateAgainstPublishedSchemas(t *testing.T) {
	cases := []struct {
		name     string
		example  string
		schemaAt string
	}{
		{
			name:     "chatbot",
			example:  chatbotExampleInput,
			schemaAt: filepath.Join("..", "..", "fixtures", "scenario-proposals", "chatbot-input.schema.json"),
		},
		{
			name:     "skill_normalize",
			example:  skillNormalizeExampleInput,
			schemaAt: filepath.Join("..", "..", "fixtures", "scenario-proposals", "skill-input.schema.json"),
		},
		{
			name:     "workflow",
			example:  workflowExampleInput,
			schemaAt: filepath.Join("..", "..", "fixtures", "scenario-proposals", "workflow-input.schema.json"),
		},
		{
			name:     "skill_evaluate",
			example:  skillEvaluateExampleInput,
			schemaAt: filepath.Join("..", "..", "fixtures", "skill-evaluation", "input.schema.json"),
		},
		{
			name:     "instruction_surface_evaluate",
			example:  instructionSurfaceEvaluateExampleInput,
			schemaAt: filepath.Join("..", "..", "fixtures", "instruction-surface", "input.schema.json"),
		},
		{
			name:     "report_build",
			example:  reportBuildExampleInput,
			schemaAt: filepath.Join("..", "..", "fixtures", "reports", "report-input.schema.json"),
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			schemaBytes, err := os.ReadFile(tc.schemaAt)
			if err != nil {
				t.Fatalf("read schema %s: %v", tc.schemaAt, err)
			}
			var schema map[string]any
			if err := json.Unmarshal(schemaBytes, &schema); err != nil {
				t.Fatalf("parse schema %s: %v", tc.schemaAt, err)
			}
			var value any
			if err := json.Unmarshal([]byte(tc.example), &value); err != nil {
				t.Fatalf("parse example: %v", err)
			}
			if err := validateAgainstJSONSchema(schema, value, "root"); err != nil {
				t.Fatalf("example failed schema %s: %v", tc.schemaAt, err)
			}
		})
	}
}

func TestFixtureExamplesValidateAgainstPublishedSchemas(t *testing.T) {
	cases := []struct {
		name     string
		example  string
		schemaAt string
	}{
		{
			name:     "workbench_instance_catalog",
			example:  filepath.Join("..", "..", "fixtures", "workbench-instance-discovery", "example-catalog.json"),
			schemaAt: filepath.Join("..", "..", "fixtures", "workbench-instance-discovery", "catalog.schema.json"),
		},
		{
			name:     "live_run_invocation_request",
			example:  filepath.Join("..", "..", "fixtures", "live-run-invocation", "example-request.json"),
			schemaAt: filepath.Join("..", "..", "fixtures", "live-run-invocation", "request.schema.json"),
		},
		{
			name:     "live_run_invocation_request_batch",
			example:  filepath.Join("..", "..", "fixtures", "live-run-invocation", "example-request-batch.json"),
			schemaAt: filepath.Join("..", "..", "fixtures", "live-run-invocation", "request-batch.schema.json"),
		},
		{
			name:     "live_run_invocation_result_completed",
			example:  filepath.Join("..", "..", "fixtures", "live-run-invocation", "example-result-completed.json"),
			schemaAt: filepath.Join("..", "..", "fixtures", "live-run-invocation", "result.schema.json"),
		},
		{
			name:     "live_run_invocation_result_batch",
			example:  filepath.Join("..", "..", "fixtures", "live-run-invocation", "example-result-batch.json"),
			schemaAt: filepath.Join("..", "..", "fixtures", "live-run-invocation", "result-batch.schema.json"),
		},
		{
			name:     "live_run_invocation_result_blocked",
			example:  filepath.Join("..", "..", "fixtures", "live-run-invocation", "example-result-blocked.json"),
			schemaAt: filepath.Join("..", "..", "fixtures", "live-run-invocation", "result.schema.json"),
		},
		{
			name:     "live_run_evaluator_input",
			example:  filepath.Join("..", "..", "fixtures", "live-run-invocation", "example-evaluator-input.json"),
			schemaAt: filepath.Join("..", "..", "fixtures", "live-run-invocation", "evaluator-input.schema.json"),
		},
		{
			name:     "live_run_evaluator_result",
			example:  filepath.Join("..", "..", "fixtures", "live-run-invocation", "example-evaluator-result.json"),
			schemaAt: filepath.Join("..", "..", "fixtures", "live-run-invocation", "evaluator-result.schema.json"),
		},
		{
			name:     "live_run_turn_request",
			example:  filepath.Join("..", "..", "fixtures", "live-run-invocation", "example-turn-request.json"),
			schemaAt: filepath.Join("..", "..", "fixtures", "live-run-invocation", "turn-request.schema.json"),
		},
		{
			name:     "live_run_simulator_request",
			example:  filepath.Join("..", "..", "fixtures", "live-run-invocation", "example-simulator-request.json"),
			schemaAt: filepath.Join("..", "..", "fixtures", "live-run-invocation", "simulator-request.schema.json"),
		},
		{
			name:     "live_run_simulator_result",
			example:  filepath.Join("..", "..", "fixtures", "live-run-invocation", "example-simulator-result.json"),
			schemaAt: filepath.Join("..", "..", "fixtures", "live-run-invocation", "simulator-result.schema.json"),
		},
		{
			name:     "live_run_turn_result",
			example:  filepath.Join("..", "..", "fixtures", "live-run-invocation", "example-turn-result.json"),
			schemaAt: filepath.Join("..", "..", "fixtures", "live-run-invocation", "turn-result.schema.json"),
		},
		{
			name:     "live_run_transcript",
			example:  filepath.Join("..", "..", "fixtures", "live-run-invocation", "example-transcript.json"),
			schemaAt: filepath.Join("..", "..", "fixtures", "live-run-invocation", "transcript.schema.json"),
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			schemaBytes, err := os.ReadFile(tc.schemaAt)
			if err != nil {
				t.Fatalf("read schema %s: %v", tc.schemaAt, err)
			}
			var schema map[string]any
			if err := json.Unmarshal(schemaBytes, &schema); err != nil {
				t.Fatalf("parse schema %s: %v", tc.schemaAt, err)
			}
			exampleBytes, err := os.ReadFile(tc.example)
			if err != nil {
				t.Fatalf("read example %s: %v", tc.example, err)
			}
			var value any
			if err := json.Unmarshal(exampleBytes, &value); err != nil {
				t.Fatalf("parse example %s: %v", tc.example, err)
			}
			if err := validateAgainstJSONSchema(schema, value, "root"); err != nil {
				t.Fatalf("example failed schema %s: %v", tc.schemaAt, err)
			}
		})
	}
}

// validateAgainstJSONSchema is a minimal JSON Schema checker that mirrors the
// Node-side helper in scripts/agent-runtime/scenario-proposal-schemas.test.mjs.
// It covers the subset used by the checked-in fixture schemas: object with
// required + properties, array with items + minItems, string with const +
// enum, integer/number with minimum, boolean. Unknown keys are ignored, the
// same as the Node helper.
func validateAgainstJSONSchema(schema map[string]any, value any, path string) error {
	typeVal, _ := schema["type"].(string)
	switch typeVal {
	case "object":
		obj, ok := value.(map[string]any)
		if !ok {
			return fmt.Errorf("%s must be an object", path)
		}
		if required, ok := schema["required"].([]any); ok {
			for _, raw := range required {
				key, _ := raw.(string)
				if _, present := obj[key]; !present {
					return fmt.Errorf("%s.%s must exist", path, key)
				}
			}
		}
		if props, ok := schema["properties"].(map[string]any); ok {
			for key, propSchemaAny := range props {
				child, present := obj[key]
				if !present {
					continue
				}
				propSchema, ok := propSchemaAny.(map[string]any)
				if !ok {
					continue
				}
				if err := validateAgainstJSONSchema(propSchema, child, path+"."+key); err != nil {
					return err
				}
			}
		}
	case "array":
		arr, ok := value.([]any)
		if !ok {
			return fmt.Errorf("%s must be an array", path)
		}
		if minItemsAny, ok := schema["minItems"]; ok {
			minItems, _ := minItemsAny.(float64)
			if len(arr) < int(minItems) {
				return fmt.Errorf("%s must contain at least %d item(s)", path, int(minItems))
			}
		}
		itemsSchema, _ := schema["items"].(map[string]any)
		if itemsSchema == nil {
			return nil
		}
		for i, item := range arr {
			if err := validateAgainstJSONSchema(itemsSchema, item, fmt.Sprintf("%s[%d]", path, i)); err != nil {
				return err
			}
		}
	case "string":
		s, ok := value.(string)
		if !ok {
			return fmt.Errorf("%s must be a string", path)
		}
		if constAny, ok := schema["const"]; ok {
			constStr, _ := constAny.(string)
			if s != constStr {
				return fmt.Errorf("%s must equal %q, got %q", path, constStr, s)
			}
		}
		if enumAny, ok := schema["enum"].([]any); ok {
			matched := false
			for _, e := range enumAny {
				if es, ok := e.(string); ok && es == s {
					matched = true
					break
				}
			}
			if !matched {
				return fmt.Errorf("%s must match one of the enum values", path)
			}
		}
	case "integer":
		n, ok := value.(float64)
		if !ok {
			return fmt.Errorf("%s must be a number", path)
		}
		if n != float64(int64(n)) {
			return fmt.Errorf("%s must be an integer", path)
		}
		if minAny, ok := schema["minimum"]; ok {
			min, _ := minAny.(float64)
			if n < min {
				return fmt.Errorf("%s must be >= %v", path, min)
			}
		}
	case "number":
		n, ok := value.(float64)
		if !ok {
			return fmt.Errorf("%s must be a number", path)
		}
		if minAny, ok := schema["minimum"]; ok {
			min, _ := minAny.(float64)
			if n < min {
				return fmt.Errorf("%s must be >= %v", path, min)
			}
		}
	case "boolean":
		if _, ok := value.(bool); !ok {
			return fmt.Errorf("%s must be a boolean", path)
		}
	}
	return nil
}
