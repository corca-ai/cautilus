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

const evalEvaluateExampleInput = `{
  "schemaVersion": "cautilus.evaluation_observed.v1",
  "suiteId": "instruction-surface-example",
  "suiteDisplayName": "Instruction Surface Example",
  "evaluations": [
    {
      "evaluationId": "compact-agents-routing",
      "displayName": "Compact AGENTS routing",
      "prompt": "User request: continue from docs/internal/handoff.md and implement the next slice. Read the repo instructions first, then identify both the startup bootstrap helper and the durable work skill you would use for this implementation task.",
      "startedAt": "2026-04-18T00:00:00.000Z",
      "observationStatus": "observed",
      "summary": "Started from AGENTS.md, used discovery as the bootstrap helper, and then selected the durable work skill.",
      "entryFile": "AGENTS.md",
      "loadedInstructionFiles": ["AGENTS.md"],
      "loadedSupportingFiles": ["docs/internal/handoff.md"],
      "routingDecision": {
        "selectedSkill": "impl",
        "bootstrapHelper": "find-skills",
        "workSkill": "impl",
        "firstToolCall": "find-skills --repo-root ."
      },
      "instructionSurface": {
        "surfaceLabel": "compact_agents",
        "files": [
          {
            "path": "AGENTS.md",
            "kind": "file",
            "sourceKind": "workspace_default"
          }
        ]
      },
      "expectedEntryFile": "AGENTS.md",
      "requiredInstructionFiles": ["AGENTS.md"],
      "requiredSupportingFiles": ["docs/internal/handoff.md"],
      "expectedRouting": {
        "bootstrapHelper": "find-skills",
        "workSkill": "impl",
        "firstToolCallPattern": "find-skills"
      },
      "artifactRefs": []
    }
  ]
}
`

const claimDiscoverExampleOutput = `{
  "candidateCount": 3,
  "claimCandidates": [
    {
      "claimId": "claim-readme-md-3",
      "nextAction": "Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.",
      "proofLayer": "human-auditable",
      "sourceRefs": [
        {
          "excerpt": "This tool emits a human-auditable setup checklist.",
          "line": 3,
          "path": "README.md"
        }
      ],
      "summary": "This tool emits a human-auditable setup checklist.",
      "whyThisLayer": "The claim can be checked by reading current source, docs, or generated artifacts."
    },
    {
      "claimId": "claim-readme-md-4",
      "nextAction": "Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.",
      "proofLayer": "deterministic",
      "sourceRefs": [
        {
          "excerpt": "The deterministic unit test suite proves the parser accepts valid packets.",
          "line": 4,
          "path": "README.md"
        }
      ],
      "summary": "The deterministic unit test suite proves the parser accepts valid packets.",
      "whyThisLayer": "The claim names a deterministic gate or static contract that should be protected outside Cautilus eval."
    },
    {
      "claimId": "claim-agents-md-3",
      "nextAction": "Create a host-owned repo/whole-repo fixture and run it through cautilus eval test.",
      "proofLayer": "cautilus-eval",
      "recommendedEvalSurface": "repo/whole-repo",
      "sourceRefs": [
        {
          "excerpt": "Agents must follow the repo operating contract before changing code.",
          "line": 3,
          "path": "AGENTS.md"
        }
      ],
      "summary": "Agents must follow the repo operating contract before changing code.",
      "whyThisLayer": "The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence."
    }
  ],
  "discoveryMode": "deterministic-source-inventory",
  "nextRecommended": "Turn cautilus-eval candidates into host-owned eval fixtures; keep deterministic candidates in the repo's normal test or CI gates.",
  "nonVerdictNotice": "This packet is a proof plan, not proof that the claims are true.",
  "schemaVersion": "cautilus.claim_proof_plan.v1",
  "sourceCount": 2,
  "sourceInventory": [
    {
      "kind": "readme",
      "path": "README.md",
      "status": "read"
    },
    {
      "kind": "repo-instructions",
      "path": "AGENTS.md",
      "status": "read"
    }
  ],
  "sourceRoot": "."
}
`

const reportBuildExampleInput = `{
  "schemaVersion": "cautilus.report_inputs.v1",
  "candidate": "feature/recovery-guidance",
  "baseline": "origin/main",
  "intent": "The operator should understand the next safe recovery step without guesswork.",
  "commands": [
    {
      "mode": "held_out",
      "command": "cautilus doctor --repo-root /tmp/repo"
    }
  ],
  "modeRuns": [
    {
      "mode": "held_out",
      "status": "passed"
    }
  ],
  "humanReviewFindings": [
    {
      "severity": "concern",
      "message": "The first recovery step is still implicit for a first-time operator.",
      "path": "docs/specs/review.spec.md"
    }
  ],
  "recommendation": "defer"
}
`

const scenarioConversationReviewExampleInput = `{
  "schemaVersion": "cautilus.scenario_conversation_review_inputs.v1",
  "windowDays": 14,
  "families": ["fast_regression"],
  "conversationSummaries": [
    {
      "threadKey": "thread-1",
      "lastObservedAt": "2026-04-09T21:00:00.000Z",
      "records": [
        {"actorKind": "user", "text": "retro 먼저 해주세요"},
        {"actorKind": "assistant", "text": "retro를 먼저 정리하겠습니다."},
        {"actorKind": "user", "text": "이제 review로 돌아가죠"}
      ]
    }
  ],
  "proposalCandidates": [
    {
      "proposalKey": "review-after-retro",
      "title": "Refresh review-after-retro scenario from recent activity",
      "family": "fast_regression",
      "name": "Review After Retro",
      "description": "The user pivots from retro back to review in one thread.",
      "brief": "Recent activity shows a retro turn followed by a review turn.",
      "simulatorTurns": ["retro 먼저 해주세요", "이제 review로 돌아가죠"],
      "evidence": [
        {
          "sourceKind": "human_conversation",
          "title": "review after retro",
          "threadKey": "thread-1",
          "observedAt": "2026-04-09T21:00:00.000Z",
          "messages": ["retro 먼저 해주세요", "이제 review로 돌아가죠"]
        }
      ]
    }
  ],
  "existingScenarioRegistry": [
    {
      "scenarioId": "review-after-retro",
      "scenarioKey": "review-after-retro",
      "family": "fast_regression"
    }
  ],
  "scenarioCoverage": [
    {
      "scenarioKey": "review-after-retro",
      "recentResultCount": 2
    }
  ],
  "now": "2026-04-11T00:00:00.000Z"
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

func hasExampleOutputFlag(args []string) bool {
	for _, arg := range args {
		if arg == "--example-output" {
			return true
		}
	}
	return false
}
