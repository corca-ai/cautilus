import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import process from "node:process";

import { REVIEW_PACKET_SCHEMA } from "./contract-versions.mjs";
import { readActiveRunDir } from "./active-run.mjs";
import { validateReportPacket } from "./report-packet.mjs";

export { REVIEW_PACKET_SCHEMA } from "./contract-versions.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = resolve(SCRIPT_DIR, "..", "..");
const RESOLVE_ADAPTER_SCRIPT = resolve(TOOL_ROOT, "scripts", "resolve_adapter.py");

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

function loadAdapter(options) {
	const repoRoot = resolve(options.repoRoot);
	const args = [RESOLVE_ADAPTER_SCRIPT, "--repo-root", repoRoot];
	if (options.adapter) {
		args.push("--adapter", options.adapter);
	}
	if (options.adapterName) {
		args.push("--adapter-name", options.adapterName);
	}
	const stdout = execFileSync("python3", args, {
		cwd: repoRoot,
		encoding: "utf-8",
	});
	const payload = JSON.parse(stdout);
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
	const options = resolveCommandOptions(parseArgs(inputOptions));
	const repoRoot = options.repoRoot;
	const adapterPayload = loadAdapter(options);
	const report = parseReportFile(options.reportFile);
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
