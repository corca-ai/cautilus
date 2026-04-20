import { Buffer } from "node:buffer";
import process from "node:process";
import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

import { listReleaseTargets, binaryAssetName } from "./binary-assets.mjs";
import { renderHomebrewFormula } from "./render-homebrew-formula.mjs";
import { resolveReleaseTargets } from "./resolve-release-targets.mjs";

const DEFAULT_RELEASE_FORMULA_ASSET = "Cautilus.rb";
const DEFAULT_TAP_FORMULA_PATH = "Formula/cautilus.rb";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/release/verify-public-release.mjs --version <v0.3.0> [--repo <owner/name>] [--tap-repo <owner/name>] [--json] [--skip-tap-check] [--retry-attempts <n>] [--retry-delay-ms <ms>]",
	].join("\n");
	const stream = exitCode === 0 ? process.stdout : process.stderr;
	stream.write(`${text}\n`);
	process.exit(exitCode);
}

function readRequiredValue(argv, index, option) {
	const value = argv[index + 1] || "";
	if (!value) {
		throw new Error(`${option} requires a value`);
	}
	return value;
}

function parseArgs(argv = process.argv.slice(2)) {
	const targets = resolveReleaseTargets();
	const options = {
		version: "",
		repo: targets.sourceRepo,
		tapRepo: targets.tapRepo,
		json: false,
		checkTap: true,
		retryAttempts: 1,
		retryDelayMs: 0,
	};
	for (let index = 0; index < argv.length; index += 1) {
		index = applyArg(options, argv, index);
	}
	if (!options.version) {
		throw new Error("--version is required");
	}
	return options;
}

function parseNonNegativeInteger(value, option) {
	if (!/^\d+$/.test(String(value || ""))) {
		throw new Error(`${option} must be a non-negative integer`);
	}
	return Number.parseInt(value, 10);
}

function applyArg(options, argv, index) {
	const arg = argv[index];
	if (arg === "-h" || arg === "--help") {
		usage(0);
	}
	const flagMap = {
		"--json": () => {
			options.json = true;
			return index;
		},
		"--skip-tap-check": () => {
			options.checkTap = false;
			return index;
		},
	};
	const valueMap = {
		"--version": "version",
		"--repo": "repo",
		"--tap-repo": "tapRepo",
	};
	if (flagMap[arg]) {
		return flagMap[arg]();
	}
	const target = valueMap[arg];
	if (target) {
		options[target] = readRequiredValue(argv, index, arg);
		return index + 1;
	}
	if (arg === "--retry-attempts") {
		options.retryAttempts = parseNonNegativeInteger(readRequiredValue(argv, index, arg), arg);
		if (options.retryAttempts < 1) {
			throw new Error("--retry-attempts must be at least 1");
		}
		return index + 1;
	}
	if (arg === "--retry-delay-ms") {
		options.retryDelayMs = parseNonNegativeInteger(readRequiredValue(argv, index, arg), arg);
		return index + 1;
	}
	if (!target) {
		throw new Error(`Unknown argument: ${arg}`);
	}
}

function githubHeaders() {
	const headers = {
		accept: "application/vnd.github+json",
		"user-agent": "cautilus-release-verifier",
	};
	const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
	if (token) {
		headers.authorization = `Bearer ${token}`;
	}
	return headers;
}

async function fetchJson(url, fetchImplementation = fetch) {
	const response = await fetchImplementation(url, { headers: githubHeaders() });
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
	}
	return response.json();
}

async function fetchText(url, fetchImplementation = fetch) {
	const response = await fetchImplementation(url, { headers: githubHeaders() });
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
	}
	return response.text();
}

export function expectedBinaryAssets(version) {
	return listReleaseTargets().map((target) =>
		binaryAssetName({
			version,
			goos: target.goos,
			goarch: target.goarch,
		}),
	);
}

export function expectedReleaseAssets(version) {
	return [
		`cautilus-${version}.sha256`,
		...expectedBinaryAssets(version),
		`cautilus-${version}-checksums.txt`,
		DEFAULT_RELEASE_FORMULA_ASSET,
		`release-notes-${version}.md`,
	];
}

function parseChecksumManifest(content) {
	const entries = new Map();
	for (const rawLine of String(content || "").split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line) {
			continue;
		}
		const match = line.match(/^([a-f0-9]{64})\s+\*?(.+)$/i);
		if (!match) {
			continue;
		}
		const filename = match[2].replace(/^dist\//, "");
		entries.set(filename, match[1].toLowerCase());
	}
	return entries;
}

function decodeGitHubContents(payload) {
	if (!payload || payload.encoding !== "base64") {
		throw new Error("Expected GitHub contents payload with base64 encoding");
	}
	return Buffer.from(String(payload.content || "").replace(/\n/g, ""), "base64").toString("utf-8");
}

function normalizeContent(content) {
	return String(content || "").trim().replace(/\r\n/g, "\n");
}

