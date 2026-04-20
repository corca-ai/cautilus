import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const DEFAULT_CAUTILUS_BIN = resolve(REPO_ROOT, "bin", "cautilus");

export function resolveCautilusBin() {
	return process.env.CAUTILUS_CLI_SHIM_BIN || DEFAULT_CAUTILUS_BIN;
}

export function runCautilusShim(commandPath, argv = process.argv.slice(2)) {
	const result = spawnSync(resolveCautilusBin(), [...commandPath, ...argv], {
		cwd: process.cwd(),
		env: process.env,
		stdio: "inherit",
	});
	if (result.error) {
		process.stderr.write(`${result.error.message}\n`);
		return 1;
	}
	if (typeof result.status === "number") {
		return result.status;
	}
	return 1;
}

export function main(commandPath, argv = process.argv.slice(2)) {
	process.exit(runCautilusShim(commandPath, argv));
}
