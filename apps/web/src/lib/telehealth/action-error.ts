import {ApiError} from '@/lib/api/http';

export function telehealthActionErrorMessage(error: unknown, fallback: string): string {
	if (!(error instanceof ApiError) || (error.status !== 409 && error.status !== 400)) {
		return fallback;
	}
	const detail = error.details?.[0]?.message;
	if (detail) {
		return detail;
	}
	return error.message || fallback;
}
