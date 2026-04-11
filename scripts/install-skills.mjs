#!/usr/bin/env node

import {
	copyFileSync,
	existsSync,
	lstatSync,
	mkdirSync,
	readdirSync,
	readlinkSync,
	rmSync,
	renameSync,
	symlinkSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, "..");
const BUNDLED_SKILL_DIR = join(REPO_ROOT, "skills", "cautilus");

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

function migrateLegacyClaudeSkillsDir(repoRoot) {
	const claudeSkills = join(repoRoot, ".claude", "skills");
	const agentsSkills = join(repoRoot, ".agents", "skills");
	if (!existsSync(claudeSkills)) {
		return;
	}
	const info = lstatSync(claudeSkills);
	if (!info.isDirectory() || info.isSymbolicLink()) {
		return;
	}
	if (existsSync(agentsSkills)) {
		rmSync(claudeSkills, { recursive: true, force: true });
		return;
	}
	mkdirSync(join(repoRoot, ".agents"), { recursive: true });
	renameSync(claudeSkills, agentsSkills);
	process.stdout.write(`Migrated ${claudeSkills} -> ${agentsSkills}\n`);
}

function ensureClaudeSkillsSymlink(repoRoot) {
	const claudeSkills = join(repoRoot, ".claude", "skills");
	const relativeTarget = "../.agents/skills";
	if (existsSync(claudeSkills)) {
		try {
			if (readlinkSync(claudeSkills) === relativeTarget) {
				return;
			}
		} catch {
			// Non-symlink or unreadable entry falls through to replacement below.
		}
		rmSync(claudeSkills, { recursive: true, force: true });
	}
	mkdirSync(join(repoRoot, ".claude"), { recursive: true });
	symlinkSync(relativeTarget, claudeSkills);
}

function copyDirectory(sourceDir, destinationDir) {
	for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
		const sourcePath = join(sourceDir, entry.name);
		const destinationPath = join(destinationDir, entry.name);
		if (entry.isDirectory()) {
			mkdirSync(destinationPath, { recursive: true });
			copyDirectory(sourcePath, destinationPath);
			continue;
		}
		copyFileSync(sourcePath, destinationPath);
	}
}

function installBundledSkills(args) {
	const overwrite = args.includes("--overwrite");
	const repoRoot = process.cwd();
	const destinationDir = join(repoRoot, ".agents", "skills", "cautilus");
	const destinationSkill = join(destinationDir, "SKILL.md");

	migrateLegacyClaudeSkillsDir(repoRoot);
	if (existsSync(destinationSkill) && !overwrite) {
		fail(`${destinationSkill} already exists\nhint: use --overwrite to replace existing files`);
	}

	if (overwrite) {
		rmSync(destinationDir, { recursive: true, force: true });
	}
	mkdirSync(destinationDir, { recursive: true });
	copyDirectory(BUNDLED_SKILL_DIR, destinationDir);
	ensureClaudeSkillsSymlink(repoRoot);
	process.stdout.write(`Installed ${destinationDir}\n`);
	process.stdout.write("Installed skill expects `cautilus` to be available on PATH.\n");
}

installBundledSkills(process.argv.slice(2));
