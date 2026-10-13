/**
 * Nest API origin used when mocks are off.
 * An absolute URL calls the API directly (local and AWS). A path such as `/mcp-api`
 * stays on this web origin and is proxied by the App Router handler.
 */
export function nestApiBaseUrl(): string {
	const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
	const base = configured ? configured : 'http://localhost:3001';
	return base.replace(/\/$/, '');
}
