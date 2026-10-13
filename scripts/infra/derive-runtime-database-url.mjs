/**
 * Build the runtime `medconnect_app` URL from the owner URL and the app-role password.
 * Does not log either URL or the password.
 */

export function deriveRuntimeDatabaseUrl(adminUrl, password) {
	const appRolePassword = String(password ?? '').trim();
	if (!appRolePassword) {
		throw new Error('APP_ROLE_PASSWORD is required');
	}

	let parsed;
	try {
		parsed = new URL(adminUrl);
	} catch {
		throw new Error('DATABASE_ADMIN_URL must be a PostgreSQL connection URL');
	}

	if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
		throw new Error('DATABASE_ADMIN_URL must be a PostgreSQL connection URL');
	}

	let username = '';
	try {
		username = decodeURIComponent(parsed.username);
	} catch {
		throw new Error('DATABASE_ADMIN_URL username is required');
	}
	if (!username) {
		throw new Error('DATABASE_ADMIN_URL username is required');
	}
	if (username === 'medconnect_app') {
		throw new Error('DATABASE_ADMIN_URL must not use the medconnect_app runtime role');
	}

	parsed.username = 'medconnect_app';
	parsed.password = appRolePassword;
	return parsed.toString();
}
