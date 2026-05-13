import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { loadFile } from "./_stdlib_yaml.mjs";

const REPO_ROOT = process.cwd();

function escapeRegex(text) {
	return text.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function globToRegex(pattern) {
	let source = "";
	const text = String(pattern);
	for (let index = 0; index < text.length; index += 1) {
		if (text[index] === "*" && text[index + 1] === "*") {
			source += ".*";
			index += 1;
			continue;
		}
		if (text[index] === "*") {
			source += "[^/]*";
			continue;
		}
		source += escapeRegex(text[index]);
	}
	return new RegExp(`^${source}$`);
}

function pathMatchesAny(path, patterns) {
	return patterns.some((pattern) => globToRegex(pattern).test(path));
}

function surfaceForId(surfaces, surfaceId) {
	const surface = surfaces.find((candidate) => candidate.surface_id === surfaceId);
	assert.ok(surface, `expected .agents/surfaces.json to declare ${surfaceId}`);
	return surface;
}

test("retro auto trigger subscribes to release surface ids instead of duplicating raw path globs", () => {
	const retroAdapter = loadFile(join(REPO_ROOT, ".agents", "retro-adapter.yaml"));
	const surfaceManifest = JSON.parse(readFileSync(join(REPO_ROOT, ".agents", "surfaces.json"), "utf-8"));
	const releaseSurface = surfaceForId(surfaceManifest.surfaces, "release-packaging");

	assert.deepEqual(retroAdapter.auto_session_trigger_surfaces, ["release-packaging"]);
	assert.deepEqual(retroAdapter.auto_session_trigger_path_globs, []);
	assert.equal(
		pathMatchesAny("scripts/release/verify-public-release.mjs", releaseSurface.source_paths),
		true,
	);
	assert.equal(
		pathMatchesAny(".github/workflows/release-artifacts.yml", releaseSurface.source_paths),
		true,
	);
	assert.equal(
		pathMatchesAny("charness-artifacts/retro/session-release-adapter-rerun.md", releaseSurface.source_paths),
		false,
	);
});
