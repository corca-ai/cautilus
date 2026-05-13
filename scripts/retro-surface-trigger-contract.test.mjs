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

function surfacePaths(surface) {
	return [...(surface.source_paths || []), ...(surface.derived_paths || [])];
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
	const triggerSurfaces = retroAdapter.auto_session_trigger_surfaces || [];

	assert.deepEqual(triggerSurfaces, ["release-packaging"]);
	assert.deepEqual(
		triggerSurfaces.filter((surfaceId) => !surfaceManifest.surfaces.some((surface) => surface.surface_id === surfaceId)),
		[],
	);
	assert.deepEqual(retroAdapter.auto_session_trigger_path_globs, []);
	const releaseSurfacePaths = surfacePaths(releaseSurface);
	const cases = [
		["scripts/release/verify-public-release.mjs", true],
		[".github/workflows/release-artifacts.yml", true],
		[".claude-plugin/marketplace.json", true],
		["plugins/cautilus/.claude-plugin/plugin.json", true],
		["plugins/cautilus/.codex-plugin/plugin.json", true],
		["charness-artifacts/retro/session-release-adapter-rerun.md", false],
	];
	for (const [path, expected] of cases) {
		assert.equal(pathMatchesAny(path, releaseSurfacePaths), expected, path);
	}
});
