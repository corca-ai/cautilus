import assert from "node:assert/strict";
import test from "node:test";

import {
	expectedBinaryAssets,
	expectedReleaseAssets,
	verifyPublicRelease,
	verifyPublicReleaseWithRetry,
} from "./verify-public-release.mjs";

function jsonResponse(payload) {
	return {
		ok: true,
		status: 200,
		statusText: "OK",
		async json() {
			return payload;
		},
		async text() {
			return JSON.stringify(payload);
		},
	};
}

function textResponse(payload) {
	return {
		ok: true,
		status: 200,
		statusText: "OK",
		async json() {
			throw new Error("not json");
		},
		async text() {
			return payload;
		},
	};
}

function createFetchStub(urlMap) {
	return async function fetchStub(url) {
		const response = urlMap.get(url);
		if (!response) {
			return {
				ok: false,
				status: 404,
				statusText: "Not Found",
				async json() {
					return {};
				},
				async text() {
					return "";
				},
			};
		}
		return response;
	};
}

test("expectedReleaseAssets includes the full public release bundle", () => {
	assert.deepEqual(expectedBinaryAssets("v1.2.3"), [
		"cautilus_1.2.3_darwin_x64.tar.gz",
		"cautilus_1.2.3_darwin_arm64.tar.gz",
		"cautilus_1.2.3_linux_x64.tar.gz",
		"cautilus_1.2.3_linux_arm64.tar.gz",
	]);
	assert.deepEqual(expectedReleaseAssets("v1.2.3"), [
		"cautilus-v1.2.3.sha256",
		"cautilus_1.2.3_darwin_x64.tar.gz",
		"cautilus_1.2.3_darwin_arm64.tar.gz",
		"cautilus_1.2.3_linux_x64.tar.gz",
		"cautilus_1.2.3_linux_arm64.tar.gz",
		"cautilus-v1.2.3-checksums.txt",
		"release-notes-v1.2.3.md",
	]);
});

test("verifyPublicRelease validates the public release surface", async () => {
	const version = "v1.2.3";
	const repo = "corca-ai/cautilus";
	const sha256 = "a".repeat(64);
	const binaryAssets = expectedBinaryAssets(version);
	const releaseAssetNames = expectedReleaseAssets(version);
	const releaseUrl = "https://github.com/corca-ai/cautilus/releases/tag/v1.2.3";
	const releaseAssets = releaseAssetNames.map((name) => ({
		name,
		browser_download_url: `https://downloads.example/${name}`,
	}));
	const notes = [
		`# Cautilus ${version}`,
		"",
		`- source archive checksum: \`${sha256}\``,
		"- binary artifacts:",
		...binaryAssets.map((asset) => `  - \`${asset}\``),
		`- binary checksum manifest: \`cautilus-${version}-checksums.txt\``,
	].join("\n");
	const checksums = binaryAssets
		.map((asset, index) => `${String(index + 1).repeat(64)}  dist/${asset}`)
		.join("\n");
	const fetchMap = new Map([
		[
			`https://api.github.com/repos/${repo}/releases/tags/${version}`,
			jsonResponse({
				html_url: releaseUrl,
				draft: false,
				prerelease: false,
				assets: releaseAssets,
			}),
		],
		[`https://downloads.example/cautilus-${version}.sha256`, textResponse(`${sha256}\n`)],
		[
			`https://downloads.example/cautilus-${version}-checksums.txt`,
			textResponse(`${checksums}\n`),
		],
		[`https://downloads.example/release-notes-${version}.md`, textResponse(notes)],
	]);

	const result = await verifyPublicRelease(
		{ version, repo },
		{ fetchImplementation: createFetchStub(fetchMap) },
	);

	assert.equal(result.ok, true);
	assert.equal(result.releaseUrl, releaseUrl);
	assert.deepEqual(result.assets.missing, []);
	assert.equal(result.checksums.ok, true);
	assert.equal(result.releaseNotes.ok, true);
});

