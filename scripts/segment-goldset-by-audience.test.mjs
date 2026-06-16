import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	main,
	parseArgs,
	printReport,
	segmentByAudience,
	trackForAudience,
	trackFileName,
	writeTracks,
	TRACK_USER_PRODUCT,
	TRACK_DEVELOPER,
	TRACK_HOLDING,
} from "./segment-goldset-by-audience.mjs";

// Capture process.stdout.write for the report-printing and CLI paths.
function captureStdout(fn) {
	const orig = process.stdout.write;
	let buf = "";
	process.stdout.write = (chunk) => {
		buf += chunk;
		return true;
	};
	try {
		fn();
	} finally {
		process.stdout.write = orig;
	}
	return buf;
}

function entry(id, audience) {
	return {
		claimId: id,
		claimFingerprint: `sha256:${id}`,
		sourceRef: "README.md:1",
		summary: `summary for ${id}`,
		agentLabels: { claimAudience: audience },
		maintainerVerdict: "pending",
	};
}

function fixtureProposal(entries) {
	return {
		schemaVersion: "cautilus.gold_set_proposal.v2",
		purpose: "fixture",
		sourcePacket: "fixture/claims-agent.json",
		extractionMode: "agent",
		verdictDefinitions: { accept: "ok" },
		carriedForwardRules: ["R1"],
		entries,
	};
}

test("trackForAudience maps user/developer and falls back to holding", () => {
	assert.equal(trackForAudience("user"), TRACK_USER_PRODUCT);
	assert.equal(trackForAudience("developer"), TRACK_DEVELOPER);
	assert.equal(trackForAudience("unclear"), TRACK_HOLDING);
	assert.equal(trackForAudience(undefined), TRACK_HOLDING);
});

test("partitions entries into the correct tracks", () => {
	const proposal = fixtureProposal([
		entry("a", "user"),
		entry("b", "developer"),
		entry("c", "user"),
		entry("d", "unclear"),
	]);
	const { tracks, report } = segmentByAudience(proposal);
	assert.deepEqual(
		tracks[TRACK_USER_PRODUCT].entries.map((e) => e.claimId),
		["a", "c"],
	);
	assert.deepEqual(
		tracks[TRACK_DEVELOPER].entries.map((e) => e.claimId),
		["b"],
	);
	assert.deepEqual(
		tracks[TRACK_HOLDING].entries.map((e) => e.claimId),
		["d"],
	);
	assert.deepEqual(report.counts, {
		[TRACK_USER_PRODUCT]: 2,
		[TRACK_DEVELOPER]: 1,
		[TRACK_HOLDING]: 1,
	});
});

test("acceptance: segmentation is reversible (no loss, no duplication)", () => {
	const proposal = fixtureProposal([
		entry("a", "user"),
		entry("b", "developer"),
		entry("c", "developer"),
		entry("d", "user"),
	]);
	const { report } = segmentByAudience(proposal);
	assert.equal(report.total, 4);
	assert.equal(report.unionCount, 4);
	assert.equal(report.noLoss, true);
	assert.equal(report.noDuplication, true);
	assert.equal(report.unionEqualsOriginal, true);
	assert.equal(report.pass, true);
});

test("acceptance: user-product track excludes developer-audience claims", () => {
	const proposal = fixtureProposal([
		entry("a", "user"),
		entry("b", "developer"),
	]);
	const { tracks, report } = segmentByAudience(proposal);
	assert.equal(report.userProductExcludesDeveloper, true);
	assert.ok(
		tracks[TRACK_USER_PRODUCT].entries.every(
			(e) => e.agentLabels.claimAudience === "user",
		),
	);
});

test("preserves top-level metadata and records segmentation provenance", () => {
	const proposal = fixtureProposal([entry("a", "user")]);
	const { tracks } = segmentByAudience(proposal, { segmentedFrom: "src.json" });
	const t = tracks[TRACK_USER_PRODUCT];
	assert.equal(t.schemaVersion, "cautilus.gold_set_proposal.v2");
	assert.equal(t.sourcePacket, "fixture/claims-agent.json");
	assert.deepEqual(t.carriedForwardRules, ["R1"]);
	assert.equal(t.track, TRACK_USER_PRODUCT);
	assert.equal(t.segmentedBy, "claimAudience");
	assert.equal(t.segmentedFrom, "src.json");
	assert.equal("entries" in t, true);
});

test("trackFileName derives <stem>.<track>.json", () => {
	assert.equal(
		trackFileName("gold-set-proposal.json", TRACK_USER_PRODUCT),
		"gold-set-proposal.user-product.json",
	);
	assert.equal(
		trackFileName("gold-set-proposal.json", TRACK_DEVELOPER),
		"gold-set-proposal.developer.json",
	);
});

