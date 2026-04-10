import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { buildBehaviorIntentProfile } from "./behavior-intent.mjs";
import {
	OPTIMIZE_INPUTS_SCHEMA,
	OPTIMIZE_PROPOSAL_SCHEMA,
	REVISION_ARTIFACT_SCHEMA,
} from "./contract-versions.mjs";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/build-revision-artifact.mjs --proposal-file <file> [--input-file <file>] [--output <file>]",
		"",
		"Output packet:",
		`  schemaVersion: ${REVISION_ARTIFACT_SCHEMA}`,
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function readRequiredValue(argv, index, option) {
	const value = argv[index];
	if (!value) {
		fail(`Missing value for ${option}`);
	}
	return value;
}

function parseArgs(argv) {
	const options = {
		proposalFile: null,
		inputFile: null,
		output: null,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		const field = {
			"--proposal-file": "proposalFile",
			"--input-file": "inputFile",
			"--output": "output",
		}[arg];
		if (!field) {
			fail(`Unknown argument: ${arg}`);
		}
		options[field] = readRequiredValue(argv, index + 1, arg);
		index += 1;
	}
	if (!options.proposalFile) {
		fail("--proposal-file is required");
	}
	return options;
}

function parseJsonFile(path, schemaVersion, label) {
	const resolved = resolve(path);
	if (!existsSync(resolved)) {
		fail(`${label} not found: ${resolved}`);
	}
	const parsed = JSON.parse(readFileSync(resolved, "utf-8"));
	if (parsed?.schemaVersion !== schemaVersion) {
		fail(`${label} must use schemaVersion ${schemaVersion}`);
	}
	return { path: resolved, packet: parsed };
}

function collectOptionalFile(path) {
	if (!path) {
		return null;
	}
	const absolutePath = resolve(path);
	return {
		path: absolutePath,
		exists: existsSync(absolutePath),
	};
}

function collectTargetSnapshot(targetFile) {
	if (!targetFile?.path || !targetFile.exists) {
		return null;
	}
	const absolutePath = resolve(targetFile.path);
	if (!existsSync(absolutePath)) {
		return null;
	}
	const content = readFileSync(absolutePath);
	const stat = statSync(absolutePath);
	const lineCount = content.toString("utf-8").split(/\r?\n/).length - 1;
	return {
		path: absolutePath,
		exists: true,
		sha256: createHash("sha256").update(content).digest("hex"),
		sizeBytes: stat.size,
		lineCount: Math.max(0, lineCount),
	};
}

function buildReportContext(report) {
	if (!report || typeof report !== "object") {
		return null;
	}
	return {
		candidate: report.candidate ?? null,
		baseline: report.baseline ?? null,
		intent: report.intent ?? null,
		intentProfile: buildBehaviorIntentProfile({
			intent: report.intent,
			intentProfile: report.intentProfile,
		}),
		recommendation: report.recommendation ?? null,
		regressed: Array.isArray(report.regressed) ? report.regressed : [],
		noisy: Array.isArray(report.noisy) ? report.noisy : [],
		improved: Array.isArray(report.improved) ? report.improved : [],
	};
}

function resolveInputFile(options, proposal) {
	if (options.inputFile) {
		return options.inputFile;
	}
	if (typeof proposal.inputFile === "string" && proposal.inputFile.length > 0) {
		return proposal.inputFile;
	}
	fail("optimize proposal must carry inputFile or use --input-file");
}

function resolveRevisionIntentProfile(proposalPacket, optimizeInputPacket) {
	return buildBehaviorIntentProfile({
		intent: optimizeInputPacket.report?.intent ?? optimizeInputPacket.intentProfile?.summary,
		intentProfile: proposalPacket.intentProfile ?? optimizeInputPacket.intentProfile,
		defaultGuardrailDimensions: optimizeInputPacket.objective?.constraints ?? [],
	});
}

function buildArtifactSourceFiles(optimizeInputPacket) {
	return {
		reportFile: collectOptionalFile(optimizeInputPacket.reportFile),
		reviewSummaryFile: collectOptionalFile(optimizeInputPacket.reviewSummaryFile),
		scenarioHistoryFile: collectOptionalFile(optimizeInputPacket.scenarioHistoryFile),
	};
}

export function buildRevisionArtifact(inputOptions, { now = new Date() } = {}) {
	const options = parseArgs(inputOptions);
	const proposal = parseJsonFile(options.proposalFile, OPTIMIZE_PROPOSAL_SCHEMA, "optimize proposal");
	const inputFile = resolveInputFile(options, proposal.packet);
	const optimizeInput = parseJsonFile(inputFile, OPTIMIZE_INPUTS_SCHEMA, "optimize input");
	const intentProfile = resolveRevisionIntentProfile(proposal.packet, optimizeInput.packet);
	const targetFile = proposal.packet.targetFile ?? optimizeInput.packet.targetFile ?? null;
	return {
		schemaVersion: REVISION_ARTIFACT_SCHEMA,
		generatedAt: now.toISOString(),
		proposalFile: proposal.path,
		proposal: proposal.packet,
		optimizeInputFile: optimizeInput.path,
		repoRoot: optimizeInput.packet.repoRoot,
		optimizationTarget: proposal.packet.optimizationTarget,
		intentProfile,
		optimizer: proposal.packet.optimizer ?? optimizeInput.packet.optimizer ?? null,
		objective: optimizeInput.packet.objective,
		targetFile,
		targetSnapshot: collectTargetSnapshot(targetFile),
		sourceFiles: buildArtifactSourceFiles(optimizeInput.packet),
		reportContext: buildReportContext(optimizeInput.packet.report),
		decision: proposal.packet.decision,
		reportRecommendation: proposal.packet.reportRecommendation,
		revisionBrief: proposal.packet.revisionBrief,
		prioritizedEvidence: proposal.packet.prioritizedEvidence,
		suggestedChanges: proposal.packet.suggestedChanges,
		stopConditions: proposal.packet.stopConditions,
		followUpChecks: proposal.packet.followUpChecks,
		trialTelemetry: proposal.packet.trialTelemetry ?? null,
	};
}

export function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArgs(argv);
		const packet = buildRevisionArtifact(argv);
		const text = `${JSON.stringify(packet, null, 2)}\n`;
		if (options.output) {
			writeFileSync(resolve(options.output), text, "utf-8");
			return;
		}
		process.stdout.write(text);
	} catch (error) {
		if (error instanceof Error) {
			process.stderr.write(`${error.message}\n`);
		} else {
			process.stderr.write(`${String(error)}\n`);
		}
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
