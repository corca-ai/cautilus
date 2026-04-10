import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/release/fetch-github-archive-sha256.mjs --version <v0.1.0> [--repo <owner/name>] [--output <file>]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function readRequiredValue(argv, index, option) {
	const value = argv[index + 1] || "";
	if (!value) {
		throw new Error(`${option} requires a value`);
	}
	return value;
}

function parseArgs(argv) {
	const options = {
		version: "",
		repo: "corca-ai/cautilus",
		output: "",
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--version") {
			options.version = readRequiredValue(argv, index, arg);
			index += 1;
			continue;
		}
		if (arg === "--repo") {
			options.repo = readRequiredValue(argv, index, arg);
			index += 1;
			continue;
		}
		if (arg === "--output") {
			options.output = readRequiredValue(argv, index, arg);
			index += 1;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	if (!options.version) {
		throw new Error("--version is required");
	}
	return options;
}

export function renderArchiveUrl({ repo, version }) {
	return `https://github.com/${repo}/archive/refs/tags/${version}.tar.gz`;
}

export async function fetchArchiveSha256({ repo, version }) {
	const response = await fetch(renderArchiveUrl({ repo, version }));
	if (!response.ok) {
		throw new Error(`Failed to fetch archive: ${response.status} ${response.statusText}`);
	}
	const hash = createHash("sha256");
	for await (const chunk of response.body) {
		hash.update(chunk);
	}
	return hash.digest("hex");
}

export async function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArgs(argv);
		const sha256 = await fetchArchiveSha256(options);
		if (options.output) {
			writeFileSync(resolve(options.output), `${sha256}\n`, "utf-8");
			return;
		}
		process.stdout.write(`${sha256}\n`);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	await main();
}
