#!/usr/bin/env node
/**
 * Ensure hosted role `medconnect_app` exists with the generated password.
 *
 * Run as table owner through the SSM tunnel. Leave APP_ENV unset (local).
 * Hosted Nest fail-closed rejects localhost URLs when APP_ENV is preview/production.
 *
 * Does not rewrite migration 1760000000007. CREATE ROLE IF missing, then ALTER PASSWORD
 * so a first migrate that used the Compose password is repaired.
 */

import path from 'node:path';
import {fileURLToPath} from 'node:url';

const APP_ROLE = 'medconnect_app';

export function requireEnv(name, env = process.env) {
	const value = env[name];
	if (value === undefined || value === '') {
		throw new Error(`${name} is required`);
	}
	return value;
}

/** SQL string literal. Identifiers stay hardcoded (`medconnect_app`). */
export function sqlStringLiteral(value) {
	return `'${String(value).replaceAll("'", "''")}'`;
}

export function buildEnsureAppRoleSql(password) {
	const quotedPassword = sqlStringLiteral(password);
	return [
		`
DO $$
BEGIN
	IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${APP_ROLE}') THEN
		CREATE ROLE ${APP_ROLE} LOGIN PASSWORD ${quotedPassword}
			NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
	END IF;
END
$$;
`.trim(),
		`ALTER ROLE ${APP_ROLE} PASSWORD ${quotedPassword};`,
	];
}

export function postgresSslConfig(tlsServername) {
	if (!tlsServername) {
		return undefined;
	}
	return {
		rejectUnauthorized: true,
		servername: tlsServername,
	};
}

export async function ensureAppRole({adminUrl, password, tlsServername}) {
	const ssl = postgresSslConfig(tlsServername);
	const pg = await import('pg');
	const Client = pg.default?.Client ?? pg.Client;
	const client = new Client({
		connectionString: adminUrl,
		...(ssl ? {ssl} : {}),
	});
	await client.connect();
	try {
		for (const statement of buildEnsureAppRoleSql(password)) {
			await client.query(statement);
		}
	} finally {
		await client.end();
	}
}

async function main() {
	const adminUrl = requireEnv('DATABASE_ADMIN_URL');
	const password = requireEnv('APP_ROLE_PASSWORD');
	const tlsServername = process.env.RDS_TLS_SERVERNAME || undefined;
	await ensureAppRole({adminUrl, password, tlsServername});
	console.log(`Role ${APP_ROLE} is present with the supplied password.`);
}

const isCli =
	process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	});
}
