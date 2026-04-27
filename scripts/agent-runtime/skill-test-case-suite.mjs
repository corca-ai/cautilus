import { SKILL_TEST_CASES_SCHEMA } from "./contract-versions.mjs";

function assertObject(value, field) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${field} must be an object`);
	}
	return value;
}

function assertString(value, field) {
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(`${field} must be a non-empty string`);
	}
	return value;
}

function optionalString(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	if (typeof value !== "string") {
		throw new Error(`${field} must be a string`);
	}
	if (!value.trim()) {
		throw new Error(`${field} must be a non-empty string`);
	}
	return value;
}

function normalizePositiveInteger(value, field, defaultValue = null) {
	if (value === undefined || value === null) {
		return defaultValue;
	}
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		throw new Error(`${field} must be a positive integer`);
	}
	return parsed;
}

function nonNegativeMetricObject(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	const record = assertObject(value, field);
	const normalized = {};
	for (const key of ["max_total_tokens", "max_duration_ms", "max_cost_usd"]) {
		if (!(key in record)) {
			continue;
		}
		const number = Number(record[key]);
		if (!Number.isFinite(number) || number < 0) {
			throw new Error(`${field}.${key} must be a non-negative number`);
		}
		normalized[key] = key === "max_cost_usd" ? number : Math.trunc(number);
	}
	return Object.keys(normalized).length > 0 ? normalized : null;
}

function stringList(value, field) {
	if (value === undefined || value === null) {
		return [];
	}
	if (!Array.isArray(value)) {
		throw new Error(`${field} must be an array`);
	}
	return value.map((entry, index) => assertString(entry, `${field}[${index}]`));
}

function normalizeTurns(value, field) {
	if (value === undefined || value === null) {
		return [];
	}
	if (!Array.isArray(value) || value.length === 0) {
		throw new Error(`${field} must be a non-empty array`);
	}
	return value.map((entry, index) => {
		const record = assertObject(entry, `${field}[${index}]`);
		const normalized = {
			input: assertString(record.input, `${field}[${index}].input`),
		};
		if (record.injectSkill !== undefined) {
			if (typeof record.injectSkill !== "boolean") {
				throw new Error(`${field}[${index}].injectSkill must be a boolean`);
			}
			normalized.injectSkill = record.injectSkill;
		}
		return normalized;
	});
}

function normalizeAuditKind(value, field) {
	const auditKind = optionalString(value, field);
	if (auditKind === null) {
		return null;
	}
	if (!["cautilus_refresh_flow", "cautilus_first_scan_flow"].includes(auditKind)) {
		throw new Error(`${field} must be cautilus_refresh_flow or cautilus_first_scan_flow`);
	}
	return auditKind;
}

function normalizeExpectedTrigger(record, index, evaluationKind) {
	const expectedTrigger = optionalString(record.expectedTrigger, `cases[${index}].expectedTrigger`);
	if (evaluationKind === "trigger" && !["must_invoke", "must_not_invoke"].includes(expectedTrigger ?? "")) {
		throw new Error("trigger cases must set expectedTrigger to must_invoke or must_not_invoke");
	}
	if (evaluationKind === "execution" && expectedTrigger) {
		throw new Error("execution cases must not set expectedTrigger");
	}
	return expectedTrigger;
}

function normalizeRepeatConfig(record, index, suiteRepeatCount, suiteMinConsensusCount) {
	const caseRepeatCount = normalizePositiveInteger(record.repeatCount, `cases[${index}].repeatCount`, null);
	const repeatCount = caseRepeatCount ?? suiteRepeatCount;
	const minConsensusCount = normalizePositiveInteger(
		record.minConsensusCount,
		`cases[${index}].minConsensusCount`,
		caseRepeatCount === null ? suiteMinConsensusCount : repeatCount,
	);
	if (minConsensusCount > repeatCount) {
		throw new Error(`cases[${index}].minConsensusCount must be less than or equal to repeatCount`);
	}
	return { repeatCount, minConsensusCount };
}

function normalizeCase(record, index, skillId, skillDisplayName, suiteRepeatCount, suiteMinConsensusCount) {
	const evaluationKind = assertString(record.evaluationKind, `cases[${index}].evaluationKind`);
	if (!["trigger", "execution"].includes(evaluationKind)) {
		throw new Error(`cases[${index}].evaluationKind must be trigger or execution`);
	}
	const targetKind = optionalString(record.targetKind, `cases[${index}].targetKind`) ?? "public_skill";
	if (!["public_skill", "profile", "integration"].includes(targetKind)) {
		throw new Error(`cases[${index}].targetKind must be public_skill, profile, or integration`);
	}
	const expectedTrigger = normalizeExpectedTrigger(record, index, evaluationKind);
	const { repeatCount, minConsensusCount } = normalizeRepeatConfig(
		record,
		index,
		suiteRepeatCount,
		suiteMinConsensusCount,
	);
	const turns = normalizeTurns(record.turns, `cases[${index}].turns`);
	const prompt = turns.length > 0
		? optionalString(record.prompt, `cases[${index}].prompt`) ?? `Multi-turn episode starting with: ${turns[0].input}`
		: assertString(record.prompt, `cases[${index}].prompt`);
	const auditKind = normalizeAuditKind(record.auditKind, `cases[${index}].auditKind`);
	if (turns.length > 0 && evaluationKind !== "execution") {
		throw new Error(`cases[${index}].turns is only supported for execution cases`);
	}
	if (auditKind !== null && turns.length === 0) {
		throw new Error(`cases[${index}].auditKind requires turns`);
	}
	return {
		caseId: assertString(record.caseId, `cases[${index}].caseId`),
		targetKind,
		targetId: optionalString(record.targetId, `cases[${index}].targetId`) ?? skillId,
		displayName: optionalString(record.displayName, `cases[${index}].displayName`) ?? skillDisplayName,
		evaluationKind,
		prompt,
		turns,
		auditKind,
		expectedTrigger,
		requiredSummaryFragments: stringList(record.requiredSummaryFragments, `cases[${index}].requiredSummaryFragments`),
		forbiddenSummaryFragments: stringList(record.forbiddenSummaryFragments, `cases[${index}].forbiddenSummaryFragments`),
		requiredCommandFragments: stringList(record.requiredCommandFragments, `cases[${index}].requiredCommandFragments`),
		forbiddenCommandFragments: stringList(record.forbiddenCommandFragments, `cases[${index}].forbiddenCommandFragments`),
		thresholds: nonNegativeMetricObject(record.thresholds, `cases[${index}].thresholds`),
		repeatCount,
		minConsensusCount,
	};
}

export function normalizeSkillTestCaseSuite(input) {
	if (input?.schemaVersion !== SKILL_TEST_CASES_SCHEMA) {
		throw new Error(`schemaVersion must be ${SKILL_TEST_CASES_SCHEMA}`);
	}
	const skillId = assertString(input.skillId, "skillId");
	const skillDisplayName = optionalString(input.skillDisplayName, "skillDisplayName") ?? skillId;
	const suiteRepeatCount = normalizePositiveInteger(input.repeatCount, "repeatCount", 1);
	const suiteMinConsensusCount = normalizePositiveInteger(
		input.minConsensusCount,
		"minConsensusCount",
		suiteRepeatCount,
	);
	if (suiteMinConsensusCount > suiteRepeatCount) {
		throw new Error("minConsensusCount must be less than or equal to repeatCount");
	}
	if (!Array.isArray(input.cases) || input.cases.length === 0) {
		throw new Error("cases must be a non-empty array");
	}
	const cases = input.cases.map((entry, index) => normalizeCase(
		assertObject(entry, `cases[${index}]`),
		index,
		skillId,
		skillDisplayName,
		suiteRepeatCount,
		suiteMinConsensusCount,
	));
	return { skillId, skillDisplayName, repeatCount: suiteRepeatCount, minConsensusCount: suiteMinConsensusCount, cases };
}
