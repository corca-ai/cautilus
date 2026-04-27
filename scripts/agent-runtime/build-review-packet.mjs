import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

import { loadAdapter as loadAdapterPayload } from "../resolve_adapter.mjs";
import { REVIEW_PACKET_SCHEMA } from "./contract-versions.mjs";
import { readActiveRunDir } from "./active-run.mjs";
import { validateReportPacket } from "./report-packet.mjs";
import { writeTextOutput } from "./output-files.mjs";

export { REVIEW_PACKET_SCHEMA } from "./contract-versions.mjs";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/build-review-packet.mjs --repo-root <dir> --report-file <file> [--adapter <path> | --adapter-name <name>] [--output <file>]",
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
		repoRoot: process.cwd(),
		reportFile: null,
		adapter: null,
		adapterName: null,
		output: null,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		const field = {
			"--repo-root": "repoRoot",
			"--report-file": "reportFile",
			"--adapter": "adapter",
			"--adapter-name": "adapterName",
			"--output": "output",
		}[arg];
		if (!field) {
			fail(`Unknown argument: ${arg}`);
		}
		options[field] = readRequiredValue(argv, index + 1, arg);
		index += 1;
	}
	if (options.adapter && options.adapterName) {
		fail("Use either --adapter or --adapter-name, not both.");
	}
	return options;
}

function resolveCommandOptions(options, { env = process.env } = {}) {
	const activeRunDir = readActiveRunDir({ env });
	const resolved = {
		...options,
		repoRoot: resolve(options.repoRoot),
		reportFile: options.reportFile,
		output: options.output,
	};
	if (!resolved.reportFile && activeRunDir) {
		resolved.reportFile = join(activeRunDir, "report.json");
	}
	if (!resolved.reportFile) {
		fail("--report-file is required");
	}
	if (!resolved.output && activeRunDir) {
		resolved.output = join(activeRunDir, "review-packet.json");
	}
	return resolved;
}

function deriveAdapterOptionsFromReport(options, report) {
	if (options.adapter || options.adapterName) {
		return options;
	}
	const adapterContext = report?.packet?.adapterContext;
	if (!adapterContext || typeof adapterContext !== "object" || Array.isArray(adapterContext)) {
		return options;
	}
	return {
		...options,
		...(typeof adapterContext.adapter === "string" && adapterContext.adapter.length > 0
			? { adapter: adapterContext.adapter }
			: {}),
		...(typeof adapterContext.adapterName === "string" && adapterContext.adapterName.length > 0
			? { adapterName: adapterContext.adapterName }
			: {}),
	};
}

function loadAdapter(options) {
	const repoRoot = resolve(options.repoRoot);
	const payload = loadAdapterPayload(repoRoot, {
		adapter: options.adapter,
		adapterName: options.adapterName,
	});
	if (!payload.found) {
		fail(`Adapter not found for repo ${repoRoot}`);
	}
	if (!payload.valid) {
		fail(`Adapter is invalid: ${JSON.stringify(payload.errors ?? [])}`);
	}
	return payload;
}

function parseReportFile(path) {
	const resolved = resolve(path);
	if (!existsSync(resolved)) {
		fail(`Report file not found: ${resolved}`);
	}
	const parsed = JSON.parse(readFileSync(resolved, "utf-8"));
	try {
		validateReportPacket(parsed);
	} catch (error) {
		fail(`${resolved}: ${error.message}`);
	}
	return { path: resolved, packet: parsed };
}

function collectReferencedFiles(repoRoot, relativePaths = []) {
	return relativePaths.map((relativePath) => {
		const absolutePath = resolve(repoRoot, relativePath);
		return {
			relativePath,
			absolutePath,
			exists: existsSync(absolutePath),
		};
	});
}

function collectOptionalFile(repoRoot, relativePath) {
	if (!relativePath) {
		return null;
	}
	const absolutePath = resolve(repoRoot, relativePath);
	return {
		relativePath,
		absolutePath,
		exists: existsSync(absolutePath),
	};
}

export function buildReviewPacket(inputOptions, { now = new Date() } = {}) {
	const baseOptions = resolveCommandOptions(parseArgs(inputOptions));
	const report = parseReportFile(baseOptions.reportFile);
	const options = deriveAdapterOptionsFromReport(baseOptions, report);
	const repoRoot = options.repoRoot;
	const adapterPayload = loadAdapter(options);
	const adapterData = adapterPayload.data;
	return {
		schemaVersion: REVIEW_PACKET_SCHEMA,
		generatedAt: now.toISOString(),
		repoRoot,
		adapterPath: adapterPayload.path,
		reportFile: report.path,
		report: report.packet,
		defaultPromptFile: collectOptionalFile(repoRoot, adapterData.default_prompt_file),
		defaultSchemaFile: collectOptionalFile(repoRoot, adapterData.default_schema_file),
		artifactFiles: collectReferencedFiles(repoRoot, adapterData.artifact_paths),
		reportArtifacts: collectReferencedFiles(repoRoot, adapterData.report_paths),
		comparisonQuestions: adapterData.comparison_questions ?? [],
		humanReviewPrompts: adapterData.human_review_prompts ?? [],
	};
}

export function main(argv = process.argv.slice(2)) {
	try {
		const options = resolveCommandOptions(parseArgs(argv));
		const packet = buildReviewPacket(argv);
		const text = `${JSON.stringify(packet, null, 2)}\n`;
		if (options.output) {
			writeTextOutput(options.output, text);
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
