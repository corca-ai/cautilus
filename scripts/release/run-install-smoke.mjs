import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { resolveReleaseTargets } from "./resolve-release-targets.mjs";

const supportedChannels = new Set(["install_sh", "homebrew"]);

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/release/run-install-smoke.mjs --channel <install_sh|homebrew> [--version <v0.3.0>] [--repo <owner/name>] [--tap-repo <owner/name>] [--installer-source <github|local>] [--skip-update] [--allow-system-mutation] [--keep-workdir] [--json]",
	].join("\n");
	const stream = exitCode === 0 ? process.stdout : process.stderr;
	stream.write(`${text}\n`);
	process.exit(exitCode);
}

function readRequiredValue(argv, index, option) {
	const value = argv[index + 1] || "";
	if (!value) {
		throw new Error(`${option} requires a value`);
	}
	return value;
}

function readPackageVersion() {
	const packageJsonPath = resolve(process.cwd(), "package.json");
	return JSON.parse(readFileSync(packageJsonPath, "utf-8")).version;
}

function defaultVersion() {
	return `v${readPackageVersion()}`;
}

function parseArgs(argv = process.argv.slice(2)) {
	const targets = resolveReleaseTargets();
	const options = {
		channel: "",
		version: defaultVersion(),
		repo: targets.sourceRepo,
		tapRepo: targets.tapRepo,
		installerSource: "github",
		allowSystemMutation: false,
		skipUpdate: false,
		keepWorkdir: false,
		json: false,
	};
	for (let index = 0; index < argv.length; index += 1) {
		index = applyArg(options, argv, index);
	}
	if (!supportedChannels.has(options.channel)) {
		throw new Error("--channel must be install_sh or homebrew");
	}
	if (options.installerSource !== "github" && options.installerSource !== "local") {
		throw new Error("--installer-source must be github or local");
	}
	if (options.channel === "homebrew" && !options.allowSystemMutation) {
		throw new Error("homebrew smoke requires --allow-system-mutation");
	}
	return options;
}

function applyArg(options, argv, index) {
	const arg = argv[index];
	if (arg === "-h" || arg === "--help") {
		usage(0);
	}
	const flagMap = {
		"--allow-system-mutation": () => {
			options.allowSystemMutation = true;
			return index;
		},
		"--skip-update": () => {
			options.skipUpdate = true;
			return index;
		},
		"--keep-workdir": () => {
			options.keepWorkdir = true;
			return index;
		},
		"--json": () => {
			options.json = true;
			return index;
		},
	};
	const valueMap = {
		"--channel": "channel",
		"--version": "version",
		"--repo": "repo",
		"--tap-repo": "tapRepo",
		"--installer-source": "installerSource",
	};
	if (flagMap[arg]) {
		return flagMap[arg]();
	}
	const target = valueMap[arg];
	if (!target) {
		throw new Error(`Unknown argument: ${arg}`);
	}
	options[target] = readRequiredValue(argv, index, arg);
	return index + 1;
}

export function normalizeVersion(version) {
	return String(version || "").trim().replace(/^v/, "");
}

export function deriveTapFormulaRef(tapRepo) {
	const owner = String(tapRepo || "").split("/")[0] || "corca-ai";
	return `${owner}/tap/cautilus`;
}

export function renderInstallerUrl(repo) {
	return `https://raw.githubusercontent.com/${repo}/main/install.sh`;
}

function createWorkspace() {
	const root = mkdtempSync(join(tmpdir(), "cautilus-install-smoke-"));
	const installRoot = join(root, "install-root");
	const binDir = join(root, "bin");
	const homeDir = join(root, "home");
	mkdirSync(installRoot, { recursive: true });
	mkdirSync(binDir, { recursive: true });
	mkdirSync(homeDir, { recursive: true });
	return { root, installRoot, binDir, homeDir };
}

function defaultFetchText(url, fetchImplementation = fetch) {
	return fetchImplementation(url).then(async (response) => {
		if (!response.ok) {
			throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
		}
		return response.text();
	});
}

function writeInstallerFile(workspaceRoot, content) {
	const installerPath = join(workspaceRoot, "install.sh");
	writeFileSync(installerPath, content, "utf-8");
	chmodSync(installerPath, 0o755);
	return installerPath;
}

function summarizeCommand(command, args, result) {
	return {
		command,
		args,
		exitCode: result.exitCode,
		stdout: result.stdout,
		stderr: result.stderr,
	};
}

