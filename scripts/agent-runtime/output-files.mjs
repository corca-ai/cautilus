import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function writeTextOutput(path, text, encoding = "utf-8") {
	const outputPath = resolve(path);
	mkdirSync(dirname(outputPath), { recursive: true });
	writeFileSync(outputPath, text, encoding);
}

export function writeJsonOutput(path, value) {
	writeTextOutput(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}
