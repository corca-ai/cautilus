import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/on-demand/smoke-external-consumer.mjs [--cautilus-bin <path>] [--output-dir <path>] [--keep-workdir] [--json]",
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

function parseArgs(argv = process.argv.slice(2)) {
	const options = {
		cautilusBin: resolve(process.cwd(), "bin", "cautilus"),
		outputDir: "",
		keepWorkdir: false,
		json: false,
	};
	for (let index = 0; index < argv.length; index += 1) {
		index = applyArg(options, argv, index);
	}
	return options;
}

function applyArg(options, argv, index) {
	const arg = argv[index];
	if (arg === "-h" || arg === "--help") {
		usage(0);
	}
	if (arg === "--keep-workdir") {
		options.keepWorkdir = true;
		return index;
	}
	if (arg === "--json") {
		options.json = true;
		return index;
	}
	const valueMap = {
		"--cautilus-bin": "cautilusBin",
		"--output-dir": "outputDir",
	};
	const target = valueMap[arg];
	if (!target) {
		throw new Error(`Unknown argument: ${arg}`);
	}
	options[target] = readRequiredValue(argv, index, arg);
	return index + 1;
}

function createWorkspace(outputDir) {
	if (outputDir) {
		const root = resolve(outputDir);
		mkdirSync(root, { recursive: true });
		return { root, repoRoot: root };
	}
	const root = mkdtempSync(join(tmpdir(), "cautilus-consumer-onboarding-"));
	return {
		root,
		repoRoot: join(root, "consumer-repo"),
	};
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

function ensurePathExists(path, label) {
	if (!existsSync(path)) {
		throw new Error(`${label} was not created: ${path}`);
	}
}

function ensureSymlink(path, label) {
	ensurePathExists(path, label);
	if (!lstatSync(path).isSymbolicLink()) {
		throw new Error(`${label} is not a symlink: ${path}`);
	}
}

function seedBootstrapGitignore(repoRoot) {
	const gitignorePath = join(repoRoot, ".gitignore");
	if (existsSync(gitignorePath)) {
		return gitignorePath;
	}
	writeFileSync(
		gitignorePath,
		[
			"# Local outputs produced during consumer smoke runs",
			"tmp/",
		].join("\n") + "\n",
		"utf-8",
	);
	return gitignorePath;
}

function seedReadyAdapter(adapterPath) {
	const current = readFileSync(adapterPath, "utf-8");
	if (!current.includes("held_out_command_templates: []")) {
		return;
	}
	const next = current.replace(
		"held_out_command_templates: []",
		[
			"held_out_command_templates:",
			"    - node -e \"console.log('external consumer smoke ok')\"",
		].join("\n"),
	);
	writeFileSync(adapterPath, next, "utf-8");
}

export function readDoctorReady(stdout) {
	const payload = JSON.parse(stdout);
	return payload.ready === true;
}

function readJSONFile(path) {
	return JSON.parse(readFileSync(path, "utf-8"));
}

export async function runExternalConsumerOnboardingSmoke(
	{ cautilusBin, outputDir = "", keepWorkdir = false },
	{ execCommand = runCommand } = {},
) {
	const workspace = createWorkspace(outputDir);
	const summary = {
		cautilusBin,
		workdir: workspace.root,
		repoRoot: workspace.repoRoot,
		commands: [],
	};
	mkdirSync(workspace.repoRoot, { recursive: true });
	try {
		const gitInit = execCommand("git", ["init", "-q", workspace.repoRoot]);
		summary.commands.push(summarizeCommand("git", ["init", "-q", workspace.repoRoot], gitInit));

		const gitignorePath = seedBootstrapGitignore(workspace.repoRoot);
		summary.commands.push({
			command: "seed-bootstrap-gitignore",
			args: [gitignorePath],
			exitCode: 0,
			stdout: "wrote minimal .gitignore\n",
			stderr: "",
		});

		const gitConfigName = execCommand("git", ["-C", workspace.repoRoot, "config", "user.name", "Cautilus Smoke"]);
		summary.commands.push(
			summarizeCommand("git", ["-C", workspace.repoRoot, "config", "user.name", "Cautilus Smoke"], gitConfigName),
		);

		const gitConfigEmail = execCommand("git", ["-C", workspace.repoRoot, "config", "user.email", "smoke@cautilus.local"]);
		summary.commands.push(
			summarizeCommand(
				"git",
				["-C", workspace.repoRoot, "config", "user.email", "smoke@cautilus.local"],
				gitConfigEmail,
			),
		);

		const install = execCommand(cautilusBin, ["install", "--repo-root", workspace.repoRoot, "--json"]);
		summary.commands.push(summarizeCommand(cautilusBin, ["install", "--repo-root", workspace.repoRoot, "--json"], install));

		const adapterInit = execCommand(cautilusBin, ["adapter", "init", "--repo-root", workspace.repoRoot]);
		summary.commands.push(summarizeCommand(cautilusBin, ["adapter", "init", "--repo-root", workspace.repoRoot], adapterInit));

		const adapterPath = join(workspace.repoRoot, ".agents", "cautilus-adapter.yaml");
		seedReadyAdapter(adapterPath);
		summary.commands.push({
			command: "seed-ready-adapter",
			args: [adapterPath],
			exitCode: 0,
			stdout: "added minimal held_out command template\n",
			stderr: "",
		});

		const gitAdd = execCommand("git", ["-C", workspace.repoRoot, "add", ".gitignore", ".agents", ".claude"]);
		summary.commands.push(
			summarizeCommand("git", ["-C", workspace.repoRoot, "add", ".gitignore", ".agents", ".claude"], gitAdd),
		);

		const gitCommit = execCommand("git", [
			"-C",
			workspace.repoRoot,
			"commit",
			"-q",
			"-m",
			"Bootstrap cautilus consumer smoke repo",
		]);
		summary.commands.push(
			summarizeCommand(
				"git",
				["-C", workspace.repoRoot, "commit", "-q", "-m", "Bootstrap cautilus consumer smoke repo"],
				gitCommit,
			),
		);

		const adapterResolve = execCommand(cautilusBin, ["adapter", "resolve", "--repo-root", workspace.repoRoot]);
		summary.commands.push(
			summarizeCommand(cautilusBin, ["adapter", "resolve", "--repo-root", workspace.repoRoot], adapterResolve),
		);

		const doctor = execCommand(cautilusBin, ["doctor", "--repo-root", workspace.repoRoot]);
		summary.commands.push(summarizeCommand(cautilusBin, ["doctor", "--repo-root", workspace.repoRoot], doctor));
		const doctorPayload = JSON.parse(doctor.stdout);

		const firstBoundedRunDir = join(workspace.repoRoot, "tmp", "first-bounded-run");
		const modeEvaluate = execCommand(cautilusBin, [
			"mode",
			"evaluate",
			"--repo-root",
			workspace.repoRoot,
			"--mode",
			"held_out",
			"--intent",
			"Fresh consumer onboarding smoke should reach one bounded run after doctor ready.",
			"--baseline-ref",
			"HEAD",
			"--output-dir",
			firstBoundedRunDir,
		]);
		summary.commands.push(
			summarizeCommand(
				cautilusBin,
				[
					"mode",
					"evaluate",
					"--repo-root",
					workspace.repoRoot,
					"--mode",
					"held_out",
					"--intent",
					"Fresh consumer onboarding smoke should reach one bounded run after doctor ready.",
					"--baseline-ref",
					"HEAD",
					"--output-dir",
					firstBoundedRunDir,
				],
				modeEvaluate,
			),
		);

		const agentSkillRoot = join(workspace.repoRoot, ".agents", "skills", "cautilus");
		const claudeSkillLink = join(workspace.repoRoot, ".claude", "skills");
		const reportPath = join(firstBoundedRunDir, "report.json");
		ensurePathExists(adapterPath, "root adapter");
		ensurePathExists(join(agentSkillRoot, "SKILL.md"), "bundled skill");
		ensureSymlink(claudeSkillLink, "Claude skill compatibility link");
		ensurePathExists(reportPath, "first bounded run report");

		summary.ready = readDoctorReady(doctor.stdout);
		summary.firstBoundedRun = doctorPayload.first_bounded_run ?? null;
		summary.firstBoundedRunDir = firstBoundedRunDir;
		summary.reportPath = reportPath;
		summary.report = readJSONFile(reportPath);
		summary.adapterPath = adapterPath;
		summary.agentSkillRoot = agentSkillRoot;
		summary.claudeSkillLink = claudeSkillLink;
		summary.ok = summary.ready && summary.report?.schemaVersion === "cautilus.report_packet.v2";
		return summary;
	} finally {
		if (!keepWorkdir && !outputDir) {
			rmSync(workspace.root, { recursive: true, force: true });
		}
	}
}

export async function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArgs(argv);
		const result = await runExternalConsumerOnboardingSmoke(options);
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
		if (!result.ok) {
			process.exit(1);
		}
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	await main();
}
