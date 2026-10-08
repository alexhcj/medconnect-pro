import {ApiError} from '@/lib/api/http';

const SURFACED_STATUSES = new Set([400, 409, 502]);

export function telehealthActionErrorMessage(error: unknown, fallback: string): string {
	if (!(error instanceof ApiError) || !SURFACED_STATUSES.has(error.status)) {
		return fallback;
	}
	const detail = error.details?.[0]?.message;
	if (detail) {
		return detail;
	}
	return error.message || fallback;
}
