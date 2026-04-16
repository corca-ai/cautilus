import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

// Inverse-completeness lint for archetype-boundary.spec.md.
//
// The public spec stays focused on the user-facing archetype contract.
// This lint carries one deeper maintenance check that the public report
// should not carry: every declared archetype must still map to the full
// implementation surface behind it. The script walks the spec's
// per-archetype `###` sections, parses their bullets, and asserts each
// archetype has all 11 required surfaces.
//
// The 11 surfaces (chatbot lacks #7 by design: its input shape has no
// targetKind discriminator — see Invariants section of the spec):
//   1. schema constant in internal/contracts/constants.go
//   2. helper func in internal/runtime/proposals.go
//   3. CLI subcommand in internal/cli/command-registry.json
//   4. example fixture file
//   5. contract document file
//   6. behavior surfaces in internal/runtime/intent.go
//   7. assertion func in internal/runtime/proposals.go (skill/workflow)
//   8. handler func in internal/app/app.go
//   9. scenarios catalog entry in internal/runtime/scenarios.go
//  10. README ## Scenarios block matching the archetype
//  11. SKILL.md `scenario normalize <archetype>` reference

const repoRoot = process.cwd();
const specRel = "docs/specs/archetype-boundary.spec.md";
const specPath = resolve(repoRoot, specRel);

// Archetypes whose input shape has a targetKind discriminator, and
// therefore require an assert<Archetype>TargetKind helper. Chatbot
// normalizes conversationSummaries without a targetKind field, so it
// does not need one.
const ASSERTION_REQUIRED = new Set(["skill", "workflow"]);

function readRequired(relPath) {
	const full = resolve(repoRoot, relPath);
	if (!existsSync(full)) {
		process.stderr.write(`Missing required file: ${relPath}\n`);
		process.exit(1);
	}
	return readFileSync(full, "utf-8");
}

function titleCase(name) {
	return name.charAt(0).toUpperCase() + name.slice(1);
}

function extractArchetypesSection(content) {
	const start = content.indexOf("\n## Archetypes");
	if (start < 0) {
		process.stderr.write(`${specRel}: missing "## Archetypes" heading\n`);
		process.exit(1);
	}
	const rest = content.slice(start + 1);
	const nextH2 = rest.slice(3).search(/\n## /);
	return nextH2 < 0 ? rest : rest.slice(0, nextH2 + 3);
}

function parseArchetypeSections(content) {
	const section = extractArchetypesSection(content);
	const parts = section.split(/\n### /).slice(1);
	const archetypes = [];
	for (const part of parts) {
		const newlineIndex = part.indexOf("\n");
		const name = part.slice(0, newlineIndex).trim();
		const body = part.slice(newlineIndex + 1);
		archetypes.push({ name, bullets: parseBullets(body) });
	}
	return archetypes;
}

function parseBullets(body) {
	const bullets = {};
	let currentKey = null;
	for (const line of body.split("\n")) {
		const match = line.match(/^-\s+([^:]+):\s*(.*)$/);
		if (match) {
			currentKey = match[1].trim().toLowerCase();
			bullets[currentKey] = match[2];
			continue;
		}
		if (currentKey && /^\s+\S/.test(line) && !line.trimStart().startsWith("-")) {
			bullets[currentKey] += " " + line.trim();
			continue;
		}
		currentKey = null;
	}
	return bullets;
}

function extractBacktick(value) {
	const match = value && value.match(/`([^`]+)`/);
	return match ? match[1] : null;
}

function extractBacktickList(value) {
	if (!value) return [];
	return [...value.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
}

function extractLink(value) {
	const match = value && value.match(/\[[^\]]+\]\(([^)]+)\)/);
	return match ? match[1] : null;
}

function checkSchemaConstant(ctx) {
	const schemaId = extractBacktick(ctx.bullets["schema"]);
	if (!schemaId) {
		ctx.fail("spec does not name a schema id");
		return;
	}
	if (!ctx.sources.constants.includes(`"${schemaId}"`)) {
		ctx.fail(`schema id "${schemaId}" missing from internal/contracts/constants.go`);
	}
}

function checkHelperFunc(ctx) {
	const helper = extractBacktick(ctx.bullets["helper"]);
	if (!helper) {
		ctx.fail("spec does not name a helper");
		return;
	}
	if (!ctx.sources.proposals.includes(`func ${helper}`)) {
		ctx.fail(`helper func ${helper} missing from internal/runtime/proposals.go`);
	}
}

function checkCLISubcommand(ctx) {
	const cli = extractBacktick(ctx.bullets["cli subcommand"]);
	if (!cli) {
		ctx.fail("spec does not name a CLI subcommand");
		return;
	}
	const parts = cli.replace(/^cautilus\s+/, "").split(/\s+/);
	const registryPath = parts.map((p) => `"${p}"`).join(", ");
	if (!ctx.sources.registry.includes(`"path": [${registryPath}]`)) {
		ctx.fail(`command-registry.json missing "path": [${registryPath}]`);
	}
}

function checkFixture(ctx) {
	const fixtureLink = extractLink(ctx.bullets["example fixture"]);
	if (!fixtureLink) {
		ctx.fail("spec does not link an example fixture");
		return;
	}
	if (!existsSync(resolve(specPath, "..", fixtureLink))) {
		ctx.fail(`example fixture ${fixtureLink} does not exist`);
	}
}

function checkContractDoc(ctx) {
	const contractLink = extractLink(ctx.bullets["contract document"]);
	if (!contractLink) {
		ctx.fail("spec does not link a contract document");
		return;
	}
	if (!existsSync(resolve(specPath, "..", contractLink))) {
		ctx.fail(`contract document ${contractLink} does not exist`);
	}
}

function checkBehaviorSurfaces(ctx) {
	const surfaces = extractBacktickList(ctx.bullets["behavior surfaces"]);
	if (surfaces.length === 0) {
		ctx.fail("spec does not list behavior surfaces");
	}
	for (const surface of surfaces) {
		if (!ctx.sources.intent.includes(`"${surface}"`)) {
			ctx.fail(`behavior surface "${surface}" missing from internal/runtime/intent.go`);
		}
	}
}

function checkAssertionFunc(ctx) {
	if (!ASSERTION_REQUIRED.has(ctx.name)) return;
	if (!ctx.sources.proposals.includes(`func assert${ctx.TC}TargetKind`)) {
		ctx.fail(`assertion func assert${ctx.TC}TargetKind missing from internal/runtime/proposals.go`);
	}
}

function checkHandler(ctx) {
	if (!ctx.sources.app.includes(`func handleScenarioNormalize${ctx.TC}`)) {
		ctx.fail(`handler func handleScenarioNormalize${ctx.TC} missing from internal/app/app.go`);
	}
}

function checkScenariosCatalog(ctx) {
	if (!new RegExp(`Archetype:\\s+"${ctx.name}"`).test(ctx.sources.scenarios)) {
		ctx.fail(`scenarios catalog entry Archetype: "${ctx.name}" missing from internal/runtime/scenarios.go`);
	}
}

function checkReadmeBlock(ctx) {
	const headings = [...ctx.sources.readmeScenarios.matchAll(/^###\s+\d+\.\s+(.*)$/gm)].map(
		(m) => m[1].toLowerCase(),
	);
	if (!headings.some((heading) => heading.includes(ctx.name))) {
		ctx.fail(`README ## Scenarios block has no "### N. ..." heading mentioning "${ctx.name}"`);
	}
}

