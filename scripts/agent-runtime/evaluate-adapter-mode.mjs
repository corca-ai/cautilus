export { ADAPTER_MODE_EVALUATION_PACKET_SCHEMA } from "./contract-versions.mjs";

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { main } from "./cautilus-cli-shim.mjs";

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	main(["mode", "evaluate"]);
}
