import { BEHAVIOR_INTENT_SCHEMA } from "./contract-versions.mjs";

function normalizeNonEmptyString(value, field) {
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(`${field} must be a non-empty string`);
	}
	return value.trim();
}

function slugify(value) {
	return String(value || "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);
}

function normalizeDimension(entry, index, field, prefix) {
	if (typeof entry === "string") {
		const summary = normalizeNonEmptyString(entry, `${field}[${index}]`);
		return {
			id: `${prefix}-${slugify(summary) || index + 1}`,
			summary,
		};
	}
	if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
		throw new Error(`${field}[${index}] must be a string or object`);
	}
	const summary = normalizeNonEmptyString(entry.summary, `${field}[${index}].summary`);
	return {
		id:
			entry.id !== undefined
				? normalizeNonEmptyString(entry.id, `${field}[${index}].id`)
				: `${prefix}-${slugify(summary) || index + 1}`,
		summary,
	};
}

function normalizeDimensions(entries, field, prefix, fallbackSummary = null) {
	if (entries === undefined || entries === null) {
		if (!fallbackSummary) {
			return [];
		}
		return [
			{
				id: `${prefix}-${slugify(fallbackSummary) || "default"}`,
				summary: fallbackSummary,
			},
		];
	}
	if (!Array.isArray(entries)) {
		throw new Error(`${field} must be an array`);
	}
	return entries.map((entry, index) => normalizeDimension(entry, index, field, prefix));
}

function chooseSuccessEntries(intentProfile) {
	return Array.isArray(intentProfile?.successDimensions) && intentProfile.successDimensions.length > 0
		? intentProfile.successDimensions
		: undefined;
}

function chooseGuardrailEntries(intentProfile, defaultGuardrailDimensions) {
	return Array.isArray(intentProfile?.guardrailDimensions) && intentProfile.guardrailDimensions.length > 0
		? intentProfile.guardrailDimensions
		: defaultGuardrailDimensions;
}

function resolveIntentId(intentProfile, summary) {
	return intentProfile?.intentId !== undefined
		? normalizeNonEmptyString(intentProfile.intentId, "intentProfile.intentId")
		: `intent-${slugify(summary) || "default"}`;
}

function resolveBehaviorSurface(intentProfile, fallbackBehaviorSurface) {
	return intentProfile?.behaviorSurface !== undefined
		? normalizeNonEmptyString(intentProfile.behaviorSurface, "intentProfile.behaviorSurface")
		: normalizeNonEmptyString(fallbackBehaviorSurface, "fallbackBehaviorSurface");
}

export function buildBehaviorIntentProfile({
	intent,
	intentProfile,
	fallbackBehaviorSurface = "operator_behavior",
	defaultGuardrailDimensions = [],
} = {}) {
	const summary = normalizeNonEmptyString(intentProfile?.summary ?? intent, "intent");
	return {
		schemaVersion: BEHAVIOR_INTENT_SCHEMA,
		intentId: resolveIntentId(intentProfile, summary),
		summary,
		behaviorSurface: resolveBehaviorSurface(intentProfile, fallbackBehaviorSurface),
		successDimensions: normalizeDimensions(
			chooseSuccessEntries(intentProfile),
			"intentProfile.successDimensions",
			"success",
			summary,
		),
		guardrailDimensions: normalizeDimensions(
			chooseGuardrailEntries(intentProfile, defaultGuardrailDimensions),
			"intentProfile.guardrailDimensions",
			"guardrail",
		),
	};
}
