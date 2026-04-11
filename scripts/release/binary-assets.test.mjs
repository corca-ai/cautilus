import assert from "node:assert/strict";
import test from "node:test";

import { binaryAssetName, listReleaseTargets, renderBinaryAssetUrl } from "./binary-assets.mjs";

test("release target list stays stable for the supported public binary matrix", () => {
	assert.deepEqual(listReleaseTargets(), [
		{ goos: "darwin", goarch: "amd64", assetOs: "darwin", assetArch: "x64" },
		{ goos: "darwin", goarch: "arm64", assetOs: "darwin", assetArch: "arm64" },
		{ goos: "linux", goarch: "amd64", assetOs: "linux", assetArch: "x64" },
		{ goos: "linux", goarch: "arm64", assetOs: "linux", assetArch: "arm64" },
	]);
});

test("binaryAssetName renders the public release asset name", () => {
	assert.equal(
		binaryAssetName({ version: "v0.2.0", goos: "linux", goarch: "amd64" }),
		"cautilus_0.2.0_linux_x64.tar.gz",
	);
	assert.equal(
		binaryAssetName({ version: "0.2.0", goos: "darwin", goarch: "arm64" }),
		"cautilus_0.2.0_darwin_arm64.tar.gz",
	);
});

test("renderBinaryAssetUrl targets tagged GitHub release assets", () => {
	assert.equal(
		renderBinaryAssetUrl({ repo: "corca-ai/cautilus", version: "v0.2.0", goos: "linux", goarch: "amd64" }),
		"https://github.com/corca-ai/cautilus/releases/download/v0.2.0/cautilus_0.2.0_linux_x64.tar.gz",
	);
});
