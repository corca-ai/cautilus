export const TELEMETRY_STRING_FIELDS = [
	"provider",
	"model",
	"request_kind",
	"source_flow",
	"cache_policy",
	"static_context_id",
	"cost_truth",
	"pricing_source",
	"pricing_version",
];

export const TELEMETRY_NUMERIC_FIELDS = [
	"uncached_input_tokens",
	"cache_creation_input_tokens",
	"cache_read_input_tokens",
	"cached_input_tokens",
	"prompt_tokens",
	"output_tokens",
	"reasoning_output_tokens",
	"completion_tokens",
	"total_tokens",
	"cost_usd",
	"retry_count",
	"tool_call_count",
];
