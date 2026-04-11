import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { inferRepoDefaults } from "./resolve_adapter.mjs";

function yamlScalar(value) {
	if (value === null) {
		return "null";
	}
	if (typeof value === "boolean") {
		return value ? "true" : "false";
	}
	if (typeof value === "number") {
		return String(value);
	}
	const text = String(value);
	if (text === "") {
		return "\"\"";
	}
	if (
		[":", "#", "{", "}", "[", "]", "\n"].some((char) => text.includes(char)) ||
		text.trim() !== text
	) {
		const escaped = text
			.replaceAll("\\", "\\\\")
			.replaceAll("\"", "\\\"")
			.replaceAll("\n", "\\n");
		return `"${escaped}"`;
	}
	return text;
}

function isPlainObject(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function appendYamlProperty(lines, prefix, key, item, nestedIndent) {
	if (Array.isArray(item) && item.length === 0) {
		lines.push(`${prefix}${key}: []`);
		return;
	}
	if (isPlainObject(item) || Array.isArray(item)) {
		lines.push(`${prefix}${key}:`);
		lines.push(...dumpYaml(item, nestedIndent));
		return;
	}
	lines.push(`${prefix}${key}: ${yamlScalar(item)}`);
}

function dumpYamlListItem(value, indent) {
	const prefix = " ".repeat(indent);
	const lines = [];
	let first = true;
	for (const [key, item] of Object.entries(value)) {
		const keyPrefix = first ? `${prefix}- ` : `${prefix}  `;
		appendYamlProperty(lines, keyPrefix, key, item, indent + 4);
		first = false;
	}
	if (lines.length === 0) {
		lines.push(`${prefix}- {}`);
	}
	return lines;
}

function dumpYamlArray(value, indent, prefix) {
	const lines = [];
	for (const item of value) {
		if (isPlainObject(item)) {
			lines.push(...dumpYamlListItem(item, indent));
			continue;
		}
		if (Array.isArray(item)) {
			lines.push(`${prefix}-`);
			lines.push(...dumpYaml(item, indent + 2));
			continue;
		}
		lines.push(`${prefix}- ${yamlScalar(item)}`);
	}
	return lines;
}

function dumpYaml(value, indent = 0) {
	const prefix = " ".repeat(indent);
	if (isPlainObject(value)) {
		const lines = [];
		for (const [key, item] of Object.entries(value)) {
			appendYamlProperty(lines, prefix, key, item, indent + 2);
		}
		return lines;
	}
	if (Array.isArray(value)) {
		return dumpYamlArray(value, indent, prefix);
	}
	return [`${prefix}${yamlScalar(value)}`];
}

export function dumpYamlDocument(data) {
	return `${dumpYaml(data).join("\n")}\n`;
}

function numericDefaults(inferred) {
	return {
		iterate_samples_default: inferred.iterate_samples_default ?? 2,
		held_out_samples_default: inferred.held_out_samples_default ?? 2,
		comparison_samples_default: inferred.comparison_samples_default ?? 2,
		full_gate_samples_default: inferred.full_gate_samples_default ?? 2,
	};
}

export function scaffoldAdapter(repoRoot, repoName) {
	const inferred = inferRepoDefaults(repoRoot);
	return {
		version: 1,
		repo: repoName,
		evaluation_surfaces: ["prompt behavior", "workflow behavior"],
		baseline_options: ["baseline git ref in the same repo via {baseline_ref}"],
		required_prerequisites: ["choose a real baseline before comparing results"],
		preflight_commands: inferred.preflight_commands ?? [],
		iterate_command_templates: inferred.iterate_command_templates ?? [],
		held_out_command_templates: inferred.held_out_command_templates ?? [],
		comparison_command_templates: inferred.comparison_command_templates ?? [],
		full_gate_command_templates: inferred.full_gate_command_templates ?? [],
		executor_variants: [],
		artifact_paths: [],
		report_paths: inferred.report_paths ?? [],
		comparison_questions: [
			"Which scenarios improved, regressed, or stayed noisy after repeated samples?",
		],
		human_review_prompts: [
			{
				id: "real-user",
				prompt: "Where would a real user still judge the candidate worse despite benchmark wins?",
			},
		],
		...numericDefaults(inferred),
		history_file_hint: inferred.history_file_hint ?? "/tmp/workbench-history.json",
		profile_default: inferred.profile_default ?? "default",
	};
}

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/init_adapter.mjs --repo-root <dir> [--repo-name <name>] [--adapter-name <name>] [--output <path>] [--force]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function parseArgs(argv) {
	const options = {
		repoRoot: null,
		repoName: null,
		adapterName: null,
		output: null,
		force: false,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--force") {
			options.force = true;
			continue;
		}
		const field = {
			"--repo-root": "repoRoot",
			"--repo-name": "repoName",
			"--adapter-name": "adapterName",
			"--output": "output",
		}[arg];
		if (!field) {
			fail(`Unknown argument: ${arg}`);
		}
		const value = argv[index + 1];
		if (!value) {
			fail(`Missing value for ${arg}`);
		}
		options[field] = value;
		index += 1;
	}
	if (!options.repoRoot) {
		fail("--repo-root is required");
	}
	return options;
}

export function main(argv = process.argv.slice(2)) {
	const options = parseArgs(argv);
	const repoRoot = resolve(options.repoRoot);
	const defaultOutput = options.adapterName
		? `.agents/cautilus-adapters/${options.adapterName}.yaml`
		: ".agents/cautilus-adapter.yaml";
	const output = resolve(repoRoot, options.output ?? defaultOutput);
	if (existsSync(output) && !options.force) {
		fail(`Adapter already exists at ${output}. Use --force to overwrite.`);
	}
	mkdirSync(dirname(output), { recursive: true });
	const adapter = scaffoldAdapter(repoRoot, options.repoName ?? repoRoot.split(/[\\/]/u).at(-1));
	writeFileSync(output, dumpYamlDocument(adapter), "utf-8");
	process.stdout.write(`${output}\n`);
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
