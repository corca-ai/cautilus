import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const STARTER_PAIRS = [
	{
		archetype: "chatbot",
		canonical: "fixtures/scenario-proposals/chatbot-input.json",
		starter: "examples/starters/chatbot/input.json",
	},
	{
		archetype: "skill",
		canonical: "fixtures/scenario-proposals/skill-input.json",
		starter: "examples/starters/skill/input.json",
	},
	{
		archetype: "workflow",
		canonical: "fixtures/scenario-proposals/workflow-input.json",
		starter: "examples/starters/workflow/input.json",
	},
];

for (const pair of STARTER_PAIRS) {
	test(`starter kit ${pair.archetype} input.json matches the canonical fixture byte-for-byte`, () => {
		const canonicalPath = join(process.cwd(), pair.canonical);
		const starterPath = join(process.cwd(), pair.starter);
		const canonical = readFileSync(canonicalPath, "utf-8");
		const starter = readFileSync(starterPath, "utf-8");
		assert.equal(
			starter,
			canonical,
			`Starter kit fixture drifted from canonical.\n` +
				`  starter:   ${pair.starter}\n` +
				`  canonical: ${pair.canonical}\n` +
				`The starter fixture is a drift-tested copy kept byte-identical to the canonical fixture. ` +
				`Update both files together, or re-run the copy: \`cp ${pair.canonical} ${pair.starter}\`.`,
		);
	});
}
