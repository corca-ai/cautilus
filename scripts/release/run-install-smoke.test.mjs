import assert from "node:assert/strict";
import test from "node:test";

import {
	normalizeVersion,
	parseArgs,
	renderInstallerUrl,
	runInstallSmoke,
} from "./run-install-smoke.mjs";

function createExecStub() {
	const calls = [];
	function execCommand(command, args, options = {}) {
		calls.push({
			command,
			args,
			options,
		});
		if (String(args[0] || "") === "--version") {
			return { exitCode: 0, stdout: "1.2.3\n", stderr: "" };
		}
		return { exitCode: 0, stdout: "ok\n", stderr: "" };
	}
	return { calls, execCommand };
}

test("normalizeVersion strips a leading v prefix", () => {
	assert.equal(normalizeVersion("v1.2.3"), "1.2.3");
	assert.equal(normalizeVersion("1.2.3"), "1.2.3");
});

test("renderInstallerUrl points at the public install.sh path", () => {
	assert.equal(
		renderInstallerUrl("corca-ai/cautilus"),
		"https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh",
	);
});

test("runInstallSmoke drives the install.sh channel through an isolated workspace", async () => {
	const { calls, execCommand } = createExecStub();
	const installerFetches = [];
	const result = await runInstallSmoke(
		{
			channel: "install_sh",
			version: "v1.2.3",
			repo: "corca-ai/cautilus",
			installerSource: "github",
			skipUpdate: false,
			keepWorkdir: false,
		},
		{
			execCommand,
			fetchText: async (url) => {
				installerFetches.push(url);
				return "#!/usr/bin/env sh\nexit 0\n";
			},
		},
	);

	assert.equal(result.ok, true);
	assert.deepEqual(installerFetches, ["https://raw.githubusercontent.com/corca-ai/cautilus/main/install.sh"]);
	assert.equal(calls[0].command, "sh");
	assert.match(calls[1].command, /cautilus$/);
	assert.deepEqual(calls[1].args, ["--version"]);
	assert.deepEqual(calls[2].args, ["version", "--verbose"]);
	assert.deepEqual(calls[3].args, ["update"]);
	assert.equal(calls[0].options.env.CAUTILUS_VERSION, "v1.2.3");
	assert.match(calls[0].options.env.CAUTILUS_INSTALL_ROOT, /install-root$/);
	assert.match(calls[0].options.env.CAUTILUS_BIN_DIR, /bin$/);
});

test("parseArgs rejects legacy Homebrew as an install smoke channel", () => {
	assert.throws(
		() => parseArgs(["--channel", "homebrew"]),
		/--channel must be install_sh/,
	);
});

test("runInstallSmoke can skip update for the install.sh channel", async () => {
	const { calls, execCommand } = createExecStub();
	await runInstallSmoke(
		{
			channel: "install_sh",
			version: "v1.2.3",
			repo: "corca-ai/cautilus",
			installerSource: "local",
			skipUpdate: true,
			keepWorkdir: false,
		},
		{
			execCommand,
		},
	);
	assert.equal(calls.some((call) => call.args[0] === "update"), false);
});
