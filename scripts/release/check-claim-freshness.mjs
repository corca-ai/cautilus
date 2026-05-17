import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const DEFAULT_CLAIMS = ".cautilus/claims/evidenced-typed-runners.json";
const DEFAULT_STATUS = ".cautilus/claims/status-summary.json";

function usage(exitCode = 0) {
	const stream = exitCode === 0 ? process.stdout : process.stderr;
	stream.write(
		[
			"Usage:",
			"  node ./scripts/release/check-claim-freshness.mjs [--repo-root <dir>] [--claims <claims.json>] [--status <status-summary.json>]",
			"",
			"Checks release claim-state freshness before a tag is prepared.",
		].join("\n") + "\n",
	);
	process.exit(exitCode);
}

function parseArgs(argv = process.argv.slice(2)) {
	const options = {
		repoRoot: process.cwd(),
		claims: DEFAULT_CLAIMS,
		status: DEFAULT_STATUS,
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		index = applyValueArg(options, argv, index);
	}
	if (!options.repoRoot || !options.claims || !options.status) {
		throw new Error("--repo-root, --claims, and --status are required");
	}
	return {
		repoRoot: resolve(options.repoRoot),
		claims: options.claims,
		status: options.status,
	};
}

const VALUE_OPTIONS = {
	"--repo-root": "repoRoot",
	"--claims": "claims",
	"--status": "status",
};

function applyValueArg(options, argv, index) {
	const arg = argv[index];
	const field = VALUE_OPTIONS[arg];
	if (!field) {
		throw new Error(`Unknown argument: ${arg}`);
	}
	options[field] = argv[index + 1] || "";
	return index + 1;
}

export function repairCommands() {
	return ["npm run claims:refresh:all"];
}

function renderRepairMessage(options, output) {
	return [
		"Release claim freshness preflight failed.",
		output.trim(),
		"",
		"Refresh the saved claim packet and projections before preparing the tag:",
		...repairCommands(options).map((command) => `  ${command}`),
	].filter(Boolean).join("\n");
}

function packetGitCommit(options) {
	const statusPath = resolve(options.repoRoot, options.status ?? DEFAULT_STATUS);
	if (!existsSync(statusPath)) {
		return null;
	}
	const packet = JSON.parse(readFileSync(statusPath, "utf-8"));
	const commit = packet?.gitState?.packetGitCommit;
	return typeof commit === "string" && commit.trim() ? commit.trim() : null;
}

function runGit(repoRoot, args) {
	return spawnSync("git", args, {
		cwd: repoRoot,
		encoding: "utf-8",
	});
}

function assertPacketCommitReachable(options) {
	const commit = packetGitCommit(options);
	if (!commit) {
		return null;
	}
	const runner = options.gitRunner ?? runGit;
	const result = runner(options.repoRoot, ["merge-base", "--is-ancestor", commit, "HEAD"]);
	if (result.status === 0) {
		return commit;
	}
	const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
	throw new Error(renderRepairMessage(
			options,
			[
			`claim packet commit ${commit} is not reachable from HEAD.`,
			output,
			"Regenerate claim state from a commit reachable in the release HEAD history.",
		].filter(Boolean).join("\n"),
	));
}

export function checkClaimFreshness(options) {
	const result = spawnSync("npm", ["run", "claims:evidence-state:check"], {
		cwd: options.repoRoot,
		encoding: "utf-8",
	});
	if (result.status === 0) {
		const reachablePacketGitCommit = assertPacketCommitReachable(options);
		return { status: "fresh", repoRoot: options.repoRoot, claims: options.claims, reachablePacketGitCommit };
	}
	throw new Error(renderRepairMessage(options, `${result.stdout || ""}${result.stderr || ""}`));
}

function main(argv = process.argv.slice(2)) {
	try {
		const result = checkClaimFreshness(parseArgs(argv));
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
	} catch (error) {
		process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
		process.exit(1);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
