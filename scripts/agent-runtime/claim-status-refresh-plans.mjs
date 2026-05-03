import fs from "node:fs";

import { refreshPlanMatchesCurrentPacket } from "./claim-status-refresh-currentness.mjs";

const asArray = (value) => (Array.isArray(value) ? value : []);
const asObject = (value) => (!value || Array.isArray(value) || typeof value !== "object" ? {} : value);

function compactText(value) {
	return String(value ?? "")
		.replace(/\s+/g, " ")
		.trim();
}

function table(headers, rows) {
	const escapeCell = (value) => compactText(value).replaceAll("|", "\\|") || "-";
	const lines = [];
	lines.push(`| ${headers.map(escapeCell).join(" | ")} |`);
	lines.push(`| ${headers.map(() => "---").join(" | ")} |`);
	for (const row of rows) {
		lines.push(`| ${row.map(escapeCell).join(" | ")} |`);
	}
	return lines;
}

function readOptionalJSON(filePath) {
	if (!filePath || !fs.existsSync(filePath)) {
		return null;
	}
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function refreshPlanDigest(filePath) {
	const packet = readOptionalJSON(filePath);
	if (!packet) {
		return null;
	}
	const summary = asObject(packet.refreshSummary);
	return {
		path: filePath,
		mtimeMs: fs.statSync(filePath).mtimeMs,
		status: summary.status ?? "-",
		changedSourceCount: summary.changedSourceCount ?? 0,
		changedClaimCount: summary.changedClaimCount ?? 0,
		carriedForwardClaimCount: summary.carriedForwardClaimCount ?? 0,
		baseCommit: summary.baseCommit ?? "-",
		targetCommit: summary.targetCommit ?? "-",
		currentDiscoveryEngine: asObject(summary.currentDiscoveryEngine),
		changedClaimSources: asArray(summary.changedClaimSources),
		nextActions: asArray(summary.nextActions),
		summary: summary.summary ?? "",
	};
}

export function renderRefreshPlans(lines, refreshPlans, claimsPacket, statusPacket) {
	lines.push("## Refresh Plans");
	lines.push("");
	if (refreshPlans.length === 0) {
		lines.push("No refresh-plan packets were found.");
		lines.push("");
		return;
	}
	lines.push(...table(["Packet", "Status", "Changed sources", "Changed claims", "Carried forward"], refreshPlans.map((digest) => [
		digest.path,
		digest.status,
		digest.changedSourceCount,
		digest.changedClaimCount,
		digest.carriedForwardClaimCount,
	])));
	lines.push("");
	const latest = [...refreshPlans].sort((left, right) => Number(right.mtimeMs ?? 0) - Number(left.mtimeMs ?? 0))[0];
	if (!latest) {
		return;
	}
	lines.push(`Latest refresh summary: ${compactText(latest.summary) || "-"}`);
	if (!refreshPlanMatchesCurrentPacket(latest, claimsPacket, statusPacket)) {
		lines.push("Latest refresh plan is historical for this status packet; its next actions are not the current review queue.");
		lines.push("");
		return;
	}
	if (latest.changedClaimSources.length > 0) {
		const sources = latest.changedClaimSources
			.slice(0, 5)
			.map((source) => `${source.path}: ${source.claimCount}`)
			.join(", ");
		lines.push(`Latest changed claim sources: ${sources}${latest.changedClaimSources.length > 5 ? ", ..." : ""}`);
	}
	for (const action of latest.nextActions.slice(0, 3)) {
		lines.push(`- ${action.label ?? action.id}: ${compactText(action.detail)}`);
	}
	lines.push("");
}
