const LOCAL_SITE_URL = 'http://localhost:3002';
const LOCAL_APP_ORIGIN = 'http://localhost:3000';

function httpOrigin(value: string | undefined, fallback: string): string {
	const raw = value?.trim() || fallback;
	const url = new URL(raw);
	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		throw new Error('Public site URLs must use http or https');
	}
	if (url.username || url.password || url.search || url.hash) {
		throw new Error('Public site URLs must be origins');
	}
	return url.origin;
}

/** Marketing site origin. Baked in at `next build`. */
export function siteUrl(): string {
	return httpOrigin(process.env.NEXT_PUBLIC_SITE_URL, LOCAL_SITE_URL);
}

/** Authenticated application origin. Sign-in links point here. */
export function appOrigin(): string {
	return httpOrigin(process.env.NEXT_PUBLIC_APP_ORIGIN, LOCAL_APP_ORIGIN);
}

/**
 * API origin the sign-in wake ping targets (FE-049). Build-time. Unset means no ping, so there is
 * no local default.
 */
export function apiOrigin(): string | null {
	const raw = process.env.NEXT_PUBLIC_API_ORIGIN?.trim();
	return raw ? httpOrigin(raw, raw) : null;
}

export function appLoginHref(): string {
	return `${appOrigin()}/login`;
}

export const MARKETING_PATHS = [
	'/',
	'/platform',
	'/platform/patient-management',
	'/platform/appointments',
	'/platform/telehealth',
	'/platform/billing',
	'/platform/analytics',
	'/platform/administration',
	'/security',
	'/about',
	'/architecture',
	'/demo',
] as const;

/** Absolute URL for a marketing path, with the trailing slash static export uses. */
export function absoluteMarketingUrl(path: string): string {
	const normalized = path === '/' ? '/' : path.endsWith('/') ? path : `${path}/`;
	return new URL(normalized, `${siteUrl()}/`).toString();
}
