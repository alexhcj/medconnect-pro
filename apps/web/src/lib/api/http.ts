import {loginUrl} from '@/lib/auth/paths';

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

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
	const headers = new Headers(init?.headers);
	if (!headers.has('Authorization')) {
		const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
		if (token) {
			headers.set('Authorization', `Bearer ${token}`);
		}
	}

	const response = await fetch(path, {
		...init,
		headers,
	});

	if (response.status === 401) {
		if (typeof window !== 'undefined') {
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
