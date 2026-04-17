package app

const chatbotExampleInput = `{
  "schemaVersion": "cautilus.chatbot_normalization_inputs.v1",
  "conversationSummaries": [
    {
      "threadKey": "thread-example",
      "lastObservedAt": "2026-04-11T00:00:00.000Z",
      "records": [
        {"actorKind": "user", "text": "Please review this repo."},
        {"actorKind": "user", "text": "Wait, which repo?"}
      ]
    }
  ],
  "runSummaries": []
}
`

const skillNormalizeExampleInput = `{
  "schemaVersion": "cautilus.skill_normalization_inputs.v2",
  "evaluationRuns": [
    {
      "targetKind": "public_skill",
      "targetId": "example",
      "displayName": "example",
      "surface": "smoke_scenario",
      "startedAt": "2026-04-11T00:00:00.000Z",
      "status": "failed",
      "summary": "The example skill stopped producing a bounded execution plan."
    }
  ]
}
`

const workflowExampleInput = `{
  "schemaVersion": "cautilus.workflow_normalization_inputs.v1",
  "evaluationRuns": [
    {
      "targetKind": "cli_workflow",
      "targetId": "example-workflow",
      "displayName": "Example Workflow",
      "surface": "example_surface",
      "startedAt": "2026-04-11T00:00:00.000Z",
      "status": "blocked",
      "summary": "Example workflow stalled on the same step twice without state change.",
      "blockerKind": "repeated_screen_no_progress",
      "blockedSteps": ["step_one", "step_one"]
    }
  ]
}
`

const skillEvaluateExampleInput = `{
  "schemaVersion": "cautilus.skill_evaluation_inputs.v1",
  "skillId": "example",
  "skillDisplayName": "example",
  "evaluations": [
    {
      "evaluationId": "trigger-example-positive",
      "targetKind": "public_skill",
      "targetId": "example",
      "displayName": "example",
      "evaluationKind": "trigger",
      "prompt": "Run the example skill.",
      "startedAt": "2026-04-14T00:00:00.000Z",
      "expectedTrigger": "must_invoke",
      "expectedRouting": {
        "selectedSkill": "example"
      },
      "invoked": true,
      "summary": "The prompt clearly called for the example skill and it was invoked.",
      "routingDecision": {
        "selectedSkill": "example",
        "selectedSupport": null,
        "firstToolCall": "example --repo-root .",
        "reasonSummary": "The prompt directly called for the example skill."
      },
      "instructionSurface": {
        "surfaceLabel": "workspace_checked_in",
        "files": [
          {
            "path": "AGENTS.md",
            "sourceKind": "workspace_default",
            "artifactPath": "artifacts/instruction-surface/AGENTS.md"
          }
        ]
      }
    }
  ]
}
`

func hasExampleInputFlag(args []string) bool {
	for _, arg := range args {
		if arg == "--example-input" {
			return true
		}
	}
	return false
}
