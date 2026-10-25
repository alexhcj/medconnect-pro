import {nestApiBaseUrl} from '@/lib/api/nest-api';

/** Longer than a healthy answer, short enough to retry while a sleeping API boots (FE-049). */
export const HEALTH_PROBE_TIMEOUT_MS = 8000;

/**
 * Readable liveness probe for the status indicator. Unauthenticated and cookieless. `true` only
 * for a 200 from `/health`; any failure, timeout or gateway error is `false`.
 */
export async function checkApiHealth(signal?: AbortSignal): Promise<boolean> {
	const timeout = AbortSignal.timeout(HEALTH_PROBE_TIMEOUT_MS);
	try {
		const response = await fetch(`${nestApiBaseUrl()}/health`, {
			method: 'GET',
			credentials: 'omit',
			cache: 'no-store',
			signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
		});
		return response.ok;
	} catch {
		return false;
	}
}
