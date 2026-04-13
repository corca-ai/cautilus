function promptContext(packet) {
	return {
		objective: packet.objective?.summary || "Improve the target prompt without weakening the validated behavior objective.",
		constraints: Array.isArray(packet.objective?.constraints) ? packet.objective.constraints : [],
		heldOutScenarios: Array.isArray(packet.scenarioSets?.heldOutScenarioSet) ? packet.scenarioSets.heldOutScenarioSet : [],
		targetPath: packet.targetFile?.path || "unknown",
	};
}

export function buildMutationPrompt(packet, parentCandidate, parentPrompt, reflectionBatch, backend) {
	const { objective, constraints, heldOutScenarios, targetPath } = promptContext(packet);
	return [
		"# Task",
		"Return one improved prompt candidate as structured JSON.",
		"",
		"## Constraints",
		"- Output valid JSON matching the provided schema.",
		"- Rewrite the prompt body only; do not describe shell commands or repo edits.",
		"- Preserve working behavior unless the evidence explicitly says it is harmful.",
		"- Prefer concrete operator-facing recovery guidance over generic wording.",
		"- Do not optimize for lower cost by merely making the prompt shorter.",
		"",
		"## Search Context",
		`- backend: ${backend}`,
		`- objective: ${objective}`,
		`- parentCandidateId: ${parentCandidate.id}`,
		`- targetFile: ${targetPath}`,
		`- heldOutScenarioSet: ${heldOutScenarios.join(", ") || "none"}`,
		"",
		"## Guardrails",
		...constraints.map((constraint) => `- ${constraint}`),
		"- Keep the prompt self-contained and legible.",
		"- Do not claim success that the evidence does not support.",
		"",
		"## Reflection Batch",
		JSON.stringify(reflectionBatch, null, 2),
		"",
		"## Current Prompt",
		"```md",
		parentPrompt,
		"```",
		"",
		"## Response Shape",
		"- promptMarkdown: full revised prompt body",
		"- rationaleSummary: 1-2 sentence explanation of what changed and why",
		"- expectedImprovements: list of scenarios or failure modes this candidate should improve",
		"- preservedStrengths: list of strengths intentionally kept from the parent candidate",
		"- riskNotes: list of residual risks that still need held-out validation",
	].join("\n");
}

function mergeParentDescriptor(candidate) {
	return {
		id: candidate.id,
		expectedImprovements: candidate.expectedImprovements || [],
		preservedStrengths: candidate.preservedStrengths || [],
		riskNotes: candidate.riskNotes || [],
	};
}

export function buildMergePrompt(packet, leftCandidate, rightCandidate, leftPrompt, rightPrompt, backend, scenarioIds) {
	const { objective, constraints, heldOutScenarios, targetPath } = promptContext(packet);
	return [
		"# Task",
		"Return one merged prompt candidate as structured JSON.",
		"",
		"## Constraints",
		"- Output valid JSON matching the provided schema.",
		"- Synthesize one coherent prompt body instead of concatenating both prompts verbatim.",
		"- Preserve complementary strengths from both parents when they do not conflict.",
		"- Do not weaken the stronger held-out behaviors already achieved by either parent.",
		"- Do not optimize for lower cost by merely making the prompt shorter.",
		"",
		"## Search Context",
		`- backend: ${backend}`,
		`- objective: ${objective}`,
		`- leftParentCandidateId: ${leftCandidate.id}`,
		`- rightParentCandidateId: ${rightCandidate.id}`,
		`- targetFile: ${targetPath}`,
		`- heldOutScenarioSet: ${heldOutScenarios.join(", ") || "none"}`,
		"",
		"## Merge Goal",
		`- combine complementary held-out strengths across: ${scenarioIds.join(", ") || "none"}`,
		"",
		"## Guardrails",
		...constraints.map((constraint) => `- ${constraint}`),
		"- Keep the prompt self-contained and legible.",
		"- Do not claim success that the evidence does not support.",
		"",
		"## Left Parent",
		JSON.stringify(mergeParentDescriptor(leftCandidate), null, 2),
		"```md",
		leftPrompt,
		"```",
		"",
		"## Right Parent",
		JSON.stringify(mergeParentDescriptor(rightCandidate), null, 2),
		"```md",
		rightPrompt,
		"```",
		"",
		"## Response Shape",
		"- promptMarkdown: full revised prompt body",
		"- rationaleSummary: 1-2 sentence explanation of what changed and why",
		"- expectedImprovements: list of scenarios or failure modes this candidate should improve",
		"- preservedStrengths: list of strengths intentionally kept from the parents",
		"- riskNotes: list of residual risks that still need held-out validation",
	].join("\n");
}
