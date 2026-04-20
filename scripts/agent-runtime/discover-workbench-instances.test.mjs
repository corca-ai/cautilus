import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const DISCOVER_SCRIPT = join(process.cwd(), "scripts", "agent-runtime", "discover-workbench-instances.mjs");

function runDiscovery(args, cwd = process.cwd()) {
	return spawnSync("node", [DISCOVER_SCRIPT, ...args], {
		cwd,
		encoding: "utf-8",
	});
}

test("discover-workbench-instances normalizes explicit adapter instances into the canonical packet", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-discover-workbench-"));
	try {
		const adapterDir = join(root, ".agents");
		mkdirSync(adapterDir, { recursive: true });
		writeFileSync(
			join(adapterDir, "cautilus-adapter.yaml"),
			[
				"version: 1",
				"repo: temp",
				"evaluation_surfaces:",
				"  - workflow behavior",
				"baseline_options:",
				"  - baseline git ref via {baseline_ref}",
				"instance_discovery:",
				"  kind: explicit",
				"  instances:",
				"    - id: ceal",
				"      display_label: Ceal Production",
				"      data_root: /Users/operator/.ceal/ceal",
				"      paths:",
				"        scenario_store: /Users/operator/.ceal/ceal/scenarios.json",
				"        conversation_summaries: /Users/operator/.ceal/ceal/human-conversations/normalized",
				"",
			].join("\n"),
			"utf-8",
		);
		const result = runDiscovery(["--repo-root", root]);
		assert.equal(result.status, 0, result.stderr);
		const payload = JSON.parse(result.stdout);
		assert.equal(payload.schemaVersion, "cautilus.workbench_instance_catalog.v1");
		assert.match(payload.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
		assert.equal(payload.instances[0].instanceId, "ceal");
		assert.equal(payload.instances[0].displayLabel, "Ceal Production");
		assert.equal(payload.instances[0].dataRoot, "/Users/operator/.ceal/ceal");
		assert.deepEqual(payload.instances[0].paths, {
			scenarioStore: "/Users/operator/.ceal/ceal/scenarios.json",
			conversationSummaries: "/Users/operator/.ceal/ceal/human-conversations/normalized",
		});
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("discover-workbench-instances rejects command-backed discovery to avoid recursive wrappers", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-discover-workbench-command-"));
	try {
		const adapterDir = join(root, ".agents");
		mkdirSync(adapterDir, { recursive: true });
		writeFileSync(
			join(adapterDir, "cautilus-adapter.yaml"),
			[
				"version: 1",
				"repo: temp",
				"evaluation_surfaces:",
				"  - workflow behavior",
				"baseline_options:",
				"  - baseline git ref via {baseline_ref}",
				"instance_discovery:",
				"  kind: command",
				"  command_template: node scripts/consumer/discover-workbench-instances.mjs --repo-root {repo_root} --adapter-path {adapter_path}",
				"",
			].join("\n"),
			"utf-8",
		);
		const result = runDiscovery(["--repo-root", root]);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /only normalizes explicit instance lists/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
