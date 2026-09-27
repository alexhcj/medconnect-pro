/** Runtime Nest role (`medconnect_app`). Subject to RLS. Demo credentials only. */
export const DEFAULT_DATABASE_URL =
	'postgresql://medconnect_app:medconnect_app@127.0.0.1:5432/medconnect';

/** Table owner for migrations, seed, and test fixtures. Demo credentials only. */
export const DEFAULT_DATABASE_ADMIN_URL =
	'postgresql://medconnect:medconnect@127.0.0.1:5432/medconnect';

export function resolveDatabaseUrl(): string {
	return process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
}

export function resolveAdminDatabaseUrl(): string {
	return process.env.DATABASE_ADMIN_URL ?? DEFAULT_DATABASE_ADMIN_URL;
}
