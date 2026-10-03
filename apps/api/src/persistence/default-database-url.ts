/** Runtime Nest role (`medconnect_app`). Subject to RLS. Demo credentials only. */
export const DEFAULT_DATABASE_URL =
	'postgresql://medconnect_app:medconnect_app@127.0.0.1:5432/medconnect';

/** Table owner for migrations, seed, and test fixtures. Demo credentials only. */
export const DEFAULT_DATABASE_ADMIN_URL =
	'postgresql://medconnect:medconnect@127.0.0.1:5432/medconnect';

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

function normalizePostgresScheme(url: string): string {
	return url.replace(/^postgres:/i, 'postgresql:');
}

/** True when a URL is the local Compose demo (host or known Compose user/password). */
export function isKnownLocalComposeDatabaseUrl(url: string): boolean {
	let parsed: URL;
	try {
		parsed = new URL(normalizePostgresScheme(url));
	} catch {
		return false;
	}

	const host = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
	if (LOCAL_HOSTS.has(host)) {
		return true;
	}

	const user = decodeURIComponent(parsed.username);
	const password = decodeURIComponent(parsed.password);
	if (
		(user === 'medconnect_app' && password === 'medconnect_app') ||
		(user === 'medconnect' && password === 'medconnect')
	) {
		return true;
	}

	const withoutQuery = normalizePostgresScheme(url).split('?')[0] ?? '';
	return withoutQuery === DEFAULT_DATABASE_URL || withoutQuery === DEFAULT_DATABASE_ADMIN_URL;
}

/** Username from a PostgreSQL URL, or undefined when the URL cannot be parsed. */
export function postgresUrlUsername(url: string): string | undefined {
	try {
		const parsed = new URL(normalizePostgresScheme(url));
		if (!parsed.username) {
			return undefined;
		}
		return decodeURIComponent(parsed.username);
	} catch {
		return undefined;
	}
}

export function resolveDatabaseUrl(): string {
	return process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
}

export function resolveAdminDatabaseUrl(): string {
	return process.env.DATABASE_ADMIN_URL ?? DEFAULT_DATABASE_ADMIN_URL;
}
