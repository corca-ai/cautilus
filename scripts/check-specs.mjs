import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";

const repoRoot = process.cwd();

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function requireFile(pathname) {
	const fullPath = resolve(repoRoot, pathname);
	if (!existsSync(fullPath)) {
		fail(`Missing required file: ${pathname}`);
	}
	return fullPath;
}

function validateSpecIndex() {
	const indexPath = requireFile("docs/specs/index.spec.md");
	const content = readFileSync(indexPath, "utf-8");
	const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
	for (const match of content.matchAll(linkPattern)) {
		const target = match[1];
		if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("/")) {
			continue;
		}
		const resolved = resolve(dirname(indexPath), target);
		if (!existsSync(resolved)) {
			fail(`Broken spec link in docs/specs/index.spec.md: ${target}`);
		}
	}
}

function main() {
	[
		"README.md",
		"AGENTS.md",
		"package.json",
		"eslint.config.mjs",
		"docs/workflow.md",
		"docs/contracts/adapter-contract.md",
		"docs/contracts/reporting.md",
		"docs/master-plan.md",
		"bin/cautilus",
		"skills/cautilus/SKILL.md",
		"skills/cautilus/agents/openai.yaml",
		"scripts/resolve_adapter.py",
		"scripts/init_adapter.py",
		"scripts/doctor.py",
		"scripts/agent-runtime/run-workbench-review-variant.sh",
		"scripts/agent-runtime/run-workbench-executor-variants.mjs",
		"fixtures/workbench/review-verdict.schema.json",
	].forEach(requireFile);
	validateSpecIndex();
	process.stdout.write("spec checks passed\n");
}

main();
