#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const DEFAULT_CLAIMS_DIR = ".cautilus/claims";

export function parseArgs(argv = process.argv.slice(2)) {
	const args = {
		claims: `${DEFAULT_CLAIMS_DIR}/latest.json`,
		claimsDir: DEFAULT_CLAIMS_DIR,
		output: `${DEFAULT_CLAIMS_DIR}/evidenced-typed-runners.json`,
		cautilusBin: fs.existsSync("./bin/cautilus") ? "./bin/cautilus" : "cautilus",
		reviewResults: [],
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "--claims") {
			args.claims = argv[++index];
		} else if (arg === "--claims-dir") {
			args.claimsDir = argv[++index];
		} else if (arg === "--review-result") {
			args.reviewResults.push(argv[++index]);
		} else if (arg === "--output") {
			args.output = argv[++index];
		} else if (arg === "--cautilus-bin") {
			args.cautilusBin = argv[++index];
		} else {
			throw new Error(`Unsupported argument: ${arg}`);
		}
	}
	return args;
}

function readJSON(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJSON(filePath, value) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function reviewResultPaths({ claimsDir, reviewResults = [] }) {
	if (reviewResults.length > 0) {
		return [...reviewResults].sort((left, right) => left.localeCompare(right));
	}
	if (!claimsDir || !fs.existsSync(claimsDir)) {
		return [];
	}
	return fs
		.readdirSync(claimsDir)
		.filter((name) => name.startsWith("review-result-") && name.endsWith(".json"))
		.map((name) => path.join(claimsDir, name))
		.sort((left, right) => left.localeCompare(right));
}

export function claimIdsForPacket(claimPacket) {
	return new Set((Array.isArray(claimPacket?.claimCandidates) ? claimPacket.claimCandidates : []).map((claim) => claim.claimId));
}

export function claimIndexForPacket(claimPacket) {
	return new Map((Array.isArray(claimPacket?.claimCandidates) ? claimPacket.claimCandidates : []).map((claim) => [claim.claimId, claim]));
}

function updateMatchesClaim(update, claim) {
	if (!claim) {
		return false;
	}
	if (update.claimFingerprint && claim.claimFingerprint && update.claimFingerprint !== claim.claimFingerprint) {
		return false;
	}
	return true;
}

export function filterReviewResultForCurrentClaims(reviewResult, claimIndex) {
	const clusterResults = [];
	let keptUpdateCount = 0;
	let droppedUpdateCount = 0;
	for (const cluster of Array.isArray(reviewResult?.clusterResults) ? reviewResult.clusterResults : []) {
		const claimUpdates = [];
		for (const update of Array.isArray(cluster.claimUpdates) ? cluster.claimUpdates : []) {
			if (updateMatchesClaim(update, claimIndex.get(update.claimId))) {
				claimUpdates.push(update);
				keptUpdateCount += 1;
			} else {
				droppedUpdateCount += 1;
			}
		}
		if (claimUpdates.length > 0) {
			clusterResults.push({ ...cluster, claimUpdates });
		}
	}
	return {
		reviewResult: { ...reviewResult, clusterResults },
		keptUpdateCount,
		droppedUpdateCount,
	};
}

export function filterReviewResultForClaimIds(reviewResult, claimIds) {
	const claimIndex = new Map([...claimIds].map((claimId) => [claimId, { claimId }]));
	return filterReviewResultForCurrentClaims(reviewResult, claimIndex);
}

function runApplyResult({ cautilusBin, claims, reviewResult, output }) {
	const result = spawnSync(
		cautilusBin,
		["claim", "review", "apply-result", "--claims", claims, "--review-result", reviewResult, "--output", output],
		{ encoding: "utf8" },
	);
	if (result.status !== 0) {
		throw new Error(
			[
				`claim review apply-result failed for ${reviewResult}`,
				result.stdout?.trim(),
				result.stderr?.trim(),
			]
				.filter(Boolean)
				.join("\n"),
		);
	}
}

export function applyCurrentReviewResults(options) {
	const basePacket = readJSON(options.claims);
	const currentIndex = claimIndexForPacket(basePacket);
	const paths = reviewResultPaths(options);
	const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "cautilus-review-results-"));
	const currentPath = path.join(tmpdir, "current.json");
	let appliedPacketPath = currentPath;
	let appliedResultCount = 0;
	let skippedResultCount = 0;
	let keptUpdateCount = 0;
	let droppedUpdateCount = 0;
	try {
		writeJSON(currentPath, basePacket);
		for (const reviewResultPath of paths) {
			const reviewResult = readJSON(reviewResultPath);
			const filtered = filterReviewResultForCurrentClaims(reviewResult, currentIndex);
			droppedUpdateCount += filtered.droppedUpdateCount;
			if (filtered.keptUpdateCount === 0) {
				skippedResultCount += 1;
				continue;
			}
			keptUpdateCount += filtered.keptUpdateCount;
			const filteredPath = path.join(tmpdir, path.basename(reviewResultPath));
			const nextPath = path.join(tmpdir, `applied-${appliedResultCount + 1}.json`);
			writeJSON(filteredPath, filtered.reviewResult);
			runApplyResult({
				cautilusBin: options.cautilusBin,
				claims: appliedPacketPath,
				reviewResult: filteredPath,
				output: nextPath,
			});
			appliedPacketPath = nextPath;
			appliedResultCount += 1;
		}
		fs.mkdirSync(path.dirname(options.output), { recursive: true });
		fs.copyFileSync(appliedPacketPath, options.output);
		return {
			appliedResultCount,
			skippedResultCount,
			keptUpdateCount,
			droppedUpdateCount,
			output: options.output,
		};
	} finally {
		fs.rmSync(tmpdir, { recursive: true, force: true });
	}
}

export function main(argv = process.argv.slice(2)) {
	const args = parseArgs(argv);
	const summary = applyCurrentReviewResults(args);
	console.log(JSON.stringify(summary, null, 2));
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
