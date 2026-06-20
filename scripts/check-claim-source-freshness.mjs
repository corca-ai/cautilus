import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const DEFAULT_PACKET = ".cautilus/claims/latest.json";

function sha256(buffer) {
	return `sha256:${createHash("sha256").update(buffer).digest("hex")}`;
}

// The claim packet records, per scanned source, the sha256 of its content at discovery time
// (sourceInventory[].contentHash). Comparing that against the file on disk catches a claim-source
// edit that has not been folded into the packet yet -- including working-tree edits the committed-diff
// staleness gate (claims:evidence-state:check) cannot see in the authoring slice.
export function findStaleClaimSources({ repoRoot = process.cwd(), packetPath = DEFAULT_PACKET } = {}) {
	const root = resolve(repoRoot);
	const packetAbs = resolve(root, packetPath);
	let packet;
	try {
		packet = JSON.parse(readFileSync(packetAbs, "utf-8"));
	} catch (error) {
		throw new Error(`claim packet ${packetPath} is not readable JSON: ${error.message}`);
	}
	const inventory = Array.isArray(packet.sourceInventory) ? packet.sourceInventory : [];
	const changed = [];
	const missing = [];
	let comparedSourceCount = 0;
	for (const entry of inventory) {
		if (!entry || typeof entry.path !== "string" || typeof entry.contentHash !== "string") {
			continue;
		}
		comparedSourceCount += 1;
		const fileAbs = resolve(root, entry.path);
		if (!existsSync(fileAbs)) {
			missing.push(entry.path);
			continue;
		}
		if (sha256(readFileSync(fileAbs)) !== entry.contentHash) {
			changed.push(entry.path);
		}
	}
	return {
		changed: changed.sort(),
		missing: missing.sort(),
		comparedSourceCount,
		inventorySize: inventory.length,
	};
}

function renderStaleMessage(result) {
	const lines = ["Claim source freshness check failed."];
	if (result.changed.length > 0) {
		lines.push(`Edited since the claim packet was discovered: ${result.changed.join(", ")}`);
	}
	if (result.missing.length > 0) {
		lines.push(`Recorded as a scanned claim source but missing on disk: ${result.missing.join(", ")}`);
	}
	lines.push(
		"",
		"These files are scanned claim sources, so changing them changes the claim packet.",
		"claims:evidence-state:check uses a committed diff and cannot see this in the authoring slice,",
		"so refresh and stage the packet in the same slice before committing:",
		"  npm run claims:refresh:all",
	);
	return lines.join("\n");
}

export function checkClaimSourceFreshness(options = {}) {
	const result = findStaleClaimSources(options);
	if (result.changed.length === 0 && result.missing.length === 0) {
		return { status: "fresh", ...result };
	}
	throw new Error(renderStaleMessage(result));
}

function parseArgs(argv) {
	const options = { repoRoot: process.cwd(), packetPath: DEFAULT_PACKET };
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			return { help: true, options };
		}
		if (arg === "--repo-root") {
			options.repoRoot = argv[index + 1] || "";
			index += 1;
			continue;
		}
		if (arg === "--packet") {
			options.packetPath = argv[index + 1] || "";
			index += 1;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	if (!options.repoRoot || !options.packetPath) {
		throw new Error("--repo-root and --packet require values");
	}
	return { help: false, options };
}

export function main(argv = process.argv.slice(2)) {
	let parsed;
	try {
		parsed = parseArgs(argv);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(2);
		return;
	}
	if (parsed.help) {
		process.stdout.write(
			[
				"Usage: node scripts/check-claim-source-freshness.mjs [--repo-root <dir>] [--packet <latest.json>]",
				"",
				"Fails if any scanned claim source's on-disk content no longer matches the claim packet's",
				"recorded contentHash, so a claim-source edit forces npm run claims:refresh:all in the same slice.",
			].join("\n") + "\n",
		);
		return;
	}
	try {
		const result = checkClaimSourceFreshness(parsed.options);
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
