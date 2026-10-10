export type ErrorDetail = {
	path: string;
	message: string;
};

export type ErrorBody = {
	code: string;
	message: string;
	/** Field issues for validation errors, or a code-specific object such as `{retryAfterSeconds}`. */
	details?: ErrorDetail[] | Record<string, unknown>;
};

export type ErrorEnvelope = {
	error: ErrorBody;
	correlationId: string;
};

export function isErrorBody(value: unknown): value is ErrorBody {
	if (typeof value !== 'object' || value === null) {
		return false;
	}
	const record = value as Record<string, unknown>;
	return typeof record.code === 'string' && typeof record.message === 'string';
}

export function toErrorEnvelope(
	correlationId: string,
	error: ErrorBody,
): ErrorEnvelope {
	const details = error.details;
	const hasDetails = Array.isArray(details)
		? details.length > 0
		: details !== undefined && Object.keys(details).length > 0;
	if (hasDetails) {
		return {error, correlationId};
	}
	return {
		error: {code: error.code, message: error.message},
		correlationId,
	};
}
