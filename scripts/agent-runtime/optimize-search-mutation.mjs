import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const TOOL_ROOT = resolve(dirname(new URL(import.meta.url).pathname), "..", "..");
const BIN_PATH = join(TOOL_ROOT, "bin", "cautilus");
const REVIEW_WRAPPER_PATH = join(TOOL_ROOT, "scripts", "agent-runtime", "run-workbench-review-variant.sh");

function writeJson(path, value) {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function writeText(path, value) {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, value, "utf-8");
}

function readJsonFile(path, label) {
	const resolved = resolve(path);
	if (!existsSync(resolved)) {
		throw new Error(`${label} not found: ${resolved}`);
	}
	return JSON.parse(readFileSync(resolved, "utf-8"));
}

function inferScenarioScore(result) {
	if (typeof result?.overallScore === "number") {
		return result.overallScore;
	}
	if (typeof result?.passRate === "number") {
		return result.passRate * 100;
	}
	if (typeof result?.status === "string") {
		return result.status === "passed" ? 100 : 0;
	}
	return null;
}

function toHeldOutEntry(result, mode, candidateId) {
	return {
		candidateId,
		scenarioId: result.scenarioId,
		mode,
		score: inferScenarioScore(result),
		status: result.status || null,
		telemetry: result.telemetry || {},
	};
}

function collectHeldOutEntriesFromResults(resultsPacket, candidateId) {
	const results = Array.isArray(resultsPacket?.results) ? resultsPacket.results : [];
	const mode = resultsPacket?.mode || "held_out";
	return results
		.filter((result) => typeof result?.scenarioId === "string" && result.scenarioId.length > 0)
		.map((result) => toHeldOutEntry(result, mode, candidateId));
}

export function collectModeRunEntries(modeRun, candidateId) {
	if (!["held_out", "full_gate"].includes(modeRun?.mode)) {
		return [];
	}
	const results = Array.isArray(modeRun?.scenarioResults?.results) ? modeRun.scenarioResults.results : [];
	return results
		.filter((result) => typeof result?.scenarioId === "string" && result.scenarioId.length > 0)
		.map((result) => toHeldOutEntry(result, modeRun.mode, candidateId));
}

export function summarizeCandidateTelemetry(entries) {
	let totalCostUsd = 0;
	let totalDurationMs = 0;
	let sawCost = false;
	let sawDuration = false;
	for (const entry of entries) {
		if (typeof entry.telemetry?.cost_usd === "number") {
			sawCost = true;
			totalCostUsd += entry.telemetry.cost_usd;
		}
		if (typeof entry.telemetry?.duration_ms === "number") {
			sawDuration = true;
			totalDurationMs += entry.telemetry.duration_ms;
		}
		if (typeof entry.telemetry?.durationMs === "number") {
			sawDuration = true;
			totalDurationMs += entry.telemetry.durationMs;
		}
	}
	return {
		...(sawCost ? { totalCostUsd } : {}),
		...(sawDuration ? { totalDurationMs } : {}),
	};
}

export function collectTargetSnapshot(targetPath) {
	if (!targetPath || !existsSync(targetPath)) {
		return null;
	}
	const content = readFileSync(targetPath, "utf-8");
	return {
		path: targetPath,
		exists: true,
		sizeBytes: Buffer.byteLength(content),
		lineCount: content === "" ? 0 : content.split("\n").length - 1,
		sha256: createHash("sha256").update(content).digest("hex"),
	};
}

function collectScenarioFeedback(packet, signals, scenarioId) {
	const entry = signals.get(scenarioId) || { buckets: [], feedback: [] };
	return {
		scenarioId,
		buckets: entry.buckets,
		feedback: entry.feedback.slice(0, 3),
	};
}

function scenarioSignalMap(packet, feedbackSignals) {
	const report = packet.optimizeInput?.report || {};
	const signals = new Map();
	const buckets = ["regressed", "noisy", "improved", "unchanged"];
	for (const bucket of buckets) {
		const items = Array.isArray(report[bucket]) ? report[bucket] : [];
		addBucketSignals(signals, bucket, items);
	}
	addFeedbackSignals(signals, feedbackSignals, packet.scenarioSets?.trainScenarioSet || []);
	return signals;
}

function addBucketSignals(signals, bucket, items) {
	for (const item of items) {
		const scenarioId = typeof item === "string" ? item : item?.scenarioId;
		if (!scenarioId) {
			continue;
		}
		const entry = signals.get(scenarioId) || { scenarioId, buckets: [], feedback: [] };
		entry.buckets.push(bucket);
		if (typeof item?.reason === "string" && item.reason.length > 0) {
			entry.feedback.push(item.reason);
		}
		signals.set(scenarioId, entry);
	}
}

