import { execFileSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const DEFAULT_SOURCE_REPO = "corca-ai/cautilus";

export function parseGitHubRemoteUrl(remoteUrl) {
	const value = String(remoteUrl || "").trim();
	if (!value) {
		return null;
	}
	const httpsMatch = value.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
	if (httpsMatch) {
		return { owner: httpsMatch[1], repo: httpsMatch[2] };
	}
	const sshMatch = value.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);
	if (sshMatch) {
		return { owner: sshMatch[1], repo: sshMatch[2] };
	}
	return null;
}

export function readOriginRemoteUrl({ cwd = process.cwd() } = {}) {
	try {
		return execFileSync("git", ["config", "--get", "remote.origin.url"], {
			cwd,
			encoding: "utf-8",
		}).trim();
	} catch {
		return "";
	}
}

export function resolveReleaseTargets({ cwd = process.cwd(), remoteUrl = readOriginRemoteUrl({ cwd }) } = {}) {
	const parsed = parseGitHubRemoteUrl(remoteUrl);
	const sourceRepo = parsed ? `${parsed.owner}/${parsed.repo}` : DEFAULT_SOURCE_REPO;
	return {
		sourceRepo,
	};
}

export function main() {
	process.stdout.write(`${JSON.stringify(resolveReleaseTargets(), null, 2)}\n`);
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main();
}
