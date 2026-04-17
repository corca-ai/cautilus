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

function nullableString(value, field) {
	if (value === undefined) {
		return undefined;
	}
	if (value === null) {
		return null;
	}
	return optionalString(value, field);
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

function normalizeInstructionSurfaceFile(record, field) {
	const normalized = {
		path: assertString(record.path, `${field}.path`),
	};
	const content = optionalString(record.content, `${field}.content`);
	const sourceFile = optionalString(record.sourceFile, `${field}.sourceFile`);
	if ((content ? 1 : 0) + (sourceFile ? 1 : 0) !== 1) {
		throw new Error(`${field} must set exactly one of content or sourceFile`);
	}
	if (content) {
		normalized.content = content;
	}
	if (sourceFile) {
		normalized.sourceFile = sourceFile;
	}
	return normalized;
}

function normalizeInstructionSurface(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	const record = assertObject(value, field);
	if (!Array.isArray(record.files) || record.files.length === 0) {
		throw new Error(`${field}.files must be a non-empty array`);
	}
	return {
		surfaceLabel: optionalString(record.surfaceLabel, `${field}.surfaceLabel`) ?? "custom_instruction_surface",
		files: record.files.map((entry, index) => normalizeInstructionSurfaceFile(
			assertObject(entry, `${field}.files[${index}]`),
			`${field}.files[${index}]`,
		)),
	};
}

function normalizeExpectedRouting(value, field) {
	if (value === undefined || value === null) {
		return null;
	}
	const record = assertObject(value, field);
	const normalized = {};
	if ("selectedSkill" in record) {
		normalized.selectedSkill = nullableString(record.selectedSkill, `${field}.selectedSkill`);
	}
	if ("selectedSupport" in record) {
		normalized.selectedSupport = nullableString(record.selectedSupport, `${field}.selectedSupport`);
	}
	if ("firstToolCallPattern" in record) {
		normalized.firstToolCallPattern = optionalString(record.firstToolCallPattern, `${field}.firstToolCallPattern`);
	}
	if (Object.keys(normalized).length === 0) {
		throw new Error(`${field} must declare at least one expectation field`);
	}
	return normalized;
}

function normalizeCase(
	record,
	index,
	skillId,
	skillDisplayName,
	suiteRepeatCount,
	suiteMinConsensusCount,
	suiteInstructionSurface,
) {
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
	return {
		caseId: assertString(record.caseId, `cases[${index}].caseId`),
		targetKind,
		targetId: optionalString(record.targetId, `cases[${index}].targetId`) ?? skillId,
		displayName: optionalString(record.displayName, `cases[${index}].displayName`) ?? skillDisplayName,
		evaluationKind,
		prompt: assertString(record.prompt, `cases[${index}].prompt`),
		expectedTrigger,
		expectedRouting: normalizeExpectedRouting(record.expectedRouting, `cases[${index}].expectedRouting`),
		instructionSurface: normalizeInstructionSurface(
			record.instructionSurface,
			`cases[${index}].instructionSurface`,
		) ?? suiteInstructionSurface,
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
	const suiteInstructionSurface = normalizeInstructionSurface(input.instructionSurface, "instructionSurface");
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
		suiteInstructionSurface,
	));
	return {
		skillId,
		skillDisplayName,
		repeatCount: suiteRepeatCount,
		minConsensusCount: suiteMinConsensusCount,
		instructionSurface: suiteInstructionSurface,
		cases,
	};
}
