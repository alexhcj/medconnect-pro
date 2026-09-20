export class ApiError extends Error {
	status: number;

	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
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
			window.location.href = '/login?reason=unauthorized';
		}
		throw new ApiError('Unauthorized', 401);
	}

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new ApiError(
			(errorData as {error?: string}).error || 'Request failed',
			response.status,
		);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}
