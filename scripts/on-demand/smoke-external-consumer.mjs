import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

// Canonical checked-in capture path. `npm run consumer:onboard:smoke` writes an
// operator-witnessed capture here (volatile temp paths relativized, no timestamps
// or costs) so docs/specs/promises/ownership.spec.md can replay it deterministically
// in `npm run lint:specs`, and the live re-run regenerates it without drift.
export const DEFAULT_CAPTURE_PATH = "fixtures/eval/consumer/onboard/live/consumer-onboarding-live-capture.json";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/on-demand/smoke-external-consumer.mjs [--cautilus-bin <path>] [--output-dir <path>] [--keep-workdir] [--json] [--capture-path <path>] [--no-capture]",
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
		writeCapture: true,
		capturePath: resolve(process.cwd(), DEFAULT_CAPTURE_PATH),
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
	if (arg === "--no-capture") {
		options.writeCapture = false;
		return index;
	}
	const valueMap = {
		"--cautilus-bin": "cautilusBin",
		"--output-dir": "outputDir",
		"--capture-path": "capturePath",
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

function runFirstBoundedEval(summary, cautilusBin, repoRoot, fixturePath, execCommand) {
	const evalOutputDir = join(repoRoot, ".cautilus", "runs", "first-bounded-run");
	const args = ["evaluate", "fixture", "--repo-root", repoRoot, "--fixture", fixturePath, "--output-dir", evalOutputDir];
	const evalTest = execCommand(cautilusBin, args);
	summary.commands.push(summarizeCommand(cautilusBin, args, evalTest));
	const evalSummaryPath = evalTest.stdout.trim().split(/\r?\n/).at(-1);
	const evalObservedPath = join(evalOutputDir, "eval-observed.json");
	const evalRecheckSummaryPath = join(evalOutputDir, "eval-summary.recheck.json");
	const recheckArgs = ["evaluate", "observation", "--input", evalObservedPath, "--output", evalRecheckSummaryPath];
	const evalRecheck = execCommand(cautilusBin, recheckArgs);
	summary.commands.push(summarizeCommand(cautilusBin, recheckArgs, evalRecheck));
	return {
		evalOutputDir,
		evalSummaryPath,
		evalObservedPath,
		evalCasesPath: join(evalOutputDir, "eval-cases.json"),
		evalSummary: JSON.parse(readFileSync(evalSummaryPath, "utf-8")),
		evalRecheckSummaryPath,
		evalRecheckSummary: JSON.parse(readFileSync(evalRecheckSummaryPath, "utf-8")),
	};
}

function ensureSmokeArtifacts(paths) {
	ensurePathExists(paths.adapterPath, "root adapter");
	ensurePathExists(paths.fixturePath, "first bounded run fixture");
	ensurePathExists(paths.runnerPath, "first bounded run runner");
	ensurePathExists(paths.evalSummaryPath, "eval summary");
	ensurePathExists(paths.evalRecheckSummaryPath, "eval recheck summary");
	ensurePathExists(paths.evalObservedPath, "eval observed packet");
	ensurePathExists(paths.evalCasesPath, "eval cases packet");
	ensurePathExists(join(paths.agentSkillRoot, "SKILL.md"), "Cautilus Agent");
	ensureSymlink(paths.claudeSkillLink, "Claude skill compatibility link");
}

export function readDoctorReady(stdout) {
	const payload = JSON.parse(stdout);
	return payload.ready === true;
}

// Normalize a smoke summary into a stable, operator-witnessed onboarding capture.
// Volatile data (temp workspace paths, stdout/stderr, durations, costs) is stripped
// so a fresh `npm run consumer:onboard:smoke` regenerates an identical artifact: the
// host-owned paths are relativized to the consumer repo root, and the cautilus
// binary path collapses to "cautilus". This is the human-auditable proof the apex
// Host Ownership badge replays — an operator ran it and vouches for the invariant.
export function buildOnboardingCapture(summary) {
	const rel = (path) => (path ? relative(summary.repoRoot, path).replaceAll("\\", "/") : null);
	const stepLabel = (entry) => {
		if (entry.command === summary.cautilusBin) {
			const sub = [];
			const args = entry.args || [];
			for (let index = 0; index < args.length; index += 1) {
				const arg = args[index];
				if (arg === "--format" && args[index + 1]) {
					sub.push(arg, args[index + 1]);
					index += 1;
					continue;
				}
				if (arg.startsWith("-") || arg.includes("/")) {
					continue;
				}
				sub.push(arg);
			}
			return ["cautilus", ...sub].join(" ").trim();
		}
		if (/(^|\/)git$/.test(entry.command)) {
			return "git";
		}
		return entry.command;
	};
	return {
		schemaVersion: "cautilus.consumer_onboarding_capture.v1",
		suiteId: "consumer-onboarding-live",
		suiteDisplayName: "External consumer onboarding (operator-witnessed live run)",
		provenance: {
			kind: "operator-witnessed-onboarding",
			note:
				"Operator-witnessed fresh live run. `cautilus init` -> `init adapter` -> `doctor` -> one bounded `evaluate fixture` plus `evaluate observation` recheck in a fresh temp git repo whose adapter, fixture, and runner are host-owned. Ephemeral workspace paths are relativized to the consumer repo root; rerun `npm run consumer:onboard:smoke` to regenerate.",
			command: "npm run consumer:onboard:smoke",
			runner: "scripts/on-demand/smoke-external-consumer.mjs",
		},
		onboarding: {
			ready: summary.ready === true,
			evalRecommendation: summary.evalSummary?.recommendation ?? null,
			evalSchemaVersion: summary.evalSummary?.schemaVersion ?? null,
			recheckRecommendation: summary.evalRecheckSummary?.recommendation ?? null,
			recheckSchemaVersion: summary.evalRecheckSummary?.schemaVersion ?? null,
			hostOwned: {
				adapterPath: rel(summary.adapterPath),
				runnerPath: rel(summary.runnerPath),
				fixturePath: rel(summary.fixturePath),
			},
			packets: {
				evalCasesPath: rel(summary.evalCasesPath),
				evalObservedPath: rel(summary.evalObservedPath),
				evalSummaryPath: rel(summary.evalSummaryPath),
				evalRecheckSummaryPath: rel(summary.evalRecheckSummaryPath),
			},
			steps: (summary.commands || []).map(stepLabel),
		},
	};
}

export function writeOnboardingCapture(summary, capturePath) {
	const capture = buildOnboardingCapture(summary);
	mkdirSync(dirname(capturePath), { recursive: true });
	writeFileSync(capturePath, `${JSON.stringify(capture, null, 2)}\n`, "utf-8");
	return capturePath;
}

function completeOnboardingSummary(summary, doctorPayload, paths, evalResult) {
	summary.ready = doctorPayload.ready === true;
	summary.firstBoundedRun = doctorPayload.first_bounded_run ?? null;
	summary.fixturePath = paths.fixturePath;
	summary.runnerPath = paths.runnerPath;
	summary.evalOutputDir = evalResult.evalOutputDir;
	summary.evalSummaryPath = evalResult.evalSummaryPath;
	summary.evalObservedPath = evalResult.evalObservedPath;
	summary.evalCasesPath = evalResult.evalCasesPath;
	summary.evalSummary = evalResult.evalSummary;
	summary.evalRecheckSummaryPath = evalResult.evalRecheckSummaryPath;
	summary.evalRecheckSummary = evalResult.evalRecheckSummary;
	summary.adapterPath = paths.adapterPath;
	summary.agentSkillRoot = paths.agentSkillRoot;
	summary.claudeSkillLink = paths.claudeSkillLink;
	summary.ok =
		summary.ready === true &&
		evalResult.evalSummary.recommendation === "accept-now" &&
		evalResult.evalRecheckSummary.recommendation === "accept-now";
	return summary;
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

		const install = execCommand(cautilusBin, ["init", "--repo-root", workspace.repoRoot, "--json"]);
		summary.commands.push(summarizeCommand(cautilusBin, ["init", "--repo-root", workspace.repoRoot, "--json"], install));

		const adapterInit = execCommand(cautilusBin, ["init", "adapter", "--repo-root", workspace.repoRoot]);
		summary.commands.push(summarizeCommand(cautilusBin, ["init", "adapter", "--repo-root", workspace.repoRoot], adapterInit));

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

		const adapterResolve = execCommand(cautilusBin, ["doctor", "adapter", "--repo-root", workspace.repoRoot]);
		summary.commands.push(
			summarizeCommand(cautilusBin, ["doctor", "adapter", "--repo-root", workspace.repoRoot], adapterResolve),
		);

		const doctorArgs = ["doctor", "--repo-root", workspace.repoRoot, "--format", "json"];
		const doctor = execCommand(cautilusBin, doctorArgs);
		summary.commands.push(summarizeCommand(cautilusBin, doctorArgs, doctor));
		const doctorPayload = JSON.parse(doctor.stdout);

		const evalResult = runFirstBoundedEval(summary, cautilusBin, workspace.repoRoot, fixturePath, execCommand);
		const agentSkillRoot = join(workspace.repoRoot, ".agents", "skills", "cautilus-agent");
		const claudeSkillLink = join(workspace.repoRoot, ".claude", "skills");
		ensureSmokeArtifacts({ adapterPath, fixturePath, runnerPath, agentSkillRoot, claudeSkillLink, ...evalResult });

		return completeOnboardingSummary(
			summary,
			doctorPayload,
			{ adapterPath, fixturePath, runnerPath, agentSkillRoot, claudeSkillLink },
			evalResult,
		);
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
		if (options.writeCapture && result.ok) {
			const capturePath = writeOnboardingCapture(result, options.capturePath);
			process.stderr.write(`wrote onboarding capture: ${relative(process.cwd(), capturePath)}\n`);
		}
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