function checkSkillMdReference(ctx) {
	if (!ctx.sources.skillMd.includes(`scenario normalize ${ctx.name}`)) {
		ctx.fail(`skills/cautilus/SKILL.md missing "scenario normalize ${ctx.name}"`);
	}
}

const ARCHETYPE_CHECKS = [
	checkSchemaConstant,
	checkHelperFunc,
	checkCLISubcommand,
	checkFixture,
	checkContractDoc,
	checkBehaviorSurfaces,
	checkAssertionFunc,
	checkHandler,
	checkScenariosCatalog,
	checkReadmeBlock,
	checkSkillMdReference,
];

function checkArchetype(name, bullets, sources, issues) {
	const TC = titleCase(name);
	const ctx = {
		name,
		TC,
		bullets,
		sources,
		fail: (msg) => issues.push(`archetype ${name}: ${msg}`),
	};
	for (const check of ARCHETYPE_CHECKS) {
		check(ctx);
	}
}

function readReadmeScenariosBlock(readme) {
	const start = readme.indexOf("\n## Scenarios");
	if (start < 0) return "";
	const rest = readme.slice(start + 1);
	const end = rest.slice(3).search(/\n## /);
	return end < 0 ? rest : rest.slice(0, end + 3);
}

function main() {
	const spec = readRequired(specRel);
	const archetypes = parseArchetypeSections(spec);
	if (archetypes.length === 0) {
		process.stderr.write(`${specRel}: no ### archetype headings found under ## Archetypes\n`);
		process.exit(1);
	}

	const sources = {
		constants: readRequired("internal/contracts/constants.go"),
		proposals: readRequired("internal/runtime/proposals.go"),
		scenarios: readRequired("internal/runtime/scenarios.go"),
		intent: readRequired("internal/runtime/intent.go"),
		app: readRequired("internal/app/app.go"),
		registry: readRequired("internal/cli/command-registry.json"),
		skillMd: readRequired("skills/cautilus/SKILL.md"),
		readmeScenarios: readReadmeScenariosBlock(readRequired("README.md")),
	};

	const issues = [];
	for (const { name, bullets } of archetypes) {
		checkArchetype(name, bullets, sources, issues);
	}

	if (issues.length > 0) {
		for (const issue of issues) {
			process.stderr.write(`${issue}\n`);
		}
		process.exit(1);
	}

	process.stdout.write(
		`archetype completeness: ${archetypes.length} archetypes pass 11-surface check\n`,
	);
}

main();
