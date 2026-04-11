import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { readActiveRunDir } from "./active-run.mjs";
import {
	EVIDENCE_BUNDLE_INPUTS_SCHEMA,
	REPORT_PACKET_SCHEMA,
	SCENARIO_HISTORY_SCHEMA,
	SCENARIO_RESULTS_SCHEMA,
} from "./contract-versions.mjs";

const EVIDENCE_OBJECTIVE =
	"Bundle host-normalized evidence into one machine-readable packet before mining scenarios or revisions.";
const EVIDENCE_CONSTRAINTS = [
	"Keep raw log readers and storage access host-owned.",
	"Treat this packet as normalized evidence, not inferred narrative.",
	"Prefer explicit report, scenario-result, audit, and history files over ad-hoc shell history.",
];

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/build-evidence-input.mjs [--repo-root <dir>] [--report-file <file>] [--scenario-results-file <file>] [--run-audit-file <file>] [--history-file <file>] [--output <file>]",
		"",
		"Output packet:",
		`  schemaVersion: ${EVIDENCE_BUNDLE_INPUTS_SCHEMA}`,
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
		scenarioResultsFile: null,
		runAuditFile: null,
		historyFile: null,
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
			"--scenario-results-file": "scenarioResultsFile",
			"--run-audit-file": "runAuditFile",
			"--history-file": "historyFile",
			"--output": "output",
		}[arg];
		if (!field) {
			fail(`Unknown argument: ${arg}`);
		}
		options[field] = readRequiredValue(argv, index + 1, arg);
		index += 1;
	}
	return options;
}

function resolveCommandOptions(options, { env = process.env } = {}) {
	const activeRunDir = readActiveRunDir({ env });
	const resolved = {
		...options,
		repoRoot: resolve(options.repoRoot),
		reportFile: options.reportFile,
		scenarioResultsFile: options.scenarioResultsFile,
		runAuditFile: options.runAuditFile,
		historyFile: options.historyFile,
		output: options.output,
	};
	if (!resolved.reportFile && activeRunDir) {
		resolved.reportFile = join(activeRunDir, "report.json");
	}
	if (!resolved.output && activeRunDir) {
		resolved.output = join(activeRunDir, "evidence-input.json");
	}
	if (
		!resolved.reportFile &&
		!resolved.scenarioResultsFile &&
		!resolved.runAuditFile &&
		!resolved.historyFile
	) {
		fail("At least one evidence source must be provided.");
	}
	return resolved;
}

function parseJsonFile(path, label) {
	const resolved = resolve(path);
	if (!existsSync(resolved)) {
		fail(`${label} not found: ${resolved}`);
	}
	try {
		return {
			path: resolved,
			packet: JSON.parse(readFileSync(resolved, "utf-8")),
		};
	} catch (error) {
		fail(`Failed to read JSON from ${resolved}: ${error.message}`);
	}
}

function parseReportFile(path) {
	const report = parseJsonFile(path, "report file");
	if (report.packet?.schemaVersion !== REPORT_PACKET_SCHEMA) {
		fail(`report file must use schemaVersion ${REPORT_PACKET_SCHEMA}`);
	}
	return report;
}

function parseScenarioResultsFile(path) {
	const scenarioResults = parseJsonFile(path, "scenario results file");
	if (scenarioResults.packet?.schemaVersion !== SCENARIO_RESULTS_SCHEMA) {
		fail(`scenario results file must use schemaVersion ${SCENARIO_RESULTS_SCHEMA}`);
	}
	return scenarioResults;
}

function parseHistoryFile(path) {
	const history = parseJsonFile(path, "scenario history");
	if (history.packet?.schemaVersion !== SCENARIO_HISTORY_SCHEMA) {
		fail(`scenario history must use schemaVersion ${SCENARIO_HISTORY_SCHEMA}`);
	}
	return history;
}

function parseRunAuditFile(path) {
	const runAudit = parseJsonFile(path, "run audit file");
	if (!runAudit.packet || typeof runAudit.packet !== "object" || Array.isArray(runAudit.packet)) {
		fail("run audit file must be a JSON object");
	}
	return runAudit;
}

const EVIDENCE_SOURCE_DEFINITIONS = [
	{
		optionField: "reportFile",
		kind: "report",
		packetPathField: "reportFile",
		packetValueField: "report",
		parse: parseReportFile,
	},
	{
		optionField: "scenarioResultsFile",
		kind: "scenario_results",
		packetPathField: "scenarioResultsFile",
		packetValueField: "scenarioResults",
		parse: parseScenarioResultsFile,
	},
	{
		optionField: "runAuditFile",
		kind: "run_audit",
		packetPathField: "runAuditFile",
		packetValueField: "runAudit",
		parse: parseRunAuditFile,
	},
	{
		optionField: "historyFile",
		kind: "scenario_history",
		packetPathField: "scenarioHistoryFile",
		packetValueField: "scenarioHistory",
		parse: parseHistoryFile,
	},
];

function addSource(sources, kind, filePath) {
	sources.push({
		kind,
		file: filePath,
	});
}

export function buildEvidenceInput(inputOptions, { now = new Date() } = {}) {
	const options = resolveCommandOptions(parseArgs(inputOptions));
	const repoRoot = options.repoRoot;
	const sources = [];
	const parsedSources = {};

	for (const sourceDefinition of EVIDENCE_SOURCE_DEFINITIONS) {
		const optionValue = options[sourceDefinition.optionField];
		if (!optionValue) {
			continue;
		}
		const parsed = sourceDefinition.parse(optionValue);
		parsedSources[sourceDefinition.kind] = parsed;
		addSource(sources, sourceDefinition.kind, parsed.path);
	}

	const packet = {
		schemaVersion: EVIDENCE_BUNDLE_INPUTS_SCHEMA,
		generatedAt: now.toISOString(),
		repoRoot,
		sources,
		objective: {
			summary: EVIDENCE_OBJECTIVE,
			constraints: EVIDENCE_CONSTRAINTS,
		},
	};

	for (const sourceDefinition of EVIDENCE_SOURCE_DEFINITIONS) {
		const parsed = parsedSources[sourceDefinition.kind];
		if (!parsed) {
			continue;
		}
		packet[sourceDefinition.packetPathField] = parsed.path;
		packet[sourceDefinition.packetValueField] = parsed.packet;
	}

	return packet;
}

export function main(argv = process.argv.slice(2)) {
	try {
		const options = resolveCommandOptions(parseArgs(argv));
		const packet = buildEvidenceInput(argv);
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
