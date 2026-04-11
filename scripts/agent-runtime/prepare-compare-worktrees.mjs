import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import process from "node:process";

import { resolveRunDir } from "./active-run.mjs";

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function printUsage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/agent-runtime/prepare-compare-worktrees.mjs --repo-root <dir> --baseline-ref <ref> [--output-dir <dir>] [--candidate-ref <ref> | --use-current-candidate] [--force]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function readRequiredValue(argv, index, option) {
	const value = argv[index];
	if (!value) {
		fail(`Missing value for ${option}`);
	}
	return value;
}

function applyArg(options, argv, index) {
	const arg = argv[index];
	if (arg === "-h" || arg === "--help") {
		printUsage(0);
	}
	if (arg === "--force") {
		options.force = true;
		return index;
	}
	if (arg === "--use-current-candidate") {
		options.useCurrentCandidate = true;
		return index;
	}
	const valueOptions = new Map([
		["--repo-root", "repoRoot"],
		["--baseline-ref", "baselineRef"],
		["--candidate-ref", "candidateRef"],
		["--output-dir", "outputDir"],
	]);
	const field = valueOptions.get(arg);
	if (!field) {
		fail(`Unknown argument: ${arg}`);
	}
	options[field] = readRequiredValue(argv, index + 1, arg);
	return index + 1;
}

function parseArgs(argv) {
	const options = {
		repoRoot: process.cwd(),
		baselineRef: null,
		candidateRef: "HEAD",
		useCurrentCandidate: false,
		outputDir: null,
		force: false,
	};
	for (let index = 0; index < argv.length; index += 1) {
		index = applyArg(options, argv, index);
	}
	if (!options.baselineRef) {
		fail("--baseline-ref is required");
	}
	if (options.useCurrentCandidate && options.candidateRef !== "HEAD") {
		fail("Use either --candidate-ref or --use-current-candidate, not both.");
	}
	return options;
}

function runGit(repoRoot, args) {
	return execFileSync("git", ["-C", repoRoot, ...args], {
		encoding: "utf-8",
	}).trim();
}

function prepareWorktreeDirectory(path, force) {
	if (!existsSync(path)) {
		return;
	}
	if (!force) {
		fail(`Destination already exists: ${path}. Re-run with --force to replace it.`);
	}
	rmSync(path, { recursive: true, force: true });
}

function removeExistingWorktree(repoRoot, worktreePath) {
	const porcelain = runGit(repoRoot, ["worktree", "list", "--porcelain"]);
	const blocks = porcelain.split("\n\n").filter(Boolean);
	for (const block of blocks) {
		const lines = block.split("\n");
		const worktreeLine = lines.find((line) => line.startsWith("worktree "));
		if (!worktreeLine) {
			continue;
		}
		const listedPath = worktreeLine.slice("worktree ".length).trim();
		if (resolve(listedPath) !== resolve(worktreePath)) {
			continue;
		}
		execFileSync("git", ["-C", repoRoot, "worktree", "remove", "--force", worktreePath], {
			encoding: "utf-8",
		});
		return;
	}
}

function createDetachedWorktree(repoRoot, path, ref, force) {
	removeExistingWorktree(repoRoot, path);
	prepareWorktreeDirectory(path, force);
	execFileSync("git", ["-C", repoRoot, "worktree", "add", "--detach", path, ref], {
		encoding: "utf-8",
	});
	return {
		path,
		ref,
		commit: runGit(repoRoot, ["rev-parse", ref]),
		type: "git_worktree",
	};
}

function currentCandidateRecord(repoRoot) {
	return {
		path: repoRoot,
		ref: "WORKTREE",
		commit: runGit(repoRoot, ["rev-parse", "HEAD"]),
		type: "live_checkout",
	};
}

function dirtyWorkingTree(repoRoot) {
	return runGit(repoRoot, ["status", "--short"]) !== "";
}

function buildWarnings(repoRoot, candidate) {
	const warnings = [];
	if (candidate.type === "live_checkout" && dirtyWorkingTree(repoRoot)) {
		warnings.push(
			"Candidate points at the current checkout and includes uncommitted changes. Re-run without --use-current-candidate for a ref-pinned clean A/B workspace.",
		);
	}
	return warnings;
}

function main(argv) {
	const options = parseArgs(argv);
	const repoRoot = resolve(options.repoRoot);
	const gitRoot = runGit(repoRoot, ["rev-parse", "--show-toplevel"]);
	const resolvedRun = resolveRunDir({ outputDir: options.outputDir });
	if (resolvedRun.source === "auto") {
		process.stderr.write(`Active run: ${resolvedRun.runDir}\n`);
	}
	const outputDir = resolvedRun.runDir;
	const baselinePath = join(outputDir, "baseline");
	const candidatePath = join(outputDir, "candidate");

	const baseline = createDetachedWorktree(gitRoot, baselinePath, options.baselineRef, options.force);
	const candidate = options.useCurrentCandidate
		? currentCandidateRecord(gitRoot)
		: createDetachedWorktree(gitRoot, candidatePath, options.candidateRef, options.force);

	const payload = {
		repoRoot: gitRoot,
		outputDir,
		baseline,
		candidate,
		warnings: buildWarnings(gitRoot, candidate),
		usage: {
			modeEvaluate: [
				"node",
				"./bin/cautilus",
				"mode",
				"evaluate",
				"--repo-root",
				gitRoot,
				"--baseline-repo",
				baseline.path,
				"--candidate-repo",
				candidate.path,
			],
			reviewVariants: [
				"node",
				"./bin/cautilus",
				"review",
				"variants",
				"--repo-root",
				gitRoot,
				"--workspace",
				candidate.path,
			],
		},
	};
	process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

main(process.argv.slice(2));
