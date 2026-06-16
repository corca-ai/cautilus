#!/usr/bin/env node
// Post-hoc segmentation of a gold-set proposal by claimAudience into review tracks.
//
// This is NOT a new product seam: it partitions an eval-trust artifact
// (the regenerated gold-set proposal over agent extraction output) so the paused
// HITL can ratify one audience layer at a time.
// Spec: charness-artifacts/spec/2026-06-16-agent-extraction-curation-layering.md (D2).
//
// The segmentation is deterministic (entry order preserved, audience-keyed) and
// reversible (the union of all tracks equals the source proposal: no claim lost,
// none duplicated). Those two properties are the slice acceptance checks.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, basename } from "node:path";

export const TRACK_USER_PRODUCT = "user-product";
export const TRACK_DEVELOPER = "developer";
export const TRACK_HOLDING = "holding";

// claimAudience -> review track. `user` is the product-promise surface the HITL
// ratifies first; `developer` is repo-behavior claims (legitimate, AGENTS/CLAUDE
// linked internal docs included); anything else (unclear/missing) falls to the
// holding bucket, reviewed alongside the developer track per spec D2 unless the
// maintainer reassigns it.
export function trackForAudience(audience) {
	if (audience === "user") return TRACK_USER_PRODUCT;
	if (audience === "developer") return TRACK_DEVELOPER;
	return TRACK_HOLDING;
}

// Copy every top-level proposal field except `entries`, preserving order.
function proposalMeta(proposal) {
	const meta = {};
	for (const [key, value] of Object.entries(proposal)) {
		if (key === "entries") continue;
		meta[key] = value;
	}
	return meta;
}

// Partition the proposal entries into tracks while preserving every top-level
// metadata field and the original entry order within each track.
export function segmentByAudience(proposal, { segmentedFrom = null } = {}) {
	const entries = Array.isArray(proposal.entries) ? proposal.entries : [];
	const buckets = {
		[TRACK_USER_PRODUCT]: [],
		[TRACK_DEVELOPER]: [],
		[TRACK_HOLDING]: [],
	};
	for (const entry of entries) {
		const audience = entry?.agentLabels?.claimAudience;
		buckets[trackForAudience(audience)].push(entry);
	}
	const meta = proposalMeta(proposal);
	const tracks = {};
	for (const [track, trackEntries] of Object.entries(buckets)) {
		tracks[track] = {
			...meta,
			track,
			segmentedBy: "claimAudience",
			segmentedFrom,
			entries: trackEntries,
		};
	}
	return { tracks, report: buildReport(proposal, tracks) };
}

// Build the reversibility + exclusion report that backs the slice acceptance
// checks. `pass` is the single gate the CLI exits on.
export function buildReport(proposal, tracks) {
	const originalIds = (proposal.entries || []).map((e) => e.claimId);
	const originalIdSet = new Set(originalIds);

	let unionIds = [];
	const counts = {};
	for (const [track, t] of Object.entries(tracks)) {
		const ids = t.entries.map((e) => e.claimId);
		counts[track] = ids.length;
		unionIds = unionIds.concat(ids);
	}
	const unionSet = new Set(unionIds);

	const noDuplication = unionIds.length === unionSet.size;
	const noLoss =
		originalIdSet.size === unionSet.size &&
		[...originalIdSet].every((id) => unionSet.has(id));
	const unionEqualsOriginal =
		originalIds.length === unionIds.length && noDuplication && noLoss;

	const userProductExcludesDeveloper = tracks[
		TRACK_USER_PRODUCT
	].entries.every((e) => e?.agentLabels?.claimAudience === "user");

	return {
		total: originalIds.length,
		counts,
		unionCount: unionIds.length,
		noDuplication,
		noLoss,
		unionEqualsOriginal,
		userProductExcludesDeveloper,
		pass: unionEqualsOriginal && userProductExcludesDeveloper,
	};
}

// Derive a track filename from the source proposal name:
// gold-set-proposal.json -> gold-set-proposal.<track>.json
export function trackFileName(sourceName, track) {
	const ext = sourceName.endsWith(".json") ? ".json" : "";
	const stem = ext ? sourceName.slice(0, -ext.length) : sourceName;
	return `${stem}.${track}${ext}`;
}

export function parseArgs(argv) {
	const args = { input: null, outDir: null, check: false, json: false };
	for (let i = 0; i < argv.length; i += 1) {
		const a = argv[i];
		if (a === "--input") args.input = argv[(i += 1)];
		else if (a === "--out-dir") args.outDir = argv[(i += 1)];
		else if (a === "--check") args.check = true;
		else if (a === "--json") args.json = true;
	}
	return args;
}

// Write each non-empty track to <outDir>/<source>.<track>.json. An empty holding
// bucket is skipped (no confusing empty artifact) but still counts in the union.
export function writeTracks(tracks, outDir, sourceName) {
	const written = [];
	for (const [track, t] of Object.entries(tracks)) {
		if (track === TRACK_HOLDING && t.entries.length === 0) continue;
		const outPath = join(outDir, trackFileName(sourceName, track));
		writeFileSync(outPath, `${JSON.stringify(t, null, 2)}\n`);
		written.push(outPath);
	}
	return written;
}

export function printReport(report, written, sourceName) {
	process.stdout.write(`Segmented ${sourceName} by claimAudience\n`);
	for (const [track, count] of Object.entries(report.counts)) {
		process.stdout.write(`  ${track}: ${count}\n`);
	}
	process.stdout.write(
		`  union=${report.unionCount} total=${report.total} ` +
			`noLoss=${report.noLoss} noDup=${report.noDuplication} ` +
			`userProductExcludesDeveloper=${report.userProductExcludesDeveloper}\n`,
	);
	for (const p of written) process.stdout.write(`  wrote ${p}\n`);
}

export function main() {
	const args = parseArgs(process.argv.slice(2));
	const input =
		args.input ||
		"charness-artifacts/eval-trust/goldset-v2-agent-extraction/gold-set-proposal.json";
	const outDir = args.outDir || dirname(input);
	const sourceName = basename(input);

	const proposal = JSON.parse(readFileSync(input, "utf8"));
	const { tracks, report } = segmentByAudience(proposal, { segmentedFrom: input });
	const written = args.check ? [] : writeTracks(tracks, outDir, sourceName);

	if (args.json) {
		process.stdout.write(`${JSON.stringify({ report, written }, null, 2)}\n`);
	} else {
		printReport(report, written, sourceName);
	}

	if (!report.pass) {
		process.stderr.write("FAIL: segmentation acceptance checks did not pass\n");
		process.exit(1);
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
