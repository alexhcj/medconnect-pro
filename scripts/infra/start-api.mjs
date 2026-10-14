#!/usr/bin/env node
/**
 * Render API start. Free web services cannot run a pre-deploy command, so this
 * process creates medconnect_app, migrates, optionally seeds, then boots Nest.
 * Uses the already-built dist. Does not log URLs or the app-role password.
 */

import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {deriveRuntimeDatabaseUrl} from './derive-runtime-database-url.mjs';
import {ensureAppRole} from './ensure-app-role.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const apiRoot = path.join(repoRoot, 'apps/api');
const dataSourcePath = path.join(apiRoot, 'dist/persistence/data-source.js');
const seedPath = path.join(apiRoot, 'dist/identity/seed-mock-identity.js');
const mainPath = path.join(apiRoot, 'dist/main.js');

function safeMessage(error) {
	const message = error instanceof Error ? error.message : 'Database command failed';
	if (message.includes('://') || message.toLowerCase().includes('password')) {
		return 'Database command failed';
	}
	return message;
}

function requireBuildOutput(filePath) {
	if (!existsSync(filePath)) {
		console.error('API build output is missing. The Render build command must run npm run build:api first.');
		process.exit(1);
	}
}

function runNode(args) {
	const result = spawnSync(process.execPath, args, {
		cwd: repoRoot,
		env: process.env,
		stdio: 'inherit',
	});
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

const adminUrl = process.env.DATABASE_ADMIN_URL;
const password = process.env.APP_ROLE_PASSWORD?.trim();

if (!process.env.DATABASE_URL) {
	if (!adminUrl || !password) {
		console.error('DATABASE_URL or both DATABASE_ADMIN_URL and APP_ROLE_PASSWORD are required');
		process.exit(1);
	}
	try {
		process.env.DATABASE_URL = deriveRuntimeDatabaseUrl(adminUrl, password);
	} catch (error) {
		console.error(safeMessage(error));
		process.exit(1);
	}
}

if (adminUrl && password) {
	requireBuildOutput(dataSourcePath);
	try {
		await ensureAppRole({
			adminUrl,
			password,
			tlsServername: process.env.RDS_TLS_SERVERNAME || undefined,
		});
	} catch (error) {
		console.error(safeMessage(error));
		process.exit(1);
	}

	const requireFromApi = createRequire(path.join(apiRoot, 'package.json'));
	const typeormCli = requireFromApi.resolve('typeorm/cli.js');
	runNode([typeormCli, 'migration:run', '-d', dataSourcePath]);

	if (process.env.SEED_ON_DEPLOY === 'true') {
		requireBuildOutput(seedPath);
		runNode([seedPath]);
	}
}

requireBuildOutput(mainPath);
await import(pathToFileURL(mainPath).href);
