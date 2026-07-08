#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readlinkSync, rmSync, symlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import process from "node:process";
import { pathToFileURL } from "node:url";

function trackedFiles(repoRoot) {
	const result = spawnSync("git", ["ls-files", "-z"], {
		cwd: repoRoot,
		encoding: "buffer",
	});
	if (result.error) throw result.error;
	if (result.status !== 0) {
		process.stderr.write(result.stderr.toString("utf-8"));
		process.exit(result.status || 1);
	}
	return result.stdout.toString("utf-8").split("\0").filter(Boolean);
}

function copyTrackedFiles(repoRoot, files, targetRoot) {
	let copied = 0;
	for (const file of files) {
		const source = resolve(repoRoot, file);
		if (!existsSync(source)) continue;
		const target = resolve(targetRoot, file);
		mkdirSync(dirname(target), { recursive: true });
		if (lstatSync(source).isSymbolicLink()) {
			symlinkSync(readlinkSync(source), target);
			copied += 1;
			continue;
		}
		cpSync(source, target, { dereference: false });
		copied += 1;
	}
	return copied;
}

export function runTrackedGitleaks({ repoRoot = process.cwd(), args = [] } = {}) {
	const files = trackedFiles(repoRoot);
	const tempRoot = mkdtempSync(resolve(tmpdir(), "cautilus-gitleaks-tracked-"));
	try {
		const copied = copyTrackedFiles(repoRoot, files, tempRoot);
		process.stderr.write(`gitleaks tracked scan: ${copied} tracked file(s)\n`);
		const result = spawnSync("gitleaks", ["dir", ".", "--no-banner", "--redact", ...args], {
			cwd: tempRoot,
			stdio: "inherit",
		});
		if (result.error) throw result.error;
		return result.status || 0;
	} finally {
		rmSync(tempRoot, { recursive: true, force: true });
	}
}

function main() {
	try {
		process.exit(runTrackedGitleaks({ args: process.argv.slice(2) }));
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
