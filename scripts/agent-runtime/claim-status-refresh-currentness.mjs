const asObject = (value) => (!value || Array.isArray(value) || typeof value !== "object" ? {} : value);

export function refreshPlanMatchesCurrentPacket(refreshPlan, claimsPacket, statusPacket) {
	const packetCommit = claimsPacket?.gitCommit;
	const statusCommit = statusPacket?.gitCommit;
	const currentCommit = statusPacket?.gitState?.currentGitCommit;
	if (![packetCommit, statusCommit, currentCommit].filter(Boolean).includes(refreshPlan.targetCommit)) {
		return false;
	}
	if (refreshPlan.status !== "up-to-date" && refreshPlan.baseCommit && packetCommit && refreshPlan.baseCommit !== packetCommit) {
		return false;
	}
	return sameDiscoveryEngine(refreshPlan.currentDiscoveryEngine, claimsPacket?.discoveryEngine);
}

function sameDiscoveryEngine(left, right) {
	const leftEngine = asObject(left);
	const rightEngine = asObject(right);
	if (Object.keys(leftEngine).length === 0 || Object.keys(rightEngine).length === 0) {
		return true;
	}
	return ["name", "ruleset"].every((key) => !leftEngine[key] || !rightEngine[key] || leftEngine[key] === rightEngine[key]);
}
