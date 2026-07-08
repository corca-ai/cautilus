import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { relative, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { checkSpecs } from "./check-specs.mjs";
import { checkPromiseLedger, summary as promiseLedgerSummary } from "./agent-runtime/render-promise-ledger.mjs";

function fail(message) {
	throw new Error(message);
}

function usage() {
	return [
		"Usage: node scripts/lint-specs.mjs [spec-file ...]",
		"",
		"Without spec-file arguments, validates the public spec graph and runs the full specdown suite.",
		"With spec-file arguments, validates those files' links and runs specdown with each file as the temporary entry.",
	].join("\n");
}

function parseArgs(argv) {
	if (argv.includes("-h") || argv.includes("--help")) {
		return { help: true, targets: [] };
	}
	for (const arg of argv) {
		if (arg.startsWith("-")) {
			throw fail(`unknown argument: ${arg}`);
		}
	}
	return { help: false, targets: argv };
}

function repoRelative(repoRoot, filePath) {
	return relative(repoRoot, resolve(repoRoot, filePath)).replaceAll("\\", "/");
}

function formatDuration(ms) {
	if (ms < 1000) {
		return `${ms}ms`;
	}
	return `${(ms / 1000).toFixed(2)}s`;
}

function timeStep(timings, label, action) {
	const start = Date.now();
	try {
		return action();
	} finally {
		timings.push({ label, durationMs: Date.now() - start });
	}
}

function printTimingSummary(timings) {
	const totalMs = timings.reduce((sum, timing) => sum + timing.durationMs, 0);
	const phases = timings.map((timing) => `${timing.label}=${formatDuration(timing.durationMs)}`).join(", ");
	process.stdout.write(`lint-specs timing: ${phases}, total=${formatDuration(totalMs)}\n`);
}

function runCommand(command, args, options = {}) {
	const result = spawnSync(command, args, {
		cwd: options.cwd,
		stdio: "inherit",
	});
	if (result.error) {
		throw result.error;
	}
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

function readSpecdownConfig(repoRoot) {
	const configPath = resolve(repoRoot, "specdown.json");
	if (!existsSync(configPath)) {
		throw fail("Missing required file: specdown.json");
	}
	return JSON.parse(readFileSync(configPath, "utf-8"));
}

function runFullSpecdown(repoRoot) {
	runCommand("specdown", ["run", "-quiet"], { cwd: repoRoot });
}

// Validate the typed traceability graph (specdown.json `trace`). This is the
// principled replacement for hand-written reachability source guards: it fails
// when a typed promise has no apex badge edge or an edge violates its declared
// from/to type. Output is captured so a valid graph prints one summary line
// instead of the full JSON; on failure the raw validation errors are surfaced.
function runTraceStrict(repoRoot) {
	const result = spawnSync("specdown", ["trace", "-strict"], { cwd: repoRoot, encoding: "utf-8" });
	if (result.error) {
		throw result.error;
	}
	if (result.status !== 0) {
		process.stderr.write(result.stdout ?? "");
		process.stderr.write(result.stderr ?? "");
		process.exit(result.status ?? 1);
	}
	let graph = {};
	let docs = 0;
	let edges = 0;
	try {
		graph = JSON.parse(result.stdout);
		docs = graph.documents?.length ?? 0;
		edges = graph.directEdges?.length ?? 0;
	} catch {
		// Non-JSON output on success is unexpected; fall through to the non-vacuity guard.
	}
	// Non-vacuity guard: `specdown trace -strict` exits 0 when no document carries a
	// `type:`, so the gate would pass without validating any cardinality (e.g. if the
	// apex lost its frontmatter). A standing gate that can pass on an empty graph is
	// not load-bearing, so fail explicitly when zero typed documents are found.
	if (docs < 1) {
		process.stderr.write("specdown trace -strict: no typed documents found — the trace gate would pass vacuously\n");
		process.exit(1);
	}
	process.stdout.write(`specdown trace -strict: ${docs} typed doc(s), ${edges} edge(s), graph valid\n`);
	return graph;
}

function checkGeneratedLedger(repoRoot, graph) {
	const { stale, promises } = checkPromiseLedger(repoRoot, graph);
	if (stale) {
		process.stderr.write(
			"FAIL:\n  - docs/specs/generated/promise-ledger.spec.md is stale — run npm run specdown:ledger to regenerate\n",
		);
		process.exit(1);
	}
	process.stdout.write(`promise ledger check: ${promiseLedgerSummary(promises)}\n`);
}

function runFocusedSpecdown(repoRoot, target, index) {
	const config = readSpecdownConfig(repoRoot);
	const targetEntry = repoRelative(repoRoot, target);
	const tempConfigPath = resolve(repoRoot, `.specdown-focus-${process.pid}-${index}.json`);
	writeFileSync(tempConfigPath, `${JSON.stringify({ ...config, entry: targetEntry }, null, 2)}\n`, "utf-8");
	try {
		process.stdout.write(`specdown focused run: ${targetEntry}\n`);
		runCommand("specdown", ["run", "-config", tempConfigPath, "-quiet", "-no-report"], { cwd: repoRoot });
	} finally {
		unlinkSync(tempConfigPath);
	}
}

export function main(argv = process.argv.slice(2)) {
	const repoRoot = process.cwd();
	try {
		const options = parseArgs(argv);
		if (options.help) {
			process.stdout.write(`${usage()}\n`);
			return;
		}

		const timings = [];
		const result = timeStep(timings, "check", () => checkSpecs({ repoRoot, targets: options.targets }));
		const suffix = result.selected ? " selected spec(s)" : " specs";
		process.stdout.write(`spec checks passed (${result.specCount}${suffix})\n`);

		if (options.targets.length === 0) {
			timeStep(timings, "specdown", () => runFullSpecdown(repoRoot));
			const graph = timeStep(timings, "trace", () => runTraceStrict(repoRoot));
			timeStep(timings, "ledger", () => checkGeneratedLedger(repoRoot, graph));
			printTimingSummary(timings);
			return;
		}

		timeStep(timings, "focused", () => options.targets.forEach((target, index) => {
			runFocusedSpecdown(repoRoot, target, index);
		}));
		printTimingSummary(timings);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
