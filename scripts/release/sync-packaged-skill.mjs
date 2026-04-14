import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

export function syncPackagedSkill({
	repoRoot,
	sourceDir = join(repoRoot, "skills", "cautilus"),
	destinationDir = join(repoRoot, "plugins", "cautilus", "skills", "cautilus"),
} = {}) {
	if (!repoRoot) {
		throw new Error("repoRoot is required");
	}
	const resolvedSource = resolve(sourceDir);
	const resolvedDestination = resolve(destinationDir);
	if (!existsSync(resolvedSource)) {
		throw new Error(`Bundled skill source not found: ${resolvedSource}`);
	}
	mkdirSync(dirname(resolvedDestination), { recursive: true });
	rmSync(resolvedDestination, { recursive: true, force: true });
	cpSync(resolvedSource, resolvedDestination, { recursive: true });
	return {
		sourceDir: resolvedSource,
		destinationDir: resolvedDestination,
	};
}

export function main(argv = process.argv.slice(2)) {
	const repoRoot = resolve(argv[0] || process.cwd());
	const result = syncPackagedSkill({ repoRoot });
	process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
