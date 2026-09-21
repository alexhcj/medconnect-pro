export type ErrorDetail = {
	path: string;
	message: string;
};

export type ErrorBody = {
	code: string;
	message: string;
	details?: ErrorDetail[];
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
	if (error.details && error.details.length > 0) {
		return {error, correlationId};
	}
	return {
		error: {code: error.code, message: error.message},
		correlationId,
	};
}
