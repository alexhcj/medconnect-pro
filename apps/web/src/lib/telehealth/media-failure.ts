import {ApiError, RateLimitedError} from '@/lib/api/http';

export type DailyMediaFailureKind =
	| 'none'
	| 'permission'
	| 'no_device'
	| 'media_unavailable'
	| 'rate_limited'
	| 'generic';

export function classifyDailyMediaFailure(error: unknown): DailyMediaFailureKind {
	if (error instanceof RateLimitedError) {
		return 'rate_limited';
	}
	if (error instanceof ApiError && error.status === 502) {
		return 'media_unavailable';
	}
	const name = error && typeof error === 'object' && 'name' in error ? String((error as {name: unknown}).name) : '';
	if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
		return 'permission';
	}
	if (name === 'NotFoundError' || name === 'OverconstrainedError') {
		return 'no_device';
	}
	const message = error instanceof Error ? error.message : String(error ?? '');
	if (/notallowed|permission/i.test(message)) {
		return 'permission';
	}
	if (/notfound|requested device not found|no device/i.test(message)) {
		return 'no_device';
	}
	return 'generic';
}

export const DAILY_MEDIA_FAILURE_COPY: Record<Exclude<DailyMediaFailureKind, 'none'>, string> = {
	permission: 'Camera or microphone access was denied. Allow access and retry.',
	no_device: 'No camera or microphone was found. Connect a device and retry.',
	media_unavailable: 'Live media is currently unavailable.',
	rate_limited: 'Too many attempts. Try again later.',
	generic: 'Live media is currently unavailable.',
};