function buildReleaseNotesExpectations({ version, binaryAssets }) {
	return [
		`# Cautilus ${version}`,
		"- source archive checksum:",
		"- binary artifacts:",
		...binaryAssets.map((asset) => `\`${asset}\``),
		`- binary checksum manifest: \`cautilus-${version}-checksums.txt\``,
		`- formula artifact: \`${DEFAULT_RELEASE_FORMULA_ASSET}\``,
	];
}

function summarizeText(result) {
	const lines = [];
	lines.push(`release: ${result.version} (${result.repo})`);
	lines.push(`status: ${result.ok ? "ok" : "failed"}`);
	if (result.releaseUrl) {
		lines.push(`url: ${result.releaseUrl}`);
	}
	if (result.problems.length > 0) {
		lines.push("problems:");
		for (const problem of result.problems) {
			lines.push(`- ${problem}`);
		}
	}
	if (result.warnings.length > 0) {
		lines.push("warnings:");
		for (const warning of result.warnings) {
			lines.push(`- ${warning}`);
		}
	}
	return `${lines.join("\n")}\n`;
}

function createResult({ version, repo, tapRepo, checkTap }) {
	return {
		ok: true,
		version,
		repo,
		tapRepo,
		releaseUrl: "",
		problems: [],
		warnings: [],
		assets: {
			expected: expectedReleaseAssets(version),
			present: [],
			missing: [],
			unexpected: [],
		},
		checksums: {
			ok: false,
			entries: [],
			missingBinaryAssets: [],
		},
		releaseNotes: {
			ok: false,
			missingExpectations: [],
		},
		formulaAsset: {
			ok: false,
			matchesRenderedFormula: false,
		},
		tapFormula: {
			checked: checkTap,
			ok: !checkTap,
			path: DEFAULT_TAP_FORMULA_PATH,
		},
	};
}

function applyReleaseMetadata(result, release) {
	result.releaseUrl = String(release.html_url || "");
	if (release.draft) {
		result.problems.push(`release ${result.version} is still a draft`);
	}
	if (release.prerelease) {
		result.problems.push(`release ${result.version} is still marked prerelease`);
	}
}

function collectReleaseAssets(result, release) {
	const assets = Array.isArray(release.assets) ? release.assets : [];
	const assetMap = new Map(assets.map((asset) => [asset.name, asset]));
	result.assets.present = [...assetMap.keys()].sort((a, b) => a.localeCompare(b));
	result.assets.missing = result.assets.expected.filter((name) => !assetMap.has(name));
	result.assets.unexpected = result.assets.present.filter((name) => !result.assets.expected.includes(name));
	if (result.assets.missing.length > 0) {
		result.problems.push(`missing release assets: ${result.assets.missing.join(", ")}`);
	}
	if (result.assets.unexpected.length > 0) {
		result.warnings.push(`unexpected release assets: ${result.assets.unexpected.join(", ")}`);
	}
	return assetMap;
}

async function readArchiveChecksum({ result, version, assetMap, fetchImplementation }) {
	const shaAsset = assetMap.get(`cautilus-${version}.sha256`);
	if (!shaAsset) {
		return "";
	}
	if (!shaAsset.browser_download_url) {
		result.problems.push(`release asset ${shaAsset.name} is missing browser_download_url`);
		return "";
	}
	const archiveSha256 = normalizeContent(await fetchText(shaAsset.browser_download_url, fetchImplementation));
	if (!/^[a-f0-9]{64}$/i.test(archiveSha256)) {
		result.problems.push(`release archive checksum asset is malformed: ${shaAsset.name}`);
	}
	return archiveSha256;
}

async function verifyChecksumManifest({ result, version, assetMap, fetchImplementation }) {
	const checksumAsset = assetMap.get(`cautilus-${version}-checksums.txt`);
	if (!checksumAsset?.browser_download_url) {
		return;
	}
	const checksumText = await fetchText(checksumAsset.browser_download_url, fetchImplementation);
	const entries = parseChecksumManifest(checksumText);
	result.checksums.entries = [...entries.keys()].sort((a, b) => a.localeCompare(b));
	result.checksums.missingBinaryAssets = expectedBinaryAssets(version).filter((name) => !entries.has(name));
	result.checksums.ok = result.checksums.missingBinaryAssets.length === 0;
	if (!result.checksums.ok) {
		result.problems.push(
			`checksum manifest is missing binary entries: ${result.checksums.missingBinaryAssets.join(", ")}`,
		);
	}
}

async function verifyReleaseNotes({ result, version, assetMap, fetchImplementation }) {
	const notesAsset = assetMap.get(`release-notes-${version}.md`);
	if (!notesAsset?.browser_download_url) {
		return;
	}
	const notesText = await fetchText(notesAsset.browser_download_url, fetchImplementation);
	const expectations = buildReleaseNotesExpectations({
		version,
		binaryAssets: expectedBinaryAssets(version),
	});
	result.releaseNotes.missingExpectations = expectations.filter((fragment) => !notesText.includes(fragment));
	result.releaseNotes.ok = result.releaseNotes.missingExpectations.length === 0;
	if (!result.releaseNotes.ok) {
		result.problems.push(
			`release notes are missing expected fragments: ${result.releaseNotes.missingExpectations.join(" | ")}`,
		);
	}
}

