import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
	SCENARIO_BASELINE_CACHE_SCHEMA,
	SCENARIO_HISTORY_SCHEMA,
	SCENARIO_PROFILE_SCHEMA,
	buildScenarioBaselineCacheKey,
	createScenarioBaselineCacheSeed,
	createEmptyScenarioHistory,
	loadScenarioHistory,
	saveScenarioHistory,
	selectProfileScenarioIds,
	updateScenarioHistory,
} from "./scenario-history.mjs";

function createProfile() {
	return {
		schemaVersion: SCENARIO_PROFILE_SCHEMA,
		profileId: "default-train",
		historyPolicy: {
			maxGraduationInterval: 5,
			recentResultsLimit: 12,
		},
		scenarios: [
			{ scenarioId: "probe-a", split: "train", cadence: "graduated", cohort: "probe" },
			{ scenarioId: "control-a", split: "train", cadence: "always", cohort: "control" },
			{ scenarioId: "held-out-a", split: "test", cadence: "always", cohort: "held-out" },
		],
	};
}

test("selectProfileScenarioIds returns all train scenarios when no history exists", () => {
	const profile = createProfile();
	assert.deepEqual(selectProfileScenarioIds({ profile, split: "train", history: null }), ["probe-a", "control-a"]);
});

test("updateScenarioHistory graduates perfect train scenarios and makes them temporarily ineligible", () => {
	const profile = createProfile();
	const initialHistory = createEmptyScenarioHistory(profile);
	const first = updateScenarioHistory({
		profile,
		history: initialHistory,
		selectedScenarioIds: ["probe-a", "control-a"],
		candidateResults: [
			{ scenarioId: "probe-a", status: "passed", overallScore: 100, passRate: 1 },
			{ scenarioId: "control-a", status: "passed", overallScore: 100, passRate: 1 },
		],
		timestamp: "2026-04-09T21:00:00.000Z",
		split: "train",
		fullCheck: false,
	});
	assert.equal(first.trainRunCount, 1);
	assert.equal(first.scenarioStats["probe-a"].graduationInterval, 2);
	assert.deepEqual(selectProfileScenarioIds({ profile, split: "train", history: first }), ["control-a"]);

	const second = updateScenarioHistory({
		profile,
		history: first,
		selectedScenarioIds: ["control-a"],
		candidateResults: [{ scenarioId: "control-a", status: "passed", overallScore: 100, passRate: 1 }],
		timestamp: "2026-04-09T21:10:00.000Z",
		split: "train",
		fullCheck: false,
	});
	assert.equal(second.trainRunCount, 2);
	assert.deepEqual(selectProfileScenarioIds({ profile, split: "train", history: second }), ["probe-a", "control-a"]);
});

test("updateScenarioHistory resets cadence after an imperfect train result", () => {
	const profile = createProfile();
	const history = updateScenarioHistory({
		profile,
		history: createEmptyScenarioHistory(profile),
		selectedScenarioIds: ["probe-a"],
		candidateResults: [{ scenarioId: "probe-a", status: "passed", overallScore: 100, passRate: 1 }],
		timestamp: "2026-04-09T21:00:00.000Z",
		split: "train",
		fullCheck: false,
	});
	const reset = updateScenarioHistory({
		profile,
		history,
		selectedScenarioIds: ["probe-a"],
		candidateResults: [{ scenarioId: "probe-a", status: "failed", overallScore: 80, passRate: 0 }],
		timestamp: "2026-04-09T21:05:00.000Z",
		split: "train",
		fullCheck: false,
	});
	assert.equal(reset.scenarioStats["probe-a"].graduationInterval, 1);
});

