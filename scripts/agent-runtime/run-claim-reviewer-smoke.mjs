#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";

import { summarizeCodexSessionLogText } from "./codex-session-summary.mjs";
import { parseClaudeOutput, CLAUDE_CLI_ENV } from "./skill-test-claude-backend.mjs";

const RESULT_SCHEMA = "cautilus.claim_review_result.v1";
const VALUE_OPTIONS = {
	"--review-input": (options, value) => {
		options.reviewInput = value;
	},
	"--output": (options, value) => {
		options.output = value;
	},
	"--backend": (options, value) => {
		options.backend = value;
	},
	"--codex-model": (options, value) => {
		options.codexModel = value;
	},
	"--codex-reasoning-effort": (options, value) => {
		options.codexReasoningEffort = value;
	},
	"--claude-model": (options, value) => {
		options.claudeModel = value;
	},
};
const POSITIVE_INTEGER_OPTIONS = {
	"--max-clusters": "maxClusters",
	"--max-claims": "maxClaims",
	"--timeout-ms": "timeoutMs",
};

function fail(message) {
	console.error(message);
	process.exit(1);
}

function requiredValue(argv, index, option) {
	const value = argv[index];
	if (!value) {
		fail(`missing value for ${option}`);
	}
	return value;
}

function parsePositiveInteger(value, option) {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		fail(`${option} must be a positive integer`);
	}
	return parsed;
}

function parseArgs(argv) {
	const options = {
		reviewInput: null,
		output: null,
		backend: "auto",
		maxClusters: 1,
		maxClaims: 1,
		timeoutMs: 120000,
		codexModel: "gpt-5.4-mini",
		codexReasoningEffort: "low",
		claudeModel: null,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		const integerTarget = POSITIVE_INTEGER_OPTIONS[arg];
		const value = requiredValue(argv, index + 1, arg);
		if (integerTarget) {
			options[integerTarget] = parsePositiveInteger(value, arg);
			index += 1;
			continue;
		}
		const applyValue = VALUE_OPTIONS[arg];
		if (!applyValue) {
			fail(`unknown argument: ${arg}`);
		}
		applyValue(options, value);
		index += 1;
	}
	if (!options.reviewInput || !options.output) {
		fail("usage: run-claim-reviewer-smoke.mjs --review-input <review-input.json> --output <review-result.json> [--backend auto|codex_exec|claude_code|fixture]");
	}
	if (!["auto", "codex_exec", "claude_code", "fixture"].includes(options.backend)) {
		fail("--backend must be auto, codex_exec, claude_code, or fixture");
	}
	return options;
}

function resolveBackend(backend) {
	if (backend !== "auto") {
		return backend;
	}
	const reviewerBackend = process.env.CAUTILUS_REVIEWER_SMOKE_BACKEND;
	if (reviewerBackend === "claude_code" || reviewerBackend === "codex_exec") {
		return reviewerBackend;
	}
	const runtimeBackend = process.env.CAUTILUS_SKILL_TEST_BACKEND;
	if (runtimeBackend === "claude_code" || runtimeBackend === "codex_exec") {
		return runtimeBackend;
	}
	return "codex_exec";
}

function readJSON(path) {
	return JSON.parse(readFileSync(path, "utf-8"));
}

function selectedClusters(reviewInput, options) {
	return (reviewInput.clusters ?? []).slice(0, options.maxClusters).map((cluster) => ({
		...cluster,
		candidates: (cluster.candidates ?? []).slice(0, options.maxClaims),
	}));
}

function reviewPrompt(reviewInput, clusters, backend) {
	return [
		"You are a bounded Cautilus claim reviewer.",
		"Review only the supplied cluster candidates.",
		"Return ONLY a JSON object, with no markdown fences and no commentary.",
		"Do not claim evidence is satisfied unless direct verified evidence is included in the review input.",
		"Prefer evidenceStatus unknown when the packet does not already contain direct evidence.",
		"",
		"Required output shape:",
		JSON.stringify({
			schemaVersion: RESULT_SCHEMA,
			reviewRun: {
				reviewer: `${backend}-smoke-reviewer`,
				backend,
				mode: "single-cluster-smoke",
			},
			clusterResults: [
				{
					clusterId: "<cluster id>",
					claimUpdates: [
						{
							claimId: "<claim id>",
							reviewStatus: "agent-reviewed",
							evidenceStatus: "unknown",
							nextAction: "Short next action.",
							unresolvedQuestions: [],
						},
					],
				},
			],
		}, null, 2),
		"",
		"Review input context:",
		JSON.stringify({
			schemaVersion: reviewInput.schemaVersion,
			sourceClaimPacket: reviewInput.sourceClaimPacket,
			reviewBudget: reviewInput.reviewBudget,
			packetNotice: reviewInput.packetNotice,
			clusters,
		}, null, 2),
	].join("\n");
}

