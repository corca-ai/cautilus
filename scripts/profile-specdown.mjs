#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { checkSpecs } from "./check-specs.mjs";

function fail(message) {
	throw new Error(message);
}

function usage() {
	return [
		"Usage: node scripts/profile-specdown.mjs [--json] [--top <n>] [--limit <n>] [spec-file ...]",
		"",
		"Runs specdown with each active or selected spec file as the temporary entry,",
		"then reports per-spec elapsed time sorted by slowest first.",
		"--limit is for quick sampling only; omit it for a full profile.",
	].join("\n");
}

export function parseArgs(argv) {
	const parsed = { help: false, json: false, top: 10, limit: null, targets: [] };
	let pendingValue = null;
	for (const arg of argv) {
		if (pendingValue) {
			applyPendingValue(parsed, pendingValue, arg);
			pendingValue = null;
			continue;
		}
		const nextPending = parseArg(parsed, arg);
		if (nextPending === "help") return { ...parsed, help: true };
		if (nextPending) pendingValue = nextPending;
	}
	assertNoPendingValue(pendingValue);
	return parsed;
}

function parseArg(parsed, arg) {
	if (arg === "-h" || arg === "--help") return "help";
	if (arg === "--json") {
		parsed.json = true;
		return null;
	}
	if (arg === "--top") return "top";
	if (arg === "--limit") return "limit";
	if (arg.startsWith("-")) {
		throw fail(`unknown argument: ${arg}`);
	}
	parsed.targets.push(arg);
	return null;
}

function applyPendingValue(parsed, pendingValue, value) {
	const parsedValue = Number.parseInt(value, 10);
	if (!Number.isInteger(parsedValue) || parsedValue < 1) {
		throw fail(`--${pendingValue} requires a positive integer`);
	}
	parsed[pendingValue] = parsedValue;
}

function assertNoPendingValue(pendingValue) {
	if (pendingValue) {
		throw fail(`--${pendingValue} requires a value`);
	}
}

function readSpecdownConfig(repoRoot) {
	const configPath = resolve(repoRoot, "specdown.json");
	if (!existsSync(configPath)) {
		throw fail("Missing required file: specdown.json");
	}
	return JSON.parse(readFileSync(configPath, "utf-8"));
}

function listActiveSpecFiles(repoRoot, rootDir = resolve(repoRoot, "docs", "specs")) {
	if (!existsSync(rootDir) || !statSync(rootDir).isDirectory()) {
		throw fail(`Missing required directory: ${rootDir}`);
	}
	const result = [];
	for (const entry of readdirSync(rootDir)) {
		const fullPath = resolve(rootDir, entry);
		if (entry === "old" || entry === "archive") continue;
		if (statSync(fullPath).isDirectory()) {
			result.push(...listActiveSpecFiles(repoRoot, fullPath));
		} else if (entry.endsWith(".spec.md")) {
			result.push(repoRelative(repoRoot, fullPath));
		}
	}
	return result.sort();
}

function repoRelative(repoRoot, filePath) {
	return relative(repoRoot, resolve(repoRoot, filePath)).replaceAll("\\", "/");
}

function selectedSpecFiles(repoRoot, targets) {
	if (targets.length === 0) {
		return listActiveSpecFiles(repoRoot);
	}
	checkSpecs({ repoRoot, targets });
	return targets.map((target) => repoRelative(repoRoot, target)).sort();
}

function formatDuration(ms) {
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
}

function runFocusedSpecdown(repoRoot, config, specFile, index) {
	const tempConfigPath = resolve(repoRoot, `.specdown-profile-${process.pid}-${index}.json`);
	writeFileSync(tempConfigPath, `${JSON.stringify({ ...config, entry: specFile }, null, 2)}\n`, "utf-8");
	const started = Date.now();
	try {
		const result = spawnSync("specdown", ["run", "-config", tempConfigPath, "-quiet", "-no-report"], {
			cwd: repoRoot,
			encoding: "utf-8",
			maxBuffer: 20 * 1024 * 1024,
		});
		const durationMs = Date.now() - started;
		if (result.error) {
			throw result.error;
		}
		if (result.status !== 0) {
			process.stderr.write(result.stdout || "");
			process.stderr.write(result.stderr || "");
			process.stderr.write(`specdown profile failed for ${specFile}\n`);
			process.exit(result.status || 1);
		}
		return { specFile, durationMs };
	} finally {
		unlinkSync(tempConfigPath);
	}
}

export function profileSpecdown({ repoRoot = process.cwd(), targets = [], limit = null } = {}) {
	const config = readSpecdownConfig(repoRoot);
	const allSpecFiles = selectedSpecFiles(repoRoot, targets);
	const specFiles = limit === null ? allSpecFiles : allSpecFiles.slice(0, limit);
	const entries = specFiles.map((specFile, index) => runFocusedSpecdown(repoRoot, config, specFile, index))
		.sort((left, right) => right.durationMs - left.durationMs || left.specFile.localeCompare(right.specFile));
	const totalDurationMs = entries.reduce((sum, entry) => sum + entry.durationMs, 0);
	return {
		schemaVersion: "cautilus.specdown_profile.v1",
		profiledCount: entries.length,
		totalCandidateCount: allSpecFiles.length,
		limited: specFiles.length !== allSpecFiles.length,
		totalDurationMs,
		entries,
	};
}

export function formatTextReport(report, { top = 10 } = {}) {
	const limitNote = report.limited
		? `; limited to ${report.profiledCount}/${report.totalCandidateCount}`
		: "";
	const lines = [
		`specdown per-spec profile: ${report.profiledCount} spec(s), total ${formatDuration(report.totalDurationMs)}${limitNote}`,
	];
	for (const entry of report.entries.slice(0, top)) {
		lines.push(`- ${entry.specFile}: ${formatDuration(entry.durationMs)}`);
	}
	return `${lines.join("\n")}\n`;
}

function main() {
	try {
		const parsed = parseArgs(process.argv.slice(2));
		if (parsed.help) {
			process.stdout.write(`${usage()}\n`);
			return;
		}
		const report = profileSpecdown(parsed);
		if (parsed.json) {
			process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
		} else {
			process.stdout.write(formatTextReport(report, { top: parsed.top }));
		}
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
