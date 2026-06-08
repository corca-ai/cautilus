import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";

export const CODEX_HOME_MODES = ["inherit", "isolated"];
export const CODEX_AUTH_MODES = ["inherit", "env", "none"];

function pushOptionalPair(args, flag, value) {
	if (value) {
		args.push(flag, value);
	}
}

export function codexArgs(options, schemaFile, outputFile) {
	const args = [
		"exec",
		"-C",
		options.workspace,
		"--sandbox",
		options.sandbox,
	];
	if ((options.codexSessionMode ?? "ephemeral") === "ephemeral") {
		args.push("--ephemeral");
	}
	args.push("--output-schema", schemaFile, "-o", outputFile);
	pushOptionalPair(args, "--model", options.codexModel ?? options.model);
	const effort = options.codexReasoningEffort ?? options.reasoningEffort;
	if (effort) {
		args.push("-c", `model_reasoning_effort="${effort}"`);
	}
	for (const override of options.codexConfigOverrides ?? []) {
		args.push("-c", override);
	}
	args.push("-");
	return args;
}

function codexSourceHome(env = process.env) {
	return env.CODEX_HOME ? resolve(env.CODEX_HOME) : join(homedir(), ".codex");
}

function hasEnvCodexAuth(env = process.env) {
	return Boolean(env.OPENAI_API_KEY);
}

function codexAuthMissingMessage(authMode, sourceHome) {
	if (authMode === "env") {
		return "The codex_exec runner cannot authenticate: --codex-auth-mode env was selected but OPENAI_API_KEY is not set.";
	}
	return `The codex_exec runner cannot authenticate: isolated CODEX_HOME could not inherit ${sourceHome}/auth.json and OPENAI_API_KEY is not set.`;
}

function isolatedCodexHome() {
	const path = mkdtempSync(join(tmpdir(), "cautilus-codex-home-"));
	mkdirSync(path, { recursive: true });
	return path;
}

// Reflect the real installed plugin/skill surface (e.g. charness) inside the
// isolated CODEX_HOME so the agent under test has the skills the repo treats as
// installed. General by design: it mirrors whatever is installed in the source
// home and enabled in its config, not a per-skill (find-skills) special case.
// State (history, memories, logs) stays isolated; only the skill surface and its
// plugin enablement carry over.
function provisionInstalledSkillSurface(sourceHome, codexHome) {
	const sourcePlugins = join(sourceHome, "plugins");
	if (existsSync(sourcePlugins)) {
		try {
			symlinkSync(sourcePlugins, join(codexHome, "plugins"));
		} catch {
			// best-effort: a missing or unlinkable plugin surface must not block the eval
		}
	}
	const sourceConfig = join(sourceHome, "config.toml");
	if (existsSync(sourceConfig)) {
		copyFileSync(sourceConfig, join(codexHome, "config.toml"));
	}
}

function withPreflightBlocker(env, cleanup, blockerKind, summary) {
	return {
		env,
		cleanup,
		preflightBlocker: { blockerKind, summary },
	};
}

export function prepareCodexRuntimeEnv(options, baseEnv = process.env) {
	const authMode = options.codexAuthMode ?? "inherit";
	if ((options.codexHomeMode ?? "inherit") === "inherit") {
		if (authMode === "env" && !hasEnvCodexAuth(baseEnv)) {
			return withPreflightBlocker(baseEnv, null, "runner_auth_missing", codexAuthMissingMessage(authMode, codexSourceHome(baseEnv)));
		}
		return { env: baseEnv, preflightBlocker: null, cleanup: null };
	}

	const sourceHome = codexSourceHome(baseEnv);
	const codexHome = isolatedCodexHome();
	const cleanup = () => rmSync(codexHome, { recursive: true, force: true });
	const env = { ...baseEnv, CODEX_HOME: codexHome };
	provisionInstalledSkillSurface(sourceHome, codexHome);
	if (authMode === "inherit") {
		const sourceAuthFile = join(sourceHome, "auth.json");
		if (existsSync(sourceAuthFile)) {
			copyFileSync(sourceAuthFile, join(codexHome, "auth.json"));
		} else if (!hasEnvCodexAuth(baseEnv)) {
			return withPreflightBlocker(env, cleanup, "runner_auth_missing", codexAuthMissingMessage(authMode, sourceHome));
		}
	}
	if (authMode === "env" && !hasEnvCodexAuth(baseEnv)) {
		return withPreflightBlocker(env, cleanup, "runner_auth_missing", codexAuthMissingMessage(authMode, sourceHome));
	}
	return { env, preflightBlocker: null, cleanup };
}

export function codexFailureBlockerKind(stderr = "") {
	const text = String(stderr).toLowerCase();
	const authFailure = [
		"401 unauthorized",
		"missing bearer or basic authentication",
		"not authenticated",
		"authentication error",
		"login required",
	].some((pattern) => text.includes(pattern));
	return authFailure ? "runner_auth_missing" : "runner_execution_failed";
}
