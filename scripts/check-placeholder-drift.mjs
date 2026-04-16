import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

// Catches contract drift between Go placeholder maps and their matching
// contract docs.  When a new {placeholder} is added to a Go replacements
// map but not mentioned in the contract doc that operators read, adapter
// authors cannot discover it.  This lint flags that silently.

const repoRoot = process.cwd();

const TARGETS = [
	{
		label: "skill_test replacements",
		goFile: "internal/app/remaining_commands.go",
		mapAnchor: "skill test start", // a string unique to the handler
		contractDoc: "docs/contracts/skill-testing.md",
	},
];

function readRequired(relPath) {
	return readFileSync(resolve(repoRoot, relPath), "utf-8");
}

function extractReplacementKeys(goText, anchor) {
	const anchorIndex = goText.indexOf(anchor);
	if (anchorIndex === -1) {
		throw new Error(`Anchor ${JSON.stringify(anchor)} not found in go file`);
	}
	const before = goText.slice(0, anchorIndex);
	const mapStart = before.lastIndexOf("replacements := map[string]string{");
	if (mapStart === -1) {
		throw new Error("Could not find replacements map before anchor");
	}
	const mapEnd = goText.indexOf("}", mapStart);
	const body = goText.slice(mapStart, mapEnd);
	const keys = [];
	const pattern = /"([a-z_][a-z0-9_]*)":/g;
	let match;
	while ((match = pattern.exec(body)) !== null) {
		keys.push(match[1]);
	}
	return keys;
}

function missingInContract(keys, contractText) {
	return keys.filter((key) => !contractText.includes(`{${key}}`));
}

function main() {
	const violations = [];
	for (const target of TARGETS) {
		const goText = readRequired(target.goFile);
		const contractText = readRequired(target.contractDoc);
		const keys = extractReplacementKeys(goText, target.mapAnchor);
		const missing = missingInContract(keys, contractText);
		for (const key of missing) {
			violations.push({
				label: target.label,
				placeholder: `{${key}}`,
				contractDoc: target.contractDoc,
				goFile: target.goFile,
			});
		}
	}
	if (violations.length === 0) {
		process.stdout.write("check-placeholder-drift: ok\n");
		return 0;
	}
	for (const v of violations) {
		process.stderr.write(
			`${v.label}: ${v.placeholder} used in ${v.goFile} but missing from ${v.contractDoc}\n`,
		);
	}
	return 1;
}

process.exit(main());
