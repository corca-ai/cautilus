import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { checkProofBoundaryNames } from "./check-proof-boundary-names.mjs";

const SCRIPT = join(process.cwd(), "scripts", "check-proof-boundary-names.mjs");

test("dogfood live scripts may use the shipped evaluate live command surface", () => {
	const violations = checkProofBoundaryNames({
		"dogfood:app:live": "cautilus evaluate live --repo-root .",
		"proof:behavior-eval:live": "node scripts/on-demand/behavior-eval-live-proof.mjs",
		"dogfood:fixture": "node scripts/fixture.mjs",
	});

	assert.deepEqual(violations, []);
});

test("dogfood live script names reject non-live or unshipped live runner commands", () => {
	const violations = checkProofBoundaryNames({
		"dogfood:app:live": "node scripts/on-demand/behavior-eval-live-proof.mjs",
		"dogfood:legacy:live": "cautilus eval live --repo-root .",
	});

	assert.deepEqual(violations, [
		{
			name: "dogfood:app:live",
			command: "node scripts/on-demand/behavior-eval-live-proof.mjs",
			reason: "dogfood script names ending in :live must call `cautilus evaluate live` so coding-agent messaging proof is not mislabeled as product-runner proof.",
		},
		{
			name: "dogfood:legacy:live",
			command: "cautilus eval live --repo-root .",
			reason: "dogfood script names ending in :live must call `cautilus evaluate live` so coding-agent messaging proof is not mislabeled as product-runner proof.",
		},
	]);
});

test("proof boundary checker CLI reports success for the current package", () => {
	const result = spawnSync("node", [SCRIPT], {
		encoding: "utf-8",
	});

	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /check-proof-boundary-names: ok/);
});

test("proof boundary checker CLI reports offending live dogfood scripts", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-proof-boundary-"));
	try {
		writeFileSync(
			join(root, "package.json"),
			`${JSON.stringify({
				scripts: {
					"dogfood:bad:live": "node scripts/on-demand/behavior-eval-live-proof.mjs",
				},
			}, null, 2)}\n`,
			"utf-8",
		);

		const result = spawnSync("node", [SCRIPT], {
			cwd: root,
			encoding: "utf-8",
		});

		assert.equal(result.status, 1);
		assert.match(result.stderr, /dogfood:bad:live/);
		assert.match(result.stderr, /must call `cautilus evaluate live`/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
