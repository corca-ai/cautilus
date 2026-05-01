import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const packageJson = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf8"));
const scripts = packageJson.scripts ?? {};

const violations = [];

for (const [name, command] of Object.entries(scripts)) {
	if (!name.startsWith("dogfood:") || !name.endsWith(":live")) {
		continue;
	}
	if (!/\bcautilus\s+eval\s+live\b/.test(command)) {
		violations.push({
			name,
			command,
			reason: "dogfood script names ending in :live must call `cautilus eval live` so coding-agent messaging proof is not mislabeled as product-runner proof.",
		});
	}
}

if (violations.length === 0) {
	process.stdout.write("check-proof-boundary-names: ok\n");
	process.exit(0);
}

for (const violation of violations) {
	process.stderr.write(`${violation.name}: ${violation.reason}\n`);
	process.stderr.write(`  command: ${violation.command}\n`);
}

process.exit(1);
