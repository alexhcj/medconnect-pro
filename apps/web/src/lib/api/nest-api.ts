/** Nest API origin used when mocks are off. */
export function nestApiBaseUrl(): string {
	const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
	const base = configured ? configured : 'http://localhost:3001';
	return base.replace(/\/$/, '');
}
