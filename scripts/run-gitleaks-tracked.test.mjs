import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const WRAPPER = resolve(process.cwd(), "scripts/run-gitleaks-tracked.mjs");

function writeExecutable(path, source) {
	writeFileSync(path, source);
	chmodSync(path, 0o755);
}

test("tracked gitleaks wrapper scans a temporary copy of tracked files", () => {
	const root = mkdtempSync(join(tmpdir(), "cautilus-gitleaks-wrapper-repo-"));
	const fakeBin = mkdtempSync(join(tmpdir(), "cautilus-gitleaks-wrapper-bin-"));
	const recordPath = join(root, "record.json");
	try {
		writeFileSync(join(root, "tracked.txt"), "tracked\n");
		writeFileSync(join(root, "ignored.txt"), "ignored\n");
		writeFileSync(join(root, "target.txt"), "target\n");
		symlinkSync("target.txt", join(root, "tracked-link"));

		writeExecutable(
			join(fakeBin, "git"),
			`#!/usr/bin/env node
if (process.argv.slice(2).join(" ") !== "ls-files -z") process.exit(2);
process.stdout.write(process.env.FAKE_TRACKED.split("\\n").join("\\0") + "\\0");
`,
		);
		writeExecutable(
			join(fakeBin, "gitleaks"),
			`#!/usr/bin/env node
import { existsSync, lstatSync, readlinkSync, readFileSync, writeFileSync } from "node:fs";
const record = {
  cwd: process.cwd(),
  args: process.argv.slice(2),
  tracked: existsSync("tracked.txt") ? readFileSync("tracked.txt", "utf8") : null,
  ignoredExists: existsSync("ignored.txt"),
  symlinkTarget: lstatSync("tracked-link").isSymbolicLink() ? readlinkSync("tracked-link") : null,
};
writeFileSync(process.env.FAKE_GITLEAKS_RECORD, JSON.stringify(record, null, 2));
`,
		);

		const result = spawnSync(process.execPath, [WRAPPER, "--report-format", "json"], {
			cwd: root,
			encoding: "utf-8",
			env: {
				...process.env,
				FAKE_GITLEAKS_RECORD: recordPath,
				FAKE_TRACKED: ["tracked.txt", "missing.txt", "tracked-link"].join("\n"),
				PATH: `${fakeBin}${delimiter}${process.env.PATH}`,
			},
		});
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stderr, /gitleaks tracked scan: 2 tracked file\(s\)/);

		const record = JSON.parse(readFileSync(recordPath, "utf-8"));
		assert.notEqual(record.cwd, root);
		assert.deepEqual(record.args, ["dir", ".", "--no-banner", "--redact", "--report-format", "json"]);
		assert.equal(record.tracked, "tracked\n");
		assert.equal(record.ignoredExists, false);
		assert.equal(record.symlinkTarget, "target.txt");
		assert.equal(existsSync(record.cwd), false);
	} finally {
		rmSync(root, { recursive: true, force: true });
		rmSync(fakeBin, { recursive: true, force: true });
	}
});