test("determinism: repeated segmentation yields identical track ordering", () => {
	const proposal = fixtureProposal([
		entry("a", "user"),
		entry("b", "developer"),
		entry("c", "user"),
	]);
	const first = segmentByAudience(proposal);
	const second = segmentByAudience(proposal);
	assert.deepEqual(
		first.tracks[TRACK_USER_PRODUCT].entries,
		second.tracks[TRACK_USER_PRODUCT].entries,
	);
	assert.deepEqual(first.report, second.report);
});

test("parseArgs reads flags and defaults", () => {
	assert.deepEqual(parseArgs([]), {
		input: null,
		outDir: null,
		check: false,
		json: false,
	});
	assert.deepEqual(
		parseArgs(["--input", "in.json", "--out-dir", "out", "--check", "--json"]),
		{ input: "in.json", outDir: "out", check: true, json: true },
	);
});

test("writeTracks writes non-empty tracks and skips an empty holding bucket", () => {
	const dir = mkdtempSync(join(tmpdir(), "seg-write-"));
	const proposal = fixtureProposal([entry("a", "user"), entry("b", "developer")]);
	const { tracks } = segmentByAudience(proposal);
	const written = writeTracks(tracks, dir, "gold-set-proposal.json");
	assert.equal(written.length, 2);
	assert.ok(!written.some((p) => p.endsWith(".holding.json")));
	const userPath = join(dir, "gold-set-proposal.user-product.json");
	assert.ok(written.includes(userPath));
	const parsed = JSON.parse(readFileSync(userPath, "utf8"));
	assert.deepEqual(
		parsed.entries.map((e) => e.claimId),
		["a"],
	);
});

test("printReport prints counts, totals, and written paths", () => {
	const proposal = fixtureProposal([entry("a", "user"), entry("b", "developer")]);
	const { report } = segmentByAudience(proposal);
	const out = captureStdout(() =>
		printReport(report, ["/tmp/x.user-product.json"], "gold-set-proposal.json"),
	);
	assert.match(out, /Segmented gold-set-proposal\.json by claimAudience/);
	assert.match(out, /user-product: 1/);
	assert.match(out, /union=2 total=2/);
	assert.match(out, /wrote \/tmp\/x\.user-product\.json/);
});

test("main runs the CLI round-trip: reads input, writes tracks, json report", () => {
	const dir = mkdtempSync(join(tmpdir(), "seg-main-"));
	const inputPath = join(dir, "gold-set-proposal.json");
	writeFileSync(
		inputPath,
		JSON.stringify(
			fixtureProposal([
				entry("a", "user"),
				entry("b", "developer"),
				entry("c", "unclear"),
			]),
		),
	);
	const origArgv = process.argv;
	process.argv = ["node", "x", "--input", inputPath, "--json"];
	let out;
	try {
		out = captureStdout(() => main());
	} finally {
		process.argv = origArgv;
	}
	const payload = JSON.parse(out);
	assert.equal(payload.report.pass, true);
	assert.equal(payload.report.total, 3);
	// holding is non-empty here (c=unclear), so all three tracks are written.
	assert.equal(payload.written.length, 3);
	assert.ok(existsSync(join(dir, "gold-set-proposal.user-product.json")));
	assert.ok(existsSync(join(dir, "gold-set-proposal.holding.json")));
});

test("main --check reports without writing files (default out-dir, non-json)", () => {
	const dir = mkdtempSync(join(tmpdir(), "seg-check-"));
	const inputPath = join(dir, "gold-set-proposal.json");
	writeFileSync(inputPath, JSON.stringify(fixtureProposal([entry("a", "user")])));
	const origArgv = process.argv;
	process.argv = ["node", "x", "--input", inputPath, "--check"];
	let out;
	try {
		out = captureStdout(() => main());
	} finally {
		process.argv = origArgv;
	}
	assert.match(out, /Segmented gold-set-proposal\.json by claimAudience/);
	assert.ok(!existsSync(join(dir, "gold-set-proposal.user-product.json")));
});

test("main exits non-zero when acceptance checks fail", () => {
	const dir = mkdtempSync(join(tmpdir(), "seg-fail-"));
	const inputPath = join(dir, "gold-set-proposal.json");
	// Duplicate claimId -> noDuplication false -> report.pass false.
	writeFileSync(
		inputPath,
		JSON.stringify(fixtureProposal([entry("a", "user"), entry("a", "user")])),
	);
	const origArgv = process.argv;
	const origExit = process.exit;
	const origErr = process.stderr.write;
	let exitCode = null;
	process.argv = ["node", "x", "--input", inputPath, "--check"];
	process.exit = (code) => {
		exitCode = code;
	};
	process.stderr.write = () => true;
	try {
		captureStdout(() => main());
	} finally {
		process.argv = origArgv;
		process.exit = origExit;
		process.stderr.write = origErr;
	}
	assert.equal(exitCode, 1);
});
