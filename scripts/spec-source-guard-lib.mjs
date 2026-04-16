import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

function fail(message, extra = {}) {
	const error = new Error(message);
	Object.assign(error, extra);
	return error;
}

function readRequiredFile(repoRoot, pathname) {
	if (!existsSync(pathname)) {
		throw fail(`Missing required file: ${pathname.slice(repoRoot.length + 1)}`);
	}
	return readFileSync(pathname, "utf-8");
}

export function listSpecFiles(repoRoot) {
	const specsDir = resolve(repoRoot, "docs", "specs");
	if (!existsSync(specsDir) || !statSync(specsDir).isDirectory()) {
		throw fail("Missing required directory: docs/specs");
	}

	return readdirSync(specsDir)
		.filter((entry) => entry.endsWith(".spec.md"))
		.sort()
		.map((entry) => resolve(specsDir, entry));
}

export function parseMarkdownLinks(content) {
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

function parseTableRow(line, specPath) {
	const columns = line
		.split("|")
		.slice(1, -1)
		.map((value) => value.trim());
	if (columns.length !== 3) {
		throw fail(`Malformed source_guard row in ${specPath}: ${line}`);
	}
	return {
		specPath,
		pathname: columns[0],
		mode: columns[1],
		pattern: columns[2],
	};
}

function findSourceGuardTableStart(lines, startIndex, specPath) {
	let rowIndex = startIndex + 1;
	while (rowIndex < lines.length && lines[rowIndex].trim().length === 0) {
		rowIndex += 1;
	}

	if (rowIndex >= lines.length || !lines[rowIndex].trim().startsWith("| file | mode | pattern |")) {
		throw fail(`Malformed source_guard header in ${specPath}`);
	}

	return rowIndex + 2;
}

function readSourceGuardRows(lines, startIndex, specPath) {
	const rows = [];
	let rowIndex = startIndex;

	for (; rowIndex < lines.length; rowIndex += 1) {
		const line = lines[rowIndex].trim();
		if (!line.startsWith("|")) {
			break;
		}
		rows.push(parseTableRow(line, specPath));
	}

	return {
		nextIndex: rowIndex,
		rows,
	};
}

export function parseSourceGuardRows(specPath, content) {
	const lines = content.split("\n");
	const rows = [];

	for (let index = 0; index < lines.length; index += 1) {
		if (lines[index].trim() !== "> check:source_guard") {
			continue;
		}
		const tableStart = findSourceGuardTableStart(lines, index, specPath);
		const parsed = readSourceGuardRows(lines, tableStart, specPath);
		rows.push(...parsed.rows);
		index = parsed.nextIndex - 1;
	}

	return rows;
}

export function collectSpecGraph(repoRoot) {
	const specsDir = resolve(repoRoot, "docs", "specs");
	const indexPath = resolve(specsDir, "index.spec.md");
	const specFiles = listSpecFiles(repoRoot);
	const rows = [];

	for (const specPath of specFiles) {
		const content = readRequiredFile(repoRoot, specPath);
		validateRelativeLinks(repoRoot, specPath, content);
		if (specPath === indexPath) {
			validateIndexCoverage(repoRoot, specFiles, indexPath, content);
		}
		rows.push(...parseSourceGuardRows(specPath.slice(repoRoot.length + 1), content));
	}

	if (rows.length === 0) {
		throw fail("No check:source_guard table found in docs/specs");
	}

	return {
		specFiles,
		rows,
	};
}

export function makeSourceGuardRow(columns, cells, specPath = "<specdown>") {
	const values = Object.fromEntries(columns.map((column, index) => [column, cells[index] ?? ""]));
	return {
		specPath,
		pathname: values.file ?? "",
		mode: values.mode ?? "",
		pattern: values.pattern ?? "",
	};
}

export function validateSourceGuardRow(repoRoot, row) {
	const targetPath = resolve(repoRoot, row.pathname);
	if (row.mode === "file_exists") {
		if (!existsSync(targetPath)) {
			throw fail(
				`Missing required file from ${row.specPath}: ${row.pathname}`,
				{ expected: "file to exist", actual: "missing" },
			);
		}
		return;
	}

	if (row.mode === "fixed") {
		if (!existsSync(targetPath)) {
			throw fail(
				`Missing required file from ${row.specPath}: ${row.pathname}`,
				{ expected: "file to exist", actual: "missing" },
			);
		}
		const content = readRequiredFile(repoRoot, targetPath);
		if (!content.includes(row.pattern)) {
			throw fail(
				`Missing fixed pattern from ${row.specPath}: ${row.pathname} -> ${row.pattern}`,
				{ expected: row.pattern, actual: "pattern not found" },
			);
		}
		return;
	}

	throw fail(
		`Unsupported source_guard mode in ${row.specPath}: ${row.mode}`,
		{ expected: "file_exists|fixed", actual: row.mode || "empty" },
	);
}
