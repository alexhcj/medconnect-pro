import {loginUrl} from '@/lib/auth/paths';
import {nestApiBaseUrl} from '@/lib/api/nest-api';

export interface ApiErrorDetail {
	path: string;
	message: string;
}

export class ApiError extends Error {
	status: number;
	code?: string;
	details?: ApiErrorDetail[];

	constructor(
		message: string,
		status: number,
		options?: {code?: string; details?: ApiErrorDetail[]},
	) {
		super(message);
		this.status = status;
		this.code = options?.code;
		this.details = options?.details;
	}
}

export class RateLimitedError extends ApiError {
	retryAfterSeconds?: number;

	constructor(retryAfterSeconds?: number) {
		super('Too many attempts', 429, {code: 'RATE_LIMITED'});
		this.retryAfterSeconds = retryAfterSeconds;
	}
}

export function rateLimitMessage(error: RateLimitedError): string {
	const seconds = error.retryAfterSeconds;
	if (!seconds) {
		return 'Too many attempts. Try again later.';
	}
	return `Too many attempts. Try again in ${seconds} ${seconds === 1 ? 'second' : 'seconds'}.`;
}

export type ServiceWakingReason = 'gateway' | 'network' | 'timeout';

/**
 * The API is asleep or unreachable (free-tier spin-down, ADR-017), as opposed to answering with a
 * real error. Covers a 502/503/504 without an API error envelope, a network failure and a timeout
 * (FE-049).
 */
export class ServiceWakingError extends ApiError {
	reason: ServiceWakingReason;

	constructor(reason: ServiceWakingReason, status = 503) {
		super('Server is waking up', status, {code: 'SERVICE_WAKING'});
		this.reason = reason;
	}
}

const WAKE_STATUSES = new Set([502, 503, 504]);
/** Longer than a normal sign-in, shorter than the 45-60 s cold start, so the form can queue. */
export const LIVE_AUTH_TIMEOUT_MS = 30_000;

function hasErrorEnvelope(body: unknown): boolean {
	const error = body && typeof body === 'object' ? (body as {error?: unknown}).error : undefined;
	return (
		!!error && typeof error === 'object' && typeof (error as {code?: unknown}).code === 'string'
	);
}

/** A gateway status with no API error envelope is a wake. An enveloped 5xx is a real error. */
export function wakeErrorFromBody(body: unknown, status: number): ServiceWakingError | undefined {
	if (WAKE_STATUSES.has(status) && !hasErrorEnvelope(body)) {
		return new ServiceWakingError('gateway', status);
	}
	return undefined;
}

/** Wake error when the response is one, otherwise the usual API error. */
export function errorFromResponseBody(body: unknown, status: number): ApiError {
	return wakeErrorFromBody(body, status) ?? apiErrorFromBody(body, status);
}

/** `fetch` that reports a network failure or timeout as a `ServiceWakingError`. */
export async function liveFetch(
	input: string,
	init: RequestInit,
	timeoutMs: number = LIVE_AUTH_TIMEOUT_MS,
): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(input, {...init, signal: controller.signal});
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') {
			throw new ServiceWakingError('timeout', 504);
		}
		if (error instanceof TypeError) {
			throw new ServiceWakingError('network');
		}
		throw error;
	} finally {
		clearTimeout(timer);
	}
}

function readRetryAfterSeconds(details: unknown): number | undefined {
	if (!details || typeof details !== 'object' || Array.isArray(details)) {
		return undefined;
	}
	const value = (details as {retryAfterSeconds?: unknown}).retryAfterSeconds;
	if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
		return undefined;
	}
	return Math.ceil(value);
}

const CSRF_COOKIE_NAME = 'mcp_csrf';
export const CSRF_HEADER_NAME = 'X-CSRF-Token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function readDetails(value: unknown): ApiErrorDetail[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}

	const details = value.flatMap((item) => {
		if (!item || typeof item !== 'object') {
			return [];
		}
		const detail = item as {path?: unknown; message?: unknown};
		if (typeof detail.path !== 'string' || typeof detail.message !== 'string') {
			return [];
		}
		return [{path: detail.path, message: detail.message}];
	});

	return details.length > 0 ? details : undefined;
}

export function apiErrorFromBody(body: unknown, status: number): ApiError {
	const envelope =
		body && typeof body === 'object' ? (body as {error?: unknown}).error : undefined;
	const envelopeObject =
		envelope && typeof envelope === 'object'
			? (envelope as {code?: unknown; details?: unknown})
			: undefined;
	if (status === 429 || envelopeObject?.code === 'RATE_LIMITED') {
		return new RateLimitedError(readRetryAfterSeconds(envelopeObject?.details));
	}

	if (!body || typeof body !== 'object') {
		return new ApiError('Request failed', status);
	}

	const error = (body as {error?: unknown}).error;
	if (typeof error === 'string' && error) {
		return new ApiError(error, status);
	}

	if (error && typeof error === 'object') {
		const envelope = error as {code?: unknown; message?: unknown; details?: unknown};
		const message =
			typeof envelope.message === 'string' && envelope.message
				? envelope.message
				: 'Request failed';
		const code = typeof envelope.code === 'string' ? envelope.code : undefined;
		return new ApiError(message, status, {code, details: readDetails(envelope.details)});
	}

	return new ApiError('Request failed', status);
}

function isMutatingMethod(method: string): boolean {
	return !SAFE_METHODS.has(method.toUpperCase());
}

function readCsrfCookie(): string | null {
	if (typeof document === 'undefined') {
		return null;
	}
	const prefix = `${CSRF_COOKIE_NAME}=`;
	for (const part of document.cookie.split(';')) {
		const trimmed = part.trim();
		if (!trimmed.startsWith(prefix)) {
			continue;
		}
		const raw = trimmed.slice(prefix.length);
		try {
			return decodeURIComponent(raw);
		} catch {
			return raw;
		}
	}
	return null;
}

export function liveRequestInit(init?: RequestInit): RequestInit {
	const headers = new Headers(init?.headers);
	const method = init?.method ?? 'GET';

	if (isMutatingMethod(method) && !headers.has('Content-Type')) {
		headers.set('Content-Type', 'application/json');
	}

	if (isMutatingMethod(method) && !headers.has(CSRF_HEADER_NAME)) {
		const csrf = readCsrfCookie();
		if (csrf) {
			headers.set(CSRF_HEADER_NAME, csrf);
		}
	}

	return {
		...init,
		credentials: 'include',
		headers,
	};
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(path, liveRequestInit(init));

	if (response.status === 401) {
		if (typeof window !== 'undefined' && path.startsWith(nestApiBaseUrl())) {
			window.location.href = loginUrl('unauthorized');
		}
		throw new ApiError('Unauthorized', 401);
	}

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw apiErrorFromBody(errorData, response.status);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}
