package runtime

// Archetype catalog for `cautilus scenarios`.
//
// This table is the user-facing pointer into the three first-class
// evaluation archetypes fixed in docs/specs/archetype-boundary.spec.md.
// It stays next to the normalize helpers on purpose: adding a new
// first-class archetype means updating proposals.go AND this catalog in
// the same slice (see follow-up 3 in the archetype-boundary spec).

const ScenarioCatalogSchema = "cautilus.scenarios.v1"

type ScenarioCatalogEntry struct {
	Archetype      string `json:"archetype"`
	Summary        string `json:"summary"`
	ExampleInput   string `json:"exampleInput"`
	NextStepCLI    string `json:"nextStepCli"`
	ContractDoc    string `json:"contractDoc"`
	InputSchema    string `json:"inputSchema"`
	BehaviorFocus  string `json:"behaviorFocus"`
}

type ScenarioCatalog struct {
	SchemaVersion string                 `json:"schemaVersion"`
	Archetypes    []ScenarioCatalogEntry `json:"archetypes"`
}

func LoadScenarioCatalog() ScenarioCatalog {
	return ScenarioCatalog{
		SchemaVersion: ScenarioCatalogSchema,
		Archetypes: []ScenarioCatalogEntry{
			{
				Archetype:     "chatbot",
				Summary:       "Multi-turn conversational behavior inside a single session.",
				ExampleInput:  "fixtures/scenario-proposals/chatbot-consumer-input.json",
				NextStepCLI:   "cautilus scenario normalize chatbot --input <logs.json>",
				ContractDoc:   "docs/contracts/chatbot-normalization.md",
				InputSchema:   "cautilus.chatbot_normalization_inputs.v1",
				BehaviorFocus: "follow-up, context recovery, preference retention",
			},
			{
				Archetype:     "skill",
				Summary:       "Single skill or agent invocation: trigger, task execution, and validation surfaces.",
				ExampleInput:  "fixtures/scenario-proposals/skill-validation-input.json",
				NextStepCLI:   "cautilus scenario normalize skill --input <summary.json>",
				ContractDoc:   "docs/contracts/skill-normalization.md",
				InputSchema:   "cautilus.skill_normalization_inputs.v2",
				BehaviorFocus: "validation, trigger selection, execution quality",
			},
			{
				Archetype:     "workflow",
				Summary:       "Stateful automation that persists across invocations and must recover from known blockers.",
				ExampleInput:  "fixtures/scenario-proposals/workflow-input.json",
				NextStepCLI:   "cautilus scenario normalize workflow --input <workflow-runs.json>",
				ContractDoc:   "docs/contracts/workflow-normalization.md",
				InputSchema:   "cautilus.workflow_normalization_inputs.v1",
				BehaviorFocus: "operator workflow recovery",
			},
		},
	}
}