function extractJSON(text) {
	const trimmed = String(text ?? "").trim();
	if (!trimmed) {
		throw new Error("reviewer produced empty output");
	}
	const fenced = trimmed.match(/```(?:json)?\s*\n([\s\S]*?)\n\s*```/);
	if (fenced) {
		return JSON.parse(fenced[1]);
	}
	const object = trimmed.match(/\{[\s\S]*\}/);
	if (object) {
		return JSON.parse(object[0]);
	}
	return JSON.parse(trimmed);
}

function runWithHeartbeat(command, args, options) {
	return new Promise((resolveRun, rejectRun) => {
		let stdout = "";
		let stderr = "";
		let settled = false;
		const child = spawn(command, args, {
			cwd: process.cwd(),
			env: options.env ?? process.env,
			stdio: ["pipe", "pipe", "pipe"],
		});
		const finish = (callback) => {
			if (settled) {
				return;
			}
			settled = true;
			clearTimeout(timeout);
			clearInterval(heartbeat);
			callback();
		};
		const timeout = setTimeout(() => {
			child.kill("SIGTERM");
			finish(() => rejectRun(new Error(`${options.label} timed out after ${options.timeoutMs}ms`)));
		}, options.timeoutMs);
		const heartbeat = setInterval(() => {
			process.stderr.write(`${options.label} still running...\n`);
		}, Math.min(5000, Math.max(1000, Math.floor(options.timeoutMs / 6))));
		process.stderr.write(`${options.label} started\n`);
		child.stdout.on("data", (chunk) => {
			stdout += chunk;
		});
		child.stderr.on("data", (chunk) => {
			stderr += chunk;
		});
		child.on("error", (error) => {
			finish(() => rejectRun(error));
		});
		child.on("close", (status) => {
			finish(() => resolveRun({ status, stdout, stderr }));
		});
		if (options.input) {
			child.stdin.end(options.input);
		} else {
			child.stdin.end();
		}
	});
}

async function runCodex(prompt, options) {
	const args = [
		"exec",
		"-C",
		process.cwd(),
		"--sandbox",
		"danger-full-access",
		"--json",
		"--model",
		options.codexModel,
		"-c",
		`model_reasoning_effort="${options.codexReasoningEffort}"`,
		"-c",
		"project_doc_max_bytes=0",
		"-c",
		"include_apps_instructions=false",
		"-c",
		"include_environment_context=false",
		prompt,
	];
	const result = await runWithHeartbeat("codex", args, {
		label: "codex reviewer",
		timeoutMs: options.timeoutMs,
		env: process.env,
	});
	if (result.status !== 0) {
		throw new Error(`codex reviewer exited with status ${result.status}: ${result.stderr || result.stdout}`);
	}
	const summary = summarizeCodexSessionLogText(result.stdout);
	const finalMessage = [...summary.assistantMessages].reverse().find((message) => message.text.trim());
	if (!finalMessage) {
		throw new Error("codex reviewer produced no assistant message");
	}
	return {
		raw: result.stdout,
		parsed: extractJSON(finalMessage.text),
	};
}

async function runClaude(prompt, options) {
	const args = [
		"-p",
		"--no-session-persistence",
		"--output-format",
		"json",
		"--exclude-dynamic-system-prompt-sections",
	];
	if (options.claudeModel) {
		args.push("--model", options.claudeModel);
	}
	const result = await runWithHeartbeat("claude", args, {
		label: "claude reviewer",
		timeoutMs: options.timeoutMs,
		input: prompt,
		env: {
			...process.env,
			...CLAUDE_CLI_ENV,
		},
	});
	if (result.status !== 0) {
		throw new Error(`claude reviewer exited with status ${result.status}: ${result.stderr || result.stdout}`);
	}
	return {
		raw: result.stdout,
		parsed: parseClaudeOutput(result.stdout),
	};
}

