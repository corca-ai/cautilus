import { readFileSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

const JSON_VERSION_FILES = [
	"package.json",
	"package-lock.json",
	".claude-plugin/marketplace.json",
	"plugins/cautilus/.claude-plugin/plugin.json",
	"plugins/cautilus/.codex-plugin/plugin.json",
];

const JSON_UPDATERS = {
	"package.json": (payload, version) => {
		payload.version = version;
	},
	"package-lock.json": (payload, version) => {
		payload.version = version;
		if (payload.packages?.[""]) {
			payload.packages[""].version = version;
		}
	},
	".claude-plugin/marketplace.json": (payload, version) => {
		if (payload.metadata) {
			payload.metadata.version = version;
		}
		if (Array.isArray(payload.plugins)) {
			for (const plugin of payload.plugins) {
				if (plugin?.name === "cautilus") {
					plugin.version = version;
				}
			}
		}
	},
	"plugins/cautilus/.claude-plugin/plugin.json": (payload, version) => {
		payload.version = version;
	},
	"plugins/cautilus/.codex-plugin/plugin.json": (payload, version) => {
		payload.version = version;
	},
};

export function normalizeVersion(input) {
	const value = String(input || "").trim().replace(/^v/, "");
	if (!VERSION_PATTERN.test(value)) {
		throw new Error(`Expected a semver-like version such as 0.2.4 or v0.2.4; received ${JSON.stringify(input)}`);
	}
	return value;
}

function formatJson(value) {
	return `${JSON.stringify(value, null, 2)}\n`;
}

export function updateVersionedJson(relativePath, text, version) {
	const payload = JSON.parse(text);
	const update = JSON_UPDATERS[relativePath];
	if (!update) {
		throw new Error(`Unsupported versioned JSON file: ${relativePath}`);
	}
	update(payload, version);
	return formatJson(payload);
}

function usage(exitCode = 0) {
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(
		[
			"Usage:",
			"  node ./scripts/release/bump-version.mjs <version> [--repo-root <dir>] [--dry-run] [--json]",
		].join("\n") + "\n",
	);
	process.exit(exitCode);
}

function readRequiredValue(argv, index, option) {
	const value = argv[index + 1] || "";
	if (!value) {
		throw new Error(`${option} requires a value`);
	}
	return value;
}

function parseArgs(argv) {
	const options = {
		repoRoot: process.cwd(),
		dryRun: false,
		json: false,
	};
	let rawVersion = "";
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--repo-root") {
			options.repoRoot = readRequiredValue(argv, index, arg);
			index += 1;
			continue;
		}
		if (arg === "--dry-run") {
			options.dryRun = true;
			continue;
		}
		if (arg === "--json") {
			options.json = true;
			continue;
		}
		if (!rawVersion) {
			rawVersion = arg;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	if (!rawVersion) {
		throw new Error("A target version is required");
	}
	return {
		repoRoot: resolve(options.repoRoot),
		version: normalizeVersion(rawVersion),
		dryRun: options.dryRun,
		json: options.json,
	};
}

export function applyVersionBump({ repoRoot, version, dryRun = false }) {
	const changedFiles = [];
	for (const relativePath of JSON_VERSION_FILES) {
		const filePath = resolve(repoRoot, relativePath);
		const current = readFileSync(filePath, "utf-8");
		const next = updateVersionedJson(relativePath, current, version);
		if (current !== next) {
			if (!dryRun) {
				writeFileSync(filePath, next, "utf-8");
			}
			changedFiles.push(relativePath);
		}
	}
	return {
		repoRoot: relative(process.cwd(), repoRoot) || ".",
		version,
		changedFiles,
		dryRun,
	};
}

export function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArgs(argv);
		const result = applyVersionBump(options);
		if (options.json) {
			process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
			return;
		}
		process.stdout.write(
			[
				`Prepared version ${result.version}${result.dryRun ? " (dry-run)" : ""}.`,
				...result.changedFiles.map((file) => `- ${file}`),
			].join("\n") + "\n",
		);
	} catch (error) {
		process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
