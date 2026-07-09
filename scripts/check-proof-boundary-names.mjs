import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const LIVE_COMMAND_PATTERN = /\bcautilus\s+evaluate\s+live\b/;

export function checkProofBoundaryNames(scripts) {
	const violations = [];
	for (const [name, command] of Object.entries(scripts ?? {})) {
		const violation = proofBoundaryViolation(name, command);
		if (violation) {
			violations.push(violation);
		}
	}
	return violations;
}

function proofBoundaryViolation(name, command) {
	if (!name.startsWith("dogfood:") || !name.endsWith(":live")) {
		return null;
	}
	if (!LIVE_COMMAND_PATTERN.test(command)) {
		return {
			name,
			command,
			reason: "dogfood script names ending in :live must call `cautilus evaluate live` so coding-agent messaging proof is not mislabeled as product-runner proof.",
		};
	}
	return null;
}

function main() {
	const repoRoot = process.cwd();
	const packageJson = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8"));
	const violations = checkProofBoundaryNames(packageJson.scripts);

	if (violations.length === 0) {
		process.stdout.write("check-proof-boundary-names: ok\n");
		return 0;
	}

	for (const violation of violations) {
		process.stderr.write(`${violation.name}: ${violation.reason}\n`);
		process.stderr.write(`  command: ${violation.command}\n`);
	}
	return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
	process.exit(main());
}
