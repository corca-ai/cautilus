import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { selectMergeParents } from "./optimize-search-merge.mjs";
import { buildMergePrompt, buildMutationPrompt } from "./optimize-search-prompts.mjs";

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

function heldOutScoreForCandidate(candidate, scenarioId) {
	const entries = Array.isArray(candidate?.heldOutEntries) ? candidate.heldOutEntries : [];
	const match = entries.find((entry) => entry.scenarioId === scenarioId);
	return typeof match?.score === "number" ? match.score : null;
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

function buildReflectionBatch(packet, parentCandidate, feedbackSignals) {
	const scenarioIds = Array.isArray(packet.scenarioSets?.trainScenarioSet) ? packet.scenarioSets.trainScenarioSet : [];
	const limit = Math.max(1, packet.mutationConfig?.trainScenarioLimit || 1);
	const signals = scenarioSignalMap(packet, feedbackSignals);
	const rankedScenarioIds = [...scenarioIds].sort((left, right) => {
		const leftScore = heldOutScoreForCandidate(parentCandidate, left);
		const rightScore = heldOutScoreForCandidate(parentCandidate, right);
		if (typeof leftScore === "number" && typeof rightScore === "number" && leftScore !== rightScore) {
			return leftScore - rightScore;
		}
		if (typeof leftScore === "number" && typeof rightScore !== "number") {
			return -1;
		}
		if (typeof leftScore !== "number" && typeof rightScore === "number") {
			return 1;
		}
		return left.localeCompare(right);
	});
	return rankedScenarioIds.slice(0, limit).map((scenarioId) => collectScenarioFeedback(packet, signals, scenarioId));
}

function candidateOutputSchema() {
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

function configuredBackends(packet) {
	return Array.isArray(packet.mutationConfig?.backends) ? packet.mutationConfig.backends : [];
}

function candidateFingerprint(candidate) {
	return candidate?.targetSnapshot?.sha256 || null;
}

function appendUniqueCandidate(candidates, candidate, seenFingerprints) {
	const fingerprint = candidateFingerprint(candidate);
	if (!candidate || !fingerprint || seenFingerprints.has(fingerprint)) {
		return false;
	}
	seenFingerprints.add(fingerprint);
	candidates.push(candidate);
	return true;
}

function markUniqueCandidate(candidate, seenFingerprints) {
	return appendUniqueCandidate([], candidate, seenFingerprints);
}

function filterCheckpointFeedback(checkpointFeedback, reflectionBatch) {
	const entries = Array.isArray(checkpointFeedback) ? checkpointFeedback : [];
	if (entries.length === 0) {
		return [];
	}
	const selectedScenarioIds = new Set(
		(Array.isArray(reflectionBatch) ? reflectionBatch : [])
			.map((entry) => entry?.scenarioId)
			.filter((scenarioId) => typeof scenarioId === "string" && scenarioId.length > 0),
	);
	if (selectedScenarioIds.size === 0) {
		return entries;
	}
	return entries.filter((entry) => {
		const scopedScenarioIds = Array.isArray(entry?.scenarioIds) ? entry.scenarioIds : [];
		return scopedScenarioIds.length === 0 || scopedScenarioIds.some((scenarioId) => selectedScenarioIds.has(scenarioId));
	});
}

function filterScenarioCheckpointFeedback(checkpointFeedback, scenarioIds) {
	const entries = Array.isArray(checkpointFeedback) ? checkpointFeedback : [];
	if (entries.length === 0) {
		return [];
	}
	const selectedScenarioIds = new Set((Array.isArray(scenarioIds) ? scenarioIds : [])
		.filter((scenarioId) => typeof scenarioId === "string" && scenarioId.length > 0));
	if (selectedScenarioIds.size === 0) {
		return entries;
	}
	return entries.filter((entry) => {
		const scopedScenarioIds = Array.isArray(entry?.scenarioIds) ? entry.scenarioIds : [];
		return scopedScenarioIds.length === 0 || scopedScenarioIds.some((scenarioId) => selectedScenarioIds.has(scenarioId));
	});
}

function collectMergeCheckpointFeedback(candidates, scenarioIds) {
	return (Array.isArray(candidates) ? candidates : []).flatMap((candidate) => (
		filterScenarioCheckpointFeedback(candidate?.checkpointFeedback, scenarioIds).map((entry) => ({
			...entry,
			sourceCandidateId: candidate.id,
		}))
	));
}

function buildMutationCandidate(packet, artifactRoot, parentCandidate, feedbackSignals, generationIndex, candidateIndex, backend, env) {
	const parentPrompt = readPromptBody(parentCandidate.targetFile.path);
	const reflectionBatch = buildReflectionBatch(packet, parentCandidate, feedbackSignals);
	const checkpointFeedback = filterCheckpointFeedback(parentCandidate.checkpointFeedback, reflectionBatch);
	return generateCandidate({
		packet,
		artifactRoot,
		parentCandidate,
		promptText: buildMutationPrompt(packet, parentCandidate, parentPrompt, reflectionBatch, checkpointFeedback, backend),
		backend,
		generationIndex,
		candidateIndex,
		origin: "mutation",
	}, env);
}

function generateMutationCandidates(packet, artifactRoot, parentCandidates, feedbackSignals, generationIndex, seenFingerprints, env) {
	const backends = configuredBackends(packet);
	if (backends.length === 0) {
		return [];
	}
	const promptVariantLimit = Math.max(1, packet.mutationConfig?.promptVariantLimit || backends.length);
	const candidates = [];
	let candidateIndex = 0;
	for (const parentCandidate of parentCandidates) {
		for (const backendConfig of backends) {
			if (candidates.length >= promptVariantLimit) {
				return candidates;
			}
			const backend = backendConfig?.backend;
			if (!backend) {
				continue;
			}
			const candidate = buildMutationCandidate(
				packet,
				artifactRoot,
				parentCandidate,
				feedbackSignals,
				generationIndex,
				candidateIndex,
				backend,
				env,
			);
			candidateIndex += 1;
			appendUniqueCandidate(candidates, candidate, seenFingerprints);
		}
	}
	return candidates;
}

function generateCandidate({ packet, artifactRoot, parentCandidate, promptText, backend, generationIndex, candidateIndex, origin }, env) {
	const candidateId = origin === "merge"
		? `g${generationIndex}-merge-${candidateIndex + 1}-${backend.replace(/[^a-z0-9]+/giu, "-")}`
		: `g${generationIndex}-${candidateIndex + 1}-${backend.replace(/[^a-z0-9]+/giu, "-")}`;
	const candidateRoot = candidateArtifactRoot(artifactRoot, candidateId);
	const promptFile = join(candidateRoot, "mutation.prompt.md");
	const schemaFile = join(candidateRoot, "mutation.schema.json");
	const outputFile = join(candidateRoot, "mutation.output.json");
	writeText(promptFile, promptText);
	writeJson(schemaFile, candidateOutputSchema());
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
		generationIndex,
		parentCandidateIds: [parentCandidate.id],
		origin,
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

function mergeBackend(packet) {
	return configuredBackends(packet)[0]?.backend || null;
}

function buildMergeCandidate(packet, artifactRoot, parentCandidates, mergeFeedbackCandidates, generationIndex, backend, scenarioIds, env) {
	const parentPrompts = parentCandidates.map((candidate) => readPromptBody(candidate.targetFile.path));
	const mergeCheckpointFeedback = collectMergeCheckpointFeedback(mergeFeedbackCandidates, scenarioIds);
	const candidate = generateCandidate({
		packet,
		artifactRoot,
		parentCandidate: parentCandidates[0],
		promptText: buildMergePrompt(packet, parentCandidates, parentPrompts, backend, scenarioIds, mergeCheckpointFeedback),
		backend,
		generationIndex,
		candidateIndex: 0,
		origin: "merge",
	}, env);
	if (candidate) {
		candidate.parentCandidateIds = parentCandidates.map((parentCandidate) => parentCandidate.id);
	}
	return candidate;
}

function generateMergeCandidates(packet, artifactRoot, frontierCandidates, mergeFeedbackCandidates, generationIndex, seenFingerprints, env) {
	if (!packet.searchConfig?.mergeEnabled) {
		return [];
	}
	const backend = mergeBackend(packet);
	if (!backend) {
		return [];
	}
	const scenarioIds = Array.isArray(packet.scenarioSets?.heldOutScenarioSet) ? packet.scenarioSets.heldOutScenarioSet : [];
	const parents = selectMergeParents(frontierCandidates, scenarioIds);
	if (!parents) {
		return [];
	}
	const candidate = buildMergeCandidate(
		packet,
		artifactRoot,
		parents,
		mergeFeedbackCandidates,
		generationIndex,
		backend,
		scenarioIds,
		env,
	);
	if (!markUniqueCandidate(candidate, seenFingerprints)) {
		return [];
	}
	return [candidate];
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

export function evaluateMutationCandidates(packet, artifactRoot, parentCandidates, feedbackSignals, env, {
	generationIndex = 1,
	existingCandidates = [],
	frontierCandidates = parentCandidates,
	mergeFeedbackCandidates = frontierCandidates,
} = {}) {
	const seenFingerprints = new Set(
		existingCandidates
			.map((candidate) => candidate?.targetSnapshot?.sha256)
			.filter((fingerprint) => typeof fingerprint === "string" && fingerprint.length > 0),
	);
	const generatedMutationCandidates = generateMutationCandidates(
		packet,
		artifactRoot,
		parentCandidates,
		feedbackSignals,
		generationIndex,
		seenFingerprints,
		env,
	);
	const generatedMergeCandidates = generateMergeCandidates(
		packet,
		artifactRoot,
		frontierCandidates,
		mergeFeedbackCandidates,
		generationIndex,
		seenFingerprints,
		env,
	);
	const generatedCandidates = [...generatedMutationCandidates, ...generatedMergeCandidates];
	return generatedCandidates.map((candidate) => evaluateCandidate(packet, artifactRoot, candidate, env));
}
