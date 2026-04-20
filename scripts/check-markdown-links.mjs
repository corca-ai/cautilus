import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const EXTERNAL_SCHEME = /^(?:https?|mailto|ftp|ftps|file|tel|data):/i;
const INLINE_LINK = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

export function stripFencedCodeBlocks(content) {
	const lines = content.split("\n");
	let inFence = false;
	return lines
		.map((line) => {
			if (/^\s{0,3}```/.test(line)) {
				inFence = !inFence;
				return "";
			}
			return inFence ? "" : line;
		})
		.join("\n");
}

function lineNumberAt(content, index) {
	let line = 1;
	for (let cursor = 0; cursor < index; cursor += 1) {
		if (content.charCodeAt(cursor) === 10) {
			line += 1;
		}
	}
	return line;
}

function isSkippable(target) {
	if (target.length === 0) return true;
	if (target.startsWith("#")) return true;
	return EXTERNAL_SCHEME.test(target);
}

function escapesRepoRoot(repoRoot, resolvedTarget) {
	const rel = relative(repoRoot, resolvedTarget);
	return rel === ".." || rel.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`);
}

export function findBrokenLinksInFile(absoluteMdPath, content, repoRoot = null) {
	const scrubbed = stripFencedCodeBlocks(content);
	const broken = [];
	for (const match of scrubbed.matchAll(INLINE_LINK)) {
		const target = match[1];
		if (isSkippable(target)) continue;
		const withoutFragment = target.split("#")[0];
		if (withoutFragment.length === 0) continue;
		const resolved = resolve(dirname(absoluteMdPath), withoutFragment);
		if (repoRoot && escapesRepoRoot(repoRoot, resolved)) {
			broken.push({
				target,
				line: lineNumberAt(scrubbed, match.index),
				reason: "outside_repo",
			});
			continue;
		}
		if (!existsSync(resolved)) {
			broken.push({
				target,
				line: lineNumberAt(scrubbed, match.index),
				reason: "missing",
			});
		}
	}
	return broken;
}

function listCheckedInMarkdown(repoRoot) {
	const result = spawnSync("git", ["-C", repoRoot, "ls-files", "-z", "*.md"], {
		encoding: "buffer",
	});
	if (result.status !== 0) {
		const stderr = result.stderr?.toString("utf-8") ?? "";
		throw new Error(`git ls-files failed: ${stderr.trim()}`);
	}
	return result.stdout
		.toString("utf-8")
		.split("\0")
		.filter((entry) => entry.length > 0);
}

export function checkRepo(repoRoot) {
	const files = listCheckedInMarkdown(repoRoot);
	const findings = [];
	for (const relative of files) {
		const absolute = resolve(repoRoot, relative);
		if (!existsSync(absolute)) continue;
		const content = readFileSync(absolute, "utf-8");
		for (const { target, line, reason } of findBrokenLinksInFile(absolute, content, repoRoot)) {
			findings.push({ file: relative, line, target, reason });
		}
	}
	return {
		fileCount: files.length,
		findings,
	};
}

function main() {
	const repoRoot = process.cwd();
	const { fileCount, findings } = checkRepo(repoRoot);
	if (findings.length > 0) {
		process.stderr.write(
			`check-markdown-links: ${findings.length} broken link(s) across ${fileCount} file(s)\n`,
		);
		for (const { file, line, target, reason } of findings) {
			const suffix = reason === "outside_repo" ? " [outside repo root]" : "";
			process.stderr.write(`  ${file}:${line} -> ${target}${suffix}\n`);
		}
		process.exit(1);
	}
	process.stdout.write(
		`check-markdown-links: ok (${fileCount} file(s) checked, local links only)\n`,
	);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
