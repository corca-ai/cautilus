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
	if (!current.includes("eval_test_command_templates: []")) {
		return;
	}
	const next = current.replace(
		"eval_test_command_templates: []",
		[
			"evaluation_input_default: fixtures/eval/app/prompt/onboarding-smoke.fixture.json",
			"eval_test_command_templates:",
			"    - node ./.agents/cautilus-smoke-eval.mjs {eval_cases_file} {eval_observed_file}",
		].join("\n"),
	);
	writeFileSync(adapterPath, next, "utf-8");
}

function seedFirstBoundedRunFixture(repoRoot) {
	const fixtureDir = join(repoRoot, "fixtures", "eval", "app", "prompt");
	mkdirSync(fixtureDir, { recursive: true });
	const fixturePath = join(fixtureDir, "onboarding-smoke.fixture.json");
	writeFileSync(
		fixturePath,
		JSON.stringify(
			{
				schemaVersion: "cautilus.evaluation_input.v1",
				surface: "app",
				preset: "prompt",
				suiteId: "consumer-onboarding-smoke",
				suiteDisplayName: "Consumer Onboarding Smoke",
				provider: "fixture",
				model: "fixture-backend",
				system: "Answer with the product name and a short status.",
				cases: [
					{
						caseId: "fresh-consumer-first-bounded-run",
						displayName: "Fresh consumer first bounded run",
						input: "Confirm this fresh repo can run Cautilus once.",
						expected: { finalText: "Cautilus" },
					},
				],
			},
			null,
			2,
		) + "\n",
		"utf-8",
	);
	return fixturePath;
}

function seedFirstBoundedRunRunner(repoRoot) {
	const runnerPath = join(repoRoot, ".agents", "cautilus-smoke-eval.mjs");
	writeFileSync(
		runnerPath,
		[
			"import { readFileSync, writeFileSync } from 'node:fs';",
			"",
			"const [casesFile, outputFile] = process.argv.slice(2);",
			"if (!casesFile || !outputFile) {",
			"  console.error('usage: node .agents/cautilus-smoke-eval.mjs <cases-file> <output-file>');",
			"  process.exit(2);",
			"}",
			"const suite = JSON.parse(readFileSync(casesFile, 'utf-8'));",
			"const evaluations = suite.cases.map((entry) => {",
			"  const input = entry.input;",
			"  const finalText = 'Cautilus onboarding smoke ok.';",
			"  return {",
			"    caseId: entry.caseId,",
			"    displayName: entry.displayName || entry.caseId,",
			"    provider: entry.provider || suite.provider,",
			"    model: entry.model || suite.model,",
			"    harness: 'fixture-backend',",
			"    mode: 'messaging',",
			"    durationMs: 1,",
			"    observed: {",
			"      input,",
			"      messages: [",
			"        { role: 'user', content: input },",
			"        { role: 'assistant', content: finalText },",
			"      ],",
			"      finalText,",
			"    },",
			"    expected: entry.expected,",
			"  };",
			"});",
			"writeFileSync(outputFile, JSON.stringify({",
			"  schemaVersion: 'cautilus.app_prompt_evaluation_inputs.v1',",
			"  suiteId: suite.suiteId,",
			"  suiteDisplayName: suite.suiteDisplayName,",
			"  evaluations,",
			"}, null, 2) + '\\n');",
			"",
		].join("\n"),
		"utf-8",
	);
	return runnerPath;
}

function recordSyntheticCommand(summary, command, args, stdout) {
	summary.commands.push({
		command,
		args,
		exitCode: 0,
		stdout,
		stderr: "",
	});
}

function seedFirstBoundedRunAssets(summary, repoRoot) {
	const fixturePath = seedFirstBoundedRunFixture(repoRoot);
	recordSyntheticCommand(summary, "seed-first-bounded-run-fixture", [fixturePath], "wrote app/prompt evaluation fixture\n");
	const runnerPath = seedFirstBoundedRunRunner(repoRoot);
	recordSyntheticCommand(summary, "seed-first-bounded-run-runner", [runnerPath], "wrote fixture-backend eval runner\n");
	return { fixturePath, runnerPath };
}

function runFirstBoundedEval(summary, cautilusBin, repoRoot, execCommand) {
	const evalOutputDir = join(repoRoot, "tmp", "cautilus-eval");
	const args = ["eval", "test", "--repo-root", repoRoot, "--output-dir", evalOutputDir];
	const evalTest = execCommand(cautilusBin, args);
	summary.commands.push(summarizeCommand(cautilusBin, args, evalTest));
	const evalSummaryPath = evalTest.stdout.trim().split(/\r?\n/).at(-1);
	return {
		evalOutputDir,
		evalSummaryPath,
		evalObservedPath: join(evalOutputDir, "eval-observed.json"),
		evalCasesPath: join(evalOutputDir, "eval-cases.json"),
		evalSummary: JSON.parse(readFileSync(evalSummaryPath, "utf-8")),
	};
}

function ensureSmokeArtifacts(paths) {
	ensurePathExists(paths.adapterPath, "root adapter");
	ensurePathExists(paths.fixturePath, "first bounded run fixture");
	ensurePathExists(paths.runnerPath, "first bounded run runner");
	ensurePathExists(paths.evalSummaryPath, "eval summary");
	ensurePathExists(paths.evalObservedPath, "eval observed packet");
	ensurePathExists(paths.evalCasesPath, "eval cases packet");
	ensurePathExists(join(paths.agentSkillRoot, "SKILL.md"), "bundled skill");
	ensureSymlink(paths.claudeSkillLink, "Claude skill compatibility link");
}

export function readDoctorReady(stdout) {
	const payload = JSON.parse(stdout);
	return payload.ready === true;
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
		const { fixturePath, runnerPath } = seedFirstBoundedRunAssets(summary, workspace.repoRoot);
		seedReadyAdapter(adapterPath);
		recordSyntheticCommand(summary, "seed-ready-adapter", [adapterPath], "added minimal eval-test fixture and command template\n");

		const gitAdd = execCommand("git", ["-C", workspace.repoRoot, "add", ".gitignore", ".agents", ".claude", "fixtures"]);
		summary.commands.push(
			summarizeCommand("git", ["-C", workspace.repoRoot, "add", ".gitignore", ".agents", ".claude", "fixtures"], gitAdd),
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

		const evalResult = runFirstBoundedEval(summary, cautilusBin, workspace.repoRoot, execCommand);
		const agentSkillRoot = join(workspace.repoRoot, ".agents", "skills", "cautilus");
		const claudeSkillLink = join(workspace.repoRoot, ".claude", "skills");
		ensureSmokeArtifacts({ adapterPath, fixturePath, runnerPath, agentSkillRoot, claudeSkillLink, ...evalResult });

		summary.ready = readDoctorReady(doctor.stdout);
		summary.firstBoundedRun = doctorPayload.first_bounded_run ?? null;
		summary.fixturePath = fixturePath;
		summary.runnerPath = runnerPath;
		summary.evalOutputDir = evalResult.evalOutputDir;
		summary.evalSummaryPath = evalResult.evalSummaryPath;
		summary.evalObservedPath = evalResult.evalObservedPath;
		summary.evalCasesPath = evalResult.evalCasesPath;
		summary.evalSummary = evalResult.evalSummary;
		summary.adapterPath = adapterPath;
		summary.agentSkillRoot = agentSkillRoot;
		summary.claudeSkillLink = claudeSkillLink;
		summary.ok = summary.ready === true && evalResult.evalSummary.recommendation === "accept-now";
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
