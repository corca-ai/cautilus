function isObjectRecord(value) {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyString(value, field, errors) {
	if (value === undefined || value === null) {
		return null;
	}
	if (typeof value !== "string" || !value.trim()) {
		errors.push(`${field} must be a non-empty string`);
		return null;
	}
	return value.trim();
}

function optionalString(value, field, errors) {
	if (value === undefined || value === null) {
		return null;
	}
	return nonEmptyString(value, field, errors);
}

function stringList(value, field, errors) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
		errors.push(`${field} must be a list of strings`);
		return null;
	}
	return [...value];
}

function validateStringMapping(value, field, errors) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!isObjectRecord(value)) {
		errors.push(`${field} must be a mapping of strings`);
		return null;
	}
	const normalized = {};
	for (const [key, rawValue] of Object.entries(value)) {
		const trimmedKey = String(key ?? "").trim();
		if (!trimmedKey) {
			errors.push(`${field} keys must be non-empty`);
			continue;
		}
		const path = nonEmptyString(rawValue, `${field}.${trimmedKey}`, errors);
		if (path !== null) {
			normalized[trimmedKey] = path;
		}
	}
	return normalized;
}

function validateExplicitInstanceDiscoveryInstance(item, index, errors) {
	if (!isObjectRecord(item)) {
		errors.push(`instance_discovery.instances[${index}] must be a mapping`);
		return null;
	}
	const instance = {};
	copyRequiredInstanceField(item.id, `instance_discovery.instances[${index}].id`, "id", errors, instance);
	copyRequiredInstanceField(
		item.display_label,
		`instance_discovery.instances[${index}].display_label`,
		"display_label",
		errors,
		instance,
	);
	copyOptionalInstanceField(item.description, `instance_discovery.instances[${index}].description`, "description", errors, instance);
	copyOptionalInstanceField(item.data_root, `instance_discovery.instances[${index}].data_root`, "data_root", errors, instance);
	const paths = validateStringMapping(item.paths, `instance_discovery.instances[${index}].paths`, errors);
	if (paths !== null && Object.keys(paths).length > 0) {
		instance.paths = paths;
	}
	if (!instance.data_root && !instance.paths) {
		errors.push(`instance_discovery.instances[${index}] must include data_root, paths, or both`);
	}
	return instance;
}

function copyRequiredInstanceField(value, field, targetKey, errors, instance) {
	const normalized = nonEmptyString(value, field, errors);
	if (normalized !== null) {
		instance[targetKey] = normalized;
	}
}

function copyOptionalInstanceField(value, field, targetKey, errors, instance) {
	const normalized = optionalString(value, field, errors);
	if (normalized !== null) {
		instance[targetKey] = normalized;
	}
}

function normalizeDiscoveryPrerequisites(value, errors, instanceDiscovery) {
	const prerequisites = stringList(
		value.required_prerequisites,
		"instance_discovery.required_prerequisites",
		errors,
	);
	if (prerequisites !== null) {
		instanceDiscovery.required_prerequisites = prerequisites;
	}
}

function validateCommandDiscovery(value, errors, instanceDiscovery) {
	const commandTemplate = nonEmptyString(
		value.command_template,
		"instance_discovery.command_template",
		errors,
	);
	if (commandTemplate !== null) {
		instanceDiscovery.command_template = commandTemplate;
	}
	if (value.instances !== undefined && value.instances !== null) {
		errors.push("instance_discovery.instances is only allowed when kind=explicit");
	}
	return instanceDiscovery;
}

function validateExplicitDiscovery(value, errors, instanceDiscovery) {
	if (value.command_template !== undefined && value.command_template !== null) {
		errors.push("instance_discovery.command_template is only allowed when kind=command");
	}
	if (!Array.isArray(value.instances) || value.instances.length === 0) {
		errors.push("instance_discovery.instances must be a non-empty list when kind=explicit");
		return instanceDiscovery;
	}
	instanceDiscovery.instances = value.instances
		.map((item, index) => validateExplicitInstanceDiscoveryInstance(item, index, errors))
		.filter(Boolean);
	return instanceDiscovery;
}

export function validateInstanceDiscovery(value, errors) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!isObjectRecord(value)) {
		errors.push("instance_discovery must be a mapping");
		return null;
	}
	const instanceDiscovery = {};
	const kind = nonEmptyString(value.kind, "instance_discovery.kind", errors);
	if (kind === null) {
		return null;
	}
	if (kind !== "explicit" && kind !== "command") {
		errors.push("instance_discovery.kind must be one of: explicit, command");
		return null;
	}
	instanceDiscovery.kind = kind;
	normalizeDiscoveryPrerequisites(value, errors, instanceDiscovery);
	return kind === "command"
		? validateCommandDiscovery(value, errors, instanceDiscovery)
		: validateExplicitDiscovery(value, errors, instanceDiscovery);
}

export function validateLiveRunInvocation(value, errors) {
	if (value === undefined || value === null) {
		return null;
	}
	if (!isObjectRecord(value)) {
		errors.push("live_run_invocation must be a mapping");
		return null;
	}
	const liveRunInvocation = {};
	copyRequiredInstanceField(
		value.command_template,
		"live_run_invocation.command_template",
		"command_template",
		errors,
		liveRunInvocation,
	);
	copyOptionalInstanceField(
		value.consumer_command_template,
		"live_run_invocation.consumer_command_template",
		"consumer_command_template",
		errors,
		liveRunInvocation,
	);
	const prerequisites = stringList(
		value.required_prerequisites,
		"live_run_invocation.required_prerequisites",
		errors,
	);
	if (prerequisites !== null) {
		liveRunInvocation.required_prerequisites = prerequisites;
	}
	return liveRunInvocation;
}
