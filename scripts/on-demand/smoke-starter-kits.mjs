import { spawnSync } from "node:child_process";
import { resolve, join } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const STARTERS = [
	{ family: "chatbot", normalize: "chatbot" },
	{ family: "skill", normalize: "skill" },
	{ family: "workflow", normalize: "workflow" },
];

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/on-demand/smoke-starter-kits.mjs [--cautilus-bin <path>]",
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

export function parseArgs(argv = process.argv.slice(2)) {
	const options = {
		cautilusBin: resolve(process.cwd(), "bin", "cautilus"),
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--cautilus-bin") {
			options.cautilusBin = resolve(readRequiredValue(argv, index, arg));
			index += 1;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	return options;
}

function runCommand(command, args, { cwd = process.cwd() } = {}) {
	const result = spawnSync(command, args, {
		cwd,
		encoding: "utf-8",
	});
	return {
		command,
		args,
		exitCode: result.status ?? 1,
		stdout: result.stdout ?? "",
		stderr: result.stderr ?? "",
	};
}

function summarizeCommandForOutput(summary) {
	return {
		command: summary.command,
		args: summary.args,
		exitCode: summary.exitCode,
	};
}

function assertCommandOk(summary) {
	if (summary.exitCode !== 0) {
		throw new Error(
			`${summary.command} ${summary.args.join(" ")} failed with exit ${summary.exitCode}\n${summary.stderr || summary.stdout}`,
		);
	}
	return summary;
}

function parseJSON(stdout, label) {
	try {
		return JSON.parse(stdout);
	} catch (error) {
		throw new Error(`${label} did not emit JSON: ${error.message}`);
	}
}

function readDoctorReady(stdout, label) {
	const payload = parseJSON(stdout, label);
	return payload.ready === true && payload.status === "ready";
}

function readCandidateCount(stdout, label) {
	const payload = parseJSON(stdout, label);
	if (Array.isArray(payload)) {
		return payload.length;
	}
	if (Array.isArray(payload.candidates)) {
		return payload.candidates.length;
	}
	if (Array.isArray(payload.proposalCandidates)) {
		return payload.proposalCandidates.length;
	}
	throw new Error(`${label} did not emit a candidate array`);
}

export function runStarterKitSmoke({ cautilusBin = resolve(process.cwd(), "bin", "cautilus") } = {}) {
	const repoRoot = process.cwd();
	const result = {
		schemaVersion: "cautilus.starter_kit_smoke.v1",
		ok: true,
		starterCount: STARTERS.length,
		starters: [],
	};

	for (const starter of STARTERS) {
		const starterRoot = join(repoRoot, "examples", "starters", starter.family);
		const inputPath = join(starterRoot, "input.json");
		const entry = {
			family: starter.family,
			repoRoot: starterRoot,
			commands: [],
		};
		const resolveCommand = assertCommandOk(
			runCommand(cautilusBin, ["adapter", "resolve", "--repo-root", starterRoot]),
		);
		entry.commands.push(summarizeCommandForOutput(resolveCommand));
		const doctorCommand = assertCommandOk(runCommand(cautilusBin, ["doctor", "--repo-root", starterRoot]));
		entry.commands.push(summarizeCommandForOutput(doctorCommand));
		entry.doctorReady = readDoctorReady(doctorCommand.stdout, `${starter.family} doctor`);
		const normalizeCommand = assertCommandOk(
			runCommand(cautilusBin, ["scenario", "normalize", starter.normalize, "--input", inputPath]),
		);
		entry.commands.push(summarizeCommandForOutput(normalizeCommand));
		entry.candidateCount = readCandidateCount(normalizeCommand.stdout, `${starter.family} normalize`);
		entry.ok = entry.doctorReady === true && entry.candidateCount > 0;
		if (!entry.ok) {
			result.ok = false;
		}
		result.starters.push(entry);
	}

	return result;
}

export async function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArgs(argv);
		const result = runStarterKitSmoke(options);
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
