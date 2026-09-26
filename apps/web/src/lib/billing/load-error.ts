import {ApiError} from '@/lib/api/http';

export function billingLoadErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof ApiError && error.message) {
		return error.message;
	}
	return fallback;
}
