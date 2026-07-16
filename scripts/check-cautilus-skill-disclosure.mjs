import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
const SOURCE_SKILL = "skills/cautilus-agent/SKILL.md";
const PACKAGED_SKILL = "plugins/cautilus/skills/cautilus-agent/SKILL.md";
// Budget grew from 180 to 185 when the Runner Readiness routing concern was added
// to the core: a genuine Agent-owned routing/sequencing surface (orient runner
// readiness, gate app proof on proof class, stop improve without runner-backed
// proof). Its build/assess detail stays in references/runner-readiness.md, and the
// "## Runner Readiness" required fragment below keeps the routing in the core.
const MAX_NONEMPTY_LINES = 185;

const REQUIRED_FRAGMENTS = [
	"## CLI First",
	"cautilus --help",
	"cautilus doctor commands --format json",
	"cautilus discover claims --repo-root .",
	"cautilus discover scenarios --format json",
	"--example-input",
	"## Declared Claim Discovery",
	"`claim`, `eval`, and `improve`",
	"eval-summary.json",
	"dev / repo",
	"app / prompt",
	"cautilus init --repo-root",
	"doctor --scope agent-surface",
	"evaluate review variants are requested but unavailable",
	"command-cookbook.md",
	"## Runner Readiness",
	"runner_assessment.v1",
	"runner-readiness.md",
];

const FORBIDDEN_FRAGMENTS = [
	"### 1. Chatbot conversation regression",
	"### 2. Skill / agent execution regression",
	"### 3. Durable workflow recovery",
	"fixtures/scenario-proposals/chatbot-input.json",
	"fixtures/scenario-proposals/skill-input.json",
	"fixtures/scenario-proposals/workflow-input.json",
	"When `evaluate fixture` or `report build` emits `report.json`",
	"Build `report.json` and treat it as the first decision surface.",
	"Use iterate mode for tuning, held-out mode for validation, and full gate for ship decisions.",
];

const GLOBAL_FORBIDDEN_FRAGMENTS = [
	"When `evaluate fixture` or `report build` emits `report.json`",
	"Build `report.json` and treat it as the first decision surface.",
	"Use iterate mode for tuning, held-out mode for validation, and full gate for ship decisions.",
	"| `report.json`                     | `evaluate fixture`, `report build`",
	"| `evaluate fixture`       | wired      | `report-input.json`, `report.json`",
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

// Source/packaged parity for the whole skill tree (SKILL.md plus every
// reference, with upward links re-based) is owned by
// `npm run lint:skill-packaged-sync` (scripts/release/sync-packaged-skill.mjs
// --check). This check does not byte-compare SKILL.md, because a future upward
// link in SKILL.md must be rewritten in the package and a byte-compare would
// contradict the sync transform.

const sourceResult = checkSkill(SOURCE_SKILL, source);
const packagedResult = checkSkill(PACKAGED_SKILL, packaged);
problems.push(...sourceResult.problems, ...packagedResult.problems);
problems.push(...checkSkillTree("skills/cautilus-agent"), ...checkSkillTree("plugins/cautilus/skills/cautilus-agent"));

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
