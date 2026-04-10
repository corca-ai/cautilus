import { spawn } from "node:child_process";
import { accessSync, constants } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { createServer } from "node:net";

function usage(exitCode = 0) {
	const text = [
		"Usage:",
		"  node ./scripts/release/check-codex-marketplace.mjs [--repo-root .]",
	].join("\n");
	const out = exitCode === 0 ? process.stdout : process.stderr;
	out.write(`${text}\n`);
	process.exit(exitCode);
}

function readRequiredValue(argv, index, option) {
	const value = argv[index + 1] || "";
	if (!value) {
		throw new Error(`${option} requires a value`);
	}
	return value;
}

function parseArgs(argv) {
	const options = {
		repoRoot: process.cwd(),
	};
	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg === "-h" || arg === "--help") {
			usage(0);
		}
		if (arg === "--repo-root") {
			options.repoRoot = readRequiredValue(argv, index, arg);
			index += 1;
			continue;
		}
		throw new Error(`Unknown argument: ${arg}`);
	}
	return {
		repoRoot: resolve(options.repoRoot),
	};
}

async function reservePort() {
	return await new Promise((resolvePort, reject) => {
		const server = createServer();
		server.on("error", reject);
		server.listen(0, "127.0.0.1", () => {
			const address = server.address();
			if (!address || typeof address === "string") {
				server.close(() => reject(new Error("Failed to reserve a TCP port")));
				return;
			}
			const { port } = address;
			server.close((error) => {
				if (error) {
					reject(error);
					return;
				}
				resolvePort(port);
			});
		});
	});
}

function waitForExit(child) {
	return new Promise((resolveExit) => {
		child.once("exit", (code, signal) => resolveExit({ code, signal }));
	});
}

async function callPluginList({ repoRoot }) {
	const port = await reservePort();
	const listenUrl = `ws://127.0.0.1:${port}`;
	const server = spawn("codex", ["app-server", "--listen", listenUrl], {
		cwd: repoRoot,
		stdio: ["ignore", "pipe", "pipe"],
	});
	let serverLog = "";
	const appendLog = (chunk) => {
		serverLog += chunk.toString();
	};
	server.stdout.on("data", appendLog);
	server.stderr.on("data", appendLog);
	const exitPromise = waitForExit(server);
	try {
		await new Promise((resolveReady, reject) => {
			const timeout = setTimeout(() => reject(new Error("Timed out waiting for codex app-server startup")), 15000);
			const onData = (chunk) => {
				const text = chunk.toString();
				if (text.includes("readyz:")) {
					clearTimeout(timeout);
					server.stdout.off("data", onData);
					server.stderr.off("data", onData);
					resolveReady();
				}
			};
			server.stdout.on("data", onData);
			server.stderr.on("data", onData);
			server.once("error", (error) => {
				clearTimeout(timeout);
				reject(error);
			});
			server.once("exit", (code, signal) => {
				clearTimeout(timeout);
				reject(new Error(`codex app-server exited before ready (code=${code}, signal=${signal})`));
			});
		});
		const response = await new Promise((resolveResponse, reject) => {
			const timeout = setTimeout(() => {
				ws.close();
				reject(new Error("Timed out waiting for plugin/list response"));
			}, 15000);
			const ws = new WebSocket(listenUrl);
			ws.addEventListener("open", () => {
				ws.send(
					JSON.stringify({
						id: "1",
						method: "initialize",
						params: {
							clientInfo: {
								name: "cautilus-marketplace-check",
								title: "cautilus-marketplace-check",
								version: "0.1.0",
							},
							capabilities: {
								experimentalApi: true,
								optOutNotificationMethods: [],
							},
						},
					}),
				);
			});
			ws.addEventListener("message", (event) => {
				const message = JSON.parse(event.data.toString());
				if (message.id === "1") {
					ws.send(JSON.stringify({ method: "initialized" }));
					ws.send(JSON.stringify({ id: "2", method: "plugin/list", params: { cwds: [repoRoot] } }));
					return;
				}
				if (message.id === "2") {
					clearTimeout(timeout);
					ws.close();
					resolveResponse(message.result);
				}
			});
			ws.addEventListener("error", () => {
				clearTimeout(timeout);
				reject(new Error("Failed to query codex app-server over websocket"));
			});
		});
		return response;
	} finally {
		server.kill("SIGTERM");
		await exitPromise;
		void serverLog;
	}
}

export async function checkCodexMarketplace({ repoRoot }) {
	const marketplacePath = resolve(repoRoot, ".agents", "plugins", "marketplace.json");
	const pluginRoot = resolve(repoRoot, "plugins", "cautilus");
	accessSync(marketplacePath, constants.R_OK);
	accessSync(pluginRoot, constants.R_OK);
	const pluginList = await callPluginList({ repoRoot });
	const loadError = pluginList.marketplaceLoadErrors.find((entry) => entry.marketplacePath === marketplacePath);
	if (loadError) {
		throw new Error(loadError.message);
	}
	const marketplace = pluginList.marketplaces.find((entry) => entry.path === marketplacePath);
	if (!marketplace) {
		throw new Error(`Codex did not list repo marketplace ${marketplacePath}`);
	}
	const plugin = marketplace.plugins.find((entry) => entry.name === "cautilus");
	if (!plugin) {
		throw new Error("Codex did not list the cautilus plugin in the repo marketplace");
	}
	if (plugin.source.type !== "local" || plugin.source.path !== pluginRoot) {
		throw new Error(`Codex resolved an unexpected plugin source path: ${plugin.source.path}`);
	}
	return {
		marketplacePath,
		pluginRoot,
		pluginId: plugin.id,
		pluginInstalled: plugin.installed,
		pluginEnabled: plugin.enabled,
		marketplaceName: marketplace.name,
	};
}

export async function main(argv = process.argv.slice(2)) {
	try {
		accessSync("codex", constants.X_OK);
	} catch {
		// no-op: accessSync on PATH entries is not reliable; the spawn path is authoritative
	}
	try {
		const options = parseArgs(argv);
		const result = await checkCodexMarketplace(options);
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
	} catch (error) {
		process.stderr.write(`${error.message}\n`);
		process.exit(1);
	}
}

const entryHref = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === entryHref) {
	await main();
}
