import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export const SCENARIO_PROFILE_SCHEMA = "cautilus.scenario_profile.v1";
export const SCENARIO_HISTORY_SCHEMA = "cautilus.scenario_history.v1";
export const SCENARIO_BASELINE_CACHE_SCHEMA = "cautilus.scenario_baseline_cache.v1";

const DEFAULT_HISTORY_POLICY = {
	maxGraduationInterval: 5,
	recentResultsLimit: 12,
};

function cloneJson(value) {
	return JSON.parse(JSON.stringify(value));
}

function validateScenarioEntry(scenario, index, label) {
	if (!scenario || typeof scenario !== "object") {
		throw new Error(`${label}.scenarios[${index}] must be an object`);
	}
	if (typeof scenario.scenarioId !== "string" || !scenario.scenarioId.trim()) {
		throw new Error(`${label}.scenarios[${index}].scenarioId must be a non-empty string`);
	}
	if (!["train", "test", "all"].includes(scenario.split)) {
		throw new Error(`${label}.scenarios[${index}].split must be train, test, or all`);
	}
	if (!["always", "graduated"].includes(scenario.cadence)) {
		throw new Error(`${label}.scenarios[${index}].cadence must be always or graduated`);
	}
}

function validateScenarioProfile(profile, label = "profile") {
	if (!profile || typeof profile !== "object") {
		throw new Error(`${label} must be an object`);
	}
	if (profile.schemaVersion !== SCENARIO_PROFILE_SCHEMA) {
		throw new Error(`${label} must use schemaVersion ${SCENARIO_PROFILE_SCHEMA}`);
	}
	if (typeof profile.profileId !== "string" || !profile.profileId.trim()) {
		throw new Error(`${label}.profileId must be a non-empty string`);
	}
	if (!Array.isArray(profile.scenarios)) {
		throw new Error(`${label}.scenarios must be an array`);
	}
	for (const [index, scenario] of profile.scenarios.entries()) {
		validateScenarioEntry(scenario, index, label);
	}
}

export function loadScenarioProfile(profileRef) {
	const profilePath = resolve(profileRef);
	const profile = JSON.parse(readFileSync(profilePath, "utf-8"));
	validateScenarioProfile(profile, profilePath);
	return profile;
}

function scenarioHistoryPolicy(profile) {
	return {
		...DEFAULT_HISTORY_POLICY,
		...(profile.historyPolicy && typeof profile.historyPolicy === "object" ? profile.historyPolicy : {}),
	};
}

export function buildScenarioMetadataMap(profile) {
	validateScenarioProfile(profile);
	return Object.fromEntries(profile.scenarios.map((scenario) => [scenario.scenarioId, scenario]));
}

export function listProfileScenarioIds(profile, split = "train") {
	validateScenarioProfile(profile);
	return profile.scenarios
		.filter((scenario) => split === "all" || scenario.split === split)
		.map((scenario) => scenario.scenarioId);
}

export function createEmptyScenarioHistory(profile) {
	validateScenarioProfile(profile);
	return {
		schemaVersion: SCENARIO_HISTORY_SCHEMA,
		profileId: profile.profileId,
		trainRunCount: 0,
		scenarioStats: {},
		recentRuns: [],
	};
}

export function loadScenarioHistory(historyPath, profile) {
	validateScenarioProfile(profile);
	try {
		const parsed = JSON.parse(readFileSync(historyPath, "utf-8"));
		if (parsed?.schemaVersion !== SCENARIO_HISTORY_SCHEMA || parsed?.profileId !== profile.profileId) {
			return createEmptyScenarioHistory(profile);
		}
		return parsed;
	} catch {
		return createEmptyScenarioHistory(profile);
	}
}

export function saveScenarioHistory(historyPath, history) {
	mkdirSync(dirname(historyPath), { recursive: true });
	writeFileSync(historyPath, `${JSON.stringify(history, null, 2)}\n`, "utf-8");
}

function graduationInterval(stat, policy) {
	const candidate = Number.isInteger(stat?.graduationInterval) ? stat.graduationInterval : 1;
	return Math.max(1, Math.min(policy.maxGraduationInterval, candidate));
}

