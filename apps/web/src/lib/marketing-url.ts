/**
 * Public marketing site URL for the auth pages (FE-050). Marketing is a separate app and origin,
 * so the target is configuration. Returns null unless NEXT_PUBLIC_MARKETING_URL is an http(s) URL;
 * the auth header then renders as plain branding with no link.
 */
export function getMarketingUrl(): string | null {
	const raw = process.env.NEXT_PUBLIC_MARKETING_URL;
	if (!raw) return null;
	try {
		const url = new URL(raw);
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
	} catch {
		return null;
	}
}
