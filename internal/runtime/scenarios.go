package runtime

import "fmt"

// Archetype catalog for `cautilus scenarios`.
//
// This table is the user-facing pointer into the three first-class
// evaluation archetypes fixed in docs/specs/archetype-boundary.spec.md.
// It stays next to the normalize helpers on purpose: adding a new
// first-class archetype means updating proposals.go AND this catalog in
// the same slice. The Source Guard table in the spec only proves named
// rows exist; widening proposals.go without a matching entry here will
// pass `npm run lint` and silently leave the new archetype invisible
// to `cautilus scenarios`. See the Adding-A-New-First-Class-Archetype
// walkthrough in the spec for the ordered checklist.

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
	return FirstBoundedRunGuide{
		Summary:          "Pick one preset, then complete one bounded eval test -> review path instead of stopping at doctor.",
		DiscoveryCommand: "cautilus scenarios --json",
		DecisionLoopCommands: []string{
			fmt.Sprintf("cautilus eval test --repo-root %s --fixture <fixture.json> --output-dir /tmp/cautilus-first-run", repoRoot),
			fmt.Sprintf("cautilus review prepare-input --repo-root %s --report-file /tmp/cautilus-first-run/report.json", repoRoot),
			fmt.Sprintf("cautilus review variants --repo-root %s --workspace %s --output-dir /tmp/cautilus-first-review", repoRoot, repoRoot),
		},
		Archetypes: LoadScenarioCatalog().Archetypes,
	}
}
