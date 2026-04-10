import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const specsDir = resolve(repoRoot, "docs", "specs");
const indexPath = resolve(specsDir, "index.spec.md");

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function readRequiredFile(pathname) {
	if (!existsSync(pathname)) {
		fail(`Missing required file: ${pathname.slice(repoRoot.length + 1)}`);
	}
	return readFileSync(pathname, "utf-8");
}

function listSpecFiles() {
	if (!existsSync(specsDir) || !statSync(specsDir).isDirectory()) {
		fail("Missing required directory: docs/specs");
	}

	return readdirSync(specsDir)
		.filter((entry) => entry.endsWith(".spec.md"))
		.sort()
		.map((entry) => resolve(specsDir, entry));
}

function parseMarkdownLinks(content) {
	return [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
}

function validateRelativeLinks(specPath, content) {
	for (const target of parseMarkdownLinks(content)) {
		if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("/")) {
			continue;
		}
		const resolved = resolve(specPath, "..", target);
		if (!existsSync(resolved)) {
			fail(`Broken spec link in ${specPath.slice(repoRoot.length + 1)}: ${target}`);
		}
	}
}

function validateIndexCoverage(specFiles, indexContent) {
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
			fail(`Spec index does not link ${specPath.slice(repoRoot.length + 1)}`);
		}
	}
}

function parseTableRow(line, specPath) {
	const columns = line
		.split("|")
		.slice(1, -1)
		.map((value) => value.trim());
	if (columns.length !== 3) {
		fail(`Malformed source_guard row in ${specPath.slice(repoRoot.length + 1)}: ${line}`);
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
		fail(`Malformed source_guard header in ${specPath.slice(repoRoot.length + 1)}`);
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

function parseSourceGuardRows(specPath, content) {
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

function validateSourceGuardRows(rows) {
	if (rows.length === 0) {
		fail("No check:source_guard table found in docs/specs");
	}

	for (const row of rows) {
		const targetPath = resolve(repoRoot, row.pathname);
		if (row.mode === "file_exists") {
			if (!existsSync(targetPath)) {
				fail(`Missing required file from ${row.specPath.slice(repoRoot.length + 1)}: ${row.pathname}`);
			}
			continue;
		}

		if (row.mode === "fixed") {
			const content = readRequiredFile(targetPath);
			if (!content.includes(row.pattern)) {
				fail(
					`Missing fixed pattern from ${row.specPath.slice(repoRoot.length + 1)}: ${row.pathname} -> ${row.pattern}`,
				);
			}
			continue;
		}

		fail(`Unsupported source_guard mode in ${row.specPath.slice(repoRoot.length + 1)}: ${row.mode}`);
	}
}

function main() {
	const specFiles = listSpecFiles();
	const allRows = [];

	for (const specPath of specFiles) {
		const content = readRequiredFile(specPath);
		validateRelativeLinks(specPath, content);
		if (specPath === indexPath) {
			validateIndexCoverage(specFiles, content);
		}
		allRows.push(...parseSourceGuardRows(specPath, content));
	}

	validateSourceGuardRows(allRows);
	process.stdout.write(`spec checks passed (${specFiles.length} specs, ${allRows.length} guard rows)\n`);
}

main();