function isScenarioDue(stat, nextTrainRunIndex, policy) {
	if (!stat || !Number.isInteger(stat.lastTrainRunIndex)) {
		return true;
	}
	return nextTrainRunIndex - stat.lastTrainRunIndex >= graduationInterval(stat, policy);
}

export function selectProfileScenarioIds({ profile, split = "train", history, fullCheck = false }) {
	validateScenarioProfile(profile);
	const scenarioEntries = profile.scenarios.filter((scenario) => split === "all" || scenario.split === split);
	if (split !== "train" || fullCheck) {
		return scenarioEntries.map((scenario) => scenario.scenarioId);
	}
	const nextTrainRunIndex = (history?.trainRunCount ?? 0) + 1;
	const policy = scenarioHistoryPolicy(profile);
	return scenarioEntries
		.filter(
			(scenario) =>
				scenario.cadence === "always" ||
				isScenarioDue(history?.scenarioStats?.[scenario.scenarioId], nextTrainRunIndex, policy),
		)
		.map((scenario) => scenario.scenarioId);
}

function trimRecent(items, limit) {
	return items.slice(Math.max(0, items.length - limit));
}

function isPerfectResult(result) {
	return result?.passRate === 1 && result?.overallScore === 100;
}

function createTrainResultRecord(result, runIndex, input) {
	return {
		runIndex,
		timestamp: input.timestamp,
		overallScore: result?.overallScore ?? null,
		passRate: result?.passRate ?? 0,
		status: result?.status ?? "missing",
		fullCheck: false,
	};
}

function nextScenarioStat(stat, result, runIndex, policy, input) {
	const nextStat = stat || { graduationInterval: 1, recentTrainResults: [] };
	nextStat.lastTrainRunIndex = runIndex;
	nextStat.graduationInterval = isPerfectResult(result)
		? Math.min(policy.maxGraduationInterval, graduationInterval(nextStat, policy) + 1)
		: 1;
	nextStat.recentTrainResults = trimRecent(
		[
			...(Array.isArray(nextStat.recentTrainResults) ? nextStat.recentTrainResults : []),
			createTrainResultRecord(result, runIndex, input),
		],
		policy.recentResultsLimit,
	);
	return nextStat;
}

function appendRecentRun(history, input, runIndex, scenarioIds, policy) {
	history.recentRuns = trimRecent(
		[
			...(Array.isArray(history.recentRuns) ? history.recentRuns : []),
			{
				runIndex,
				timestamp: input.timestamp,
				split: input.split,
				fullCheck: false,
				selectedScenarioIds: scenarioIds,
			},
		],
		policy.recentResultsLimit,
	);
}

export function updateScenarioHistory(input) {
	validateScenarioProfile(input.profile);
	const history = input.history ? cloneJson(input.history) : createEmptyScenarioHistory(input.profile);
	if (input.fullCheck) {
		return history;
	}
	const trainScenarioIds = new Set(
		input.profile.scenarios.filter((scenario) => scenario.split === "train").map((scenario) => scenario.scenarioId),
	);
	const selectedTrainScenarioIds = (input.selectedScenarioIds || []).filter((scenarioId) => trainScenarioIds.has(scenarioId));
	if (selectedTrainScenarioIds.length === 0) {
		return history;
	}
	const policy = scenarioHistoryPolicy(input.profile);
	const resultsById = new Map((input.candidateResults || []).map((result) => [result.scenarioId, result]));
	history.trainRunCount += 1;
	const runIndex = history.trainRunCount;
	history.scenarioStats = history.scenarioStats || {};
	for (const scenarioId of selectedTrainScenarioIds) {
		history.scenarioStats[scenarioId] = nextScenarioStat(
			history.scenarioStats[scenarioId],
			resultsById.get(scenarioId) || null,
			runIndex,
			policy,
			input,
		);
	}
	appendRecentRun(history, input, runIndex, selectedTrainScenarioIds, policy);
	return history;
}
