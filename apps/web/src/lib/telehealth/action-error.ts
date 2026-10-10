import {ApiError, RateLimitedError, rateLimitMessage} from '@/lib/api/http';

const SURFACED_STATUSES = new Set([400, 403, 409, 429, 502]);

export function telehealthActionErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof RateLimitedError) {
		return rateLimitMessage(error);
	}
	if (!(error instanceof ApiError) || !SURFACED_STATUSES.has(error.status)) {
		return fallback;
	}
	const detail = error.details?.[0]?.message;
	if (detail) {
		return detail;
	}
	return error.message || fallback;
}
