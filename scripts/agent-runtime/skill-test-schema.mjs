export function baseSchema(evaluationKind) {
	if (evaluationKind === "trigger") {
		return {
			type: "object",
			additionalProperties: false,
			required: ["invoked", "summary"],
			properties: {
				invoked: { type: "boolean" },
				summary: { type: "string" },
			},
		};
	}
	return {
		type: "object",
		additionalProperties: false,
		required: ["invoked", "summary", "outcome"],
		properties: {
			invoked: { type: "boolean" },
			summary: { type: "string" },
			outcome: { type: "string", enum: ["passed", "failed", "degraded", "blocked"] },
		},
	};
}
