package runtime

import "path/filepath"

// Scenario normalization catalog for `cautilus scenarios`.
//
// This table is the user-facing pointer into the three proposal-input
// normalization families that still feed `scenario normalize`.
// It stays next to the normalize helpers on purpose: adding a new family means
// updating proposals.go AND this catalog in the same slice.
// Widening proposals.go without a matching entry here will pass `npm run lint`
// and silently leave the new family invisible to `cautilus scenarios`.

const ScenarioCatalogSchema = "cautilus.scenarios.v1"

type ScenarioCatalogEntry struct {
	Archetype       string `json:"archetype"`
	Summary         string `json:"summary"`
	ExampleInput    string `json:"exampleInput"`
	ExampleInputCLI string `json:"exampleInputCli"`
	NextStepCLI     string `json:"nextStepCli"`
	ContractDoc     string `json:"contractDoc"`
	InputSchema     string `json:"inputSchema"`
	BehaviorFocus   string `json:"behaviorFocus"`
}

type ScenarioCatalog struct {
	SchemaVersion string                 `json:"schemaVersion"`
	Archetypes    []ScenarioCatalogEntry `json:"archetypes"`
}

type FirstBoundedRunGuide struct {
	Summary              string                 `json:"summary"`
	DiscoveryCommand     string                 `json:"discoveryCommand"`
	DecisionLoopCommands []string               `json:"decisionLoopCommands"`
	Archetypes           []ScenarioCatalogEntry `json:"archetypes"`
}

func LoadScenarioCatalog() ScenarioCatalog {
	return ScenarioCatalog{
		SchemaVersion: ScenarioCatalogSchema,
		Archetypes: []ScenarioCatalogEntry{
			{
				Archetype:       "chatbot",
				Summary:         "Multi-turn conversational behavior inside a single session.",
				ExampleInput:    "fixtures/scenario-proposals/chatbot-input.json",
				ExampleInputCLI: "cautilus scenario normalize chatbot --example-input",
				NextStepCLI:     "cautilus scenario normalize chatbot --input <logs.json>",
				ContractDoc:     "docs/contracts/chatbot-normalization.md",
				InputSchema:     "cautilus.chatbot_normalization_inputs.v1",
				BehaviorFocus:   "follow-up, context recovery, preference retention",
			},
			{
				Archetype:       "skill",
				Summary:         "Single skill or agent invocation: trigger, task execution, and validation surfaces.",
				ExampleInput:    "fixtures/scenario-proposals/skill-input.json",
				ExampleInputCLI: "cautilus scenario normalize skill --example-input",
				NextStepCLI:     "cautilus scenario normalize skill --input <summary.json>",
				ContractDoc:     "docs/contracts/skill-normalization.md",
				InputSchema:     "cautilus.skill_normalization_inputs.v2",
				BehaviorFocus:   "validation, trigger selection, execution quality",
			},
			{
				Archetype:       "workflow",
				Summary:         "Stateful automation that persists across invocations and must recover from known blockers.",
				ExampleInput:    "fixtures/scenario-proposals/workflow-input.json",
				ExampleInputCLI: "cautilus scenario normalize workflow --example-input",
				NextStepCLI:     "cautilus scenario normalize workflow --input <workflow-runs.json>",
				ContractDoc:     "docs/contracts/workflow-normalization.md",
				InputSchema:     "cautilus.workflow_normalization_inputs.v1",
				BehaviorFocus:   "operator workflow recovery",
			},
		},
	}
}

func LoadFirstBoundedRunGuide(repoRoot string) FirstBoundedRunGuide {
	outputDir := filepath.Join(repoRoot, ".cautilus", "runs", "first-bounded-run")
	return FirstBoundedRunGuide{
		Summary:          "Pick one checked-in fixture, then complete one bounded eval test and packet recheck instead of stopping at doctor.",
		DiscoveryCommand: "cautilus scenarios --json",
		DecisionLoopCommands: []string{
			"cautilus eval test --repo-root " + ShellSingleQuote(repoRoot) + " --fixture <fixture.json> --output-dir " + ShellSingleQuote(outputDir),
			"cautilus eval evaluate --input " + ShellSingleQuote(filepath.Join(outputDir, "eval-observed.json")) + " --output " + ShellSingleQuote(filepath.Join(outputDir, "eval-summary.recheck.json")),
		},
		Archetypes: LoadScenarioCatalog().Archetypes,
	}
}
