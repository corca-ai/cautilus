import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

// Runtime-completeness lint for the scenario-normalize archetypes.
//
// The original first-class evaluation archetype boundary spec was retired
// alongside the evaluation-surfaces redesign; the chatbot / skill / workflow
// `scenario normalize` plumbing still ships, and this lint keeps that
// plumbing whole.
//
// What remains gated here for each scenario-normalize archetype:
//   1. the schema constant exists
//   2. the normalize helper exists
//   3. the CLI subcommand exists
//   4. the handler exists
//   5. the scenarios catalog entry exists
//   6. the contract doc exists
//   7. the example input fixture exists

const repoRoot = process.cwd();

const ARCHETYPES = [
	{
		name: "chatbot",
		schemaId: "cautilus.chatbot_normalization_inputs.v1",
		helperFunc: "NormalizeChatbotProposalCandidates",
		handlerFunc: "handleScenarioNormalizeChatbot",
		cliPath: ["scenario", "normalize", "chatbot"],
		contractDoc: "docs/contracts/chatbot-normalization.md",
		exampleInput: "fixtures/scenario-proposals/chatbot-input.json",
	},
	{
		name: "skill",
		schemaId: "cautilus.skill_normalization_inputs.v2",
		helperFunc: "NormalizeSkillProposalCandidates",
		handlerFunc: "handleScenarioNormalizeSkill",
		cliPath: ["scenario", "normalize", "skill"],
		contractDoc: "docs/contracts/skill-normalization.md",
		exampleInput: "fixtures/scenario-proposals/skill-input.json",
	},
	{
		name: "workflow",
		schemaId: "cautilus.workflow_normalization_inputs.v1",
		helperFunc: "NormalizeWorkflowProposalCandidates",
		handlerFunc: "handleScenarioNormalizeWorkflow",
		cliPath: ["scenario", "normalize", "workflow"],
		contractDoc: "docs/contracts/workflow-normalization.md",
		exampleInput: "fixtures/scenario-proposals/workflow-input.json",
	},
];

function readRequired(relPath) {
	const full = resolve(repoRoot, relPath);
	if (!existsSync(full)) {
		process.stderr.write(`Missing required file: ${relPath}\n`);
		process.exit(1);
	}
	return readFileSync(full, "utf-8");
}

function registryPathPattern(parts) {
	return `"path": [${parts.map((part) => `"${part}"`).join(", ")}]`;
}

function loadSources() {
	return {
		constants: readRequired("internal/contracts/constants.go"),
		proposals: readRequired("internal/runtime/proposals.go"),
		app: readRequired("internal/app/app.go"),
		registry: readRequired("internal/cli/command-registry.json"),
		scenarios: readRequired("internal/runtime/scenarios.go"),
	};
}

function checkArchetype(def, sources, issues) {
	const fail = (message) => issues.push(`archetype ${def.name}: ${message}`);

	if (!sources.constants.includes(`"${def.schemaId}"`)) {
		fail(`schema id "${def.schemaId}" missing from internal/contracts/constants.go`);
	}
	if (!sources.proposals.includes(`func ${def.helperFunc}`)) {
		fail(`helper func ${def.helperFunc} missing from internal/runtime/proposals.go`);
	}
	if (!sources.registry.includes(registryPathPattern(def.cliPath))) {
		fail(`command-registry.json missing ${registryPathPattern(def.cliPath)}`);
	}
	if (!sources.app.includes(`func ${def.handlerFunc}`)) {
		fail(`handler func ${def.handlerFunc} missing from internal/app/app.go`);
	}
	if (!new RegExp(`Archetype:\\s+"${def.name}"`).test(sources.scenarios)) {
		fail(`scenarios catalog entry Archetype: "${def.name}" missing from internal/runtime/scenarios.go`);
	}
	if (!existsSync(resolve(repoRoot, def.contractDoc))) {
		fail(`contract document ${def.contractDoc} does not exist`);
	}
	if (!existsSync(resolve(repoRoot, def.exampleInput))) {
		fail(`example input ${def.exampleInput} does not exist`);
	}
}

function main() {
	const sources = loadSources();
	const issues = [];

	for (const archetype of ARCHETYPES) {
		checkArchetype(archetype, sources, issues);
	}

	if (issues.length > 0) {
		for (const issue of issues) {
			process.stderr.write(`${issue}\n`);
		}
		process.exit(1);
	}

	process.stdout.write(
		`archetype runtime completeness: ${ARCHETYPES.length} archetypes pass 8-surface check\n`,
	);
}

main();