function addFeedbackSignals(signals, feedbackSignals, trainScenarioSet) {
	for (const feedback of feedbackSignals) {
		for (const scenarioId of trainScenarioSet) {
			if (typeof scenarioId !== "string" || !feedback.includes(scenarioId)) {
				continue;
			}
			const entry = signals.get(scenarioId) || { scenarioId, buckets: [], feedback: [] };
			entry.feedback.push(feedback);
			signals.set(scenarioId, entry);
		}
	}
}

function buildReflectionBatch(packet, feedbackSignals) {
	const scenarioIds = Array.isArray(packet.scenarioSets?.trainScenarioSet) ? packet.scenarioSets.trainScenarioSet : [];
	const limit = Math.max(1, packet.mutationConfig?.trainScenarioLimit || 1);
	const signals = scenarioSignalMap(packet, feedbackSignals);
	return scenarioIds.slice(0, limit).map((scenarioId) => collectScenarioFeedback(packet, signals, scenarioId));
}

function mutationOutputSchema() {
	return {
		type: "object",
		additionalProperties: false,
		required: [
			"promptMarkdown",
			"rationaleSummary",
			"expectedImprovements",
			"preservedStrengths",
			"riskNotes",
		],
		properties: {
			promptMarkdown: { type: "string" },
			rationaleSummary: { type: "string" },
			expectedImprovements: { type: "array", items: { type: "string" } },
			preservedStrengths: { type: "array", items: { type: "string" } },
			riskNotes: { type: "array", items: { type: "string" } },
		},
	};
}

