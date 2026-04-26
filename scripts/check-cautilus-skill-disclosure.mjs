import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
const SOURCE_SKILL = "skills/cautilus/SKILL.md";
const PACKAGED_SKILL = "plugins/cautilus/skills/cautilus/SKILL.md";
const MAX_NONEMPTY_LINES = 180;

const REQUIRED_FRAGMENTS = [
	"## CLI First",
	"cautilus --help",
	"cautilus commands --json",
	"cautilus claim discover --repo-root .",
	"cautilus scenarios --json",
	"--example-input",
	"## Declared Claim Discovery",
	"`claim`, `eval`, and `optimize`",
	"eval-summary.json",
	"repo / whole-repo",
	"app / prompt",
	"cautilus install --repo-root",
	"doctor --scope agent-surface",
	"review variants are requested but unavailable",
	"command-cookbook.md",
];

const FORBIDDEN_FRAGMENTS = [
	"### 1. Chatbot conversation regression",
	"### 2. Skill / agent execution regression",
	"### 3. Durable workflow recovery",
	"fixtures/scenario-proposals/chatbot-input.json",
	"fixtures/scenario-proposals/skill-input.json",
	"fixtures/scenario-proposals/workflow-input.json",
	"When `eval test` or `report build` emits `report.json`",
	"Build `report.json` and treat it as the first decision surface.",
	"Use iterate mode for tuning, held-out mode for validation, and full gate for ship decisions.",
];

const GLOBAL_FORBIDDEN_FRAGMENTS = [
	"When `eval test` or `report build` emits `report.json`",
	"Build `report.json` and treat it as the first decision surface.",
	"Use iterate mode for tuning, held-out mode for validation, and full gate for ship decisions.",
	"| `report.json`                     | `eval test`, `report build`",
	"| `eval test`       | wired      | `report-input.json`, `report.json`",
	"The legacy `dogfood:self`",
	"README proof",
];

function read(path) {
	return readFileSync(path, "utf8");
}

function markdownFilesUnder(root) {
	const entries = readdirSync(root, { withFileTypes: true });
	const paths = [];
	for (const entry of entries) {
		const path = join(root, entry.name);
		if (entry.isDirectory()) {
			paths.push(...markdownFilesUnder(path));
		} else if (entry.isFile() && path.endsWith(".md")) {
			paths.push(path);
		}
	}
	return paths;
}

function stripFrontmatter(markdown) {
	if (!markdown.startsWith("---\n")) {
		return markdown;
	}
	const end = markdown.indexOf("\n---\n", 4);
	if (end === -1) {
		return markdown;
	}
	return markdown.slice(end + "\n---\n".length);
}

function nonemptyLineCount(markdown) {
	return stripFrontmatter(markdown)
		.split("\n")
		.filter((line) => line.trim()).length;
}

function checkSkill(path, body) {
	const problems = [];
	const lineCount = nonemptyLineCount(body);
	if (lineCount > MAX_NONEMPTY_LINES) {
		problems.push(`${path}: core has ${lineCount} non-empty lines; max is ${MAX_NONEMPTY_LINES}`);
	}
	for (const fragment of REQUIRED_FRAGMENTS) {
		if (!body.includes(fragment)) {
			problems.push(`${path}: missing required progressive-disclosure fragment: ${fragment}`);
		}
	}
	for (const fragment of FORBIDDEN_FRAGMENTS) {
		if (body.includes(fragment)) {
			problems.push(`${path}: duplicates command/example detail that should stay in the binary or references: ${fragment}`);
		}
	}
	return { lineCount, problems };
}

function checkSkillTree(root) {
	const problems = [];
	for (const path of markdownFilesUnder(root)) {
		if (!statSync(path).isFile()) {
			continue;
		}
		const body = read(path);
		for (const fragment of GLOBAL_FORBIDDEN_FRAGMENTS) {
			if (body.includes(fragment)) {
				problems.push(`${path}: stale operational guidance remains: ${fragment}`);
			}
		}
	}
	return problems;
}

const source = read(SOURCE_SKILL);
const packaged = read(PACKAGED_SKILL);
const problems = [];

if (source !== packaged) {
	problems.push(`${PACKAGED_SKILL}: packaged skill is not byte-identical to ${SOURCE_SKILL}; run npm run skills:sync-packaged`);
}

const sourceResult = checkSkill(SOURCE_SKILL, source);
const packagedResult = checkSkill(PACKAGED_SKILL, packaged);
problems.push(...sourceResult.problems, ...packagedResult.problems);
problems.push(...checkSkillTree("skills/cautilus"), ...checkSkillTree("plugins/cautilus/skills/cautilus"));

if (problems.length > 0) {
	console.error("check-cautilus-skill-disclosure: failed");
	for (const problem of problems) {
		console.error(`- ${problem}`);
	}
	process.exit(1);
}

console.log(
	JSON.stringify(
		{
			status: "ok",
			sourceSkill: SOURCE_SKILL,
			packagedSkill: PACKAGED_SKILL,
			maxNonemptyLines: MAX_NONEMPTY_LINES,
			sourceNonemptyLines: sourceResult.lineCount,
			packagedNonemptyLines: packagedResult.lineCount,
			requiredFragments: REQUIRED_FRAGMENTS.length,
			forbiddenFragments: FORBIDDEN_FRAGMENTS.length,
			globalForbiddenFragments: GLOBAL_FORBIDDEN_FRAGMENTS.length,
		},
		null,
		2,
	),
);
