import { existsSync, mkdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { createRun } from "./new-workspace-run.mjs";

export const ACTIVE_RUN_ENV_VAR = "CAUTILUS_RUN_DIR";
export const DEFAULT_RUNS_ROOT = ".cautilus/runs";

function ensureExistingDirectory(path, label) {
	if (!existsSync(path)) {
		throw new Error(`${label} does not exist: ${path}`);
	}
	if (!statSync(path).isDirectory()) {
		throw new Error(`${label} must be a directory: ${path}`);
	}
}

export function resolveRunDir({
	outputDir = null,
	root = null,
	label = null,
	env = process.env,
	now = new Date(),
	cwd = process.cwd(),
} = {}) {
	if (outputDir) {
		const resolved = resolve(cwd, outputDir);
		mkdirSync(resolved, { recursive: true });
		return {
			runDir: resolved,
			source: "explicit",
			created: false,
			label: null,
			root: null,
		};
	}

	const fromEnv = env?.[ACTIVE_RUN_ENV_VAR];
	if (fromEnv) {
		const resolved = resolve(cwd, fromEnv);
		ensureExistingDirectory(resolved, ACTIVE_RUN_ENV_VAR);
		return {
			runDir: resolved,
			source: "active",
			created: false,
			label: null,
			root: null,
		};
	}

	const rootPath = resolve(cwd, root ?? DEFAULT_RUNS_ROOT);
	mkdirSync(rootPath, { recursive: true });
	const result = createRun({ root: rootPath, label, now });
	return {
		runDir: result.runDir,
		source: "auto",
		created: true,
		label: result.label,
		root: rootPath,
	};
}