async function verifyReleaseFormulaAsset({ result, version, repo, assetMap, archiveSha256, fetchImplementation }) {
	const formulaAsset = assetMap.get(DEFAULT_RELEASE_FORMULA_ASSET);
	if (!formulaAsset?.browser_download_url || !archiveSha256) {
		return;
	}
	const formulaText = await fetchText(formulaAsset.browser_download_url, fetchImplementation);
	const expectedFormula = renderHomebrewFormula({ version, repo, sha256: archiveSha256 });
	result.formulaAsset.matchesRenderedFormula =
		normalizeContent(formulaText) === normalizeContent(expectedFormula);
	result.formulaAsset.ok = result.formulaAsset.matchesRenderedFormula;
	if (!result.formulaAsset.ok) {
		result.problems.push("release formula asset does not match the rendered Homebrew formula");
	}
}

async function verifyTapFormula({ result, version, repo, tapRepo, archiveSha256, fetchImplementation }) {
	if (!result.tapFormula.checked) {
		return;
	}
	const tapContents = await fetchJson(
		`https://api.github.com/repos/${tapRepo}/contents/${DEFAULT_TAP_FORMULA_PATH}`,
		fetchImplementation,
	);
	const tapFormula = decodeGitHubContents(tapContents);
	const expectedFormula = renderHomebrewFormula({ version, repo, sha256: archiveSha256 });
	result.tapFormula.ok = normalizeContent(tapFormula) === normalizeContent(expectedFormula);
	if (!result.tapFormula.ok) {
		result.problems.push(`tap formula is not updated at ${tapRepo}/${DEFAULT_TAP_FORMULA_PATH}`);
	}
}

export async function verifyPublicRelease(
	{ version, repo, tapRepo, checkTap = true },
	{ fetchImplementation = fetch } = {},
) {
	const result = createResult({ version, repo, tapRepo, checkTap });
	const release = await fetchJson(
		`https://api.github.com/repos/${repo}/releases/tags/${version}`,
		fetchImplementation,
	);
	applyReleaseMetadata(result, release);
	const assetMap = collectReleaseAssets(result, release);
	const archiveSha256 = await readArchiveChecksum({ result, version, assetMap, fetchImplementation });
	await verifyChecksumManifest({ result, version, assetMap, fetchImplementation });
	await verifyReleaseNotes({ result, version, assetMap, fetchImplementation });
	await verifyReleaseFormulaAsset({ result, version, repo, assetMap, archiveSha256, fetchImplementation });
	await verifyTapFormula({ result, version, repo, tapRepo, archiveSha256, fetchImplementation });
	result.ok = result.problems.length === 0;
	return result;
}

async function runVerificationAttempt({ version, repo, tapRepo, checkTap, fetchImplementation, attempt }) {
	const result = await verifyPublicRelease(
		{ version, repo, tapRepo, checkTap },
		{ fetchImplementation },
	);
	return {
		...result,
		attemptsUsed: attempt,
	};
}

function shouldReturnRetryResult(result, attempt, retryAttempts) {
	return result.ok || attempt === retryAttempts;
}

async function waitForRetryDelay(retryDelayMs, sleepImplementation) {
	if (retryDelayMs > 0) {
		await sleepImplementation(retryDelayMs);
	}
}

async function retryPublicReleaseVerification(
	{ version, repo, tapRepo, checkTap, retryAttempts, retryDelayMs, fetchImplementation, sleepImplementation },
	attempt = 1,
) {
	try {
		const result = await runVerificationAttempt({
			version,
			repo,
			tapRepo,
			checkTap,
			fetchImplementation,
			attempt,
		});
		if (shouldReturnRetryResult(result, attempt, retryAttempts)) {
			return result;
		}
	} catch (error) {
		if (attempt === retryAttempts) {
			throw error;
		}
	}
	await waitForRetryDelay(retryDelayMs, sleepImplementation);
	return retryPublicReleaseVerification(
		{ version, repo, tapRepo, checkTap, retryAttempts, retryDelayMs, fetchImplementation, sleepImplementation },
		attempt + 1,
	);
}

export async function verifyPublicReleaseWithRetry(
	{ version, repo, tapRepo, checkTap = true, retryAttempts = 1, retryDelayMs = 0 },
	{ fetchImplementation = fetch, sleepImplementation = sleep } = {},
) {
	return retryPublicReleaseVerification({
		version,
		repo,
		tapRepo,
		checkTap,
		retryAttempts,
		retryDelayMs,
		fetchImplementation,
		sleepImplementation,
	});
}

export async function main(argv = process.argv.slice(2)) {
	try {
		const options = parseArgs(argv);
		const result = await verifyPublicReleaseWithRetry(options);
		if (options.json) {
			process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
		} else {
			process.stdout.write(summarizeText(result));
		}
		if (!result.ok) {
			process.exit(1);
		}
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	await main();
}
