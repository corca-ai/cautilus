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
		"docs/contracts/scenario-history.md",
		"docs/contracts/scenario-proposal-sources.md",
		"docs/contracts/scenario-proposal-inputs.md",
		"docs/contracts/scenario-proposal-normalization.md",
		"docs/contracts/chatbot-normalization.md",
		"docs/contracts/skill-normalization.md",
		"docs/master-plan.md",
		"docs/consumer-readiness.md",
		"bin/cautilus",
		"skills/cautilus/SKILL.md",
		"skills/cautilus/agents/openai.yaml",
		"scripts/resolve_adapter.py",
		"scripts/init_adapter.py",
		"scripts/doctor.py",
		"scripts/agent-runtime/scenario-history.mjs",
		"scripts/agent-runtime/chatbot-proposal-candidates.mjs",
		"scripts/agent-runtime/normalize-chatbot-proposals.mjs",
		"scripts/agent-runtime/skill-proposal-candidates.mjs",
		"scripts/agent-runtime/normalize-skill-proposals.mjs",
		"scripts/agent-runtime/consumer-example-fixtures.test.mjs",
		"scripts/agent-runtime/scenario-proposals.mjs",
		"scripts/agent-runtime/build-scenario-proposal-input.mjs",
		"scripts/agent-runtime/generate-scenario-proposals.mjs",
		"scripts/agent-runtime/run-workbench-review-variant.sh",
		"scripts/agent-runtime/run-workbench-executor-variants.mjs",
		"fixtures/scenario-proposals/candidates.json",
		"fixtures/scenario-proposals/registry.json",
		"fixtures/scenario-proposals/coverage.json",
		"fixtures/scenario-proposals/input.schema.json",
		"fixtures/scenario-proposals/proposals.schema.json",
		"fixtures/scenario-proposals/chatbot-input.schema.json",
		"fixtures/scenario-proposals/skill-input.schema.json",
		"fixtures/scenario-proposals/standalone-input.json",
		"fixtures/scenario-proposals/chatbot-input.json",
		"fixtures/scenario-proposals/skill-input.json",
		"fixtures/scenario-proposals/ceal-chatbot-input.json",
		"fixtures/scenario-proposals/charness-skill-input.json",
		"fixtures/scenario-proposals/crill-skill-input.json",
		"fixtures/workbench/review-verdict.schema.json",
	].forEach(requireFile);
	validateSpecIndex();
	process.stdout.write("spec checks passed\n");
}

main();
