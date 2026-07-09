import { spawnSync } from "node:child_process";
import { isAbsolute, relative, resolve, join } from "node:path";
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
		spawnError: result.error
			? {
					code: result.error.code || null,
					message: result.error.message,
				}
			: null,
	};
}

function toRepoRelative(repoRoot, value) {
	if (typeof value !== "string" || value === "") {
		return value;
	}
	if (!isAbsolute(value)) {
		return value;
	}
	const relativeValue = relative(repoRoot, value);
	if (relativeValue === "") {
		return ".";
	}
	if (relativeValue.startsWith("..")) {
		return value;
	}
	return relativeValue;
}

function excerpt(value) {
	const trimmed = String(value || "").trim();
	if (trimmed.length <= 400) {
		return trimmed;
	}
	return `${trimmed.slice(0, 400)}...`;
}

function summarizeCommandForOutput(summary, repoRoot) {
	const output = {
		command: toRepoRelative(repoRoot, summary.command),
		args: summary.args.map((arg) => toRepoRelative(repoRoot, arg)),
		exitCode: summary.exitCode,
	};
	if (summary.spawnError) {
		output.spawnError = {
			...summary.spawnError,
			message: summary.spawnError.message.replaceAll(summary.command, toRepoRelative(repoRoot, summary.command)),
		};
	}
	return output;
}

function buildFailurePacket({ repoRoot, phase, summary = null, error = null }) {
	const packet = {
		phase,
		message: error?.message || "starter command failed",
	};
	if (summary) {
		packet.command = summarizeCommandForOutput(summary, repoRoot);
		packet.stderrExcerpt = excerpt(summary.stderr);
		packet.stdoutExcerpt = excerpt(summary.stdout);
	}
	return packet;
}

function assertCommandOk(summary, context) {
	if (summary.exitCode !== 0) {
		const command = summarizeCommandForOutput(summary, context.repoRoot);
		const error = new Error(`${command.command} ${command.args.join(" ")} failed with exit ${summary.exitCode}`);
		error.failure = buildFailurePacket({ ...context, summary, error });
		throw error;
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
			starterPath: toRepoRelative(repoRoot, starterRoot),
			inputPath: toRepoRelative(repoRoot, inputPath),
			normalizeCommand: `cautilus discover scenarios normalize ${starter.normalize} --input input.json`,
			commands: [],
		};
		try {
			const context = { repoRoot };
			const resolveCommand = assertCommandOk(
				runCommand(cautilusBin, ["doctor", "adapter", "--repo-root", starterRoot]),
				{ ...context, phase: "doctor-adapter" },
			);
			entry.commands.push(summarizeCommandForOutput(resolveCommand, repoRoot));
			const doctorCommand = assertCommandOk(
				runCommand(cautilusBin, ["doctor", "--repo-root", starterRoot, "--format", "json"]),
				{ ...context, phase: "doctor" },
			);
			entry.commands.push(summarizeCommandForOutput(doctorCommand, repoRoot));
			entry.doctorReady = readDoctorReady(doctorCommand.stdout, `${starter.family} doctor`);
			const normalizeCommand = assertCommandOk(
				runCommand(cautilusBin, [
					"discover",
					"scenarios",
					"normalize",
					starter.normalize,
					"--input",
					inputPath,
					"--format",
					"json",
				]),
				{ ...context, phase: "normalize" },
			);
			entry.commands.push(summarizeCommandForOutput(normalizeCommand, repoRoot));
			entry.candidateCount = readCandidateCount(normalizeCommand.stdout, `${starter.family} normalize`);
			entry.ok = entry.doctorReady === true && entry.candidateCount > 0;
		} catch (error) {
			entry.ok = false;
			entry.failure = error.failure || buildFailurePacket({ repoRoot, phase: "parse", error });
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
		process.stdout.write(
			`${JSON.stringify(
				{
					schemaVersion: "cautilus.starter_kit_smoke.v1",
					ok: false,
					failure: {
						phase: "startup",
						message: error.message,
					},
				},
				null,
				2,
			)}\n`,
		);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	await main();
}