function buildMutationPrompt(packet, parentCandidate, parentPrompt, reflectionBatch, backend) {
	const objective = packet.objective?.summary || "Improve the target prompt without weakening the validated behavior objective.";
	const constraints = Array.isArray(packet.objective?.constraints) ? packet.objective.constraints : [];
	const heldOutScenarios = Array.isArray(packet.scenarioSets?.heldOutScenarioSet) ? packet.scenarioSets.heldOutScenarioSet : [];
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
		`- targetFile: ${packet.targetFile?.path || "unknown"}`,
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

function runMutationBackend({ backend, workspace, promptFile, schemaFile, outputFile, env }) {
	const runtimeEnv = {
		...env,
		WORKBENCH_REVIEW_TIMEOUT_SECONDS: env.CAUTILUS_OPTIMIZE_SEARCH_TIMEOUT_SECONDS || "180",
	};
	return spawnSync(
		"bash",
		[
			REVIEW_WRAPPER_PATH,
			"--backend",
			backend,
			"--workspace",
			workspace,
			"--prompt-file",
			promptFile,
			"--schema-file",
			schemaFile,
			"--output-file",
			outputFile,
		],
		{
			cwd: TOOL_ROOT,
			env: runtimeEnv,
			encoding: "utf-8",
		},
	);
}

function candidateArtifactRoot(artifactRoot, candidateId) {
	return join(artifactRoot, "optimize-search-candidates", candidateId);
}

function readPromptBody(targetPath) {
	if (!existsSync(targetPath)) {
		throw new Error(`target file not found: ${targetPath}`);
	}
	return readFileSync(targetPath, "utf-8");
}

function makeCandidateId(index, backend) {
	return `g1-${index + 1}-${backend.replace(/[^a-z0-9]+/giu, "-")}`;
}

function generateMutationCandidates(packet, artifactRoot, seedCandidate, feedbackSignals, env) {
	const reflectionBatch = buildReflectionBatch(packet, feedbackSignals);
	const backends = Array.isArray(packet.mutationConfig?.backends) ? packet.mutationConfig.backends : [];
	if (backends.length === 0) {
		return [];
	}
	const seedPrompt = readPromptBody(seedCandidate.targetFile.path);
	const candidates = [];
	const seenFingerprints = new Set([collectTargetSnapshot(seedCandidate.targetFile.path)?.sha256].filter(Boolean));
	for (const [index, backendConfig] of backends.entries()) {
		const backend = backendConfig?.backend;
		if (!backend) {
			continue;
		}
		const candidate = generateCandidate(packet, artifactRoot, seedCandidate, reflectionBatch, seedPrompt, backend, index, env);
		if (!candidate || seenFingerprints.has(candidate.targetSnapshot?.sha256)) {
			continue;
		}
		seenFingerprints.add(candidate.targetSnapshot.sha256);
		candidates.push(candidate);
	}
	return candidates;
}

function generateCandidate(packet, artifactRoot, seedCandidate, reflectionBatch, seedPrompt, backend, index, env) {
	const candidateId = makeCandidateId(index, backend);
	const candidateRoot = candidateArtifactRoot(artifactRoot, candidateId);
	const promptFile = join(candidateRoot, "mutation.prompt.md");
	const schemaFile = join(candidateRoot, "mutation.schema.json");
	const outputFile = join(candidateRoot, "mutation.output.json");
	writeText(promptFile, buildMutationPrompt(packet, seedCandidate, seedPrompt, reflectionBatch, backend));
	writeJson(schemaFile, mutationOutputSchema());
	const result = runMutationBackend({ backend, workspace: packet.repoRoot, promptFile, schemaFile, outputFile, env });
	if (result.status !== 0) {
		return null;
	}
	const mutationOutput = readJsonFile(outputFile, "mutation output");
	if (typeof mutationOutput.promptMarkdown !== "string" || mutationOutput.promptMarkdown.trim().length === 0) {
		return null;
	}
	const candidatePromptPath = join(candidateRoot, "candidate.prompt.md");
	writeText(candidatePromptPath, mutationOutput.promptMarkdown);
	return {
		id: candidateId,
		generationIndex: 1,
		parentCandidateIds: ["seed"],
		origin: "mutation",
		targetFile: {
			path: candidatePromptPath,
			exists: true,
		},
		targetSnapshot: collectTargetSnapshot(candidatePromptPath),
		mutationRationale: mutationOutput.rationaleSummary,
		expectedImprovements: mutationOutput.expectedImprovements,
		preservedStrengths: mutationOutput.preservedStrengths,
		riskNotes: mutationOutput.riskNotes,
		backend,
		artifacts: {
			promptFile,
			schemaFile,
			outputFile,
		},
	};
}

function relativeTargetPath(repoRoot, targetPath) {
	const relativePath = relative(resolve(repoRoot), resolve(targetPath));
	if (relativePath.startsWith("..") || relativePath === "") {
		throw new Error(`target file must stay within repoRoot: ${targetPath}`);
	}
	return relativePath;
}

function createCandidateWorktree(repoRoot, artifactRoot, candidateId) {
	const worktreeRoot = join(artifactRoot, "optimize-search-worktrees", candidateId);
	mkdirSync(dirname(worktreeRoot), { recursive: true });
	execFileSync("git", ["-C", repoRoot, "worktree", "add", "--detach", worktreeRoot, "HEAD"], {
		cwd: TOOL_ROOT,
		stdio: "pipe",
	});
	return worktreeRoot;
}

function buildEvaluateArgs(packet, repoRoot, outputDir) {
	const evaluationContext = packet.evaluationContext || {};
	const args = [
		"mode",
		"evaluate",
		"--repo-root",
		repoRoot,
		"--mode",
		evaluationContext.mode || "held_out",
		"--intent",
		evaluationContext.intent || packet.optimizeInput?.report?.intent || "Prompt candidate evaluation",
		"--output-dir",
		outputDir,
		"--quiet",
	];
	for (const [flag, value] of [
		["--adapter", evaluationContext.adapter],
		["--adapter-name", evaluationContext.adapterName],
		["--baseline-ref", evaluationContext.baselineRef],
		["--profile", evaluationContext.profile],
		["--split", evaluationContext.split],
	]) {
		if (value) {
			args.push(flag, value);
		}
	}
	return args;
}

function evaluateCandidate(packet, artifactRoot, candidate, env) {
	const worktreeRoot = createCandidateWorktree(packet.repoRoot, artifactRoot, candidate.id);
	const targetRelativePath = relativeTargetPath(packet.repoRoot, packet.targetFile.path);
	writeText(join(worktreeRoot, targetRelativePath), readFileSync(candidate.targetFile.path, "utf-8"));
	const outputDir = join(candidateArtifactRoot(artifactRoot, candidate.id), "held-out-eval");
	const result = spawnSync(BIN_PATH, buildEvaluateArgs(packet, worktreeRoot, outputDir), {
		cwd: TOOL_ROOT,
		env,
		encoding: "utf-8",
	});
	if (result.status !== 0) {
		return {
			...candidate,
			telemetry: {},
			evaluationError: result.stderr || "held-out evaluation failed",
			heldOutEntries: [],
		};
	}
		const mode = packet.evaluationContext?.mode || "held_out";
		const scenarioResultsPath = join(outputDir, `${mode}-scenario-results.json`);
		const heldOutEntries = collectHeldOutEntriesFromResults(
			readJsonFile(scenarioResultsPath, "held-out scenario results"),
			candidate.id,
		);
		return {
			...candidate,
			telemetry: summarizeCandidateTelemetry(heldOutEntries),
			heldOutEntries,
			evaluationArtifacts: {
				worktreeRoot,
				outputDir,
				reportFile: join(outputDir, "report.json"),
				scenarioResultsFile: scenarioResultsPath,
			},
		};
}

export function canRunMutation(packet) {
	const evaluationContext = packet.evaluationContext || {};
	return typeof evaluationContext.intent === "string"
		&& evaluationContext.intent.length > 0
		&& typeof evaluationContext.baselineRef === "string"
		&& evaluationContext.baselineRef.length > 0;
}

export function evaluateMutationCandidates(packet, artifactRoot, seedCandidate, feedbackSignals, env) {
	const generatedCandidates = generateMutationCandidates(packet, artifactRoot, seedCandidate, feedbackSignals, env);
	return generatedCandidates.map((candidate) => evaluateCandidate(packet, artifactRoot, candidate, env));
}
