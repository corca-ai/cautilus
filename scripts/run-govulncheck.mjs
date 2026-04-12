#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const candidates = [];

if (process.platform === "win32") {
	candidates.push("govulncheck.exe");
} else {
	candidates.push("govulncheck");
}

try {
	const goPath = execFileSync("go", ["env", "GOPATH"], {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	}).trim();
	if (goPath) {
		candidates.push(
			path.join(
				goPath,
				"bin",
				process.platform === "win32" ? "govulncheck.exe" : "govulncheck",
			),
		);
	}
} catch {
	// Let candidate lookup fail naturally below if Go is unavailable.
}

for (const candidate of candidates) {
	if (candidate.includes(path.sep) && !existsSync(candidate)) {
		continue;
	}
	const result = spawnSync(candidate, args, { stdio: "inherit" });
	if (result.error && result.error.code === "ENOENT") {
		continue;
	}
	if (typeof result.status === "number") {
		process.exit(result.status);
	}
	process.exit(1);
}

console.error(
	[
		"govulncheck was not found.",
		"Install golang.org/x/vuln/cmd/govulncheck@v1.1.4 and ensure either PATH or $(go env GOPATH)/bin exposes the binary.",
		"Official docs: https://pkg.go.dev/golang.org/x/vuln/cmd/govulncheck",
	].join("\n"),
);
process.exit(1);
