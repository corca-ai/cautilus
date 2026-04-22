import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { applyVersionBump, normalizeVersion, updateVersionedJson } from "./bump-version.mjs";

function writeFile(root, relativePath, content) {
	const filePath = join(root, relativePath);
	mkdirSync(join(filePath, ".."), { recursive: true });
	writeFileSync(filePath, content, "utf-8");
}

test("normalizeVersion accepts bare and v-prefixed semver values", () => {
	assert.equal(normalizeVersion("0.2.4"), "0.2.4");
	assert.equal(normalizeVersion("v0.2.4"), "0.2.4");
	assert.throws(() => normalizeVersion("main"), /Expected a semver-like version/);
});

test("updateVersionedJson updates the known release metadata files", () => {
	assert.equal(
		JSON.parse(updateVersionedJson("package.json", '{\n  "version": "0.2.3"\n}\n', "0.2.4")).version,
		"0.2.4",
	);
	assert.equal(
		JSON.parse(
			updateVersionedJson(
				"package-lock.json",
				'{\n  "version": "0.2.3",\n  "packages": {\n    "": {\n      "version": "0.2.3"\n    }\n  }\n}\n',
				"0.2.4",
			),
		).packages[""].version,
		"0.2.4",
	);
	assert.equal(
		JSON.parse(
			updateVersionedJson(
				".claude-plugin/marketplace.json",
				'{\n  "metadata": {\n    "version": "0.2.3"\n  },\n  "plugins": [\n    {\n      "name": "cautilus",\n      "version": "0.2.3"\n    }\n  ]\n}\n',
				"0.2.4",
			),
		).plugins[0].version,
		"0.2.4",
	);
});

test("applyVersionBump rewrites the checked-in release metadata set", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-bump-version-"));
	try {
		writeFile(root, "package.json", '{\n  "version": "0.2.3"\n}\n');
		writeFile(
			root,
			"package-lock.json",
			'{\n  "version": "0.2.3",\n  "packages": {\n    "": {\n      "version": "0.2.3"\n    }\n  }\n}\n',
		);
		writeFile(
			root,
			".claude-plugin/marketplace.json",
			'{\n  "metadata": {\n    "version": "0.2.3"\n  },\n  "plugins": [\n    {\n      "name": "cautilus",\n      "version": "0.2.3"\n    }\n  ]\n}\n',
		);
		writeFile(root, "plugins/cautilus/.claude-plugin/plugin.json", '{\n  "version": "0.2.3"\n}\n');
		writeFile(root, "plugins/cautilus/.codex-plugin/plugin.json", '{\n  "version": "0.2.3"\n}\n');

		const result = applyVersionBump({ repoRoot: root, version: "0.2.4" });
		assert.deepEqual(result.changedFiles.sort(), [
			".claude-plugin/marketplace.json",
			"package-lock.json",
			"package.json",
			"plugins/cautilus/.claude-plugin/plugin.json",
			"plugins/cautilus/.codex-plugin/plugin.json",
		]);
		assert.equal(JSON.parse(readFileSync(join(root, "package.json"), "utf-8")).version, "0.2.4");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
