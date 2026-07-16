import {
	cpSync,
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

// Inline markdown link pattern: matches [text](path) and ![alt](path).
// The capture groups split the link into the opening `](`, the upward
// `../` segments, the rest of the path, and the closing `)` so we can
// prepend extra `../` segments without touching anything else.
const UPWARD_LINK = /(\]\()(\.\.(?:\/\.\.)*\/)([^)\s]+)(\))/g;

// skills/cautilus-agent/references/ is 3 levels deep under the repo root.
// plugins/cautilus/skills/cautilus-agent/references/ is 5. An upward link
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

// Walk every file (not only markdown) under `dir`, returning repo-relative
// paths against `base`. The parity check compares the full copied file set,
// because syncPackagedSkill mirrors the whole source tree, not just `.md`.
function walkRelativeFiles(dir, base = dir) {
	const out = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			out.push(...walkRelativeFiles(path, base));
		} else if (entry.isFile()) {
			out.push(relative(base, path));
		}
	}
	return out;
}

// The exact transform syncPackagedSkill applies to a copied file: markdown
// gets its upward links re-based; everything else is copied byte-for-byte.
export function expectedPackagedContent(relativePath, sourceContent) {
	return relativePath.endsWith(".md") ? rewriteUpwardLinks(sourceContent) : sourceContent;
}

export function syncPackagedSkill({
	repoRoot,
	sourceDir = join(repoRoot, "skills", "cautilus-agent"),
	destinationDir = join(repoRoot, "plugins", "cautilus", "skills", "cautilus-agent"),
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

// Report whether the committed packaged tree is byte-identical to a fresh sync
// of the source tree, without writing anything. `syncPackagedSkill` clears the
// destination and re-copies, so the expected mirror is exactly the source file
// set with `expectedPackagedContent` applied per file — any drifted, missing,
// or extra file means the mirror would change on the next sync.
function resolveSkillDirs({ repoRoot, sourceDir, destinationDir }) {
	const source = sourceDir ?? (repoRoot ? join(repoRoot, "skills", "cautilus-agent") : undefined);
	const destination =
		destinationDir ??
		(repoRoot ? join(repoRoot, "plugins", "cautilus", "skills", "cautilus-agent") : undefined);
	if (!source || !destination) {
		throw new Error("repoRoot is required (or pass both sourceDir and destinationDir)");
	}
	return { source: resolve(source), destination: resolve(destination) };
}

export function checkPackagedSkillInSync(options = {}) {
	const { source: resolvedSource, destination: resolvedDestination } = resolveSkillDirs(options);
	if (!existsSync(resolvedSource)) {
		throw new Error(`Bundled skill source not found: ${resolvedSource}`);
	}

	const sourceFiles = walkRelativeFiles(resolvedSource);
	const destinationFiles = existsSync(resolvedDestination)
		? walkRelativeFiles(resolvedDestination)
		: [];
	const sourceSet = new Set(sourceFiles);
	const destinationSet = new Set(destinationFiles);

	const missing = [];
	const drifted = [];
	for (const relativePath of sourceFiles) {
		if (!destinationSet.has(relativePath)) {
			missing.push(relativePath);
			continue;
		}
		const expected = expectedPackagedContent(
			relativePath,
			readFileSync(join(resolvedSource, relativePath), "utf-8"),
		);
		const actual = readFileSync(join(resolvedDestination, relativePath), "utf-8");
		if (actual !== expected) {
			drifted.push(relativePath);
		}
	}
	const extra = destinationFiles.filter((relativePath) => !sourceSet.has(relativePath));

	missing.sort();
	drifted.sort();
	extra.sort();

	return {
		sourceDir: resolvedSource,
		destinationDir: resolvedDestination,
		inSync: missing.length === 0 && drifted.length === 0 && extra.length === 0,
		missing,
		drifted,
		extra,
	};
}

export function main(argv = process.argv.slice(2), { stdout = process.stdout, stderr = process.stderr } = {}) {
	const check = argv.includes("--check");
	const positional = argv.filter((arg) => !arg.startsWith("--"));
	const repoRoot = resolve(positional[0] || process.cwd());

	if (check) {
		const result = checkPackagedSkillInSync({ repoRoot });
		if (!result.inSync) {
			stderr.write(
				"sync-packaged-skill: packaged mirror is out of sync with source; run npm run skills:sync-packaged\n",
			);
			for (const relativePath of result.drifted) {
				stderr.write(`- drifted: ${relativePath}\n`);
			}
			for (const relativePath of result.missing) {
				stderr.write(`- missing in package: ${relativePath}\n`);
			}
			for (const relativePath of result.extra) {
				stderr.write(`- extra in package: ${relativePath}\n`);
			}
			return 1;
		}
		stdout.write(`${JSON.stringify({ status: "in-sync", ...result }, null, 2)}\n`);
		return 0;
	}

	const result = syncPackagedSkill({ repoRoot });
	stdout.write(`${JSON.stringify(result, null, 2)}\n`);
	return 0;
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	process.exitCode = main();
}
