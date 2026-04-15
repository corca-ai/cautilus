import { BEHAVIOR_INTENT_SCHEMA } from "./contract-versions.mjs";

export const BEHAVIOR_SURFACES = {
	OPERATOR_BEHAVIOR: "operator_behavior",
	CONVERSATION_CONTINUITY: "conversation_continuity",
	THREAD_FOLLOWUP: "thread_followup",
	THREAD_CONTEXT_RECOVERY: "thread_context_recovery",
	SKILL_VALIDATION: "skill_validation",
	SKILL_TRIGGER_SELECTION: "skill_trigger_selection",
	SKILL_EXECUTION_QUALITY: "skill_execution_quality",
	OPERATOR_WORKFLOW_RECOVERY: "operator_workflow_recovery",
	REVIEW_VARIANT_WORKFLOW: "review_variant_workflow",
};

export const BEHAVIOR_DIMENSIONS = {
	OPERATOR_GUIDANCE_CLARITY: "operator_guidance_clarity",
	FAILURE_CAUSE_CLARITY: "failure_cause_clarity",
	RECOVERY_NEXT_STEP: "recovery_next_step",
	WORKFLOW_CONTINUITY: "workflow_continuity",
	TARGET_CLARIFICATION: "target_clarification",
	PREFERENCE_REUSE: "preference_reuse",
	VALIDATION_INTEGRITY: "validation_integrity",
	SKILL_TRIGGER_ACCURACY: "skill_trigger_accuracy",
	SKILL_TASK_FIDELITY: "skill_task_fidelity",
	RUNTIME_BUDGET_RESPECT: "runtime_budget_respect",
	WORKFLOW_RECOVERY: "workflow_recovery",
	REVIEW_EVIDENCE_LEGIBILITY: "review_evidence_legibility",
	OPERATOR_STATE_TRUTHFULNESS: "operator_state_truthfulness",
	REPAIR_EXPLICIT_REGRESSIONS_FIRST: "repair_explicit_regressions_first",
	REVIEW_FINDINGS_BINDING: "review_findings_binding",
	HISTORY_FOCUSES_NEXT_PROBE: "history_focuses_next_probe",
	RERUN_RELEVANT_GATES: "rerun_relevant_gates",
};

const KNOWN_BEHAVIOR_SURFACES = new Set(Object.values(BEHAVIOR_SURFACES));
const ALL_BEHAVIOR_SURFACES = Object.values(BEHAVIOR_SURFACES);

// Deprecated surface names accepted on input and silently normalized to
// their canonical replacement. See the surface-name disambiguation
// discussion in archetype-boundary.spec.md (closed in v0.4.x).
const DEPRECATED_BEHAVIOR_SURFACE_ALIASES = {
	workflow_conversation: "conversation_continuity",
};

const DIMENSION_KIND_SUCCESS = "success";
const DIMENSION_KIND_GUARDRAIL = "guardrail";