test("verifyPublicRelease reports missing assets", async () => {
	const version = "v2.0.0";
	const repo = "corca-ai/cautilus";
	const sha256 = "b".repeat(64);
	const binaryAssets = expectedBinaryAssets(version);
	const releaseAssets = [
		{
			name: `cautilus-${version}.sha256`,
			browser_download_url: `https://downloads.example/cautilus-${version}.sha256`,
		},
		{
			name: `cautilus-${version}-checksums.txt`,
			browser_download_url: `https://downloads.example/cautilus-${version}-checksums.txt`,
		},
	];
	const fetchMap = new Map([
		[
			`https://api.github.com/repos/${repo}/releases/tags/${version}`,
			jsonResponse({
				html_url: "https://example.invalid/release",
				draft: false,
				prerelease: false,
				assets: releaseAssets,
			}),
		],
		[`https://downloads.example/cautilus-${version}.sha256`, textResponse(`${sha256}\n`)],
		[
			`https://downloads.example/cautilus-${version}-checksums.txt`,
			textResponse(`deadbeef  dist/${binaryAssets[0]}\n`),
		],
	]);

	const result = await verifyPublicRelease(
		{ version, repo },
		{ fetchImplementation: createFetchStub(fetchMap) },
	);

	assert.equal(result.ok, false);
	assert.match(result.problems.join("\n"), /missing release assets/);
	assert.match(result.problems.join("\n"), /checksum manifest is missing binary entries/);
});

test("verifyPublicReleaseWithRetry retries transient release visibility gaps until the public surface is ready", async () => {
	const version = "v3.1.0";
	const repo = "corca-ai/cautilus";
	const sha256 = "d".repeat(64);
	const binaryAssets = expectedBinaryAssets(version);
	const releaseAssets = expectedReleaseAssets(version).map((name) => ({
		name,
		browser_download_url: `https://downloads.example/${name}`,
	}));
	const notes = [
		`# Cautilus ${version}`,
		"",
		`- source archive checksum: \`${sha256}\``,
		"- binary artifacts:",
		...binaryAssets.map((asset) => `  - \`${asset}\``),
		`- binary checksum manifest: \`cautilus-${version}-checksums.txt\``,
	].join("\n");
	const checksums = binaryAssets
		.map((asset, index) => `${String(index + 2).repeat(64)}  dist/${asset}`)
		.join("\n");
	const releaseUrl = `https://github.com/${repo}/releases/tag/${version}`;
	const releaseEndpoint = `https://api.github.com/repos/${repo}/releases/tags/${version}`;
	let sleepCalls = 0;
	let releaseFetches = 0;
	const fetchStub = async (url) => {
		if (url === releaseEndpoint) {
			releaseFetches += 1;
			if (releaseFetches === 1) {
				return {
					ok: false,
					status: 404,
					statusText: "Not Found",
					async json() {
						return {};
					},
					async text() {
						return "";
					},
				};
			}
			return jsonResponse({
				html_url: releaseUrl,
				draft: false,
				prerelease: false,
				assets: releaseAssets,
			});
		}
		const fetchMap = new Map([
			[`https://downloads.example/cautilus-${version}.sha256`, textResponse(`${sha256}\n`)],
			[`https://downloads.example/cautilus-${version}-checksums.txt`, textResponse(`${checksums}\n`)],
			[`https://downloads.example/release-notes-${version}.md`, textResponse(notes)],
		]);
		return createFetchStub(fetchMap)(url);
	};

	const result = await verifyPublicReleaseWithRetry(
		{ version, repo, retryAttempts: 3, retryDelayMs: 25 },
		{
			fetchImplementation: fetchStub,
			sleepImplementation: async () => {
				sleepCalls += 1;
			},
		},
	);

	assert.equal(result.ok, true);
	assert.equal(result.attemptsUsed, 2);
	assert.equal(releaseFetches, 2);
	assert.equal(sleepCalls, 1);
});
