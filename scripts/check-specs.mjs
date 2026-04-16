import process from "node:process";
import { collectSpecGraph, validateSourceGuardRow } from "./spec-source-guard-lib.mjs";

function main() {
	const repoRoot = process.cwd();
	try {
		const { specFiles, rows } = collectSpecGraph(repoRoot);
		for (const row of rows) {
			validateSourceGuardRow(repoRoot, row);
		}
		process.stdout.write(`spec checks passed (${specFiles.length} specs, ${rows.length} guard rows)\n`);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

main();
