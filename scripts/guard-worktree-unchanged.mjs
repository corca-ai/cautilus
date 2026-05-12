import { spawnSync } from "node:child_process";
import process from "node:process";

function usage(exitCode = 0) {
	const stream = exitCode === 0 ? process.stdout : process.stderr;
	stream.write(
		[
			"Usage:",
			"  node ./scripts/guard-worktree-unchanged.mjs -- <command> [args...]",
			"",
			"Runs a command and fails if it changes HEAD, the index, or tracked files.",
		].join("\n") + "\n",
	);
	process.exit(exitCode);
}

function parseArgs(argv = process.argv.slice(2)) {
	if (argv[0] === "-h" || argv[0] === "--help") {
		usage(0);
	}
	const separator = argv.indexOf("--");
	const command = separator >= 0 ? argv.slice(separator + 1) : argv;
	if (command.length === 0) {
		throw new Error("command is required after --");
	}
	return { command };
}

function runGit(args) {
	const result = spawnSync("git", args, { encoding: "utf-8" });
	if (result.status !== 0) {
		const detail = (result.stderr || result.stdout || "").trim();
		throw new Error(`git ${args.join(" ")} failed${detail ? `: ${detail}` : ""}`);
	}
	return result.stdout.trim();
}

function snapshot() {
	return {
		head: runGit(["rev-parse", "HEAD"]),
		status: runGit(["status", "--porcelain=v1", "--untracked-files=no"]),
	};
}

function describeDrift(before, after) {
	const drift = [];
	if (before.head !== after.head) {
		drift.push(`HEAD changed: ${before.head} -> ${after.head}`);
	}
	if (before.status !== after.status) {
		drift.push(
			[
				"tracked worktree or index changed:",
				"before:",
				before.status || "<clean>",
				"after:",
				after.status || "<clean>",
			].join("\n"),
		);
	}
	return drift;
}

export function runGuardedCommand(command) {
	const before = snapshot();
	const result = spawnSync(command[0], command.slice(1), {
		stdio: "inherit",
		shell: process.platform === "win32",
	});
	const after = snapshot();
	const drift = describeDrift(before, after);
	if (drift.length > 0) {
		throw new Error(`guarded command changed repo state:\n${drift.join("\n")}`);
	}
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
	return { status: result.status ?? 0 };
}

function main(argv = process.argv.slice(2)) {
	try {
		const { command } = parseArgs(argv);
		runGuardedCommand(command);
	} catch (error) {
		process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
		process.exit(1);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
