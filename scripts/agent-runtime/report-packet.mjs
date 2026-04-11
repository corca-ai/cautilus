import { BEHAVIOR_INTENT_SCHEMA, REPORT_PACKET_SCHEMA } from "./contract-versions.mjs";
import { buildBehaviorIntentProfile } from "./behavior-intent.mjs";

function normalizeNonEmptyString(value, field) {
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(`${field} must be a non-empty string`);
	}
	return value.trim();
}

function failLegacySchemaVersion(schemaVersion) {
	if (schemaVersion === "cautilus.report_packet.v1") {
		throw new Error(
			`report file uses legacy schemaVersion cautilus.report_packet.v1; rebuild it as ${REPORT_PACKET_SCHEMA} with \`cautilus report build\` and update any checked-in fixtures`,
		);
	}
}

export function validateReportPacket(packet, { label = "report file" } = {}) {
	if (!packet || typeof packet !== "object" || Array.isArray(packet)) {
		throw new Error(`${label} must be a JSON object`);
	}
	failLegacySchemaVersion(packet.schemaVersion);
	if (packet.schemaVersion !== REPORT_PACKET_SCHEMA) {
		throw new Error(`${label} must use schemaVersion ${REPORT_PACKET_SCHEMA}`);
	}

	normalizeNonEmptyString(packet.generatedAt, `${label}.generatedAt`);
	normalizeNonEmptyString(packet.candidate, `${label}.candidate`);
	normalizeNonEmptyString(packet.baseline, `${label}.baseline`);
	const intent = normalizeNonEmptyString(packet.intent, `${label}.intent`);
	normalizeNonEmptyString(packet.recommendation, `${label}.recommendation`);

	if (!packet.intentProfile || typeof packet.intentProfile !== "object" || Array.isArray(packet.intentProfile)) {
		throw new Error(`${label}.intentProfile must be an object`);
	}
	if (packet.intentProfile.schemaVersion !== BEHAVIOR_INTENT_SCHEMA) {
		throw new Error(`${label}.intentProfile.schemaVersion must be ${BEHAVIOR_INTENT_SCHEMA}`);
	}
	const summary = normalizeNonEmptyString(packet.intentProfile.summary, `${label}.intentProfile.summary`);
	if (summary !== intent) {
		throw new Error(`${label}.intentProfile.summary must exactly match ${label}.intent`);
	}
	buildBehaviorIntentProfile({
		intent: summary,
		intentProfile: packet.intentProfile,
	});

	return packet;
}
