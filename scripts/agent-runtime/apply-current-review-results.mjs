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

function slashPath(value) {
	return value.split(path.sep).join("/");
}

function stableDisplayPath(filePath, cwd = process.cwd()) {
	if (!filePath) {
		return filePath;
	}
	const absolutePath = path.resolve(cwd, filePath);
	const relativePath = path.relative(cwd, absolutePath);
	if (!relativePath.startsWith("..") && !path.isAbsolute(relativePath)) {
		return slashPath(relativePath);
	}
	return slashPath(path.normalize(filePath));
}

export function normalizeAggregateReviewApplication(packet, { claims, reviewResultPath, cwd = process.cwd() } = {}) {
	if (!packet || typeof packet !== "object" || !packet.reviewApplication) {
		return packet;
	}
	return {
		...packet,
		reviewApplication: {
			...packet.reviewApplication,
			claimsPath: stableDisplayPath(claims, cwd),
			reviewResultPath: stableDisplayPath(reviewResultPath, cwd),
			provenanceMode: "aggregate-current-review-results",
		},
	};
}

export function reviewResultPaths({ claimsDir, reviewResults = [] }) {
	const sortPaths = (paths) => [...paths].sort(compareReviewResultPaths);
	if (reviewResults.length > 0) {
		return sortPaths(reviewResults);
	}
	if (!claimsDir || !fs.existsSync(claimsDir)) {
		return [];
	}
	return sortPaths(
		fs
			.readdirSync(claimsDir)
			.filter((name) => name.startsWith("review-result-") && name.endsWith(".json"))
			.map((name) => path.join(claimsDir, name)),
	);
}

function parseTimestamp(value) {
	if (typeof value !== "string" || !value.trim()) {
		return Number.NEGATIVE_INFINITY;
	}
	const parsed = Date.parse(value);
	return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function dateFromPath(filePath) {
	const match = path.basename(filePath).match(/\b(20\d{2}-\d{2}-\d{2})\b/);
	return match ? `${match[1]}T00:00:00Z` : "";
}

function timestampCandidate(value, sourceRank) {
	return { sourceRank, value };
}

function reviewResultTimestampCandidates(reviewResult, filePath) {
	if (!reviewResult || typeof reviewResult !== "object") {
		return [timestampCandidate(dateFromPath(filePath), 0)];
	}
	return [
		timestampCandidate(reviewResult.reviewer?.reviewedAt, 1),
		timestampCandidate(reviewResult.reviewRun?.reviewedAt, 1),
		timestampCandidate(reviewResult.reviewRun?.createdAt, 1),
		timestampCandidate(reviewResult.metadata?.reviewedAt, 1),
		timestampCandidate(reviewResult.metadata?.createdAt, 1),
		timestampCandidate(dateFromPath(filePath), 0),
	];
}

function firstParseableTimestamp(candidates) {
	for (const candidate of candidates) {
		const timestamp = parseTimestamp(candidate.value);
		if (timestamp !== Number.NEGATIVE_INFINITY) {
			return { sourceRank: candidate.sourceRank, timestamp };
		}
	}
	return { sourceRank: 0, timestamp: Number.NEGATIVE_INFINITY };
}

function reviewResultTimeKey(filePath) {
	let reviewResult = null;
	try {
		reviewResult = readJSON(filePath);
	} catch {
		// Fall back to filename dates for stale, partial, or test-only paths.
	}
	return firstParseableTimestamp(reviewResultTimestampCandidates(reviewResult, filePath));
}

export function reviewResultTimestamp(filePath) {
	return reviewResultTimeKey(filePath).timestamp;
}

export function compareReviewResultPaths(left, right) {
	const leftKey = reviewResultTimeKey(left);
	const rightKey = reviewResultTimeKey(right);
	if (leftKey.timestamp !== rightKey.timestamp) {
		return leftKey.timestamp - rightKey.timestamp;
	}
	if (leftKey.sourceRank !== rightKey.sourceRank) {
		return leftKey.sourceRank - rightKey.sourceRank;
	}
	return left.localeCompare(right);
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
	let lastAppliedReviewResultPath = "";
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
			lastAppliedReviewResultPath = reviewResultPath;
		}
		fs.mkdirSync(path.dirname(options.output), { recursive: true });
		fs.copyFileSync(appliedPacketPath, options.output);
		if (lastAppliedReviewResultPath) {
			const outputPacket = normalizeAggregateReviewApplication(readJSON(options.output), {
				claims: options.claims,
				reviewResultPath: lastAppliedReviewResultPath,
			});
			writeJSON(options.output, outputPacket);
		}
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
