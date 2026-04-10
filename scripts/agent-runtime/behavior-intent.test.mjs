import assert from "node:assert/strict";
import test from "node:test";

import { BEHAVIOR_SURFACES, buildBehaviorIntentProfile } from "./behavior-intent.mjs";

test("buildBehaviorIntentProfile accepts known product-owned behavior surfaces", () => {
	const profile = buildBehaviorIntentProfile({
		intent: "Explain the next operator step clearly.",
		intentProfile: {
			summary: "Explain the next operator step clearly.",
			behaviorSurface: BEHAVIOR_SURFACES.OPERATOR_CLI,
		},
	});
	assert.equal(profile.behaviorSurface, BEHAVIOR_SURFACES.OPERATOR_CLI);
});

test("buildBehaviorIntentProfile uses the fallback surface when no explicit surface is provided", () => {
	const profile = buildBehaviorIntentProfile({
		intent: "Keep the general operator behavior legible.",
	});
	assert.equal(profile.behaviorSurface, BEHAVIOR_SURFACES.OPERATOR_BEHAVIOR);
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
