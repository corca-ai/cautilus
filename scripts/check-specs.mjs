import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

function fail(message) {
	const error = new Error(message);
	return error;
}

function readSpecdownConfig(repoRoot) {
	const configPath = resolve(repoRoot, "specdown.json");
	if (!existsSync(configPath)) {
		throw fail("Missing required file: specdown.json");
	}
	const config = JSON.parse(readFileSync(configPath, "utf-8"));
	if (!config.entry) {
		throw fail("specdown.json must declare an entry file");
	}
	return config;
}

function listSpecFiles(rootDir) {
	if (!existsSync(rootDir) || !statSync(rootDir).isDirectory()) {
		throw fail(`Missing required directory: ${rootDir}`);
	}
	const result = [];
	for (const entry of readdirSync(rootDir)) {
		const fullPath = resolve(rootDir, entry);
		if (entry === "old" || entry === "archive") {
			continue;
		}
		if (statSync(fullPath).isDirectory()) {
			result.push(...listSpecFiles(fullPath));
		} else if (entry.endsWith(".spec.md")) {
			result.push(fullPath);
		}
	}
	return result.sort();
}

function discoverLinkedSpecs(entryPath, seen = new Set()) {
	if (seen.has(entryPath)) {
		return seen;
	}
	seen.add(entryPath);
	const content = readFileSync(entryPath, "utf-8");
	for (const target of parseMarkdownLinks(content)) {
		if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("/")) {
			continue;
		}
		if (!target.endsWith(".spec.md")) {
			continue;
		}
		const linked = resolve(dirname(entryPath), target);
		if (existsSync(linked)) {
			discoverLinkedSpecs(linked, seen);
		}
	}
	return seen;
}

function parseMarkdownLinks(content) {
	return [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
}

function repoRelative(repoRoot, specPath) {
	return relative(repoRoot, specPath).replaceAll("\\", "/");
}

// Archived spec trees are kept for historical context but carry live run:shell blocks.
// They are intentionally out of the apex graph so specdown never executes them; this prefix
// list lets the reachability guard fail the gate if a future link pulls them back in.
const ARCHIVED_SPEC_PREFIXES = ["docs/specs/old/", "docs/specs/archive/"];

function archivedSpecsReachableFrom(repoRoot, linkedSpecPaths) {
	return [...linkedSpecPaths]
		.map((specPath) => repoRelative(repoRoot, specPath))
		.filter((rel) => ARCHIVED_SPEC_PREFIXES.some((prefix) => rel.startsWith(prefix)))
		.sort();
}

function usage() {
	return [
		"Usage: node scripts/check-specs.mjs [spec-file ...]",
		"",
		"Without spec-file arguments, validates every active docs/specs/*.spec.md file.",
		"With spec-file arguments, validates those spec files' links and confirms they are reachable from specdown.json entry.",
	].join("\n");
}

function parseArgs(argv) {
	if (argv.includes("-h") || argv.includes("--help")) {
		return { help: true, targets: [] };
	}
	for (const arg of argv) {
		if (arg.startsWith("-")) {
			throw fail(`unknown argument: ${arg}`);
		}
	}
	return { help: false, targets: argv };
}

function resolveTargetSpecPaths(repoRoot, specsDir, targets) {
	return targets.map((target) => {
		const specPath = resolve(repoRoot, target);
		if (!specPath.startsWith(`${specsDir}/`) && specPath !== specsDir) {
			throw fail(`Spec target must be under docs/specs: ${target}`);
		}
		if (!specPath.endsWith(".spec.md")) {
			throw fail(`Spec target must end with .spec.md: ${target}`);
		}
		if (!existsSync(specPath) || !statSync(specPath).isFile()) {
			throw fail(`Spec target does not exist: ${target}`);
		}
		return specPath;
	});
}

function validateRelativeLinks(repoRoot, specPath, content) {
	for (const target of parseMarkdownLinks(content)) {
		if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("/")) {
			continue;
		}
		const resolved = resolve(specPath, "..", target);
		if (!existsSync(resolved)) {
			throw fail(`Broken spec link in ${specPath.slice(repoRoot.length + 1)}: ${target}`);
		}
	}
}

export function checkSpecs({ repoRoot = process.cwd(), targets = [] } = {}) {
	const specsDir = resolve(repoRoot, "docs", "specs");
	const config = readSpecdownConfig(repoRoot);
	const indexPath = resolve(repoRoot, config.entry);
	if (!existsSync(indexPath)) {
		throw fail(`Specdown entry does not exist: ${config.entry}`);
	}
	const specFiles = targets.length > 0
		? resolveTargetSpecPaths(repoRoot, specsDir, targets)
		: listSpecFiles(specsDir);
	const linkedSpecPaths = discoverLinkedSpecs(indexPath);

	const archivedReached = archivedSpecsReachableFrom(repoRoot, linkedSpecPaths);
	if (archivedReached.length > 0) {
		throw fail(
			`Specdown entry reaches archived spec(s) that must stay inert: ${archivedReached.join(", ")}. ` +
				"Archived specs under docs/specs/old/ and docs/specs/archive/ carry live run:shell blocks; " +
				"linking them back into the apex graph would execute them on every gate. " +
				"Remove the link, or move the page out of old/ or archive/ if it is being de-archived deliberately.",
		);
	}

	for (const specPath of specFiles) {
		const content = readFileSync(specPath, "utf-8");
		validateRelativeLinks(repoRoot, specPath, content);
	}
	for (const specPath of specFiles) {
		if (!linkedSpecPaths.has(specPath)) {
			throw fail(`Specdown entry does not link ${repoRelative(repoRoot, specPath)}`);
		}
	}

	return { specCount: specFiles.length, selected: targets.length > 0 };
}

export function main(argv = process.argv.slice(2)) {
	const repoRoot = process.cwd();
	try {
		const options = parseArgs(argv);
		if (options.help) {
			process.stdout.write(`${usage()}\n`);
			return;
		}
		const result = checkSpecs({ repoRoot, targets: options.targets });
		const suffix = result.selected ? " selected spec(s)" : " specs";
		process.stdout.write(`spec checks passed (${result.specCount}${suffix})\n`);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
