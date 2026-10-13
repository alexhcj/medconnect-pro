#!/usr/bin/env node
/**
 * Render pre-deploy: create medconnect_app, migrate, and optionally seed.
 * Seed runs only when SEED_ON_DEPLOY=true. URLs and passwords are not logged.
 */

import {spawnSync} from 'node:child_process';
import {deriveRuntimeDatabaseUrl} from './derive-runtime-database-url.mjs';
import {ensureAppRole} from './ensure-app-role.mjs';

function safeMessage(error) {
	const message = error instanceof Error ? error.message : 'Database command failed';
	if (message.includes('://') || message.toLowerCase().includes('password')) {
		return 'Database command failed';
	}
	return message;
}

function runNpm(script) {
	const result = spawnSync('npm', ['run', script], {
		stdio: 'inherit',
		env: process.env,
	});
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

const adminUrl = process.env.DATABASE_ADMIN_URL;
const password = process.env.APP_ROLE_PASSWORD;
if (!adminUrl || !password?.trim()) {
	console.error('DATABASE_ADMIN_URL and APP_ROLE_PASSWORD are required');
	process.exit(1);
}

try {
	process.env.DATABASE_URL = deriveRuntimeDatabaseUrl(adminUrl, password);
	await ensureAppRole({
		adminUrl,
		password: password.trim(),
		tlsServername: process.env.RDS_TLS_SERVERNAME || undefined,
	});
} catch (error) {
	console.error(safeMessage(error));
	process.exit(1);
}

runNpm('migration:run');
if (process.env.SEED_ON_DEPLOY === 'true') {
	runNpm('seed:mock-identity');
}
