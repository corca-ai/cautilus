import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const REQUIRED_PACKAGE_SCRIPTS = {
	"release:prepare": "node scripts/release/prepare-release.mjs",
	"release:publish": "node scripts/release/publish-release.mjs",
	"release:publisher-policy:check": "node scripts/release/check-release-publisher-policy.mjs",
	"release:smoke-install:current": "node scripts/release/run-install-smoke-current.mjs",
};

const REQUIRED_REVIEW_COMMANDS = [
	"npm run critique:surface-packet:check",
	"npm run security:secrets:history",
	"npm run release:publisher-policy:check",
];

const REQUIRED_RELEASE_BOUNDARY_TEXT = [
	"Do not cut this repo's releases with the generic charness `release` skill publisher",
	"the repo-owned scripts above are the only supported path",
	"requested review commands",
	"post-publish install smoke readback",
];

const REQUIRED_RELEASING_TEXT = [
	"npm run security:secrets:history",
	"npm run release:publisher-policy:check",
	"npm run release:publish -- --version <next-version>",
	"npm run release:smoke-install:current -- --skip-update",
];

function usage(exitCode = 0) {
	const stream = exitCode === 0 ? process.stdout : process.stderr;
	stream.write("Usage: node scripts/release/check-release-publisher-policy.mjs [--repo-root <path>] [--json]\n");
	process.exit(exitCode);
}

function readRequiredValue(argv, index, option) {
	const value = argv[index + 1] || "";
	if (!value) {
		throw new Error(`${option} requires a value`);
	}
	return value;
}

export function parseArgs(argv = process.argv.slice(2)) {
	const options = {
		repoRoot: process.cwd(),
		json: false,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--json") {
			options.json = true;
			continue;
		}
		if (arg === "--repo-root") {
			options.repoRoot = readRequiredValue(argv, index, arg);
			index += 1;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	options.repoRoot = resolve(options.repoRoot);
	return options;
}

function readText(repoRoot, relativePath) {
	return readFileSync(join(repoRoot, relativePath), "utf-8");
}

function readJson(repoRoot, relativePath) {
	return JSON.parse(readText(repoRoot, relativePath));
}

function collectMissingRequiredScripts(pkg) {
	const scripts = pkg.scripts || {};
	return Object.entries(REQUIRED_PACKAGE_SCRIPTS)
		.filter(([name, command]) => scripts[name] !== command)
		.map(([name, command]) => `${name}=${command}`);
}

function containsAll(text, expected) {
	return expected.filter((needle) => !text.includes(needle));
}

function collectYamlListValues(text, key) {
	const lines = text.split(/\r?\n/);
	const values = [];
	let inList = false;
	for (const line of lines) {
		if (line.startsWith(`${key}:`)) {
			inList = true;
			continue;
		}
		if (!inList) {
			continue;
		}
		if (/^\S/.test(line)) {
			break;
		}
		const match = line.match(/^\s*-\s*["']?(.+?)["']?\s*$/);
		if (match) {
			values.push(match[1]);
		}
	}
	return values;
}

export function checkReleasePublisherPolicy(repoRoot) {
	const findings = [];
	const pkg = readJson(repoRoot, "package.json");
	for (const missing of collectMissingRequiredScripts(pkg)) {
		findings.push({
			code: "missing_package_script",
			message: `package.json scripts must include ${missing}`,
		});
	}

	const adapter = readText(repoRoot, ".agents/release-adapter.yaml");
	const requestedReviewCommands = collectYamlListValues(adapter, "requested_review_commands");
	for (const command of REQUIRED_REVIEW_COMMANDS) {
		if (!requestedReviewCommands.includes(command)) {
			findings.push({
				code: "missing_requested_review_command",
				message: `.agents/release-adapter.yaml requested_review_commands must include ${command}`,
			});
		}
	}
	if (!adapter.includes("post_publish_install_refresh: \"npm run release:smoke-install:current -- --skip-update\"")) {
		findings.push({
			code: "missing_post_publish_install_refresh",
			message: ".agents/release-adapter.yaml must record the current-version install smoke readback",
		});
	}

	const releaseBoundary = readText(repoRoot, "docs/maintainers/release-boundary.md");
	for (const missing of containsAll(releaseBoundary, REQUIRED_RELEASE_BOUNDARY_TEXT)) {
		findings.push({
			code: "release_boundary_missing_policy_text",
			message: `docs/maintainers/release-boundary.md must mention: ${missing}`,
		});
	}

	const releasing = readText(repoRoot, "docs/maintainers/releasing.md");
	for (const missing of containsAll(releasing, REQUIRED_RELEASING_TEXT)) {
		findings.push({
			code: "releasing_guide_missing_policy_text",
			message: `docs/maintainers/releasing.md must mention: ${missing}`,
		});
	}

	return {
		ok: findings.length === 0,
		findings,
	};
}

export async function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArgs(argv);
		const result = checkReleasePublisherPolicy(options.repoRoot);
		if (options.json) {
			process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
		} else if (result.ok) {
			process.stdout.write("release publisher policy check: clean\n");
		} else {
			for (const finding of result.findings) {
				process.stderr.write(`${finding.code}: ${finding.message}\n`);
			}
		}
		if (!result.ok) {
			process.exit(1);
		}
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	await main();
}
