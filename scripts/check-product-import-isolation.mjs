import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const PRODUCT_ROOTS = ["cmd", "internal"];
const INTERNAL_MODULE_PREFIX = "github.com/corca-ai/cautilus/";
const ALLOWED_THIRD_PARTY_IMPORTS = new Set(["gopkg.in/yaml.v3"]);
const FORBIDDEN_PROVIDER_HOSTS = [
	"api.anthropic.com",
	"api.openai.com",
	"generativelanguage.googleapis.com",
	"api.x.ai",
];

export function checkProductImportIsolation({ roots = PRODUCT_ROOTS, repoRoot = process.cwd() } = {}) {
	const problems = [];
	const inspectedFiles = [];
	const thirdPartyImportsObserved = new Set();
	for (const root of roots) {
		const files = collectGoSourceFiles(join(repoRoot, root));
		for (const file of files) {
			inspectedFiles.push(file);
			inspectGoFile(file, repoRoot, thirdPartyImportsObserved, problems);
		}
	}
	return {
		inspectedFileCount: inspectedFiles.length,
		thirdPartyImports: [...thirdPartyImportsObserved].sort(),
		problems,
	};
}

function inspectGoFile(file, repoRoot, thirdPartyImportsObserved, problems) {
	const body = readFileSync(file, "utf8");
	const display = rel(file, repoRoot);
	for (const importPath of extractImports(body)) {
		const verdict = classifyImport(importPath);
		if (verdict === "stdlib" || verdict === "internal") continue;
		thirdPartyImportsObserved.add(importPath);
		if (verdict === "forbidden") {
			problems.push(`${display}: third-party import not in allowlist: ${importPath}`);
		}
	}
	for (const host of FORBIDDEN_PROVIDER_HOSTS) {
		if (body.includes(host)) {
			problems.push(`${display}: source references forbidden LLM provider host: ${host}`);
		}
	}
}

function classifyImport(importPath) {
	if (isStandardLibraryImport(importPath)) return "stdlib";
	if (importPath.startsWith(INTERNAL_MODULE_PREFIX)) return "internal";
	if (ALLOWED_THIRD_PARTY_IMPORTS.has(importPath)) return "allowed";
	return "forbidden";
}

function collectGoSourceFiles(root) {
	let entries;
	try {
		entries = readdirSync(root, { withFileTypes: true });
	} catch (error) {
		if (error && error.code === "ENOENT") return [];
		throw error;
	}
	const files = [];
	for (const entry of entries) {
		const path = join(root, entry.name);
		if (entry.isDirectory()) {
			files.push(...collectGoSourceFiles(path));
		} else if (
			entry.isFile() &&
			path.endsWith(".go") &&
			!path.endsWith("_test.go") &&
			statSync(path).isFile()
		) {
			files.push(path);
		}
	}
	return files;
}

export function extractImports(goSource) {
	const imports = [];
	const lines = goSource.split("\n");
	let inBlock = false;
	for (const line of lines) {
		const trimmed = line.trim();
		if (inBlock) {
			inBlock = collectBlockImport(trimmed, imports);
			continue;
		}
		inBlock = collectTopLevelImport(trimmed, imports);
	}
	return imports;
}

function collectBlockImport(trimmed, imports) {
	if (trimmed === ")") return false;
	const blockEntry = matchBlockImport(trimmed);
	if (blockEntry) imports.push(blockEntry);
	return true;
}

function collectTopLevelImport(trimmed, imports) {
	if (trimmed === "import (") return true;
	const single = matchSingleImport(trimmed);
	if (single) imports.push(single);
	return false;
}

function matchSingleImport(line) {
	const match = /^import\s+(?:[A-Za-z_][A-Za-z0-9_]*\s+)?"([^"]+)"\s*$/.exec(line);
	return match ? match[1] : null;
}

function matchBlockImport(line) {
	if (!line || line.startsWith("//")) return null;
	const match = /^(?:[A-Za-z_][A-Za-z0-9_]*\s+|_\s+|\.\s+)?"([^"]+)"\s*(?:\/\/.*)?$/.exec(line);
	return match ? match[1] : null;
}

function isStandardLibraryImport(importPath) {
	const head = importPath.split("/", 1)[0];
	return !head.includes(".");
}

function rel(file, repoRoot) {
	return file.startsWith(repoRoot + "/") ? file.slice(repoRoot.length + 1) : file;
}

function main() {
	const repoRoot = process.cwd();
	const result = checkProductImportIsolation({ repoRoot });
	if (result.problems.length > 0) {
		console.error("check-product-import-isolation: failed");
		for (const problem of result.problems) {
			console.error(`- ${problem}`);
		}
		process.exit(1);
	}
	console.log(
		JSON.stringify(
			{
				status: "ok",
				roots: PRODUCT_ROOTS,
				inspectedFileCount: result.inspectedFileCount,
				thirdPartyImports: result.thirdPartyImports,
				allowedThirdPartyImports: [...ALLOWED_THIRD_PARTY_IMPORTS].sort(),
				forbiddenProviderHosts: FORBIDDEN_PROVIDER_HOSTS,
			},
			null,
			2,
		),
	);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