function fixtureResult(clusters, backend) {
	return {
		raw: "",
		parsed: {
			schemaVersion: RESULT_SCHEMA,
			reviewRun: {
				reviewer: "fixture-smoke-reviewer",
				backend,
				mode: "single-cluster-smoke",
			},
			clusterResults: clusters.map((cluster) => ({
				clusterId: cluster.clusterId,
				claimUpdates: (cluster.candidates ?? []).map((candidate) => ({
					claimId: candidate.claimId,
					reviewStatus: "agent-reviewed",
					evidenceStatus: "unknown",
					nextAction: "Keep as a reviewed claim candidate; evidence still needs a separate proof step.",
					unresolvedQuestions: [],
				})),
			})),
		},
	};
}

function assertReviewResultRoot(result) {
	if (!result || typeof result !== "object") {
		throw new Error("reviewer result must be a JSON object");
	}
	if (result.schemaVersion !== RESULT_SCHEMA) {
		throw new Error(`reviewer result schemaVersion must be ${RESULT_SCHEMA}`);
	}
	if (!Array.isArray(result.clusterResults)) {
		throw new Error("reviewer result must include clusterResults array");
	}
}

function validateClusterResult(clusterResult, allowedClaimIds) {
	if (!clusterResult || typeof clusterResult !== "object" || !clusterResult.clusterId) {
		throw new Error("each cluster result must include clusterId");
	}
	if (!Array.isArray(clusterResult.claimUpdates)) {
		throw new Error("each cluster result must include claimUpdates array");
	}
	for (const update of clusterResult.claimUpdates) {
		if (!allowedClaimIds.has(update?.claimId)) {
			throw new Error(`reviewer result references unselected claimId: ${update?.claimId}`);
		}
	}
}

function normalizeReviewResult(result, clusters, backend) {
	assertReviewResultRoot(result);
	const allowedClaimIds = new Set(clusters.flatMap((cluster) => (cluster.candidates ?? []).map((candidate) => candidate.claimId)));
	for (const clusterResult of result.clusterResults) {
		validateClusterResult(clusterResult, allowedClaimIds);
	}
	return {
		...result,
		reviewRun: {
			...(result.reviewRun && typeof result.reviewRun === "object" ? result.reviewRun : {}),
			backend,
			mode: "single-cluster-smoke",
		},
	};
}

async function runReviewer(reviewInput, clusters, backend, options) {
	if (backend === "fixture") {
		return fixtureResult(clusters, backend);
	}
	const prompt = reviewPrompt(reviewInput, clusters, backend);
	if (backend === "claude_code") {
		return await runClaude(prompt, options);
	}
	return await runCodex(prompt, options);
}

async function main() {
	const options = parseArgs(process.argv.slice(2));
	if (!existsSync(options.reviewInput)) {
		fail(`review input not found: ${options.reviewInput}`);
	}
	const backend = resolveBackend(options.backend);
	const reviewInput = readJSON(options.reviewInput);
	const clusters = selectedClusters(reviewInput, options);
	if (clusters.length === 0) {
		fail("review input has no clusters to review");
	}
	const { raw, parsed } = await runReviewer(reviewInput, clusters, backend, options);
	const normalized = normalizeReviewResult(parsed, clusters, backend);
	mkdirSync(dirname(resolve(options.output)), { recursive: true });
	writeFileSync(options.output, `${JSON.stringify(normalized, null, 2)}\n`);
	if (raw) {
		writeFileSync(`${options.output}.raw`, raw);
	}
	process.stdout.write(`${JSON.stringify({
		schemaVersion: "cautilus.claim_reviewer_smoke_summary.v1",
		reviewerExecuted: backend !== "fixture",
		backend,
		clusterCount: clusters.length,
		claimCount: clusters.reduce((total, cluster) => total + (cluster.candidates?.length ?? 0), 0),
		output: options.output,
		rawOutput: raw ? `${options.output}.raw` : null,
	}, null, 2)}\n`);
}

main().catch((error) => {
	console.error(error.message);
	process.exitCode = 1;
});
