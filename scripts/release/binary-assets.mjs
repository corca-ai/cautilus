import process from "node:process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const RELEASE_TARGETS = [
	{ goos: "darwin", goarch: "amd64", assetOs: "darwin", assetArch: "x64" },
	{ goos: "darwin", goarch: "arm64", assetOs: "darwin", assetArch: "arm64" },
	{ goos: "linux", goarch: "amd64", assetOs: "linux", assetArch: "x64" },
	{ goos: "linux", goarch: "arm64", assetOs: "linux", assetArch: "arm64" },
];

function normalizeVersion(version) {
	return String(version || "").trim().replace(/^v/, "");
}

function findReleaseTarget({ goos, goarch }) {
	return RELEASE_TARGETS.find((target) => target.goos === goos && target.goarch === goarch) ?? null;
}

export function listReleaseTargets() {
	return RELEASE_TARGETS.map((target) => ({ ...target }));
}

export function binaryAssetName({ version, goos, goarch }) {
	const target = findReleaseTarget({ goos, goarch });
	if (!target) {
		throw new Error(`Unsupported release target: ${goos}/${goarch}`);
	}
	return `cautilus_${normalizeVersion(version)}_${target.assetOs}_${target.assetArch}.tar.gz`;
}

export function renderBinaryAssetUrl({ repo, version, goos, goarch }) {
	return `https://github.com/${repo}/releases/download/${version}/${binaryAssetName({ version, goos, goarch })}`;
}

export function main() {
	process.stdout.write(`${JSON.stringify(listReleaseTargets(), null, 2)}\n`);
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
