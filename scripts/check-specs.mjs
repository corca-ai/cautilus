import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

function fail(message) {
	const error = new Error(message);
	return error;
}

function listSpecFiles(repoRoot) {
	const specsDir = resolve(repoRoot, "docs", "specs");
	if (!existsSync(specsDir) || !statSync(specsDir).isDirectory()) {
		throw fail("Missing required directory: docs/specs");
	}

	return readdirSync(specsDir)
		.filter((entry) => entry.endsWith(".spec.md"))
		.sort()
		.map((entry) => resolve(specsDir, entry));
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

function validateIndexCoverage(repoRoot, specFiles, indexPath, indexContent) {
	const linkedSpecPaths = new Set(
		parseMarkdownLinks(indexContent)
			.filter((target) => target.endsWith(".spec.md"))
			.map((target) => resolve(indexPath, "..", target)),
	);

	for (const specPath of specFiles) {
		if (specPath === indexPath) {
			continue;
		}
		if (!linkedSpecPaths.has(specPath)) {
			throw fail(`Spec index does not link ${specPath.slice(repoRoot.length + 1)}`);
		}
	}
}

function main() {
	const repoRoot = process.cwd();
	try {
		const specFiles = listSpecFiles(repoRoot);
		const specsDir = resolve(repoRoot, "docs", "specs");
		const indexPath = resolve(specsDir, "index.spec.md");

		for (const specPath of specFiles) {
			const content = readFileSync(specPath, "utf-8");
			validateRelativeLinks(repoRoot, specPath, content);
			if (specPath === indexPath) {
				validateIndexCoverage(repoRoot, specFiles, indexPath, content);
			}
		}

		process.stdout.write(`spec checks passed (${specFiles.length} specs)\n`);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

main();
