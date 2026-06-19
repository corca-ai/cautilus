import assert from "node:assert/strict";
import test from "node:test";

import {
	BEHAVIOR_DIMENSIONS,
	BEHAVIOR_SURFACES,
	buildBehaviorIntentProfile,
} from "./behavior-intent.mjs";

test("buildBehaviorIntentProfile accepts known product-owned behavior surfaces", () => {
	const profile = buildBehaviorIntentProfile({
		intent: "Explain the next operator step clearly.",
		intentProfile: {
			summary: "Explain the next operator step clearly.",
			behaviorSurface: BEHAVIOR_SURFACES.OPERATOR_BEHAVIOR,
			successDimensions: [BEHAVIOR_DIMENSIONS.RECOVERY_NEXT_STEP],
		},
	});
	assert.equal(profile.behaviorSurface, BEHAVIOR_SURFACES.OPERATOR_BEHAVIOR);
	assert.equal(profile.successDimensions[0].id, BEHAVIOR_DIMENSIONS.RECOVERY_NEXT_STEP);
});

test("buildBehaviorIntentProfile uses the fallback surface when no explicit surface is provided", () => {
	const profile = buildBehaviorIntentProfile({
		intent: "Keep the general operator behavior legible.",
	});
	assert.equal(profile.behaviorSurface, BEHAVIOR_SURFACES.OPERATOR_BEHAVIOR);
	assert.equal(profile.successDimensions[0].id, BEHAVIOR_DIMENSIONS.OPERATOR_GUIDANCE_CLARITY);
});

test("buildBehaviorIntentProfile accepts artifact fidelity with its guardrail", () => {
	const profile = buildBehaviorIntentProfile({
		intent: "Resolve the artifact URL before saying it is unavailable.",
		intentProfile: {
			summary: "Resolve the artifact URL before saying it is unavailable.",
			behaviorSurface: BEHAVIOR_SURFACES.ARTIFACT_FIDELITY,
			guardrailDimensions: [BEHAVIOR_DIMENSIONS.NO_PREMATURE_CAPABILITY_DENIAL],
		},
	});
	assert.equal(profile.behaviorSurface, BEHAVIOR_SURFACES.ARTIFACT_FIDELITY);
	assert.equal(profile.successDimensions[0].id, BEHAVIOR_DIMENSIONS.ARTIFACT_URL_RESOLUTION);
	assert.equal(profile.guardrailDimensions[0].id, BEHAVIOR_DIMENSIONS.NO_PREMATURE_CAPABILITY_DENIAL);
});

test("buildBehaviorIntentProfile rejects behavior surfaces outside the product-owned catalog", () => {
	assert.throws(
		() =>
			buildBehaviorIntentProfile({
				intent: "Reject an unknown catalog value.",
				intentProfile: {
					summary: "Reject an unknown catalog value.",
					behaviorSurface: "custom_host_surface",
				},
			}),
		/behaviorSurface must be one of:/,
	);
});

test("buildBehaviorIntentProfile rejects dimensions outside the product-owned catalog", () => {
	assert.throws(
		() =>
			buildBehaviorIntentProfile({
				intent: "Reject an unknown dimension id.",
				intentProfile: {
					summary: "Reject an unknown dimension id.",
					behaviorSurface: BEHAVIOR_SURFACES.OPERATOR_BEHAVIOR,
					successDimensions: [{ id: "custom_dimension" }],
				},
			}),
		/dimension id must be one of:/,
	);
});

test("buildBehaviorIntentProfile rejects dimensions that do not match the surface catalog", () => {
	assert.throws(
		() =>
			buildBehaviorIntentProfile({
				intent: "Do not allow review-only dimensions on generic operator surfaces.",
				intentProfile: {
					summary: "Do not allow review-only dimensions on generic operator surfaces.",
					behaviorSurface: BEHAVIOR_SURFACES.OPERATOR_BEHAVIOR,
					successDimensions: [BEHAVIOR_DIMENSIONS.REVIEW_EVIDENCE_LEGIBILITY],
				},
			}),
		/is not allowed for behaviorSurface operator_behavior/,
	);
});
