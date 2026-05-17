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

function repoRoot(options = {}) {
	return resolve(options.repoRoot ?? process.cwd());
}

function resolveRepoPath(options, field, fallback) {
	return resolve(repoRoot(options), options[field] ?? fallback);
}

function defaultClaimStateSelected(options = {}) {
	return resolveRepoPath(options, "claims", DEFAULT_CLAIMS) === resolve(repoRoot(options), DEFAULT_CLAIMS) &&
		resolveRepoPath(options, "status", DEFAULT_STATUS) === resolve(repoRoot(options), DEFAULT_STATUS);
}

function shellQuote(value) {
	const text = String(value ?? "");
	return `'${text.replaceAll("'", "'\\''")}'`;
}

export function repairCommands(options = {}) {
	if (defaultClaimStateSelected(options)) {
		return [`cd ${shellQuote(repoRoot(options))} && npm run claims:refresh:all`];
	}
	const claims = options.claims ?? DEFAULT_CLAIMS;
	const status = options.status ?? DEFAULT_STATUS;
	return [
		[
			"cd",
			shellQuote(repoRoot(options)),
			"&&",
			"./bin/cautilus discover claims status",
			"--input",
			shellQuote(claims),
			"--sample-claims 1",
			">",
			shellQuote(status),
		].join(" "),
	];
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

function readJsonFile(path, label, options = null) {
	try {
		return JSON.parse(readFileSync(path, "utf-8"));
	} catch (error) {
		const message = `${label} ${path} is not readable JSON: ${error.message}`;
		throw new Error(options ? renderRepairMessage(options, message) : message);
	}
}

function assertRequiredFile(options, field, fallback, label) {
	const path = resolveRepoPath(options, field, fallback);
	if (!existsSync(path)) {
		throw new Error(renderRepairMessage(options, `${label} ${path} is missing.`));
	}
	return path;
}

function packetGitCommit(options) {
	const statusPath = assertRequiredFile(options, "status", DEFAULT_STATUS, "claim status snapshot");
	const packet = readJsonFile(statusPath, "claim status snapshot", options);
	const commit = packet?.gitState?.packetGitCommit;
	return typeof commit === "string" && commit.trim() ? commit.trim() : null;
}

function runGit(repoRoot, args) {
	return spawnSync("git", args, {
		cwd: repoRoot,
		encoding: "utf-8",
	});
}

function runClaimStatus(repoRoot, claims, cautilusBin = "./bin/cautilus") {
	return spawnSync(cautilusBin, ["discover", "claims", "status", "--input", claims, "--sample-claims", "1"], {
		cwd: repoRoot,
		encoding: "utf-8",
	});
}

function canonicalValue(value) {
	if (Array.isArray(value)) {
		return value.map(canonicalValue);
	}
	if (!value || typeof value !== "object") {
		return value;
	}
	return Object.fromEntries(
		Object.entries(value)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([key, child]) => [key, canonicalValue(child)]),
	);
}

function normalizeStatusForFreshness(value) {
	const normalized = canonicalValue(value);
	const gitState = normalized?.gitState && typeof normalized.gitState === "object" ? normalized.gitState : null;
	if (!gitState) {
		return normalized;
	}
	delete gitState.currentGitCommit;
	delete gitState.headDrift;
	delete gitState.changedFileCount;
	delete gitState.changedFiles;
	delete gitState.changedSources;
	delete gitState.comparisonStatus;
	delete gitState.recommendedAction;
	return normalized;
}

function sameFreshnessStatus(left, right) {
	return JSON.stringify(normalizeStatusForFreshness(left)) === JSON.stringify(normalizeStatusForFreshness(right));
}

function assertStatusNotStale(statusPacket, options, statusPath) {
	if (statusPacket?.gitState?.isStale === true) {
		throw new Error(renderRepairMessage(
			options,
			`claim status snapshot ${statusPath} reports stale claim state.`,
		));
	}
}

function assertSelectedStatusFresh(options) {
	const claimsPath = assertRequiredFile(options, "claims", DEFAULT_CLAIMS, "claim packet");
	const statusPath = assertRequiredFile(options, "status", DEFAULT_STATUS, "claim status snapshot");
	const checkedStatus = readJsonFile(statusPath, "claim status snapshot", options);
	const runner = options.statusRunner ?? runClaimStatus;
	const result = runner(options.repoRoot, options.claims ?? DEFAULT_CLAIMS, options.cautilusBin);
	if (result.status !== 0) {
		throw new Error(renderRepairMessage(options, `${result.stdout || ""}${result.stderr || ""}`));
	}
	let refreshedStatus;
	try {
		refreshedStatus = JSON.parse(result.stdout || "");
	} catch (error) {
		throw new Error(renderRepairMessage(options, `failed to parse refreshed status for ${claimsPath}: ${error.message}`));
	}
	if (!sameFreshnessStatus(checkedStatus, refreshedStatus)) {
		throw new Error(renderRepairMessage(
			options,
			`claim status snapshot ${statusPath} is stale for selected claim packet ${claimsPath}.`,
		));
	}
	assertStatusNotStale(refreshedStatus, options, statusPath);
}

function runDefaultProjectionCheck(options) {
	const result = spawnSync("npm", ["run", "claims:evidence-state:check"], {
		cwd: options.repoRoot,
		encoding: "utf-8",
	});
	if (result.status !== 0) {
		throw new Error(renderRepairMessage(options, `${result.stdout || ""}${result.stderr || ""}`));
	}
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
	assertSelectedStatusFresh(options);
	if (defaultClaimStateSelected(options)) {
		runDefaultProjectionCheck(options);
	}
	const reachablePacketGitCommit = assertPacketCommitReachable(options);
	return { status: "fresh", repoRoot: options.repoRoot, claims: options.claims, reachablePacketGitCommit };
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
