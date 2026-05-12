import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import process from "node:process";

const DEFAULT_CLAIMS = ".cautilus/claims/evidenced-typed-runners.json";

function usage(exitCode = 0) {
	const stream = exitCode === 0 ? process.stdout : process.stderr;
	stream.write(
		[
			"Usage:",
			"  node ./scripts/release/check-claim-freshness.mjs [--repo-root <dir>] [--claims <claims.json>]",
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
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--repo-root") {
			options.repoRoot = argv[++index] || "";
			continue;
		}
		if (arg === "--claims") {
			options.claims = argv[++index] || "";
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	if (!options.repoRoot || !options.claims) {
		throw new Error("--repo-root and --claims are required");
	}
	return {
		repoRoot: resolve(options.repoRoot),
		claims: options.claims,
	};
}

export function repairCommands({ claims = DEFAULT_CLAIMS } = {}) {
	return [
		`./bin/cautilus discover claims --repo-root . --previous ${claims} --output ${claims}`,
		"npm run claims:canonical-map",
		"npm run claims:evidence-state",
		"npm run claims:status-report",
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

export function checkClaimFreshness(options) {
	const result = spawnSync("npm", ["run", "claims:evidence-state:check"], {
		cwd: options.repoRoot,
		encoding: "utf-8",
	});
	if (result.status === 0) {
		return { status: "fresh", repoRoot: options.repoRoot, claims: options.claims };
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
