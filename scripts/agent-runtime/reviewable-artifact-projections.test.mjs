import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const MATRIX_PATH = "docs/contracts/reviewable-artifact-projections.json";
const COMMAND_REGISTRY_PATH = "internal/cli/command-registry.json";

function readJSON(path) {
	return JSON.parse(readFileSync(path, "utf8"));
}

function asArray(value) {
	return Array.isArray(value) ? value : [];
}

test("reviewable artifact projection matrix covers shipped readable views", () => {
	const matrix = readJSON(MATRIX_PATH);
	assert.equal(matrix.schemaVersion, "cautilus.reviewable_artifact_projection_matrix.v1");
	assert.match(matrix.scope.truthSourcePolicy, /projection over one or more machine-readable packet or source artifacts/);
	assert.equal(asArray(matrix.surfaces).length, 14);
	const ids = new Set();
	for (const surface of matrix.surfaces) {
		assert.equal(ids.has(surface.id), false, `duplicate surface id: ${surface.id}`);
		ids.add(surface.id);
		for (const field of ["readableView", "renderer"]) {
			assert.equal(typeof surface[field], "string", `${surface.id}.${field} must be a string`);
			assert.notEqual(surface[field].trim(), "", `${surface.id}.${field} must not be empty`);
		}
		for (const field of ["sourceArtifacts", "sourceSchemas", "tests", "commands", "proofMarkers"]) {
			assert.ok(asArray(surface[field]).length > 0, `${surface.id}.${field} must be a non-empty array`);
		}
		assert.equal(existsSync(surface.renderer), true, `${surface.id}.renderer must exist`);
		for (const testPath of surface.tests) {
			assert.equal(existsSync(testPath), true, `${surface.id}.tests path must exist: ${testPath}`);
		}
	}
	for (const expected of [
		"report-html",
		"review-html",
		"review-summary-html",
		"compare-html",
		"scenario-proposals-html",
		"scenario-conversation-review-html",
		"evidence-bundle-html",
		"run-index-html",
		"self-dogfood-html",
		"self-dogfood-experiments-html",
		"review-prompt-markdown",
		"claim-status-markdown",
		"claim-discovery-review-markdown",
		"claim-status-browser-review",
	]) {
		assert.equal(ids.has(expected), true, `missing shipped readable view: ${expected}`);
	}
});

test("reviewable artifact projection matrix markers point at executable proof", () => {
	const matrix = readJSON(MATRIX_PATH);
	for (const surface of matrix.surfaces) {
		for (const marker of surface.proofMarkers) {
			assert.equal(existsSync(marker.path), true, `${surface.id} proof marker path must exist: ${marker.path}`);
			const text = readFileSync(marker.path, "utf8");
			for (const fragment of asArray(marker.contains)) {
				assert.match(text, new RegExp(escapeRegExp(fragment)), `${surface.id} proof marker missing ${fragment} in ${marker.path}`);
			}
		}
	}
});

test("reviewable artifact projection matrix covers shipped CLI readable renderers", () => {
	const matrix = readJSON(MATRIX_PATH);
	const registry = readJSON(COMMAND_REGISTRY_PATH);
	const commands = new Map(asArray(registry.commands).map((command) => [asArray(command.path).join(" "), command]));
	for (const matcher of asArray(matrix.registryMatchers)) {
		const command = commands.get(asArray(matcher.path).join(" "));
		assert.ok(command, `command registry is missing ${asArray(matcher.path).join(" ")}`);
		for (const fragment of asArray(matcher.usageIncludes)) {
			assert.match(command.usage, new RegExp(escapeRegExp(fragment)), `registry usage for ${command.path.join(" ")} must include ${fragment}`);
		}
	}
	const matrixCliCommands = new Set(
		asArray(matrix.surfaces)
			.flatMap((surface) => asArray(surface.commands))
			.filter((command) => command.startsWith("cautilus "))
			.map((command) => command.replace(/^cautilus\s+/, "")),
	);
	for (const matcher of asArray(matrix.registryMatchers)) {
		assert.equal(matrixCliCommands.has(matcher.path.join(" ")), true, `matrix surface missing registry renderer ${matcher.path.join(" ")}`);
	}
	const registryMatcherCommands = new Set(asArray(matrix.registryMatchers).map((matcher) => matcher.path.join(" ")));
	for (const command of matrixCliCommands) {
		assert.equal(registryMatcherCommands.has(command), true, `registryMatchers missing matrix CLI renderer ${command}`);
	}
});

function escapeRegExp(value) {
	return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