export const BEHAVIOR_DIMENSION_CATALOG = {
	[BEHAVIOR_DIMENSIONS.OPERATOR_GUIDANCE_CLARITY]: {
		kind: DIMENSION_KIND_SUCCESS,
		summary: "Keep the operator-facing guidance explicit and easy to follow.",
		surfaces: [BEHAVIOR_SURFACES.OPERATOR_BEHAVIOR],
	},
	[BEHAVIOR_DIMENSIONS.FAILURE_CAUSE_CLARITY]: {
		kind: DIMENSION_KIND_SUCCESS,
		summary: "Explain the concrete failure cause or missing prerequisite.",
		surfaces: [BEHAVIOR_SURFACES.OPERATOR_BEHAVIOR],
	},
	[BEHAVIOR_DIMENSIONS.RECOVERY_NEXT_STEP]: {
		kind: DIMENSION_KIND_SUCCESS,
		summary: "Make the next safe recovery step explicit without operator guesswork.",
		surfaces: [
			BEHAVIOR_SURFACES.OPERATOR_BEHAVIOR,
			BEHAVIOR_SURFACES.OPERATOR_WORKFLOW_RECOVERY,
		],
	},
	[BEHAVIOR_DIMENSIONS.WORKFLOW_CONTINUITY]: {
		kind: DIMENSION_KIND_SUCCESS,
		summary: "Carry the active workflow context cleanly into the next turn.",
		surfaces: [BEHAVIOR_SURFACES.CONVERSATION_CONTINUITY, BEHAVIOR_SURFACES.THREAD_FOLLOWUP],
	},
	[BEHAVIOR_DIMENSIONS.TARGET_CLARIFICATION]: {
		kind: DIMENSION_KIND_SUCCESS,
		summary: "Ask for the minimum concrete target or missing context before acting.",
		surfaces: [BEHAVIOR_SURFACES.CONVERSATION_CONTINUITY, BEHAVIOR_SURFACES.THREAD_CONTEXT_RECOVERY],
	},
	[BEHAVIOR_DIMENSIONS.PREFERENCE_REUSE]: {
		kind: DIMENSION_KIND_SUCCESS,
		summary: "Reuse the preference or constraint the user just established in-thread.",
		surfaces: [BEHAVIOR_SURFACES.CONVERSATION_CONTINUITY],
	},
	[BEHAVIOR_DIMENSIONS.VALIDATION_INTEGRITY]: {
		kind: DIMENSION_KIND_SUCCESS,
		summary: "Keep the declared validation surface passing and legible.",
		surfaces: [BEHAVIOR_SURFACES.SKILL_VALIDATION],
	},
	[BEHAVIOR_DIMENSIONS.SKILL_TRIGGER_ACCURACY]: {
		kind: DIMENSION_KIND_SUCCESS,
		summary: "Trigger the skill when the prompt truly needs it and stay quiet otherwise.",
		surfaces: [BEHAVIOR_SURFACES.SKILL_TRIGGER_SELECTION],
	},
	[BEHAVIOR_DIMENSIONS.SKILL_TASK_FIDELITY]: {
		kind: DIMENSION_KIND_SUCCESS,
		summary: "Complete the intended task cleanly once the skill is invoked.",
		surfaces: [BEHAVIOR_SURFACES.SKILL_EXECUTION_QUALITY],
	},
	[BEHAVIOR_DIMENSIONS.RUNTIME_BUDGET_RESPECT]: {
		kind: DIMENSION_KIND_SUCCESS,
		summary: "Stay within the declared runtime or token budget when one is provided.",
		surfaces: [BEHAVIOR_SURFACES.SKILL_EXECUTION_QUALITY],
	},
	[BEHAVIOR_DIMENSIONS.WORKFLOW_RECOVERY]: {
		kind: DIMENSION_KIND_SUCCESS,
		summary: "Recover the workflow cleanly when the known blocker reappears.",
		surfaces: [BEHAVIOR_SURFACES.OPERATOR_WORKFLOW_RECOVERY],
	},
	[BEHAVIOR_DIMENSIONS.REVIEW_EVIDENCE_LEGIBILITY]: {
		kind: DIMENSION_KIND_SUCCESS,
		summary: "Keep review evidence and verdict framing legible to a human reviewer.",
		surfaces: [BEHAVIOR_SURFACES.REVIEW_VARIANT_WORKFLOW],
	},
	[BEHAVIOR_DIMENSIONS.OPERATOR_STATE_TRUTHFULNESS]: {
		kind: DIMENSION_KIND_GUARDRAIL,
		summary: "Do not imply success, configuration, or completion state that has not happened.",
		surfaces: [
			BEHAVIOR_SURFACES.OPERATOR_BEHAVIOR,
			BEHAVIOR_SURFACES.OPERATOR_WORKFLOW_RECOVERY,
		],
	},
	[BEHAVIOR_DIMENSIONS.REPAIR_EXPLICIT_REGRESSIONS_FIRST]: {
		kind: DIMENSION_KIND_GUARDRAIL,
		summary: "Prefer repairing explicit regressions over widening scope.",
		surfaces: ALL_BEHAVIOR_SURFACES,
	},
	[BEHAVIOR_DIMENSIONS.REVIEW_FINDINGS_BINDING]: {
		kind: DIMENSION_KIND_GUARDRAIL,
		summary: "Treat review findings as first-class evidence, not optional commentary.",
		surfaces: ALL_BEHAVIOR_SURFACES,
	},
	[BEHAVIOR_DIMENSIONS.HISTORY_FOCUSES_NEXT_PROBE]: {
		kind: DIMENSION_KIND_GUARDRAIL,
		summary: "Use scenario history only to focus the next bounded probe, not to justify overfitting.",
		surfaces: ALL_BEHAVIOR_SURFACES,
	},
	[BEHAVIOR_DIMENSIONS.RERUN_RELEVANT_GATES]: {
		kind: DIMENSION_KIND_GUARDRAIL,
		summary: "Stop after one bounded revision and rerun the relevant gates.",
		surfaces: ALL_BEHAVIOR_SURFACES,
	},
};

