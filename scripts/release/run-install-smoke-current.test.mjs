import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { buildCurrentInstallSmokeArgs, main, readCurrentVersion, runCurrentInstallSmoke } from "./run-install-smoke-current.mjs";

test("readCurrentVersion renders package.json as a tagged install version", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-current-version-"));
	writeFileSync(join(root, "package.json"), JSON.stringify({ version: "9.8.7" }));
	assert.equal(readCurrentVersion(root), "v9.8.7");
});

test("buildCurrentInstallSmokeArgs prepends the install_sh channel and current version", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-current-smoke-"));
	writeFileSync(join(root, "package.json"), JSON.stringify({ version: "9.8.7" }));
	assert.deepEqual(buildCurrentInstallSmokeArgs(["--skip-update", "--json"], root), [
		"--channel",
		"install_sh",
		"--version",
		"v9.8.7",
		"--skip-update",
		"--json",
	]);
});

test("buildCurrentInstallSmokeArgs rejects channel or version overrides", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-current-smoke-reject-"));
	writeFileSync(join(root, "package.json"), JSON.stringify({ version: "9.8.7" }));
	assert.throws(
		() => buildCurrentInstallSmokeArgs(["--version", "v0.0.1"], root),
		/release:smoke-install:current owns --version/,
	);
	assert.throws(
		() => buildCurrentInstallSmokeArgs(["--channel", "homebrew"], root),
		/release:smoke-install:current owns --channel/,
	);
});

test("runCurrentInstallSmoke executes the isolated install smoke for package.json version", async () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-current-smoke-run-"));
	writeFileSync(join(root, "package.json"), JSON.stringify({ version: "9.8.7" }));
	const commands = [];
	const result = await runCurrentInstallSmoke(["--skip-update"], {
		repoRoot: root,
		execCommand: (command, args, options = {}) => {
			commands.push({ command, args, options });
			if (args[0] === "--version") {
				return { exitCode: 0, stdout: "9.8.7\n", stderr: "" };
			}
			return { exitCode: 0, stdout: "ok\n", stderr: "" };
		},
		fetchText: async () => "#!/usr/bin/env sh\nexit 0\n",
	});
	assert.equal(result.version, "v9.8.7");
	assert.equal(result.ok, true);
	assert.equal(commands.some((call) => call.args[0] === "update"), false);
	assert.equal(commands[0].options.env.CAUTILUS_VERSION, "v9.8.7");
});

test("main reports argument errors", async () => {
	const stderr = [];
	const originalWrite = process.stderr.write;
	const originalExit = process.exit;
	process.stderr.write = (chunk) => {
		stderr.push(String(chunk));
		return true;
	};
	process.exit = (code) => {
		throw new Error(`exit ${code}`);
	};
	try {
		await assert.rejects(
			() => main(["--version", "v0.0.1"]),
			/exit 1/,
		);
	} finally {
		process.stderr.write = originalWrite;
		process.exit = originalExit;
	}
	assert.match(stderr.join(""), /release:smoke-install:current owns --version/);
});
