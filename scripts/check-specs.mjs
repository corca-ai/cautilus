import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";

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
		if (entry === "old") {
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

function main() {
	const repoRoot = process.cwd();
	try {
		const specsDir = resolve(repoRoot, "docs", "specs");
		const config = readSpecdownConfig(repoRoot);
		const indexPath = resolve(repoRoot, config.entry);
		if (!existsSync(indexPath)) {
			throw fail(`Specdown entry does not exist: ${config.entry}`);
		}
		const specFiles = listSpecFiles(specsDir);
		const linkedSpecPaths = discoverLinkedSpecs(indexPath);

		for (const specPath of specFiles) {
			const content = readFileSync(specPath, "utf-8");
			validateRelativeLinks(repoRoot, specPath, content);
		}
		for (const specPath of specFiles) {
			if (!linkedSpecPaths.has(specPath)) {
				throw fail(`Specdown entry does not link ${specPath.slice(repoRoot.length + 1)}`);
			}
		}

		process.stdout.write(`spec checks passed (${specFiles.length} specs)\n`);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

main();