const DEFAULT_SUCCESS_DIMENSIONS_BY_SURFACE = {
	[BEHAVIOR_SURFACES.OPERATOR_BEHAVIOR]: [BEHAVIOR_DIMENSIONS.OPERATOR_GUIDANCE_CLARITY],
	[BEHAVIOR_SURFACES.CONVERSATION_CONTINUITY]: [BEHAVIOR_DIMENSIONS.WORKFLOW_CONTINUITY],
	[BEHAVIOR_SURFACES.THREAD_FOLLOWUP]: [BEHAVIOR_DIMENSIONS.WORKFLOW_CONTINUITY],
	[BEHAVIOR_SURFACES.THREAD_CONTEXT_RECOVERY]: [BEHAVIOR_DIMENSIONS.TARGET_CLARIFICATION],
	[BEHAVIOR_SURFACES.SKILL_VALIDATION]: [BEHAVIOR_DIMENSIONS.VALIDATION_INTEGRITY],
	[BEHAVIOR_SURFACES.SKILL_TRIGGER_SELECTION]: [BEHAVIOR_DIMENSIONS.SKILL_TRIGGER_ACCURACY],
	[BEHAVIOR_SURFACES.SKILL_EXECUTION_QUALITY]: [BEHAVIOR_DIMENSIONS.SKILL_TASK_FIDELITY],
	[BEHAVIOR_SURFACES.OPERATOR_WORKFLOW_RECOVERY]: [BEHAVIOR_DIMENSIONS.WORKFLOW_RECOVERY],
	[BEHAVIOR_SURFACES.REVIEW_VARIANT_WORKFLOW]: [BEHAVIOR_DIMENSIONS.REVIEW_EVIDENCE_LEGIBILITY],
};

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

function createCatalogDimensionEntry(id) {
	const catalogEntry = BEHAVIOR_DIMENSION_CATALOG[id];
	if (!catalogEntry) {
		throw new Error(`dimension id must be one of: ${Object.keys(BEHAVIOR_DIMENSION_CATALOG).join(", ")}`);
	}
	return {
		id,
		summary: catalogEntry.summary,
	};
}

export function buildCatalogDimensions(ids = []) {
	if (!Array.isArray(ids)) {
		throw new Error("dimension ids must be an array");
	}
	return ids.map((id, index) => {
		if (typeof id !== "string" || !id.trim()) {
			throw new Error(`dimension ids[${index}] must be a non-empty string`);
		}
		return createCatalogDimensionEntry(id.trim());
	});
}

