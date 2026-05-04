import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const PENDING_PATTERN = /Evidence is pending\.?/i;
const SUBCLAIM_BULLET_PATTERN = /^\s*-\s+\S/;
const SUBCLAIM_HEADING_PATTERN = /^#{3,4}\s+\S/;
const EVIDENCE_DIRECTIVE_PATTERN = /^\s*>\s*check:/;
const EVIDENCE_LINK_PATTERN = /\[[^\]]+\]\(([^)]+)\)/;
const EVIDENCE_GAP_BULLET_PATTERN = /^\s*[-*]\s+\S/;

function fail(message) {
	return new Error(message);
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

function isIndexSpec(specPath) {
	return specPath.endsWith("/index.spec.md");
}

function extractSection(content, headingTitle) {
	const lines = content.split(/\r?\n/);
	const startMatcher = new RegExp(`^##\\s+${headingTitle}\\s*$`, "i");
	let start = -1;
	for (let i = 0; i < lines.length; i += 1) {
		if (startMatcher.test(lines[i])) {
			start = i + 1;
			break;
		}
	}
	if (start === -1) {
		return null;
	}
	let end = lines.length;
	for (let i = start; i < lines.length; i += 1) {
		if (/^##\s+\S/.test(lines[i])) {
			end = i;
			break;
		}
	}
	return lines.slice(start, end);
}

function countMatchingLines(sectionLines, predicate) {
	if (!sectionLines) return 0;
	return sectionLines.filter(predicate).length;
}

function relPath(repoRoot, specPath) {
	return specPath.slice(repoRoot.length + 1);
}

function checkSpec(repoRoot, specPath) {
	const content = readFileSync(specPath, "utf-8");
	const rel = relPath(repoRoot, specPath);

	if (PENDING_PATTERN.test(content)) {
		throw fail(
			`${rel}: "Evidence is pending" is not a valid closing state. ` +
				`Move the gap into a "## Evidence Gaps" section with explicit owner and next action, ` +
				`or attach a real evidence reference under "## Evidence".`,
		);
	}

	const subclaimsSection = extractSection(content, "Subclaims");
	if (!subclaimsSection) {
		throw fail(`${rel}: missing "## Subclaims" section.`);
	}
	const subclaimCount =
		countMatchingLines(subclaimsSection, (line) => SUBCLAIM_BULLET_PATTERN.test(line)) +
		countMatchingLines(subclaimsSection, (line) => SUBCLAIM_HEADING_PATTERN.test(line));
	if (subclaimCount === 0) {
		throw fail(`${rel}: "## Subclaims" section is empty.`);
	}

	const evidenceSection = extractSection(content, "Evidence");
	const gapsSection = extractSection(content, "Evidence Gaps");

	if (!evidenceSection && !gapsSection) {
		throw fail(
			`${rel}: missing both "## Evidence" and "## Evidence Gaps" sections. ` +
				`A subclaim page must either attach evidence references or log explicit evidence gaps.`,
		);
	}

	const directiveCount = countMatchingLines(evidenceSection, (line) =>
		EVIDENCE_DIRECTIVE_PATTERN.test(line),
	);
	const linkCount = countMatchingLines(evidenceSection, (line) => EVIDENCE_LINK_PATTERN.test(line));
	const gapBulletCount = countMatchingLines(gapsSection, (line) =>
		EVIDENCE_GAP_BULLET_PATTERN.test(line),
	);

	const evidenceCount = directiveCount + linkCount;
	const totalSignals = evidenceCount + gapBulletCount;
	if (totalSignals === 0) {
		throw fail(
			`${rel}: neither "## Evidence" nor "## Evidence Gaps" carries a concrete entry ` +
				`(specdown directive, evidence link, or gap bullet).`,
		);
	}
}

function main() {
	const repoRoot = process.cwd();
	try {
		const specsDir = resolve(repoRoot, "docs", "specs");
		const specFiles = listSpecFiles(specsDir).filter((path) => !isIndexSpec(path));
		for (const specPath of specFiles) {
			checkSpec(repoRoot, specPath);
		}
		process.stdout.write(`spec evidence checks passed (${specFiles.length} subclaim specs)\n`);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

main();
