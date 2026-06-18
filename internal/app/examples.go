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
      "claimFingerprint": "sha256:cbdff5252f071715609373d741cef98aebb0c89bd7902356a28e2aa1cbaaa8a3",
      "claimId": "claim-agents-md-3",
      "evidenceRefs": [],
      "evidenceStatus": "unknown",
      "groupHints": [
        "cautilus-eval",
        "repo-instructions",
        "dev/repo"
      ],
      "lifecycle": "new",
      "nextAction": "Create a host-owned dev/repo fixture and run it through cautilus evaluate fixture.",
      "recommendedEvalSurface": "dev/repo",
      "recommendedProof": "cautilus-eval",
      "reviewStatus": "heuristic",
      "sourceRefs": [
        {
          "excerpt": "Agents must follow the repo operating contract before changing code.",
          "line": 3,
          "path": "AGENTS.md"
        }
      ],
      "summary": "Agents must follow the repo operating contract before changing code.",
      "verificationReadiness": "ready-for-proof",
      "whyThisLayer": "The claim depends on model, agent, prompt, skill, workflow, or behavior execution evidence."
    },
    {
      "claimFingerprint": "sha256:bb05425b9156ff8ca84244f268b351d037db8b1a2b977d68b11699deef37551b",
      "claimId": "claim-readme-md-3",
      "evidenceRefs": [],
      "evidenceStatus": "unknown",
      "groupHints": [
        "human-auditable",
        "readme"
      ],
      "lifecycle": "new",
      "nextAction": "Record the source reference and keep it human-auditable; add deterministic or eval proof only if behavior depends on execution.",
      "recommendedProof": "human-auditable",
      "reviewStatus": "heuristic",
      "sourceRefs": [
        {
          "excerpt": "This tool emits a human-auditable setup checklist.",
          "line": 3,
          "path": "README.md"
        }
      ],
      "summary": "This tool emits a human-auditable setup checklist.",
      "verificationReadiness": "ready-for-proof",
      "whyThisLayer": "The claim can be checked by reading current source, docs, or generated artifacts."
    },
    {
      "claimFingerprint": "sha256:cdb76722909d648d2e14cba35846e75225270fbcc416dccd507351c83204afe4",
      "claimId": "claim-readme-md-4",
      "evidenceRefs": [],
      "evidenceStatus": "unknown",
      "groupHints": [
        "deterministic",
        "readme"
      ],
      "lifecycle": "new",
      "nextAction": "Keep or add a repo-owned unit, lint, build, schema, or CI check for this claim.",
      "recommendedProof": "deterministic",
      "reviewStatus": "heuristic",
      "sourceRefs": [
        {
          "excerpt": "The deterministic unit test suite proves the parser accepts valid packets.",
          "line": 4,
          "path": "README.md"
        }
      ],
      "summary": "The deterministic unit test suite proves the parser accepts valid packets.",
      "verificationReadiness": "ready-for-proof",
      "whyThisLayer": "The claim names a deterministic gate or static contract that should be protected outside Cautilus eval."
    }
  ],
  "claimState": {
    "path": ".cautilus/claims/latest.json",
    "pathSource": "default"
  },
  "claimSummary": {
    "byEvidenceStatus": {
      "unknown": 3
    },
    "byLifecycle": {
      "new": 3
    },
    "byRecommendedProof": {
      "cautilus-eval": 1,
      "deterministic": 1,
      "human-auditable": 1
    },
    "byReviewStatus": {
      "heuristic": 3
    },
    "byVerificationReadiness": {
      "ready-for-proof": 3
    }
  },
  "discoveryMode": "deterministic-source-inventory",
  "extractionMode": "heuristic",
  "effectiveScanScope": {
    "adapterFound": false,
    "adapterPath": "",
    "entries": [
      "README.md",
      "AGENTS.md",
      "CLAUDE.md"
    ],
    "exclude": [
      ".git/**",
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "artifacts/**",
      "charness-artifacts/**"
    ],
    "explicitSources": false,
    "include": [],
    "linkedDocDepth": 3,
    "traversal": "entry-markdown-links"
  },
  "nextRecommended": "Turn cautilus-eval candidates into host-owned eval fixtures; keep deterministic candidates in the repo's normal test or CI gates.",
  "nonVerdictNotice": "Discovery creates candidates. A discovered claim is not verified until matching evidence is attached.",
  "schemaVersion": "cautilus.claim_proof_plan.v1",
  "sourceCount": 2,
  "sourceGraph": [],
  "sourceInventory": [
    {
      "depth": 0,
      "kind": "repo-instructions",
      "path": "AGENTS.md",
      "status": "read"
    },
    {
      "depth": 0,
      "kind": "readme",
      "path": "README.md",
      "status": "read"
    }
  ],
  "sourceRoot": "."
}
`

const claimExtractionInputExampleOutput = `{
  "schemaVersion": "cautilus.claim_extraction_input.v1",
  "sourceRoot": ".",
  "gitCommit": "0000000000000000000000000000000000000000",
  "extractionTarget": "first-extraction",
  "effectiveScanScope": {
    "entries": ["README.md", "AGENTS.md", "CLAUDE.md"],
    "traversal": "entry-markdown-links"
  },
  "sources": [
    {
      "path": "README.md",
      "kind": "readme",
      "depth": 0,
      "audienceHint": "user",
      "audienceHintSource": "default",
      "contentHash": "sha256:0000000000000000000000000000000000000000000000000000000000000000",
      "status": "extract"
    }
  ],
  "sourceCount": 1,
  "sourceGraph": [],
  "template": {
    "templateVersion": "v2",
    "templateHash": "sha256:0000000000000000000000000000000000000000000000000000000000000000",
    "claimDefinition": "A behavior claim is a declared promise about how the product, repo, or workflow behaves that could in principle be proven or falsified. Actively include design-principle claims (\"X is a first-class ...\") and negative or scope-boundary claims (\"not for ...\", \"does not ...\").",
    "nonClaimConventions": {
      "nonClaimSectionHeadings": ["Deferred Decisions", "Rejected Alternatives"],
      "portableRules": ["Frontmatter is metadata, not a claim."]
    },
    "excerptRules": "Every claim must carry at least one verbatim excerpt with exactly one excerpt marked primary: true.",
    "routingGuidance": "Route by the claim's enabler: deterministic when a static repo-owned check makes it true, human-auditable only when no such check could, cautilus-eval when it is true only because of model/agent/prompt/skill/workflow/behavior execution.",
    "epicGuidance": "Place every claim in the claim graph: primaryEpic is its home epic, supportingEpics lists every epic it supports (including primaryEpic). Choose ids from epicCatalog when non-empty; do not derive the epic from claimSemanticGroup.",
    "epicCatalog": [
      {
        "epicId": "D1-discovery",
        "branch": "Discover",
        "title": "Claim discovery turns adapter-owned docs into bounded proof-plan candidates",
        "userStory": "As a maintainer, I want discovery to turn my docs into source-ref-backed claim candidates, so that I start from evidence rather than a blank page."
      }
    ],
    "uncertaintyRule": "When unsure whether text is a claim, emit it with verificationReadiness: blocked and an unresolvedQuestions entry instead of silently dropping it."
  },
  "bounds": {
    "maxClaimsPerSource": 80,
    "maxExcerptChars": 600
  },
  "outputSchema": "cautilus.claim_extraction_result.v1",
  "confirmationNotice": "Scan-scope confirmation does not authorize agent extraction; running the extraction is an LLM activity behind a separate extraction-budget confirmation."
}
`

const claimExtractionResultExampleInput = `{
  "schemaVersion": "cautilus.claim_extraction_result.v1",
  "extractionInputRef": {
    "path": "extraction-input.json",
    "templateHash": "sha256:0000000000000000000000000000000000000000000000000000000000000000"
  },
  "runtime": {
    "model": "model-id-when-available",
    "agent": "cautilus-agent"
  },
  "claims": [
    {
      "summary": "Commands emit durable packets with enough state for the next agent to resume.",
      "excerpts": [
        {
          "path": "README.md",
          "line": 12,
          "verbatim": "every command writes a durable packet that the next agent can resume from",
          "primary": true
        }
      ],
      "recommendedProof": "deterministic",
      "verificationReadiness": "ready-for-proof",
      "claimAudience": "user",
      "claimSemanticGroup": "Packets and reporting",
      "primaryEpic": "D1-discovery",
      "supportingEpics": ["D1-discovery"],
      "unresolvedQuestions": []
    }
  ],
  "skippedSources": []
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