function normalizeDimension(entry, index, field, behaviorSurface, expectedKind) {
	if (typeof entry === "string") {
		return normalizeDimension({ id: entry }, index, field, behaviorSurface, expectedKind);
	}
	if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
		throw new Error(`${field}[${index}] must be a product-owned dimension id or object`);
	}
	const id = normalizeNonEmptyString(entry.id, `${field}[${index}].id`);
	const catalogEntry = BEHAVIOR_DIMENSION_CATALOG[id];
	if (!catalogEntry) {
		throw new Error(`dimension id must be one of: ${Object.keys(BEHAVIOR_DIMENSION_CATALOG).join(", ")}`);
	}
	if (catalogEntry.kind !== expectedKind) {
		throw new Error(`${field}[${index}] must use a ${expectedKind} dimension id`);
	}
	if (!catalogEntry.surfaces.includes(behaviorSurface)) {
		throw new Error(`${field}[${index}] is not allowed for behaviorSurface ${behaviorSurface}`);
	}
	if (entry.summary !== undefined) {
		const summary = normalizeNonEmptyString(entry.summary, `${field}[${index}].summary`);
		if (summary !== catalogEntry.summary) {
			throw new Error(`${field}[${index}].summary must match the product-owned catalog summary for ${id}`);
		}
	}
	return {
		id,
		summary: catalogEntry.summary,
	};
}

function normalizeDimensions(entries, field, behaviorSurface, expectedKind, defaultEntries = []) {
	if (entries === undefined || entries === null) {
		return normalizeDimensions(defaultEntries, field, behaviorSurface, expectedKind, []);
	}
	if (!Array.isArray(entries)) {
		throw new Error(`${field} must be an array`);
	}
	const normalized = entries.map((entry, index) =>
		normalizeDimension(entry, index, field, behaviorSurface, expectedKind),
	);
	if (expectedKind === DIMENSION_KIND_SUCCESS && normalized.length === 0) {
		throw new Error(`${field} must include at least one success dimension`);
	}
	return normalized;
}

function chooseSuccessEntries(intentProfile, defaultSuccessDimensions, behaviorSurface) {
	if (Array.isArray(intentProfile?.successDimensions) && intentProfile.successDimensions.length > 0) {
		return intentProfile.successDimensions;
	}
	if (Array.isArray(defaultSuccessDimensions) && defaultSuccessDimensions.length > 0) {
		return defaultSuccessDimensions;
	}
	return buildCatalogDimensions(DEFAULT_SUCCESS_DIMENSIONS_BY_SURFACE[behaviorSurface] || []);
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
	const raw = intentProfile?.behaviorSurface !== undefined
		? normalizeNonEmptyString(intentProfile.behaviorSurface, "intentProfile.behaviorSurface")
		: normalizeNonEmptyString(fallbackBehaviorSurface, "fallbackBehaviorSurface");
	const value = DEPRECATED_BEHAVIOR_SURFACE_ALIASES[raw] ?? raw;
	if (!KNOWN_BEHAVIOR_SURFACES.has(value)) {
		throw new Error(`behaviorSurface must be one of: ${[...KNOWN_BEHAVIOR_SURFACES].join(", ")}`);
	}
	return value;
}

export function buildBehaviorIntentProfile({
	intent,
	intentProfile,
	fallbackBehaviorSurface = "operator_behavior",
	defaultSuccessDimensions = [],
	defaultGuardrailDimensions = [],
} = {}) {
	const summary = normalizeNonEmptyString(intentProfile?.summary ?? intent, "intent");
	const behaviorSurface = resolveBehaviorSurface(intentProfile, fallbackBehaviorSurface);
	return {
		schemaVersion: BEHAVIOR_INTENT_SCHEMA,
		intentId: resolveIntentId(intentProfile, summary),
		summary,
		behaviorSurface,
		successDimensions: normalizeDimensions(
			chooseSuccessEntries(intentProfile, defaultSuccessDimensions, behaviorSurface),
			"intentProfile.successDimensions",
			behaviorSurface,
			DIMENSION_KIND_SUCCESS,
		),
		guardrailDimensions: normalizeDimensions(
			chooseGuardrailEntries(intentProfile, defaultGuardrailDimensions),
			"intentProfile.guardrailDimensions",
			behaviorSurface,
			DIMENSION_KIND_GUARDRAIL,
		),
	};
}
