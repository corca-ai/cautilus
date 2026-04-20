import process from "node:process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { loadAdapter } from "../resolve_adapter.mjs";

const WORKBENCH_INSTANCE_CATALOG_SCHEMA = "cautilus.workbench_instance_catalog.v1";

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/discover-workbench-instances.mjs --repo-root <dir> [--adapter-path <path> | --adapter-name <name>]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function parseArgs(argv) {
	const options = {
		repoRoot: process.cwd(),
		adapterPath: null,
		adapterName: null,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		const field = {
			"--repo-root": "repoRoot",
			"--adapter-path": "adapterPath",
			"--adapter-name": "adapterName",
			"--adapter": "adapterPath",
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
	if (options.adapterPath && options.adapterName) {
		fail("Use either --adapter-path/--adapter or --adapter-name, not both.");
	}
	return options;
}

function toCamelCase(value) {
	return String(value)
		.trim()
		.replace(/^[^a-zA-Z0-9]+/u, "")
		.replace(/[-_\s]+([a-zA-Z0-9])/gu, (_, char) => char.toUpperCase())
		.replace(/^([A-Z])/u, (char) => char.toLowerCase());
}

function normalizePaths(paths) {
	if (!paths || typeof paths !== "object" || Array.isArray(paths)) {
		return undefined;
	}
	const normalized = {};
	for (const [key, value] of Object.entries(paths)) {
		const normalizedKey = toCamelCase(key);
		if (!normalizedKey) {
			continue;
		}
		normalized[normalizedKey] = value;
	}
	return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeExplicitInstance(instance) {
	const normalized = {
		instanceId: instance.id,
		displayLabel: instance.display_label,
	};
	if (instance.description) {
		normalized.description = instance.description;
	}
	if (instance.data_root) {
		normalized.dataRoot = instance.data_root;
	}
	const paths = normalizePaths(instance.paths);
	if (paths) {
		normalized.paths = paths;
	}
	return normalized;
}

export function buildWorkbenchInstanceCatalog(payload, now = new Date()) {
	if (!payload?.found) {
		fail("No checked-in adapter was found.");
	}
	if (!payload.valid) {
		fail(`Adapter is invalid: ${JSON.stringify(payload.errors ?? [])}`);
	}
	const instanceDiscovery = payload.data?.instance_discovery;
	if (!instanceDiscovery) {
		fail("Adapter does not declare instance_discovery.");
	}
	if (instanceDiscovery.kind !== "explicit") {
		fail(
			"instance_discovery.kind=command should point directly at a consumer-owned probe command; this helper only normalizes explicit instance lists.",
		);
	}
	return {
		schemaVersion: WORKBENCH_INSTANCE_CATALOG_SCHEMA,
		generatedAt: now.toISOString(),
		instances: (instanceDiscovery.instances ?? []).map(normalizeExplicitInstance),
	};
}

export function main(argv = process.argv.slice(2), now = new Date()) {
	const options = parseArgs(argv);
	const repoRoot = resolve(options.repoRoot);
	const payload = loadAdapter(repoRoot, {
		adapter: options.adapterPath,
		adapterName: options.adapterName,
	});
	const catalog = buildWorkbenchInstanceCatalog(payload, now);
	process.stdout.write(`${JSON.stringify(catalog, null, 2)}\n`);
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
