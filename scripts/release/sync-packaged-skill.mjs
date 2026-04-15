import {
	cpSync,
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

// Inline markdown link pattern: matches [text](path) and ![alt](path).
// The capture groups split the link into the opening `](`, the upward
// `../` segments, the rest of the path, and the closing `)` so we can
// prepend extra `../` segments without touching anything else.
const UPWARD_LINK = /(\]\()(\.\.(?:\/\.\.)*\/)([^)\s]+)(\))/g;

// skills/cautilus/references/ is 3 levels deep under the repo root.
// plugins/cautilus/skills/cautilus/references/ is 5. An upward link
// that resolved to `<repo>/<target>` from the source tree needs two
// extra `../` segments to still resolve to the same target from the
// packaged tree.
const PACKAGED_DEPTH_OFFSET = "../../";

export function rewriteUpwardLinks(content) {
	return content.replace(UPWARD_LINK, (_, open, ups, rest, close) => {
		return `${open}${PACKAGED_DEPTH_OFFSET}${ups}${rest}${close}`;
	});
}

function walkMarkdownFiles(dir) {
	const out = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			out.push(...walkMarkdownFiles(path));
		} else if (entry.isFile() && entry.name.endsWith(".md")) {
			out.push(path);
		}
	}
	return out;
}

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

	for (const file of walkMarkdownFiles(resolvedDestination)) {
		const raw = readFileSync(file, "utf-8");
		const rewritten = rewriteUpwardLinks(raw);
		if (rewritten !== raw) {
			writeFileSync(file, rewritten);
		}
	}

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
