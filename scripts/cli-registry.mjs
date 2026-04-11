import { readFileSync } from "node:fs";
import { join } from "node:path";

export function loadCommandRegistry(repoRoot) {
	return JSON.parse(readFileSync(join(repoRoot, "internal", "cli", "command-registry.json"), "utf-8"));
}

export function matchCommand(commands, args) {
	let bestMatch = null;
	for (const command of commands) {
		if (args.length < command.path.length) {
			continue;
		}
		const matches = command.path.every((segment, index) => args[index] === segment);
		if (!matches) {
			continue;
		}
		if (!bestMatch || command.path.length > bestMatch.path.length) {
			bestMatch = command;
		}
	}
	if (!bestMatch) {
		return null;
	}
	return {
		command: bestMatch,
		forwardedArgs: args.slice(bestMatch.path.length),
	};
}

export function renderUsage(registry) {
	return [
		"Usage:",
		...registry.usage.map((line) => `  ${line}`),
		"",
		"Examples:",
		...registry.examples.map((line) => `  ${line}`),
	].join("\n");
}