test("updateScenarioHistory preserves scenario-level telemetry for later analysis", () => {
	const profile = createProfile();
	const history = updateScenarioHistory({
		profile,
		history: createEmptyScenarioHistory(profile),
		selectedScenarioIds: ["probe-a"],
		candidateResults: [
			{
				scenarioId: "probe-a",
				status: "passed",
				overallScore: 100,
				passRate: 1,
				durationMs: 250,
				telemetry: {
					provider: "openai",
					model: "gpt-5.4",
					total_tokens: 320,
					cost_usd: 0.024,
				},
			},
		],
		timestamp: "2026-04-09T21:00:00.000Z",
		split: "train",
		fullCheck: false,
	});
	assert.equal(history.scenarioStats["probe-a"].recentTrainResults[0].durationMs, 250);
	assert.equal(history.scenarioStats["probe-a"].recentTrainResults[0].telemetry.total_tokens, 320);
	assert.equal(history.scenarioStats["probe-a"].recentTrainResults[0].telemetry.cost_usd, 0.024);
});

test("full checks bypass graduation for selection and do not advance train history", () => {
	const profile = createProfile();
	const initialHistory = createEmptyScenarioHistory(profile);
	const selected = selectProfileScenarioIds({ profile, split: "train", history: initialHistory, fullCheck: true });
	assert.deepEqual(selected, ["probe-a", "control-a"]);
	const updated = updateScenarioHistory({
		profile,
		history: initialHistory,
		selectedScenarioIds: selected,
		candidateResults: [{ scenarioId: "probe-a", status: "passed", overallScore: 100, passRate: 1 }],
		timestamp: "2026-04-09T21:00:00.000Z",
		split: "train",
		fullCheck: true,
	});
	assert.deepEqual(updated, initialHistory);
});

test("saveScenarioHistory and loadScenarioHistory round-trip valid history and reset invalid history", () => {
	const profile = createProfile();
	const root = mkdtempSync(join(tmpdir(), "cautilus-scenario-history-"));
	try {
		const historyPath = join(root, "history.json");
		const history = updateScenarioHistory({
			profile,
			history: createEmptyScenarioHistory(profile),
			selectedScenarioIds: ["control-a"],
			candidateResults: [{ scenarioId: "control-a", status: "passed", overallScore: 100, passRate: 1 }],
			timestamp: "2026-04-09T21:00:00.000Z",
			split: "train",
			fullCheck: false,
		});
		saveScenarioHistory(historyPath, history);
		assert.equal(JSON.parse(readFileSync(historyPath, "utf-8")).schemaVersion, SCENARIO_HISTORY_SCHEMA);
		assert.deepEqual(loadScenarioHistory(historyPath, profile), history);
		writeFileSync(historyPath, '{"schemaVersion":"wrong"}\n', "utf-8");
		assert.deepEqual(loadScenarioHistory(historyPath, profile), createEmptyScenarioHistory(profile));
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("scenario baseline cache keys stay stable across id order and change when scenario definitions change", () => {
	const profile = createProfile();
	const first = buildScenarioBaselineCacheKey({
		profile,
		selectedScenarioIds: ["control-a", "probe-a"],
		baselineFingerprint: "abc123",
		cacheSampleCount: 5,
	});
	const reordered = buildScenarioBaselineCacheKey({
		profile,
		selectedScenarioIds: ["probe-a", "control-a"],
		baselineFingerprint: "abc123",
		cacheSampleCount: 5,
	});
	assert.deepEqual(first, reordered);

	const changedProfile = createProfile();
	changedProfile.scenarios[0].cadence = "always";
	const changed = buildScenarioBaselineCacheKey({
		profile: changedProfile,
		selectedScenarioIds: ["probe-a", "control-a"],
		baselineFingerprint: "abc123",
		cacheSampleCount: 5,
	});
	assert.notEqual(changed.scenarioFingerprint, first.scenarioFingerprint);
});

test("createScenarioBaselineCacheSeed returns a materializable cache seed payload", () => {
	const profile = createProfile();
	const seed = createScenarioBaselineCacheSeed({
		profile,
		selectedScenarioIds: ["probe-a"],
		baselineFingerprint: "abc123",
		cacheSampleCount: 3,
		baselineRepoLabel: "origin/main@abc123",
		createdAt: "2026-04-10T00:00:00.000Z",
	});
	assert.equal(seed.schemaVersion, SCENARIO_BASELINE_CACHE_SCHEMA);
	assert.equal(seed.cacheKey.profileId, "default-train");
	assert.deepEqual(seed.cacheKey.scenarioIds, ["probe-a"]);
	assert.deepEqual(seed.results, []);
});