function runCommand(command, args, { cwd = process.cwd(), env = process.env } = {}) {
	const result = spawnSync(command, args, {
		cwd,
		env,
		encoding: "utf-8",
	});
	const summary = {
		exitCode: result.status ?? 1,
		stdout: result.stdout ?? "",
		stderr: result.stderr ?? "",
	};
	if (summary.exitCode !== 0) {
		throw new Error(
			`${command} ${args.join(" ")} failed with exit ${summary.exitCode}\n${summary.stderr || summary.stdout}`,
		);
	}
	return summary;
}

function ensureExpectedVersion(commandSummary, version) {
	const expected = normalizeVersion(version);
	const actual = String(commandSummary.stdout || "").trim();
	if (actual !== expected) {
		throw new Error(`expected version ${expected}, got ${actual || "<empty>"}`);
	}
}

async function materializeInstaller({ workspaceRoot, installerSource, repo }, { fetchText = defaultFetchText } = {}) {
	if (installerSource === "local") {
		return resolve(process.cwd(), "install.sh");
	}
	const content = await fetchText(renderInstallerUrl(repo));
	return writeInstallerFile(workspaceRoot, content);
}

async function runInstallShSmoke(
	{ version, repo, installerSource, skipUpdate, keepWorkdir },
	{ execCommand = runCommand, fetchText = defaultFetchText } = {},
) {
	const workspace = createWorkspace();
	const summary = {
		channel: "install_sh",
		version,
		repo,
		workdir: workspace.root,
		installerSource,
		binPath: join(workspace.binDir, "cautilus"),
		commands: [],
	};
	try {
		const installerPath = await materializeInstaller(
			{ workspaceRoot: workspace.root, installerSource, repo },
			{ fetchText },
		);
		summary.installerPath = installerPath;
		const env = {
			...process.env,
			HOME: workspace.homeDir,
			CAUTILUS_VERSION: version,
			CAUTILUS_INSTALL_ROOT: workspace.installRoot,
			CAUTILUS_BIN_DIR: workspace.binDir,
			CAUTILUS_REPO: repo,
			PATH: `${workspace.binDir}:${process.env.PATH || ""}`,
		};
		const installResult = execCommand("sh", [installerPath], { cwd: workspace.root, env });
		summary.commands.push(summarizeCommand("sh", [installerPath], installResult));
		const versionResult = execCommand(summary.binPath, ["--version"], { cwd: workspace.root, env });
		ensureExpectedVersion(versionResult, version);
		summary.commands.push(summarizeCommand(summary.binPath, ["--version"], versionResult));
		const verboseResult = execCommand(summary.binPath, ["version", "--verbose"], { cwd: workspace.root, env });
		summary.commands.push(summarizeCommand(summary.binPath, ["version", "--verbose"], verboseResult));
		if (!skipUpdate) {
			const updateResult = execCommand(summary.binPath, ["update"], { cwd: workspace.root, env });
			summary.commands.push(summarizeCommand(summary.binPath, ["update"], updateResult));
		}
		summary.ok = true;
		return summary;
	} finally {
		if (!keepWorkdir) {
			rmSync(workspace.root, { recursive: true, force: true });
		}
	}
}

function buildHomebrewEnv() {
	return {
		...process.env,
		HOMEBREW_NO_AUTO_UPDATE: "1",
		HOMEBREW_NO_INSTALL_CLEANUP: "1",
	};
}

function runHomebrewSmoke(
	{ version, tapRepo, skipUpdate },
	{ execCommand = runCommand } = {},
) {
	const formulaRef = deriveTapFormulaRef(tapRepo);
	const env = buildHomebrewEnv();
	const summary = {
		channel: "homebrew",
		version,
		tapRepo,
		formulaRef,
		commands: [],
	};
	const installResult = execCommand("brew", ["install", formulaRef], { env });
	summary.commands.push(summarizeCommand("brew", ["install", formulaRef], installResult));
	const versionResult = execCommand("cautilus", ["--version"], { env });
	ensureExpectedVersion(versionResult, version);
	summary.commands.push(summarizeCommand("cautilus", ["--version"], versionResult));
	const verboseResult = execCommand("cautilus", ["version", "--verbose"], { env });
	summary.commands.push(summarizeCommand("cautilus", ["version", "--verbose"], verboseResult));
	if (!skipUpdate) {
		const updateResult = execCommand("cautilus", ["update"], { env });
		summary.commands.push(summarizeCommand("cautilus", ["update"], updateResult));
	}
	summary.ok = true;
	return summary;
}

export async function runInstallSmoke(options, dependencies = {}) {
	if (options.channel === "install_sh") {
		return runInstallShSmoke(options, dependencies);
	}
	return runHomebrewSmoke(options, dependencies);
}

export async function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArgs(argv);
		const result = await runInstallSmoke(options);
		if (options.json) {
			process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
			return;
		}
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	await main();
}
